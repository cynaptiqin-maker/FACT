import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Edit2, Lock, Unlock, PlayCircle, BookOpen,
  Calendar, Building2, Shield, History, Sparkles,
  CheckCircle, XCircle, AlertTriangle, Clock,
  ChevronRight, User, Info,
} from 'lucide-react';
import clsx from 'clsx';
import {
  FY_STATUS, PERIOD_STATUS, MOCK_BRANCHES,
  fyLabel, formatFYDate, generatePeriods, generateAIInsights, fyMetrics,
} from './fyConstants';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',    icon: BookOpen   },
  { id: 'periods',   label: 'Periods',     icon: Calendar   },
  { id: 'branches',  label: 'Branches',    icon: Building2  },
  { id: 'workflow',  label: 'Year-End',    icon: PlayCircle },
  { id: 'ai',        label: 'AI Insights', icon: Sparkles   },
  { id: 'audit',     label: 'Audit',       icon: History    },
];

// ─── Field row ─────────────────────────────────────────────────────────────────
function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50/60 transition-colors">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-xs text-slate-800 max-w-[55%] text-right truncate">{value ?? '—'}</span>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ fy, onStartYE, onEdit }) {
  const fyStatus = FY_STATUS[fy.status] || FY_STATUS.DRAFT;
  const periods  = fy.periods || generatePeriods(fy.start_date);
  const metrics  = fyMetrics({ ...fy, periods });
  const daysLeft = Math.floor((new Date(fy.end_date) - new Date()) / 86400000);

  return (
    <div className="space-y-4 pb-6">
      {/* Status hero */}
      <div className="mx-4 p-4 rounded-xl border bg-gradient-to-br from-slate-50 to-blue-50/20 border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border', fyStatus.bg, fyStatus.text, fyStatus.border)}>
            <span className={clsx('w-2 h-2 rounded-full', fyStatus.dot)} />
            {fyStatus.label}
          </span>
          {fy.is_locked && (
            <span className="flex items-center gap-1 text-xs font-medium text-violet-600">
              <Lock className="w-3.5 h-3.5" /> Locked
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-800">{fyLabel(fy)}</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {formatFYDate(fy.start_date)} – {formatFYDate(fy.end_date)}
        </p>
        {daysLeft > 0 && daysLeft <= 90 && fy.status !== 'CLOSED' && (
          <div className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">{daysLeft} days until year-end</span>
          </div>
        )}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 px-4">
        {[
          { label: 'Open', value: metrics.open,   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Closed', value: metrics.closed, color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'     },
          { label: 'Locked', value: metrics.locked, color: 'text-violet-700',  bg: 'bg-violet-50 border-violet-200' },
        ].map(m => (
          <div key={m.label} className={clsx('flex flex-col items-center py-3 rounded-xl border', m.bg)}>
            <span className={clsx('text-xl font-bold tabular-nums', m.color)}>{m.value}</span>
            <span className="text-xs text-slate-500 mt-0.5">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Details */}
      <div>
        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Details</p>
        <div className="divide-y divide-slate-100 border-y border-slate-100">
          <Field label="Fiscal Year" value={fyLabel(fy)} />
          <Field label="Start Date"  value={formatFYDate(fy.start_date)} />
          <Field label="End Date"    value={formatFYDate(fy.end_date)} />
          <Field label="Status"      value={fyStatus.label} />
          <Field label="Branch Coverage" value={`${fy.branches_closed || 0} / ${fy.branch_count || 5} closed`} />
          <Field label="Compliance"  value={fy.compliance_ok === true ? '✓ OK' : fy.compliance_ok === false ? '⚠ Issues found' : '—'} />
          {fy.closed_by  && <Field label="Closed By"   value={fy.closed_by} />}
          {fy.closed_at  && <Field label="Closed At"   value={formatFYDate(fy.closed_at)} />}
        </div>
      </div>

      {/* Quick actions */}
      {['ACTIVE', 'PARTIALLY_CLOSED'].includes(fy.status) && (
        <div className="px-4 flex gap-2">
          <button
            onClick={() => onStartYE(fy)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 text-white text-xs font-semibold rounded-xl hover:bg-amber-700 transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" /> Start Year-End
          </button>
          <button
            onClick={() => onEdit(fy)}
            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Periods Tab ──────────────────────────────────────────────────────────────
function PeriodsTab({ fy }) {
  const periods = fy.periods || generatePeriods(fy.start_date);

  return (
    <div className="pb-6">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">Accounting Periods ({periods.length})</p>
        <button className="text-xs text-brand-600 font-medium hover:text-brand-800">+ Add Adjustment Period</button>
      </div>
      <div className="divide-y divide-slate-50">
        {periods.map(p => {
          const cfg = PERIOD_STATUS[p.status] || PERIOD_STATUS.FUTURE;
          return (
            <div
              key={p.id}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors',
                p.isCurrent && 'bg-emerald-50/40',
              )}
            >
              {/* Status dot */}
              <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg, 'border', cfg.dot.replace('bg-', 'border-'))}>
                <span className={clsx('w-2.5 h-2.5 rounded-full', cfg.dot)} />
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-slate-700">{p.name}</p>
                  {p.isCurrent && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formatFYDate(p.start_date)} – {formatFYDate(p.end_date)}
                </p>
              </div>

              {/* Status pill */}
              <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border', cfg.bg, cfg.text, 'border-transparent')}>
                {cfg.label}
              </span>

              {/* Quick lock/unlock */}
              {!fy.is_locked && (
                <button className="text-slate-300 hover:text-slate-500 transition-colors p-1">
                  {p.is_locked ? <Lock className="w-3.5 h-3.5 text-violet-400" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Branches Tab ─────────────────────────────────────────────────────────────
function BranchesTab({ fy }) {
  const branches = fy.branches || MOCK_BRANCHES;

  const allClosed = branches.every(b => b.closed);
  return (
    <div className="pb-6">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-600">Branch Closure Status</p>
        {!allClosed && (
          <p className="text-xs text-amber-600 mt-0.5">
            {branches.filter(b => !b.closed).length} branch(es) not yet closed
          </p>
        )}
      </div>
      <div className="divide-y divide-slate-50">
        {branches.map(b => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
            <div className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
              b.closed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
            )}>
              {b.code}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{b.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                {b.complianceOk
                  ? <><CheckCircle className="w-3 h-3 text-emerald-500" /> Compliance OK</>
                  : <><AlertTriangle className="w-3 h-3 text-amber-500" /> Compliance issues</>
                }
              </p>
            </div>
            {b.closed
              ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              : <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Year-End Workflow Tab ────────────────────────────────────────────────────
function WorkflowTab({ fy, onLaunch }) {
  const steps = [
    { id: 1, label: 'Validate transactions',  status: 'done',    desc: 'All journals posted, no orphan entries' },
    { id: 2, label: 'Reconcile sub-ledgers',  status: 'done',    desc: 'AR, AP, bank statements matched' },
    { id: 3, label: 'Freeze posting window',  status: fy.status === 'ACTIVE' ? 'pending' : 'done', desc: 'Prevent new entries for this year' },
    { id: 4, label: 'Generate closing entries', status: 'locked', desc: 'Close income & expense to retained earnings' },
    { id: 5, label: 'Compliance checks',      status: 'locked',  desc: 'GST, TDS, statutory validation' },
    { id: 6, label: 'CFO approval',           status: 'locked',  desc: 'Final sign-off before year lock' },
    { id: 7, label: 'Lock fiscal year',        status: 'locked',  desc: 'Permanent immutable lock' },
  ];

  const statusIcon = { done: CheckCircle, pending: Clock, locked: Lock };
  const statusColor = { done: 'text-emerald-600 bg-emerald-50 border-emerald-200', pending: 'text-amber-600 bg-amber-50 border-amber-200', locked: 'text-slate-400 bg-slate-50 border-slate-200' };

  const completedCount = steps.filter(s => s.status === 'done').length;

  return (
    <div className="pb-6">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-600">Year-End Closing Workflow</p>
          <span className="text-xs text-slate-500">{completedCount}/{steps.length} complete</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(completedCount / steps.length) * 100}%` }} />
        </div>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {steps.map((step, idx) => {
          const Icon = statusIcon[step.status] || Lock;
          return (
            <div
              key={step.id}
              className={clsx(
                'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                statusColor[step.status],
                step.status === 'pending' && 'cursor-pointer hover:shadow-sm',
              )}
            >
              <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', step.status === 'done' ? 'bg-emerald-500' : step.status === 'pending' ? 'bg-amber-500' : 'bg-slate-200')}>
                {step.status === 'done'
                  ? <CheckCircle className="w-3.5 h-3.5 text-white" />
                  : <span className="text-[10px] font-bold text-white">{step.id}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-xs font-semibold', step.status === 'locked' ? 'text-slate-400' : 'text-slate-700')}>
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{step.desc}</p>
              </div>
              {step.status === 'pending' && (
                <button className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap">
                  Run →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {['ACTIVE', 'PARTIALLY_CLOSED'].includes(fy.status) && (
        <div className="px-4 mt-4">
          <button
            onClick={() => onLaunch(fy)}
            className="w-full py-2.5 bg-amber-600 text-white text-xs font-semibold rounded-xl hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-3.5 h-3.5" /> Launch Year-End Process
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AI Insights Tab ──────────────────────────────────────────────────────────
function AITab({ fy }) {
  const periods  = fy.periods || generatePeriods(fy.start_date);
  const insights = generateAIInsights(fy, periods);
  const typeColor = { warning: 'bg-amber-50 border-amber-200 text-amber-700', alert: 'bg-red-50 border-red-200 text-red-700', error: 'bg-red-50 border-red-200 text-red-700', success: 'bg-emerald-50 border-emerald-200 text-emerald-700', info: 'bg-blue-50 border-blue-200 text-blue-700' };

  return (
    <div className="px-4 py-4 pb-6 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-700">AI Governance Assistant</p>
          <p className="text-[10px] text-slate-400">Analysing {fyLabel(fy)}</p>
        </div>
      </div>

      {insights.map((ins, i) => (
        <div key={i} className={clsx('p-3 rounded-xl border text-xs', typeColor[ins.type])}>
          <p className="font-semibold mb-0.5">{ins.title}</p>
          <p className="opacity-90">{ins.body}</p>
        </div>
      ))}

      {/* Suggested prompts */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Ask the AI</p>
        {[
          'Why is this year flagged?',
          'Which branches are not ready?',
          'What compliance risks exist?',
          'Suggest closing sequence',
        ].map(q => (
          <button key={q} className="flex items-center gap-2 w-full text-left py-1.5 text-xs text-slate-600 hover:text-brand-700 transition-colors">
            <ChevronRight className="w-3 h-3 text-slate-300" /> {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────
function AuditTab({ fy }) {
  const events = [
    { action: 'Fiscal year created',       user: 'System',       time: formatFYDate(fy.start_date), type: 'create'  },
    { action: 'Status set to Active',      user: 'Admin',        time: 'At start',                  type: 'update'  },
    { action: 'Period April locked',       user: 'Meera Nair',   time: '3 days ago',                type: 'lock'    },
    { action: 'Period May closed',         user: 'Anil Kumar',   time: '2 days ago',                type: 'close'   },
    { action: 'Compliance check run',      user: 'System',       time: 'Yesterday',                 type: 'check'   },
  ];
  const dotColor = { create: 'bg-emerald-500', update: 'bg-blue-500', lock: 'bg-violet-500', close: 'bg-brand-600', check: 'bg-sky-500' };

  return (
    <div className="px-4 py-4 pb-6 space-y-3">
      {events.map((e, i) => (
        <div key={i} className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
          <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0', dotColor[e.type] || 'bg-slate-400')}>
            {e.user[0]}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-700 font-medium">{e.action}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                <User className="w-2.5 h-2.5" /> {e.user}
              </span>
              <span className="text-[10px] text-slate-400">{e.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
export default function FYDetailPanel({ fy, onClose, onEdit, onStartYE, onLaunchYE }) {
  const [tab, setTab] = useState('overview');

  useEffect(() => { setTab('overview'); }, [fy?.id]);

  if (!fy) return null;

  const fyStatus = FY_STATUS[fy.status] || FY_STATUS.DRAFT;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />

        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="relative w-full max-w-[560px] bg-white shadow-2xl flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border', fyStatus.bg, fyStatus.text, fyStatus.border)}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full', fyStatus.dot)} />
                    {fyStatus.label}
                  </span>
                  {fy.compliance_ok === false && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Compliance issue
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-800">{fyLabel(fy)}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatFYDate(fy.start_date)} – {formatFYDate(fy.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => onEdit(fy)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 text-white text-xs font-semibold rounded-lg hover:bg-brand-800 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 border-b border-slate-100 overflow-x-auto">
            <div className="flex min-w-max">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
                      tab === t.id
                        ? 'border-brand-700 text-brand-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {tab === 'overview'  && <OverviewTab  fy={fy} onStartYE={onStartYE} onEdit={onEdit} />}
                {tab === 'periods'   && <PeriodsTab   fy={fy} />}
                {tab === 'branches'  && <BranchesTab  fy={fy} />}
                {tab === 'workflow'  && <WorkflowTab  fy={fy} onLaunch={onLaunchYE} />}
                {tab === 'ai'        && <AITab        fy={fy} />}
                {tab === 'audit'     && <AuditTab     fy={fy} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
