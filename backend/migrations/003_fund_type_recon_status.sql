-- Migration: 003_fund_type_recon_status
-- Adds fund_type, recon_status, posting_event, posting_explanation columns
-- to accounts and journal_entries tables.
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS.
-- On a fresh DB these tables may not exist yet (created by 005); the DO blocks
-- are no-ops in that case — the columns will be included in the CREATE TABLE.

-- ── accounts ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts' AND table_schema = 'public') THEN
    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS fund_type VARCHAR(30) NOT NULL DEFAULT 'LOCAL';
    COMMENT ON COLUMN accounts.fund_type IS
      'Fund classification: LOCAL | FCRA | RESTRICTED_GRANT | CORPUS | PROJECT';
  END IF;
END $$;

-- ── journal_entries ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries' AND table_schema = 'public') THEN
    ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS fund_type VARCHAR(30) NOT NULL DEFAULT 'LOCAL';
    ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS recon_status VARCHAR(30) NOT NULL DEFAULT 'UNMATCHED';
    ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS posting_event VARCHAR(60);
    ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS posting_explanation JSONB;

    COMMENT ON COLUMN journal_entries.fund_type IS
      'Fund segregation: LOCAL | FCRA | RESTRICTED_GRANT | CORPUS | PROJECT';
    COMMENT ON COLUMN journal_entries.recon_status IS
      'Reconciliation lifecycle: UNMATCHED | MATCH_SUGGESTED | MATCHED | DISPUTED | ADJUSTED | RECONCILED';
    COMMENT ON COLUMN journal_entries.posting_event IS
      'Semantic event that triggered this journal (e.g. INVOICE_POSTED, FCRA_RECEIPT_VERIFIED)';
    COMMENT ON COLUMN journal_entries.posting_explanation IS
      'AI/rule-generated explanation of the posting in structured JSON form';
  END IF;
END $$;

-- ── Indexes (only when table exists) ─────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_journal_entries_fund_type
      ON journal_entries (tenant_id, fund_type);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_recon_status
      ON journal_entries (tenant_id, recon_status);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_posting_event
      ON journal_entries (posting_event);
  END IF;
END $$;

-- ── Backfill: auto-classify existing FCRA accounts ────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts' AND table_schema = 'public') THEN
    UPDATE accounts
      SET fund_type = 'FCRA', updated_at = NOW()
      WHERE code LIKE 'FCRA-%'
        AND (fund_type IS NULL OR fund_type = 'LOCAL');
  END IF;
END $$;
