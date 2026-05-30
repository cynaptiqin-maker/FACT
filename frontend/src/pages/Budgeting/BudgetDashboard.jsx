// ─── Budget Dashboard — Enterprise Budget Intelligence Workspace ───────────────
// Green/Emerald theme · Budget vs Actuals · AI-assisted · Department drill-down
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PieChart, TrendingUp, TrendingDown, AlertTriangle, Target,
  Download, Plus, Sparkles, BarChart2, RefreshCw, ChevronRight,
  CheckCircle2, XCircle, Clock, Building2, Zap, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import BudgetAIPanel from './BudgetAIPanel';

// ─── Data derivation helpers ──────────────────────────────────────────────────

function buildKPIData(kpis) {
  if (!kpis) return [];
  const ytdPct = kpis.totalBudget > 0 ? ((kpis.ytdSpend / kpis.totalBudget) * 100).toFixed(1) : '0.0';
  const varPct = kpis.variance_pct ? kpis.variance_pct.toFixed(1) : '0.0';
  return [
    {
      id: 'totalBudget', label: 'Total Budget', value: kpis.totalBudget ?? 0, format: 'lakh',
      trend: 0, trendLabel: kpis.fiscalYearName ?? 'Current FY', color: '#10b981', icon: 'Target',
      sub: kpis.activeBudgetName ?? 'No approved budget', aiFlag: false,
    },
    {
      id: 'ytdSpend', label: 'YTD Spend', value: kpis.ytdSpend ?? 0, format: 'lakh',
      trend: parseFloat(ytdPct), trendLabel: 'of annual budget', color: '#3b82f6', icon: 'TrendingUp',
      sub: `${ytdPct}% of annual budget`, aiFlag: false,
    },
    {
      id: 'variance', label: 'Overall Variance', value: kpis.variance ?? 0, format: 'lakh',
      trend: parseFloat(varPct), trendLabel: 'vs budget', color: '#f59e0b', icon: 'BarChart2',
      sub: `${Math.abs(parseFloat(varPct)).toFixed(1)}% ${parseFloat(varPct) > 0 ? 'over' : 'under'} budget`, aiFlag: true,
    },
    {
      id: 'burnRate', label: 'Burn Rate', value: kpis.burnRate ?? 0, format: 'lakh',
      trend: 0, trendLabel: 'per month avg', color: '#8b5cf6', icon: 'Zap',
      sub: 'Per month avg (last 3m)', aiFlag: true,
    },
    {
      id: 'deptOver', label: 'Depts Over Budget', value: kpis.deptOverBudget ?? 0, format: 'num',
      trend: 0, trendLabel: '', color: '#ef4444', icon: 'AlertTriangle',
      sub: 'departments over budget', aiFlag: false,
    },
  ];
}

function buildDeptChart(varianceLines) {
  if (!varianceLines?.length) return [];
  const byDept = {};
  for (const l of varianceLines) {
    const dept = l.department_name || 'General';
    if (!byDept[dept]) byDept[dept] = { dept, budget: 0, actual: 0 };
    byDept[dept].budget += parseFloat(l.budget_amount ?? 0);
    byDept[dept].actual += parseFloat(l.actual_amount ?? 0);
  }
  return Object.values(byDept)
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 8);
}

