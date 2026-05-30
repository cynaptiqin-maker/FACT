// ─── Cash Book Constants & Mock Data ─────────────────────────────────────────

export const RISK_LEVELS = {
  LOW:      { label: 'Low',      color: '#10b981', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30', badgeText: 'text-emerald-700 dark:text-emerald-400' },
  MEDIUM:   { label: 'Medium',   color: '#f59e0b', badgeBg: 'bg-amber-100 dark:bg-amber-900/30',    badgeText: 'text-amber-700 dark:text-amber-400'   },
  HIGH:     { label: 'High',     color: '#f97316', badgeBg: 'bg-orange-100 dark:bg-orange-900/30',  badgeText: 'text-orange-700 dark:text-orange-400' },
  CRITICAL: { label: 'Critical', color: '#ef4444', badgeBg: 'bg-red-100 dark:bg-red-900/30',        badgeText: 'text-red-700 dark:text-red-400'       },
};

export const TXN_TYPES = {
  RECEIPT:    { label: 'Receipt',     color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
  PAYMENT:    { label: 'Payment',     color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-700 dark:text-red-400'         },
  PETTY_CASH: { label: 'Petty Cash',  color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20',    text: 'text-amber-700 dark:text-amber-400'     },
  REVERSAL:   { label: 'Reversal',    color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/20',  text: 'text-violet-700 dark:text-violet-400'   },
  CONTRA:     { label: 'Contra',      color: '#0891b2', bg: 'bg-cyan-50 dark:bg-cyan-900/20',      text: 'text-cyan-700 dark:text-cyan-400'       },
  ADJUSTMENT: { label: 'Adjustment',  color: '#64748b', bg: 'bg-slate-100 dark:bg-slate-800',      text: 'text-slate-600 dark:text-slate-400'     },
};

export const SOURCE_MODULES = {
  OP_BILLING:  { label: 'OP Billing',   color: '#0891b2' },
  IP_BILLING:  { label: 'IP Billing',   color: '#6366f1' },
  PHARMACY:    { label: 'Pharmacy',     color: '#10b981' },
  LAB:         { label: 'Lab',          color: '#7c3aed' },
  RADIOLOGY:   { label: 'Radiology',   color: '#0284c7' },
  EMERGENCY:   { label: 'Emergency',   color: '#ef4444' },
  ICU:         { label: 'ICU',          color: '#dc2626' },
  CAFETERIA:   { label: 'Cafeteria',   color: '#d97706' },
  MANUAL:      { label: 'Manual Entry', color: '#64748b' },
  PAYROLL:     { label: 'Payroll',      color: '#f59e0b' },
};

export const RECONCILE_STATUSES = {
  RECONCILED:   { label: 'Reconciled',   color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  UNRECONCILED: { label: 'Unreconciled', color: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30',  text: 'text-orange-700 dark:text-orange-400'  },
  PARTIAL:      { label: 'Partial',      color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-400'    },
};

export const APPROVAL_STATUSES = {
  APPROVED:  { label: 'Approved',  dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  PENDING:   { label: 'Pending',   dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400'   },
  REJECTED:  { label: 'Rejected',  dot: 'bg-red-500',     text: 'text-red-600 dark:text-red-400'       },
  AUTO_APV:  { label: 'Auto-Apvd', dot: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400'     },
};

export const BRANCHES     = ['Main Hospital', 'North Wing', 'East Campus', 'ICU Block', 'Pharmacy', 'Emergency Wing'];
export const COUNTERS      = ['Counter-01', 'Counter-02', 'Counter-03', 'Counter-04', 'Pharmacy Counter', 'Emergency Counter', 'Lab Counter', 'OP Counter'];
export const DEPARTMENTS   = ['Outpatient', 'Inpatient', 'Pharmacy', 'Laboratory', 'Radiology', 'Emergency', 'ICU', 'Cafeteria', 'Administration'];

// ─── KPI Configuration ────────────────────────────────────────────────────────

export const CB_KPI_CONFIG = [
  { id: 'openingBalance', label: 'Opening Balance',       value: 5842600,   format: 'lakh',  trend: 0,    trendLabel: 'from yesterday',  color: '#0d9488', icon: 'Wallet',          aiFlag: false },
  { id: 'currentBalance', label: 'Current Cash Balance',  value: 7214300,   format: 'lakh',  trend: 23.5, trendLabel: 'vs yesterday',    color: '#10b981', icon: 'IndianRupee',     aiFlag: false },
  { id: 'totalReceipts',  label: 'Total Receipts Today',  value: 4862000,   format: 'lakh',  trend: 14.2, trendLabel: 'vs yesterday',    color: '#059669', icon: 'ArrowDownCircle', aiFlag: false },
  { id: 'totalPayments',  label: 'Total Payments Today',  value: 3490300,   format: 'lakh',  trend: 8.6,  trendLabel: 'vs yesterday',    color: '#ef4444', icon: 'ArrowUpCircle',   aiFlag: false },
  { id: 'netPosition',    label: 'Net Cash Position',     value: 1371700,   format: 'lakh',  trend: 31.2, trendLabel: 'vs yesterday',    color: '#0891b2', icon: 'TrendingUp',      aiFlag: true  },
  { id: 'unreconciled',   label: 'Unreconciled Entries',  value: 18,        format: 'num',   trend: -3,   trendLabel: 'vs yesterday',    color: '#f97316', icon: 'GitMerge',        aiFlag: true  },
  { id: 'variance',       label: 'Cash Variance Alerts',  value: 5,         format: 'num',   trend: 2,    trendLabel: 'vs yesterday',    color: '#ef4444', icon: 'AlertTriangle',   aiFlag: true  },
  { id: 'branchBalance',  label: 'Branch Cash Exposure',  value: 42600000,  format: 'crore', trend: 5.1,  trendLabel: 'vs last week',    color: '#8b5cf6', icon: 'Building2',       aiFlag: false },
  { id: 'pettyCash',      label: 'Petty Cash Utilization',value: 68.4,      format: 'pct',   trend: 12.1, trendLabel: 'of float',        color: '#d97706', icon: 'Coins',           aiFlag: true  },
  { id: 'highRisk',       label: 'High-Risk Transactions',value: 7,         format: 'num',   trend: 3,    trendLabel: 'flagged today',   color: '#dc2626', icon: 'ShieldAlert',     aiFlag: true  },
];

// ─── Format helpers ───────────────────────────────────────────────────────────

export function fmtINR(val) {
  if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (Math.abs(val) >= 100000)   return `₹${(val / 100000).toFixed(2)}L`;
  if (Math.abs(val) >= 1000)     return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString()}`;
}

// ─── Mock Cash Transactions ────────────────────────────────────────────────────

export const MOCK_CASH_TRANSACTIONS = [
  {
    id: 'TXN-CB-2026-00142', dateTime: '2026-05-19 09:14:32',
    txnType: 'RECEIPT', subType: 'OP Collection',
    branch: 'Main Hospital', counter: 'OP Counter', department: 'Outpatient',
    ledgerAccount: 'Cash in Hand - OP',
    narration: 'OP registration + consultation fee — Dr. Mehta OPD',
    receiptAmount: 2500, paymentAmount: 0, runningBalance: 7214300,
    user: 'Priya Sharma', reconcileStatus: 'RECONCILED', approvalStatus: 'AUTO_APV',
    riskLevel: 'LOW', riskScore: 12, sourceModule: 'OP_BILLING',
    patientId: 'HC-006214', voucherNo: 'RCV-2026-00892',
    shiftId: 'SHF-2026-0519-M', linkedJournals: ['JV-2026-04821'],
    attachments: [], notes: '',
  },
  {
    id: 'TXN-CB-2026-00141', dateTime: '2026-05-19 09:08:17',
    txnType: 'PAYMENT', subType: 'Petty Cash Expense',
    branch: 'North Wing', counter: 'Counter-02', department: 'Administration',
    ledgerAccount: 'Petty Cash - Admin',
    narration: 'Office stationery purchase — courier expenses',
    receiptAmount: 0, paymentAmount: 3400, runningBalance: 7211800,
    user: 'Amit Kumar', reconcileStatus: 'UNRECONCILED', approvalStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 18, sourceModule: 'MANUAL',
    patientId: null, voucherNo: 'PMT-2026-00341',
    shiftId: 'SHF-2026-0519-M', linkedJournals: [],
    attachments: ['receipt_001.pdf'], notes: 'Pending manager approval',
  },
  {
    id: 'TXN-CB-2026-00140', dateTime: '2026-05-19 08:52:44',
    txnType: 'RECEIPT', subType: 'Pharmacy Cash Sale',
    branch: 'Pharmacy', counter: 'Pharmacy Counter', department: 'Pharmacy',
    ledgerAccount: 'Cash in Hand - Pharmacy',
    narration: 'Retail pharmacy cash sale — prescription medicines',
    receiptAmount: 14820, paymentAmount: 0, runningBalance: 7215200,
    user: 'Sunita Reddy', reconcileStatus: 'RECONCILED', approvalStatus: 'AUTO_APV',
    riskLevel: 'LOW', riskScore: 8, sourceModule: 'PHARMACY',
    patientId: 'HC-006208', voucherNo: 'RCV-2026-00891',
    shiftId: 'SHF-2026-0519-M', linkedJournals: ['JV-2026-04820'],
    attachments: [], notes: '',
  },
  {
    id: 'TXN-CB-2026-00139', dateTime: '2026-05-19 08:41:09',
    txnType: 'RECEIPT', subType: 'IP Advance Collection',
    branch: 'Main Hospital', counter: 'Counter-01', department: 'Inpatient',
    ledgerAccount: 'Patient Advance - IP',
    narration: 'IP admission advance — Room 412 (General Ward)',
    receiptAmount: 50000, paymentAmount: 0, runningBalance: 7200380,
    user: 'Rajesh Nair', reconcileStatus: 'RECONCILED', approvalStatus: 'APPROVED',
    riskLevel: 'LOW', riskScore: 15, sourceModule: 'IP_BILLING',
    patientId: 'HC-006191', voucherNo: 'RCV-2026-00890',
    shiftId: 'SHF-2026-0519-M', linkedJournals: ['JV-2026-04819'],
    attachments: ['advance_receipt.pdf'], notes: '',
  },
  {
    id: 'TXN-CB-2026-00138', dateTime: '2026-05-19 08:29:55',
    txnType: 'PAYMENT', subType: 'Emergency Cash Payment',
    branch: 'Emergency Wing', counter: 'Emergency Counter', department: 'Emergency',
    ledgerAccount: 'Emergency Cash Fund',
    narration: 'Emergency medical supplies — ambulance consumables',
    receiptAmount: 0, paymentAmount: 8900, runningBalance: 7150380,
    user: 'Dr. Vijay Menon', reconcileStatus: 'UNRECONCILED', approvalStatus: 'PENDING',
    riskLevel: 'MEDIUM', riskScore: 54, sourceModule: 'EMERGENCY',
    patientId: null, voucherNo: 'PMT-2026-00340',
    shiftId: 'SHF-2026-0519-M', linkedJournals: [],
    attachments: [], notes: 'Emergency authorization required',
  },
  {
    id: 'TXN-CB-2026-00137', dateTime: '2026-05-19 08:15:22',
    txnType: 'RECEIPT', subType: 'Lab Collection',
    branch: 'East Campus', counter: 'Lab Counter', department: 'Laboratory',
    ledgerAccount: 'Cash in Hand - Lab',
    narration: 'Lab tests cash collection — CBC, lipid profile',
    receiptAmount: 6200, paymentAmount: 0, runningBalance: 7159280,
    user: 'Meena Pillai', reconcileStatus: 'RECONCILED', approvalStatus: 'AUTO_APV',
    riskLevel: 'LOW', riskScore: 10, sourceModule: 'LAB',
    patientId: 'HC-006184', voucherNo: 'RCV-2026-00889',
    shiftId: 'SHF-2026-0519-M', linkedJournals: ['JV-2026-04818'],
    attachments: [], notes: '',
  },
  {
    id: 'TXN-CB-2026-00136', dateTime: '2026-05-19 07:58:11',
    txnType: 'ADJUSTMENT', subType: 'Cash Variance Adjustment',
    branch: 'North Wing', counter: 'Counter-03', department: 'Administration',
    ledgerAccount: 'Cash Variance Account',
    narration: 'Counter shortage adjustment — shift closing variance',
    receiptAmount: 0, paymentAmount: 1200, runningBalance: 7153080,
    user: 'Harish Babu', reconcileStatus: 'PARTIAL', approvalStatus: 'PENDING',
    riskLevel: 'HIGH', riskScore: 72, sourceModule: 'MANUAL',
    patientId: null, voucherNo: 'ADJ-2026-00089',
    shiftId: 'SHF-2026-0518-E', linkedJournals: ['JV-2026-04817'],
    attachments: ['counter_report.pdf'], notes: 'Flagged by AI — unusual manual adjustment',
  },
  {
    id: 'TXN-CB-2026-00135', dateTime: '2026-05-19 07:42:38',
    txnType: 'RECEIPT', subType: 'Radiology Collection',
    branch: 'East Campus', counter: 'Counter-04', department: 'Radiology',
    ledgerAccount: 'Cash in Hand - Radiology',
    narration: 'MRI scan cash payment — Dr. Krishnan referral',
    receiptAmount: 18000, paymentAmount: 0, runningBalance: 7154280,
    user: 'Sonal Verma', reconcileStatus: 'RECONCILED', approvalStatus: 'APPROVED',
    riskLevel: 'LOW', riskScore: 11, sourceModule: 'RADIOLOGY',
    patientId: 'HC-006177', voucherNo: 'RCV-2026-00888',
    shiftId: 'SHF-2026-0519-M', linkedJournals: ['JV-2026-04816'],
    attachments: [], notes: '',
  },
  {
    id: 'TXN-CB-2026-00134', dateTime: '2026-05-18 22:14:55',
    txnType: 'PAYMENT', subType: 'ICU Cash Expense',
    branch: 'ICU Block', counter: 'Counter-01', department: 'ICU',
    ledgerAccount: 'ICU Emergency Fund',
    narration: 'ICU emergency drug procurement — Norepinephrine',
    receiptAmount: 0, paymentAmount: 24600, runningBalance: 7136280,
    user: 'Dr. Lakshmi Iyer', reconcileStatus: 'UNRECONCILED', approvalStatus: 'APPROVED',
    riskLevel: 'MEDIUM', riskScore: 48, sourceModule: 'ICU',
    patientId: 'HC-006142', voucherNo: 'PMT-2026-00339',
    shiftId: 'SHF-2026-0518-N', linkedJournals: ['JV-2026-04815'],
    attachments: ['prescription.pdf'], notes: 'Emergency drug procurement — ICU patient',
  },
  {
    id: 'TXN-CB-2026-00133', dateTime: '2026-05-18 21:48:22',
    txnType: 'CONTRA', subType: 'Cash to Bank Transfer',
    branch: 'Main Hospital', counter: 'Counter-01', department: 'Finance',
    ledgerAccount: 'Cash in Hand - Main',
    narration: 'Daily cash deposit — HDFC Bank current account',
    receiptAmount: 0, paymentAmount: 480000, runningBalance: 7160880,
    user: 'Deepa Krishnan', reconcileStatus: 'RECONCILED', approvalStatus: 'APPROVED',
    riskLevel: 'LOW', riskScore: 5, sourceModule: 'MANUAL',
    patientId: null, voucherNo: 'CTR-2026-00214',
    shiftId: 'SHF-2026-0518-E', linkedJournals: ['JV-2026-04814', 'JV-2026-04813'],
    attachments: ['bank_slip.pdf'], notes: 'Daily cash-to-bank contra entry',
  },
  {
    id: 'TXN-CB-2026-00132', dateTime: '2026-05-18 19:32:11',
    txnType: 'PAYMENT', subType: 'Staff Advance',
    branch: 'Main Hospital', counter: 'Counter-02', department: 'HR',
    ledgerAccount: 'Staff Advance Account',
    narration: 'Festival advance to nursing staff — 5 nurses',
    receiptAmount: 0, paymentAmount: 25000, runningBalance: 7640880,
    user: 'Ramya Subramaniam', reconcileStatus: 'UNRECONCILED', approvalStatus: 'PENDING',
    riskLevel: 'MEDIUM', riskScore: 55, sourceModule: 'PAYROLL',
    patientId: null, voucherNo: 'PMT-2026-00338',
    shiftId: 'SHF-2026-0518-E', linkedJournals: [],
    attachments: ['advance_list.pdf'], notes: 'Pending CFO approval',
  },
  {
    id: 'TXN-CB-2026-00131', dateTime: '2026-05-18 18:44:33',
    txnType: 'RECEIPT', subType: 'OP Collection',
    branch: 'Main Hospital', counter: 'OP Counter', department: 'Outpatient',
    ledgerAccount: 'Cash in Hand - OP',
    narration: 'Evening OPD batch collection — 12 patients',
    receiptAmount: 28400, paymentAmount: 0, runningBalance: 7665880,
    user: 'Priya Sharma', reconcileStatus: 'RECONCILED', approvalStatus: 'AUTO_APV',
    riskLevel: 'LOW', riskScore: 9, sourceModule: 'OP_BILLING',
    patientId: null, voucherNo: 'RCV-2026-00887',
    shiftId: 'SHF-2026-0518-E', linkedJournals: ['JV-2026-04812'],
    attachments: [], notes: 'Batch collection — 12 patients',
  },
  {
    id: 'TXN-CB-2026-00130', dateTime: '2026-05-18 17:21:08',
    txnType: 'REVERSAL', subType: 'Receipt Reversal',
    branch: 'Main Hospital', counter: 'Counter-01', department: 'Billing',
    ledgerAccount: 'Cash in Hand - Main',
    narration: 'Reversal of duplicate receipt — patient refund',
    receiptAmount: 0, paymentAmount: 5500, runningBalance: 7637480,
    user: 'Krishnan Nambiar', reconcileStatus: 'RECONCILED', approvalStatus: 'APPROVED',
    riskLevel: 'HIGH', riskScore: 76, sourceModule: 'OP_BILLING',
    patientId: 'HC-006098', voucherNo: 'REV-2026-00142',
    shiftId: 'SHF-2026-0518-E', linkedJournals: ['JV-2026-04811', 'JV-2026-04810'],
    attachments: ['reversal_auth.pdf'], notes: 'Manager authorized reversal — original RCV-2026-00871',
  },
  {
    id: 'TXN-CB-2026-00129', dateTime: '2026-05-18 16:05:42',
    txnType: 'RECEIPT', subType: 'Cafeteria Cash Sale',
    branch: 'Main Hospital', counter: 'Counter-03', department: 'Cafeteria',
    ledgerAccount: 'Cash in Hand - Cafeteria',
    narration: 'Cafeteria daily cash sales — food & beverages',
    receiptAmount: 12400, paymentAmount: 0, runningBalance: 7642980,
    user: 'Ananya Bose', reconcileStatus: 'UNRECONCILED', approvalStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 22, sourceModule: 'CAFETERIA',
    patientId: null, voucherNo: 'RCV-2026-00886',
    shiftId: 'SHF-2026-0518-A', linkedJournals: [],
    attachments: [], notes: '',
  },
  {
    id: 'TXN-CB-2026-00128', dateTime: '2026-05-18 14:38:19',
    txnType: 'PAYMENT', subType: 'Vendor Cash Payment',
    branch: 'Main Hospital', counter: 'Counter-01', department: 'Purchase',
    ledgerAccount: 'Cash in Hand - Main',
    narration: 'Emergency vendor cash payment — surgical gloves',
    receiptAmount: 0, paymentAmount: 45000, runningBalance: 7630580,
    user: 'Suresh Padmanabhan', reconcileStatus: 'UNRECONCILED', approvalStatus: 'PENDING',
    riskLevel: 'CRITICAL', riskScore: 88, sourceModule: 'MANUAL',
    patientId: null, voucherNo: 'PMT-2026-00337',
    shiftId: 'SHF-2026-0518-A', linkedJournals: [],
    attachments: [], notes: 'HIGH RISK: Large cash payment without PO reference — AI flagged',
  },
  {
    id: 'TXN-CB-2026-00127', dateTime: '2026-05-18 13:14:51',
    txnType: 'RECEIPT', subType: 'IP Discharge Settlement',
    branch: 'North Wing', counter: 'Counter-02', department: 'Inpatient',
    ledgerAccount: 'Patient Advance - IP',
    narration: 'IP discharge final settlement — Room 308 (5-day stay)',
    receiptAmount: 142000, paymentAmount: 0, runningBalance: 7675580,
    user: 'Meera Chandran', reconcileStatus: 'RECONCILED', approvalStatus: 'APPROVED',
    riskLevel: 'LOW', riskScore: 14, sourceModule: 'IP_BILLING',
    patientId: 'HC-005892', voucherNo: 'RCV-2026-00885',
    shiftId: 'SHF-2026-0518-A', linkedJournals: ['JV-2026-04809', 'JV-2026-04808'],
    attachments: ['discharge_summary.pdf', 'bill_receipt.pdf'], notes: 'Partial advance adjusted — balance ₹67,500 received',
  },
  {
    id: 'TXN-CB-2026-00126', dateTime: '2026-05-18 11:22:38',
    txnType: 'PETTY_CASH', subType: 'Petty Cash Expense',
    branch: 'East Campus', counter: 'Counter-04', department: 'Maintenance',
    ledgerAccount: 'Petty Cash - Maintenance',
    narration: 'Generator fuel refill — campus power backup',
    receiptAmount: 0, paymentAmount: 18500, runningBalance: 7533580,
    user: 'Biju Thomas', reconcileStatus: 'UNRECONCILED', approvalStatus: 'PENDING',
    riskLevel: 'MEDIUM', riskScore: 51, sourceModule: 'MANUAL',
    patientId: null, voucherNo: 'PC-2026-00218',
    shiftId: 'SHF-2026-0518-A', linkedJournals: [],
    attachments: ['fuel_receipt.jpg'], notes: 'Above petty cash limit — requires additional approval',
  },
  {
    id: 'TXN-CB-2026-00125', dateTime: '2026-05-18 09:48:14',
    txnType: 'RECEIPT', subType: 'Emergency Collection',
    branch: 'Emergency Wing', counter: 'Emergency Counter', department: 'Emergency',
    ledgerAccount: 'Cash in Hand - Emergency',
    narration: 'Emergency ward cash collection — 3 trauma cases',
    receiptAmount: 31500, paymentAmount: 0, runningBalance: 7552080,
    user: 'Nurse Rita Dsouza', reconcileStatus: 'PARTIAL', approvalStatus: 'PENDING',
    riskLevel: 'MEDIUM', riskScore: 45, sourceModule: 'EMERGENCY',
    patientId: null, voucherNo: 'RCV-2026-00884',
    shiftId: 'SHF-2026-0518-M', linkedJournals: ['JV-2026-04807'],
    attachments: [], notes: 'Partial — 1 of 3 patients yet to pay balance',
  },
  {
    id: 'TXN-CB-2026-00124', dateTime: '2026-05-18 08:31:07',
    txnType: 'RECEIPT', subType: 'Opening Cash Received',
    branch: 'Main Hospital', counter: 'Counter-01', department: 'Finance',
    ledgerAccount: 'Cash in Hand - Main',
    narration: 'Morning opening cash float — counter initialization',
    receiptAmount: 50000, paymentAmount: 0, runningBalance: 7520580,
    user: 'Deepa Krishnan', reconcileStatus: 'RECONCILED', approvalStatus: 'AUTO_APV',
    riskLevel: 'LOW', riskScore: 6, sourceModule: 'MANUAL',
    patientId: null, voucherNo: 'RCV-2026-00883',
    shiftId: 'SHF-2026-0518-M', linkedJournals: ['JV-2026-04806'],
    attachments: [], notes: 'Daily counter opening float',
  },
  {
    id: 'TXN-CB-2026-00123', dateTime: '2026-05-17 23:14:22',
    txnType: 'PAYMENT', subType: 'Vendor Cash Payment',
    branch: 'Pharmacy', counter: 'Pharmacy Counter', department: 'Pharmacy',
    ledgerAccount: 'Cash in Hand - Pharmacy',
    narration: 'Emergency drug purchase — Vecuronium Bromide',
    receiptAmount: 0, paymentAmount: 62000, runningBalance: 7470580,
    user: 'Pharmacist Rekha', reconcileStatus: 'UNRECONCILED', approvalStatus: 'APPROVED',
    riskLevel: 'HIGH', riskScore: 74, sourceModule: 'PHARMACY',
    patientId: null, voucherNo: 'PMT-2026-00336',
    shiftId: 'SHF-2026-0517-N', linkedJournals: ['JV-2026-04805'],
    attachments: ['drug_purchase_auth.pdf'], notes: 'Night shift emergency purchase — high value cash payment',
  },
  {
    id: 'TXN-CB-2026-00122', dateTime: '2026-05-17 21:05:44',
    txnType: 'RECEIPT', subType: 'IP Advance Collection',
    branch: 'North Wing', counter: 'Counter-02', department: 'Inpatient',
    ledgerAccount: 'Patient Advance - IP',
    narration: 'ICU admission advance — critical patient',
    receiptAmount: 100000, paymentAmount: 0, runningBalance: 7532580,
    user: 'Meera Chandran', reconcileStatus: 'RECONCILED', approvalStatus: 'APPROVED',
    riskLevel: 'LOW', riskScore: 13, sourceModule: 'IP_BILLING',
    patientId: 'HC-006105', voucherNo: 'RCV-2026-00882',
    shiftId: 'SHF-2026-0517-E', linkedJournals: ['JV-2026-04804'],
    attachments: ['advance_auth.pdf'], notes: 'ICU admission — family paid cash advance',
  },
];

// ─── AI Insights ──────────────────────────────────────────────────────────────

export const CB_AI_INSIGHTS = [
  {
    id: 'ins-001', icon: 'ShieldAlert', severity: 'critical',
    title: 'High-value cash payment without PO',
    detail: 'TXN-CB-2026-00128: ₹45,000 cash payment to vendor without PO reference. Potential policy breach — immediate review required.',
    action: 'Review Transaction',
  },
  {
    id: 'ins-002', icon: 'AlertOctagon', severity: 'critical',
    title: 'Night shift pharmacy cash — ₹62K',
    detail: 'TXN-CB-2026-00123: High-value pharmacy drug purchase at 11 PM. Pattern deviates from normal procurement workflow.',
    action: 'Investigate',
  },
  {
    id: 'ins-003', icon: 'AlertTriangle', severity: 'warning',
    title: '18 unreconciled entries pending',
    detail: 'End-of-day target is 0 unreconciled. Current exposure: ₹1.84L. Counter-03 (North Wing) has 6 open items.',
    action: 'Start Reconciliation',
  },
  {
    id: 'ins-004', icon: 'TrendingDown', severity: 'warning',
    title: 'Petty cash 68.4% utilized',
    detail: 'East Campus petty cash float will exhaust at current rate by 4 PM. Recommend top-up authorization now.',
    action: 'Authorize Top-Up',
  },
  {
    id: 'ins-005', icon: 'AlertTriangle', severity: 'warning',
    title: 'Counter-03 shortage pattern',
    detail: 'North Wing Counter-03 has had 3 consecutive shift shortages: ₹800, ₹1,200, ₹1,450. Escalating trend detected.',
    action: 'View Counter Report',
  },
  {
    id: 'ins-006', icon: 'TrendingUp', severity: 'info',
    title: 'OP collections up 14.2% today',
    detail: 'OP billing collections tracking well above yesterday. Pharmacy cash sales also elevated. Good cash inflow day.',
    action: 'View Analytics',
  },
];

export const CB_PROMPT_SUGGESTIONS = [
  'Find suspicious cash transactions',
  'Forecast tomorrow\'s cash requirement',
  'Show unreconciled high-risk entries',
  'Identify counters with frequent shortages',
  'Show petty cash utilization by department',
  'Detect duplicate receipts today',
  'Show cash variance by branch',
  'Which counters need immediate reconciliation?',
];

// ─── AI Response Map ──────────────────────────────────────────────────────────

export const CB_AI_RESPONSES = {
  'Find suspicious cash transactions': 'AI treasury scan complete. 3 high-risk cash transactions detected:\n\n• TXN-CB-2026-00128 — ₹45K vendor payment without PO, no supporting docs\n• TXN-CB-2026-00123 — ₹62K pharmacy purchase at 11 PM, night shift anomaly\n• TXN-CB-2026-00136 — Manual variance adjustment, 3rd consecutive shortage at Counter-03\n\nCombined exposure: ₹1.09L. Recommend immediate CFO review.',
  'Forecast tomorrow\'s cash requirement': 'Tomorrow\'s cash forecast (Monday 20 May):\n\n• OP Collections: ₹52L (estimated, Monday peak day)\n• IP Advances: ₹18L (3 planned admissions)\n• Pharmacy Sales: ₹14L (normal Monday)\n• Payments due: ₹31L (vendor payments + staff)\n\nNet projected position: +₹53L\nRecommend keeping ₹8L minimum float across all counters.',
  'Show unreconciled high-risk entries': 'Found 18 unreconciled entries. High-risk unreconciled:\n\n1. PMT-2026-00337 (₹45K) — No PO, CRITICAL risk\n2. PMT-2026-00336 (₹62K) — Night pharmacy, HIGH risk\n3. ADJ-2026-00089 (₹1.2K) — Counter shortage, HIGH risk\n4. PMT-2026-00338 (₹25K) — Staff advance, MEDIUM risk\n\nRecommend reconciling CRITICAL items before EOD.',
  default: 'Cash position as of 09:14: ₹72.14L across all counters. Today\'s inflow: ₹48.62L (↑14.2%). 18 entries pending reconciliation. 5 variance alerts active. 2 critical fraud flags require immediate attention. Counter-03 shortage pattern detected — recommend audit.',
};

// ─── Cash Flow Chart Data ─────────────────────────────────────────────────────

export const CASH_FLOW_FORECAST = [
  { day: 'Mon', inflow: 48, outflow: 31 },
  { day: 'Tue', inflow: 52, outflow: 38 },
  { day: 'Wed', inflow: 44, outflow: 29 },
  { day: 'Thu', inflow: 61, outflow: 42 },
  { day: 'Fri', inflow: 58, outflow: 35 },
  { day: 'Sat', inflow: 72, outflow: 48 },
  { day: 'Sun', inflow: 49, outflow: 35 },
  { day: 'Mon*', inflow: 54, outflow: null },
  { day: 'Tue*', inflow: 50, outflow: null },
];

export const HOURLY_CASH_DATA = [
  { hour: '8AM',  receipts: 8.2,  payments: 2.1  },
  { hour: '9AM',  receipts: 14.5, payments: 3.4  },
  { hour: '10AM', receipts: 22.1, payments: 5.8  },
  { hour: '11AM', receipts: 18.4, payments: 4.2  },
  { hour: '12PM', receipts: 12.8, payments: 8.6  },
  { hour: '1PM',  receipts: 9.4,  payments: 12.4 },
  { hour: '2PM',  receipts: 16.2, payments: 4.8  },
  { hour: '3PM',  receipts: 19.8, payments: 3.2  },
  { hour: '4PM',  receipts: 24.1, payments: 6.4  },
  { hour: '5PM',  receipts: 28.6, payments: 5.1  },
  { hour: '6PM',  receipts: 31.2, payments: 4.8  },
  { hour: '7PM',  receipts: 18.4, payments: 9.2  },
  { hour: '8PM',  receipts: 12.6, payments: 14.8 },
  { hour: '9PM',  receipts: 8.4,  payments: 24.6 },
];

// ─── Branch Cash Positions ────────────────────────────────────────────────────

export const BRANCH_CASH_POSITIONS = [
  { branch: 'Main Hospital',   balance: 2842000, limit: 5000000, utilization: 56.8, variance: 0,     status: 'OK'   },
  { branch: 'North Wing',      balance: 1241000, limit: 2000000, utilization: 62.1, variance: -1200, status: 'WARN' },
  { branch: 'East Campus',     balance: 894000,  limit: 1500000, utilization: 59.6, variance: 0,     status: 'OK'   },
  { branch: 'ICU Block',       balance: 642000,  limit: 1000000, utilization: 64.2, variance: 0,     status: 'OK'   },
  { branch: 'Pharmacy',        balance: 1084000, limit: 1500000, utilization: 72.3, variance: 0,     status: 'OK'   },
  { branch: 'Emergency Wing',  balance: 511300,  limit: 800000,  utilization: 63.9, variance: -800,  status: 'WARN' },
];

// ─── Counter Performance ──────────────────────────────────────────────────────

export const COUNTER_PERFORMANCE = [
  { counter: 'OP Counter',        receipts: 48200, payments: 2100, variance: 0,     shortages: 0, efficiency: 98 },
  { counter: 'Counter-01',        receipts: 192000, payments: 485000, variance: 0,   shortages: 0, efficiency: 99 },
  { counter: 'Counter-02',        receipts: 142000, payments: 28400, variance: 0,    shortages: 1, efficiency: 94 },
  { counter: 'Counter-03',        receipts: 12400,  payments: 1200,  variance: -1200,shortages: 3, efficiency: 61 },
  { counter: 'Counter-04',        receipts: 49700,  payments: 18500, variance: 0,    shortages: 0, efficiency: 97 },
  { counter: 'Pharmacy Counter',  receipts: 76820,  payments: 62000, variance: 0,    shortages: 0, efficiency: 96 },
  { counter: 'Emergency Counter', receipts: 31500,  payments: 8900,  variance: -800, shortages: 1, efficiency: 88 },
  { counter: 'Lab Counter',       receipts: 6200,   payments: 0,     variance: 0,    shortages: 0, efficiency: 100},
];
