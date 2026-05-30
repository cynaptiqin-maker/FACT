-- FCRA Module — Initial Schema
-- PostgreSQL 14+  |  Run once:  psql -U fact_user -d fact_db -f migrations/fcra_001_initial.sql
-- Tables are ordered by FK dependency so this script is safe to run from scratch.

-- ─── 1. FCRA Registrations (root entity — no deps) ───────────────────────────
CREATE TABLE IF NOT EXISTS fcra_registrations (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID        NOT NULL,
  fcra_number             VARCHAR(50) NOT NULL,
  organization_name       VARCHAR(200) NOT NULL,
  organization_type       VARCHAR(30) NOT NULL DEFAULT 'trust'
                            CHECK (organization_type IN ('trust','society','section8_company','other')),
  pan_number              VARCHAR(10),
  registration_date       DATE        NOT NULL,
  valid_upto              DATE,
  status                  VARCHAR(20) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','expired','suspended','cancelled')),
  mha_reference_number    VARCHAR(50),
  purpose_of_registration TEXT,
  address                 JSONB       NOT NULL DEFAULT '{}',
  email                   VARCHAR(100),
  phone                   VARCHAR(20),
  last_renewal_date       DATE,
  next_renewal_date       DATE,
  designated_bank_count   INTEGER     NOT NULL DEFAULT 0,
  documents               JSONB       NOT NULL DEFAULT '[]',
  notes                   TEXT,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, fcra_number)
);
CREATE INDEX IF NOT EXISTS idx_fcra_reg_tenant        ON fcra_registrations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_fcra_reg_tenant_status ON fcra_registrations (tenant_id, status);

