// ─── Depreciation Runs — Analytics Dashboard ─────────────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, BarChart2, BookOpen, Landmark, AlertTriangle,
  GitBranch, ChevronDown,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, ReferenceLine,
} from 'recharts';
import {
  TREND_DATA, CATEGORY_DATA, MULTIBOOK_DATA, TREASURY_FORECAST,
  IMPAIRMENT_DATA, BRANCH_DATA, fmtINR,
} from './DRConstants';

const VIEWS = [
  { id: 'trend',      label: 'Depreciation Trends',  icon: TrendingDown },
  { id: 'category',   label: 'By Category',           icon: BarChart2 },
  { id: 'multibook',  label: 'Multi-Book Variance',   icon: BookOpen },
  { id: 'treasury',   label: 'Treasury Forecast',     icon: Landmark },
  { id: 'impairment', label: 'Impairment Exposure',   icon: AlertTriangle },
  { id: 'branch',     label: 'By Branch',             icon: GitBranch },
];

const PIE_COLORS = ['#7c3aed', '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-3 shadow-2xl border border-slate-700 text-[11px] min-w-[140px]">
      <p className="font-bold text-slate-300 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-0.5">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold text-white tabular-nums">
            {typeof p.value === 'number' && p.value > 1000 ? fmtINR(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Trend Chart ──────────────────────────────────────────────────────────────
function TrendChart() {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Monthly Depreciation — All Books</p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            {[
              { color: '#7c3aed', label: 'IFRS' },
              { color: '#6366f1', label: 'Statutory' },
              { color: '#f59e0b', label: 'IT Act' },
              { color: '#10b981', label: 'GAAP' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={TREND_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {[
                { id: 'ifrs', color: '#7c3aed' },
                { id: 'stat', color: '#6366f1' },
                { id: 'it',   color: '#f59e0b' },
                { id: 'gaap', color: '#10b981' },
              ].map(g => (
                <linearGradient key={g.id} id={`grad_${g.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={g.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} width={54} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="ifrs"       name="IFRS"      stroke="#7c3aed" fill="url(#grad_ifrs)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="statutory"  name="Statutory" stroke="#6366f1" fill="url(#grad_stat)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="itAct"      name="IT Act"    stroke="#f59e0b" fill="url(#grad_it)"   strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="gaap"       name="GAAP"      stroke="#10b981" fill="url(#grad_gaap)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Run Count per Month</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={TREND_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="runs" name="Runs" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Category Chart ───────────────────────────────────────────────────────────
function CategoryChart() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Depreciation by Category</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" name="Amount" fill="#7c3aed" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Share by Category</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={CATEGORY_DATA}
              cx="50%" cy="50%"
              innerRadius={50} outerRadius={80}
              dataKey="amount"
              nameKey="name"
              paddingAngle={2}
            >
              {CATEGORY_DATA.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} formatter={v => fmtINR(v)} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Asset count + rate table */}
      <div className="col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-auto">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Category Rates Summary</p>
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <th className="pb-2 font-semibold">Category</th>
              <th className="pb-2 font-semibold text-right">Assets</th>
              <th className="pb-2 font-semibold text-right">IFRS Rate</th>
              <th className="pb-2 font-semibold text-right">IT Act Rate</th>
              <th className="pb-2 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORY_DATA.map((c, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="py-1.5 font-medium text-slate-700 dark:text-slate-300">{c.name}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-600 dark:text-slate-400">{c.assets}</td>
                <td className="py-1.5 text-right tabular-nums text-violet-600 dark:text-violet-400">{c.ifrsRate}%</td>
                <td className="py-1.5 text-right tabular-nums text-amber-600 dark:text-amber-400">{c.itRate}%</td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-slate-800 dark:text-slate-200">{fmtINR(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Multi-Book Chart ─────────────────────────────────────────────────────────
function MultiBookChart() {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Multi-Book Rate Comparison</p>
        <p className="text-[11px] text-slate-400 mb-3">Per-category depreciation rates across accounting standards</p>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={MULTIBOOK_DATA}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis tick={{ fontSize: 9 }} />
            <Radar name="IFRS"      dataKey="ifrs"      stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
            <Radar name="Statutory" dataKey="statutory" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
            <Radar name="IT Act"    dataKey="itAct"     stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Book Variance Table</p>
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <th className="pb-2 font-semibold">Category</th>
              <th className="pb-2 font-semibold text-right">IFRS</th>
              <th className="pb-2 font-semibold text-right">Statutory</th>
              <th className="pb-2 font-semibold text-right">IT Act</th>
              <th className="pb-2 font-semibold text-right">GAAP</th>
              <th className="pb-2 font-semibold text-right">Deferred Tax</th>
            </tr>
          </thead>
          <tbody>
            {MULTIBOOK_DATA.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="py-1.5 font-medium text-slate-700 dark:text-slate-300">{r.category}</td>
                <td className="py-1.5 text-right tabular-nums text-violet-600 dark:text-violet-400">{r.ifrs}%</td>
                <td className="py-1.5 text-right tabular-nums text-indigo-600 dark:text-indigo-400">{r.statutory}%</td>
                <td className="py-1.5 text-right tabular-nums text-amber-600 dark:text-amber-400">{r.itAct}%</td>
                <td className="py-1.5 text-right tabular-nums text-teal-600 dark:text-teal-400">{r.gaap}%</td>
                <td className={`py-1.5 text-right tabular-nums font-semibold ${r.deferredTax > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {r.deferredTax > 0 ? '+' : ''}{r.deferredTax}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Treasury Forecast Chart ──────────────────────────────────────────────────
function TreasuryChart() {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">12-Month Treasury Forecast</p>
            <p className="text-[11px] text-slate-400">Depreciation charge vs budget vs capex reserve</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={TREASURY_FORECAST} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} width={52} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="budget"   name="Budget"        fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="forecast" name="Forecast"      fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="capexReserve" name="Capex Reserve" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Annual Budget',   value: fmtINR(17500000), color: 'text-slate-600 dark:text-slate-400' },
          { label: 'Forecast Total',  value: fmtINR(16800000), color: 'text-violet-600 dark:text-violet-400' },
          { label: 'Budget Variance', value: '-₹7.0L',         color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(m => (
          <div key={m.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{m.label}</p>
            <p className={`text-[14px] font-bold tabular-nums ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Impairment Chart ─────────────────────────────────────────────────────────
function ImpairmentChart() {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">IAS 36 Impairment Exposure by Category</p>
        <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1">
          <AlertTriangle size={11} /> Assets at or near impairment trigger require urgent review
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={IMPAIRMENT_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
            <XAxis dataKey="category" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="atRisk"    name="At Risk"    fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="impaired"  name="Impaired"   fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="reviewed"  name="Reviewed"   fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4">
        <p className="text-[12px] font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
          <AlertTriangle size={13} /> IAS 36 Trigger Summary
        </p>
        <div className="space-y-1.5">
          {IMPAIRMENT_DATA.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-[11.5px]">
              <span className="text-amber-700 dark:text-amber-400">{d.category}</span>
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-amber-600 dark:text-amber-500">{d.atRisk} at risk</span>
                {d.impaired > 0 && <span className="text-red-600 dark:text-red-400 font-semibold">{d.impaired} impaired</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Branch Chart ─────────────────────────────────────────────────────────────
function BranchChart() {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Depreciation by Branch</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={BRANCH_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
            <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} width={52} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="amount" name="Depreciation" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="assets" name="Assets" fill="#10b981" radius={[4, 4, 0, 0]} yAxisId={1} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-auto">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Branch Breakdown</p>
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <th className="pb-2 font-semibold">Branch</th>
              <th className="pb-2 font-semibold text-right">Assets</th>
              <th className="pb-2 font-semibold text-right">Depreciation</th>
              <th className="pb-2 font-semibold text-right">% of Total</th>
              <th className="pb-2 font-semibold text-right">YoY Change</th>
            </tr>
          </thead>
          <tbody>
            {BRANCH_DATA.map((b, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="py-1.5 font-medium text-slate-700 dark:text-slate-300">{b.branch}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-600 dark:text-slate-400">{b.assets}</td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-slate-800 dark:text-slate-200">{fmtINR(b.amount)}</td>
                <td className="py-1.5 text-right tabular-nums text-violet-600 dark:text-violet-400">{b.pct}%</td>
                <td className={`py-1.5 text-right tabular-nums font-semibold ${b.yoy >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {b.yoy >= 0 ? '+' : ''}{b.yoy}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
const VIEW_MAP = {
  trend:      TrendChart,
  category:   CategoryChart,
  multibook:  MultiBookChart,
  treasury:   TreasuryChart,
  impairment: ImpairmentChart,
  branch:     BranchChart,
};

export default function DRAnalyticsDashboard() {
  const [activeView, setActiveView] = useState('trend');
  const ViewComponent = VIEW_MAP[activeView];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              activeView === v.id
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <v.icon size={12} />
            {v.label}
          </button>
        ))}
      </div>

      {/* View body */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <ViewComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
