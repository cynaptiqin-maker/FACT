-- Migration: 001_core_schema
-- Creates all application tables not managed by Sequelize models.
-- Idempotent: safe to re-run.

-- ─── Migration tracking ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Tenants ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  plan        VARCHAR(50)  NOT NULL DEFAULT 'STANDARD',
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  settings    JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Roles ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID,
  name        VARCHAR(100) NOT NULL,
  permissions JSONB        NOT NULL DEFAULT '[]',
  is_system   BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_tenant_name ON roles (tenant_id, name);

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email                   VARCHAR(200) NOT NULL,
  password_hash           VARCHAR(200) NOT NULL,
  full_name               VARCHAR(200),
  is_active               BOOLEAN      NOT NULL DEFAULT true,
  is_superadmin           BOOLEAN      NOT NULL DEFAULT false,
  mfa_enabled             BOOLEAN      NOT NULL DEFAULT false,
  mfa_secret              VARCHAR(100),
  backup_codes            JSONB,
  failed_login_attempts   INTEGER      NOT NULL DEFAULT 0,
  locked_until            TIMESTAMPTZ,
  last_login              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users (tenant_id, email);

-- ─── User Roles (many-to-many) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ─── Tenant Modules ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_modules (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id   VARCHAR(100) NOT NULL,
  is_enabled  BOOLEAN     NOT NULL DEFAULT true,
  config      JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_lookup ON tenant_modules (tenant_id, module_id, is_enabled);

-- ─── Voucher Sequences ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voucher_sequences (
  tenant_id    UUID        NOT NULL,
  voucher_type VARCHAR(50) NOT NULL,
  fiscal_year  INTEGER     NOT NULL,
  last_number  INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, voucher_type, fiscal_year)
);

