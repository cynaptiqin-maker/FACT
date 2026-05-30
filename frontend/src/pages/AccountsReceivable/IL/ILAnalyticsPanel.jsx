import { motion } from 'framer-motion';
import { X, TrendingUp, BarChart3, Users, Building2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie,
} from 'recharts';
import { COLLECTION_TREND, TOP_CUSTOMERS, REVENUE_BY_BRANCH, AGING_BUCKETS_DATA } from './ILConstants';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix = '₹', unit = 'K' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 text-xs">
      <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full flex-none" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{prefix}{(p.value || 0).toLocaleString()}{unit}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, color }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}1a` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
    </div>
  );
}

// ─── 1. Collection Trend ──────────────────────────────────────────────────────
function CollectionTrendChart() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <SectionHeader icon={TrendingUp} label="Collection Trend (7 Months)" color="#3b82f6" />
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={COLLECTION_TREND} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} />
          <Tooltip content={<CustomTooltip prefix="₹" unit="K" />} />
          <Area type="monotone" dataKey="invoiced"  name="Invoiced"   stroke="#3b82f6" strokeWidth={2} fill="url(#invoicedGrad)"  dot={false} />
          <Area type="monotone" dataKey="collected" name="Collected"  stroke="#10b981" strokeWidth={2} fill="url(#collectedGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-2">
        {[{ color: '#3b82f6', label: 'Invoiced' }, { color: '#10b981', label: 'Collected' }].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-1 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. Aging Buckets ─────────────────────────────────────────────────────────
function AgingChart() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <SectionHeader icon={BarChart3} label="Outstanding Aging Buckets" color="#f59e0b" />
      <div className="space-y-2.5 mb-3">
        {AGING_BUCKETS_DATA.map(b => (
          <div key={b.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{b.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-500">{b.count} inv</span>
                <span className="font-mono font-semibold" style={{ color: b.color }}>
                  ₹{(b.amount / 100000).toFixed(1)}L
                </span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${b.pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                className="h-full rounded-full"
                style={{ background: b.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          Total outstanding: <span className="font-semibold font-mono text-slate-700 dark:text-slate-300">
            ₹{(AGING_BUCKETS_DATA.reduce((s, b) => s + b.amount, 0) / 10000000).toFixed(2)}Cr
          </span>
        </span>
      </div>
    </div>
  );
}

// ─── 3. Top Customers ─────────────────────────────────────────────────────────
function TopCustomersChart() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <SectionHeader icon={Users} label="Top 5 Customers by Value" color="#8b5cf6" />
      <div className="space-y-2.5">
        {TOP_CUSTOMERS.map((c, i) => (
          <div key={c.name} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 w-4 text-center flex-none">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{c.name}</span>
                <span className="font-mono text-slate-600 dark:text-slate-400 flex-none ml-2">₹{(c.amount / 100000).toFixed(1)}L</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.pct}%` }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 4. Revenue by Branch (donut) ────────────────────────────────────────────
function BranchDonut() {
  const total = REVENUE_BY_BRANCH.reduce((s, b) => s + b.value, 0);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <SectionHeader icon={Building2} label="Revenue by Branch" color="#06b6d4" />
      <div className="flex items-center gap-3">
        <div className="flex-none">
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={REVENUE_BY_BRANCH}
                cx="50%" cy="50%"
                innerRadius={32} outerRadius={50}
                paddingAngle={2}
                dataKey="value"
              >
                {REVENUE_BY_BRANCH.map((b, i) => (
                  <Cell key={i} fill={b.color} strokeWidth={0} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {REVENUE_BY_BRANCH.map(b => (
            <div key={b.name} className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: b.color }} />
              <span className="text-slate-600 dark:text-slate-400 flex-1 truncate">{b.name}</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 flex-none">
                {((b.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function ILAnalyticsPanel({ onClose }) {
  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 340, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 250 }}
      className="flex-none overflow-hidden"
    >
      <div className="w-[340px] h-full flex flex-col bg-slate-50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-800">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-none bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Analytics</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* charts scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          <CollectionTrendChart />
          <AgingChart />
          <TopCustomersChart />
          <BranchDonut />
        </div>
      </div>
    </motion.div>
  );
}
