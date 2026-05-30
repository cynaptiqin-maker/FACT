// BRConstants.js — Bank Reconciliation: mock data, KPI config, enums, AI data, utilities

export const fmtINR = (val, format = 'standard') => {
  if (val === null || val === undefined) return '—';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (format === 'crore' || abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (format === 'lakh' || abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  return `${sign}₹${abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const BANK_ACCOUNTS = [
  { id: 'BA001', name: 'HDFC – 4521', bank: 'HDFC Bank', branchName: 'Koramangala', ifsc: 'HDFC0001234', type: 'Current', balance: 42850000, lastSync: '2 min ago', color: 'blue' },
  { id: 'BA002', name: 'SBI – 7893', bank: 'State Bank of India', branchName: 'MG Road', ifsc: 'SBIN0012345', type: 'Savings', balance: 18920000, lastSync: '5 min ago', color: 'indigo' },
  { id: 'BA003', name: 'ICICI – 3310', bank: 'ICICI Bank', branchName: 'Whitefield', ifsc: 'ICIC0001234', type: 'Current', balance: 31540000, lastSync: '1 min ago', color: 'violet' },
  { id: 'BA004', name: 'Axis – 6672', bank: 'Axis Bank', branchName: 'HSR Layout', ifsc: 'UTIB0001234', type: 'Current', balance: 9870000, lastSync: '8 min ago', color: 'purple' },
];

export const BRANCHES = [
  { id: 'ALL', label: 'All Branches' },
  { id: 'MAIN', label: 'Main Campus' },
  { id: 'NORTH', label: 'North Wing' },
  { id: 'SOUTH', label: 'South Campus' },
  { id: 'EAST', label: 'East Block' },
  { id: 'WESTEND', label: 'Westend Clinic' },
  { id: 'MEDI', label: 'Medical College' },
];

export const MATCH_STATUS = {
  MATCHED:   { label: 'Matched',     color: 'emerald', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  UNMATCHED: { label: 'Unmatched',   color: 'red',     bg: 'bg-red-500/10 dark:bg-red-500/15',         text: 'text-red-600 dark:text-red-400',         border: 'border-red-500/30',     dot: 'bg-red-400' },
  PARTIAL:   { label: 'Partial',     color: 'amber',   bg: 'bg-amber-500/10 dark:bg-amber-500/15',     text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-500/30',   dot: 'bg-amber-400' },
  IN_REVIEW: { label: 'In Review',   color: 'blue',    bg: 'bg-blue-500/10 dark:bg-blue-500/15',       text: 'text-blue-600 dark:text-blue-400',       border: 'border-blue-500/30',    dot: 'bg-blue-400' },
  EXCEPTION: { label: 'Exception',   color: 'orange',  bg: 'bg-orange-500/10 dark:bg-orange-500/15',   text: 'text-orange-600 dark:text-orange-400',   border: 'border-orange-500/30',  dot: 'bg-orange-400' },
  ADJUSTED:  { label: 'Adjusted',    color: 'violet',  bg: 'bg-violet-500/10 dark:bg-violet-500/15',   text: 'text-violet-600 dark:text-violet-400',   border: 'border-violet-500/30',  dot: 'bg-violet-400' },
  SUGGESTED: { label: 'AI Suggested',color: 'cyan',    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',       text: 'text-cyan-600 dark:text-cyan-400',       border: 'border-cyan-500/30',    dot: 'bg-cyan-400' },
};

export const PAYMENT_METHODS = ['UPI', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'DD', 'POS', 'CASH', 'GATEWAY', 'ECS', 'WIRE', 'AUTO'];

export const TXN_TYPES = {
  RECEIPT:     { label: 'Receipt',     color: 'emerald', dir: 'cr' },
  PAYMENT:     { label: 'Payment',     color: 'red',     dir: 'dr' },
  BANK_CHARGE: { label: 'Bank Charge', color: 'amber',   dir: 'dr' },
  TRANSFER:    { label: 'Transfer',    color: 'blue',    dir: 'both' },
  REVERSAL:    { label: 'Reversal',    color: 'orange',  dir: 'both' },
  SETTLEMENT:  { label: 'Settlement',  color: 'green',   dir: 'cr' },
  REFUND:      { label: 'Refund',      color: 'violet',  dir: 'dr' },
  GATEWAY:     { label: 'Gateway',     color: 'cyan',    dir: 'cr' },
};

export const RISK_LEVELS = {
  LOW:      { label: 'Low',      color: 'emerald', range: [0, 30],   bg: 'bg-emerald-500', text: 'text-emerald-400' },
  MEDIUM:   { label: 'Medium',   color: 'amber',   range: [31, 65],  bg: 'bg-amber-500',   text: 'text-amber-400' },
  HIGH:     { label: 'High',     color: 'orange',  range: [66, 85],  bg: 'bg-orange-500',  text: 'text-orange-400' },
  CRITICAL: { label: 'Critical', color: 'red',     range: [86, 100], bg: 'bg-red-500',     text: 'text-red-400' },
};

export const SOURCE_MODULES = [
  'OP_BILLING','IP_BILLING','PHARMACY','LAB','RADIOLOGY',
  'INSURANCE','CORPORATE','ICU','EMERGENCY','PAYROLL','MANUAL',
];

// ─── SYSTEM (LEDGER) TRANSACTIONS ─────────────────────────────────────────────
export const MOCK_SYSTEM_TXNS = [
  {
    id: 'SYS-001', ref: 'REC-2026-04521', date: '2026-05-19', time: '09:15:23',
    narration: 'OP Collection – Dr. Ramesh Kumar consultation', type: 'RECEIPT',
    amount: 4500, dr: 0, cr: 4500, branch: 'MAIN', department: 'Outpatient',
    source: 'OP_BILLING', method: 'UPI', user: 'Priya S.', status: 'MATCHED',
    matchId: 'BANK-0041', confidence: 97, bankRef: 'UPI2026051900041',
    patientId: 'HC-004521', riskScore: 8, riskLevel: 'LOW',
    voucherNo: 'RV-2026-4521', glAccount: '1101 – Cash at Bank',
    journalEntries: [
      { account: '1101 – Cash at Bank', dr: 4500, cr: 0 },
      { account: '4001 – OP Revenue', dr: 0, cr: 4500 },
    ],
    settlementHistory: [],
    auditLog: [
      { ts: '09:15:23', user: 'Priya S.', action: 'Transaction created', note: 'OP collection via UPI' },
      { ts: '09:16:50', user: 'System', action: 'Auto-matched', note: 'Matched with BANK-0041 (confidence 97%)' },
    ],
  },
  {
    id: 'SYS-002', ref: 'REC-2026-04522', date: '2026-05-19', time: '09:32:11',
    narration: 'Pharmacy collection – Retail counter 3', type: 'RECEIPT',
    amount: 12840, dr: 0, cr: 12840, branch: 'MAIN', department: 'Pharmacy',
    source: 'PHARMACY', method: 'POS', user: 'Ankit R.', status: 'MATCHED',
    matchId: 'BANK-0042', confidence: 94, bankRef: 'POS20260519042',
    riskScore: 12, riskLevel: 'LOW', voucherNo: 'RV-2026-4522', glAccount: '1101 – Cash at Bank',
    journalEntries: [
      { account: '1101 – Cash at Bank', dr: 12840, cr: 0 },
      { account: '4010 – Pharmacy Revenue', dr: 0, cr: 12840 },
    ],
    settlementHistory: [],
    auditLog: [
      { ts: '09:32:11', user: 'Ankit R.', action: 'Transaction created', note: 'POS collection Pharmacy' },
      { ts: '09:33:28', user: 'System', action: 'Auto-matched', note: 'Matched BANK-0042 (confidence 94%)' },
    ],
  },
  {
    id: 'SYS-003', ref: 'INS-2026-04523', date: '2026-05-19', time: '10:05:45',
    narration: 'Insurance settlement – Star Health – Claim #SH204523', type: 'SETTLEMENT',
    amount: 285000, dr: 0, cr: 285000, branch: 'MAIN', department: 'Insurance',
    source: 'INSURANCE', method: 'NEFT', user: 'Deepa M.', status: 'PARTIAL',
    matchId: 'BANK-0045', confidence: 78, bankRef: 'NEFT2026051900045',
    riskScore: 35, riskLevel: 'MEDIUM', voucherNo: 'INS-2026-4523', glAccount: '1101 – Cash at Bank',
    variance: 15000, varianceReason: 'TDS deduction not accounted',
    journalEntries: [
      { account: '1101 – Cash at Bank', dr: 270000, cr: 0 },
      { account: '2410 – TDS Receivable', dr: 15000, cr: 0 },
      { account: '1220 – Insurance Receivable', dr: 0, cr: 285000 },
    ],
    settlementHistory: [{ date: '2026-05-16', amount: 0, status: 'Claim submitted' }, { date: '2026-05-19', amount: 270000, status: 'Partial credit received' }],
    auditLog: [
      { ts: '10:05:45', user: 'Deepa M.', action: 'Settlement booked', note: 'Star Health claim SH204523' },
      { ts: '10:07:00', user: 'System', action: 'Partial match', note: 'Variance ₹15,000 – TDS deduction suspected' },
    ],
  },
  {
    id: 'SYS-004', ref: 'PAY-2026-04524', date: '2026-05-19', time: '10:22:33',
    narration: 'Vendor payment – Medical supplies – Apollo Medicals', type: 'PAYMENT',
    amount: 185000, dr: 185000, cr: 0, branch: 'MAIN', department: 'Stores',
    source: 'MANUAL', method: 'RTGS', user: 'Suresh K.', status: 'MATCHED',
    matchId: 'BANK-0046', confidence: 99, bankRef: 'RTGS2026051900046',
    riskScore: 5, riskLevel: 'LOW', voucherNo: 'PV-2026-4524', glAccount: '1101 – Cash at Bank',
    journalEntries: [
      { account: '2001 – Accounts Payable', dr: 185000, cr: 0 },
      { account: '1101 – Cash at Bank', dr: 0, cr: 185000 },
    ],
    settlementHistory: [],
    auditLog: [
      { ts: '10:22:33', user: 'Suresh K.', action: 'Payment voucher created', note: 'Apollo Medicals RTGS' },
      { ts: '10:24:02', user: 'System', action: 'Auto-matched', note: 'Confidence 99% – perfect match' },
    ],
  },
  {
    id: 'SYS-005', ref: 'REC-2026-04525', date: '2026-05-19', time: '10:45:18',
    narration: 'IP Advance – Admission – Kavya Nair – Ward 3B', type: 'RECEIPT',
    amount: 50000, dr: 0, cr: 50000, branch: 'MAIN', department: 'Inpatient',
    source: 'IP_BILLING', method: 'UPI', user: 'Meena L.', status: 'UNMATCHED',
    matchId: null, confidence: null, bankRef: null,
    riskScore: 55, riskLevel: 'MEDIUM', voucherNo: 'RV-2026-4525', glAccount: '1101 – Cash at Bank',
    aiNote: 'UPI credit not yet reflected in bank. May be T+0 settlement lag.',
    journalEntries: [
      { account: '1101 – Cash at Bank', dr: 50000, cr: 0 },
      { account: '2050 – IP Advance Received', dr: 0, cr: 50000 },
    ],
    settlementHistory: [],
    auditLog: [{ ts: '10:45:18', user: 'Meena L.', action: 'Advance receipt created', note: 'IP admission Kavya Nair Ward 3B' }],
  },
  {
    id: 'SYS-006', ref: 'LAB-2026-04526', date: '2026-05-19', time: '11:02:44',
    narration: 'Lab collection – Pathology – Reference lab batch', type: 'RECEIPT',
    amount: 8750, dr: 0, cr: 8750, branch: 'EAST', department: 'Pathology',
    source: 'LAB', method: 'UPI', user: 'Ravi T.', status: 'MATCHED',
    matchId: 'BANK-0048', confidence: 96, bankRef: 'UPI2026051900048',
    riskScore: 10, riskLevel: 'LOW', voucherNo: 'RV-2026-4526', glAccount: '1101 – Cash at Bank',
    journalEntries: [
      { account: '1101 – Cash at Bank', dr: 8750, cr: 0 },
      { account: '4020 – Lab Revenue', dr: 0, cr: 8750 },
    ],
    settlementHistory: [],
    auditLog: [
      { ts: '11:02:44', user: 'Ravi T.', action: 'Lab collection recorded', note: 'Pathology batch via UPI' },
      { ts: '11:03:58', user: 'System', action: 'Auto-matched', note: 'BANK-0048 confidence 96%' },
    ],
  },
  {
    id: 'SYS-007', ref: 'PAY-2026-04527', date: '2026-05-19', time: '11:15:00',
    narration: 'Staff salary advance – Nursing staff Q2', type: 'PAYMENT',
    amount: 425000, dr: 425000, cr: 0, branch: 'MAIN', department: 'HR',
    source: 'PAYROLL', method: 'NEFT', user: 'Admin', status: 'IN_REVIEW',
    matchId: 'BANK-0051', confidence: 65, bankRef: 'NEFT2026051900051',
    riskScore: 45, riskLevel: 'MEDIUM', voucherNo: 'PV-2026-4527', glAccount: '1101 – Cash at Bank',
    variance: 5000, varianceReason: 'Amount differs from payroll register',
    aiNote: 'Amount differs from payroll register by ₹5,000. Pending CFO approval.',
    journalEntries: [
      { account: '6010 – Salary Advance', dr: 425000, cr: 0 },
      { account: '1101 – Cash at Bank', dr: 0, cr: 425000 },
    ],
    settlementHistory: [],
    auditLog: [
      { ts: '11:15:00', user: 'Admin', action: 'Salary advance processed', note: 'Nursing staff Q2 NEFT' },
      { ts: '11:16:45', user: 'System', action: 'Partial match flagged', note: 'Variance ₹5,000 – pending review' },
    ],
  },
  {
    id: 'SYS-008', ref: 'REC-2026-04528', date: '2026-05-19', time: '11:45:22',
    narration: 'Corporate billing receipt – Tata Motors – Monthly invoice', type: 'RECEIPT',
    amount: 320000, dr: 0, cr: 320000, branch: 'MAIN', department: 'Corporate',
    source: 'CORPORATE', method: 'RTGS', user: 'Deepa M.', status: 'MATCHED',
    matchId: 'BANK-0052', confidence: 98, bankRef: 'RTGS2026051900052',
    riskScore: 7, riskLevel: 'LOW', voucherNo: 'RV-2026-4528', glAccount: '1101 – Cash at Bank',
    journalEntries: [
      { account: '1101 – Cash at Bank', dr: 320000, cr: 0 },
      { account: '1210 – Corporate Receivable', dr: 0, cr: 320000 },
    ],
    settlementHistory: [],
    auditLog: [
      { ts: '11:45:22', user: 'Deepa M.', action: 'Corporate receipt created', note: 'Tata Motors monthly invoice' },
      { ts: '11:46:38', user: 'System', action: 'Auto-matched', note: 'BANK-0052 confidence 98%' },
    ],
  },
  {
    id: 'SYS-009', ref: 'REF-2026-04529', date: '2026-05-19', time: '12:10:55',
    narration: 'Refund processed – IP discharge – excess advance – Mohan V.', type: 'REFUND',
    amount: 18500, dr: 18500, cr: 0, branch: 'SOUTH', department: 'Inpatient',
    source: 'IP_BILLING', method: 'NEFT', user: 'Priya S.', status: 'EXCEPTION',
    matchId: null, confidence: 0, bankRef: null,
    riskScore: 72, riskLevel: 'HIGH', voucherNo: 'RFD-2026-4529', glAccount: '1101 – Cash at Bank',
    exceptionReason: 'Refund shows in system but no corresponding bank debit found',
    aiNote: 'Possible fraud risk: refund processed manually without matching bank debit.',
    journalEntries: [
      { account: '2050 – IP Advance Received', dr: 18500, cr: 0 },
      { account: '1101 – Cash at Bank', dr: 0, cr: 18500 },
    ],
    settlementHistory: [],
    auditLog: [
      { ts: '12:10:55', user: 'Priya S.', action: 'Refund processed', note: 'Mohan V. excess advance refund' },
      { ts: '12:12:00', user: 'System', action: 'Exception flagged', note: 'No bank debit found – high risk' },
    ],
  },
  {
    id: 'SYS-010', ref: 'GTW-2026-04530', date: '2026-05-19', time: '12:30:00',
    narration: 'Razorpay settlement batch – OP collections 18-May', type: 'GATEWAY',
    amount: 142350, dr: 0, cr: 142350, branch: 'ALL', department: 'All',
    source: 'OP_BILLING', method: 'GATEWAY', user: 'System', status: 'SUGGESTED',
    matchId: 'BANK-0055', confidence: 83, bankRef: 'RZP2026051900055',
    riskScore: 25, riskLevel: 'LOW', voucherNo: 'GTW-2026-4530', glAccount: '1101 – Cash at Bank',
    aiNote: 'AI suggests match with bank credit ₹1,42,350 (Razorpay settlement batch).',
    journalEntries: [
      { account: '1101 – Cash at Bank', dr: 142350, cr: 0 },
      { account: '1230 – Gateway Settlement Clearing', dr: 0, cr: 142350 },
    ],
    settlementHistory: [{ date: '2026-05-18', amount: 142350, status: 'Settlement initiated by Razorpay' }],
    auditLog: [
      { ts: '12:30:00', user: 'System', action: 'Gateway settlement posted', note: 'Razorpay batch 18-May' },
      { ts: '12:31:20', user: 'AI Engine', action: 'Match suggested', note: 'BANK-0055 confidence 83%' },
    ],
  },
  {
    id: 'SYS-011', ref: 'CHG-2026-04531', date: '2026-05-19', time: '13:05:12',
    narration: 'EMI deduction – Equipment finance – Siemens MRI', type: 'PAYMENT',
    amount: 245000, dr: 245000, cr: 0, branch: 'MAIN', department: 'Radiology',
    source: 'MANUAL', method: 'ECS', user: 'Finance', status: 'MATCHED',
    matchId: 'BANK-0057', confidence: 100, bankRef: 'ECS2026051900057',
    riskScore: 3, riskLevel: 'LOW', voucherNo: 'PV-2026-4531', glAccount: '1101 – Cash at Bank',
    journalEntries: [
      { account: '2310 – Equipment Loan Payable', dr: 245000, cr: 0 },
      { account: '1101 – Cash at Bank', dr: 0, cr: 245000 },
    ],
    settlementHistory: [],
    auditLog: [
      { ts: '13:05:12', user: 'Finance', action: 'ECS payment created', note: 'Siemens MRI EMI May 2026' },
      { ts: '13:06:05', user: 'System', action: 'Auto-matched', note: 'BANK-0057 confidence 100%' },
    ],
  },
  {
    id: 'SYS-012', ref: 'REC-2026-04532', date: '2026-05-19', time: '13:45:33',
    narration: 'ICU emergency collection – Critical care deposit', type: 'RECEIPT',
    amount: 100000, dr: 0, cr: 100000, branch: 'MAIN', department: 'ICU',
    source: 'ICU', method: 'IMPS', user: 'Kavitha R.', status: 'UNMATCHED',
    matchId: null, confidence: null, bankRef: null,
    riskScore: 68, riskLevel: 'HIGH', voucherNo: 'RV-2026-4532', glAccount: '1101 – Cash at Bank',
    aiNote: 'No matching IMPS credit found. May be pending banking day close.',
    journalEntries: [
      { account: '1101 – Cash at Bank', dr: 100000, cr: 0 },
      { account: '2055 – ICU Advance Received', dr: 0, cr: 100000 },
    ],
    settlementHistory: [],
    auditLog: [{ ts: '13:45:33', user: 'Kavitha R.', action: 'ICU deposit recorded', note: 'Critical care IMPS advance' }],
  },
];

// ─── BANK STATEMENT TRANSACTIONS ──────────────────────────────────────────────
export const MOCK_BANK_TXNS = [
  {
    id: 'BANK-0041', bankRef: 'UPI2026051900041', date: '2026-05-19', time: '09:16:45',
    narration: 'UPI-RAZORPAY-REC-OP-4521', type: 'CREDIT',
    amount: 4500, method: 'UPI', status: 'MATCHED', matchId: 'SYS-001', confidence: 97,
    description: 'RAZORPAY PAYMENTS PRIVATE LIMITED', riskFlag: false,
  },
  {
    id: 'BANK-0042', bankRef: 'POS20260519042', date: '2026-05-19', time: '09:33:22',
    narration: 'POS TXN REF PHRMCY CTR3', type: 'CREDIT',
    amount: 12840, method: 'POS', status: 'MATCHED', matchId: 'SYS-002', confidence: 94,
    description: 'HDFC POS PHARMACY COUNTER 3', riskFlag: false,
  },
  {
    id: 'BANK-0043', bankRef: 'NEFT2026051900043', date: '2026-05-19', time: '09:55:10',
    narration: 'NEFT CR-UNKNOWN ENTITY-REF834523', type: 'CREDIT',
    amount: 75000, method: 'NEFT', status: 'UNMATCHED', matchId: null, confidence: 0,
    description: 'INWARD NEFT – UNKNOWN ENTITY', riskFlag: true,
    riskNote: 'Unidentified credit. No corresponding system entry. Investigate sender.',
  },
  {
    id: 'BANK-0044', bankRef: 'BNK2026051900044', date: '2026-05-19', time: '10:00:00',
    narration: 'BANK CHARGES – MAY 2026', type: 'DEBIT',
    amount: 2850, method: 'AUTO', status: 'UNMATCHED', matchId: null, confidence: 0,
    description: 'MONTHLY ACCOUNT MAINTENANCE CHARGES', riskFlag: false,
    riskNote: 'Bank charges not recorded in books. Create adjustment entry.',
  },
  {
    id: 'BANK-0045', bankRef: 'NEFT2026051900045', date: '2026-05-19', time: '10:06:12',
    narration: 'NEFT CR-STAR HEALTH INS-SH204523', type: 'CREDIT',
    amount: 270000, method: 'NEFT', status: 'PARTIAL', matchId: 'SYS-003', confidence: 78,
    description: 'STAR HEALTH & ALLIED INSURANCE CO LTD', riskFlag: false,
    variance: 15000, varianceNote: 'System ₹2,85,000 | Bank ₹2,70,000 | Δ ₹15,000',
  },
  {
    id: 'BANK-0046', bankRef: 'RTGS2026051900046', date: '2026-05-19', time: '10:23:45',
    narration: 'RTGS DB-APOLLO MEDICALS-MED', type: 'DEBIT',
    amount: 185000, method: 'RTGS', status: 'MATCHED', matchId: 'SYS-004', confidence: 99,
    description: 'APOLLO MEDICALS PVT LTD', riskFlag: false,
  },
  {
    id: 'BANK-0047', bankRef: 'CHQ2026051900047', date: '2026-05-19', time: '10:50:00',
    narration: 'CHEQUE PAYMENT 004521', type: 'DEBIT',
    amount: 32000, method: 'CHEQUE', status: 'UNMATCHED', matchId: null, confidence: 0,
    description: 'CHEQUE CLEARANCE – CHQ NO 004521', riskFlag: true,
    riskNote: 'Cheque clearance has no matching system voucher. Urgent: identify payee.',
  },
  {
    id: 'BANK-0048', bankRef: 'UPI2026051900048', date: '2026-05-19', time: '11:03:55',
    narration: 'UPI-GPAY-LAB-REF-4526', type: 'CREDIT',
    amount: 8750, method: 'UPI', status: 'MATCHED', matchId: 'SYS-006', confidence: 96,
    description: 'GOOGLE PAY – LAB', riskFlag: false,
  },
  {
    id: 'BANK-0049', bankRef: 'INT2026051900049', date: '2026-05-19', time: '11:00:00',
    narration: 'INTEREST CREDIT MAY 2026', type: 'CREDIT',
    amount: 12400, method: 'SYSTEM', status: 'UNMATCHED', matchId: null, confidence: 0,
    description: 'QUARTERLY INTEREST CREDIT', riskFlag: false,
    riskNote: 'Bank interest not booked in system. Create interest income entry.',
  },
  {
    id: 'BANK-0050', bankRef: 'NEFT2026051900050', date: '2026-05-19', time: '11:20:00',
    narration: 'NEFT CR-UNITED INDIA INS-UI891234', type: 'CREDIT',
    amount: 195000, method: 'NEFT', status: 'SUGGESTED', matchId: null, confidence: 45,
    description: 'UNITED INDIA INSURANCE CO', riskFlag: false,
    aiSuggested: true, aiNote: 'AI: Possible match with pending claim UI-891234. Verify before accepting.',
  },
  {
    id: 'BANK-0051', bankRef: 'NEFT2026051900051', date: '2026-05-19', time: '11:16:22',
    narration: 'NEFT DB-SALARY-NURSING-Q2', type: 'DEBIT',
    amount: 420000, method: 'NEFT', status: 'IN_REVIEW', matchId: 'SYS-007', confidence: 65,
    description: 'SALARY DISBURSEMENT – NURSING STAFF', riskFlag: false,
    variance: 5000, varianceNote: 'System ₹4,25,000 | Bank ₹4,20,000 | Δ ₹5,000',
  },
  {
    id: 'BANK-0052', bankRef: 'RTGS2026051900052', date: '2026-05-19', time: '11:46:30',
    narration: 'RTGS CR-TATA MOTORS-CORP', type: 'CREDIT',
    amount: 320000, method: 'RTGS', status: 'MATCHED', matchId: 'SYS-008', confidence: 98,
    description: 'TATA MOTORS LIMITED', riskFlag: false,
  },
  {
    id: 'BANK-0053', bankRef: 'IMPS2026051900053', date: '2026-05-19', time: '12:05:12',
    narration: 'IMPS DB-DUPLICATE-VENDOR-PAY', type: 'DEBIT',
    amount: 185000, method: 'IMPS', status: 'EXCEPTION', matchId: null, confidence: 0,
    description: 'SUSPECTED DUPLICATE – APOLLO MEDICALS', riskFlag: true,
    riskNote: 'CRITICAL: Duplicate of BANK-0046 (Apollo Medicals ₹1,85,000). Bank reversal initiated.',
  },
  {
    id: 'BANK-0054', bankRef: 'NEFT2026051900054', date: '2026-05-19', time: '12:15:00',
    narration: 'NEFT DB-UNKNOWN-TXN-REF88234', type: 'DEBIT',
    amount: 18500, method: 'NEFT', status: 'EXCEPTION', matchId: null, confidence: 0,
    description: 'OUTWARD NEFT – REF 88234 – SUSPICIOUS', riskFlag: true,
    riskNote: 'CRITICAL: Unauthorized debit. No voucher. Investigate immediately.',
  },
  {
    id: 'BANK-0055', bankRef: 'RZP2026051900055', date: '2026-05-19', time: '12:31:15',
    narration: 'RZPY SETTLEMENT BATCH 18MAY', type: 'CREDIT',
    amount: 142350, method: 'GATEWAY', status: 'SUGGESTED', matchId: 'SYS-010', confidence: 83,
    description: 'RAZORPAY SETTLEMENT BATCH', riskFlag: false, aiSuggested: true,
  },
  {
    id: 'BANK-0056', bankRef: 'GST2026051900056', date: '2026-05-19', time: '12:45:00',
    narration: 'GST TDS DEDUCTION AUTO', type: 'DEBIT',
    amount: 8500, method: 'AUTO', status: 'UNMATCHED', matchId: null, confidence: 0,
    description: 'AUTOMATIC GST TDS DEDUCTION', riskFlag: false,
    riskNote: 'GST TDS not booked in system.',
  },
  {
    id: 'BANK-0057', bankRef: 'ECS2026051900057', date: '2026-05-19', time: '13:06:00',
    narration: 'ECS DB-SIEMENS-MRI-EMI-MAY', type: 'DEBIT',
    amount: 245000, method: 'ECS', status: 'MATCHED', matchId: 'SYS-011', confidence: 100,
    description: 'SIEMENS HEALTHINEERS EMI', riskFlag: false,
  },
];

// ─── KPI CONFIG ────────────────────────────────────────────────────────────────
export const BR_KPI_CONFIG = [
  { id: 'totalTxns',   label: 'Total Transactions',    value: 29,          prev: 27,         format: 'number', icon: 'BarChart3',    color: 'blue',    trend: 'up',   aiFlag: false, desc: 'System + bank combined' },
  { id: 'matched',     label: 'Matched',                value: 8,           prev: 6,          format: 'number', icon: 'CheckCircle2', color: 'emerald', trend: 'up',   aiFlag: false, desc: 'Fully reconciled today' },
  { id: 'unmatched',   label: 'Unmatched',              value: 8,           prev: 11,         format: 'number', icon: 'XCircle',      color: 'red',     trend: 'down', aiFlag: true,  desc: 'Require attention' },
  { id: 'partial',     label: 'Partial / In Review',    value: 4,           prev: 3,          format: 'number', icon: 'AlertCircle',  color: 'amber',   trend: 'up',   aiFlag: true,  desc: 'Variance detected' },
  { id: 'bankBalance', label: 'Bank Balance',            value: 103180000,   prev: 98450000,   format: 'lakh',   icon: 'Landmark',     color: 'indigo',  trend: 'up',   aiFlag: false, desc: 'All accounts combined' },
  { id: 'bookBalance', label: 'Book Balance',            value: 102920000,   prev: 97850000,   format: 'lakh',   icon: 'BookOpen',     color: 'violet',  trend: 'up',   aiFlag: false, desc: 'GL reconciled balance' },
  { id: 'variance',    label: 'Net Variance',            value: 260000,      prev: 600000,     format: 'lakh',   icon: 'TrendingDown', color: 'orange',  trend: 'down', aiFlag: true,  desc: 'Bank vs Book difference' },
  { id: 'settlements', label: 'Pending Settlements',    value: 3,           prev: 5,          format: 'number', icon: 'Clock',        color: 'cyan',    trend: 'down', aiFlag: false, desc: 'Gateway + Insurance' },
  { id: 'riskAlerts',  label: 'Risk Alerts',            value: 4,           prev: 2,          format: 'number', icon: 'ShieldAlert',  color: 'rose',    trend: 'up',   aiFlag: true,  desc: 'Fraud + Exception flags' },
  { id: 'autoMatch',   label: 'AI Auto-Matched',         value: 6,           prev: 4,          format: 'number', icon: 'Sparkles',     color: 'purple',  trend: 'up',   aiFlag: false, desc: 'AI reconciled today' },
];

// ─── AI INSIGHTS ───────────────────────────────────────────────────────────────
export const AI_INSIGHTS = [
  { id: 'AI-001', type: 'FRAUD_RISK',       severity: 'critical', title: 'Suspected Duplicate Payment Detected',      body: 'BANK-0053 (₹1,85,000 to Apollo Medicals) appears to be a duplicate of BANK-0046 settled earlier today. Bank reversal has been initiated. Immediate verification required.',                                     action: 'Review Now',    txnIds: ['BANK-0053', 'BANK-0046'], confidence: 94 },
  { id: 'AI-002', type: 'UNMATCHED',        severity: 'high',     title: 'Unidentified Inward Credit ₹75,000',        body: 'BANK-0043 shows an inward NEFT credit of ₹75,000 from an unknown entity. No matching system receipt found. Possible misdirected transfer or fraud routing.',                                                    action: 'Investigate',   txnIds: ['BANK-0043'],              confidence: 88 },
  { id: 'AI-003', type: 'SETTLEMENT',       severity: 'warning',  title: 'Insurance Variance ₹15,000 – Star Health',  body: 'Insurance settlement from Star Health shows ₹15,000 less than booked. Likely TDS deduction at source. Verify claim details and create TDS receivable entry.',                                               action: 'Check Claim',   txnIds: ['SYS-003', 'BANK-0045'],   confidence: 91 },
  { id: 'AI-004', type: 'MATCH_SUGGESTION', severity: 'info',     title: 'AI Match: United India Insurance ₹1.95L',   body: 'BANK-0050 (₹1,95,000 from United India Insurance) likely matches pending claim UI-891234. Confidence 45%. Manual verification recommended before accepting this match.',                                    action: 'Review Match',  txnIds: ['BANK-0050'],              confidence: 45 },
  { id: 'AI-005', type: 'BANK_CHARGE',      severity: 'info',     title: '3 Unbooked Bank Charges Detected',          body: 'Bank charges ₹2,850 (BANK-0044) + GST TDS ₹8,500 (BANK-0056) + Interest credit ₹12,400 (BANK-0049) not recorded in books. Create adjustment entries to reconcile.',                                      action: 'Create Entries',txnIds: ['BANK-0044','BANK-0056','BANK-0049'], confidence: 99 },
  { id: 'AI-006', type: 'LIQUIDITY',        severity: 'info',     title: 'Liquidity Forecast: ₹2.8Cr inflow 48hrs',   body: 'Based on pending gateway settlements and insurance claims, AI forecasts ₹2.8Cr net inflow by 21-May-2026. Razorpay settlement (₹4.85L) expected today 6PM.',                                                  action: 'View Forecast', txnIds: [],                         confidence: 76 },
];

// ─── EXCEPTIONS ────────────────────────────────────────────────────────────────
export const EXCEPTIONS = [
  { id: 'EXC-001', type: 'UNIDENTIFIED_CREDIT',  severity: 'high',     ref: 'BANK-0043',         amount: 75000,  date: '2026-05-19', status: 'OPEN',      assignee: 'Deepa M.',        note: 'Unknown NEFT credit. Possible erroneous transfer or fraud.' },
  { id: 'EXC-002', type: 'DUPLICATE_DEBIT',      severity: 'critical', ref: 'BANK-0053',         amount: 185000, date: '2026-05-19', status: 'ESCALATED', assignee: 'CFO',             note: 'Suspected duplicate vendor payment. Bank reversal initiated.' },
  { id: 'EXC-003', type: 'BOOK_BANK_VARIANCE',   severity: 'medium',   ref: 'SYS-003/BANK-0045', amount: 15000,  date: '2026-05-19', status: 'IN_REVIEW', assignee: 'Priya S.',        note: 'TDS deduction variance on Star Health insurance claim.' },
  { id: 'EXC-004', type: 'MISSING_BANK_ENTRY',   severity: 'high',     ref: 'SYS-009',           amount: 18500,  date: '2026-05-19', status: 'OPEN',      assignee: 'Suresh K.',       note: 'Refund processed in system but no corresponding bank debit.' },
  { id: 'EXC-005', type: 'UNAUTHORIZED_DEBIT',   severity: 'critical', ref: 'BANK-0054',         amount: 18500,  date: '2026-05-19', status: 'ESCALATED', assignee: 'Finance Controller', note: 'Unauthorized outward NEFT. No voucher. Immediate investigation required.' },
  { id: 'EXC-006', type: 'UNBOOKED_BANK_CHARGE', severity: 'low',      ref: 'BANK-0044',         amount: 2850,   date: '2026-05-19', status: 'OPEN',      assignee: 'Accounts Team',   note: 'Monthly bank charges not recorded in books.' },
];

// ─── FRAUD ALERTS ──────────────────────────────────────────────────────────────
export const FRAUD_ALERTS = [
  { id: 'FR-001', type: 'DUPLICATE_PAYMENT',  severity: 'critical', title: 'Duplicate Vendor Payment',       detail: 'Apollo Medicals payment ₹1,85,000 debited twice from HDFC account (BANK-0046 + BANK-0053). Exposure: ₹1,85,000.', txnId: 'BANK-0053', user: 'System/Auto',     branch: 'Main',  exposure: 185000, aiConfidence: 94, status: 'ESCALATED' },
  { id: 'FR-002', type: 'UNAUTHORIZED_DEBIT', severity: 'critical', title: 'Unauthorized Bank Debit',        detail: 'Outward NEFT ₹18,500 with no voucher. Beneficiary details suspicious. Bank complaint filed.', txnId: 'BANK-0054', user: 'Unknown',        branch: 'Main',  exposure: 18500,  aiConfidence: 89, status: 'ESCALATED' },
  { id: 'FR-003', type: 'UNIDENTIFIED_CREDIT',severity: 'high',     title: 'Unknown Inward Transfer ₹75K',   detail: 'NEFT credit ₹75,000 from unregistered entity. Possible fraudulent routing or misdirected transfer.', txnId: 'BANK-0043', user: 'External',       branch: 'Main',  exposure: 75000,  aiConfidence: 78, status: 'OPEN' },
  { id: 'FR-004', type: 'REFUND_ANOMALY',     severity: 'high',     title: 'Phantom Refund Detected',        detail: 'Refund ₹18,500 processed in system but no corresponding bank debit. Possible phantom refund scheme.', txnId: 'SYS-009', user: 'Priya S.',        branch: 'South', exposure: 18500,  aiConfidence: 82, status: 'OPEN' },
];

// ─── LIQUIDITY DATA ────────────────────────────────────────────────────────────
export const LIQUIDITY_DATA = {
  forecast: [
    { date: 'Today',  inflow: 3245000, outflow: 1285000, balance: 103180000 },
    { date: 'May 20', inflow: 4820000, outflow: 2100000, balance: 105880000 },
    { date: 'May 21', inflow: 6340000, outflow: 3200000, balance: 109020000 },
    { date: 'May 22', inflow: 2180000, outflow: 4500000, balance: 106700000 },
    { date: 'May 23', inflow: 3900000, outflow: 1800000, balance: 108800000 },
    { date: 'May 24', inflow: 1200000, outflow: 800000,  balance: 109200000 },
    { date: 'May 25', inflow: 5600000, outflow: 2400000, balance: 112400000 },
  ],
  accountBreakdown: [
    { account: 'HDFC – 4521',  balance: 42850000, utilization: 82, color: '#6366f1' },
    { account: 'ICICI – 3310', balance: 31540000, utilization: 61, color: '#8b5cf6' },
    { account: 'SBI – 7893',   balance: 18920000, utilization: 37, color: '#06b6d4' },
    { account: 'Axis – 6672',  balance: 9870000,  utilization: 19, color: '#a78bfa' },
  ],
  settlementPipeline: [
    { source: 'Razorpay',             amount: 485000,  eta: 'Today 6PM', status: 'IN_TRANSIT',  color: 'cyan' },
    { source: 'Star Health Insurance',amount: 850000,  eta: 'May 21',    status: 'PROCESSING',  color: 'blue' },
    { source: 'PhonePe Gateway',      amount: 124000,  eta: 'May 20',    status: 'CONFIRMED',   color: 'emerald' },
    { source: 'United India Insurance',amount: 195000, eta: 'May 22',    status: 'PENDING',     color: 'amber' },
  ],
};

// ─── AI CHAT RESPONSES ─────────────────────────────────────────────────────────
export const AI_RESPONSES = {
  'unmatched upi':        'Found 3 unmatched UPI/digital transactions today. BANK-0043 (₹75,000 unknown sender – HIGH RISK), SYS-005 (₹50,000 IP advance – no bank credit yet), SYS-012 (₹1,00,000 ICU deposit – pending bank close). Recommend immediate review of BANK-0043.',
  'delayed settlement':   'Settlement delays detected: Star Health ₹8.5L (3 days late), Razorpay batch ₹4.85L (ETA today 6PM), United India Insurance ₹1.95L (expected 22-May). Total pipeline: ₹15.3L. Razorpay settlement should clear by tonight.',
  'duplicate':            'Critical: 1 confirmed duplicate payment – BANK-0053 duplicates BANK-0046 (Apollo Medicals ₹1,85,000). Financial exposure: ₹1,85,000. Bank reversal initiated. Also monitoring 2 near-duplicate UPI credits in pipeline.',
  'suspicious':           'Suspicious activity: BANK-0054 (Unauthorized outward NEFT ₹18,500) flagged CRITICAL – no voucher found. SYS-009 refund (₹18,500) shows in books but no bank debit. These amounts match – investigate possible linked fraud scheme.',
  'fraud':                'Fraud summary: 2 critical alerts (BANK-0053 duplicate ₹1.85L + BANK-0054 unauthorized ₹18,500), 2 high-risk items (BANK-0043 unknown credit ₹75K + SYS-009 phantom refund ₹18,500). Total exposure: ₹2,97,000. Recommend immediate CFO escalation.',
  'variance':             'Net variance today: ₹2,60,000 (Bank ₹10,31,80,000 vs Book ₹10,29,20,000). Key variances: Star Health TDS ₹15,000, Salary advance ₹5,000, Unbooked charges ₹2,850 + ₹8,500, Interest not booked ₹12,400. Remaining ₹2,16,250 under investigation.',
  'liquidity':            'Liquidity forecast: Current combined balance ₹10.32Cr. Forecasted inflow ₹2.8Cr by May 21. Razorpay ₹4.85L clearing today 6PM. Book balance expected to normalize by May 22. Net positive treasury outlook for next 7 days.',
  'default':              'I am your AI Treasury Intelligence Assistant. I analyze banking transactions, detect anomalies, and provide reconciliation insights. Try: "unmatched UPI", "delayed settlement", "duplicate", "suspicious", "fraud", "variance", or "liquidity".',
};

export const MATCH_DISTRIBUTION = { MATCHED: 8, UNMATCHED: 8, PARTIAL: 2, IN_REVIEW: 2, EXCEPTION: 4, SUGGESTED: 2, ADJUSTED: 3 };
