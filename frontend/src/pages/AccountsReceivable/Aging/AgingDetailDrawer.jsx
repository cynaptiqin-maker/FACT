import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, CreditCard, Shield, BookOpen, Clock, MessageSquare,
  Send, UserCheck, GitMerge, Printer, Download, AlertTriangle,
  CheckCircle, Circle, ArrowRight, Calendar,
} from 'lucide-react';
import { RISK_META, COLL_STATUS_META, INS_STATUS_META, RECEIVABLE_TYPES, getBucket } from './AgingConstants';

const fmt = (n) => n == null ? '—' : '₹' + Number(n).toLocaleString('en-IN');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

const TABS = [
  { id: 'overview',   label: 'Overview',    icon: FileText    },
  { id: 'payments',   label: 'Payments',    icon: CreditCard  },
  { id: 'insurance',  label: 'Insurance',   icon: Shield      },
  { id: 'journal',    label: 'Journals',    icon: BookOpen    },
  { id: 'timeline',   label: 'Timeline',    icon: Clock       },
  { id: 'notes',      label: 'Notes',       icon: MessageSquare },
];

function StatRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-xs font-semibold ${highlight ?? 'text-slate-800 dark:text-slate-200'}`}>{value}</span>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ rec }) {
  const bucket = getBucket(rec.agingDays);
  const riskMeta = RISK_META[rec.riskLevel] ?? RISK_META.LOW;
  const collMeta = COLL_STATUS_META[rec.collectionStatus] ?? COLL_STATUS_META.PENDING;
  const typeMeta = RECEIVABLE_TYPES[rec.type] ?? RECEIVABLE_TYPES.PATIENT;

  return (
    <div className="space-y-5">
      {/* Risk alert */}
      {['HIGH','CRITICAL'].includes(rec.riskLevel) && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/40">
          <AlertTriangle size={15} className="text-rose-500 flex-none mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">
              {rec.riskLevel === 'CRITICAL' ? 'Critical Risk — Immediate Action Required' : 'High Risk Account'}
            </div>
            <div className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-0.5">{rec.notes}</div>
          </div>
        </div>
      )}

      {/* Financial grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Invoice Amount',  val: fmt(rec.originalAmount),   color: 'text-slate-700 dark:text-slate-300' },
          { label: 'Outstanding',     val: fmt(rec.outstandingAmount), color: 'text-rose-600 dark:text-rose-400' },
          { label: 'Collected',       val: fmt(rec.collectedAmount),   color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-center">
            <div className={`text-base font-bold font-mono ${color}`}>{val}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Aging status */}
      <div className="flex items-center justify-between p-3 rounded-xl border"
        style={{ borderColor: bucket.color + '40', background: bucket.color + '0d' }}>
        <div>
          <div className="text-xs font-semibold" style={{ color: bucket.color }}>
            {rec.agingDays} Days Outstanding — {bucket.label}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Due {fmtDate(rec.dueDate)} · {rec.agingDays > 0 ? `${rec.agingDays} days overdue` : 'Not yet due'}
          </div>
        </div>
        <div className="text-2xl font-bold font-mono" style={{ color: bucket.color }}>{rec.agingDays}d</div>
      </div>

      {/* Details */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-0">
        <StatRow label="Invoice #" value={rec.invoiceNo} />
        <StatRow label="Patient / Org" value={rec.patientName || rec.orgName || '—'} />
        {rec.patientId && <StatRow label="Patient ID" value={rec.patientId} />}
        <StatRow label="Receivable Type" value={
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeMeta.bg} ${typeMeta.text}`}>{typeMeta.label}</span>
        } />
        <StatRow label="Branch" value={rec.branch} />
        <StatRow label="Department" value={rec.department} />
        <StatRow label="Source Module" value={rec.sourceModule} />
        <StatRow label="Assigned Collector" value={rec.assignedCollector ?? '—'} />
        <StatRow label="Collection Status" value={
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${collMeta.bg} ${collMeta.text}`}>{collMeta.label}</span>
        } />
        <StatRow label="Risk Level" value={
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${riskMeta.badgeBg} ${riskMeta.badgeText}`}>{riskMeta.label} ({rec.riskScore}/100)</span>
        } />
        <StatRow label="Predicted Recovery" value={<span className="font-mono">{rec.predictedRecovery}%</span>} />
      </div>
    </div>
  );
}

