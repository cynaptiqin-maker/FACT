// ─── AP Constants & Mock Data ────────────────────────────────────────────────

export const RISK_LEVELS = {
  LOW:      { label: 'Low',      color: '#10b981', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30', badgeText: 'text-emerald-700 dark:text-emerald-400' },
  MEDIUM:   { label: 'Medium',   color: '#f59e0b', badgeBg: 'bg-amber-100 dark:bg-amber-900/30',    badgeText: 'text-amber-700 dark:text-amber-400'   },
  HIGH:     { label: 'High',     color: '#f97316', badgeBg: 'bg-orange-100 dark:bg-orange-900/30',  badgeText: 'text-orange-700 dark:text-orange-400' },
  CRITICAL: { label: 'Critical', color: '#ef4444', badgeBg: 'bg-red-100 dark:bg-red-900/30',        badgeText: 'text-red-700 dark:text-red-400'       },
};

export const VENDOR_CATEGORIES = {
  PHARMACY:    { label: 'Pharmacy',           color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20',   text: 'text-indigo-700 dark:text-indigo-400'   },
  OT_SUPPLIES: { label: 'OT Supplies',         color: '#0891b2', bg: 'bg-cyan-50 dark:bg-cyan-900/20',      text: 'text-cyan-700 dark:text-cyan-400'       },
  ICU_EQUIP:   { label: 'ICU Equipment',       color: '#dc2626', bg: 'bg-red-50 dark:bg-red-900/20',        text: 'text-red-700 dark:text-red-400'         },
  LAB:         { label: 'Lab Supplies',        color: '#7c3aed', bg: 'bg-violet-50 dark:bg-violet-900/20',  text: 'text-violet-700 dark:text-violet-400'   },
  RADIOLOGY:   { label: 'Radiology',           color: '#0284c7', bg: 'bg-sky-50 dark:bg-sky-900/20',        text: 'text-sky-700 dark:text-sky-400'         },
  BIOMEDICAL:  { label: 'Biomedical',          color: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-700 dark:text-emerald-400' },
  IT_SERVICES: { label: 'IT Services',         color: '#475569', bg: 'bg-slate-100 dark:bg-slate-800',      text: 'text-slate-600 dark:text-slate-400'     },
  CORPORATE:   { label: 'Corporate Services',  color: '#d97706', bg: 'bg-amber-50 dark:bg-amber-900/20',    text: 'text-amber-700 dark:text-amber-400'     },
};

export const PAYMENT_STATUSES = {
  PENDING:    { label: 'Pending',    bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-600 dark:text-slate-300'   },
  SCHEDULED:  { label: 'Scheduled',  bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-400'     },
  PARTIAL:    { label: 'Partial',    bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-400'   },
  PAID:       { label: 'Paid',       bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  OVERDUE:    { label: 'Overdue',    bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-400'       },
  ON_HOLD:    { label: 'On Hold',    bg: 'bg-orange-100 dark:bg-orange-900/30',text: 'text-orange-700 dark:text-orange-400' },
};

export const APPROVAL_STATUSES = {
  PENDING:    { label: 'Pending Approval',  dot: 'bg-slate-400',   text: 'text-slate-600 dark:text-slate-400'   },
  APPROVED:   { label: 'Approved',          dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  REJECTED:   { label: 'Rejected',          dot: 'bg-red-500',     text: 'text-red-700 dark:text-red-400'       },
  ESCALATED:  { label: 'Escalated',         dot: 'bg-orange-500',  text: 'text-orange-700 dark:text-orange-400' },
  REVIEW:     { label: 'Under Review',      dot: 'bg-violet-500',  text: 'text-violet-700 dark:text-violet-400' },
};

export const PROCUREMENT_STATUSES = {
  OPEN:      { label: 'Open',         color: '#64748b' },
  GRN_DONE:  { label: 'GRN Received', color: '#06b6d4' },
  MATCHED:   { label: '3-Way Matched',color: '#10b981' },
  EXCEPTION: { label: 'Mismatch',     color: '#ef4444' },
  NO_PO:     { label: 'No PO',        color: '#f97316' },
};

export const AGING_BUCKETS = [
  { key: 'current', label: '0–30 days',  color: '#10b981', darkColor: '#34d399' },
  { key: 'days31',  label: '31–60 days', color: '#f59e0b', darkColor: '#fbbf24' },
  { key: 'days61',  label: '61–90 days', color: '#f97316', darkColor: '#fb923c' },
  { key: 'days91',  label: '90+ days',   color: '#ef4444', darkColor: '#f87171' },
];

export const DEPARTMENTS  = ['Pharmacy','ICU','OT','General Surgery','Cardiology','Neurology','Oncology','Orthopedics','Radiology','Laboratory','Emergency','Nephrology','Biomedical','Administration','IT'];
export const BRANCHES     = ['Main Campus','North Wing','South Clinic','East Block','Specialty Center','Cardiac Care'];
export const APPROVERS    = ['Dr. Anita Rao','Rajiv Sharma','Nisha Mehta','Pradeep Nair','Sunita Pillai','Arvind Kumar'];
export const PROC_CATEGORIES = ['Pharmacy','OT Supplies','ICU Equipment','Lab Supplies','Radiology','Biomedical','IT Services','Corporate Services'];

// ─── Mock Payable Records ─────────────────────────────────────────────────────
export const MOCK_PAYABLES = [
  {
    id: 'PAY-001', invoiceNo: 'VIN-2026-00421', vendorName: 'PharmaCare Supplies Pvt Ltd',
    vendorCode: 'VND-0042', category: 'PHARMACY', branch: 'Main Campus', department: 'Pharmacy',
    invoiceDate: '2026-04-10', dueDate: '2026-05-10', agingDays: 9,
    invoiceAmount: 485000, outstandingAmount: 485000, paidAmount: 0,
    paymentStatus: 'SCHEDULED', approvalStatus: 'APPROVED', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'LOW', riskScore: 15,
    assignedApprover: 'Dr. Anita Rao', lastUpdated: '2026-05-16',
    poNumber: 'PO-2026-0318', grnNumber: 'GRN-2026-0198', taxAmount: 73881,
    notes: 'Scheduled for payment batch on 22 May. 3-way match complete.',
  },
  {
    id: 'PAY-002', invoiceNo: 'VIN-2026-00398', vendorName: 'Star Surgical Instruments',
    vendorCode: 'VND-0019', category: 'OT_SUPPLIES', branch: 'North Wing', department: 'OT',
    invoiceDate: '2026-03-28', dueDate: '2026-04-27', agingDays: 22,
    invoiceAmount: 312500, outstandingAmount: 312500, paidAmount: 0,
    paymentStatus: 'OVERDUE', approvalStatus: 'APPROVED', procurementStatus: 'GRN_DONE',
    taxStatus: 'GST_FILED', riskLevel: 'HIGH', riskScore: 72,
    assignedApprover: 'Rajiv Sharma', lastUpdated: '2026-05-14',
    poNumber: 'PO-2026-0287', grnNumber: 'GRN-2026-0176', taxAmount: 47583,
    notes: 'Payment delayed due to bank holiday. Vendor follow-up received.',
  },
  {
    id: 'PAY-003', invoiceNo: 'VIN-2026-00374', vendorName: 'MedTech ICU Solutions',
    vendorCode: 'VND-0033', category: 'ICU_EQUIP', branch: 'Main Campus', department: 'ICU',
    invoiceDate: '2026-03-15', dueDate: '2026-04-14', agingDays: 35,
    invoiceAmount: 1240000, outstandingAmount: 620000, paidAmount: 620000,
    paymentStatus: 'PARTIAL', approvalStatus: 'APPROVED', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'MEDIUM', riskScore: 42,
    assignedApprover: 'Dr. Anita Rao', lastUpdated: '2026-05-10',
    poNumber: 'PO-2026-0261', grnNumber: 'GRN-2026-0155', taxAmount: 188813,
    notes: '50% paid. Balance ₹6.2L due in next payment run on 25 May.',
  },
  {
    id: 'PAY-004', invoiceNo: 'VIN-2026-00342', vendorName: 'Apollo Diagnostics Lab',
    vendorCode: 'VND-0057', category: 'LAB', branch: 'East Block', department: 'Laboratory',
    invoiceDate: '2026-02-28', dueDate: '2026-03-30', agingDays: 50,
    invoiceAmount: 178000, outstandingAmount: 178000, paidAmount: 0,
    paymentStatus: 'OVERDUE', approvalStatus: 'ESCALATED', procurementStatus: 'EXCEPTION',
    taxStatus: 'PENDING', riskLevel: 'HIGH', riskScore: 76,
    assignedApprover: 'Nisha Mehta', lastUpdated: '2026-05-08',
    poNumber: 'PO-2026-0224', grnNumber: null, taxAmount: 27127,
    notes: 'GRN quantity mismatch on lab kits. Escalated to purchase committee for approval.',
  },
  {
    id: 'PAY-005', invoiceNo: 'VIN-2026-00318', vendorName: 'Siemens Healthineers India',
    vendorCode: 'VND-0009', category: 'RADIOLOGY', branch: 'Specialty Center', department: 'Radiology',
    invoiceDate: '2026-02-10', dueDate: '2026-03-12', agingDays: 68,
    invoiceAmount: 3200000, outstandingAmount: 3200000, paidAmount: 0,
    paymentStatus: 'ON_HOLD', approvalStatus: 'REVIEW', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'CRITICAL', riskScore: 88,
    assignedApprover: 'Arvind Kumar', lastUpdated: '2026-05-12',
    poNumber: 'PO-2026-0201', grnNumber: 'GRN-2026-0128', taxAmount: 487627,
    notes: 'High-value equipment invoice. Under CFO review pending capital budget approval.',
  },
  {
    id: 'PAY-006', invoiceNo: 'VIN-2026-00501', vendorName: 'Johnson & Johnson MedTech',
    vendorCode: 'VND-0012', category: 'BIOMEDICAL', branch: 'Main Campus', department: 'Biomedical',
    invoiceDate: '2026-04-22', dueDate: '2026-05-22', agingDays: 0,
    invoiceAmount: 540000, outstandingAmount: 540000, paidAmount: 0,
    paymentStatus: 'PENDING', approvalStatus: 'APPROVED', procurementStatus: 'GRN_DONE',
    taxStatus: 'GST_FILED', riskLevel: 'LOW', riskScore: 12,
    assignedApprover: 'Dr. Anita Rao', lastUpdated: '2026-05-18',
    poNumber: 'PO-2026-0402', grnNumber: 'GRN-2026-0241', taxAmount: 82271,
    notes: 'Within due date. Approved for next payment batch.',
  },
  {
    id: 'PAY-007', invoiceNo: 'VIN-2026-00467', vendorName: 'Wipro IT Infrastructure',
    vendorCode: 'VND-0071', category: 'IT_SERVICES', branch: 'Main Campus', department: 'IT',
    invoiceDate: '2026-04-15', dueDate: '2026-05-15', agingDays: 4,
    invoiceAmount: 225000, outstandingAmount: 225000, paidAmount: 0,
    paymentStatus: 'PENDING', approvalStatus: 'PENDING', procurementStatus: 'NO_PO',
    taxStatus: 'GST_FILED', riskLevel: 'MEDIUM', riskScore: 44,
    assignedApprover: 'Rajiv Sharma', lastUpdated: '2026-05-17',
    poNumber: null, grnNumber: null, taxAmount: 34271,
    notes: 'Emergency server maintenance invoice. Retroactive PO being raised.',
  },
  {
    id: 'PAY-008', invoiceNo: 'VIN-2026-00436', vendorName: 'BD Medical India Ltd',
    vendorCode: 'VND-0028', category: 'ICU_EQUIP', branch: 'North Wing', department: 'ICU',
    invoiceDate: '2026-04-05', dueDate: '2026-05-05', agingDays: 14,
    invoiceAmount: 680000, outstandingAmount: 680000, paidAmount: 0,
    paymentStatus: 'SCHEDULED', approvalStatus: 'APPROVED', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'LOW', riskScore: 18,
    assignedApprover: 'Sunita Pillai', lastUpdated: '2026-05-15',
    poNumber: 'PO-2026-0352', grnNumber: 'GRN-2026-0217', taxAmount: 103559,
    notes: 'Scheduled in payment batch #18 for 20 May. NEFT transfer confirmed.',
  },
  {
    id: 'PAY-009', invoiceNo: 'VIN-2026-00291', vendorName: 'Abbott Diagnostics Ltd',
    vendorCode: 'VND-0041', category: 'LAB', branch: 'East Block', department: 'Laboratory',
    invoiceDate: '2026-01-25', dueDate: '2026-02-24', agingDays: 84,
    invoiceAmount: 420000, outstandingAmount: 420000, paidAmount: 0,
    paymentStatus: 'OVERDUE', approvalStatus: 'PENDING', procurementStatus: 'GRN_DONE',
    taxStatus: 'DISPUTED', riskLevel: 'CRITICAL', riskScore: 91,
    assignedApprover: 'Nisha Mehta', lastUpdated: '2026-05-05',
    poNumber: 'PO-2026-0178', grnNumber: 'GRN-2026-0095', taxAmount: 63983,
    notes: 'GST dispute on reagent category. Tax team resolving. Vendor threatening supply stoppage.',
  },
  {
    id: 'PAY-010', invoiceNo: 'VIN-2026-00528', vendorName: 'Cardinal Health India',
    vendorCode: 'VND-0016', category: 'OT_SUPPLIES', branch: 'Main Campus', department: 'OT',
    invoiceDate: '2026-05-02', dueDate: '2026-06-01', agingDays: 0,
    invoiceAmount: 194000, outstandingAmount: 194000, paidAmount: 0,
    paymentStatus: 'PENDING', approvalStatus: 'APPROVED', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'LOW', riskScore: 8,
    assignedApprover: 'Dr. Anita Rao', lastUpdated: '2026-05-19',
    poNumber: 'PO-2026-0428', grnNumber: 'GRN-2026-0264', taxAmount: 29559,
    notes: 'New invoice. Within terms. Queued for June payment cycle.',
  },
  {
    id: 'PAY-011', invoiceNo: 'VIN-2026-00362', vendorName: 'Medtronic India Pvt Ltd',
    vendorCode: 'VND-0007', category: 'BIOMEDICAL', branch: 'Cardiac Care', department: 'Cardiology',
    invoiceDate: '2026-03-10', dueDate: '2026-04-09', agingDays: 40,
    invoiceAmount: 2150000, outstandingAmount: 2150000, paidAmount: 0,
    paymentStatus: 'ON_HOLD', approvalStatus: 'ESCALATED', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'CRITICAL', riskScore: 85,
    assignedApprover: 'Arvind Kumar', lastUpdated: '2026-05-11',
    poNumber: 'PO-2026-0242', grnNumber: 'GRN-2026-0148', taxAmount: 327457,
    notes: 'Cardiac device invoice. Escalated for board approval. Risk of supply suspension.',
  },
  {
    id: 'PAY-012', invoiceNo: 'VIN-2026-00482', vendorName: 'Roche Diagnostics India',
    vendorCode: 'VND-0023', category: 'LAB', branch: 'Specialty Center', department: 'Laboratory',
    invoiceDate: '2026-04-18', dueDate: '2026-05-18', agingDays: 1,
    invoiceAmount: 368000, outstandingAmount: 368000, paidAmount: 0,
    paymentStatus: 'PENDING', approvalStatus: 'APPROVED', procurementStatus: 'GRN_DONE',
    taxStatus: 'GST_FILED', riskLevel: 'LOW', riskScore: 22,
    assignedApprover: 'Sunita Pillai', lastUpdated: '2026-05-18',
    poNumber: 'PO-2026-0388', grnNumber: 'GRN-2026-0232', taxAmount: 56059,
    notes: 'Due tomorrow. Fast-track payment processing initiated.',
  },
  {
    id: 'PAY-013', invoiceNo: 'VIN-2026-00329', vendorName: '3M Healthcare India',
    vendorCode: 'VND-0035', category: 'OT_SUPPLIES', branch: 'South Clinic', department: 'OT',
    invoiceDate: '2026-02-20', dueDate: '2026-03-22', agingDays: 58,
    invoiceAmount: 264000, outstandingAmount: 264000, paidAmount: 0,
    paymentStatus: 'OVERDUE', approvalStatus: 'APPROVED', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'HIGH', riskScore: 68,
    assignedApprover: 'Pradeep Nair', lastUpdated: '2026-05-13',
    poNumber: 'PO-2026-0208', grnNumber: 'GRN-2026-0112', taxAmount: 40220,
    notes: 'Overdue 58 days. Vendor escalation received. Urgent clearance required.',
  },
  {
    id: 'PAY-014', invoiceNo: 'VIN-2026-00445', vendorName: 'Philips Healthcare India',
    vendorCode: 'VND-0011', category: 'ICU_EQUIP', branch: 'North Wing', department: 'ICU',
    invoiceDate: '2026-04-08', dueDate: '2026-05-08', agingDays: 11,
    invoiceAmount: 890000, outstandingAmount: 890000, paidAmount: 0,
    paymentStatus: 'SCHEDULED', approvalStatus: 'APPROVED', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'LOW', riskScore: 20,
    assignedApprover: 'Dr. Anita Rao', lastUpdated: '2026-05-16',
    poNumber: 'PO-2026-0364', grnNumber: 'GRN-2026-0224', taxAmount: 135610,
    notes: 'Ventilator maintenance contract. Scheduled in May 25 batch.',
  },
  {
    id: 'PAY-015', invoiceNo: 'VIN-2026-00307', vendorName: "Dr. Reddy's Laboratories",
    vendorCode: 'VND-0004', category: 'PHARMACY', branch: 'Main Campus', department: 'Pharmacy',
    invoiceDate: '2026-02-05', dueDate: '2026-03-07', agingDays: 73,
    invoiceAmount: 924000, outstandingAmount: 924000, paidAmount: 0,
    paymentStatus: 'OVERDUE', approvalStatus: 'APPROVED', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'HIGH', riskScore: 79,
    assignedApprover: 'Rajiv Sharma', lastUpdated: '2026-05-07',
    poNumber: 'PO-2026-0188', grnNumber: 'GRN-2026-0098', taxAmount: 140780,
    notes: 'Critical pharma vendor. Overdue 73 days. Supply chain risk if not cleared.',
  },
  {
    id: 'PAY-016', invoiceNo: 'VIN-2026-00511', vendorName: 'Becton Dickinson India',
    vendorCode: 'VND-0048', category: 'LAB', branch: 'East Block', department: 'Laboratory',
    invoiceDate: '2026-04-28', dueDate: '2026-05-28', agingDays: 0,
    invoiceAmount: 142000, outstandingAmount: 142000, paidAmount: 0,
    paymentStatus: 'PENDING', approvalStatus: 'PENDING', procurementStatus: 'GRN_DONE',
    taxStatus: 'GST_FILED', riskLevel: 'LOW', riskScore: 10,
    assignedApprover: 'Nisha Mehta', lastUpdated: '2026-05-18',
    poNumber: 'PO-2026-0419', grnNumber: 'GRN-2026-0258', taxAmount: 21627,
    notes: 'Awaiting L2 approval from department head.',
  },
  {
    id: 'PAY-017', invoiceNo: 'VIN-2026-00352', vendorName: 'GE Healthcare India Ltd',
    vendorCode: 'VND-0006', category: 'RADIOLOGY', branch: 'Specialty Center', department: 'Radiology',
    invoiceDate: '2026-03-05', dueDate: '2026-04-04', agingDays: 45,
    invoiceAmount: 1680000, outstandingAmount: 1680000, paidAmount: 0,
    paymentStatus: 'ON_HOLD', approvalStatus: 'REVIEW', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'CRITICAL', riskScore: 82,
    assignedApprover: 'Arvind Kumar', lastUpdated: '2026-05-09',
    poNumber: 'PO-2026-0233', grnNumber: 'GRN-2026-0141', taxAmount: 256017,
    notes: 'MRI machine service invoice. Finance review pending. Board approval needed.',
  },
  {
    id: 'PAY-018', invoiceNo: 'VIN-2026-00493', vendorName: 'Baxter Healthcare India',
    vendorCode: 'VND-0031', category: 'ICU_EQUIP', branch: 'North Wing', department: 'ICU',
    invoiceDate: '2026-04-20', dueDate: '2026-05-20', agingDays: 0,
    invoiceAmount: 326000, outstandingAmount: 326000, paidAmount: 0,
    paymentStatus: 'PENDING', approvalStatus: 'APPROVED', procurementStatus: 'MATCHED',
    taxStatus: 'GST_FILED', riskLevel: 'LOW', riskScore: 16,
    assignedApprover: 'Sunita Pillai', lastUpdated: '2026-05-17',
    poNumber: 'PO-2026-0408', grnNumber: 'GRN-2026-0248', taxAmount: 49678,
    notes: 'IV fluids monthly supply. Within terms. Ready for payment.',
  },
  {
    id: 'PAY-019', invoiceNo: 'VIN-2026-00281', vendorName: 'KIMS Biomedical Services',
    vendorCode: 'VND-0064', category: 'BIOMEDICAL', branch: 'Main Campus', department: 'Biomedical',
    invoiceDate: '2026-01-18', dueDate: '2026-02-17', agingDays: 91,
    invoiceAmount: 580000, outstandingAmount: 580000, paidAmount: 0,
    paymentStatus: 'OVERDUE', approvalStatus: 'PENDING', procurementStatus: 'EXCEPTION',
    taxStatus: 'DISPUTED', riskLevel: 'CRITICAL', riskScore: 94,
    assignedApprover: 'Pradeep Nair', lastUpdated: '2026-04-28',
    poNumber: 'PO-2026-0148', grnNumber: 'GRN-2026-0072', taxAmount: 88373,
    notes: 'Critical equipment maintenance overdue 91 days. Vendor stopped services. Urgent.',
  },
  {
    id: 'PAY-020', invoiceNo: 'VIN-2026-00457', vendorName: 'HCL Healthcare IT Solutions',
    vendorCode: 'VND-0082', category: 'IT_SERVICES', branch: 'Main Campus', department: 'IT',
    invoiceDate: '2026-04-12', dueDate: '2026-05-12', agingDays: 7,
    invoiceAmount: 410000, outstandingAmount: 205000, paidAmount: 205000,
    paymentStatus: 'PARTIAL', approvalStatus: 'APPROVED', procurementStatus: 'NO_PO',
    taxStatus: 'GST_FILED', riskLevel: 'MEDIUM', riskScore: 38,
    assignedApprover: 'Rajiv Sharma', lastUpdated: '2026-05-14',
    poNumber: null, grnNumber: null, taxAmount: 62475,
    notes: '50% advance paid. Balance on project milestone delivery.',
  },
];

// ─── KPI Configurations ───────────────────────────────────────────────────────
export const AP_KPI_CONFIG = [
  { id: 'total',        label: 'Total Payables',        value: 148620000, prefix: '₹', suffix: '',  format: 'crore', trend: +6.4,  trendLabel: 'vs last month', color: '#f59e0b', icon: 'IndianRupee',  aiFlag: false },
  { id: 'current',      label: 'Current (0–30 Days)',    value: 62480000,  prefix: '₹', suffix: '',  format: 'crore', trend: +2.1,  trendLabel: 'vs last month', color: '#3b82f6', icon: 'CheckCircle2', aiFlag: false },
  { id: 'overdue',      label: 'Overdue Payables',       value: 47240000,  prefix: '₹', suffix: '',  format: 'crore', trend: +12.3, trendLabel: 'vs last month', color: '#ef4444', icon: 'AlertTriangle', aiFlag: true  },
  { id: 'approvals',    label: 'Pending Approvals',      value: 38,        prefix: '',  suffix: '',  format: 'num',   trend: +4,    trendLabel: 'vs yesterday',  color: '#8b5cf6', icon: 'ClipboardCheck',aiFlag: false },
  { id: 'scheduled',    label: 'Scheduled Payments',     value: 28940000,  prefix: '₹', suffix: '',  format: 'crore', trend: -8.2,  trendLabel: 'vs last week',  color: '#06b6d4', icon: 'CalendarClock', aiFlag: false },
  { id: 'procurement',  label: 'Procurement Liabilities',value: 86200000,  prefix: '₹', suffix: '',  format: 'crore', trend: +5.1,  trendLabel: 'vs last month', color: '#10b981', icon: 'ShoppingCart',  aiFlag: false },
  { id: 'avgDays',      label: 'Avg Payment Days',       value: 42,        prefix: '',  suffix: 'd', format: 'num',   trend: +3,    trendLabel: 'vs last month', color: '#f97316', icon: 'Clock',         aiFlag: true  },
  { id: 'exposure',     label: 'Cash Flow Exposure',     value: 31850000,  prefix: '₹', suffix: '',  format: 'crore', trend: +9.7,  trendLabel: 'next 30 days',  color: '#dc2626', icon: 'TrendingDown',  aiFlag: true  },
  { id: 'fraud',        label: 'Fraud Risk Alerts',      value: 7,         prefix: '',  suffix: '',  format: 'num',   trend: +2,    trendLabel: 'new today',     color: '#ef4444', icon: 'ShieldAlert',   aiFlag: true  },
  { id: 'disputes',     label: 'Vendor Disputes',        value: 12,        prefix: '',  suffix: '',  format: 'num',   trend: -3,    trendLabel: 'vs last week',  color: '#7c3aed', icon: 'AlertOctagon',  aiFlag: false },
];

// ─── Aging Chart Data ─────────────────────────────────────────────────────────
export const AGING_CHART_DATA = [
  { month: 'Nov', current: 52000, d31: 18000, d61: 9200,  d91: 4100  },
  { month: 'Dec', current: 58000, d31: 21000, d61: 11400, d91: 5200  },
  { month: 'Jan', current: 54000, d31: 24000, d61: 14800, d91: 6800  },
  { month: 'Feb', current: 61000, d31: 28000, d61: 17200, d91: 8400  },
  { month: 'Mar', current: 58000, d31: 31000, d61: 19800, d91: 10200 },
  { month: 'Apr', current: 65000, d31: 34000, d61: 22400, d91: 12800 },
  { month: 'May', current: 62480, d31: 38400, d61: 26200, d91: 21840 },
];

export const AGING_BUCKET_TOTALS = [
  { label: '0–30 days',  amount: 62480000, count: 142, color: '#3b82f6', pct: 42.1 },
  { label: '31–60 days', amount: 38400000, count: 88,  color: '#f59e0b', pct: 25.8 },
  { label: '61–90 days', amount: 26200000, count: 54,  color: '#f97316', pct: 17.6 },
  { label: '90+ days',   amount: 21840000, count: 31,  color: '#ef4444', pct: 14.5 },
];

export const BRANCH_SPEND_HEATMAP = [
  { branch: 'Main Campus',      d0: 18200, d31: 11400, d61: 7800, d91: 6200 },
  { branch: 'North Wing',       d0: 14800, d31: 9200,  d61: 6100, d91: 4800 },
  { branch: 'South Clinic',     d0: 9400,  d31: 6800,  d61: 5200, d91: 3900 },
  { branch: 'East Block',       d0: 10800, d31: 7200,  d61: 4900, d91: 4100 },
  { branch: 'Specialty Center', d0: 12200, d31: 5400,  d61: 4800, d91: 3400 },
  { branch: 'Cardiac Care',     d0: 7080,  d31: 3400,  d61: 1800, d91: 1240 },
];

export const VENDOR_SPEND_DATA = [
  { vendor: 'Siemens Healthineers', amount: 3200000, category: 'Radiology',    risk: 'CRITICAL' },
  { vendor: 'Medtronic India',      amount: 2150000, category: 'Biomedical',   risk: 'CRITICAL' },
  { vendor: 'GE Healthcare',        amount: 1680000, category: 'Radiology',    risk: 'CRITICAL' },
  { vendor: 'MedTech ICU',          amount: 1240000, category: 'ICU Equipment',risk: 'MEDIUM'   },
  { vendor: "Dr. Reddy's Labs",     amount: 924000,  category: 'Pharmacy',     risk: 'HIGH'     },
  { vendor: 'PharmaCare Supplies',  amount: 485000,  category: 'Pharmacy',     risk: 'LOW'      },
];

export const DEPT_SPEND_DATA = [
  { dept: 'Radiology',   spend: 4880000, pct: 32.8 },
  { dept: 'ICU',         spend: 2836000, pct: 19.1 },
  { dept: 'Biomedical',  spend: 2730000, pct: 18.4 },
  { dept: 'Pharmacy',    spend: 1409000, pct: 9.5  },
  { dept: 'OT',          spend: 770500,  pct: 5.2  },
  { dept: 'Laboratory',  spend: 930000,  pct: 6.3  },
  { dept: 'IT',          spend: 635000,  pct: 4.3  },
  { dept: 'Others',      spend: 630000,  pct: 4.2  },
];

// ─── AI Insights Data ─────────────────────────────────────────────────────────
export const AP_AI_INSIGHTS = [
  {
    id: 'ai-001', type: 'FRAUD_ALERT', severity: 'critical',
    title: '3 Potential Duplicate Invoices Detected',
    detail: 'AI flagged VIN-2026-00342 (Apollo Diagnostics) and VIN-2026-00291 as possibly duplicate — same vendor, overlapping GRN dates, ₹1.78L exposure.',
    action: 'Review Now',
    icon: 'ShieldAlert',
  },
  {
    id: 'ai-002', type: 'CASH_FORECAST', severity: 'warning',
    title: 'Cash Outflow ₹8.2Cr Due in 14 Days',
    detail: 'Based on scheduled payments and overdue clearing, ₹8.2Cr payable outflow is projected in the next 14 days. Working capital exposure: ₹3.1Cr.',
    action: 'View Schedule',
    icon: 'TrendingDown',
  },
  {
    id: 'ai-003', type: 'RISK_ALERT', severity: 'critical',
    title: 'Critical Vendor Supply Risk — 4 Overdue',
    detail: 'KIMS Biomedical (91d), Abbott Diagnostics (84d), Siemens Healthineers (68d) risk service suspension. Estimated operational impact: ₹12.4L/day.',
    action: 'Prioritise Payments',
    icon: 'AlertTriangle',
  },
  {
    id: 'ai-004', type: 'OPTIMIZATION', severity: 'info',
    title: 'Early Payment Discount Opportunity',
    detail: '4 vendors offer 2/10 net 30 terms. Paying PharmaCare, BD Medical, and Baxter by 22 May saves ₹24,800 in discounts.',
    action: 'Optimise Payments',
    icon: 'TrendingUp',
  },
  {
    id: 'ai-005', type: 'COMPLIANCE', severity: 'warning',
    title: 'GST TDS Compliance Gap Detected',
    detail: 'VIN-2026-00291 (Abbott) and VIN-2026-00019 have disputed GST values. Filing deadline is 20 May — 3 days remaining.',
    action: 'Resolve Now',
    icon: 'AlertOctagon',
  },
];

// ─── Fraud Alerts ─────────────────────────────────────────────────────────────
export const FRAUD_ALERTS = [
  {
    id: 'FR-001', type: 'DUPLICATE_INVOICE',   title: 'Duplicate Invoice Pattern',      severity: 'CRITICAL',
    vendor: 'Apollo Diagnostics Lab',  amount: 178000,  dept: 'Laboratory',
    desc: 'Invoice matches an earlier submission (VIN-2026-00298) within 30 days — same vendor, same amount. Possible duplicate billing.',
    status: 'open', detectedAt: '2026-05-17',
  },
  {
    id: 'FR-002', type: 'SPLIT_INVOICE',        title: 'Split Invoice Above PO Threshold', severity: 'HIGH',
    vendor: 'KIMS Biomedical Services', amount: 580000, dept: 'Biomedical',
    desc: 'Invoice split into 3 parts to stay below ₹2L approval threshold. Combined value ₹5.8L exceeds delegated authority.',
    status: 'open', detectedAt: '2026-05-15',
  },
  {
    id: 'FR-003', type: 'VENDOR_RISK',          title: 'New Vendor — Unverified GSTIN',    severity: 'HIGH',
    vendor: 'HCL Healthcare IT Solutions', amount: 410000, dept: 'IT',
    desc: 'Vendor GSTIN validation failed on GST portal. Vendor registered only 42 days ago with no prior billing history.',
    status: 'reviewing', detectedAt: '2026-05-14',
  },
  {
    id: 'FR-004', type: 'PRICE_ANOMALY',        title: 'Pricing 34% Above Market Rate',   severity: 'MEDIUM',
    vendor: '3M Healthcare India', amount: 264000, dept: 'OT',
    desc: 'Unit price of ₹840 for surgical drapes is 34% higher than last 3 invoices (avg ₹624). Possible inflated billing.',
    status: 'open', detectedAt: '2026-05-13',
  },
  {
    id: 'FR-005', type: 'UNAUTHORIZED_APPROVAL',title: 'Approval Outside Delegated Authority', severity: 'MEDIUM',
    vendor: 'Wipro IT Infrastructure', amount: 225000, dept: 'IT',
    desc: 'No PO raised before services rendered. Emergency approval invoked by Dept Head without CFO sign-off as required for IT capex.',
    status: 'resolved', detectedAt: '2026-05-12',
  },
];

// ─── Cash Outflow Forecast ────────────────────────────────────────────────────
export const CASH_OUTFLOW_FORECAST = [
  { month: 'Nov', scheduled: 38400, actual: 36200 },
  { month: 'Dec', scheduled: 42000, actual: 39800 },
  { month: 'Jan', scheduled: 44000, actual: 41200 },
  { month: 'Feb', scheduled: 48000, actual: 46800 },
  { month: 'Mar', scheduled: 52000, actual: 49400 },
  { month: 'Apr', scheduled: 56000, actual: 53200 },
  { month: 'May', scheduled: 60000, actual: null  },
];

export const PAYMENT_SCHEDULE = [
  { date: '2026-05-20', vendor: 'BD Medical India',     amount: 680000,  priority: 'HIGH',   status: 'ready'   },
  { date: '2026-05-20', vendor: 'PharmaCare Supplies',  amount: 485000,  priority: 'HIGH',   status: 'ready'   },
  { date: '2026-05-22', vendor: 'Baxter Healthcare',    amount: 326000,  priority: 'MEDIUM', status: 'ready'   },
  { date: '2026-05-22', vendor: 'Cardinal Health',      amount: 194000,  priority: 'LOW',    status: 'pending' },
  { date: '2026-05-25', vendor: 'MedTech ICU Solutions',amount: 620000,  priority: 'HIGH',   status: 'pending' },
  { date: '2026-05-25', vendor: 'Philips Healthcare',   amount: 890000,  priority: 'HIGH',   status: 'pending' },
  { date: '2026-05-28', vendor: 'Roche Diagnostics',    amount: 368000,  priority: 'MEDIUM', status: 'pending' },
];

// ─── AI Prompt Suggestions ────────────────────────────────────────────────────
export const AP_PROMPT_SUGGESTIONS = [
  'Find duplicate vendor invoices this month',
  'Which overdue payments carry supply risk?',
  'Forecast cash outflow for next 30 days',
  'Identify high-risk vendor approvals',
  'Show invoices pending more than 60 days',
  'Detect split invoices above approval threshold',
  'Which vendors offer early payment discounts?',
  'Show procurement mismatches by department',
];

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmtINR = (val, format = 'crore') => {
  if (format === 'crore') return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (format === 'lakh')  return `₹${(val / 100000).toFixed(2)}L`;
  if (format === 'pct')   return `${val}%`;
  if (format === 'num')   return String(val);
  return `₹${val.toLocaleString('en-IN')}`;
};

export const agingBadge = (days) => {
  if (days <= 0)  return { label: 'Current',   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'     };
  if (days <= 30) return { label: `${days}d`,  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  if (days <= 60) return { label: `${days}d`,  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'   };
  if (days <= 90) return { label: `${days}d`,  cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
  return              { label: `${days}d ⚠`, cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'           };
};
