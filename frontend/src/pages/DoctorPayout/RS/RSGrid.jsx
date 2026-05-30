// ─── Revenue Sharing — Allocation Rules Grid ──────────────────────────────────
import { useState, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, MoreHorizontal, FileText, BookOpen, CreditCard,
  Banknote, Search, Sparkles, ShieldAlert, CheckCircle2, Clock, GitMerge,
} from 'lucide-react';
import { MOCK_RULES, RULE_STATUSES, RISK_LEVELS, fmtINR, fmtDt } from './RSConstants';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ statusKey }) {
  const cfg = RULE_STATUSES[statusKey] ?? RULE_STATUSES.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
function RiskBadge({ levelKey }) {
  const cfg = RISK_LEVELS[levelKey] ?? RISK_LEVELS.LOW;
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

// ─── Realization Bar ──────────────────────────────────────────────────────────
function RealizationBar({ realized, total }) {
  const pct = total > 0 ? Math.round((realized / total) * 100) : 0;
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="flex items-center gap-1.5 min-w-[72px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] tabular-nums text-slate-400 w-7 text-right">{pct}%</span>
    </div>
  );
}

// ─── Expanded Detail ──────────────────────────────────────────────────────────
function ExpandedDetail({ rule }) {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview',  label: 'Overview'   },
    { id: 'revenue',   label: 'Revenue'    },
    { id: 'financial', label: 'Financials' },
    { id: 'ai',        label: '✦ AI'       },
  ];
  const rate = rule.totalBilled > 0 ? Math.round((rule.realized / rule.totalBilled) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="overflow-hidden border-t border-amber-100 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-900/5"
    >
      <div className="px-4 py-3">
        {/* Tab nav */}
        <div className="flex gap-0.5 mb-3 border-b border-slate-200 dark:border-slate-700">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold -mb-px border-b-2 transition-all ${tab === t.id ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Rule config */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Rule Config</p>
              {[
                ['Procedure',         rule.procedureType],
                ['Revenue Model',     rule.revenueModel],
                ['Share %',           `${rule.sharePercent}%`],
                ['Incentive',         rule.incentiveStructure],
                ['Realization Basis', rule.realizationBasis],
                ['Deduction Logic',   rule.deductionLogic],
                ['Insurance Linked',  rule.insuranceLinked ? 'Yes' : 'No'],
                ['Package Linked',    rule.packageLinked ? 'Yes' : 'No'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400">{k}</span>
                  <span className="text-[10px] font-medium text-slate-800 dark:text-slate-200">{v}</span>
                </div>
              ))}
            </div>

            {/* Revenue summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Revenue Summary</p>
              {[
                ['Total Billed',    fmtINR(rule.totalBilled),   ''],
                ['Realized',        fmtINR(rule.realized),       'text-emerald-600 dark:text-emerald-400'],
                ['Unrealized',      fmtINR(rule.unrealized),     rule.unrealized > 0 ? 'text-rose-600 dark:text-rose-400' : ''],
                ['Realization Rate',`${rate}%`,                  rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-rose-600'],
                ['Pending Payout',  fmtINR(rule.pendingPayout),  rule.pendingPayout > 0 ? 'text-violet-600 dark:text-violet-400' : ''],
              ].map(([k, v, cls]) => (
                <div key={k} className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400">{k}</span>
                  <span className={`text-[10px] font-bold tabular-nums ${cls || 'text-slate-800 dark:text-slate-200'}`}>{v}</span>
                </div>
              ))}
              <div className="mt-2">
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${rate}%`, background: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#f43f5e' }} />
                </div>
              </div>
              {rule.aiFlag && (
                <div className="mt-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mb-0.5">✦ AI Flag</p>
                  <p className="text-[10px] text-orange-600 dark:text-orange-400">{rule.aiFlagReason}</p>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Actions</p>
              <div className="space-y-1">
                {[
                  { label: 'View Patient Invoice', icon: FileText,    color: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' },
                  { label: 'Open AP Entry',        icon: BookOpen,    color: 'text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20' },
                  { label: 'View GL Posting',      icon: BookOpen,    color: 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' },
                  { label: 'Generate Payout',      icon: Banknote,    color: 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
                  { label: 'Bank Reconciliation',  icon: GitMerge,    color: 'text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20' },
                  { label: 'AI Explain Rule',      icon: Sparkles,    color: 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' },
                ].map(a => (
                  <button key={a.label} className={`w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-medium rounded-lg border border-slate-100 dark:border-slate-700 transition-colors ${a.color}`}>
                    <a.icon size={11} className="shrink-0" />
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[9px] text-slate-400 mb-1">Linked Records</p>
                {rule.linkedInvoices.map(inv => (
                  <p key={inv} className="text-[10px] text-blue-500 cursor-pointer hover:underline">{inv}</p>
                ))}
                {rule.linkedPatients.map(p => (
                  <p key={p} className="text-[10px] text-slate-400">{p}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'ai' && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-amber-800 dark:text-amber-200">AI Compensation Analysis</span>
              <span className="ml-auto text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">Confidence: 91%</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'Realization', body: `Rate of ${rate}% ${rate >= 78 ? 'within acceptable range' : 'below 78% benchmark'}. ${rule.unrealized > 0 ? `${fmtINR(rule.unrealized)} unrealized requires monitoring.` : 'Full realization achieved.'}` },
                { title: 'Risk Assessment', body: rule.aiFlag ? rule.aiFlagReason : `No anomalies. Pattern within ±2σ of historical baseline for ${rule.specialty}.` },
                { title: 'Incentive Optimization', body: `${rule.sharePercent > 35 ? 'Above' : 'Within'} industry median for ${rule.specialty}. ${rule.sharePercent > 35 ? 'Consider reviewing performance thresholds.' : 'Consider volume-based tier addition.'}` },
                { title: 'Treasury Recommendation', body: `Estimated liability: ${fmtINR(rule.pendingPayout)}. ${rule.workflowStatus === 'PENDING_PAYOUT' ? 'Ready for disbursement. Recommend same-week NEFT transfer.' : 'Await approval before treasury positioning.'}` },
              ].map(c => (
                <div key={c.title} className="bg-white/60 dark:bg-slate-900/40 rounded-lg p-2.5 border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 mb-1">{c.title}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Grid ────────────────────────────────────────────────────────────────
export default function RSGrid({ filters, onSelect }) {
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [sortField, setSortField] = useState('lastUpdated');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const rules = useMemo(() => {
    let data = [...MOCK_RULES];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(r => r.doctor.toLowerCase().includes(q) || r.department.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.procedureType.toLowerCase().includes(q));
    }
    if (filters.department)   data = data.filter(r => r.department === filters.department);
    if (filters.status)       data = data.filter(r => r.workflowStatus === filters.status);
    if (filters.riskLevel)    data = data.filter(r => r.riskLevel === filters.riskLevel);
    if (filters.revenueModel) data = data.filter(r => r.revenueModel === filters.revenueModel);
    if (filters.aiAnomaly)    data = data.filter(r => r.aiFlag);
    data.sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'totalBilled')   return (a.totalBilled - b.totalBilled) * mult;
      if (sortField === 'realized')      return (a.realized - b.realized) * mult;
      if (sortField === 'sharePercent')  return (a.sharePercent - b.sharePercent) * mult;
      return new Date(a.lastUpdated) > new Date(b.lastUpdated) ? mult : -mult;
    });
    return data;
  }, [filters, sortField, sortDir]);

  const paged = rules.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(rules.length / PAGE_SIZE);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={10} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={10} className="text-amber-500" /> : <ChevronDown size={10} className="text-amber-500" />;
  };

  const ColHead = ({ label, field, className = '' }) => (
    <th onClick={() => field && toggleSort(field)}
      className={`px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-slate-400 dark:text-slate-500 ${field ? 'cursor-pointer hover:text-amber-600 dark:hover:text-amber-400' : ''} ${className}`}>
      <span className="flex items-center gap-1">{label}{field && <SortIcon field={field} />}</span>
    </th>
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Allocation Rules</h3>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">{rules.length}</span>
          {selected.size > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">{selected.size} selected</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button className="hover:text-amber-600 transition-colors">Columns</button>
          <button className="hover:text-amber-600 transition-colors">Export</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-3 py-2.5 w-8">
                <input type="checkbox" className="accent-amber-500 w-3.5 h-3.5"
                  checked={selected.size === paged.length && paged.length > 0}
                  onChange={e => setSelected(e.target.checked ? new Set(paged.map(r => r.id)) : new Set())} />
              </th>
              <ColHead label="Rule ID" />
              <ColHead label="Doctor / Dept" />
              <ColHead label="Procedure" />
              <ColHead label="Share %" field="sharePercent" />
              <ColHead label="Incentive" />
              <ColHead label="Billed" field="totalBilled" />
              <ColHead label="Realized" field="realized" />
              <ColHead label="Realization" />
              <ColHead label="Payout" />
              <ColHead label="Ins." />
              <ColHead label="Status" />
              <ColHead label="Risk" />
              <ColHead label="GL" />
              <ColHead label="Updated" field="lastUpdated" />
              <ColHead label="" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {paged.map(rule => (
              <Fragment key={rule.id}>
                <tr className={`group transition-colors ${selected.has(rule.id) ? 'bg-amber-50/60 dark:bg-amber-900/10' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'} ${expanded === rule.id ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" className="accent-amber-500 w-3.5 h-3.5"
                      checked={selected.has(rule.id)}
                      onChange={() => setSelected(s => { const n = new Set(s); n.has(rule.id) ? n.delete(rule.id) : n.add(rule.id); return n; })} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">{rule.id}</span>
                      {rule.aiFlag && <Sparkles size={10} className="text-amber-500 shrink-0" />}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => onSelect(rule)} className="text-left hover:text-amber-600 transition-colors">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{rule.doctor}</p>
                      <p className="text-[10px] text-slate-400">{rule.department}</p>
                    </button>
                  </td>
                  <td className="px-3 py-2.5"><span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[130px] block truncate">{rule.procedureType}</span></td>
                  <td className="px-3 py-2.5"><span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">{rule.sharePercent}%</span></td>
                  <td className="px-3 py-2.5"><span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded whitespace-nowrap">{rule.incentiveStructure}</span></td>
                  <td className="px-3 py-2.5"><span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">{fmtINR(rule.totalBilled)}</span></td>
                  <td className="px-3 py-2.5"><span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{fmtINR(rule.realized)}</span></td>
                  <td className="px-3 py-2.5"><RealizationBar realized={rule.realized} total={rule.totalBilled} /></td>
                  <td className="px-3 py-2.5"><span className={`text-xs font-semibold tabular-nums whitespace-nowrap ${rule.pendingPayout > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-slate-300'}`}>{rule.pendingPayout > 0 ? fmtINR(rule.pendingPayout) : '—'}</span></td>
                  <td className="px-3 py-2.5 text-center">
                    {rule.insuranceLinked ? <CheckCircle2 size={12} className="text-blue-500 mx-auto" /> : <span className="text-slate-200 dark:text-slate-700 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge statusKey={rule.workflowStatus} /></td>
                  <td className="px-3 py-2.5"><RiskBadge levelKey={rule.riskLevel} /></td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[10px] font-bold ${rule.glPosted ? 'text-violet-500' : 'text-slate-200 dark:text-slate-700'}`}>{rule.glPosted ? '✓' : '—'}</span>
                  </td>
                  <td className="px-3 py-2.5"><span className="text-[10px] text-slate-400 whitespace-nowrap">{fmtDt(rule.lastUpdated).slice(0, 9)}</span></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
                        className="p-1 rounded text-slate-400 hover:text-amber-600 transition-colors">
                        {expanded === rule.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <button onClick={() => onSelect(rule)} className="p-1 rounded text-slate-400 hover:text-amber-600 transition-colors">
                        <MoreHorizontal size={13} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded row */}
                <AnimatePresence>
                  {expanded === rule.id && (
                    <tr>
                      <td colSpan={16} className="p-0">
                        <ExpandedDetail rule={rule} />
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </Fragment>
            ))}

            {paged.length === 0 && (
              <tr>
                <td colSpan={16} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                      <Search size={20} className="text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No allocation rules match your filters</p>
                    <p className="text-xs text-slate-400">Try adjusting filters or create a new revenue rule</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-xs text-slate-400">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rules.length)} of {rules.length}</span>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 text-xs rounded border transition-colors ${page === p ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">→</button>
          </div>
        </div>
      )}
    </div>
  );
}
