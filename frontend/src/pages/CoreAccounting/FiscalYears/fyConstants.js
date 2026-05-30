// ─── Fiscal year status configs ───────────────────────────────────────────────
export const FY_STATUS = {
  DRAFT:            { label: 'Draft',            bg: 'bg-slate-100',    text: 'text-slate-600',    border: 'border-slate-200',   dot: 'bg-slate-400',    ring: 'ring-slate-200'   },
  ACTIVE:           { label: 'Active',           bg: 'bg-emerald-50',   text: 'text-emerald-700',  border: 'border-emerald-200', dot: 'bg-emerald-500',  ring: 'ring-emerald-300' },
  OPEN:             { label: 'Open',             bg: 'bg-blue-50',      text: 'text-blue-700',     border: 'border-blue-200',    dot: 'bg-blue-500',     ring: 'ring-blue-200'    },
  PARTIALLY_CLOSED: { label: 'Partial Close',    bg: 'bg-amber-50',     text: 'text-amber-700',    border: 'border-amber-200',   dot: 'bg-amber-500',    ring: 'ring-amber-200'   },
  CLOSED:           { label: 'Closed',           bg: 'bg-blue-100',     text: 'text-blue-800',     border: 'border-blue-300',    dot: 'bg-blue-600',     ring: 'ring-blue-200'    },
  LOCKED:           { label: 'Locked',           bg: 'bg-violet-50',    text: 'text-violet-700',   border: 'border-violet-200',  dot: 'bg-violet-500',   ring: 'ring-violet-200'  },
  ARCHIVED:         { label: 'Archived',         bg: 'bg-slate-50',     text: 'text-slate-400',    border: 'border-slate-100',   dot: 'bg-slate-300',    ring: 'ring-slate-100'   },
  UNDER_AUDIT:      { label: 'Under Audit',      bg: 'bg-orange-50',    text: 'text-orange-700',   border: 'border-orange-200',  dot: 'bg-orange-500',   ring: 'ring-orange-200'  },
};

