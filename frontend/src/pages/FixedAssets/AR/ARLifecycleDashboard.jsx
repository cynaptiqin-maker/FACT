// ─── Asset Register — Lifecycle Analytics Dashboard ───────────────────────────
// Depreciation curves · Acquisition trends · Utilization · Category distribution
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  TrendingDown, Package, Activity, RotateCcw,
  BarChart3, PieChart as PieIcon, TrendingUp,
} from 'lucide-react';
import {
  ACQUISITION_TREND_DATA, DEPRECIATION_CURVE_DATA,
  CATEGORY_DISTRIBUTION_DATA, UTILIZATION_DATA,
  fmtINR,
} from './ARConstants';

const TABS = [
  { id: 'acquisition',   label: 'Acquisition Trend',    icon: TrendingUp    },
  { id: 'depreciation',  label: 'Depreciation Curve',   icon: TrendingDown  },
  { id: 'categories',    label: 'Category Mix',         icon: PieIcon       },
  { id: 'utilization',   label: 'Utilization',          icon: Activity      },
  { id: 'replacement',   label: 'Replacement Forecast', icon: RotateCcw     },
];

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{title}</p>
        {subtitle && <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { fontSize: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  itemStyle: { fontSize: '10px' },
};

function AcquisitionPanel() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard title="Asset Acquisitions (12M)" subtitle="Count and value of new assets capitalized per month">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ACQUISITION_TREND_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000000).toFixed(0)}M`} />
            <Tooltip
              {...tooltipStyle}
              formatter={(v, name) => [name === 'value' ? fmtINR(v) : v, name === 'value' ? 'Value' : 'Count']}
            />
            <Bar yAxisId="left"  dataKey="acquisitions"    fill="#0ea5e9" radius={[3,3,0,0]} opacity={0.9} />
            <Bar yAxisId="right" dataKey="capitalizations" fill="#06b6d4" radius={[3,3,0,0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2">
          {[{ color: '#0ea5e9', label: 'Acquisitions' }, { color: '#06b6d4', label: 'Capitalizations' }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              <span className="text-[9.5px] text-slate-400 dark:text-slate-500">{l.label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Monthly Acquisition Value" subtitle="Total capitalization value trend (₹ lakhs)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={ACQUISITION_TREND_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="acqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
            <Tooltip {...tooltipStyle} formatter={(v) => [fmtINR(v), 'Acquisition Value']} />
            <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} fill="url(#acqGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function DepreciationPanel() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard title="Depreciation Curve — CT Scanner (WDV)" subtitle="Gross value vs Net Book Value over asset life">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={DEPRECIATION_CURVE_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grossGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#94a3b8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="nbvGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/10000000).toFixed(1)}Cr`} />
            <Tooltip {...tooltipStyle} formatter={(v, name) => [fmtINR(v), name === 'grossValue' ? 'Gross Value' : name === 'netBook' ? 'Net Book Value' : 'Acc. Depr.']} />
            <Area type="monotone" dataKey="grossValue" stroke="#94a3b8" strokeWidth={1.5} fill="url(#grossGrad2)" strokeDasharray="4 3" />
            <Area type="monotone" dataKey="netBook"    stroke="#10b981" strokeWidth={2}   fill="url(#nbvGrad2)" />
            <Area type="monotone" dataKey="accumulated" stroke="#f43f5e" strokeWidth={1}   fill="none" strokeDasharray="3 2" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2">
          {[
            { color: '#94a3b8', label: 'Gross Value' },
            { color: '#10b981', label: 'Net Book Value' },
            { color: '#f43f5e', label: 'Acc. Depreciation' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-1.5 rounded-sm" style={{ background: l.color }} />
              <span className="text-[9.5px] text-slate-400 dark:text-slate-500">{l.label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Portfolio Depreciation Forecast" subtitle="Annual depreciation charge forecast (all assets)">
        <div className="space-y-3">
          {[
            { fy: 'FY 2025-26 (Current)',  charge: 41400000,  pct: 9.7  },
            { fy: 'FY 2026-27 (Forecast)', charge: 48200000,  pct: 11.2, highlight: true },
            { fy: 'FY 2027-28 (Forecast)', charge: 52100000,  pct: 12.1 },
            { fy: 'FY 2028-29 (Forecast)', charge: 55600000,  pct: 13.0 },
            { fy: 'FY 2029-30 (Forecast)', charge: 47800000,  pct: 11.1 },
          ].map(row => (
            <div key={row.fy}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10.5px] ${row.highlight ? 'font-bold text-sky-700 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'}`}>{row.fy}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10.5px] font-bold ${row.highlight ? 'text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'}`}>{fmtINR(row.charge)}</span>
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-500">{row.pct}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.charge / 60000000) * 100}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: row.highlight ? '#0ea5e9' : '#94a3b8' }}
                />
              </div>
            </div>
          ))}
          <p className="text-[9.5px] text-slate-400 dark:text-slate-500 pt-1">*Forecast based on current WDV/SLM schedules. Excludes planned acquisitions.</p>
        </div>
      </ChartCard>
    </div>
  );
}

