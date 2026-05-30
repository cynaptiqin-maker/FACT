import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, GitBranch, History, RefreshCw, Paperclip, Sparkles,
  CheckCircle2, Circle, AlertTriangle, ArrowRight, ExternalLink,
  Building2, Calendar, User, Tag, Layers, IndianRupee, Hash,
  Clock, ShieldCheck, Copy, ChevronRight, TrendingUp, TrendingDown,
  Download, Printer,
} from 'lucide-react';
import clsx from 'clsx';
import {
  fmtCurrency, fmtDate, statusStyle, reconStyle,
  voucherStyle, AUDIT_EVENTS, FLOW_STEPS,
} from './glConstants';

const TABS = [
  { id: 'overview',  label: 'Overview',    icon: FileText   },
  { id: 'journal',   label: 'Journal',     icon: Hash       },
  { id: 'flow',      label: 'Flow',        icon: GitBranch  },
  { id: 'audit',     label: 'Audit',       icon: History    },
  { id: 'recon',     label: 'Recon',       icon: RefreshCw  },
  { id: 'ai',        label: 'AI Insights', icon: Sparkles   },
  { id: 'files',     label: 'Files',       icon: Paperclip  },
];

// ─── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ entry }) {
  const rows = [
    { icon: Calendar,  label: 'Date',           value: fmtDate(entry.date)                  },
    { icon: Hash,      label: 'Voucher No.',     value: entry.voucherNo,  mono: true         },
    { icon: Tag,       label: 'Voucher Type',    value: entry.voucherType.label              },
    { icon: FileText,  label: 'Account',         value: `${entry.account.code} – ${entry.account.label}` },
    { icon: Layers,    label: 'Account Group',   value: entry.account.group                 },
    { icon: Building2, label: 'Branch',          value: entry.branch.label                  },
    { icon: Layers,    label: 'Department',      value: entry.department.label              },
    { icon: Tag,       label: 'Cost Center',     value: entry.costCenter, mono: true         },
    { icon: Hash,      label: 'Reference',       value: entry.reference,  mono: true         },
    { icon: GitBranch, label: 'Source Module',   value: entry.sourceModule                  },
    { icon: User,      label: 'Created By',      value: entry.createdBy                     },
    { icon: ShieldCheck,label:'Approved By',     value: entry.approvedBy || 'Pending'       },
  ];

  return (
    <div className="space-y-4">
      {/* Financial impact */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide mb-1">Debit</p>
          <p className="text-base font-bold font-mono text-red-700">
            {entry.debit > 0 ? fmtCurrency(entry.debit, true) : '—'}
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wide mb-1">Credit</p>
          <p className="text-base font-bold font-mono text-emerald-700">
            {entry.credit > 0 ? fmtCurrency(entry.credit, true) : '—'}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">Balance</p>
          <p className={clsx(
            'text-base font-bold font-mono',
            entry.balance >= 0 ? 'text-slate-800' : 'text-red-700',
          )}>
            {fmtCurrency(entry.balance, true)}
          </p>
        </div>
      </div>

      {/* Narration */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Narration</p>
        <p className="text-sm text-slate-700 leading-relaxed">{entry.narration}</p>
      </div>

      {/* Status row */}
      <div className="flex gap-2">
        <span className={clsx('px-2.5 py-1 rounded-full text-xs font-semibold border capitalize', statusStyle(entry.status))}>
          {entry.status}
        </span>
        <span className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium', reconStyle(entry.reconciliationStatus))}>
          {entry.reconciliationStatus}
        </span>
        {entry.isAnomaly && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
            bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> Anomaly
          </span>
        )}
      </div>

      {/* Detail fields */}
      <div className="divide-y divide-slate-50">
        {rows.map(r => {
          const Ic = r.icon;
          return (
            <div key={r.label} className="flex items-start gap-3 py-2.5">
              <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Ic className="w-3 h-3 text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{r.label}</p>
                <p className={clsx('text-xs text-slate-700 break-all', r.mono && 'font-mono')}>{r.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Journal details tab ───────────────────────────────────────────────────────
function JournalTab({ entry }) {
  const lines = [
    { side: 'Dr', account: entry.account.label, code: entry.account.code, amount: entry.debit || entry.credit },
    { side: entry.debit > 0 ? 'Cr' : 'Dr', account: 'Accounts Receivable', code: '5001', amount: entry.debit || entry.credit },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-600">Double-Entry Posting</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <th className="text-left px-4 py-2">Dr/Cr</th>
              <th className="text-left px-4 py-2">Account</th>
              <th className="text-right px-4 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2.5">
                  <span className={clsx(
                    'inline-block w-7 text-center rounded text-[10px] font-bold py-0.5',
                    l.side === 'Dr' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700',
                  )}>
                    {l.side}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-xs font-semibold text-slate-700">{l.account}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{l.code}</p>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={clsx(
                    'font-mono text-sm font-bold',
                    l.side === 'Dr' ? 'text-red-600' : 'text-emerald-600',
                  )}>
                    {fmtCurrency(l.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td className="px-4 py-2 text-xs font-semibold text-slate-600" colSpan={2}>Total</td>
              <td className="px-4 py-2 text-right font-mono text-sm font-bold text-slate-800">
                {fmtCurrency(entry.debit || entry.credit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="text-xs text-slate-500 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2
        flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        Journal is balanced — Debits equal Credits
      </div>
    </div>
  );
}

// ─── Financial flow tab ────────────────────────────────────────────────────────
function FlowTab() {
  const nodeStyles = {
    source:     'bg-blue-50   border-blue-200  text-blue-800',
    posting:    'bg-violet-50 border-violet-200 text-violet-800',
    tax:        'bg-amber-50  border-amber-200  text-amber-800',
    asset:      'bg-cyan-50   border-cyan-200   text-cyan-800',
    adjustment: 'bg-orange-50 border-orange-200 text-orange-800',
    settlement: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 mb-3">Transaction flow from origin to final settlement:</p>
      {FLOW_STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={clsx(
              'flex items-center justify-between p-3 rounded-xl border',
              nodeStyles[step.type],
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/70 flex items-center justify-center
                text-[10px] font-bold text-slate-600 border border-current/20">
                {i + 1}
              </div>
              <div>
                <p className="text-xs font-semibold">{step.label}</p>
                <p className="text-[10px] opacity-70">{step.sub}</p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold">
              {fmtCurrency(step.amount, true)}
            </span>
          </motion.div>
          {i < FLOW_STEPS.length - 1 && (
            <div className="flex justify-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 rotate-90" />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Audit trail tab ──────────────────────────────────────────────────────────
function AuditTab() {
  const eventIcons = {
    'Created':     { ic: Circle,       color: 'bg-blue-500'    },
    'Reviewed':    { ic: CheckCircle2, color: 'bg-cyan-500'    },
    'Approved':    { ic: ShieldCheck,  color: 'bg-emerald-500' },
    'Posted':      { ic: CheckCircle2, color: 'bg-emerald-600' },
    'Flagged by AI':{ ic: AlertTriangle, color: 'bg-amber-500' },
    'Investigated':{ ic: User,         color: 'bg-violet-500'  },
  };

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />

      {AUDIT_EVENTS.map((ev, i) => {
        const { ic: Ic, color } = eventIcons[ev.action] || { ic: Circle, color: 'bg-slate-400' };
        return (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="relative pb-4 last:pb-0"
          >
            {/* Dot */}
            <div className={clsx(
              'absolute -left-[18px] w-5 h-5 rounded-full flex items-center justify-center',
              color,
            )}>
              <Ic className="w-2.5 h-2.5 text-white" />
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700">{ev.action}</p>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{ev.ts.slice(11)}</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">{ev.change}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-slate-500">{ev.user}</span>
                <span className="text-[10px] text-slate-300">·</span>
                <span className="text-[10px] text-slate-400">{ev.role}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Reconciliation tab ───────────────────────────────────────────────────────
function ReconTab({ entry }) {
  const isRecon = entry.reconciliationStatus === 'reconciled' || entry.reconciliationStatus === 'auto-matched';

  return (
    <div className="space-y-3">
      <div className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border',
        isRecon ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200',
      )}>
        {isRecon
          ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          : <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        }
        <div>
          <p className={clsx('text-sm font-semibold', isRecon ? 'text-emerald-800' : 'text-amber-800')}>
            {isRecon ? 'Entry Reconciled' : 'Reconciliation Pending'}
          </p>
          <p className="text-xs opacity-80 mt-0.5">
            {isRecon
              ? `Matched via ${entry.reconciliationStatus === 'auto-matched' ? 'AI auto-matching' : 'manual review'}`
              : 'This entry has not been matched to a corresponding transaction.'}
          </p>
        </div>
      </div>

      {!isRecon && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">Suggested Matches</p>
          {[1, 2].map(n => (
            <div key={n} className="flex items-center justify-between p-3 bg-white rounded-xl border
              border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 cursor-pointer transition-all">
              <div>
                <p className="text-xs font-semibold text-slate-700">RV-2026-{String(n * 412).padStart(5, '0')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {fmtCurrency(entry.debit || entry.credit, true)} · {n === 1 ? '96%' : '82%'} match confidence
                </p>
              </div>
              <button className="px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50
                border border-brand-200 rounded-lg hover:bg-brand-800 hover:text-pearl-100 transition-all">
                Match
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="w-full py-2.5 rounded-xl border-2 border-dashed border-brand-300
        text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors">
        {isRecon ? 'Unmatch & Re-reconcile' : 'Manual Reconcile'}
      </button>
    </div>
  );
}

// ─── AI Insights tab ──────────────────────────────────────────────────────────
function AITab({ entry }) {
  const insights = [
    {
      type: entry.isAnomaly ? 'anomaly' : 'normal',
      title: entry.isAnomaly ? 'Anomaly Detected' : 'Transaction Looks Normal',
      body: entry.isAnomaly
        ? `This transaction scored ${entry.riskScore}/100 on our anomaly model. The amount is
           significantly above the 30-day account average. Consider cross-checking with source documentation.`
        : `Transaction is within expected parameters. Risk score: ${entry.riskScore}/100.
           Amount aligns with historical patterns for ${entry.account.label}.`,
    },
    {
      type: 'pattern',
      title: 'Pattern Analysis',
      body: `${entry.account.label} typically has activity every 3–7 days.
             This posting occurs 2 days after the last entry — within expected cycle.`,
    },
    {
      type: 'suggestion',
      title: 'AI Suggestion',
      body: `Based on historical data, entries from ${entry.sourceModule} in ${entry.department.label}
             are typically reconciled within 5 business days. This entry is ${
               entry.reconciliationStatus === 'unreconciled' ? 'currently unreconciled — action recommended' : 'already reconciled'
             }.`,
    },
  ];

  const typeStyles = {
    anomaly:    'bg-rose-50  border-rose-200  text-rose-700',
    normal:     'bg-emerald-50 border-emerald-200 text-emerald-700',
    pattern:    'bg-blue-50  border-blue-200  text-blue-700',
    suggestion: 'bg-violet-50 border-violet-200 text-violet-700',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-cyan-500
        rounded-xl text-white text-xs font-semibold">
        <Sparkles className="w-3.5 h-3.5" />
        AI Accounting Intelligence — Entry Analysis
      </div>
      {insights.map((ins, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={clsx('p-3 rounded-xl border', typeStyles[ins.type])}
        >
          <p className="text-xs font-semibold mb-1">{ins.title}</p>
          <p className="text-[11px] leading-relaxed opacity-80">{ins.body}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Files tab ────────────────────────────────────────────────────────────────
function FilesTab({ entry }) {
  const files = Array.from({ length: entry.attachments }, (_, i) => ({
    name: ['Invoice.pdf', 'Approval.pdf', 'Bank Statement.pdf', 'Supporting Note.docx'][i] || `File_${i}.pdf`,
    size: ['124 KB', '82 KB', '341 KB', '47 KB'][i] || '~100 KB',
    type: 'pdf',
  }));

  return (
    <div className="space-y-2">
      {files.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400">No attachments for this entry.</div>
      ) : (
        files.map((f, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200
            hover:border-brand-300 hover:bg-brand-50/20 cursor-pointer transition-all group">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center
              justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 truncate">{f.name}</p>
              <p className="text-[10px] text-slate-400">{f.size}</p>
            </div>
            <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-700 transition-colors" />
          </div>
        ))
      )}
      <button className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300
        text-xs font-medium text-slate-500 hover:border-brand-300 hover:text-brand-700 transition-colors">
        + Upload Document
      </button>
    </div>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────
export default function GLDetailDrawer({ entry, onClose }) {
  const [tab, setTab] = useState('overview');

  if (!entry) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="gl-drawer"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="flex flex-col h-full bg-white border-l border-slate-200 shadow-2xl"
        style={{ width: 420 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0 flex-1 mr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={clsx(
                'inline-block px-2 py-0.5 rounded text-[10px] font-bold border',
                voucherStyle(entry.voucherType.color),
              )}>
                {entry.voucherType.id}
              </span>
              <span className="font-mono text-xs text-slate-600 truncate">{entry.voucherNo}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm truncate">{entry.account.label}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{fmtDate(entry.date)} · {entry.branch.label}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100
              text-slate-400 transition-colors" title="Print">
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100
              text-slate-400 transition-colors" title="Copy link">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100
                text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0 overflow-x-auto">
          {TABS.map(t => {
            const Ic = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap transition-all border-b-2',
                  tab === t.id
                    ? 'border-brand-700 text-brand-800 bg-brand-50/30'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
              >
                <Ic className="w-3 h-3" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {tab === 'overview' && <OverviewTab entry={entry} />}
              {tab === 'journal'  && <JournalTab  entry={entry} />}
              {tab === 'flow'     && <FlowTab />}
              {tab === 'audit'    && <AuditTab />}
              {tab === 'recon'    && <ReconTab   entry={entry} />}
              {tab === 'ai'       && <AITab      entry={entry} />}
              {tab === 'files'    && <FilesTab   entry={entry} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-100 flex gap-2 flex-shrink-0">
          <button className="flex-1 py-2 rounded-xl bg-brand-800 text-pearl-100 text-xs font-semibold
            hover:bg-brand-700 transition-colors flex items-center justify-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Open Source
          </button>
          <button className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold
            text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Reconcile
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
