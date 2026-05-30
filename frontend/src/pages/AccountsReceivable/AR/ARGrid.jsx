import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, ChevronUp, ArrowUpDown, MoreHorizontal,
  Eye, CreditCard, Send, GitMerge, FileText, ClipboardList,
  UserCheck, Sparkles, Activity, Shield, Building2, User,
  Landmark, RefreshCw, Zap,
} from 'lucide-react';
import {
  RECEIVABLE_TYPES, COLLECTION_STATUSES, INSURANCE_STATUSES,
  RISK_LEVELS, agingBadge, fmtINR,
} from './ARConstants';

function TypeBadge({ type }) {
  const cfg = RECEIVABLE_TYPES[type] ?? RECEIVABLE_TYPES.PATIENT;
  const Icon = type === 'INSURANCE' ? Shield : type === 'CORPORATE' ? Building2 : type === 'GOVERNMENT' ? Landmark : User;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.lightBg} ${cfg.text}`}>
      <Icon size={10} />{cfg.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = COLLECTION_STATUSES[status] ?? COLLECTION_STATUSES.PENDING;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function InsuranceBadge({ status }) {
  if (!status) return <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>;
  const cfg = INSURANCE_STATUSES[status];
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800"
          style={{ color: cfg?.color ?? '#64748b' }}>
      {cfg?.label ?? status}
    </span>
  );
}

function RiskBadge({ level, score }) {
  const cfg = RISK_LEVELS[level] ?? RISK_LEVELS.LOW;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: cfg.color }} />
      </div>
      <span className={`text-[11px] font-semibold ${cfg.badgeText}`}>{cfg.label}</span>
    </div>
  );
}

function AvatarInitials({ name, color }) {
  const parts = (name || '').split(' ');
  const initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0]?.[0] ?? '?');
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-none"
         style={{ background: color ?? '#64748b' }}>
      {initials.toUpperCase()}
    </div>
  );
}

function CollectionBar({ invoice, collected, outstanding }) {
  const pct = invoice > 0 ? Math.round((collected / invoice) * 100) : 0;
  return (
    <div className="min-w-[80px]">
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-slate-500 dark:text-slate-400">{pct}%</span>
        <span className="text-slate-700 dark:text-slate-300 font-mono">{fmtINR(outstanding, 'lakh')}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ExpandedRow({ rec }) {
  const paymentHistory = [
    { date: '2026-04-20', amount: rec.collectedAmount, mode: 'Online Transfer', ref: 'TXN2026041892', by: 'Patient' },
  ].filter(p => p.amount > 0);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <td colSpan={18} className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 p-0">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 grid grid-cols-3 gap-4">
            {/* Invoice summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText size={12} className="text-blue-500" />Invoice Details
              </h4>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <Row k="Invoice No" v={rec.invoiceNo} />
                <Row k="Invoice Amount" v={`₹${rec.invoiceAmount.toLocaleString('en-IN')}`} />
                <Row k="Outstanding" v={`₹${rec.outstandingAmount.toLocaleString('en-IN')}`} highlight />
                <Row k="Collected" v={`₹${rec.collectedAmount.toLocaleString('en-IN')}`} green />
                <Row k="Branch" v={rec.branch} />
                <Row k="Department" v={rec.department} />
                <Row k="Source" v={rec.sourceModule} />
              </div>
            </div>

            {/* Collection status */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Activity size={12} className="text-emerald-500" />Collection History
              </h4>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <Row k="Status" v={<StatusBadge status={rec.collectionStatus} />} />
                <Row k="Assigned To" v={rec.assignedCollector} />
                <Row k="Last Follow-Up" v={rec.lastFollowUp} />
                <Row k="Risk Score" v={<RiskBadge level={rec.riskLevel} score={rec.riskScore} />} />
                {paymentHistory.length > 0 ? paymentHistory.map((p, i) => (
                  <div key={i} className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Payment on {p.date}</div>
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">₹{p.amount.toLocaleString('en-IN')} via {p.mode}</div>
                    <div className="text-[10px] text-slate-400">{p.ref}</div>
                  </div>
                )) : (
                  <div className="text-[11px] text-slate-400 italic pt-1">No payments recorded yet</div>
                )}
              </div>
            </div>

            {/* Notes + AI insight */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles size={12} className="text-cyan-500" />Notes & AI Insights
              </h4>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">{rec.notes}</p>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Sparkles size={10} className="text-cyan-500" />
                    <span className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">AI Recommendation</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {rec.riskScore > 80
                      ? 'Immediate escalation recommended. High default probability. Consider legal action if no response within 7 days.'
                      : rec.riskScore > 60
                      ? 'Priority follow-up required. Send formal payment reminder today. Offer EMI option to reduce default risk.'
                      : rec.riskScore > 30
                      ? 'Standard follow-up on schedule. Payment likely within 15 days based on account history.'
                      : 'Low risk account. Continue standard collection cycle. No intervention required at this time.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                  <CreditCard size={12} />Record Payment
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Send size={12} />Send Reminder
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </td>
    </motion.tr>
  );
}

function Row({ k, v, highlight, green }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-[11px] text-slate-500 dark:text-slate-500 flex-none">{k}</span>
      <span className={`text-[11px] font-medium text-right ${highlight ? 'text-rose-600 dark:text-rose-400' : green ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
        {v}
      </span>
    </div>
  );
}

