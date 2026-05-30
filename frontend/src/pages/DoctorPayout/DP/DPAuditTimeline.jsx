// ─── Doctor Payouts — Audit & Workflow Timeline ───────────────────────────────
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, CheckCircle2, CreditCard, Banknote, BookOpen,
  GitMerge, Shield, AlertTriangle, User, Clock, Sparkles,
  Workflow, FileText, Lock,
} from 'lucide-react';
import { MOCK_PAYOUTS, PAYOUT_STATUSES, fmtDateTime, fmtDate } from './DPConstants';

// Generate a comprehensive audit log from MOCK_PAYOUTS
function buildAuditLog() {
  const events = [];
  MOCK_PAYOUTS.forEach(p => {
    if (p.createdAt) events.push({
      id: `${p.id}-calc`,
      payoutId: p.id,
      doctor:   p.doctorName,
      action:   'Payout Calculated',
      detail:   `Revenue share ${p.sharePercent}% on ${(p.revenueGenerated/100000).toFixed(2)}L → Net ${(p.netPayout/100000).toFixed(2)}L`,
      by:       'System (Auto)',
      at:       p.createdAt,
      type:     'calc',
      icon:     Activity,
      color:    '#0ea5e9',
    });
    if (p.fraudFlags?.length > 0) events.push({
      id: `${p.id}-risk`,
      payoutId: p.id,
      doctor:   p.doctorName,
      action:   'Risk Flag Raised',
      detail:   p.fraudFlags.join(', '),
      by:       'AI Risk Engine',
      at:       p.createdAt,
      type:     'risk',
      icon:     AlertTriangle,
      color:    '#ef4444',
    });
    if (p.approvedAt) events.push({
      id: `${p.id}-approv`,
      payoutId: p.id,
      doctor:   p.doctorName,
      action:   'Payout Approved',
      detail:   'All calculations verified and signed off',
      by:       'CFO / Finance Head',
      at:       p.approvedAt,
      type:     'approve',
      icon:     CheckCircle2,
      color:    '#059669',
    });
    if (p.paidAt) events.push({
      id: `${p.id}-transfer`,
      payoutId: p.id,
      doctor:   p.doctorName,
      action:   'Bank Transfer Processed',
      detail:   `Transfer ${p.bankTransferId} · Net ${(p.netPayout/100000).toFixed(2)}L`,
      by:       'Treasury Operations',
      at:       p.paidAt,
      type:     'transfer',
      icon:     CreditCard,
      color:    '#22c55e',
    });
    if (p.reconciledAt) events.push({
      id: `${p.id}-recon`,
      payoutId: p.id,
      doctor:   p.doctorName,
      action:   'Reconciled',
      detail:   `Recon ${p.reconciliationId} — bank statement matched`,
      by:       'System (Auto)',
      at:       p.reconciledAt,
      type:     'recon',
      icon:     GitMerge,
      color:    '#14b8a6',
    });
  });
  return events.sort((a, b) => new Date(b.at) - new Date(a.at));
}

const TYPE_COLORS = {
  calc:     '#0ea5e9',
  approve:  '#059669',
  transfer: '#22c55e',
  recon:    '#14b8a6',
  risk:     '#ef4444',
  gl:       '#8b5cf6',
};

const TYPE_FILTERS = [
  { id: 'all',      label: 'All Events' },
  { id: 'approve',  label: 'Approvals'  },
  { id: 'transfer', label: 'Transfers'  },
  { id: 'recon',    label: 'Reconciliations' },
  { id: 'risk',     label: 'Risk Events'},
];

