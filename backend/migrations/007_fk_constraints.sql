-- Migration: 007_fk_constraints
-- Adds missing FK constraints on journal_entry_id columns so that GL postings
-- are database-enforced and cannot silently become orphaned.
-- Also adds gl_account_id on bank_accounts to link each bank account to its GL
-- ledger account — used by doubleEntry.js to keep bank_accounts.current_balance
-- in sync every time a journal line is posted.
-- Safe to re-run: every ALTER is guarded by NOT EXISTS on the constraint name.

-- ── vendor_invoices.journal_entry_id ─────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_vi_journal_entry' AND table_name = 'vendor_invoices'
  ) THEN
    ALTER TABLE vendor_invoices
      ADD CONSTRAINT fk_vi_journal_entry
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── vendor_payments.journal_entry_id ─────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_vp_journal_entry' AND table_name = 'vendor_payments'
  ) THEN
    ALTER TABLE vendor_payments
      ADD CONSTRAINT fk_vp_journal_entry
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── payments.journal_entry_id ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_pay_journal_entry' AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT fk_pay_journal_entry
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── payroll_runs.journal_entry_id ─────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_pr_journal_entry' AND table_name = 'payroll_runs'
  ) THEN
    ALTER TABLE payroll_runs
      ADD CONSTRAINT fk_pr_journal_entry
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── bank_transactions.journal_entry_id ───────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_bt_journal_entry' AND table_name = 'bank_transactions'
  ) THEN
    ALTER TABLE bank_transactions
      ADD CONSTRAINT fk_bt_journal_entry
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── patient_invoices.journal_entry_id ────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_pi_journal_entry' AND table_name = 'patient_invoices'
  ) THEN
    ALTER TABLE patient_invoices
      ADD CONSTRAINT fk_pi_journal_entry
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── claims.journal_entry_id ───────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_cl_journal_entry' AND table_name = 'claims'
  ) THEN
    ALTER TABLE claims
      ADD CONSTRAINT fk_cl_journal_entry
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── patient_invoices.claim_id ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_pi_claim' AND table_name = 'patient_invoices'
  ) THEN
    ALTER TABLE patient_invoices
      ADD CONSTRAINT fk_pi_claim
      FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ── bank_accounts.gl_account_id ───────────────────────────────────────────────
-- Links each bank account to its GL ledger account (e.g. "Bank - SBI" in chart
-- of accounts). doubleEntry.js uses this to keep bank_accounts.current_balance
-- in sync whenever a journal line is posted against the linked GL account.
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS
  gl_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bank_accounts_gl_account
  ON bank_accounts (gl_account_id);
