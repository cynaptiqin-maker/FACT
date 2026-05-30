import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, ChevronUp, MoreHorizontal, Eye,
  FileText, ArrowUpRight, CreditCard, BookOpen, ClipboardList,
  Sparkles, CheckSquare, Square, ExternalLink, AlertCircle, Zap,
  Shield, Send, AlertTriangle, Phone, Calendar,
} from 'lucide-react';
import {
  CLAIM_TYPES, RISK_LEVELS, AGING_BUCKETS, fmtINR, fmtDate,
  FOLLOWUP_STATUSES, SETTLEMENT_STATUSES, WORKFLOW_STATUSES, CLAIM_STATUSES,
} from './TARConstants';

const AGING_COLORS = {
  current: '#10b981',
  days31:  '#f59e0b',
  days61:  '#f97316',
  days91:  '#ef4444',
  days121: '#dc2626',
};

const RISK_BORDER = {
  LOW:      'border-l-emerald-400',
  MEDIUM:   'border-l-amber-400',
  HIGH:     'border-l-orange-500',
  CRITICAL: 'border-l-red-600',
};

function StatusBadge({ status }) {
  const cfg = CLAIM_STATUSES?.[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: '#94a3b8', label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const cfg = CLAIM_TYPES[type] ?? CLAIM_TYPES.TPA;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${cfg.lightBg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function RiskBadge({ level }) {
  const cfg = RISK_LEVELS[level] ?? RISK_LEVELS.LOW;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function FollowUpBadge({ status, count }) {
  const cfg = FOLLOWUP_STATUSES[status] ?? FOLLOWUP_STATUSES.PENDING;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
      {count > 0 && (
        <span className="text-[10px] font-mono text-slate-400">#{count}</span>
      )}
    </div>
  );
}

function SettleBadge({ status }) {
  const cfg = SETTLEMENT_STATUSES[status] ?? SETTLEMENT_STATUSES.PENDING;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function WorkflowBadge({ status }) {
  const cfg = WORKFLOW_STATUSES[status] ?? WORKFLOW_STATUSES.UNDER_TPA_REVIEW;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function AgingBar({ days, bucket }) {
  const color = AGING_COLORS[bucket] ?? '#94a3b8';
  const maxDays = bucket === 'current' ? 30 : bucket === 'days31' ? 60 : bucket === 'days61' ? 90 : bucket === 'days91' ? 180 : 365;
  const pct = Math.min((days / maxDays) * 100, 100);
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono font-bold" style={{ color }}>{days}d</span>
    </div>
  );
}

function RecoveryBar({ pct }) {
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2 min-w-[70px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono font-semibold" style={{ color }}>{pct}%</span>
    </div>
  );
}

function RowMenu({ claim, onAction }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { id: 'view',     icon: Eye,           label: 'View Details'        },
    { id: 'invoice',  icon: FileText,       label: 'View Invoice'        },
    { id: 'ar',       icon: ArrowUpRight,   label: 'View AR Entry'       },
    { id: 'settle',   icon: CreditCard,     label: 'Record Settlement'   },
    { id: 'followup', icon: Phone,          label: 'Add Follow-up'       },
    { id: 'gl',       icon: BookOpen,       label: 'View GL Postings'    },
    { id: 'audit',    icon: ClipboardList,  label: 'Audit Trail'         },
    { id: 'ai',       icon: Sparkles,       label: 'AI Recovery Plan'    },
    { id: 'escalate', icon: AlertTriangle,  label: 'Escalate Claim'      },
  ];

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-8 z-50 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1"
            >
              {actions.map(a => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={e => { e.stopPropagation(); setOpen(false); onAction(a.id, claim); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                  >
                    <Icon size={12} className="flex-none text-slate-400" />
                    {a.label}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExpandedRow({ claim }) {
  const agingColor = AGING_COLORS[claim.agingBucket] ?? '#94a3b8';
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <td colSpan={21} className="p-0">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-4 gap-4 px-6 py-5 bg-gradient-to-b from-amber-50/60 to-slate-50/40 dark:from-amber-900/10 dark:to-slate-900/20 border-b border-amber-100 dark:border-amber-900/30">

            {/* Col 1: Patient Info */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Patient & Claim</div>
              {[
                { l: 'Patient',    v: claim.patientName },
                { l: 'UHID',       v: claim.uhid, mono: true },
                { l: 'Invoice',    v: claim.invoiceNo, mono: true },
                { l: 'AR Entry',   v: claim.arEntryNo, mono: true },
                { l: 'Admission',  v: fmtDate(claim.admissionDate) },
                { l: 'Discharge',  v: fmtDate(claim.dischargeDate) },
                { l: 'Diagnosis',  v: claim.diagnosis },
                { l: 'Department', v: claim.department },
                { l: 'Doctor',     v: claim.doctor },
                { l: 'Branch',     v: claim.branch },
              ].map(({ l, v, mono }) => (
                <div key={l} className="flex justify-between items-start gap-2">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 flex-none">{l}</span>
                  <span className={`text-[11px] text-right leading-tight ${mono ? 'font-mono text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>{v}</span>
                </div>
              ))}
            </div>

            {/* Col 2: Financials */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Financial Summary</div>
              {[
                { l: 'Claim Amount',   v: fmtINR(claim.claimAmount),      color: 'text-slate-800 dark:text-slate-100' },
                { l: 'Approved',       v: claim.approvedAmount > 0 ? fmtINR(claim.approvedAmount) : '—', color: 'text-emerald-600 dark:text-emerald-400' },
                { l: 'Denied',         v: claim.deniedAmount > 0 ? fmtINR(claim.deniedAmount) : 'Nil', color: claim.deniedAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400' },
                { l: 'Outstanding',    v: fmtINR(claim.outstandingAmount), color: 'text-amber-600 dark:text-amber-400 font-bold' },
                { l: 'Settled',        v: claim.settledAmount > 0 ? fmtINR(claim.settledAmount) : 'Nil', color: 'text-emerald-600 dark:text-emerald-400' },
                { l: 'Recovery Prob.', v: `${claim.recoveryProbability}%`, color: claim.recoveryProbability > 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' },
              ].map(({ l, v, color }) => (
                <div key={l} className="flex justify-between items-center gap-2 py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400">{l}</span>
                  <span className={`text-[12px] font-mono font-semibold ${color}`}>{v}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${claim.glPosted ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-500'}`}>
                  {claim.glPosted ? '✓ GL Posted' : 'GL Pending'}
                </span>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${claim.reconciled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                  {claim.reconciled ? '✓ Reconciled' : 'Unreconciled'}
                </span>
              </div>
            </div>

            {/* Col 3: Timeline */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Claim Timeline</div>
              <div className="relative pl-4">
                <div className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-700" />
                {(claim.timeline ?? []).slice(-6).map((evt, i) => (
                  <div key={i} className="relative mb-3 last:mb-0">
                    <div className="absolute -left-2.5 top-1 w-2 h-2 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900" />
                    <div className="text-[9.5px] text-slate-400 mb-0.5">{evt.date} · {evt.user}</div>
                    <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200 leading-tight">{evt.event}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 4: AI Recovery Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/40 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles size={12} className="text-amber-500" />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">AI Recovery Intelligence</span>
              </div>

              {/* Recovery gauge */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-14 h-14 flex-none">
                  <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke={claim.recoveryProbability >= 70 ? '#10b981' : claim.recoveryProbability >= 40 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${claim.recoveryProbability * 0.942} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{claim.recoveryProbability}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Recovery Score</div>
                  <div className="text-[10px] text-slate-400">AI confidence</div>
                </div>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Risk Level</span>
                  <RiskBadge level={claim.riskLevel} />
                </div>
                {claim.denialReason && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Denial Reason</span>
                    <span className="text-red-600 dark:text-red-400 font-medium text-right max-w-[120px] text-[10.5px]">{claim.denialReason}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Linked Records</div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: 'Invoice', id: claim.invoiceNo },
                      { label: 'AR',      id: claim.arEntryNo },
                    ].map(r => (
                      <button key={r.label} className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-700/40 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                        {r.label} <ExternalLink size={8} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </td>
    </motion.tr>
  );
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronDown size={11} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
  return sortDir === 'asc' ? <ChevronUp size={11} className="text-amber-500" /> : <ChevronDown size={11} className="text-amber-500" />;
}

function GridRow({ claim, selected, onSelect, onExpand, expanded, onAction, sortField, sortDir }) {
  const agingColor = AGING_COLORS[claim.agingBucket] ?? '#94a3b8';
  const borderClass = RISK_BORDER[claim.riskLevel] ?? 'border-l-slate-300';

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={() => onExpand(claim.id)}
        className={`relative group border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors border-l-2
          ${borderClass}
          ${selected    ? 'bg-amber-50/60 dark:bg-amber-900/10'    : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/50'}
          ${expanded    ? 'bg-amber-50 dark:bg-amber-900/15'       : ''}
        `}
      >
        {/* Checkbox */}
        <td className="w-10 pl-3 pr-2 py-3" onClick={e => { e.stopPropagation(); onSelect(claim.id); }}>
          {selected
            ? <CheckSquare size={15} className="text-amber-500" />
            : <Square size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
          }
        </td>

        {/* Claim No. */}
        <td className="px-3 py-3 min-w-[9rem]">
          <div className="flex items-center gap-1.5">
            {expanded
              ? <ChevronDown size={12} style={{ color: agingColor }} />
              : <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500" />
            }
            <div>
              <div className="text-[11.5px] font-bold font-mono" style={{ color: agingColor }}>{claim.id}</div>
              <div className="text-[9.5px] text-slate-400">{fmtDate(claim.claimSubmitDate)}</div>
            </div>
          </div>
        </td>

        {/* Patient */}
        <td className="px-3 py-3 min-w-[10rem]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-none"
              style={{ background: agingColor }}>
              {claim.patientName.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{claim.patientName}</div>
              <div className="text-[10px] text-slate-400 font-mono">{claim.uhid}</div>
            </div>
          </div>
        </td>

        {/* Invoice */}
        <td className="px-3 py-3 min-w-[9rem]">
          <button onClick={e => { e.stopPropagation(); onAction('invoice', claim); }}
            className="font-mono text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            {claim.invoiceNo} <ExternalLink size={9} />
          </button>
        </td>

        {/* TPA */}
        <td className="px-3 py-3 min-w-[10rem]">
          <div className="text-[11.5px] font-medium text-slate-700 dark:text-slate-200 leading-tight">{claim.tpa}</div>
          <TypeBadge type={claim.claimType} />
        </td>

        {/* Department */}
        <td className="px-3 py-3 min-w-[8rem]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-none bg-indigo-400" />
            <span className="text-[11.5px] text-slate-700 dark:text-slate-200">{claim.department}</span>
          </div>
        </td>

        {/* Doctor */}
        <td className="px-3 py-3 min-w-[9rem]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300 flex-none">
              {claim.doctor.split(' ').map(w => w[0]).slice(1, 3).join('')}
            </div>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[7rem]">{claim.doctor}</span>
          </div>
        </td>

        {/* Claim Amt */}
        <td className="px-3 py-3 min-w-[7rem] text-right">
          <span className="font-mono text-[12px] font-bold text-slate-800 dark:text-slate-100">{fmtINR(claim.claimAmount)}</span>
        </td>

        {/* Outstanding */}
        <td className="px-3 py-3 min-w-[7rem] text-right">
          <span className={`font-mono text-[12px] font-bold ${claim.outstandingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
            {claim.outstandingAmount > 0 ? fmtINR(claim.outstandingAmount) : 'Nil'}
          </span>
        </td>

        {/* Approved */}
        <td className="px-3 py-3 min-w-[7rem] text-right">
          <span className={`font-mono text-[12px] ${claim.approvedAmount > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
            {claim.approvedAmount > 0 ? fmtINR(claim.approvedAmount) : '—'}
          </span>
        </td>

        {/* Denied */}
        <td className="px-3 py-3 min-w-[6rem] text-right">
          <span className={`font-mono text-[12px] ${claim.deniedAmount > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-400'}`}>
            {claim.deniedAmount > 0 ? fmtINR(claim.deniedAmount) : '—'}
          </span>
        </td>

        {/* Aging */}
        <td className="px-3 py-3 min-w-[7rem]">
          <div className="text-[10px] font-bold mb-0.5" style={{ color: agingColor }}>
            {AGING_BUCKETS.find(b => b.key === claim.agingBucket)?.label ?? claim.agingBucket}
          </div>
          <div className="font-mono text-[11px]" style={{ color: agingColor }}>{claim.agingDays}d overdue</div>
        </td>

        {/* Aging Bar */}
        <td className="px-3 py-3 min-w-[7rem]">
          <AgingBar days={claim.agingDays} bucket={claim.agingBucket} />
        </td>

        {/* Follow-up */}
        <td className="px-3 py-3 min-w-[8rem]">
          <FollowUpBadge status={claim.followUpStatus} count={claim.followUpCount} />
        </td>

        {/* Settlement */}
        <td className="px-3 py-3 min-w-[7rem]">
          <SettleBadge status={claim.settlementStatus} />
        </td>

        {/* Recovery % */}
        <td className="px-3 py-3 min-w-[7rem]">
          <RecoveryBar pct={claim.recoveryProbability} />
        </td>

        {/* Risk */}
        <td className="px-3 py-3 min-w-[6rem]">
          <RiskBadge level={claim.riskLevel} />
        </td>

        {/* Workflow */}
        <td className="px-3 py-3 min-w-[10rem]">
          <WorkflowBadge status={claim.workflowStatus} />
        </td>

        {/* Updated */}
        <td className="px-3 py-3 min-w-[7rem]">
          <span className="text-[10.5px] text-slate-500 dark:text-slate-400">{fmtDate(claim.lastUpdated)}</span>
        </td>

        {/* Actions */}
        <td className="px-3 py-3 min-w-[5rem]" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button
              onClick={e => { e.stopPropagation(); onAction('view', claim); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 text-slate-400 hover:text-amber-600 transition-colors"
            >
              <Eye size={13} />
            </button>
            <RowMenu claim={claim} onAction={onAction} />
          </div>
        </td>
      </motion.tr>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && <ExpandedRow key={`exp-${claim.id}`} claim={claim} />}
      </AnimatePresence>
    </>
  );
}

const SORT_FIELDS = ['id', 'patientName', 'agingDays', 'outstandingAmount', 'recoveryProbability'];

export default function TARGrid({
  claims, selectedRows, onSelectionChange, expandedRow, onExpandRow, onViewDetail,
}) {
  const [sortField, setSortField] = useState('agingDays');
  const [sortDir,   setSortDir]   = useState('desc');

  const handleSort = useCallback((field) => {
    if (!SORT_FIELDS.includes(field)) return;
    setSortDir(d => sortField === field ? (d === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortField(field);
  }, [sortField]);

  const sorted = [...claims].sort((a, b) => {
    const va = a[sortField], vb = b[sortField];
    if (va == null) return 1; if (vb == null) return -1;
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const allSelected = claims.length > 0 && selectedRows.length === claims.length;

  const onSelect = useCallback((id) => {
    onSelectionChange(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, [onSelectionChange]);

  const onSelectAll = useCallback(() => {
    onSelectionChange(allSelected ? [] : claims.map(c => c.id));
  }, [allSelected, claims, onSelectionChange]);

  const onAction = useCallback((action, claim) => {
    if (action === 'view') onViewDetail(claim);
  }, [onViewDetail]);

  const HEADERS = [
    { id: 'id',           label: 'Claim No.',    sortable: true  },
    { id: 'patientName',  label: 'Patient',       sortable: true  },
    { id: 'invoiceNo',    label: 'Invoice',       sortable: false },
    { id: 'tpa',          label: 'TPA / Type',    sortable: false },
    { id: 'department',   label: 'Department',    sortable: false },
    { id: 'doctor',       label: 'Doctor',        sortable: false },
    { id: 'claimAmount',  label: 'Claim Amt',     sortable: false },
    { id: 'outstandingAmount', label: 'Outstanding', sortable: true },
    { id: 'approvedAmount',   label: 'Approved',    sortable: false },
    { id: 'deniedAmount',     label: 'Denied',      sortable: false },
    { id: 'agingDays',    label: 'Aging Bucket',  sortable: true  },
    { id: 'agingBar',     label: 'Aging Bar',     sortable: false },
    { id: 'followUp',     label: 'Follow-up',     sortable: false },
    { id: 'settlement',   label: 'Settlement',    sortable: false },
    { id: 'recoveryProbability', label: 'Recovery %', sortable: true },
    { id: 'riskLevel',    label: 'Risk',          sortable: false },
    { id: 'workflow',     label: 'Workflow',       sortable: false },
    { id: 'lastUpdated',  label: 'Updated',       sortable: false },
    { id: 'actions',      label: 'Actions',       sortable: false },
  ];

  return (
    <div className="relative overflow-auto flex-1">
      <table className="w-full border-collapse text-left" style={{ minWidth: '2000px' }}>
        <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="w-10 pl-3 pr-2 py-3 cursor-pointer" onClick={onSelectAll}>
              {allSelected
                ? <CheckSquare size={15} className="text-amber-500" />
                : <Square size={15} className="text-slate-300 dark:text-slate-600 hover:text-slate-500 cursor-pointer" />
              }
            </th>
            {HEADERS.map(h => (
              <th
                key={h.id}
                onClick={() => h.sortable && handleSort(h.id)}
                className={`px-3 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap group
                  ${h.sortable ? 'cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 select-none' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {h.label}
                  {h.sortable && <SortIcon field={h.id} sortField={sortField} sortDir={sortDir} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={21} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Shield size={32} className="text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No claims match the current filters</p>
                  <p className="text-xs">Adjust filters or search criteria</p>
                </div>
              </td>
            </tr>
          ) : (
            sorted.map(claim => (
              <GridRow
                key={claim.id}
                claim={claim}
                selected={selectedRows.includes(claim.id)}
                onSelect={onSelect}
                expanded={expandedRow === claim.id}
                onExpand={id => onExpandRow(id === expandedRow ? null : id)}
                onAction={onAction}
                sortField={sortField}
                sortDir={sortDir}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