-- ─── Accounting Periods ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting_periods (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL,
  fiscal_year_id UUID        NOT NULL,
  period_number  INTEGER     NOT NULL,
  period_start   DATE        NOT NULL,
  period_end     DATE        NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  closed_by      UUID,
  closed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_accounting_periods_tenant ON accounting_periods (tenant_id, fiscal_year_id, status);

-- ─── Asset Categories ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_categories (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID        NOT NULL,
  code                 VARCHAR(30) NOT NULL,
  name                 VARCHAR(100) NOT NULL,
  depreciation_method  VARCHAR(30) NOT NULL DEFAULT 'SLM',
  depreciation_rate    DECIMAL(5,2) NOT NULL DEFAULT 0,
  useful_life_years    INTEGER,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

-- ─── Vendors ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         NOT NULL,
  code           VARCHAR(30),
  name           VARCHAR(200) NOT NULL,
  category       VARCHAR(50),
  gstin          VARCHAR(15),
  pan            VARCHAR(10),
  email          VARCHAR(100),
  phone          VARCHAR(20),
  address        JSONB        NOT NULL DEFAULT '{}',
  bank_name      VARCHAR(100),
  bank_account   VARCHAR(50),
  bank_ifsc      VARCHAR(15),
  payment_terms  INTEGER      NOT NULL DEFAULT 30,
  credit_limit   DECIMAL(20,2) NOT NULL DEFAULT 0,
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  created_by     UUID,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_active ON vendors (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_name   ON vendors (tenant_id, name);

-- ─── Vendor Invoices ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_invoices (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID         NOT NULL,
  vendor_id             UUID         REFERENCES vendors(id),
  vendor_name           VARCHAR(200) NOT NULL,
  invoice_number        VARCHAR(100) NOT NULL,
  invoice_date          DATE         NOT NULL,
  due_date              DATE,
  net_amount            DECIMAL(20,2) NOT NULL DEFAULT 0,
  cgst_amount           DECIMAL(20,2) NOT NULL DEFAULT 0,
  sgst_amount           DECIMAL(20,2) NOT NULL DEFAULT 0,
  igst_amount           DECIMAL(20,2) NOT NULL DEFAULT 0,
  tds_amount            DECIMAL(20,2) NOT NULL DEFAULT 0,
  tds_section           VARCHAR(20),
  paid_amount           DECIMAL(20,2) NOT NULL DEFAULT 0,
  status                VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
  purchase_order_id     UUID,
  fiscal_year_id        UUID,
  branch_id             UUID,
  narration             TEXT,
  expense_account_code  VARCHAR(30),
  is_accounting_posted  BOOLEAN      NOT NULL DEFAULT false,
  journal_entry_id      UUID,
  entry_number          VARCHAR(50),
  created_by            UUID,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vi_tenant_status  ON vendor_invoices (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_vi_tenant_vendor  ON vendor_invoices (tenant_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_vi_tenant_duedate ON vendor_invoices (tenant_id, due_date);

-- ─── Vendor Payments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_payments (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID         NOT NULL,
  vendor_invoice_id   UUID         REFERENCES vendor_invoices(id),
  vendor_id           UUID,
  amount              DECIMAL(20,2) NOT NULL,
  payment_mode        VARCHAR(30),
  reference_number    VARCHAR(100),
  payment_date        DATE         NOT NULL,
  bank_account_code   VARCHAR(30),
  fiscal_year_id      UUID,
  branch_id           UUID,
  narration           TEXT,
  journal_entry_id    UUID,
  created_by          UUID,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vpay_tenant ON vendor_payments (tenant_id, vendor_id);

-- ─── TDS Deductions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tds_deductions (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID,
  vendor_invoice_id UUID         REFERENCES vendor_invoices(id),
  tds_section       VARCHAR(20),
  tds_rate          DECIMAL(5,2),
  tds_amount        DECIMAL(20,2),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Employees ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL,
  employee_number   VARCHAR(30) NOT NULL,
  name              VARCHAR(200) NOT NULL,
  email             VARCHAR(100),
  department_id     UUID,
  designation       VARCHAR(100),
  date_of_joining   DATE,
  employment_type   VARCHAR(30),
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, employee_number)
);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_active ON employees (tenant_id, is_active);

-- ─── Salary Structures ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_structures (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         NOT NULL,
  employee_id    UUID         REFERENCES employees(id),
  name           VARCHAR(100),
  components     JSONB        NOT NULL DEFAULT '{}',
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  effective_from DATE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sal_struct_tenant_emp ON salary_structures (tenant_id, employee_id, is_active);

-- ─── Payroll Runs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_runs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL,
  year                INTEGER     NOT NULL,
  month               INTEGER     NOT NULL,
  status              VARCHAR(30) NOT NULL DEFAULT 'PROCESSING',
  total_employees     INTEGER     NOT NULL DEFAULT 0,
  total_gross         DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_deductions    DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_net           DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_pf_expense    DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_esi_expense   DECIMAL(20,2) NOT NULL DEFAULT 0,
  initiated_by        UUID,
  approved_by         UUID,
  fiscal_year_id      UUID,
  journal_entry_id    UUID,
  entry_number        VARCHAR(50),
  posted_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, year, month)
);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant ON payroll_runs (tenant_id, status);

-- ─── Payslips ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payslips (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID         NOT NULL,
  payroll_run_id    UUID         REFERENCES payroll_runs(id),
  employee_id       UUID         REFERENCES employees(id),
  year              INTEGER      NOT NULL,
  month             INTEGER      NOT NULL,
  gross_earnings    DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_deductions  DECIMAL(20,2) NOT NULL DEFAULT 0,
  net_payable       DECIMAL(20,2) NOT NULL DEFAULT 0,
  pf_employee       DECIMAL(20,2) NOT NULL DEFAULT 0,
  esi_employee      DECIMAL(20,2) NOT NULL DEFAULT 0,
  professional_tax  DECIMAL(20,2) NOT NULL DEFAULT 0,
  tds               DECIMAL(20,2) NOT NULL DEFAULT 0,
  pf_employer       DECIMAL(20,2) NOT NULL DEFAULT 0,
  esi_employer      DECIMAL(20,2) NOT NULL DEFAULT 0,
  components        JSONB        NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payslips_run ON payslips (payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payslips_emp ON payslips (tenant_id, employee_id, year, month);

-- ─── Bank Accounts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL,
  account_code     VARCHAR(20),
  bank_name        VARCHAR(100) NOT NULL,
  account_number   VARCHAR(30)  NOT NULL,
  ifsc_code        VARCHAR(15),
  account_type     VARCHAR(30)  NOT NULL DEFAULT 'CURRENT',
  current_balance  DECIMAL(20,2) NOT NULL DEFAULT 0,
  currency         VARCHAR(3)   NOT NULL DEFAULT 'INR',
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant ON bank_accounts (tenant_id, is_active);

-- ─── Bank Transactions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_transactions (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID         NOT NULL,
  bank_account_id    UUID         REFERENCES bank_accounts(id),
  transaction_date   DATE         NOT NULL,
  value_date         DATE,
  description        TEXT,
  debit_amount       DECIMAL(20,2) NOT NULL DEFAULT 0,
  credit_amount      DECIMAL(20,2) NOT NULL DEFAULT 0,
  balance            DECIMAL(20,2),
  reference_number   VARCHAR(100),
  reconciled         BOOLEAN      NOT NULL DEFAULT false,
  journal_entry_id   UUID,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bt_tenant_account   ON bank_transactions (tenant_id, bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bt_reconciled       ON bank_transactions (tenant_id, reconciled);
CREATE INDEX IF NOT EXISTS idx_bt_date             ON bank_transactions (bank_account_id, transaction_date);

-- ─── Invoice Line Items ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        UUID         NOT NULL,
  tenant_id         UUID         NOT NULL,
  line_number       INTEGER      NOT NULL DEFAULT 1,
  service_code      VARCHAR(50),
  service_name      VARCHAR(200) NOT NULL,
  quantity          DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price        DECIMAL(20,2) NOT NULL,
  gross_amount      DECIMAL(20,2) NOT NULL,
  discount_amount   DECIMAL(20,2) NOT NULL DEFAULT 0,
  discount_percent  DECIMAL(5,2)  NOT NULL DEFAULT 0,
  taxable_amount    DECIMAL(20,2) NOT NULL DEFAULT 0,
  gst_rate          DECIMAL(5,2)  NOT NULL DEFAULT 0,
  cgst_amount       DECIMAL(20,2) NOT NULL DEFAULT 0,
  sgst_amount       DECIMAL(20,2) NOT NULL DEFAULT 0,
  igst_amount       DECIMAL(20,2) NOT NULL DEFAULT 0,
  net_amount        DECIMAL(20,2) NOT NULL,
  account_code      VARCHAR(30),
  department        VARCHAR(50),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ili_invoice ON invoice_line_items (invoice_id, tenant_id);

-- ─── Patient Payments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL,
  invoice_id       UUID        NOT NULL,
  patient_id       UUID,
  amount           DECIMAL(20,2) NOT NULL,
  payment_mode     VARCHAR(30),
  reference_number VARCHAR(100),
  received_by      UUID,
  payment_date     DATE        NOT NULL,
  status           VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  journal_entry_id UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments (invoice_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_date    ON payments (tenant_id, payment_date);

-- ─── AI Queries Log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_queries (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID    NOT NULL,
  query        TEXT,
  generated_sql TEXT,
  result_count INTEGER,
  summary      TEXT,
  error        TEXT,
  user_id      UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_queries_tenant ON ai_queries (tenant_id, created_at DESC);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID,
  user_id       UUID,
  user_email    VARCHAR(200),
  user_role     VARCHAR(50),
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(100),
  entity_id     UUID,
  before_state  JSONB,
  after_state   JSONB,
  ip_address    VARCHAR(50),
  user_agent    TEXT,
  source_module VARCHAR(100),
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_entity  ON audit_logs (tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_date    ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user           ON audit_logs (user_id);
