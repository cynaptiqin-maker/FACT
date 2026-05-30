import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { fmtINR, AGING_BUCKET_TOTALS, TPA_PERFORMANCE, DEPT_AGING_HEATMAP, RECOVERY_TREND } from './TARConstants';

const BUCKET_COLORS = {
  d0_30:   '#10b981',
  d31_60:  '#f59e0b',
  d61_90:  '#f97316',
  d91_180: '#ef4444',
  d180plus:'#dc2626',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-[11px]">
      <p className="font-bold text-slate-600 dark:text-slate-300 mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex justify-between gap-3">
          <span>{p.name}:</span>
          <span className="font-bold">₹{p.value?.toLocaleString('en-IN')}L</span>
        </p>
      ))}
    </div>
  );
};

const AmountTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-[11px]">
      <p className="font-bold text-slate-600 dark:text-slate-300 mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex justify-between gap-3">
          <span>{p.name}:</span>
          <span className="font-bold">₹{(p.value / 100).toFixed(0)}K</span>
        </p>
      ))}
    </div>
  );
};

function BucketCard({ bucket, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex-1 min-w-0 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
      style={{ borderTop: `3px solid ${bucket.color}` }}
    >
      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">{bucket.label}</div>
      <div className="text-[18px] font-bold font-mono text-slate-900 dark:text-slate-50 mb-0.5">{fmtINR(bucket.amount)}</div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{bucket.count} claims</div>
      {/* Mini bar */}
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${bucket.pct}%` }}
          transition={{ delay: 0.4 + index * 0.08, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: bucket.color }}
        />
      </div>
      <div className="text-[10px] text-slate-400 mt-1">{bucket.pct}% of total</div>
    </motion.div>
  );
}

export default function TARAgingDashboard() {
  const trendData = RECOVERY_TREND.map(r => ({
    ...r,
    recovered:   r.recovered / 100,
    outstanding: r.outstanding / 100,
    denied:      r.denied / 100,
  }));

  const heatmapData = DEPT_AGING_HEATMAP.map(d => ({
    dept: d.dept,
    '0-30d':  +(d.d0_30 / 100).toFixed(0),
    '31-60d': +(d.d31_60 / 100).toFixed(0),
    '61-90d': +(d.d61_90 / 100).toFixed(0),
    '91-180d':+(d.d91_180 / 100).toFixed(0),
    '>180d':  +(d.d180plus / 100).toFixed(0),
  }));

  // Recovery funnel
  const funnelData = [
    { stage: 'Submitted',   amount: 1184 },
    { stage: 'Reviewed',    amount: 1024 },
    { stage: 'Approved',    amount: 876  },
    { stage: 'Settled',     amount: 712  },
    { stage: 'Reconciled',  amount: 618  },
  ];

  return (
    <div className="p-5 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Section: Bucket Cards */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
          Aging Bucket Distribution
        </h3>
        <div className="flex gap-3">
          {AGING_BUCKET_TOTALS.map((b, i) => (
            <BucketCard key={b.key} bucket={b} index={i} />
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Aging Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">Aging Trend — 7 Months</h3>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mb-3">Monthly recovered vs outstanding vs denied (₹L)</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="recovGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outstGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="deniedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="recovered"   name="Recovered"   stroke="#10b981" fill="url(#recovGrad)"  strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="outstanding" name="Outstanding"  stroke="#f59e0b" fill="url(#outstGrad)"  strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="denied"      name="Denied"       stroke="#ef4444" fill="url(#deniedGrad)" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Aging Heatmap */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">Department Aging Breakdown</h3>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mb-3">Outstanding by department × aging bucket (₹K)</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="dept" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}K`} />
                <Tooltip content={<AmountTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="0-30d"  name="0-30d"  fill="#10b981" stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="31-60d" name="31-60d" fill="#f59e0b" stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="61-90d" name="61-90d" fill="#f97316" stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="91-180d" name="91-180d" fill="#ef4444" stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey=">180d"  name=">180d"  fill="#dc2626" stackId="a" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TPA Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200">TPA Performance Analysis</h3>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">Settlement speed, recovery rate & risk by TPA</p>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {['TPA / Insurance', 'Avg Settlement Days', 'Recovery Rate', 'Outstanding', 'High Risk', 'Trend'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TPA_PERFORMANCE.map((row, i) => {
                const isGood = row.avgDays <= 30;
                const isBad  = row.avgDays >= 50;
                return (
                  <tr key={row.tpa} className={`border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${i % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{row.tpa}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[12.5px] font-bold ${isGood ? 'text-emerald-600 dark:text-emerald-400' : isBad ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {row.avgDays}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" style={{ minWidth: 60 }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${row.recoveryRate}%`, background: row.recoveryRate > 85 ? '#10b981' : row.recoveryRate > 70 ? '#f59e0b' : '#ef4444' }}
                          />
                        </div>
                        <span className={`text-[11.5px] font-mono font-bold ${row.recoveryRate > 85 ? 'text-emerald-600 dark:text-emerald-400' : row.recoveryRate > 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                          {row.recoveryRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[12px] text-amber-700 dark:text-amber-400 font-semibold">{fmtINR(row.outstanding)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold ${row.highRisk > 2 ? 'text-red-600 dark:text-red-400' : row.highRisk > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {row.highRisk === 0 ? 'None' : `${row.highRisk} claims`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 text-[11px] font-semibold ${row.trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        {row.trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {row.trend > 0 ? '+' : ''}{row.trend}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recovery Funnel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">Recovery Funnel — Claim Lifecycle (₹Cr)</h3>
        <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mb-4">Total outstanding at each stage of the claim lifecycle</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}Cr`} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v) => [`₹${v}Cr`, 'Outstanding']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#6366f1', formatter: v => `₹${v}Cr` }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
