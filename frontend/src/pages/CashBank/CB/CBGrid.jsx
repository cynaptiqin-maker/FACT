import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, ChevronRight,
  Eye, GitMerge, Edit2, RotateCcw, FileText, Paperclip,
  ArrowDownCircle, ArrowUpCircle, Shuffle, AlertOctagon,
  Sparkles, Clock, User, Building, Layers, ExternalLink,
} from 'lucide-react';
import { TXN_TYPES, RECONCILE_STATUSES, APPROVAL_STATUSES, RISK_LEVELS, SOURCE_MODULES, fmtINR } from './CBConstants';

// ─── Column widths ─────────────────────────────────────────────────────────────

const COL = {
  check:    '40px',
  id:       '160px',
  dateTime: '140px',
  type:     '110px',
  branch:   '120px',
  counter:  '120px',
  narration:'200px',
  receipt:  '110px',
  payment:  '110px',
  balance:  '110px',
  user:     '110px',
  reconcile:'110px',
  approval: '90px',
  risk:     '80px',
  source:   '100px',
  actions:  '90px',
};

// ─── Cell components ──────────────────────────────────────────────────────────

function TxnTypeBadge({ type }) {
  const cfg = TXN_TYPES[type] ?? TXN_TYPES.RECEIPT;
  const Icon = type === 'RECEIPT' || type === 'CONTRA' ? ArrowDownCircle
    : type === 'PAYMENT' || type === 'PETTY_CASH' ? ArrowUpCircle
    : type === 'REVERSAL' ? RotateCcw : Shuffle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function ReconcileBadge({ status }) {
  const cfg = RECONCILE_STATUSES[status] ?? RECONCILE_STATUSES.UNRECONCILED;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function ApprovalBadge({ status }) {
  const cfg = APPROVAL_STATUSES[status] ?? APPROVAL_STATUSES.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function RiskBar({ score, level }) {
  const cfg = RISK_LEVELS[level] ?? RISK_LEVELS.LOW;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: cfg.color }} />
      </div>
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.badgeBg} ${cfg.badgeText}`}>
        {cfg.label}
      </span>
    </div>
  );
}

function SourceBadge({ module }) {
  const cfg = SOURCE_MODULES[module] ?? SOURCE_MODULES.MANUAL;
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${cfg.color}1a`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function AvatarInitials({ name }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors   = ['#0d9488', '#0891b2', '#6366f1', '#8b5cf6', '#059669', '#d97706'];
  const bg       = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-none"
        style={{ background: bg }}>
        {initials}
      </div>
      <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{name}</span>
    </div>
  );
}

// ─── Expanded row ─────────────────────────────────────────────────────────────

