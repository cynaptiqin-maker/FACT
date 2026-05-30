import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal,
  Eye, GitBranch, History, Paperclip, RefreshCw, Wrench,
  AlertTriangle, CheckSquare, Square, Download, Trash2,
  Sparkles, ArrowRight, Loader2, X,
} from 'lucide-react';
import clsx from 'clsx';
import {
  LEDGER_ENTRIES, fmtCurrency, fmtDate,
  statusStyle, reconStyle, voucherStyle,
} from './glConstants';

// ─── Column definitions ────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'date',                label: 'Date',         width: 88,  sortable: true,  sticky: false },
  { key: 'voucherNo',           label: 'Voucher',      width: 148, sortable: true,  sticky: false },
  { key: 'account',             label: 'Account',      width: 190, sortable: true,  sticky: false },
  { key: 'narration',           label: 'Narration',    width: 220, sortable: false, sticky: false },
  { key: 'branch',              label: 'Branch',       width: 100, sortable: true,  sticky: false },
  { key: 'department',          label: 'Dept',         width: 100, sortable: true,  sticky: false },
  { key: 'debit',               label: 'Debit (₹)',    width: 120, sortable: true,  sticky: false, align: 'right' },
  { key: 'credit',              label: 'Credit (₹)',   width: 120, sortable: true,  sticky: false, align: 'right' },
  { key: 'balance',             label: 'Balance (₹)',  width: 130, sortable: false, sticky: false, align: 'right' },
  { key: 'status',              label: 'Status',       width: 95,  sortable: true,  sticky: false },
  { key: 'reconciliationStatus',label: 'Recon',        width: 108, sortable: true,  sticky: false },
  { key: 'sourceModule',        label: 'Source',       width: 120, sortable: true,  sticky: false },
  { key: 'createdBy',           label: 'By',           width: 100, sortable: false, sticky: false },
  { key: 'actions',             label: '',             width: 48,  sortable: false, sticky: false },
];

// ─── Sort indicator ───────────────────────────────────────────────────────────
function SortIcon({ col, sort }) {
  if (!col.sortable) return null;
  if (sort.key !== col.key) return <ChevronsUpDown className="w-3 h-3 text-slate-300 ml-1 flex-shrink-0" />;
  return sort.dir === 'asc'
    ? <ChevronUp   className="w-3 h-3 text-brand-600 ml-1 flex-shrink-0" />
    : <ChevronDown className="w-3 h-3 text-brand-600 ml-1 flex-shrink-0" />;
}

