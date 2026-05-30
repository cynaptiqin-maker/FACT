// ─── Depreciation Runs — Main Data Grid ──────────────────────────────────────
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, MoreHorizontal, Eye, RotateCcw, RefreshCw, Download,
  FileText, Sparkles, ArrowUpRight, CheckCircle2, Clock, AlertTriangle,
  Zap, Copy, ExternalLink, X, Play, Layers, Shield, GitBranch, BookOpen,
  TrendingDown,
} from 'lucide-react';
import {
  RUN_STATES, GL_STATUS, COMPLIANCE, RISK, DEP_METHODS, BOOKS, BRANCHES,
  fmtINR, fmtDate, fmtDateTime,
} from './DRConstants';

// ─── Badge primitives ─────────────────────────────────────────────────────────
const Badge = ({ cfg, value }) => {
  const c = cfg[value];
  if (!c) return <span className="text-[11px] text-slate-400">—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
};

const BookBadge = ({ book }) => {
  const c = BOOKS[book] || BOOKS.IFRS;
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${c.bg} ${c.text}`}>{c.short}</span>;
};

const MethodBadge = ({ method }) => {
  const c = DEP_METHODS[method] || DEP_METHODS.SLM;
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${c.bg} ${c.text}`}>{c.short}</span>;
};

