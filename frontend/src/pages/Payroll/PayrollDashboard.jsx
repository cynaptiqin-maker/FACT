// ─── Payroll Dashboard — Enterprise Payroll Intelligence Workspace ────────────
// Indigo/Purple theme · Real-time · AI-assisted · Full cycle visibility
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, IndianRupee, Clock, CheckCircle2, ShieldCheck,
  TrendingUp, TrendingDown, Download, RefreshCw, Plus,
  ChevronRight, Sparkles, Calendar, FileText, BarChart2,
  AlertTriangle, Play, X, Building2, Landmark,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PayrollAIPanel from './PayrollAIPanel';
import AccountingLineage from '@components/shared/AccountingLineage';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const KPI_DATA = [
  {
    id: 'totalPayroll',  label: 'Total Payroll',      value: 38420000, format: 'lakh',
    trend: +3.8, trendLabel: 'vs last month', color: '#6366f1', sub: 'May 2026 gross liability',
    aiFlag: false,
  },
  {
    id: 'empPaid',       label: 'Employees Paid',     value: 312,      format: 'num',
    trend: +4,   trendLabel: 'new hires paid', color: '#8b5cf6', sub: 'of 318 active employees',
    aiFlag: false,
  },
  {
    id: 'pendingAppr',   label: 'Pending Approvals',  value: 6,        format: 'num',
    trend: -2,   trendLabel: 'cleared today',   color: '#f59e0b', sub: 'Awaiting CFO sign-off',
    aiFlag: false,
  },
  {
    id: 'tdsDeducted',   label: 'TDS Deducted',       value: 2860000,  format: 'lakh',
    trend: +1.2, trendLabel: 'MoM', color: '#3b82f6', sub: '7.4% of gross payroll',
    aiFlag: true,
  },
  {
    id: 'pfContrib',     label: 'PF Contribution',    value: 2296000,  format: 'lakh',
    trend: +3.8, trendLabel: 'in line', color: '#10b981', sub: 'Employer + Employee share',
    aiFlag: false,
  },
  {
    id: 'netDisbursed',  label: 'Net Disbursed',       value: 33264000, format: 'lakh',
    trend: +3.6, trendLabel: 'vs last month', color: '#14b8a6', sub: 'After all deductions',
    aiFlag: false,
  },
];

const PAYROLL_RUNS = [
  { runId:'PR-2026-05', period:'May 2026',   emp:312, gross:38420000, deduct:5156000, net:33264000, status:'processing', date:'21 May 2026' },
  { runId:'PR-2026-04', period:'Apr 2026',   emp:308, gross:36980000, deduct:4962000, net:32018000, status:'completed',  date:'20 Apr 2026' },
  { runId:'PR-2026-03', period:'Mar 2026',   emp:305, gross:36200000, deduct:4862000, net:31338000, status:'completed',  date:'19 Mar 2026' },
  { runId:'PR-2026-02', period:'Feb 2026',   emp:301, gross:35400000, deduct:4755000, net:30645000, status:'completed',  date:'18 Feb 2026' },
  { runId:'PR-2026-01', period:'Jan 2026',   emp:298, gross:34800000, deduct:4671000, net:30129000, status:'completed',  date:'20 Jan 2026' },
  { runId:'PR-2025-12', period:'Dec 2025',   emp:295, gross:38200000, deduct:5129000, net:33071000, status:'completed',  date:'18 Dec 2025' },
];

const DEPT_PAYROLL = [
  { dept: 'Clinical Operations', amount: 12480000, headcount: 98 },
  { dept: 'Nursing Staff',       amount: 9840000,  headcount: 112 },
  { dept: 'Administration',      amount: 4620000,  headcount: 42 },
  { dept: 'Pharmacy',            amount: 3920000,  headcount: 28 },
  { dept: 'Diagnostics',         amount: 3580000,  headcount: 22 },
  { dept: 'IT & Systems',        amount: 2480000,  headcount: 14 },
  { dept: 'Facilities',          amount: 980000,   headcount: 11 },
  { dept: 'HR & Training',       amount: 520000,   headcount: 5  },
];

