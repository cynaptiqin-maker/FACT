// ─── Budget Variance — Variance Analysis Intelligence Workspace ───────────────
// Green/Emerald theme · Dept drill-down · Trend simulation · Reforecast
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Download, RefreshCw, Sparkles, Filter, ChevronUp, ChevronDown,
  ArrowUpRight, ArrowDownRight, Flag, X, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const KPI_DATA = [
  {
    id: 'totalVar',   label: 'Total Variance',       value: -1260000, format: 'lakh',
    trend: -0.6, trendLabel: 'vs last month', color: '#f59e0b', sub: '₹-12.6L YTD',      aiFlag: true,
  },
  {
    id: 'overCount',  label: 'Over-Budget Items',    value: 3,        format: 'num',
    trend: +1,   trendLabel: 'new this month', color: '#ef4444', sub: 'of 12 departments', aiFlag: false,
  },
  {
    id: 'underCount', label: 'Under-Budget Items',   value: 5,        format: 'num',
    trend: +2,   trendLabel: 'improved', color: '#10b981', sub: 'Freeable ₹18.4L',  aiFlag: false,
  },
  {
    id: 'criticalVar',label: 'Critical Variances',   value: 2,        format: 'num',
    trend: 0,    trendLabel: 'unchanged', color: '#dc2626', sub: '>10% deviation',  aiFlag: true,
  },
  {
    id: 'reforecast', label: 'Reforecast Required',  value: 4,        format: 'num',
    trend: +1,   trendLabel: 'pending HOD sign-off', color: '#8b5cf6', sub: 'Dept action needed', aiFlag: false,
  },
];

const DEPTS = ['All','Clinical Operations','Nursing Staff','Administration','Pharmacy',
               'Diagnostics','IT & Systems','Facilities','HR & Training'];

const PERIODS = ['All Periods','Apr 2026','May 2026','Mar 2026','Feb 2026','Jan 2026'];

const VARIANCE_TYPES = ['All Types','Over Budget','Under Budget','Critical','On Track'];

const RAW_VARIANCE_DATA = [
  { dept:'Clinical Operations', budget:14200000, actual:13450000, trend:'down',  actionFlag:false, reforecast:false  },
  { dept:'Nursing Staff',       budget:9800000,  actual:10620000, trend:'up',    actionFlag:true,  reforecast:true   },
  { dept:'Administration',      budget:6200000,  actual:6010000,  trend:'flat',  actionFlag:false, reforecast:false  },
  { dept:'Pharmacy',            budget:5400000,  actual:5850000,  trend:'up',    actionFlag:true,  reforecast:true   },
  { dept:'Diagnostics',         budget:4800000,  actual:4320000,  trend:'down',  actionFlag:false, reforecast:false  },
  { dept:'IT & Systems',        budget:3100000,  actual:3380000,  trend:'up',    actionFlag:true,  reforecast:true   },
  { dept:'Facilities',          budget:2800000,  actual:2650000,  trend:'flat',  actionFlag:false, reforecast:false  },
  { dept:'HR & Training',       budget:2200000,  actual:1860000,  trend:'down',  actionFlag:false, reforecast:false  },
  { dept:'Medical Consumables', budget:6800000,  actual:7420000,  trend:'up',    actionFlag:true,  reforecast:true   },
  { dept:'Miscellaneous',       budget:900000,   actual:790000,   trend:'flat',  actionFlag:false, reforecast:false  },
];

// month labels for trend bars
const MONTH_LABELS = ['Dec','Jan','Feb','Mar','Apr','May'];

