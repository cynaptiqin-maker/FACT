-- Migration: 004_exceptions_period_close
-- Creates financial_exceptions and period_close_log tables.
-- Safe to re-run: uses IF NOT EXISTS throughout.

-- ── financial_exceptions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS financial_exceptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,

  -- Classification
  exception_type  VARCHAR(50)  NOT NULL,
  severity        VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',   -- LOW | MEDIUM | HIGH | CRITICAL
  status          VARCHAR(20)  NOT NULL DEFAULT 'OPEN',     -- OPEN | ACKNOWLEDGED | RESOLVED | DISMISSED

  -- What it refers to
  entity_type     VARCHAR(60),
  entity_id       UUID,
  source_module   VARCHAR(60),

  -- Human-readable content
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  metadata        JSONB,

  -- Lifecycle
  raised_by       VARCHAR(60)  DEFAULT 'SYSTEM',
  assigned_to     UUID,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_by     UUID,
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT,
  dismissed_by    UUID,
  dismissed_at    TIMESTAMPTZ,
  dismiss_reason  TEXT,

  -- Deduplication: same exception type on same entity = upsert
  dedup_key       VARCHAR(200) GENERATED ALWAYS AS (
                    tenant_id::text || ':' || exception_type || ':' || COALESCE(entity_id::text, 'global')
                  ) STORED,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add dedup_key to pre-existing tables that were created without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_exceptions' AND column_name = 'dedup_key'
  ) THEN
    ALTER TABLE financial_exceptions
      ADD COLUMN dedup_key VARCHAR(200) GENERATED ALWAYS AS (
        tenant_id::text || ':' || exception_type || ':' || COALESCE(entity_id::text, 'global')
      ) STORED;
  END IF;
END $$;

COMMENT ON TABLE financial_exceptions IS
  'Operational exception inbox: failed postings, FCRA cap warnings, stale claims, etc.';

COMMENT ON COLUMN financial_exceptions.dedup_key IS
  'Prevents duplicate OPEN exceptions for same type+entity. Upsert on conflict.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fin_exceptions_tenant_status
  ON financial_exceptions (tenant_id, status, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fin_exceptions_entity
  ON financial_exceptions (entity_type, entity_id)
  WHERE entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fin_exceptions_type
  ON financial_exceptions (tenant_id, exception_type, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fin_exceptions_dedup_open
  ON financial_exceptions (dedup_key)
  WHERE status = 'OPEN';

-- ── period_close_log ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS period_close_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  fiscal_year_id  UUID NOT NULL,
  period          VARCHAR(7) NOT NULL,               -- e.g. "2026-05"

  -- Checklist snapshot at time of close
  checklist       JSONB,                             -- array of { id, status, value }

  -- Action performed
  action          VARCHAR(20) NOT NULL DEFAULT 'LOCK', -- LOCK | UNLOCK | GENERATE_REPORTS
  performed_by    UUID,
  performed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note            TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_period_close_log_tenant_period
  ON period_close_log (tenant_id, fiscal_year_id, period);
