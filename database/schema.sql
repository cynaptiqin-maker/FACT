-- FACT FinOS - Complete PostgreSQL Schema
-- Hospital Financial Operating System
-- Version: 1.0.0

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TENANTS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(200) NOT NULL,
    code                VARCHAR(50) UNIQUE NOT NULL,
    legal_name          VARCHAR(300),
    gstin               VARCHAR(15),
    pan                 VARCHAR(10),
    registration_number VARCHAR(100),
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),
    phone               VARCHAR(20),
    email               VARCHAR(200),
    logo_url            TEXT,
    subscription_plan   VARCHAR(50) DEFAULT 'standard',
    is_active           BOOLEAN DEFAULT TRUE,
    settings            JSONB DEFAULT '{}',
    modules_config      JSONB DEFAULT '{}',
    timezone            VARCHAR(50) DEFAULT 'Asia/Kolkata',
    currency            VARCHAR(3) DEFAULT 'INR',
    fiscal_year_start   INTEGER DEFAULT 4,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_modules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    module_id   VARCHAR(50) NOT NULL,
    is_enabled  BOOLEAN DEFAULT TRUE,
    config      JSONB DEFAULT '{}',
    enabled_at  TIMESTAMP WITH TIME ZONE,
    enabled_by  UUID,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, module_id)
);

-- ─── AUTH & USERS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id),
    email                   VARCHAR(255) NOT NULL,
    name                    VARCHAR(200) NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,
    employee_id             VARCHAR(50),
    is_active               BOOLEAN DEFAULT TRUE,
    mfa_enabled             BOOLEAN DEFAULT FALSE,
    mfa_secret              VARCHAR(100),
    mfa_backup_codes        JSONB,
    failed_login_attempts   INTEGER DEFAULT 0,
    locked_until            TIMESTAMP WITH TIME ZONE,
    last_login_at           TIMESTAMP WITH TIME ZONE,
    password_changed_at     TIMESTAMP WITH TIME ZONE,
    profile_image_url       TEXT,
    department_id           UUID,
    branch_id               UUID,
    preferences             JSONB DEFAULT '{}',
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES tenants(id),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_system   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(100) UNIQUE NOT NULL,
    name        VARCHAR(200) NOT NULL,
    module      VARCHAR(50),
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    ip_address  INET,
    user_agent  TEXT,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── AUDIT ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID,
    user_id       UUID,
    user_email    VARCHAR(255),
    user_role     VARCHAR(100),
    action        VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(100),
    entity_id     UUID,
    before_state  JSONB,
    after_state   JSONB,
    ip_address    INET,
    user_agent    VARCHAR(500),
    source_module VARCHAR(100),
    metadata      JSONB,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Make audit logs append-only (no updates or deletes from application role)
-- In production, configure PostgreSQL RLS:
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY audit_insert_only ON audit_logs FOR INSERT TO app_role WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- ─── FISCAL YEAR & PERIODS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fiscal_years (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                 UUID NOT NULL REFERENCES tenants(id),
    name                      VARCHAR(50) NOT NULL,
    start_date                DATE NOT NULL,
    end_date                  DATE NOT NULL,
    status                    VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'ARCHIVED')),
    is_current                BOOLEAN DEFAULT FALSE,
    opening_entries_posted    BOOLEAN DEFAULT FALSE,
    closing_entries_posted    BOOLEAN DEFAULT FALSE,
    closed_at                 TIMESTAMP WITH TIME ZONE,
    closed_by                 UUID,
    created_by                UUID,
    created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS accounting_periods (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    fiscal_year_id  UUID NOT NULL REFERENCES fiscal_years(id),
    period_number   INTEGER NOT NULL,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    status          VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'LOCKED', 'CLOSED')),
    locked_at       TIMESTAMP WITH TIME ZONE,
    locked_by       UUID,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fiscal_year_id, period_number)
);

