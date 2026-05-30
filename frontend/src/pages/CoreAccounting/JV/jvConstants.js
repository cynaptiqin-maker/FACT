export const VOUCHER_TYPES = [
  { value: 'JOURNAL',    label: 'Journal Voucher',  short: 'JV', color: 'blue'   },
  { value: 'PAYMENT',    label: 'Payment Voucher',  short: 'PV', color: 'red'    },
  { value: 'RECEIPT',    label: 'Receipt Voucher',  short: 'RV', color: 'green'  },
  { value: 'CONTRA',     label: 'Contra Voucher',   short: 'CV', color: 'violet' },
  { value: 'DEBIT_NOTE', label: 'Debit Note',       short: 'DN', color: 'orange' },
  { value: 'CREDIT_NOTE',label: 'Credit Note',      short: 'CN', color: 'teal'   },
];

export const STATUS_CONFIG = {
  draft:    { label: 'Draft',            className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  pending:  { label: 'Pending Approval', className: 'bg-amber-50 text-amber-700 border border-amber-200'  },
  approved: { label: 'Approved',         className: 'bg-blue-50 text-blue-700 border border-blue-200'     },
  posted:   { label: 'Posted',           className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  rejected: { label: 'Rejected',         className: 'bg-red-50 text-red-700 border border-red-200'        },
  reversed: { label: 'Reversed',         className: 'bg-slate-100 text-slate-500 border border-slate-200' },
};

export const ACCOUNT_TYPE_CONFIG = {
  ASSET:     { label: 'Asset',     short: 'A', className: 'bg-blue-50 text-blue-700'     },
  LIABILITY: { label: 'Liability', short: 'L', className: 'bg-red-50 text-red-700'       },
  EQUITY:    { label: 'Equity',    short: 'E', className: 'bg-violet-50 text-violet-700' },
  INCOME:    { label: 'Income',    short: 'I', className: 'bg-emerald-50 text-emerald-700'},
  EXPENSE:   { label: 'Expense',   short: 'X', className: 'bg-orange-50 text-orange-700' },
};

export const AI_INSIGHTS = [
  {
    id: 1, type: 'warning',
    title: 'Approval threshold exceeded',
    body: 'Amount exceeds ₹5L. CFO approval required per policy.',
    action: 'Route to CFO',
  },
  {
    id: 2, type: 'suggestion',
    title: 'Missing cost center',
    body: 'Expense lines require cost center mapping per GL policy.',
    action: 'Map Now',
  },
  {
    id: 3, type: 'info',
    title: 'Similar entry detected',
    body: 'JV-2026-0234 has identical structure. Use as template?',
    action: 'Use Template',
  },
];

export const AI_PROMPTS = [
  'Suggest entries for depreciation',
  'Generate accrual for ICU revenue',
  'Create TPA adjustment entry',
  'Recommend balancing account',
  'Explain P&L impact of this entry',
];

export const NARRATION_TEMPLATES = [
  'Being monthly depreciation on medical equipment — {month} {year}',
  'Being salary adjustment for {department} department — {month}',
  'Being TPA settlement received from {tpa_name}',
  'Being revenue accrual for ICU — {month} {year}',
  'Being pharmacy inventory write-off (expired stock)',
  'Being contra entry for inter-branch transfer to {branch}',
  'Being correction of misposted entry in {ledger_name}',
  'Being advance receipt from {party_name} — Ref: {ref_no}',
];

export const APPROVAL_STEPS = [
  { id: 1, role: 'Accounts Executive', user: 'Priya Menon',    status: 'approved', time: '10:42 AM' },
  { id: 2, role: 'Finance Manager',    user: 'Rajesh Kumar',   status: 'pending',  time: null       },
  { id: 3, role: 'Chief Finance Officer', user: 'Dr. Anita Sharma', status: 'waiting', time: null  },
];

export const AUDIT_LOG = [
  { id: 1, user: 'Priya M.', action: 'Created voucher draft',  time: '10:38 AM', avatar: 'PM', type: 'create' },
  { id: 2, user: 'Priya M.', action: 'Added 3 journal lines',  time: '10:40 AM', avatar: 'PM', type: 'edit'   },
  { id: 3, user: 'Priya M.', action: 'Updated narration text', time: '10:41 AM', avatar: 'PM', type: 'edit'   },
  { id: 4, user: 'System',   action: 'Auto-saved draft',       time: '10:42 AM', avatar: 'SY', type: 'system' },
];

export const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl + S',   desc: 'Save draft'              },
  { key: 'Ctrl + ↵',  desc: 'Submit for approval'     },
  { key: 'Ctrl + N',  desc: 'New voucher'              },
  { key: 'Alt + N',   desc: 'Add journal line'         },
  { key: 'Alt + D',   desc: 'Delete selected row'      },
  { key: 'Alt + A',   desc: 'Toggle AI panel'          },
  { key: 'Ctrl + /',  desc: 'Show keyboard shortcuts'  },
  { key: 'Tab',       desc: 'Move to next field'       },
  { key: '↑ ↓',       desc: 'Navigate account list'    },
  { key: 'Esc',       desc: 'Cancel / Close panel'     },
];

export const COST_CENTERS = [
  { value: 'icu',       label: 'ICU'                  },
  { value: 'ot',        label: 'Operation Theatre'    },
  { value: 'pharmacy',  label: 'Pharmacy'             },
  { value: 'radiology', label: 'Radiology'            },
  { value: 'admin',     label: 'Administration'       },
  { value: 'lab',       label: 'Laboratory'           },
  { value: 'emergency', label: 'Emergency / Casualty' },
  { value: 'maternity', label: 'Maternity Ward'       },
];

export const DEPARTMENTS = [
  { value: 'cardiology',    label: 'Cardiology'       },
  { value: 'orthopedics',   label: 'Orthopedics'      },
  { value: 'neurology',     label: 'Neurology'        },
  { value: 'oncology',      label: 'Oncology'         },
  { value: 'general',       label: 'General Surgery'  },
  { value: 'finance',       label: 'Finance & Accounts'},
  { value: 'hr',            label: 'Human Resources'  },
  { value: 'procurement',   label: 'Procurement'      },
];
