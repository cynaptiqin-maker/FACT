// Chart of Accounts — shared constants and configuration

export const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

export const TYPE_CONFIG = {
  ASSET: {
    label: 'Asset',
    shortLabel: 'ASS',
    normalBalance: 'DEBIT',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    headerBg: 'bg-blue-600',
    ringColor: 'ring-blue-500',
    dotColor: 'bg-blue-500',
    gradient: 'from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-900',
    description: 'Resources owned and controlled by the organization',
  },
  LIABILITY: {
    label: 'Liability',
    shortLabel: 'LIA',
    normalBalance: 'CREDIT',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    headerBg: 'bg-red-600',
    ringColor: 'ring-red-500',
    dotColor: 'bg-red-500',
    gradient: 'from-red-50 to-white dark:from-red-950/30 dark:to-slate-900',
    description: 'Financial obligations owed to external parties',
  },
  EQUITY: {
    label: 'Equity',
    shortLabel: 'EQT',
    normalBalance: 'CREDIT',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-700 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
    headerBg: 'bg-violet-600',
    ringColor: 'ring-violet-500',
    dotColor: 'bg-violet-500',
    gradient: 'from-violet-50 to-white dark:from-violet-950/30 dark:to-slate-900',
    description: "Owners' net interest and retained earnings",
  },
  INCOME: {
    label: 'Income',
    shortLabel: 'INC',
    normalBalance: 'CREDIT',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    headerBg: 'bg-emerald-600',
    ringColor: 'ring-emerald-500',
    dotColor: 'bg-emerald-500',
    gradient: 'from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900',
    description: 'Revenue earned from core and ancillary operations',
  },
  EXPENSE: {
    label: 'Expense',
    shortLabel: 'EXP',
    normalBalance: 'DEBIT',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    headerBg: 'bg-amber-600',
    ringColor: 'ring-amber-500',
    dotColor: 'bg-amber-500',
    gradient: 'from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900',
    description: 'Costs and expenditures incurred during operations',
  },
};

export const HEALTHCARE_DEPARTMENTS = [
  { value: 'ICU', label: 'Intensive Care Unit' },
  { value: 'OT', label: 'Operation Theatre' },
  { value: 'EMERGENCY', label: 'Emergency / Casualty' },
  { value: 'RADIOLOGY', label: 'Radiology & Imaging' },
  { value: 'LABORATORY', label: 'Laboratory & Pathology' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'OPD', label: 'Outpatient Department' },
  { value: 'IPD', label: 'Inpatient Department' },
  { value: 'CARDIOLOGY', label: 'Cardiology' },
  { value: 'ORTHOPEDICS', label: 'Orthopedics' },
  { value: 'NEUROLOGY', label: 'Neurology' },
  { value: 'ONCOLOGY', label: 'Oncology' },
  { value: 'PEDIATRICS', label: 'Pediatrics' },
  { value: 'GYNECOLOGY', label: 'Gynecology & Obstetrics' },
  { value: 'DIALYSIS', label: 'Dialysis' },
  { value: 'PHYSIOTHERAPY', label: 'Physiotherapy' },
  { value: 'BLOOD_BANK', label: 'Blood Bank' },
  { value: 'ADMINISTRATION', label: 'Administration' },
  { value: 'FINANCE', label: 'Finance & Accounts' },
  { value: 'HR', label: 'Human Resources' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'DIETARY', label: 'Dietary & Cafeteria' },
  { value: 'LAUNDRY', label: 'Laundry & Housekeeping' },
];

export const HEALTHCARE_MAPPINGS = [
  { value: 'PHARMACY', label: 'Pharmacy Revenue', category: 'Revenue' },
  { value: 'ICU_CHARGES', label: 'ICU Charges', category: 'Revenue' },
  { value: 'OT_CHARGES', label: 'OT/Surgery Charges', category: 'Revenue' },
  { value: 'RADIOLOGY', label: 'Radiology Services', category: 'Revenue' },
  { value: 'LABORATORY', label: 'Laboratory Services', category: 'Revenue' },
  { value: 'CONSULTATION', label: 'Consultation Fees', category: 'Revenue' },
  { value: 'PACKAGES', label: 'Care Packages', category: 'Revenue' },
  { value: 'AMBULANCE', label: 'Ambulance Services', category: 'Revenue' },
  { value: 'TPA_CLAIMS', label: 'TPA / Insurance Claims', category: 'Receivable' },
  { value: 'DOCTOR_PAYOUTS', label: 'Doctor Payouts', category: 'Payable' },
  { value: 'CONSUMABLES', label: 'Medical Consumables', category: 'Expense' },
  { value: 'BLOOD_BANK', label: 'Blood Bank', category: 'Revenue' },
  { value: 'DIALYSIS', label: 'Dialysis', category: 'Revenue' },
  { value: 'PHYSIOTHERAPY', label: 'Physiotherapy', category: 'Revenue' },
];

