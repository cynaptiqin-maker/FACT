// ─── Patient Billing Constants & Mock Data ────────────────────────────────────

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
export function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
export function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ─── Status definitions ───────────────────────────────────────────────────────
export const PAYMENT_STATUSES = {
  PAID:              { label: 'Paid',              bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  PARTIAL:           { label: 'Partial',           bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-400'    },
  PENDING:           { label: 'Pending',           bg: 'bg-slate-100 dark:bg-slate-700',       text: 'text-slate-600 dark:text-slate-300'    },
  OVERDUE:           { label: 'Overdue',           bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-400'        },
  INSURANCE_PENDING: { label: 'Ins. Pending',      bg: 'bg-blue-100 dark:bg-blue-900/30',      text: 'text-blue-700 dark:text-blue-400'      },
  CORPORATE:         { label: 'Corporate',         bg: 'bg-violet-100 dark:bg-violet-900/30',  text: 'text-violet-700 dark:text-violet-400'  },
  WRITE_OFF:         { label: 'Write-Off',         bg: 'bg-rose-100 dark:bg-rose-900/30',      text: 'text-rose-700 dark:text-rose-400'      },
};

export const INSURANCE_STATUSES = {
  PRE_AUTH_PENDING: { label: 'Pre-Auth Pending', dot: 'bg-slate-400',   text: 'text-slate-500 dark:text-slate-400'   },
  APPROVED:         { label: 'Approved',         dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  SUBMITTED:        { label: 'Submitted',        dot: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-400'     },
  UNDER_REVIEW:     { label: 'Under Review',     dot: 'bg-violet-500',  text: 'text-violet-700 dark:text-violet-400' },
  DENIED:           { label: 'Denied',           dot: 'bg-red-500',     text: 'text-red-700 dark:text-red-400'       },
  SETTLED:          { label: 'Settled',          dot: 'bg-teal-500',    text: 'text-teal-700 dark:text-teal-400'     },
  NOT_APPLICABLE:   { label: 'N/A',              dot: 'bg-slate-300',   text: 'text-slate-400'                       },
};

export const RISK_LEVELS = {
  LOW:      { label: 'Low',      color: '#10b981', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30', badgeText: 'text-emerald-700 dark:text-emerald-400' },
  MEDIUM:   { label: 'Medium',   color: '#f59e0b', badgeBg: 'bg-amber-100 dark:bg-amber-900/30',    badgeText: 'text-amber-700 dark:text-amber-400'   },
  HIGH:     { label: 'High',     color: '#ef4444', badgeBg: 'bg-red-100 dark:bg-red-900/30',        badgeText: 'text-red-700 dark:text-red-400'       },
};

export const BILL_TYPES = {
  OP_CONSULTATION: { label: 'OP Consultation', color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20',  text: 'text-indigo-700 dark:text-indigo-400'   },
  IP_ADMISSION:    { label: 'IP Admission',    color: '#0891b2', bg: 'bg-cyan-50 dark:bg-cyan-900/20',     text: 'text-cyan-700 dark:text-cyan-400'       },
  ICU_CHARGES:     { label: 'ICU Charges',     color: '#dc2626', bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400'         },
  OT_PROCEDURE:    { label: 'OT Procedure',    color: '#7c3aed', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400'   },
  PHARMACY:        { label: 'Pharmacy',        color: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-700 dark:text-emerald-400' },
  LABORATORY:      { label: 'Laboratory',      color: '#0284c7', bg: 'bg-sky-50 dark:bg-sky-900/20',       text: 'text-sky-700 dark:text-sky-400'         },
  RADIOLOGY:       { label: 'Radiology',       color: '#d97706', bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400'     },
  PACKAGE:         { label: 'Package',         color: '#be185d', bg: 'bg-pink-50 dark:bg-pink-900/20',     text: 'text-pink-700 dark:text-pink-400'       },
  EMERGENCY:       { label: 'Emergency',       color: '#b91c1c', bg: 'bg-rose-50 dark:bg-rose-900/20',     text: 'text-rose-700 dark:text-rose-400'       },
};

export const DEPARTMENTS  = ['Cardiology','Orthopedics','Neurology','ICU','OT','Pharmacy','Laboratory','Radiology','Emergency','Oncology','Nephrology','Gynecology'];
export const DOCTORS       = ['Dr. Mehta S.','Dr. Kapoor R.','Dr. Reddy A.','Dr. Pillai N.','Dr. Sharma P.','Dr. Iyer K.','Dr. Bose T.','Dr. Nair M.'];
export const CASHIERS      = ['Rekha Sharma','Anil Patel','Sunita Menon','Praveen Kumar','Usha Reddy'];
export const TPA_LIST      = ['Star Health','United IC','New India Assurance','ICICI Lombard','HDFC Ergo','Bajaj Allianz','Care Health','Niva Bupa'];
export const BRANCHES      = ['Main Hospital','North Wing','South Campus','East Block','Specialty Centre'];
export const PATIENT_NAMES = [
  'Ramesh Kumar M.','Priya Nair S.','Suresh Patel V.','Anita Sharma','Mohammed Yunus Ali',
  'Lakshmi Devi R.','Arjun Singh B.','Fatima Begum K.','Venkat Rao T.','Meera Thomas',
  'Rajesh Gupta H.','Sita Devi P.','Arun Menon J.','Deepa Krishnan','Vikram Shah D.',
  'Nalini Iyer','Surendra Nath B.','Kamala Devi','Ravi Shankar P.','Geeta Verma',
];

// ─── Risk badge helper ────────────────────────────────────────────────────────
export function riskBadge(level) {
  return RISK_LEVELS[level] ?? RISK_LEVELS.LOW;
}

// ─── KPI Configuration ────────────────────────────────────────────────────────
export const PB_KPI_CONFIG = [
  { key: 'totalRevenue',     label: 'Total Revenue Today',   icon: 'IndianRupee',   format: 'currency', accent: '#10b981', trend: +12.4  },
  { key: 'opCollections',    label: 'OP Collections',        icon: 'Activity',      format: 'currency', accent: '#6366f1', trend: +8.1   },
  { key: 'ipCollections',    label: 'IP Collections',        icon: 'Building2',     format: 'currency', accent: '#0891b2', trend: +15.2  },
  { key: 'insOutstanding',   label: 'Insurance Outstanding', icon: 'Shield',        format: 'currency', accent: '#f59e0b', trend: -3.1   },
  { key: 'pendingBills',     label: 'Pending Bills',         icon: 'ClipboardList', format: 'count',    accent: '#f97316', trend: -8.4   },
  { key: 'refundsToday',     label: 'Refunds Today',         icon: 'RefreshCcw',    format: 'currency', accent: '#8b5cf6', trend: null   },
  { key: 'avgBillingMin',    label: 'Avg Billing Time',      icon: 'Clock',         format: 'minutes',  accent: '#14b8a6', trend: null   },
  { key: 'leakageAlerts',    label: 'Leakage Alerts',        icon: 'AlertOctagon',  format: 'count',    accent: '#ef4444', trend: null, alert: true },
  { key: 'packageUtil',      label: 'Package Utilisation',   icon: 'Package',       format: 'percent',  accent: '#06b6d4', trend: +4.0   },
  { key: 'highRiskClaims',   label: 'High-Risk Claims',      icon: 'ShieldAlert',   format: 'count',    accent: '#e11d48', trend: null, alert: true },
];

export const MOCK_KPI_VALUES = {
  totalRevenue:   rand(12_00_000, 28_00_000),
  opCollections:  rand(4_00_000,  9_00_000),
  ipCollections:  rand(6_00_000, 15_00_000),
  insOutstanding: rand(8_00_000, 22_00_000),
  pendingBills:   rand(32, 187),
  refundsToday:   rand(45_000, 2_80_000),
  avgBillingMin:  rand(4, 18),
  leakageAlerts:  rand(3, 21),
  packageUtil:    rand(58, 94),
  highRiskClaims: rand(4, 19),
};

// ─── Mock Bill Records ────────────────────────────────────────────────────────
const BILL_TYPE_KEYS = Object.keys(BILL_TYPES);
const PAY_STATUS_KEYS = Object.keys(PAYMENT_STATUSES);
const INS_STATUS_KEYS = Object.keys(INSURANCE_STATUSES);

function makeBill(i) {
  const gross = rand(5_000, 2_85_000);
  const disc  = rand(0, Math.floor(gross * 0.15));
  const net   = gross - disc;
  const paid  = rand(0, net);
  const out   = net - paid;
  const payStatusKey = out === 0 ? 'PAID' : out < net ? 'PARTIAL' : PAY_STATUS_KEYS[rand(2, PAY_STATUS_KEYS.length - 1)];
  const typeKey      = BILL_TYPE_KEYS[i % BILL_TYPE_KEYS.length];
  const hasIns       = rand(0, 1) === 1;
  const insKey       = hasIns ? INS_STATUS_KEYS[rand(0, INS_STATUS_KEYS.length - 1)] : 'NOT_APPLICABLE';
  return {
    id:          `BILL-2026-${String(10001 + i).padStart(5, '0')}`,
    patientId:   `HC-${String(1_00_001 + i).padStart(6, '0')}`,
    uhid:        `UHID${String(rand(1_00_000, 9_99_999))}`,
    name:        PATIENT_NAMES[i % PATIENT_NAMES.length],
    age:         rand(18, 82),
    dept:        DEPARTMENTS[i % DEPARTMENTS.length],
    doctor:      DOCTORS[i % DOCTORS.length],
    cashier:     CASHIERS[rand(0, CASHIERS.length - 1)],
    branch:      BRANCHES[i % BRANCHES.length],
    typeKey,
    tpa:         hasIns ? TPA_LIST[rand(0, TPA_LIST.length - 1)] : null,
    date:        new Date(Date.now() - rand(0, 7 * 86_400_000)).toISOString(),
    gross, disc, net, paid, outstanding: out,
    payStatusKey, insKey,
    riskLevel:   out > 1_00_000 ? 'HIGH' : out > 30_000 ? 'MEDIUM' : 'LOW',
    hasPackage:  rand(0, 4) === 0,
    agingDays:   rand(0, 45),
    notes:       rand(0, 1) ? `Follow-up scheduled ${fmtDate(new Date(Date.now() + rand(1,7)*86_400_000))}` : '',
    services: [
      { name: 'Consultation / Procedure',  qty: 1, rate: gross * 0.30, amount: gross * 0.30 },
      { name: 'Room & Nursing Charges',    qty: rand(1,5), rate: gross * 0.08, amount: gross * 0.08 * rand(1,5) },
      { name: 'Pharmacy / Consumables',   qty: 1, rate: gross * 0.20, amount: gross * 0.20 },
      { name: 'Lab / Radiology',           qty: 1, rate: gross * 0.12, amount: gross * 0.12 },
      { name: 'Doctor Charges',            qty: 1, rate: gross * 0.10, amount: gross * 0.10 },
    ],
    payments: paid > 0 ? [
      { date: new Date(Date.now() - rand(0, 2*86_400_000)).toISOString(), mode: ['Cash','UPI','Card','Insurance'][rand(0,3)], amount: paid * 0.6, ref: `RCP-${rand(3000,3999)}`, by: CASHIERS[rand(0,CASHIERS.length-1)] },
      { date: new Date(Date.now() - rand(0, 86_400_000)).toISOString(),   mode: ['Cash','UPI','Card','Insurance'][rand(0,3)], amount: paid * 0.4, ref: `RCP-${rand(3000,3999)}`, by: CASHIERS[rand(0,CASHIERS.length-1)] },
    ] : [],
  };
}

export const MOCK_BILLS = Array.from({ length: 80 }, (_, i) => makeBill(i));

// ─── Hourly Revenue ───────────────────────────────────────────────────────────
export const HOURLY_REVENUE = Array.from({ length: 12 }, (_, i) => ({
  time: `${(8 + i).toString().padStart(2, '0')}:00`,
  OP:        rand(30_000, 2_20_000),
  IP:        rand(80_000, 3_80_000),
  Insurance: rand(20_000, 1_50_000),
}));

// ─── Department Revenue ───────────────────────────────────────────────────────
export const DEPT_REVENUE = DEPARTMENTS.slice(0, 8).map((d, i) => ({
  dept:   d.length > 10 ? d.slice(0, 9) + '…' : d,
  full:   d,
  today:  rand(80_000, 6_20_000),
  week:   rand(5_00_000, 42_00_000),
  target: rand(4_00_000, 20_00_000),
  color: ['#6366f1','#10b981','#0891b2','#ef4444','#8b5cf6','#f59e0b','#06b6d4','#e11d48'][i],
}));

// ─── Payment Mode Pie ──────────────────────────────────────────────────────────
export const PAY_MODE_DATA = [
  { name: 'Cash',       value: rand(18, 28), color: '#10b981' },
  { name: 'UPI',        value: rand(20, 30), color: '#6366f1' },
  { name: 'Card',       value: rand(15, 22), color: '#0891b2' },
  { name: 'Insurance',  value: rand(18, 28), color: '#8b5cf6' },
  { name: 'Corporate',  value: rand(5, 12),  color: '#f59e0b' },
  { name: 'Wallet',     value: rand(2, 8),   color: '#06b6d4' },
];

// ─── Insurance Claims ──────────────────────────────────────────────────────────
export const MOCK_CLAIMS = Array.from({ length: 14 }, (_, i) => ({
  id:        `CLM-2026-${String(2001 + i).padStart(4, '0')}`,
  patient:   PATIENT_NAMES[i % PATIENT_NAMES.length],
  tpa:       TPA_LIST[i % TPA_LIST.length],
  amount:    rand(35_000, 3_80_000),
  submitted: new Date(Date.now() - rand(1, 30) * 86_400_000).toISOString(),
  statusKey: INS_STATUS_KEYS[i % INS_STATUS_KEYS.length],
  agingDays: rand(1, 45),
  denial:    i % 6 === 0 ? 'Procedure not covered under policy' : null,
}));

// ─── Leakage Alerts ───────────────────────────────────────────────────────────
export const MOCK_LEAKAGE = [
  { id:1, type:'Missing Charge',    dept:'ICU',         amount:rand(8_000,45_000), severity:'critical', detail:'IV consumables unbilled — 3 patients, 14h window',         ts:Date.now()-rand(1e5,9e5) },
  { id:2, type:'Unbilled Lab',      dept:'Laboratory',  amount:rand(4_000,18_000), severity:'warning',  detail:'CBC+LFT ordered but no charge raised — Ward C Bed 12',     ts:Date.now()-rand(1e5,9e5) },
  { id:3, type:'Package Leakage',   dept:'OT',          amount:rand(25_000,95_000),severity:'critical', detail:'Hip replacement package undercharged — 2 implants unclaimed',ts:Date.now()-rand(1e5,9e5) },
  { id:4, type:'Delayed Billing',   dept:'Radiology',   amount:rand(3_000,12_000), severity:'info',     detail:'MRI report released 9h ago — bill not generated',           ts:Date.now()-rand(1e5,9e5) },
  { id:5, type:'Discount Override', dept:'Cardiology',  amount:rand(15_000,60_000),severity:'critical', detail:'38% concession without HOD approval — Cashier: Anil Patel', ts:Date.now()-rand(1e5,9e5) },
  { id:6, type:'Duplicate Entry',   dept:'Pharmacy',    amount:rand(2_000,8_000),  severity:'warning',  detail:'Same medication billed twice — Patient HC-100042',           ts:Date.now()-rand(1e5,9e5) },
];

// ─── Cashier Performance ──────────────────────────────────────────────────────
export const MOCK_CASHIERS = CASHIERS.map(c => ({
  name:       c,
  collected:  rand(1_80_000, 9_80_000),
  txns:       rand(28, 147),
  avgTime:    rand(3, 14),
  refunds:    rand(1, 8),
  efficiency: rand(72, 99),
}));

// ─── Live Activity Feed ───────────────────────────────────────────────────────
const ACTIVITY_TYPES = [
  { type: 'bill',     label: 'Bill Generated',   severity: 'success'  },
  { type: 'payment',  label: 'Payment Received',  severity: 'success'  },
  { type: 'refund',   label: 'Refund Processed',  severity: 'warning'  },
  { type: 'admit',    label: 'IP Admission',      severity: 'info'     },
  { type: 'lab',      label: 'Lab Bill Raised',   severity: 'info'     },
  { type: 'claim',    label: 'Claim Submitted',   severity: 'info'     },
  { type: 'leakage',  label: 'Leakage Flagged',   severity: 'critical' },
  { type: 'pharmacy', label: 'Pharmacy Bill',     severity: 'success'  },
];

export const MOCK_ACTIVITY = Array.from({ length: 25 }, (_, i) => ({
  id:      i,
  ...ACTIVITY_TYPES[i % ACTIVITY_TYPES.length],
  patient: PATIENT_NAMES[i % PATIENT_NAMES.length],
  dept:    DEPARTMENTS[i % DEPARTMENTS.length],
  amount:  rand(1_200, 85_000),
  cashier: CASHIERS[i % CASHIERS.length],
  ts:      Date.now() - i * rand(15_000, 90_000),
}));

// ─── Analytics panel aliases (PBAnalyticsPanel) ───────────────────────────────
export const MOCK_DEPT_REVENUE = DEPARTMENTS.slice(0, 8).map((d, i) => ({
  dept:        d.length > 10 ? d.slice(0, 9) + '…' : d,
  actual:      rand(80_000, 6_20_000),
  outstanding: rand(15_000, 2_80_000),
  target:      rand(4_00_000, 20_00_000),
}));

const totalMode = 100;
const rawMode = [28, 24, 18, 16, 8, 6];
export const MOCK_PAYMENT_MODE = [
  { name: 'Cash',      value: rand(18_00_000, 32_00_000), pct: rawMode[0] },
  { name: 'UPI',       value: rand(22_00_000, 38_00_000), pct: rawMode[1] },
  { name: 'Card',      value: rand(14_00_000, 24_00_000), pct: rawMode[2] },
  { name: 'Insurance', value: rand(18_00_000, 30_00_000), pct: rawMode[3] },
  { name: 'Corporate', value: rand(6_00_000,  12_00_000), pct: rawMode[4] },
  { name: 'Wallet',    value: rand(2_00_000,   6_00_000), pct: rawMode[5] },
];

export const MOCK_HOURLY_TREND = Array.from({ length: 13 }, (_, i) => ({
  hour:      `${(8 + i).toString().padStart(2, '0')}:00`,
  billed:    rand(40_000, 2_80_000),
  collected: rand(30_000, 2_10_000),
}));

// ─── AI Insights ──────────────────────────────────────────────────────────────
export const PB_AI_INSIGHTS = [
  { id:1, severity:'critical', icon:'AlertOctagon', title:'Revenue Leakage — ICU', detail:'3 patients missing IV consumable charges. Est. impact ₹42,000. Recommend immediate billing review for Ward C.', action:'Review Now' },
  { id:2, severity:'info',     icon:'TrendingUp',   title:'Collection Forecast',   detail:'Today\'s projected collection: ₹18.4L (87% confidence). Discharge peak expected 3–5 PM. OP collections tracking 12% above target.', action:'View Forecast' },
  { id:3, severity:'warning',  icon:'AlertTriangle',title:'Claim Denial Risk',     detail:'4 claims with Star Health show documentation gaps. Pre-auth missing for Procedure Code 85014. Submit before 6 PM.', action:'Review Claims' },
  { id:4, severity:'info',     icon:'TrendingDown', title:'Package Optimisation',  detail:'Hip Replacement package utilisation at 61%. Sector benchmark: 82%. Review inclusion criteria with OT billing team.', action:'Analyse Packages' },
  { id:5, severity:'warning',  icon:'AlertOctagon', title:'Unusual Discount Pattern',detail:'Cashier Anil Patel processed 6 discounts >30% today — 4× the floor average. Recommend supervisor audit of receipts 3021–3027.', action:'Audit Now' },
];

export const PB_PROMPT_SUGGESTIONS = [
  'Find revenue leakage today',
  'Show denied claim risks',
  'Forecast today\'s collections',
  'Unusual discount patterns',
  'Outstanding dues summary',
  'Cashier performance report',
];

export const PB_AI_RESPONSES = {
  leakage:     '📊 Found 6 active leakage alerts totalling ₹1.47L. Highest: OT package leakage (₹76K) and ICU consumables (₹42K). Shall I generate a leakage summary report?',
  denied:      '🔍 3 claims in Denied status: CLM-2026-2006 (Star Health ₹1.8L), CLM-2026-2007 (HDFC Ergo ₹94K). Common cause: missing discharge summary. Shall I prepare a resubmission checklist?',
  forecast:    '📈 Today\'s projected collection: ₹18.4L — OP ₹5.2L, IP ₹9.8L, Pharmacy ₹3.4L. 87% confidence. Peak collection window: 3–5 PM.',
  discount:    '⚠️ 9 unauthorized discount transactions today. Total write-off: ₹2.34L. Largest: 38% on Cardiology package (₹52K by Anil Patel). HOD approval required.',
  outstanding: '💰 Total outstanding: ₹47.3L across 83 bills. Buckets — 0–30d: ₹28L, 31–60d: ₹12L, >60d: ₹7.3L. 12 accounts marked High Risk. Want a follow-up action plan?',
  cashier:     '👤 Top performer: Rekha Sharma (₹9.8L, 98% efficiency). Concern: Anil Patel — 6 unauthorised discounts, avg billing time 14 min (3× floor avg). Recommend review.',
  default:     '🤖 I can help with revenue leakage detection, claim risk analysis, collection forecasting, discount auditing, and outstanding analysis. What would you like to explore?',
};