// ─── Period status configs ────────────────────────────────────────────────────
export const PERIOD_STATUS = {
  FUTURE:     { label: 'Future',     bg: 'bg-slate-100',   text: 'text-slate-400',   dot: 'bg-slate-300',   timeline: 'bg-slate-200'  },
  OPEN:       { label: 'Open',       bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', timeline: 'bg-emerald-500'},
  ADJUSTMENT: { label: 'Adjustment', bg: 'bg-sky-50',      text: 'text-sky-700',     dot: 'bg-sky-500',     timeline: 'bg-sky-400'    },
  CLOSED:     { label: 'Closed',     bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',    timeline: 'bg-blue-400'   },
  LOCKED:     { label: 'Locked',     bg: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-500',  timeline: 'bg-violet-500' },
  PENDING:    { label: 'Pending',    bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500',   timeline: 'bg-amber-400'  },
};

// ─── Year-end workflow steps ──────────────────────────────────────────────────
export const YEAR_END_STEPS = [
  { id: 1, label: 'Validate all transactions',   desc: 'Check for unposted journals and orphan entries',          icon: 'CheckSquare' },
  { id: 2, label: 'Reconcile sub-ledgers',       desc: 'AR, AP, Cash, Bank and payroll subledger reconciliation', icon: 'GitMerge'    },
  { id: 3, label: 'Freeze posting window',        desc: 'Prevent new entries for the fiscal year',                icon: 'Lock'        },
  { id: 4, label: 'Generate closing entries',    desc: 'Auto-close income & expense accounts to retained earnings',icon: 'FilePlus'   },
  { id: 5, label: 'Run compliance checks',       desc: 'GST, TDS, and statutory compliance validation',           icon: 'Shield'      },
  { id: 6, label: 'Obtain final approval',       desc: 'CFO / Finance head sign-off on closing balance',          icon: 'UserCheck'   },
  { id: 7, label: 'Lock fiscal year',             desc: 'Permanently lock all periods — no further changes',       icon: 'Lock'        },
];

// ─── Month names ──────────────────────────────────────────────────────────────
export const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
export const MONTH_FULL = [
  'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'March',
];

// ─── Generate 12 accounting periods from FY start ────────────────────────────
export function generatePeriods(startDate, existingPeriods = []) {
  const start = new Date(startDate);
  const now   = new Date();
  const periods = [];

  for (let i = 0; i < 12; i++) {
    const pStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const pEnd   = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
    const existing = existingPeriods.find(p =>
      new Date(p.start_date).getMonth() === pStart.getMonth() &&
      new Date(p.start_date).getFullYear() === pStart.getFullYear()
    );

    let status = 'FUTURE';
    if (existing?.status) {
      status = existing.status;
    } else if (pEnd < now) {
      status = 'CLOSED';
    } else if (pStart <= now && pEnd >= now) {
      status = 'OPEN';
    }

    periods.push({
      id:         existing?.id || `gen-${i}`,
      name:       `${MONTH_FULL[i]} ${pStart.getFullYear()}`,
      shortName:  MONTHS[i],
      month:      i,
      start_date: pStart.toISOString().slice(0, 10),
      end_date:   pEnd.toISOString().slice(0, 10),
      status,
      is_locked:  existing?.is_locked || status === 'LOCKED',
      isCurrent:  pStart <= now && pEnd >= now,
    });
  }
  return periods;
}

// ─── Derive FY metrics from periods ──────────────────────────────────────────
export function fyMetrics(fy) {
  const periods = fy.periods || generatePeriods(fy.start_date);
  return {
    total:   periods.length,
    open:    periods.filter(p => p.status === 'OPEN').length,
    closed:  periods.filter(p => p.status === 'CLOSED').length,
    locked:  periods.filter(p => p.status === 'LOCKED' || p.is_locked).length,
    pending: periods.filter(p => p.status === 'PENDING').length,
  };
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export function formatFYDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fyLabel(fy) {
  if (fy.name) return fy.name;
  const s = new Date(fy.start_date);
  const e = new Date(fy.end_date);
  return `FY ${s.getFullYear()}–${String(e.getFullYear()).slice(2)}`;
}

// ─── AI insights generator ────────────────────────────────────────────────────
export function generateAIInsights(fy, periods) {
  const insights = [];
  const metrics  = fyMetrics({ ...fy, periods });
  const now      = new Date();
  const endDate  = new Date(fy.end_date);
  const daysLeft = Math.floor((endDate - now) / 86400000);

  if (metrics.open > 3) {
    insights.push({ type: 'warning', title: 'Many periods still open', body: `${metrics.open} periods are open. Consider locking completed periods to prevent retroactive postings.` });
  }
  if (daysLeft > 0 && daysLeft <= 45 && fy.status !== 'CLOSED') {
    insights.push({ type: 'alert', title: `${daysLeft} days to year-end`, body: 'Begin year-end checklist now. Reconcile sub-ledgers and validate trial balance before close.' });
  }
  if (metrics.pending > 0) {
    insights.push({ type: 'error', title: `${metrics.pending} periods need attention`, body: 'Pending periods have unresolved transactions or missing approvals.' });
  }
  if (fy.status === 'ACTIVE' && metrics.closed === 12) {
    insights.push({ type: 'success', title: 'All periods closed', body: 'You can now run year-end closing entries and lock the fiscal year.' });
  }
  if (insights.length === 0) {
    insights.push({ type: 'info', title: 'Fiscal year looks healthy', body: 'No governance issues detected. Continue monitoring period closures.' });
  }
  return insights;
}

// ─── Mock fiscal years for development ───────────────────────────────────────
export const MOCK_FY = [
  {
    id: 'fy-2023', name: 'FY 2023–24',
    start_date: '2023-04-01', end_date: '2024-03-31',
    status: 'LOCKED', is_locked: true,
    closed_by: 'Anil Kumar', closed_at: '2024-04-15T10:30:00Z',
    branch_count: 5, branches_closed: 5, compliance_ok: true,
  },
  {
    id: 'fy-2024', name: 'FY 2024–25',
    start_date: '2024-04-01', end_date: '2025-03-31',
    status: 'CLOSED', is_locked: false,
    closed_by: 'Meera Nair', closed_at: '2025-04-08T09:15:00Z',
    branch_count: 5, branches_closed: 5, compliance_ok: true,
  },
  {
    id: 'fy-2025', name: 'FY 2025–26',
    start_date: '2025-04-01', end_date: '2026-03-31',
    status: 'ACTIVE', is_locked: false,
    closed_by: null, closed_at: null,
    branch_count: 5, branches_closed: 2, compliance_ok: false,
  },
  {
    id: 'fy-2026', name: 'FY 2026–27',
    start_date: '2026-04-01', end_date: '2027-03-31',
    status: 'DRAFT', is_locked: false,
    closed_by: null, closed_at: null,
    branch_count: 5, branches_closed: 0, compliance_ok: false,
  },
];

export const MOCK_BRANCHES = [
  { id: 'b1', name: 'Main Hospital',     code: 'MH', closed: true,  complianceOk: true  },
  { id: 'b2', name: 'North Wing',        code: 'NW', closed: true,  complianceOk: true  },
  { id: 'b3', name: 'Cancer Centre',     code: 'CC', closed: false, complianceOk: false },
  { id: 'b4', name: 'Diagnostics Lab',   code: 'DL', closed: false, complianceOk: true  },
  { id: 'b5', name: 'Pharmacy Division', code: 'PD', closed: false, complianceOk: false },
];
