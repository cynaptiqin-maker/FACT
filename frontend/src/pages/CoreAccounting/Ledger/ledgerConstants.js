// ─── Type configuration ───────────────────────────────────────────────────────
export const TYPE_CONFIG = {
  asset: {
    label: 'Asset',
    bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200',
    dot: 'bg-blue-500', normalBalance: 'Dr',
  },
  liability: {
    label: 'Liability',
    bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200',
    dot: 'bg-red-500', normalBalance: 'Cr',
  },
  equity: {
    label: 'Equity',
    bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200',
    dot: 'bg-violet-500', normalBalance: 'Cr',
  },
  income: {
    label: 'Income',
    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
    dot: 'bg-emerald-500', normalBalance: 'Cr',
  },
  expense: {
    label: 'Expense',
    bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
    dot: 'bg-amber-500', normalBalance: 'Dr',
  },
};

// ─── Status configuration ─────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  inactive: { label: 'Inactive', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
  frozen: { label: 'Frozen', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
};

// ─── Quick filter pills ───────────────────────────────────────────────────────
export const QUICK_FILTERS = [
  { id: 'all', label: 'All Ledgers', type: null, nameContains: null },
  { id: 'debtors', label: 'Sundry Debtors', type: 'asset', nameContains: null },
  { id: 'creditors', label: 'Sundry Creditors', type: 'liability', nameContains: null },
  { id: 'cash', label: 'Cash', type: null, nameContains: 'cash' },
  { id: 'bank', label: 'Bank', type: null, nameContains: 'bank' },
  { id: 'expenses', label: 'Expenses', type: 'expense', nameContains: null },
  { id: 'income', label: 'Income', type: 'income', nameContains: null },
  { id: 'tax', label: 'Tax', type: null, nameContains: 'tax' },
];

// ─── Group options ────────────────────────────────────────────────────────────
export const GROUP_OPTIONS = [
  'Current Assets', 'Fixed Assets', 'Investments', 'Loans & Advances',
  'Current Liabilities', 'Long-term Liabilities', 'Provisions',
  'Capital Account', 'Reserves & Surplus',
  'Direct Income', 'Indirect Income',
  'Direct Expenses', 'Indirect Expenses', 'Manufacturing Expenses',
  'Sundry Debtors', 'Sundry Creditors',
  'Cash-in-Hand', 'Bank Accounts',
  'Duties & Taxes', 'Statutory Liabilities',
  'Misc. Expenses (Asset)',
];

// ─── Currency options ─────────────────────────────────────────────────────────
export const CURRENCY_OPTIONS = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

// ─── Voucher type labels ──────────────────────────────────────────────────────
export const VOUCHER_TYPE_LABELS = {
  JV: 'Journal Voucher',
  PV: 'Payment Voucher',
  RV: 'Receipt Voucher',
  CV: 'Contra Voucher',
  SV: 'Sales Voucher',
  PUR: 'Purchase Voucher',
  DN: 'Debit Note',
  CN: 'Credit Note',
};

// ─── Formatters ───────────────────────────────────────────────────────────────
export function formatINR(amount) {
  if (amount == null) return '—';
  const n = parseFloat(amount);
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(n));
}

export function formatBalance(amount) {
  if (amount == null) return { display: '—', drCr: null, positive: true };
  const n = parseFloat(amount);
  if (isNaN(n)) return { display: '—', drCr: null, positive: true };
  if (n === 0) return { display: '0.00', drCr: '', positive: true };
  return {
    display: formatINR(n),
    drCr: n >= 0 ? 'Dr' : 'Cr',
    positive: n >= 0,
  };
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

// ─── Derive ledger status ─────────────────────────────────────────────────────
export function getLedgerStatus(account) {
  if (account.is_frozen) return 'frozen';
  if (account.is_active === false) return 'inactive';
  return 'active';
}

// ─── Filter helper ────────────────────────────────────────────────────────────
export function applyFilters(accounts, search, filters, quickFilter) {
  let result = [...accounts];

  // Quick filter
  if (quickFilter && quickFilter.id !== 'all') {
    if (quickFilter.type) result = result.filter(a => a.type === quickFilter.type);
    if (quickFilter.nameContains)
      result = result.filter(a =>
        (a.name || '').toLowerCase().includes(quickFilter.nameContains.toLowerCase())
      );
  }

  // Search
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.code || '').toLowerCase().includes(q) ||
      (a.gstin || '').toLowerCase().includes(q)
    );
  }

  // Dropdown filters
  if (filters.type) result = result.filter(a => a.type === filters.type);
  if (filters.status) {
    if (filters.status === 'active') result = result.filter(a => a.is_active !== false && !a.is_frozen);
    if (filters.status === 'inactive') result = result.filter(a => a.is_active === false);
    if (filters.status === 'frozen') result = result.filter(a => a.is_frozen);
  }
  if (filters.group) result = result.filter(a => a.parent_name === filters.group);

  // Toggle filters
  if (filters.activeOnly) result = result.filter(a => a.is_active !== false);
  if (filters.showFrozen) result = result.filter(a => a.is_frozen);

  return result;
}

// ─── Sort helper ──────────────────────────────────────────────────────────────
export function applySort(accounts, sortKey, sortDir) {
  return [...accounts].sort((a, b) => {
    let av = a[sortKey];
    let bv = b[sortKey];
    if (sortKey === 'current_balance') {
      av = parseFloat(av) || 0;
      bv = parseFloat(bv) || 0;
    } else {
      av = (av || '').toString().toLowerCase();
      bv = (bv || '').toString().toLowerCase();
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}
