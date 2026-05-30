import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, BarChart2, Activity, Clock,
  Building, AlertTriangle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { HOURLY_CASH_DATA, BRANCH_CASH_POSITIONS, COUNTER_PERFORMANCE, fmtINR } from './CBConstants';

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">₹{p.value}L</span>
        </div>
      ))}
    </div>
  );
};

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-teal-600 dark:text-teal-400 flex-none" />
      <div>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{title}</div>
        {subtitle && <div className="text-[10px] text-slate-400">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function CBAnalyticsPanel() {
  return (
    <div className="grid grid-cols-3 gap-5 min-h-0">

      {/* Hourly Cash Flow */}
      <div className="col-span-2">
        <SectionTitle icon={Activity} title="Hourly Cash Activity — Today" subtitle="Receipts vs Payments by hour (₹ Lakhs)" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={HOURLY_CASH_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="L" />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <defs>
                <linearGradient id="receiptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="paymentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="receipts" name="Receipts" stroke="#0d9488" strokeWidth={2} fill="url(#receiptGrad)" dot={false} />
              <Area type="monotone" dataKey="payments" name="Payments" stroke="#ef4444" strokeWidth={2} fill="url(#paymentGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
              <div className="w-6 h-0.5 bg-teal-500 rounded" />Receipts
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <div className="w-6 h-0.5 bg-red-400 rounded" />Payments
            </div>
            <div className="ml-auto text-slate-400">Peak: 9 PM (₹31.2L receipts) · Low: 12–1 PM</div>
          </div>
        </div>
      </div>

      {/* Branch Cash Positions */}
      <div>
        <SectionTitle icon={Building} title="Branch Cash Positions" subtitle="Current balance vs limit" />
        <div className="space-y-2">
          {BRANCH_CASH_POSITIONS.map((b, i) => (
            <motion.div
              key={b.branch}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{b.branch}</span>
                <div className="flex items-center gap-1.5">
                  {b.variance < 0 && <AlertTriangle size={11} className="text-amber-500" />}
                  <span className="text-[10px] font-mono font-semibold text-teal-600 dark:text-teal-400">
                    {fmtINR(b.balance)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.utilization}%` }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}
                  className={`h-full rounded-full ${
                    b.utilization > 80 ? 'bg-red-500'
                    : b.utilization > 65 ? 'bg-amber-500'
                    : 'bg-teal-500'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{b.utilization.toFixed(1)}% utilized</span>
                {b.variance < 0 && (
                  <span className="text-amber-500 font-semibold">Variance: ₹{Math.abs(b.variance).toLocaleString()}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Counter Performance Table */}
      <div className="col-span-3">
        <SectionTitle icon={BarChart2} title="Counter Performance — Today" subtitle="Receipts, payments, variances, efficiency" />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                {['Counter', 'Total Receipts', 'Total Payments', 'Variance', 'Shortages', 'Efficiency'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COUNTER_PERFORMANCE.map((c, i) => (
                <motion.tr
                  key={c.counter}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{c.counter}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">{fmtINR(c.receipts)}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-red-600 dark:text-red-400">{fmtINR(c.payments)}</td>
                  <td className="px-4 py-2.5">
                    {c.variance === 0
                      ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Balanced</span>
                      : <span className="text-red-600 dark:text-red-400 font-semibold font-mono">-₹{Math.abs(c.variance).toLocaleString()}</span>
                    }
                  </td>
                  <td className="px-4 py-2.5">
                    {c.shortages > 0
                      ? <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><AlertTriangle size={11} />{c.shortages} shortage{c.shortages > 1 ? 's' : ''}</span>
                      : <span className="text-slate-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.efficiency >= 90 ? 'bg-emerald-500' : c.efficiency >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${c.efficiency}%` }}
                        />
                      </div>
                      <span className={`font-semibold text-[11px] ${c.efficiency >= 90 ? 'text-emerald-600 dark:text-emerald-400' : c.efficiency >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {c.efficiency}%
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
