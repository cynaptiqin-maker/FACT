// ─── Design tokens ────────────────────────────────────────────────────────────
export const GL_COLORS = {
  debit:   '#dc2626',
  credit:  '#16a34a',
  net:     '#0891b2',
  warning: '#d97706',
  anomaly: '#ef4444',
  ai:      '#7c3aed',
  brand:   '#1C3741',
  muted:   '#6b7280',
};

// ─── Reference data ────────────────────────────────────────────────────────────
export const BRANCHES = [
  { id: 'all',     label: 'All Branches',        short: 'ALL' },
  { id: 'main',    label: 'Main Hospital',        short: 'MH'  },
  { id: 'north',   label: 'North Campus',         short: 'NC'  },
  { id: 'south',   label: 'South Campus',         short: 'SC'  },
  { id: 'central', label: 'Central Diagnostics',  short: 'CD'  },
];

export const DEPARTMENTS = [
  { id: 'icu',       label: 'ICU'            },
  { id: 'pharmacy',  label: 'Pharmacy'       },
  { id: 'ot',        label: 'OT'             },
  { id: 'radiology', label: 'Radiology'      },
  { id: 'admin',     label: 'Administration' },
  { id: 'lab',       label: 'Laboratory'     },
  { id: 'cardio',    label: 'Cardiology'     },
  { id: 'billing',   label: 'Billing'        },
];

export const VOUCHER_TYPES = [
  { id: 'JV',  label: 'Journal Voucher',  color: 'blue'    },
  { id: 'PV',  label: 'Payment Voucher',  color: 'red'     },
  { id: 'RV',  label: 'Receipt Voucher',  color: 'green'   },
  { id: 'CV',  label: 'Contra Voucher',   color: 'purple'  },
  { id: 'SV',  label: 'Sales Voucher',    color: 'emerald' },
  { id: 'PuV', label: 'Purchase Voucher', color: 'orange'  },
];

export const ACCOUNTS = [
  { id: '1001', code: '1001', label: 'Cash in Hand',             type: 'Asset',     group: 'Current Assets'    },
  { id: '1002', code: '1002', label: 'SBI Current Account',      type: 'Asset',     group: 'Bank & Cash'       },
  { id: '1003', code: '1003', label: 'HDFC Bank Account',        type: 'Asset',     group: 'Bank & Cash'       },
  { id: '1004', code: '1004', label: 'Petty Cash',               type: 'Asset',     group: 'Bank & Cash'       },
  { id: '2001', code: '2001', label: 'Accounts Payable',         type: 'Liability', group: 'Current Liabilities'},
  { id: '2002', code: '2002', label: 'TPA Payables',             type: 'Liability', group: 'Current Liabilities'},
  { id: '2003', code: '2003', label: 'GST Payable',              type: 'Liability', group: 'Tax Liabilities'   },
  { id: '2004', code: '2004', label: 'TDS Payable',              type: 'Liability', group: 'Tax Liabilities'   },
  { id: '3001', code: '3001', label: 'Patient Revenue',          type: 'Revenue',   group: 'Clinical Revenue'  },
  { id: '3002', code: '3002', label: 'Insurance Revenue',        type: 'Revenue',   group: 'Clinical Revenue'  },
  { id: '3003', code: '3003', label: 'Pharmacy Revenue',         type: 'Revenue',   group: 'Other Revenue'     },
  { id: '3004', code: '3004', label: 'OT Revenue',               type: 'Revenue',   group: 'Clinical Revenue'  },
  { id: '3005', code: '3005', label: 'Radiology Revenue',        type: 'Revenue',   group: 'Diagnostic Revenue'},
  { id: '3006', code: '3006', label: 'Lab Revenue',              type: 'Revenue',   group: 'Diagnostic Revenue'},
  { id: '4001', code: '4001', label: 'Medical Supplies',         type: 'Expense',   group: 'Clinical Expenses' },
  { id: '4002', code: '4002', label: 'Staff Salaries',           type: 'Expense',   group: 'Payroll Expenses'  },
  { id: '4003', code: '4003', label: 'Utility Expenses',         type: 'Expense',   group: 'Overhead'          },
  { id: '4004', code: '4004', label: 'ICU Consumables',          type: 'Expense',   group: 'Clinical Expenses' },
  { id: '4005', code: '4005', label: 'Doctor Consultation Fees', type: 'Expense',   group: 'Clinical Expenses' },
  { id: '5001', code: '5001', label: 'Accounts Receivable',      type: 'Asset',     group: 'Current Assets'    },
  { id: '5002', code: '5002', label: 'TPA Receivable',           type: 'Asset',     group: 'Receivables'       },
  { id: '5003', code: '5003', label: 'Insurance Receivable',     type: 'Asset',     group: 'Receivables'       },
];

