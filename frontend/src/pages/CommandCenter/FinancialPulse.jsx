import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { commandCenterAPI } from '@services/api';
import {
  TrendingUp, Banknote, AlertTriangle, Clock,
  ShieldCheck, Users, Activity, RefreshCw,
  ArrowUpRight, ArrowDownRight, Circle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import clsx from 'clsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n, compact = true) {
  const v = Number(n || 0);
  if (!compact) return `₹${v.toLocaleString('en-IN')}`;
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}


// ─── KPI Tile ─────────────────────────────────────────────────────────────────
function KPITile({ icon: Icon, label, value, subValue, color, trend, isLoading }) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  border: 'border-amber-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    teal:   { bg: 'bg-teal-50',   icon: 'text-teal-600',   border: 'border-teal-100' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
  };

  const c = colorMap[color] || colorMap.blue;

  if (isLoading) {
    return (
      <div className={clsx('rounded-xl border p-4 animate-pulse', c.bg, c.border)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-white/60 rounded-lg" />
          <div className="h-3 bg-white/60 rounded w-20" />
        </div>
        <div className="h-6 bg-white/60 rounded w-24 mb-1" />
        <div className="h-2.5 bg-white/60 rounded w-16" />
      </div>
    );
  }

  return (
    <div className={clsx('rounded-xl border p-4 transition-all hover:shadow-sm', c.bg, c.border)}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center shadow-sm">
          <Icon className={clsx('w-3.5 h-3.5', c.icon)} />
        </div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-xl font-bold text-slate-800 font-mono leading-tight">{value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {subValue && <p className="text-xs text-slate-500">{subValue}</p>}
        {trend != null && (
          <span className={clsx(
            'flex items-center gap-0.5 text-[11px] font-medium',
            trend > 0 ? 'text-green-600' : 'text-red-500'
          )}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Health Bar ───────────────────────────────────────────────────────────────
function HealthBar({ label, score }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-slate-600 w-28 flex-shrink-0">{label}</p>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={clsx('text-xs font-bold w-8 text-right font-mono', textColor)}>{score}</span>
    </div>
  );
}

// ─── Custom Tooltip for Recharts ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── FinancialPulse ───────────────────────────────────────────────────────────
export default function FinancialPulse() {
  const { data: summaryData, isLoading: summaryLoading, refetch, isFetching } = useQuery({
    queryKey: ['command-center-summary'],
    queryFn: () => commandCenterAPI.getSummary().then(r => r.data.data),
    staleTime: 1000 * 60 * 3,
    refetchInterval: 1000 * 60 * 5,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['command-center-health'],
    queryFn: () => commandCenterAPI.getHealth().then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['command-center-trend'],
    queryFn: () => commandCenterAPI.getTrend().then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  });

  const kpis = summaryData?.kpis || {};
  const health = healthData || { overall: 0, indicators: [] };
  const trendPoints = trendData ?? [];
  const isLoading = summaryLoading;

  const healthColor = health.overall >= 80 ? 'text-green-600' : health.overall >= 60 ? 'text-amber-600' : 'text-red-600';
  const healthBg    = health.overall >= 80 ? 'bg-green-50 border-green-200' : health.overall >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* KPI Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-800">Financial Pulse</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
              Live
            </span>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KPITile
            icon={TrendingUp} label="Today's Revenue" color="green"
            value={fmt(kpis.todayRevenue)} subValue="patient billing"
            isLoading={isLoading}
          />
          <KPITile
            icon={Banknote} label="Cash Position" color="blue"
            value={fmt(kpis.cashPosition)} subValue="all banks"
            isLoading={isLoading}
          />
          <KPITile
            icon={AlertTriangle} label="AR Overdue" color="red"
            value={fmt(kpis.arOverdue)} subValue=">30 days"
            isLoading={isLoading}
          />
          <KPITile
            icon={Clock} label="AP Due / Week" color="amber"
            value={fmt(kpis.apDueThisWeek)} subValue="next 7 days"
            isLoading={isLoading}
          />
          <KPITile
            icon={ShieldCheck} label="Claims Pending" color="purple"
            value={fmt(kpis.claimsPendingValue)} subValue="submitted + review"
            isLoading={isLoading}
          />
          <KPITile
            icon={Users} label="MTD Payroll" color="indigo"
            value={fmt(kpis.mtdPayroll)} subValue="this month"
            isLoading={isLoading}
          />
          <KPITile
            icon={TrendingUp} label="MTD Revenue" color="teal"
            value={fmt(kpis.mtdRevenue)} subValue="this month"
            isLoading={isLoading}
          />
          <KPITile
            icon={AlertTriangle} label="AR Outstanding" color="amber"
            value={fmt(kpis.arOutstanding)} subValue="total"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Weekly trend chart + health score */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0">

        {/* Revenue vs Collections Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Revenue vs Collections</h4>
              <p className="text-xs text-slate-500">Last 7 days · Daily breakdown</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-brand-500 inline-block" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-teal-400 inline-block" /> Collections
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-0" style={{ minHeight: 140 }}>
            {trendLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full" />
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendPoints} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCollections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                       tickFormatter={v => v >= 1000000 ? `${(v/100000).toFixed(0)}L` : `${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2}
                      fill="url(#gradRevenue)" name="Revenue" dot={false} />
                <Area type="monotone" dataKey="collections" stroke="#14b8a6" strokeWidth={2}
                      fill="url(#gradCollections)" name="Collections" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4 flex flex-col">
          <h4 className="text-sm font-semibold text-slate-800 mb-1">Financial Health</h4>
          <p className="text-xs text-slate-500 mb-4">Real-time risk score</p>

          {/* Overall score ring */}
          <div className={clsx('rounded-xl border p-4 mb-4 text-center', healthBg)}>
            <p className={clsx('text-4xl font-bold font-mono', healthColor)}>
              {healthLoading ? '—' : health.overall}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              {health.overall >= 80 ? 'Excellent' : health.overall >= 60 ? 'Fair' : 'At Risk'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">out of 100</p>
          </div>

          {/* Indicator bars */}
          <div className="space-y-3 flex-1">
            {healthLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-24 h-2.5 bg-slate-100 rounded" />
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full" />
                  <div className="w-8 h-2.5 bg-slate-100 rounded" />
                </div>
              ))
            ) : (
              health.indicators.map((ind) => (
                <HealthBar key={ind.label} label={ind.label} score={ind.score} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
