import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  MoreHorizontal, Eye, Edit2, Lock, Unlock,
  PlayCircle, StopCircle, Archive, BookOpen,
  CheckCircle, XCircle, AlertTriangle, Building2,
} from 'lucide-react';
import clsx from 'clsx';
import { FY_STATUS, fyLabel, formatFYDate, fyMetrics, generatePeriods } from './fyConstants';

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = FY_STATUS[status] || FY_STATUS.DRAFT;
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border', cfg.bg, cfg.text, cfg.border)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Compliance indicator ─────────────────────────────────────────────────────
function ComplianceCell({ ok }) {
  return ok === true
    ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> OK</span>
    : ok === false
      ? <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="w-3.5 h-3.5" /> Issues</span>
      : <span className="text-xs text-slate-400">—</span>;
}

// ─── Branch coverage bar ──────────────────────────────────────────────────────
function BranchBar({ closed, total }) {
  const pct = total ? Math.round((closed / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-amber-500' : 'bg-red-400')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">{closed}/{total}</span>
    </div>
  );
}

// ─── Row action menu ──────────────────────────────────────────────────────────
function RowActions({ fy, onView, onEdit, onClose, onLock, onStartYE, onArchive }) {
  const [open, setOpen] = useState(false);
  const canClose  = ['ACTIVE', 'OPEN', 'PARTIALLY_CLOSED'].includes(fy.status);
  const canLock   = fy.status === 'CLOSED' && !fy.is_locked;
  const canUnlock = fy.is_locked;
  const canYE     = ['ACTIVE', 'PARTIALLY_CLOSED'].includes(fy.status);

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 overflow-hidden">
            <button onClick={() => { setOpen(false); onView(fy); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
              <Eye className="w-3.5 h-3.5 text-slate-400" /> View Details
            </button>
            <button onClick={() => { setOpen(false); onEdit(fy); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
              <Edit2 className="w-3.5 h-3.5 text-slate-400" /> Edit
            </button>
            {canYE && (
              <button onClick={() => { setOpen(false); onStartYE(fy); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-amber-700 hover:bg-amber-50">
                <PlayCircle className="w-3.5 h-3.5 text-amber-500" /> Start Year-End Process
              </button>
            )}
            {canClose && (
              <button onClick={() => { setOpen(false); onClose(fy); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-blue-700 hover:bg-blue-50">
                <StopCircle className="w-3.5 h-3.5 text-blue-500" /> Close Fiscal Year
              </button>
            )}
            {canLock && (
              <button onClick={() => { setOpen(false); onLock(fy, true); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-violet-700 hover:bg-violet-50">
                <Lock className="w-3.5 h-3.5 text-violet-500" /> Lock Year
              </button>
            )}
            {canUnlock && (
              <button onClick={() => { setOpen(false); onLock(fy, false); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                <Unlock className="w-3.5 h-3.5 text-slate-400" /> Unlock (requires approval)
              </button>
            )}
            <div className="my-1 border-t border-slate-100" />
            <button onClick={() => { setOpen(false); onArchive(fy); }} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-500 hover:bg-slate-50">
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[28, 18, 18, 20, 22, 20, 16, 16, 20].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

const COLS = [
  { key: 'name',       label: 'Fiscal Year',     sortable: true  },
  { key: 'start_date', label: 'Start Date',       sortable: true  },
  { key: 'end_date',   label: 'End Date',         sortable: true  },
  { key: 'status',     label: 'Status',           sortable: true  },
  { key: 'periods',    label: 'Periods',          sortable: false },
  { key: 'branches',   label: 'Branch Coverage',  sortable: false },
  { key: 'compliance', label: 'Compliance',       sortable: false },
  { key: 'closed_by',  label: 'Last Action By',   sortable: false },
  { key: 'actions',    label: '',                 sortable: false },
];

function SortIcon({ col, sort }) {
  if (sort.key !== col) return <ChevronsUpDown className="w-3 h-3 text-slate-300" />;
  return sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-brand-600" /> : <ChevronDown className="w-3 h-3 text-brand-600" />;
}

export default function FYTable({
  fiscalYears, isLoading, selectedFY, onSelect,
  sort, onSort,
  onEdit, onClose, onLock, onStartYE, onArchive,
}) {
  const handleSort = (key) => {
    if (!COLS.find(c => c.key === key)?.sortable) return;
    onSort({ key, dir: sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc' });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Fiscal Years Registry</h3>
        <span className="text-xs text-slate-400">{fiscalYears.length} years configured</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-slate-700',
                    col.key === 'actions' && 'w-12',
                  )}
                >
                  {col.sortable ? (
                    <span className="flex items-center gap-1">
                      {col.label} <SortIcon col={col.key} sort={sort} />
                    </span>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              : fiscalYears.length === 0
                ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex flex-col items-center py-12">
                        <BookOpen className="w-8 h-8 text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500 font-medium">No fiscal years found</p>
                        <p className="text-xs text-slate-400 mt-1">Create your first fiscal year to get started</p>
                      </div>
                    </td>
                  </tr>
                )
                : fiscalYears.map(fy => {
                    const metrics = fyMetrics({ ...fy, periods: fy.periods || generatePeriods(fy.start_date) });
                    const isSelected = selectedFY?.id === fy.id;
                    return (
                      <tr
                        key={fy.id}
                        onClick={() => onSelect(fy)}
                        className={clsx(
                          'cursor-pointer transition-colors group',
                          isSelected ? 'bg-brand-50/50' : 'hover:bg-slate-50/80',
                          fy.status === 'ACTIVE' && 'bg-emerald-50/20',
                        )}
                      >
                        {/* Name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {fy.is_locked && <Lock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                            <span className={clsx('font-semibold', isSelected ? 'text-brand-700' : 'text-slate-800 group-hover:text-brand-700')}>
                              {fyLabel(fy)}
                            </span>
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatFYDate(fy.start_date)}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatFYDate(fy.end_date)}</td>

                        {/* Status */}
                        <td className="px-4 py-3.5"><StatusBadge status={fy.status} /></td>

                        {/* Periods */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-slate-700">
                              <span className="font-semibold text-emerald-600">{metrics.open}</span> open ·{' '}
                              <span className="font-semibold text-blue-600">{metrics.closed}</span> closed
                            </span>
                            {metrics.locked > 0 && (
                              <span className="text-xs text-violet-600">{metrics.locked} locked</span>
                            )}
                          </div>
                        </td>

                        {/* Branch coverage */}
                        <td className="px-4 py-3.5">
                          <BranchBar closed={fy.branches_closed || 0} total={fy.branch_count || 5} />
                        </td>

                        {/* Compliance */}
                        <td className="px-4 py-3.5"><ComplianceCell ok={fy.compliance_ok} /></td>

                        {/* Last closed by */}
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="text-xs text-slate-700">{fy.closed_by || '—'}</p>
                            {fy.closed_at && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{formatFYDate(fy.closed_at)}</p>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <RowActions
                            fy={fy}
                            onView={onSelect}
                            onEdit={onEdit}
                            onClose={onClose}
                            onLock={onLock}
                            onStartYE={onStartYE}
                            onArchive={onArchive}
                          />
                        </td>
                      </tr>
                    );
                  })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