function CategoryPanel() {
  const total = CATEGORY_DISTRIBUTION_DATA.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard title="Asset Value by Category" subtitle="Gross asset value distribution across categories">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={CATEGORY_DISTRIBUTION_DATA}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {CATEGORY_DISTRIBUTION_DATA.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, _name, props) => [`${fmtINR(v)} (${((v / total) * 100).toFixed(1)}%)`, props.payload.category]}
              {...tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1 mt-2">
          {CATEGORY_DISTRIBUTION_DATA.slice(0, 4).map(d => (
            <div key={d.category} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{d.category}</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{fmtINR(d.value)}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Asset Count by Category" subtitle="Number of assets per category across all branches">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={CATEGORY_DISTRIBUTION_DATA}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={80} />
            <Tooltip {...tooltipStyle} formatter={(v) => [v + ' assets', 'Count']} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
              {CATEGORY_DISTRIBUTION_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function UtilizationPanel() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard title="Utilization by Department" subtitle="Average asset utilization rate per clinical department">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={UTILIZATION_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="dept" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={40} />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Utilization']} />
            <Bar dataKey="utilization" radius={[4,4,0,0]} maxBarSize={30}>
              {UTILIZATION_DATA.map((d, i) => (
                <Cell key={i} fill={d.utilization >= 80 ? '#10b981' : d.utilization >= 60 ? '#0ea5e9' : d.utilization >= 40 ? '#f59e0b' : '#f43f5e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Utilization Heatmap Summary" subtitle="Asset counts by utilization tier">
        <div className="space-y-3 mt-2">
          {[
            { tier: 'High (≥80%)',    count: 4,  color: '#10b981', desc: '196 assets · Revenue-generating' },
            { tier: 'Moderate (60-79%)', count: 2, color: '#0ea5e9', desc: '89 assets · Adequately deployed' },
            { tier: 'Low (30-59%)',   count: 1,  color: '#f59e0b', desc: '43 assets · Review redeployment' },
            { tier: 'Idle (<30%)',    count: 1,  color: '#f43f5e', desc: '19 assets · ₹8.2Cr tied capital' },
          ].map(t => (
            <div key={t.tier} className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-sm mt-0.5 flex-none" style={{ background: t.color }} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{t.tier}</span>
                  <span className="text-[10px] font-bold" style={{ color: t.color }}>{t.count} depts</span>
                </div>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-800/30 rounded-xl">
          <p className="text-[10.5px] font-semibold text-amber-700 dark:text-amber-400">AI Recommendation</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">
            19 idle assets with ₹8.2Cr NBV detected. Redeploy 11 assets or plan disposal to recover capital.
          </p>
        </div>
      </ChartCard>
    </div>
  );
}

function ReplacementPanel() {
  const replacementData = [
    { year: 'FY 2025-26', count: 3,  cost: 9800000,  assets: 'IT Servers, Ambulance Cot, ECG' },
    { year: 'FY 2026-27', count: 5,  cost: 42100000, assets: 'ICU Ventilators, DEXA, Dialysis (partial)' },
    { year: 'FY 2027-28', count: 4,  cost: 68500000, assets: 'PET-CT, Cath Lab, OT AHU' },
    { year: 'FY 2028-29', count: 7,  cost: 38200000, assets: 'Lab Analyzers, X-Ray, USG' },
    { year: 'FY 2029-30', count: 6,  cost: 85300000, assets: 'MRI, CT Scanner, Robotic Surgery' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      <ChartCard title="Replacement Budget Forecast" subtitle="Estimated CapEx requirements for asset replacement">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={replacementData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/10000000).toFixed(0)}Cr`} />
            <Tooltip {...tooltipStyle} formatter={(v, name) => [fmtINR(v), 'Replacement Cost']} />
            <Bar dataKey="cost" fill="#f97316" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="5-Year Replacement Roadmap" subtitle="Asset replacement schedule with CapEx planning">
        <div className="space-y-3 mt-1">
          {replacementData.map((r, i) => (
            <div key={r.year}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10.5px] font-semibold text-slate-700 dark:text-slate-300">{r.year}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-500">{r.count} assets</span>
                  <span className="text-[10.5px] font-bold text-orange-600 dark:text-orange-400">{fmtINR(r.cost)}</span>
                </div>
              </div>
              <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mb-1">{r.assets}</p>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.cost / 90000000) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-orange-400"
                />
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300">5-Year Total CapEx</span>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{fmtINR(replacementData.reduce((s, r) => s + r.cost, 0))}</span>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ARLifecycleDashboard() {
  const [activeTab, setActiveTab] = useState('acquisition');

  return (
    <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <BarChart3 size={15} className="text-sky-600 dark:text-sky-400" />
          <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Asset Lifecycle Analytics</span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">FY 2025-26 · All Branches</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={11} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Chart Content */}
      <div className="p-4">
        {activeTab === 'acquisition'  && <AcquisitionPanel />}
        {activeTab === 'depreciation' && <DepreciationPanel />}
        {activeTab === 'categories'   && <CategoryPanel />}
        {activeTab === 'utilization'  && <UtilizationPanel />}
        {activeTab === 'replacement'  && <ReplacementPanel />}
      </div>
    </div>
  );
}