const COL_WIDTHS = {
  sel:        40,
  invoice:    140,
  entity:     180,
  type:       130,
  branch:     130,
  dept:       120,
  billing:    100,
  due:        100,
  aging:       80,
  amount:     110,
  outstanding:120,
  collected:  140,
  insStatus:  130,
  status:     140,
  risk:       130,
  collector:  130,
  lastFU:     100,
  source:     110,
  actions:     80,
};

const SORT_FIELDS = ['invoice','aging','amount','outstanding'];

export default function ARGrid({ rows, selectedRows, onSelect, onSelectAll, onRowClick, onAction }) {
  const [expanded, setExpanded]   = useState(new Set());
  const [sortField, setSortField] = useState('aging');
  const [sortDir, setSortDir]     = useState('desc');
  const [hoveredRow, setHoveredRow] = useState(null);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const fieldMap = { invoice: 'invoiceNo', aging: 'agingDays', amount: 'invoiceAmount', outstanding: 'outstandingAmount' };
      const f = fieldMap[sortField] ?? sortField;
      const dir = sortDir === 'asc' ? 1 : -1;
      if (a[f] < b[f]) return -dir;
      if (a[f] > b[f]) return dir;
      return 0;
    });
  }, [rows, sortField, sortDir]);

  const toggleSort = (f) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const SortIcon = ({ f }) => (
    sortField === f
      ? sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />
      : <ArrowUpDown size={11} className="text-slate-300 group-hover:text-slate-500" />
  );

  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const partial = selectedRows.length > 0 && selectedRows.length < rows.length;

  const rowActions = [
    { id: 'view',       label: 'View Invoice',     icon: Eye      },
    { id: 'payment',    label: 'Record Payment',   icon: CreditCard },
    { id: 'reminder',   label: 'Send Reminder',    icon: Send     },
    { id: 'reconcile',  label: 'Reconcile',        icon: GitMerge },
    { id: 'audit',      label: 'Audit Trail',      icon: ClipboardList },
    { id: 'assign',     label: 'Assign Collector', icon: UserCheck},
  ];

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full min-w-[1600px] border-collapse text-sm">
        {/* Sticky header */}
        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th style={{ width: COL_WIDTHS.sel }} className="px-3 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => el && (el.indeterminate = partial)}
                onChange={() => onSelectAll()}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
            </th>
            {[
              { key: 'invoice',     label: 'Invoice',         sortable: true  },
              { key: 'entity',      label: 'Patient / Org',   sortable: false },
              { key: 'type',        label: 'Type',            sortable: false },
              { key: 'branch',      label: 'Branch',          sortable: false },
              { key: 'dept',        label: 'Department',      sortable: false },
              { key: 'billing',     label: 'Billed On',       sortable: false },
              { key: 'due',         label: 'Due Date',        sortable: false },
              { key: 'aging',       label: 'Aging',           sortable: true  },
              { key: 'amount',      label: 'Invoice Amt',     sortable: true  },
              { key: 'outstanding', label: 'Outstanding',     sortable: true  },
              { key: 'collected',   label: 'Collected',       sortable: false },
              { key: 'insStatus',   label: 'Ins. Status',     sortable: false },
              { key: 'status',      label: 'Collection',      sortable: false },
              { key: 'risk',        label: 'Risk',            sortable: false },
              { key: 'collector',   label: 'Collector',       sortable: false },
              { key: 'lastFU',      label: 'Last Follow-Up',  sortable: false },
              { key: 'source',      label: 'Source',          sortable: false },
              { key: 'actions',     label: '',                sortable: false },
            ].map(col => (
              <th
                key={col.key}
                style={{ width: COL_WIDTHS[col.key] }}
                className={`px-3 py-3 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap group
                  ${col.sortable ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-300' : ''}`}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && <SortIcon f={col.key} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={18} className="py-20 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-600">
                  <RefreshCw size={32} className="opacity-40" />
                  <p className="text-sm font-medium">No receivables match your filters</p>
                  <p className="text-xs">Try adjusting your search or filter criteria</p>
                </div>
              </td>
            </tr>
          ) : sorted.map((rec, idx) => {
            const isExpanded  = expanded.has(rec.id);
            const isSelected  = selectedRows.includes(rec.id);
            const isHovered   = hoveredRow === rec.id;
            const aging       = agingBadge(rec.agingDays);
            const entityName  = rec.patientName ?? rec.orgName ?? '—';
            const isOverdue   = rec.agingDays > 30;

            return (
              <>
                <motion.tr
                  key={rec.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.25 }}
                  onMouseEnter={() => setHoveredRow(rec.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`border-b transition-colors cursor-pointer
                    ${isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                      : isHovered
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                    }
                    ${isExpanded ? 'border-l-2 border-l-blue-400' : ''}
                  `}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelect(rec.id)}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  {/* Invoice */}
                  <td className="px-3 py-2.5" onClick={() => toggleExpand(rec.id)}>
                    <div className="flex items-center gap-1.5">
                      <button className="text-slate-400 hover:text-blue-500 transition-colors flex-none">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        {rec.invoiceNo}
                      </span>
                    </div>
                  </td>

                  {/* Entity */}
                  <td className="px-3 py-2.5" onClick={() => toggleExpand(rec.id)}>
                    <div className="flex items-center gap-2">
                      <AvatarInitials
                        name={entityName}
                        color={RECEIVABLE_TYPES[rec.type]?.color}
                      />
                      <div>
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]" title={entityName}>
                          {entityName}
                        </div>
                        {rec.patientId && (
                          <div className="text-[10px] text-slate-400">{rec.patientId}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-2.5"><TypeBadge type={rec.type} /></td>

                  {/* Branch */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-slate-600 dark:text-slate-400">{rec.branch}</span>
                  </td>

                  {/* Department */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate block max-w-[100px]">{rec.department}</span>
                  </td>

                  {/* Billing date */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{rec.billingDate}</span>
                  </td>

                  {/* Due date */}
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-mono ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {rec.dueDate}
                    </span>
                  </td>

                  {/* Aging */}
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${aging.cls}`}>
                      {aging.label}
                    </span>
                  </td>

                  {/* Invoice amount */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                      ₹{rec.invoiceAmount.toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Outstanding */}
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-mono font-bold ${rec.outstandingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      ₹{rec.outstandingAmount.toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Collected (mini bar) */}
                  <td className="px-3 py-2.5">
                    <CollectionBar
                      invoice={rec.invoiceAmount}
                      collected={rec.collectedAmount}
                      outstanding={rec.outstandingAmount}
                    />
                  </td>

                  {/* Insurance status */}
                  <td className="px-3 py-2.5"><InsuranceBadge status={rec.insuranceStatus} /></td>

                  {/* Collection status */}
                  <td className="px-3 py-2.5"><StatusBadge status={rec.collectionStatus} /></td>

                  {/* Risk */}
                  <td className="px-3 py-2.5"><RiskBadge level={rec.riskLevel} score={rec.riskScore} /></td>

                  {/* Collector */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <AvatarInitials name={rec.assignedCollector} color="#6366f1" />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[80px]">{rec.assignedCollector.split(' ')[0]}</span>
                    </div>
                  </td>

                  {/* Last follow-up */}
                  <td className="px-3 py-2.5">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{rec.lastFollowUp}</span>
                  </td>

                  {/* Source */}
                  <td className="px-3 py-2.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{rec.sourceModule}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                          <button
                            onClick={() => onAction('payment', rec)}
                            title="Record Payment"
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          >
                            <CreditCard size={11} />
                          </button>
                          <button
                            onClick={() => onAction('reminder', rec)}
                            title="Send Reminder"
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Send size={11} />
                          </button>
                          <div className="relative group/menu">
                            <button className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                              <MoreHorizontal size={11} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </motion.tr>

                {/* Expanded row */}
                <AnimatePresence>
                  {isExpanded && <ExpandedRow key={`${rec.id}-expanded`} rec={rec} />}
                </AnimatePresence>
              </>
            );
          })}
        </tbody>
      </table>

      {/* Real-time update indicator */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-lg text-[11px] text-slate-500 dark:text-slate-400">
        <Zap size={11} className="text-emerald-500 animate-pulse" />
        Live · Updated just now
      </div>
    </div>
  );
}
