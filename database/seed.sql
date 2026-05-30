-- FACT FinOS - Seed Data
-- Provides a working starting point for development

-- ─── Default Tenant ──────────────────────────────────────────────────────────
INSERT INTO tenants (id, name, code, legal_name, gstin, address, city, state, pincode, phone, email, is_active, subscription_plan, fiscal_year_start, currency, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Apollo General Hospital',
    'apollo',
    'Apollo General Hospital Pvt Ltd',
    '29AABCA1234A1Z5',
    '123, Hospital Road, Koramangala',
    'Bengaluru',
    'Karnataka',
    '560034',
    '+91-80-12345678',
    'admin@apollogeneral.com',
    TRUE,
    'enterprise',
    4,   -- April (Indian FY)
    'INR',
    'Asia/Kolkata'
) ON CONFLICT (id) DO NOTHING;

-- ─── Default Roles ────────────────────────────────────────────────────────────
INSERT INTO roles (id, tenant_id, name, description, is_system) VALUES
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'admin', 'System Administrator', TRUE),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'cfo', 'Chief Financial Officer', TRUE),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'accountant', 'Accountant', TRUE),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'billing_staff', 'Billing Staff', TRUE),
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'auditor', 'Auditor', TRUE),
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'hr', 'HR Manager', TRUE),
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'insurance_staff', 'Insurance/TPA Staff', TRUE),
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'department_head', 'Department Head', TRUE)
ON CONFLICT DO NOTHING;

-- ─── Default Admin User (Password: Admin@123) ─────────────────────────────────
-- Password hash: bcrypt of "Admin@123" with 12 rounds
INSERT INTO users (id, tenant_id, email, name, password_hash, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000100',
    '00000000-0000-0000-0000-000000000001',
    'admin@apollogeneral.com',
    'System Administrator',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4ybVJBNOtq', -- Admin@123
    TRUE
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- Assign admin role
INSERT INTO user_roles (id, user_id, role_id)
VALUES ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- ─── Default Fiscal Year ──────────────────────────────────────────────────────
INSERT INTO fiscal_years (id, tenant_id, name, start_date, end_date, status, is_current)
VALUES (
    '00000000-0000-0000-0000-000000000300',
    '00000000-0000-0000-0000-000000000001',
    'FY 2025-26',
    '2025-04-01',
    '2026-03-31',
    'ACTIVE',
    TRUE
) ON CONFLICT DO NOTHING;

-- ─── Accounting Periods for FY 2025-26 ──────────────────────────────────────
INSERT INTO accounting_periods (id, tenant_id, fiscal_year_id, period_number, period_start, period_end, status)
VALUES
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 1,  '2025-04-01', '2025-04-30', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 2,  '2025-05-01', '2025-05-31', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 3,  '2025-06-01', '2025-06-30', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 4,  '2025-07-01', '2025-07-31', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 5,  '2025-08-01', '2025-08-31', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 6,  '2025-09-01', '2025-09-30', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 7,  '2025-10-01', '2025-10-31', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 8,  '2025-11-01', '2025-11-30', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 9,  '2025-12-01', '2025-12-31', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 10, '2026-01-01', '2026-01-31', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 11, '2026-02-01', '2026-02-28', 'OPEN'),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000300', 12, '2026-03-01', '2026-03-31', 'OPEN')
ON CONFLICT DO NOTHING;

-- ─── Hospital Chart of Accounts ──────────────────────────────────────────────

-- ASSETS (1000 series)
INSERT INTO accounts (id, tenant_id, code, name, type, is_group, level, path, normal_balance, currency, is_active, opening_balance, current_balance) VALUES
-- Group: Current Assets
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1000', 'Current Assets', 'ASSET', TRUE, 1, '/1000', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1001', 'Cash in Hand', 'ASSET', FALSE, 2, '/1000/1001', 'DEBIT', 'INR', TRUE, 500000, 500000),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1010', 'HDFC Bank - Current Account', 'ASSET', FALSE, 2, '/1000/1010', 'DEBIT', 'INR', TRUE, 5000000, 5000000),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1011', 'ICICI Bank - OD Account', 'ASSET', FALSE, 2, '/1000/1011', 'DEBIT', 'INR', TRUE, 0, 0),
-- AR
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1100', 'Accounts Receivable - Patients', 'ASSET', FALSE, 2, '/1000/1100', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1101', 'Accounts Receivable - Insurance/TPA', 'ASSET', FALSE, 2, '/1000/1101', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1102', 'Accounts Receivable - Corporate', 'ASSET', FALSE, 2, '/1000/1102', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1110', 'Input GST - CGST', 'ASSET', FALSE, 2, '/1000/1110', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1111', 'Input GST - SGST', 'ASSET', FALSE, 2, '/1000/1111', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1112', 'Input GST - IGST', 'ASSET', FALSE, 2, '/1000/1112', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1200', 'Advance Salary', 'ASSET', FALSE, 2, '/1000/1200', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1300', 'Inventory - Medical Supplies', 'ASSET', FALSE, 2, '/1000/1300', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1301', 'Inventory - Pharmacy', 'ASSET', FALSE, 2, '/1000/1301', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '1400', 'Prepaid Expenses', 'ASSET', FALSE, 2, '/1000/1400', 'DEBIT', 'INR', TRUE, 0, 0),
-- Fixed Assets
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2000', 'Fixed Assets', 'ASSET', TRUE, 1, '/2000', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2001', 'Medical Equipment', 'ASSET', FALSE, 2, '/2000/2001', 'DEBIT', 'INR', TRUE, 10000000, 10000000),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2002', 'Less: Accumulated Depreciation - Equipment', 'ASSET', FALSE, 2, '/2000/2002', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2003', 'Furniture & Fixtures', 'ASSET', FALSE, 2, '/2000/2003', 'DEBIT', 'INR', TRUE, 500000, 500000),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2004', 'Computer & IT Equipment', 'ASSET', FALSE, 2, '/2000/2004', 'DEBIT', 'INR', TRUE, 300000, 300000),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2010', 'Land & Building', 'ASSET', FALSE, 2, '/2000/2010', 'DEBIT', 'INR', TRUE, 50000000, 50000000)
ON CONFLICT DO NOTHING;