const ColH = ({ children, right }) => (
  <th className={`px-3 py-2.5 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
    {children}
  </th>
);

// ─── Inline Expanded View ─────────────────────────────────────────────────────
function ExpandedRow({ run }) {
  const [tab, setTab] = useState('assets');
  const TABS = [
    { id: 'assets',     label: 'Assets',         icon: Layers },
    { id: 'financial',  label: 'GL & Finance',   icon: FileText },
    { id: 'compliance', label: 'Compliance',      icon: Shield },
    { id: 'workflow',   label: 'Workflow',        icon: GitBranch },
    { id: 'audit',      label: 'Audit Trail',     icon: Clock },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
      className="bg-slate-50/80 dark:bg-slate-700/20 border-t border-slate-100 dark:border-slate-700/50"
    >
      <div className="px-4 py-4">
        {/* Meta strip */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { label: 'Run ID',         value: run.id, mono: true, color: 'text-violet-700 dark:text-violet-400' },
            { label: 'Period',         value: run.period },
            { label: 'Initiated by',   value: run.createdBy },
            { label: 'Assets',         value: run.assetCount.toLocaleString('en-IN') },
            { label: 'Current Dep.',   value: fmtINR(run.currentDep), color: 'text-violet-700 dark:text-violet-400 font-bold' },
          ].map((m) => (
            <div key={m.label} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{m.label}</p>
              <p className={`text-[12.5px] font-semibold text-slate-900 dark:text-white ${m.color || ''} ${m.mono ? 'font-mono' : ''}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Fraud warning */}
        {run.fraudFlags?.length > 0 && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-[11px] font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1.5">
              <Zap size={12} className="fill-current" /> Fraud / Risk Flags
            </p>
            {run.fraudFlags.map((f, i) => (
              <p key={i} className="text-[11.5px] text-red-700 dark:text-red-400">{f}</p>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0.5 mb-3 border-b border-slate-200 dark:border-slate-600">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[11.5px] font-medium rounded-t-lg transition-colors ${
                  tab === t.id
                    ? 'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-400 border-b-2 border-violet-500 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ASSETS */}
        {tab === 'assets' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-700 flex items-center gap-2">
                <Layers size={13} className="text-violet-500" />
                <span className="text-[12px] font-semibold text-slate-900 dark:text-white">Category Breakdown</span>
              </div>
              {run.categoryBreakdown.length > 0 ? (
                <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
                  {run.categoryBreakdown.map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-[12px] font-medium text-slate-800 dark:text-slate-200">{c.cat}</p>
                        <p className="text-[11px] text-slate-400">{c.count} assets</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${c.pct}%` }} />
                        </div>
                        <div className="text-right w-20">
                          <p className="text-[12px] font-bold text-violet-700 dark:text-violet-400">{fmtINR(c.dep)}</p>
                          <p className="text-[10px] text-slate-400">{c.pct.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-center text-[12px] text-slate-400">Breakdown not loaded for this run</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Financial Summary</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Current Dep.',        value: fmtINR(run.currentDep),       cls: 'text-violet-700 dark:text-violet-400 font-bold' },
                    { label: 'Accumulated Dep.',    value: fmtINR(run.accumulatedDep),   cls: '' },
                    { label: 'Net Book Value',      value: fmtINR(run.netBookValue),     cls: '' },
                    ...(run.revaluationImpact > 0 ? [{ label: 'Revaluation Impact', value: `+${fmtINR(run.revaluationImpact)}`, cls: 'text-cyan-700 dark:text-cyan-400' }] : []),
                    ...(run.impairmentImpact > 0  ? [{ label: 'Impairment Impact',  value: `-${fmtINR(run.impairmentImpact)}`,  cls: 'text-orange-700 dark:text-orange-400' }] : []),
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-500 dark:text-slate-400">{r.label}</span>
                      <span className={`font-semibold text-slate-900 dark:text-white ${r.cls}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {run.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <p className="text-[10.5px] font-semibold text-amber-700 dark:text-amber-400 mb-1">Notes</p>
                  <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">{run.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FINANCIAL */}
        {tab === 'financial' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'P&L Impact',     value: `-${fmtINR(run.currentDep)}`,   sub: 'Depreciation Expense Dr.' },
                { label: 'Balance Sheet',  value: `-${fmtINR(run.currentDep)}`,   sub: 'Accumulated Dep. Cr.' },
                { label: 'Net Book Value', value: fmtINR(run.netBookValue),        sub: 'After this run' },
              ].map((c) => (
                <div key={c.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-3">
                  <p className="text-[11px] text-slate-400 mb-1">{c.label}</p>
                  <p className="text-[14px] font-bold text-violet-700 dark:text-violet-400">{c.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>
                </div>
              ))}
            </div>
            {run.journalRef ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-violet-500" />
                    <span className="text-[12px] font-semibold text-slate-900 dark:text-white">GL Journal Voucher</span>
                  </div>
                  <button className="flex items-center gap-1 text-[11px] text-violet-600 hover:underline">
                    {run.journalRef} <ExternalLink size={10} />
                  </button>
                </div>
                {run.glEntries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50/50 dark:bg-slate-700/30">
                        <tr>
                          {['Account', 'Cost Center', 'Debit (₹)', 'Credit (₹)'].map((h) => (
                            <th key={h} className={`px-3 py-2 text-[10.5px] font-medium text-slate-500 uppercase tracking-wide ${h.includes('(₹)') ? 'text-right' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                        {run.glEntries.map((e, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                            <td className="px-3 py-2 text-[12px] text-slate-700 dark:text-slate-300">{e.account}</td>
                            <td className="px-3 py-2 text-[11px] text-slate-400">{e.costCenter}</td>
                            <td className="px-3 py-2 text-right text-[12px] font-mono text-slate-900 dark:text-white">{e.debit > 0 ? fmtINR(e.debit) : '—'}</td>
                            <td className="px-3 py-2 text-right text-[12px] font-mono text-slate-900 dark:text-white">{e.credit > 0 ? fmtINR(e.credit) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-slate-200 dark:border-slate-600 bg-violet-50/30 dark:bg-violet-900/10">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-[11px] font-bold text-violet-700 dark:text-violet-400">Total</td>
                          <td className="px-3 py-2 text-right text-[12px] font-bold text-violet-700 dark:text-violet-400 font-mono">
                            {fmtINR(run.glEntries.reduce((s, e) => s + e.debit, 0))}
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] font-bold text-violet-700 dark:text-violet-400 font-mono">
                            {fmtINR(run.glEntries.reduce((s, e) => s + e.credit, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="p-5 text-center text-[12px] text-slate-400">GL entries not loaded — open full detail for complete view</p>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 text-center">
                <p className="text-[12px] text-amber-700 dark:text-amber-400">Journal not yet generated — post the run to create JV</p>
              </div>
            )}
          </div>
        )}

        {/* COMPLIANCE */}
        {tab === 'compliance' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Compliance Checklist</p>
              <div className="space-y-2.5">
                {[
                  { std: 'Companies Act 2013 — Sch. II Rates', ok: run.complianceStatus === 'COMPLIANT' },
                  { std: 'IFRS / Ind AS 16 (PPE)',              ok: run.book === 'IFRS' && run.complianceStatus === 'COMPLIANT' },
                  { std: 'IAS 36 Impairment Testing',           ok: run.impairmentImpact === 0 },
                  { std: 'IT Act — Block of Assets',            ok: run.book === 'IT_ACT' || run.complianceStatus === 'COMPLIANT' },
                  { std: 'Cost Center Allocation',              ok: run.glEntries.length > 0 },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.ok ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                      {c.ok ? <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle size={12} className="text-amber-500" />}
                    </div>
                    <p className={`text-[12px] ${c.ok ? 'text-slate-700 dark:text-slate-300' : 'text-amber-700 dark:text-amber-400 font-medium'}`}>{c.std}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Book Details</p>
              <div className="space-y-2">
                {[
                  { k: 'Accounting Book', v: <BookBadge book={run.book} /> },
                  { k: 'Method',          v: <MethodBadge method={run.method} /> },
                  { k: 'Risk Level',      v: <Badge cfg={RISK} value={run.riskLevel} /> },
                  { k: 'Compliance',      v: <Badge cfg={COMPLIANCE} value={run.complianceStatus} /> },
                  { k: 'Standard',        v: BOOKS[run.book]?.std || '—' },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between text-[12px]">
                    <span className="text-slate-500 dark:text-slate-400">{r.k}</span>
                    <span>{typeof r.v === 'string' ? <span className="text-slate-700 dark:text-slate-300 font-medium">{r.v}</span> : r.v}</span>
                  </div>
                ))}
              </div>
              {run.revaluationImpact > 0 && (
                <div className="mt-3 p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                  <p className="text-[11px] text-cyan-700 dark:text-cyan-400 font-medium">Revaluation included — IAS 16 revaluation model applied</p>
                </div>
              )}
              {run.impairmentImpact > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <p className="text-[11px] text-orange-700 dark:text-orange-400 font-medium">Impairment recorded — IAS 36 formal assessment required</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WORKFLOW */}
        {tab === 'workflow' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Approval Workflow</p>
            <div className="space-y-3">
              {[
                { label: 'Run Initiated',          user: run.createdBy,  ts: run.createdAt,   done: true },
                { label: 'Calculation Completed',  user: 'System',       ts: run.createdAt,   done: !!run.createdAt },
                { label: 'Preview Generated',      user: run.createdBy,  ts: run.createdAt,   done: !['DRAFT'].includes(run.workflowStatus) },
                { label: 'Finance Head Approval',  user: run.approvedBy || 'Pending',  ts: run.approvedAt, done: !!run.approvedBy },
                { label: 'GL Posted',              user: 'System',       ts: run.approvedAt,  done: run.glStatus === 'POSTED' },
                { label: 'Reconciliation',         user: 'Finance Team', ts: null,            done: run.workflowStatus === 'RECONCILED' },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${s.done ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    {s.done ? <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Clock size={13} className="text-slate-400" />}
                  </div>
                  <div>
                    <p className={`text-[12.5px] font-medium ${s.done ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{s.label}</p>
                    <p className="text-[11px] text-slate-400">{s.user}{s.ts ? ` · ${fmtDateTime(s.ts)}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDIT */}
        {tab === 'audit' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-700 flex items-center gap-2">
              <Clock size={13} className="text-violet-500" />
              <span className="text-[12px] font-semibold text-slate-900 dark:text-white">Audit Trail — {run.id}</span>
            </div>
            {run.auditTrail.length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {run.auditTrail.map((e, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-2.5">
                    <span className="text-[11px] text-slate-400 tabular-nums w-36 flex-shrink-0">{fmtDateTime(e.ts)}</span>
                    <span className="text-[11.5px] font-medium text-slate-700 dark:text-slate-300 w-32 flex-shrink-0">{e.user}</span>
                    <span className="text-[12px] text-slate-600 dark:text-slate-400 flex-1">{e.action}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                      e.type === 'AI_ALERT' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                      e.type === 'POST' || e.type === 'APPROVE' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                      e.type === 'REVERSE' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' :
                      'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>{e.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-5 text-center text-[12px] text-slate-400">No audit events for this run</p>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-600">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors">
            <Eye size={12} /> Full Detail
          </button>
          {run.journalRef && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-violet-300 transition-colors">
              <FileText size={12} /> Open JV
            </button>
          )}
          {run.glStatus !== 'REVERSED' && run.workflowStatus !== 'DRAFT' && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg bg-white dark:bg-slate-700 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:border-rose-400 transition-colors">
              <RotateCcw size={12} /> Reverse
            </button>
          )}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-violet-300 transition-colors">
            <Download size={12} /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg bg-white dark:bg-slate-700 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:border-purple-400 transition-colors">
            <Sparkles size={12} /> AI Explain
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────
function RowMenu({ run }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { label: 'View Details',     icon: Eye,         disabled: false },
    { label: 'Preview Run',      icon: Eye,         disabled: !['DRAFT'].includes(run.workflowStatus) },
    { label: 'Post to GL',       icon: ArrowUpRight,disabled: run.glStatus === 'POSTED' },
    { label: 'Reverse Run',      icon: RotateCcw,   disabled: ['DRAFT','REVERSED'].includes(run.workflowStatus), cls: 'text-rose-600 dark:text-rose-400' },
    { label: 'Recalculate',      icon: RefreshCw,   disabled: false },
    { label: 'Open Journal',     icon: FileText,    disabled: !run.journalRef },
    { label: 'AI Explain',       icon: Sparkles,    disabled: false },
    { label: 'Export Schedule',  icon: Download,    disabled: false },
    { label: 'Copy Run ID',      icon: Copy,        disabled: false },
  ];
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 top-full mt-1 z-30 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
            >
              {actions.map((a) => (
                <button
                  key={a.label}
                  disabled={a.disabled}
                  onClick={() => setOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors ${
                    a.disabled ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' :
                    a.cls ? `${a.cls} hover:bg-rose-50 dark:hover:bg-rose-900/20` :
                    'text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                  }`}
                >
                  <a.icon size={13} className="flex-shrink-0" />
                  {a.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Grid ────────────────────────────────────────────────────────────────
export default function DRGrid({ runs, onOpenDrawer }) {
  const [expanded, setExpanded]   = useState(null);
  const [selected, setSelected]   = useState(new Set());
  const [sortKey, setSortKey]     = useState('runDate');
  const [sortDir, setSortDir]     = useState('desc');

  const sorted = useMemo(() => {
    return [...runs].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') av = av.toLowerCase(), bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [runs, sortKey, sortDir]);

  const toggleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const toggleAll = () => setSelected(s => s.size === runs.length ? new Set() : new Set(runs.map(r => r.id)));
  const toggle    = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const SortCaret = ({ k }) => sortKey === k
    ? <ChevronRight size={11} className={`transition-transform ${sortDir === 'asc' ? '-rotate-90' : 'rotate-90'}`} />
    : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Bulk bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-3 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-200 dark:border-violet-800"
          >
            <span className="text-[12px] font-semibold text-violet-700 dark:text-violet-400">{selected.size} selected</span>
            {[
              { label: 'Post All',     icon: ArrowUpRight },
              { label: 'Reverse All',  icon: RotateCcw },
              { label: 'Recalculate',  icon: RefreshCw },
              { label: 'Export',       icon: Download },
              { label: 'AI Analyse',   icon: Sparkles },
            ].map(({ label, icon: Icon }) => (
              <button key={label} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-700 border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors">
                <Icon size={11} /> {label}
              </button>
            ))}
            <button onClick={() => setSelected(new Set())} className="ml-auto text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="w-9 px-3 py-2.5">
                <input type="checkbox" checked={selected.size === runs.length && runs.length > 0} onChange={toggleAll}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-3.5 h-3.5" />
              </th>
              <ColH><button onClick={() => toggleSort('id')} className="flex items-center gap-1">Run ID <SortCaret k="id" /></button></ColH>
              <ColH>Book</ColH>
              <ColH><button onClick={() => toggleSort('period')} className="flex items-center gap-1">Period <SortCaret k="period" /></button></ColH>
              <ColH>Branch</ColH>
              <ColH>Method</ColH>
              <ColH right><button onClick={() => toggleSort('assetCount')} className="flex items-center gap-1 justify-end ml-auto">Assets <SortCaret k="assetCount" /></button></ColH>
              <ColH right><button onClick={() => toggleSort('currentDep')} className="flex items-center gap-1 justify-end ml-auto">Current Dep. <SortCaret k="currentDep" /></button></ColH>
              <ColH right><button onClick={() => toggleSort('accumulatedDep')} className="flex items-center gap-1 justify-end ml-auto">Accumulated <SortCaret k="accumulatedDep" /></button></ColH>
              <ColH right>Reval.</ColH>
              <ColH right>Impairment</ColH>
              <ColH>GL Status</ColH>
              <ColH>Compliance</ColH>
              <ColH>Risk</ColH>
              <ColH>Workflow</ColH>
              <ColH><button onClick={() => toggleSort('updatedAt')} className="flex items-center gap-1">Updated <SortCaret k="updatedAt" /></button></ColH>
              <th className="w-10 px-2 py-2.5" />
              <th className="w-8 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
            {sorted.map((run, idx) => {
              const isExp = expanded === run.id;
              const isSel = selected.has(run.id);
              const branchLabel = BRANCHES[run.branch]?.label || run.branch;
              const hasFraud = run.fraudFlags?.length > 0;

              return (
                <>
                  <motion.tr
                    key={run.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.025 }}
                    className={`group cursor-pointer transition-colors ${
                      isExp ? 'bg-violet-50/40 dark:bg-violet-900/10' :
                      isSel ? 'bg-violet-50/20 dark:bg-violet-900/5' :
                      'hover:bg-slate-50/80 dark:hover:bg-slate-700/20'
                    }`}
                    onClick={() => setExpanded(isExp ? null : run.id)}
                  >
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSel} onChange={() => toggle(run.id)}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-3.5 h-3.5" />
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-bold text-violet-700 dark:text-violet-400 font-mono">{run.id}</span>
                        {hasFraud && <Zap size={11} className="text-red-500 fill-red-100 flex-shrink-0" title="Fraud flag" />}
                        {run.impairmentImpact > 0 && <AlertTriangle size={11} className="text-orange-500 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(run.runDate)}</p>
                    </td>

                    <td className="px-3 py-2.5"><BookBadge book={run.book} /></td>
                    <td className="px-3 py-2.5"><span className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">{run.period}</span></td>
                    <td className="px-3 py-2.5"><span className="text-[12px] text-slate-600 dark:text-slate-400 whitespace-nowrap">{branchLabel}</span></td>
                    <td className="px-3 py-2.5"><MethodBadge method={run.method} /></td>

                    <td className="px-3 py-2.5 text-right">
                      <span className="text-[12.5px] font-semibold text-slate-900 dark:text-white tabular-nums">{run.assetCount.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-[12.5px] font-bold text-violet-700 dark:text-violet-400 tabular-nums">{fmtINR(run.currentDep)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 tabular-nums">{fmtINR(run.accumulatedDep)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {run.revaluationImpact > 0
                        ? <span className="text-[12px] font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">+{fmtINR(run.revaluationImpact)}</span>
                        : <span className="text-slate-300 dark:text-slate-600 text-[11px]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {run.impairmentImpact > 0
                        ? <span className="text-[12px] font-semibold text-orange-600 dark:text-orange-400 tabular-nums">-{fmtINR(run.impairmentImpact)}</span>
                        : <span className="text-slate-300 dark:text-slate-600 text-[11px]">—</span>}
                    </td>

                    <td className="px-3 py-2.5"><Badge cfg={GL_STATUS}   value={run.glStatus} /></td>
                    <td className="px-3 py-2.5"><Badge cfg={COMPLIANCE}  value={run.complianceStatus} /></td>
                    <td className="px-3 py-2.5"><Badge cfg={RISK}        value={run.riskLevel} /></td>
                    <td className="px-3 py-2.5"><Badge cfg={RUN_STATES}  value={run.workflowStatus} /></td>

                    <td className="px-3 py-2.5">
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{fmtDate(run.updatedAt)}</span>
                    </td>

                    <td className="px-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <RowMenu run={run} />
                    </td>
                    <td className="px-2 py-2.5">
                      <ChevronRight size={13} className={`text-slate-400 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                    </td>
                  </motion.tr>

                  <AnimatePresence>
                    {isExp && (
                      <tr key={`${run.id}-exp`}>
                        <td colSpan={18} className="p-0">
                          <ExpandedRow run={run} />
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-700/20">
        <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{runs.length}</span> depreciation runs
          {selected.size > 0 && <span className="ml-1.5 text-violet-600 dark:text-violet-400">· {selected.size} selected</span>}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <TrendingDown size={12} className="text-violet-500" />
          Real-time sync
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