// ── Payments Tab ─────────────────────────────────────────────────────────────
function PaymentsTab({ rec }) {
  const collected = rec.collectedAmount ?? 0;
  const outstanding = rec.outstandingAmount ?? 0;
  const total = rec.originalAmount ?? 0;
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Collection Progress</span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{pct}% collected</span>
        </div>
        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
          />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(collected)} collected</span>
          <span className="text-rose-500 dark:text-rose-400 font-semibold">{fmt(outstanding)} outstanding</span>
        </div>
      </div>

      {/* Payment history */}
      <div>
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Payment History</div>
        {rec.paymentHistory?.length > 0 ? (
          <div className="space-y-2">
            {rec.paymentHistory.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-none">
                  <CheckCircle size={13} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{fmt(p.amount)}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{fmtDate(p.date)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.note}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Circle size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-400 dark:text-slate-500">No payments recorded yet</p>
          </div>
        )}
      </div>

      {/* Quick payment action */}
      <button className="w-full h-9 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
        <CreditCard size={14} />Record Payment
      </button>
    </div>
  );
}

// ── Insurance Tab ────────────────────────────────────────────────────────────
function InsuranceTab({ rec }) {
  const insMeta = rec.insuranceStatus ? INS_STATUS_META[rec.insuranceStatus] : null;
  const steps = [
    { label: 'Claim Submitted',        done: true  },
    { label: 'Pre-Auth / Approval',    done: !!rec.insuranceStatus && rec.insuranceStatus !== 'PREAUTH_PENDING' },
    { label: 'TPA Processing',         done: ['APPROVED','PARTIAL_SETTLED','SETTLED'].includes(rec.insuranceStatus) },
    { label: 'Settlement Received',    done: ['PARTIAL_SETTLED','SETTLED'].includes(rec.insuranceStatus) },
    { label: 'Fully Reconciled',       done: rec.insuranceStatus === 'SETTLED' },
  ];

  if (rec.type !== 'INSURANCE') {
    return (
      <div className="py-16 text-center">
        <Shield size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-xs text-slate-400 dark:text-slate-500">No insurance / TPA details for this receivable type</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Current Insurance Status</div>
        {insMeta ? (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: insMeta.color }} />
            <span className="text-sm font-semibold" style={{ color: insMeta.color }}>{insMeta.label}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Not applicable</span>
        )}
      </div>

      {/* Claim workflow */}
      <div>
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Claim Workflow</div>
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-none
                  ${step.done ? 'bg-emerald-500' : 'border-2 border-slate-300 dark:border-slate-600'}`}>
                  {step.done && <CheckCircle size={12} className="text-white" />}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-0.5 h-6 mt-0.5 ${step.done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </div>
              <div className={`pb-5 pt-0.5 text-xs ${step.done ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TPA details */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-0">
        <StatRow label="Insurer / TPA" value={rec.orgName ?? '—'} />
        <StatRow label="Claim Amount" value={fmt(rec.originalAmount)} />
        <StatRow label="Settled Amount" value={fmt(rec.collectedAmount)} />
        <StatRow label="Outstanding" value={fmt(rec.outstandingAmount)} highlight="text-rose-500 dark:text-rose-400" />
      </div>
    </div>
  );
}

