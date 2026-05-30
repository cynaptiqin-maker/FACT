import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, Calendar, Clock, BookOpen, MessageSquare,
  ShieldAlert, ClipboardList, ChevronRight, CheckCircle2,
  Circle, GitMerge, Download, Printer, Sparkles,
  AlertTriangle, TrendingDown, Activity, Package,
} from 'lucide-react';
import { PAYMENT_STATUSES, APPROVAL_STATUSES, PROCUREMENT_STATUSES, RISK_LEVELS, agingBadge, VENDOR_CATEGORIES } from './APConstants';

const TABS = [
  { id: 'overview',    label: 'Overview',        icon: FileText     },
  { id: 'procurement', label: 'Procurement',      icon: Package      },
  { id: 'payment',     label: 'Payments',         icon: Calendar     },
  { id: 'journal',     label: 'Journal Entries',  icon: BookOpen     },
  { id: 'fraud',       label: 'Fraud & Risk',     icon: ShieldAlert  },
  { id: 'audit',       label: 'Audit Trail',      icon: ClipboardList},
  { id: 'notes',       label: 'Notes',            icon: MessageSquare},
];

function DetailRow({ label, value, mono, highlight, green }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-500 flex-none w-40">{label}</span>
      <span className={`text-xs text-right flex-1 ${mono ? 'font-mono' : 'font-medium'} ${highlight ? 'text-rose-600 dark:text-rose-400 font-bold' : green ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

function TimelineItem({ date, title, by, type, last }) {
  const colors = { PAYMENT: '#10b981', APPROVAL: '#3b82f6', ESCALATION: '#ef4444', NOTE: '#8b5cf6', STATUS: '#f59e0b', PROCUREMENT: '#06b6d4' };
  return (
    <div className="relative flex gap-3">
      {!last && <div className="absolute left-3 top-6 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />}
      <div className="w-6 h-6 rounded-full flex-none flex items-center justify-center z-10" style={{ background: `${colors[type] ?? '#64748b'}22` }}>
        <div className="w-2 h-2 rounded-full" style={{ background: colors[type] ?? '#64748b' }} />
      </div>
      <div className="pb-4">
        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{title}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">{date} · {by}</div>
      </div>
    </div>
  );
}

function JournalEntry({ dr, narration, amount }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-xs">
      <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] flex-none
        ${dr ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'}`}>
        {dr ? 'Dr' : 'Cr'}
      </span>
      <span className="flex-1 text-slate-600 dark:text-slate-400">{narration}</span>
      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">₹{amount.toLocaleString('en-IN')}</span>
    </div>
  );
}

function WorkflowStep({ step, status, actor, date }) {
  const statusStyle = {
    done:    { icon: CheckCircle2, color: 'text-emerald-500', border: 'border-emerald-200 dark:border-emerald-800', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    active:  { icon: Activity,     color: 'text-amber-500',   border: 'border-amber-200 dark:border-amber-800',   bg: 'bg-amber-50 dark:bg-amber-900/20'   },
    pending: { icon: Circle,       color: 'text-slate-400',   border: 'border-slate-200 dark:border-slate-700',   bg: 'bg-slate-50 dark:bg-slate-900'      },
  }[status];
  const Icon = statusStyle.icon;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${statusStyle.border} ${statusStyle.bg}`}>
      <Icon size={16} className={`flex-none mt-0.5 ${statusStyle.color}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{step}</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{actor}{date ? ` · ${date}` : ''}</div>
      </div>
    </div>
  );
}