// ─── Mock ledger entries ───────────────────────────────────────────────────────
const NARRATIONS = [
  'IPD billing — Ward B patient services, May 2026',
  'Star Health TPA claim settlement — Batch 42',
  'Pharmacy OTC & prescription drug sales',
  'ICU consumables procurement — Q2 batch',
  'Dr. Ramesh Nair consultation fees — May 2026',
  'HDFC → SBI fund transfer — operating account',
  'GST on pharma sales — May 2026',
  'Cardiac OT revenue booking — 8 procedures',
  'CT scan & MRI radiology revenue',
  'Staff salary disbursement — May 2026',
  'Biomedical equipment depreciation entry',
  'Manual adjustment — insurance claim reversal',
  'Vendor payment — Apollo Med Supplies',
  'TPA claim reversal — United Health TPA',
  'Patient advance adjustment — IPD admission',
  'Pathology lab revenue — May Q2',
  'Electricity bill payment — Main campus',
  'Doctor payout — revenue sharing Q1 2026',
  'Cardiac package billing adjustment',
  'Mediassist TPA settlement — 17 claims',
  'ICU nursing charge allocation',
  'Pharmacy purchase — controlled substances',
  'Annual maintenance contract — biomedical',
  'Staff advance recovery — salary deduction',
  'Patient refund — insurance overpayment',
];