export const AI_PROMPTS = [
  { icon: '🔍', text: 'Show all ICU revenue accounts', tag: 'Search' },
  { icon: '⚠️', text: 'Find unmapped expense ledgers', tag: 'Insight' },
  { icon: '💤', text: 'Show inactive pharmacy accounts', tag: 'Search' },
  { icon: '🏷️', text: 'Which accounts are missing GST mapping?', tag: 'Compliance' },
  { icon: '🔄', text: 'Detect duplicate account names', tag: 'Audit' },
  { icon: '📊', text: 'Suggest hierarchy optimisation', tag: 'Optimize' },
  { icon: '🚨', text: 'Detect potential revenue leakage risks', tag: 'Risk' },
  { icon: '📋', text: 'Recommend TPA account structure', tag: 'Recommend' },
];

export const AI_INSIGHT_EXAMPLES = [
  {
    type: 'warning',
    title: '12 accounts unmapped',
    body: 'Pharmacy expense ledgers are missing department mapping, which may cause incorrect cost-centre reporting.',
    action: 'Review accounts',
  },
  {
    type: 'info',
    title: 'Duplicate detected',
    body: '"Consultation Income" and "Consultation Revenue" appear to be duplicates. Consider merging.',
    action: 'View both',
  },
  {
    type: 'success',
    title: 'Structure looks healthy',
    body: 'Asset accounts are well-structured. No orphan ledgers detected.',
    action: null,
  },
  {
    type: 'warning',
    title: '3 inactive ledgers with balances',
    body: 'Disabled accounts still carry opening balances that have not been transferred.',
    action: 'Fix now',
  },
];

export const CURRENCIES = [
  { value: 'INR', label: '₹ Indian Rupee' },
  { value: 'USD', label: '$ US Dollar' },
  { value: 'EUR', label: '€ Euro' },
  { value: 'GBP', label: '£ British Pound' },
  { value: 'AED', label: 'د.إ UAE Dirham' },
];

export const STATUS_CONFIG = {
  active: {
    label: 'Active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  inactive: {
    label: 'Inactive',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    dot: 'bg-slate-400',
  },
  pending: {
    label: 'Pending Approval',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
};

export const SAMPLE_ACTIVITY = [
  {
    id: 1,
    user: 'Ravi Shankar',
    avatar: 'RS',
    action: 'Created account',
    target: 'ICU Charges Receivable',
    code: '4110',
    time: '2 min ago',
    type: 'create',
  },
  {
    id: 2,
    user: 'Meera Nair',
    avatar: 'MN',
    action: 'Updated mapping',
    target: 'Pharmacy Revenue',
    code: '3020',
    time: '1 hr ago',
    type: 'update',
  },
  {
    id: 3,
    user: 'System',
    avatar: 'SY',
    action: 'Bulk import completed',
    target: '47 accounts from Tally',
    code: null,
    time: '3 hr ago',
    type: 'import',
  },
  {
    id: 4,
    user: 'Admin',
    avatar: 'AD',
    action: 'Approved account',
    target: 'Doctor Consultation Income',
    code: '3110',
    time: 'Yesterday',
    type: 'approve',
  },
  {
    id: 5,
    user: 'Priya Das',
    avatar: 'PD',
    action: 'Disabled account',
    target: 'Old Lab Equipment Fund',
    code: '1540',
    time: '2 days ago',
    type: 'disable',
  },
];

export const formatINR = (val) => {
  if (val == null) return '—';
  const num = parseFloat(val);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatBalance = (val) => {
  if (val == null) return null;
  const num = parseFloat(val);
  if (isNaN(num)) return null;
  const abs = Math.abs(num);
  if (abs >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};

export const flattenTree = (nodes, result = []) => {
  for (const node of nodes) {
    result.push(node);
    if (node.children?.length) flattenTree(node.children, result);
  }
  return result;
};
