'use strict';
// ─── Account type config ──────────────────────────────────────────────────────
export const TYPE_CONFIG = {
  ASSET:     { label: 'Assets',      color: 'blue',    bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    headerBg: 'bg-blue-600',   normalBalance: 'DEBIT'  },
  LIABILITY: { label: 'Liabilities', color: 'red',     bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500',     headerBg: 'bg-red-600',    normalBalance: 'CREDIT' },
  EQUITY:    { label: 'Equity',      color: 'violet',  bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500',  headerBg: 'bg-violet-600', normalBalance: 'CREDIT' },
  INCOME:    { label: 'Income',      color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', headerBg: 'bg-emerald-600',normalBalance: 'CREDIT' },
  EXPENSE:   { label: 'Expenses',    color: 'amber',   bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500',   headerBg: 'bg-amber-600',  normalBalance: 'DEBIT'  },
};

export const TYPE_ORDER = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

// ─── Fiscal year helpers ──────────────────────────────────────────────────────
export function currentFYDates() {
  const now = new Date();
  const fyStart = now.getMonth() >= 3
    ? new Date(now.getFullYear(), 3, 1)
    : new Date(now.getFullYear() - 1, 3, 1);
  const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31);
  return {
    from: fyStart.toISOString().slice(0, 10),
    to:   fyEnd  .toISOString().slice(0, 10),
    label: `FY ${fyStart.getFullYear()}–${String(fyStart.getFullYear() + 1).slice(2)}`,
  };
}

export const FY_PRESETS = () => {
  const cur = currentFYDates();
  const prevYear = new Date(cur.from);
  prevYear.setFullYear(prevYear.getFullYear() - 1);
  const prevFyFrom = prevYear.toISOString().slice(0, 10);
  const prevFyEnd  = new Date(cur.from);
  prevFyEnd.setDate(prevFyEnd.getDate() - 1);
  return [
    { label: cur.label,       from: cur.from, to: cur.to },
    { label: 'Previous Year', from: prevFyFrom, to: prevFyEnd.toISOString().slice(0, 10) },
    {
      label: 'Q1 (Apr–Jun)',
      from: cur.from,
      to: new Date(new Date(cur.from).getFullYear(), 5, 30).toISOString().slice(0, 10),
    },
  ];
};

// ─── Number helpers ───────────────────────────────────────────────────────────
export function fmt(n, decimals = 2) {
  if (n == null) return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(num));
}

export function fmtShort(n) {
  if (n == null) return '—';
  const num = Math.abs(parseFloat(n));
  if (isNaN(num)) return '—';
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)}Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)}L`;
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
}

export function sumField(rows, field) {
  return rows.reduce((s, r) => s + parseFloat(r[field] || 0), 0);
}

// ─── Hierarchy builder ────────────────────────────────────────────────────────
// Converts flat account rows into a three-level flat display list:
//   level 0 → account type  (row._kind = 'type')
//   level 1 → parent group  (row._kind = 'group')
//   level 2 → account leaf  (row._kind = 'account')
export function buildDisplayRows(accounts, expandedTypes, expandedGroups, showZero) {
  const byType = {};
  for (const acc of accounts) {
    const type = (acc.type || 'ASSET').toUpperCase();
    if (!byType[type]) byType[type] = {};
    const group = acc.parent_name || 'Ungrouped';
    if (!byType[type][group]) byType[type][group] = [];
    byType[type][group].push(acc);
  }

  const rows = [];
  for (const type of TYPE_ORDER) {
    const groups = byType[type];
    if (!groups) continue;

    // Aggregate type totals
    const allAccs = Object.values(groups).flat();
    const typeTotals = aggregateTotals(allAccs);

    if (!showZero && isAllZero(typeTotals)) continue;

    rows.push({ _kind: 'type', _type: type, _key: `type-${type}`, ...typeTotals });

    if (!expandedTypes.has(type)) continue;

    for (const [groupName, accs] of Object.entries(groups)) {
      const groupTotals = aggregateTotals(accs);
      if (!showZero && isAllZero(groupTotals)) continue;

      rows.push({ _kind: 'group', _type: type, _group: groupName, _key: `group-${type}-${groupName}`, ...groupTotals });

      if (!expandedGroups.has(`${type}::${groupName}`)) continue;

      for (const acc of accs) {
        if (!showZero && isAllZero(acc)) continue;
        rows.push({ _kind: 'account', _type: type, _group: groupName, _key: acc.account_id || acc.id || acc.code, ...acc });
      }
    }
  }
  return rows;
}

function aggregateTotals(accs) {
  return {
    opening_debit:  sumField(accs, 'opening_debit'),
    opening_credit: sumField(accs, 'opening_credit'),
    period_debit:   sumField(accs, 'period_debit'),
    period_credit:  sumField(accs, 'period_credit'),
    closing_debit:  sumField(accs, 'closing_debit'),
    closing_credit: sumField(accs, 'closing_credit'),
  };
}

function isAllZero(row) {
  return ['opening_debit','opening_credit','period_debit','period_credit','closing_debit','closing_credit']
    .every(f => !parseFloat(row[f] || 0));
}

// ─── Grand totals ─────────────────────────────────────────────────────────────
export function calcGrandTotals(accounts) {
  return {
    opening_debit:  sumField(accounts, 'opening_debit'),
    opening_credit: sumField(accounts, 'opening_credit'),
    period_debit:   sumField(accounts, 'period_debit'),
    period_credit:  sumField(accounts, 'period_credit'),
    closing_debit:  sumField(accounts, 'closing_debit'),
    closing_credit: sumField(accounts, 'closing_credit'),
  };
}

export function calcDifference(totals) {
  const d = Math.abs((totals.closing_debit || 0) - (totals.closing_credit || 0));
  return parseFloat(d.toFixed(2));
}

// ─── Filter helper ────────────────────────────────────────────────────────────
export function applyTBFilters(accounts, search, typeFilter) {
  let result = accounts;
  if (typeFilter) result = result.filter(a => (a.type || '').toUpperCase() === typeFilter);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.code || '').toLowerCase().includes(q) ||
      (a.parent_name || '').toLowerCase().includes(q)
    );
  }
  return result;
}