// simulated 6-month variance data (₹ in lakhs, negative = over budget)
const MONTHLY_VARIANCE = [
  [3.2,  -4.1, 1.8,  -2.5, 5.1,  -8.6],  // Clinical Operations
  [-2.4, -3.1, -5.2, -6.8, -7.2, -8.2],  // Nursing Staff
  [1.4,  2.1,  3.0,  2.8,  1.9,  1.9],   // Administration
  [0.8,  1.2,  -1.0, -2.3, -2.8, -4.5],  // Pharmacy
  [2.2,  3.8,  4.1,  4.8,  5.6,  4.8],   // Diagnostics
  [-0.4, -0.8, -1.2, -1.8, -2.2, -2.8],  // IT & Systems
  [1.1,  1.4,  1.2,  1.5,  1.5,  1.5],   // Facilities
  [2.4,  2.8,  3.0,  2.9,  3.4,  3.4],   // HR & Training
  [-1.2, -2.4, -3.8, -4.1, -4.9, -6.2],  // Medical Consumables
  [0.4,  0.6,  0.8,  1.0,  1.1,  1.1],   // Miscellaneous
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtL     = n => `₹${(Math.abs(n) / 100000).toFixed(2)}L`;
const varAmt   = row => row.actual - row.budget;
const varPct   = row => row.budget === 0 ? 0 : ((row.actual - row.budget) / row.budget) * 100;
const isOver   = row => row.actual > row.budget;
const isCrit   = row => Math.abs(varPct(row)) > 10;

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  const abs = Math.abs(target);
  const neg = target < 0;
  useMemo(() => {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(abs * e * (neg ? -1 : 1));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  return val;
}

function KPICard({ kpi, index }) {
  const animVal = useCountUp(kpi.value, 1000 + index * 70);
  const NEGATIVE_IDS = new Set(['totalVar', 'overCount', 'criticalVar', 'reforecast']);
  const isNegKPI = NEGATIVE_IDS.has(kpi.id);
  const trendUp  = kpi.trend > 0;
  const isPositive = isNegKPI ? !trendUp : trendUp;

  const display = () => {
    if (kpi.format === 'lakh') return `${animVal < 0 ? '-' : '+'}₹${(Math.abs(animVal) / 100000).toFixed(2)}L`;
    if (kpi.format === 'pct')  return `${animVal.toFixed(1)}%`;
    if (kpi.format === 'num')  return Math.round(Math.abs(animVal)).toLocaleString('en-IN');
    return animVal.toFixed(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.38, ease: 'easeOut' }}
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
          <BarChart2 size={14} style={{ color: kpi.color }} />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight pr-6">{kpi.label}</span>
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight mb-0.5">{display()}</div>
      {kpi.sub && <div className="text-[10.5px] text-slate-400 dark:text-slate-500 mb-1.5 truncate">{kpi.sub}</div>}
      <div className={`flex items-center gap-1 text-[11px] font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        <span>{kpi.trend > 0 ? '+' : ''}{kpi.trend} {kpi.trendLabel}</span>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
        style={{ background: `radial-gradient(circle at 80% 20%, ${kpi.color}0e, transparent 70%)` }} />
    </motion.div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function VarBadge({ row }) {
  const pct = varPct(row);
  const over = isOver(row);
  const crit = isCrit(row);
  if (crit && over)  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"><AlertTriangle size={10}/>Critical</span>;
  if (over)          return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">Over Budget</span>;
  if (Math.abs(pct) < 2) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">On Track</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Under Budget</span>;
}

// ─── Trend Mini Bars ──────────────────────────────────────────────────────────

function TrendSparkline({ rowIndex }) {
  const data = MONTHLY_VARIANCE[rowIndex] ?? [];
  const max  = Math.max(...data.map(Math.abs));
  return (
    <div className="flex items-end gap-0.5 h-6">
      {data.map((v, i) => (
        <div
          key={i}
          title={`${MONTH_LABELS[i]}: ${v > 0 ? '+' : ''}${v}L`}
          className={`w-2 rounded-sm ${v >= 0 ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-rose-400 dark:bg-rose-500'}`}
          style={{ height: `${Math.max(4, (Math.abs(v) / max) * 24)}px` }}
        />
      ))}
    </div>
  );
}

// ─── 6-Month Variance Trend Chart ─────────────────────────────────────────────