// ─── Row action menu ──────────────────────────────────────────────────────────
function RowMenu({ entry, onSelect }) {
  const [open, setOpen] = useState(false);
  const ACTIONS = [
    { icon: Eye,         label: 'View Details',       action: 'view'      },
    { icon: GitBranch,   label: 'Trace Flow',          action: 'flow'      },
    { icon: History,     label: 'Audit Trail',         action: 'audit'     },
    { icon: RefreshCw,   label: 'Reconcile',           action: 'reconcile' },
    { icon: Paperclip,   label: `Attachments (${entry.attachments})`, action: 'attach' },
    { icon: Sparkles,    label: 'AI Explain',          action: 'ai'        },
    { icon: Wrench,      label: 'Create Adjustment',   action: 'adjust'    },
  ];

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400
          hover:text-slate-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 top-8 w-48 bg-white rounded-xl border border-slate-200
                shadow-xl z-50 overflow-hidden py-1"
            >
              {ACTIONS.map(a => {
                const Ic = a.icon;
                return (
                  <button
                    key={a.action}
                    onClick={e => { e.stopPropagation(); onSelect(a.action, entry); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700
                      hover:bg-slate-50 transition-colors"
                  >
                    <Ic className="w-3.5 h-3.5 text-slate-400" />
                    {a.label}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Cell renderers ───────────────────────────────────────────────────────────
function renderCell(col, entry) {
  switch (col.key) {
    case 'date':
      return (
        <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
          {fmtDate(entry.date)}
        </span>
      );

    case 'voucherNo':
      return (
        <div className="flex items-center gap-1.5">
          <span className={clsx(
            'inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border leading-none',
            voucherStyle(entry.voucherType.color),
          )}>
            {entry.voucherType.id}
          </span>
          <span className="text-[11px] font-mono text-slate-700 truncate max-w-[80px]" title={entry.voucherNo}>
            {entry.voucherNo}
          </span>
        </div>
      );

    case 'account':
      return (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate" title={entry.account.label}>
            {entry.account.label}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">{entry.account.code}</p>
        </div>
      );

    case 'narration':
      return (
        <p className="text-xs text-slate-600 truncate max-w-[210px] leading-snug" title={entry.narration}>
          {entry.narration}
        </p>
      );

    case 'branch':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600
          rounded text-[10px] font-semibold">
          {entry.branch.short}
        </span>
      );

    case 'department':
      return (
        <span className="text-xs text-slate-600 truncate">{entry.department.label}</span>
      );

    case 'debit':
      return entry.debit > 0 ? (
        <span className="font-mono text-xs font-semibold text-red-600 whitespace-nowrap">
          {fmtCurrency(entry.debit)}
        </span>
      ) : <span className="text-slate-300 text-xs font-mono">—</span>;

    case 'credit':
      return entry.credit > 0 ? (
        <span className="font-mono text-xs font-semibold text-emerald-600 whitespace-nowrap">
          {fmtCurrency(entry.credit)}
        </span>
      ) : <span className="text-slate-300 text-xs font-mono">—</span>;

    case 'balance':
      return (
        <span className={clsx(
          'font-mono text-xs font-bold whitespace-nowrap',
          entry.balance >= 0 ? 'text-slate-800' : 'text-red-700',
        )}>
          {fmtCurrency(entry.balance, true)}
        </span>
      );

    case 'status':
      return (
        <span className={clsx(
          'inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize',
          statusStyle(entry.status),
        )}>
          {entry.status}
        </span>
      );

    case 'reconciliationStatus':
      return (
        <span className={clsx(
          'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium capitalize',
          reconStyle(entry.reconciliationStatus),
        )}>
          {entry.reconciliationStatus === 'auto-matched' ? 'Auto' : entry.reconciliationStatus}
        </span>
      );

    case 'sourceModule':
      return (
        <span className="text-[11px] text-slate-500 truncate">{entry.sourceModule}</span>
      );

    case 'createdBy':
      return (
        <span className="text-[11px] text-slate-500 truncate">{entry.createdBy}</span>
      );

    default:
      return null;
  }
}

// ─── Expanded entry detail row ─────────────────────────────────────────────────
function ExpandedRow({ entry, onAction }) {
  const fields = [
    { label: 'Cost Center',  value: entry.costCenter    },
    { label: 'Reference',    value: entry.reference     },
    { label: 'Approved By',  value: entry.approvedBy || 'Pending' },
    { label: 'Attachments',  value: entry.attachments   },
    { label: 'Linked',       value: `${entry.linkedEntries} entries` },
    { label: 'Risk Score',   value: `${entry.riskScore}/100` },
  ];

  return (
    <tr className="bg-slate-50/80">
      <td colSpan={COLUMNS.length + 1} className="px-6 py-3 border-b border-slate-100">
        <div className="flex flex-wrap gap-4 items-center">
          {fields.map(f => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{f.label}:</span>
              <span className="text-xs text-slate-700 font-mono">{f.value}</span>
            </div>
          ))}
          <div className="ml-auto flex gap-2">
            {['view', 'flow', 'audit', 'ai'].map(a => (
              <button
                key={a}
                onClick={() => onAction(a, entry)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold
                  bg-white border border-slate-200 text-slate-600 hover:bg-brand-800 hover:text-pearl-100
                  hover:border-brand-700 transition-all"
              >
                {a === 'view'  && <><Eye className="w-3 h-3" /> Details</>}
                {a === 'flow'  && <><GitBranch className="w-3 h-3" /> Flow</>}
                {a === 'audit' && <><History className="w-3 h-3" /> Audit</>}
                {a === 'ai'    && <><Sparkles className="w-3 h-3" /> AI</>}
              </button>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Bulk action toolbar ───────────────────────────────────────────────────────
function BulkActionBar({ count, onReconcile, onExport, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-3 px-5 py-3 bg-brand-800 text-pearl-100
        rounded-2xl shadow-2xl border border-brand-700">
        <CheckSquare className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold">{count} selected</span>
        <div className="w-px h-4 bg-brand-600" />
        <button
          onClick={onReconcile}
          className="flex items-center gap-1.5 text-xs font-semibold hover:text-cyan-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reconcile
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 text-xs font-semibold hover:text-cyan-300 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Discard
        </button>
        <button onClick={onClear} className="text-pearl-100/50 hover:text-pearl-100 ml-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Grid ────────────────────────────────────────────────────────────────
export default function GLGrid({ filters, onSelectEntry }) {
  const [sort,     setSort]     = useState({ key: 'date', dir: 'desc' });
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...LEDGER_ENTRIES];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(e =>
        e.narration.toLowerCase().includes(q)     ||
        e.voucherNo.toLowerCase().includes(q)     ||
        e.account.label.toLowerCase().includes(q) ||
        e.reference.toLowerCase().includes(q)     ||
        e.createdBy.toLowerCase().includes(q),
      );
    }
    if (filters.branch && filters.branch !== 'all') {
      data = data.filter(e => e.branch.id === filters.branch);
    }
    if (filters.dept && filters.dept !== 'all') {
      data = data.filter(e => e.department.id === filters.dept);
    }
    if (filters.vtype && filters.vtype !== 'all') {
      data = data.filter(e => e.voucherType.id === filters.vtype);
    }
    if (filters.status && filters.status !== 'all') {
      data = data.filter(e => e.status === filters.status);
    }
    if (filters.recon && filters.recon !== 'all') {
      data = data.filter(e => e.reconciliationStatus === filters.recon);
    }
    if (filters.source && filters.source !== 'all') {
      data = data.filter(e => e.sourceModule === filters.source);
    }
    if (filters.quick === 'anomaly') {
      data = data.filter(e => e.isAnomaly);
    }
    if (filters.quick === 'pending') {
      data = data.filter(e => e.status === 'pending');
    }
    if (filters.quick === 'unreconciled') {
      data = data.filter(e => e.reconciliationStatus === 'unreconciled');
    }
    if (filters.quick === 'manual') {
      data = data.filter(e => e.sourceModule === 'Manual Entry');
    }

    // Sort
    data.sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'object') { av = av?.label || ''; bv = bv?.label || ''; }
      if (sort.dir === 'asc') return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

    return data;
  }, [filters, sort]);

  const visible = filtered.slice(0, visibleCount);

  // Load more
  const loadMore = useCallback(() => {
    if (isLoading || visibleCount >= filtered.length) return;
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount(p => Math.min(p + 30, filtered.length));
      setIsLoading(false);
    }, 400);
  }, [isLoading, visibleCount, filtered.length]);

  // Intersection observer for infinite scroll
  React.useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  function toggleSort(col) {
    if (!col.sortable) return;
    setSort(p => p.key === col.key
      ? { key: col.key, dir: p.dir === 'asc' ? 'desc' : 'asc' }
      : { key: col.key, dir: 'desc' },
    );
  }

  const allSelected = visible.length > 0 && visible.every(e => selected.has(e.id));
  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(visible.map(e => e.id)));
  }
  function toggleRow(id) {
    setSelected(p => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const periodDebit  = visible.reduce((s, e) => s + e.debit, 0);
  const periodCredit = visible.reduce((s, e) => s + e.credit, 0);
  const periodNet    = periodCredit - periodDebit;

  return (
    <div className="flex flex-col h-full">
      {/* ── Summary ribbon ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-brand-800/5 to-transparent
        border-b border-slate-100 text-xs flex-wrap">
        <span className="text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-700">{filtered.length.toLocaleString()}</span> entries
        </span>
        <div className="flex items-center gap-1.5 text-red-600">
          <span className="font-medium text-slate-500">Total Debit:</span>
          <span className="font-bold font-mono">{fmtCurrency(periodDebit, true)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600">
          <span className="font-medium text-slate-500">Total Credit:</span>
          <span className="font-bold font-mono">{fmtCurrency(periodCredit, true)}</span>
        </div>
        <div className={clsx('flex items-center gap-1.5 font-bold font-mono',
          periodNet >= 0 ? 'text-cyan-700' : 'text-red-700')}>
          <span className="font-medium text-slate-500">Net:</span>
          {periodNet >= 0 ? '+' : ''}{fmtCurrency(periodNet, true)}
        </div>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
        <table className="w-full border-collapse" style={{ minWidth: 1400 }}>
          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-200">
              {/* Checkbox */}
              <th className="w-10 px-3 py-3 text-left">
                <button onClick={toggleAll} className="text-slate-400 hover:text-brand-700">
                  {allSelected
                    ? <CheckSquare className="w-3.5 h-3.5 text-brand-700" />
                    : <Square className="w-3.5 h-3.5" />
                  }
                </button>
              </th>
              {/* Anomaly indicator col */}
              <th className="w-5 px-1" />
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width, minWidth: col.width }}
                  onClick={() => toggleSort(col)}
                  className={clsx(
                    'px-3 py-3 text-left select-none',
                    col.sortable && 'cursor-pointer hover:bg-slate-100 transition-colors',
                    col.align === 'right' && 'text-right',
                    col.key === 'actions' && 'text-center',
                  )}
                >
                  <div className={clsx(
                    'flex items-center text-[10px] font-semibold uppercase tracking-wider text-slate-500',
                    col.align === 'right' && 'justify-end',
                  )}>
                    {col.label}
                    <SortIcon col={col} sort={sort} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {visible.map((entry, idx) => {
              const isSelected = selected.has(entry.id);
              const isExpanded = expanded === entry.id;

              return (
                <React.Fragment key={entry.id}>
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx < 15 ? idx * 0.015 : 0 }}
                    onClick={() => {
                      setExpanded(p => p === entry.id ? null : entry.id);
                      onSelectEntry(entry);
                    }}
                    className={clsx(
                      'border-b border-slate-50 cursor-pointer transition-all group',
                      entry.isAnomaly
                        ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-2 border-l-rose-300'
                        : isSelected
                          ? 'bg-nile-50'
                          : 'bg-white hover:bg-slate-50/80',
                      isExpanded && 'bg-slate-50/90',
                    )}
                  >
                    {/* Checkbox */}
                    <td className="w-10 px-3 py-2.5" onClick={e => { e.stopPropagation(); toggleRow(entry.id); }}>
                      {isSelected
                        ? <CheckSquare className="w-3.5 h-3.5 text-brand-700" />
                        : <Square className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400" />
                      }
                    </td>

                    {/* Anomaly dot */}
                    <td className="w-5 px-1">
                      {entry.isAnomaly && (
                        <span title="Anomaly detected">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                        </span>
                      )}
                    </td>

                    {/* Data cells */}
                    {COLUMNS.map(col => (
                      <td
                        key={col.key}
                        style={{ width: col.width, minWidth: col.width }}
                        className={clsx(
                          'px-3 py-2.5',
                          col.align === 'right' && 'text-right',
                          col.key === 'actions' && 'text-center',
                        )}
                      >
                        {col.key === 'actions'
                          ? <RowMenu entry={entry} onSelect={(a, e) => {
                              onSelectEntry(e);
                            }} />
                          : renderCell(col, entry)
                        }
                      </td>
                    ))}
                  </motion.tr>

                  {/* Expanded detail row */}
                  <AnimatePresence>
                    {isExpanded && (
                      <ExpandedRow
                        key={`exp-${entry.id}`}
                        entry={entry}
                        onAction={(a, e) => onSelectEntry(e)}
                      />
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}

            {/* Infinite scroll trigger */}
            {visibleCount < filtered.length && (
              <tr ref={loaderRef}>
                <td colSpan={COLUMNS.length + 2} className="py-6 text-center">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading more entries…
                    </div>
                  ) : (
                    <button
                      onClick={loadMore}
                      className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-lg border border-slate-200
                        text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Load more <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </td>
              </tr>
            )}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="py-16 text-center">
                  <div className="text-slate-400 text-sm">No ledger entries match your filters.</div>
                  <p className="text-xs text-slate-300 mt-1">Try adjusting the search or clearing filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Bulk action bar ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <BulkActionBar
            count={selected.size}
            onReconcile={() => {}}
            onExport={() => {}}
            onClear={() => setSelected(new Set())}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
