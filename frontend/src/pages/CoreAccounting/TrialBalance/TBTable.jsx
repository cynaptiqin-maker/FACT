import React, { useCallback } from 'react';
import {
  ChevronRight, ChevronDown, ChevronUp, ChevronsUpDown,
  BookOpen, ArrowUpRight,
} from 'lucide-react';
import clsx from 'clsx';
import { TYPE_CONFIG, fmt, fmtShort } from './tbConstants';

// ─── Amount cell ──────────────────────────────────────────────────────────────
function AmtCell({ value, muted, highlight }) {
  const n = parseFloat(value || 0);
  if (!n) return <span className="text-slate-300 tabular-nums text-right block">—</span>;
  return (
    <span className={clsx(
      'tabular-nums text-right block',
      highlight ? 'text-red-600 font-semibold' : muted ? 'text-slate-500' : 'text-slate-800 font-medium',
    )}>
      {fmt(n)}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRows({ cols }) {
  return Array.from({ length: 10 }).map((_, i) => (
    <tr key={i} className="border-b border-slate-50">
      <td className="px-4 py-3.5 w-8" />
      <td className="px-3 py-3.5">
        <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${30 + (i % 5) * 10}%` }} />
      </td>
      {Array.from({ length: cols - 2 }).map((_, j) => (
        <td key={j} className="px-3 py-3.5">
          <div className="h-3 bg-slate-100 rounded animate-pulse ml-auto" style={{ width: `${40 + (j % 3) * 15}%` }} />
        </td>
      ))}
    </tr>
  ));
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ hasSearch }) {
  return (
    <tr>
      <td colSpan={20}>
        <div className="flex flex-col items-center justify-center py-14">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            {hasSearch ? 'No accounts match your search' : 'No data for selected period'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {hasSearch ? 'Try different terms or clear the search' : 'Adjust the date range or toggle "Show zero balances"'}
          </p>
        </div>
      </td>
    </tr>
  );
}

// ─── Column header ────────────────────────────────────────────────────────────
function ColHeader({ label, sub, sort, colKey, onSort, right }) {
  const active = sort?.key === colKey;
  return (
    <th
      className={clsx(
        'px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap',
        right ? 'text-right' : 'text-left',
        onSort && 'cursor-pointer select-none hover:text-slate-700',
      )}
      onClick={() => onSort?.(colKey)}
    >
      <span className={clsx('inline-flex items-center gap-1', right && 'justify-end w-full')}>
        {label}
        {sub && <span className="text-slate-400 normal-case font-normal">({sub})</span>}
        {onSort && (
          active
            ? (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-600" /> : <ChevronDown className="w-3 h-3 text-brand-600" />)
            : <ChevronsUpDown className="w-3 h-3 text-slate-300" />
        )}
      </span>
    </th>
  );
}

// ─── Grand totals row ─────────────────────────────────────────────────────────
function TotalsRow({ totals, opts, diff, balanced }) {
  return (
    <tr className={clsx(
      'border-t-2 font-semibold',
      balanced ? 'border-emerald-300 bg-emerald-50/50' : 'border-red-300 bg-red-50/40',
    )}>
      <td colSpan={opts.showOpening ? 3 : 2} className="px-4 py-3">
        <span className={clsx('text-sm', balanced ? 'text-emerald-700' : 'text-red-700')}>
          Grand Total {balanced ? '✓ Balanced' : `⚠ Difference ₹${fmt(diff)}`}
        </span>
      </td>
      {opts.showOpening && (
        <>
          <td className="px-3 py-3 text-right"><AmtCell value={totals.opening_debit} /></td>
          <td className="px-3 py-3 text-right"><AmtCell value={totals.opening_credit} /></td>
        </>
      )}
      {opts.showPeriod && (
        <>
          <td className="px-3 py-3 text-right"><AmtCell value={totals.period_debit} /></td>
          <td className="px-3 py-3 text-right"><AmtCell value={totals.period_credit} /></td>
        </>
      )}
      <td className="px-3 py-3 text-right">
        <AmtCell value={totals.closing_debit} highlight={!balanced} />
      </td>
      <td className="px-3 py-3 text-right">
        <AmtCell value={totals.closing_credit} highlight={!balanced} />
      </td>
    </tr>
  );
}

// ─── Main table ───────────────────────────────────────────────────────────────
export default function TBTable({
  displayRows,
  grandTotals,
  diff,
  balanced,
  opts,
  sort,
  onSort,
  expandedTypes,
  expandedGroups,
  onToggleType,
  onToggleGroup,
  onLedgerClick,
  isLoading,
  search,
}) {
  const colCount = 2
    + (opts.showOpening ? 2 : 0)
    + (opts.showPeriod  ? 2 : 0)
    + 2; // always show closing

  const renderRow = useCallback((row) => {
    // ── Type header row ──────────────────────────────────────────────────────
    if (row._kind === 'type') {
      const cfg = TYPE_CONFIG[row._type] || {};
      const expanded = expandedTypes.has(row._type);
      return (
        <tr
          key={row._key}
          onClick={() => onToggleType(row._type)}
          className={clsx(
            'cursor-pointer border-b border-slate-100 group',
            cfg.bg, 'hover:brightness-95 transition-all',
          )}
        >
          <td className="px-4 py-3 w-8">
            <div className={clsx('w-5 h-5 rounded flex items-center justify-center', cfg.headerBg, 'text-white')}>
              {expanded
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRight className="w-3 h-3" />}
            </div>
          </td>
          <td className="px-3 py-3">
            <span className={clsx('text-sm font-bold uppercase tracking-wide', cfg.text)}>
              {cfg.label}
            </span>
          </td>
          {opts.showOpening && (
            <>
              <td className="px-3 py-3 text-right"><AmtCell value={row.opening_debit} /></td>
              <td className="px-3 py-3 text-right"><AmtCell value={row.opening_credit} /></td>
            </>
          )}
          {opts.showPeriod && (
            <>
              <td className="px-3 py-3 text-right"><AmtCell value={row.period_debit} /></td>
              <td className="px-3 py-3 text-right"><AmtCell value={row.period_credit} /></td>
            </>
          )}
          <td className="px-3 py-3 text-right"><AmtCell value={row.closing_debit} /></td>
          <td className="px-3 py-3 text-right"><AmtCell value={row.closing_credit} /></td>
        </tr>
      );
    }

    // ── Group sub-header row ─────────────────────────────────────────────────
    if (row._kind === 'group') {
      const cfg = TYPE_CONFIG[row._type] || {};
      const gKey = `${row._type}::${row._group}`;
      const expanded = expandedGroups.has(gKey);
      return (
        <tr
          key={row._key}
          onClick={() => onToggleGroup(gKey)}
          className="cursor-pointer border-b border-slate-50 bg-slate-50/50 hover:bg-slate-100/60 transition-colors group"
        >
          <td className="px-4 py-2.5 w-8 pl-8">
            <div className="w-4 h-4 rounded flex items-center justify-center text-slate-400">
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </td>
          <td className="px-3 py-2.5 pl-5">
            <span className={clsx('text-xs font-semibold text-slate-600 flex items-center gap-1.5')}>
              <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
              {row._group}
            </span>
          </td>
          {opts.showOpening && (
            <>
              <td className="px-3 py-2.5 text-right"><AmtCell value={row.opening_debit} muted /></td>
              <td className="px-3 py-2.5 text-right"><AmtCell value={row.opening_credit} muted /></td>
            </>
          )}
          {opts.showPeriod && (
            <>
              <td className="px-3 py-2.5 text-right"><AmtCell value={row.period_debit} muted /></td>
              <td className="px-3 py-2.5 text-right"><AmtCell value={row.period_credit} muted /></td>
            </>
          )}
          <td className="px-3 py-2.5 text-right"><AmtCell value={row.closing_debit} muted /></td>
          <td className="px-3 py-2.5 text-right"><AmtCell value={row.closing_credit} muted /></td>
        </tr>
      );
    }

    // ── Account leaf row ─────────────────────────────────────────────────────
    if (row._kind === 'account') {
      const isSuspense = (row.name || '').toLowerCase().includes('suspense');
      return (
        <tr
          key={row._key}
          onClick={() => onLedgerClick(row)}
          className={clsx(
            'border-b border-slate-50 cursor-pointer transition-colors group',
            isSuspense ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/80',
          )}
        >
          <td className="w-8 px-4 py-2.5" />
          <td className="px-3 py-2.5 pl-10">
            <div className="flex items-center gap-2">
              <div className="min-w-0">
                <span className="text-sm text-slate-700 group-hover:text-brand-700 transition-colors">
                  {row.name}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {row.code && (
                    <span className="font-mono text-xs text-slate-400 bg-slate-50 px-1.5 py-0 rounded">
                      {row.code}
                    </span>
                  )}
                  {isSuspense && (
                    <span className="text-xs text-amber-600 font-medium">Suspense</span>
                  )}
                </div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-500 transition-colors ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100" />
            </div>
          </td>
          {opts.showOpening && (
            <>
              <td className="px-3 py-2.5 text-right"><AmtCell value={row.opening_debit} /></td>
              <td className="px-3 py-2.5 text-right"><AmtCell value={row.opening_credit} /></td>
            </>
          )}
          {opts.showPeriod && (
            <>
              <td className="px-3 py-2.5 text-right"><AmtCell value={row.period_debit} /></td>
              <td className="px-3 py-2.5 text-right"><AmtCell value={row.period_credit} /></td>
            </>
          )}
          <td className="px-3 py-2.5 text-right"><AmtCell value={row.closing_debit} /></td>
          <td className="px-3 py-2.5 text-right"><AmtCell value={row.closing_credit} /></td>
        </tr>
      );
    }

    return null;
  }, [expandedTypes, expandedGroups, opts, onToggleType, onToggleGroup, onLedgerClick]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          {/* Sticky header */}
          <thead className="sticky top-0 z-10">
            {/* Column group labels */}
            <tr className="bg-slate-100 border-b border-slate-200">
              <th colSpan={2} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Account
              </th>
              {opts.showOpening && (
                <th colSpan={2} className="px-3 py-2 text-center text-xs font-semibold text-blue-600 uppercase tracking-wide border-l border-slate-200">
                  Opening Balance
                </th>
              )}
              {opts.showPeriod && (
                <th colSpan={2} className="px-3 py-2 text-center text-xs font-semibold text-violet-600 uppercase tracking-wide border-l border-slate-200">
                  Period Transactions
                </th>
              )}
              <th colSpan={2} className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide border-l border-slate-200">
                Closing Balance
              </th>
            </tr>

            {/* Column headers */}
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-8 px-4 py-2.5" />
              <ColHeader label="Ledger / Group" sort={sort} colKey="name" onSort={onSort} />

              {opts.showOpening && (
                <>
                  <ColHeader label="Debit" sort={sort} colKey="opening_debit" onSort={onSort} right />
                  <ColHeader label="Credit" sort={sort} colKey="opening_credit" onSort={onSort} right />
                </>
              )}
              {opts.showPeriod && (
                <>
                  <ColHeader label="Debit" sort={sort} colKey="period_debit" onSort={onSort} right />
                  <ColHeader label="Credit" sort={sort} colKey="period_credit" onSort={onSort} right />
                </>
              )}
              <ColHeader label="Debit" sort={sort} colKey="closing_debit" onSort={onSort} right />
              <ColHeader label="Credit" sort={sort} colKey="closing_credit" onSort={onSort} right />
            </tr>
          </thead>

          <tbody>
            {isLoading
              ? <SkeletonRows cols={colCount} />
              : displayRows.length === 0
                ? <EmptyState hasSearch={!!search} />
                : displayRows.map(renderRow)
            }
          </tbody>

          {/* Grand totals */}
          {!isLoading && displayRows.length > 0 && grandTotals && (
            <tfoot>
              <TotalsRow
                totals={grandTotals}
                opts={opts}
                diff={diff}
                balanced={balanced}
              />
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
