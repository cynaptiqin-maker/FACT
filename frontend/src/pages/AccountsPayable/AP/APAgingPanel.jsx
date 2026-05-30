import { motion } from 'framer-motion';
import {
  BarChart2, TrendingDown, Building2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell,
} from 'recharts';
import { AGING_CHART_DATA, AGING_BUCKET_TOTALS, BRANCH_SPEND_HEATMAP, DEPT_SPEND_DATA, fmtINR } from './APConstants';

const AGING_COLORS = ['#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <div className="text-slate-300 font-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-mono">₹{p.value?.toLocaleString()}K</span>
        </div>
      ))}
    </div>
  );
}

// Heatmap cell: deeper orange = higher overdue
function HeatCell({ val, max }) {
  const pct = max > 0 ? val / max : 0;
  const opacity = 0.15 + pct * 0.75;
  return (
    <td className="px-2 py-1.5 text-center">
      <span
        className="inline-block w-full rounded text-[11px] font-mono font-semibold py-0.5"
        style={{ background: `rgba(249, 115, 22, ${opacity})`, color: pct > 0.5 ? '#fff' : '#c2410c' }}
      >
        {(val / 1000).toFixed(0)}K
      </span>
    </td>
  );
}

export default function APAgingPanel() {
  const maxCell = Math.max(...BRANCH_SPEND_HEATMAP.flatMap(r => [r.d0, r.d31, r.d61, r.d91]));

  return (
    <div className="grid grid-cols-3 gap-6">

      {/* ── Aging Trend Chart ────────────────────────── */}
      <div className="col-span-1 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-amber-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payable Aging Trend</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={AGING_CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="current" name="0–30d" stackId="a" stroke="#3b82f6" fill="#3b82f620" strokeWidth={1.5} />
            <Area type="monotone" dataKey="d31"     name="31–60d" stackId="a" stroke="#f59e0b" fill="#f59e0b25" strokeWidth={1.5} />
            <Area type="monotone" dataKey="d61"     name="61–90d" stackId="a" stroke="#f97316" fill="#f9731620" strokeWidth={1.5} />
            <Area type="monotone" dataKey="d91"     name="90+d"   stackId="a" stroke="#ef4444" fill="#ef444420" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Bucket totals */}
        <div className="space-y-1.5">
          {AGING_BUCKET_TOTALS.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-24 text-[11px] text-slate-500 dark:text-slate-400 flex-none">{b.label}</div>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.pct}%` }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ background: b.color }}
                />
              </div>
              <span className="w-10 text-[11px] font-mono text-slate-600 dark:text-slate-400 text-right">{b.pct}%</span>
              <span className="w-16 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 text-right">
                {fmtINR(b.amount, 'crore')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Branch Spend Heatmap ─────────────────────── */}
      <div className="col-span-1 space-y-3">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-orange-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Branch Aging Heatmap (₹K)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 pr-3">Branch</th>
                {['0–30d','31–60d','61–90d','90+d'].map(h => (
                  <th key={h} className="text-center py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BRANCH_SPEND_HEATMAP.map((row, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 pr-3 text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.branch}</td>
                  <HeatCell val={row.d0}  max={maxCell} />
                  <HeatCell val={row.d31} max={maxCell} />
                  <HeatCell val={row.d61} max={maxCell} />
                  <HeatCell val={row.d91} max={maxCell} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Low</span>
          <div className="flex-1 h-2 rounded-full" style={{ background: 'linear-gradient(to right, rgba(249,115,22,0.15), rgba(249,115,22,0.9))' }} />
          <span className="text-[10px] text-slate-500 dark:text-slate-400">High</span>
        </div>
      </div>

      {/* ── Department Spend ──────────────────────────── */}
      <div className="col-span-1 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingDown size={14} className="text-rose-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department Spend (Outstanding)</span>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={DEPT_SPEND_DATA} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 60 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
            <YAxis dataKey="dept" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }}
              formatter={v => [`₹${(v/100000).toFixed(2)}L`, '']}
            />
            <Bar dataKey="spend" radius={[0, 4, 4, 0]}>
              {DEPT_SPEND_DATA.map((_, i) => (
                <Cell key={i} fill={AGING_COLORS[Math.min(i, AGING_COLORS.length - 1)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="space-y-1.5 mt-1">
          {DEPT_SPEND_DATA.slice(0, 4).map((d, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-400">{d.dept}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-700 dark:text-slate-300">₹{(d.spend/100000).toFixed(2)}L</span>
                <span className="text-slate-400">{d.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
