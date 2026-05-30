import React, { useState, useMemo } from 'react';
import {
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Download, Search, X, Loader2
} from 'lucide-react';
import clsx from 'clsx';

/**
 * DataTable — reusable table with pagination, sorting, filtering, and export
 *
 * Props:
 *   columns       Array<{ key, label, render?, sortable?, width?, align? }>
 *   data          Array<object>
 *   isLoading     boolean
 *   total         number  — total records (for server-side pagination)
 *   page          number
 *   pageSize      number
 *   onPageChange  (page) => void
 *   onSearch      (term) => void  — if provided, shows search box
 *   onSort        ({ key, direction }) => void  — if provided, enables column sort
 *   onExport      () => void  — if provided, shows export button
 *   emptyMessage  string
 *   rowKey        string | (row) => string
 *   onRowClick    (row) => void
 *   actions       ReactNode  — toolbar actions slot
 */
export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  total = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  onSearch,
  onSort,
  onExport,
  emptyMessage = 'No records found.',
  rowKey = 'id',
  onRowClick,
  actions,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const totalPages = Math.ceil(total / pageSize) || 1;

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = (val) => {
    setSearchTerm(val);
    if (onSearch) onSearch(val);
  };

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = (col) => {
    if (!col.sortable || !onSort) return;
    const direction =
      sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: col.key, direction });
    onSort({ key: col.key, direction });
  };

  // ── Client-side sort (if no onSort) ──────────────────────────────────────
  const displayData = useMemo(() => {
    if (onSort) return data; // server-side
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const va = a[sortConfig.key];
      const vb = b[sortConfig.key];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortConfig.direction === 'desc' ? -cmp : cmp;
    });
  }, [data, sortConfig, onSort]);

  const getKey = (row, idx) =>
    typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] ?? idx);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
      {/* Toolbar */}
      {(onSearch || onExport || actions) && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100">
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-56"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          <div className="flex-1" />
          {actions}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortable && onSort !== undefined && 'cursor-pointer hover:text-slate-700 select-none',
                    col.width && `w-[${col.width}]`
                  )}
                  onClick={() => handleSort(col)}
                  style={col.width ? { width: col.width } : {}}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        <ChevronUp
                          className={clsx(
                            'w-3 h-3 -mb-1',
                            sortConfig.key === col.key && sortConfig.direction === 'asc'
                              ? 'text-brand-600'
                              : 'text-slate-300'
                          )}
                        />
                        <ChevronDown
                          className={clsx(
                            'w-3 h-3',
                            sortConfig.key === col.key && sortConfig.direction === 'desc'
                              ? 'text-brand-600'
                              : 'text-slate-300'
                          )}
                        />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, idx) => (
                <tr
                  key={getKey(row, idx)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={clsx(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-slate-50',
                    !onRowClick && 'hover:bg-slate-50/50'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        'px-4 py-3 text-slate-700',
                        col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : ''
                      )}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? <span className="text-slate-300">—</span>)
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(total > pageSize || totalPages > 1) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              icon={<ChevronLeft className="w-4 h-4" />}
            />
            {/* Page numbers */}
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={clsx(
                    'w-7 h-7 rounded text-xs font-medium transition-colors',
                    p === page
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {p}
                </button>
              )
            )}
            <PaginationButton
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              icon={<ChevronRight className="w-4 h-4" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationButton({ onClick, disabled, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-7 h-7 flex items-center justify-center rounded transition-colors',
        disabled
          ? 'text-slate-300 cursor-not-allowed'
          : 'text-slate-600 hover:bg-slate-100'
      )}
    >
      {icon}
    </button>
  );
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}
