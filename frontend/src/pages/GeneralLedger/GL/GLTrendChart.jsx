import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import {
  BarChart3, TrendingUp, GitBranch, ChevronDown, X,
} from 'lucide-react';
import clsx from 'clsx';
import { TREND_DATA, BRANCH_DATA, fmtCurrency } from './glConstants';

const TABS = [
  { id: 'trend',  label: 'Dr/Cr Trend',  icon: BarChart3  },
  { id: 'net',    label: 'Net Movement', icon: TrendingUp },
  { id: 'branch', label: 'Branch View',  icon: GitBranch  },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold font-mono">{fmtCurrency(p.value, true)}</span>
        </div>
      ))}
    </div>
  );
}

function BranchTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold">{p.value} entries</span>
        </div>
      ))}
    </div>
  );
}

function TrendView() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={TREND_DATA} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => fmtCurrency(v, true)}
          tick={{ fontSize: 9, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="square"
          iconSize={8}
          wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
        />
        <Bar dataKey="debit"  name="Debit"  fill="#fca5a5" radius={[3, 3, 0, 0]} />
        <Bar dataKey="credit" name="Credit" fill="#6ee7b7" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function NetView() {
  const dataWithThreshold = TREND_DATA.map(d => ({ ...d, threshold: 1000000 }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={dataWithThreshold} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => fmtCurrency(v, true)}
          tick={{ fontSize: 9, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1} />
        <Line
          dataKey="net"
          name="Net Movement"
          stroke="#0891b2"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#0891b2', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#0891b2' }}
        />
        <Line
          dataKey="threshold"
          name="Target"
          stroke="#d1fae5"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BranchView() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={BRANCH_DATA} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="branch"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<BranchTooltip />} />
        <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
        <Bar dataKey="posted"   name="Posted"   fill="#6ee7b7" radius={[3, 3, 0, 0]} />
        <Bar dataKey="pending"  name="Pending"  fill="#fcd34d" radius={[3, 3, 0, 0]} />
        <Bar dataKey="unposted" name="Unposted" fill="#fca5a5" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function GLTrendChart({ onCollapse }) {
  const [activeTab, setActiveTab] = useState('trend');

  const summaryStats = {
    trend: [
      { label: 'Avg Monthly Debit',  value: fmtCurrency(TREND_DATA.reduce((s, d) => s + d.debit,  0) / TREND_DATA.length, true) },
      { label: 'Avg Monthly Credit', value: fmtCurrency(TREND_DATA.reduce((s, d) => s + d.credit, 0) / TREND_DATA.length, true) },
      { label: 'Peak Month',         value: 'May 2026' },
    ],
    net: [
      { label: 'Total Net 6M',  value: fmtCurrency(TREND_DATA.reduce((s, d) => s + d.net, 0), true) },
      { label: 'Best Month',    value: 'May 2026' },
      { label: 'Trend',         value: '↑ +34.2%' },
    ],
    branch: [
      { label: 'Main Hospital', value: '52 posted' },
      { label: 'North Campus',  value: '31 posted' },
      { label: 'Unposted Total', value: '12 entries' },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex gap-1">
          {TABS.map(t => {
            const Ic = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  activeTab === t.id
                    ? 'bg-brand-800 text-pearl-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                )}
              >
                <Ic className="w-3 h-3" />
                {t.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={onCollapse}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chart */}
      <div className="px-4 pt-4">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'trend'  && <TrendView  />}
          {activeTab === 'net'    && <NetView    />}
          {activeTab === 'branch' && <BranchView />}
        </motion.div>
      </div>

      {/* Summary stats */}
      <div className="px-4 py-3 border-t border-slate-50 flex gap-4 flex-wrap">
        {(summaryStats[activeTab] || []).map(s => (
          <div key={s.label}>
            <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
            <p className="text-xs font-bold text-slate-700">{s.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
