// ─── Payment Receipt — Constants, Mock Data, KPI Config ────────────────────────
// Theme: Emerald / Teal  (#10b981 primary, #059669 accent)

// ─── Formatters ───────────────────────────────────────────────────────────────
export function fmtINR(n) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)}L`;
  if (Math.abs(n) >= 1_000)       return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${Number(n).toFixed(0)}`;
}
export function fmtINRFull(n) {
  return '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
export function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function fmtDateTime(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
export function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
export function pick(arr)       { return arr[rand(0, arr.length - 1)]; }
export function uid()           { return Math.random().toString(36).slice(2, 9).toUpperCase(); }
export const todayISO = () => new Date().toISOString().split('T')[0];

// ─── Receipt Number ────────────────────────────────────────────────────────────
export function genReceiptNo() {
  const yr  = new Date().getFullYear();
  const key = `fact_rcpt_seq_${yr}`;
  const n   = parseInt(localStorage.getItem(key) || '6100') + 1;
  localStorage.setItem(key, String(n));
  return `RCP-${yr}-${String(n).padStart(5, '0')}`;
}

// ─── Status Configs ───────────────────────────────────────────────────────────
export const RECEIPT_STATUSES = {
  DRAFT:       { label: 'Draft',       bg: 'bg-slate-100 dark:bg-slate-700',        text: 'text-slate-500 dark:text-slate-300'       },
  SUBMITTED:   { label: 'Submitted',   bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400'         },
  APPROVED:    { label: 'Approved',    bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400'   },
  ALLOCATED:   { label: 'Allocated',   bg: 'bg-teal-100 dark:bg-teal-900/30',       text: 'text-teal-700 dark:text-teal-400'         },
  RECONCILED:  { label: 'Reconciled',  bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-700 dark:text-violet-400'     },
  REVERSED:    { label: 'Reversed',    bg: 'bg-rose-100 dark:bg-rose-900/30',       text: 'text-rose-700 dark:text-rose-400'         },
  REFUNDED:    { label: 'Refunded',    bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400'       },
};

export const INV_STATUSES = {
  PENDING:        { label: 'Pending',      bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400'   },
  PARTIAL:        { label: 'Partial',      bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400'     },
  PAID:           { label: 'Paid',         bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400'},
  OVERDUE:        { label: 'Overdue',      bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-400'       },
  INS_PENDING:    { label: 'Ins. Pending', bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-700 dark:text-violet-400' },
};

export const RECON_STATUS = {
  RECONCILED:       { label: 'Reconciled',        color: '#10b981' },
  GATEWAY_PENDING:  { label: 'Gateway Pending',   color: '#f59e0b' },
  BANK_PENDING:     { label: 'Bank Pending (T+1)',color: '#6366f1' },
  TPA_PENDING:      { label: 'TPA Pending 5–7d',  color: '#0284c7' },
  CHEQUE_CLEARING:  { label: 'Cheque Clearing 3d',color: '#8b5cf6' },
};

// ─── Payment Modes ─────────────────────────────────────────────────────────────
export const PAYMENT_MODE_CONFIG = [
  { id: 'CASH',       label: 'Cash',             color: '#10b981', recon: 'RECONCILED'      },
  { id: 'CARD',       label: 'Card / POS',        color: '#6366f1', recon: 'GATEWAY_PENDING' },
  { id: 'UPI',        label: 'UPI',              color: '#8b5cf6', recon: 'GATEWAY_PENDING' },
  { id: 'NEFT',       label: 'NEFT / RTGS',      color: '#0284c7', recon: 'RECONCILED'      },
  { id: 'CHEQUE',     label: 'Cheque / DD',      color: '#f59e0b', recon: 'CHEQUE_CLEARING' },
  { id: 'INSURANCE',  label: 'Insurance',        color: '#e11d48', recon: 'TPA_PENDING'     },
  { id: 'CORPORATE',  label: 'Corporate Credit', color: '#1d4ed8', recon: 'BANK_PENDING'    },
  { id: 'ADVANCE',    label: 'Advance Adjust',   color: '#f97316', recon: 'RECONCILED'      },
  { id: 'WALLET',     label: 'Wallet',           color: '#ec4899', recon: 'GATEWAY_PENDING' },
];

export const BANK_ACCOUNTS = [
  { id:'hdfc', label:'HDFC Bank — A/c 0012 (Collections)' },
  { id:'icici',label:'ICICI Bank — A/c 5289 (UPI/Card)' },
  { id:'sbi',  label:'SBI — A/c 7734 (TPA Pool)' },
  { id:'axis', label:'Axis Bank — A/c 3341 (Corporate)' },
  { id:'cash', label:'Cash Vault — Main Counter' },
];

export const TPA_LIST = ['Star Health','United India IC','New India Assurance','ICICI Lombard','HDFC Ergo','Bajaj Allianz','Care Health','Niva Bupa','Reliance Health','ManipalCigna'];
export const COUNTERS  = ['Counter 1 – General OP','Counter 2 – IP Billing','Counter 3 – Emergency','Counter 4 – Pharmacy','Counter 5 – Insurance Desk','Counter 6 – Day Care'];

// ─── Workflow States ───────────────────────────────────────────────────────────
export const WORKFLOW_STEPS = [
  { id:'DRAFT',       label:'Draft',          desc:'Receipt created'         },
  { id:'SUBMITTED',   label:'Submitted',      desc:'Sent for approval'       },
  { id:'APPROVED',    label:'Approved',       desc:'Cashier supervisor sign-off' },
  { id:'ALLOCATED',   label:'Allocated',      desc:'Payment applied to invoices' },
  { id:'GL_POSTED',   label:'GL Posted',      desc:'Journal entry auto-generated'},
  { id:'RECONCILED',  label:'Reconciled',     desc:'Bank/gateway cleared'    },
  { id:'CLOSED',      label:'Closed',         desc:'Lifecycle complete'      },
];

// ─── Mock Patients + Invoices ─────────────────────────────────────────────────
export const MOCK_PATIENTS = [
  {
    id: 'HC-100234', name: 'Ramesh Kumar M.', age: 56, gender: 'Male',
    dept: 'Cardiology', doctor: 'Dr. Mehta S.', phone: '+91 98765 43210',
    insurance: 'Star Health', insPolicy: 'POL-482901', corporate: null,
    advance: 12000, creditLimit: 0,
    invoices: [
      { id:'INV-2026-000412', date:'2026-05-10', type:'IP',       gross:78000, collected:18000, outstanding:42000, insurancePending:18000, status:'PARTIAL',     claimStatus:'UNDER_REVIEW',  days:10 },
      { id:'INV-2026-000389', date:'2026-05-02', type:'OT',       gross:95000, collected:0,     outstanding:32000, insurancePending:63000, status:'INS_PENDING', claimStatus:'PRE_AUTH_APPROVED', days:18 },
      { id:'INV-2026-000401', date:'2026-05-07', type:'LAB',      gross:4800,  collected:0,     outstanding:4800,  insurancePending:0,     status:'PENDING',     claimStatus:'N/A',           days:13 },
    ],
  },
  {
    id: 'HC-100189', name: 'Priya Nair S.', age: 34, gender: 'Female',
    dept: 'Oncology', doctor: 'Dr. Reddy A.', phone: '+91 91234 56789',
    insurance: 'HDFC Ergo', insPolicy: 'POL-714822', corporate: null,
    advance: 25000, creditLimit: 0,
    invoices: [
      { id:'INV-2026-000376', date:'2026-04-28', type:'ICU',      gross:142000,collected:30000, outstanding:48000, insurancePending:64000, status:'PARTIAL',     claimStatus:'SUBMITTED',     days:22 },
      { id:'INV-2026-000398', date:'2026-05-05', type:'PHARMACY', gross:18400, collected:0,     outstanding:18400, insurancePending:12000, status:'PENDING',     claimStatus:'PRE_AUTH_APPROVED', days:15 },
      { id:'INV-2026-000408', date:'2026-05-09', type:'RADIOLOGY',gross:9200,  collected:0,     outstanding:9200,  insurancePending:7000,  status:'PENDING',     claimStatus:'NOT_APPLICABLE',days:11 },
    ],
  },
  {
    id: 'HC-100312', name: 'Arjun Singh B.', age: 42, gender: 'Male',
    dept: 'Orthopedics', doctor: 'Dr. Kapoor R.', phone: '+91 70000 11223',
    insurance: null, insPolicy: null, corporate: 'Infosys Ltd.',
    advance: 0, creditLimit: 50000,
    invoices: [
      { id:'INV-2026-000421', date:'2026-05-12', type:'OT',       gross:68000, collected:0,     outstanding:68000, insurancePending:0,     status:'PENDING',     claimStatus:'N/A',           days:8 },
      { id:'INV-2026-000415', date:'2026-05-11', type:'OP',       gross:2800,  collected:0,     outstanding:2800,  insurancePending:0,     status:'OVERDUE',     claimStatus:'N/A',           days:9 },
    ],
  },
  {
    id: 'HC-100455', name: 'Fatima Begum K.', age: 28, gender: 'Female',
    dept: 'Gynecology', doctor: 'Dr. Iyer K.', phone: '+91 87654 32109',
    insurance: 'Bajaj Allianz', insPolicy: 'POL-338021', corporate: null,
    advance: 5000, creditLimit: 0,
    invoices: [
      { id:'INV-2026-000430', date:'2026-05-13', type:'PACKAGE',  gross:45000, collected:10000, outstanding:12000, insurancePending:23000, status:'PARTIAL',     claimStatus:'PRE_AUTH_APPROVED', days:7 },
    ],
  },
];

// ─── Audit Events ──────────────────────────────────────────────────────────────
export const AUDIT_EVENTS_SAMPLE = [
  { id:1, ts: Date.now()-600_000,  actor:'Billing Counter 2',  action:'Receipt Created',       detail:'Draft receipt RCP-2026-06101 initialized',   type:'create'   },
  { id:2, ts: Date.now()-540_000,  actor:'Billing Counter 2',  action:'Patient Selected',      detail:'HC-100234 — Ramesh Kumar M. loaded',          type:'update'   },
  { id:3, ts: Date.now()-480_000,  actor:'Billing Counter 2',  action:'Payment Mode Added',    detail:'Cash ₹20,000 — no gateway',                   type:'update'   },
  { id:4, ts: Date.now()-420_000,  actor:'AI Risk Engine',     action:'Risk Score Computed',   detail:'Score: 14/100 — Low Risk ✓',                  type:'ai'       },
  { id:5, ts: Date.now()-360_000,  actor:'Billing Counter 2',  action:'Invoice Allocated',     detail:'INV-2026-000401 ← ₹4,800 (full)',             type:'update'   },
  { id:6, ts: Date.now()-300_000,  actor:'Workflow Engine',    action:'Auto-Approved',         detail:'Amount < ₹50K — no supervisor needed',        type:'workflow' },
  { id:7, ts: Date.now()-240_000,  actor:'GL Engine',          action:'Journal Entry Posted',  detail:'JV-2026-09112  Dr. Cash A/c ₹20,000',         type:'system'   },
  { id:8, ts: Date.now()-180_000,  actor:'AR Engine',          action:'AR Balance Updated',    detail:'HC-100234 outstanding reduced ₹4,800',        type:'system'   },
  { id:9, ts: Date.now()-60_000,   actor:'Treasury Engine',    action:'Cash Position Updated', detail:'Counter 2 cash: +₹20,000',                    type:'system'   },
];

// ─── KPI Configuration ────────────────────────────────────────────────────────
export const PR_KPI_CONFIG = [
  { key:'totalCollectedToday',  label:'Collected Today',       accent:'#10b981', icon:'TrendingUp',    fmt:'currency', trend:+8.4  },
  { key:'cashCollections',      label:'Cash Collections',      accent:'#22c55e', icon:'Banknote',      fmt:'currency', trend:+3.1  },
  { key:'digitalCollections',   label:'Card + UPI + NEFT',     accent:'#6366f1', icon:'CreditCard',    fmt:'currency', trend:+12.8 },
  { key:'insuranceSettled',     label:'Insurance Settled',     accent:'#e11d48', icon:'Shield',        fmt:'currency', trend:-2.4  },
  { key:'advanceAdjusted',      label:'Advance Adjusted',      accent:'#f97316', icon:'Scale',         fmt:'currency', trend:null  },
  { key:'pendingAllocation',    label:'Pending Allocation',    accent:'#f59e0b', icon:'Clock',         fmt:'currency', trend:null, alert:true },
  { key:'refundsToday',         label:'Refunds Today',         accent:'#8b5cf6', icon:'RotateCcw',     fmt:'currency', trend:null  },
  { key:'pendingReconciliation',label:'Pending Recon.',        accent:'#0284c7', icon:'RefreshCcw',    fmt:'currency', trend:null, alert:true },
  { key:'highRiskTransactions', label:'High-Risk Txns',        accent:'#dc2626', icon:'AlertTriangle', fmt:'count',    trend:null, alert:true },
  { key:'counterVariance',      label:'Counter Variance',      accent:'#06b6d4', icon:'CheckCircle2',  fmt:'currency', trend:null  },
];

export const MOCK_KPI_VALUES = {
  totalCollectedToday:   6_84_000,
  cashCollections:       2_12_000,
  digitalCollections:    3_51_000,
  insuranceSettled:      1_21_000,
  advanceAdjusted:          28_000,
  pendingAllocation:        44_500,
  refundsToday:             12_000,
  pendingReconciliation:    59_500,
  highRiskTransactions:          2,
  counterVariance:               0,
};

// ─── Trend + Analytics Data ────────────────────────────────────────────────────
export const COLLECTION_TREND = [
  { day:'Mon', cash:82000, card:54000, upi:43000, insurance:120000 },
  { day:'Tue', cash:91000, card:61000, upi:55000, insurance:98000  },
  { day:'Wed', cash:74000, card:49000, upi:61000, insurance:145000 },
  { day:'Thu', cash:105000,card:72000, upi:70000, insurance:167000 },
  { day:'Fri', cash:118000,card:85000, upi:82000, insurance:189000 },
  { day:'Sat', cash:143000,card:93000, upi:98000, insurance:132000 },
  { day:'Sun', cash:67000, card:38000, upi:45000, insurance:78000  },
];

export const PAYMENT_MODE_PIE = [
  { name:'Cash',      value:31, color:'#10b981' },
  { name:'UPI',       value:22, color:'#8b5cf6' },
  { name:'Card',      value:19, color:'#6366f1' },
  { name:'Insurance', value:20, color:'#e11d48' },
  { name:'NEFT/Other',value:8,  color:'#f59e0b' },
];

export const DEPT_COLLECTION = [
  { dept:'OPD',      amount:142000 },
  { dept:'IPD',      amount:287000 },
  { dept:'OT',       amount:198000 },
  { dept:'Lab',      amount:68000  },
  { dept:'Pharmacy', amount:113000 },
  { dept:'Radiology',amount:89000  },
  { dept:'ICU',      amount:176000 },
  { dept:'Emergency',amount:54000  },
];

export const DEPT_COLORS = ['#10b981','#0891b2','#6366f1','#f59e0b','#8b5cf6','#e11d48','#1d4ed8','#ec4899'];

// ─── Activity Feed ─────────────────────────────────────────────────────────────
export const MOCK_ACTIVITY = [
  { id:'r1', action:'Payment Received',   patient:'Ramesh Kumar M.',  amount:20000, mode:'Cash',  ts:Date.now()-120_000,  status:'APPROVED'   },
  { id:'r2', action:'Insurance Settled',  patient:'Priya Nair S.',    amount:64000, mode:'TPA',   ts:Date.now()-340_000,  status:'RECONCILED' },
  { id:'r3', action:'Refund Processed',   patient:'Venkat Rao T.',    amount:8200,  mode:'UPI',   ts:Date.now()-600_000,  status:'APPROVED'   },
  { id:'r4', action:'Advance Adjusted',   patient:'Fatima Begum K.',  amount:5000,  mode:'ADV',   ts:Date.now()-900_000,  status:'ALLOCATED'  },
  { id:'r5', action:'Payment Received',   patient:'Arjun Singh B.',   amount:15000, mode:'Card',  ts:Date.now()-1200_000, status:'RECONCILED' },
  { id:'r6', action:'Receipt Reversed',   patient:'Meera Thomas',     amount:32000, mode:'NEFT',  ts:Date.now()-1800_000, status:'REVERSED'   },
];

// ─── AI Prompts & Canned Responses ────────────────────────────────────────────
export const AI_PROMPTS = [
  'Suggest invoice allocation',
  'Detect suspicious patterns',
  'Show unreconciled receipts',
  'Forecast today\'s collections',
  'Cashier risk analysis',
  'Outstanding recovery plan',
  'Insurance claim status',
  'Show high-risk transactions',
];

export const AI_RESPONSES = {
  'Suggest invoice allocation': `**Recommended Allocation for HC-100234:**\n\n1. **INV-2026-000401** (Lab ₹4,800) — Clear this first; no insurance, aging 13 days\n2. **INV-2026-000412** (IP ₹42,000) — Allocate patient share ₹15,200 now\n3. **INV-2026-000389** (OT) — Wait for Star Health pre-auth confirmation\n\n> Star Health claim status is Under Review. Expected settlement window: 3–5 days. Recommend confirming pre-auth before IP allocation.`,
  'Detect suspicious patterns': `**Risk Assessment — Current Session**\n\nRisk Score: **14 / 100** ✓ Low\n\n- No duplicate receipts detected\n- Payment amount within patient history norms\n- Cashier pattern: normal activity ✓\n- Discount: nil — no flag\n\n> Clean transaction. One observation: ₹12,000 advance balance available — patient may benefit from advance adjustment to reduce outstanding.`,
  'Show unreconciled receipts': `**Unreconciled Receipts — Today**\n\n| Receipt | Amount | Mode | Expected |\n|---------|--------|------|---------|\n| RCP-2026-06098 | ₹32,000 | UPI | Gateway T+0 |\n| RCP-2026-06095 | ₹18,500 | Card | POS T+1 |\n| RCP-2026-06087 | ₹9,000 | Cheque | Bank 3d |\n\nTotal unreconciled: **₹59,500**`,
  'Forecast today\'s collections': `**Collection Forecast — Today**\n\n- Projected: ₹6.84L (↑8.4% vs yesterday)\n- Cash: ₹2.1L | UPI/Card: ₹2.3L | Insurance: ₹1.2L | Other: ₹1.2L\n- Peak window: **11:00–13:00** and **17:00–19:00**\n- 3 high-value patients pending collection (₹2.4L+)\n\n> Recommend keeping Counter 2 open during peak window.`,
  'Cashier risk analysis': `**Counter 2 Session Analysis**\n\n- Receipts processed: 16 today\n- Avg processing time: 3m 28s ✓\n- Variance: ₹0 (clean)\n- Unauthorized discounts: 0\n- Risk score: **9 / 100** — Excellent\n\n> Top performer today. No escalation required.`,
  'Outstanding recovery plan': `**Recovery Forecast — HC-100234**\n\n1. **₹4,800** Lab — collectible today (no insurance)\n2. **₹15,200** IP patient share — send SMS reminder\n3. **₹18,000** Star Health — follow up TPA portal (3 days)\n\nProjected 7-day recovery: **₹38,000** (88% of outstanding)`,
  'Insurance claim status': `**Insurance Summary — HC-100234**\n\nInsurer: **Star Health** | Policy: POL-482901\n\n| Invoice | Claim | Amount | Status |\n|---------|-------|--------|---------|\n| INV-000412 | CL-48291 | ₹18,000 | Under Review |\n| INV-000389 | CL-48301 | ₹63,000 | Pre-Auth Approved |\n\n> Pre-auth for OT ₹63,000 is approved. Recommend finalizing IP billing to trigger claim submission.`,
  'Show high-risk transactions': `**High-Risk Transactions — Today**\n\n1. **RCP-2026-06088** — Cash ₹58,000 (exceeds ₹50K; Form 60 required)\n2. **RCP-2026-06079** — Discount 18% on INV-000399 (exceeds 15% threshold)\n\n> 2 transactions need action before close of day. Supervisor acknowledgment required for cash >₹50K.`,
};

export const AI_INIT_MSG = { role:'assistant', text:"Hello! I'm your **AI Collections Assistant** for FACT FinOS.\n\nI've analyzed today's billing activity and found **2 high-risk transactions** and **3 allocation opportunities**.\n\nHow can I help you today?" };
