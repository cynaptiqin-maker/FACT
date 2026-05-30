// ─── AR Aging Report — Constants & Mock Data ─────────────────────────────────

// ── Bucket Definitions ────────────────────────────────────────────────────────
export const AGING_BUCKETS_CONFIG = [
  { key: 'current', label: 'Current',    sublabel: '0–30 Days',   min: 0,   max: 30,       color: '#10b981', darkColor: '#34d399', bgClass: 'bg-emerald-50 dark:bg-emerald-900/20', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30', badgeText: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-500' },
  { key: 'd31',     label: '31–60 Days', sublabel: 'Early Overdue', min: 31, max: 60,      color: '#f59e0b', darkColor: '#fbbf24', bgClass: 'bg-amber-50 dark:bg-amber-900/20',   badgeBg: 'bg-amber-100 dark:bg-amber-900/30',   badgeText: 'text-amber-700 dark:text-amber-400',   ring: 'ring-amber-500'   },
  { key: 'd61',     label: '61–90 Days', sublabel: 'Overdue',    min: 61,   max: 90,        color: '#f97316', darkColor: '#fb923c', bgClass: 'bg-orange-50 dark:bg-orange-900/20', badgeBg: 'bg-orange-100 dark:bg-orange-900/30', badgeText: 'text-orange-700 dark:text-orange-400', ring: 'ring-orange-500'  },
  { key: 'd91',     label: '91–120 Days',sublabel: 'High Risk',  min: 91,   max: 120,       color: '#ef4444', darkColor: '#f87171', bgClass: 'bg-red-50 dark:bg-red-900/20',      badgeBg: 'bg-red-100 dark:bg-red-900/30',       badgeText: 'text-red-700 dark:text-red-400',       ring: 'ring-red-500'     },
  { key: 'd121',    label: '120+ Days',  sublabel: 'Critical',   min: 121,  max: Infinity,  color: '#7c3aed', darkColor: '#a78bfa', bgClass: 'bg-violet-50 dark:bg-violet-900/20', badgeBg: 'bg-violet-100 dark:bg-violet-900/30', badgeText: 'text-violet-700 dark:text-violet-400', ring: 'ring-violet-500'  },
];

export function getBucket(days) {
  return AGING_BUCKETS_CONFIG.find(b => days >= b.min && days <= b.max) ?? AGING_BUCKETS_CONFIG[4];
}