-- ─── CHART OF ACCOUNTS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cost_centers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(20) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    parent_id   UUID REFERENCES cost_centers(id),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(20) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    head_user_id UUID,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS branches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(20) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    address     TEXT,
    gstin       VARCHAR(15),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS accounts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    code                    VARCHAR(20) NOT NULL,
    name                    VARCHAR(200) NOT NULL,
    description             TEXT,
    type                    VARCHAR(20) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE')),
    sub_type                VARCHAR(50),
    parent_id               UUID REFERENCES accounts(id),
    level                   INTEGER DEFAULT 1,
    is_group                BOOLEAN DEFAULT FALSE,
    path                    VARCHAR(500),
    normal_balance          VARCHAR(10) CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    currency                VARCHAR(3) DEFAULT 'INR',
    opening_balance         NUMERIC(20, 4) DEFAULT 0,
    current_balance         NUMERIC(20, 4) DEFAULT 0,
    cost_center_id          UUID REFERENCES cost_centers(id),
    department_id           UUID REFERENCES departments(id),
    branch_id               UUID REFERENCES branches(id),
    is_active               BOOLEAN DEFAULT TRUE,
    allow_direct_posting    BOOLEAN DEFAULT TRUE,
    is_bank_account         BOOLEAN DEFAULT FALSE,
    is_cash_account         BOOLEAN DEFAULT FALSE,
    is_control_account      BOOLEAN DEFAULT FALSE,
    gst_applicable          BOOLEAN DEFAULT FALSE,
    tds_applicable          BOOLEAN DEFAULT FALSE,
    default_tax_code        VARCHAR(20),
    bank_name               VARCHAR(100),
    bank_account_number     VARCHAR(50),
    bank_ifsc               VARCHAR(20),
    bank_branch             VARCHAR(100),
    tags                    JSONB DEFAULT '[]',
    metadata                JSONB DEFAULT '{}',
    created_by              UUID,
    updated_by              UUID,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_accounts_tenant_type ON accounts(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(tenant_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_accounts_path ON accounts USING gin(path gin_trgm_ops);

-- ─── JOURNAL ENTRIES ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS voucher_sequences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    voucher_type    VARCHAR(50) NOT NULL,
    fiscal_year     INTEGER NOT NULL,
    last_number     INTEGER DEFAULT 0,
    prefix          VARCHAR(10),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, voucher_type, fiscal_year)
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    entry_number        VARCHAR(30),
    voucher_type        VARCHAR(20) NOT NULL CHECK (voucher_type IN (
        'JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA', 'DEBIT_NOTE', 'CREDIT_NOTE',
        'PURCHASE', 'SALES', 'OPENING'
    )),
    date                DATE NOT NULL,
    fiscal_year_id      UUID REFERENCES fiscal_years(id),
    period              VARCHAR(7),
    narration           TEXT,
    reference           VARCHAR(100),
    cheque_number       VARCHAR(50),
    cheque_date         DATE,
    status              VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_APPROVAL', 'POSTED', 'REVERSED', 'CANCELLED'
    )),
    workflow_instance_id UUID,
    approved_by         UUID,
    approved_at         TIMESTAMP WITH TIME ZONE,
    rejection_reason    TEXT,
    posted_by           UUID,
    posted_at           TIMESTAMP WITH TIME ZONE,
    total_debit         NUMERIC(20, 4) DEFAULT 0,
    total_credit        NUMERIC(20, 4) DEFAULT 0,
    is_reversal         BOOLEAN DEFAULT FALSE,
    reversal_of         UUID,
    is_reversed         BOOLEAN DEFAULT FALSE,
    reversed_by_id      UUID,
    cost_center_id      UUID,
    department_id       UUID,
    branch_id           UUID,
    source_module       VARCHAR(50),
    source_id           UUID,
    source_reference    VARCHAR(100),
    is_recurring        BOOLEAN DEFAULT FALSE,
    recurrence_config   JSONB,
    parent_recurring_id UUID,
    tags                JSONB DEFAULT '[]',
    attachments         JSONB DEFAULT '[]',
    metadata            JSONB DEFAULT '{}',
    created_by          UUID,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_je_entry_number ON journal_entries(tenant_id, entry_number) WHERE entry_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_je_date ON journal_entries(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_je_status ON journal_entries(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_je_source ON journal_entries(source_module, source_id);
CREATE INDEX IF NOT EXISTS idx_je_period ON journal_entries(tenant_id, period);

CREATE TABLE IF NOT EXISTS journal_lines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id    UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    line_number         INTEGER NOT NULL,
    account_id          UUID NOT NULL REFERENCES accounts(id),
    tenant_id           UUID NOT NULL,
    debit_amount        NUMERIC(20, 4) DEFAULT 0,
    credit_amount       NUMERIC(20, 4) DEFAULT 0,
    running_balance     NUMERIC(20, 4),
    cost_center_id      UUID,
    department_id       UUID,
    branch_id           UUID,
    project_id          UUID,
    narration           TEXT,
    tax_code            VARCHAR(20),
    tax_amount          NUMERIC(20, 4) DEFAULT 0,
    tax_type            VARCHAR(10),
    party_type          VARCHAR(50),
    party_id            UUID,
    is_reconciled       BOOLEAN DEFAULT FALSE,
    reconciled_at       TIMESTAMP WITH TIME ZONE,
    reconciliation_ref  VARCHAR(100),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_jl_amounts CHECK (
        NOT (debit_amount > 0 AND credit_amount > 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_jl_journal ON journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_jl_account ON journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_jl_tenant_account ON journal_lines(tenant_id, account_id);
CREATE INDEX IF NOT EXISTS idx_jl_party ON journal_lines(party_type, party_id);

-- ─── PATIENT BILLING ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patient_invoices (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    invoice_number          VARCHAR(30),
    patient_id              UUID NOT NULL,
    patient_name            VARCHAR(200),
    patient_uhid            VARCHAR(20),
    patient_mobile          VARCHAR(15),
    patient_email           VARCHAR(200),
    visit_id                UUID,
    admission_id            UUID,
    admission_date          DATE,
    discharge_date          DATE,
    ward                    VARCHAR(50),
    bed_number              VARCHAR(20),
    billing_type            VARCHAR(20) DEFAULT 'OP' CHECK (billing_type IN (
        'OP', 'IP', 'ICU', 'OT', 'DAYCARE', 'PACKAGE', 'PHARMACY', 'LAB', 'RADIOLOGY'
    )),
    is_credit_bill          BOOLEAN DEFAULT FALSE,
    is_package_bill         BOOLEAN DEFAULT FALSE,
    package_id              UUID,
    treating_doctor_id      UUID,
    treating_doctor_name    VARCHAR(200),
    department              VARCHAR(100),
    status                  VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PROVISIONAL', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED'
    )),
    invoice_date            DATE NOT NULL,
    due_date                DATE,
    gross_amount            NUMERIC(20, 2) DEFAULT 0,
    discount_amount         NUMERIC(20, 2) DEFAULT 0,
    discount_percent        NUMERIC(5, 2) DEFAULT 0,
    discount_reason         VARCHAR(200),
    discount_approved_by    UUID,
    taxable_amount          NUMERIC(20, 2) DEFAULT 0,
    cgst_amount             NUMERIC(20, 2) DEFAULT 0,
    sgst_amount             NUMERIC(20, 2) DEFAULT 0,
    igst_amount             NUMERIC(20, 2) DEFAULT 0,
    total_tax               NUMERIC(20, 2) DEFAULT 0,
    net_amount              NUMERIC(20, 2) DEFAULT 0,
    rounded_amount          NUMERIC(20, 2) DEFAULT 0,
    rounding_adjustment     NUMERIC(10, 2) DEFAULT 0,
    paid_amount             NUMERIC(20, 2) DEFAULT 0,
    balance_amount          NUMERIC(20, 2) DEFAULT 0,
    deposit_adjusted        NUMERIC(20, 2) DEFAULT 0,
    patient_share           NUMERIC(20, 2) DEFAULT 0,
    insurance_share         NUMERIC(20, 2) DEFAULT 0,
    insurance_id            UUID,
    tpa_id                  UUID,
    policy_number           VARCHAR(100),
    claim_id                UUID,
    gstin_hospital          VARCHAR(15),
    gstin_patient           VARCHAR(15),
    place_of_supply         VARCHAR(5),
    is_interstate           BOOLEAN DEFAULT FALSE,
    journal_entry_id        UUID,
    fiscal_year_id          UUID,
    is_accounting_posted    BOOLEAN DEFAULT FALSE,
    cancellation_reason     TEXT,
    cancelled_by            UUID,
    cancelled_at            TIMESTAMP WITH TIME ZONE,
    notes                   TEXT,
    tags                    JSONB DEFAULT '[]',
    metadata                JSONB DEFAULT '{}',
    branch_id               UUID,
    created_by              UUID,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pi_number ON patient_invoices(tenant_id, invoice_number) WHERE invoice_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pi_patient ON patient_invoices(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_pi_status ON patient_invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_pi_date ON patient_invoices(tenant_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_pi_insurance ON patient_invoices(insurance_id);
CREATE INDEX IF NOT EXISTS idx_pi_admission ON patient_invoices(admission_id);

CREATE TABLE IF NOT EXISTS invoice_line_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id          UUID NOT NULL REFERENCES patient_invoices(id) ON DELETE CASCADE,
    tenant_id           UUID NOT NULL,
    line_number         INTEGER NOT NULL,
    service_code        VARCHAR(50),
    service_name        VARCHAR(300) NOT NULL,
    quantity            NUMERIC(10, 3) DEFAULT 1,
    unit_price          NUMERIC(20, 4) NOT NULL,
    gross_amount        NUMERIC(20, 2),
    discount_amount     NUMERIC(20, 2) DEFAULT 0,
    discount_percent    NUMERIC(5, 2) DEFAULT 0,
    taxable_amount      NUMERIC(20, 2),
    gst_rate            NUMERIC(5, 2) DEFAULT 0,
    cgst_amount         NUMERIC(20, 2) DEFAULT 0,
    sgst_amount         NUMERIC(20, 2) DEFAULT 0,
    igst_amount         NUMERIC(20, 2) DEFAULT 0,
    net_amount          NUMERIC(20, 2),
    account_code        VARCHAR(20),
    department          VARCHAR(100),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ili_invoice ON invoice_line_items(invoice_id);

CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    invoice_id          UUID REFERENCES patient_invoices(id),
    patient_id          UUID,
    amount              NUMERIC(20, 2) NOT NULL,
    payment_mode        VARCHAR(30) NOT NULL CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'INSURANCE', 'WALLET')),
    reference_number    VARCHAR(100),
    received_by         UUID,
    payment_date        DATE NOT NULL,
    status              VARCHAR(20) DEFAULT 'COMPLETED',
    journal_entry_id    UUID,
    remarks             TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deposits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    patient_id      UUID NOT NULL,
    receipt_number  VARCHAR(30),
    amount          NUMERIC(20, 2) NOT NULL,
    balance_amount  NUMERIC(20, 2),
    deposit_date    DATE NOT NULL,
    payment_mode    VARCHAR(30),
    reference_number VARCHAR(100),
    received_by     UUID,
    status          VARCHAR(20) DEFAULT 'ACTIVE',
    admission_id    UUID,
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── INSURANCE & TPA ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS insurers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(20),
    type            VARCHAR(30) CHECK (type IN ('INSURANCE', 'TPA', 'CORPORATE', 'GOVERNMENT')),
    contact_person  VARCHAR(100),
    phone           VARCHAR(20),
    email           VARCHAR(200),
    address         TEXT,
    empanelment_date DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tpa_companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(20),
    contact_person  VARCHAR(100),
    phone           VARCHAR(20),
    email           VARCHAR(200),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    claim_number            VARCHAR(30),
    patient_id              UUID NOT NULL,
    patient_name            VARCHAR(200),
    patient_uhid            VARCHAR(20),
    admission_id            UUID,
    invoice_id              UUID REFERENCES patient_invoices(id),
    insurer_id              UUID REFERENCES insurers(id),
    tpa_id                  UUID REFERENCES tpa_companies(id),
    policy_id               UUID,
    policy_number           VARCHAR(100),
    member_id               VARCHAR(100),
    employee_id             VARCHAR(100),
    corporate_id            UUID,
    status                  VARCHAR(30) DEFAULT 'DRAFT',
    status_history          JSONB DEFAULT '[]',
    admission_date          DATE,
    discharge_date          DATE,
    diagnosis_code          VARCHAR(20),
    diagnosis_description   TEXT,
    procedure_code          VARCHAR(20),
    procedure_description   TEXT,
    treating_doctor         VARCHAR(200),
    ward_type               VARCHAR(50),
    preauth_number          VARCHAR(100),
    preauth_requested_at    TIMESTAMP WITH TIME ZONE,
    preauth_approved_at     TIMESTAMP WITH TIME ZONE,
    preauth_approved_amount NUMERIC(20, 2),
    preauth_remarks         TEXT,
    claimed_amount          NUMERIC(20, 2) NOT NULL DEFAULT 0,
    admissible_amount       NUMERIC(20, 2) DEFAULT 0,
    deduction_amount        NUMERIC(20, 2) DEFAULT 0,
    settled_amount          NUMERIC(20, 2) DEFAULT 0,
    pending_amount          NUMERIC(20, 2) DEFAULT 0,
    patient_liability       NUMERIC(20, 2) DEFAULT 0,
    deductions              JSONB DEFAULT '[]',
    submitted_at            TIMESTAMP WITH TIME ZONE,
    submitted_by            UUID,
    submission_method       VARCHAR(20),
    tpa_claim_number        VARCHAR(100),
    tpa_reference           VARCHAR(200),
    settled_at              TIMESTAMP WITH TIME ZONE,
    settlement_utr          VARCHAR(100),
    settlement_date         DATE,
    settlement_remarks      TEXT,
    journal_entry_id        UUID,
    rejection_reason        TEXT,
    rejection_date          DATE,
    appeal_deadline         DATE,
    query_details           TEXT,
    query_date              DATE,
    query_response          TEXT,
    query_response_date     DATE,
    documents               JSONB DEFAULT '[]',
    is_resubmission         BOOLEAN DEFAULT FALSE,
    original_claim_id       UUID,
    is_written_off          BOOLEAN DEFAULT FALSE,
    written_off_amount      NUMERIC(20, 2) DEFAULT 0,
    written_off_reason      TEXT,
    sla_due_date            DATE,
    notes                   TEXT,
    tags                    JSONB DEFAULT '[]',
    branch_id               UUID,
    department_id           UUID,
    created_by              UUID,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_number ON claims(tenant_id, claim_number) WHERE claim_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_claims_insurer ON claims(tenant_id, insurer_id);
CREATE INDEX IF NOT EXISTS idx_claims_patient ON claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_submitted ON claims(submitted_at);

-- ─── FIXED ASSETS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS asset_categories (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                       UUID NOT NULL,
    code                            VARCHAR(20) NOT NULL,
    name                            VARCHAR(200) NOT NULL,
    depreciation_method             VARCHAR(30) DEFAULT 'SLM',
    useful_life_years               NUMERIC(5, 2),
    depreciation_rate               NUMERIC(8, 4),
    salvage_value_percent           NUMERIC(5, 2) DEFAULT 0,
    asset_account_id                UUID,
    depreciation_account_id         UUID,
    accumulated_depreciation_account_id UUID,
    is_active                       BOOLEAN DEFAULT TRUE,
    created_at                      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS assets (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    asset_code                  VARCHAR(30),
    asset_name                  VARCHAR(200) NOT NULL,
    description                 TEXT,
    category_id                 UUID REFERENCES asset_categories(id),
    asset_tag                   VARCHAR(100),
    serial_number               VARCHAR(100),
    model_number                VARCHAR(100),
    manufacturer                VARCHAR(100),
    vendor_id                   UUID,
    purchase_date               DATE NOT NULL,
    capitalization_date         DATE,
    purchase_invoice            VARCHAR(100),
    purchase_cost               NUMERIC(20, 2) NOT NULL,
    installation_cost           NUMERIC(20, 2) DEFAULT 0,
    total_cost                  NUMERIC(20, 2),
    salvage_value               NUMERIC(20, 2) DEFAULT 0,
    useful_life_years           NUMERIC(5, 2),
    depreciation_method         VARCHAR(30) DEFAULT 'SLM',
    depreciation_rate           NUMERIC(8, 4),
    accumulated_depreciation    NUMERIC(20, 2) DEFAULT 0,
    current_book_value          NUMERIC(20, 2),
    last_depreciation_date      DATE,
    location                    VARCHAR(200),
    department_id               UUID,
    branch_id                   UUID,
    cost_center_id              UUID,
    custodian_user_id           UUID,
    asset_account_id            UUID,
    depreciation_account_id     UUID,
    accumulated_dep_account_id  UUID,
    status                      VARCHAR(30) DEFAULT 'ACTIVE',
    insurance_policy            VARCHAR(100),
    insurance_expiry            DATE,
    insurance_value             NUMERIC(20, 2),
    warranty_expiry             DATE,
    amc_expiry                  DATE,
    disposal_date               DATE,
    disposal_amount             NUMERIC(20, 2),
    disposal_reason             TEXT,
    disposal_journal_id         UUID,
    tags                        JSONB DEFAULT '[]',
    metadata                    JSONB DEFAULT '{}',
    created_by                  UUID,
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_code ON assets(tenant_id, asset_code) WHERE asset_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_assets_dept ON assets(tenant_id, department_id);

CREATE TABLE IF NOT EXISTS depreciation_schedules (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id                UUID NOT NULL REFERENCES assets(id),
    tenant_id               UUID NOT NULL,
    run_id                  UUID,
    period_year             INTEGER NOT NULL,
    period_month            INTEGER NOT NULL,
    depreciation_amount     NUMERIC(20, 2) NOT NULL,
    accumulated_depreciation NUMERIC(20, 2),
    book_value_before       NUMERIC(20, 2),
    book_value_after        NUMERIC(20, 2),
    method                  VARCHAR(20),
    journal_entry_id        UUID,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(asset_id, period_year, period_month)
);

CREATE TABLE IF NOT EXISTS depreciation_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    fiscal_year         INTEGER NOT NULL,
    period_month        INTEGER NOT NULL,
    run_date            DATE,
    status              VARCHAR(20) DEFAULT 'PROCESSING',
    total_assets        INTEGER DEFAULT 0,
    total_depreciation  NUMERIC(20, 2) DEFAULT 0,
    error_count         INTEGER DEFAULT 0,
    initiated_by        UUID,
    fiscal_year_id      UUID,
    completed_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, fiscal_year, period_month)
);

-- ─── PAYROLL ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employees (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    employee_number     VARCHAR(30),
    name                VARCHAR(200) NOT NULL,
    email               VARCHAR(200),
    phone               VARCHAR(20),
    designation         VARCHAR(100),
    department_id       UUID,
    branch_id           UUID,
    date_of_joining     DATE,
    date_of_leaving     DATE,
    employment_type     VARCHAR(30) DEFAULT 'PERMANENT',
    is_active           BOOLEAN DEFAULT TRUE,
    pan                 VARCHAR(10),
    aadhaar             VARCHAR(12),
    pf_number           VARCHAR(30),
    esi_number          VARCHAR(30),
    bank_account_number VARCHAR(50),
    bank_ifsc           VARCHAR(20),
    bank_name           VARCHAR(100),
    user_id             UUID REFERENCES users(id),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_structures (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    employee_id             UUID NOT NULL REFERENCES employees(id),
    effective_from          DATE NOT NULL,
    effective_to            DATE,
    is_active               BOOLEAN DEFAULT TRUE,
    basic                   NUMERIC(20, 2) DEFAULT 0,
    hra                     NUMERIC(20, 2) DEFAULT 0,
    special_allowance       NUMERIC(20, 2) DEFAULT 0,
    lta                     NUMERIC(20, 2) DEFAULT 0,
    medical_allowance       NUMERIC(20, 2) DEFAULT 0,
    other_allowances        NUMERIC(20, 2) DEFAULT 0,
    gross_salary            NUMERIC(20, 2),
    components              JSONB DEFAULT '{}',
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    year                INTEGER NOT NULL,
    month               INTEGER NOT NULL,
    status              VARCHAR(30) DEFAULT 'DRAFT',
    total_employees     INTEGER DEFAULT 0,
    total_gross         NUMERIC(20, 2) DEFAULT 0,
    total_deductions    NUMERIC(20, 2) DEFAULT 0,
    total_net           NUMERIC(20, 2) DEFAULT 0,
    total_pf_expense    NUMERIC(20, 2) DEFAULT 0,
    total_esi_expense   NUMERIC(20, 2) DEFAULT 0,
    initiated_by        UUID,
    approved_by         UUID,
    approved_at         TIMESTAMP WITH TIME ZONE,
    posted_at           TIMESTAMP WITH TIME ZONE,
    journal_entry_id    UUID,
    fiscal_year_id      UUID,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, year, month)
);

CREATE TABLE IF NOT EXISTS payslips (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    payroll_run_id      UUID REFERENCES payroll_runs(id),
    employee_id         UUID REFERENCES employees(id),
    year                INTEGER NOT NULL,
    month               INTEGER NOT NULL,
    gross_earnings      NUMERIC(20, 2) DEFAULT 0,
    total_deductions    NUMERIC(20, 2) DEFAULT 0,
    net_payable         NUMERIC(20, 2) DEFAULT 0,
    pf_employee         NUMERIC(20, 2) DEFAULT 0,
    esi_employee        NUMERIC(20, 2) DEFAULT 0,
    professional_tax    NUMERIC(20, 2) DEFAULT 0,
    tds                 NUMERIC(20, 2) DEFAULT 0,
    pf_employer         NUMERIC(20, 2) DEFAULT 0,
    esi_employer        NUMERIC(20, 2) DEFAULT 0,
    components          JSONB DEFAULT '{}',
    paid_at             TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, year, month)
);

-- ─── DOCTOR PAYOUTS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS doctors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(20),
    specialization  VARCHAR(100),
    registration_number VARCHAR(50),
    department_id   UUID,
    branch_id       UUID,
    is_active       BOOLEAN DEFAULT TRUE,
    pan             VARCHAR(10),
    has_pan         BOOLEAN DEFAULT TRUE,
    bank_account_number VARCHAR(50),
    bank_ifsc       VARCHAR(20),
    user_id         UUID,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revenue_share_formulas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    doctor_id       UUID NOT NULL REFERENCES doctors(id),
    formula_type    VARCHAR(30) NOT NULL CHECK (formula_type IN ('PERCENTAGE', 'SLAB', 'PROCEDURE')),
    formula_config  JSONB NOT NULL,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payout_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    year                INTEGER NOT NULL,
    month               INTEGER NOT NULL,
    status              VARCHAR(30) DEFAULT 'DRAFT',
    total_doctors       INTEGER DEFAULT 0,
    total_gross_payout  NUMERIC(20, 2) DEFAULT 0,
    total_tds           NUMERIC(20, 2) DEFAULT 0,
    total_net_payout    NUMERIC(20, 2) DEFAULT 0,
    initiated_by        UUID,
    fiscal_year_id      UUID,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, year, month)
);

