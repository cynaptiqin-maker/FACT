// ─── Doctor Payouts — Revenue Contribution Analytics ──────────────────────────
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, BarChart2, PieChart, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, PieChart as RePieChart, Pie, Legend,
  Treemap,
} from 'recharts';
import { DEPT_REVENUE_DATA, MOCK_PAYOUTS, fmtINR } from './DPConstants';

const VIEWS = [
  { id: 'dept',   label: 'By Department', icon: BarChart2 },
  { id: 'doctor', label: 'By Doctor',     icon: Activity  },
  { id: 'type',   label: 'By Type',       icon: PieChart  },
];

const DEPT_COLORS = [
  '#059669','#0ea5e9','#8b5cf6','#f97316','#06b6d4',
  '#d97706','#6366f1','#14b8a6','#f43f5e','#84cc16',
  '#e879f9','#3b82f6',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label ?? payload[0]?.name}</p>
      {payload.map(p => (
        <div key={p.dataKey ?? p.name} className="flex items-center justify-between gap-3 mt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color ?? p.fill }} />
            <span className="text-slate-500 dark:text-slate-400">{p.name ?? p.dataKey}</span>
          </div>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            {typeof p.value === 'number' && p.value > 1000 ? fmtINR(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function DeptBarChart() {
  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-3">Revenue Generated vs. Payout (₹)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={DEPT_REVENUE_DATA} margin={{ top: 4, right: 4, left: -18, bottom: 40 }} barSize={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b18" />
          <XAxis dataKey="dept" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-35} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" name="Revenue" radius={[3,3,0,0]}>
            {DEPT_REVENUE_DATA.map((_, i) => <Cell key={i} fill={`${DEPT_COLORS[i % DEPT_COLORS.length]}88`} />)}
          </Bar>
          <Bar dataKey="payout" name="Payout" radius={[3,3,0,0]}>
            {DEPT_REVENUE_DATA.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center mt-1">
        {[
          { color: '#059669', label: 'Payout' },
          { color: '#05966944', label: 'Revenue' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
            <span className="w-3 h-2 rounded-sm" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function DoctorBarChart() {
  const topDoctors = [...MOCK_PAYOUTS]
    .sort((a, b) => b.netPayout - a.netPayout)
    .slice(0, 10)
    .map(d => ({ name: d.doctorName.replace('Dr. ', ''), payout: d.netPayout, revenue: d.revenueGenerated, color: d.avatarColor }));

  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-3">Top 10 Doctors by Net Payout</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={topDoctors} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }} barSize={10}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b18" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: '#64748b' }} width={80} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="payout" name="Net Payout" radius={[0,3,3,0]}>
            {topDoctors.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PayoutTypeChart() {
  const typeAgg = MOCK_PAYOUTS.reduce((acc, p) => {
    acc[p.payoutType] = (acc[p.payoutType] ?? 0) + p.netPayout;
    return acc;
  }, {});

  const COLORS_PIE = ['#059669','#0ea5e9','#8b5cf6','#f97316','#06b6d4','#d97706','#6366f1','#f43f5e','#14b8a6'];
  const pieData = Object.entries(typeAgg).map(([k, v], i) => ({ name: k.replace(/_/g,' '), value: v, color: COLORS_PIE[i % COLORS_PIE.length] }));

  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-3">Payout Distribution by Type</p>
      <ResponsiveContainer width="100%" height={200}>
        <RePieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </RePieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-1 mt-2">
        {pieData.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-[9.5px] text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full flex-none" style={{ background: d.color }} />
            <span className="truncate">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Department Heatmap ───────────────────────────────────────────────────────
function DeptHeatmap() {
  const maxPayout = Math.max(...DEPT_REVENUE_DATA.map(d => d.payout));
  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Department Payout Intensity</p>
      <div className="grid grid-cols-3 gap-1.5">
        {DEPT_REVENUE_DATA.map((d, i) => {
          const intensity = d.payout / maxPayout;
          return (
            <motion.div
              key={d.dept}
              whileHover={{ scale: 1.03 }}
              className="rounded-lg p-2.5 cursor-pointer transition-all"
              style={{
                background: `rgba(5,150,105,${0.08 + intensity * 0.4})`,
                border: `1px solid rgba(5,150,105,${0.1 + intensity * 0.4})`,
              }}
            >
              <p className="text-[9.5px] font-semibold text-slate-700 dark:text-slate-300 truncate">{d.dept}</p>
              <p className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{fmtINR(d.payout)}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">{d.share}% share · {d.doctorCount} doctors</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Revenue Panel ───────────────────────────────────────────────────────
export default function DPRevenuePanel() {
  const [view, setView] = useState('dept');

  return (
    <div className="space-y-5">
      {/* View tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {VIEWS.map(v => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === v.id
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={12} />
              {v.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        {view === 'dept'   && <DeptBarChart   />}
        {view === 'doctor' && <DoctorBarChart />}
        {view === 'type'   && <PayoutTypeChart/>}
      </div>

      {/* Heatmap */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <DeptHeatmap />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Avg Share %',     val: `${(DEPT_REVENUE_DATA.reduce((s, d) => s + d.share, 0) / DEPT_REVENUE_DATA.length).toFixed(1)}%`, color: '#059669' },
          { label: 'Top Department',  val: 'Cardiology',    color: '#0ea5e9'  },
          { label: 'Avg Payout/Dr',   val: fmtINR(MOCK_PAYOUTS.reduce((s, p) => s + p.netPayout, 0) / MOCK_PAYOUTS.length), color: '#8b5cf6' },
          { label: 'Highest Revenue', val: fmtINR(Math.max(...MOCK_PAYOUTS.map(p => p.revenueGenerated))), color: '#f97316' },
        ].map(s => (
          <div key={s.label} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
            <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mb-0.5">{s.label}</p>
            <p className="font-mono font-bold text-sm" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
