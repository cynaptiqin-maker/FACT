import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  BarChart2, Building2, Stethoscope, Shield, Users, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  AGING_TREND_DATA, BRANCH_HEATMAP, DEPT_AGING_DATA,
  INSURANCE_PERF, COLLECTOR_PERF, AGING_BUCKETS_CONFIG,
} from './AgingConstants';

const BUCKET_COLORS = ['#10b981','#f59e0b','#f97316','#ef4444','#7c3aed'];
const BUCKET_KEYS   = ['current','d31','d61','d91','d121'];

const MAX_HEAT = 5000;
function heatColor(val, max = MAX_HEAT) {
  const p = Math.min(val / max, 1);
  if (p < 0.2)  return `rgba(16,185,129,${0.12 + p * 1.5})`;
  if (p < 0.45) return `rgba(245,158,11,${0.2 + p * 0.9})`;
  if (p < 0.7)  return `rgba(249,115,22,${0.3 + p * 0.7})`;
  return              `rgba(239,68,68,${0.4 + p * 0.6})`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs min-w-[140px]">
      <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-none" style={{ background: p.color }} />
            <span className="text-slate-500 dark:text-slate-400">{p.name}</span>
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">₹{p.value?.toLocaleString('en-IN')}K</span>
        </div>
      ))}
    </div>
  );
}

