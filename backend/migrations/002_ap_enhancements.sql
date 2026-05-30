-- ─── AP Enhancements Migration ────────────────────────────────────────────────
-- Adds the columns required for full GL integration to vendor_invoices,
-- and creates vendor_payments to track individual payment transactions.

-- ─── 1. vendor_invoices: add GL / workflow columns ────────────────────────────
ALTER TABLE vendor_invoices
  ADD COLUMN IF NOT EXISTS fiscal_year_id       UUID,
  ADD COLUMN IF NOT EXISTS branch_id            UUID,
  ADD COLUMN IF NOT EXISTS narration            TEXT,
  ADD COLUMN IF NOT EXISTS expense_account_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS created_by           UUID,
  ADD COLUMN IF NOT EXISTS approved_by          UUID,
  ADD COLUMN IF NOT EXISTS approved_at          TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_accounting_posted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS posted_at            TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_reversed          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reversal_entry_id    UUID;

-- ─── 2. vendor_payments: individual payment records (mirrors patient payments) ─
CREATE TABLE IF NOT EXISTS vendor_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL,
  vendor_invoice_id UUID NOT NULL REFERENCES vendor_invoices(id),
  vendor_id         UUID REFERENCES vendors(id),
  amount            NUMERIC(20, 2) NOT NULL,
  payment_mode      VARCHAR(20)    NOT NULL DEFAULT 'BANK',
  reference_number  VARCHAR(100),
  payment_date      DATE           NOT NULL DEFAULT CURRENT_DATE,
  bank_account_code VARCHAR(20),
  journal_entry_id  UUID,
  fiscal_year_id    UUID,
  branch_id         UUID,
  narration         TEXT,
  created_by        UUID,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 3. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_tenant_status
  ON vendor_invoices (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_vendor_invoices_vendor_id
  ON vendor_invoices (vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_invoices_due_date
  ON vendor_invoices (tenant_id, due_date) WHERE status NOT IN ('PAID', 'CANCELLED');

CREATE INDEX IF NOT EXISTS idx_vendor_invoices_fiscal_year
  ON vendor_invoices (tenant_id, fiscal_year_id);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_invoice_id
  ON vendor_payments (vendor_invoice_id);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_tenant_id
  ON vendor_payments (tenant_id);