// ─── Workflow Status Overview ─────────────────────────────────────────────────
function WorkflowStatusSummary() {
  const counts = MOCK_PAYOUTS.reduce((acc, p) => {
    acc[p.workflowState] = (acc[p.workflowState] ?? 0) + 1;
    return acc;
  }, {});

  const STATES = [
    { key: 'DRAFT',            label: 'Draft',           color: '#94a3b8' },
    { key: 'CALCULATED',       label: 'Calculated',      color: '#0ea5e9' },
    { key: 'UNDER_REVIEW',     label: 'Under Review',    color: '#8b5cf6' },
    { key: 'APPROVED',         label: 'Approved',        color: '#059669' },
    { key: 'PENDING_TRANSFER', label: 'Pend. Transfer',  color: '#f59e0b' },
    { key: 'PAID',             label: 'Paid',            color: '#22c55e' },
    { key: 'RECONCILED',       label: 'Reconciled',      color: '#14b8a6' },
    { key: 'CLOSED',           label: 'Closed',          color: '#10b981' },
  ];

  const total = MOCK_PAYOUTS.length;

  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-3">Payout Lifecycle Status</p>
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
        {STATES.map(s => {
          const cnt = counts[s.key] ?? 0;
          if (cnt === 0) return null;
          return (
            <motion.div
              key={s.key}
              initial={{ width: 0 }}
              animate={{ width: `${(cnt / total) * 100}%` }}
              transition={{ duration: 0.6 }}
              title={`${s.label}: ${cnt}`}
              className="h-full transition-all"
              style={{ background: s.color }}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {STATES.map(s => {
          const cnt = counts[s.key] ?? 0;
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: s.color }} />
              <div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">{s.label}</p>
                <p className="font-mono text-xs font-bold" style={{ color: s.color }}>{cnt}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SLA Tracking ─────────────────────────────────────────────────────────────
function SLATracking() {
  const slaMet    = MOCK_PAYOUTS.filter(p => p.paymentStatus === 'PAID').length;
  const slaBreached = MOCK_PAYOUTS.filter(p => p.paymentStatus === 'PENDING_TRANSFER').length;
  const pct       = ((slaMet / (slaMet + slaBreached)) * 100).toFixed(0);

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'SLA Met',         val: `${slaMet} payouts`,  color: '#10b981', detail: 'Paid within 7 days'      },
        { label: 'SLA Compliance',  val: `${pct}%`,            color: '#0ea5e9', detail: 'Of processed payouts'    },
        { label: 'SLA Breached',    val: `${slaBreached}`,     color: '#f59e0b', detail: 'Pending >7 days'         },
      ].map(c => (
        <div key={c.label} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <p className="text-[9.5px] text-slate-400 dark:text-slate-500">{c.label}</p>
          <p className="font-mono font-bold text-sm mt-0.5" style={{ color: c.color }}>{c.val}</p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500">{c.detail}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Audit Event Feed ─────────────────────────────────────────────────────────
function AuditFeed({ events, filter }) {
  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);
  const PAGE_SIZE = 20;
  const visible = filtered.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-1">
      {visible.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">No events for this filter</div>
      )}
      {visible.map((ev, i) => {
        const Icon = ev.icon;
        return (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.015, duration: 0.2 }}
            className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
          >
            {/* Icon */}
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-none mt-0.5" style={{ background: `${ev.color}18` }}>
              <Icon size={12} style={{ color: ev.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{ev.action}</span>
                <span className="text-[9.5px] font-mono text-slate-400 dark:text-slate-500 hidden group-hover:inline">{ev.payoutId}</span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">{ev.detail}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[9.5px] text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-0.5"><User size={9} />{ev.by}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Clock size={9} />{fmtDateTime(ev.at)}</span>
                <span>·</span>
                <span className="font-medium text-slate-600 dark:text-slate-400">{ev.doctor}</span>
              </div>
            </div>

            {/* Lock icon — immutability indicator */}
            <div title="Immutable audit record" className="flex-none mt-1 opacity-30 group-hover:opacity-60 transition-opacity">
              <Lock size={9} className="text-slate-400 dark:text-slate-500" />
            </div>
          </motion.div>
        );
      })}
      {filtered.length > PAGE_SIZE && (
        <p className="text-center text-[10.5px] text-slate-400 dark:text-slate-500 py-2">
          Showing {PAGE_SIZE} of {filtered.length} events
        </p>
      )}
    </div>
  );
}

// ─── Main Audit Timeline ──────────────────────────────────────────────────────
export default function DPAuditTimeline() {
  const [filter, setFilter] = useState('all');
  const auditLog = buildAuditLog();

  return (
    <div className="space-y-4">
      {/* Workflow Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <WorkflowStatusSummary />
      </div>

      {/* SLA Tracking */}
      <SLATracking />

      {/* Audit feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={13} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">Immutable Audit Log</h3>
            <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">{auditLog.length} events</span>
          </div>
          {/* Filter chips */}
          <div className="flex gap-1">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  filter === f.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-2 max-h-[480px] overflow-y-auto">
          <AuditFeed events={auditLog} filter={filter} />
        </div>
      </div>
    </div>
  );
}