-- LIABILITIES (3000 series)
INSERT INTO accounts (id, tenant_id, code, name, type, is_group, level, path, normal_balance, currency, is_active, opening_balance, current_balance) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2100', 'Patient Deposits / Advances', 'LIABILITY', FALSE, 1, '/2100', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2200', 'Output GST - CGST Payable', 'LIABILITY', FALSE, 1, '/2200', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2201', 'Output GST - CGST', 'LIABILITY', FALSE, 1, '/2201', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2202', 'Output GST - SGST', 'LIABILITY', FALSE, 1, '/2202', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2203', 'Output GST - IGST', 'LIABILITY', FALSE, 1, '/2203', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2300', 'Salary Payable', 'LIABILITY', FALSE, 1, '/2300', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2310', 'PF Payable - Employee', 'LIABILITY', FALSE, 1, '/2310', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2311', 'PF Payable - Employer', 'LIABILITY', FALSE, 1, '/2311', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2312', 'ESI Payable - Employee', 'LIABILITY', FALSE, 1, '/2312', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2313', 'ESI Payable - Employer', 'LIABILITY', FALSE, 1, '/2313', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2320', 'Professional Tax Payable', 'LIABILITY', FALSE, 1, '/2320', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2330', 'TDS Payable', 'LIABILITY', FALSE, 1, '/2330', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2400', 'Accounts Payable - Vendors', 'LIABILITY', FALSE, 1, '/2400', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2500', 'Bank Loan', 'LIABILITY', FALSE, 1, '/2500', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '2600', 'Doctor Fees Payable', 'LIABILITY', FALSE, 1, '/2600', 'CREDIT', 'INR', TRUE, 0, 0)
ON CONFLICT DO NOTHING;

-- EQUITY (3500 series)
INSERT INTO accounts (id, tenant_id, code, name, type, is_group, level, path, normal_balance, currency, is_active, opening_balance, current_balance) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '3001', 'Share Capital', 'EQUITY', FALSE, 1, '/3001', 'CREDIT', 'INR', TRUE, 10000000, 10000000),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '3002', 'Retained Earnings', 'EQUITY', FALSE, 1, '/3002', 'CREDIT', 'INR', TRUE, 5000000, 5000000),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '3003', 'Current Year Profit/Loss', 'EQUITY', FALSE, 1, '/3003', 'CREDIT', 'INR', TRUE, 0, 0)
ON CONFLICT DO NOTHING;

-- INCOME (4000 series)
INSERT INTO accounts (id, tenant_id, code, name, type, is_group, level, path, normal_balance, currency, is_active, opening_balance, current_balance) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4000', 'Revenue', 'INCOME', TRUE, 1, '/4000', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4001', 'Revenue - OP Consultation', 'INCOME', FALSE, 2, '/4000/4001', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4002', 'Revenue - IP Charges', 'INCOME', FALSE, 2, '/4000/4002', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4003', 'Revenue - ICU', 'INCOME', FALSE, 2, '/4000/4003', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4004', 'Revenue - OT', 'INCOME', FALSE, 2, '/4000/4004', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4005', 'Revenue - Pharmacy', 'INCOME', FALSE, 2, '/4000/4005', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4006', 'Revenue - Laboratory', 'INCOME', FALSE, 2, '/4000/4006', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4007', 'Revenue - Radiology/Imaging', 'INCOME', FALSE, 2, '/4000/4007', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4008', 'Revenue - Packages', 'INCOME', FALSE, 2, '/4000/4008', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4009', 'Revenue - Day Care', 'INCOME', FALSE, 2, '/4000/4009', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4010', 'Revenue - Room Charges', 'INCOME', FALSE, 2, '/4000/4010', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4020', 'Other Income', 'INCOME', FALSE, 2, '/4000/4020', 'CREDIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '4021', 'Interest Income', 'INCOME', FALSE, 2, '/4000/4021', 'CREDIT', 'INR', TRUE, 0, 0)
ON CONFLICT DO NOTHING;

