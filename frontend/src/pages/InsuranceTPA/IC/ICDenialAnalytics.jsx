import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { DENIAL_BREAKDOWN, DEPARTMENTS, fmtINR } from './ICConstants';
import { AlertTriangle, TrendingDown, Sparkles } from 'lucide-react';

const DEPT_DENIAL_DATA = [
  { dept: 'Cardiology',    denied: 24, amount: 1920000, rate: 18.2 },
  { dept: 'ICU',           denied: 19, amount: 1640000, rate: 14.8 },
  { dept: 'Oncology',      denied: 14, amount: 1280000, rate: 22.4 },
  { dept: 'Neurology',     denied: 12, amount: 980000,  rate: 16.1 },
  { dept: 'Orthopedics',   denied: 8,  amount: 720000,  rate: 9.4  },
  { dept: 'General Surgery',denied: 7, amount: 580000,  rate: 8.2  },
  { dept: 'Nephrology',    denied: 5,  amount: 310000,  rate: 12.8 },
];

const TPA_PERFORMANCE = [
  { tpa: 'Star Health',      submitted: 312, approved: 248, denied: 42, rate: 13.5, avgDays: 38 },
  { tpa: 'HDFC ERGO',        submitted: 187, approved: 171, denied: 9,  rate: 4.8,  avgDays: 22 },
  { tpa: 'ICICI Lombard',    submitted: 142, approved: 131, denied: 8,  rate: 5.6,  avgDays: 19 },
  { tpa: 'CGHS',             submitted: 98,  approved: 74,  denied: 14, rate: 14.3, avgDays: 68 },
  { tpa: 'New India',        submitted: 86,  approved: 62,  denied: 18, rate: 20.9, avgDays: 54 },
  { tpa: 'Medi Assist TPA',  submitted: 74,  approved: 61,  denied: 8,  rate: 10.8, avgDays: 31 },
];

const PIE_COLORS = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#6b7280'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-xl text-[11px]">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color ?? p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function ICDenialAnalytics() {
  return (
    <div className="p-4 space-y-6">

      {/* ── Top Denial Reasons ─────────────────────────────────────────── */}
      <div>
        <h3 className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">Top Denial Reasons</h3>
        <p className="text-[10.5px] text-slate-400 mb-3">This month — 89 total denials · ₹74.3L</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Bar chart */}
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DENIAL_BREAKDOWN} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="reason" tick={{ fontSize: 8.5, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[0, 3, 3, 0]}>
                  {DENIAL_BREAKDOWN.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DENIAL_BREAKDOWN}
                  dataKey="pct"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  outerRadius={58}
                  innerRadius={32}
                  paddingAngle={2}
                >
                  {DENIAL_BREAKDOWN.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Denial reason rows */}
        <div className="space-y-1.5 mt-2">
          {DENIAL_BREAKDOWN.map((d, i) => (
            <div key={d.reason} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="text-[11px] text-slate-600 dark:text-slate-300 flex-1 truncate">{d.reason}</span>
              <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-200 font-mono">{d.count}</span>
              <span className="text-[10px] text-slate-400 w-14 text-right">{fmtINR(d.amount)}</span>
              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Department-wise Denial Heatmap ─────────────────────────────── */}
      <div>
        <h3 className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mb-3">Department Denial Analysis</h3>
        <div className="space-y-2">
          {DEPT_DENIAL_DATA.map((d, i) => {
            const rateColor = d.rate > 18 ? '#ef4444' : d.rate > 12 ? '#f97316' : d.rate > 8 ? '#f59e0b' : '#10b981';
            return (
              <motion.div
                key={d.dept}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 w-28 flex-none truncate">{d.dept}</span>
                <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.rate * 3}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{ background: `${rateColor}30` }}
                  />
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <span className="text-[11px] font-bold font-mono" style={{ color: rateColor }}>{d.rate}%</span>
                  <span className="text-[10px] text-slate-400">{d.denied} denied</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── TPA Performance Table ───────────────────────────────────────── */}
      <div>
        <h3 className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mb-3">TPA Performance Scorecard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: '400px' }}>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {['TPA / Insurer','Submitted','Approved','Denied','Denial %','Avg Days'].map(h => (
                  <th key={h} className="py-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TPA_PERFORMANCE.map((row, i) => {
                const rateColor = row.rate > 15 ? 'text-red-600 dark:text-red-400' : row.rate > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
                const daysColor = row.avgDays > 50 ? 'text-red-600 dark:text-red-400' : row.avgDays > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
                return (
                  <tr key={row.tpa} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-2 px-2 text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">{row.tpa}</td>
                    <td className="py-2 px-2 text-[11.5px] font-mono text-slate-600 dark:text-slate-300">{row.submitted}</td>
                    <td className="py-2 px-2 text-[11.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{row.approved}</td>
                    <td className="py-2 px-2 text-[11.5px] font-mono text-red-600 dark:text-red-400 font-bold">{row.denied}</td>
                    <td className={`py-2 px-2 text-[11.5px] font-mono font-bold ${rateColor}`}>{row.rate}%</td>
                    <td className={`py-2 px-2 text-[11.5px] font-mono font-bold ${daysColor}`}>{row.avgDays}d</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI Denial Intelligence ──────────────────────────────────────── */}
      <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-700/40">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={13} className="text-indigo-500" />
          <span className="text-[12px] font-bold text-indigo-700 dark:text-indigo-400">AI Denial Intelligence</span>
        </div>
        <ul className="space-y-1">
          {[
            'Oncology has the highest denial rate (22.4%) — primarily package limit exceedances. Recommend pre-submission cost reviews.',
            'New India Assurance denial rate 20.9% — significantly above portfolio average. TPA relationship review recommended.',
            'Missing documentation causes 31% of denials — most preventable. Deploy pre-submission document checklist automation.',
            'Documentation-driven denials down 8% since last quarter — checklist protocol is working.',
          ].map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-[11.5px] text-indigo-700 dark:text-indigo-300">
              <TrendingDown size={10} className="flex-none mt-0.5 text-indigo-400" />
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
