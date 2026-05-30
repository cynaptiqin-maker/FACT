import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, ChevronRight, Eye, Send, UserCheck,
  GitMerge, FileText, MessageSquare, AlertTriangle, MoreHorizontal,
  ArrowUp, ArrowDown, ArrowUpDown, Flag, ShieldAlert, Phone, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  RISK_META, COLL_STATUS_META, INS_STATUS_META, RECEIVABLE_TYPES, getBucket,
} from './AgingConstants';

const fmt = (n) => n == null ? '—' : '₹' + Number(n).toLocaleString('en-IN');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

const COLS = [
  { key: 'invoiceNo',        label: 'Invoice #',        width: 130, sticky: true  },
  { key: 'entity',           label: 'Patient / Org',    width: 180, sticky: false },
  { key: 'type',             label: 'Type',             width: 110, sticky: false },
  { key: 'branch',           label: 'Branch',           width: 130, sticky: false },
  { key: 'department',       label: 'Department',       width: 130, sticky: false },
  { key: 'billingDate',      label: 'Billed On',        width: 90,  sticky: false },
  { key: 'dueDate',          label: 'Due Date',         width: 90,  sticky: false },
  { key: 'agingDays',        label: 'Aging',            width: 80,  sticky: false },
  { key: 'agingBucket',      label: 'Bucket',           width: 100, sticky: false },
  { key: 'originalAmount',   label: 'Invoice Amt',      width: 110, sticky: false },
  { key: 'outstandingAmount',label: 'Outstanding',      width: 110, sticky: false },
  { key: 'collectedAmount',  label: 'Collected',        width: 110, sticky: false },
  { key: 'insuranceStatus',  label: 'Insurance Status', width: 140, sticky: false },
  { key: 'collectionStatus', label: 'Coll. Status',     width: 130, sticky: false },
  { key: 'riskLevel',        label: 'Risk',             width: 90,  sticky: false },
  { key: 'assignedCollector',label: 'Collector',        width: 130, sticky: false },
  { key: 'lastFollowUp',     label: 'Last Follow-Up',   width: 110, sticky: false },
  { key: 'predictedRecovery',label: 'Recovery %',       width: 90,  sticky: false },
  { key: 'sourceModule',     label: 'Source',           width: 110, sticky: false },
  { key: '_actions',         label: 'Actions',          width: 100, sticky: false },
];

// ─── Row Actions with dropdown ────────────────────────────────────────────────
function RowActions({ rec, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const menuItems = [
    { label: 'View Detail',      icon: Eye,        action: () => { onAction('view', rec); setOpen(false); }},
    { label: 'Send Reminder',    icon: Send,       action: () => { onAction('reminder', rec); setOpen(false); }},
    { label: 'Log Call',         icon: Phone,      action: () => { toast.success(`Call logged for ${rec.invoiceNo}`); setOpen(false); }},
    { label: 'Record Payment',   icon: CreditCard, action: () => { toast.success(`Payment entry for ${rec.invoiceNo}`); setOpen(false); }},
    { label: 'Mark Disputed',    icon: Flag,       action: () => { toast.error(`${rec.invoiceNo} flagged as disputed`); setOpen(false); }},
    { label: 'Escalate',         icon: ShieldAlert,action: () => { toast(`${rec.invoiceNo} escalated to manager`, { icon: '⚠️' }); setOpen(false); }},
  ];

  return (
    <div className="relative flex items-center gap-1" ref={ref}>
      <button onClick={() => onAction('view', rec)}
        className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors">
        <Eye size={11} />
      </button>
      <button onClick={() => onAction('reminder', rec)}
        className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:border-amber-300 transition-colors">
        <Send size={11} />
      </button>
      <button
        onClick={() => setOpen(p => !p)}
        className="h-6 w-6 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
      >
        <MoreHorizontal size={11} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-7 z-50 w-44 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl py-1"
          >
            {menuItems.map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <item.icon size={11} className="text-slate-400" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortIcon({ col, sort }) {
  if (sort?.col !== col) return <ArrowUpDown size={10} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
  return sort.dir === 'asc'
    ? <ArrowUp size={10} className="text-blue-500" />
    : <ArrowDown size={10} className="text-blue-500" />;
}

function TypeBadge({ type }) {
  const meta = RECEIVABLE_TYPES[type] ?? RECEIVABLE_TYPES.PATIENT;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  );
}

function RiskBadge({ level, score }) {
  const meta = RISK_META[level] ?? RISK_META.LOW;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.badgeBg} ${meta.badgeText}`}>
      {level === 'CRITICAL' && <AlertTriangle size={9} />}
      {meta.label}
    </span>
  );
}

function CollStatusBadge({ status }) {
  const meta = COLL_STATUS_META[status] ?? COLL_STATUS_META.PENDING;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  );
}

function InsBadge({ status }) {
  if (!status) return <span className="text-[10px] text-slate-400">—</span>;
  const meta = INS_STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap"
      style={{ color: meta?.color ?? '#94a3b8' }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block flex-none" style={{ background: meta?.color ?? '#94a3b8' }} />
      {meta?.label ?? status}
    </span>
  );
}

function RecoveryBar({ pct }) {
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden min-w-[40px]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold" style={{ color }}>{pct}%</span>
    </div>
  );
}

function AgeChip({ days, bucket }) {
  const meta = getBucket(days);
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${meta.badgeBg} ${meta.badgeText}`}>
      {days}d
    </span>
  );
}