-- EXPENSES (5000 series)
INSERT INTO accounts (id, tenant_id, code, name, type, is_group, level, path, normal_balance, currency, is_active, opening_balance, current_balance) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5000', 'Expenses', 'EXPENSE', TRUE, 1, '/5000', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5001', 'Salary Expense', 'EXPENSE', FALSE, 2, '/5000/5001', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5002', 'Doctor Consultation Fees', 'EXPENSE', FALSE, 2, '/5000/5002', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5010', 'PF Expense - Employer', 'EXPENSE', FALSE, 2, '/5000/5010', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5011', 'ESI Expense - Employer', 'EXPENSE', FALSE, 2, '/5000/5011', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5020', 'Medical Supplies & Consumables', 'EXPENSE', FALSE, 2, '/5000/5020', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5021', 'Drugs & Medicines', 'EXPENSE', FALSE, 2, '/5000/5021', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5030', 'Rent', 'EXPENSE', FALSE, 2, '/5000/5030', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5031', 'Electricity & Utilities', 'EXPENSE', FALSE, 2, '/5000/5031', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5040', 'Depreciation', 'EXPENSE', FALSE, 2, '/5000/5040', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5050', 'Insurance Premium', 'EXPENSE', FALSE, 2, '/5000/5050', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5060', 'Housekeeping & Laundry', 'EXPENSE', FALSE, 2, '/5000/5060', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5070', 'Administrative Expenses', 'EXPENSE', FALSE, 2, '/5000/5070', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5080', 'Marketing & Advertising', 'EXPENSE', FALSE, 2, '/5000/5080', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5090', 'Bank Charges & Interest', 'EXPENSE', FALSE, 2, '/5000/5090', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5100', 'Discount Allowed', 'EXPENSE', FALSE, 2, '/5000/5100', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5200', 'Claim Write-offs', 'EXPENSE', FALSE, 2, '/5000/5200', 'DEBIT', 'INR', TRUE, 0, 0),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '5201', 'Claim Deductions', 'EXPENSE', FALSE, 2, '/5000/5201', 'DEBIT', 'INR', TRUE, 0, 0)
ON CONFLICT DO NOTHING;

-- ─── Enable all modules for default tenant ────────────────────────────────────
INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at, updated_at)
VALUES
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'auth', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'admin', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'core-accounting', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'general-ledger', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'patient-billing', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'accounts-receivable', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'insurance-tpa', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'accounts-payable', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'procurement', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'cash-bank', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'inventory-finance', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'pharmacy-finance', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'payroll', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'doctor-payout', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'fixed-assets', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'budgeting', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'taxation', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'compliance', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'reporting', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'workflow', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'notifications', TRUE, NOW(), NOW()),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'ai-engine', TRUE, NOW(), NOW())
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- ─── Default Departments ──────────────────────────────────────────────────────
INSERT INTO departments (id, tenant_id, code, name, is_active) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'GEN-MED', 'General Medicine', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'SURGERY', 'Surgery', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'ORTHO', 'Orthopaedics', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'CARDIO', 'Cardiology', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'OBG', 'Obstetrics & Gynaecology', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'PAED', 'Paediatrics', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'ICU', 'Intensive Care Unit', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'OT', 'Operation Theatre', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'LAB', 'Laboratory', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'RADIO', 'Radiology', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'PHARM', 'Pharmacy', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'ADMIN', 'Administration', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'HR', 'Human Resources', TRUE),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'FINANCE', 'Finance', TRUE)
ON CONFLICT DO NOTHING;

-- ─── Default GST Tax Rules ────────────────────────────────────────────────────
INSERT INTO tax_rules (id, tenant_id, code, name, tax_type, rate, is_active) VALUES
(gen_random_uuid(), NULL, 'GST_0', 'GST 0% (Healthcare Services)', 'GST', 0, TRUE),
(gen_random_uuid(), NULL, 'GST_5', 'GST 5%', 'GST', 5, TRUE),
(gen_random_uuid(), NULL, 'GST_12', 'GST 12% (Medicines)', 'GST', 12, TRUE),
(gen_random_uuid(), NULL, 'GST_18', 'GST 18%', 'GST', 18, TRUE),
(gen_random_uuid(), NULL, 'GST_28', 'GST 28%', 'GST', 28, TRUE)
ON CONFLICT DO NOTHING;

-- ─── Summary ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '==============================';
    RAISE NOTICE 'FACT FinOS Seed Data Loaded';
    RAISE NOTICE '==============================';
    RAISE NOTICE 'Tenant: Apollo General Hospital';
    RAISE NOTICE 'Admin Email: admin@apollogeneral.com';
    RAISE NOTICE 'Admin Password: Admin@123';
    RAISE NOTICE 'Fiscal Year: FY 2025-26 (Apr 2025 - Mar 2026)';
    RAISE NOTICE 'Accounts: Hospital Chart of Accounts loaded';
    RAISE NOTICE '==============================';
END $$;
