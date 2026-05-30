import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { MOCK_DEPT_REVENUE, MOCK_PAYMENT_MODE, MOCK_HOURLY_TREND, fmtINR } from './PBConstants';

const VIEWS = [
  { id: 'dept',   label: 'By Department', icon: BarChart3  },
  { id: 'mode',   label: 'Payment Mode',  icon: PieIcon    },
  { id: 'hourly', label: 'Hourly Trend',  icon: TrendingUp },
];

const PIE_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      {label && <p className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-none" style={{ background: p.color ?? p.fill }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {typeof p.value === 'number' && p.value > 10000 ? fmtINR(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function DeptChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={MOCK_DEPT_REVENUE} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
        <XAxis dataKey="dept" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500"
          tickLine={false} axisLine={false} />
        <YAxis tickFormatter={v => fmtINR(v)} tick={{ fontSize: 10, fill: 'currentColor' }}
          className="text-slate-500" tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="actual" name="Collected" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Line dataKey="target" name="Target" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 3" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function ModeChart() {
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie data={MOCK_PAYMENT_MODE} dataKey="value" cx="50%" cy="50%"
            innerRadius={50} outerRadius={80} paddingAngle={3}>
            {MOCK_PAYMENT_MODE.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {MOCK_PAYMENT_MODE.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-none" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">{item.name}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.pct}%</span>
            <span className="text-[11px] text-slate-400 font-mono w-16 text-right">{fmtINR(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HourlyChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={MOCK_HOURLY_TREND} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="pbRevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
          </linearGradient>
          <linearGradient id="pbColGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500"
          tickLine={false} axisLine={false} />
        <YAxis tickFormatter={v => fmtINR(v)} tick={{ fontSize: 10, fill: 'currentColor' }}
          className="text-slate-500" tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area dataKey="billed"    name="Billed"    stroke="#6366f1" fill="url(#pbRevGrad)" strokeWidth={2} dot={false} />
        <Area dataKey="collected" name="Collected" stroke="#10b981" fill="url(#pbColGrad)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function PBAnalyticsPanel() {
  const [view, setView] = useState('dept');

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Tab header */}
      <div className="flex items-center justify-between flex-none">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BarChart3 size={14} className="text-indigo-500" /> Revenue Analytics
        </h3>
        <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {VIEWS.map(v => {
            const Icon = v.icon;
            return (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors
                  ${view === v.id
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <Icon size={11} />{v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart area */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 min-h-0"
      >
        {view === 'dept'   && <DeptChart />}
        {view === 'mode'   && <ModeChart />}
        {view === 'hourly' && <HourlyChart />}
      </motion.div>

      {/* Summary row */}
      {view === 'dept' && (
        <div className="grid grid-cols-3 gap-2 flex-none">
          {[
            { label: 'Top Dept',    value: 'Cardiology',  sub: '₹24.8L collected' },
            { label: 'Avg Target',  value: '87%',         sub: 'collection rate'   },
            { label: 'Outstanding', value: '₹18.3L',      sub: 'across 8 depts'   },
          ].map(s => (
            <div key={s.label} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-center">
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-indigo-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
