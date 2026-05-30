import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { LIQUIDITY_DATA, fmtINR } from './BRConstants';

const STATUS_COLOR = {
  IN_TRANSIT: { text: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-50 dark:bg-cyan-500/15',    border: 'border-cyan-200 dark:border-cyan-500/25' },
  PROCESSING: { text: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/15',    border: 'border-blue-200 dark:border-blue-500/25' },
  CONFIRMED:  { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15', border: 'border-emerald-200 dark:border-emerald-500/25' },
  PENDING:    { text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/15',  border: 'border-amber-200 dark:border-amber-500/25' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{fmtINR(p.value, 'lakh')}</span>
        </div>
      ))}
    </div>
  );
};

export default function BRAnalyticsPanel() {
  const totalPipeline = LIQUIDITY_DATA.settlementPipeline.reduce((s, p) => s + p.amount, 0);
  const totalBalance  = LIQUIDITY_DATA.accountBreakdown.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      {/* 7-day liquidity forecast */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> 7-Day Liquidity Forecast
          </h3>
          <span className="text-[10px] text-slate-400">AI-powered · 76% confidence</span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={LIQUIDITY_DATA.forecast} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              <Area type="monotone" dataKey="inflow"  name="Inflow"  stroke="#6366f1" strokeWidth={2} fill="url(#inflowGrad)" dot={false} />
              <Area type="monotone" dataKey="outflow" name="Outflow" stroke="#f43f5e" strokeWidth={2} fill="url(#outflowGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Account breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Bank Account Balances</h3>
        <div className="space-y-2.5">
          {LIQUIDITY_DATA.accountBreakdown.map((acc, i) => (
            <motion.div
              key={acc.account}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">{acc.account}</span>
                <span className="font-bold text-slate-800 dark:text-white">{fmtINR(acc.balance, 'lakh')}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${acc.utilization}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: acc.color }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{acc.utilization}% of limit</span>
                <span>{fmtINR(Math.round(totalBalance * acc.utilization / 100 * 0.18 / 100), 'standard')} interest/yr</span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Total Bank Balance</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{fmtINR(totalBalance, 'crore')}</span>
        </div>
      </div>

      {/* Settlement pipeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Settlement Pipeline
          </h3>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{fmtINR(totalPipeline, 'lakh')} total</span>
        </div>
        <div className="space-y-2">
          {LIQUIDITY_DATA.settlementPipeline.map((s, i) => {
            const st = STATUS_COLOR[s.status] || STATUS_COLOR.PENDING;
            return (
              <motion.div
                key={s.source}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${st.border} ${st.bg}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{s.source}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-[10px] text-slate-400">ETA: {s.eta}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-white">{fmtINR(s.amount, 'lakh')}</div>
                  <span className={`text-[10px] font-semibold ${st.text}`}>{s.status.replace('_', ' ')}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Daily balance bar chart */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Inflow vs Outflow by Day</h3>
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={LIQUIDITY_DATA.forecast} margin={{ top: 2, right: 4, left: 0, bottom: 0 }} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => `${(v/100000).toFixed(0)}L`} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="inflow"  name="Inflow"  fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="outflow" name="Outflow" fill="#f43f5e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash concentration insight */}
      <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/8 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Cash Concentration Insight</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          HDFC – 4521 holds 41% of total liquidity (₹4.29Cr). Consider sweeping ₹1.5Cr to SBI for better interest utilization. Target sweep by May 22 after pending settlements clear.
        </p>
      </div>
    </div>
  );
}
