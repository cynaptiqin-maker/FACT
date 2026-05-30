import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronDown, ChevronUp, MoreHorizontal,
  Eye, Edit2, Copy, RotateCcw, GitFork, Paperclip,
  CheckSquare, Square, CheckCircle2, XCircle, AlertTriangle,
  ArrowUpDown, ExternalLink,
} from 'lucide-react';
import {
  VOUCHER_TYPES, POSTING_STATUS, APPROVAL_STATUS, RECON_STATUS,
  formatINR, formatDate, formatRelative,
} from './jvlConstants';

const RISK_DOT = {
  low:    'bg-emerald-400',
  medium: 'bg-amber-400',
  high:   'bg-red-500',
};

function StatusBadge({ map, value }) {
  const cfg = map[value] || map['na'] || map['draft'] || {};
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${cfg.cls}`}>
      {cfg.label || value}
    </span>
  );
}

function ExpandedRow({ entry, colSpan }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <td colSpan={colSpan} className="bg-slate-50/70 dark:bg-[#1a2840]/60 px-0 border-b border-gray-100 dark:border-gray-800">
        <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Line Items */}
          <div className="lg:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Journal Lines</p>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-[#1e2d42]">
                    <th className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Account</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Code</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500 dark:text-gray-400">Debit</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500 dark:text-gray-400">Credit</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400">Cost Center</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.lineItems.map((li, idx) => (
                    <tr key={idx} className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#162030]">
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">{li.account}</td>
                      <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400">{li.accountCode}</td>
                      <td className="px-3 py-2 text-right font-mono text-red-600 dark:text-red-400">
                        {li.debit > 0 ? formatINR(li.debit) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {li.credit > 0 ? formatINR(li.credit) : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{li.costCenter}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1a2840]">
                    <td colSpan={2} className="px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300">Total</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-red-700 dark:text-red-300">{formatINR(entry.debit)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-300">{formatINR(entry.credit)}</td>
                    <td className="px-3 py-2">
                      {entry.isBalanced
                        ? <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold"><CheckCircle2 className="h-3.5 w-3.5" />Balanced</span>
                        : <span className="flex items-center gap-1 text-red-500 text-[11px] font-semibold"><XCircle className="h-3.5 w-3.5" />Unbalanced</span>
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval Timeline */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Approval Workflow</p>
            <div className="space-y-1">
              {entry.approvalTimeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className={[
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                      step.status === 'done' ? 'bg-emerald-500' : step.status === 'pending' ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-700',
                    ].join(' ')}>
                      {step.status === 'done'
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        : step.status === 'pending'
                          ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          : <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      }
                    </div>
                    {idx < entry.approvalTimeline.length - 1 && (
                      <div className={['w-0.5 h-6 mt-0.5', step.status === 'done' ? 'bg-emerald-200 dark:bg-emerald-900/40' : 'bg-gray-200 dark:bg-gray-700'].join(' ')} />
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={['text-xs font-semibold', step.status === 'waiting' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'].join(' ')}>{step.step}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{step.user}{step.timestamp ? ` · ${formatRelative(step.timestamp)}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <button className="h-7 px-2.5 rounded-lg text-[11px] font-medium bg-[#1C3741] text-white hover:bg-[#254e5b] transition-colors flex items-center gap-1">
                <Eye className="h-3 w-3" />View
              </button>
              <button className="h-7 px-2.5 rounded-lg text-[11px] font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1">
                <Edit2 className="h-3 w-3" />Edit
              </button>
              <button className="h-7 px-2.5 rounded-lg text-[11px] font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />Reverse
              </button>
              <button className="h-7 px-2.5 rounded-lg text-[11px] font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1">
                <GitFork className="h-3 w-3" />Audit
              </button>
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

function RowActionMenu({ entry, onView, onEdit, onDuplicate, onReverse }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-[#1e2d42] border border-gray-200 dark:border-[#2a3f5e] rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { icon: Eye, label: 'View', action: onView },
              { icon: Edit2, label: 'Edit', action: onEdit },
              { icon: Copy, label: 'Duplicate', action: onDuplicate },
              { icon: RotateCcw, label: 'Reverse', action: onReverse },
              { icon: Paperclip, label: 'Attachments', action: () => {} },
              { icon: GitFork, label: 'Audit Trail', action: () => {} },
              { icon: ExternalLink, label: 'Linked Transactions', action: () => {} },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={() => { action?.(entry); setOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon className="h-3.5 w-3.5 text-gray-400" />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const COL_WIDTHS = {
  check:         'w-10 min-w-[40px]',
  expand:        'w-8 min-w-[32px]',
  voucherNumber: 'min-w-[148px]',
  date:          'min-w-[100px]',
  postingDate:   'min-w-[108px]',
  type:          'min-w-[100px]',
  narration:     'min-w-[260px] max-w-[320px]',
  branch:        'min-w-[130px]',
  department:    'min-w-[120px]',
  debit:         'min-w-[130px]',
  credit:        'min-w-[130px]',
  currency:      'min-w-[52px]',
  postingStatus: 'min-w-[100px]',
  approvalStatus:'min-w-[108px]',
  reconStatus:   'min-w-[120px]',
  source:        'min-w-[130px]',
  createdBy:     'min-w-[120px]',
  modified:      'min-w-[100px]',
  actions:       'w-12 min-w-[48px]',
};

export default function JVLGrid({
  entries = [],
  total = 0,
  isLoading = false,
  page = 1,
  pageSize = 25,
  sortBy,
  sortDir,
  selectedRows,
  onEntrySelect,
  onPageChange,
  onSort,
  onSelectRow,
  onSelectAll,
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const allSelected = entries.length > 0 && entries.every((e) => selectedRows.has(e.id));
  const someSelected = entries.some((e) => selectedRows.has(e.id));
  const totalPages = Math.ceil(total / pageSize);

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedRows((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const SortHeader = ({ col, label, align = 'left' }) => (
    <th
      onClick={() => onSort?.(col)}
      className={`px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap ${COL_WIDTHS[col] || ''} ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === col
          ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-[#1C3741]" /> : <ChevronDown className="h-3 w-3 text-[#1C3741]" />)
          : <ArrowUpDown className="h-3 w-3 opacity-30" />
        }
      </span>
    </th>
  );

  const StaticHeader = ({ col, label, align = 'left' }) => (
    <th className={`px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap ${COL_WIDTHS[col] || ''} ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {label}
    </th>
  );

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="space-y-2 p-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" style={{ opacity: 1 - i * 0.06 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && entries.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-12">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-gray-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-200">No journal vouchers found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or create a new voucher.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse" style={{ minWidth: '2080px' }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 dark:bg-[#1a2840] border-b border-gray-200 dark:border-gray-700">
              {/* Checkbox */}
              <th className={`sticky left-0 z-20 bg-gray-50 dark:bg-[#1a2840] px-3 py-3 ${COL_WIDTHS.check}`}>
                <button
                  onClick={() => onSelectAll?.(allSelected ? [] : entries.map((e) => e.id))}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {allSelected ? <CheckSquare className="h-4 w-4 text-[#1C3741]" /> : someSelected ? <CheckSquare className="h-4 w-4 text-[#1C3741] opacity-50" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              {/* Expand */}
              <th className={`sticky left-10 z-20 bg-gray-50 dark:bg-[#1a2840] px-1 py-3 ${COL_WIDTHS.expand}`} />
              {/* Voucher Number */}
              <th className={`sticky left-[72px] z-20 bg-gray-50 dark:bg-[#1a2840] px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap ${COL_WIDTHS.voucherNumber}`}>
                Voucher No.
              </th>

              <SortHeader col="date" label="Date" />
              <SortHeader col="postingDate" label="Posting Date" />
              <StaticHeader col="type" label="Type" />
              <StaticHeader col="narration" label="Narration" />
              <StaticHeader col="branch" label="Branch" />
              <StaticHeader col="department" label="Department" />
              <SortHeader col="debit" label="Debit" align="right" />
              <SortHeader col="credit" label="Credit" align="right" />
              <StaticHeader col="currency" label="CCY" />
              <StaticHeader col="postingStatus" label="Posting" />
              <StaticHeader col="approvalStatus" label="Approval" />
              <StaticHeader col="reconStatus" label="Recon" />
              <StaticHeader col="source" label="Source" />
              <StaticHeader col="createdBy" label="Created By" />
              <SortHeader col="modified" label="Modified" />

              {/* Actions sticky right */}
              <th className={`sticky right-0 z-20 bg-gray-50 dark:bg-[#1a2840] px-3 py-3 ${COL_WIDTHS.actions}`} />
            </tr>
          </thead>

          <tbody>
            <AnimatePresence initial={false}>
              {entries.map((entry, idx) => {
                const isSelected = selectedRows.has(entry.id);
                const isExpanded = expandedRows.has(entry.id);
                const vtCfg = VOUCHER_TYPES[entry.type] || {};
                const riskDot = RISK_DOT[entry.riskScore] || 'bg-gray-300';
                const TOTAL_COLS = 20;

                return [
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.015, duration: 0.2 }}
                    onClick={() => onEntrySelect?.(entry)}
                    className={[
                      'group border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-[#1C3741]'
                        : isExpanded
                          ? 'bg-slate-50 dark:bg-[#1a2840]/50'
                          : 'hover:bg-gray-50/80 dark:hover:bg-[#1a2840]/40',
                    ].join(' ')}
                  >
                    {/* Checkbox */}
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onSelectRow?.(entry.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {isSelected ? <CheckSquare className="h-4 w-4 text-[#1C3741]" /> : <Square className="h-4 w-4" />}
                      </button>
                    </td>

                    {/* Expand */}
                    <td className="sticky left-10 z-10 bg-inherit px-1 py-3" onClick={(e) => toggleExpand(entry.id, e)}>
                      <button className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>

                    {/* Voucher Number */}
                    <td className="sticky left-[72px] z-10 bg-inherit px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${riskDot}`} title={`Risk: ${entry.riskScore}`} />
                        <span className="font-mono text-sm font-semibold text-[#1C3741] dark:text-sky-300 hover:underline whitespace-nowrap">
                          {entry.voucherNumber}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(entry.date)}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(entry.postingDate)}</td>

                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${vtCfg.cls || ''}`}>
                        {vtCfg.label || entry.type}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-[320px]">
                      <span className="line-clamp-1 leading-tight">{entry.narration}</span>
                    </td>

                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{entry.branch}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{entry.department}</td>

                    <td className="px-3 py-3 text-right">
                      <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">{formatINR(entry.debit)}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatINR(entry.credit)}</span>
                    </td>

                    <td className="px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">{entry.currency}</td>

                    <td className="px-3 py-3"><StatusBadge map={POSTING_STATUS} value={entry.postingStatus} /></td>
                    <td className="px-3 py-3"><StatusBadge map={APPROVAL_STATUS} value={entry.approvalStatus} /></td>
                    <td className="px-3 py-3"><StatusBadge map={RECON_STATUS} value={entry.reconStatus} /></td>

                    <td className="px-3 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {entry.source}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{entry.createdBy}</td>
                    <td className="px-3 py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{formatRelative(entry.modifiedAt)}</td>

                    {/* Actions sticky right */}
                    <td
                      className="sticky right-0 z-10 bg-inherit px-2 py-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RowActionMenu entry={entry} onView={() => onEntrySelect?.(entry)} onEdit={() => {}} onDuplicate={() => {}} onReverse={() => {}} />
                    </td>
                  </motion.tr>,

                  isExpanded && (
                    <ExpandedRow key={`${entry.id}-expanded`} entry={entry} colSpan={TOTAL_COLS} />
                  ),
                ];
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white dark:bg-[#162030] border-t border-gray-200 dark:border-[#1e3045]">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)}</span> of <span className="font-semibold text-gray-700 dark:text-gray-200">{total.toLocaleString('en-IN')}</span> journals
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page === 1}
            className="h-8 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page + i - 2;
            if (p < 1 || p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => onPageChange?.(p)}
                className={[
                  'h-8 w-8 text-sm rounded-lg font-medium transition-colors',
                  p === page
                    ? 'bg-[#1C3741] text-white'
                    : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
            className="h-8 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