CREATE TABLE IF NOT EXISTS payout_details (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    run_id          UUID REFERENCES payout_runs(id),
    doctor_id       UUID REFERENCES doctors(id),
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL,
    total_revenue   NUMERIC(20, 2) DEFAULT 0,
    gross_payout    NUMERIC(20, 2) DEFAULT 0,
    tds_amount      NUMERIC(20, 2) DEFAULT 0,
    tds_rate        NUMERIC(8, 4),
    net_payout      NUMERIC(20, 2) DEFAULT 0,
    formula_type    VARCHAR(30),
    breakdown       JSONB DEFAULT '[]',
    paid_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── WORKFLOW ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workflow_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    config          JSONB NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    version         INTEGER DEFAULT 1,
    created_by      UUID,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_instances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    definition_id   UUID REFERENCES workflow_definitions(id),
    entity_type     VARCHAR(100),
    entity_id       UUID,
    current_step    INTEGER DEFAULT 1,
    total_steps     INTEGER DEFAULT 1,
    status          VARCHAR(30) DEFAULT 'IN_PROGRESS',
    initiated_by    UUID,
    rejected_by     UUID,
    entity_data     JSONB DEFAULT '{}',
    completed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_tasks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    instance_id         UUID REFERENCES workflow_instances(id),
    step_number         INTEGER NOT NULL,
    step_config         JSONB DEFAULT '{}',
    assigned_role       VARCHAR(100),
    assigned_user_id    UUID,
    entity_type         VARCHAR(100),
    entity_id           UUID,
    status              VARCHAR(30) DEFAULT 'PENDING',
    action_taken        VARCHAR(30),
    acted_by            UUID,
    comments            TEXT,
    acted_at            TIMESTAMP WITH TIME ZONE,
    due_date            TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wt_pending ON workflow_tasks(tenant_id, status, assigned_role) WHERE status = 'PENDING';

-- ─── VENDOR & PROCUREMENT ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    vendor_code         VARCHAR(20),
    name                VARCHAR(200) NOT NULL,
    vendor_type         VARCHAR(50),
    gstin               VARCHAR(15),
    pan                 VARCHAR(10),
    contact_person      VARCHAR(100),
    phone               VARCHAR(20),
    email               VARCHAR(200),
    address             TEXT,
    payment_terms_days  INTEGER DEFAULT 30,
    bank_account_number VARCHAR(50),
    bank_ifsc           VARCHAR(20),
    bank_name           VARCHAR(100),
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    vendor_id           UUID REFERENCES vendors(id),
    vendor_name         VARCHAR(200),
    invoice_number      VARCHAR(100) NOT NULL,
    invoice_date        DATE NOT NULL,
    due_date            DATE,
    net_amount          NUMERIC(20, 2) NOT NULL,
    cgst_amount         NUMERIC(20, 2) DEFAULT 0,
    sgst_amount         NUMERIC(20, 2) DEFAULT 0,
    igst_amount         NUMERIC(20, 2) DEFAULT 0,
    tds_amount          NUMERIC(20, 2) DEFAULT 0,
    tds_section         VARCHAR(10),
    paid_amount         NUMERIC(20, 2) DEFAULT 0,
    status              VARCHAR(30) DEFAULT 'PENDING',
    purchase_order_id   UUID,
    journal_entry_id    UUID,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── AI & SYSTEM ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_queries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID,
    query           TEXT NOT NULL,
    generated_sql   TEXT,
    result_count    INTEGER,
    summary         TEXT,
    error           TEXT,
    response_time_ms INTEGER,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID,
    code            VARCHAR(20) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    tax_type        VARCHAR(20),
    rate            NUMERIC(8, 4) NOT NULL,
    effective_from  DATE,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tds_deductions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    tds_section     VARCHAR(10) NOT NULL,
    party_name      VARCHAR(200),
    party_pan       VARCHAR(10),
    payment_amount  NUMERIC(20, 2) NOT NULL,
    tds_amount      NUMERIC(20, 2) NOT NULL,
    tds_rate        NUMERIC(8, 4),
    deduction_date  DATE NOT NULL,
    payment_date    DATE,
    certificate_number VARCHAR(50),
    journal_entry_id UUID,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID,
    type            VARCHAR(50),
    title           VARCHAR(300),
    body            TEXT,
    link            TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read, created_at DESC);

-- ─── Update Triggers ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public'
               AND table_name IN ('tenants', 'users', 'accounts', 'journal_entries', 'patient_invoices', 'claims', 'assets', 'employees', 'payroll_runs')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;
