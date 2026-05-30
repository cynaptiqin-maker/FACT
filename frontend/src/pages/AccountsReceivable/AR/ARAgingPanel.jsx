import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, AlertTriangle, Building2 } from 'lucide-react';
import { AGING_CHART_DATA, AGING_BUCKET_TOTALS, BRANCH_AGING_HEATMAP } from './ARConstants';

const BUCKET_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

const MAX_HEAT = 5000;
function heatColor(val) {
  const pct = Math.min(val / MAX_HEAT, 1);
  if (pct < 0.25) return `rgba(16,185,129,${0.15 + pct * 1.2})`;
  if (pct < 0.5)  return `rgba(245,158,11,${0.2 + pct})`;
  if (pct < 0.75) return `rgba(249,115,22,${0.3 + pct * 0.8})`;
  return               `rgba(239,68,68,${0.4 + pct * 0.6})`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">₹{p.value.toLocaleString('en-IN')}K</span>
        </div>
      ))}
    </div>
  );
}

function BucketCard({ bucket, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.06 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex-1"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{bucket.label}</span>
        <span className="text-xs text-slate-400">{bucket.count} invoices</span>
      </div>
      <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-50 mb-1">
        ₹{(bucket.amount / 100000).toFixed(1)}L
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${bucket.pct}%` }}
          transition={{ delay: 0.4 + idx * 0.08, duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: bucket.color }}
        />
      </div>
      <div className="text-[11px] font-semibold" style={{ color: bucket.color }}>{bucket.pct}% of total</div>
    </motion.div>
  );
}

export default function ARAgingPanel() {
  const [view, setView] = useState('trend');

  return (
    <div className="space-y-4">
      {/* Bucket summary cards */}
      <div className="flex gap-3">
        {AGING_BUCKET_TOTALS.map((b, i) => (
          <BucketCard key={b.label} bucket={b} idx={i} />
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        {[
          { id: 'trend',  label: 'Aging Trend',    icon: TrendingUp   },
          { id: 'branch', label: 'Branch Heatmap',  icon: Building2    },
          { id: 'risk',   label: 'Risk Breakdown',  icon: AlertTriangle},
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${view === v.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <v.icon size={12} />{v.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
      >
        {view === 'trend' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">7-Month Aging Trend</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Outstanding by aging bucket (₹ thousands)</p>
              </div>
              <div className="flex items-center gap-3">
                {['0–30d','31–60d','61–90d','90+d'].map((l, i) => (
                  <div key={l} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: BUCKET_COLORS[i] }} />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={AGING_CHART_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                <defs>
                  {BUCKET_COLORS.map((c, i) => (
                    <linearGradient key={i} id={`ag${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="current" name="0–30d"  stroke={BUCKET_COLORS[0]} fill={`url(#ag0)`} strokeWidth={2} />
                <Area type="monotone" dataKey="d31"     name="31–60d" stroke={BUCKET_COLORS[1]} fill={`url(#ag1)`} strokeWidth={2} />
                <Area type="monotone" dataKey="d61"     name="61–90d" stroke={BUCKET_COLORS[2]} fill={`url(#ag2)`} strokeWidth={2} />
                <Area type="monotone" dataKey="d91"     name="90+d"   stroke={BUCKET_COLORS[3]} fill={`url(#ag3)`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}

        {view === 'branch' && (
          <>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Branch-wise Aging Heatmap</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Outstanding by branch and aging bucket (₹ thousands)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-slate-500 dark:text-slate-400 pb-3 pr-4">Branch</th>
                    {['0–30d','31–60d','61–90d','90+d','Total'].map(h => (
                      <th key={h} className="text-right font-medium text-slate-500 dark:text-slate-400 pb-3 px-2 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BRANCH_AGING_HEATMAP.map((row, i) => {
                    const total = row.d0 + row.d31 + row.d61 + row.d91;
                    return (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.branch}</td>
                        {[row.d0, row.d31, row.d61, row.d91].map((v, ci) => (
                          <td key={ci} className="py-2 px-2 text-right">
                            <span className="inline-block px-2 py-0.5 rounded font-mono font-semibold text-slate-800 dark:text-slate-200 min-w-[60px] text-center"
                                  style={{ background: heatColor(v) }}>
                              {v.toLocaleString()}
                            </span>
                          </td>
                        ))}
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-800 dark:text-slate-100">{total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-2 justify-end">
              <span className="text-[10px] text-slate-400">Low</span>
              {[0.1, 0.3, 0.55, 0.75, 0.95].map(p => (
                <div key={p} className="w-6 h-3 rounded-sm" style={{ background: heatColor(p * MAX_HEAT) }} />
              ))}
              <span className="text-[10px] text-slate-400">High</span>
            </div>
          </>
        )}

        {view === 'risk' && (
          <>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Receivables by Risk Level</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Distribution of outstanding by AI risk classification</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Low Risk',      amount: 18420000, count: 89,  color: '#10b981', pct: 34.8 },
                { label: 'Medium Risk',   amount: 14100000, count: 62,  color: '#f59e0b', pct: 26.7 },
                { label: 'High Risk',     amount: 11800000, count: 41,  color: '#f97316', pct: 22.3 },
                { label: 'Critical Risk', amount:  8520000, count: 23,  color: '#ef4444', pct: 16.2 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-none"
                       style={{ background: item.color }}>
                    {item.pct}%
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</div>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">₹{(item.amount/100000).toFixed(1)}L</div>
                    <div className="text-[11px] text-slate-400">{item.count} invoices</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
