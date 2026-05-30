-- ============================================================
-- Migration 005: Enterprise Tables
-- Formalises tables created by Sequelize/service startup code
-- that were not covered by migrations 001–004 or fcra_001.
-- All statements are idempotent.
-- ============================================================

-- ─── Enum Types ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE enum_accounts_type AS ENUM (
    'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_accounts_normal_balance AS ENUM ('DEBIT', 'CREDIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_journal_entries_voucher_type AS ENUM (
    'JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA',
    'DEBIT_NOTE', 'CREDIT_NOTE', 'PURCHASE', 'SALES', 'OPENING'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_journal_entries_status AS ENUM (
    'DRAFT', 'PENDING_APPROVAL', 'POSTED', 'REVERSED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_assets_depreciation_method AS ENUM (
    'SLM', 'WDV', 'UNITS_OF_PRODUCTION', 'NONE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_assets_status AS ENUM (
    'ACTIVE', 'UNDER_MAINTENANCE', 'DISPOSED', 'WRITTEN_OFF', 'TRANSFERRED', 'IDLE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_fiscal_years_status AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_patient_invoices_billing_type AS ENUM (
    'OP', 'IP', 'ICU', 'OT', 'DAYCARE', 'PACKAGE', 'PHARMACY', 'LAB', 'RADIOLOGY'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enum_patient_invoices_status AS ENUM (
    'DRAFT', 'PROVISIONAL', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─── 1. Organisational Master Data ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS branches (
  id           UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    UUID         NOT NULL,
  code         VARCHAR(20)  NOT NULL,
  name         VARCHAR(200) NOT NULL,
  address      TEXT,
  gstin        VARCHAR(15),
  is_active    BOOLEAN      DEFAULT true,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS departments (
  id           UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    UUID         NOT NULL,
  code         VARCHAR(20)  NOT NULL,
  name         VARCHAR(200) NOT NULL,
  head_user_id UUID,
  is_active    BOOLEAN      DEFAULT true,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS cost_centers (
  id         UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id  UUID         NOT NULL,
  code       VARCHAR(20)  NOT NULL,
  name       VARCHAR(200) NOT NULL,
  parent_id  UUID         REFERENCES cost_centers(id),
  is_active  BOOLEAN      DEFAULT true,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  updated_at TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS fiscal_years (
  id                      UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id               UUID        NOT NULL,
  name                    VARCHAR(50) NOT NULL,
  start_date              DATE        NOT NULL,
  end_date                DATE        NOT NULL,
  status                  enum_fiscal_years_status DEFAULT 'ACTIVE',
  is_current              BOOLEAN     DEFAULT false,
  opening_entries_posted  BOOLEAN     DEFAULT false,
  closing_entries_posted  BOOLEAN     DEFAULT false,
  closed_at               TIMESTAMPTZ,
  closed_by               UUID,
  created_by              UUID,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);


-- ─── 2. RBAC ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS permissions (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code        VARCHAR(100) NOT NULL UNIQUE,
  name        VARCHAR(200) NOT NULL,
  module      VARCHAR(50),
  description TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);


-- ─── 3. Auth Sessions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   UUID         NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  expires_at  TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user  ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash  ON refresh_tokens(token_hash);


-- ─── 4. Chart of Accounts ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounts (
  id                    UUID                  NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             UUID                  NOT NULL,
  code                  VARCHAR(20)           NOT NULL,
  name                  VARCHAR(200)          NOT NULL,
  description           TEXT,
  type                  enum_accounts_type    NOT NULL,
  sub_type              VARCHAR(50),
  parent_id             UUID                  REFERENCES accounts(id),
  level                 INTEGER               DEFAULT 1,
  is_group              BOOLEAN               DEFAULT false,
  path                  VARCHAR(500),
  normal_balance        VARCHAR(10),
  currency              VARCHAR(3)            DEFAULT 'INR',
  opening_balance       NUMERIC               DEFAULT 0,
  current_balance       NUMERIC               DEFAULT 0,
  cost_center_id        UUID,
  department_id         UUID,
  branch_id             UUID,
  is_active             BOOLEAN               DEFAULT true,
  allow_direct_posting  BOOLEAN               DEFAULT true,
  is_bank_account       BOOLEAN               DEFAULT false,
  is_cash_account       BOOLEAN               DEFAULT false,
  is_control_account    BOOLEAN               DEFAULT false,
  gst_applicable        BOOLEAN               DEFAULT false,
  tds_applicable        BOOLEAN               DEFAULT false,
  default_tax_code      VARCHAR(20),
  bank_name             VARCHAR(100),
  bank_account_number   VARCHAR(50),
  bank_ifsc             VARCHAR(20),
  bank_branch           VARCHAR(100),
  tags                  JSONB                 DEFAULT '[]',
  metadata              JSONB                 DEFAULT '{}',
  created_by            UUID,
  updated_by            UUID,
  created_at            TIMESTAMPTZ           DEFAULT NOW(),
  updated_at            TIMESTAMPTZ           DEFAULT NOW(),
  fund_type             VARCHAR(30)           DEFAULT 'LOCAL',
  UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant     ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type       ON accounts(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_parent     ON accounts(parent_id);


-- ─── 5. General Ledger ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journal_entries (
  id                   UUID                              NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id            UUID                              NOT NULL,
  entry_number         VARCHAR(30),
  voucher_type         enum_journal_entries_voucher_type NOT NULL,
  date                 DATE                              NOT NULL,
  fiscal_year_id       UUID                              REFERENCES fiscal_years(id),
  period               VARCHAR(7),
  narration            TEXT,
  reference            VARCHAR(100),
  cheque_number        VARCHAR(50),
  cheque_date          DATE,
  status               enum_journal_entries_status       DEFAULT 'DRAFT',
  workflow_instance_id UUID,
  approved_by          UUID,
  approved_at          TIMESTAMPTZ,
  rejection_reason     TEXT,
  posted_by            UUID,
  posted_at            TIMESTAMPTZ,
  total_debit          NUMERIC                           DEFAULT 0,
  total_credit         NUMERIC                           DEFAULT 0,
  is_reversal          BOOLEAN                           DEFAULT false,
  reversal_of          UUID                              REFERENCES journal_entries(id),
  is_reversed          BOOLEAN                           DEFAULT false,
  reversed_by_id       UUID                              REFERENCES journal_entries(id),
  cost_center_id       UUID,
  department_id        UUID,
  branch_id            UUID,
  source_module        VARCHAR(50),
  source_id            UUID,
  source_reference     VARCHAR(100),
  is_recurring         BOOLEAN                           DEFAULT false,
  recurrence_config    JSONB,
  parent_recurring_id  UUID,
  tags                 JSONB                             DEFAULT '[]',
  attachments          JSONB                             DEFAULT '[]',
  metadata             JSONB                             DEFAULT '{}',
  created_by           UUID,
  created_at           TIMESTAMPTZ                       DEFAULT NOW(),
  updated_at           TIMESTAMPTZ                       DEFAULT NOW(),
  fund_type            VARCHAR(30)                       DEFAULT 'LOCAL',
  recon_status         VARCHAR(30)                       DEFAULT 'UNMATCHED',
  posting_event        VARCHAR(60),
  posting_explanation  JSONB
);
CREATE INDEX IF NOT EXISTS idx_je_tenant_date    ON journal_entries(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_je_status         ON journal_entries(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_je_fiscal_year    ON journal_entries(fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_je_source         ON journal_entries(source_module, source_id);

CREATE TABLE IF NOT EXISTS journal_lines (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id    UUID        NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  line_number         INTEGER     NOT NULL,
  account_id          UUID        NOT NULL REFERENCES accounts(id),
  tenant_id           UUID        NOT NULL,
  debit_amount        NUMERIC     DEFAULT 0,
  credit_amount       NUMERIC     DEFAULT 0,
  running_balance     NUMERIC,
  cost_center_id      UUID,
  department_id       UUID,
  branch_id           UUID,
  project_id          UUID,
  narration           TEXT,
  tax_code            VARCHAR(20),
  tax_amount          NUMERIC     DEFAULT 0,
  tax_type            VARCHAR(10),
  party_type          VARCHAR(50),
  party_id            UUID,
  is_reconciled       BOOLEAN     DEFAULT false,
  reconciled_at       TIMESTAMPTZ,
  reconciliation_ref  VARCHAR(100),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jl_entry    ON journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_jl_account  ON journal_lines(account_id);


-- ─── 6. Fixed Assets ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assets (
  id                       UUID                            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id                UUID                            NOT NULL,
  asset_code               VARCHAR(30),
  asset_name               VARCHAR(200)                    NOT NULL,
  description              TEXT,
  category_id              UUID                            REFERENCES asset_categories(id),
  asset_tag                VARCHAR(100),
  serial_number            VARCHAR(100),
  model_number             VARCHAR(100),
  manufacturer             VARCHAR(100),
  vendor_id                UUID,
  purchase_date            DATE                            NOT NULL,
  capitalization_date      DATE,
  purchase_invoice         VARCHAR(100),
  purchase_cost            NUMERIC                         NOT NULL,
  installation_cost        NUMERIC                         DEFAULT 0,
  total_cost               NUMERIC,
  salvage_value            NUMERIC                         DEFAULT 0,
  useful_life_years        NUMERIC,
  depreciation_method      enum_assets_depreciation_method DEFAULT 'SLM',
  depreciation_rate        NUMERIC,
  accumulated_depreciation NUMERIC                         DEFAULT 0,
  current_book_value       NUMERIC,
  last_depreciation_date   DATE,
  location                 VARCHAR(200),
  department_id            UUID,
  branch_id                UUID,
  cost_center_id           UUID,
  custodian_user_id        UUID,
  asset_account_id         UUID,
  depreciation_account_id  UUID,
  accumulated_dep_account_id UUID,
  status                   enum_assets_status              DEFAULT 'ACTIVE',
  insurance_policy         VARCHAR(100),
  insurance_expiry         DATE,
  insurance_value          NUMERIC,
  warranty_expiry          DATE,
  amc_expiry               DATE,
  disposal_date            DATE,
  disposal_amount          NUMERIC,
  disposal_reason          TEXT,
  disposal_journal_id      UUID,
  tags                     JSONB                           DEFAULT '[]',
  metadata                 JSONB                           DEFAULT '{}',
  created_by               UUID,
  created_at               TIMESTAMPTZ                     DEFAULT NOW(),
  updated_at               TIMESTAMPTZ                     DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assets_tenant     ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_category   ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status     ON assets(tenant_id, status);

CREATE TABLE IF NOT EXISTS depreciation_runs (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         UUID        NOT NULL,
  fiscal_year       INTEGER     NOT NULL,
  period_month      INTEGER     NOT NULL,
  run_date          DATE,
  status            VARCHAR(20) DEFAULT 'PROCESSING',
  total_assets      INTEGER     DEFAULT 0,
  total_depreciation NUMERIC    DEFAULT 0,
  error_count       INTEGER     DEFAULT 0,
  initiated_by      UUID,
  fiscal_year_id    UUID        REFERENCES fiscal_years(id),
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS depreciation_schedules (
  id                       UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id                 UUID        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  tenant_id                UUID        NOT NULL,
  run_id                   UUID        REFERENCES depreciation_runs(id),
  period_year              INTEGER     NOT NULL,
  period_month             INTEGER     NOT NULL,
  depreciation_amount      NUMERIC     NOT NULL,
  accumulated_depreciation NUMERIC,
  book_value_before        NUMERIC,
  book_value_after         NUMERIC,
  method                   VARCHAR(20),
  journal_entry_id         UUID        REFERENCES journal_entries(id),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dep_sched_asset ON depreciation_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_dep_sched_run   ON depreciation_schedules(run_id);


-- ─── 7. Insurance & TPA ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insurers (
  id                UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         UUID         NOT NULL,
  name              VARCHAR(200) NOT NULL,
  code              VARCHAR(20),
  type              VARCHAR(30),
  contact_person    VARCHAR(100),
  phone             VARCHAR(20),
  email             VARCHAR(200),
  address           TEXT,
  empanelment_date  DATE,
  is_active         BOOLEAN      DEFAULT true,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tpa_companies (
  id             UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id      UUID         NOT NULL,
  name           VARCHAR(200) NOT NULL,
  code           VARCHAR(20),
  contact_person VARCHAR(100),
  phone          VARCHAR(20),
  email          VARCHAR(200),
  is_active      BOOLEAN      DEFAULT true,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);


-- ─── 8. Patient Finance ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patient_invoices (
  id                    UUID                            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             UUID                            NOT NULL,
  invoice_number        VARCHAR(30),
  patient_id            UUID                            NOT NULL,
  patient_name          VARCHAR(200),
  patient_uhid          VARCHAR(20),
  patient_mobile        VARCHAR(15),
  patient_email         VARCHAR(200),
  visit_id              UUID,
  admission_id          UUID,
  admission_date        DATE,
  discharge_date        DATE,
  ward                  VARCHAR(50),
  bed_number            VARCHAR(20),
  billing_type          enum_patient_invoices_billing_type DEFAULT 'OP',
  is_credit_bill        BOOLEAN                         DEFAULT false,
  is_package_bill       BOOLEAN                         DEFAULT false,
  package_id            UUID,
  treating_doctor_id    UUID,
  treating_doctor_name  VARCHAR(200),
  department            VARCHAR(100),
  status                enum_patient_invoices_status    DEFAULT 'DRAFT',
  invoice_date          DATE                            NOT NULL,
  due_date              DATE,
  gross_amount          NUMERIC                         DEFAULT 0,
  discount_amount       NUMERIC                         DEFAULT 0,
  discount_percent      NUMERIC                         DEFAULT 0,
  discount_reason       VARCHAR(200),
  discount_approved_by  UUID,
  taxable_amount        NUMERIC                         DEFAULT 0,
  cgst_amount           NUMERIC                         DEFAULT 0,
  sgst_amount           NUMERIC                         DEFAULT 0,
  igst_amount           NUMERIC                         DEFAULT 0,
  total_tax             NUMERIC                         DEFAULT 0,
  net_amount            NUMERIC                         DEFAULT 0,
  rounded_amount        NUMERIC                         DEFAULT 0,
  rounding_adjustment   NUMERIC                         DEFAULT 0,
  paid_amount           NUMERIC                         DEFAULT 0,
  balance_amount        NUMERIC                         DEFAULT 0,
  deposit_adjusted      NUMERIC                         DEFAULT 0,
  patient_share         NUMERIC                         DEFAULT 0,
  insurance_share       NUMERIC                         DEFAULT 0,
  insurance_id          UUID                            REFERENCES insurers(id),
  tpa_id                UUID                            REFERENCES tpa_companies(id),
  policy_number         VARCHAR(100),
  claim_id              UUID,
  gstin_hospital        VARCHAR(15),
  gstin_patient         VARCHAR(15),
  place_of_supply       VARCHAR(5),
  is_interstate         BOOLEAN                         DEFAULT false,
  journal_entry_id      UUID,
  fiscal_year_id        UUID                            REFERENCES fiscal_years(id),
  is_accounting_posted  BOOLEAN                         DEFAULT false,
  cancellation_reason   TEXT,
  cancelled_by          UUID,
  cancelled_at          TIMESTAMPTZ,
  notes                 TEXT,
  tags                  JSONB                           DEFAULT '[]',
  metadata              JSONB                           DEFAULT '{}',
  branch_id             UUID,
  created_by            UUID,
  created_at            TIMESTAMPTZ                     DEFAULT NOW(),
  updated_at            TIMESTAMPTZ                     DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pi_tenant_date   ON patient_invoices(tenant_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_pi_patient       ON patient_invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_pi_status        ON patient_invoices(tenant_id, status);

CREATE TABLE IF NOT EXISTS deposits (
  id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        UUID         NOT NULL,
  patient_id       UUID         NOT NULL,
  receipt_number   VARCHAR(30),
  amount           NUMERIC      NOT NULL,
  balance_amount   NUMERIC,
  deposit_date     DATE         NOT NULL,
  payment_mode     VARCHAR(30),
  reference_number VARCHAR(100),
  received_by      UUID,
  status           VARCHAR(20)  DEFAULT 'ACTIVE',
  admission_id     UUID,
  notes            TEXT,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deposits_patient ON deposits(patient_id);

CREATE TABLE IF NOT EXISTS claims (
  id                    UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             UUID         NOT NULL,
  claim_number          VARCHAR(30),
  patient_id            UUID         NOT NULL,
  patient_name          VARCHAR(200),
  patient_uhid          VARCHAR(20),
  admission_id          UUID,
  invoice_id            UUID,
  insurer_id            UUID         REFERENCES insurers(id),
  tpa_id                UUID         REFERENCES tpa_companies(id),
  policy_id             UUID,
  policy_number         VARCHAR(100),
  member_id             VARCHAR(100),
  employee_id           VARCHAR(100),
  corporate_id          UUID,
  status                VARCHAR(30)  DEFAULT 'DRAFT',
  status_history        JSONB        DEFAULT '[]',
  admission_date        DATE,
  discharge_date        DATE,
  diagnosis_code        VARCHAR(20),
  diagnosis_description TEXT,
  procedure_code        VARCHAR(20),
  procedure_description TEXT,
  treating_doctor       VARCHAR(200),
  ward_type             VARCHAR(50),
  preauth_number        VARCHAR(100),
  preauth_requested_at  TIMESTAMPTZ,
  preauth_approved_at   TIMESTAMPTZ,
  preauth_approved_amount NUMERIC,
  preauth_remarks       TEXT,
  claimed_amount        NUMERIC      NOT NULL DEFAULT 0,
  admissible_amount     NUMERIC      DEFAULT 0,
  deduction_amount      NUMERIC      DEFAULT 0,
  settled_amount        NUMERIC      DEFAULT 0,
  pending_amount        NUMERIC      DEFAULT 0,
  patient_liability     NUMERIC      DEFAULT 0,
  deductions            JSONB        DEFAULT '[]',
  submitted_at          TIMESTAMPTZ,
  submitted_by          UUID,
  submission_method     VARCHAR(20),
  tpa_claim_number      VARCHAR(100),
  tpa_reference         VARCHAR(200),
  settled_at            TIMESTAMPTZ,
  settlement_utr        VARCHAR(100),
  settlement_date       DATE,
  settlement_remarks    TEXT,
  journal_entry_id      UUID,
  rejection_reason      TEXT,
  rejection_date        DATE,
  appeal_deadline       DATE,
  query_details         TEXT,
  query_date            DATE,
  query_response        TEXT,
  query_response_date   DATE,
  documents             JSONB        DEFAULT '[]',
  is_resubmission       BOOLEAN      DEFAULT false,
  original_claim_id     UUID         REFERENCES claims(id),
  is_written_off        BOOLEAN      DEFAULT false,
  written_off_amount    NUMERIC      DEFAULT 0,
  written_off_reason    TEXT,
  sla_due_date          DATE,
  notes                 TEXT,
  tags                  JSONB        DEFAULT '[]',
  branch_id             UUID,
  department_id         UUID,
  created_by            UUID,
  created_at            TIMESTAMPTZ  DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_claims_tenant_status ON claims(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_patient       ON claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_insurer       ON claims(insurer_id);


-- ─── 9. Doctors ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS doctors (
  id                  UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id           UUID         NOT NULL,
  name                VARCHAR(200) NOT NULL,
  code                VARCHAR(20),
  specialization      VARCHAR(100),
  registration_number VARCHAR(50),
  department_id       UUID,
  branch_id           UUID,
  is_active           BOOLEAN      DEFAULT true,
  pan                 VARCHAR(10),
  has_pan             BOOLEAN      DEFAULT true,
  bank_account_number VARCHAR(50),
  bank_ifsc           VARCHAR(20),
  user_id             UUID         REFERENCES users(id),
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doctors_tenant ON doctors(tenant_id);


-- ─── 10. Doctor Payouts ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS revenue_share_formulas (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id      UUID        NOT NULL,
  doctor_id      UUID        NOT NULL REFERENCES doctors(id),
  formula_type   VARCHAR(30) NOT NULL,
  formula_config JSONB       NOT NULL,
  effective_from DATE        NOT NULL,
  effective_to   DATE,
  is_active      BOOLEAN     DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payout_runs (
  id                 UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id          UUID        NOT NULL,
  year               INTEGER     NOT NULL,
  month              INTEGER     NOT NULL,
  status             VARCHAR(30) DEFAULT 'DRAFT',
  total_doctors      INTEGER     DEFAULT 0,
  total_gross_payout NUMERIC     DEFAULT 0,
  total_tds          NUMERIC     DEFAULT 0,
  total_net_payout   NUMERIC     DEFAULT 0,
  initiated_by       UUID,
  fiscal_year_id     UUID        REFERENCES fiscal_years(id),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payout_details (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    UUID        NOT NULL,
  run_id       UUID        REFERENCES payout_runs(id) ON DELETE CASCADE,
  doctor_id    UUID        REFERENCES doctors(id),
  year         INTEGER     NOT NULL,
  month        INTEGER     NOT NULL,
  total_revenue NUMERIC    DEFAULT 0,
  gross_payout NUMERIC     DEFAULT 0,
  tds_amount   NUMERIC     DEFAULT 0,
  tds_rate     NUMERIC,
  net_payout   NUMERIC     DEFAULT 0,
  formula_type VARCHAR(30),
  breakdown    JSONB       DEFAULT '[]',
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payout_details_run    ON payout_details(run_id);
CREATE INDEX IF NOT EXISTS idx_payout_details_doctor ON payout_details(doctor_id);


-- ─── 11. Workflow Engine ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID         NOT NULL,
  name        VARCHAR(200) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  config      JSONB        NOT NULL,
  is_active   BOOLEAN      DEFAULT true,
  version     INTEGER      DEFAULT 1,
  created_by  UUID,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id      UUID        NOT NULL,
  definition_id  UUID        REFERENCES workflow_definitions(id),
  entity_type    VARCHAR(100),
  entity_id      UUID,
  current_step   INTEGER     DEFAULT 1,
  total_steps    INTEGER     DEFAULT 1,
  status         VARCHAR(30) DEFAULT 'IN_PROGRESS',
  initiated_by   UUID,
  rejected_by    UUID,
  entity_data    JSONB       DEFAULT '{}',
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wi_entity ON workflow_instances(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS workflow_tasks (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID        NOT NULL,
  instance_id     UUID        REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_number     INTEGER     NOT NULL,
  step_config     JSONB       DEFAULT '{}',
  assigned_role   VARCHAR(100),
  assigned_user_id UUID,
  entity_type     VARCHAR(100),
  entity_id       UUID,
  status          VARCHAR(30) DEFAULT 'PENDING',
  action_taken    VARCHAR(30),
  acted_by        UUID,
  comments        TEXT,
  acted_at        TIMESTAMPTZ,
  due_date        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wt_instance      ON workflow_tasks(instance_id);
CREATE INDEX IF NOT EXISTS idx_wt_assigned_user ON workflow_tasks(assigned_user_id, status);


-- ─── 12. Notifications ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id  UUID        NOT NULL,
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50),
  title      VARCHAR(300),
  body       TEXT,
  link       TEXT,
  is_read    BOOLEAN     DEFAULT false,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);


-- ─── 13. Tax Rules ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tax_rules (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id      UUID,
  code           VARCHAR(20) NOT NULL UNIQUE,
  name           VARCHAR(100) NOT NULL,
  tax_type       VARCHAR(20),
  rate           NUMERIC     NOT NULL,
  effective_from DATE,
  effective_to   DATE,
  is_active      BOOLEAN     DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