function buildCategories(varianceLines) {
  if (!varianceLines?.length) return [];
  const byCategory = {};
  for (const l of varianceLines) {
    const cat = l.category || l.account_name || 'Other';
    if (!byCategory[cat]) byCategory[cat] = { category: cat, allocated: 0, spent: 0 };
    byCategory[cat].allocated += parseFloat(l.budget_amount ?? 0);
    byCategory[cat].spent     += parseFloat(l.actual_amount ?? 0);
  }
  return Object.values(byCategory)
    .sort((a, b) => b.allocated - a.allocated)
    .slice(0, 8)
    .map(c => ({
      ...c,
      status: c.spent > c.allocated * 1.05 ? 'over_budget'
            : c.spent < c.allocated * 0.9  ? 'under_budget'
            : 'on_track',
    }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtL  = n => `₹${(Math.abs(n) / 100000).toFixed(2)}L`;
const fmtPct = (a, b) => b === 0 ? '0.0' : (((a - b) / b) * 100).toFixed(1);

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const ICON_MAP = { Target, TrendingUp, BarChart2, Zap, AlertTriangle, CheckCircle2 };

function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  const isNeg = target < 0;
  const abs = Math.abs(target);
  useMemo(() => {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(abs * e * (isNeg ? -1 : 1));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  return val;
}

function KPICard({ kpi, index }) {
  const animVal = useCountUp(kpi.value, 1000 + index * 70);
  const Icon = ICON_MAP[kpi.icon] ?? Target;
  const NEGATIVE_IDS = new Set(['variance', 'deptOver']);
  const isNegKPI = NEGATIVE_IDS.has(kpi.id);
  const trendUp = kpi.trend > 0;
  const isPositive = isNegKPI ? !trendUp : trendUp;

  const display = () => {
    if (kpi.format === 'lakh') return `${animVal < 0 ? '-' : ''}₹${(Math.abs(animVal) / 100000).toFixed(2)}L`;
    if (kpi.format === 'pct')  return `${animVal.toFixed(1)}%`;
    if (kpi.format === 'num')  return Math.round(Math.abs(animVal)).toLocaleString('en-IN');
    return animVal.toFixed(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.38, ease: 'easeOut' }}
      whileHover={{ y: -3, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
      className="relative flex-none w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 cursor-pointer group overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: kpi.color }} />
      {kpi.aiFlag && (
        <span className="absolute top-3 right-3 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          <Sparkles size={9} />AI
        </span>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}1a` }}>
          <Icon size={15} style={{ color: kpi.color }} />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight pr-6">{kpi.label}</span>
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight mb-0.5">{display()}</div>
      {kpi.sub && <div className="text-[10.5px] text-slate-400 dark:text-slate-500 mb-1.5 truncate">{kpi.sub}</div>}
      <div className={`flex items-center gap-1 text-[11px] font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        <span>{kpi.trend > 0 ? '+' : ''}{kpi.trend}{kpi.format === 'pct' ? 'pp' : '%'} {kpi.trendLabel}</span>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
        style={{ background: `radial-gradient(circle at 80% 20%, ${kpi.color}0e, transparent 70%)` }} />
    </motion.div>
  );
}

// ─── Dept Bar Chart ───────────────────────────────────────────────────────────

function DeptBarChart({ data = [] }) {
  const maxVal = data.length ? Math.max(...data.map(d => Math.max(d.budget, d.actual))) : 1;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Budget vs Actual by Department</h3>
          <p className="text-xs text-slate-400 mt-0.5">YTD Apr–May 2026</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-emerald-400 inline-block" />Budget</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-blue-500 inline-block" />Actual</span>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((d, i) => {
          const budgetW = (d.budget / maxVal) * 100;
          const actualW = (d.actual / maxVal) * 100;
          const over = d.actual > d.budget;
          return (
            <motion.div
              key={d.dept}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="grid grid-cols-[160px_1fr] items-center gap-3"
            >
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{d.dept}</span>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${budgetW}%` }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.7, ease: 'easeOut' }}
                    className="h-1.5 rounded-full bg-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{fmtL(d.budget)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${actualW}%` }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.7, ease: 'easeOut' }}
                    className={`h-1.5 rounded-full ${over ? 'bg-rose-500' : 'bg-blue-500'}`}
                  />
                  <span className={`text-[10px] font-mono whitespace-nowrap ${over ? 'text-rose-500' : 'text-blue-500'}`}>{fmtL(d.actual)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    on_track:    { label: 'On Track',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    over_budget: { label: 'Over Budget',  cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'           },
    under_budget:{ label: 'Under Budget', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400'               },
    warning:     { label: 'Warning',      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'       },
  };
  const s = map[status] ?? map.on_track;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${s.cls}`}>{s.label}</span>;
}

// ─── Budget Categories Table ──────────────────────────────────────────────────

function BudgetTable({ rows = [] }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Budget Categories — Top 8</h3>
        <span className="text-xs text-slate-400">YTD Apr–May 2026</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              {['Category','Allocated','Spent','Remaining','Variance%','Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, i) => {
              const remaining = row.allocated - row.spent;
              const varPct = parseFloat(fmtPct(row.spent, row.allocated));
              return (
                <motion.tr
                  key={row.category}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{row.category}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{fmtL(row.allocated)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-200 font-semibold">{fmtL(row.spent)}</td>
                  <td className={`px-4 py-2.5 font-mono font-semibold ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{remaining < 0 ? '-' : ''}{fmtL(Math.abs(remaining))}</td>
                  <td className={`px-4 py-2.5 font-mono font-bold ${varPct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{varPct > 0 ? '+' : ''}{varPct}%</td>
                  <td className="px-4 py-2.5"><StatusBadge status={row.status} /></td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Utilization Panel ────────────────────────────────────────────────────────

function UtilizationPanel({ rows = [], burnRate = 0 }) {
  const totalBudget = rows.reduce((s, r) => s + r.allocated, 0);
  const totalSpent  = rows.reduce((s, r) => s + r.spent, 0);
  const utilPct     = (totalSpent / totalBudget) * 100;
  const remaining   = totalBudget - totalSpent;

  const segments = [
    { label: 'Spent',          value: totalSpent,  pct: utilPct,              color: '#3b82f6'  },
    { label: 'Remaining',      value: remaining,   pct: 100 - utilPct,        color: '#10b981'  },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-full">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Utilization Summary</h3>

      {/* Donut-style ring using a stacked bar */}
      <div className="relative mb-5">
        <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
          {segments.map(s => (
            <motion.div
              key={s.label}
              initial={{ width: 0 }}
              animate={{ width: `${s.pct}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: s.color }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-slate-400">0%</span>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{utilPct.toFixed(1)}% utilized</span>
          <span className="text-[11px] text-slate-400">100%</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {[
          { label: 'Total Budget',   val: fmtL(totalBudget), color: 'text-slate-700 dark:text-slate-300'   },
          { label: 'YTD Spent',      val: fmtL(totalSpent),  color: 'text-blue-600 dark:text-blue-400'     },
          { label: 'Remaining',      val: fmtL(remaining),   color: remaining < 0 ? 'text-rose-600' : 'text-emerald-600' },
          { label: 'Burn Rate/Month',val: fmtL(burnRate),     color: 'text-purple-600 dark:text-purple-400' },
          { label: 'Months to Go',   val: burnRate > 0 ? (remaining / burnRate).toFixed(1) : '—', color: 'text-amber-600 dark:text-amber-400' },
        ].map(r => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">{r.label}</span>
            <span className={`font-mono font-semibold ${r.color}`}>{r.val}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Category Health</div>
        {[
          { label: 'On Track',    count: rows.filter(r => r.status === 'on_track').length,    color: 'bg-emerald-500' },
          { label: 'Over Budget', count: rows.filter(r => r.status === 'over_budget').length,  color: 'bg-rose-500'    },
          { label: 'Under Budget',count: rows.filter(r => r.status === 'under_budget').length, color: 'bg-sky-500'     },
        ].map(h => (
          <div key={h.label} className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${h.color}`} />
              <span className="text-slate-600 dark:text-slate-400">{h.label}</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{h.count} categories</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BudgetDashboard() {
  const [showAI, setShowAI] = useState(true);
  const queryClient = useQueryClient();

  const kpisQuery = useQuery({
    queryKey: ['budget-kpis'],
    queryFn: () => api.get('/api/budgeting/kpis').then(r => r.data?.data),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const varianceQuery = useQuery({
    queryKey: ['budget-variance'],
    queryFn: () => api.get('/api/budgeting/variance').then(r => r.data?.data),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled: !!kpisQuery.data?.activeBudgetId,
  });

  const kpiData    = useMemo(() => buildKPIData(kpisQuery.data), [kpisQuery.data]);
  const deptChart  = useMemo(() => buildDeptChart(varianceQuery.data?.lines), [varianceQuery.data]);
  const categories = useMemo(() => buildCategories(varianceQuery.data?.lines), [varianceQuery.data]);

  const handleAction = id => {
    if (id === 'new')    { toast.success('New Budget dialog opening…');   return; }
    if (id === 'export') { toast.success('Exporting budget report…');     return; }
    if (id === 'refresh') {
      queryClient.invalidateQueries({ queryKey: ['budget-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['budget-variance'] });
      return;
    }
    if (id === 'ai')     { setShowAI(v => !v);                            return; }
  };

  const isLoading = kpisQuery.isLoading || varianceQuery.isLoading;
  const fyLabel   = kpisQuery.data?.fiscalYearName ?? 'Current FY';

  return (
    <div className="flex flex-col gap-5 min-h-0">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <PieChart size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-tight">Budget Dashboard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{fyLabel} · Budget vs Actuals</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleAction('new')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={13} />New Budget
          </button>
          <button
            onClick={() => handleAction('export')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={13} />Export
          </button>
          <button
            onClick={() => handleAction('refresh')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />Refresh
          </button>
          <button
            onClick={() => handleAction('ai')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${showAI ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Sparkles size={13} />AI Analysis
          </button>
        </div>
      </div>

      {/* ── KPI Ribbon ── */}
      <div className="relative">
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none rounded-r-xl" />
        <ChevronRight size={14} className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-slate-400 animate-pulse" />
        <div className="flex gap-3 overflow-x-auto pb-1 pr-8" style={{ scrollbarWidth: 'none' }}>
          {kpiData.map((kpi, i) => <KPICard key={kpi.id} kpi={kpi} index={i} />)}
        </div>
      </div>

      {/* ── Main content + AI panel ── */}
      <div className="flex gap-4 items-start min-h-0">
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Bar Chart */}
          <DeptBarChart data={deptChart} />

          {/* Table + Utilization */}
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <BudgetTable rows={categories} />
            </div>
            <div className="w-64 flex-none">
              <UtilizationPanel rows={categories} burnRate={kpisQuery.data?.burnRate ?? 0} />
            </div>
          </div>
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {showAI && <BudgetAIPanel onClose={() => setShowAI(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
