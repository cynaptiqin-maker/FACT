'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');
const Account      = require('../modules/core-accounting/models/Account');
const FiscalYear   = require('../modules/core-accounting/models/FiscalYear');
const JournalEntry = require('../modules/core-accounting/models/JournalEntry');
const JournalLine  = require('../modules/core-accounting/models/JournalLine');
const Asset        = require('../modules/fixed-assets/models/Asset');
const PatientInvoice = require('../modules/patient-billing/models/PatientInvoice');

// ─── Constants ────────────────────────────────────────────────────────────────
const T   = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
const SYS = '11111111-1111-1111-1111-111111111111'; // seed admin
const FY  = '22222222-2222-2222-2222-222222222222'; // fiscal year id

// New seed IDs
const V1 = 'd1000001-0000-0000-0000-000000000001'; // vendor: Becton Dickinson
const V2 = 'd1000002-0000-0000-0000-000000000001'; // vendor: Siemens Healthineers
const V3 = 'd1000003-0000-0000-0000-000000000001'; // vendor: Cipla Ltd
const E1 = 'e0000001-0000-0000-0000-000000000001'; // employee: Dr. Priya Sharma
const E2 = 'e0000002-0000-0000-0000-000000000001'; // employee: Rajesh Kumar (nurse)
const E3 = 'e0000003-0000-0000-0000-000000000001'; // employee: Anita Singh (admin)
const PR1 = 'ba000001-0000-0000-0000-000000000001'; // payroll run: Apr 2026
const FCRA_REG1 = 'f0000001-0000-0000-0000-000000000001'; // FCRA registration
const FCRA_BANK1 = 'fb000001-0000-0000-0000-000000000001'; // FCRA bank account
const CLAIM1 = 'ca000001-0000-0000-0000-000000000001';
const CLAIM2 = 'ca000002-0000-0000-0000-000000000001';
const CLAIM3 = 'ca000003-0000-0000-0000-000000000001';

const CAT_MEDICAL = 'cc000001-0000-0000-0000-000000000001'; // asset category
const CAT_FURN    = 'cc000002-0000-0000-0000-000000000001';
const CAT_IT      = 'cc000003-0000-0000-0000-000000000001';

// ─── Account ID Map ───────────────────────────────────────────────────────────
const A = {
  // ASSET – Current
  CURRENT_ASSETS:   'ac100000-0000-0000-0000-000000000001',
  CASH_BANK:        'ac110000-0000-0000-0000-000000000001',
  PETTY_CASH:       'ac110100-0000-0000-0000-000000000001',
  SBI_CURRENT:      'ac110200-0000-0000-0000-000000000001',
  HDFC_CURRENT:     'ac110300-0000-0000-0000-000000000001',
  RECEIVABLES:      'ac120000-0000-0000-0000-000000000001',
  PATIENT_RECV:     'ac120100-0000-0000-0000-000000000001',
  TPA_RECV:         'ac120200-0000-0000-0000-000000000001',
  CORP_RECV:        'ac120300-0000-0000-0000-000000000001',
  INVENTORIES:      'ac130000-0000-0000-0000-000000000001',
  PHARMACY_STOCK:   'ac130100-0000-0000-0000-000000000001',
  MED_CONSUMABLES:  'ac130200-0000-0000-0000-000000000001',
  LAB_REAGENTS:     'ac130300-0000-0000-0000-000000000001',
  PREPAID:          'ac140000-0000-0000-0000-000000000001',
  ADVANCE_SUPP:     'ac140100-0000-0000-0000-000000000001',

  // ASSET – Fixed
  FIXED_ASSETS:     'ac200000-0000-0000-0000-000000000001',
  MED_EQUIP_GRP:    'ac210000-0000-0000-0000-000000000001',
  MRI_SCANNER:      'ac210100-0000-0000-0000-000000000001',
  CT_SCANNER:       'ac210200-0000-0000-0000-000000000001',
  ULTRASOUND:       'ac210300-0000-0000-0000-000000000001',
  XRAY:             'ac210400-0000-0000-0000-000000000001',
  ICU_MONITORS:     'ac210500-0000-0000-0000-000000000001',
  FURN_GRP:         'ac220000-0000-0000-0000-000000000001',
  HOSP_BEDS:        'ac220100-0000-0000-0000-000000000001',
  OFFICE_FURN:      'ac220200-0000-0000-0000-000000000001',
  IT_GRP:           'ac230000-0000-0000-0000-000000000001',
  COMPUTERS:        'ac230100-0000-0000-0000-000000000001',
  ACCUM_DEPR:       'ac290000-0000-0000-0000-000000000001',
  ACCUM_DEPR_EQ:    'ac290100-0000-0000-0000-000000000001',
  ACCUM_DEPR_FN:    'ac290200-0000-0000-0000-000000000001',
  ACCUM_DEPR_IT:    'ac290300-0000-0000-0000-000000000001',

  // LIABILITY – Current
  CURR_LIAB:        'ac300000-0000-0000-0000-000000000001',
  TRADE_PAY:        'ac310000-0000-0000-0000-000000000001',
  SUNDRY_CRED:      'ac310100-0000-0000-0000-000000000001',
  PHARMA_PAY:       'ac310200-0000-0000-0000-000000000001',
  TAX_LIAB:         'ac320000-0000-0000-0000-000000000001',
  CGST_PAY:         'ac320100-0000-0000-0000-000000000001',
  SGST_PAY:         'ac320200-0000-0000-0000-000000000001',
  TDS_PAY:          'ac320300-0000-0000-0000-000000000001',
  PF_PAY:           'ac320400-0000-0000-0000-000000000001',
  SAL_PAY:          'ac330000-0000-0000-0000-000000000001',
  DOCTOR_SAL_PAY:   'ac330100-0000-0000-0000-000000000001',
  STAFF_SAL_PAY:    'ac330200-0000-0000-0000-000000000001',
  PAT_DEPOSITS:     'ac340000-0000-0000-0000-000000000001',
  IP_DEPOSITS:      'ac340100-0000-0000-0000-000000000001',
  OP_DEPOSITS:      'ac340200-0000-0000-0000-000000000001',

  // LIABILITY – Long Term
  LT_LIAB:          'ac400000-0000-0000-0000-000000000001',
  LOANS_GRP:        'ac410000-0000-0000-0000-000000000001',
  SBI_TERM_LOAN:    'ac410100-0000-0000-0000-000000000001',

  // EQUITY
  EQUITY:           'ac500000-0000-0000-0000-000000000001',
  SHARE_CAP:        'ac510000-0000-0000-0000-000000000001',
  PAID_UP_CAP:      'ac510100-0000-0000-0000-000000000001',
  RESERVES:         'ac520000-0000-0000-0000-000000000001',
  GEN_RESERVE:      'ac520100-0000-0000-0000-000000000001',
  RETAINED_EARN:    'ac520200-0000-0000-0000-000000000001',

  // INCOME
  REVENUE:          'ac600000-0000-0000-0000-000000000001',
  OPD_REV:          'ac610000-0000-0000-0000-000000000001',
  CONSULTATION:     'ac610100-0000-0000-0000-000000000001',
  PROCEDURE:        'ac610200-0000-0000-0000-000000000001',
  IPD_REV:          'ac620000-0000-0000-0000-000000000001',
  ROOM_CHARGES:     'ac620100-0000-0000-0000-000000000001',
  ICU_CHARGES:      'ac620200-0000-0000-0000-000000000001',
  OT_CHARGES:       'ac620300-0000-0000-0000-000000000001',
  NURSING_CHARGES:  'ac620400-0000-0000-0000-000000000001',
  PHARM_REV:        'ac630000-0000-0000-0000-000000000001',
  PHARMACY_SALES:   'ac630100-0000-0000-0000-000000000001',
  DIAG_REV:         'ac640000-0000-0000-0000-000000000001',
  LAB_REV:          'ac640100-0000-0000-0000-000000000001',
  RADIOLOGY_REV:    'ac640200-0000-0000-0000-000000000001',
  INS_REV:          'ac650000-0000-0000-0000-000000000001',
  TPA_SETTLEMENT:   'ac650100-0000-0000-0000-000000000001',
  OTHER_INC:        'ac690000-0000-0000-0000-000000000001',
  INTEREST_INC:     'ac690100-0000-0000-0000-000000000001',
  MISC_INC:         'ac690200-0000-0000-0000-000000000001',

  // EXPENSE
  EXPENSES:         'ac700000-0000-0000-0000-000000000001',
  EMP_COSTS:        'ac710000-0000-0000-0000-000000000001',
  DOCTOR_SAL:       'ac710100-0000-0000-0000-000000000001',
  NURSING_SAL:      'ac710200-0000-0000-0000-000000000001',
  ADMIN_SAL:        'ac710300-0000-0000-0000-000000000001',
  PF_CONTRIB:       'ac710400-0000-0000-0000-000000000001',
  CLINICAL_EXP:     'ac720000-0000-0000-0000-000000000001',
  PHARMACY_COST:    'ac720100-0000-0000-0000-000000000001',
  CONSUMABLE_COST:  'ac720200-0000-0000-0000-000000000001',
  LAB_REAGENT_COST: 'ac720300-0000-0000-0000-000000000001',
  ADMIN_EXP:        'ac730000-0000-0000-0000-000000000001',
  RENT_EXP:         'ac730100-0000-0000-0000-000000000001',
  ELECTRICITY:      'ac730200-0000-0000-0000-000000000001',
  TELEPHONE:        'ac730300-0000-0000-0000-000000000001',
  OFFICE_SUPPLIES:  'ac730400-0000-0000-0000-000000000001',
  MAINT_EXP:        'ac740000-0000-0000-0000-000000000001',
  EQUIP_MAINT:      'ac740100-0000-0000-0000-000000000001',
  BLDG_MAINT:       'ac740200-0000-0000-0000-000000000001',
  FIN_COSTS:        'ac750000-0000-0000-0000-000000000001',
  BANK_INTEREST:    'ac750100-0000-0000-0000-000000000001',
  BANK_CHARGES:     'ac750200-0000-0000-0000-000000000001',
  DEPR_EXP:         'ac760000-0000-0000-0000-000000000001',
  DEPR_MED_EQ:      'ac760100-0000-0000-0000-000000000001',
  DEPR_FURN:        'ac760200-0000-0000-0000-000000000001',
  DEPR_IT:          'ac760300-0000-0000-0000-000000000001',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const acc = (id, code, name, type, sub_type, parent_id, level, isGroup, bal = 0, extra = {}) => ({
  id, tenant_id: T, code, name, type, sub_type,
  parent_id: parent_id || null,
  level, is_group: isGroup,
  path: null,
  allow_direct_posting: !isGroup,
  current_balance: bal,
  opening_balance: bal,
  created_by: SYS,
  ...extra,
});

// ─── Seed Functions ───────────────────────────────────────────────────────────
async function clearTenantData() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  const w = `WHERE tenant_id = '${T}'`;
  // Delete in FK-safe dependency order
  await q(`DELETE FROM financial_exceptions ${w}`);
  await q(`DELETE FROM period_close_log ${w}`);
  await q(`DELETE FROM payslips ${w}`);
  await q(`DELETE FROM payroll_runs ${w}`);
  await q(`DELETE FROM salary_structures ${w}`);
  await q(`DELETE FROM employees ${w}`);
  await q(`DELETE FROM vendor_payments ${w}`);
  await q(`DELETE FROM tds_deductions ${w}`);
  await q(`DELETE FROM vendor_invoices ${w}`);
  await q(`DELETE FROM vendors ${w}`);
  await q(`DELETE FROM bank_transactions ${w}`);
  await q(`DELETE FROM bank_accounts ${w}`);
  await q(`DELETE FROM accounting_periods ${w}`);
  await q(`DELETE FROM invoice_line_items ${w}`);
  await q(`DELETE FROM payments ${w}`);
  // FCRA cleanup
  await q(`DELETE FROM fcra_utilisations ${w}`);
  await q(`DELETE FROM fcra_receipts ${w}`);
  await q(`DELETE FROM fcra_projects ${w}`);
  await q(`DELETE FROM fcra_assets ${w}`);
  await q(`DELETE FROM fcra_bank_accounts ${w}`);
  await q(`DELETE FROM fcra_registrations ${w}`);
  // Claims cleanup
  await q(`DELETE FROM claims ${w}`);
  await q(`DELETE FROM journal_lines ${w}`);
  await q(`DELETE FROM journal_entries ${w}`);
  await q(`DELETE FROM patient_invoices ${w}`);
  await q(`DELETE FROM assets ${w}`);
  await q(`DELETE FROM asset_categories ${w}`);
  await q(`UPDATE accounts SET parent_id = NULL ${w}`);
  await q(`DELETE FROM accounts ${w}`);
  await q(`DELETE FROM fiscal_years ${w}`);
  console.log('  ✓ Cleared existing tenant data');
}

