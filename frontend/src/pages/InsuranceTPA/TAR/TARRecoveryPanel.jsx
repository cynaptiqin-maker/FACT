import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, Clock, Phone, CheckCircle2 } from 'lucide-react';
import { fmtINR, TPA_PERFORMANCE, RECOVERY_TREND } from './TARConstants';

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

const DEPT_RECOVERY = [
  { dept: 'Cardiology',     outstanding: 210.4, recovered: 164.2, pct: 78, trend: 'up'   },
  { dept: 'ICU',            outstanding: 186.2, recovered: 128.4, pct: 69, trend: 'down' },
  { dept: 'Oncology',       outstanding: 148.8, recovered: 108.2, pct: 73, trend: 'up'   },
  { dept: 'Neurology',      outstanding: 124.0, recovered: 82.6,  pct: 67, trend: 'down' },
  { dept: 'Orthopedics',    outstanding: 118.2, recovered: 98.8,  pct: 84, trend: 'up'   },
  { dept: 'Nephrology',     outstanding: 96.4,  recovered: 68.2,  pct: 71, trend: 'up'   },
  { dept: 'Gen Surgery',    outstanding: 74.2,  recovered: 64.8,  pct: 87, trend: 'up'   },
  { dept: 'Others',         outstanding: 226.0, recovered: 182.4, pct: 81, trend: 'up'   },
];

const SUMMARY_CARDS = [
  { label: 'Total Recovered (Month)', value: '₹1.21Cr',  sub: 'vs ₹1.08Cr last month', color: 'text-emerald-600 dark:text-emerald-400', icon: IndianRupee, trend: '+12%', positive: true },
  { label: 'Collection Efficiency',   value: '87.3%',    sub: 'vs 85.2% target',        color: 'text-indigo-600 dark:text-indigo-400',  icon: TrendingUp,  trend: '+2.1pp', positive: true },
  { label: 'Follow-up Success Rate',  value: '64.2%',    sub: '42 of 65 follow-ups',    color: 'text-amber-600 dark:text-amber-400',   icon: Phone,       trend: '+4.8%', positive: true },
  { label: 'Avg Days to Recover',     value: '34 days',  sub: 'Target: 30 days',        color: 'text-violet-600 dark:text-violet-400', icon: Clock,       trend: '-3d', positive: true },
];

export default function TARRecoveryPanel() {
  const trendData = RECOVERY_TREND.map(r => ({
    month: r.month,
    Recovered:   +(r.recovered / 100).toFixed(0),
    Outstanding: +(r.outstanding / 100).toFixed(0),
    Denied:      +(r.denied / 100).toFixed(0),
  }));

  const tpaRecoveryData = TPA_PERFORMANCE.map(t => ({
    tpa:        t.tpa.split(' ')[0] + (t.tpa.split(' ')[1] ? ' ' + t.tpa.split(' ')[1].slice(0, 4) : ''),
    Recovery:   t.recoveryRate,
    Target: 85,
  }));

  return (
    <div className="p-5 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Summary Stats */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
          Recovery Performance — May 2026
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {SUMMARY_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={card.color} />
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400">{card.label}</span>
                </div>
                <div className={`text-[20px] font-bold font-mono ${card.color} mb-0.5`}>{card.value}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{card.sub}</span>
                  <span className={`text-[10px] font-bold ${card.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {card.trend}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Recovery Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">Recovery Trend — 7 Months</h3>
          <p className="text-[10.5px] text-slate-400 mb-3">Recovered vs Outstanding vs Denied (₹L)</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="oGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="Recovered"   stroke="#10b981" fill="url(#rGrad)" strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="Outstanding" stroke="#f59e0b" fill="url(#oGrad)" strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="Denied"      stroke="#ef4444" fill="url(#dGrad)" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TPA Recovery Efficiency */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">TPA Recovery Efficiency</h3>
          <p className="text-[10.5px] text-slate-400 mb-3">Recovery % per TPA vs 85% target line</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tpaRecoveryData} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="tpa" type="category" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <ReferenceLine x={85} stroke="#6366f1" strokeDasharray="3 3" label={{ value: 'Target 85%', fontSize: 9, fill: '#6366f1', position: 'top' }} />
                <Bar dataKey="Recovery" fill="#10b981" radius={[0, 3, 3, 0]}
                  label={{ position: 'right', fontSize: 9, fill: '#64748b', formatter: v => `${v}%` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Follow-up Productivity */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-3">Follow-up Productivity (Month)</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Follow-ups Sent',     value: 148, color: '#6366f1' },
            { label: 'TPA Responded',       value: 89,  color: '#10b981' },
            { label: 'Settled after FU',    value: 42,  color: '#f59e0b' },
            { label: 'Response Rate',       value: '60.1%', color: '#0d9488' },
          ].map((s, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-[20px] font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Recovery Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Department Recovery Summary</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {['Department', 'Outstanding (₹L)', 'Recovered (₹L)', 'Recovery %', 'Trend'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEPT_RECOVERY.map((row, i) => (
              <tr key={row.dept} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                <td className="px-4 py-2.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">{row.dept}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-amber-600 dark:text-amber-400 font-semibold">{row.outstanding}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-emerald-600 dark:text-emerald-400 font-semibold">{row.recovered}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: row.pct >= 80 ? '#10b981' : row.pct >= 70 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <span className={`text-[11.5px] font-mono font-bold ${row.pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' : row.pct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {row.pct}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  {row.trend === 'up'
                    ? <TrendingUp size={14} className="text-emerald-500" />
                    : <TrendingDown size={14} className="text-red-400" />
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
