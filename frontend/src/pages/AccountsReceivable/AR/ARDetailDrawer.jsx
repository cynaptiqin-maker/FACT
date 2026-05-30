import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, CreditCard, Clock, Shield, BookOpen, MessageSquare,
  ChevronRight, Send, GitMerge, UserCheck, ClipboardList, Sparkles,
  TrendingUp, AlertTriangle, CheckCircle2, Circle, ArrowRight,
  Download, Printer, Phone, Mail,
} from 'lucide-react';
import { COLLECTION_STATUSES, RECEIVABLE_TYPES, RISK_LEVELS, agingBadge } from './ARConstants';

const TABS = [
  { id: 'overview',   label: 'Overview',        icon: FileText      },
  { id: 'payments',   label: 'Payments',         icon: CreditCard    },
  { id: 'insurance',  label: 'Insurance',        icon: Shield        },
  { id: 'journal',    label: 'Journal Entries',  icon: BookOpen      },
  { id: 'timeline',   label: 'Timeline',         icon: Clock         },
  { id: 'notes',      label: 'Notes',            icon: MessageSquare },
];

function DetailRow({ label, value, mono, highlight, green }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-500 flex-none w-36">{label}</span>
      <span className={`text-xs text-right flex-1 ${mono ? 'font-mono' : 'font-medium'} ${highlight ? 'text-rose-600 dark:text-rose-400 font-bold' : green ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

function TimelineItem({ date, title, by, type, last }) {
  const colors = { PAYMENT: '#10b981', REMINDER: '#3b82f6', ESCALATION: '#ef4444', NOTE: '#8b5cf6', STATUS: '#f59e0b' };
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

function JournalEntry({ dr, cr, amount, narration }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-xs">
      <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${dr ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'}`}>{dr ? 'Dr' : 'Cr'}</span>
      <span className="flex-1 text-slate-600 dark:text-slate-400">{narration}</span>
      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">₹{amount.toLocaleString('en-IN')}</span>
    </div>
  );
}

