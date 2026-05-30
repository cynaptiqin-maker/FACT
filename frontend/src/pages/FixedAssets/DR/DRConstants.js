// ─── Depreciation Runs — Constants, Mock Data & Configuration ────────────────
// Violet / Purple theme · Enterprise healthcare depreciation intelligence

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmtINR = (n) => {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const pfx = n < 0 ? '-' : '';
  if (abs >= 10000000) return `${pfx}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000)   return `${pfx}₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000)     return `${pfx}₹${(abs / 1000).toFixed(1)}K`;
  return `${pfx}₹${abs.toFixed(0)}`;
};

export const fmtINRFull = (n) => {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
};

export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const fmtPct = (n) => {
  if (n == null) return '—';
  return `${Number(n).toFixed(2)}%`;
};

export const fmtYears = (n) => {
  if (n == null) return '—';
  return `${Number(n).toFixed(1)} yrs`;
};

// ─── Run Workflow States ──────────────────────────────────────────────────────
export const RUN_STATES = {
  DRAFT:        { label: 'Draft',        bg: 'bg-slate-100 dark:bg-slate-800',          text: 'text-slate-600 dark:text-slate-300',      dot: '#94a3b8' },
  PREVIEWED:    { label: 'Previewed',    bg: 'bg-blue-100 dark:bg-blue-900/30',          text: 'text-blue-700 dark:text-blue-400',        dot: '#3b82f6' },
  PENDING:      { label: 'Pending',      bg: 'bg-amber-100 dark:bg-amber-900/30',        text: 'text-amber-700 dark:text-amber-400',      dot: '#f59e0b' },
  PROCESSING:   { label: 'Processing',   bg: 'bg-violet-100 dark:bg-violet-900/30',      text: 'text-violet-700 dark:text-violet-400',    dot: '#8b5cf6' },
  APPROVED:     { label: 'Approved',     bg: 'bg-teal-100 dark:bg-teal-900/30',          text: 'text-teal-700 dark:text-teal-400',        dot: '#14b8a6' },
  POSTED:       { label: 'Posted',       bg: 'bg-emerald-100 dark:bg-emerald-900/30',    text: 'text-emerald-700 dark:text-emerald-400',  dot: '#10b981' },
  REVERSED:     { label: 'Reversed',     bg: 'bg-rose-100 dark:bg-rose-900/30',          text: 'text-rose-700 dark:text-rose-400',        dot: '#f43f5e' },
  RECALCULATED: { label: 'Recalculated', bg: 'bg-cyan-100 dark:bg-cyan-900/30',          text: 'text-cyan-700 dark:text-cyan-400',        dot: '#06b6d4' },
  RECONCILED:   { label: 'Reconciled',   bg: 'bg-green-100 dark:bg-green-900/30',        text: 'text-green-700 dark:text-green-400',      dot: '#22c55e' },
  ARCHIVED:     { label: 'Archived',     bg: 'bg-gray-100 dark:bg-gray-800',             text: 'text-gray-500 dark:text-gray-400',        dot: '#6b7280' },
  ERROR:        { label: 'Error',        bg: 'bg-red-100 dark:bg-red-900/30',            text: 'text-red-700 dark:text-red-400',          dot: '#ef4444' },
};