export default function APDetailDrawer({ rec, onClose }) {
  const [tab, setTab] = useState('overview');
  if (!rec) return null;

  const riskCfg    = RISK_LEVELS[rec.riskLevel]           ?? RISK_LEVELS.LOW;
  const aging      = agingBadge(rec.agingDays);
  const catCfg     = VENDOR_CATEGORIES[rec.category]      ?? VENDOR_CATEGORIES.CORPORATE;
  const payCfg     = PAYMENT_STATUSES[rec.paymentStatus]  ?? PAYMENT_STATUSES.PENDING;
  const apvCfg     = APPROVAL_STATUSES[rec.approvalStatus]?? APPROVAL_STATUSES.PENDING;

  const mockTimeline = [
    { date: rec.lastUpdated, title: `Status updated to ${payCfg.label}`,   by: 'Finance System',     type: 'STATUS'      },
    { date: '2026-05-10',    title: 'Invoice matched to GRN',               by: 'Procurement Module', type: 'PROCUREMENT' },
    { date: '2026-05-05',    title: `Approved by ${rec.assignedApprover}`,  by: rec.assignedApprover, type: 'APPROVAL'    },
    { date: rec.invoiceDate, title: `Invoice ${rec.invoiceNo} received`,     by: 'Accounts Payable',   type: 'STATUS'      },
    ...(rec.paidAmount > 0 ? [{ date: '2026-04-28', title: `Part payment ₹${rec.paidAmount.toLocaleString('en-IN')} released`, by: 'Finance', type: 'PAYMENT' }] : []),
  ];

  const approvalSteps = [
    { step: 'Invoice Receipt & Verification', status: 'done',   actor: 'AP Team',             date: rec.invoiceDate },
    { step: 'Procurement 3-Way Match',        status: rec.procurementStatus === 'MATCHED' ? 'done' : rec.procurementStatus === 'EXCEPTION' ? 'active' : 'pending', actor: 'Procurement System', date: rec.procurementStatus === 'MATCHED' ? '2026-05-10' : null },
    { step: `L1 Approval — ${rec.assignedApprover}`, status: rec.approvalStatus === 'APPROVED' ? 'done' : rec.approvalStatus === 'PENDING' ? 'active' : 'pending', actor: rec.assignedApprover, date: rec.approvalStatus === 'APPROVED' ? '2026-05-12' : null },
    { step: 'CFO / Finance Review',           status: rec.riskScore > 70 ? 'active' : rec.approvalStatus === 'APPROVED' ? 'done' : 'pending', actor: 'Arvind Kumar (CFO)', date: null },
    { step: 'Payment Release',                status: rec.paymentStatus === 'PAID' ? 'done' : rec.paymentStatus === 'SCHEDULED' ? 'active' : 'pending', actor: 'Treasury', date: null },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end"
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-white dark:bg-slate-950 flex-none">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">{rec.invoiceNo}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${payCfg.bg} ${payCfg.text}`}>{payCfg.label}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${aging.cls}`}>{aging.label}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">{rec.vendorName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{rec.vendorCode} · {rec.department} · {rec.branch}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Quick stats */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-3 flex-none">
            {[
              { label: 'Invoice Amt',   val: `₹${rec.invoiceAmount.toLocaleString('en-IN')}`,   color: 'text-slate-800 dark:text-slate-100' },
              { label: 'Outstanding',   val: `₹${rec.outstandingAmount.toLocaleString('en-IN')}`,color: 'text-rose-600 dark:text-rose-400 font-bold' },
              { label: 'Tax (GST)',     val: `₹${rec.taxAmount.toLocaleString('en-IN')}`,       color: 'text-slate-700 dark:text-slate-300' },
              { label: 'Risk Score',   val: `${rec.riskScore}/100`,                              color: riskCfg.badgeText },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-sm font-bold font-mono ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-0 overflow-x-auto scrollbar-hide flex-none bg-white dark:bg-slate-950">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors
                  ${tab === t.id
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <t.icon size={12} />{t.label}
                {t.id === 'fraud' && rec.riskScore > 60 && (
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">!</span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >

                {/* ── OVERVIEW ─────────────────────────────────── */}
                {tab === 'overview' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Invoice Details</h3>
                      <DetailRow label="Invoice Number"    value={rec.invoiceNo}       mono />
                      <DetailRow label="Vendor"            value={rec.vendorName} />
                      <DetailRow label="Category"          value={catCfg.label} />
                      <DetailRow label="Branch"            value={rec.branch} />
                      <DetailRow label="Department"        value={rec.department} />
                      <DetailRow label="Invoice Date"      value={rec.invoiceDate}     mono />
                      <DetailRow label="Due Date"          value={rec.dueDate}         mono />
                      <DetailRow label="Aging"             value={`${rec.agingDays} days`} />
                      <DetailRow label="Invoice Amount"    value={`₹${rec.invoiceAmount.toLocaleString('en-IN')}`} mono />
                      <DetailRow label="Outstanding"       value={`₹${rec.outstandingAmount.toLocaleString('en-IN')}`} highlight />
                      <DetailRow label="GST Amount"        value={`₹${rec.taxAmount.toLocaleString('en-IN')}`} mono />
                      <DetailRow label="Tax Status"        value={rec.taxStatus?.replace(/_/g, ' ') ?? '—'} />
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">AI Payable Insight</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {rec.riskScore > 80
                          ? `Critical payable (risk ${rec.riskScore}/100). Vendor supply suspension risk is immediate. Process payment within 48 hours and escalate to CFO for expedited approval.`
                          : rec.riskScore > 60
                          ? `High-risk payable (${rec.riskScore}/100). Overdue ${rec.agingDays} days. Prioritise in next payment batch. Contact vendor to confirm continued supply.`
                          : rec.riskScore > 30
                          ? `Moderate risk (${rec.riskScore}/100). Ensure approval workflow is complete and include in next scheduled payment run. Verify GRN match.`
                          : `Low-risk payable (${rec.riskScore}/100). All controls satisfied. Include in standard payment batch per normal schedule.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── PROCUREMENT ──────────────────────────────── */}
                {tab === 'procurement' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Procurement Linkage</h3>
                      <DetailRow label="Purchase Order"   value={rec.poNumber ?? 'No PO raised'} mono />
                      <DetailRow label="GRN Number"       value={rec.grnNumber ?? 'GRN Pending'} mono />
                      <DetailRow label="Match Status"     value={PROCUREMENT_STATUSES[rec.procurementStatus]?.label ?? '—'} />
                      <DetailRow label="Matching Type"    value={rec.poNumber && rec.grnNumber ? '3-Way Match (PO + GRN + Invoice)' : rec.poNumber ? '2-Way Match (PO + Invoice)' : 'No Match'} />
                      <DetailRow label="Approver"         value={rec.assignedApprover} />
                      <DetailRow label="Approval Status"  value={apvCfg.label} />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Approval Workflow</h3>
                      <div className="space-y-2">
                        {approvalSteps.map((s, i) => <WorkflowStep key={i} {...s} />)}
                      </div>
                    </div>

                    {rec.procurementStatus === 'EXCEPTION' && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-800 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <AlertTriangle size={13} className="text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">GRN Mismatch Exception</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Quantity received in GRN does not match invoice line items. Payment is blocked until procurement team resolves the discrepancy.
                        </p>
                        <button className="mt-2 text-[11px] font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1 hover:underline">
                          Resolve Exception <ChevronRight size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PAYMENT ──────────────────────────────────── */}
                {tab === 'payment' && (
                  <div className="space-y-3">
                    {rec.paidAmount > 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Payment History</h3>
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                          <CheckCircle2 size={20} className="text-emerald-500 flex-none" />
                          <div>
                            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                              ₹{rec.paidAmount.toLocaleString('en-IN')} released
                            </div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-500">NEFT Transfer · 2026-04-28 · Ref: PAY2026042801</div>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                          <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">Balance Outstanding</div>
                          <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                            ₹{rec.outstandingAmount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-8 text-slate-400 dark:text-slate-600 gap-2">
                        <Circle size={32} className="opacity-40" />
                        <p className="text-sm">No payments released yet</p>
                        <p className="text-xs font-mono text-rose-500 dark:text-rose-400">
                          Outstanding: ₹{rec.outstandingAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button className="flex items-center justify-center gap-2 h-10 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors">
                        <Calendar size={14} />Schedule Payment
                      </button>
                      <button className="flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <TrendingDown size={14} />Part Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* ── JOURNAL ──────────────────────────────────── */}
                {tab === 'journal' && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">On Invoice Receipt</h3>
                      <JournalEntry dr narration={`Expense — ${VENDOR_CATEGORIES[rec.category]?.label ?? 'Procurement'}`} amount={Math.round(rec.invoiceAmount * 0.85)} />
                      <JournalEntry dr narration="GST Input Tax Credit — 18%" amount={rec.taxAmount} />
                      <JournalEntry narration={`Accounts Payable — ${rec.vendorName}`} amount={rec.invoiceAmount} />
                    </div>
                    {rec.paidAmount > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">On Payment Release</h3>
                        <JournalEntry dr narration={`Accounts Payable — ${rec.vendorName}`} amount={rec.paidAmount} />
                        <JournalEntry narration="Bank — HDFC Current A/c" amount={rec.paidAmount} />
                      </div>
                    )}
                    <button className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                      <BookOpen size={11} />Open in General Ledger <ChevronRight size={11} />
                    </button>
                  </div>
                )}

                {/* ── FRAUD & RISK ──────────────────────────────── */}
                {tab === 'fraud' && (
                  <div className="space-y-3">
                    <div className={`rounded-xl border p-4 ${rec.riskScore > 70
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                      : rec.riskScore > 40
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                      : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert size={14} className={riskCfg.badgeText} />
                        <span className={`text-xs font-semibold ${riskCfg.badgeText} uppercase tracking-wide`}>
                          Risk Score: {rec.riskScore}/100 — {riskCfg.label}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${rec.riskScore}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: riskCfg.color }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {[
                          { label: 'PO Compliance',   val: rec.poNumber ? 'Pass' : 'Fail',   ok: !!rec.poNumber },
                          { label: 'GRN Match',        val: rec.grnNumber ? 'Pass' : 'Pending', ok: !!rec.grnNumber },
                          { label: 'Approval Chain',   val: rec.approvalStatus === 'APPROVED' ? 'Complete' : 'Incomplete', ok: rec.approvalStatus === 'APPROVED' },
                          { label: 'GST Compliance',   val: rec.taxStatus === 'GST_FILED' ? 'Compliant' : 'Issue', ok: rec.taxStatus === 'GST_FILED' },
                          { label: 'Aging Threshold',  val: rec.agingDays > 60 ? 'Breached' : 'Within',  ok: rec.agingDays <= 60 },
                          { label: 'Duplicate Check',  val: rec.riskScore > 70 ? 'Flagged' : 'Clear',   ok: rec.riskScore <= 70 },
                        ].map(c => (
                          <div key={c.label} className={`flex items-center justify-between p-2 rounded-lg border ${c.ok ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}>
                            <span className="text-slate-600 dark:text-slate-400">{c.label}</span>
                            <span className={c.ok ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>{c.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-blue-950 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={12} className="text-cyan-400" />
                        <span className="text-xs font-semibold">AI Fraud Assessment</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {rec.procurementStatus === 'EXCEPTION'
                          ? 'GRN quantity mismatch is a significant fraud indicator. Cross-reference with purchase order and physical inventory before releasing payment.'
                          : !rec.poNumber
                          ? 'Missing Purchase Order is a high-risk procurement control failure. Retroactive PO approval must be completed and documented before payment.'
                          : rec.riskScore > 70
                          ? `Risk score ${rec.riskScore}/100 — multiple risk indicators active. Manual review by finance team required before payment release.`
                          : `Risk score ${rec.riskScore}/100 — within acceptable range. Standard payment controls apply. No fraud indicators detected.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── AUDIT ────────────────────────────────────── */}
                {tab === 'audit' && (
                  <div>
                    {mockTimeline.map((item, i) => (
                      <TimelineItem key={i} {...item} last={i === mockTimeline.length - 1} />
                    ))}
                  </div>
                )}

                {/* ── NOTES ────────────────────────────────────── */}
                {tab === 'notes' && (
                  <div className="space-y-3">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Latest Note</div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{rec.notes}</p>
                      <div className="text-[10px] text-slate-400 mt-2">{rec.assignedApprover} · {rec.lastUpdated}</div>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Add a payable note or resolution comment…"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none focus:border-amber-400 resize-none"
                    />
                    <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity">
                      <MessageSquare size={12} />Save Note
                    </button>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom actions */}
          <div className="flex-none border-t border-slate-200 dark:border-slate-800 px-5 py-3 bg-white dark:bg-slate-950 flex items-center gap-2">
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors">
              <Calendar size={12} />Schedule Payment
            </button>
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <CheckCircle2 size={12} />Approve
            </button>
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <GitMerge size={12} />Reconcile
            </button>
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ml-auto">
              <Printer size={12} />Print
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