function ExpandedRow({ rec, onAction }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={17} className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="grid grid-cols-3 gap-6">

          {/* Voucher & Transaction Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={13} className="text-teal-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Voucher Details</span>
            </div>
            {[
              { label: 'Voucher No.',    value: rec.voucherNo },
              { label: 'Transaction ID', value: rec.id },
              { label: 'Sub-Type',       value: rec.subType },
              { label: 'Shift',          value: rec.shiftId },
              { label: 'Ledger Account', value: rec.ledgerAccount },
              ...(rec.patientId ? [{ label: 'Patient ID', value: rec.patientId }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-[11px] text-slate-500 dark:text-slate-500 flex-none">{label}</span>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 text-right font-mono">{value}</span>
              </div>
            ))}
          </div>

          {/* Cash Impact & Linked Journals */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={13} className="text-teal-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Cash Impact</span>
            </div>

            {/* Amount visualization */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">Receipt</div>
                  <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {rec.receiptAmount > 0 ? fmtINR(rec.receiptAmount) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">Payment</div>
                  <div className="text-sm font-bold font-mono text-red-600 dark:text-red-400">
                    {rec.paymentAmount > 0 ? fmtINR(rec.paymentAmount) : '—'}
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                <div className="text-[10px] text-slate-500 mb-0.5">Running Balance after</div>
                <div className="text-sm font-bold font-mono text-teal-600 dark:text-teal-400">{fmtINR(rec.runningBalance)}</div>
              </div>
            </div>

            {/* Linked journals */}
            {rec.linkedJournals.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide">Linked Journal Entries</div>
                <div className="space-y-1">
                  {rec.linkedJournals.map(jv => (
                    <button key={jv}
                      className="flex items-center gap-1.5 text-[11px] text-teal-600 dark:text-teal-400 hover:underline">
                      <ExternalLink size={10} />{jv}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {rec.attachments.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                  <Paperclip size={10} />Attachments ({rec.attachments.length})
                </div>
                {rec.attachments.map(a => (
                  <button key={a} className="block text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Workflow & Narration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={13} className="text-teal-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Workflow Status</span>
            </div>

            {/* Approval timeline */}
            <div className="space-y-2">
              {[
                { step: 'Created',    user: rec.user,       time: rec.dateTime.split(' ')[1], done: true  },
                { step: 'Submitted',  user: rec.user,       time: rec.dateTime.split(' ')[1], done: true  },
                { step: 'Approved',   user: 'System / Mgr', time: '—',                        done: rec.approvalStatus === 'APPROVED' || rec.approvalStatus === 'AUTO_APV' },
                { step: 'Reconciled', user: 'Finance',      time: '—',                        done: rec.reconcileStatus === 'RECONCILED' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-none border-2 text-[9px] font-bold
                    ${s.done ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 dark:border-slate-600 text-slate-400'}`}>
                    {s.done ? '✓' : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{s.step}</div>
                    <div className="text-[10px] text-slate-400">{s.user} · {s.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            {rec.notes && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <AlertOctagon size={11} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Note</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">{rec.notes}</p>
              </div>
            )}

            {/* Row actions */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {[
                { label: 'View Voucher',    action: 'view'      },
                { label: 'Reconcile',       action: 'reconcile' },
                { label: 'Reverse',         action: 'reverse'   },
                { label: 'Audit Trail',     action: 'audit'     },
              ].map(a => (
                <button key={a.action}
                  onClick={() => onAction(a.action, rec)}
                  className="h-7 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Grid header ──────────────────────────────────────────────────────────────

function GridHeader({ allSelected, onSelectAll, sortCol, sortDir, onSort }) {
  const cols = [
    { key: 'id',       label: 'Transaction ID',  w: COL.id       },
    { key: 'dateTime', label: 'Date & Time',      w: COL.dateTime },
    { key: 'txnType',  label: 'Type',             w: COL.type     },
    { key: 'branch',   label: 'Branch',           w: COL.branch   },
    { key: 'counter',  label: 'Counter',          w: COL.counter  },
    { key: 'narration',label: 'Narration',        w: COL.narration},
    { key: 'receiptAmount', label: 'Receipt ₹',  w: COL.receipt  },
    { key: 'paymentAmount', label: 'Payment ₹',  w: COL.payment  },
    { key: 'runningBalance',label: 'Balance ₹',  w: COL.balance  },
    { key: 'user',     label: 'User',             w: COL.user     },
    { key: 'reconcileStatus', label: 'Reconcile',w: COL.reconcile},
    { key: 'approvalStatus',  label: 'Approval', w: COL.approval },
    { key: 'riskLevel',       label: 'Risk',      w: COL.risk     },
    { key: 'sourceModule',    label: 'Source',    w: COL.source   },
  ];

  return (
    <thead>
      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <th style={{ width: COL.check }} className="px-3 py-2.5">
          <input type="checkbox" checked={allSelected} onChange={onSelectAll}
            className="w-3.5 h-3.5 accent-teal-600 cursor-pointer" />
        </th>
        {cols.map(c => (
          <th
            key={c.key}
            style={{ width: c.w, minWidth: c.w }}
            onClick={() => onSort(c.key)}
            className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 whitespace-nowrap select-none group transition-colors"
          >
            <div className="flex items-center gap-1">
              {c.label}
              {sortCol === c.key ? (
                sortDir === 'asc' ? <ChevronUp size={11} className="text-teal-500" /> : <ChevronDown size={11} className="text-teal-500" />
              ) : (
                <ChevronDown size={11} className="opacity-0 group-hover:opacity-40 transition-opacity" />
              )}
            </div>
          </th>
        ))}
        <th style={{ width: COL.actions }} className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide">
          Actions
        </th>
      </tr>
    </thead>
  );
}

// ─── Grid row ─────────────────────────────────────────────────────────────────

function GridRow({ rec, selected, onSelect, onExpand, expanded, onAction }) {
  const isReceipt = rec.receiptAmount > 0;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        onClick={() => onExpand(rec.id)}
        className={`border-b border-slate-100 dark:border-slate-800 cursor-pointer group transition-colors
          ${selected   ? 'bg-teal-50 dark:bg-teal-900/10'
          : expanded   ? 'bg-slate-50 dark:bg-slate-900/60'
          : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'}
          ${rec.riskLevel === 'CRITICAL' ? 'border-l-2 border-l-red-400' : ''}`}
      >
        {/* Checkbox */}
        <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={() => onSelect(rec.id)}
            className="w-3.5 h-3.5 accent-teal-600 cursor-pointer" />
        </td>

        {/* Transaction ID */}
        <td className="px-3 py-2.5" style={{ width: COL.id }}>
          <div className="flex items-center gap-1.5">
            <button className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-400 hover:underline leading-none">
              {rec.id}
            </button>
            {expanded ? <ChevronUp size={11} className="text-slate-400 flex-none" /> : <ChevronRight size={11} className="text-slate-300 flex-none opacity-0 group-hover:opacity-100 transition-opacity" />}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{rec.voucherNo}</div>
        </td>

        {/* Date & Time */}
        <td className="px-3 py-2.5" style={{ width: COL.dateTime }}>
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {rec.dateTime.split(' ')[0]}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">{rec.dateTime.split(' ')[1]}</div>
        </td>

        {/* Type */}
        <td className="px-3 py-2.5" style={{ width: COL.type }}>
          <TxnTypeBadge type={rec.txnType} />
          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-24">{rec.subType}</div>
        </td>

        {/* Branch */}
        <td className="px-3 py-2.5" style={{ width: COL.branch }}>
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
            <Building size={11} className="text-slate-400 flex-none" />
            <span className="truncate">{rec.branch}</span>
          </div>
        </td>

        {/* Counter */}
        <td className="px-3 py-2.5" style={{ width: COL.counter }}>
          <span className="text-xs text-slate-600 dark:text-slate-400">{rec.counter}</span>
        </td>

        {/* Narration */}
        <td className="px-3 py-2.5" style={{ width: COL.narration }}>
          <div className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-48" title={rec.narration}>
            {rec.narration}
          </div>
          {rec.patientId && (
            <div className="text-[10px] text-slate-400 mt-0.5">{rec.patientId}</div>
          )}
        </td>

        {/* Receipt */}
        <td className="px-3 py-2.5 text-right" style={{ width: COL.receipt }}>
          {rec.receiptAmount > 0 ? (
            <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{fmtINR(rec.receiptAmount)}
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
          )}
        </td>

        {/* Payment */}
        <td className="px-3 py-2.5 text-right" style={{ width: COL.payment }}>
          {rec.paymentAmount > 0 ? (
            <span className="text-sm font-bold font-mono text-red-600 dark:text-red-400">
              -{fmtINR(rec.paymentAmount)}
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
          )}
        </td>

        {/* Running Balance */}
        <td className="px-3 py-2.5 text-right" style={{ width: COL.balance }}>
          <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
            {fmtINR(rec.runningBalance)}
          </span>
        </td>

        {/* User */}
        <td className="px-3 py-2.5" style={{ width: COL.user }}>
          <AvatarInitials name={rec.user} />
        </td>

        {/* Reconcile */}
        <td className="px-3 py-2.5" style={{ width: COL.reconcile }}>
          <ReconcileBadge status={rec.reconcileStatus} />
        </td>

        {/* Approval */}
        <td className="px-3 py-2.5" style={{ width: COL.approval }}>
          <ApprovalBadge status={rec.approvalStatus} />
        </td>

        {/* Risk */}
        <td className="px-3 py-2.5" style={{ width: COL.risk }}>
          <RiskBar score={rec.riskScore} level={rec.riskLevel} />
        </td>

        {/* Source */}
        <td className="px-3 py-2.5" style={{ width: COL.source }}>
          <SourceBadge module={rec.sourceModule} />
        </td>

        {/* Actions */}
        <td className="px-3 py-2.5" style={{ width: COL.actions }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {[
              { icon: Eye,       tip: 'View',       action: 'view'      },
              { icon: GitMerge,  tip: 'Reconcile',  action: 'reconcile' },
              { icon: Edit2,     tip: 'Edit',       action: 'edit'      },
            ].map(a => (
              <button key={a.action} title={a.tip}
                onClick={() => onAction(a.action, rec)}
                className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors flex items-center justify-center">
                <a.icon size={11} />
              </button>
            ))}
          </div>
        </td>
      </motion.tr>

      <AnimatePresence>
        {expanded && <ExpandedRow key={`${rec.id}-expanded`} rec={rec} onAction={onAction} />}
      </AnimatePresence>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <tr>
      <td colSpan={17}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <Sparkles size={20} className="text-slate-400" />
          </div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">No transactions found</div>
          <div className="text-xs text-slate-400 dark:text-slate-600">Try adjusting your filters or search query</div>
        </div>
      </td>
    </tr>
  );
}

// ─── Main grid ────────────────────────────────────────────────────────────────

export default function CBGrid({ rows, selectedRows, onSelect, onSelectAll, onRowClick, onAction }) {
  const [expandedId, setExpandedId] = useState(null);
  const [sortCol,    setSortCol]    = useState('dateTime');
  const [sortDir,    setSortDir]    = useState('desc');

  const handleSort = useCallback((col) => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortCol(col);
  }, [sortCol]);

  const handleExpand = useCallback((id) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1600px] border-collapse">
        <GridHeader
          allSelected={allSelected}
          onSelectAll={onSelectAll}
          sortCol={sortCol}
          sortDir={sortDir}
          onSort={handleSort}
        />
        <tbody>
          {sorted.length === 0 ? <EmptyState /> : sorted.map(rec => (
            <GridRow
              key={rec.id}
              rec={rec}
              selected={selectedRows.includes(rec.id)}
              expanded={expandedId === rec.id}
              onSelect={onSelect}
              onExpand={handleExpand}
              onAction={(action, r) => {
                if (action === 'view') onRowClick(r);
                onAction(action, r);
              }}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
