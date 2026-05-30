// ─── Vendor Invoices — Constants, Mock Data, Helpers ─────────────────────────

export const PAYMENT_STATUSES = {
  PENDING:   'pending',
  SCHEDULED: 'scheduled',
  PARTIAL:   'partial',
  PAID:      'paid',
  OVERDUE:   'overdue',
  ON_HOLD:   'on_hold',
};

export const APPROVAL_STATUSES = {
  DRAFT:        'draft',
  PENDING:      'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED:     'approved',
  REJECTED:     'rejected',
  ESCALATED:    'escalated',
};

export const MATCHING_STATUSES = {
  UNMATCHED:     'unmatched',
  PARTIAL_MATCH: 'partial_match',
  MATCHED:       'matched',
  EXCEPTION:     'exception',
  OVERRIDE:      'override',
};

export const RISK_LEVELS = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' };

// ─── Style Maps ───────────────────────────────────────────────────────────────
export const PAYMENT_STATUS_STYLES = {
  pending:   { bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-300',    dot: 'bg-amber-500',    label: 'Pending'   },
  scheduled: { bg: 'bg-blue-100 dark:bg-blue-900/30',      text: 'text-blue-700 dark:text-blue-300',      dot: 'bg-blue-500',     label: 'Scheduled' },
  partial:   { bg: 'bg-violet-100 dark:bg-violet-900/30',  text: 'text-violet-700 dark:text-violet-300',  dot: 'bg-violet-500',   label: 'Partial'   },
  paid:      { bg: 'bg-emerald-100 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-300',dot: 'bg-emerald-500',  label: 'Paid'      },
  overdue:   { bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-300',        dot: 'bg-red-500',      label: 'Overdue'   },
  on_hold:   { bg: 'bg-slate-100 dark:bg-slate-700/40',    text: 'text-slate-600 dark:text-slate-400',    dot: 'bg-slate-400',    label: 'On Hold'   },
};

export const APPROVAL_STATUS_STYLES = {
  draft:        { bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-500 dark:text-slate-400',    dot: 'bg-slate-400',    label: 'Draft'        },
  pending:      { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-300',    dot: 'bg-amber-500',    label: 'Pending'      },
  under_review: { bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-300',      dot: 'bg-blue-500',     label: 'Under Review' },
  approved:     { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300',dot: 'bg-emerald-500',  label: 'Approved'     },
  rejected:     { bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-300',        dot: 'bg-red-500',      label: 'Rejected'     },
  escalated:    { bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-700 dark:text-orange-300',  dot: 'bg-orange-500',   label: 'Escalated'    },
};

export const MATCHING_STATUS_STYLES = {
  unmatched:     { bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-300',        dot: 'bg-red-500',      label: 'Unmatched'     },
  partial_match: { bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-300',    dot: 'bg-amber-500',    label: 'Partial Match' },
  matched:       { bg: 'bg-emerald-100 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-300',dot: 'bg-emerald-500',  label: 'Matched'       },
  exception:     { bg: 'bg-rose-100 dark:bg-rose-900/30',      text: 'text-rose-700 dark:text-rose-300',      dot: 'bg-rose-500',     label: 'Exception'     },
  override:      { bg: 'bg-violet-100 dark:bg-violet-900/30',  text: 'text-violet-700 dark:text-violet-300',  dot: 'bg-violet-500',   label: 'Override'      },
};

export const RISK_STYLES = {
  low:      { color: '#10b981', barColor: 'bg-emerald-500', label: 'Low',      score: 15 },
  medium:   { color: '#f59e0b', barColor: 'bg-amber-500',   label: 'Medium',   score: 50 },
  high:     { color: '#ef4444', barColor: 'bg-red-500',     label: 'High',     score: 75 },
  critical: { color: '#dc2626', barColor: 'bg-red-600',     label: 'Critical', score: 95 },
};

// ─── KPI Configuration ────────────────────────────────────────────────────────
export const KPI_CONFIG = [
  { id: 'total_invoices',    label: 'Total Invoices',      value: 1847,  prefix: '',  suffix: '',       format: 'num',   trend: +12.4, trendLabel: 'vs last month',   color: '#7c3aed', icon: 'FileText',    aiFlag: false },
  { id: 'pending_approvals', label: 'Pending Approvals',   value: 143,   prefix: '',  suffix: '',       format: 'num',   trend: +8.2,  trendLabel: 'require action',  color: '#f59e0b', icon: 'Clock',       aiFlag: true  },
  { id: 'matched',           label: 'Matched Invoices',    value: 1412,  prefix: '',  suffix: '',       format: 'num',   trend: +5.1,  trendLabel: 'PO/GRN verified', color: '#10b981', icon: 'CheckCircle2',aiFlag: false },
  { id: 'unmatched',         label: 'Unmatched Invoices',  value: 287,   prefix: '',  suffix: '',       format: 'num',   trend: -3.4,  trendLabel: 'needs resolution', color: '#ef4444', icon: 'AlertCircle', aiFlag: true  },
  { id: 'total_value',       label: 'Invoice Value',       value: 4.73,  prefix: '₹', suffix: ' Cr',    format: 'crore', trend: +9.7,  trendLabel: 'vs last month',   color: '#7c3aed', icon: 'IndianRupee', aiFlag: false },
  { id: 'outstanding',       label: 'Outstanding Payable', value: 1.84,  prefix: '₹', suffix: ' Cr',    format: 'crore', trend: +14.3, trendLabel: 'cash exposure',   color: '#f97316', icon: 'TrendingUp',  aiFlag: true  },
  { id: 'duplicate_risk',    label: 'Duplicate Risk',      value: 23,    prefix: '',  suffix: '',       format: 'num',   trend: -2.1,  trendLabel: 'AI detected',     color: '#dc2626', icon: 'Copy',        aiFlag: true  },
  { id: 'tax_warnings',      label: 'Tax Issues',          value: 18,    prefix: '',  suffix: ' issues',format: 'num',   trend: +4.5,  trendLabel: 'GST mismatches',  color: '#d97706', icon: 'ShieldAlert', aiFlag: true  },
  { id: 'overdue',           label: 'Overdue Invoices',    value: 67,    prefix: '',  suffix: '',       format: 'num',   trend: +22.1, trendLabel: 'past due',        color: '#ef4444', icon: 'CalendarX2',  aiFlag: false },
  { id: 'fraud_alerts',      label: 'Fraud Alerts',        value: 9,     prefix: '',  suffix: '',       format: 'num',   trend: -1.2,  trendLabel: 'AI flagged',      color: '#dc2626', icon: 'ShieldX',     aiFlag: true  },
];

// ─── Mock Invoice Data ────────────────────────────────────────────────────────
export const MOCK_INVOICES = [
  {
    id: 'vi-001', invoiceNo: 'VINV-2026-00847',
    vendorName: 'MedPlus Healthcare Supplies', vendorCode: 'VND-0142', vendorCategory: 'Pharmacy',
    branch: 'Main Hospital', department: 'Pharmacy',
    invoiceDate: '2026-05-01', dueDate: '2026-05-31', agingDays: 18,
    poNumber: 'PO-2026-1023', grnNumber: 'GRN-2026-0891',
    invoiceAmount: 842500, taxAmount: 75825, outstandingAmount: 842500, paidAmount: 0,
    paymentStatus: 'pending', approvalStatus: 'pending', matchingStatus: 'matched',
    riskLevel: 'low', riskScore: 12, taxStatus: 'valid', ocrConfidence: 96,
    lastUpdated: '2026-05-10 14:32', assignedApprover: 'Dr. Priya Sharma',
    lineItems: [
      { desc: 'Paracetamol IP 500mg (1000s)',    qty: 500, rate: 485,  amount: 242500, taxPct: 5  },
      { desc: 'Amoxicillin 500mg Caps (500s)',   qty: 300, rate: 1200, amount: 360000, taxPct: 12 },
      { desc: 'Insulin Glargine 100IU/mL',       qty: 100, rate: 2400, amount: 240000, taxPct: 12 },
    ],
    notes: 'Routine pharmacy restock. All items match PO-2026-1023.',
  },
  {
    id: 'vi-002', invoiceNo: 'VINV-2026-00848',
    vendorName: 'Biomedical Innovations Ltd', vendorCode: 'VND-0089', vendorCategory: 'ICU Equipment',
    branch: 'North Wing', department: 'ICU',
    invoiceDate: '2026-04-28', dueDate: '2026-05-28', agingDays: 21,
    poNumber: 'PO-2026-0987', grnNumber: null,
    invoiceAmount: 2150000, taxAmount: 258000, outstandingAmount: 2150000, paidAmount: 0,
    paymentStatus: 'on_hold', approvalStatus: 'escalated', matchingStatus: 'unmatched',
    riskLevel: 'high', riskScore: 78, taxStatus: 'mismatch', ocrConfidence: 89,
    lastUpdated: '2026-05-09 09:15', assignedApprover: 'Mr. Suresh Kumar',
    lineItems: [
      { desc: 'ICU Ventilator — High Flow (Qty 2)',  qty: 2,  rate: 875000, amount: 1750000, taxPct: 12 },
      { desc: 'Pulse Oximeter Advanced (Qty 10)',    qty: 10, rate: 40000,  amount: 400000,  taxPct: 12 },
    ],
    notes: 'GRN pending. Equipment not yet received. Escalated to CMO for review.',
  },
  {
    id: 'vi-003', invoiceNo: 'VINV-2026-00849',
    vendorName: 'Steris Healthcare India', vendorCode: 'VND-0215', vendorCategory: 'OT Consumables',
    branch: 'Main Hospital', department: 'OT',
    invoiceDate: '2026-05-05', dueDate: '2026-06-04', agingDays: 14,
    poNumber: 'PO-2026-1041', grnNumber: 'GRN-2026-0901',
    invoiceAmount: 325000, taxAmount: 29250, outstandingAmount: 162500, paidAmount: 162500,
    paymentStatus: 'partial', approvalStatus: 'approved', matchingStatus: 'matched',
    riskLevel: 'low', riskScore: 8, taxStatus: 'valid', ocrConfidence: 98,
    lastUpdated: '2026-05-12 11:20', assignedApprover: 'Ms. Anita Patel',
    lineItems: [
      { desc: 'Surgical Drapes 50×50 (Pack of 100)', qty: 20,  rate: 8500, amount: 170000, taxPct: 5  },
      { desc: 'Sterile Gloves Size M (Box of 50)',   qty: 50,  rate: 2200, amount: 110000, taxPct: 12 },
      { desc: 'Cautery Pencil Disposable',           qty: 100, rate: 450,  amount: 45000,  taxPct: 12 },
    ],
    notes: 'First installment paid. Second due on GRN completion.',
  },
  {
    id: 'vi-004', invoiceNo: 'VINV-2026-00850',
    vendorName: 'Roche Diagnostics India', vendorCode: 'VND-0067', vendorCategory: 'Lab Supplies',
    branch: 'Medical College', department: 'Laboratory',
    invoiceDate: '2026-05-08', dueDate: '2026-06-07', agingDays: 11,
    poNumber: 'PO-2026-1052', grnNumber: 'GRN-2026-0912',
    invoiceAmount: 1250000, taxAmount: 150000, outstandingAmount: 1250000, paidAmount: 0,
    paymentStatus: 'pending', approvalStatus: 'approved', matchingStatus: 'matched',
    riskLevel: 'low', riskScore: 5, taxStatus: 'valid', ocrConfidence: 99,
    lastUpdated: '2026-05-14 16:45', assignedApprover: 'Dr. Anjali Mehta',
    lineItems: [
      { desc: 'Cobas c702 Reagents Bundle',     qty: 1,  rate: 850000, amount: 850000, taxPct: 12 },
      { desc: 'HbA1c Reagent Kit (100 tests)',  qty: 10, rate: 28500,  amount: 285000, taxPct: 12 },
      { desc: 'Calibrator Multi (6 vials)',     qty: 5,  rate: 23000,  amount: 115000, taxPct: 12 },
    ],
    notes: 'Priority vendor. Annual contract. Approval fast-tracked.',
  },
  {
    id: 'vi-005', invoiceNo: 'VINV-2026-00851',
    vendorName: 'GE Healthcare India Pvt Ltd', vendorCode: 'VND-0031', vendorCategory: 'Radiology',
    branch: 'South Campus', department: 'Radiology',
    invoiceDate: '2026-04-20', dueDate: '2026-05-20', agingDays: 29,
    poNumber: 'PO-2026-0934', grnNumber: 'GRN-2026-0856',
    invoiceAmount: 5800000, taxAmount: 696000, outstandingAmount: 5800000, paidAmount: 0,
    paymentStatus: 'overdue', approvalStatus: 'approved', matchingStatus: 'matched',
    riskLevel: 'medium', riskScore: 55, taxStatus: 'valid', ocrConfidence: 97,
    lastUpdated: '2026-05-15 08:30', assignedApprover: 'Mr. Vikram Singh',
    lineItems: [
      { desc: 'MRI Scanner Annual Maintenance', qty: 1, rate: 3800000, amount: 3800000, taxPct: 12 },
      { desc: 'CT Scanner Tube Replacement',    qty: 1, rate: 2000000, amount: 2000000, taxPct: 12 },
    ],
    notes: 'High-value overdue. Payment blocked pending board approval.',
  },
  {
    id: 'vi-006', invoiceNo: 'VINV-2026-00852',
    vendorName: 'Sunrise Medical Disposables', vendorCode: 'VND-0301', vendorCategory: 'OT Consumables',
    branch: 'Main Hospital', department: 'OT',
    invoiceDate: '2026-05-10', dueDate: '2026-06-09', agingDays: 9,
    poNumber: null, grnNumber: null,
    invoiceAmount: 127500, taxAmount: 15300, outstandingAmount: 127500, paidAmount: 0,
    paymentStatus: 'pending', approvalStatus: 'draft', matchingStatus: 'unmatched',
    riskLevel: 'critical', riskScore: 91, taxStatus: 'pending', ocrConfidence: 72,
    lastUpdated: '2026-05-15 10:10', assignedApprover: null,
    lineItems: [
      { desc: 'IV Cannula 18G (Box of 100)', qty: 50, rate: 1800, amount: 90000, taxPct: 12 },
      { desc: 'Infusion Set (Pack of 50)',   qty: 25, rate: 1500, amount: 37500, taxPct: 12 },
    ],
    notes: 'No PO reference. AI flagged as potential duplicate of VINV-2026-00831.',
  },
  {
    id: 'vi-007', invoiceNo: 'VINV-2026-00853',
    vendorName: 'Siemens Healthineers', vendorCode: 'VND-0028', vendorCategory: 'Biomedical',
    branch: 'Research Center', department: 'Radiology',
    invoiceDate: '2026-05-03', dueDate: '2026-06-02', agingDays: 16,
    poNumber: 'PO-2026-1018', grnNumber: 'GRN-2026-0884',
    invoiceAmount: 3200000, taxAmount: 384000, outstandingAmount: 3200000, paidAmount: 0,
    paymentStatus: 'scheduled', approvalStatus: 'approved', matchingStatus: 'matched',
    riskLevel: 'low', riskScore: 10, taxStatus: 'valid', ocrConfidence: 99,
    lastUpdated: '2026-05-13 15:00', assignedApprover: 'Dr. Rajeev Nair',
    lineItems: [
      { desc: 'MAGNETOM Altea 1.5T Service Contract', qty: 1, rate: 3200000, amount: 3200000, taxPct: 12 },
    ],
    notes: 'Scheduled NEFT on 2026-06-01. Approved by CMO.',
  },
  {
    id: 'vi-008', invoiceNo: 'VINV-2026-00854',
    vendorName: 'CleanPro Hospital Services', vendorCode: 'VND-0412', vendorCategory: 'Housekeeping',
    branch: 'Day Care Unit', department: 'Housekeeping',
    invoiceDate: '2026-05-01', dueDate: '2026-05-15', agingDays: 18,
    poNumber: 'PO-2026-0995', grnNumber: 'GRN-2026-0870',
    invoiceAmount: 185000, taxAmount: 22200, outstandingAmount: 185000, paidAmount: 0,
    paymentStatus: 'overdue', approvalStatus: 'approved', matchingStatus: 'matched',
    riskLevel: 'medium', riskScore: 45, taxStatus: 'valid', ocrConfidence: 94,
    lastUpdated: '2026-05-16 09:45', assignedApprover: 'Ms. Divya Krishnan',
    lineItems: [
      { desc: 'Monthly Housekeeping Contract — May 2026', qty: 1, rate: 185000, amount: 185000, taxPct: 12 },
    ],
    notes: 'Past due. RTGS payment initiated.',
  },
  {
    id: 'vi-009', invoiceNo: 'VINV-2026-00855',
    vendorName: 'Oracle Health Systems India', vendorCode: 'VND-0512', vendorCategory: 'IT & Software',
    branch: 'All Branches', department: 'IT',
    invoiceDate: '2026-05-01', dueDate: '2026-05-31', agingDays: 18,
    poNumber: 'PO-2026-0950', grnNumber: null,
    invoiceAmount: 980000, taxAmount: 176400, outstandingAmount: 980000, paidAmount: 0,
    paymentStatus: 'pending', approvalStatus: 'under_review', matchingStatus: 'partial_match',
    riskLevel: 'medium', riskScore: 40, taxStatus: 'valid', ocrConfidence: 95,
    lastUpdated: '2026-05-14 14:00', assignedApprover: 'Mr. Rohan Joshi',
    lineItems: [
      { desc: 'HIS Annual License Renewal 2026–27',  qty: 1, rate: 650000, amount: 650000, taxPct: 18 },
      { desc: 'Implementation Support Q1 2026',      qty: 1, rate: 330000, amount: 330000, taxPct: 18 },
    ],
    notes: 'GST invoice amount differs from PO by ₹12,000. Under review.',
  },
  {
    id: 'vi-010', invoiceNo: 'VINV-2026-00856',
    vendorName: 'Fortis Medical Gases', vendorCode: 'VND-0178', vendorCategory: 'ICU Equipment',
    branch: 'Main Hospital', department: 'ICU',
    invoiceDate: '2026-05-07', dueDate: '2026-06-06', agingDays: 12,
    poNumber: 'PO-2026-1038', grnNumber: 'GRN-2026-0897',
    invoiceAmount: 245000, taxAmount: 22050, outstandingAmount: 0, paidAmount: 245000,
    paymentStatus: 'paid', approvalStatus: 'approved', matchingStatus: 'matched',
    riskLevel: 'low', riskScore: 4, taxStatus: 'valid', ocrConfidence: 98,
    lastUpdated: '2026-05-15 13:00', assignedApprover: 'Dr. Priya Sharma',
    lineItems: [
      { desc: 'Medical Oxygen Cylinders (50 units)', qty: 50, rate: 3200, amount: 160000, taxPct: 5  },
      { desc: 'Nitrous Oxide (20 units)',            qty: 20, rate: 4250, amount: 85000,  taxPct: 12 },
    ],
    notes: 'Fully paid via NEFT. Transaction ref: NEFT202605150011.',
  },
  {
    id: 'vi-011', invoiceNo: 'VINV-2026-00857',
    vendorName: 'PharmEasy B2B', vendorCode: 'VND-0334', vendorCategory: 'Pharmacy',
    branch: 'North Wing', department: 'Pharmacy',
    invoiceDate: '2026-05-09', dueDate: '2026-06-08', agingDays: 10,
    poNumber: 'PO-2026-1048', grnNumber: 'GRN-2026-0908',
    invoiceAmount: 534000, taxAmount: 48060, outstandingAmount: 534000, paidAmount: 0,
    paymentStatus: 'pending', approvalStatus: 'pending', matchingStatus: 'matched',
    riskLevel: 'low', riskScore: 9, taxStatus: 'valid', ocrConfidence: 97,
    lastUpdated: '2026-05-15 16:20', assignedApprover: 'Ms. Anita Patel',
    lineItems: [
      { desc: 'Ondansetron 4mg Inj (100s)',     qty: 200, rate: 840,  amount: 168000, taxPct: 5  },
      { desc: 'Pantoprazole 40mg (1000s)',       qty: 100, rate: 1260, amount: 126000, taxPct: 5  },
      { desc: 'Ceftriaxone 1g Inj (50s)',        qty: 150, rate: 1600, amount: 240000, taxPct: 12 },
    ],
    notes: 'Standard order. AI-verified no duplicate.',
  },
  {
    id: 'vi-012', invoiceNo: 'VINV-2026-00858',
    vendorName: 'Sunrise Medical Disposables', vendorCode: 'VND-0301', vendorCategory: 'OT Consumables',
    branch: 'Main Hospital', department: 'OT',
    invoiceDate: '2026-04-15', dueDate: '2026-05-15', agingDays: 34,
    poNumber: 'PO-2026-0902', grnNumber: 'GRN-2026-0823',
    invoiceAmount: 127800, taxAmount: 15336, outstandingAmount: 127800, paidAmount: 0,
    paymentStatus: 'overdue', approvalStatus: 'approved', matchingStatus: 'exception',
    riskLevel: 'critical', riskScore: 92, taxStatus: 'mismatch', ocrConfidence: 88,
    lastUpdated: '2026-05-10 08:00', assignedApprover: 'Ms. Anita Patel',
    lineItems: [
      { desc: 'IV Cannula 18G (Box of 100)', qty: 50, rate: 1800, amount: 90000,  taxPct: 12 },
      { desc: 'IV Cannula 20G (Box of 100)', qty: 21, rate: 1800, amount: 37800,  taxPct: 12 },
    ],
    notes: 'AI: Near-duplicate of VINV-2026-00852 from same vendor. Price variance 0.23%.',
  },
  {
    id: 'vi-013', invoiceNo: 'VINV-2026-00859',
    vendorName: 'Abbott Healthcare India', vendorCode: 'VND-0055', vendorCategory: 'Lab Supplies',
    branch: 'Medical College', department: 'Cardiology',
    invoiceDate: '2026-05-12', dueDate: '2026-06-11', agingDays: 7,
    poNumber: 'PO-2026-1060', grnNumber: 'GRN-2026-0918',
    invoiceAmount: 678000, taxAmount: 81360, outstandingAmount: 678000, paidAmount: 0,
    paymentStatus: 'pending', approvalStatus: 'under_review', matchingStatus: 'matched',
    riskLevel: 'low', riskScore: 11, taxStatus: 'valid', ocrConfidence: 96,
    lastUpdated: '2026-05-16 11:30', assignedApprover: 'Dr. Anjali Mehta',
    lineItems: [
      { desc: 'Troponin I Assay Kit (100 tests)', qty: 20, rate: 18900, amount: 378000, taxPct: 12 },
      { desc: 'BNP Reagent Kit (50 tests)',       qty: 10, rate: 30000, amount: 300000, taxPct: 12 },
    ],
    notes: 'Cardiology annual contract. Under senior approval.',
  },
  {
    id: 'vi-014', invoiceNo: 'VINV-2026-00860',
    vendorName: 'Tata Power Healthcare Division', vendorCode: 'VND-0601', vendorCategory: 'Utilities',
    branch: 'All Branches', department: 'Administration',
    invoiceDate: '2026-05-01', dueDate: '2026-05-20', agingDays: 18,
    poNumber: 'PO-2026-0948', grnNumber: 'GRN-2026-0861',
    invoiceAmount: 890000, taxAmount: 160200, outstandingAmount: 890000, paidAmount: 0,
    paymentStatus: 'overdue', approvalStatus: 'approved', matchingStatus: 'matched',
    riskLevel: 'medium', riskScore: 48, taxStatus: 'valid', ocrConfidence: 99,
    lastUpdated: '2026-05-16 09:00', assignedApprover: 'Mr. Suresh Kumar',
    lineItems: [
      { desc: 'Electricity — Main Hospital May 2026', qty: 1, rate: 520000, amount: 520000, taxPct: 18 },
      { desc: 'Electricity — North Wing May 2026',   qty: 1, rate: 370000, amount: 370000, taxPct: 18 },
    ],
    notes: 'Overdue since 2026-05-20. RTGS scheduled.',
  },
  {
    id: 'vi-015', invoiceNo: 'VINV-2026-00861',
    vendorName: 'Carestream Health India', vendorCode: 'VND-0144', vendorCategory: 'Radiology',
    branch: 'South Campus', department: 'Radiology',
    invoiceDate: '2026-05-11', dueDate: '2026-06-10', agingDays: 8,
    poNumber: 'PO-2026-1055', grnNumber: 'GRN-2026-0915',
    invoiceAmount: 415000, taxAmount: 49800, outstandingAmount: 415000, paidAmount: 0,
    paymentStatus: 'pending', approvalStatus: 'pending', matchingStatus: 'matched',
    riskLevel: 'low', riskScore: 7, taxStatus: 'valid', ocrConfidence: 97,
    lastUpdated: '2026-05-17 10:15', assignedApprover: 'Mr. Vikram Singh',
    lineItems: [
      { desc: 'X-Ray Film 14×17 (Box of 100)', qty: 100, rate: 2800,  amount: 280000, taxPct: 12 },
      { desc: 'CR Cassette Repair Kit',         qty: 5,   rate: 27000, amount: 135000, taxPct: 12 },
    ],
    notes: 'Awaiting approver sign-off.',
  },
];

// ─── AI Insight Examples ──────────────────────────────────────────────────────
export const AI_INSIGHTS = [
  {
    id: 'ai-1', severity: 'critical',
    title: 'Duplicate Invoice Detected',
    body: 'VINV-2026-00852 and VINV-2026-00858 from Sunrise Medical Disposables share near-identical line items (price diff: 0.23%). Combined exposure: ₹2.55L.',
    action: 'Review Invoices',
    icon: 'Copy',
  },
  {
    id: 'ai-2', severity: 'critical',
    title: 'High-Risk Unmatched Invoice',
    body: 'VINV-2026-00852 has no PO or GRN reference. Vendor VND-0301 had a disputed invoice in March 2026.',
    action: 'Flag for Review',
    icon: 'ShieldX',
  },
  {
    id: 'ai-3', severity: 'warning',
    title: 'GST Mismatch Detected',
    body: 'VINV-2026-00855 (Oracle Health) shows ₹12,000 discrepancy vs PO. Input tax credit at risk.',
    action: 'Validate GST',
    icon: 'ShieldAlert',
  },
  {
    id: 'ai-4', severity: 'warning',
    title: 'Overdue Exposure: ₹68.6L',
    body: '5 invoices totalling ₹68.6L are past due. GE Healthcare (₹58L) requires board-level escalation.',
    action: 'Schedule Payments',
    icon: 'TrendingUp',
  },
  {
    id: 'ai-5', severity: 'info',
    title: '3 Invoices Ready for Fast-Track',
    body: 'Roche Diagnostics, PharmEasy B2B, and Carestream Health have full matches and approved status. Recommend batch payment.',
    action: 'Batch Approve',
    icon: 'Zap',
  },
];

// ─── Cash Flow Forecast Data ──────────────────────────────────────────────────
export const CASHFLOW_FORECAST = [
  { month: 'May W3', scheduled: 18.5, projected: 24.2 },
  { month: 'May W4', scheduled: 32.1, projected: 38.6 },
  { month: 'Jun W1', scheduled: 58.4, projected: 61.2 },
  { month: 'Jun W2', scheduled: 24.8, projected: 27.5 },
  { month: 'Jun W3', scheduled: 41.2, projected: 44.8 },
  { month: 'Jun W4', scheduled: 29.6, projected: 33.1 },
];

export const AGING_BUCKETS = [
  { label: '0–15 days',  value: 1.23, color: '#10b981', count: 68 },
  { label: '16–30 days', value: 0.84, color: '#f59e0b', count: 42 },
  { label: '31–45 days', value: 0.49, color: '#f97316', count: 19 },
  { label: '46–60 days', value: 0.22, color: '#ef4444', count: 8  },
  { label: '60+ days',   value: 0.06, color: '#dc2626', count: 3  },
];

// ─── Filter/Dropdown Options ──────────────────────────────────────────────────
export const BRANCH_OPTIONS = [
  { value: 'all', label: 'All Branches' },
  { value: 'Main Hospital', label: 'Main Hospital' },
  { value: 'North Wing',    label: 'North Wing' },
  { value: 'South Campus',  label: 'South Campus' },
  { value: 'Medical College',label: 'Medical College' },
  { value: 'Research Center',label: 'Research Center' },
  { value: 'Day Care Unit',  label: 'Day Care Unit' },
];

export const DEPT_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  { value: 'Pharmacy',       label: 'Pharmacy'       },
  { value: 'ICU',            label: 'ICU'            },
  { value: 'OT',             label: 'OT'             },
  { value: 'Laboratory',     label: 'Laboratory'     },
  { value: 'Radiology',      label: 'Radiology'      },
  { value: 'Cardiology',     label: 'Cardiology'     },
  { value: 'IT',             label: 'IT'             },
  { value: 'Housekeeping',   label: 'Housekeeping'   },
  { value: 'Administration', label: 'Administration' },
];

export const CATEGORY_OPTIONS = [
  { value: 'all',            label: 'All Categories'   },
  { value: 'Pharmacy',       label: 'Pharmacy'         },
  { value: 'ICU Equipment',  label: 'ICU Equipment'    },
  { value: 'OT Consumables', label: 'OT Consumables'   },
  { value: 'Lab Supplies',   label: 'Lab Supplies'     },
  { value: 'Radiology',      label: 'Radiology'        },
  { value: 'Biomedical',     label: 'Biomedical'       },
  { value: 'IT & Software',  label: 'IT & Software'    },
  { value: 'Housekeeping',   label: 'Housekeeping'     },
  { value: 'Utilities',      label: 'Utilities'        },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function fmtINR(amount) {
  if (amount === null || amount === undefined) return '—';
  if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (Math.abs(amount) >= 100000)   return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function applyFilters(data, filters) {
  return data.filter(inv => {
    const q = (filters.search || '').toLowerCase();
    if (q && ![inv.invoiceNo, inv.vendorName, inv.vendorCategory, inv.department,
               inv.poNumber || '', inv.grnNumber || '']
              .some(f => f.toLowerCase().includes(q))) return false;
    if (filters.branch    && filters.branch    !== 'all' && inv.branch         !== filters.branch    && inv.branch !== 'All Branches') return false;
    if (filters.department&& filters.department!== 'all' && inv.department     !== filters.department) return false;
    if (filters.category  && filters.category  !== 'all' && inv.vendorCategory !== filters.category)   return false;
    if (filters.paymentStatus  && filters.paymentStatus  !== 'all' && inv.paymentStatus  !== filters.paymentStatus)  return false;
    if (filters.approvalStatus && filters.approvalStatus !== 'all' && inv.approvalStatus !== filters.approvalStatus) return false;
    if (filters.matchingStatus && filters.matchingStatus !== 'all' && inv.matchingStatus !== filters.matchingStatus) return false;
    if (filters.riskLevel      && filters.riskLevel      !== 'all' && inv.riskLevel      !== filters.riskLevel)      return false;
    return true;
  });
}
