// ─── Doctor Payouts — Payout Management Grid ──────────────────────────────────
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, MoreHorizontal, Eye, FileText, GitMerge,
  Landmark, ClipboardList, Workflow, Sparkles, CheckSquare, Square,
  ExternalLink, AlertTriangle, CreditCard, BookOpen, ArrowUpRight,
  AlertCircle, Banknote, Activity, TrendingUp,
} from 'lucide-react';
import {
  PAYOUT_STATUSES, APPROVAL_STATUSES, PAYMENT_STATUSES,
  RISK_LEVELS, PAYOUT_TYPES, EMPLOYMENT_TYPES,
  fmtINR, fmtDate,
} from './DPConstants';

// ─── Utility Badges ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = PAYOUT_STATUSES[status] ?? PAYOUT_STATUSES.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function ApprovalBadge({ status }) {
  const cfg = APPROVAL_STATUSES[status] ?? APPROVAL_STATUSES.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function PaymentBadge({ status }) {
  const cfg = PAYMENT_STATUSES[status] ?? PAYMENT_STATUSES.UNPAID;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const cfg = PAYOUT_TYPES[type] ?? PAYOUT_TYPES.CONSULTATION;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${cfg.lightBg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function RiskBadge({ level, score }) {
  const cfg = RISK_LEVELS[level] ?? RISK_LEVELS.LOW;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
      {score != null && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{score}%</span>}
    </div>
  );
}

function DoctorAvatar({ initials, color, name }) {
  return (
    <div className="flex items-center gap-2.5 min-w-[160px]">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-none"
        style={{ background: color }}
      >
        {initials}
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[130px]">{name}</div>
      </div>
    </div>
  );
}

function CollectionBar({ collected, total }) {
  const pct = total > 0 ? (collected / total) * 100 : 0;
  const color = pct >= 100 ? '#10b981' : pct >= 80 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col gap-0.5 min-w-[80px]">
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono font-semibold" style={{ color }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

// ─── Row Action Menu ──────────────────────────────────────────────────────────
function RowMenu({ payout, onAction }) {
  const [open, setOpen] = useState(false);

  const actions = [
    { id: 'view',       icon: Eye,          label: 'View Details'         },
    { id: 'invoice',    icon: FileText,     label: 'View Invoices'        },
    { id: 'ar',         icon: ArrowUpRight, label: 'View Collections'     },
    { id: 'ap',         icon: Banknote,     label: 'View AP Entry'        },
    { id: 'gl',         icon: BookOpen,     label: 'View GL Postings'     },
    { id: 'transfer',   icon: CreditCard,   label: 'Process Transfer'     },
    { id: 'bank',       icon: Landmark,     label: 'Bank Reconciliation'  },
    { id: 'audit',      icon: ClipboardList,label: 'Audit Trail'          },
    { id: 'workflow',   icon: Workflow,     label: 'Workflow History'     },
    { id: 'ai',         icon: Sparkles,     label: 'AI Analysis'          },
  ];

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 z-30 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
            >
              {actions.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={e => { e.stopPropagation(); onAction(id, payout); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Icon size={12} className="text-slate-400 flex-none" />
                  {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Expanded Row Detail ──────────────────────────────────────────────────────
function ExpandedRow({ payout, onAction }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={20} className="px-4 pb-4">
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Revenue Breakdown */}
          <div>
            <h4 className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp size={11} /> Revenue Breakdown
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Consultation',  val: payout.consultationRevenue, color: '#059669' },
                { label: 'Procedure',     val: payout.procedureRevenue,    color: '#0ea5e9' },
                { label: 'OT',            val: payout.otRevenue,           color: '#8b5cf6' },
                { label: 'ICU',           val: payout.icuRevenue,          color: '#f97316' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm flex-none" style={{ background: color }} />
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmtINR(val)}</span>
                </div>
              ))}
              <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">Total Revenue</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{fmtINR(payout.revenueGenerated)}</span>
              </div>
            </div>
          </div>

          {/* Payout Calculation */}
          <div>
            <h4 className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity size={11} /> Payout Calculation
            </h4>
            <div className="space-y-2">
              {[
                { label: `Revenue Share (${payout.sharePercent}%)`, val: payout.revenueShareAmount, color: 'text-emerald-600 dark:text-emerald-400', sign: '+' },
                { label: 'Incentive Amount',    val: payout.incentiveAmount,    color: 'text-violet-600 dark:text-violet-400', sign: '+' },
                { label: 'TDS Deduction',       val: payout.tdsDeduction,       color: 'text-rose-600 dark:text-rose-400',    sign: '-' },
                { label: 'Professional Tax',    val: payout.profTaxDeduction,   color: 'text-rose-500 dark:text-rose-400',    sign: '-' },
                { label: 'Other Deductions',    val: payout.otherDeductions,    color: 'text-rose-500 dark:text-rose-400',    sign: '-' },
              ].map(({ label, val, color, sign }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{label}</span>
                  <span className={`font-mono font-semibold ${color}`}>{sign}{fmtINR(val)}</span>
                </div>
              ))}
              <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-200">Net Payout</span>
                <span className="font-mono text-lg text-emerald-600 dark:text-emerald-400">{fmtINR(payout.netPayout)}</span>
              </div>
            </div>
          </div>

          {/* Cross-Module Links + AI */}
          <div>
            <h4 className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <GitMerge size={11} /> Linked Records
            </h4>
            <div className="space-y-1.5">
              {[
                { label: 'AP Entry',          val: payout.apEntryId,          icon: Banknote,      action: 'ap'     },
                { label: 'GL Posting',         val: payout.glPostingId,        icon: BookOpen,      action: 'gl'     },
                { label: 'Bank Transfer',      val: payout.bankTransferId,     icon: Landmark,      action: 'bank'   },
                { label: 'Reconciliation',     val: payout.reconciliationId,   icon: GitMerge,      action: 'recon'  },
              ].map(({ label, val, icon: Icon, action }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Icon size={11} />
                    <span>{label}</span>
                  </div>
                  {val ? (
                    <button
                      onClick={() => onAction(action, payout)}
                      className="flex items-center gap-0.5 font-mono text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      {val} <ExternalLink size={9} />
                    </button>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  )}
                </div>
              ))}
              <div className="mt-3 p-2.5 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                <div className="flex items-start gap-1.5">
                  <Sparkles size={11} className="text-cyan-500 flex-none mt-0.5" />
                  <p className="text-[10.5px] text-cyan-700 dark:text-cyan-400 leading-relaxed">{payout.aiInsight}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Main Grid ────────────────────────────────────────────────────────────────
const COL_HEADERS = [
  { id: 'select',     label: '',                  w: 'w-8',       sticky: true  },
  { id: 'expand',     label: '',                  w: 'w-8',       sticky: false },
  { id: 'id',         label: 'Payout ID',         w: 'w-32',      sticky: false },
  { id: 'doctor',     label: 'Doctor',            w: 'w-48',      sticky: false },
  { id: 'specialty',  label: 'Specialty',         w: 'w-44',      sticky: false },
  { id: 'dept',       label: 'Department',        w: 'w-36',      sticky: false },
  { id: 'branch',     label: 'Branch',            w: 'w-32',      sticky: false },
  { id: 'revenue',    label: 'Revenue Generated', w: 'w-36',      sticky: false },
  { id: 'share',      label: 'Share %',           w: 'w-20',      sticky: false },
  { id: 'incentive',  label: 'Incentive',         w: 'w-28',      sticky: false },
  { id: 'deduction',  label: 'Deductions',        w: 'w-28',      sticky: false },
  { id: 'net',        label: 'Net Payout',        w: 'w-32',      sticky: false },
  { id: 'insurance',  label: 'Insurance Linked',  w: 'w-32',      sticky: false },
  { id: 'collection', label: 'Collection',        w: 'w-28',      sticky: false },
  { id: 'approval',   label: 'Approval',          w: 'w-32',      sticky: false },
  { id: 'payment',    label: 'Payment',           w: 'w-36',      sticky: false },
  { id: 'risk',       label: 'Risk',              w: 'w-28',      sticky: false },
  { id: 'type',       label: 'Type',              w: 'w-36',      sticky: false },
  { id: 'updated',    label: 'Last Updated',      w: 'w-32',      sticky: false },
  { id: 'actions',    label: '',                  w: 'w-10',      sticky: false },
];

export default function DPGrid({ payouts, selectedRows, onSelect, onSelectAll, onAction, expandedRow, onExpand }) {
  const allSelected = payouts.length > 0 && selectedRows.length === payouts.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < payouts.length;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              {/* Select all */}
              <th className="w-8 px-3 py-3 text-left">
                <button onClick={onSelectAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {allSelected ? <CheckSquare size={14} className="text-emerald-500" /> : someSelected ? <CheckSquare size={14} className="text-slate-400" /> : <Square size={14} />}
                </button>
              </th>
              <th className="w-8 px-1" />
              {COL_HEADERS.slice(2).map(col => (
                <th
                  key={col.id}
                  className={`${col.w} px-3 py-3 text-left text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {payouts.length === 0 && (
              <tr>
                <td colSpan={20} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Activity size={20} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No payouts match your filters</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filter criteria</p>
                  </div>
                </td>
              </tr>
            )}
            {payouts.map((p, idx) => (
              <AnimatePresence key={p.id}>
                <motion.tr
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  onClick={() => onAction('view', p)}
                  className={`group cursor-pointer transition-colors ${
                    selectedRows.includes(p.id)
                      ? 'bg-emerald-50 dark:bg-emerald-900/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="w-8 px-3 py-2.5">
                    <button
                      onClick={e => { e.stopPropagation(); onSelect(p.id); }}
                      className="text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      {selectedRows.includes(p.id)
                        ? <CheckSquare size={13} className="text-emerald-500" />
                        : <Square size={13} />
                      }
                    </button>
                  </td>

                  {/* Expand toggle */}
                  <td className="w-8 px-1 py-2.5">
                    <button
                      onClick={e => { e.stopPropagation(); onExpand(p.id); }}
                      className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-all"
                    >
                      {expandedRow === p.id
                        ? <ChevronDown size={12} />
                        : <ChevronRight size={12} />
                      }
                    </button>
                  </td>

                  {/* Payout ID */}
                  <td className="w-32 px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {p.fraudFlags?.length > 0 && (
                        <AlertTriangle size={11} className="text-amber-500 flex-none" />
                      )}
                      <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">{p.id}</span>
                    </div>
                  </td>

                  {/* Doctor */}
                  <td className="w-48 px-3 py-2.5">
                    <DoctorAvatar initials={p.initials} color={p.avatarColor} name={p.doctorName} />
                  </td>

                  {/* Specialty */}
                  <td className="w-44 px-3 py-2.5">
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate block max-w-[160px]">{p.specialty}</span>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full ${EMPLOYMENT_TYPES[p.employmentType]?.bg} ${EMPLOYMENT_TYPES[p.employmentType]?.text}`}>
                      {EMPLOYMENT_TYPES[p.employmentType]?.label}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="w-36 px-3 py-2.5">
                    <span className="text-xs text-slate-600 dark:text-slate-300">{p.department}</span>
                  </td>

                  {/* Branch */}
                  <td className="w-32 px-3 py-2.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{p.branch}</span>
                  </td>

                  {/* Revenue */}
                  <td className="w-36 px-3 py-2.5">
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{fmtINR(p.revenueGenerated)}</span>
                  </td>

                  {/* Share % */}
                  <td className="w-20 px-3 py-2.5">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{p.sharePercent}%</span>
                  </td>

                  {/* Incentive */}
                  <td className="w-28 px-3 py-2.5">
                    <span className="font-mono text-xs font-semibold text-violet-600 dark:text-violet-400">{fmtINR(p.incentiveAmount)}</span>
                  </td>

                  {/* Deductions */}
                  <td className="w-28 px-3 py-2.5">
                    <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">-{fmtINR(p.totalDeductions)}</span>
                  </td>

                  {/* Net Payout */}
                  <td className="w-32 px-3 py-2.5">
                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">{fmtINR(p.netPayout)}</span>
                  </td>

                  {/* Insurance */}
                  <td className="w-32 px-3 py-2.5">
                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      {p.insuranceLinkedAmount > 0 ? fmtINR(p.insuranceLinkedAmount) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </span>
                  </td>

                  {/* Collection */}
                  <td className="w-28 px-3 py-2.5">
                    <CollectionBar collected={p.collectedAmount} total={p.revenueGenerated} />
                  </td>

                  {/* Approval */}
                  <td className="w-32 px-3 py-2.5">
                    <ApprovalBadge status={p.approvalStatus} />
                  </td>

                  {/* Payment */}
                  <td className="w-36 px-3 py-2.5">
                    <PaymentBadge status={p.paymentStatus} />
                  </td>

                  {/* Risk */}
                  <td className="w-28 px-3 py-2.5">
                    <RiskBadge level={p.riskLevel} score={p.riskScore} />
                  </td>

                  {/* Type */}
                  <td className="w-36 px-3 py-2.5">
                    <TypeBadge type={p.payoutType} />
                  </td>

                  {/* Last Updated */}
                  <td className="w-32 px-3 py-2.5">
                    <span className="text-[10.5px] text-slate-400 dark:text-slate-500">{fmtDate(p.lastUpdated)}</span>
                  </td>

                  {/* Actions */}
                  <td className="w-10 px-2 py-2.5" onClick={e => e.stopPropagation()}>
                    <RowMenu payout={p} onAction={onAction} />
                  </td>
                </motion.tr>

                {/* Expanded inline detail */}
                {expandedRow === p.id && (
                  <ExpandedRow key={`${p.id}-exp`} payout={p} onAction={onAction} />
                )}
              </AnimatePresence>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {payouts.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {payouts.length} payout{payouts.length !== 1 ? 's' : ''} · Apr 2026
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Total Net: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{fmtINR(payouts.reduce((s, p) => s + p.netPayout, 0))}</strong></span>
            <span>Total Revenue: <strong className="font-mono text-slate-700 dark:text-slate-300">{fmtINR(payouts.reduce((s, p) => s + p.revenueGenerated, 0))}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
