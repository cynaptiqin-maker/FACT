import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, BarChart, Bar, Legend,
} from 'recharts';
import { TrendingUp, Sparkles, Target, Calendar, AlertTriangle } from 'lucide-react';
import { FORECAST_DATA, BRANCH_HEATMAP, DEPT_AGING_DATA } from './AgingConstants';

const FORECAST_VIEWS = [
  { id: 'weekly',   label: '12-Week Projection' },
  { id: 'branch',   label: 'Branch Forecast'    },
  { id: 'dept',     label: 'Dept Forecast'       },
];

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs min-w-[160px]">
      <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</div>
      {payload.map((p, i) => p.value != null && (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-none" style={{ background: p.color }} />
            <span className="text-slate-500 dark:text-slate-400 capitalize">{p.name}</span>
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">₹{p.value?.toLocaleString()}K</span>
        </div>
      ))}
    </div>
  );
}

// ── Weekly Forecast ───────────────────────────────────────────────────────────
function WeeklyForecast() {
  const currentWeek = 2;
  const totalExpected = FORECAST_DATA.reduce((s, d) => s + d.expected, 0);
  const actualToDate = FORECAST_DATA.filter(d => d.actual != null).reduce((s, d) => s + (d.actual ?? 0), 0);
  const expectedToDate = FORECAST_DATA.filter(d => d.actual != null).reduce((s, d) => s + d.expected, 0);
  const variance = actualToDate - expectedToDate;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '12-Week Expected',  val: `₹${(totalExpected / 100).toFixed(1)}Cr`, color: 'text-blue-600 dark:text-blue-400',    icon: Target    },
          { label: 'Collected to Date', val: `₹${(actualToDate / 100).toFixed(1)}Cr`,  color: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUp },
          { label: 'Variance',          val: `${variance >= 0 ? '+' : ''}₹${variance}K`,color: variance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400', icon: AlertTriangle },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={12} className={color} />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <div className={`text-base font-bold font-mono ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">12-Week Collections Forecast</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Predicted vs actual — ₹ thousands · Shaded area = 80% confidence interval</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 rounded-full px-2.5 py-1 font-semibold">
            <Sparkles size={10} />AI Forecast · 74% confidence
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={FORECAST_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="fcExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fcAct" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fcBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={w => w.split(' ')[0]} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ForecastTooltip />} />
            <ReferenceLine x={`W${currentWeek} (May 26)`} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Today', position: 'top', fontSize: 9, fill: '#94a3b8' }} />
            <Area type="monotone" dataKey="upper"   name="Upper bound" stroke="none" fill="url(#fcBand)" />
            <Area type="monotone" dataKey="lower"   name="Lower bound" stroke="none" fill="#fff" />
            <Area type="monotone" dataKey="expected" name="Expected"   stroke="#3b82f6" fill="url(#fcExp)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            <Area type="monotone" dataKey="actual"   name="Actual"     stroke="#10b981" fill="url(#fcAct)" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly breakdown table */}
      <div>
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Weekly Breakdown</div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                {['Week','Expected (₹K)','Actual (₹K)','Variance','Status'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FORECAST_DATA.slice(0, 8).map((row, i) => {
                const var_ = row.actual != null ? row.actual - row.expected : null;
                return (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300 text-[11px]">{row.week}</td>
                    <td className="px-3 py-2 font-mono text-blue-600 dark:text-blue-400 text-[11px]">{row.expected.toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-[11px]">
                      {row.actual != null
                        ? <span className="text-emerald-600 dark:text-emerald-400">{row.actual.toLocaleString()}</span>
                        : <span className="text-slate-400 italic">Projected</span>}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px]">
                      {var_ != null ? (
                        <span className={var_ >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>
                          {var_ >= 0 ? '+' : ''}{var_}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {row.actual != null ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">Completed</span>
                      ) : i === currentWeek ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">In Progress</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Forecast</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Branch Forecast ───────────────────────────────────────────────────────────
function BranchForecast() {
  const data = BRANCH_HEATMAP.map(b => ({
    branch: b.branch.length > 16 ? b.branch.slice(0, 16) + '…' : b.branch,
    expected: Math.round((b.d31 * 0.72 + b.d61 * 0.48 + b.d91 * 0.28 + b.d121 * 0.15 + b.current * 0.92) / 10),
    risk: Math.round((b.d91 + b.d121) / 10),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Branch Collections Forecast</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">AI-projected collections and risk by branch — next 30 days (₹ thousands)</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
          <XAxis dataKey="branch" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ForecastTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="expected" name="Expected Collections" fill="#3b82f6" radius={[4,4,0,0]} opacity={0.85} />
          <Bar dataKey="risk"     name="At-Risk Amount"       fill="#ef4444" radius={[4,4,0,0]} opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Department Forecast ───────────────────────────────────────────────────────
function DeptForecast() {
  const data = DEPT_AGING_DATA.slice(0, 8).map(d => ({
    dept: d.dept.length > 12 ? d.dept.slice(0, 12) + '…' : d.dept,
    expected: Math.round((d.d31 * 0.70 + d.d61 * 0.45 + d.d91 * 0.25 + d.current * 0.90) / 10),
    avgDays: d.avgDays,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Department Collections Forecast</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Expected collections by department — next 30 days (₹ thousands)</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barSize={16} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
          <Tooltip formatter={(v) => [`₹${v}K`, 'Expected']} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
          <Bar dataKey="expected" name="Expected" radius={[0,4,4,0]} fill="#06b6d4" opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export default function AgingForecastPanel() {
  const [view, setView] = useState('weekly');

  return (
    <div className="space-y-4">
      {/* View selector */}
      <div className="flex items-center gap-2">
        {FORECAST_VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors
              ${view === v.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            {v.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 text-[10px] text-cyan-500 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-full px-2 py-0.5">
          <Sparkles size={9} />AI-powered
        </div>
      </div>

      {view === 'weekly' && <WeeklyForecast />}
      {view === 'branch' && <BranchForecast />}
      {view === 'dept'   && <DeptForecast />}
    </div>
  );
}
