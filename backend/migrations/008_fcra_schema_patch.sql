-- 008: FCRA schema patch — restore columns that sync({ alter }) may have dropped
-- All statements are idempotent (ADD COLUMN IF NOT EXISTS).

ALTER TABLE fcra_bank_accounts
  ADD COLUMN IF NOT EXISTS is_active      BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS account_holder VARCHAR(200),
  ADD COLUMN IF NOT EXISTS opened_date    DATE;

ALTER TABLE fcra_receipts
  ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) NOT NULL DEFAULT 'bank_transfer';

ALTER TABLE fcra_donors
  ADD COLUMN IF NOT EXISTS nationality        VARCHAR(100),
  ADD COLUMN IF NOT EXISTS organization_name  VARCHAR(200),
  ADD COLUMN IF NOT EXISTS is_blocked         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_reason       TEXT;

ALTER TABLE fcra_projects
  ADD COLUMN IF NOT EXISTS implementing_agency VARCHAR(200);

-- Restore column defaults that sync({ alter: true }) may have corrupted
ALTER TABLE fcra_projects
  ALTER COLUMN project_type SET DEFAULT 'programme';