-- ─── 2. FCRA Bank Accounts (depends on registrations) ────────────────────────
CREATE TABLE IF NOT EXISTS fcra_bank_accounts (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID          NOT NULL,
  account_code     VARCHAR(20)   NOT NULL,
  registration_id  UUID          NOT NULL REFERENCES fcra_registrations(id) ON DELETE CASCADE,
  account_type     VARCHAR(20)   NOT NULL DEFAULT 'designated'
                     CHECK (account_type IN ('designated','utilisation')),
  bank_name        VARCHAR(100)  NOT NULL,
  branch_name      VARCHAR(100),
  account_number   VARCHAR(30)   NOT NULL,
  ifsc_code        VARCHAR(11),
  account_holder   VARCHAR(200),
  opening_balance  DECIMAL(20,2) NOT NULL DEFAULT 0,
  current_balance  DECIMAL(20,2) NOT NULL DEFAULT 0,
  is_primary       BOOLEAN       NOT NULL DEFAULT false,
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  opened_date      DATE,
  notes            TEXT,
  created_by       UUID,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fcra_ba_tenant_reg  ON fcra_bank_accounts (tenant_id, registration_id);
CREATE INDEX IF NOT EXISTS idx_fcra_ba_type        ON fcra_bank_accounts (tenant_id, account_type);
CREATE INDEX IF NOT EXISTS idx_fcra_ba_active      ON fcra_bank_accounts (tenant_id, is_active);

-- ─── 3. FCRA Donors (depends on registrations) ───────────────────────────────
CREATE TABLE IF NOT EXISTS fcra_donors (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID          NOT NULL,
  donor_code             VARCHAR(20)   NOT NULL,
  donor_name             VARCHAR(200)  NOT NULL,
  donor_type             VARCHAR(30)   NOT NULL DEFAULT 'individual'
                           CHECK (donor_type IN ('individual','organization','foundation','government','ngo','other')),
  country                VARCHAR(100)  NOT NULL DEFAULT 'Unknown',
  country_code           VARCHAR(3),
  nationality            VARCHAR(100),
  passport_number        VARCHAR(30),
  organization_name      VARCHAR(200),
  address                JSONB         NOT NULL DEFAULT '{}',
  email                  VARCHAR(100),
  phone                  VARCHAR(20),
  registration_id        UUID          REFERENCES fcra_registrations(id) ON DELETE SET NULL,
  total_contributions    DECIMAL(20,2) NOT NULL DEFAULT 0,
  last_contribution_date DATE,
  is_blocked             BOOLEAN       NOT NULL DEFAULT false,
  block_reason           TEXT,
  notes                  TEXT,
  created_by             UUID,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fcra_donor_tenant      ON fcra_donors (tenant_id);
CREATE INDEX IF NOT EXISTS idx_fcra_donor_code        ON fcra_donors (tenant_id, donor_code);
CREATE INDEX IF NOT EXISTS idx_fcra_donor_name        ON fcra_donors (tenant_id, donor_name);
CREATE INDEX IF NOT EXISTS idx_fcra_donor_reg         ON fcra_donors (tenant_id, registration_id);
CREATE INDEX IF NOT EXISTS idx_fcra_donor_country     ON fcra_donors (tenant_id, country);

-- ─── 4. FCRA Projects (depends on registrations) — MUST come before receipts ──
CREATE TABLE IF NOT EXISTS fcra_projects (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID          NOT NULL,
  project_code        VARCHAR(20)   NOT NULL,
  registration_id     UUID          NOT NULL REFERENCES fcra_registrations(id) ON DELETE CASCADE,
  project_name        VARCHAR(200)  NOT NULL,
  description         TEXT,
  project_type        VARCHAR(30)   NOT NULL DEFAULT 'programme'
                        CHECK (project_type IN ('programme','research','infrastructure','capacity_building','other')),
  status              VARCHAR(20)   NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','completed','suspended','cancelled')),
  start_date          DATE,
  end_date            DATE,
  received_amount     DECIMAL(20,2) NOT NULL DEFAULT 0,
  utilized_amount     DECIMAL(20,2) NOT NULL DEFAULT 0,
  admin_utilized      DECIMAL(20,2) NOT NULL DEFAULT 0,
  admin_cap_percent   DECIMAL(5,2)  NOT NULL DEFAULT 20,
  implementing_agency VARCHAR(200),
  location            JSONB         NOT NULL DEFAULT '{}',
  objectives          TEXT,
  created_by          UUID,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fcra_proj_tenant_reg  ON fcra_projects (tenant_id, registration_id);
CREATE INDEX IF NOT EXISTS idx_fcra_proj_status      ON fcra_projects (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fcra_proj_code        ON fcra_projects (tenant_id, project_code);

-- ─── 5. FCRA Receipts (depends on registrations, donors, bank_accounts, projects)
CREATE TABLE IF NOT EXISTS fcra_receipts (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID          NOT NULL,
  receipt_number   VARCHAR(30)   NOT NULL,
  registration_id  UUID          NOT NULL REFERENCES fcra_registrations(id) ON DELETE CASCADE,
  donor_id         UUID          REFERENCES fcra_donors(id) ON DELETE SET NULL,
  bank_account_id  UUID          REFERENCES fcra_bank_accounts(id) ON DELETE SET NULL,
  project_id       UUID          REFERENCES fcra_projects(id) ON DELETE SET NULL,
  receipt_date     DATE          NOT NULL,
  amount           DECIMAL(20,2) NOT NULL,
  currency         VARCHAR(10)   NOT NULL DEFAULT 'USD',
  exchange_rate    DECIMAL(10,4) NOT NULL DEFAULT 1,
  amount_inr       DECIMAL(20,2) NOT NULL DEFAULT 0,
  purpose          TEXT,
  reference_number VARCHAR(100),
  transaction_type VARCHAR(20)   NOT NULL DEFAULT 'bank_transfer'
                     CHECK (transaction_type IN ('bank_transfer','cheque','dd','online','cash','other')),
  status           VARCHAR(30)   NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','verified','partially_utilized','fully_utilized','returned')),
  verified_by      UUID,
  verified_at      TIMESTAMPTZ,
  financial_year   VARCHAR(10),
  documents        JSONB         NOT NULL DEFAULT '[]',
  notes            TEXT,
  created_by       UUID,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fcra_rec_tenant      ON fcra_receipts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_fcra_rec_reg         ON fcra_receipts (tenant_id, registration_id);
CREATE INDEX IF NOT EXISTS idx_fcra_rec_donor       ON fcra_receipts (tenant_id, donor_id);
CREATE INDEX IF NOT EXISTS idx_fcra_rec_project     ON fcra_receipts (tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_fcra_rec_status      ON fcra_receipts (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fcra_rec_date        ON fcra_receipts (tenant_id, receipt_date DESC);
CREATE INDEX IF NOT EXISTS idx_fcra_rec_fy          ON fcra_receipts (tenant_id, financial_year);

-- ─── 6. FCRA Utilisations (depends on registrations, projects, bank_accounts) ─
CREATE TABLE IF NOT EXISTS fcra_utilisations (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID          NOT NULL,
  voucher_number   VARCHAR(30)   NOT NULL,
  registration_id  UUID          NOT NULL REFERENCES fcra_registrations(id) ON DELETE CASCADE,
  project_id       UUID          REFERENCES fcra_projects(id) ON DELETE SET NULL,
  bank_account_id  UUID          REFERENCES fcra_bank_accounts(id) ON DELETE SET NULL,
  utilization_date DATE          NOT NULL,
  amount           DECIMAL(20,2) NOT NULL,
  category         VARCHAR(30)   NOT NULL DEFAULT 'programme'
                     CHECK (category IN ('programme','administrative','capital','other')),
  payee_name            VARCHAR(200),
  payee_type            VARCHAR(30)   DEFAULT 'vendor',
  purpose               TEXT,
  transaction_reference VARCHAR(100),
  payment_mode          VARCHAR(30)   NOT NULL DEFAULT 'bank_transfer'
                          CHECK (payment_mode IN ('bank_transfer','cheque','dd','online','cash','upi','other')),
  status                VARCHAR(20)   NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','approved','rejected')),
  approved_by           UUID,
  approved_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  documents             JSONB         NOT NULL DEFAULT '[]',
  notes            TEXT,
  created_by       UUID,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fcra_util_tenant   ON fcra_utilisations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_fcra_util_reg      ON fcra_utilisations (tenant_id, registration_id);
CREATE INDEX IF NOT EXISTS idx_fcra_util_project  ON fcra_utilisations (tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_fcra_util_status   ON fcra_utilisations (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fcra_util_category ON fcra_utilisations (tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_fcra_util_date     ON fcra_utilisations (tenant_id, utilization_date DESC);

-- ─── 7. FCRA Assets (depends on registrations, projects) ─────────────────────
CREATE TABLE IF NOT EXISTS fcra_assets (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID          NOT NULL,
  asset_code          VARCHAR(20)   NOT NULL,
  registration_id     UUID          NOT NULL REFERENCES fcra_registrations(id) ON DELETE CASCADE,
  project_id          UUID          REFERENCES fcra_projects(id) ON DELETE SET NULL,
  asset_name          VARCHAR(200)  NOT NULL,
  asset_category      VARCHAR(50),
  description         TEXT,
  funded_by           VARCHAR(20)   NOT NULL DEFAULT 'fcra'
                        CHECK (funded_by IN ('fcra','domestic','mixed')),
  fcra_funded_percent DECIMAL(5,2)  NOT NULL DEFAULT 100,
  purchase_date       DATE          NOT NULL,
  purchase_amount     DECIMAL(20,2) NOT NULL,
  current_value       DECIMAL(20,2) NOT NULL DEFAULT 0,
  depreciation_rate   DECIMAL(5,2)  NOT NULL DEFAULT 0,
  location            VARCHAR(200),
  vendor_name         VARCHAR(200),
  invoice_number      VARCHAR(100),
  status              VARCHAR(20)   NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','disposed','written_off','transferred')),
  disposed_at         DATE,
  documents           JSONB         NOT NULL DEFAULT '[]',
  notes               TEXT,
  created_by          UUID,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fcra_asset_tenant_reg ON fcra_assets (tenant_id, registration_id);
CREATE INDEX IF NOT EXISTS idx_fcra_asset_project    ON fcra_assets (tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_fcra_asset_status     ON fcra_assets (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fcra_asset_funded_by  ON fcra_assets (tenant_id, funded_by);

-- ─── 8. FCRA Asset Disposals (depends on assets, registrations) ──────────────
CREATE TABLE IF NOT EXISTS fcra_asset_disposals (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID          NOT NULL,
  asset_id        UUID          NOT NULL REFERENCES fcra_assets(id) ON DELETE CASCADE,
  registration_id UUID          NOT NULL REFERENCES fcra_registrations(id) ON DELETE CASCADE,
  disposal_date   DATE          NOT NULL,
  disposal_method VARCHAR(30)   NOT NULL DEFAULT 'sale'
                    CHECK (disposal_method IN ('sale','auction','donation','write_off','transfer','other')),
  book_value      DECIMAL(20,2) NOT NULL DEFAULT 0,
  sale_proceeds   DECIMAL(20,2) NOT NULL DEFAULT 0,
  gain_loss       DECIMAL(20,2) NOT NULL DEFAULT 0,
  buyer_name      VARCHAR(200),
  buyer_address   TEXT,
  mha_approval    BOOLEAN       NOT NULL DEFAULT false,
  mha_reference   VARCHAR(50),
  proceeds_used_for TEXT,
  documents       JSONB         NOT NULL DEFAULT '[]',
  notes           TEXT,
  created_by      UUID,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fcra_disposal_tenant_reg ON fcra_asset_disposals (tenant_id, registration_id);
CREATE INDEX IF NOT EXISTS idx_fcra_disposal_asset      ON fcra_asset_disposals (tenant_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_fcra_disposal_date       ON fcra_asset_disposals (tenant_id, disposal_date DESC);

-- ─── 9. FCRA Asset Income (depends on assets, registrations) ─────────────────
CREATE TABLE IF NOT EXISTS fcra_asset_incomes (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID          NOT NULL,
  income_code     VARCHAR(20)   NOT NULL,
  asset_id        UUID          NOT NULL REFERENCES fcra_assets(id) ON DELETE CASCADE,
  registration_id UUID          NOT NULL REFERENCES fcra_registrations(id) ON DELETE CASCADE,
  income_type     VARCHAR(30)   NOT NULL DEFAULT 'rent'
                    CHECK (income_type IN ('rent','interest','dividend','sale_proceeds','other')),
  income_date     DATE          NOT NULL,
  amount          DECIMAL(20,2) NOT NULL,
  payer_name      VARCHAR(200),
  reference       VARCHAR(100),
  financial_year  VARCHAR(10),
  notes           TEXT,
  created_by      UUID,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fcra_ai_tenant_reg ON fcra_asset_incomes (tenant_id, registration_id);
CREATE INDEX IF NOT EXISTS idx_fcra_ai_asset      ON fcra_asset_incomes (tenant_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_fcra_ai_fy         ON fcra_asset_incomes (tenant_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_fcra_ai_date       ON fcra_asset_incomes (tenant_id, income_date DESC);

-- ─── 10. FCRA Compliances (depends on registrations) ─────────────────────────
CREATE TABLE IF NOT EXISTS fcra_compliances (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL,
  registration_id  UUID        NOT NULL REFERENCES fcra_registrations(id) ON DELETE CASCADE,
  compliance_type  VARCHAR(30) NOT NULL DEFAULT 'fc4_filing'
                     CHECK (compliance_type IN ('fc4_filing','renewal','intimation','audit','bank_statement','mha_query','other')),
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  due_date         DATE        NOT NULL,
  completed_date   DATE,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','in_progress','completed','overdue','waived')),
  reminder_days    INTEGER     NOT NULL DEFAULT 30,
  financial_year   VARCHAR(10),
  notes            TEXT,
  created_by       UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fcra_comp_tenant_reg  ON fcra_compliances (tenant_id, registration_id);
CREATE INDEX IF NOT EXISTS idx_fcra_comp_status      ON fcra_compliances (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fcra_comp_due         ON fcra_compliances (tenant_id, due_date ASC);
CREATE INDEX IF NOT EXISTS idx_fcra_comp_type        ON fcra_compliances (tenant_id, compliance_type);
CREATE INDEX IF NOT EXISTS idx_fcra_comp_fy          ON fcra_compliances (tenant_id, financial_year);

-- ─── 11. FCRA FC-4 Filings (depends on registrations) ────────────────────────
CREATE TABLE IF NOT EXISTS fcra_fc4_filings (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID          NOT NULL,
  filing_code            VARCHAR(20)   NOT NULL,
  registration_id        UUID          NOT NULL REFERENCES fcra_registrations(id) ON DELETE CASCADE,
  financial_year         VARCHAR(10)   NOT NULL,
  filing_status          VARCHAR(20)   NOT NULL DEFAULT 'draft'
                           CHECK (filing_status IN ('draft','prepared','submitted','accepted','rejected')),
  opening_balance        DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_receipts_fc      DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_utilized         DECIMAL(20,2) NOT NULL DEFAULT 0,
  admin_expenses         DECIMAL(20,2) NOT NULL DEFAULT 0,
  programme_expenses     DECIMAL(20,2) NOT NULL DEFAULT 0,
  closing_balance        DECIMAL(20,2) NOT NULL DEFAULT 0,
  admin_cap_percent      DECIMAL(5,2)  NOT NULL DEFAULT 0,
  due_date               DATE,
  submitted_date         DATE,
  acknowledgement_number VARCHAR(50),
  mha_remarks            TEXT,
  notes                  TEXT,
  created_by             UUID,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, registration_id, financial_year)
);
CREATE INDEX IF NOT EXISTS idx_fcra_fc4_tenant_reg ON fcra_fc4_filings (tenant_id, registration_id);
CREATE INDEX IF NOT EXISTS idx_fcra_fc4_status     ON fcra_fc4_filings (tenant_id, filing_status);
CREATE INDEX IF NOT EXISTS idx_fcra_fc4_fy         ON fcra_fc4_filings (tenant_id, financial_year);

-- ─── 12. FCRA Audit Logs (append-only, no FK cascade needed) ─────────────────
CREATE TABLE IF NOT EXISTS fcra_audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL,
  entity_type   VARCHAR(30) NOT NULL
                  CHECK (entity_type IN ('registration','bank_account','donor','receipt','project',
                                         'utilisation','asset','asset_disposal','asset_income',
                                         'compliance','fc4_filing')),
  entity_id     UUID        NOT NULL,
  action        VARCHAR(20) NOT NULL
                  CHECK (action IN ('create','update','delete','approve','reject','verify','file','view')),
  old_values    JSONB,
  new_values    JSONB,
  performed_by  UUID,
  ip_address    VARCHAR(45),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at — audit rows are immutable
);
CREATE INDEX IF NOT EXISTS idx_fcra_audit_tenant    ON fcra_audit_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_fcra_audit_entity    ON fcra_audit_logs (tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_fcra_audit_performer ON fcra_audit_logs (tenant_id, performed_by);
CREATE INDEX IF NOT EXISTS idx_fcra_audit_created   ON fcra_audit_logs (tenant_id, created_at DESC);

-- ─── Seed: Default Compliance Calendar Items ──────────────────────────────────
-- This function creates standard annual compliance items for a new registration.
-- Called from the backend (POST /api/fcra/registration) after inserting the row.
-- You can also call it manually:
--   SELECT fcra_seed_compliance('{tenant_uuid}', '{registration_uuid}', '2024-25');

CREATE OR REPLACE FUNCTION fcra_seed_compliance(
  p_tenant_id      UUID,
  p_registration_id UUID,
  p_financial_year  TEXT  -- e.g. '2024-25'
) RETURNS VOID AS $$
DECLARE
  fy_end_year INT := CAST(SPLIT_PART(p_financial_year, '-', 2) AS INT) + 2000;
BEGIN
  INSERT INTO fcra_compliances
    (id, tenant_id, registration_id, compliance_type, title, due_date, reminder_days, financial_year, status)
  VALUES
    (gen_random_uuid(), p_tenant_id, p_registration_id, 'fc4_filing',
     'FC-4 Annual Return — FY ' || p_financial_year,
     MAKE_DATE(fy_end_year, 12, 31), 60, p_financial_year, 'pending'),

    (gen_random_uuid(), p_tenant_id, p_registration_id, 'bank_statement',
     'Designated Bank Account Statement — April ' || CAST(fy_end_year AS TEXT),
     MAKE_DATE(fy_end_year, 4, 30), 30, p_financial_year, 'pending'),

    (gen_random_uuid(), p_tenant_id, p_registration_id, 'audit',
     'Annual FCRA Audit — FY ' || p_financial_year,
     MAKE_DATE(fy_end_year, 9, 30), 60, p_financial_year, 'pending'),

    (gen_random_uuid(), p_tenant_id, p_registration_id, 'intimation',
     'MHA Intimation of Foreign Receipts Q1 — FY ' || p_financial_year,
     MAKE_DATE(fy_end_year - 1, 7, 15), 15, p_financial_year, 'pending'),

    (gen_random_uuid(), p_tenant_id, p_registration_id, 'intimation',
     'MHA Intimation of Foreign Receipts Q2 — FY ' || p_financial_year,
     MAKE_DATE(fy_end_year - 1, 10, 15), 15, p_financial_year, 'pending'),

    (gen_random_uuid(), p_tenant_id, p_registration_id, 'intimation',
     'MHA Intimation of Foreign Receipts Q3 — FY ' || p_financial_year,
     MAKE_DATE(fy_end_year, 1, 15), 15, p_financial_year, 'pending'),

    (gen_random_uuid(), p_tenant_id, p_registration_id, 'intimation',
     'MHA Intimation of Foreign Receipts Q4 — FY ' || p_financial_year,
     MAKE_DATE(fy_end_year, 4, 15), 15, p_financial_year, 'pending')

  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;
