export const VOUCHER_TYPES = {
  JV: { label: 'Journal', short: 'JV', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  PV: { label: 'Payment', short: 'PV', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  RV: { label: 'Receipt', short: 'RV', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  CV: { label: 'Contra', short: 'CV', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  DN: { label: 'Debit Note', short: 'DN', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  CN: { label: 'Credit Note', short: 'CN', cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
};

export const POSTING_STATUS = {
  draft:    { label: 'Draft',    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  posted:   { label: 'Posted',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  failed:   { label: 'Failed',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  reversed: { label: 'Reversed', cls: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500' },
};

export const APPROVAL_STATUS = {
  not_required: { label: 'N/A',       cls: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500' },
  pending:      { label: 'Pending',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  approved:     { label: 'Approved',  cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  rejected:     { label: 'Rejected',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  escalated:    { label: 'Escalated', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
};

export const RECON_STATUS = {
  unreconciled: { label: 'Unreconciled', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  reconciled:   { label: 'Reconciled',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  partial:      { label: 'Partial',      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  exception:    { label: 'Exception',    cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  na:           { label: 'N/A',          cls: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500' },
};

export const BRANCHES = ['All Branches', 'Main Hospital', 'North Wing', 'South Clinic', 'Emergency Centre', 'Maternity Block', 'Oncology Unit'];
export const DEPARTMENTS = ['All Departments', 'ICU', 'OT', 'Pharmacy', 'Radiology', 'Cardiology', 'Orthopedics', 'Pathology', 'Admin', 'Finance', 'Oncology'];
export const SOURCE_MODULES = ['All Sources', 'Manual', 'Patient Billing', 'Insurance/TPA', 'Pharmacy', 'Payroll', 'Fixed Assets', 'Cash & Bank', 'ICU', 'OT', 'Doctor Payout'];

export const QUICK_FILTERS = [
  { id: 'all', label: 'All Journals' },
  { id: 'draft', label: 'Draft' },
  { id: 'pending_approval', label: 'Awaiting Approval' },
  { id: 'posted', label: 'Posted' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'unbalanced', label: 'Unbalanced' },
  { id: 'recon_exception', label: 'Recon Exceptions' },
];

export const SAVED_VIEWS = [
  { id: 'all', label: 'All Journals', icon: 'LayoutList' },
  { id: 'pending_approval', label: 'Pending Approval', icon: 'Clock' },
  { id: 'draft', label: 'Draft Vouchers', icon: 'FilePen' },
  { id: 'today', label: 'Posted Today', icon: 'CalendarCheck' },
  { id: 'exceptions', label: 'Exceptions', icon: 'AlertTriangle' },
];

export const KPI_CONFIG = [
  { id: 'total',           label: 'Total Journals',     icon: 'FileText',     colorCls: 'text-nile-600',    bgCls: 'bg-nile-50 dark:bg-nile-900/20',       filterKey: null,             critical: false },
  { id: 'draft',           label: 'Draft',              icon: 'FilePen',      colorCls: 'text-slate-500',   bgCls: 'bg-slate-50 dark:bg-slate-800/50',     filterKey: 'draft',          critical: false },
  { id: 'posted',          label: 'Posted',             icon: 'CheckCircle2', colorCls: 'text-emerald-600', bgCls: 'bg-emerald-50 dark:bg-emerald-900/20', filterKey: 'posted',         critical: false },
  { id: 'pendingApprovals',label: 'Pending Approval',   icon: 'Clock',        colorCls: 'text-amber-600',   bgCls: 'bg-amber-50 dark:bg-amber-900/20',     filterKey: 'pending_approval',critical: false },
  { id: 'rejected',        label: 'Rejected',           icon: 'XCircle',      colorCls: 'text-red-500',     bgCls: 'bg-red-50 dark:bg-red-900/20',         filterKey: 'rejected',       critical: false },
  { id: 'unbalanced',      label: 'Unbalanced',         icon: 'AlertTriangle',colorCls: 'text-orange-600',  bgCls: 'bg-orange-50 dark:bg-orange-900/20',   filterKey: 'unbalanced',     critical: true  },
  { id: 'reconExceptions', label: 'Recon Exceptions',   icon: 'RefreshCw',    colorCls: 'text-amber-600',   bgCls: 'bg-amber-50 dark:bg-amber-900/20',     filterKey: 'recon_exception',critical: false },
  { id: 'suspicious',      label: 'Suspicious',         icon: 'ShieldAlert',  colorCls: 'text-red-600',     bgCls: 'bg-red-50 dark:bg-red-900/20',         filterKey: 'suspicious',     critical: true  },
];

export const formatINR = (amount) => {
  if (amount == null || amount === 0) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const formatRelative = (d) => {
  if (!d) return '—';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatDate(d);
};

const mk = (id, voucherNumber, date, type, narration, branch, dept, debit, credit, pStatus, aStatus, rStatus, source, user, riskScore) => ({
  id, voucherNumber, date, postingDate: date, type, narration, branch, department: dept,
  costCenter: `CC-${dept.slice(0,3).toUpperCase()}-001`, debit, credit, currency: 'INR',
  postingStatus: pStatus, approvalStatus: aStatus, reconStatus: rStatus, source,
  createdBy: user, createdAt: `${date}T09:30:00Z`, modifiedAt: `${date}T11:00:00Z`,
  riskScore, isBalanced: Math.abs(debit - credit) < 0.01,
  lineItems: [
    { account: `${narration.split(' ')[0]} Expense`, accountCode: `5${id.slice(-3)}.DR`, debit, credit: 0, costCenter: `CC-${dept.slice(0,3).toUpperCase()}-001` },
    { account: `${narration.split(' ')[0]} Payable`, accountCode: `2${id.slice(-3)}.CR`, debit: 0, credit, costCenter: `CC-${dept.slice(0,3).toUpperCase()}-001` },
  ],
  approvalTimeline: pStatus === 'posted'
    ? [
        { step: 'Created', user, timestamp: `${date}T09:30:00Z`, status: 'done' },
        { step: 'L1 Review', user: 'CA Ramesh Kumar', timestamp: `${date}T10:00:00Z`, status: 'done' },
        { step: 'Posted', user: 'System', timestamp: `${date}T11:00:00Z`, status: 'done' },
      ]
    : [
        { step: 'Created', user, timestamp: `${date}T09:30:00Z`, status: 'done' },
        { step: 'L1 Review', user: 'CA Ramesh Kumar', timestamp: `${date}T10:00:00Z`, status: aStatus === 'pending' ? 'pending' : 'done' },
        { step: 'Post', user: 'System', timestamp: '', status: 'waiting' },
      ],
  attachments: [],
});

export const MOCK_JOURNALS = [
  mk('jv-001','JV-2025-05001','2025-05-15','JV','ICU consumables accrual — May 2025','Main Hospital','ICU',285000,285000,'posted','approved','reconciled','ICU','Priya Nair','low'),
  mk('jv-002','JV-2025-05002','2025-05-15','PV','Vendor payment — surgical supplies (MedTech India)','Main Hospital','OT',172500,172500,'posted','approved','reconciled','Vendor','Arjun Sharma','low'),
  mk('jv-003','JV-2025-05003','2025-05-14','JV','TPA adjustment — Star Health claim settlement','North Wing','Finance',94000,94000,'posted','approved','reconciled','Insurance/TPA','Kavitha Reddy','low'),
  mk('jv-004','JV-2025-05004','2025-05-14','RV','Patient advance receipt — OP Billing','South Clinic','Finance',35000,35000,'posted','approved','na','Patient Billing','Suresh Babu','low'),
  mk('jv-005','JV-2025-05005','2025-05-13','JV','Pharmacy revenue recognition — retail counter','Main Hospital','Pharmacy',621400,621400,'posted','approved','reconciled','Pharmacy','Meena Krishnan','low'),
  mk('jv-006','JV-2025-05006','2025-05-13','JV','OT consumables expense — General Surgery','Main Hospital','OT',48750,48750,'pending','pending','unreconciled','OT','Dr. Sanjay Menon','medium'),
  mk('jv-007','JV-2025-05007','2025-05-12','JV','Monthly payroll journal — Nursing Staff','Main Hospital','Admin',1284000,1284000,'posted','approved','reconciled','Payroll','HR System','low'),
  mk('jv-008','JV-2025-05008','2025-05-12','JV','Biomedical equipment depreciation — MRI unit','Main Hospital','Radiology',42167,42167,'posted','approved','reconciled','Fixed Assets','System','low'),
  mk('jv-009','JV-2025-05009','2025-05-11','DN','Vendor debit note — returned reagents (SRL Labs)','Main Hospital','Pathology',18500,18500,'posted','approved','reconciled','Vendor','Rajiv Menon','low'),
  mk('jv-010','JV-2025-05010','2025-05-11','JV','Insurance receivable — CGHS settlement','Emergency Centre','Finance',387000,387000,'pending','pending','unreconciled','Insurance/TPA','Kavitha Reddy','medium'),
  mk('jv-011','JV-2025-05011','2025-05-10','JV','Doctor payout — Cardiology revenue share','Main Hospital','Cardiology',245000,245000,'posted','approved','reconciled','Doctor Payout','CA Ramesh Kumar','low'),
  mk('jv-012','JV-2025-05012','2025-05-10','JV','ICU ventilator rental accrual','Main Hospital','ICU',67500,67500,'draft','not_required','na','Manual','Priya Nair','low'),
  mk('jv-013','JV-2025-05013','2025-05-09','CN','Credit note — billing reversal Package PT-2024-8841','Main Hospital','Finance',28000,28000,'posted','approved','reconciled','Patient Billing','Admin User','low'),
  mk('jv-014','JV-2025-05014','2025-05-09','JV','Radiology revenue — CT & MRI collections','North Wing','Radiology',198600,198600,'posted','approved','reconciled','Patient Billing','System','low'),
  mk('jv-015','JV-2025-05015','2025-05-08','JV','Oncology chemotherapy drug expense','Oncology Unit','Oncology',892000,892000,'pending','pending','unreconciled','Pharmacy','Dr. Aruna Desai','high'),
  mk('jv-016','JV-2025-05016','2025-05-08','JV','Inter-branch fund transfer — North Wing','North Wing','Finance',500000,500000,'posted','approved','reconciled','Cash & Bank','CA Ramesh Kumar','low'),
  mk('jv-017','JV-2025-05017','2025-05-07','JV','TPA writeoff — Mediclaim rejected claims','Main Hospital','Finance',14200,14200,'posted','rejected','na','Insurance/TPA','Kavitha Reddy','medium'),
  mk('jv-018','JV-2025-05018','2025-05-07','PV','Utility payment — electricity board','Main Hospital','Admin',38400,38400,'posted','approved','reconciled','Cash & Bank','Arjun Sharma','low'),
  mk('jv-019','JV-2025-05019','2025-05-06','JV','Provisional tax provision — Q4 advance','Main Hospital','Finance',360000,360000,'draft','not_required','na','Manual','CA Ramesh Kumar','medium'),
  mk('jv-020','JV-2025-05020','2025-05-06','JV','Lab reagent inventory adjustment (variance)','Main Hospital','Pathology',3750,3900,'draft','not_required','exception','Manual','Meena Krishnan','high'),
  mk('jv-021','JV-2025-05021','2025-05-05','JV','Maternity package billing recognition','Maternity Block','Finance',145000,145000,'posted','approved','reconciled','Patient Billing','System','low'),
  mk('jv-022','JV-2025-05022','2025-05-05','JV','Fixed asset addition — new anaesthesia machine','Main Hospital','OT',2850000,2850000,'posted','approved','reconciled','Fixed Assets','Dr. Sanjay Menon','low'),
  mk('jv-023','JV-2025-05023','2025-05-04','JV','Emergency consumables — trauma cases','Emergency Centre','ICU',41200,41200,'posted','approved','partial','ICU','Dr. Vinod Nair','low'),
  mk('jv-024','JV-2025-05024','2025-05-04','JV','Insurance TPA accrual — New India Assurance','Main Hospital','Finance',678000,678000,'pending','escalated','unreconciled','Insurance/TPA','Kavitha Reddy','high'),
  mk('jv-025','JV-2025-05025','2025-05-03','RV','Cash receipt — miscellaneous hospital services','South Clinic','Finance',12800,12800,'posted','approved','reconciled','Cash & Bank','Suresh Babu','low'),
];

export const MOCK_KPIS = { total: 12847, draft: 234, posted: 11489, pendingApprovals: 156, rejected: 78, unbalanced: 3, reconExceptions: 42, suspicious: 7 };

export const AI_INSIGHTS = [
  { id: 1, type: 'anomaly', severity: 'high', title: 'Unbalanced journal detected', body: 'JV-2025-05020 has a ₹150 variance between debit (₹3,750) and credit (₹3,900). Immediate review required.', action: 'Review', voucherId: 'jv-020' },
  { id: 2, type: 'duplicate', severity: 'medium', title: 'Possible duplicate posting', body: '3 ICU accrual entries between May 13–15 have identical narration and amounts. Verify intentional.', action: 'Compare', voucherId: null },
  { id: 3, type: 'delay', severity: 'medium', title: 'Approval SLA breach', body: 'JV-2025-05024 has been pending L2 escalation for 41 hours. CFO approval queue may be backlogged.', action: 'Escalate', voucherId: 'jv-024' },
  { id: 4, type: 'risk', severity: 'high', title: 'High-value manual journal', body: 'JV-2025-05022 (₹28.5L fixed asset addition) was created manually without PO reference. Flag for audit.', action: 'Flag', voucherId: 'jv-022' },
  { id: 5, type: 'recon', severity: 'low', title: 'Reconciliation suggestion', body: '12 posted journals from Pharmacy module are ready for automatic bank reconciliation matching.', action: 'Reconcile', voucherId: null },
];

export const AI_QUICK_PROMPTS = [
  'Show unapproved ICU adjustments',
  'Find pharmacy journals above ₹5 lakh',
  'Detect duplicate postings this month',
  'Show high-risk manual journals',
  'Find rejected TPA entries',
  'Show unbalanced journals',
];