function BucketChip({ bucket }) {
  const meta = AGING_BUCKETS_CONFIG_LOOKUP[bucket] ?? {};
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.badgeBg ?? ''} ${meta.badgeText ?? 'text-slate-500'}`}>
      {meta.label ?? bucket}
    </span>
  );
}

import { AGING_BUCKETS_CONFIG } from './AgingConstants';
const AGING_BUCKETS_CONFIG_LOOKUP = Object.fromEntries(AGING_BUCKETS_CONFIG.map(b => [b.key, b]));

// ── Expanded row detail ──────────────────────────────────────────────────────
function ExpandedRow({ rec, onOpen, onAction }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <td colSpan={COLS.length + 1}
        className="bg-blue-50/60 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Mini stats */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financial Summary</div>
            {[
              { label: 'Invoice Amount', val: fmt(rec.originalAmount) },
              { label: 'Outstanding',    val: fmt(rec.outstandingAmount), bold: true },
              { label: 'Collected',      val: fmt(rec.collectedAmount) },
            ].map(({ label, val, bold }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className={`font-mono font-semibold ${bold ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>{val}</span>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timeline</div>
            {[
              { label: 'Billing Date',   val: fmtDate(rec.billingDate) },
              { label: 'Due Date',       val: fmtDate(rec.dueDate) },
              { label: 'Last Follow-Up', val: fmtDate(rec.lastFollowUp) },
              { label: 'Next Follow-Up', val: fmtDate(rec.nextFollowUp) },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{val}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="md:col-span-1 space-y-2">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collection Notes</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rec.notes || 'No notes recorded.'}</p>
            {rec.paymentHistory?.length > 0 && (
              <div className="space-y-1 mt-2">
                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Payment History</div>
                {rec.paymentHistory.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="text-slate-400 whitespace-nowrap">{fmtDate(p.date)}</span>
                    <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{fmt(p.amount)}</span>
                    <span className="text-slate-500 dark:text-slate-400">{p.note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick Actions</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'view',      label: 'View Detail', icon: Eye,         pri: true  },
                { id: 'reminder',  label: 'Send Reminder', icon: Send,      pri: false },
                { id: 'assign',    label: 'Assign',      icon: UserCheck,   pri: false },
                { id: 'reconcile', label: 'Reconcile',   icon: GitMerge,    pri: false },
                { id: 'note',      label: 'Add Note',    icon: MessageSquare, pri: false },
                { id: 'invoice',   label: 'View Invoice',icon: FileText,    pri: false },
              ].map(a => (
                <button key={a.id} onClick={() => onAction(a.id, rec)}
                  className={`flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-colors
                    ${a.pri
                      ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <a.icon size={11} />{a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// ── Main Grid ────────────────────────────────────────────────────────────────
export default function AgingGrid({ rows, selectedRows, onSelect, onSelectAll, onRowClick, onAction }) {
  const [sort, setSort] = useState({ col: 'agingDays', dir: 'desc' });
  const [expanded, setExpanded] = useState(null);

  const toggleSort = useCallback((col) => {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'desc' });
  }, []);

  const sorted = [...rows].sort((a, b) => {
    const va = a[sort.col], vb = b[sort.col];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const allSelected = rows.length > 0 && rows.every(r => selectedRows.includes(r.id));

  return (
    <div className="overflow-auto">
      <table className="w-full text-xs border-collapse" style={{ minWidth: COLS.reduce((s, c) => s + c.width, 48) }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            {/* Checkbox */}
            <th className="w-10 sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-center py-3">
                <input type="checkbox" checked={allSelected} onChange={onSelectAll}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-blue-600 cursor-pointer" />
              </div>
            </th>
            {/* Expand */}
            <th className="w-8 sticky left-10 z-20 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />

            {COLS.map(col => (
              <th
                key={col.key}
                style={{ minWidth: col.width }}
                onClick={() => col.key !== '_actions' && toggleSort(col.key)}
                className={`group px-3 py-3 text-left font-semibold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap
                  ${col.sticky ? 'sticky left-18 z-20 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800' : ''}
                  ${col.key !== '_actions' ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.key !== '_actions' && <SortIcon col={col.key} sort={sort} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.map((rec, rowIdx) => {
            const isSelected = selectedRows.includes(rec.id);
            const isExpanded = expanded === rec.id;
            const bucket = getBucket(rec.agingDays);

            return (
              <>
                <tr
                  key={rec.id}
                  onClick={() => onRowClick(rec)}
                  className={`border-b border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors group
                    ${isSelected ? 'bg-blue-50/60 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}
                    ${isExpanded ? 'border-b-0' : ''}`}
                >
                  {/* Checkbox */}
                  <td className="sticky left-0 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800 w-10"
                    onClick={e => { e.stopPropagation(); onSelect(rec.id); }}>
                    <div className="flex items-center justify-center py-3">
                      <input type="checkbox" checked={isSelected} onChange={() => onSelect(rec.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-blue-600 cursor-pointer" />
                    </div>
                  </td>

                  {/* Expand toggle */}
                  <td className="sticky left-10 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800 w-8"
                    onClick={e => { e.stopPropagation(); setExpanded(p => p === rec.id ? null : rec.id); }}>
                    <div className="flex items-center justify-center py-3">
                      <ChevronRight size={13} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90 text-blue-500' : 'group-hover:text-slate-600'}`} />
                    </div>
                  </td>

                  {/* Invoice # */}
                  <td className="px-3 py-3 sticky left-18 z-10 bg-inherit border-r border-slate-200 dark:border-slate-800 font-mono text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap">
                    {rec.invoiceNo}
                  </td>

                  {/* Entity */}
                  <td className="px-3 py-3 max-w-[180px]">
                    <div className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {rec.patientName || rec.orgName || '—'}
                    </div>
                    {rec.patientId && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{rec.patientId}</div>
                    )}
                  </td>

                  {/* Type */}
                  <td className="px-3 py-3"><TypeBadge type={rec.type} /></td>

                  {/* Branch */}
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{rec.branch}</td>

                  {/* Department */}
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{rec.department}</td>

                  {/* Billing Date */}
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">{fmtDate(rec.billingDate)}</td>

                  {/* Due Date */}
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">{fmtDate(rec.dueDate)}</td>

                  {/* Aging Days */}
                  <td className="px-3 py-3"><AgeChip days={rec.agingDays} bucket={rec.agingBucket} /></td>

                  {/* Bucket */}
                  <td className="px-3 py-3"><BucketChip bucket={rec.agingBucket} /></td>

                  {/* Original Amount */}
                  <td className="px-3 py-3 font-mono text-right text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmt(rec.originalAmount)}</td>

                  {/* Outstanding */}
                  <td className="px-3 py-3 font-mono text-right font-semibold whitespace-nowrap"
                    style={{ color: bucket.color }}>
                    {fmt(rec.outstandingAmount)}
                  </td>

                  {/* Collected */}
                  <td className="px-3 py-3 font-mono text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {rec.collectedAmount > 0 ? fmt(rec.collectedAmount) : '—'}
                  </td>

                  {/* Insurance Status */}
                  <td className="px-3 py-3"><InsBadge status={rec.insuranceStatus} /></td>

                  {/* Collection Status */}
                  <td className="px-3 py-3"><CollStatusBadge status={rec.collectionStatus} /></td>

                  {/* Risk */}
                  <td className="px-3 py-3"><RiskBadge level={rec.riskLevel} score={rec.riskScore} /></td>

                  {/* Collector */}
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold flex-none">
                        {rec.assignedCollector?.charAt(0) ?? '?'}
                      </div>
                      <span className="truncate max-w-[88px]">{rec.assignedCollector ?? '—'}</span>
                    </div>
                  </td>

                  {/* Last Follow-Up */}
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">{fmtDate(rec.lastFollowUp)}</td>

                  {/* Recovery % */}
                  <td className="px-3 py-3 min-w-[90px]"><RecoveryBar pct={rec.predictedRecovery ?? 0} /></td>

                  {/* Source */}
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{rec.sourceModule}</td>

                  {/* Actions */}
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <RowActions rec={rec} onAction={onAction} />
                  </td>
                </tr>

                {/* Expanded row */}
                <AnimatePresence>
                  {isExpanded && (
                    <ExpandedRow key={`exp-${rec.id}`} rec={rec} onOpen={() => onRowClick(rec)} onAction={onAction} />
                  )}
                </AnimatePresence>
              </>
            );
          })}

          {sorted.length === 0 && (
            <tr>
              <td colSpan={COLS.length + 2} className="py-20 text-center">
                <div className="text-slate-400 dark:text-slate-500">
                  <AlertTriangle size={28} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No receivables match your filters</p>
                  <p className="text-xs mt-1">Try adjusting the search or filter criteria</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