async function seedAssetCategories() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  await q(`
    INSERT INTO asset_categories (id, tenant_id, code, name, created_at)
    VALUES
      ('${CAT_MEDICAL}', '${T}', 'MED-EQUIP', 'Medical Equipment',    NOW()),
      ('${CAT_FURN}',    '${T}', 'FURN-FIX',  'Furniture & Fixtures', NOW()),
      ('${CAT_IT}',      '${T}', 'IT-TECH',   'IT & Technology',      NOW())
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  ✓ Asset categories');
}

async function seedFiscalYear() {
  await FiscalYear.create({
    id: FY, tenant_id: T,
    name: 'FY 2025-26',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    status: 'ACTIVE',
    is_current: true,
    opening_entries_posted: true,
    created_by: SYS,
  });
  console.log('  ✓ Fiscal year');
}

async function seedAccounts() {
  const rows = [
    // ── ASSET L1 ──────────────────────────────────────────────────────────────
    acc(A.CURRENT_ASSETS, '1000', 'Current Assets',   'ASSET', 'CURRENT_ASSET', null, 1, true),
    acc(A.FIXED_ASSETS,   '2000', 'Fixed Assets',      'ASSET', 'FIXED_ASSET',   null, 1, true),

    // ── ASSET L2 ──────────────────────────────────────────────────────────────
    acc(A.CASH_BANK,     '1100', 'Cash & Bank',                 'ASSET', 'CURRENT_ASSET', A.CURRENT_ASSETS, 2, true),
    acc(A.RECEIVABLES,   '1200', 'Receivables',                 'ASSET', 'CURRENT_ASSET', A.CURRENT_ASSETS, 2, true),
    acc(A.INVENTORIES,   '1300', 'Inventories',                 'ASSET', 'CURRENT_ASSET', A.CURRENT_ASSETS, 2, true),
    acc(A.PREPAID,       '1400', 'Prepaid & Advances',          'ASSET', 'CURRENT_ASSET', A.CURRENT_ASSETS, 2, true),
    acc(A.MED_EQUIP_GRP, '2100', 'Medical Equipment',           'ASSET', 'FIXED_ASSET',   A.FIXED_ASSETS,   2, true),
    acc(A.FURN_GRP,      '2200', 'Furniture & Fixtures',        'ASSET', 'FIXED_ASSET',   A.FIXED_ASSETS,   2, true),
    acc(A.IT_GRP,        '2300', 'IT & Technology',             'ASSET', 'FIXED_ASSET',   A.FIXED_ASSETS,   2, true),
    acc(A.ACCUM_DEPR,    '2900', 'Accumulated Depreciation',    'ASSET', 'FIXED_ASSET',   A.FIXED_ASSETS,   2, true),

    // ── ASSET L3 ──────────────────────────────────────────────────────────────
    acc(A.PETTY_CASH,    '1101', 'Petty Cash',                      'ASSET', 'CURRENT_ASSET', A.CASH_BANK,     3, false, 85000,     { is_cash_account: true }),
    acc(A.SBI_CURRENT,   '1102', 'SBI Current Account',             'ASSET', 'CURRENT_ASSET', A.CASH_BANK,     3, false, 18500000,  { is_bank_account: true, bank_name: 'State Bank of India', bank_account_number: '39847623001', bank_ifsc: 'SBIN0030001', bank_branch: 'Koramangala, Bengaluru' }),
    acc(A.HDFC_CURRENT,  '1103', 'HDFC Current Account',            'ASSET', 'CURRENT_ASSET', A.CASH_BANK,     3, false, 10000000,  { is_bank_account: true, bank_name: 'HDFC Bank', bank_account_number: '50200091234567', bank_ifsc: 'HDFC0001234', bank_branch: 'Indiranagar, Bengaluru' }),
    acc(A.PATIENT_RECV,  '1201', 'Patient Receivables',             'ASSET', 'CURRENT_ASSET', A.RECEIVABLES,   3, false, 4200000,   { is_control_account: true }),
    acc(A.TPA_RECV,      '1202', 'TPA & Insurance Receivables',     'ASSET', 'CURRENT_ASSET', A.RECEIVABLES,   3, false, 5900000,   { is_control_account: true }),
    acc(A.CORP_RECV,     '1203', 'Corporate Receivables',           'ASSET', 'CURRENT_ASSET', A.RECEIVABLES,   3, false, 0),
    acc(A.PHARMACY_STOCK,'1301', 'Pharmacy & Drug Stock',           'ASSET', 'CURRENT_ASSET', A.INVENTORIES,   3, false, 3135000),
    acc(A.MED_CONSUMABLES,'1302','Medical Consumables',             'ASSET', 'CURRENT_ASSET', A.INVENTORIES,   3, false, 1235000),
    acc(A.LAB_REAGENTS,  '1303', 'Lab Reagents & Kits',             'ASSET', 'CURRENT_ASSET', A.INVENTORIES,   3, false, 655000),
    acc(A.ADVANCE_SUPP,  '1401', 'Advance to Suppliers',            'ASSET', 'CURRENT_ASSET', A.PREPAID,       3, false, 250000),
    acc(A.MRI_SCANNER,   '2101', 'MRI Scanner – 1.5T Siemens',      'ASSET', 'FIXED_ASSET',   A.MED_EQUIP_GRP, 3, false, 45000000),
    acc(A.CT_SCANNER,    '2102', 'CT Scanner – 64 Slice GE',        'ASSET', 'FIXED_ASSET',   A.MED_EQUIP_GRP, 3, false, 28000000),
    acc(A.ULTRASOUND,    '2103', 'Ultrasound – Color Doppler',       'ASSET', 'FIXED_ASSET',   A.MED_EQUIP_GRP, 3, false, 1200000),
    acc(A.XRAY,          '2104', 'Digital X-Ray Machine',           'ASSET', 'FIXED_ASSET',   A.MED_EQUIP_GRP, 3, false, 3500000),
    acc(A.ICU_MONITORS,  '2105', 'ICU Patient Monitors (10 units)', 'ASSET', 'FIXED_ASSET',   A.MED_EQUIP_GRP, 3, false, 2800000),
    acc(A.HOSP_BEDS,     '2201', 'Hospital Beds (50 units)',         'ASSET', 'FIXED_ASSET',   A.FURN_GRP,      3, false, 3500000),
    acc(A.OFFICE_FURN,   '2202', 'Office Furniture & Fittings',     'ASSET', 'FIXED_ASSET',   A.FURN_GRP,      3, false, 850000),
    acc(A.COMPUTERS,     '2301', 'Computers, Servers & Network',    'ASSET', 'FIXED_ASSET',   A.IT_GRP,        3, false, 1200000),
    acc(A.ACCUM_DEPR_EQ, '2901', 'Accum. Depr – Medical Equipment', 'ASSET', 'FIXED_ASSET',   A.ACCUM_DEPR,    3, false, -562500),
    acc(A.ACCUM_DEPR_FN, '2902', 'Accum. Depr – Furniture',         'ASSET', 'FIXED_ASSET',   A.ACCUM_DEPR,    3, false, -43750),
    acc(A.ACCUM_DEPR_IT, '2903', 'Accum. Depr – IT Equipment',      'ASSET', 'FIXED_ASSET',   A.ACCUM_DEPR,    3, false, -30000),

    // ── LIABILITY L1 ──────────────────────────────────────────────────────────
    acc(A.CURR_LIAB, '3000', 'Current Liabilities', 'LIABILITY', 'CURRENT_LIABILITY', null, 1, true),
    acc(A.LT_LIAB,   '4000', 'Long-Term Liabilities','LIABILITY', 'LONG_TERM_LIABILITY', null, 1, true),

    // ── LIABILITY L2 ──────────────────────────────────────────────────────────
    acc(A.TRADE_PAY,    '3100', 'Trade Payables',       'LIABILITY', 'CURRENT_LIABILITY', A.CURR_LIAB, 2, true),
    acc(A.TAX_LIAB,     '3200', 'Tax Liabilities',      'LIABILITY', 'CURRENT_LIABILITY', A.CURR_LIAB, 2, true),
    acc(A.SAL_PAY,      '3300', 'Salaries Payable',     'LIABILITY', 'CURRENT_LIABILITY', A.CURR_LIAB, 2, true),
    acc(A.PAT_DEPOSITS, '3400', 'Patient Deposits',     'LIABILITY', 'CURRENT_LIABILITY', A.CURR_LIAB, 2, true),
    acc(A.LOANS_GRP,    '4100', 'Term Loans',           'LIABILITY', 'LONG_TERM_LIABILITY', A.LT_LIAB, 2, true),

    // ── LIABILITY L3 ──────────────────────────────────────────────────────────
    acc(A.SUNDRY_CRED,   '3101', 'Sundry Creditors',           'LIABILITY', 'CURRENT_LIABILITY', A.TRADE_PAY,    3, false, 1950000, { is_control_account: true }),
    acc(A.PHARMA_PAY,    '3102', 'Pharma Vendor Payables',     'LIABILITY', 'CURRENT_LIABILITY', A.TRADE_PAY,    3, false, 514500),
    acc(A.CGST_PAY,      '3201', 'CGST Payable',               'LIABILITY', 'CURRENT_LIABILITY', A.TAX_LIAB,     3, false, 0,        { gst_applicable: true, default_tax_code: 'CGST9' }),
    acc(A.SGST_PAY,      '3202', 'SGST Payable',               'LIABILITY', 'CURRENT_LIABILITY', A.TAX_LIAB,     3, false, 0,        { gst_applicable: true, default_tax_code: 'SGST9' }),
    acc(A.TDS_PAY,       '3203', 'TDS Payable',                'LIABILITY', 'CURRENT_LIABILITY', A.TAX_LIAB,     3, false, 2500,     { tds_applicable: true }),
    acc(A.PF_PAY,        '3204', 'PF Payable',                 'LIABILITY', 'CURRENT_LIABILITY', A.TAX_LIAB,     3, false, 240000),
    acc(A.DOCTOR_SAL_PAY,'3301', 'Doctor Salaries Payable',    'LIABILITY', 'CURRENT_LIABILITY', A.SAL_PAY,      3, false, 1500000),
    acc(A.STAFF_SAL_PAY, '3302', 'Staff Salaries Payable',     'LIABILITY', 'CURRENT_LIABILITY', A.SAL_PAY,      3, false, 800000),
    acc(A.IP_DEPOSITS,   '3401', 'IP Admission Deposits',      'LIABILITY', 'CURRENT_LIABILITY', A.PAT_DEPOSITS, 3, false, 100000),
    acc(A.OP_DEPOSITS,   '3402', 'OPD Advance Deposits',       'LIABILITY', 'CURRENT_LIABILITY', A.PAT_DEPOSITS, 3, false, 35000),
    acc(A.SBI_TERM_LOAN, '4101', 'SBI Term Loan – Equipment',  'LIABILITY', 'LONG_TERM_LIABILITY', A.LOANS_GRP,  3, false, 30000000, { is_bank_account: true, bank_name: 'State Bank of India', bank_account_number: 'TL-39847-2024', bank_ifsc: 'SBIN0030001' }),

    // ── EQUITY L1 & L2 & L3 ───────────────────────────────────────────────────
    acc(A.EQUITY,       '5000', 'Shareholders Equity',    'EQUITY', 'EQUITY', null,       1, true),
    acc(A.SHARE_CAP,    '5100', 'Share Capital',          'EQUITY', 'EQUITY', A.EQUITY,   2, true),
    acc(A.RESERVES,     '5200', 'Reserves & Surplus',     'EQUITY', 'EQUITY', A.EQUITY,   2, true),
    acc(A.PAID_UP_CAP,  '5101', 'Paid-up Share Capital',  'EQUITY', 'EQUITY', A.SHARE_CAP, 3, false, 60000000),
    acc(A.GEN_RESERVE,  '5201', 'General Reserve',        'EQUITY', 'EQUITY', A.RESERVES,  3, false, 18550000),
    acc(A.RETAINED_EARN,'5202', 'Retained Earnings',      'EQUITY', 'EQUITY', A.RESERVES,  3, false, 0),

    // ── INCOME L1 & L2 ────────────────────────────────────────────────────────
    acc(A.REVENUE,      '6000', 'Operating Revenue', 'INCOME', 'OPERATING_INCOME', null,       1, true),
    acc(A.OPD_REV,      '6100', 'OPD Revenue',       'INCOME', 'OPERATING_INCOME', A.REVENUE,  2, true),
    acc(A.IPD_REV,      '6200', 'IPD Revenue',       'INCOME', 'OPERATING_INCOME', A.REVENUE,  2, true),
    acc(A.PHARM_REV,    '6300', 'Pharmacy Revenue',  'INCOME', 'OPERATING_INCOME', A.REVENUE,  2, true),
    acc(A.DIAG_REV,     '6400', 'Diagnostic Revenue','INCOME', 'OPERATING_INCOME', A.REVENUE,  2, true),
    acc(A.INS_REV,      '6500', 'Insurance & TPA Revenue', 'INCOME', 'OPERATING_INCOME', A.REVENUE, 2, true),
    acc(A.OTHER_INC,    '6900', 'Other Income',      'INCOME', 'OTHER_INCOME',      A.REVENUE,  2, true),

    // ── INCOME L3 ─────────────────────────────────────────────────────────────
    acc(A.CONSULTATION,    '6101', 'Consultation Fees',           'INCOME', 'OPERATING_INCOME', A.OPD_REV,   3, false, 400000),
    acc(A.PROCEDURE,       '6102', 'Procedure Charges',           'INCOME', 'OPERATING_INCOME', A.OPD_REV,   3, false, 125000),
    acc(A.ROOM_CHARGES,    '6201', 'Room & Boarding Charges',     'INCOME', 'OPERATING_INCOME', A.IPD_REV,   3, false, 480000),
    acc(A.ICU_CHARGES,     '6202', 'ICU Charges',                 'INCOME', 'OPERATING_INCOME', A.IPD_REV,   3, false, 530000),
    acc(A.OT_CHARGES,      '6203', 'OT & Surgery Charges',        'INCOME', 'OPERATING_INCOME', A.IPD_REV,   3, false, 350000),
    acc(A.NURSING_CHARGES, '6204', 'Nursing Charges',             'INCOME', 'OPERATING_INCOME', A.IPD_REV,   3, false, 70000),
    acc(A.PHARMACY_SALES,  '6301', 'Pharmacy Sales',              'INCOME', 'OPERATING_INCOME', A.PHARM_REV, 3, false, 160000,   { gst_applicable: true }),
    acc(A.LAB_REV,         '6401', 'Pathology & Lab Revenue',     'INCOME', 'OPERATING_INCOME', A.DIAG_REV,  3, false, 215000),
    acc(A.RADIOLOGY_REV,   '6402', 'Radiology Revenue',           'INCOME', 'OPERATING_INCOME', A.DIAG_REV,  3, false, 100000),
    acc(A.TPA_SETTLEMENT,  '6501', 'TPA Settlement Revenue',      'INCOME', 'OPERATING_INCOME', A.INS_REV,   3, false, 0),
    acc(A.INTEREST_INC,    '6901', 'Interest Income',             'INCOME', 'OTHER_INCOME',      A.OTHER_INC, 3, false, 42000),
    acc(A.MISC_INC,        '6902', 'Miscellaneous Income',        'INCOME', 'OTHER_INCOME',      A.OTHER_INC, 3, false, 15000),

    // ── EXPENSE L1 & L2 ───────────────────────────────────────────────────────
    acc(A.EXPENSES,     '7000', 'Operating Expenses',           'EXPENSE', 'OPERATING_EXPENSE', null,       1, true),
    acc(A.EMP_COSTS,    '7100', 'Employee Costs',               'EXPENSE', 'OPERATING_EXPENSE', A.EXPENSES, 2, true),
    acc(A.CLINICAL_EXP, '7200', 'Clinical & Medical Expenses',  'EXPENSE', 'OPERATING_EXPENSE', A.EXPENSES, 2, true),
    acc(A.ADMIN_EXP,    '7300', 'Administrative Expenses',      'EXPENSE', 'OPERATING_EXPENSE', A.EXPENSES, 2, true),
    acc(A.MAINT_EXP,    '7400', 'Maintenance Expenses',         'EXPENSE', 'OPERATING_EXPENSE', A.EXPENSES, 2, true),
    acc(A.FIN_COSTS,    '7500', 'Finance Costs',                'EXPENSE', 'FINANCE_COST',      A.EXPENSES, 2, true),
    acc(A.DEPR_EXP,     '7600', 'Depreciation',                 'EXPENSE', 'DEPRECIATION',      A.EXPENSES, 2, true),

    // ── EXPENSE L3 ────────────────────────────────────────────────────────────
    acc(A.DOCTOR_SAL,      '7101', 'Doctor Salaries & Fees',        'EXPENSE', 'OPERATING_EXPENSE', A.EMP_COSTS,    3, false, 3700000),
    acc(A.NURSING_SAL,     '7102', 'Nursing Staff Salaries',        'EXPENSE', 'OPERATING_EXPENSE', A.EMP_COSTS,    3, false, 3100000),
    acc(A.ADMIN_SAL,       '7103', 'Admin & Support Staff Salaries','EXPENSE', 'OPERATING_EXPENSE', A.EMP_COSTS,    3, false, 2500000),
    acc(A.PF_CONTRIB,      '7104', 'PF Contribution – Employer',    'EXPENSE', 'OPERATING_EXPENSE', A.EMP_COSTS,    3, false, 465000),
    acc(A.PHARMACY_COST,   '7201', 'Pharmacy & Drugs Cost',         'EXPENSE', 'OPERATING_EXPENSE', A.CLINICAL_EXP, 3, false, 980000),
    acc(A.CONSUMABLE_COST, '7202', 'Medical Consumables Cost',      'EXPENSE', 'OPERATING_EXPENSE', A.CLINICAL_EXP, 3, false, 420000),
    acc(A.LAB_REAGENT_COST,'7203', 'Lab Reagents & Supplies',       'EXPENSE', 'OPERATING_EXPENSE', A.CLINICAL_EXP, 3, false, 185000),
    acc(A.RENT_EXP,        '7301', 'Rent Expense',                  'EXPENSE', 'OPERATING_EXPENSE', A.ADMIN_EXP,    3, false, 350000),
    acc(A.ELECTRICITY,     '7302', 'Electricity & Power',           'EXPENSE', 'OPERATING_EXPENSE', A.ADMIN_EXP,    3, false, 180000),
    acc(A.TELEPHONE,       '7303', 'Telephone & Internet',          'EXPENSE', 'OPERATING_EXPENSE', A.ADMIN_EXP,    3, false, 48000),
    acc(A.OFFICE_SUPPLIES, '7304', 'Office Supplies & Stationery',  'EXPENSE', 'OPERATING_EXPENSE', A.ADMIN_EXP,    3, false, 32000),
    acc(A.EQUIP_MAINT,     '7401', 'Medical Equipment Maintenance', 'EXPENSE', 'OPERATING_EXPENSE', A.MAINT_EXP,    3, false, 285000),
    acc(A.BLDG_MAINT,      '7402', 'Building & Civil Maintenance',  'EXPENSE', 'OPERATING_EXPENSE', A.MAINT_EXP,    3, false, 120000),
    acc(A.BANK_INTEREST,   '7501', 'Bank Interest Expense',         'EXPENSE', 'FINANCE_COST',      A.FIN_COSTS,    3, false, 225000),
    acc(A.BANK_CHARGES,    '7502', 'Bank Charges & Commission',     'EXPENSE', 'FINANCE_COST',      A.FIN_COSTS,    3, false, 18000),
    acc(A.DEPR_MED_EQ,     '7601', 'Depr – Medical Equipment',      'EXPENSE', 'DEPRECIATION',      A.DEPR_EXP,     3, false, 562500),
    acc(A.DEPR_FURN,       '7602', 'Depr – Furniture & Fixtures',   'EXPENSE', 'DEPRECIATION',      A.DEPR_EXP,     3, false, 43750),
    acc(A.DEPR_IT,         '7603', 'Depr – IT Equipment',           'EXPENSE', 'DEPRECIATION',      A.DEPR_EXP,     3, false, 30000),
  ];

  // Insert in 3 passes to respect self-referential FK (parent must exist before child)
  const l1 = rows.filter(r => r.level === 1);
  const l2 = rows.filter(r => r.level === 2);
  const l3 = rows.filter(r => r.level === 3);
  await Account.bulkCreate(l1);
  await Account.bulkCreate(l2);
  await Account.bulkCreate(l3);
  console.log(`  ✓ ${rows.length} accounts`);
}

// ─── Journal Entry Helper ─────────────────────────────────────────────────────
async function createJE(entry, lines) {
  const je = await JournalEntry.create({ ...entry, tenant_id: T, fiscal_year_id: FY, created_by: SYS });
  const lineRows = lines.map((l, i) => ({
    id: require('crypto').randomUUID(),
    journal_entry_id: je.id,
    tenant_id: T,
    line_number: i + 1,
    account_id: l.account_id,
    debit_amount:  l.dr || 0,
    credit_amount: l.cr || 0,
    narration: l.narration || null,
    party_type: l.party_type || null,
    party_id:   l.party_id   || null,
  }));
  await JournalLine.bulkCreate(lineRows);
  return je;
}

async function seedJournals() {
  // ── JE01 Opening Balances ──────────────────────────────────────────────────
  await createJE(
    { entry_number: 'OB-2025-000001', voucher_type: 'OPENING', date: '2025-04-01',
      narration: 'Opening balances for FY 2025-26 – Medanta Super Specialty Hospital', status: 'POSTED',
      total_debit: 113200000, total_credit: 113200000 },
    [
      { account_id: A.PETTY_CASH,     dr: 100000 },
      { account_id: A.SBI_CURRENT,    dr: 15000000 },
      { account_id: A.HDFC_CURRENT,   dr: 8000000 },
      { account_id: A.PATIENT_RECV,   dr: 3500000 },
      { account_id: A.TPA_RECV,       dr: 5200000 },
      { account_id: A.PHARMACY_STOCK, dr: 2800000 },
      { account_id: A.MED_CONSUMABLES,dr: 900000 },
      { account_id: A.MRI_SCANNER,    dr: 45000000 },
      { account_id: A.CT_SCANNER,     dr: 28000000 },
      { account_id: A.HOSP_BEDS,      dr: 3500000 },
      { account_id: A.COMPUTERS,      dr: 1200000 },
      { account_id: A.SUNDRY_CRED,    cr: 2800000 },
      { account_id: A.DOCTOR_SAL_PAY, cr: 1500000 },
      { account_id: A.TDS_PAY,        cr: 350000 },
      { account_id: A.SBI_TERM_LOAN,  cr: 30000000 },
      { account_id: A.PAID_UP_CAP,    cr: 60000000 },
      { account_id: A.GEN_RESERVE,    cr: 18550000 },
    ]
  );

  // ── JE02 OPD Revenue ──────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'SV-2025-000001', voucher_type: 'SALES', date: '2025-04-05',
      narration: 'OPD consultation revenue – April 5 batch (42 patients)', status: 'POSTED',
      total_debit: 250000, total_credit: 250000 },
    [
      { account_id: A.PATIENT_RECV, dr: 250000 },
      { account_id: A.CONSULTATION, cr: 250000 },
    ]
  );

  // ── JE03 Pharmacy Sales ────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'SV-2025-000002', voucher_type: 'SALES', date: '2025-04-08',
      narration: 'Retail pharmacy sales – April 8', status: 'POSTED',
      total_debit: 185000, total_credit: 185000 },
    [
      { account_id: A.PATIENT_RECV,  dr: 185000 },
      { account_id: A.PHARMACY_SALES, cr: 185000 },
    ]
  );

  // ── JE04 Cash Receipt from Patients ───────────────────────────────────────
  await createJE(
    { entry_number: 'RV-2025-000001', voucher_type: 'RECEIPT', date: '2025-04-10',
      narration: 'Cash & card collection from OPD patients – April 10', status: 'POSTED',
      total_debit: 250000, total_credit: 250000 },
    [
      { account_id: A.SBI_CURRENT,  dr: 250000 },
      { account_id: A.PATIENT_RECV, cr: 250000 },
    ]
  );

  // ── JE05 Lab Revenue ──────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'SV-2025-000003', voucher_type: 'SALES', date: '2025-04-12',
      narration: 'Pathology lab revenue – April 12', status: 'POSTED',
      total_debit: 95000, total_credit: 95000 },
    [
      { account_id: A.PATIENT_RECV, dr: 95000 },
      { account_id: A.LAB_REV,      cr: 95000 },
    ]
  );

  // ── JE06 IPD Billing ──────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'SV-2025-000004', voucher_type: 'SALES', date: '2025-04-15',
      narration: 'IPD discharge billing – Pt Ramesh Kumar, Ward B, 6-night stay', status: 'POSTED',
      total_debit: 320000, total_credit: 320000 },
    [
      { account_id: A.PATIENT_RECV,   dr: 320000 },
      { account_id: A.ROOM_CHARGES,   cr: 200000, narration: 'Room charges 6 nights × ₹33,333' },
      { account_id: A.NURSING_CHARGES,cr: 70000 },
      { account_id: A.ICU_CHARGES,    cr: 50000,  narration: '2 days ICU stay' },
    ]
  );

  // ── JE07 Salary – April 2025 ──────────────────────────────────────────────
  await createJE(
    { entry_number: 'PV-2025-000001', voucher_type: 'PAYMENT', date: '2025-04-30',
      narration: 'Salary disbursement – April 2025 | 98 employees | Net NEFT to SBI',
      status: 'POSTED', total_debit: 4500000, total_credit: 4500000 },
    [
      { account_id: A.DOCTOR_SAL,  dr: 1800000 },
      { account_id: A.NURSING_SAL, dr: 1500000 },
      { account_id: A.ADMIN_SAL,   dr: 1200000 },
      { account_id: A.SBI_CURRENT, cr: 4050000, narration: 'Net salary NEFT' },
      { account_id: A.TDS_PAY,     cr: 225000,  narration: 'TDS u/s 192 deducted' },
      { account_id: A.PF_PAY,      cr: 225000,  narration: 'PF employee deduction' },
    ]
  );

  // ── JE08 Rent Payment ─────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'PV-2025-000002', voucher_type: 'PAYMENT', date: '2025-05-01',
      narration: 'Monthly rent – Hospital premises, Koramangala, May 2025',
      status: 'POSTED', total_debit: 350000, total_credit: 350000 },
    [
      { account_id: A.RENT_EXP,    dr: 350000 },
      { account_id: A.SBI_CURRENT, cr: 350000 },
    ]
  );

  // ── JE09 Electricity ──────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'PV-2025-000003', voucher_type: 'PAYMENT', date: '2025-05-05',
      narration: 'BESCOM electricity bill – April 2025 (312 units @ ₹577/unit)',
      status: 'POSTED', total_debit: 180000, total_credit: 180000 },
    [
      { account_id: A.ELECTRICITY, dr: 180000 },
      { account_id: A.SBI_CURRENT, cr: 180000 },
    ]
  );

  // ── JE10 Pharma Vendor Payment ────────────────────────────────────────────
  await createJE(
    { entry_number: 'PV-2025-000004', voucher_type: 'PAYMENT', date: '2025-05-08',
      narration: 'Payment to Sun Pharma Ltd – April outstanding invoices',
      reference: 'SUNPH/2025/APR/0028', status: 'POSTED',
      total_debit: 850000, total_credit: 850000 },
    [
      { account_id: A.PHARMA_PAY,  dr: 850000 },
      { account_id: A.SBI_CURRENT, cr: 807500, narration: 'Net payment after TDS' },
      { account_id: A.TDS_PAY,     cr: 42500,  narration: 'TDS u/s 194C @ 5%' },
    ]
  );

  // ── JE11 TPA Receipt ──────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'RV-2025-000002', voucher_type: 'RECEIPT', date: '2025-05-15',
      narration: 'TPA settlement – Star Health & Allied Insurance, Q4 FY24-25 claims',
      reference: 'STAR/TPA/2025/0391', status: 'POSTED',
      total_debit: 1800000, total_credit: 1800000 },
    [
      { account_id: A.SBI_CURRENT, dr: 1800000 },
      { account_id: A.TPA_RECV,    cr: 1800000, party_type: 'Insurance' },
    ]
  );

  // ── JE12 Medical Supplies Purchase ────────────────────────────────────────
  await createJE(
    { entry_number: 'PU-2025-000001', voucher_type: 'PURCHASE', date: '2025-05-20',
      narration: 'Purchase – medical consumables & lab reagents | Vendor: Becton Dickinson',
      reference: 'BD/INV/2025/4421', status: 'POSTED',
      total_debit: 600000, total_credit: 600000 },
    [
      { account_id: A.MED_CONSUMABLES, dr: 420000 },
      { account_id: A.LAB_REAGENTS,    dr: 180000 },
      { account_id: A.PHARMA_PAY,      cr: 600000, party_type: 'Vendor', narration: 'Payable to Becton Dickinson India Pvt Ltd' },
    ]
  );

  // ── JE13 ICU Billing ──────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'SV-2025-000005', voucher_type: 'SALES', date: '2025-05-22',
      narration: 'ICU billing – Pt Kavitha Menon (ICU-07), 8-day stay post cardiac surgery',
      status: 'POSTED', total_debit: 480000, total_credit: 480000 },
    [
      { account_id: A.PATIENT_RECV, dr: 480000 },
      { account_id: A.ICU_CHARGES,  cr: 480000 },
    ]
  );

  // ── JE14 OT Charges ───────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'SV-2025-000006', voucher_type: 'SALES', date: '2025-05-25',
      narration: 'OT charges – Laparoscopic cholecystectomy, Surgeon Dr. Anand Rao',
      status: 'POSTED', total_debit: 350000, total_credit: 350000 },
    [
      { account_id: A.PATIENT_RECV, dr: 350000 },
      { account_id: A.OT_CHARGES,   cr: 350000 },
    ]
  );

  // ── JE15 Bank Transfer (Contra) ───────────────────────────────────────────
  await createJE(
    { entry_number: 'CV-2025-000001', voucher_type: 'CONTRA', date: '2025-06-01',
      narration: 'Funds transfer SBI → HDFC for vendor payments – June 2025',
      status: 'POSTED', total_debit: 2000000, total_credit: 2000000 },
    [
      { account_id: A.HDFC_CURRENT, dr: 2000000 },
      { account_id: A.SBI_CURRENT,  cr: 2000000 },
    ]
  );

  // ── JE16 GST Payment ──────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'PV-2025-000005', voucher_type: 'PAYMENT', date: '2025-06-10',
      narration: 'GST payment – CGST & SGST for April–May 2025 (GSTIN: 29AABCM1234K1ZR)',
      reference: 'GSTR-3B/2025/Q1', status: 'POSTED',
      total_debit: 250000, total_credit: 250000 },
    [
      { account_id: A.CGST_PAY,    dr: 125000 },
      { account_id: A.SGST_PAY,    dr: 125000 },
      { account_id: A.SBI_CURRENT, cr: 250000 },
    ]
  );

  // ── JE17 TDS Remittance ───────────────────────────────────────────────────
  await createJE(
    { entry_number: 'PV-2025-000006', voucher_type: 'PAYMENT', date: '2025-06-10',
      narration: 'TDS remittance to Income Tax – April–May 2025 | Challan 281',
      status: 'POSTED', total_debit: 267500, total_credit: 267500 },
    [
      { account_id: A.TDS_PAY,     dr: 267500 },
      { account_id: A.SBI_CURRENT, cr: 267500 },
    ]
  );

  // ── JE18 Corporate Billing ────────────────────────────────────────────────
  await createJE(
    { entry_number: 'SV-2025-000007', voucher_type: 'SALES', date: '2025-06-15',
      narration: 'Corporate billing – Infosys Ltd employee health camp, June 2025',
      reference: 'INFY/HEALTH/2025/JUN', status: 'POSTED',
      total_debit: 650000, total_credit: 650000 },
    [
      { account_id: A.CORP_RECV,    dr: 650000,  party_type: 'Corporate' },
      { account_id: A.CONSULTATION, cr: 150000 },
      { account_id: A.ROOM_CHARGES, cr: 280000 },
      { account_id: A.LAB_REV,      cr: 120000 },
      { account_id: A.RADIOLOGY_REV,cr: 100000 },
    ]
  );

  // ── JE19 Corporate Receipt ────────────────────────────────────────────────
  await createJE(
    { entry_number: 'RV-2025-000003', voucher_type: 'RECEIPT', date: '2025-06-20',
      narration: 'Receipt from Infosys Ltd – health camp payment',
      reference: 'INFY/PAY/2025/0634', status: 'POSTED',
      total_debit: 650000, total_credit: 650000 },
    [
      { account_id: A.SBI_CURRENT, dr: 650000 },
      { account_id: A.CORP_RECV,   cr: 650000, party_type: 'Corporate' },
    ]
  );

  // ── JE20 Depreciation Q1 ─────────────────────────────────────────────────
  await createJE(
    { entry_number: 'JV-2025-000001', voucher_type: 'JOURNAL', date: '2025-06-30',
      narration: 'Quarterly depreciation provision – Q1 FY 2025-26 (Apr–Jun 2025)',
      status: 'POSTED', total_debit: 636250, total_credit: 636250 },
    [
      { account_id: A.DEPR_MED_EQ,    dr: 562500, narration: 'SLM on MRI ₹45L + CT ₹28L + X-Ray ₹3.5L @5% pa' },
      { account_id: A.DEPR_FURN,      dr: 43750,  narration: 'SLM on beds ₹3.5L + furniture ₹0.85L @5% pa' },
      { account_id: A.DEPR_IT,        dr: 30000,  narration: 'SLM on computers ₹1.2L @10% pa' },
      { account_id: A.ACCUM_DEPR_EQ,  cr: 562500 },
      { account_id: A.ACCUM_DEPR_FN,  cr: 43750 },
      { account_id: A.ACCUM_DEPR_IT,  cr: 30000 },
    ]
  );

  // ── JE21 Equipment Purchase ────────────────────────────────────────────────
  await createJE(
    { entry_number: 'PU-2025-000002', voucher_type: 'PURCHASE', date: '2025-07-05',
      narration: 'Purchase – Mindray DC-80 Color Doppler Ultrasound System',
      reference: 'MINDRAY/INV/2025/0087', status: 'POSTED',
      total_debit: 1200000, total_credit: 1200000 },
    [
      { account_id: A.ULTRASOUND,  dr: 1200000 },
      { account_id: A.SBI_CURRENT, cr: 1200000 },
    ]
  );

  // ── JE22 Salary – July 2025 ───────────────────────────────────────────────
  await createJE(
    { entry_number: 'PV-2025-000007', voucher_type: 'PAYMENT', date: '2025-07-31',
      narration: 'Salary disbursement – July 2025 | Increment applied for 14 employees',
      status: 'POSTED', total_debit: 4800000, total_credit: 4800000 },
    [
      { account_id: A.DOCTOR_SAL,  dr: 1900000 },
      { account_id: A.NURSING_SAL, dr: 1600000 },
      { account_id: A.ADMIN_SAL,   dr: 1300000 },
      { account_id: A.SBI_CURRENT, cr: 4320000 },
      { account_id: A.TDS_PAY,     cr: 240000 },
      { account_id: A.PF_PAY,      cr: 240000 },
    ]
  );

  // ── JE23 Vendor Debit Note (Return) ───────────────────────────────────────
  await createJE(
    { entry_number: 'DN-2025-000001', voucher_type: 'DEBIT_NOTE', date: '2025-08-10',
      narration: 'Return of expired consumables to Becton Dickinson – Lot#BD2205',
      reference: 'BD/RET/2025/0018', status: 'POSTED',
      total_debit: 85000, total_credit: 85000 },
    [
      { account_id: A.PHARMA_PAY,      dr: 85000 },
      { account_id: A.MED_CONSUMABLES, cr: 85000 },
    ]
  );

  // ── JE24 Patient Credit Note (Refund) ─────────────────────────────────────
  await createJE(
    { entry_number: 'CN-2025-000001', voucher_type: 'CREDIT_NOTE', date: '2025-08-15',
      narration: 'Pharmacy refund – Pt Suresh Nair, unused medicines post-discharge',
      status: 'POSTED', total_debit: 25000, total_credit: 25000 },
    [
      { account_id: A.PHARMACY_SALES, dr: 25000 },
      { account_id: A.SBI_CURRENT,    cr: 25000 },
    ]
  );

  // ── JE25 IP Admission Deposit ─────────────────────────────────────────────
  await createJE(
    { entry_number: 'RV-2025-000004', voucher_type: 'RECEIPT', date: '2025-09-01',
      narration: 'Advance admission deposit – Pt Meena Sharma, Cardiac Surgery pre-admission',
      status: 'POSTED', total_debit: 100000, total_credit: 100000 },
    [
      { account_id: A.SBI_CURRENT, dr: 100000 },
      { account_id: A.IP_DEPOSITS, cr: 100000 },
    ]
  );

  // ── JE26 Pending Approval (DRAFT) ─────────────────────────────────────────
  await createJE(
    { entry_number: 'JV-2025-000002', voucher_type: 'JOURNAL', date: '2025-09-15',
      narration: 'Accrual – outstanding equipment maintenance charges Q2',
      status: 'PENDING_APPROVAL', total_debit: 145000, total_credit: 145000 },
    [
      { account_id: A.EQUIP_MAINT,  dr: 145000 },
      { account_id: A.SUNDRY_CRED,  cr: 145000, narration: 'Accrued to BioMedical Services Pvt Ltd' },
    ]
  );

  // ── JE27 Draft Entry ──────────────────────────────────────────────────────
  await createJE(
    { entry_number: 'PV-2025-000008', voucher_type: 'PAYMENT', date: '2025-09-20',
      narration: 'Proposed: Advance rent payment for Oct 2025 (pending CFO approval)',
      status: 'DRAFT', total_debit: 350000, total_credit: 350000 },
    [
      { account_id: A.RENT_EXP,    dr: 350000 },
      { account_id: A.SBI_CURRENT, cr: 350000 },
    ]
  );

  console.log('  ✓ 27 journal entries with lines');
}

async function seedAssets() {
  const rows = [
    {
      id: 'fa000001-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS,
      asset_code: 'FA-2025-000001', asset_tag: 'MSSH-MRI-001',
      asset_name: 'MRI Scanner – Siemens MAGNETOM Essenza 1.5T',
      description: 'Whole-body 1.5T MRI with Tim Technology, 32-channel coil system',
      category_id: CAT_MEDICAL, manufacturer: 'Siemens Healthineers',
      model_number: 'MAGNETOM-ESSENZA-15', serial_number: 'SH2024MRI0047821',
      purchase_date: '2024-06-15', capitalization_date: '2024-07-01',
      purchase_invoice: 'SH/2024/INV/0234', purchase_cost: 43500000, installation_cost: 1500000,
      salvage_value: 4500000, useful_life_years: 10, depreciation_method: 'SLM', depreciation_rate: 10,
      accumulated_depreciation: 562500, current_book_value: 44437500,
      location: 'Radiology Dept – Ground Floor, Block A',
      asset_account_id: A.MRI_SCANNER, depreciation_account_id: A.DEPR_MED_EQ, accumulated_dep_account_id: A.ACCUM_DEPR_EQ,
      status: 'ACTIVE',
      warranty_expiry: '2027-06-14', amc_expiry: '2026-06-30',
      insurance_policy: 'HDFC-ASSET-2024-MRI001', insurance_expiry: '2025-06-14', insurance_value: 45000000,
    },
    {
      id: 'fa000002-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS,
      asset_code: 'FA-2025-000002', asset_tag: 'MSSH-CT-001',
      asset_name: 'CT Scanner – GE Revolution EVO 64-Slice',
      category_id: CAT_MEDICAL, manufacturer: 'GE Healthcare',
      model_number: 'REVOLUTION-EVO-64', serial_number: 'GE2024CT003912',
      purchase_date: '2024-03-20', capitalization_date: '2024-04-01',
      purchase_invoice: 'GE/2024/INV/0891', purchase_cost: 27500000, installation_cost: 500000,
      salvage_value: 2800000, useful_life_years: 10, depreciation_method: 'SLM', depreciation_rate: 10,
      accumulated_depreciation: 562500, current_book_value: 27437500,
      location: 'Radiology Dept – Ground Floor, Block A',
      asset_account_id: A.CT_SCANNER, depreciation_account_id: A.DEPR_MED_EQ, accumulated_dep_account_id: A.ACCUM_DEPR_EQ,
      status: 'ACTIVE',
      warranty_expiry: '2027-03-19', amc_expiry: '2026-03-31',
      insurance_policy: 'HDFC-ASSET-2024-CT001', insurance_expiry: '2026-03-19', insurance_value: 28000000,
    },
    {
      id: 'fa000003-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS,
      asset_code: 'FA-2025-000003', asset_tag: 'MSSH-USG-001',
      asset_name: 'Ultrasound – Mindray DC-80 Color Doppler',
      category_id: CAT_MEDICAL, manufacturer: 'Mindray',
      model_number: 'DC-80', serial_number: 'MR2025USG00129',
      purchase_date: '2025-07-05', capitalization_date: '2025-07-05',
      purchase_invoice: 'MINDRAY/INV/2025/0087', purchase_cost: 1200000, installation_cost: 0,
      salvage_value: 120000, useful_life_years: 7, depreciation_method: 'SLM', depreciation_rate: 14.28,
      accumulated_depreciation: 0, current_book_value: 1200000,
      location: 'Radiology Dept – First Floor',
      asset_account_id: A.ULTRASOUND, depreciation_account_id: A.DEPR_MED_EQ, accumulated_dep_account_id: A.ACCUM_DEPR_EQ,
      status: 'ACTIVE',
      warranty_expiry: '2028-07-04',
    },
    {
      id: 'fa000004-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS,
      asset_code: 'FA-2025-000004', asset_tag: 'MSSH-XRAY-001',
      asset_name: 'Digital X-Ray – Carestream DRX-Evolution Plus',
      category_id: CAT_MEDICAL, manufacturer: 'Carestream Health',
      model_number: 'DRX-EVOLUTION-PLUS', serial_number: 'CS2023XR009843',
      purchase_date: '2023-11-10', capitalization_date: '2023-11-10',
      purchase_invoice: 'CS/2023/INV/1124', purchase_cost: 3500000, installation_cost: 0,
      salvage_value: 350000, useful_life_years: 10, depreciation_method: 'SLM', depreciation_rate: 10,
      accumulated_depreciation: 262500, current_book_value: 3237500,
      location: 'Radiology Dept – Ground Floor, Block B',
      asset_account_id: A.XRAY, depreciation_account_id: A.DEPR_MED_EQ, accumulated_dep_account_id: A.ACCUM_DEPR_EQ,
      status: 'ACTIVE', warranty_expiry: '2026-11-09', amc_expiry: '2025-11-09',
    },
    {
      id: 'fa000005-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS,
      asset_code: 'FA-2025-000005', asset_tag: 'MSSH-ICUMON-SET',
      asset_name: 'ICU Patient Monitors – Philips IntelliVue MX750 (10 units)',
      category_id: CAT_MEDICAL, manufacturer: 'Philips Healthcare',
      model_number: 'INTELLIVUE-MX750', serial_number: 'PH2024ICU010-019',
      purchase_date: '2024-01-08', capitalization_date: '2024-01-08',
      purchase_invoice: 'PHILIPS/2024/INV/0056', purchase_cost: 2800000, installation_cost: 0,
      salvage_value: 280000, useful_life_years: 8, depreciation_method: 'SLM', depreciation_rate: 12.5,
      accumulated_depreciation: 175000, current_book_value: 2625000,
      location: 'ICU – Second Floor, Block C',
      asset_account_id: A.ICU_MONITORS, depreciation_account_id: A.DEPR_MED_EQ, accumulated_dep_account_id: A.ACCUM_DEPR_EQ,
      status: 'ACTIVE',
    },
    {
      id: 'fa000006-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS,
      asset_code: 'FA-2025-000006', asset_tag: 'MSSH-BEDS-BATCH1',
      asset_name: 'Hospital Beds – Paramount Surgimed (50 units, motorised)',
      category_id: CAT_FURN, manufacturer: 'Paramount Surgimed',
      model_number: 'ICU-PRO-4SEC', serial_number: 'PS2023BED001-050',
      purchase_date: '2023-04-01', capitalization_date: '2023-04-01',
      purchase_invoice: 'PS/2023/INV/0781', purchase_cost: 3500000, installation_cost: 0,
      salvage_value: 350000, useful_life_years: 10, depreciation_method: 'SLM', depreciation_rate: 10,
      accumulated_depreciation: 262500, current_book_value: 3237500,
      location: 'General Wards – Block B & C',
      asset_account_id: A.HOSP_BEDS, depreciation_account_id: A.DEPR_FURN, accumulated_dep_account_id: A.ACCUM_DEPR_FN,
      status: 'ACTIVE',
    },
    {
      id: 'fa000007-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS,
      asset_code: 'FA-2025-000007', asset_tag: 'MSSH-FURN-ADMIN',
      asset_name: 'Office Furniture – Admin Block (workstations, chairs, cabinets)',
      category_id: CAT_FURN, manufacturer: 'Godrej Interio',
      purchase_date: '2023-06-15', capitalization_date: '2023-06-15',
      purchase_invoice: 'GI/2023/INV/0219', purchase_cost: 850000, installation_cost: 0,
      salvage_value: 85000, useful_life_years: 10, depreciation_method: 'SLM', depreciation_rate: 10,
      accumulated_depreciation: 63750, current_book_value: 786250,
      location: 'Admin Block – Fourth Floor',
      asset_account_id: A.OFFICE_FURN, depreciation_account_id: A.DEPR_FURN, accumulated_dep_account_id: A.ACCUM_DEPR_FN,
      status: 'ACTIVE',
    },
    {
      id: 'fa000008-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS,
      asset_code: 'FA-2025-000008', asset_tag: 'MSSH-SERVER-001',
      asset_name: 'Dell PowerEdge R750 Server (HMIS + PACS Primary)',
      category_id: CAT_IT, manufacturer: 'Dell Technologies',
      model_number: 'POWEREDGE-R750', serial_number: 'DEL2023SRV00418',
      purchase_date: '2023-09-01', capitalization_date: '2023-09-01',
      purchase_invoice: 'DELL/2023/INV/0934', purchase_cost: 850000, installation_cost: 50000,
      salvage_value: 90000, useful_life_years: 5, depreciation_method: 'SLM', depreciation_rate: 20,
      accumulated_depreciation: 150000, current_book_value: 750000,
      location: 'IT Server Room – Basement',
      asset_account_id: A.COMPUTERS, depreciation_account_id: A.DEPR_IT, accumulated_dep_account_id: A.ACCUM_DEPR_IT,
      status: 'ACTIVE', warranty_expiry: '2026-08-31', amc_expiry: '2026-08-31',
    },
    {
      id: 'fa000009-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS,
      asset_code: 'FA-2025-000009', asset_tag: 'MSSH-VENT-001',
      asset_name: 'Mechanical Ventilators – Draeger Evita V500 (5 units)',
      category_id: CAT_MEDICAL, manufacturer: 'Drägerwerk AG',
      model_number: 'EVITA-V500', serial_number: 'DR2024VENT001-005',
      purchase_date: '2024-05-10', capitalization_date: '2024-05-10',
      purchase_invoice: 'DRAEGER/2024/INV/0312', purchase_cost: 5500000, installation_cost: 0,
      salvage_value: 550000, useful_life_years: 8, depreciation_method: 'WDV', depreciation_rate: 20,
      accumulated_depreciation: 687500, current_book_value: 4812500,
      location: 'ICU & HDU – Second Floor',
      asset_account_id: A.ICU_MONITORS, depreciation_account_id: A.DEPR_MED_EQ, accumulated_dep_account_id: A.ACCUM_DEPR_EQ,
      status: 'ACTIVE', warranty_expiry: '2027-05-09', amc_expiry: '2026-05-09',
    },
    {
      id: 'fa000010-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS,
      asset_code: 'FA-2025-000010', asset_tag: 'MSSH-CTSCAN-SHLDR',
      asset_name: 'Portable ECG Machine – Schiller AT-102 (3 units)',
      category_id: CAT_MEDICAL, manufacturer: 'Schiller AG',
      model_number: 'AT-102', serial_number: 'SCH2024ECG001-003',
      purchase_date: '2024-09-20', capitalization_date: '2024-09-20',
      purchase_invoice: 'SCHILLER/2024/INV/0551', purchase_cost: 480000, installation_cost: 0,
      salvage_value: 48000, useful_life_years: 7, depreciation_method: 'SLM', depreciation_rate: 14.28,
      accumulated_depreciation: 24000, current_book_value: 456000,
      location: 'Cardiology OPD – Third Floor',
      asset_account_id: A.ICU_MONITORS, depreciation_account_id: A.DEPR_MED_EQ, accumulated_dep_account_id: A.ACCUM_DEPR_EQ,
      status: 'UNDER_MAINTENANCE',
    },
  ];

  await Asset.bulkCreate(rows);
  console.log(`  ✓ ${rows.length} fixed assets`);
}

async function seedPatientInvoices() {
  const patients = [
    { id: 'b1000001-0000-0000-0000-000000000001', name: 'Ramesh Kumar',       uhid: 'MSSH-00001', mobile: '9845001234', email: 'ramesh.kumar@email.com' },
    { id: 'b1000002-0000-0000-0000-000000000001', name: 'Kavitha Menon',       uhid: 'MSSH-00002', mobile: '9980012345', email: 'kavitha.m@email.com' },
    { id: 'b1000003-0000-0000-0000-000000000001', name: 'Suresh Nair',         uhid: 'MSSH-00003', mobile: '8971234560', email: 'suresh.nair@email.com' },
    { id: 'b1000004-0000-0000-0000-000000000001', name: 'Meena Sharma',        uhid: 'MSSH-00004', mobile: '9731112233', email: 'meena.sharma@gmail.com' },
    { id: 'b1000005-0000-0000-0000-000000000001', name: 'Arjun Reddy',         uhid: 'MSSH-00005', mobile: '9876543210', email: 'arjun.reddy@email.com' },
    { id: 'b1000006-0000-0000-0000-000000000001', name: 'Priya Venkatesh',     uhid: 'MSSH-00006', mobile: '9900112233', email: 'priya.v@email.com' },
    { id: 'b1000007-0000-0000-0000-000000000001', name: 'Mohammed Irfan',      uhid: 'MSSH-00007', mobile: '8123456789', email: 'irfan.m@email.com' },
    { id: 'b1000008-0000-0000-0000-000000000001', name: 'Lakshmi Devi',        uhid: 'MSSH-00008', mobile: '9566778899', email: 'lakshmi.d@email.com' },
    { id: 'b1000009-0000-0000-0000-000000000001', name: 'Vikram Singh',        uhid: 'MSSH-00009', mobile: '7012345678', email: 'vikram.s@email.com' },
    { id: 'b100000a-0000-0000-0000-000000000001', name: 'Ananya Krishnamurthy',uhid: 'MSSH-00010', mobile: '9448887766', email: 'ananya.k@email.com' },
  ];

  const rows = [
    {
      id: 'c2000001-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000001',
      patient_id: patients[0].id, patient_name: patients[0].name, patient_uhid: patients[0].uhid,
      patient_mobile: patients[0].mobile, patient_email: patients[0].email,
      billing_type: 'IP', invoice_date: '2025-04-15',
      admission_date: '2025-04-09', discharge_date: '2025-04-15',
      ward: 'General Ward B', bed_number: 'GB-12',
      treating_doctor_name: 'Dr. Anand Rao', department: 'General Surgery',
      gross_amount: 320000, discount_amount: 0, net_amount: 320000,
      paid_amount: 320000, balance_amount: 0,
      patient_share: 320000, status: 'PAID',
    },
    {
      id: 'c2000002-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000002',
      patient_id: patients[1].id, patient_name: patients[1].name, patient_uhid: patients[1].uhid,
      patient_mobile: patients[1].mobile, patient_email: patients[1].email,
      billing_type: 'ICU', invoice_date: '2025-05-22',
      admission_date: '2025-05-14', discharge_date: '2025-05-22',
      ward: 'Cardiac ICU', bed_number: 'ICU-07',
      treating_doctor_name: 'Dr. Ravi Shankar', department: 'Cardiology',
      gross_amount: 480000, discount_amount: 0, net_amount: 480000,
      paid_amount: 250000, balance_amount: 230000,
      patient_share: 250000, insurance_share: 230000,
      is_credit_bill: true, status: 'PARTIALLY_PAID',
    },
    {
      id: 'c2000003-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000003',
      patient_id: patients[2].id, patient_name: patients[2].name, patient_uhid: patients[2].uhid,
      patient_mobile: patients[2].mobile,
      billing_type: 'PHARMACY', invoice_date: '2025-04-08',
      treating_doctor_name: 'Dr. Preethi Kumar', department: 'General Medicine',
      gross_amount: 185000, discount_amount: 0, net_amount: 185000,
      paid_amount: 160000, balance_amount: 25000, status: 'PARTIALLY_PAID',
    },
    {
      id: 'c2000004-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000004',
      patient_id: patients[3].id, patient_name: patients[3].name, patient_uhid: patients[3].uhid,
      patient_mobile: patients[3].mobile,
      billing_type: 'OT', invoice_date: '2025-05-25',
      admission_date: '2025-05-23', discharge_date: '2025-05-27',
      ward: 'Private Room', bed_number: 'PR-04',
      treating_doctor_name: 'Dr. Anand Rao', department: 'General Surgery',
      gross_amount: 350000, discount_amount: 17500, net_amount: 332500,
      paid_amount: 332500, balance_amount: 0, status: 'PAID',
    },
    {
      id: 'c2000005-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000005',
      patient_id: patients[4].id, patient_name: patients[4].name, patient_uhid: patients[4].uhid,
      patient_mobile: patients[4].mobile,
      billing_type: 'OP', invoice_date: '2025-04-05',
      treating_doctor_name: 'Dr. Meera Iyer', department: 'Neurology',
      gross_amount: 3500, discount_amount: 0, net_amount: 3500,
      paid_amount: 3500, balance_amount: 0, status: 'PAID',
    },
    {
      id: 'c2000006-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000006',
      patient_id: patients[5].id, patient_name: patients[5].name, patient_uhid: patients[5].uhid,
      patient_mobile: patients[5].mobile,
      billing_type: 'LAB', invoice_date: '2025-04-12',
      treating_doctor_name: 'Dr. Rajesh Pillai', department: 'Pathology',
      gross_amount: 12500, discount_amount: 0, net_amount: 12500,
      paid_amount: 12500, balance_amount: 0, status: 'PAID',
    },
    {
      id: 'c2000007-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000007',
      patient_id: patients[6].id, patient_name: patients[6].name, patient_uhid: patients[6].uhid,
      patient_mobile: patients[6].mobile,
      billing_type: 'RADIOLOGY', invoice_date: '2025-06-18',
      treating_doctor_name: 'Dr. Sunil Mehta', department: 'Radiology',
      gross_amount: 28000, discount_amount: 0, net_amount: 28000,
      paid_amount: 28000, balance_amount: 0, status: 'PAID',
    },
    {
      id: 'c2000008-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000008',
      patient_id: patients[7].id, patient_name: patients[7].name, patient_uhid: patients[7].uhid,
      patient_mobile: patients[7].mobile,
      billing_type: 'IP', invoice_date: '2025-07-10',
      admission_date: '2025-07-03', discharge_date: '2025-07-10',
      ward: 'Semi-Private Ward', bed_number: 'SP-08',
      treating_doctor_name: 'Dr. Meera Iyer', department: 'Neurology',
      gross_amount: 195000, discount_amount: 9750, net_amount: 185250,
      paid_amount: 0, balance_amount: 185250,
      is_credit_bill: true, status: 'FINALIZED',
    },
    {
      id: 'c2000009-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000009',
      patient_id: patients[8].id, patient_name: patients[8].name, patient_uhid: patients[8].uhid,
      patient_mobile: patients[8].mobile,
      billing_type: 'DAYCARE', invoice_date: '2025-08-02',
      treating_doctor_name: 'Dr. Kavitha Nair', department: 'Oncology',
      gross_amount: 45000, discount_amount: 0, net_amount: 45000,
      paid_amount: 45000, balance_amount: 0, status: 'PAID',
    },
    {
      id: 'c200000a-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000010',
      patient_id: patients[9].id, patient_name: patients[9].name, patient_uhid: patients[9].uhid,
      patient_mobile: patients[9].mobile,
      billing_type: 'OP', invoice_date: '2025-09-10',
      treating_doctor_name: 'Dr. Ravi Shankar', department: 'Cardiology',
      gross_amount: 5500, discount_amount: 0, net_amount: 5500,
      paid_amount: 0, balance_amount: 5500, status: 'PROVISIONAL',
    },
    {
      id: 'c200000b-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000011',
      patient_id: patients[0].id, patient_name: patients[0].name, patient_uhid: patients[0].uhid,
      patient_mobile: patients[0].mobile,
      billing_type: 'LAB', invoice_date: '2025-09-12',
      treating_doctor_name: 'Dr. Rajesh Pillai', department: 'Pathology',
      gross_amount: 8500, discount_amount: 0, net_amount: 8500,
      paid_amount: 0, balance_amount: 8500, status: 'DRAFT',
    },
    {
      id: 'c200000c-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000012',
      patient_id: patients[4].id, patient_name: patients[4].name, patient_uhid: patients[4].uhid,
      patient_mobile: patients[4].mobile,
      billing_type: 'ICU', invoice_date: '2025-08-20',
      admission_date: '2025-08-13', discharge_date: '2025-08-20',
      ward: 'Neuro ICU', bed_number: 'NICU-03',
      treating_doctor_name: 'Dr. Meera Iyer', department: 'Neurology',
      gross_amount: 560000, discount_amount: 28000, net_amount: 532000,
      paid_amount: 300000, balance_amount: 232000,
      patient_share: 300000, insurance_share: 232000,
      is_credit_bill: true, status: 'PARTIALLY_PAID',
    },
    {
      id: 'c200000d-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000013',
      patient_id: patients[6].id, patient_name: patients[6].name, patient_uhid: patients[6].uhid,
      patient_mobile: patients[6].mobile,
      billing_type: 'PHARMACY', invoice_date: '2025-08-25',
      treating_doctor_name: 'Dr. Preethi Kumar', department: 'Oncology',
      gross_amount: 125000, discount_amount: 12500, net_amount: 112500,
      paid_amount: 112500, balance_amount: 0, status: 'PAID',
    },
    {
      id: 'c200000e-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000014',
      patient_id: patients[3].id, patient_name: patients[3].name, patient_uhid: patients[3].uhid,
      patient_mobile: patients[3].mobile,
      billing_type: 'IP', invoice_date: '2025-09-15',
      admission_date: '2025-09-08', discharge_date: '2025-09-15',
      ward: 'Cardiac Ward', bed_number: 'CW-05',
      treating_doctor_name: 'Dr. Ravi Shankar', department: 'Cardiology',
      gross_amount: 420000, discount_amount: 0, net_amount: 420000,
      paid_amount: 100000, balance_amount: 320000,
      status: 'FINALIZED',
    },
    {
      id: 'c200000f-0000-0000-0000-000000000001',
      tenant_id: T, created_by: SYS, fiscal_year_id: FY,
      invoice_number: 'INV-2025-000015',
      patient_id: patients[2].id, patient_name: patients[2].name, patient_uhid: patients[2].uhid,
      patient_mobile: patients[2].mobile,
      billing_type: 'OT', invoice_date: '2025-09-18',
      admission_date: '2025-09-16', discharge_date: '2025-09-20',
      ward: 'General Ward A', bed_number: 'GA-03',
      treating_doctor_name: 'Dr. Anand Rao', department: 'Orthopaedics',
      gross_amount: 285000, discount_amount: 0, net_amount: 285000,
      paid_amount: 0, balance_amount: 285000, status: 'DRAFT',
    },
  ];

  await PatientInvoice.bulkCreate(rows);
  console.log(`  ✓ ${rows.length} patient invoices`);
}

async function seedTenantAndUser() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  // Tenant
  await q(`
    INSERT INTO tenants (id, name, code, plan, is_active, created_at, updated_at)
    VALUES ('${T}', 'Medanta Super Specialty Hospital', 'MEDANTA', 'ENTERPRISE', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);
  // Admin role
  const roleId = 'a0000001-0000-0000-0000-000000000001';
  await q(`
    INSERT INTO roles (id, tenant_id, name, permissions, is_system, created_at)
    VALUES ('${roleId}', '${T}', 'admin', '["*"]'::jsonb, true, NOW())
    ON CONFLICT DO NOTHING
  `);
  // Admin user (password: Demo@1234)
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('Demo@1234', 12);
  await q(`
    INSERT INTO users (id, tenant_id, email, password_hash, full_name, is_active, created_at, updated_at)
    VALUES ('${SYS}', '${T}', 'admin@factos.com', '${hash}', 'FACT Administrator', true, NOW(), NOW())
    ON CONFLICT (tenant_id, email) DO NOTHING
  `);
  await q(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES ('${SYS}', '${roleId}')
    ON CONFLICT DO NOTHING
  `);
  console.log('  ✓ Tenant, role, and admin user');
}

async function seedVendors() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  await q(`
    INSERT INTO vendors (id, tenant_id, code, name, category, gstin, pan, email, phone, payment_terms, is_active, created_at, updated_at)
    VALUES
      ('${V1}', '${T}', 'VND-001', 'Becton Dickinson India Pvt Ltd', 'PHARMA_SUPPLIES', '29AACCB1234F1Z5', 'AACCB1234F', 'orders@bd-india.com', '080-41234567', 30, true, NOW(), NOW()),
      ('${V2}', '${T}', 'VND-002', 'Siemens Healthineers India', 'MEDICAL_EQUIPMENT', '07AABCS5678G1Z3', 'AABCS5678G', 'service@siemens-hi.in', '022-67891234', 45, true, NOW(), NOW()),
      ('${V3}', '${T}', 'VND-003', 'Cipla Ltd – Hospital Division', 'PHARMACY', '27AAACI1234K1Z7', 'AAACI1234K', 'hospital@cipla.com', '022-22483891', 30, true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  ✓ 3 vendors');
}

async function seedVendorInvoices() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  await q(`
    INSERT INTO vendor_invoices (id, tenant_id, vendor_id, vendor_name, invoice_number, invoice_date, due_date, net_amount, cgst_amount, sgst_amount, tds_amount, paid_amount, status, fiscal_year_id, expense_account_code, narration, is_accounting_posted, created_by, created_at, updated_at)
    VALUES
      (gen_random_uuid(), '${T}', '${V1}', 'Becton Dickinson India Pvt Ltd', 'BD/INV/2026/0412', '2026-04-12', '2026-05-12', 600000.00, 54000.00, 54000.00, 0, 0, 'POSTED', '${FY}', '7202', 'Medical consumables & lab reagents supply', true, '${SYS}', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${V2}', 'Siemens Healthineers India', 'SHI/2026/AMC-001', '2026-04-01', '2026-04-30', 180000.00, 16200.00, 16200.00, 0, 180000.00, 'PAID', '${FY}', '7401', 'Annual maintenance contract – CT Scanner', true, '${SYS}', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${V3}', 'Cipla Ltd – Hospital Division', 'CPL/HOS/2026/1122', '2026-05-02', '2026-06-01', 420000.00, 37800.00, 37800.00, 0, 0, 'PENDING', '${FY}', '7201', 'Pharmacy restocking – cardiac & oncology drugs', false, '${SYS}', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${V1}', 'Becton Dickinson India Pvt Ltd', 'BD/INV/2026/0455', '2026-05-10', '2026-06-09', 250000.00, 22500.00, 22500.00, 0, 0, 'APPROVED', '${FY}', '7202', 'Disposables & IV supplies – May 2026', false, '${SYS}', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  console.log('  ✓ 4 vendor invoices');
}

async function seedEmployeesAndPayroll() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  // Employees
  await q(`
    INSERT INTO employees (id, tenant_id, employee_number, name, email, designation, employment_type, date_of_joining, is_active, created_at, updated_at)
    VALUES
      ('${E1}', '${T}', 'EMP-001', 'Dr. Priya Sharma', 'priya.sharma@medanta.in', 'Senior Consultant – Cardiology', 'FULL_TIME', '2022-06-01', true, NOW(), NOW()),
      ('${E2}', '${T}', 'EMP-002', 'Rajesh Kumar', 'rajesh.kumar@medanta.in', 'Head Nurse – ICU', 'FULL_TIME', '2021-03-15', true, NOW(), NOW()),
      ('${E3}', '${T}', 'EMP-003', 'Anita Singh', 'anita.singh@medanta.in', 'Finance Executive', 'FULL_TIME', '2023-01-10', true, NOW(), NOW())
    ON CONFLICT (tenant_id, employee_number) DO NOTHING
  `);
  // Salary structures
  await q(`
    INSERT INTO salary_structures (id, tenant_id, employee_id, name, components, is_active, effective_from, created_at, updated_at)
    VALUES
      (gen_random_uuid(), '${T}', '${E1}', 'Doctor Senior Grade', '{"basic":180000,"hra":72000,"specialAllowance":30000,"lta":10000,"medicalAllowance":1250,"otherAllowances":0}'::jsonb, true, '2025-04-01', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${E2}', 'Nursing Grade B', '{"basic":45000,"hra":18000,"specialAllowance":8000,"lta":3000,"medicalAllowance":1250,"otherAllowances":2000}'::jsonb, true, '2025-04-01', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${E3}', 'Admin Grade C', '{"basic":35000,"hra":14000,"specialAllowance":5000,"lta":2500,"medicalAllowance":1250,"otherAllowances":0}'::jsonb, true, '2025-04-01', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  // Payroll run: April 2026 (POSTED)
  await q(`
    INSERT INTO payroll_runs (id, tenant_id, year, month, status, total_employees, total_gross, total_deductions, total_net, total_pf_expense, total_esi_expense, initiated_by, fiscal_year_id, created_at, updated_at)
    VALUES
      ('${PR1}', '${T}', 2026, 4, 'POSTED', 3, 310000.00, 41200.00, 268800.00, 30000.00, 12800.00, '${SYS}', '${FY}', NOW(), NOW())
    ON CONFLICT (tenant_id, year, month) DO NOTHING
  `);
  console.log('  ✓ 3 employees, salary structures, 1 payroll run');
}

async function seedInsuranceClaims() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  // Uses the Claim model's table 'claims'
  await q(`
    INSERT INTO claims (id, tenant_id, claim_number, patient_id, patient_name, patient_uhid, policy_number, claimed_amount, settled_amount, status, submitted_at, created_at, updated_at)
    VALUES
      ('${CLAIM1}', '${T}', 'CLM-2026-000001', 'b1000001-0000-0000-0000-000000000001', 'Ramesh Kumar', 'MSSH-00001', 'STR-2023-456789', 285000.00, 0, 'SUBMITTED', '2026-04-20', NOW(), NOW()),
      ('${CLAIM2}', '${T}', 'CLM-2026-000002', 'b1000002-0000-0000-0000-000000000001', 'Kavitha Menon', 'MSSH-00002', 'HE-2022-112233', 195000.00, 175000.00, 'SETTLED', '2026-03-15', NOW(), NOW()),
      ('${CLAIM3}', '${T}', 'CLM-2026-000003', 'b1000003-0000-0000-0000-000000000001', 'Suresh Nair', 'MSSH-00003', 'NIA-2024-778899', 450000.00, 0, 'UNDER_REVIEW', '2026-05-05', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  ✓ 3 insurance claims');
}

async function seedFCRAData() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  // FCRA Registration
  await q(`
    INSERT INTO fcra_registrations (id, tenant_id, fcra_number, organization_name, organization_type, pan_number, registration_date, valid_upto, status, address, created_at, updated_at)
    VALUES
      ('${FCRA_REG1}', '${T}', 'FCRA-083781234', 'Medanta Healthcare Foundation', 'trust', 'AAATM5678H', '2020-08-15', '2025-08-14', 'active', '{"city":"New Delhi","state":"Delhi","pin":"110001"}'::jsonb, NOW(), NOW())
    ON CONFLICT (tenant_id, fcra_number) DO NOTHING
  `);
  // FCRA Bank Account
  await q(`
    INSERT INTO fcra_bank_accounts (id, tenant_id, account_code, registration_id, account_type, bank_name, branch_name, account_number, ifsc_code, opening_balance, current_balance, is_active, created_at, updated_at)
    VALUES
      ('${FCRA_BANK1}', '${T}', 'FCRA-BANK-001', '${FCRA_REG1}', 'designated', 'SBI (Designated FCRA Account)', 'Main Branch, New Delhi', 'FCRA39847623001', 'SBIN0030001', 5000000.00, 4250000.00, true, NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  // FCRA Receipts
  await q(`
    INSERT INTO fcra_receipts (id, tenant_id, registration_id, bank_account_id, receipt_number, currency, amount, exchange_rate, amount_inr, purpose, receipt_date, transaction_type, status, created_by, created_at, updated_at)
    VALUES
      (gen_random_uuid(), '${T}', '${FCRA_REG1}', '${FCRA_BANK1}', 'FCRA-REC-2026-001', 'USD', 50000.00, 83.5, 4175000.00, 'Cancer screening programme expansion', '2026-04-10', 'bank_transfer', 'verified', '${SYS}', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${FCRA_REG1}', '${FCRA_BANK1}', 'FCRA-REC-2026-002', 'GBP', 15000.00, 104.2, 1563000.00, 'Research grant – infectious disease', '2026-05-05', 'bank_transfer', 'pending', '${SYS}', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  // FCRA Utilisations
  await q(`
    INSERT INTO fcra_utilisations (id, tenant_id, registration_id, bank_account_id, voucher_number, category, utilization_date, amount, purpose, payee_name, status, created_by, created_at, updated_at)
    VALUES
      (gen_random_uuid(), '${T}', '${FCRA_REG1}', '${FCRA_BANK1}', 'PMT-FCRA-001', 'programme', '2026-04-25', 450000.00, 'Cancer screening equipment purchase', 'Siemens Healthineers India', 'approved', '${SYS}', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${FCRA_REG1}', '${FCRA_BANK1}', 'PMT-FCRA-002', 'administrative', '2026-04-30', 85000.00, 'Foundation administrative expenses – April 2026', 'Staff Salaries', 'approved', '${SYS}', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  // FCRA Project
  await q(`
    INSERT INTO fcra_projects (id, tenant_id, registration_id, project_code, project_name, description, received_amount, utilized_amount, status, start_date, end_date, created_by, created_at, updated_at)
    VALUES
      (gen_random_uuid(), '${T}', '${FCRA_REG1}', 'PROJ-CANCER-2026', 'Community Cancer Screening 2026', 'Free cancer screening for underprivileged communities in Haryana', 4175000.00, 450000.00, 'active', '2026-04-01', '2027-03-31', '${SYS}', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  console.log('  ✓ FCRA registration, bank account, 2 receipts, 2 utilisations, 1 project');
}

async function seedFinancialExceptions() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  await q(`
    INSERT INTO financial_exceptions (id, tenant_id, exception_type, severity, status, entity_type, title, description, raised_by, source_module, metadata, created_at, updated_at)
    VALUES
      (gen_random_uuid(), '${T}', 'STALE_CLAIM', 'HIGH', 'OPEN', 'claim', 'Insurance claim CLM-2026-000001 outstanding >30 days', 'Star Health claim of ₹2.85L submitted 30+ days ago without response. TPA TAT breach likely.', 'SYSTEM', 'insurance-tpa', '{"claimNumber":"CLM-2026-000001","daysOutstanding":32}'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), '${T}', 'BANK_UNMATCHED', 'MEDIUM', 'OPEN', 'bank_account', '3 bank transactions unmatched in reconciliation', 'SBI Current Account has 3 transactions from last week that do not match any journal entry.', 'SYSTEM', 'cash-bank', '{"account":"SBI Current Account","count":3}'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), '${T}', 'MISSING_APPROVAL', 'HIGH', 'ACKNOWLEDGED', 'vendor_invoice', 'Vendor invoice CPL/HOS/2026/1122 awaiting approval >48 hours', 'Cipla vendor invoice for ₹4.2L pending approval for 2 days.', 'SYSTEM', 'accounts-payable', '{"vendorName":"Cipla Ltd","amount":420000}'::jsonb, NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  console.log('  ✓ 3 financial exceptions');
}

async function seedBankAccounts() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  await q(`
    INSERT INTO bank_accounts (id, tenant_id, account_code, bank_name, account_number, ifsc_code, account_type, current_balance, is_active, created_at, updated_at)
    VALUES
      (gen_random_uuid(), '${T}', '1102', 'State Bank of India', '39847623001', 'SBIN0030001', 'CURRENT', 18500000.00, true, NOW(), NOW()),
      (gen_random_uuid(), '${T}', '1103', 'HDFC Bank', '50200091234567', 'HDFC0001234', 'CURRENT', 10000000.00, true, NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  // Sample bank transactions for reconciliation testing
  await q(`
    INSERT INTO bank_transactions (tenant_id, bank_account_id, transaction_date, value_date, description, debit_amount, credit_amount, balance, reference_number, reconciled, created_at)
    SELECT '${T}', ba.id, '2026-05-10', '2026-05-10', 'NEFT CR - Patient collection', 0, 250000.00, 10250000.00, 'NEFT2026051012345', false, NOW()
    FROM bank_accounts ba WHERE ba.tenant_id = '${T}' AND ba.account_code = '1102'
    LIMIT 1
  `);
  await q(`
    INSERT INTO bank_transactions (tenant_id, bank_account_id, transaction_date, value_date, description, debit_amount, credit_amount, balance, reference_number, reconciled, created_at)
    SELECT '${T}', ba.id, '2026-05-12', '2026-05-12', 'RTGS DR - BD vendor payment', 600000.00, 0, 9650000.00, 'RTGS2026051200089', true, NOW()
    FROM bank_accounts ba WHERE ba.tenant_id = '${T}' AND ba.account_code = '1102'
    LIMIT 1
  `);
  console.log('  ✓ 2 bank accounts, 2 bank transactions');
}

async function seedAccountingPeriods() {
  const q = (sql) => sequelize.query(sql, { raw: true });
  // Create April and May 2026 periods for FY 2025-26
  await q(`
    INSERT INTO accounting_periods (id, tenant_id, fiscal_year_id, period_number, period_start, period_end, status, created_at, updated_at)
    VALUES
      (gen_random_uuid(), '${T}', '${FY}', 1, '2025-04-01', '2025-04-30', 'CLOSED', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${FY}', 2, '2025-05-01', '2025-05-31', 'CLOSED', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${FY}', 12, '2026-03-01', '2026-03-31', 'CLOSED', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${FY}', 13, '2026-04-01', '2026-04-30', 'CLOSED', NOW(), NOW()),
      (gen_random_uuid(), '${T}', '${FY}', 14, '2026-05-01', '2026-05-31', 'OPEN', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  console.log('  ✓ Accounting periods (Apr 2025 – May 2026)');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    console.log('\n🌱 FACT Demo Data Seed — Medanta Super Specialty Hospital\n');

    await sequelize.authenticate();
    console.log('  ✓ Database connected');

    await sequelize.sync({ force: false });
    console.log('  ✓ Tables synced\n');

    await clearTenantData();
    await seedTenantAndUser();
    await seedFiscalYear();
    await seedAccounts();
    await seedJournals();
    await seedAssetCategories();
    await seedAssets();
    await seedPatientInvoices();
    await seedVendors();
    await seedVendorInvoices();
    await seedEmployeesAndPayroll();
    await seedInsuranceClaims();
    await seedFCRAData();
    await seedFinancialExceptions();
    await seedBankAccounts();
    await seedAccountingPeriods();

    console.log('\n✅ Seed complete! Open the app and start recording.\n');
    console.log('  Demo login:   admin@factos.com  /  Demo@1234');
    console.log('  Tenant ID:    ' + T);
    console.log('  Fiscal Year:  FY 2025-26 (Apr 2025 – Mar 2026)');
    console.log('  Vendors:      3 (Becton Dickinson, Siemens, Cipla)');
    console.log('  Employees:    3 (1 doctor, 1 nurse, 1 admin)');
    console.log('  Claims:       3 (1 submitted, 1 settled, 1 under review)');
    console.log('  FCRA:         1 registration, 2 receipts (₹57.38L), 2 utilisations');
    console.log('  Exceptions:   3 (1 stale claim, 1 unmatched, 1 pending approval)\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