// ── Aging Trend View ─────────────────────────────────────────────────────────
function AgingTrendView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">8-Month Aging Trend</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Outstanding receivables by aging bucket — ₹ thousands</p>
        </div>
        <div className="flex items-center gap-3">
          {['0–30d','31–60d','61–90d','91–120d','120+d'].map((l, i) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: BUCKET_COLORS[i] }} />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{l}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={AGING_TREND_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
          <defs>
            {BUCKET_COLORS.map((c, i) => (
              <linearGradient key={i} id={`agt${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={c} stopOpacity={0.28} />
                <stop offset="95%" stopColor={c} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          {BUCKET_KEYS.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k}
              name={['0–30d','31–60d','61–90d','91–120d','120+d'][i]}
              stroke={BUCKET_COLORS[i]} fill={`url(#agt${i})`} strokeWidth={2} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Branch Heatmap View ──────────────────────────────────────────────────────
function BranchHeatmapView() {
  const maxTotal = Math.max(...BRANCH_HEATMAP.map(r => r.total));
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Branch-wise Aging Heatmap</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Outstanding by branch and aging bucket (₹ thousands)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left font-semibold text-slate-500 dark:text-slate-400 pb-2.5 pr-4 whitespace-nowrap">Branch</th>
              {['Current','31–60d','61–90d','91–120d','120+d','Total','Distribution'].map(h => (
                <th key={h} className="text-right font-semibold text-slate-500 dark:text-slate-400 pb-2.5 px-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BRANCH_HEATMAP.map((row, i) => {
              const vals = [row.current, row.d31, row.d61, row.d91, row.d121];
              return (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 pr-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.branch}</td>
                  {vals.map((v, ci) => (
                    <td key={ci} className="py-1.5 px-2 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-md font-mono font-semibold text-slate-800 dark:text-slate-100 min-w-[64px] text-center text-[11px]"
                        style={{ background: heatColor(v) }}>
                        {v.toLocaleString()}
                      </span>
                    </td>
                  ))}
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-slate-50">{row.total.toLocaleString()}</td>
                  <td className="py-1.5 px-2 pl-4" style={{ minWidth: 100 }}>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(row.total / maxTotal) * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <span className="text-[10px] text-slate-400">Low</span>
        {[0.05, 0.2, 0.4, 0.6, 0.8, 0.95].map(p => (
          <div key={p} className="w-6 h-3 rounded-sm" style={{ background: heatColor(p * MAX_HEAT) }} />
        ))}
        <span className="text-[10px] text-slate-400">High</span>
      </div>
    </div>
  );
}

// ── Department Analysis View ─────────────────────────────────────────────────
function DeptAnalysisView() {
  const data = DEPT_AGING_DATA.map(d => ({
    dept: d.dept.length > 14 ? d.dept.slice(0, 14) + '…' : d.dept,
    current: d.current, d31: d.d31, d61: d.d61, d91: d.d91, d121: d.d121,
    avgDays: d.avgDays,
  }));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Department-wise Aging</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Top 10 departments by outstanding balance — ₹ thousands</p>
        </div>
        <div className="flex items-center gap-3">
          {['Current','31–60d','61–90d','91–120d','120+d'].map((l, i) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background: BUCKET_COLORS[i] }} />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{l}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barSize={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
          <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          {BUCKET_KEYS.map((k, i) => (
            <Bar key={k} dataKey={k} stackId="a"
              name={['Current','31–60d','61–90d','91–120d','120+d'][i]}
              fill={BUCKET_COLORS[i]} radius={i === 4 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Insurance Performance View ───────────────────────────────────────────────
function InsurancePerfView() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Insurance / TPA Performance</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Pending balances, settlement rates and denial analysis</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              {['TPA / Insurer','Pending (₹K)','Avg Settlement','Settlement Rate','Denial Rate','Trend'].map(h => (
                <th key={h} className="text-left font-semibold text-slate-500 dark:text-slate-400 pb-2 pr-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INSURANCE_PERF.map((row, i) => (
              <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-2 pr-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.tpa}</td>
                <td className="py-2 pr-4 font-mono font-semibold text-slate-800 dark:text-slate-200">{row.pending.toLocaleString()}</td>
                <td className="py-2 pr-4">
                  <span className={`font-semibold ${row.avgSettlementDays > 60 ? 'text-red-500 dark:text-red-400' : row.avgSettlementDays > 40 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {row.avgSettlementDays}d
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden min-w-[60px]">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.settlementRate}%` }} />
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">{row.settlementRate}%</span>
                  </div>
                </td>
                <td className="py-2 pr-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold
                    ${row.denialRate > 15 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : row.denialRate > 8  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                    {row.denialRate}%
                  </span>
                </td>
                <td className="py-2">
                  {row.trend === 'up'
                    ? <TrendingUp size={14} className="text-emerald-500" />
                    : <TrendingDown size={14} className="text-red-500" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Collector Efficiency View ────────────────────────────────────────────────
function CollectorEffView() {
  const max = Math.max(...COLLECTOR_PERF.map(c => c.totalValue));
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Collector Efficiency</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Workload, collection rate, and avg cycle days per collector</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COLLECTOR_PERF.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{c.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{c.assigned} assigned · {c.collected} collected</div>
              </div>
              <div className={`flex items-center gap-0.5 text-[11px] font-bold
                ${c.efficiency >= 75 ? 'text-emerald-600 dark:text-emerald-400' : c.efficiency >= 65 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>
                {c.efficiency}%
                {c.streak === 'up' ? <TrendingUp size={11} /> : c.streak === 'down' ? <TrendingDown size={11} /> : null}
              </div>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c.efficiency}%` }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.7, ease: 'easeOut' }}
                className={`h-full rounded-full ${c.efficiency >= 75 ? 'bg-emerald-500' : c.efficiency >= 65 ? 'bg-amber-500' : 'bg-red-500'}`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>Avg cycle: <strong className="text-slate-700 dark:text-slate-300">{c.avgDays}d</strong></span>
              <span>₹{(c.collectedValue / 100000).toFixed(1)}L collected</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Hub ───────────────────────────────────────────────────────────────────────
const VIEWS = [
  { id: 'trend',       label: 'Aging Trend',      icon: BarChart2      },
  { id: 'branch',      label: 'Branch Heatmap',   icon: Building2      },
  { id: 'dept',        label: 'Departments',       icon: Stethoscope    },
  { id: 'insurance',   label: 'Insurance / TPA',  icon: Shield         },
  { id: 'collector',   label: 'Collectors',        icon: Users          },
];

export default function AgingAnalyticsHub() {
  const [view, setView] = useState('trend');
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50/70 dark:bg-slate-800/30">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
              ${view === v.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900/60'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <v.icon size={12} />{v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {view === 'trend'     && <AgingTrendView />}
            {view === 'branch'    && <BranchHeatmapView />}
            {view === 'dept'      && <DeptAnalysisView />}
            {view === 'insurance' && <InsurancePerfView />}
            {view === 'collector' && <CollectorEffView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
