// ─── Revenue Sharing — Constants, Mock Data & Configuration ──────────────────
// Amber / Gold theme — enterprise healthcare revenue allocation intelligence

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

export const fmtPct  = (n) => n == null ? '—' : `${Number(n).toFixed(1)}%`;
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDt   = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

// ─── Revenue Models ───────────────────────────────────────────────────────────
export const REVENUE_MODELS = {
  CONSULTATION: 'Consultation',
  PROCEDURE:    'Procedure',
  OT:           'OT Revenue',
  ICU:          'ICU Incentive',
  VISITING:     'Visiting Consultant',
  TELEMEDICINE: 'Telemedicine',
  CORPORATE:    'Corporate Package',
  INSURANCE:    'Insurance-Linked',
  DEPARTMENT:   'Dept Profitability',
  PACKAGE:      'Package-Based',
};

// ─── Realization Basis ────────────────────────────────────────────────────────
export const REALIZATION_BASIS = {
  BILLED:            'On Billing',
  COLLECTED:         'On Collection',
  INSURANCE_SETTLED: 'On Insurance Settlement',
  PACKAGE_CONSUMED:  'On Package Consumption',
};

// ─── Workflow Status ──────────────────────────────────────────────────────────
export const RULE_STATUSES = {
  DRAFT:          { label: 'Draft',           bg: 'bg-slate-100 dark:bg-slate-800',         text: 'text-slate-600 dark:text-slate-300',    dot: '#94a3b8' },
  CALCULATED:     { label: 'Calculated',      bg: 'bg-sky-100 dark:bg-sky-900/30',           text: 'text-sky-700 dark:text-sky-400',        dot: '#0ea5e9' },
  UNDER_REVIEW:   { label: 'Under Review',    bg: 'bg-violet-100 dark:bg-violet-900/30',     text: 'text-violet-700 dark:text-violet-400',  dot: '#8b5cf6' },
  APPROVED:       { label: 'Approved',        bg: 'bg-emerald-100 dark:bg-emerald-900/30',   text: 'text-emerald-700 dark:text-emerald-400',dot: '#10b981' },
  PENDING_PAYOUT: { label: 'Pending Payout',  bg: 'bg-amber-100 dark:bg-amber-900/30',       text: 'text-amber-700 dark:text-amber-400',    dot: '#f59e0b' },
  PAID:           { label: 'Paid',            bg: 'bg-green-100 dark:bg-green-900/30',       text: 'text-green-700 dark:text-green-400',    dot: '#22c55e' },
  RECONCILED:     { label: 'Reconciled',      bg: 'bg-teal-100 dark:bg-teal-900/30',         text: 'text-teal-700 dark:text-teal-400',      dot: '#14b8a6' },
  ESCALATED:      { label: 'Escalated',       bg: 'bg-rose-100 dark:bg-rose-900/30',         text: 'text-rose-700 dark:text-rose-400',      dot: '#f43f5e' },
};

