import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { reportAPI, exceptionAPI } from '@services/api';
import CFOAIPanel from './CFOAIPanel';
import KPICard from '@components/UI/KPICard';
import DrillDown from '@components/UI/DrillDown';
import RevenueChart from '@components/Charts/RevenueChart';
import CashFlowChart from '@components/Charts/CashFlowChart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, Landmark, ShieldCheck, Banknote,
  AlertCircle, Brain, RefreshCw, Clock, ChevronRight,
  ArrowUpRight, Activity, Scale, Zap, CalendarCheck,
  ExternalLink, CheckCircle2, XCircle, AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCr(value) {
  if (!value && value !== 0) return '—';
  const n = Number(value);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ─── Financial Health Score Widget ───────────────────────────────────────────
function HealthScoreWidget({ health, isLoading }) {
  const score = health?.overallScore || 0;
  const grade = health?.grade || '—';
  const components = health?.components || [];
  const recommendations = health?.recommendations || [];

  const gradeColors = {
    A: 'text-green-600 bg-green-50 border-green-200',
    B: 'text-teal-600 bg-teal-50 border-teal-200',
    C: 'text-amber-600 bg-amber-50 border-amber-200',
    D: 'text-orange-600 bg-orange-50 border-orange-200',
    F: 'text-red-600 bg-red-50 border-red-200',
  };
  const arcColor = {
    A: '#16a34a', B: '#0d9488', C: '#d97706', D: '#ea580c', F: '#dc2626',
  };
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - score / 100);
  const color = arcColor[grade] || '#94a3b8';

  const barColor = (s) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-amber-400';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card animate-pulse">
        <div className="h-4 w-40 bg-slate-100 rounded mb-4" />
        <div className="flex justify-center mb-4">
          <div className="w-28 h-28 bg-slate-100 rounded-full" />
        </div>
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-3 bg-slate-100 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800 text-sm">Financial Health Score</h2>
          <p className="text-xs text-slate-500">Composite across 7 indicators</p>
        </div>
        <span className={clsx('px-2.5 py-1 rounded-lg text-sm font-bold border', gradeColors[grade] || 'text-slate-600 bg-slate-50 border-slate-200')}>
          Grade {grade}
        </span>
      </div>

      {/* Circular gauge */}
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text x="50" y="46" textAnchor="middle" dominantBaseline="middle" className="font-bold" fill={color} fontSize="20" fontWeight="700">{score}</text>
            <text x="50" y="62" textAnchor="middle" fill="#94a3b8" fontSize="9">/100</text>
          </svg>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {components.slice(0, 5).map((comp, i) => (
            <div key={i}>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-600 truncate">{comp.label}</span>
                <span className="font-mono text-slate-700 ml-1 flex-shrink-0">{comp.score}</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={clsx('h-full rounded-full', barColor(comp.score))} style={{ width: `${comp.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Top Recommendations</p>
          {recommendations.slice(0, 2).map((rec, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-snug">
                {typeof rec === 'string' ? rec : `${rec.area}: ${rec.action}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Exception Summary Widget ─────────────────────────────────────────────────
function ExceptionSummaryWidget({ exceptions, isLoading }) {
  const navigate = useNavigate();
  const open = exceptions?.open || 0;
  const critical = exceptions?.critical || 0;
  const high = exceptions?.high || 0;
  const acknowledged = exceptions?.acknowledged || 0;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card animate-pulse">
        <div className="h-4 w-36 bg-slate-100 rounded mb-4" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800 text-sm">Exception Summary</h2>
          <p className="text-xs text-slate-500">Active issues requiring attention</p>
        </div>
        <button
          onClick={() => navigate('/exceptions')}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          View All <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Big stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{open}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Open</p>
        </div>
        <div className={clsx('rounded-lg p-3 text-center', critical > 0 ? 'bg-red-50' : 'bg-slate-50')}>
          <p className={clsx('text-2xl font-bold', critical > 0 ? 'text-red-600' : 'text-slate-800')}>{critical}</p>
          <p className="text-xs text-slate-500 mt-0.5">Critical</p>
        </div>
      </div>

      {/* Detail rows */}
      <div className="space-y-2">
        {[
          { label: 'High Priority', value: high, color: 'text-orange-600' },
          { label: 'Acknowledged', value: acknowledged, color: 'text-blue-600' },
          { label: 'Resolved Today', value: exceptions?.resolvedToday || 0, color: 'text-green-600' },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-600">{row.label}</span>
            <span className={clsx('text-sm font-semibold', row.color)}>{row.value}</span>
          </div>
        ))}
      </div>

      {critical > 0 && (
        <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700 font-medium">{critical} critical exception{critical !== 1 ? 's' : ''} need immediate action</p>
        </div>
      )}
    </div>
  );
}

// ─── Period Close Status Widget ───────────────────────────────────────────────
function PeriodCloseWidget({ d, isLoading }) {
  const navigate = useNavigate();
  const periodClose = d?.periodClose || {};
  const lastLocked = periodClose.lastLockedPeriod;
  const status = periodClose.status || 'OPEN';

  const statusColors = {
    OPEN: 'bg-green-100 text-green-700',
    LOCKED: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-amber-100 text-amber-700',
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card animate-pulse">
        <div className="h-4 w-36 bg-slate-100 rounded mb-4" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800 text-sm">Period Close Status</h2>
          <p className="text-xs text-slate-500">Current financial period</p>
        </div>
        <button
          onClick={() => navigate('/period-close')}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          Manage <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', status === 'LOCKED' ? 'bg-blue-100' : 'bg-green-100')}>
          {status === 'LOCKED'
            ? <CheckCircle2 className="w-5 h-5 text-blue-600" />
            : <CalendarCheck className="w-5 h-5 text-green-600" />
          }
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{periodClose.currentPeriod || 'Apr 2026'}</p>
          <span className={clsx('px-2 py-0.5 rounded text-[11px] font-semibold', statusColors[status] || 'bg-slate-100 text-slate-600')}>
            {status}
          </span>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Last Locked Period</span>
          <span className="font-medium text-slate-700">{lastLocked || 'Not yet locked'}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Checklist Items</span>
          <span className="font-medium text-slate-700">
            {periodClose.completedItems || 0} / {periodClose.totalItems || 0} done
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Pending JEs</span>
          <span className={clsx('font-medium', (periodClose.pendingJournals || 0) > 0 ? 'text-amber-600' : 'text-green-600')}>
            {periodClose.pendingJournals || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Revenue by Dept Chart ────────────────────────────────────────────────────
const DEPT_COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];

function RevByDeptChart({ byDept = [], isLoading }) {
  const data = byDept.slice(0, 8).map((d, i) => ({
    dept: d.dept || d.billing_type || `Dept ${i+1}`,
    revenue: d.revenue || 0,
  }));

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2 py-4">
        {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-slate-100 rounded" />)}
      </div>
    );
  }

  if (!data.length) {
    return <div className="py-12 text-center text-slate-400 text-sm">No department revenue data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
        <YAxis type="category" dataKey="dept" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
        <Tooltip
          formatter={(v) => [formatCr(v), 'Revenue']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Mock Revenue Data ────────────────────────────────────────────────────────
const MOCK_REVENUE_DATA = [
  { month: 'Oct', revenue: 4200000, expense: 3100000, profit: 1100000 },
  { month: 'Nov', revenue: 4800000, expense: 3400000, profit: 1400000 },
  { month: 'Dec', revenue: 5200000, expense: 3800000, profit: 1400000 },
  { month: 'Jan', revenue: 4600000, expense: 3500000, profit: 1100000 },
  { month: 'Feb', revenue: 5100000, expense: 3600000, profit: 1500000 },
  { month: 'Mar', revenue: 5800000, expense: 3900000, profit: 1900000 },
];

const MOCK_CASHFLOW_DATA = [
  { month: 'Oct', inflow: 3800000, outflow: 2900000, net: 900000 },
  { month: 'Nov', inflow: 4200000, outflow: 3100000, net: 1100000 },
  { month: 'Dec', inflow: 4900000, outflow: 3700000, net: 1200000 },
  { month: 'Jan', inflow: 4100000, outflow: 3300000, net: 800000 },
  { month: 'Feb', inflow: 4700000, outflow: 3500000, net: 1200000 },
  { month: 'Mar', inflow: 5300000, outflow: 3800000, net: 1500000 },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    PAID: 'bg-green-100 text-green-700',
    FINALIZED: 'bg-blue-100 text-blue-700',
    DRAFT: 'bg-slate-100 text-slate-600',
    PENDING: 'bg-amber-100 text-amber-700',
    SETTLED: 'bg-green-100 text-green-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-teal-100 text-teal-700',
    REJECTED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={clsx('px-2 py-0.5 rounded text-[11px] font-medium', map[status] || 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  );
}

// ─── CFO Dashboard ────────────────────────────────────────────────────────────
export default function CFODashboard() {
  const navigate = useNavigate();
  const [drillDown, setDrillDown] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);

  // Primary CFO summary data
  const { data: dashData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cfo-summary'],
    queryFn: () => reportAPI.getCFOSummary().then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  // Financial health score
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['financial-health'],
    queryFn: () => reportAPI.getHealthScore().then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  });

  // Exception stats
  const { data: exceptionsData, isLoading: exceptionsLoading } = useQuery({
    queryKey: ['exception-stats'],
    queryFn: () => exceptionAPI.getStats().then((r) => r.data.data || r.data),
    staleTime: 1000 * 60 * 2,
  });

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (!e.altKey) return;
      const map = {
        '1': '/',
        '2': '/ar',
        '3': '/ap',
        '4': '/cash-bank',
        '5': '/exceptions',
        '6': '/reconciliation',
        '7': '/period-close',
        '8': '/reports',
      };
      if (map[e.key]) {
        e.preventDefault();
        navigate(map[e.key]);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  const d = dashData || {};
  const health = healthData || {};
  const exceptions = exceptionsData || {};

  const ytdRevenue = d.revenue?.ytd || 0;
  const outstandingAR = d.accountsReceivable?.outstanding || 0;
  const pendingClaims = d.insurance?.pendingClaims || 0;
  const cashPosition = d.cashPosition || 0;
  const pendingAP = d.accountsPayable || 0;
  const overdueClaims = d.insurance?.overdueCount || 0;
  const revenueThisMonth = d.revenue?.thisMonth || 0;
  const payrollMTD = d.payroll?.mtdTotal || 0;
  const exceptionsOpen = exceptions?.open || 0;
  const exceptionsCritical = exceptions?.critical || 0;
  const healthScore = health?.overallScore || 0;
  const healthGrade = health?.grade || '—';

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CFO Command Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Financial overview · {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-400 mr-1">
            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">Alt+1-8</span>
            <span>Quick Nav</span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => setAiOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${aiOpen ? 'bg-brand-700 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'}`}
          >
            <Brain className="w-3.5 h-3.5" />
            {aiOpen ? 'Close Copilot' : 'AI Copilot'}
          </button>
        </div>
      </div>

      {/* Main content + AI panel */}
      <div className="flex gap-0 items-start min-h-0">
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Row 1: 6 Primary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard
              title="YTD Revenue"
              value={formatCr(ytdRevenue)}
              trend={8.4}
              trendLabel="vs last FY"
              icon={<TrendingUp />}
              color="blue"
              isLoading={isLoading}
              onClick={() => setDrillDown({ type: 'revenue', title: 'YTD Revenue Breakdown' })}
            />
            <KPICard
              title="Outstanding AR"
              value={formatCr(outstandingAR)}
              subValue="Patient + Insurance"
              trend={-3.2}
              trendLabel="vs last month"
              icon={<Activity />}
              color="amber"
              isLoading={isLoading}
              onClick={() => setDrillDown({ type: 'ar', title: 'Accounts Receivable Aging' })}
            />
            <KPICard
              title="Pending Claims"
              value={formatCr(pendingClaims)}
              badge={overdueClaims > 0 ? `${overdueClaims} overdue` : undefined}
              icon={<ShieldCheck />}
              color="red"
              isLoading={isLoading}
              onClick={() => setDrillDown({ type: 'claims', title: 'Insurance Claims Pipeline' })}
            />
            <KPICard
              title="Cash Position"
              value={formatCr(cashPosition)}
              subValue="Bank + Cash"
              trend={5.1}
              trendLabel="vs last week"
              icon={<Banknote />}
              color="green"
              isLoading={isLoading}
              onClick={() => setDrillDown({ type: 'cash', title: 'Cash & Bank Positions' })}
            />
            <KPICard
              title="Pending AP"
              value={formatCr(pendingAP)}
              subValue="Vendor payables"
              icon={<Landmark />}
              color="purple"
              isLoading={isLoading}
              onClick={() => setDrillDown({ type: 'ap', title: 'Accounts Payable Summary' })}
            />
            <KPICard
              title="Net Position"
              value={formatCr(cashPosition - pendingAP)}
              trend={2.8}
              trendLabel="vs last month"
              icon={<ArrowUpRight />}
              color="teal"
              isLoading={isLoading}
            />
          </div>

          {/* Row 2: 4 Secondary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Revenue This Month"
              value={formatCr(revenueThisMonth)}
              trend={d.revenue?.monthGrowth}
              trendLabel="vs last month"
              icon={<DollarSign />}
              color="blue"
              isLoading={isLoading}
            />
            <KPICard
              title="Payroll MTD"
              value={formatCr(payrollMTD)}
              subValue="Staff + Doctors"
              icon={<Scale />}
              color="indigo"
              isLoading={isLoading}
            />
            <KPICard
              title="Open Exceptions"
              value={exceptionsOpen}
              badge={exceptionsCritical > 0 ? `${exceptionsCritical} critical` : undefined}
              icon={<AlertCircle />}
              color={exceptionsCritical > 0 ? 'red' : 'amber'}
              isLoading={exceptionsLoading}
              onClick={() => navigate('/exceptions')}
            />
            <KPICard
              title="Health Score"
              value={`${healthScore}/100`}
              badge={healthGrade !== '—' ? `Grade ${healthGrade}` : undefined}
              icon={<Zap />}
              color={healthGrade === 'A' ? 'green' : healthGrade === 'B' ? 'teal' : healthGrade === 'C' ? 'amber' : 'red'}
              isLoading={healthLoading}
            />
          </div>

          {/* Row 3: Revenue by Dept + Health Score Widget */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-slate-800 text-sm">Revenue by Department</h2>
                  <p className="text-xs text-slate-500">YTD billing breakdown</p>
                </div>
                <button
                  onClick={() => setDrillDown({ type: 'revenue', title: 'YTD Revenue Breakdown' })}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <RevByDeptChart byDept={d.revenue?.byDept || []} isLoading={isLoading} />
            </div>

            <HealthScoreWidget health={healthData} isLoading={healthLoading} />
          </div>

          {/* Row 4: AR Aging (left), Exceptions (center), Period Close (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AR Aging */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <h2 className="font-semibold text-slate-800 text-sm mb-4">AR Aging Summary</h2>
              <div className="space-y-3">
                {[
                  { label: 'Current (0 days)', amount: d.aging_current || 1200000, color: 'bg-green-500', pct: 40 },
                  { label: '1–30 days', amount: d.aging_30 || 800000, color: 'bg-yellow-400', pct: 27 },
                  { label: '31–60 days', amount: d.aging_60 || 500000, color: 'bg-orange-400', pct: 17 },
                  { label: '61–90 days', amount: d.aging_90 || 300000, color: 'bg-red-400', pct: 10 },
                  { label: '90+ days', amount: d.aging_over || 180000, color: 'bg-red-700', pct: 6 },
                ].map((row) => (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{row.label}</span>
                      <span className="font-mono font-medium text-slate-800">{formatCr(row.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={clsx('h-full rounded-full', row.color)} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setDrillDown({ type: 'ar', title: 'AR Aging Detail' })}
                className="mt-4 text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
              >
                Full aging report <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <ExceptionSummaryWidget exceptions={exceptionsData} isLoading={exceptionsLoading} />
            <PeriodCloseWidget d={d} isLoading={isLoading} />
          </div>

          {/* Row 5: Charts + Bottom sections */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-slate-800 text-sm">Revenue vs Expense Trend</h2>
                  <p className="text-xs text-slate-500">Last 6 months</p>
                </div>
                <span className="px-2 py-1 text-[11px] bg-brand-50 text-brand-600 rounded-md font-medium">Area</span>
              </div>
              <RevenueChart data={MOCK_REVENUE_DATA} type="area" height={220} />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-slate-800 text-sm">Cash Flow</h2>
                  <p className="text-xs text-slate-500">Inflow vs Outflow</p>
                </div>
              </div>
              <CashFlowChart data={MOCK_CASHFLOW_DATA} height={220} />
            </div>
          </div>

          {/* Row 6: Pending Approvals + Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Approvals */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <h2 className="font-semibold text-slate-800 text-sm mb-4">Pending Approvals</h2>
              <div className="space-y-3">
                {[
                  { label: 'Journal Entries', count: d.pending_journals || 3, path: '/accounting/journal' },
                  { label: 'Vendor Invoices', count: d.pending_vendor_invoices || 8, path: '/ap/vendor-invoices' },
                  { label: 'Payroll Run', count: d.pending_payroll || 1, path: '/payroll/run' },
                  { label: 'Doctor Payouts', count: d.pending_payouts || 2, path: '/doctor-payouts' },
                  { label: 'Budget Revisions', count: d.pending_budgets || 1, path: '/budgeting' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.count > 0 && (
                        <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-[11px] font-semibold flex items-center justify-center">
                          {item.count}
                        </span>
                      )}
                      {item.count === 0 && <span className="text-xs text-slate-400">All clear</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {(d.pending_journals || 3) + (d.pending_vendor_invoices || 8)} items need your attention
                </div>
              </div>
            </div>

            {/* Compliance Status */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <h2 className="font-semibold text-slate-800 text-sm mb-4">Compliance Status</h2>
              <div className="space-y-3">
                {[
                  { label: 'GSTR-1 (Mar 2026)', status: 'DUE', dueDate: 'Apr 11', color: 'text-amber-600 bg-amber-50' },
                  { label: 'GSTR-3B (Mar 2026)', status: 'DUE', dueDate: 'Apr 20', color: 'text-amber-600 bg-amber-50' },
                  { label: 'TDS (Q4 FY26)', status: 'FILED', dueDate: 'Filed', color: 'text-green-600 bg-green-50' },
                  { label: 'PF Challan (Mar)', status: 'DUE', dueDate: 'Apr 15', color: 'text-red-600 bg-red-50' },
                  { label: 'ESI Challan (Mar)', status: 'DUE', dueDate: 'Apr 21', color: 'text-amber-600 bg-amber-50' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-700">{item.label}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {item.dueDate}
                      </p>
                    </div>
                    <span className={clsx('px-2 py-0.5 rounded text-[11px] font-semibold', item.color)}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drill Down Panel */}
          <DrillDown
            open={!!drillDown}
            onClose={() => setDrillDown(null)}
            title={drillDown?.title || ''}
            subtitle="Click rows to drill further"
            width="lg"
          >
            {drillDown?.type === 'revenue' && <RevenueDrillDown byDept={d.revenue?.byDept || []} ytd={ytdRevenue} />}
            {drillDown?.type === 'ar' && <ARDrillDown />}
            {drillDown?.type === 'claims' && <ClaimsDrillDown />}
            {drillDown?.type === 'cash' && <CashDrillDown />}
            {drillDown?.type === 'ap' && <APDrillDown />}
          </DrillDown>

        </div>{/* end flex-1 */}
        <AnimatePresence>
          {aiOpen && <CFOAIPanel onClose={() => setAiOpen(false)} />}
        </AnimatePresence>
      </div>{/* end flex row */}
    </div>
  );
}

// ─── Drill Down Contents ──────────────────────────────────────────────────────
function RevenueDrillDown({ byDept = [], ytd = 0 }) {
  return (
    <div className="space-y-4">
      <DrillDown.Section title="Revenue by Department (YTD)">
        {byDept.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No revenue recorded yet.</p>
        ) : (
          <>
            {byDept.map((row) => (
              <div key={row.billingType || row.dept} className="py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">{row.dept || row.billing_type}</span>
                  <span className="text-sm font-mono font-semibold text-slate-800">{formatCr(row.revenue)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${row.pct || 0}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{row.pct || 0}% of total</p>
              </div>
            ))}
            <div className="pt-3 border-t border-slate-100 mt-1 flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Total YTD</span>
              <span className="font-mono font-semibold text-slate-800">{formatCr(ytd)}</span>
            </div>
          </>
        )}
      </DrillDown.Section>
    </div>
  );
}

function ARDrillDown() {
  return (
    <div className="space-y-4">
      <DrillDown.Section title="Aging Buckets">
        <DrillDown.Stat label="Current (0 days)" value={formatCr(1200000)} mono badge="40%" badgeColor="green" />
        <DrillDown.Stat label="1–30 days" value={formatCr(800000)} mono badge="27%" badgeColor="amber" />
        <DrillDown.Stat label="31–60 days" value={formatCr(500000)} mono badge="17%" />
        <DrillDown.Stat label="61–90 days" value={formatCr(300000)} mono badge="10%" badgeColor="red" />
        <DrillDown.Stat label="90+ days" value={formatCr(180000)} mono badge="6%" badgeColor="red" />
        <div className="pt-3 border-t border-slate-100 mt-3">
          <DrillDown.Stat label="Total Outstanding" value={formatCr(2980000)} mono />
        </div>
      </DrillDown.Section>
    </div>
  );
}

function ClaimsDrillDown() {
  const claims = [
    { tpa: 'Star Health', pending: 5, amount: 1200000, days: 45 },
    { tpa: 'HDFC Ergo', pending: 3, amount: 800000, days: 32 },
    { tpa: 'ICICI Lombard', pending: 7, amount: 1500000, days: 67 },
    { tpa: 'New India', pending: 2, amount: 450000, days: 28 },
  ];
  return (
    <div className="space-y-4">
      <DrillDown.Section title="Claims by TPA">
        {claims.map((c) => (
          <div key={c.tpa} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-slate-700">{c.tpa}</p>
              <p className="text-xs text-slate-400">{c.pending} claims · avg {c.days} days</p>
            </div>
            <span className={clsx('text-sm font-mono font-semibold', c.days > 60 ? 'text-red-600' : 'text-slate-800')}>
              {formatCr(c.amount)}
            </span>
          </div>
        ))}
      </DrillDown.Section>
    </div>
  );
}

function CashDrillDown() {
  return (
    <div className="space-y-4">
      <DrillDown.Section title="Bank Accounts">
        <DrillDown.Stat label="HDFC Current A/C" value={formatCr(3200000)} mono />
        <DrillDown.Stat label="SBI Savings A/C" value={formatCr(1100000)} mono />
        <DrillDown.Stat label="Petty Cash" value={formatCr(50000)} mono />
        <DrillDown.Stat label="FD (Short-term)" value={formatCr(5000000)} mono />
        <div className="pt-3 border-t border-slate-100 mt-3">
          <DrillDown.Stat label="Total Cash Position" value={formatCr(9350000)} mono />
        </div>
      </DrillDown.Section>
    </div>
  );
}

function APDrillDown() {
  return (
    <div className="space-y-4">
      <DrillDown.Section title="Payables by Category">
        <DrillDown.Stat label="Medical Supplies" value={formatCr(850000)} mono badge="Overdue" badgeColor="red" />
        <DrillDown.Stat label="Pharmacy Stock" value={formatCr(620000)} mono />
        <DrillDown.Stat label="Equipment AMC" value={formatCr(240000)} mono />
        <DrillDown.Stat label="Housekeeping" value={formatCr(180000)} mono badge="Due Soon" badgeColor="amber" />
        <DrillDown.Stat label="IT Services" value={formatCr(95000)} mono />
        <div className="pt-3 border-t border-slate-100 mt-3">
          <DrillDown.Stat label="Total Payable" value={formatCr(1985000)} mono />
        </div>
      </DrillDown.Section>
    </div>
  );
}