// ── Risk Levels ───────────────────────────────────────────────────────────────
export const RISK_META = {
  LOW:      { label: 'Low',      color: '#10b981', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30', badgeText: 'text-emerald-700 dark:text-emerald-400' },
  MEDIUM:   { label: 'Medium',   color: '#f59e0b', badgeBg: 'bg-amber-100 dark:bg-amber-900/30',     badgeText: 'text-amber-700 dark:text-amber-400'     },
  HIGH:     { label: 'High',     color: '#f97316', badgeBg: 'bg-orange-100 dark:bg-orange-900/30',   badgeText: 'text-orange-700 dark:text-orange-400'   },
  CRITICAL: { label: 'Critical', color: '#ef4444', badgeBg: 'bg-red-100 dark:bg-red-900/30',         badgeText: 'text-red-700 dark:text-red-400'         },
};

// ── Collection & Insurance Statuses ───────────────────────────────────────────
export const COLL_STATUS_META = {
  PENDING:     { label: 'Pending',          bg: 'bg-slate-100 dark:bg-slate-800',      text: 'text-slate-600 dark:text-slate-300'  },
  IN_PROGRESS: { label: 'In Progress',      bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-400'    },
  PROMISED:    { label: 'Promise-to-Pay',   bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400'  },
  PARTIAL:     { label: 'Partial',          bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400'},
  ESCALATED:   { label: 'Escalated',        bg: 'bg-rose-100 dark:bg-rose-900/30',     text: 'text-rose-700 dark:text-rose-400'    },
  LEGAL:       { label: 'Legal Action',     bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-400'      },
  COLLECTED:   { label: 'Collected',        bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  WRITTEN_OFF: { label: 'Written Off',      bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-500 dark:text-gray-400'    },
};

export const INS_STATUS_META = {
  PREAUTH_PENDING: { label: 'PreAuth Pending',  color: '#f59e0b' },
  PREAUTH_DONE:    { label: 'PreAuth Done',     color: '#06b6d4' },
  SUBMITTED:       { label: 'Submitted',        color: '#3b82f6' },
  PROCESSING:      { label: 'Processing',       color: '#8b5cf6' },
  APPROVED:        { label: 'Approved',         color: '#10b981' },
  PARTIAL_SETTLED: { label: 'Partial Settled',  color: '#f97316' },
  SETTLED:         { label: 'Settled',          color: '#10b981' },
  DENIED:          { label: 'Denied',           color: '#ef4444' },
  RESUBMITTED:     { label: 'Resubmitted',      color: '#06b6d4' },
};

export const RECEIVABLE_TYPES = {
  PATIENT:   { label: 'Patient',       color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-400'   },
  INSURANCE: { label: 'Insurance/TPA', color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400' },
  CORPORATE: { label: 'Corporate',     color: '#06b6d4', bg: 'bg-cyan-50 dark:bg-cyan-900/20',    text: 'text-cyan-700 dark:text-cyan-400'    },
  GOVERNMENT:{ label: 'Government',    color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
};

export const DEPARTMENTS = ['Cardiology','ICU','OT','General Surgery','Neurology','Oncology','Orthopedics','Pediatrics','Radiology','Pharmacy','Laboratory','Emergency','Nephrology','Psychiatry','ENT'];
export const BRANCHES    = ['Main Campus','North Wing','South Clinic','East Block','Specialty Center','Cardiac Care'];
export const COLLECTORS  = ['Priya Sharma','Rahul Mehta','Ananya Iyer','Suresh Nair','Deepa Rao','Kiran Pillai'];
export const SOURCE_MODULES = ['IP Billing','OP Billing','ICU Billing','OT Billing','Pharmacy','Laboratory','Radiology','Corporate Billing','Emergency'];

// ── Executive KPI Data ────────────────────────────────────────────────────────
export const AGING_KPIS = [
  { id: 'total',      label: 'Total Receivables',     value: 52800000, display: '₹5.28Cr', trend: '+12.4%', trendUp: false, trendNeutral: false, icon: 'Landmark',     color: 'blue',    suffix: 'vs last month' },
  { id: 'current',    label: 'Current (0–30 Days)',    value: 18400000, display: '₹1.84Cr', trend: '34.8%',  trendUp: null,  trendNeutral: true,  icon: 'CheckCircle2', color: 'emerald', suffix: 'of total AR'   },
  { id: 'd30plus',    label: '30+ Days Outstanding',   value: 34400000, display: '₹3.44Cr', trend: '+8.2%',  trendUp: false, trendNeutral: false, icon: 'Clock',        color: 'amber',   suffix: 'vs last month' },
  { id: 'd60plus',    label: '60+ Days Outstanding',   value: 23200000, display: '₹2.32Cr', trend: '+14.6%', trendUp: false, trendNeutral: false, icon: 'AlertTriangle',color: 'orange',  suffix: 'vs last month' },
  { id: 'd90plus',    label: '90+ Days Outstanding',   value: 14300000, display: '₹1.43Cr', trend: '+21.3%', trendUp: false, trendNeutral: false, icon: 'AlertOctagon', color: 'red',     suffix: 'vs last month' },
  { id: 'insurance',  label: 'Insurance Outstanding',  value: 21200000, display: '₹2.12Cr', trend: '40.2%',  trendUp: null,  trendNeutral: true,  icon: 'Shield',       color: 'violet',  suffix: 'of total AR'   },
  { id: 'highrisk',   label: 'High-Risk Accounts',     value: 8520000,  display: '₹85.2L',  trend: '28 accts', trendUp: false, trendNeutral: true, icon: 'Flame',       color: 'rose',    suffix: 'need action'   },
  { id: 'efficiency', label: 'Collection Efficiency',  value: 68.4,     display: '68.4%',   trend: '−3.2pp', trendUp: false, trendNeutral: false, icon: 'Gauge',        color: 'cyan',    suffix: 'vs 71.6% target'},
  { id: 'forecast',   label: 'Predicted Cash Inflow',  value: 12300000, display: '₹1.23Cr', trend: 'next 30d', trendUp: true,trendNeutral: true,  icon: 'Sparkles',     color: 'indigo',  suffix: 'AI forecast'   },
  { id: 'leakage',    label: 'Revenue Leakage Risk',   value: 1840000,  display: '₹18.4L',  trend: '5 alerts', trendUp: false, trendNeutral: true, icon: 'Zap',         color: 'rose',    suffix: 'detected'      },
];

// ── 8-Month Aging Trend Chart ─────────────────────────────────────────────────
export const AGING_TREND_DATA = [
  { month: 'Oct',  current: 1420, d31: 620, d61: 340, d91: 180, d121: 120 },
  { month: 'Nov',  current: 1560, d31: 680, d61: 390, d91: 210, d121: 140 },
  { month: 'Dec',  current: 1890, d31: 740, d61: 420, d91: 230, d121: 160 },
  { month: 'Jan',  current: 1620, d31: 810, d61: 460, d91: 260, d121: 190 },
  { month: 'Feb',  current: 1740, d31: 870, d61: 510, d91: 290, d121: 220 },
  { month: 'Mar',  current: 1820, d31: 920, d61: 560, d91: 320, d121: 250 },
  { month: 'Apr',  current: 1710, d31: 980, d61: 620, d91: 360, d121: 280 },
  { month: 'May',  current: 1840, d31: 1120, d61: 895, d91: 682, d121: 748 },
];

// ── Branch × Bucket Heatmap ───────────────────────────────────────────────────
export const BRANCH_HEATMAP = [
  { branch: 'Main Campus',     current: 4820, d31: 2940, d61: 2180, d91: 1620, d121: 1840, total: 13400 },
  { branch: 'North Wing',      current: 3610, d31: 2120, d61: 1560, d91: 1040, d121: 1100, total:  9430 },
  { branch: 'Specialty Center',current: 3140, d31: 1980, d61: 1240, d91:  880, d121:  920, total:  8160 },
  { branch: 'East Block',      current: 2880, d31: 1640, d61: 1080, d91:  720, d121:  760, total:  7080 },
  { branch: 'South Clinic',    current: 2420, d31: 1380, d61:  860, d91:  580, d121:  580, total:  5820 },
  { branch: 'Cardiac Care',    current: 1530, d31:  940, d61:  580, d91:  380, d121:  400, total:  3830 },
];

// ── Department Aging (top 10) ─────────────────────────────────────────────────
export const DEPT_AGING_DATA = [
  { dept: 'ICU',            current: 3840, d31: 2180, d61: 1640, d91: 1280, d121: 1560, avgDays: 72 },
  { dept: 'Cardiology',     current: 2960, d31: 1840, d61: 1240, d91:  920, d121: 1040, avgDays: 58 },
  { dept: 'Oncology',       current: 2480, d31: 1580, d61: 1080, d91:  780, d121:  820, avgDays: 61 },
  { dept: 'General Surgery',current: 2120, d31: 1340, d61:  880, d91:  620, d121:  660, avgDays: 49 },
  { dept: 'Orthopedics',    current: 1840, d31: 1120, d61:  720, d91:  520, d121:  540, avgDays: 54 },
  { dept: 'Neurology',      current: 1560, d31:  980, d61:  620, d91:  440, d121:  440, avgDays: 52 },
  { dept: 'Nephrology',     current: 1320, d31:  840, d61:  520, d91:  360, d121:  340, avgDays: 47 },
  { dept: 'Radiology',      current:  980, d31:  620, d61:  380, d91:  260, d121:  220, avgDays: 38 },
  { dept: 'Emergency',      current:  840, d31:  520, d61:  320, d91:  220, d121:  180, avgDays: 42 },
  { dept: 'Pharmacy',       current:  640, d31:  380, d61:  220, d91:  140, d121:  120, avgDays: 29 },
];

// ── Insurance / TPA Performance ───────────────────────────────────────────────
export const INSURANCE_PERF = [
  { tpa: 'Star Health',        pending: 4840, avgSettlementDays: 38, settlementRate: 84, denialRate: 8,  trend: 'up'   },
  { tpa: 'New India Assurance',pending: 3920, avgSettlementDays: 52, settlementRate: 78, denialRate: 14, trend: 'down' },
  { tpa: 'United India',       pending: 3240, avgSettlementDays: 46, settlementRate: 81, denialRate: 11, trend: 'up'   },
  { tpa: 'Oriental Insurance', pending: 2680, avgSettlementDays: 61, settlementRate: 72, denialRate: 18, trend: 'down' },
  { tpa: 'HDFC ERGO',          pending: 2140, avgSettlementDays: 29, settlementRate: 91, denialRate: 5,  trend: 'up'   },
  { tpa: 'Bajaj Allianz',      pending: 1860, avgSettlementDays: 34, settlementRate: 88, denialRate: 7,  trend: 'up'   },
  { tpa: 'ICICI Lombard',      pending: 1540, avgSettlementDays: 31, settlementRate: 89, denialRate: 6,  trend: 'up'   },
  { tpa: 'Medi Assist',        pending: 1280, avgSettlementDays: 43, settlementRate: 76, denialRate: 16, trend: 'down' },
  { tpa: 'ECHS (Govt)',         pending: 2940, avgSettlementDays: 84, settlementRate: 61, denialRate: 22, trend: 'down' },
  { tpa: 'CGHS (Govt)',         pending: 2480, avgSettlementDays: 96, settlementRate: 58, denialRate: 26, trend: 'down' },
];

// ── Collector Efficiency ──────────────────────────────────────────────────────
export const COLLECTOR_PERF = [
  { name: 'Priya Sharma',  assigned: 28, collected: 19, efficiency: 78, totalValue: 8420000, collectedValue: 6568000, avgDays: 34, streak: 'up'   },
  { name: 'Rahul Mehta',   assigned: 24, collected: 15, efficiency: 68, totalValue: 7180000, collectedValue: 4882000, avgDays: 41, streak: 'down' },
  { name: 'Ananya Iyer',   assigned: 22, collected: 16, efficiency: 74, totalValue: 6840000, collectedValue: 5062000, avgDays: 37, streak: 'up'   },
  { name: 'Suresh Nair',   assigned: 18, collected: 10, efficiency: 58, totalValue: 5920000, collectedValue: 3434000, avgDays: 52, streak: 'down' },
  { name: 'Deepa Rao',     assigned: 20, collected: 14, efficiency: 71, totalValue: 6240000, collectedValue: 4430000, avgDays: 39, streak: 'up'   },
  { name: 'Kiran Pillai',  assigned: 16, collected: 11, efficiency: 69, totalValue: 4820000, collectedValue: 3326000, avgDays: 43, streak: 'flat' },
];

// ── Cash Flow Forecast (12-Week) ──────────────────────────────────────────────
export const FORECAST_DATA = [
  { week: 'W1 (May 19)',  expected: 2840, actual: 2620, lower: 2200, upper: 3480 },
  { week: 'W2 (May 26)',  expected: 3140, actual: 2980, lower: 2500, upper: 3780 },
  { week: 'W3 (Jun 02)',  expected: 2980, actual: null, lower: 2340, upper: 3620 },
  { week: 'W4 (Jun 09)',  expected: 3480, actual: null, lower: 2780, upper: 4180 },
  { week: 'W5 (Jun 16)',  expected: 3820, actual: null, lower: 3060, upper: 4580 },
  { week: 'W6 (Jun 23)',  expected: 4120, actual: null, lower: 3300, upper: 4940 },
  { week: 'W7 (Jun 30)',  expected: 3640, actual: null, lower: 2910, upper: 4370 },
  { week: 'W8 (Jul 07)',  expected: 4280, actual: null, lower: 3420, upper: 5140 },
  { week: 'W9 (Jul 14)',  expected: 3960, actual: null, lower: 3168, upper: 4752 },
  { week: 'W10 (Jul 21)', expected: 4640, actual: null, lower: 3712, upper: 5568 },
  { week: 'W11 (Jul 28)', expected: 4180, actual: null, lower: 3344, upper: 5016 },
  { week: 'W12 (Aug 04)', expected: 5120, actual: null, lower: 4096, upper: 6144 },
];

// ── Revenue Leakage Alerts ────────────────────────────────────────────────────
export const LEAKAGE_ALERTS = [
  {
    id: 'LA-001', severity: 'critical', category: 'Missing Claims',
    title: '12 ICU Claims Not Submitted to Insurance',
    description: 'ICU billing from April 8–15 for 12 patients with active insurance coverage has not been submitted to respective TPAs.',
    impact: 1840000, accounts: 12, branch: 'Main Campus', dept: 'ICU',
    detectedAt: '2026-05-17', aiConfidence: 96,
  },
  {
    id: 'LA-002', severity: 'high', category: 'Underbilled',
    title: 'ICU Day Charges Missing on 8 Invoices',
    description: 'AI detected 8 invoices where ICU ventilator and monitoring charges were not billed — comparing against procedure records.',
    impact: 620000, accounts: 8, branch: 'North Wing', dept: 'ICU',
    detectedAt: '2026-05-16', aiConfidence: 91,
  },
  {
    id: 'LA-003', severity: 'high', category: 'Delayed Submission',
    title: '19 Insurance Claims Approaching 90-Day Limit',
    description: 'Claims submitted between Feb 14–18 must be settled before May 18 per policy terms. 19 claims are unresolved.',
    impact: 4280000, accounts: 19, branch: 'Multiple', dept: 'Multiple',
    detectedAt: '2026-05-15', aiConfidence: 99,
  },
  {
    id: 'LA-004', severity: 'medium', category: 'Unreconciled Settlements',
    title: '₹8.4L TPA Payment Received but Not Reconciled',
    description: 'Payment advice from HDFC ERGO received on May 14 has not been matched to 6 corresponding claims in the system.',
    impact: 840000, accounts: 6, branch: 'Specialty Center', dept: 'Cardiology',
    detectedAt: '2026-05-14', aiConfidence: 88,
  },
  {
    id: 'LA-005', severity: 'medium', category: 'Denied Claims',
    title: '7 ECHS Claims Denied — Recovery Probable',
    description: 'ECHS denied 7 claims citing documentation gaps. AI analysis shows 5 of these are recoverable upon resubmission with additional records.',
    impact: 1640000, accounts: 7, branch: 'East Block', dept: 'General Surgery',
    detectedAt: '2026-05-13', aiConfidence: 82,
  },
  {
    id: 'LA-006', severity: 'low', category: 'Write-Off Alert',
    title: 'Unusual Write-Off Pattern Detected',
    description: '3 write-offs totalling ₹1.84L in the past 7 days from Suresh Nair exceed his 90-day average. Pending supervisor review.',
    impact: 184000, accounts: 3, branch: 'South Clinic', dept: 'Various',
    detectedAt: '2026-05-12', aiConfidence: 74,
  },
];

// ── AI Insight Cards ──────────────────────────────────────────────────────────
export const AI_INSIGHTS = [
  {
    id: 'AI-001', type: 'risk', urgency: 'critical',
    title: '3 Accounts Likely to Default This Week',
    body: 'HC-003601, HC-002847, and HC-004892 show payment-avoidance signals. Recommend escalation to legal within 48 hours.',
    action: 'View Accounts', accounts: ['REC-006','REC-014','REC-019'],
  },
  {
    id: 'AI-002', type: 'forecast', urgency: 'info',
    title: 'Insurance Collections Will Peak in Week 4',
    body: 'HDFC ERGO and Star Health TPA settlement cycles align in the first week of June — expect ₹1.84Cr inflow. Plan cash allocation.',
    action: 'View Forecast', accounts: [],
  },
  {
    id: 'AI-003', type: 'trend', urgency: 'warning',
    title: 'ICU Receivables Aging +38% MoM',
    body: 'Outstanding ICU bills aged beyond 60 days grew 38% since April. Root cause: ECHS pre-authorization delays. Recommend escalation to TPA relationship manager.',
    action: 'Drill Down', accounts: [],
  },
  {
    id: 'AI-004', type: 'action', urgency: 'warning',
    title: '19 Claims Breach 90-Day SLA in 3 Days',
    body: 'If not settled by May 22, these claims lose priority appeal rights. Immediate TPA follow-up recommended for New India and Oriental Insurance.',
    action: 'Send Reminders', accounts: [],
  },
  {
    id: 'AI-005', type: 'efficiency', urgency: 'info',
    title: 'Rebalance Collector Workload',
    body: 'Priya Sharma (78% efficiency) is underloaded vs Suresh Nair (58%). Reassigning 4 high-risk accounts from Nair to Sharma could recover ~₹18L faster.',
    action: 'Reassign', accounts: [],
  },
  {
    id: 'AI-006', type: 'leakage', urgency: 'high',
    title: '₹26.4L Revenue at Immediate Leakage Risk',
    body: 'Combining unsubmitted ICU claims, underbilled invoices, and approaching TPA deadlines — action needed in next 72 hours.',
    action: 'View Leakage', accounts: [],
  },
];

// ── Collections Priority Queue ────────────────────────────────────────────────
export const PRIORITY_QUEUE = [
  { rank: 1,  id: 'REC-006',  name: 'Mohammed Irfan',            amount: 62000,   agingDays: 97,  risk: 'CRITICAL', action: 'Escalate to Legal', dueIn: 'Overdue' },
  { rank: 2,  id: 'REC-014',  name: 'Oriental Insurance — OT Claim', amount: 380000, agingDays: 104, risk: 'CRITICAL', action: 'Urgent TPA Call',   dueIn: 'Overdue' },
  { rank: 3,  id: 'REC-019',  name: 'CGHS — ICU Bill (12 cases)', amount: 920000,  agingDays: 131, risk: 'CRITICAL', action: 'Resubmit + Escalate',dueIn: 'Overdue' },
  { rank: 4,  id: 'REC-004',  name: 'Sunita Verma',              amount: 95000,   agingDays: 75,  risk: 'CRITICAL', action: 'Field Visit',        dueIn: '3 days'  },
  { rank: 5,  id: 'REC-021',  name: 'New India Assurance — Batch',amount: 1840000, agingDays: 87,  risk: 'HIGH',     action: 'TPA Follow-Up',     dueIn: '2 days'  },
  { rank: 6,  id: 'REC-002',  name: 'Star Health — ICU Claim',   amount: 320000,  agingDays: 65,  risk: 'HIGH',     action: 'Send Reminder',     dueIn: '5 days'  },
  { rank: 7,  id: 'REC-026',  name: 'Infosys Corp — Balance',    amount: 270000,  agingDays: 49,  risk: 'MEDIUM',   action: 'Email Statement',   dueIn: '12 days' },
  { rank: 8,  id: 'REC-008',  name: 'ECHS — Pending Claims',     amount: 640000,  agingDays: 112, risk: 'HIGH',     action: 'Resubmit Docs',     dueIn: 'Overdue' },
];

// ── Detailed Aging Grid Rows (28 rows) ────────────────────────────────────────
export const MOCK_AGING_ROWS = [
  {
    id: 'REC-001', invoiceNo: 'INV-2026-00847', patientName: 'Rajesh Kumar Sharma',
    orgName: null, type: 'PATIENT', patientId: 'HC-004231', branch: 'Main Campus',
    department: 'Cardiology', billingDate: '2026-04-27', dueDate: '2026-05-12',
    agingDays: 7, agingBucket: 'current', originalAmount: 148500, outstandingAmount: 148500,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'IN_PROGRESS',
    riskLevel: 'MEDIUM', riskScore: 45, predictedRecovery: 88, assignedCollector: 'Priya Sharma',
    lastFollowUp: '2026-05-14', nextFollowUp: '2026-05-22', sourceModule: 'IP Billing',
    notes: 'Patient promised payment by 25th May. Family confirmed via phone.',
    paymentHistory: [{ date: '2026-05-01', amount: 0, note: 'First contact — patient requested 2-week extension' }],
  },
  {
    id: 'REC-002', invoiceNo: 'INV-2026-00831', patientName: null,
    orgName: 'Star Health Insurance', type: 'INSURANCE', patientId: 'HC-004100', branch: 'North Wing',
    department: 'ICU', billingDate: '2026-03-15', dueDate: '2026-04-14',
    agingDays: 65, agingBucket: 'd61', originalAmount: 320000, outstandingAmount: 320000,
    collectedAmount: 0, insuranceStatus: 'SUBMITTED', collectionStatus: 'PENDING',
    riskLevel: 'HIGH', riskScore: 74, predictedRecovery: 72, assignedCollector: 'Rahul Mehta',
    lastFollowUp: '2026-05-10', nextFollowUp: '2026-05-20', sourceModule: 'ICU Billing',
    notes: 'Claim submitted Mar 18. TPA processing delayed — requires additional ICU discharge summary.',
    paymentHistory: [],
  },
  {
    id: 'REC-003', invoiceNo: 'INV-2026-00792', patientName: null,
    orgName: 'Infosys Employee Health Program', type: 'CORPORATE', patientId: null, branch: 'Specialty Center',
    department: 'General Surgery', billingDate: '2026-03-01', dueDate: '2026-03-31',
    agingDays: 49, agingBucket: 'd31', originalAmount: 540000, outstandingAmount: 270000,
    collectedAmount: 270000, insuranceStatus: null, collectionStatus: 'PARTIAL',
    riskLevel: 'MEDIUM', riskScore: 42, predictedRecovery: 85, assignedCollector: 'Ananya Iyer',
    lastFollowUp: '2026-05-12', nextFollowUp: '2026-05-28', sourceModule: 'Corporate Billing',
    notes: '50% received per PO terms. Balance in next 30-day cycle. Finance head confirmed.',
    paymentHistory: [{ date: '2026-04-02', amount: 270000, note: 'First installment per PO-IFY-2026-1184' }],
  },
  {
    id: 'REC-004', invoiceNo: 'INV-2026-00760', patientName: 'Sunita Verma',
    orgName: null, type: 'PATIENT', patientId: 'HC-003987', branch: 'South Clinic',
    department: 'Orthopedics', billingDate: '2026-02-18', dueDate: '2026-03-05',
    agingDays: 75, agingBucket: 'd61', originalAmount: 95000, outstandingAmount: 95000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'ESCALATED',
    riskLevel: 'CRITICAL', riskScore: 88, predictedRecovery: 31, assignedCollector: 'Suresh Nair',
    lastFollowUp: '2026-05-08', nextFollowUp: '2026-05-19', sourceModule: 'IP Billing',
    notes: 'No response for 2 weeks. Address verified via Aadhaar. Recommended field visit.',
    paymentHistory: [],
  },
  {
    id: 'REC-005', invoiceNo: 'INV-2026-00745', patientName: null,
    orgName: 'United India Insurance', type: 'INSURANCE', patientId: 'HC-003720', branch: 'East Block',
    department: 'Oncology', billingDate: '2026-02-10', dueDate: '2026-03-12',
    agingDays: 68, agingBucket: 'd61', originalAmount: 280000, outstandingAmount: 196000,
    collectedAmount: 84000, insuranceStatus: 'PARTIAL_SETTLED', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'MEDIUM', riskScore: 55, predictedRecovery: 68, assignedCollector: 'Deepa Rao',
    lastFollowUp: '2026-05-15', nextFollowUp: '2026-05-21', sourceModule: 'IP Billing',
    notes: 'Dispute on Day 3 ICU charges deducted. Re-sending clinical justification to TPA.',
    paymentHistory: [{ date: '2026-04-05', amount: 84000, note: 'Partial settlement — TPA deducted ICU charges' }],
  },
  {
    id: 'REC-006', invoiceNo: 'INV-2026-00701', patientName: 'Mohammed Irfan',
    orgName: null, type: 'PATIENT', patientId: 'HC-003601', branch: 'Main Campus',
    department: 'Emergency', billingDate: '2026-01-28', dueDate: '2026-02-12',
    agingDays: 97, agingBucket: 'd91', originalAmount: 62000, outstandingAmount: 62000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'LEGAL',
    riskLevel: 'CRITICAL', riskScore: 94, predictedRecovery: 15, assignedCollector: 'Suresh Nair',
    lastFollowUp: '2026-04-30', nextFollowUp: null, sourceModule: 'IP Billing',
    notes: 'Transferred to legal. Last known address verified. Recovery unlikely without court order.',
    paymentHistory: [],
  },
  {
    id: 'REC-007', invoiceNo: 'INV-2026-00888', patientName: 'Kavitha Nair',
    orgName: null, type: 'PATIENT', patientId: 'HC-004400', branch: 'North Wing',
    department: 'Pediatrics', billingDate: '2026-05-04', dueDate: '2026-05-19',
    agingDays: 15, agingBucket: 'current', originalAmount: 34500, outstandingAmount: 34500,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 18, predictedRecovery: 95, assignedCollector: 'Kiran Pillai',
    lastFollowUp: '2026-05-15', nextFollowUp: '2026-05-21', sourceModule: 'OP Billing',
    notes: 'First reminder sent. Patient has good payment history.',
    paymentHistory: [],
  },
  {
    id: 'REC-008', invoiceNo: 'INV-2026-00620', patientName: null,
    orgName: 'ECHS — Defence Benefits', type: 'GOVERNMENT', patientId: null, branch: 'East Block',
    department: 'General Surgery', billingDate: '2026-01-10', dueDate: '2026-02-09',
    agingDays: 112, agingBucket: 'd91', originalAmount: 640000, outstandingAmount: 640000,
    collectedAmount: 0, insuranceStatus: 'DENIED', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'HIGH', riskScore: 76, predictedRecovery: 52, assignedCollector: 'Rahul Mehta',
    lastFollowUp: '2026-05-11', nextFollowUp: '2026-05-22', sourceModule: 'IP Billing',
    notes: 'Denied due to missing pre-authorisation number. Resubmitting with corrected docs.',
    paymentHistory: [],
  },
  {
    id: 'REC-009', invoiceNo: 'INV-2026-00901', patientName: null,
    orgName: 'HDFC ERGO Health Insurance', type: 'INSURANCE', patientId: 'HC-004512', branch: 'Cardiac Care',
    department: 'Cardiology', billingDate: '2026-05-01', dueDate: '2026-05-31',
    agingDays: 18, agingBucket: 'current', originalAmount: 580000, outstandingAmount: 580000,
    collectedAmount: 0, insuranceStatus: 'PREAUTH_DONE', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'LOW', riskScore: 12, predictedRecovery: 96, assignedCollector: 'Priya Sharma',
    lastFollowUp: '2026-05-14', nextFollowUp: '2026-05-25', sourceModule: 'IP Billing',
    notes: 'CATH procedure claim. Pre-auth done. Expected settlement within 30 days.',
    paymentHistory: [],
  },
  {
    id: 'REC-010', invoiceNo: 'INV-2026-00875', patientName: 'Arjun Pillai',
    orgName: null, type: 'PATIENT', patientId: 'HC-004302', branch: 'Specialty Center',
    department: 'Neurology', billingDate: '2026-04-18', dueDate: '2026-05-03',
    agingDays: 16, agingBucket: 'current', originalAmount: 78000, outstandingAmount: 78000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PROMISED',
    riskLevel: 'LOW', riskScore: 24, predictedRecovery: 91, assignedCollector: 'Ananya Iyer',
    lastFollowUp: '2026-05-13', nextFollowUp: '2026-05-21', sourceModule: 'OP Billing',
    notes: 'Patient committed payment via NEFT by 22nd May. Confirmation email received.',
    paymentHistory: [],
  },
  {
    id: 'REC-011', invoiceNo: 'INV-2026-00812', patientName: null,
    orgName: 'Bajaj Allianz General Insurance', type: 'INSURANCE', patientId: 'HC-004050', branch: 'Main Campus',
    department: 'OT', billingDate: '2026-03-20', dueDate: '2026-04-19',
    agingDays: 30, agingBucket: 'current', originalAmount: 420000, outstandingAmount: 420000,
    collectedAmount: 0, insuranceStatus: 'PROCESSING', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'LOW', riskScore: 28, predictedRecovery: 93, assignedCollector: 'Deepa Rao',
    lastFollowUp: '2026-05-16', nextFollowUp: '2026-05-23', sourceModule: 'OT Billing',
    notes: 'TPA processing on schedule. Expected approval this week.',
    paymentHistory: [],
  },
  {
    id: 'REC-012', invoiceNo: 'INV-2026-00756', patientName: 'Preethi Subramaniam',
    orgName: null, type: 'PATIENT', patientId: 'HC-003960', branch: 'Main Campus',
    department: 'Oncology', billingDate: '2026-02-14', dueDate: '2026-03-01',
    agingDays: 79, agingBucket: 'd61', originalAmount: 195000, outstandingAmount: 140000,
    collectedAmount: 55000, insuranceStatus: null, collectionStatus: 'PARTIAL',
    riskLevel: 'HIGH', riskScore: 68, predictedRecovery: 58, assignedCollector: 'Priya Sharma',
    lastFollowUp: '2026-05-17', nextFollowUp: '2026-05-24', sourceModule: 'IP Billing',
    notes: 'Chemotherapy bill. Patient on financial hardship plan — ₹15K/month installments agreed.',
    paymentHistory: [
      { date: '2026-04-01', amount: 15000, note: 'Installment 1' },
      { date: '2026-05-02', amount: 15000, note: 'Installment 2' },
      { date: '2026-05-15', amount: 25000, note: 'Extra payment — insurance part-settled' },
    ],
  },
  {
    id: 'REC-013', invoiceNo: 'INV-2026-00921', patientName: null,
    orgName: 'Tata Consultancy Services', type: 'CORPORATE', patientId: null, branch: 'Specialty Center',
    department: 'Laboratory', billingDate: '2026-05-10', dueDate: '2026-06-09',
    agingDays: 9, agingBucket: 'current', originalAmount: 84000, outstandingAmount: 84000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 8, predictedRecovery: 98, assignedCollector: 'Kiran Pillai',
    lastFollowUp: '2026-05-10', nextFollowUp: '2026-05-28', sourceModule: 'Laboratory',
    notes: 'Monthly lab bill. TCS has 100% collection history — 30-day PO cycle.',
    paymentHistory: [],
  },
  {
    id: 'REC-014', invoiceNo: 'INV-2026-00648', patientName: null,
    orgName: 'Oriental Insurance', type: 'INSURANCE', patientId: 'HC-003420', branch: 'Main Campus',
    department: 'OT', billingDate: '2026-01-06', dueDate: '2026-02-05',
    agingDays: 104, agingBucket: 'd91', originalAmount: 380000, outstandingAmount: 380000,
    collectedAmount: 0, insuranceStatus: 'RESUBMITTED', collectionStatus: 'ESCALATED',
    riskLevel: 'CRITICAL', riskScore: 89, predictedRecovery: 42, assignedCollector: 'Rahul Mehta',
    lastFollowUp: '2026-05-09', nextFollowUp: '2026-05-19', sourceModule: 'OT Billing',
    notes: 'Initially denied — missing surgeon certificate. Resubmitted with docs on May 8. Escalated to TPA nodal officer.',
    paymentHistory: [],
  },
  {
    id: 'REC-015', invoiceNo: 'INV-2026-00899', patientName: 'Anand Krishnamurthy',
    orgName: null, type: 'PATIENT', patientId: 'HC-004463', branch: 'Cardiac Care',
    department: 'Cardiology', billingDate: '2026-05-02', dueDate: '2026-05-17',
    agingDays: 2, agingBucket: 'current', originalAmount: 256000, outstandingAmount: 256000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 14, predictedRecovery: 97, assignedCollector: 'Priya Sharma',
    lastFollowUp: '2026-05-17', nextFollowUp: '2026-05-22', sourceModule: 'IP Billing',
    notes: 'Stent procedure — 3-year credit history excellent. EMI request under review.',
    paymentHistory: [],
  },
  {
    id: 'REC-016', invoiceNo: 'INV-2026-00730', patientName: null,
    orgName: 'CGHS — Central Govt Scheme', type: 'GOVERNMENT', patientId: null, branch: 'North Wing',
    department: 'ICU', billingDate: '2026-02-04', dueDate: '2026-03-06',
    agingDays: 74, agingBucket: 'd61', originalAmount: 920000, outstandingAmount: 920000,
    collectedAmount: 0, insuranceStatus: 'SUBMITTED', collectionStatus: 'PENDING',
    riskLevel: 'HIGH', riskScore: 71, predictedRecovery: 48, assignedCollidence: 'Suresh Nair',
    lastFollowUp: '2026-05-12', nextFollowUp: '2026-05-22', sourceModule: 'ICU Billing',
    notes: 'CGHS processing typically 90+ days. 4 cases bundled. Hospital nodal officer following up.',
    paymentHistory: [],
  },
  {
    id: 'REC-017', invoiceNo: 'INV-2026-00868', patientName: 'Srinivas Reddy',
    orgName: null, type: 'PATIENT', patientId: 'HC-004245', branch: 'East Block',
    department: 'Nephrology', billingDate: '2026-04-22', dueDate: '2026-05-07',
    agingDays: 12, agingBucket: 'current', originalAmount: 42000, outstandingAmount: 42000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 22, predictedRecovery: 93, assignedCollector: 'Ananya Iyer',
    lastFollowUp: '2026-05-16', nextFollowUp: '2026-05-23', sourceModule: 'OP Billing',
    notes: 'Dialysis patient — monthly billing cycle. Regular payer.',
    paymentHistory: [],
  },
  {
    id: 'REC-018', invoiceNo: 'INV-2026-00781', patientName: null,
    orgName: 'ICICI Lombard Health Insurance', type: 'INSURANCE', patientId: 'HC-004010', branch: 'Specialty Center',
    department: 'Neurology', billingDate: '2026-03-08', dueDate: '2026-04-07',
    agingDays: 42, agingBucket: 'd31', originalAmount: 162000, outstandingAmount: 162000,
    collectedAmount: 0, insuranceStatus: 'APPROVED', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'LOW', riskScore: 20, predictedRecovery: 97, assignedCollector: 'Deepa Rao',
    lastFollowUp: '2026-05-15', nextFollowUp: '2026-05-21', sourceModule: 'IP Billing',
    notes: 'Claim approved May 10. Payment in transit — 5–7 banking days.',
    paymentHistory: [],
  },
  {
    id: 'REC-019', invoiceNo: 'INV-2026-00541', patientName: null,
    orgName: 'CGHS Bundled ICU Claim', type: 'GOVERNMENT', patientId: null, branch: 'Main Campus',
    department: 'ICU', billingDate: '2025-12-28', dueDate: '2026-01-27',
    agingDays: 113, agingBucket: 'd91', originalAmount: 1680000, outstandingAmount: 1680000,
    collectedAmount: 0, insuranceStatus: 'SUBMITTED', collectionStatus: 'ESCALATED',
    riskLevel: 'CRITICAL', riskScore: 91, predictedRecovery: 38, assignedCollector: 'Suresh Nair',
    lastFollowUp: '2026-05-08', nextFollowUp: '2026-05-19', sourceModule: 'ICU Billing',
    notes: 'Bundled 12-case CGHS claim. Escalated to Additional Director CGHS. Pending final approval.',
    paymentHistory: [],
  },
  {
    id: 'REC-020', invoiceNo: 'INV-2026-00854', patientName: 'Lakshmi Devi',
    orgName: null, type: 'PATIENT', patientId: 'HC-004180', branch: 'South Clinic',
    department: 'Radiology', billingDate: '2026-04-28', dueDate: '2026-05-13',
    agingDays: 6, agingBucket: 'current', originalAmount: 18500, outstandingAmount: 18500,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 10, predictedRecovery: 98, assignedCollector: 'Kiran Pillai',
    lastFollowUp: '2026-05-17', nextFollowUp: '2026-05-22', sourceModule: 'Radiology',
    notes: 'MRI invoice. First reminder sent. Patient confirmed receipt.',
    paymentHistory: [],
  },
  {
    id: 'REC-021', invoiceNo: 'INV-2026-00695', patientName: null,
    orgName: 'New India Assurance — Batch Claim', type: 'INSURANCE', patientId: null, branch: 'North Wing',
    department: 'Multiple', billingDate: '2026-01-21', dueDate: '2026-02-20',
    agingDays: 89, agingBucket: 'd61', originalAmount: 1840000, outstandingAmount: 1840000,
    collectedAmount: 0, insuranceStatus: 'PROCESSING', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'HIGH', riskScore: 78, predictedRecovery: 55, assignedCollector: 'Rahul Mehta',
    lastFollowUp: '2026-05-11', nextFollowUp: '2026-05-20', sourceModule: 'IP Billing',
    notes: 'Batch of 8 claims. NIA processing delayed — pending internal audit clearance. SLA breach risk on May 22.',
    paymentHistory: [],
  },
  {
    id: 'REC-022', invoiceNo: 'INV-2026-00838', patientName: 'Vikram Chaudhary',
    orgName: null, type: 'PATIENT', patientId: 'HC-004128', branch: 'Main Campus',
    department: 'Orthopedics', billingDate: '2026-04-10', dueDate: '2026-04-25',
    agingDays: 24, agingBucket: 'current', originalAmount: 115000, outstandingAmount: 57500,
    collectedAmount: 57500, insuranceStatus: null, collectionStatus: 'PARTIAL',
    riskLevel: 'LOW', riskScore: 29, predictedRecovery: 90, assignedCollector: 'Ananya Iyer',
    lastFollowUp: '2026-05-14', nextFollowUp: '2026-05-25', sourceModule: 'IP Billing',
    notes: 'Knee replacement. 50% paid upfront. Balance on discharge + 30 days agreed.',
    paymentHistory: [{ date: '2026-04-10', amount: 57500, note: 'Pre-surgical deposit' }],
  },
  {
    id: 'REC-023', invoiceNo: 'INV-2026-00671', patientName: null,
    orgName: 'Medi Assist TPA', type: 'INSURANCE', patientId: 'HC-003520', branch: 'Specialty Center',
    department: 'Cardiology', billingDate: '2025-12-15', dueDate: '2026-01-14',
    agingDays: 126, agingBucket: 'd121', originalAmount: 490000, outstandingAmount: 490000,
    collectedAmount: 0, insuranceStatus: 'DENIED', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'CRITICAL', riskScore: 86, predictedRecovery: 34, assignedCollector: 'Priya Sharma',
    lastFollowUp: '2026-05-07', nextFollowUp: '2026-05-21', sourceModule: 'IP Billing',
    notes: 'Denied — citing pre-existing condition clause. Legal review ongoing. Challenging denial.',
    paymentHistory: [],
  },
  {
    id: 'REC-024', invoiceNo: 'INV-2026-00916', patientName: 'Deepika Menon',
    orgName: null, type: 'PATIENT', patientId: 'HC-004498', branch: 'Cardiac Care',
    department: 'Gynecology', billingDate: '2026-05-08', dueDate: '2026-05-23',
    agingDays: 11, agingBucket: 'current', originalAmount: 68000, outstandingAmount: 68000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 16, predictedRecovery: 96, assignedCollector: 'Kiran Pillai',
    lastFollowUp: '2026-05-17', nextFollowUp: '2026-05-23', sourceModule: 'IP Billing',
    notes: 'Maternity bill. Patient has active insurance, claim in process.',
    paymentHistory: [],
  },
  {
    id: 'REC-025', invoiceNo: 'INV-2026-00720', patientName: null,
    orgName: 'Wipro Ltd Corporate Health', type: 'CORPORATE', patientId: null, branch: 'East Block',
    department: 'Pharmacy', billingDate: '2026-02-10', dueDate: '2026-03-12',
    agingDays: 68, agingBucket: 'd61', originalAmount: 156000, outstandingAmount: 52000,
    collectedAmount: 104000, insuranceStatus: null, collectionStatus: 'PARTIAL',
    riskLevel: 'LOW', riskScore: 26, predictedRecovery: 92, assignedCollector: 'Deepa Rao',
    lastFollowUp: '2026-05-15', nextFollowUp: '2026-05-25', sourceModule: 'Pharmacy',
    notes: 'Quarterly pharmacy settlement. Two invoices settled — third in dispute over pricing.',
    paymentHistory: [
      { date: '2026-03-15', amount: 52000, note: 'Invoice PHAR-Jan settled' },
      { date: '2026-04-12', amount: 52000, note: 'Invoice PHAR-Feb settled' },
    ],
  },
  {
    id: 'REC-026', invoiceNo: 'INV-2026-00604', patientName: null,
    orgName: 'Infosys Employee Health — Balance', type: 'CORPORATE', patientId: null, branch: 'Specialty Center',
    department: 'General Surgery', billingDate: '2025-12-20', dueDate: '2026-01-19',
    agingDays: 121, agingBucket: 'd121', originalAmount: 540000, outstandingAmount: 270000,
    collectedAmount: 270000, insuranceStatus: null, collectionStatus: 'IN_PROGRESS',
    riskLevel: 'MEDIUM', riskScore: 48, predictedRecovery: 72, assignedCollector: 'Ananya Iyer',
    lastFollowUp: '2026-05-12', nextFollowUp: '2026-05-26', sourceModule: 'Corporate Billing',
    notes: 'Second installment overdue since Jan 19. Finance team dispute on additional OT charges.',
    paymentHistory: [{ date: '2025-12-25', amount: 270000, note: 'First installment per PO terms' }],
  },
  {
    id: 'REC-027', invoiceNo: 'INV-2026-00580', patientName: null,
    orgName: 'Oriental Insurance — Legacy Claim', type: 'INSURANCE', patientId: 'HC-003201', branch: 'South Clinic',
    department: 'Psychiatry', billingDate: '2025-11-30', dueDate: '2025-12-30',
    agingDays: 141, agingBucket: 'd121', originalAmount: 84000, outstandingAmount: 84000,
    collectedAmount: 0, insuranceStatus: 'RESUBMITTED', collectionStatus: 'ESCALATED',
    riskLevel: 'CRITICAL', riskScore: 92, predictedRecovery: 22, assignedCollector: 'Rahul Mehta',
    lastFollowUp: '2026-05-05', nextFollowUp: '2026-05-20', sourceModule: 'OP Billing',
    notes: 'Third resubmission. TPA citing outdated DSM codes. Psychiatry team updating documentation.',
    paymentHistory: [],
  },
  {
    id: 'REC-028', invoiceNo: 'INV-2026-00910', patientName: 'Ramesh Babu',
    orgName: null, type: 'PATIENT', patientId: 'HC-004481', branch: 'Main Campus',
    department: 'Emergency', billingDate: '2026-05-06', dueDate: '2026-05-21',
    agingDays: 13, agingBucket: 'current', originalAmount: 28000, outstandingAmount: 28000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 19, predictedRecovery: 94, assignedCollector: 'Kiran Pillai',
    lastFollowUp: '2026-05-17', nextFollowUp: '2026-05-21', sourceModule: 'Emergency',
    notes: 'Emergency appendectomy. Patient discharged. Bill sent via SMS + email.',
    paymentHistory: [],
  },
];

// ── Derived Summary Stats ─────────────────────────────────────────────────────
export const AGING_BUCKET_SUMMARY = AGING_BUCKETS_CONFIG.map(b => {
  const rows = MOCK_AGING_ROWS.filter(r => r.agingBucket === b.key);
  const amount = rows.reduce((s, r) => s + r.outstandingAmount, 0);
  const total = MOCK_AGING_ROWS.reduce((s, r) => s + r.outstandingAmount, 0);
  return { ...b, count: rows.length, amount, pct: total ? Math.round((amount / total) * 1000) / 10 : 0 };
});
