-- ============================================================
-- Migration 006: Budgeting Module
-- Provides annual/departmental budget management and variance tracking.
-- ============================================================

CREATE TABLE IF NOT EXISTS budget_headers (
  id             UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id      UUID         NOT NULL,
  fiscal_year_id UUID         NOT NULL REFERENCES fiscal_years(id),
  name           VARCHAR(200) NOT NULL,
  description    TEXT,
  budget_type    VARCHAR(30)  NOT NULL DEFAULT 'ANNUAL',
  status         VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  version        INTEGER      DEFAULT 1,
  is_revised     BOOLEAN      DEFAULT false,
  parent_id      UUID         REFERENCES budget_headers(id),
  approved_by    UUID,
  approved_at    TIMESTAMPTZ,
  submitted_by   UUID,
  submitted_at   TIMESTAMPTZ,
  total_amount   NUMERIC      DEFAULT 0,
  notes          TEXT,
  created_by     UUID,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bh_tenant_fy ON budget_headers(tenant_id, fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_bh_status    ON budget_headers(tenant_id, status);

-- Budget lines: one row per (budget, account, department, period)
-- period_month = NULL means annual (spread equally across months by reporting layer)
CREATE TABLE IF NOT EXISTS budget_lines (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id      UUID        NOT NULL REFERENCES budget_headers(id) ON DELETE CASCADE,
  tenant_id      UUID        NOT NULL,
  account_id     UUID        REFERENCES accounts(id),
  department_id  UUID,
  cost_center_id UUID,
  branch_id      UUID,
  category       VARCHAR(100),
  description    TEXT,
  period_month   SMALLINT,
  amount         NUMERIC     NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bl_budget     ON budget_lines(budget_id);
CREATE INDEX IF NOT EXISTS idx_bl_account    ON budget_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_bl_department ON budget_lines(department_id);