// ── Timeline Tab ─────────────────────────────────────────────────────────────
function TimelineTab({ rec }) {
  const events = [
    { date: rec.billingDate,   label: 'Invoice Created',           icon: FileText,   color: 'blue'    },
    { date: rec.dueDate,       label: 'Payment Due',               icon: Calendar,   color: 'amber'   },
    { date: rec.lastFollowUp,  label: 'Last Follow-Up',            icon: MessageSquare, color: 'violet' },
    { date: rec.nextFollowUp,  label: 'Next Follow-Up Scheduled',  icon: Clock,      color: 'cyan', future: true },
  ].filter(e => e.date).sort((a, b) => new Date(a.date) - new Date(b.date));

  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  };

  return (
    <div className="space-y-4">
      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Collection Timeline</div>
      <div className="space-y-0">
        {events.map((ev, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-none ${colorMap[ev.color]}`}>
                <ev.icon size={13} />
              </div>
              {i < events.length - 1 && (
                <div className="w-0.5 h-7 mt-0.5 bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
            <div className={`pb-6 pt-0.5 ${ev.future ? 'opacity-60' : ''}`}>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{ev.label}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{fmtDate(ev.date)}</div>
              {ev.future && <span className="text-[10px] text-cyan-500 dark:text-cyan-400">Upcoming</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Journals Tab ─────────────────────────────────────────────────────────────
function JournalsTab({ rec }) {
  const entries = [
    { jv: 'JV-2026-004831', date: rec.billingDate, dr: 'Accounts Receivable', cr: 'Revenue — ' + rec.department, amt: rec.originalAmount },
    ...(rec.collectedAmount > 0
      ? [{ jv: 'JV-2026-005124', date: rec.paymentHistory?.[0]?.date ?? rec.lastFollowUp, dr: 'Bank / Cash', cr: 'Accounts Receivable', amt: rec.collectedAmount }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Linked Journal Entries</div>
      <div className="space-y-3">
        {entries.map((e, i) => (
          <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400">{e.jv}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{fmtDate(e.date)}</span>
            </div>
            <div className="px-3 py-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 w-4">Dr</span>
                  <span className="text-slate-700 dark:text-slate-300">{e.dr}</span>
                </div>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmt(e.amt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-rose-500 w-4">Cr</span>
                  <span className="text-slate-700 dark:text-slate-300">{e.cr}</span>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400">{fmt(e.amt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notes Tab ────────────────────────────────────────────────────────────────
function NotesTab({ rec }) {
  const [note, setNote] = useState('');
  return (
    <div className="space-y-4">
      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Collection Notes</div>
      {rec.notes && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
          {rec.notes}
        </div>
      )}
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Add a collection note…"
        rows={4}
        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
      />
      <button
        disabled={!note.trim()}
        className="h-9 px-4 rounded-xl bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
        <Send size={13} />Save Note
      </button>
    </div>
  );
}

// ── Drawer Shell ─────────────────────────────────────────────────────────────
export default function AgingDetailDrawer({ rec, onClose }) {
  const [tab, setTab] = useState('overview');
  if (!rec) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="flex-1 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm" />

        {/* Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={e => e.stopPropagation()}
          className="w-[460px] flex-none h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex-none px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <FileText size={13} className="text-white" />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{rec.invoiceNo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { icon: Printer, tip: 'Print' },
                  { icon: Download, tip: 'Export' },
                ].map(({ icon: Icon, tip }) => (
                  <button key={tip} title={tip}
                    className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors">
                    <Icon size={13} />
                  </button>
                ))}
                <button onClick={onClose}
                  className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-300 transition-colors">
                  <X size={13} />
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {rec.patientName || rec.orgName} · {rec.branch} · {rec.department}
            </div>
            {/* Quick actions */}
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {[
                { icon: Send,      label: 'Reminder', cls: 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20' },
                { icon: UserCheck, label: 'Assign',   cls: 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' },
                { icon: GitMerge,  label: 'Reconcile',cls: 'border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20' },
              ].map(a => (
                <button key={a.label}
                  className={`flex items-center gap-1 h-7 px-2.5 rounded-lg border text-[11px] font-medium transition-colors ${a.cls}`}>
                  <a.icon size={11} />{a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-none flex border-b border-slate-200 dark:border-slate-800">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-semibold border-b-2 transition-colors whitespace-nowrap
                  ${tab === t.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <t.icon size={11} />{t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'overview'  && <OverviewTab  rec={rec} />}
                {tab === 'payments'  && <PaymentsTab  rec={rec} />}
                {tab === 'insurance' && <InsuranceTab rec={rec} />}
                {tab === 'journal'   && <JournalsTab  rec={rec} />}
                {tab === 'timeline'  && <TimelineTab  rec={rec} />}
                {tab === 'notes'     && <NotesTab     rec={rec} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