const CREATORS = ['Dr. Arjun P.', 'Priya Krishnan', 'Ravi Menon', 'Sneha Thomas', 'System Auto'];
const APPROVERS = ['CFO', 'Finance Head', 'Sr. Accountant', null];
const SOURCES   = ['Patient Billing', 'Insurance TPA', 'Pharmacy', 'Payroll', 'Manual Entry', 'Journal', 'Fixed Assets'];
const STATUSES  = ['posted', 'posted', 'posted', 'pending', 'draft', 'approved'];
const RECON     = ['reconciled', 'reconciled', 'unreconciled', 'partial', 'auto-matched'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function amt(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function daysAgo(n) {
  const d = new Date('2026-05-19');
  d.setDate(d.getDate() - (n % 45));
  return d.toISOString().slice(0, 10);
}

let runningBal = 85000000;
export const LEDGER_ENTRIES = Array.from({ length: 120 }, (_, i) => {
  const isDebit = Math.random() > 0.46;
  const a       = amt(5000, 2500000);
  const debit   = isDebit ? a : 0;
  const credit  = isDebit ? 0 : a;
  runningBal   += (credit - debit);

  const vtype   = pick(VOUCHER_TYPES);
  const branch  = BRANCHES.slice(1)[Math.floor(Math.random() * 4)];
  const dept    = pick(DEPARTMENTS);
  const account = pick(ACCOUNTS);

  return {
    id:                  `TXN-2026-${String(i + 1001).padStart(5, '0')}`,
    date:                daysAgo(i),
    voucherNo:           `${vtype.id}-2026-${String(i + 1).padStart(5, '0')}`,
    voucherType:         vtype,
    account,
    narration:           pick(NARRATIONS),
    branch,
    department:          dept,
    costCenter:          `CC-${dept.id.toUpperCase()}-${Math.floor(Math.random() * 9) + 1}`,
    debit,
    credit,
    balance:             Math.round(runningBal),
    currency:            'INR',
    reference:           `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status:              pick(STATUSES),
    reconciliationStatus: pick(RECON),
    sourceModule:        pick(SOURCES),
    createdBy:           pick(CREATORS),
    approvedBy:          pick(APPROVERS),
    isAnomaly:           Math.random() > 0.92,
    riskScore:           Math.floor(Math.random() * 100),
    attachments:         Math.floor(Math.random() * 4),
    linkedEntries:       Math.floor(Math.random() * 6),
  };
});

// ─── KPI data ─────────────────────────────────────────────────────────────────
export const KPI_DATA = {
  totalDebits:             { value: 48750000, delta: +12.4, dir: 'up',   fmt: 'currency' },
  totalCredits:            { value: 47320000, delta: +8.7,  dir: 'up',   fmt: 'currency' },
  netMovement:             { value: 1430000,  delta: +34.2, dir: 'up',   fmt: 'currency' },
  outstandingRecon:        { value: 253,      delta: -15.3, dir: 'down', fmt: 'count'    },
  unpostedEntries:         { value: 47,       delta: -22.1, dir: 'down', fmt: 'count'    },
  suspiciousTransactions:  { value: 8,        delta: +2,    dir: 'up',   fmt: 'count'    },
  branchVariance:          { value: 14,       delta: +5,    dir: 'up',   fmt: 'count'    },
  pendingApprovals:        { value: 31,       delta: -8,    dir: 'down', fmt: 'count'    },
};

// ─── AI insights ──────────────────────────────────────────────────────────────
export const AI_INSIGHTS = [
  {
    id: 'ai-1',
    type: 'anomaly',
    severity: 'critical',
    icon: 'AlertTriangle',
    title: 'ICU Revenue Spike Detected',
    body: 'ICU revenue posted ₹18.4L on May 17 — 340% above 30-day avg. Manual review recommended.',
    account: 'OT Revenue',
    amount: 18400000,
    ts: '2026-05-17 14:23',
    actionLabel: 'Investigate',
  },
  {
    id: 'ai-2',
    type: 'reconciliation',
    severity: 'high',
    icon: 'RefreshCw',
    title: '23 Unreconciled TPA Entries',
    body: 'Star Health TPA entries from April unmatched. Estimated exposure: ₹6.2L.',
    account: 'TPA Receivable',
    amount: 620000,
    ts: '2026-05-15 09:11',
    actionLabel: 'Reconcile Now',
  },
  {
    id: 'ai-3',
    type: 'duplicate',
    severity: 'critical',
    icon: 'Copy',
    title: 'Duplicate Payment Detected',
    body: 'Vendor payment ₹2.8L to Apollo Med Supplies detected twice within 4 minutes. Possible double-post.',
    account: 'Accounts Payable',
    amount: 280000,
    ts: '2026-05-18 11:47',
    actionLabel: 'Review Entry',
  },
  {
    id: 'ai-4',
    type: 'trend',
    severity: 'medium',
    icon: 'TrendingDown',
    title: 'Pharmacy Revenue Below Forecast',
    body: 'May pharmacy revenue tracking 18% below budget. YoY decline of 7%.',
    account: 'Pharmacy Revenue',
    amount: -180000,
    ts: '2026-05-19 08:00',
    actionLabel: 'View Trend',
  },
  {
    id: 'ai-5',
    type: 'compliance',
    severity: 'medium',
    icon: 'Shield',
    title: 'GST Entry Missing — 4 Invoices',
    body: 'Invoices INV-2026-00134–137 have no corresponding GST entry. Compliance risk.',
    account: 'GST Payable',
    amount: 84000,
    ts: '2026-05-16 16:55',
    actionLabel: 'Fix Now',
  },
];

// ─── Financial flow nodes ──────────────────────────────────────────────────────
export const FLOW_STEPS = [
  { id: 'f1', label: 'Patient Billing',       sub: 'INV-2026-00421',  amount: 245000, type: 'source'     },
  { id: 'f2', label: 'Revenue Posting',       sub: 'SV-2026-00421',   amount: 245000, type: 'posting'    },
  { id: 'f3', label: 'GST Allocation',        sub: '18% on services', amount: 18900,  type: 'tax'        },
  { id: 'f4', label: 'AR Receivable',         sub: 'Patient due',     amount: 226100, type: 'asset'      },
  { id: 'f5', label: 'Insurance Adjustment',  sub: 'Star Health TPA', amount: 85000,  type: 'adjustment' },
  { id: 'f6', label: 'Net Settlement',        sub: 'Bank credit',     amount: 141100, type: 'settlement' },
];

// ─── Reconciliation summary ───────────────────────────────────────────────────
export const RECON_SUMMARY = {
  total:           1240,
  reconciled:      987,
  unreconciled:    189,
  partial:         64,
  percentComplete: 79.6,
};

// ─── AI chat quick prompts ────────────────────────────────────────────────────
export const AI_PROMPTS = [
  'Why did ICU revenue spike on May 17?',
  'Find unreconciled insurance entries',
  'Show suspicious pharmacy transactions',
  'Explain this balance difference',
  'Find all manual adjustments this month',
  'Detect duplicate payments',
  'Show entries pending approval',
];

// ─── Audit trail events ───────────────────────────────────────────────────────
export const AUDIT_EVENTS = [
  { id: 'e1', action: 'Created',        user: 'System Auto',    role: 'System',         ts: '2026-05-17 14:23:01', change: 'Entry created from Patient Billing module'        },
  { id: 'e2', action: 'Reviewed',       user: 'Priya Krishnan', role: 'Sr. Accountant', ts: '2026-05-17 15:40:12', change: 'Entry reviewed — no issues found'                 },
  { id: 'e3', action: 'Approved',       user: 'Ravi Menon',     role: 'Finance Head',   ts: '2026-05-17 16:55:30', change: 'Approved for posting'                             },
  { id: 'e4', action: 'Posted',         user: 'System Auto',    role: 'System',         ts: '2026-05-17 17:00:00', change: 'Entry posted to General Ledger'                   },
  { id: 'e5', action: 'Flagged by AI',  user: 'AI Engine',      role: 'System',         ts: '2026-05-17 17:01:45', change: 'Anomaly flag: amount 340% above 30-day average'   },
  { id: 'e6', action: 'Investigated',   user: 'Dr. Arjun P.',   role: 'CFO',            ts: '2026-05-18 09:15:00', change: 'Reviewed; confirmed valid — special OT package'   },
];

// ─── Chart data ───────────────────────────────────────────────────────────────
export const TREND_DATA = [
  { month: 'Dec',  debit: 38200000, credit: 37100000, net:  1100000 },
  { month: 'Jan',  debit: 41500000, credit: 40200000, net:  1300000 },
  { month: 'Feb',  debit: 39800000, credit: 38900000, net:   900000 },
  { month: 'Mar',  debit: 44100000, credit: 43500000, net:   600000 },
  { month: 'Apr',  debit: 45900000, credit: 44600000, net:  1300000 },
  { month: 'May',  debit: 48750000, credit: 47320000, net:  1430000 },
];

export const BRANCH_DATA = [
  { branch: 'Main',    posted: 52, pending: 8,  unposted: 3 },
  { branch: 'North',   posted: 31, pending: 5,  unposted: 2 },
  { branch: 'South',   posted: 24, pending: 4,  unposted: 6 },
  { branch: 'Central', posted: 18, pending: 2,  unposted: 1 },
];

// ─── Status styling helpers ───────────────────────────────────────────────────
export function statusStyle(s) {
  const map = {
    posted:       'bg-emerald-50 text-emerald-700 border-emerald-200',
    approved:     'bg-cyan-50    text-cyan-700    border-cyan-200',
    pending:      'bg-amber-50   text-amber-700   border-amber-200',
    draft:        'bg-slate-100  text-slate-500   border-slate-200',
    rejected:     'bg-red-50     text-red-700     border-red-200',
  };
  return map[s] || 'bg-slate-100 text-slate-500 border-slate-200';
}

export function reconStyle(s) {
  const map = {
    reconciled:    'bg-emerald-50  text-emerald-600',
    'auto-matched':'bg-blue-50     text-blue-600',
    partial:       'bg-amber-50    text-amber-600',
    unreconciled:  'bg-red-50      text-red-600',
  };
  return map[s] || 'bg-slate-100 text-slate-500';
}

export function voucherStyle(t) {
  const map = {
    blue:    'bg-blue-50   text-blue-700   border-blue-200',
    red:     'bg-red-50    text-red-700    border-red-200',
    green:   'bg-green-50  text-green-700  border-green-200',
    purple:  'bg-purple-50 text-purple-700 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    orange:  'bg-orange-50 text-orange-700 border-orange-200',
  };
  return map[t] || 'bg-slate-100 text-slate-500 border-slate-200';
}

// ─── Number formatting helpers ────────────────────────────────────────────────
export function fmtCurrency(v, short = false) {
  if (v == null || v === 0) return '—';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (short) {
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000)     return `${sign}₹${(abs / 1000).toFixed(1)}K`;
    return `${sign}₹${abs.toLocaleString('en-IN')}`;
  }
  return `₹${abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}
