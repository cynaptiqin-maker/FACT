import { motion } from 'framer-motion';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, AreaChart, Area,
} from 'recharts';
import { IndianRupee, TrendingUp, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { fmtINR, SETTLEMENT_PIPELINE } from './TARConstants';

const FORECAST_SUMMARY = [
  {
    label: 'Expected Settlements (30d)',
    value: '₹2.57Cr',
    sub: '4-week AI forecast',
    color: '#f59e0b',
    icon: IndianRupee,
    bg: 'from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10',
    border: 'border-amber-200 dark:border-amber-700/40',
  },
  {
    label: 'Cash Flow Recovery',
    value: '87.3%',
    sub: 'Collection efficiency',
    color: '#10b981',
    icon: TrendingUp,
    bg: 'from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10',
    border: 'border-emerald-200 dark:border-emerald-700/40',
  },
  {
    label: 'Settlement Probability',
    value: '74%',
    sub: 'Weighted avg, all TPAs',
    color: '#6366f1',
    icon: Clock,
    bg: 'from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10',
    border: 'border-indigo-200 dark:border-indigo-700/40',
  },
];

const FORECAST_DATA = [
  { week: 'Wk 18', actual: 48.2,  forecast: null,  label: 'Actual' },
  { week: 'Wk 19', actual: 51.4,  forecast: null,  label: 'Actual' },
  { week: 'Wk 20', actual: 49.8,  forecast: null,  label: 'Actual' },
  { week: 'Wk 21', actual: 53.2,  forecast: null,  label: 'Actual' },
  { week: 'Wk 22', actual: null,  forecast: 58.4,  label: 'Forecast' },
  { week: 'Wk 23', actual: null,  forecast: 62.8,  label: 'Forecast' },
  { week: 'Wk 24', actual: null,  forecast: 59.6,  label: 'Forecast' },
  { week: 'Wk 25', actual: null,  forecast: 66.4,  label: 'Forecast' },
];

const DELAYED_SETTLEMENTS = [
  { tpa: 'Oriental Insurance',    daysDelayed: 32, expected: '2026-04-28', amount: 3840000, probability: 32 },
  { tpa: 'New India Assurance',   daysDelayed: 28, expected: '2026-04-22', amount: 6240000, probability: 48 },
  { tpa: 'CGHS',                  daysDelayed: 22, expected: '2026-04-28', amount: 5640000, probability: 41 },
  { tpa: 'National Insurance',    daysDelayed: 18, expected: '2026-05-02', amount: 3200000, probability: 35 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-[11px]">
      <p className="font-bold text-slate-600 dark:text-slate-300 mb-1.5">{label}</p>
      {payload.map(p => p.value != null && (
        <p key={p.dataKey} style={{ color: p.color }} className="flex justify-between gap-3">
          <span>{p.name}:</span>
          <span className="font-bold">₹{p.value}L</span>
        </p>
      ))}
    </div>
  );
};

function PipelineStatus({ status }) {
  const cfg = {
    ON_TRACK: { label: 'On Track',  bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    AT_RISK:  { label: 'At Risk',   bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400'    },
    DELAYED:  { label: 'Delayed',   bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-700 dark:text-orange-400'  },
    CRITICAL: { label: 'Critical',  bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-400'        },
  }[status] ?? { label: status, bg: 'bg-slate-100', text: 'text-slate-600' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
  );
}

export default function TARSettlementForecast() {
  const treasurySparkline = [48, 52, 49, 53, 58, 63, 60, 66].map((v, i) => ({ i, v }));

  return (
    <div className="p-5 space-y-6 bg-slate-50 dark:bg-slate-950">

      {/* Forecast Summary */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
          Settlement Forecast — May / June 2026
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {FORECAST_SUMMARY.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-xl p-5`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} style={{ color: card.color }} />
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">{card.label}</span>
                </div>
                <div className="text-[24px] font-bold font-mono mb-0.5" style={{ color: card.color }}>{card.value}</div>
                <div className="text-[10.5px] text-slate-500 dark:text-slate-400">{card.sub}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Weekly Settlement Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">Weekly Settlement — Actual vs AI Forecast (₹L)</h3>
        <p className="text-[10.5px] text-slate-400 mb-3">Dashed line = AI forecast. Forecast begins Wk 22.</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={FORECAST_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} domain={[0, 80]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x="Wk 21" stroke="#6366f1" strokeDasharray="4 3" label={{ value: 'Today', fontSize: 9, fill: '#6366f1' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="actual"   name="Actual ₹L"   fill="#f59e0b" radius={[3,3,0,0]} maxBarSize={28} />
              <Line type="monotone" dataKey="forecast" name="Forecast ₹L" stroke="#a78bfa" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4, fill: '#a78bfa' }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Settlement Pipeline */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Settlement Pipeline — TPA View</h3>
          <p className="text-[10.5px] text-slate-400 mt-0.5">Expected settlements by TPA over next 60 days</p>
        </div>
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {['TPA / Insurance', 'Claims', 'Expected Amount', 'Probability', 'Expected Date', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SETTLEMENT_PIPELINE.map((row, i) => (
                <tr key={row.tpa} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3 text-[12px] font-semibold text-slate-800 dark:text-slate-100">{row.tpa}</td>
                  <td className="px-4 py-3 text-[12px] font-mono text-slate-700 dark:text-slate-200">{row.claims}</td>
                  <td className="px-4 py-3 text-[12.5px] font-mono font-bold text-amber-600 dark:text-amber-400">{fmtINR(row.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${row.probability}%`, background: row.probability >= 80 ? '#10b981' : row.probability >= 50 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className={`text-[11.5px] font-mono font-bold ${row.probability >= 80 ? 'text-emerald-600 dark:text-emerald-400' : row.probability >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {row.probability}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-slate-600 dark:text-slate-300">
                    {new Date(row.expectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <PipelineStatus status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Treasury Impact + Delayed Settlements */}
      <div className="grid grid-cols-2 gap-5">
        {/* Treasury Impact */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-1">Treasury Cash Flow Impact</h3>
          <p className="text-[10.5px] text-slate-400 mb-3">Expected settlement impact on weekly cash position</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={treasurySparkline} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                <XAxis dataKey="i" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `Wk${18 + v}`} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                <Tooltip formatter={(v) => [`₹${v}L`, 'Settlement']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="v" stroke="#f59e0b" fill="url(#tGrad)" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/40">
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              AI predicts ₹2.57Cr cash inflow from TPA settlements in the next 30 days if follow-up velocity is maintained.
            </div>
          </div>
        </div>

        {/* Delayed Settlements */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <AlertTriangle size={13} className="text-orange-500" />
            <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Delayed Settlements</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {DELAYED_SETTLEMENTS.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="px-4 py-3 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate">{d.tpa}</div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5">
                      Expected: {new Date(d.expected).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · Prob: {d.probability}%
                    </div>
                  </div>
                  <div className="flex-none text-right">
                    <div className="text-[12.5px] font-mono font-bold text-orange-600 dark:text-orange-400">{fmtINR(d.amount)}</div>
                    <div className="text-[10px] text-red-500 font-semibold">+{d.daysDelayed}d delayed</div>
                  </div>
                </div>
                <div className="mt-2">
                  <button className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-0.5">
                    Send reminder <ChevronRight size={9} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