function VarianceTrendChart() {
  const totals = MONTH_LABELS.map((_, mi) =>
    MONTHLY_VARIANCE.reduce((sum, arr) => sum + (arr[mi] ?? 0), 0)
  );
  const maxAbs = Math.max(...totals.map(Math.abs), 1);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">6-Month Aggregate Variance Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Positive = under budget · Negative = over budget · ₹ Lakhs</p>
        </div>
      </div>
      <div className="flex items-end justify-around gap-2 h-32">
        {totals.map((v, i) => {
          const heightPct = (Math.abs(v) / maxAbs) * 100;
          const positive  = v >= 0;
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <span className={`text-[10px] font-mono font-semibold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {positive ? '+' : ''}{v.toFixed(1)}L
              </span>
              <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(6, heightPct * 0.8)}px` }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                  className={`w-full rounded-t-sm ${positive ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-rose-400 dark:bg-rose-500'}`}
                />
              </div>
              <span className="text-[10px] text-slate-400">{MONTH_LABELS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Filters Bar ──────────────────────────────────────────────────────────────

function FiltersBar({ dept, setDept, period, setPeriod, varType, setVarType, onReset }) {
  return (
    <div className="flex items-center gap-3 flex-wrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
      <Filter size={14} className="text-slate-400 flex-none" />
      <select
        value={dept} onChange={e => setDept(e.target.value)}
        className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {DEPTS.map(d => <option key={d}>{d}</option>)}
      </select>
      <select
        value={period} onChange={e => setPeriod(e.target.value)}
        className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {PERIODS.map(p => <option key={p}>{p}</option>)}
      </select>
      <select
        value={varType} onChange={e => setVarType(e.target.value)}
        className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {VARIANCE_TYPES.map(v => <option key={v}>{v}</option>)}
      </select>
      <button
        onClick={onReset}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        <RotateCcw size={11} />Reset
      </button>
    </div>
  );
}

// ─── Variance Table ───────────────────────────────────────────────────────────

function VarianceTable({ rows }) {
  const [sort, setSort] = useState({ col: 'varPct', dir: 'desc' });

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let av, bv;
      if (sort.col === 'varPct')   { av = Math.abs(varPct(a)); bv = Math.abs(varPct(b)); }
      else if (sort.col === 'varAmt') { av = Math.abs(varAmt(a)); bv = Math.abs(varAmt(b)); }
      else if (sort.col === 'budget') { av = a.budget; bv = b.budget; }
      else if (sort.col === 'actual') { av = a.actual; bv = b.actual; }
      else { av = a.dept; bv = b.dept; return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av); }
      return sort.dir === 'asc' ? av - bv : bv - av;
    });
    return copy;
  }, [rows, sort]);

  const Th = ({ col, children }) => (
    <th
      className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 select-none"
      onClick={() => setSort(s => ({ col, dir: s.col === col && s.dir === 'desc' ? 'asc' : 'desc' }))}
    >
      <span className="flex items-center gap-1">
        {children}
        {sort.col === col ? (sort.dir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : null}
      </span>
    </th>
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Department Variance Analysis</h3>
        <span className="text-xs text-slate-400">{sorted.length} departments</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              <Th col="dept">Department</Th>
              <Th col="budget">Budget</Th>
              <Th col="actual">Actual</Th>
              <Th col="varAmt">Variance (₹)</Th>
              <Th col="varPct">Variance %</Th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Trend</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Status</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((row, i) => {
              const va = varAmt(row);
              const vp = varPct(row);
              const origIdx = RAW_VARIANCE_DATA.findIndex(r => r.dept === row.dept);
              return (
                <motion.tr
                  key={row.dept}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{row.dept}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400">{fmtL(row.budget)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-200 font-semibold">{fmtL(row.actual)}</td>
                  <td className={`px-4 py-2.5 font-mono font-bold ${va > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {va > 0 ? '+' : ''}{fmtL(va)}
                  </td>
                  <td className={`px-4 py-2.5 font-mono font-bold ${vp > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    <span className="flex items-center gap-0.5">
                      {vp > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {Math.abs(vp).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <TrendSparkline rowIndex={origIdx === -1 ? i : origIdx} />
                  </td>
                  <td className="px-4 py-2.5"><VarBadge row={row} /></td>
                  <td className="px-4 py-2.5">
                    {row.actionFlag && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[10.5px]">
                        <Flag size={10} />Review
                      </span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BudgetVariance() {
  const [dept,    setDept]    = useState('All');
  const [period,  setPeriod]  = useState('All Periods');
  const [varType, setVarType] = useState('All Types');

  const filteredRows = useMemo(() => {
    let rows = [...RAW_VARIANCE_DATA];
    if (dept !== 'All') rows = rows.filter(r => r.dept === dept);
    if (varType === 'Over Budget')   rows = rows.filter(r => isOver(r));
    if (varType === 'Under Budget')  rows = rows.filter(r => !isOver(r));
    if (varType === 'Critical')      rows = rows.filter(r => isCrit(r));
    if (varType === 'On Track')      rows = rows.filter(r => Math.abs(varPct(r)) < 2);
    return rows;
  }, [dept, varType]);

  const handleReset = () => { setDept('All'); setPeriod('All Periods'); setVarType('All Types'); };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <BarChart2 size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-tight">Budget Variance Analysis</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">FY 2026-27 · Department drill-down · YTD Apr–May 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success('Reforecast wizard opening…')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <RotateCcw size={13} />Reforecast
          </button>
          <button
            onClick={() => toast.success('Exporting variance report…')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={13} />Export
          </button>
          <button
            onClick={() => toast('Refreshing…', { icon: '🔄' })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={13} />Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {KPI_DATA.map((kpi, i) => <KPICard key={kpi.id} kpi={kpi} index={i} />)}
      </div>

      {/* ── Trend Chart ── */}
      <VarianceTrendChart />

      {/* ── Filter Bar ── */}
      <FiltersBar
        dept={dept} setDept={setDept}
        period={period} setPeriod={setPeriod}
        varType={varType} setVarType={setVarType}
        onReset={handleReset}
      />

      {/* ── Variance Table ── */}
      <VarianceTable rows={filteredRows} />

      {/* ── Reforecast Banner ── */}
      {filteredRows.filter(r => r.reforecast).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
        >
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-none" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {filteredRows.filter(r => r.reforecast).length} departments require reforecast sign-off
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {filteredRows.filter(r => r.reforecast).map(r => r.dept).join(' · ')} — HOD review pending before next budget cycle.
            </p>
          </div>
          <button
            onClick={() => toast.success('Reforecast requests sent to HODs')}
            className="ml-auto flex-none px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
          >
            Notify HODs
          </button>
        </motion.div>
      )}
    </div>
  );
}
