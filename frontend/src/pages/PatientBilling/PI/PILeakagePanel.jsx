import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertTriangle, ChevronDown, ChevronRight, TrendingDown, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LEAKAGE_CATEGORIES, DEPT_REVENUE, fmtINR, fmtINRFull } from './PIConstants';

const SEVERITY_COLORS = {
  HIGH:   { bg:'bg-red-50 dark:bg-red-900/10',    border:'border-red-200 dark:border-red-800/40',    text:'text-red-700 dark:text-red-400',    dot:'bg-red-500',    bar:'#ef4444' },
  MEDIUM: { bg:'bg-amber-50 dark:bg-amber-900/10',border:'border-amber-200 dark:border-amber-800/40',text:'text-amber-700 dark:text-amber-400',  dot:'bg-amber-500',  bar:'#f59e0b' },
  LOW:    { bg:'bg-slate-50 dark:bg-slate-900',   border:'border-slate-200 dark:border-slate-700',   text:'text-slate-600 dark:text-slate-400',  dot:'bg-slate-400',  bar:'#94a3b8' },
};

const DEPT_COLORS = ['#e11d48','#f43f5e','#fb7185','#fda4af','#fecdd3','#ffe4e6','#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-lg text-[11px]">
      <p className="font-bold text-slate-600 dark:text-slate-300 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill || '#f43f5e' }}>{p.name}: ₹{p.value}L</p>
      ))}
    </div>
  );
};

function LeakageRow({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.LOW;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border ${cfg.border} overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(p => !p)}
        className={`w-full flex items-start gap-3 p-3 ${cfg.bg} hover:opacity-90 transition-opacity text-left`}
      >
        <div className={`w-2 h-2 rounded-full flex-none mt-1.5 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-[12px] font-bold ${cfg.text}`}>{item.category}</p>
            <div className="flex items-center gap-2 flex-none">
              <span className={`text-[11px] font-bold font-mono ${cfg.text}`}>{fmtINR(item.impact)}</span>
              <span className="text-[10px] font-semibold text-slate-400">{item.count} inv.</span>
              {expanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.dept}</p>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/60">
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed">{item.example}</p>
              <div className="flex gap-2 mt-2.5">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                  bg-rose-50 dark:bg-rose-900/15 text-rose-600 dark:text-rose-400
                  border border-rose-200 dark:border-rose-700/40 hover:bg-rose-100 transition-colors">
                  <Zap size={11} />
                  Fix Charges
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                  border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300
                  bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors">
                  <ExternalLink size={11} />
                  View Invoices
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function PILeakagePanel() {
  const [view, setView] = useState('list');
  const totalImpact = LEAKAGE_CATEGORIES.reduce((s, x) => s + x.impact, 0);
  const highCount   = LEAKAGE_CATEGORIES.filter(x => x.severity === 'HIGH').length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-none">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-rose-500" />
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Revenue Leakage</span>
          {highCount > 0 && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute h-2 w-2 rounded-full bg-rose-400 opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-rose-500" />
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {['list','chart'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors
                ${view === v ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Impact summary */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-rose-50/50 dark:bg-rose-900/8 border-b border-rose-100 dark:border-rose-900/20 flex-none">
        <div className="flex items-center gap-1.5">
          <TrendingDown size={14} className="text-rose-500" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total impact:</span>
          <span className="text-[13px] font-bold text-rose-600 dark:text-rose-400 font-mono">{fmtINR(totalImpact)}</span>
        </div>
        <div className="flex gap-3 ml-auto">
          {['HIGH','MEDIUM','LOW'].map(s => {
            const count = LEAKAGE_CATEGORIES.filter(x => x.severity === s).length;
            const cfg   = SEVERITY_COLORS[s];
            return (
              <span key={s} className="flex items-center gap-1 text-[10.5px] font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <span className={cfg.text}>{count} {s.toLowerCase()}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* ── List view ── */}
        {view === 'list' && (
          <div className="space-y-2">
            {LEAKAGE_CATEGORIES
              .sort((a, b) => {
                const order = { HIGH:0, MEDIUM:1, LOW:2 };
                return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
              })
              .map((item, i) => (
                <LeakageRow key={item.id} item={item} index={i} />
              ))
            }
          </div>
        )}

        {/* ── Chart view ── */}
        {view === 'chart' && (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Leakage by Category (₹)</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  layout="vertical"
                  data={LEAKAGE_CATEGORIES.map(c => ({ name: c.category.split(' ').slice(0, 2).join(' '), impact: c.impact, severity: c.severity }))}
                  margin={{ top: 0, right: 8, left: -8, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => fmtINR(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="impact" name="Leakage" radius={[0, 3, 3, 0]}>
                    {LEAKAGE_CATEGORIES.map((entry, i) => (
                      <Cell key={i} fill={SEVERITY_COLORS[entry.severity]?.bar ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Dept Revenue vs Outstanding (₹L)</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={DEPT_REVENUE} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="dept" tick={{ fontSize: 9.5, fill: '#94a3b8' }}
                    tickFormatter={d => d.substring(0, 4)} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue"     name="Revenue"     fill="#f43f5e" radius={[3,3,0,0]} />
                  <Bar dataKey="outstanding" name="Outstanding" fill="#fda4af" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30">
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wide">Highest Leakage Dept</p>
                <p className="text-[14px] font-bold text-rose-700 dark:text-rose-400 mt-0.5">OT / ICU</p>
                <p className="text-[11px] text-rose-600/70 mt-0.5">{fmtINR(42_000 + 78_000)} estimated</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">Avg Leakage/Invoice</p>
                <p className="text-[14px] font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                  {fmtINR(Math.round(totalImpact / LEAKAGE_CATEGORIES.reduce((s,x)=>s+x.count,0)))}
                </p>
                <p className="text-[11px] text-amber-600/70 mt-0.5">per affected invoice</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
