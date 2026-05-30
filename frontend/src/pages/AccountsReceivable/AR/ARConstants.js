// ─── AR Constants & Mock Data ────────────────────────────────────────────────

export const RISK_LEVELS = {
  LOW:      { label: 'Low',      score: [0, 30],   color: '#10b981', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30', badgeText: 'text-emerald-700 dark:text-emerald-400' },
  MEDIUM:   { label: 'Medium',   score: [31, 60],  color: '#f59e0b', badgeBg: 'bg-amber-100 dark:bg-amber-900/30',   badgeText: 'text-amber-700 dark:text-amber-400'   },
  HIGH:     { label: 'High',     score: [61, 80],  color: '#f97316', badgeBg: 'bg-orange-100 dark:bg-orange-900/30', badgeText: 'text-orange-700 dark:text-orange-400' },
  CRITICAL: { label: 'Critical', score: [81, 100], color: '#ef4444', badgeBg: 'bg-red-100 dark:bg-red-900/30',       badgeText: 'text-red-700 dark:text-red-400'       },
};

export const RECEIVABLE_TYPES = {
  PATIENT:   { label: 'Patient',        color: '#3b82f6', lightBg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-400'   },
  INSURANCE: { label: 'Insurance/TPA',  color: '#8b5cf6', lightBg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400' },
  CORPORATE: { label: 'Corporate',      color: '#06b6d4', lightBg: 'bg-cyan-50 dark:bg-cyan-900/20',    text: 'text-cyan-700 dark:text-cyan-400'    },
  GOVERNMENT:{ label: 'Government',     color: '#10b981', lightBg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
};

export const COLLECTION_STATUSES = {
  PENDING:     { label: 'Pending',           bg: 'bg-slate-100 dark:bg-slate-800',    text: 'text-slate-600 dark:text-slate-300' },
  IN_PROGRESS: { label: 'In Progress',       bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400'  },
  PROMISED:    { label: 'Payment Promised',  bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400'},
  PARTIAL:     { label: 'Partial',           bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  ESCALATED:   { label: 'Escalated',         bg: 'bg-rose-100 dark:bg-rose-900/30',   text: 'text-rose-700 dark:text-rose-400'  },
  LEGAL:       { label: 'Legal Action',      bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-400'    },
  COLLECTED:   { label: 'Collected',         bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  WRITTEN_OFF: { label: 'Written Off',       bg: 'bg-gray-100 dark:bg-gray-800',      text: 'text-gray-500 dark:text-gray-400'  },
};

export const INSURANCE_STATUSES = {
  PREAUTH_PENDING: { label: 'PreAuth Pending', color: '#f59e0b' },
  PREAUTH_DONE:    { label: 'PreAuth Done',    color: '#06b6d4' },
  SUBMITTED:       { label: 'Submitted',       color: '#3b82f6' },
  PROCESSING:      { label: 'Processing',      color: '#8b5cf6' },
  APPROVED:        { label: 'Approved',        color: '#10b981' },
  PARTIAL_SETTLED: { label: 'Partial Settled', color: '#f97316' },
  SETTLED:         { label: 'Settled',         color: '#10b981' },
  DENIED:          { label: 'Denied',          color: '#ef4444' },
  RESUBMITTED:     { label: 'Resubmitted',     color: '#06b6d4' },
};

export const AGING_BUCKETS = [
  { key: 'current',  label: '0–30 days',  color: '#10b981', darkColor: '#34d399' },
  { key: 'days31',   label: '31–60 days', color: '#f59e0b', darkColor: '#fbbf24' },
  { key: 'days61',   label: '61–90 days', color: '#f97316', darkColor: '#fb923c' },
  { key: 'days91',   label: '90+ days',   color: '#ef4444', darkColor: '#f87171' },
];

export const DEPARTMENTS = ['Cardiology','ICU','OT','General Surgery','Neurology','Oncology','Orthopedics','Pediatrics','Radiology','Pharmacy','Laboratory','Emergency','Nephrology','Psychiatry'];
export const BRANCHES    = ['Main Campus','North Wing','South Clinic','East Block','Specialty Center','Cardiac Care'];
export const COLLECTORS  = ['Priya Sharma','Rahul Mehta','Ananya Iyer','Suresh Nair','Deepa Rao','Kiran Pillai'];
export const SOURCE_MODULES = ['IP Billing','OP Billing','ICU Billing','OT Billing','Pharmacy','Laboratory','Radiology','Corporate Billing','Emergency'];

// ─── Mock Receivables Data ───────────────────────────────────────────────────
export const MOCK_RECEIVABLES = [
  {
    id: 'REC-001', invoiceNo: 'INV-2026-00847', patientName: 'Rajesh Kumar Sharma',
    orgName: null, type: 'PATIENT', patientId: 'HC-004231', branch: 'Main Campus',
    department: 'Cardiology', billingDate: '2026-04-02', dueDate: '2026-04-17',
    agingDays: 32, invoiceAmount: 148500, outstandingAmount: 148500,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'IN_PROGRESS',
    riskLevel: 'HIGH', riskScore: 72, assignedCollector: 'Priya Sharma',
    lastFollowUp: '2026-05-14', sourceModule: 'IP Billing',
    notes: 'Patient promised payment by 20th May',
  },
  {
    id: 'REC-002', invoiceNo: 'INV-2026-00831', patientName: null,
    orgName: 'Star Health Insurance', type: 'INSURANCE', patientId: 'HC-004100', branch: 'North Wing',
    department: 'ICU', billingDate: '2026-03-15', dueDate: '2026-04-14',
    agingDays: 65, invoiceAmount: 320000, outstandingAmount: 320000,
    collectedAmount: 0, insuranceStatus: 'SUBMITTED', collectionStatus: 'PENDING',
    riskLevel: 'HIGH', riskScore: 74, assignedCollector: 'Rahul Mehta',
    lastFollowUp: '2026-05-10', sourceModule: 'ICU Billing',
    notes: 'Claim submitted, awaiting TPA response',
  },
  {
    id: 'REC-003', invoiceNo: 'INV-2026-00792', patientName: null,
    orgName: 'Infosys Employee Health Program', type: 'CORPORATE', patientId: null, branch: 'Specialty Center',
    department: 'General Surgery', billingDate: '2026-03-01', dueDate: '2026-03-31',
    agingDays: 49, invoiceAmount: 540000, outstandingAmount: 270000,
    collectedAmount: 270000, insuranceStatus: null, collectionStatus: 'PARTIAL',
    riskLevel: 'MEDIUM', riskScore: 45, assignedCollector: 'Ananya Iyer',
    lastFollowUp: '2026-05-12', sourceModule: 'Corporate Billing',
    notes: '50% received, balance in next 30-day cycle',
  },
  {
    id: 'REC-004', invoiceNo: 'INV-2026-00760', patientName: 'Sunita Verma',
    orgName: null, type: 'PATIENT', patientId: 'HC-003987', branch: 'South Clinic',
    department: 'Orthopedics', billingDate: '2026-02-18', dueDate: '2026-03-05',
    agingDays: 75, invoiceAmount: 95000, outstandingAmount: 95000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'ESCALATED',
    riskLevel: 'CRITICAL', riskScore: 88, assignedCollector: 'Suresh Nair',
    lastFollowUp: '2026-05-08', sourceModule: 'IP Billing',
    notes: 'No response from patient for 2 weeks',
  },
  {
    id: 'REC-005', invoiceNo: 'INV-2026-00745', patientName: null,
    orgName: 'United India Insurance', type: 'INSURANCE', patientId: 'HC-003720', branch: 'East Block',
    department: 'Oncology', billingDate: '2026-02-10', dueDate: '2026-03-12',
    agingDays: 68, invoiceAmount: 280000, outstandingAmount: 196000,
    collectedAmount: 84000, insuranceStatus: 'PARTIAL_SETTLED', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'MEDIUM', riskScore: 55, assignedCollector: 'Deepa Rao',
    lastFollowUp: '2026-05-15', sourceModule: 'IP Billing',
    notes: '70% settled, dispute on deductions for Day 3 ICU charges',
  },
  {
    id: 'REC-006', invoiceNo: 'INV-2026-00701', patientName: 'Mohammed Irfan',
    orgName: null, type: 'PATIENT', patientId: 'HC-003601', branch: 'Main Campus',
    department: 'Emergency', billingDate: '2026-01-28', dueDate: '2026-02-12',
    agingDays: 97, invoiceAmount: 62000, outstandingAmount: 62000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'LEGAL',
    riskLevel: 'CRITICAL', riskScore: 94, assignedCollector: 'Suresh Nair',
    lastFollowUp: '2026-04-30', sourceModule: 'IP Billing',
    notes: 'Sent to legal. Last known address verified.',
  },
  {
    id: 'REC-007', invoiceNo: 'INV-2026-00888', patientName: 'Kavitha Nair',
    orgName: null, type: 'PATIENT', patientId: 'HC-004400', branch: 'North Wing',
    department: 'Pediatrics', billingDate: '2026-04-20', dueDate: '2026-05-05',
    agingDays: 14, invoiceAmount: 34500, outstandingAmount: 34500,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 18, assignedCollector: 'Kiran Pillai',
    lastFollowUp: '2026-05-17', sourceModule: 'OP Billing',
    notes: 'Within due date. First reminder sent.',
  },
  {
    id: 'REC-008', invoiceNo: 'INV-2026-00866', patientName: null,
    orgName: 'APSRTC Employee Health Scheme', type: 'GOVERNMENT', patientId: null, branch: 'Main Campus',
    department: 'Cardiology', billingDate: '2026-04-08', dueDate: '2026-05-08',
    agingDays: 11, invoiceAmount: 218000, outstandingAmount: 218000,
    collectedAmount: 0, insuranceStatus: 'PROCESSING', collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 22, assignedCollector: 'Rahul Mehta',
    lastFollowUp: '2026-05-16', sourceModule: 'IP Billing',
    notes: 'Government scheme. Within SLA timeline.',
  },
  {
    id: 'REC-009', invoiceNo: 'INV-2026-00841', patientName: 'Arjun Reddy',
    orgName: null, type: 'PATIENT', patientId: 'HC-004195', branch: 'Cardiac Care',
    department: 'OT', billingDate: '2026-04-05', dueDate: '2026-04-20',
    agingDays: 29, invoiceAmount: 175000, outstandingAmount: 87500,
    collectedAmount: 87500, insuranceStatus: null, collectionStatus: 'PARTIAL',
    riskLevel: 'LOW', riskScore: 30, assignedCollector: 'Priya Sharma',
    lastFollowUp: '2026-05-13', sourceModule: 'OT Billing',
    notes: '50% collected on discharge. Balance due 25th May.',
  },
  {
    id: 'REC-010', invoiceNo: 'INV-2026-00813', patientName: null,
    orgName: 'New India Assurance', type: 'INSURANCE', patientId: 'HC-004023', branch: 'East Block',
    department: 'Neurology', billingDate: '2026-03-22', dueDate: '2026-04-21',
    agingDays: 28, invoiceAmount: 410000, outstandingAmount: 410000,
    collectedAmount: 0, insuranceStatus: 'PREAUTH_DONE', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'MEDIUM', riskScore: 48, assignedCollector: 'Deepa Rao',
    lastFollowUp: '2026-05-15', sourceModule: 'IP Billing',
    notes: 'Claim file submitted, pre-auth approved. Awaiting processing.',
  },
  {
    id: 'REC-011', invoiceNo: 'INV-2026-00779', patientName: null,
    orgName: 'Tata Consultancy Services', type: 'CORPORATE', patientId: null, branch: 'Specialty Center',
    department: 'Radiology', billingDate: '2026-03-05', dueDate: '2026-04-04',
    agingDays: 45, invoiceAmount: 380000, outstandingAmount: 380000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PROMISED',
    riskLevel: 'MEDIUM', riskScore: 38, assignedCollector: 'Ananya Iyer',
    lastFollowUp: '2026-05-16', sourceModule: 'Corporate Billing',
    notes: 'Finance team confirmed EFT by 31st May.',
  },
  {
    id: 'REC-012', invoiceNo: 'INV-2026-00744', patientName: 'Lakshmi Devi',
    orgName: null, type: 'PATIENT', patientId: 'HC-003715', branch: 'South Clinic',
    department: 'Nephrology', billingDate: '2026-02-09', dueDate: '2026-02-24',
    agingDays: 84, invoiceAmount: 126500, outstandingAmount: 126500,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'ESCALATED',
    riskLevel: 'CRITICAL', riskScore: 85, assignedCollector: 'Kiran Pillai',
    lastFollowUp: '2026-05-05', sourceModule: 'IP Billing',
    notes: 'Patient unresponsive. Escalated to senior collector.',
  },
  {
    id: 'REC-013', invoiceNo: 'INV-2026-00920', patientName: 'Vikas Malhotra',
    orgName: null, type: 'PATIENT', patientId: 'HC-004512', branch: 'Main Campus',
    department: 'Laboratory', billingDate: '2026-05-01', dueDate: '2026-05-16',
    agingDays: 3, invoiceAmount: 12400, outstandingAmount: 12400,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 8, assignedCollector: 'Priya Sharma',
    lastFollowUp: '2026-05-18', sourceModule: 'OP Billing',
    notes: 'Recent OP visit. Payment link sent via SMS.',
  },
  {
    id: 'REC-014', invoiceNo: 'INV-2026-00719', patientName: null,
    orgName: 'Oriental Insurance', type: 'INSURANCE', patientId: 'HC-003662', branch: 'North Wing',
    department: 'Psychiatry', billingDate: '2026-02-01', dueDate: '2026-03-03',
    agingDays: 77, invoiceAmount: 88000, outstandingAmount: 88000,
    collectedAmount: 0, insuranceStatus: 'DENIED', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'HIGH', riskScore: 78, assignedCollector: 'Rahul Mehta',
    lastFollowUp: '2026-05-11', sourceModule: 'IP Billing',
    notes: 'Claim denied due to pre-existing condition. Resubmitting with additional docs.',
  },
  {
    id: 'REC-015', invoiceNo: 'INV-2026-00900', patientName: null,
    orgName: 'Wipro Technologies', type: 'CORPORATE', patientId: null, branch: 'Specialty Center',
    department: 'General Surgery', billingDate: '2026-04-25', dueDate: '2026-05-25',
    agingDays: 24, invoiceAmount: 620000, outstandingAmount: 620000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 12, assignedCollector: 'Ananya Iyer',
    lastFollowUp: '2026-05-17', sourceModule: 'Corporate Billing',
    notes: 'Monthly bill cycle. Expected on due date.',
  },
  {
    id: 'REC-016', invoiceNo: 'INV-2026-00687', patientName: 'Pradeep Joshi',
    orgName: null, type: 'PATIENT', patientId: 'HC-003540', branch: 'East Block',
    department: 'OT', billingDate: '2026-01-15', dueDate: '2026-01-30',
    agingDays: 109, invoiceAmount: 245000, outstandingAmount: 245000,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'LEGAL',
    riskLevel: 'CRITICAL', riskScore: 97, assignedCollector: 'Suresh Nair',
    lastFollowUp: '2026-04-20', sourceModule: 'OT Billing',
    notes: 'Legal notice issued. Case with legal team.',
  },
  {
    id: 'REC-017', invoiceNo: 'INV-2026-00862', patientName: null,
    orgName: 'ECHS – Ex-Servicemen Scheme', type: 'GOVERNMENT', patientId: null, branch: 'Main Campus',
    department: 'Orthopedics', billingDate: '2026-04-07', dueDate: '2026-05-07',
    agingDays: 12, invoiceAmount: 312000, outstandingAmount: 312000,
    collectedAmount: 0, insuranceStatus: 'PROCESSING', collectionStatus: 'PENDING',
    riskLevel: 'LOW', riskScore: 20, assignedCollector: 'Deepa Rao',
    lastFollowUp: '2026-05-15', sourceModule: 'IP Billing',
    notes: 'ECHS file submitted. Historically settled within 45 days.',
  },
  {
    id: 'REC-018', invoiceNo: 'INV-2026-00835', patientName: 'Meena Pillai',
    orgName: null, type: 'PATIENT', patientId: 'HC-004150', branch: 'Cardiac Care',
    department: 'Cardiology', billingDate: '2026-03-28', dueDate: '2026-04-12',
    agingDays: 37, invoiceAmount: 56700, outstandingAmount: 20000,
    collectedAmount: 36700, insuranceStatus: null, collectionStatus: 'PARTIAL',
    riskLevel: 'LOW', riskScore: 25, assignedCollector: 'Kiran Pillai',
    lastFollowUp: '2026-05-14', sourceModule: 'OP Billing',
    notes: 'Installment plan agreed. Final ₹20K due May 30.',
  },
  {
    id: 'REC-019', invoiceNo: 'INV-2026-00806', patientName: null,
    orgName: 'HDFC Ergo Health Insurance', type: 'INSURANCE', patientId: 'HC-004001', branch: 'North Wing',
    department: 'Oncology', billingDate: '2026-03-18', dueDate: '2026-04-17',
    agingDays: 32, invoiceAmount: 780000, outstandingAmount: 780000,
    collectedAmount: 0, insuranceStatus: 'APPROVED', collectionStatus: 'IN_PROGRESS',
    riskLevel: 'LOW', riskScore: 28, assignedCollector: 'Rahul Mehta',
    lastFollowUp: '2026-05-16', sourceModule: 'IP Billing',
    notes: 'Claim approved. Settlement expected in 5–7 working days.',
  },
  {
    id: 'REC-020', invoiceNo: 'INV-2026-00755', patientName: 'Geeta Bose',
    orgName: null, type: 'PATIENT', patientId: 'HC-003800', branch: 'South Clinic',
    department: 'Radiology', billingDate: '2026-02-22', dueDate: '2026-03-09',
    agingDays: 71, invoiceAmount: 28900, outstandingAmount: 28900,
    collectedAmount: 0, insuranceStatus: null, collectionStatus: 'IN_PROGRESS',
    riskLevel: 'HIGH', riskScore: 68, assignedCollector: 'Priya Sharma',
    lastFollowUp: '2026-05-13', sourceModule: 'OP Billing',
    notes: '3 follow-ups done. Phone unreachable today.',
  },
];

// ─── KPI Configurations ──────────────────────────────────────────────────────
export const AR_KPI_CONFIG = [
  { id: 'total',         label: 'Total Receivables',       value: 52840000, prefix: '₹', suffix: '', format: 'lakh', trend: +4.2, trendLabel: 'vs last month', color: '#3b82f6', icon: 'IndianRupee', aiFlag: false },
  { id: 'current',       label: 'Current (0–30 Days)',      value: 18420000, prefix: '₹', suffix: '', format: 'lakh', trend: -2.1, trendLabel: 'vs last month', color: '#10b981', icon: 'CheckCircle2', aiFlag: false },
  { id: 'overdue',       label: 'Overdue (31+ Days)',       value: 34420000, prefix: '₹', suffix: '', format: 'lakh', trend: +8.7, trendLabel: 'vs last month', color: '#ef4444', icon: 'AlertTriangle', aiFlag: true  },
  { id: 'insurance',     label: 'Insurance Outstanding',    value: 21180000, prefix: '₹', suffix: '', format: 'lakh', trend: +3.5, trendLabel: 'vs last month', color: '#8b5cf6', icon: 'Shield', aiFlag: false },
  { id: 'corporate',     label: 'Corporate Outstanding',    value: 12400000, prefix: '₹', suffix: '', format: 'lakh', trend: -1.8, trendLabel: 'vs last month', color: '#06b6d4', icon: 'Building2', aiFlag: false },
  { id: 'efficiency',    label: 'Collection Efficiency',    value: 73.4,     prefix: '',  suffix: '%', format: 'pct',  trend: -2.3, trendLabel: 'vs last month', color: '#f59e0b', icon: 'TrendingUp', aiFlag: true  },
  { id: 'avgDays',       label: 'Avg Collection Days',      value: 38,       prefix: '',  suffix: 'd', format: 'num',  trend: +3,   trendLabel: 'vs last month', color: '#f97316', icon: 'Clock', aiFlag: true  },
  { id: 'leakage',       label: 'Revenue Leakage Alerts',   value: 14,       prefix: '',  suffix: '',  format: 'num',  trend: +2,   trendLabel: 'new today',     color: '#ef4444', icon: 'AlertOctagon', aiFlag: true  },
  { id: 'badDebt',       label: 'Bad Debt Risk',            value: 7840000,  prefix: '₹', suffix: '',  format: 'lakh', trend: +12.1,trendLabel: 'vs last month', color: '#dc2626', icon: 'XCircle', aiFlag: true  },
  { id: 'recon',         label: 'Pending Reconciliations',  value: 47,       prefix: '',  suffix: '',  format: 'num',  trend: -5,   trendLabel: 'vs last week',  color: '#06b6d4', icon: 'GitMerge', aiFlag: false },
];

// ─── Aging Chart Data ────────────────────────────────────────────────────────
export const AGING_CHART_DATA = [
  { month: 'Nov',  current: 14200, d31: 8400,  d61: 4100, d91: 2800 },
  { month: 'Dec',  current: 16100, d31: 9200,  d61: 5200, d91: 3100 },
  { month: 'Jan',  current: 15400, d31: 10100, d61: 6800, d91: 3900 },
  { month: 'Feb',  current: 17200, d31: 11400, d61: 7200, d91: 4200 },
  { month: 'Mar',  current: 16800, d31: 12800, d61: 8100, d91: 5100 },
  { month: 'Apr',  current: 18400, d31: 13200, d61: 9400, d91: 6200 },
  { month: 'May',  current: 18420, d31: 14100, d61: 11800, d91: 8500 },
];

export const AGING_BUCKET_TOTALS = [
  { label: '0–30 days',  amount: 18420000, count: 124, color: '#10b981', pct: 34.8 },
  { label: '31–60 days', amount: 14100000, count: 87,  color: '#f59e0b', pct: 26.7 },
  { label: '61–90 days', amount: 11800000, count: 63,  color: '#f97316', pct: 22.3 },
  { label: '90+ days',   amount: 8520000,  count: 41,  color: '#ef4444', pct: 16.2 },
];

export const BRANCH_AGING_HEATMAP = [
  { branch: 'Main Campus',      d0: 4200, d31: 3100, d61: 2800, d91: 1900 },
  { branch: 'North Wing',       d0: 3800, d31: 2900, d61: 2100, d91: 1400 },
  { branch: 'South Clinic',     d0: 2900, d31: 1800, d61: 1600, d91: 2100 },
  { branch: 'East Block',       d0: 3200, d31: 2400, d61: 2600, d91: 1800 },
  { branch: 'Specialty Center', d0: 2800, d31: 2200, d61: 1900, d91: 1100 },
  { branch: 'Cardiac Care',     d0: 1520, d31: 1700, d61: 780,  d91: 220  },
];

// ─── Collection Workflow Data ────────────────────────────────────────────────
export const COLLECTOR_WORKLOADS = [
  { name: 'Priya Sharma',   assigned: 28, followUpsDue: 8,  slaBreaches: 1, collected: 4200000, avatar: 'PS', color: '#3b82f6' },
  { name: 'Rahul Mehta',    assigned: 32, followUpsDue: 11, slaBreaches: 3, collected: 3800000, avatar: 'RM', color: '#8b5cf6' },
  { name: 'Ananya Iyer',    assigned: 24, followUpsDue: 6,  slaBreaches: 0, collected: 5100000, avatar: 'AI', color: '#10b981' },
  { name: 'Suresh Nair',    assigned: 19, followUpsDue: 14, slaBreaches: 5, collected: 2100000, avatar: 'SN', color: '#ef4444' },
  { name: 'Deepa Rao',      assigned: 22, followUpsDue: 7,  slaBreaches: 2, collected: 3600000, avatar: 'DR', color: '#f59e0b' },
  { name: 'Kiran Pillai',   assigned: 26, followUpsDue: 9,  slaBreaches: 1, collected: 4800000, avatar: 'KP', color: '#06b6d4' },
];

// ─── AI Insights Data ────────────────────────────────────────────────────────
export const AI_INSIGHTS = [
  {
    id: 'ai-001', type: 'RISK_ALERT', severity: 'critical',
    title: '6 Receivables at Default Risk',
    detail: 'AI models predict 6 accounts (₹6.2L total) are likely to default within 15 days based on behavioral patterns.',
    action: 'View Accounts',
    icon: 'AlertOctagon',
  },
  {
    id: 'ai-002', type: 'CASH_FORECAST', severity: 'info',
    title: 'May Collections Forecast: ₹2.8Cr',
    detail: 'Based on promise-to-pay records, approved insurance claims, and historical patterns, ₹2.8Cr inflow expected this month.',
    action: 'View Forecast',
    icon: 'TrendingUp',
  },
  {
    id: 'ai-003', type: 'LEAKAGE', severity: 'warning',
    title: 'Potential Revenue Leakage Detected',
    detail: '14 invoices may be underbilled vs. procedure codes. Estimated impact: ₹4.7L.',
    action: 'Review Now',
    icon: 'AlertTriangle',
  },
  {
    id: 'ai-004', type: 'EFFICIENCY', severity: 'info',
    title: 'Collector Rebalancing Recommended',
    detail: 'Suresh Nair has 14 overdue follow-ups. Reassigning 5 to Ananya Iyer would improve SLA by 28%.',
    action: 'Rebalance',
    icon: 'Users',
  },
  {
    id: 'ai-005', type: 'INSURANCE', severity: 'warning',
    title: 'Denied Claim Recovery Opportunity',
    detail: 'Oriental Insurance denial for INV-2026-00719 is potentially reversible with diagnostic code correction.',
    action: 'Prepare Resubmission',
    icon: 'Shield',
  },
];

// ─── Revenue Leakage Alerts ──────────────────────────────────────────────────
export const LEAKAGE_ALERTS = [
  { id: 'LK-001', type: 'UNDERBILLING',      title: 'Underbilled ICU Procedure',       dept: 'ICU',          amount: 84000,  severity: 'HIGH',   status: 'open',     invoice: 'INV-2026-00831', desc: 'Ventilator day 3 not billed per package terms.' },
  { id: 'LK-002', type: 'MISSING_INVOICE',   title: 'Missing OT Consumables Invoice',  dept: 'OT',           amount: 23500,  severity: 'MEDIUM', status: 'open',     invoice: 'INV-2026-00900', desc: '3 consumable items not added to final bill.' },
  { id: 'LK-003', type: 'DELAYED_COLLECTION',title: 'Collection SLA Breach – 14 Cases', dept: 'Billing',     amount: 480000, severity: 'HIGH',   status: 'open',     invoice: null,             desc: '14 invoices past 90-day collection SLA.' },
  { id: 'LK-004', type: 'UNRECONCILED',      title: 'Unreconciled Bank Receipt',        dept: 'Finance',      amount: 62000,  severity: 'MEDIUM', status: 'open',     invoice: null,             desc: 'Bank credit ₹62K received on 12 May not matched to invoice.' },
  { id: 'LK-005', type: 'WRITE_OFF_ANOMALY', title: 'Unusual Write-Off Pattern',        dept: 'Pharmacy',     amount: 18400,  severity: 'LOW',    status: 'reviewing',invoice: null,             desc: 'Pharmacy write-offs 3× above monthly average. Needs audit.' },
  { id: 'LK-006', type: 'DUPLICATE_ADJUST',  title: 'Possible Duplicate Adjustment',    dept: 'Radiology',    amount: 14200,  severity: 'MEDIUM', status: 'resolved', invoice: 'INV-2026-00779', desc: 'Same adjustment applied twice on 5 May. Reversal pending.' },
];

// ─── AI Prompt Suggestions ───────────────────────────────────────────────────
export const AI_PROMPT_SUGGESTIONS = [
  'Which claims are likely to default this month?',
  'Show high-risk overdue accounts over ₹1 lakh',
  'Predict May collections by department',
  'Identify revenue leakage in ICU billing',
  'Which collectors have SLA breaches?',
  'Show denied insurance claims for resubmission',
  'Find unreconciled payments this week',
  'Corporate accounts with payment delays',
];

// ─── Collection Timeline ─────────────────────────────────────────────────────
export const COLLECTION_TREND = [
  { month: 'Oct', target: 22000, actual: 18400 },
  { month: 'Nov', target: 23000, actual: 20100 },
  { month: 'Dec', target: 25000, actual: 22800 },
  { month: 'Jan', target: 26000, actual: 24200 },
  { month: 'Feb', target: 27000, actual: 23100 },
  { month: 'Mar', target: 28000, actual: 25400 },
  { month: 'Apr', target: 29000, actual: 26800 },
  { month: 'May', target: 30000, actual: null  },
];

export const fmtINR = (val, format = 'lakh') => {
  if (format === 'lakh')  return `₹${(val / 100000).toFixed(2)}L`;
  if (format === 'crore') return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (format === 'pct')   return `${val}%`;
  if (format === 'num')   return String(val);
  return `₹${val.toLocaleString('en-IN')}`;
};

export const agingBadge = (days) => {
  if (days <= 0)  return { label: 'Current',    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  if (days <= 30) return { label: `${days}d`,   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  if (days <= 60) return { label: `${days}d`,   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'       };
  if (days <= 90) return { label: `${days}d`,   cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'   };
  return              { label: `${days}d ⚠`,  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'               };
};