// ─── Risk Levels ──────────────────────────────────────────────────────────────
export const RISK_LEVELS = {
  LOW:      { label: 'Low',      color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  MEDIUM:   { label: 'Medium',   color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-400'    },
  HIGH:     { label: 'High',     color: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30',  text: 'text-orange-700 dark:text-orange-400'  },
  CRITICAL: { label: 'Critical', color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-400'        },
};

// ─── KPI Config ───────────────────────────────────────────────────────────────
export const RS_KPI_CONFIG = [
  { id: 'totalAllocated',      label: 'Total Allocated',       icon: 'CircleDollarSign', format: 'lakh',  value: 487.5,  trend: +8.3,  accent: 'amber'   },
  { id: 'realizedShare',       label: 'Realized Share',        icon: 'CheckCircle2',     format: 'lakh',  value: 312.0,  trend: +5.1,  accent: 'emerald' },
  { id: 'unrealizedExposure',  label: 'Unrealized Exposure',   icon: 'AlertCircle',      format: 'lakh',  value: 175.5,  trend: +2.4,  accent: 'rose',   negative: true },
  { id: 'doctorLiability',     label: 'Doctor Liability',      icon: 'Banknote',         format: 'lakh',  value: 68.4,   trend: +3.7,  accent: 'violet'  },
  { id: 'insuranceLinked',     label: 'Insurance-Linked',      icon: 'ShieldCheck',      format: 'lakh',  value: 146.25, trend: +11.2, accent: 'blue'    },
  { id: 'pendingApprovals',    label: 'Pending Approvals',     icon: 'Clock',            format: 'num',   value: 47,     trend: -18.0, accent: 'orange', negative: true },
  { id: 'treasuryExposure',    label: 'Treasury Exposure',     icon: 'Building2',        format: 'lakh',  value: 89.3,   trend: +6.5,  accent: 'sky'     },
  { id: 'deptProfitShare',     label: 'Dept Profit Share',     icon: 'PieChart',         format: 'lakh',  value: 97.5,   trend: +4.2,  accent: 'teal'    },
  { id: 'leakageAlerts',       label: 'Leakage Alerts',        icon: 'AlertOctagon',     format: 'num',   value: 12,     trend: -33.3, accent: 'red',    negative: true },
  { id: 'highRiskRules',       label: 'High-Risk Rules',       icon: 'ShieldAlert',      format: 'num',   value: 8,      trend: 0,     accent: 'yellow', negative: true },
];

// ─── Mock Allocation Rules ────────────────────────────────────────────────────
export const MOCK_RULES = [
  {
    id: 'RS-2026-001', doctor: 'Dr. Arjun Mehta',   doctorId: 'DOC-001',
    department: 'Cardiology',    specialty: 'Interventional Cardiology',
    revenueModel: 'Consultation + Procedure', procedureType: 'Cardiac Catheterization',
    sharePercent: 35, incentiveStructure: 'Tiered (>₹5L: 40%)',
    realizationBasis: REALIZATION_BASIS.COLLECTED, deductionLogic: 'TDS 10% + Overhead 5%',
    status: 'APPROVED', workflowStatus: 'PENDING_PAYOUT', riskLevel: 'LOW',
    insuranceLinked: true, packageLinked: false,
    totalBilled: 2850000, realized: 2280000, unrealized: 570000, pendingPayout: 798000,
    glPosted: true, reconciled: false, aiFlag: false,
    linkedInvoices: ['INV-2026-00341', 'INV-2026-00342'],
    linkedPatients: ['HC-000123', 'HC-000124'],
    lastUpdated: '2026-05-19T14:30:00Z',
  },
  {
    id: 'RS-2026-002', doctor: 'Dr. Priya Nair',    doctorId: 'DOC-002',
    department: 'Neurology',     specialty: 'Neuro-Interventional',
    revenueModel: 'OT Revenue',  procedureType: 'Brain Tumor Resection',
    sharePercent: 45, incentiveStructure: 'Fixed + Performance',
    realizationBasis: REALIZATION_BASIS.INSURANCE_SETTLED, deductionLogic: 'TDS 10% + Prof Tax',
    status: 'UNDER_REVIEW', workflowStatus: 'UNDER_REVIEW', riskLevel: 'MEDIUM',
    insuranceLinked: true, packageLinked: false,
    totalBilled: 4200000, realized: 1890000, unrealized: 2310000, pendingPayout: 850500,
    glPosted: true, reconciled: false,
    aiFlag: true, aiFlagReason: 'Insurance realization 45% below dept average',
    linkedInvoices: ['INV-2026-00298'], linkedPatients: ['HC-000098'],
    lastUpdated: '2026-05-18T11:15:00Z',
  },
  {
    id: 'RS-2026-003', doctor: 'Dr. Ramesh Kumar',  doctorId: 'DOC-003',
    department: 'Orthopedics',   specialty: 'Joint Replacement',
    revenueModel: 'Package-Based', procedureType: 'Total Knee Replacement',
    sharePercent: 30, incentiveStructure: 'Package-Linked Slab',
    realizationBasis: REALIZATION_BASIS.PACKAGE_CONSUMED, deductionLogic: 'TDS 10% + Overhead 8%',
    status: 'APPROVED', workflowStatus: 'PAID', riskLevel: 'LOW',
    insuranceLinked: false, packageLinked: true,
    totalBilled: 3600000, realized: 3600000, unrealized: 0, pendingPayout: 0,
    glPosted: true, reconciled: true, aiFlag: false,
    linkedInvoices: ['INV-2026-00285', 'INV-2026-00286'],
    linkedPatients: ['HC-000087', 'HC-000088'],
    lastUpdated: '2026-05-17T09:00:00Z',
  },
  {
    id: 'RS-2026-004', doctor: 'Dr. Fatima Sheikh', doctorId: 'DOC-004',
    department: 'ICU',           specialty: 'Critical Care',
    revenueModel: 'ICU Incentive', procedureType: 'ICU Intensivist Daily',
    sharePercent: 25, incentiveStructure: 'Daily Census-Based',
    realizationBasis: REALIZATION_BASIS.COLLECTED, deductionLogic: 'TDS 10%',
    status: 'DRAFT', workflowStatus: 'CALCULATED', riskLevel: 'HIGH',
    insuranceLinked: true, packageLinked: false,
    totalBilled: 1875000, realized: 937500, unrealized: 937500, pendingPayout: 234375,
    glPosted: false, reconciled: false,
    aiFlag: true, aiFlagReason: 'Billing pattern 3× standard ICU rate — overbilling risk',
    linkedInvoices: ['INV-2026-00355'], linkedPatients: ['HC-000131'],
    lastUpdated: '2026-05-20T08:45:00Z',
  },
  {
    id: 'RS-2026-005', doctor: 'Dr. Samuel Okafor', doctorId: 'DOC-005',
    department: 'Oncology',      specialty: 'Medical Oncology',
    revenueModel: 'Insurance-Linked', procedureType: 'Chemotherapy Protocol',
    sharePercent: 20, incentiveStructure: 'Protocol-Based',
    realizationBasis: REALIZATION_BASIS.INSURANCE_SETTLED, deductionLogic: 'TDS 10% + Facility 3%',
    status: 'ESCALATED', workflowStatus: 'ESCALATED', riskLevel: 'CRITICAL',
    insuranceLinked: true, packageLinked: true,
    totalBilled: 6750000, realized: 2025000, unrealized: 4725000, pendingPayout: 405000,
    glPosted: true, reconciled: false,
    aiFlag: true, aiFlagReason: 'Insurance realization critically delayed >90 days',
    linkedInvoices: ['INV-2026-00267', 'INV-2026-00268'],
    linkedPatients: ['HC-000074'],
    lastUpdated: '2026-05-16T16:20:00Z',
  },
  {
    id: 'RS-2026-006', doctor: 'Dr. Meena Pillai',  doctorId: 'DOC-006',
    department: 'Radiology',     specialty: 'Interventional Radiology',
    revenueModel: 'Procedure',   procedureType: 'CT Angiography Reading',
    sharePercent: 40, incentiveStructure: 'Volume-Tiered',
    realizationBasis: REALIZATION_BASIS.BILLED, deductionLogic: 'TDS 10%',
    status: 'APPROVED', workflowStatus: 'RECONCILED', riskLevel: 'LOW',
    insuranceLinked: false, packageLinked: false,
    totalBilled: 980000, realized: 980000, unrealized: 0, pendingPayout: 0,
    glPosted: true, reconciled: true, aiFlag: false,
    linkedInvoices: ['INV-2026-00254'], linkedPatients: ['HC-000062'],
    lastUpdated: '2026-05-15T13:10:00Z',
  },
  {
    id: 'RS-2026-007', doctor: 'Dr. Vikram Bose',   doctorId: 'DOC-007',
    department: 'General Surgery', specialty: 'Laparoscopic Surgery',
    revenueModel: 'OT Revenue',  procedureType: 'Laparoscopic Cholecystectomy',
    sharePercent: 33, incentiveStructure: 'Corporate-Negotiated',
    realizationBasis: REALIZATION_BASIS.COLLECTED, deductionLogic: 'TDS 10% + Corp Disc 5%',
    status: 'APPROVED', workflowStatus: 'PENDING_PAYOUT', riskLevel: 'LOW',
    insuranceLinked: false, packageLinked: true,
    totalBilled: 2100000, realized: 1890000, unrealized: 210000, pendingPayout: 623700,
    glPosted: true, reconciled: false, aiFlag: false,
    linkedInvoices: ['INV-2026-00321'], linkedPatients: ['HC-000110'],
    lastUpdated: '2026-05-19T10:30:00Z',
  },
];

// ─── Revenue Trend Data ───────────────────────────────────────────────────────
export const MONTHLY_TREND = [
  { month: 'Dec', allocated: 38500000, realized: 24500000, unrealized: 9200000, liability: 5800000 },
  { month: 'Jan', allocated: 41200000, realized: 27800000, unrealized: 8400000, liability: 6100000 },
  { month: 'Feb', allocated: 39800000, realized: 25600000, unrealized: 10200000, liability: 5600000 },
  { month: 'Mar', allocated: 44600000, realized: 30100000, unrealized: 9800000, liability: 6800000 },
  { month: 'Apr', allocated: 46200000, realized: 31400000, unrealized: 10800000, liability: 7200000 },
  { month: 'May', allocated: 48750000, realized: 31200000, unrealized: 17550000, liability: 6840000 },
];

// ─── Dept Profitability ───────────────────────────────────────────────────────
export const DEPT_DATA = [
  { dept: 'Cardiology',    allocated: 12500000, realized: 10200000, share: 35, risk: 'LOW'      },
  { dept: 'Oncology',      allocated: 9800000,  realized: 3920000,  share: 20, risk: 'CRITICAL' },
  { dept: 'Orthopedics',   allocated: 8200000,  realized: 8200000,  share: 30, risk: 'LOW'      },
  { dept: 'Neurology',     allocated: 7600000,  realized: 3420000,  share: 45, risk: 'MEDIUM'   },
  { dept: 'ICU',           allocated: 5400000,  realized: 2700000,  share: 25, risk: 'HIGH'     },
  { dept: 'Radiology',     allocated: 3200000,  realized: 3200000,  share: 40, risk: 'LOW'      },
  { dept: 'Gen Surgery',   allocated: 2050000,  realized: 1845000,  share: 33, risk: 'LOW'      },
];

// ─── Treasury Forecast ────────────────────────────────────────────────────────
export const TREASURY_FORECAST = [
  { month: 'May-26', liability: 6840000, scheduled: 3200000, insurance: 2100000 },
  { month: 'Jun-26', liability: 7250000, scheduled: 3800000, insurance: 1900000 },
  { month: 'Jul-26', liability: 6500000, scheduled: 2900000, insurance: 2400000 },
  { month: 'Aug-26', liability: 8100000, scheduled: 4200000, insurance: 2200000 },
  { month: 'Sep-26', liability: 7400000, scheduled: 3500000, insurance: 2600000 },
  { month: 'Oct-26', liability: 6900000, scheduled: 3100000, insurance: 2800000 },
];

// ─── Upcoming Bank Transfers ──────────────────────────────────────────────────
export const UPCOMING_TRANSFERS = [
  { date: 'May 22', doctor: 'Dr. Ramesh Kumar',  amount: 972000,  bank: 'HDFC xxxx4521', status: 'Scheduled'       },
  { date: 'May 25', doctor: 'Dr. Arjun Mehta',   amount: 798000,  bank: 'ICICI xxxx8832', status: 'Pending Approval' },
  { date: 'May 28', doctor: 'Dr. Vikram Bose',   amount: 623700,  bank: 'SBI xxxx2244',   status: 'Pending Approval' },
  { date: 'Jun 05', doctor: 'Dr. Meena Pillai',  amount: 392000,  bank: 'Axis xxxx9912',  status: 'Forecasted'      },
];

// ─── Audit Events ─────────────────────────────────────────────────────────────
export const AUDIT_EVENTS = [
  { id: 1, type: 'create',    action: 'Rule Created',        actor: 'Admin Sharma',  ruleId: 'RS-2026-001', detail: 'Revenue sharing rule created for Dr. Arjun Mehta — Cardiology', ts: '2026-05-19T09:15:00Z' },
  { id: 2, type: 'calculate', action: 'Share Calculated',    actor: 'System',        ruleId: 'RS-2026-001', detail: 'Revenue share ₹7.98L calculated on ₹22.8L realized',            ts: '2026-05-19T09:16:00Z' },
  { id: 3, type: 'approve',   action: 'Approved',            actor: 'CFO Krishnan',  ruleId: 'RS-2026-001', detail: 'Allocation approved and forwarded to treasury',                  ts: '2026-05-19T14:30:00Z' },
  { id: 4, type: 'alert',     action: 'AI Anomaly Detected', actor: 'AI Engine',     ruleId: 'RS-2026-002', detail: 'Insurance realization 45% below dept average',                  ts: '2026-05-18T11:15:00Z' },
  { id: 5, type: 'escalate',  action: 'Escalated',           actor: 'Billing Mgr',  ruleId: 'RS-2026-005', detail: 'Insurance claim pending >90 days — escalation triggered',       ts: '2026-05-16T16:20:00Z' },
  { id: 6, type: 'gl',        action: 'GL Entry Posted',     actor: 'System',        ruleId: 'RS-2026-006', detail: 'Journal voucher JV-2026-0892 posted to General Ledger',         ts: '2026-05-15T13:10:00Z' },
  { id: 7, type: 'payment',   action: 'Bank Transfer',       actor: 'Treasury',      ruleId: 'RS-2026-003', detail: 'Payment ₹9.72L transferred — HDFC xxxx4521',                    ts: '2026-05-17T09:00:00Z' },
  { id: 8, type: 'reconcile', action: 'Reconciled',          actor: 'Accounts',      ruleId: 'RS-2026-006', detail: 'Reconciled with bank statement HDFC-2026-05-15-001',            ts: '2026-05-15T16:00:00Z' },
];

// ─── AI Insights ──────────────────────────────────────────────────────────────
export const AI_INSIGHTS = [
  { id: 1, type: 'anomaly',      severity: 'CRITICAL', title: 'ICU Overbilling Pattern',     body: 'RS-2026-004: ICU billing rate 3× standard for 15 consecutive days. Freeze payout pending audit.',                confidence: 87 },
  { id: 2, type: 'delay',        severity: 'HIGH',     title: 'Oncology Insurance Delay',     body: 'RS-2026-005: ₹47.25L insurance claim delayed >90 days. Engage TPA immediately.',                               confidence: 91 },
  { id: 3, type: 'risk',         severity: 'MEDIUM',   title: 'Neurology Realization Gap',    body: 'RS-2026-002: Realization 45% below benchmark. Insurance documentation may be incomplete.',                      confidence: 74 },
  { id: 4, type: 'optimization', severity: 'INFO',     title: 'Incentive Tier Optimization',  body: 'Adjusting Dr. Mehta\'s cardiology tier threshold from ₹5L → ₹3L increases incentive alignment by 12%.',        confidence: 82 },
  { id: 5, type: 'forecast',     severity: 'INFO',     title: 'Next Month Payout Forecast',   body: 'Projected payout liability: ₹1.23Cr. Pre-position ₹80L in operating account by May 25.',                       confidence: 88 },
];

// ─── Fraud Alerts ─────────────────────────────────────────────────────────────
export const FRAUD_ALERTS = [
  { id: 1, ruleId: 'RS-2026-004', severity: 'CRITICAL', type: 'Overbilling Pattern', doctor: 'Dr. Fatima Sheikh', dept: 'ICU',      exposure: 937500,  confidence: 87, description: 'ICU billing ₹18,750/day vs dept avg ₹6,250/day for 15 days', recommendation: 'Audit encounter notes, freeze payout pending review' },
  { id: 2, ruleId: 'RS-2026-002', severity: 'MEDIUM',   type: 'Duplicate Claim',     doctor: 'Dr. Priya Nair',   dept: 'Neurology', exposure: 2310000, confidence: 62, description: 'Insurance claim submitted to two TPAs for same encounter',   recommendation: 'Cross-reference TPA portal before releasing payout'   },
  { id: 3, ruleId: 'RS-2026-005', severity: 'HIGH',     type: 'Realization Anomaly', doctor: 'Dr. Samuel Okafor',dept: 'Oncology',  exposure: 4725000, confidence: 74, description: 'Insurance realization critically below threshold for >90 days',recommendation: 'Engage insurance desk, review pre-auth documentation'  },
];

// ─── Quick AI Prompts ─────────────────────────────────────────────────────────
export const QUICK_PROMPTS = [
  'Show abnormal revenue-sharing patterns',
  'Forecast next month payout liability',
  'Which insurance claims are delaying realization?',
  'Detect high-risk compensation rules',
  'Recommend profitability optimization',
  'Show treasury exposure summary',
];
