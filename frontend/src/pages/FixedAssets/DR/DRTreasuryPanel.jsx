// ─── Depreciation Runs — Treasury & Forecasting Panel ────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark, TrendingDown, TrendingUp, AlertTriangle, CheckCircle,
  Calendar, Target, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ReferenceLine,
} from 'recharts';
import { TREASURY_FORECAST, fmtINR } from './DRConstants';

// ── Replacement schedule ─────────────────────────────────────────────────────
const REPLACEMENT_SCHEDULE = [
  { asset: 'MRI Scanner (Chennai)',         category: 'Medical Equipment', year: 'FY 2026-27', cost: 28500000, capex: 30000000, status: 'budgeted' },
  { asset: 'CT Scanner (Vellore)',          category: 'Medical Equipment', year: 'FY 2026-27', cost: 18200000, capex: 20000000, status: 'budgeted' },
  { asset: 'Core Network Switches',         category: 'IT Infrastructure', year: 'FY 2025-26', cost: 4200000,  capex: 4500000,  status: 'approved' },
  { asset: 'Ambulance Fleet (3 units)',     category: 'Vehicles',          year: 'FY 2027-28', cost: 7800000,  capex: 8500000,  status: 'planned' },
  { asset: 'HVAC — OT Blocks',             category: 'Plant & Machinery', year: 'FY 2026-27', cost: 5600000,  capex: 6000000,  status: 'planned' },
];

const STATUS_CFG = {
  approved: { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  budgeted: { text: 'text-blue-700 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-900/40' },
  planned:  { text: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-100 dark:bg-amber-900/40' },
};

// ── KPI strip ────────────────────────────────────────────────────────────────
const TREASURY_KPIS = [
  { label: 'Annual Run Rate',     value: fmtINR(14280000),  sub: 'FY 2025–26',   color: 'text-violet-600 dark:text-violet-400' },
  { label: 'Budget',             value: fmtINR(17500000),  sub: 'approved',      color: 'text-indigo-600 dark:text-indigo-400' },
  { label: 'Budget Variance',    value: '-₹32L',            sub: '18.3% under',   color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Capex Reserve',      value: fmtINR(58000000),  sub: '3 yrs reserve', color: 'text-teal-600 dark:text-teal-400' },
  { label: 'Replacement Backlog',value: fmtINR(64300000),  sub: 'next 3 yrs',    color: 'text-amber-600 dark:text-amber-400' },
  { label: 'AI Forecast (6M)',   value: fmtINR(7420000),   sub: 'next 6 months', color: 'text-purple-600 dark:text-purple-400' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white rounded-xl p-3 shadow-2xl text-[11px]">
      <p className="font-bold text-slate-300 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 mb-0.5">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums">{typeof p.value === 'number' && p.value > 1000 ? fmtINR(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: 'forecast',    label: 'Forecast' },
  { id: 'replacement', label: 'Replacements' },
  { id: 'budget',      label: 'Budget vs Actual' },
];

export default function DRTreasuryPanel() {
  const [tab, setTab] = useState('forecast');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
        <div className="flex items-center gap-2">
          <Landmark size={15} className="text-teal-600 dark:text-teal-400" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Treasury & Forecasting</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
          </span>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">Live</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {TREASURY_KPIS.map((k, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] text-slate-400 font-medium mb-0.5 leading-tight">{k.label}</p>
            <p className={`text-[12.5px] font-bold tabular-nums ${k.color}`}>{k.value}</p>
            <p className="text-[9.5px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all ${
              tab === t.id
                ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {tab === 'forecast' && (
            <motion.div key="forecast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">12-Month Rolling Forecast</p>
                  <div className="flex items-center gap-1.5">
                    <Zap size={11} className="text-purple-500 fill-purple-500" />
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">AI-powered</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={TREASURY_FORECAST} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="budget"   name="Budget"   fill="#e0e7ff" radius={[3, 3, 0, 0]} />
                    <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#14b8a6" fill="url(#forecastGrad)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="capexReserve" name="Capex Reserve" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    <ReferenceLine y={1200000} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Limit', fill: '#ef4444', fontSize: 10 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* AI recommendation */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={13} className="text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
                  <p className="text-[12px] font-bold text-purple-800 dark:text-purple-300">AI Treasury Recommendation</p>
                </div>
                <p className="text-[11.5px] text-purple-700 dark:text-purple-300 leading-relaxed">
                  Depreciation charges are tracking 18% below budget through Q3. Recommend releasing ₹32L from capex reserve to fund the MRI Scanner replacement scheduled for Q1 FY 2026–27. AI predicts 94% probability of full-year charges within ±5% of revised ₹14.5Cr forecast.
                </p>
              </div>
            </motion.div>
          )}

          {tab === 'replacement' && (
            <motion.div key="replacement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mb-3">
                Fully-depreciated or near-end-of-life assets requiring replacement planning and capex approval.
              </p>
              <div className="space-y-2.5">
                {REPLACEMENT_SCHEDULE.map((r, i) => {
                  const s = STATUS_CFG[r.status];
                  const gap = r.capex - r.cost;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{r.asset}</p>
                          <p className="text-[10.5px] text-slate-400">{r.category} · {r.year}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${s.bg} ${s.text}`}>{r.status}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Est. Cost: <strong className="text-slate-700 dark:text-slate-300">{fmtINR(r.cost)}</strong></span>
                        <span className="text-slate-500 dark:text-slate-400">Budget: <strong className="text-blue-600 dark:text-blue-400">{fmtINR(r.capex)}</strong></span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{fmtINR(gap)} buffer</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/40 rounded-xl px-3 py-2.5">
                <span className="text-[12px] font-bold text-teal-800 dark:text-teal-300">Total Replacement Capex (3 yr)</span>
                <span className="text-[14px] font-bold tabular-nums text-teal-700 dark:text-teal-400">{fmtINR(64300000)}</span>
              </div>
            </motion.div>
          )}

          {tab === 'budget' && (
            <motion.div key="budget" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4">
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-3">Budget vs Actual vs Forecast</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={TREASURY_FORECAST.slice(0, 8)} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="budget"   name="Budget"   fill="#c7d2fe" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="forecast" name="Forecast" fill="#14b8a6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'YTD Budget',        value: fmtINR(10500000), Icon: Target,      color: 'text-indigo-600 dark:text-indigo-400' },
                  { label: 'YTD Actual',         value: fmtINR(8640000),  Icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Favourable Variance',value: fmtINR(1860000),  Icon: TrendingDown,color: 'text-teal-600 dark:text-teal-400' },
                  { label: 'Full-Year Forecast', value: fmtINR(14280000), Icon: Calendar,    color: 'text-violet-600 dark:text-violet-400' },
                ].map(m => (
                  <div key={m.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <m.Icon size={12} className={m.color} />
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">{m.label}</p>
                    </div>
                    <p className={`text-[14px] font-bold tabular-nums ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