export default function ARDetailDrawer({ rec, onClose }) {
  const [tab, setTab] = useState('overview');

  if (!rec) return null;

  const riskCfg  = RISK_LEVELS[rec.riskLevel] ?? RISK_LEVELS.LOW;
  const aging    = agingBadge(rec.agingDays);
  const typeCfg  = RECEIVABLE_TYPES[rec.type] ?? RECEIVABLE_TYPES.PATIENT;
  const statusCfg= COLLECTION_STATUSES[rec.collectionStatus] ?? COLLECTION_STATUSES.PENDING;

  const mockTimeline = [
    { date: rec.lastFollowUp,  title: 'Follow-up call made',              by: rec.assignedCollector, type: 'REMINDER'   },
    { date: '2026-05-10',      title: 'Reminder SMS sent',                 by: 'System (Auto)',       type: 'REMINDER'   },
    { date: '2026-05-05',      title: 'Escalated to senior collector',      by: 'Billing Manager',    type: 'ESCALATION' },
    { date: rec.billingDate,   title: `Invoice ${rec.invoiceNo} created`,   by: 'Billing System',     type: 'STATUS'     },
    ...(rec.collectedAmount > 0 ? [{ date: '2026-04-22', title: `Payment ₹${rec.collectedAmount.toLocaleString('en-IN')} received`, by: 'Finance', type: 'PAYMENT' }] : []),
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

        {/* Panel */}
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
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">{rec.invoiceNo}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusCfg.bg} ${statusCfg.text}`}>{statusCfg.label}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${aging.cls}`}>{aging.label}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                {rec.patientName ?? rec.orgName}
              </h2>
              {rec.patientId && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{rec.patientId} · {rec.department} · {rec.branch}</p>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Quick stats bar */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-3 flex-none">
            {[
              { label: 'Invoice Amt',   val: `₹${rec.invoiceAmount.toLocaleString('en-IN')}`,   color: 'text-slate-800 dark:text-slate-100' },
              { label: 'Outstanding',   val: `₹${rec.outstandingAmount.toLocaleString('en-IN')}`, color: 'text-rose-600 dark:text-rose-400 font-bold' },
              { label: 'Collected',     val: `₹${rec.collectedAmount.toLocaleString('en-IN')}`,  color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
              { label: 'Risk Score',    val: `${rec.riskScore}/100`,                              color: riskCfg.badgeText },
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
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors
                  ${tab === t.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <t.icon size={12} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {tab === 'overview' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Invoice Details</h3>
                      <DetailRow label="Invoice Number"   value={rec.invoiceNo}       mono />
                      <DetailRow label="Patient / Org"    value={rec.patientName ?? rec.orgName ?? '—'} />
                      <DetailRow label="Type"             value={typeCfg.label} />
                      <DetailRow label="Branch"           value={rec.branch} />
                      <DetailRow label="Department"       value={rec.department} />
                      <DetailRow label="Source Module"    value={rec.sourceModule} />
                      <DetailRow label="Billing Date"     value={rec.billingDate}     mono />
                      <DetailRow label="Due Date"         value={rec.dueDate}         mono />
                      <DetailRow label="Aging (days)"     value={`${rec.agingDays} days`} />
                      <DetailRow label="Invoice Amount"   value={`₹${rec.invoiceAmount.toLocaleString('en-IN')}`} mono />
                      <DetailRow label="Outstanding"      value={`₹${rec.outstandingAmount.toLocaleString('en-IN')}`} highlight />
                      <DetailRow label="Collected"        value={`₹${rec.collectedAmount.toLocaleString('en-IN')}`} green />
                    </div>

                    {/* AI insight */}
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-900/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={13} className="text-cyan-600 dark:text-cyan-400" />
                        <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">AI Collection Insight</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {rec.riskScore > 80
                          ? `This account (risk score ${rec.riskScore}/100) is at critical risk. Payment default probability is 82% based on aging pattern and contact history. Immediate legal escalation recommended.`
                          : rec.riskScore > 60
                          ? `Risk score ${rec.riskScore}/100 indicates high collection risk. Priority follow-up is recommended today. Consider offering a payment plan to reduce default risk.`
                          : rec.riskScore > 30
                          ? `Moderate risk (${rec.riskScore}/100). Account is within manageable range. Scheduled follow-up by ${rec.assignedCollector} should yield results within 2 weeks.`
                          : `Low risk account (${rec.riskScore}/100). Based on payment history and account profile, collections should proceed normally without escalation.`}
                      </p>
                    </div>
                  </div>
                )}

                {tab === 'payments' && (
                  <div className="space-y-3">
                    {rec.collectedAmount > 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Payment History</h3>
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                          <CheckCircle2 size={20} className="text-emerald-500 flex-none" />
                          <div>
                            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                              ₹{rec.collectedAmount.toLocaleString('en-IN')} received
                            </div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-500">Online Transfer · 2026-04-22 · Ref: TXN20260422001</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-12 text-slate-400 dark:text-slate-600 gap-2">
                        <Circle size={32} className="opacity-40" />
                        <p className="text-sm">No payments recorded</p>
                        <p className="text-xs">Outstanding: ₹{rec.outstandingAmount.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                    <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                      <CreditCard size={15} />Record New Payment
                    </button>
                  </div>
                )}

                {tab === 'insurance' && (
                  <div className="space-y-4">
                    {rec.type === 'INSURANCE' || rec.insuranceStatus ? (
                      <>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Claim Details</h3>
                          <DetailRow label="TPA / Insurer"      value={rec.orgName ?? '—'} />
                          <DetailRow label="Claim Status"       value={rec.insuranceStatus?.replace(/_/g,' ') ?? '—'} />
                          <DetailRow label="Claim Amount"       value={`₹${rec.invoiceAmount.toLocaleString('en-IN')}`} mono />
                          <DetailRow label="Approved Amount"    value={rec.collectedAmount > 0 ? `₹${rec.collectedAmount.toLocaleString('en-IN')}` : 'Pending'} green={rec.collectedAmount > 0} />
                          <DetailRow label="Deductions"         value="₹0" />
                          <DetailRow label="Submission Date"    value={rec.billingDate} mono />
                          <DetailRow label="Expected Settlement"value="Within 30–45 days" />
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors">
                            <ArrowRight size={12} />Resubmit Claim
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <Download size={12} />Download Claim
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center py-12 text-slate-400 dark:text-slate-600 gap-2">
                        <Shield size={32} className="opacity-40" />
                        <p className="text-sm">No insurance claim on this receivable</p>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'journal' && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Linked Journal Entries</h3>
                      <JournalEntry dr narration="Accounts Receivable — Patient" amount={rec.invoiceAmount} />
                      <JournalEntry cr narration="Revenue — Healthcare Services"  amount={Math.round(rec.invoiceAmount * 0.85)} />
                      <JournalEntry cr narration="Tax Collected — GST 18%"         amount={Math.round(rec.invoiceAmount * 0.15)} />
                      {rec.collectedAmount > 0 && <>
                        <div className="my-2 border-t border-slate-200 dark:border-slate-700 pt-2 text-[11px] text-slate-500">On payment receipt:</div>
                        <JournalEntry dr narration="Bank — HDFC Current A/c"       amount={rec.collectedAmount} />
                        <JournalEntry cr narration="Accounts Receivable — Patient"  amount={rec.collectedAmount} />
                      </>}
                    </div>
                    <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      <BookOpen size={11} />Open in General Ledger <ChevronRight size={11} />
                    </button>
                  </div>
                )}

                {tab === 'timeline' && (
                  <div className="space-y-0">
                    {mockTimeline.map((item, i) => (
                      <TimelineItem key={i} {...item} last={i === mockTimeline.length - 1} />
                    ))}
                  </div>
                )}

                {tab === 'notes' && (
                  <div className="space-y-3">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Latest Note</div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{rec.notes}</p>
                      <div className="text-[10px] text-slate-400 mt-2">{rec.assignedCollector} · {rec.lastFollowUp}</div>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Add a collection note…"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none focus:border-blue-400 resize-none"
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
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
              <CreditCard size={12} />Record Payment
            </button>
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Send size={12} />Send Reminder
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