// ─── GL Posting Status ────────────────────────────────────────────────────────
export const GL_STATUS = {
  NOT_POSTED: { label: 'Not Posted', bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-600 dark:text-slate-300', dot: '#94a3b8' },
  PENDING:    { label: 'Pending',    bg: 'bg-amber-100 dark:bg-amber-900/30',      text: 'text-amber-700 dark:text-amber-400', dot: '#f59e0b' },
  POSTED:     { label: 'Posted',     bg: 'bg-emerald-100 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-400', dot: '#10b981' },
  FAILED:     { label: 'Failed',     bg: 'bg-red-100 dark:bg-red-900/30',          text: 'text-red-700 dark:text-red-400',     dot: '#ef4444' },
  REVERSED:   { label: 'Reversed',   bg: 'bg-rose-100 dark:bg-rose-900/30',        text: 'text-rose-700 dark:text-rose-400',   dot: '#f43f5e' },
};

// ─── Compliance Status ────────────────────────────────────────────────────────
export const COMPLIANCE = {
  COMPLIANT:     { label: 'Compliant',      bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: '#10b981' },
  REVIEW_NEEDED: { label: 'Review Needed',  bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400',    dot: '#f59e0b' },
  NON_COMPLIANT: { label: 'Non-Compliant',  bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-400',        dot: '#ef4444' },
  EXCEPTION:     { label: 'Exception',      bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-700 dark:text-orange-400',  dot: '#f97316' },
  PENDING:       { label: 'Pending Review', bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-700 dark:text-violet-400',  dot: '#8b5cf6' },
};

// ─── Risk Levels ──────────────────────────────────────────────────────────────
export const RISK = {
  LOW:      { label: 'Low',      bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: '#10b981' },
  MEDIUM:   { label: 'Medium',   bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400',    dot: '#f59e0b' },
  HIGH:     { label: 'High',     bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-700 dark:text-orange-400',  dot: '#f97316' },
  CRITICAL: { label: 'Critical', bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-400',        dot: '#ef4444' },
};

// ─── Depreciation Methods ─────────────────────────────────────────────────────
export const DEP_METHODS = {
  SLM:       { label: 'Straight Line (SLM)',         short: 'SLM',   color: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
  WDV:       { label: 'Written Down Value (WDV)',     short: 'WDV',   color: '#06b6d4', bg: 'bg-cyan-100 dark:bg-cyan-900/30',    text: 'text-cyan-700 dark:text-cyan-400' },
  COMPONENT: { label: 'Component Accounting',        short: 'COMP',  color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-400' },
  LEASE:     { label: 'Lease (IFRS 16 / Ind AS 116)',short: 'LEASE', color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-400' },
  UOP:       { label: 'Units of Production',         short: 'UOP',   color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  DDB:       { label: 'Double Declining Balance',    short: 'DDB',   color: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30',text: 'text-orange-700 dark:text-orange-400' },
};

// ─── Accounting Books ─────────────────────────────────────────────────────────
export const BOOKS = {
  IFRS:       { label: 'IFRS Book',           short: 'IFRS',   std: 'Ind AS / IAS 16 / IAS 36',  color: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
  STATUTORY:  { label: 'Statutory (Cos. Act)',short: 'STAT',   std: 'Companies Act 2013 Sch. II', color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-400' },
  IT_ACT:     { label: 'IT Act Book',         short: 'IT-ACT', std: 'Income Tax Act 1961',         color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-400' },
  GAAP:       { label: 'US GAAP Book',        short: 'GAAP',   std: 'US GAAP / ASC 360',           color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-400' },
  MANAGEMENT: { label: 'Management Book',     short: 'MGMT',   std: 'Internal MIS / Reporting',    color: '#06b6d4', bg: 'bg-cyan-100 dark:bg-cyan-900/30',    text: 'text-cyan-700 dark:text-cyan-400' },
};

// ─── Branches ─────────────────────────────────────────────────────────────────
export const BRANCHES = {
  ALL:        { label: 'All Branches',       city: '—' },
  MAIN:       { label: 'Main Hospital',      city: 'Chennai' },
  ICU:        { label: 'ICU & Critical Care',city: 'Chennai' },
  MED_COL:    { label: 'Medical College',    city: 'Vellore' },
  PHARMACY:   { label: 'Central Pharmacy',   city: 'Chennai' },
  LABS:       { label: 'Pathology & Labs',   city: 'Chennai' },
  CARDIAC:    { label: 'Cardiac Sciences',   city: 'Chennai' },
  ONCOLOGY:   { label: 'Cancer Centre',      city: 'Madurai' },
  ORTHO:      { label: 'Orthopaedic Centre', city: 'Coimbatore' },
};

// ─── Asset Categories ─────────────────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'MEDICAL_EQUIP',  label: 'Medical Equipment',       icon: '🏥', color: '#8b5cf6', rate: 15 },
  { id: 'BIOMEDICAL',     label: 'Biomedical Equipment',    icon: '🔬', color: '#06b6d4', rate: 15 },
  { id: 'IT_ASSETS',      label: 'IT & Computing Assets',   icon: '💻', color: '#3b82f6', rate: 40 },
  { id: 'BUILDINGS',      label: 'Buildings & Structures',  icon: '🏗️', color: '#10b981', rate: 5  },
  { id: 'LAB_EQUIP',      label: 'Laboratory Equipment',    icon: '⚗️', color: '#f59e0b', rate: 15 },
  { id: 'VEHICLES',       label: 'Vehicles & Ambulances',   icon: '🚑', color: '#f97316', rate: 15 },
  { id: 'FURNITURE',      label: 'Furniture & Fixtures',    icon: '🪑', color: '#14b8a6', rate: 10 },
  { id: 'IMAGING',        label: 'Imaging Equipment',       icon: '📡', color: '#ec4899', rate: 15 },
  { id: 'SURGICAL',       label: 'Surgical Instruments',    icon: '🩺', color: '#a855f7', rate: 15 },
  { id: 'LEASE_ROU',      label: 'Right-of-Use Assets',     icon: '📋', color: '#0ea5e9', rate: 20 },
];

// ─── KPI Configuration ────────────────────────────────────────────────────────
export const DR_KPIS = [
  {
    id: 'current_period',
    label: 'Current Period Depreciation',
    value: 18420000, prev: 17980000, trend: 'up', trendPct: 2.45,
    format: 'INR', color: 'violet', gradient: 'from-violet-500 to-purple-600',
    icon: 'TrendingDown', aiFlag: false,
    description: 'Total depreciation for April 2026 across all books & branches',
  },
  {
    id: 'accumulated',
    label: 'Accumulated Depreciation',
    value: 1842000000, prev: 1823580000, trend: 'up', trendPct: 1.01,
    format: 'INR', color: 'indigo', gradient: 'from-indigo-500 to-violet-600',
    icon: 'Layers', aiFlag: false,
    description: 'Total accumulated depreciation on the consolidated asset register',
  },
  {
    id: 'pending',
    label: 'Pending Depreciation',
    value: 4820000, prev: 2140000, trend: 'up', trendPct: 125.2,
    format: 'INR', color: 'amber', gradient: 'from-amber-500 to-orange-500',
    icon: 'Clock', aiFlag: true,
    aiMessage: '4 runs with ₹4.82Cr exposure awaiting approval — 2 runs exceeded 48h SLA',
    description: 'Depreciation calculated but pending approval or GL posting',
  },
  {
    id: 'assets_processed',
    label: 'Assets Processed',
    value: 1284, prev: 1241, trend: 'up', trendPct: 3.47,
    format: 'COUNT', color: 'blue', gradient: 'from-blue-500 to-indigo-500',
    icon: 'Package', aiFlag: false,
    description: 'Total assets included in current period depreciation runs',
  },
  {
    id: 'revaluation',
    label: 'Revaluation Impact',
    value: 124500000, prev: 98200000, trend: 'up', trendPct: 26.78,
    format: 'INR', color: 'cyan', gradient: 'from-cyan-500 to-teal-500',
    icon: 'RefreshCw', aiFlag: true,
    aiMessage: 'Revaluation surplus grew 26.8% — IAS 16 revaluation model review advised',
    description: 'Cumulative revaluation surplus / deficit affecting depreciation base',
  },
  {
    id: 'impairment',
    label: 'Impairment Exposure',
    value: 38750000, prev: 21400000, trend: 'up', trendPct: 81.07,
    format: 'INR', color: 'orange', gradient: 'from-orange-500 to-red-500',
    icon: 'AlertTriangle', aiFlag: true,
    aiMessage: 'AI detected 3 ICU assets + 8 Oncology assets breaching IAS 36 thresholds',
    description: 'AI-estimated impairment exposure requiring formal IAS 36 assessment',
  },
  {
    id: 'multibook_variance',
    label: 'Multi-Book Variance',
    value: 12840000, prev: 9620000, trend: 'up', trendPct: 33.47,
    format: 'INR', color: 'purple', gradient: 'from-purple-500 to-violet-600',
    icon: 'BookOpen', aiFlag: true,
    aiMessage: 'IFRS vs IT-Act variance ₹1.28Cr — deferred tax liability impact growing',
    description: 'Variance between IFRS and Income Tax Act depreciation books',
  },
  {
    id: 'compliance_alerts',
    label: 'Compliance Alerts',
    value: 7, prev: 3, trend: 'up', trendPct: 133.3,
    format: 'COUNT', color: 'red', gradient: 'from-red-500 to-rose-500',
    icon: 'ShieldAlert', aiFlag: true,
    aiMessage: '7 active exceptions — Schedule II rate mismatch on 3 IT assets, IAS 36 triggers on 4 assets',
    description: 'Open compliance exceptions requiring finance team review',
  },
  {
    id: 'treasury_impact',
    label: 'Treasury Forecast Impact',
    value: 52800000, prev: 49100000, trend: 'up', trendPct: 7.54,
    format: 'INR', color: 'teal', gradient: 'from-teal-500 to-emerald-500',
    icon: 'Landmark', aiFlag: false,
    description: 'AI-projected 12-month depreciation charge impact on treasury planning',
  },
  {
    id: 'high_risk',
    label: 'High-Risk Assets',
    value: 23, prev: 18, trend: 'up', trendPct: 27.78,
    format: 'COUNT', color: 'rose', gradient: 'from-rose-500 to-pink-500',
    icon: 'Zap', aiFlag: true,
    aiMessage: '23 assets with statistically abnormal depreciation patterns — investigation needed',
    description: 'Assets flagged by AI for anomalous depreciation behavior',
  },
];

// ─── Mock Depreciation Runs (20 records, full data) ───────────────────────────
export const MOCK_RUNS = [
  {
    id: 'DR-2026-00020',
    runDate: '2026-05-01', period: 'Apr 2026', periodMonth: 4, periodYear: 2026,
    book: 'IFRS', branch: 'MAIN', assetCategory: 'ALL', assetCount: 847,
    method: 'SLM',
    currentDep: 6842000, accumulatedDep: 284650000, netBookValue: 1205800000,
    revaluationImpact: 0, impairmentImpact: 0,
    glStatus: 'POSTED', journalRef: 'JV-2026-04-0001', journalStatus: 'POSTED',
    complianceStatus: 'COMPLIANT', riskLevel: 'LOW', workflowStatus: 'RECONCILED',
    approvedBy: 'Priya Venkataraman', approvedAt: '2026-05-02T09:14:22',
    createdBy: 'Arjun Sharma', createdAt: '2026-05-01T08:00:00', updatedAt: '2026-05-10T14:00:00',
    notes: 'Regular April 2026 IFRS run. All 847 active assets processed. Reconciled against trial balance.',
    fraudFlags: [],
    glEntries: [
      { account: '6100 — Depreciation Expense (Medical)', debit: 2841000, credit: 0, costCenter: 'ICU' },
      { account: '1510 — Acc. Dep. — Medical Equipment',  debit: 0, credit: 2841000, costCenter: 'ICU' },
      { account: '6101 — Depreciation Expense (Biomedical)', debit: 1923000, credit: 0, costCenter: 'Labs' },
      { account: '1511 — Acc. Dep. — Biomedical',         debit: 0, credit: 1923000, costCenter: 'Labs' },
      { account: '6102 — Depreciation Expense (IT)',       debit: 1124000, credit: 0, costCenter: 'Admin' },
      { account: '1512 — Acc. Dep. — IT Assets',          debit: 0, credit: 1124000, costCenter: 'Admin' },
      { account: '6103 — Depreciation Expense (Buildings)',debit: 482000,  credit: 0, costCenter: 'Infra' },
      { account: '1513 — Acc. Dep. — Buildings',          debit: 0, credit: 482000,  costCenter: 'Infra' },
      { account: '6104 — Depreciation Expense (Other)',    debit: 472000,  credit: 0, costCenter: 'Admin' },
      { account: '1514 — Acc. Dep. — Other Assets',       debit: 0, credit: 472000,  costCenter: 'Admin' },
    ],
    categoryBreakdown: [
      { cat: 'Medical Equipment',  count: 312, dep: 2841000, pct: 41.5 },
      { cat: 'Biomedical',         count: 187, dep: 1923000, pct: 28.1 },
      { cat: 'IT Assets',          count: 142, dep: 1124000, pct: 16.4 },
      { cat: 'Buildings',          count: 28,  dep: 482000,  pct: 7.0  },
      { cat: 'Lab Equipment',      count: 98,  dep: 312000,  pct: 4.6  },
      { cat: 'Other',              count: 80,  dep: 160000,  pct: 2.3  },
    ],
    auditTrail: [
      { ts: '2026-05-01T08:00:00', user: 'Arjun Sharma',       action: 'Run initiated for Apr 2026 — IFRS Book',                     type: 'CREATE' },
      { ts: '2026-05-01T08:04:12', user: 'System',             action: 'Depreciation calculated — 847 assets, ₹6.84Cr',              type: 'PROCESS' },
      { ts: '2026-05-01T08:04:45', user: 'System',             action: 'Preview generated — no anomalies detected',                 type: 'PREVIEW' },
      { ts: '2026-05-02T09:10:00', user: 'Priya Venkataraman', action: 'Approved by Finance Head',                                  type: 'APPROVE' },
      { ts: '2026-05-02T09:14:22', user: 'System',             action: 'GL posted — JV-2026-04-0001 created',                       type: 'POST' },
      { ts: '2026-05-10T14:00:00', user: 'Ravi Krishnamurthy', action: 'Reconciled against Apr 2026 trial balance — all clear',     type: 'RECONCILE' },
    ],
  },
  {
    id: 'DR-2026-00019',
    runDate: '2026-05-01', period: 'Apr 2026', periodMonth: 4, periodYear: 2026,
    book: 'STATUTORY', branch: 'MAIN', assetCategory: 'ALL', assetCount: 847,
    method: 'WDV',
    currentDep: 8124000, accumulatedDep: 312480000, netBookValue: 1198200000,
    revaluationImpact: 0, impairmentImpact: 0,
    glStatus: 'POSTED', journalRef: 'JV-2026-04-0002', journalStatus: 'POSTED',
    complianceStatus: 'COMPLIANT', riskLevel: 'LOW', workflowStatus: 'POSTED',
    approvedBy: 'Priya Venkataraman', approvedAt: '2026-05-02T09:20:00',
    createdBy: 'Arjun Sharma', createdAt: '2026-05-01T08:05:00', updatedAt: '2026-05-02T09:20:00',
    notes: 'Statutory book — Companies Act 2013 Schedule II WDV rates applied. Apr 2026.',
    fraudFlags: [],
    glEntries: [],
    categoryBreakdown: [
      { cat: 'Medical Equipment', count: 312, dep: 3240000, pct: 39.9 },
      { cat: 'Biomedical',        count: 187, dep: 2184000, pct: 26.9 },
      { cat: 'IT Assets',         count: 142, dep: 1620000, pct: 19.9 },
      { cat: 'Buildings',         count: 28,  dep: 588000,  pct: 7.2  },
      { cat: 'Other',             count: 178, dep: 492000,  pct: 6.1  },
    ],
    auditTrail: [],
  },
  {
    id: 'DR-2026-00018',
    runDate: '2026-05-01', period: 'Apr 2026', periodMonth: 4, periodYear: 2026,
    book: 'IT_ACT', branch: 'ALL', assetCategory: 'ALL', assetCount: 1284,
    method: 'WDV',
    currentDep: 11482000, accumulatedDep: 428140000, netBookValue: 1548200000,
    revaluationImpact: 0, impairmentImpact: 0,
    glStatus: 'POSTED', journalRef: 'JV-2026-04-0003', journalStatus: 'POSTED',
    complianceStatus: 'COMPLIANT', riskLevel: 'LOW', workflowStatus: 'POSTED',
    approvedBy: 'Ravi Krishnamurthy', approvedAt: '2026-05-03T11:30:00',
    createdBy: 'Meena Pillai', createdAt: '2026-05-01T10:00:00', updatedAt: '2026-05-03T11:30:00',
    notes: 'IT Act block-wise depreciation — all branches. FY 2025-26 Q4.',
    fraudFlags: [],
    glEntries: [],
    categoryBreakdown: [],
    auditTrail: [],
  },
  {
    id: 'DR-2026-00017',
    runDate: '2026-05-10', period: 'Apr 2026', periodMonth: 4, periodYear: 2026,
    book: 'IFRS', branch: 'ICU', assetCategory: 'MEDICAL_EQUIP', assetCount: 284,
    method: 'WDV',
    currentDep: 4218000, accumulatedDep: 68240000, netBookValue: 284120000,
    revaluationImpact: 2840000, impairmentImpact: 1240000,
    glStatus: 'POSTED', journalRef: 'JV-2026-04-0004', journalStatus: 'POSTED',
    complianceStatus: 'REVIEW_NEEDED', riskLevel: 'HIGH', workflowStatus: 'POSTED',
    approvedBy: 'Kavitha Menon', approvedAt: '2026-05-11T14:22:00',
    createdBy: 'Sanjay Iyer', createdAt: '2026-05-10T09:00:00', updatedAt: '2026-05-11T14:22:00',
    notes: 'ICU medical equipment Apr-26 — revaluation adjustment +₹28.4L. AI flagged 3 assets for IAS 36 impairment review. Posted with REVIEW_NEEDED flag.',
    fraudFlags: ['AI: Possible early write-off on ASSET-ICU-0042'],
    glEntries: [
      { account: '6100 — Depreciation Expense (ICU Medical)', debit: 4218000, credit: 0, costCenter: 'ICU' },
      { account: '1510 — Acc. Dep. — Medical Equipment',      debit: 0, credit: 4218000, costCenter: 'ICU' },
      { account: '6200 — Impairment Loss',                    debit: 1240000, credit: 0, costCenter: 'ICU' },
      { account: '1520 — Accumulated Impairment',             debit: 0, credit: 1240000, costCenter: 'ICU' },
    ],
    categoryBreakdown: [
      { cat: 'ICU Ventilators',    count: 48,  dep: 1842000, pct: 43.7 },
      { cat: 'Monitoring Equip',   count: 82,  dep: 1124000, pct: 26.6 },
      { cat: 'Life Support',       count: 64,  dep: 842000,  pct: 20.0 },
      { cat: 'Other ICU Equip',    count: 90,  dep: 410000,  pct: 9.7  },
    ],
    auditTrail: [
      { ts: '2026-05-10T09:00:00', user: 'Sanjay Iyer',  action: 'ICU Apr-26 run initiated',                                 type: 'CREATE' },
      { ts: '2026-05-10T09:12:00', user: 'AI Engine',    action: 'ALERT: 3 assets show IAS 36 impairment indicators',        type: 'AI_ALERT' },
      { ts: '2026-05-11T14:22:00', user: 'Kavitha Menon',action: 'Approved with REVIEW_NEEDED flag — impairment noted',      type: 'APPROVE' },
      { ts: '2026-05-11T14:25:00', user: 'System',       action: 'GL posted — impairment loss entry included',               type: 'POST' },
    ],
  },
  {
    id: 'DR-2026-00016',
    runDate: '2026-05-15', period: 'Apr 2026', periodMonth: 4, periodYear: 2026,
    book: 'IFRS', branch: 'CARDIAC', assetCategory: 'IMAGING', assetCount: 48,
    method: 'COMPONENT',
    currentDep: 1842000, accumulatedDep: 28140000, netBookValue: 142800000,
    revaluationImpact: 8240000, impairmentImpact: 0,
    glStatus: 'PENDING', journalRef: null, journalStatus: 'DRAFT',
    complianceStatus: 'PENDING', riskLevel: 'MEDIUM', workflowStatus: 'PREVIEWED',
    approvedBy: null, approvedAt: null,
    createdBy: 'Sanjay Iyer', createdAt: '2026-05-15T10:30:00', updatedAt: '2026-05-15T10:30:00',
    notes: 'Cardiac imaging — component accounting per IFRS. CT scanner and MRI components split into Frame, Gantry, Software components.',
    fraudFlags: [],
    glEntries: [],
    categoryBreakdown: [
      { cat: 'MRI Scanner Components',    count: 16, dep: 882000, pct: 47.9 },
      { cat: 'CT Scanner Components',     count: 20, dep: 640000, pct: 34.7 },
      { cat: 'X-Ray / Fluoroscopy',       count: 12, dep: 320000, pct: 17.4 },
    ],
    auditTrail: [
      { ts: '2026-05-15T10:30:00', user: 'Sanjay Iyer', action: 'Cardiac imaging component run previewed', type: 'PREVIEW' },
    ],
  },
  {
    id: 'DR-2026-00015',
    runDate: '2026-05-18', period: 'Apr 2026', periodMonth: 4, periodYear: 2026,
    book: 'IFRS', branch: 'MED_COL', assetCategory: 'BUILDINGS', assetCount: 42,
    method: 'SLM',
    currentDep: 824000, accumulatedDep: 24810000, netBookValue: 486200000,
    revaluationImpact: 18400000, impairmentImpact: 0,
    glStatus: 'NOT_POSTED', journalRef: null, journalStatus: 'DRAFT',
    complianceStatus: 'REVIEW_NEEDED', riskLevel: 'MEDIUM', workflowStatus: 'PENDING',
    approvedBy: null, approvedAt: null,
    createdBy: 'Lakshmi Narayanan', createdAt: '2026-05-18T08:00:00', updatedAt: '2026-05-18T08:00:00',
    notes: 'Medical college buildings — IFRS revaluation surplus ₹1.84Cr pending formal assessment. Approval required.',
    fraudFlags: [],
    glEntries: [],
    categoryBreakdown: [
      { cat: 'Academic Buildings', count: 18, dep: 420000, pct: 51.0 },
      { cat: 'Lab Blocks',         count: 12, dep: 248000, pct: 30.1 },
      { cat: 'Hostels / Quarters', count: 12, dep: 156000, pct: 18.9 },
    ],
    auditTrail: [
      { ts: '2026-05-18T08:00:00', user: 'Lakshmi Narayanan', action: 'Buildings run submitted for approval', type: 'PROCESS' },
    ],
  },
  {
    id: 'DR-2026-00014',
    runDate: '2026-05-19', period: 'Apr 2026', periodMonth: 4, periodYear: 2026,
    book: 'MANAGEMENT', branch: 'ONCOLOGY', assetCategory: 'BIOMEDICAL', assetCount: 124,
    method: 'WDV',
    currentDep: 2184000, accumulatedDep: 48240000, netBookValue: 284100000,
    revaluationImpact: 0, impairmentImpact: 4820000,
    glStatus: 'NOT_POSTED', journalRef: null, journalStatus: 'DRAFT',
    complianceStatus: 'NON_COMPLIANT', riskLevel: 'CRITICAL', workflowStatus: 'DRAFT',
    approvedBy: null, approvedAt: null,
    createdBy: 'Deepa Krishnan', createdAt: '2026-05-19T11:00:00', updatedAt: '2026-05-19T11:00:00',
    notes: 'CRITICAL: AI detected impairment pattern on 8 oncology biomedical assets. Carrying amount exceeds recoverable amount per IAS 36. Human review mandatory before any posting.',
    fraudFlags: ['AI: 8 assets show accelerated degradation vs. expected depreciation curve', 'AI: Possible manipulation of residual values on ASSET-ONC-0008'],
    glEntries: [],
    categoryBreakdown: [
      { cat: 'Linear Accelerator',    count: 2,  dep: 840000, pct: 38.5 },
      { cat: 'Brachytherapy Equip',   count: 6,  dep: 624000, pct: 28.6 },
      { cat: 'Radiation Monitoring',  count: 28, dep: 420000, pct: 19.2 },
      { cat: 'Other Biomedical',      count: 88, dep: 300000, pct: 13.7 },
    ],
    auditTrail: [
      { ts: '2026-05-19T11:00:00', user: 'Deepa Krishnan', action: 'Oncology biomedical run created', type: 'CREATE' },
      { ts: '2026-05-19T11:08:00', user: 'AI Engine',      action: 'CRITICAL: IAS 36 triggers detected — 8 assets, ₹4.82Cr exposure', type: 'AI_ALERT' },
    ],
  },
  {
    id: 'DR-2026-00013',
    runDate: '2026-05-20', period: 'Apr 2026', periodMonth: 4, periodYear: 2026,
    book: 'IFRS', branch: 'LABS', assetCategory: 'LAB_EQUIP', assetCount: 186,
    method: 'WDV',
    currentDep: 1248000, accumulatedDep: 22840000, netBookValue: 124800000,
    revaluationImpact: 0, impairmentImpact: 0,
    glStatus: 'NOT_POSTED', journalRef: null, journalStatus: 'DRAFT',
    complianceStatus: 'PENDING', riskLevel: 'LOW', workflowStatus: 'PROCESSING',
    approvedBy: null, approvedAt: null,
    createdBy: 'Pradeep Anand', createdAt: '2026-05-20T07:00:00', updatedAt: '2026-05-20T07:00:00',
    notes: 'Lab equipment depreciation run in progress — automated calculation running.',
    fraudFlags: [],
    glEntries: [],
    categoryBreakdown: [],
    auditTrail: [
      { ts: '2026-05-20T07:00:00', user: 'Pradeep Anand', action: 'Lab equipment run initiated', type: 'CREATE' },
      { ts: '2026-05-20T07:04:00', user: 'System',        action: 'Calculation in progress — 186 assets',  type: 'PROCESS' },
    ],
  },
  {
    id: 'DR-2026-00012',
    runDate: '2026-04-02', period: 'Mar 2026', periodMonth: 3, periodYear: 2026,
    book: 'IFRS', branch: 'MAIN', assetCategory: 'ALL', assetCount: 812,
    method: 'SLM',
    currentDep: 6540000, accumulatedDep: 277808000, netBookValue: 1212642000,
    revaluationImpact: 0, impairmentImpact: 0,
    glStatus: 'POSTED', journalRef: 'JV-2026-03-0001', journalStatus: 'POSTED',
    complianceStatus: 'COMPLIANT', riskLevel: 'LOW', workflowStatus: 'RECONCILED',
    approvedBy: 'Priya Venkataraman', approvedAt: '2026-04-03T10:00:00',
    createdBy: 'Arjun Sharma', createdAt: '2026-04-02T08:00:00', updatedAt: '2026-04-10T14:00:00',
    notes: 'Mar 2026 IFRS run — reconciled against Q4 financial statements.',
    fraudFlags: [],
    glEntries: [],
    categoryBreakdown: [],
    auditTrail: [],
  },
  {
    id: 'DR-2026-00011',
    runDate: '2026-04-02', period: 'Mar 2026', periodMonth: 3, periodYear: 2026,
    book: 'STATUTORY', branch: 'ALL', assetCategory: 'ALL', assetCount: 1284,
    method: 'WDV',
    currentDep: 10240000, accumulatedDep: 421420000, netBookValue: 1556560000,
    revaluationImpact: 0, impairmentImpact: 0,
    glStatus: 'POSTED', journalRef: 'JV-2026-03-0002', journalStatus: 'POSTED',
    complianceStatus: 'COMPLIANT', riskLevel: 'LOW', workflowStatus: 'RECONCILED',
    approvedBy: 'Ravi Krishnamurthy', approvedAt: '2026-04-04T09:00:00',
    createdBy: 'Meena Pillai', createdAt: '2026-04-02T09:00:00', updatedAt: '2026-04-12T16:00:00',
    notes: 'Mar 2026 statutory all-branches — fully reconciled with balance sheet.',
    fraudFlags: [],
    glEntries: [],
    categoryBreakdown: [],
    auditTrail: [],
  },
  {
    id: 'DR-2026-00010',
    runDate: '2026-03-10', period: 'Feb 2026', periodMonth: 2, periodYear: 2026,
    book: 'IFRS', branch: 'ICU', assetCategory: 'MEDICAL_EQUIP', assetCount: 278,
    method: 'WDV',
    currentDep: 3980000, accumulatedDep: 64022000, netBookValue: 288140000,
    revaluationImpact: 0, impairmentImpact: 2140000,
    glStatus: 'REVERSED', journalRef: 'JV-2026-02-REV-001', journalStatus: 'REVERSED',
    complianceStatus: 'EXCEPTION', riskLevel: 'HIGH', workflowStatus: 'REVERSED',
    approvedBy: 'Kavitha Menon', approvedAt: '2026-03-15T11:00:00',
    createdBy: 'Sanjay Iyer', createdAt: '2026-03-10T09:00:00', updatedAt: '2026-03-20T10:00:00',
    notes: 'REVERSED: Incorrect asset gross values discovered post-posting. Reversal approved. Recalculated as DR-2026-00009.',
    fraudFlags: ['Incorrect gross value used — manual override suspected'],
    glEntries: [],
    categoryBreakdown: [],
    auditTrail: [
      { ts: '2026-03-15T11:00:00', user: 'Kavitha Menon',    action: 'Compliance exception raised — gross value mismatch', type: 'COMPLIANCE' },
      { ts: '2026-03-20T10:00:00', user: 'Kavitha Menon',    action: 'Reversal approved — DR-2026-00010 voided',           type: 'REVERSE' },
    ],
  },
  {
    id: 'DR-2026-00009',
    runDate: '2026-03-21', period: 'Feb 2026', periodMonth: 2, periodYear: 2026,
    book: 'IFRS', branch: 'ICU', assetCategory: 'MEDICAL_EQUIP', assetCount: 278,
    method: 'WDV',
    currentDep: 4218000, accumulatedDep: 64022000, netBookValue: 285980000,
    revaluationImpact: 2840000, impairmentImpact: 1240000,
    glStatus: 'POSTED', journalRef: 'JV-2026-02-RECALC-001', journalStatus: 'POSTED',
    complianceStatus: 'COMPLIANT', riskLevel: 'MEDIUM', workflowStatus: 'POSTED',
    approvedBy: 'Kavitha Menon', approvedAt: '2026-03-21T14:00:00',
    createdBy: 'Sanjay Iyer', createdAt: '2026-03-21T09:00:00', updatedAt: '2026-03-21T14:00:00',
    notes: 'Recalculated run replacing reversed DR-2026-00010. Corrected gross values applied.',
    fraudFlags: [],
    glEntries: [],
    categoryBreakdown: [],
    auditTrail: [
      { ts: '2026-03-21T09:00:00', user: 'Sanjay Iyer',   action: 'Recalculated run initiated — replaces DR-2026-00010', type: 'RECALC' },
      { ts: '2026-03-21T14:00:00', user: 'Kavitha Menon', action: 'Approved and posted — corrected values confirmed',     type: 'POST' },
    ],
  },
  {
    id: 'DR-2026-00008',
    runDate: '2026-02-03', period: 'Jan 2026', periodMonth: 1, periodYear: 2026,
    book: 'IFRS', branch: 'MAIN', assetCategory: 'ALL', assetCount: 798,
    method: 'SLM',
    currentDep: 6180000, accumulatedDep: 264888000, netBookValue: 1225202000,
    revaluationImpact: 0, impairmentImpact: 0,
    glStatus: 'POSTED', journalRef: 'JV-2026-01-0001', journalStatus: 'POSTED',
    complianceStatus: 'COMPLIANT', riskLevel: 'LOW', workflowStatus: 'RECONCILED',
    approvedBy: 'Priya Venkataraman', approvedAt: '2026-02-04T09:00:00',
    createdBy: 'Arjun Sharma', createdAt: '2026-02-03T08:00:00', updatedAt: '2026-02-14T15:00:00',
    notes: 'Jan 2026 IFRS main hospital — normal run.',
    fraudFlags: [], glEntries: [], categoryBreakdown: [], auditTrail: [],
  },
  {
    id: 'DR-2026-00007',
    runDate: '2026-05-20', period: 'Apr 2026', periodMonth: 4, periodYear: 2026,
    book: 'IFRS', branch: 'PHARMACY', assetCategory: 'IT_ASSETS', assetCount: 62,
    method: 'WDV',
    currentDep: 484000, accumulatedDep: 8420000, netBookValue: 24800000,
    revaluationImpact: 0, impairmentImpact: 0,
    glStatus: 'NOT_POSTED', journalRef: null, journalStatus: 'DRAFT',
    complianceStatus: 'PENDING', riskLevel: 'LOW', workflowStatus: 'PENDING',
    approvedBy: null, approvedAt: null,
    createdBy: 'Pradeep Anand', createdAt: '2026-05-20T07:30:00', updatedAt: '2026-05-20T07:30:00',
    notes: 'Pharmacy IT assets — WDV run pending approval.',
    fraudFlags: [], glEntries: [], categoryBreakdown: [], auditTrail: [],
  },
  {
    id: 'DR-2026-00006',
    runDate: '2026-05-20', period: 'Apr 2026', periodMonth: 4, periodYear: 2026,
    book: 'IFRS', branch: 'ORTHO', assetCategory: 'SURGICAL', assetCount: 94,
    method: 'WDV',
    currentDep: 724000, accumulatedDep: 14820000, netBookValue: 68400000,
    revaluationImpact: 0, impairmentImpact: 0,
    glStatus: 'NOT_POSTED', journalRef: null, journalStatus: 'DRAFT',
    complianceStatus: 'PENDING', riskLevel: 'LOW', workflowStatus: 'PENDING',
    approvedBy: null, approvedAt: null,
    createdBy: 'Pradeep Anand', createdAt: '2026-05-20T08:00:00', updatedAt: '2026-05-20T08:00:00',
    notes: 'Orthopaedic surgical instruments — WDV run pending approval.',
    fraudFlags: [], glEntries: [], categoryBreakdown: [], auditTrail: [],
  },
];

// ─── Summary Strip Metrics ─────────────────────────────────────────────────────
export const SUMMARY_STRIP = [
  { label: 'Asset Base (NBV)',    value: '₹1,205.8Cr', change: null },
  { label: 'IFRS Apr-26',        value: '₹6.84Cr',    change: '+2.45%', pos: true  },
  { label: 'Statutory Apr-26',   value: '₹8.12Cr',    change: '+1.8%',  pos: true  },
  { label: 'IT Act Apr-26',      value: '₹11.48Cr',   change: '+2.1%',  pos: false },
  { label: 'Book Variance',      value: '₹1.28Cr',    change: '+33%',   pos: false },
  { label: 'Deferred Tax Exp.',  value: '₹3.84Cr',    change: null },
  { label: 'Acc. Dep. (IFRS)',   value: '₹284.65Cr',  change: null },
];

// ─── Chart Data ───────────────────────────────────────────────────────────────
export const TREND_DATA = [
  { month: 'Nov 25', ifrs: 6020000, statutory: 7840000, itAct: 10200000, mgmt: 5800000 },
  { month: 'Dec 25', ifrs: 6180000, statutory: 8020000, itAct: 10480000, mgmt: 5960000 },
  { month: 'Jan 26', ifrs: 6180000, statutory: 8120000, itAct: 10620000, mgmt: 5980000 },
  { month: 'Feb 26', ifrs: 6380000, statutory: 8240000, itAct: 10820000, mgmt: 6120000 },
  { month: 'Mar 26', ifrs: 6540000, statutory: 8480000, itAct: 11020000, mgmt: 6280000 },
  { month: 'Apr 26', ifrs: 6842000, statutory: 8124000, itAct: 11482000, mgmt: 6540000 },
];

export const CATEGORY_DATA = [
  { name: 'Medical Equip', value: 2841000, fill: '#8b5cf6' },
  { name: 'Biomedical',    value: 1923000, fill: '#06b6d4' },
  { name: 'IT Assets',     value: 1124000, fill: '#3b82f6' },
  { name: 'Buildings',     value: 482000,  fill: '#10b981' },
  { name: 'Lab Equip',     value: 312000,  fill: '#f59e0b' },
  { name: 'Imaging',       value: 842000,  fill: '#ec4899' },
  { name: 'Surgical',      value: 284000,  fill: '#a855f7' },
  { name: 'Vehicles',      value: 192000,  fill: '#f97316' },
  { name: 'Furniture',     value: 84000,   fill: '#14b8a6' },
  { name: 'Lease ROU',     value: 758000,  fill: '#0ea5e9' },
];

export const MULTIBOOK_DATA = [
  { period: 'Q1 FY25', ifrs: 18200000, statutory: 22800000, itAct: 29400000, gap: 11200000 },
  { period: 'Q2 FY25', ifrs: 18640000, statutory: 23100000, itAct: 29800000, gap: 11160000 },
  { period: 'Q3 FY25', ifrs: 19100000, statutory: 23600000, itAct: 30400000, gap: 11300000 },
  { period: 'Q4 FY25', ifrs: 19580000, statutory: 24200000, itAct: 31200000, gap: 11620000 },
  { period: 'Q1 FY26', ifrs: 19840000, statutory: 24800000, itAct: 32100000, gap: 12260000 },
];

export const TREASURY_FORECAST = [
  { month: 'May 26', forecast: 18420000, budget: 18000000 },
  { month: 'Jun 26', forecast: 18650000, budget: 18200000 },
  { month: 'Jul 26', forecast: 18920000, budget: 18400000 },
  { month: 'Aug 26', forecast: 19180000, budget: 18600000 },
  { month: 'Sep 26', forecast: 19420000, budget: 18800000 },
  { month: 'Oct 26', forecast: 19680000, budget: 19000000 },
  { month: 'Nov 26', forecast: 19940000, budget: 19200000 },
  { month: 'Dec 26', forecast: 20210000, budget: 19400000 },
  { month: 'Jan 27', forecast: 20480000, budget: 19600000 },
  { month: 'Feb 27', forecast: 20760000, budget: 19800000 },
  { month: 'Mar 27', forecast: 21040000, budget: 20000000 },
  { month: 'Apr 27', forecast: 21320000, budget: 20200000 },
];

export const IMPAIRMENT_DATA = [
  { month: 'Nov 25', exposure: 12400000, confirmed: 4200000 },
  { month: 'Dec 25', exposure: 14800000, confirmed: 5600000 },
  { month: 'Jan 26', exposure: 18200000, confirmed: 7800000 },
  { month: 'Feb 26', exposure: 24100000, confirmed: 9200000 },
  { month: 'Mar 26', exposure: 31400000, confirmed: 12800000 },
  { month: 'Apr 26', exposure: 38750000, confirmed: 15400000 },
];

export const BRANCH_DATA = [
  { branch: 'Main Hospital', value: 6842000, fill: '#8b5cf6' },
  { branch: 'ICU',           value: 4218000, fill: '#06b6d4' },
  { branch: 'Oncology',      value: 2184000, fill: '#f97316' },
  { branch: 'Labs',          value: 1248000, fill: '#f59e0b' },
  { branch: 'Cardiac',       value: 1842000, fill: '#ec4899' },
  { branch: 'Med College',   value: 824000,  fill: '#3b82f6' },
  { branch: 'Ortho',         value: 724000,  fill: '#14b8a6' },
  { branch: 'Pharmacy',      value: 484000,  fill: '#10b981' },
];

// ─── Audit Event Configuration ────────────────────────────────────────────────
export const AUDIT_TYPES = {
  CREATE:     { label: 'Initiated',    color: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
  PROCESS:    { label: 'Processing',   color: '#06b6d4', bg: 'bg-cyan-100 dark:bg-cyan-900/30',     text: 'text-cyan-700 dark:text-cyan-400' },
  PREVIEW:    { label: 'Previewed',    color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-400' },
  APPROVE:    { label: 'Approved',     color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-400' },
  POST:       { label: 'GL Posted',    color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-400' },
  REVERSE:    { label: 'Reversed',     color: '#f43f5e', bg: 'bg-rose-100 dark:bg-rose-900/30',     text: 'text-rose-700 dark:text-rose-400' },
  RECALC:     { label: 'Recalculated', color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400' },
  RECONCILE:  { label: 'Reconciled',   color: '#14b8a6', bg: 'bg-teal-100 dark:bg-teal-900/30',     text: 'text-teal-700 dark:text-teal-400' },
  AI_ALERT:   { label: 'AI Alert',     color: '#a855f7', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  COMPLIANCE: { label: 'Compliance',   color: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  EXPORT:     { label: 'Exported',     color: '#6b7280', bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-600 dark:text-gray-400' },
};

// ─── Global Audit Events ──────────────────────────────────────────────────────
export const GLOBAL_AUDIT = [
  { id: 'GA-01', ts: '2026-05-20T07:04:00', user: 'System',             runId: 'DR-2026-00013', action: 'Lab equipment calculation running — 186 assets', type: 'PROCESS', severity: 'INFO' },
  { id: 'GA-02', ts: '2026-05-19T11:08:00', user: 'AI Engine',          runId: 'DR-2026-00014', action: 'CRITICAL: IAS 36 triggers — 8 Oncology assets, ₹4.82Cr impairment', type: 'AI_ALERT', severity: 'CRITICAL' },
  { id: 'GA-03', ts: '2026-05-18T08:00:00', user: 'Lakshmi Narayanan',  runId: 'DR-2026-00015', action: 'Medical College buildings run submitted — revaluation review pending', type: 'PROCESS', severity: 'INFO' },
  { id: 'GA-04', ts: '2026-05-15T10:30:00', user: 'Sanjay Iyer',        runId: 'DR-2026-00016', action: 'Cardiac imaging component run previewed — ₹1.84Cr current dep.', type: 'PREVIEW', severity: 'INFO' },
  { id: 'GA-05', ts: '2026-05-11T14:25:00', user: 'System',             runId: 'DR-2026-00017', action: 'ICU GL posted with impairment entry — JV-2026-04-0004', type: 'POST', severity: 'INFO' },
  { id: 'GA-06', ts: '2026-05-11T14:22:00', user: 'Kavitha Menon',      runId: 'DR-2026-00017', action: 'ICU Apr-26 approved — REVIEW_NEEDED flag acknowledged', type: 'APPROVE', severity: 'INFO' },
  { id: 'GA-07', ts: '2026-05-10T09:12:00', user: 'AI Engine',          runId: 'DR-2026-00017', action: 'IAS 36 impairment indicators detected — 3 ICU ventilators', type: 'AI_ALERT', severity: 'HIGH' },
  { id: 'GA-08', ts: '2026-05-03T11:30:00', user: 'Ravi Krishnamurthy', runId: 'DR-2026-00018', action: 'IT Act all-branches approved and posted — ₹11.48Cr', type: 'POST', severity: 'INFO' },
  { id: 'GA-09', ts: '2026-05-02T09:20:00', user: 'Priya Venkataraman', runId: 'DR-2026-00019', action: 'Statutory book Apr-26 posted — ₹8.12Cr WDV', type: 'POST', severity: 'INFO' },
  { id: 'GA-10', ts: '2026-05-10T14:00:00', user: 'Ravi Krishnamurthy', runId: 'DR-2026-00020', action: 'Apr-26 IFRS run reconciled against trial balance', type: 'RECONCILE', severity: 'INFO' },
  { id: 'GA-11', ts: '2026-05-02T09:14:22', user: 'System',             runId: 'DR-2026-00020', action: 'GL posted — JV-2026-04-0001, 10 entries, ₹6.84Cr', type: 'POST', severity: 'INFO' },
  { id: 'GA-12', ts: '2026-05-18T09:00:00', user: 'AI Engine',          runId: 'ALL',           action: 'Deferred tax exposure alert — IFRS vs IT-Act variance ₹1.28Cr widening', type: 'AI_ALERT', severity: 'MEDIUM' },
  { id: 'GA-13', ts: '2026-03-20T10:00:00', user: 'Kavitha Menon',      runId: 'DR-2026-00010', action: 'ICU Feb-26 run reversed — incorrect gross values', type: 'REVERSE', severity: 'HIGH' },
  { id: 'GA-14', ts: '2026-03-21T14:00:00', user: 'Kavitha Menon',      runId: 'DR-2026-00009', action: 'Recalculated run posted — corrected values applied', type: 'POST', severity: 'INFO' },
  { id: 'GA-15', ts: '2026-05-19T11:30:00', user: 'AI Engine',          runId: 'ALL',           action: 'Fraud detection: Abnormal residual value on ASSET-ONC-0008 flagged', type: 'AI_ALERT', severity: 'CRITICAL' },
];

// ─── AI Insight Cards ─────────────────────────────────────────────────────────
export const AI_INSIGHTS = [
  {
    id: 'ins-01', severity: 'CRITICAL', icon: 'Zap',
    title: 'IAS 36 Impairment — Oncology',
    body: '8 biomedical assets in Oncology (Linear Accelerators, Brachytherapy) show carrying amount > recoverable amount. Estimated impairment: ₹4.82Cr. Formal IAS 36 assessment mandatory before financial close.',
    action: 'Start IAS 36 Assessment',
  },
  {
    id: 'ins-02', severity: 'HIGH', icon: 'AlertTriangle',
    title: 'ICU Ventilator Impairment Risk',
    body: '3 ICU ventilators show >40% utilization drop over 6 months — classic IAS 36 trigger. Estimated exposure ₹1.24Cr. Management review required.',
    action: 'Review Assets',
  },
  {
    id: 'ins-03', severity: 'HIGH', icon: 'ShieldAlert',
    title: '7 Compliance Exceptions Active',
    body: 'Schedule II rate mismatch: 3 IT assets at 25% WDV vs. required 40%. 2 IFRS 16 lease assets missing inception adjustments. Requires correction before quarter close.',
    action: 'Fix Exceptions',
  },
  {
    id: 'ins-04', severity: 'MEDIUM', icon: 'BookOpen',
    title: 'Deferred Tax Exposure Growing',
    body: 'IFRS vs IT-Act book variance: ₹1.28Cr this quarter (up 33%). Creates deferred tax liability of ~₹42L at 33% tax rate. Disclosure note required.',
    action: 'View Multi-Book Variance',
  },
  {
    id: 'ins-05', severity: 'MEDIUM', icon: 'RefreshCw',
    title: 'IFRS Revaluation — Buildings',
    body: 'Medical College buildings show 26.8% YoY appreciation. IFRS IAS 16 revaluation model requires formal reassessment. Estimated surplus ₹18.4L.',
    action: 'Schedule Revaluation',
  },
  {
    id: 'ins-06', severity: 'INFO', icon: 'Landmark',
    title: 'Treasury Forecast: ₹52.8Cr / Year',
    body: 'AI projects ₹52.8Cr annual depreciation — 7.5% over approved budget. Capex planning revision advised. Asset replacement reserve of ₹15.8Cr recommended.',
    action: 'View Forecast',
  },
];

// ─── AI Chat Sample Responses ─────────────────────────────────────────────────
export const AI_RESPONSES = {
  'Show assets with abnormal depreciation': `**23 Assets with Abnormal Depreciation Detected**\n\n• **ICU — MRI Scanner (ASSET-ICU-0042)**: WDV running 34% faster than peer assets. Residual value may need revision.\n\n• **Oncology — Linear Accelerator (ASSET-ONC-0008)**: Monthly depreciation ₹2.14L vs. expected ₹1.62L — 32% variance. Component-level review needed.\n\n• **Cardiac — Cath Lab System (ASSET-CAR-0015)**: 8 consecutive months above trend. Possible accelerated usage pattern.\n\n**Recommended Action**: Run IAS 36 impairment assessment on all 23 flagged assets before Q1 FY27 close.`,

  'Forecast next year\'s depreciation': `**12-Month Forecast: May 2026 – Apr 2027**\n\n| Book | Monthly | Annual |\n|------|---------|--------|\n| IFRS | ₹1.84Cr | ₹22.1Cr |\n| Statutory | ₹2.14Cr | ₹25.7Cr |\n| IT Act | ₹2.89Cr | ₹34.7Cr |\n\n**Growth Drivers:**\n• New ICU equipment Q4 FY26: +₹3.2L/month\n• Medical College revaluation: +₹18.4L dep. charge\n• IFRS 16 new OT lease: +₹8.2L/month\n\n**Budget Variance**: ₹3.72Cr over approved FY27 budget. Capex revision recommended.`,

  'Detect compliance risks': `**7 Compliance Exceptions — April 2026**\n\n⚠️ **Schedule II Rate Mismatch (3 IT Assets)**\nUsing 25% WDV; Companies Act requires 40% for computers. Cumulative shortfall: ₹84K.\n\n⚠️ **IFRS 16 Lease Inception Adjustments (2 Assets)**\nRight-of-use assets missing commencement date fair value adjustments.\n\n⚠️ **IAS 36 Trigger Breach (4 Assets)**\nICU and Oncology assets: carrying amount exceeds recoverable amount threshold.\n\n**Priority**: Resolve before Q1 FY27 financial statement sign-off.`,

  'Find depreciation variances across books': `**Multi-Book Variance Analysis — Q1 FY26**\n\n• **IFRS vs Statutory**: ₹4.96Cr variance (Statutory 25% higher)\n• **IFRS vs IT Act**: ₹12.26Cr variance (IT Act 62% higher)\n• **Deferred Tax Impact**: ₹1.28Cr temporary difference → ₹42L deferred tax liability\n\n**Root Cause**: Different depreciation methods (SLM vs WDV) and rates between books.\n\n**Action Required**: Deferred tax disclosure in Q1 FY27 notes to accounts.`,
};

// ─── Filter Options ───────────────────────────────────────────────────────────
export const FILTER_OPTS = {
  periods:     ['Apr 2026', 'Mar 2026', 'Feb 2026', 'Jan 2026', 'Dec 2025', 'Nov 2025', 'Q4 FY26', 'FY 2025-26'],
  books:       ['IFRS', 'STATUTORY', 'IT_ACT', 'GAAP', 'MANAGEMENT'],
  branches:    ['MAIN', 'ICU', 'MED_COL', 'PHARMACY', 'LABS', 'CARDIAC', 'ONCOLOGY', 'ORTHO'],
  methods:     ['SLM', 'WDV', 'COMPONENT', 'LEASE', 'UOP', 'DDB'],
  runStates:   ['DRAFT', 'PREVIEWED', 'PENDING', 'PROCESSING', 'APPROVED', 'POSTED', 'REVERSED', 'RECALCULATED', 'RECONCILED'],
  glStatuses:  ['NOT_POSTED', 'PENDING', 'POSTED', 'FAILED', 'REVERSED'],
  compliance:  ['COMPLIANT', 'REVIEW_NEEDED', 'NON_COMPLIANT', 'EXCEPTION', 'PENDING'],
  risk:        ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
};

export const AI_SEARCH_HINTS = [
  'Show ICU assets pending depreciation',
  'Find depreciation variances across accounting books',
  'Show impaired biomedical assets',
  'Detect abnormal depreciation calculations',
  'Show reversed runs this quarter',
  'Find compliance exceptions in IFRS book',
  'High-risk assets in Oncology — Apr 2026',
  'Pending runs exceeding SLA threshold',
];