const CALENDAR_ITEMS = [
  { date:'25 May', label:'Payroll freeze deadline',  type:'warning'  },
  { date:'28 May', label:'TDS challan submission',   type:'info'     },
  { date:'31 May', label:'Net salary disbursement',  type:'success'  },
  { date:'07 Jun', label:'PF & ESI remittance due',  type:'warning'  },
  { date:'15 Jun', label:'Form 16 Part-A generation',type:'info'     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtL = n => `₹${(n / 100000).toFixed(2)}L`;

const STATUS_MAP = {
  completed:  { label: 'Completed',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  processing: { label: 'Processing', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'             },
  pending:    { label: 'Pending',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'         },
  failed:     { label: 'Failed',     cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'             },
};

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  useMemo(() => {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(target * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  return val;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ kpi, index }) {
  const animVal = useCountUp(kpi.value, 1000 + index * 70);
  const NEGATIVE_IDS = new Set(['pendingAppr']);
  const isNegKPI = NEGATIVE_IDS.has(kpi.id);
  const trendUp  = kpi.trend > 0;
  const isPositive = isNegKPI ? !trendUp : trendUp;

  const display = () => {
    if (kpi.format === 'lakh') return `₹${(animVal / 100000).toFixed(2)}L`;
    if (kpi.format === 'pct')  return `${animVal.toFixed(1)}%`;
    if (kpi.format === 'num')  return Math.round(animVal).toLocaleString('en-IN');
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
        <span className="absolute top-3 right-3 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
          <Sparkles size={9} />AI
        </span>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}1a` }}>
          <IndianRupee size={14} style={{ color: kpi.color }} />
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

// ─── Payroll Runs Table ───────────────────────────────────────────────────────

function PayrollRunsTable({ onViewGL }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Recent Payroll Runs</h3>
        <span className="text-xs text-slate-400">Last 6 months</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              {['Run #','Period','Employees','Gross Pay','Deductions','Net Pay','Status','Date','GL'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {PAYROLL_RUNS.map((run, i) => {
              const s = STATUS_MAP[run.status] ?? STATUS_MAP.pending;
              return (
                <motion.tr
                  key={run.runId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{run.runId}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{run.period}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-mono">{run.emp.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-200 font-semibold">{fmtL(run.gross)}</td>
                  <td className="px-4 py-2.5 font-mono text-rose-600 dark:text-rose-400">{fmtL(run.deduct)}</td>
                  <td className="px-4 py-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{fmtL(run.net)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{run.date}</td>
                  <td className="px-4 py-2.5">
                    {run.status === 'completed' && (
                      <button
                        onClick={() => onViewGL(run.runId)}
                        title="View GL Journals"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Landmark size={13} />
                      </button>
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

// ─── Department Payroll Bar Chart ─────────────────────────────────────────────

function DeptPayrollChart() {
  const maxAmt = Math.max(...DEPT_PAYROLL.map(d => d.amount));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Department Payroll Breakdown</h3>
        <span className="text-xs text-slate-400">May 2026</span>
      </div>
      <div className="space-y-3">
        {DEPT_PAYROLL.map((d, i) => {
          const pct = (d.amount / maxAmt) * 100;
          return (
            <motion.div
              key={d.dept}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.06 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-slate-600 dark:text-slate-400 w-44 truncate flex-none">{d.dept}</span>
              <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
              <div className="text-right w-28 flex-none">
                <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">{fmtL(d.amount)}</span>
                <span className="text-[10px] text-slate-400 ml-1.5">({d.headcount} emp)</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Payroll Calendar ─────────────────────────────────────────────────────────

function PayrollCalendar() {
  const typeColors = {
    warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/20',
    info:    'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
    success: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  };
  const typeText = {
    warning: 'text-amber-700 dark:text-amber-400',
    info:    'text-blue-700 dark:text-blue-400',
    success: 'text-emerald-700 dark:text-emerald-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={15} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Upcoming Payroll Calendar</h3>
      </div>
      <div className="space-y-2.5">
        {CALENDAR_ITEMS.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className={`flex items-start gap-3 p-2.5 rounded-lg border-l-2 ${typeColors[item.type]}`}
          >
            <span className={`text-[10px] font-bold font-mono mt-0.5 whitespace-nowrap ${typeText[item.type]}`}>{item.date}</span>
            <span className={`text-xs ${typeText[item.type]}`}>{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions({ navigate }) {
  const actions = [
    { label: 'Run Payroll',   icon: Play,      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',          action: () => navigate('/payroll/run') },
    { label: 'View Payslips', icon: FileText,  color: 'bg-purple-600 hover:bg-purple-700 text-white',          action: () => navigate('/payroll/payslips') },
    { label: 'Export Report', icon: Download,  color: 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700', action: () => toast.success('Exporting payroll report…') },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Quick Actions</h3>
      <div className="flex gap-2.5 flex-wrap">
        {actions.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={a.action}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm ${a.color}`}
            >
              <Icon size={13} />{a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pending Approvals Banner ─────────────────────────────────────────────────

function PendingBanner({ count }) {
  if (count === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
    >
      <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-none" />
      <p className="text-xs text-amber-800 dark:text-amber-300">
        <span className="font-bold">{count} payroll runs</span> are awaiting CFO approval for May 2026 disbursement.
      </p>
      <button
        onClick={() => toast.success('Opening approval queue…')}
        className="ml-auto flex-none px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
      >
        Review Now
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PayrollDashboard() {
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = useState(false);
  const [glRunId, setGlRunId] = useState(null);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-tight">Payroll Dashboard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">FY 2026-27 · 318 active employees · May 2026 cycle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/payroll/run')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus size={13} />Run Payroll
          </button>
          <button
            onClick={() => toast.success('Exporting payroll data…')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={13} />Export
          </button>
          <button
            onClick={() => toast('Refreshing payroll data…', { icon: '🔄' })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={13} />Refresh
          </button>
          <button
            onClick={() => setAiOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${aiOpen ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Sparkles size={13} />AI Insights
          </button>
        </div>
      </div>

      {/* ── Pending Banner ── */}
      <PendingBanner count={6} />

      {/* ── KPI Ribbon ── */}
      <div className="relative">
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none rounded-r-xl" />
        <ChevronRight size={14} className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-slate-400 animate-pulse" />
        <div className="flex gap-3 overflow-x-auto pb-1 pr-8" style={{ scrollbarWidth: 'none' }}>
          {KPI_DATA.map((kpi, i) => <KPICard key={kpi.id} kpi={kpi} index={i} />)}
        </div>
      </div>

      {/* ── Main Content + AI Panel ── */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <QuickActions navigate={navigate} />
          <PayrollRunsTable onViewGL={setGlRunId} />
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <DeptPayrollChart />
            </div>
            <div className="w-72 flex-none">
              <PayrollCalendar />
            </div>
          </div>
        </div>
        <AnimatePresence>
          {aiOpen && <PayrollAIPanel onClose={() => setAiOpen(false)} />}
        </AnimatePresence>
      </div>

      {/* GL Journals slide-over */}
      <AnimatePresence>
        {glRunId && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setGlRunId(null)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[560px] max-w-full bg-white shadow-2xl flex flex-col"
            >
              <AccountingLineage
                sourceModule="payroll"
                sourceId={glRunId}
                title={`Payroll Run — ${glRunId}`}
                onClose={() => setGlRunId(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
