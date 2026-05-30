import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  MoreHorizontal, Edit2, Eye, Trash2, Lock, Unlock,
  Loader2, BookOpen, ChevronLeft, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { TYPE_CONFIG, STATUS_CONFIG, formatINR, formatDate, getLedgerStatus } from './ledgerConstants';

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ column, sort }) {
  if (sort.key !== column) return <ChevronsUpDown className="w-3 h-3 text-slate-300" />;
  return sort.dir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-brand-600" />
    : <ChevronDown className="w-3 h-3 text-brand-600" />;
}

// ─── Type badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return <span className="text-xs text-slate-400">{type || '—'}</span>;
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border', cfg.bg, cfg.text, cfg.border)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ account }) {
  const status = getLedgerStatus(account);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Balance cell ─────────────────────────────────────────────────────────────
function BalanceCell({ amount }) {
  if (amount == null) return <span className="text-slate-300 tabular-nums">—</span>;
  const n = parseFloat(amount);
  if (isNaN(n)) return <span className="text-slate-300 tabular-nums">—</span>;
  const isZero = n === 0;
  const isDr = n > 0;
  return (
    <span className={clsx('tabular-nums font-medium', isZero ? 'text-slate-400' : isDr ? 'text-slate-800' : 'text-slate-800')}>
      {formatINR(n)}
      {!isZero && (
        <span className={clsx('ml-1 text-xs font-semibold', isDr ? 'text-blue-500' : 'text-red-400')}>
          {isDr ? 'Dr' : 'Cr'}
        </span>
      )}
    </span>
  );
}

// ─── Row action menu ──────────────────────────────────────────────────────────
function RowActions({ account, onEdit, onView, onDelete, onFreeze }) {
  const [open, setOpen] = useState(false);
  const isFrozen = account.is_frozen;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onView(account); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" /> View Ledger
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(account); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" /> Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onFreeze(account); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {isFrozen
                ? <><Unlock className="w-3.5 h-3.5 text-emerald-500" /> Unfreeze</>
                : <><Lock className="w-3.5 h-3.5 text-amber-500" /> Freeze</>
              }
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(account); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ hasSearch }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
        <BookOpen className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">
        {hasSearch ? 'No ledgers match your search' : 'No ledgers found'}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        {hasSearch ? 'Try different search terms or clear filters' : 'Create your first ledger to get started'}
      </p>
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[44, 24, 28, 20, 20, 16, 20, 16, 20].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-3 bg-slate-100 rounded animate-pulse`} style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

const COLUMNS = [
  { key: 'name', label: 'Ledger Name', sortable: true },
  { key: 'code', label: 'Code', sortable: true },
  { key: 'parent_name', label: 'Group', sortable: true },
  { key: 'opening_balance', label: 'Opening Bal.', sortable: true, align: 'right' },
  { key: 'current_balance', label: 'Current Bal.', sortable: true, align: 'right' },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'is_active', label: 'Status', sortable: false },
  { key: 'updated_at', label: 'Last Modified', sortable: true },
  { key: 'actions', label: '', sortable: false },
];

const PAGE_SIZES = [15, 25, 50, 100];

export default function LedgerTable({
  data,
  isLoading,
  sort,
  onSort,
  onRowClick,
  onEdit,
  onDelete,
  onFreeze,
  selectedRows,
  onSelectRow,
  onSelectAll,
  search,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = Math.ceil((data?.length || 0) / pageSize);
  const start = (page - 1) * pageSize;
  const pageData = (data || []).slice(start, start + pageSize);

  const allSelected = pageData.length > 0 && pageData.every(r => selectedRows.has(r.id));
  const someSelected = pageData.some(r => selectedRows.has(r.id));

  const handleSort = (key) => {
    if (!COLUMNS.find(c => c.key === key)?.sortable) return;
    onSort({ key, dir: sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc' });
    setPage(1);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      {/* Bulk action bar */}
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-50 border-b border-brand-100">
          <span className="text-xs font-semibold text-brand-700">
            {selectedRows.size} selected
          </span>
          <button className="text-xs text-brand-600 hover:text-brand-800 font-medium">Export</button>
          <button className="text-xs text-amber-600 hover:text-amber-800 font-medium">Freeze all</button>
          <button className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
          <button
            onClick={() => onSelectAll(false)}
            className="ml-auto text-xs text-slate-500 hover:text-slate-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Sticky header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50 border-b border-slate-200">
              {/* Checkbox */}
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => el && (el.indeterminate = someSelected && !allSelected)}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                />
              </th>

              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={clsx(
                    'px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap',
                    col.align === 'right' ? 'text-right' : 'text-left',
                    col.sortable && 'cursor-pointer select-none hover:text-slate-700',
                    col.key === 'actions' && 'w-12',
                  )}
                >
                  {col.sortable ? (
                    <span className="flex items-center gap-1">
                      {col.align === 'right' && <SortIcon column={col.key} sort={sort} />}
                      {col.label}
                      {col.align !== 'right' && <SortIcon column={col.key} sort={sort} />}
                    </span>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1}>
                  <EmptyState hasSearch={!!search} />
                </td>
              </tr>
            ) : (
              pageData.map((account) => (
                <tr
                  key={account.id}
                  onClick={() => onRowClick(account)}
                  className={clsx(
                    'hover:bg-slate-50/70 transition-colors cursor-pointer group',
                    selectedRows.has(account.id) && 'bg-brand-50/40',
                    account.is_frozen && 'opacity-75',
                  )}
                >
                  {/* Checkbox */}
                  <td className="w-10 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(account.id)}
                      onChange={(e) => onSelectRow(account.id, e.target.checked)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                    />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {account.is_frozen && <Lock className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                      <div>
                        <p className="font-medium text-slate-800 group-hover:text-brand-700 transition-colors">
                          {account.name}
                        </p>
                        {account.alias && (
                          <p className="text-xs text-slate-400 mt-0.5">{account.alias}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Code */}
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                      {account.code || '—'}
                    </span>
                  </td>

                  {/* Group */}
                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    {account.parent_name || '—'}
                  </td>

                  {/* Opening balance */}
                  <td className="px-4 py-3.5 text-right">
                    <BalanceCell amount={account.opening_balance} />
                  </td>

                  {/* Current balance */}
                  <td className="px-4 py-3.5 text-right">
                    <BalanceCell amount={account.current_balance} />
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3.5">
                    <TypeBadge type={account.type} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge account={account} />
                  </td>

                  {/* Last modified */}
                  <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(account.updated_at)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      account={account}
                      onView={onRowClick}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onFreeze={onFreeze}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && (data?.length || 0) > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-slate-200 rounded px-1.5 py-1 text-xs bg-white"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>per page · {(data?.length || 0).toLocaleString()} total</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-xs text-slate-600 px-2 min-w-20 text-center">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
