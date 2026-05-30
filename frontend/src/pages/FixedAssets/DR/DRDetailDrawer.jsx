// ─── Depreciation Runs — 7-Tab Detail Drawer ─────────────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, TrendingDown, Layers, FileText, Shield, Landmark, GitBranch, Clock,
  CheckCircle2, AlertTriangle, Zap, RotateCcw, RefreshCw, Download,
  ExternalLink, Sparkles, Play, BookOpen, ArrowUpRight, Copy, ChevronRight,
} from 'lucide-react';
import {
  RUN_STATES, GL_STATUS, COMPLIANCE, RISK, DEP_METHODS, BOOKS, BRANCHES,
  TREASURY_FORECAST, fmtINR, fmtDate, fmtDateTime,
} from './DRConstants';

// ─── Primitives ───────────────────────────────────────────────────────────────
const SBadge = ({ cfg, value }) => {
  const c = cfg[value];
  if (!c) return <span className="text-[12px] text-slate-400">—</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium ${c.bg} ${c.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
    <span className="text-[12px] text-slate-500 dark:text-slate-400 w-40 flex-shrink-0">{label}</span>
    <span className="text-[12px] font-medium text-slate-900 dark:text-white text-right">{value ?? '—'}</span>
  </div>
);

const SectionTitle = ({ icon: Icon, title, color = 'violet' }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className={`p-1.5 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
      <Icon size={13} className={`text-${color}-600 dark:text-${color}-400`} />
    </div>
    <h4 className="text-[12.5px] font-semibold text-slate-900 dark:text-white">{title}</h4>
  </div>
);

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: 'Overview',    icon: TrendingDown },
  { id: 'assets',     label: 'Assets',      icon: Layers },
  { id: 'financial',  label: 'GL & Finance',icon: FileText },
  { id: 'compliance', label: 'Compliance',  icon: Shield },
  { id: 'treasury',   label: 'Treasury',    icon: Landmark },
  { id: 'workflow',   label: 'Workflow',    icon: GitBranch },
  { id: 'audit',      label: 'Audit Trail', icon: Clock },
];

// ─── Drawer ───────────────────────────────────────────────────────────────────
export default function DRDetailDrawer({ run, onClose }) {
  const [tab, setTab] = useState('overview');

  if (!run) return null;

  const book   = BOOKS[run.book]   || BOOKS.IFRS;
  const method = DEP_METHODS[run.method] || DEP_METHODS.SLM;
  const branch = BRANCHES[run.branch]    || { label: run.branch };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="flex-1 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        />

        {/* Panel */}
        <motion.div
          className="w-full max-w-[680px] bg-white dark:bg-slate-900 flex flex-col shadow-2xl overflow-hidden"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={18} className="text-white/80" />
                <span className="text-white font-bold text-lg tracking-tight">{run.id}</span>
                {run.riskLevel === 'CRITICAL' && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500 text-white">CRITICAL</span>
                )}
                {run.fraudFlags?.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-yellow-500 text-black">FRAUD FLAG</span>
                )}
              </div>
              <p className="text-white/70 text-[13px]">{run.period} · {book.label} · {branch.label}</p>
              <div className="flex items-center gap-2 mt-2">
                <SBadge cfg={RUN_STATES} value={run.workflowStatus} />
                <SBadge cfg={GL_STATUS}  value={run.glStatus} />
                <SBadge cfg={RISK}       value={run.riskLevel} />
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-700 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
            {[
              { l: 'Current Dep.',  v: fmtINR(run.currentDep),       c: 'text-violet-700 dark:text-violet-400 font-bold' },
              { l: 'Accumulated',   v: fmtINR(run.accumulatedDep),   c: 'text-slate-900 dark:text-white' },
              { l: 'Net Book Value',v: fmtINR(run.netBookValue),     c: 'text-slate-900 dark:text-white' },
              { l: 'Assets',        v: run.assetCount.toLocaleString('en-IN'), c: 'text-slate-900 dark:text-white' },
            ].map((s) => (
              <div key={s.l} className="px-4 py-3 text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{s.l}</p>
                <p className={`text-[15px] font-bold tabular-nums ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto px-4 pt-1 gap-0.5 flex-shrink-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[11.5px] font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    tab === t.id
                      ? 'text-violet-700 dark:text-violet-400 border-b-2 border-violet-500 bg-violet-50/40 dark:bg-violet-900/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon size={12} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
              >
                {/* ── OVERVIEW ── */}
                {tab === 'overview' && (
                  <div className="space-y-5">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <SectionTitle icon={TrendingDown} title="Run Configuration" />
                      <div>
                        <InfoRow label="Run ID"           value={<span className="font-mono text-violet-700 dark:text-violet-400">{run.id}</span>} />
                        <InfoRow label="Financial Period" value={run.period} />
                        <InfoRow label="Run Date"         value={fmtDate(run.runDate)} />
                        <InfoRow label="Accounting Book"  value={<span className={`font-bold ${book.text}`}>{book.label}</span>} />
                        <InfoRow label="Standard Applied" value={book.std} />
                        <InfoRow label="Dep. Method"      value={<span className={`font-bold ${method.text}`}>{method.label}</span>} />
                        <InfoRow label="Branch Scope"     value={branch.label} />
                        <InfoRow label="Asset Category"   value={run.assetCategory === 'ALL' ? 'All Categories' : run.assetCategory} />
                        <InfoRow label="Initiated by"     value={run.createdBy} />
                        <InfoRow label="Approved by"      value={run.approvedBy || '—'} />
                        <InfoRow label="Approved at"      value={fmtDateTime(run.approvedAt)} />
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <SectionTitle icon={TrendingDown} title="Depreciation Summary" color="purple" />
                      <div>
                        <InfoRow label="Assets Processed"    value={run.assetCount.toLocaleString('en-IN')} />
                        <InfoRow label="Current Period Dep." value={<span className="text-violet-700 dark:text-violet-400 font-bold">{fmtINR(run.currentDep)}</span>} />
                        <InfoRow label="Accumulated Total"   value={fmtINR(run.accumulatedDep)} />
                        <InfoRow label="Net Book Value"      value={fmtINR(run.netBookValue)} />
                        {run.revaluationImpact > 0 && <InfoRow label="Revaluation Impact" value={<span className="text-cyan-600 dark:text-cyan-400 font-semibold">+{fmtINR(run.revaluationImpact)}</span>} />}
                        {run.impairmentImpact > 0  && <InfoRow label="Impairment Impact"  value={<span className="text-orange-600 dark:text-orange-400 font-semibold">-{fmtINR(run.impairmentImpact)}</span>} />}
                      </div>
                    </div>
                    {run.fraudFlags?.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <p className="text-[11px] font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
                          <Zap size={12} className="fill-current" /> Fraud & Risk Flags
                        </p>
                        {run.fraudFlags.map((f, i) => (
                          <p key={i} className="text-[12px] text-red-700 dark:text-red-400 mb-1">• {f}</p>
                        ))}
                      </div>
                    )}
                    {run.notes && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <p className="text-[10.5px] font-semibold text-amber-700 dark:text-amber-400 mb-1">Notes</p>
                        <p className="text-[12.5px] text-amber-800 dark:text-amber-300 leading-relaxed">{run.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── ASSETS ── */}
                {tab === 'assets' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <SectionTitle icon={Layers} title="Category Breakdown" />
                        <span className="text-[11px] text-slate-400">{run.assetCount} total assets</span>
                      </div>
                      {run.categoryBreakdown.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {run.categoryBreakdown.map((c, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3">
                              <div className="flex-1">
                                <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">{c.cat}</p>
                                <p className="text-[11px] text-slate-400">{c.count} assets</p>
                              </div>
                              <div className="w-28 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" style={{ width: `${c.pct}%` }} />
                              </div>
                              <div className="text-right w-28">
                                <p className="text-[12.5px] font-bold text-violet-700 dark:text-violet-400">{fmtINR(c.dep)}</p>
                                <p className="text-[10px] text-slate-400">{c.pct.toFixed(1)}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <Layers size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-[12px] text-slate-400">Category detail not loaded for this run</p>
                        </div>
                      )}
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 text-[12.5px] hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                      <ExternalLink size={14} /> Open Asset Register for this Run Scope
                    </button>
                  </div>
                )}

                {/* ── GL & FINANCE ── */}
                {tab === 'financial' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { l: 'P&L Impact',     v: `-${fmtINR(run.currentDep)}`, sub: 'Depreciation Expense Dr.' },
                        { l: 'Balance Sheet',  v: `-${fmtINR(run.currentDep)}`, sub: 'Accumulated Dep. Cr.' },
                      ].map((c) => (
                        <div key={c.l} className="bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800 p-3">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{c.l}</p>
                          <p className="text-[15px] font-bold text-violet-700 dark:text-violet-400">{c.v}</p>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">{c.sub}</p>
                        </div>
                      ))}
                    </div>

                    {run.journalRef ? (
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                          <SectionTitle icon={FileText} title="Journal Voucher" />
                          <button className="flex items-center gap-1 text-[11.5px] text-violet-600 dark:text-violet-400 hover:underline">
                            {run.journalRef} <ExternalLink size={11} />
                          </button>
                        </div>
                        {run.glEntries.length > 0 ? (
                          <div className="overflow-x-auto p-2">
                            <table className="w-full text-[12px]">
                              <thead className="text-[10.5px] text-slate-500 border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                  <th className="text-left p-2">Account</th>
                                  <th className="text-left p-2">CC</th>
                                  <th className="text-right p-2">Dr.</th>
                                  <th className="text-right p-2">Cr.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {run.glEntries.map((e, i) => (
                                  <tr key={i} className="border-b border-slate-50 dark:border-slate-700/40">
                                    <td className="p-2 text-slate-700 dark:text-slate-300">{e.account}</td>
                                    <td className="p-2 text-slate-400 text-[11px]">{e.costCenter}</td>
                                    <td className="p-2 text-right font-mono">{e.debit  > 0 ? fmtINR(e.debit)  : '—'}</td>
                                    <td className="p-2 text-right font-mono">{e.credit > 0 ? fmtINR(e.credit) : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="p-5 text-center text-[12px] text-slate-400">Open full detail to load GL entries</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 text-center">
                        <p className="text-[12px] text-amber-700 dark:text-amber-400">Journal not yet generated — approve and post to create JV</p>
                      </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                      <SectionTitle icon={ArrowUpRight} title="Cross-Module Links" color="blue" />
                      <div className="space-y-2">
                        {[
                          { l: 'General Ledger',       ref: 'GL-DEPR-APR-26',    ok: run.glStatus === 'POSTED' },
                          { l: 'Financial Statements', ref: 'FS-APR-26-BS-PL',   ok: run.glStatus === 'POSTED' },
                          { l: 'Asset Register',       ref: 'FACT-AR-SCOPE',     ok: true },
                          { l: 'Budget Module',        ref: 'BUDGET-FY26-DEP',   ok: run.glStatus === 'POSTED' },
                          { l: 'Treasury Forecast',    ref: 'TREAS-12M-PROJ',    ok: true },
                        ].map((lk) => (
                          <button key={lk.l} disabled={!lk.ok}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-[12px] transition-colors ${
                              lk.ok
                                ? 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                                : 'border-slate-100 dark:border-slate-700/50 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            <span>{lk.l}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 font-mono">{lk.ref}</span>
                              <ExternalLink size={10} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── COMPLIANCE ── */}
                {tab === 'compliance' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <SectionTitle icon={Shield} title="Regulatory Compliance Assessment" />
                      <div className="space-y-3">
                        {[
                          { std: 'Companies Act 2013 — Schedule II (Useful Life)',       ok: run.complianceStatus === 'COMPLIANT',        note: 'Asset-wise useful life verified against Sch. II' },
                          { std: 'IFRS / Ind AS 16 (Property, Plant & Equipment)',       ok: run.book === 'IFRS' && run.complianceStatus === 'COMPLIANT', note: run.book === 'IFRS' ? 'IFRS book active — IAS 16 applied' : 'Not applicable for this book' },
                          { std: 'IAS 36 Impairment of Assets',                          ok: run.impairmentImpact === 0,                  note: run.impairmentImpact > 0 ? `⚠ ${fmtINR(run.impairmentImpact)} impairment detected` : 'No impairment indicators found' },
                          { std: 'Income Tax Act 1961 — Block of Assets & WDV',          ok: run.book === 'IT_ACT' || run.complianceStatus === 'COMPLIANT', note: run.book === 'IT_ACT' ? 'IT Act block calculation applied' : 'Cross-referenced with IT Act book' },
                          { std: 'IFRS 16 / Ind AS 116 — Lease Asset Depreciation',     ok: true,                                        note: 'No lease assets in scope for this run' },
                          { std: 'Cost Center & Branch Allocation (AS 17)',              ok: run.glEntries.length > 0 || run.glStatus === 'NOT_POSTED', note: run.glEntries.length > 0 ? 'Cost center allocation complete' : 'Will be allocated on posting' },
                        ].map((c, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/50">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${c.ok ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                              {c.ok ? <CheckCircle2 size={12} className="text-emerald-600" /> : <AlertTriangle size={12} className="text-amber-600" />}
                            </div>
                            <div>
                              <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">{c.std}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{c.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <SectionTitle icon={BookOpen} title="Multi-Book Rate Comparison" color="blue" />
                      <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                          <thead className="text-[10.5px] text-slate-500 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                              <th className="text-left p-2">Book</th>
                              <th className="text-right p-2">Dep. Charge</th>
                              <th className="text-right p-2">vs IFRS</th>
                              <th className="text-right p-2">Tax Impact</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { bk: 'IFRS',       dep: run.currentDep,              base: true,  taxImpact: 0 },
                              { bk: 'Statutory',  dep: Math.round(run.currentDep * 1.188), base: false, taxImpact: Math.round(run.currentDep * 0.188 * 0.33) },
                              { bk: 'IT Act',     dep: Math.round(run.currentDep * 1.679), base: false, taxImpact: Math.round(run.currentDep * 0.679 * 0.33) },
                              { bk: 'Management', dep: Math.round(run.currentDep * 0.957), base: false, taxImpact: 0 },
                            ].map((b) => (
                              <tr key={b.bk} className={`border-b border-slate-50 dark:border-slate-700/40 ${b.base ? 'font-semibold' : ''}`}>
                                <td className="p-2 text-slate-700 dark:text-slate-300">{b.bk}</td>
                                <td className="p-2 text-right text-violet-700 dark:text-violet-400 font-mono">{fmtINR(b.dep)}</td>
                                <td className="p-2 text-right">
                                  {b.base ? <span className="text-slate-400 text-[11px]">Base</span> : (
                                    <span className={b.dep > run.currentDep ? 'text-red-500' : 'text-emerald-500'}>
                                      {b.dep > run.currentDep ? '+' : ''}{fmtINR(b.dep - run.currentDep)}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-right text-slate-500 text-[11px]">{b.taxImpact > 0 ? fmtINR(b.taxImpact) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10.5px] text-slate-400 mt-2">Deferred tax rate: 33%. Temporary differences create deferred tax liability on higher IT Act depreciation.</p>
                    </div>
                  </div>
                )}

                {/* ── TREASURY ── */}
                {tab === 'treasury' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl border border-teal-200 dark:border-teal-800 p-4">
                      <SectionTitle icon={Landmark} title="Treasury Impact Analysis" color="teal" />
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { l: 'Annual Run Rate',       v: fmtINR(run.currentDep * 12) },
                          { l: 'Budget Variance',       v: '+₹2.4L', note: 'Over annual budget' },
                          { l: '12-Month AI Forecast',  v: fmtINR(run.currentDep * 12 * 1.08), note: '8% growth estimate' },
                          { l: 'Capex Reserve Target',  v: fmtINR(run.netBookValue * 0.15),   note: '15% NRV rule' },
                        ].map((it) => (
                          <div key={it.l} className="bg-white dark:bg-slate-800 rounded-xl p-3">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">{it.l}</p>
                            <p className="text-[15px] font-bold text-teal-700 dark:text-teal-400">{it.v}</p>
                            {it.note && <p className="text-[10px] text-slate-400 mt-0.5">{it.note}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4">
                      <SectionTitle icon={Landmark} title="Asset Replacement Planning" color="purple" />
                      <div>
                        <InfoRow label="Assets Near End of Life" value="14 assets" />
                        <InfoRow label="Est. Replacement Cost"   value={fmtINR(run.netBookValue * 0.22)} />
                        <InfoRow label="Recommended Budget Year" value="FY 2027–28" />
                        <InfoRow label="Provisioning Risk"       value="Medium" />
                        <InfoRow label="Capex Reserve Gap"       value={fmtINR(run.netBookValue * 0.08)} />
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                      <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                        <Sparkles size={12} className="fill-current" /> AI Treasury Recommendation
                      </p>
                      <p className="text-[12.5px] text-blue-800 dark:text-blue-300 leading-relaxed">
                        At ₹{(run.currentDep * 12 / 10000000).toFixed(2)}Cr annual depreciation for this scope, AI recommends provisioning ₹{(run.currentDep * 12 * 0.28 / 100000).toFixed(2)}L in annual capex reserve to sustain asset condition index above 85%.
                        Replacement of {Math.floor(run.assetCount * 0.06)} assets expected in the next 24 months.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── WORKFLOW ── */}
                {tab === 'workflow' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <SectionTitle icon={GitBranch} title="Approval & Workflow History" />
                      <div className="space-y-3">
                        {[
                          { l: 'Run Initiated',         u: run.createdBy,              ts: run.createdAt,   done: true },
                          { l: 'Assets Validated',      u: 'System — Asset Register',  ts: run.createdAt,   done: true },
                          { l: 'Depreciation Calculated',u: 'System — Dep. Engine',    ts: run.createdAt,   done: true },
                          { l: 'Preview Generated',     u: run.createdBy,              ts: run.createdAt,   done: run.workflowStatus !== 'DRAFT' },
                          { l: 'AI Anomaly Scan',       u: 'AI Engine v2',             ts: run.createdAt,   done: true },
                          { l: 'Finance Head Approval', u: run.approvedBy || 'Pending',ts: run.approvedAt,  done: !!run.approvedBy },
                          { l: 'GL Posting',            u: 'System',                   ts: run.approvedAt,  done: run.glStatus === 'POSTED' },
                          { l: 'Financial Stmt. Sync',  u: 'System',                   ts: null,            done: run.glStatus === 'POSTED' },
                          { l: 'Reconciliation',        u: 'Finance Team',             ts: null,            done: run.workflowStatus === 'RECONCILED' },
                        ].map((s, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${s.done ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {s.done ? <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Clock size={13} className="text-slate-400" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className={`text-[12.5px] font-medium ${s.done ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{s.l}</p>
                                {s.ts && <span className="text-[10.5px] text-slate-400 tabular-nums">{fmtDateTime(s.ts)}</span>}
                              </div>
                              <p className="text-[11px] text-slate-400">{s.u}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {run.workflowStatus === 'PENDING' && (
                      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
                        <p className="text-[12px] font-semibold text-violet-700 dark:text-violet-400 mb-2">⏳ SLA Alert</p>
                        <p className="text-[12px] text-violet-700 dark:text-violet-400">This run has been pending approval for &gt;48 hours. Escalation to CFO recommended.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── AUDIT TRAIL ── */}
                {tab === 'audit' && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <SectionTitle icon={Clock} title="Immutable Audit Trail" />
                      <button className="flex items-center gap-1 text-[11.5px] text-violet-600 dark:text-violet-400 hover:underline">
                        Export <Download size={11} />
                      </button>
                    </div>
                    {run.auditTrail.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {run.auditTrail.map((e, i) => (
                          <div key={i} className="flex items-start gap-3 px-4 py-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              e.type === 'POST' || e.type === 'APPROVE' ? 'bg-emerald-500' :
                              e.type === 'REVERSE' ? 'bg-rose-500' :
                              e.type === 'AI_ALERT' ? 'bg-purple-500' :
                              e.type === 'COMPLIANCE' ? 'bg-orange-500' : 'bg-violet-500'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[12.5px] text-slate-700 dark:text-slate-300">{e.action}</p>
                                <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">{fmtDateTime(e.ts)}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{e.user}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Clock size={28} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-[12px] text-slate-400">No audit events for this run</p>
                      </div>
                    )}
                    <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span className="text-[11px] text-slate-400">All events cryptographically signed · Tamper-proof · Regulatory compliant</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex-shrink-0">
            {run.workflowStatus === 'PENDING' && (
              <button className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-bold rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white transition-all shadow-lg shadow-violet-500/25">
                <Play size={14} /> Approve & Post
              </button>
            )}
            {run.glStatus === 'POSTED' && run.workflowStatus !== 'REVERSED' && (
              <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                <RotateCcw size={13} /> Reverse
              </button>
            )}
            <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-violet-300 transition-colors">
              <RefreshCw size={13} /> Recalculate
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-violet-300 transition-colors">
              <Download size={13} /> Export
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-xl border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
              <Sparkles size={13} /> AI Analyse
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
