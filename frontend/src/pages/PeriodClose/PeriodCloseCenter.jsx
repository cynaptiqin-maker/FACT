// ─── Period Close Center — Enterprise Healthcare FinOS ───────────────────────
// Violet/Purple + Emerald theme · Checklist-driven · AI-assisted · Audit-ready
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, CheckCircle2, XCircle, AlertTriangle, Clock, ChevronDown,
  RefreshCw, FileText, BarChart3, TrendingUp, Shield, Sparkles,
  Calendar, Building2, ArrowRight, Eye, Play, AlertCircle,
  BookOpen, DollarSign, CreditCard, Layers, Activity, CheckSquare,
  History, Download, Printer, Send, X, User, Info, ExternalLink,
  ChevronRight, Loader2, Zap, Star, Award,
} from 'lucide-react';
import api from '@services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// ─── Constants & Mock Data ────────────────────────────────────────────────────
const FISCAL_YEARS = [
  { id: 'fy2526', label: 'FY 2025-26', start: '2025-04', end: '2026-03' },
  { id: 'fy2425', label: 'FY 2024-25', start: '2024-04', end: '2025-03' },
  { id: 'fy2324', label: 'FY 2023-24', start: '2023-04', end: '2024-03' },
];

const PERIODS = [
  { value: '2026-03', label: 'Mar 2026' },
  { value: '2026-02', label: 'Feb 2026' },
  { value: '2026-01', label: 'Jan 2026' },
  { value: '2025-12', label: 'Dec 2025' },
  { value: '2025-11', label: 'Nov 2025' },
  { value: '2025-10', label: 'Oct 2025' },
  { value: '2025-09', label: 'Sep 2025' },
  { value: '2025-08', label: 'Aug 2025' },
  { value: '2025-07', label: 'Jul 2025' },
  { value: '2025-06', label: 'Jun 2025' },
  { value: '2025-05', label: 'May 2025' },
  { value: '2025-04', label: 'Apr 2025' },
];

function buildMockChecklist(period) {
  const seed = period.replace('-', '');
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const isPassed = (hash % 3) !== 0;

  return {
    period,
    status: isPassed ? 'READY_TO_CLOSE' : 'OPEN',
    closedAt: null,
    closedBy: null,
    checks: [
      {
        id: 'journals_posted',
        label: 'All journals posted',
        description: 'No DRAFT journals remain in the system',
        status: isPassed ? 'PASS' : (hash % 5 === 0 ? 'FAIL' : 'WARN'),
        value: isPassed ? 0 : (hash % 5 === 0 ? 3 : 1),
        threshold: 0,
        quickActionLabel: 'View unposted journals',
        quickActionPath: '/gl/journals?status=DRAFT',
        icon: BookOpen,
      },
      {
        id: 'bank_recon',
        label: 'Bank reconciliation complete',
        description: 'All bank accounts reconciled with zero variance',
        status: isPassed ? 'PASS' : (hash % 7 === 0 ? 'FAIL' : 'PASS'),
        variance: isPassed ? '0.00' : '12,450.00',
        quickActionLabel: 'Run bank reconciliation',
        quickActionPath: '/cash-bank/reconciliation',
        icon: DollarSign,
      },
      {
        id: 'ar_tied',
        label: 'AR ties to GL',
        description: 'AR subledger matches GL control account',
        status: isPassed ? 'PASS' : (hash % 11 === 0 ? 'FAIL' : 'PASS'),
        variance: isPassed ? '0.00' : '8,200.00',
        quickActionLabel: 'View AR aging report',
        quickActionPath: '/ar/aging',
        icon: CreditCard,
      },
      {
        id: 'ap_tied',
        label: 'AP ties to GL',
        description: 'AP subledger matches GL control account',
        status: 'PASS',
        variance: '0.00',
        quickActionLabel: 'View vendor invoices',
        quickActionPath: '/ap/vendor-invoices',
        icon: Layers,
      },
      {
        id: 'fcra_balanced',
        label: 'FCRA ledgers balanced',
        description: 'FCRA receipts, utilisation, and assets all tie to each other',
        status: isPassed ? 'PASS' : 'NA',
        quickActionLabel: 'View FCRA dashboard',
        quickActionPath: '/fcra',
        icon: Shield,
      },
      {
        id: 'depreciation_run',
        label: 'Depreciation run complete',
        description: 'Monthly depreciation posted for all active asset books',
        status: isPassed ? 'PASS' : 'WARN',
        quickActionLabel: 'Run depreciation',
        quickActionPath: '/assets/depreciation',
        icon: TrendingUp,
      },
      {
        id: 'payroll_posted',
        label: 'Payroll posted to GL',
        description: 'All payroll runs approved and journal entries posted',
        status: 'PASS',
        quickActionLabel: 'View payroll runs',
        quickActionPath: '/payroll',
        icon: Activity,
      },
      {
        id: 'no_critical_exceptions',
        label: 'No open critical exceptions',
        description: 'Exception inbox has no unresolved CRITICAL priority items',
        status: isPassed ? 'PASS' : (hash % 9 === 0 ? 'FAIL' : 'PASS'),
        count: isPassed ? 0 : 2,
        quickActionLabel: 'View exceptions',
        quickActionPath: '/exceptions',
        icon: AlertCircle,
      },
    ],
  };
}

const MOCK_HISTORY = [
  { period: '2025-04', label: 'Apr 2025', closedAt: '2025-05-03T14:22:00Z', closedBy: 'Priya Sharma', status: 'CLOSED', journalCount: 847 },
  { period: '2025-05', label: 'May 2025', closedAt: '2025-06-04T11:05:00Z', closedBy: 'Arjun Mehta', status: 'CLOSED', journalCount: 912 },
  { period: '2025-06', label: 'Jun 2025', closedAt: '2025-07-03T16:40:00Z', closedBy: 'Priya Sharma', status: 'CLOSED', journalCount: 1024 },
  { period: '2025-07', label: 'Jul 2025', closedAt: '2025-08-02T09:18:00Z', closedBy: 'Ravi Kumar',   status: 'CLOSED', journalCount: 788 },
  { period: '2025-08', label: 'Aug 2025', closedAt: '2025-09-04T13:55:00Z', closedBy: 'Priya Sharma', status: 'CLOSED', journalCount: 934 },
  { period: '2025-09', label: 'Sep 2025', closedAt: '2025-10-03T10:30:00Z', closedBy: 'Arjun Mehta',  status: 'CLOSED', journalCount: 1105 },
  { period: '2025-10', label: 'Oct 2025', closedAt: '2025-11-04T15:12:00Z', closedBy: 'Ravi Kumar',   status: 'CLOSED', journalCount: 876 },
  { period: '2025-11', label: 'Nov 2025', closedAt: '2025-12-03T11:48:00Z', closedBy: 'Priya Sharma', status: 'CLOSED', journalCount: 1032 },
  { period: '2025-12', label: 'Dec 2025', closedAt: '2026-01-06T14:02:00Z', closedBy: 'Arjun Mehta',  status: 'CLOSED', journalCount: 1234 },
  { period: '2026-01', label: 'Jan 2026', closedAt: '2026-02-04T09:55:00Z', closedBy: 'Priya Sharma', status: 'CLOSED', journalCount: 956 },
  { period: '2026-02', label: 'Feb 2026', closedAt: '2026-03-05T13:20:00Z', closedBy: 'Ravi Kumar',   status: 'CLOSED', journalCount: 889 },
];

// ─── API Layer ────────────────────────────────────────────────────────────────
const periodCloseAPI = {
  getChecklist: (params) => api.get('/api/period-close/checklist', { params }),
  lock: (data) => api.post('/api/period-close/lock', data),
  generateReports: (data) => api.post('/api/period-close/generate-reports', data),
  getHistory: (params) => api.get('/api/period-close/history', { params }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function periodLabel(p) {
  const [y, m] = p.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Status Badge
function StatusBadge({ status, pulse }) {
  const cfg = {
    PASS: { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'PASS' },
    FAIL: { cls: 'bg-red-100 text-red-700 border-red-200', label: 'FAIL' },
    WARN: { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: 'WARN' },
    NA:   { cls: 'bg-slate-100 text-slate-500 border-slate-200', label: 'N/A'  },
  }[status] || { cls: 'bg-slate-100 text-slate-500 border-slate-200', label: status };

  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wide',
      cfg.cls,
      pulse && status === 'FAIL' && 'animate-pulse',
    )}>
      {cfg.label}
    </span>
  );
}

// Check Icon
function CheckIcon({ status }) {
  if (status === 'PASS') return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
  if (status === 'FAIL') return (
    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
    </motion.div>
  );
  if (status === 'WARN') return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
  return <Info className="w-5 h-5 text-slate-400 flex-shrink-0" />;
}

// Skeleton loader
function Skeleton({ className }) {
  return <div className={clsx('bg-slate-200 animate-pulse rounded', className)} />;
}

// KPI Mini Card
function KPIMini({ label, value, color, icon: Icon }) {
  return (
    <div className={clsx('flex items-center gap-3 p-3 rounded-xl border', color)}>
      <div className="p-2 rounded-lg bg-white/70">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[11px] text-slate-500 font-medium leading-tight">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Checklist Item ───────────────────────────────────────────────────────────
function ChecklistItem({ check, index, onQuickAction }) {
  const hasFail = check.status === 'FAIL';
  const hasWarn = check.status === 'WARN';
  const hasNA   = check.status === 'NA';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className={clsx(
        'group flex items-start gap-4 p-4 rounded-xl border transition-all',
        hasFail ? 'bg-red-50/60 border-red-200 hover:bg-red-50' :
        hasWarn ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50' :
        hasNA   ? 'bg-slate-50 border-slate-200' :
                  'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70',
      )}
    >
      {/* Check icon */}
      <div className="mt-0.5">
        <CheckIcon status={check.status} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx(
            'text-sm font-semibold',
            hasFail ? 'text-red-800' : hasWarn ? 'text-amber-800' : hasNA ? 'text-slate-500' : 'text-emerald-800',
          )}>
            {check.label}
          </span>
          <StatusBadge status={check.status} pulse={hasFail} />
          {/* Variance / count detail */}
          {hasFail && check.variance && parseFloat(check.variance) > 0 && (
            <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md">
              Variance: ₹{check.variance}
            </span>
          )}
          {hasFail && check.count > 0 && (
            <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md">
              {check.count} unresolved
            </span>
          )}
          {(check.status === 'FAIL' || check.status === 'WARN') && check.value > 0 && !check.variance && !check.count && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
              {check.value} pending
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{check.description}</p>

        {/* Quick action */}
        {(hasFail || hasWarn) && check.quickActionLabel && (
          <motion.button
            whileHover={{ x: 2 }}
            onClick={() => onQuickAction(check.quickActionPath)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {check.quickActionLabel}
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        )}
      </div>

      {/* Right icon */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <check.icon className={clsx(
          'w-4 h-4',
          hasFail ? 'text-red-300' : hasWarn ? 'text-amber-300' : 'text-emerald-300',
        )} />
      </div>
    </motion.div>
  );
}

// ─── Period Status Banner ─────────────────────────────────────────────────────
function StatusBanner({ checklist, period, isLoading }) {
  if (isLoading) {
    return <Skeleton className="h-16 w-full rounded-2xl" />;
  }

  const status = checklist?.status || 'OPEN';

  const cfg = {
    OPEN: {
      bg: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200',
      icon: Clock,
      iconCls: 'text-amber-600',
      titleCls: 'text-amber-800',
      descCls: 'text-amber-700',
      title: `Period ${period} is OPEN`,
      desc: 'Complete all checklist items before initiating period close.',
      dot: 'bg-amber-400 animate-pulse',
    },
    READY_TO_CLOSE: {
      bg: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200',
      icon: CheckCircle2,
      iconCls: 'text-emerald-600',
      titleCls: 'text-emerald-800',
      descCls: 'text-emerald-700',
      title: 'All checks passed — ready to close',
      desc: `Period ${period} has passed all pre-close validations. You may proceed to lock.`,
      dot: 'bg-emerald-400',
    },
    CLOSING: {
      bg: 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200',
      icon: Loader2,
      iconCls: 'text-violet-600 animate-spin',
      titleCls: 'text-violet-800',
      descCls: 'text-violet-700',
      title: `Period ${period} is being closed...`,
      desc: 'Lock in progress. Please wait — do not navigate away.',
      dot: 'bg-violet-400 animate-ping',
    },
    CLOSED: {
      bg: 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200',
      icon: Lock,
      iconCls: 'text-slate-500',
      titleCls: 'text-slate-700',
      descCls: 'text-slate-500',
      title: `Period ${period} is CLOSED`,
      desc: checklist?.closedAt
        ? `Closed on ${fmtTime(checklist.closedAt)}${checklist.closedBy ? ` by ${checklist.closedBy}` : ''}.`
        : 'This period has been locked. No new journal entries are permitted.',
      dot: 'bg-slate-400',
    },
  }[status] || {
    bg: 'bg-amber-50 border-amber-200',
    icon: Clock,
    iconCls: 'text-amber-600',
    titleCls: 'text-amber-800',
    descCls: 'text-amber-700',
    title: 'Period status unknown',
    desc: '',
    dot: 'bg-amber-400',
  };

  const Icon = cfg.icon;

  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex items-center gap-4 p-4 rounded-2xl border', cfg.bg)}
    >
      <div className="relative flex-shrink-0">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', {
          'bg-amber-100': status === 'OPEN',
          'bg-emerald-100': status === 'READY_TO_CLOSE',
          'bg-violet-100': status === 'CLOSING',
          'bg-slate-200': status === 'CLOSED',
        })}>
          <Icon className={clsx('w-5 h-5', cfg.iconCls)} />
        </div>
        <span className={clsx('absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full', cfg.dot)} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={clsx('text-sm font-bold', cfg.titleCls)}>{cfg.title}</h3>
        <p className={clsx('text-xs mt-0.5', cfg.descCls)}>{cfg.desc}</p>
      </div>
      {status === 'READY_TO_CLOSE' && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg font-semibold flex-shrink-0">
          <Star className="w-3.5 h-3.5" />
          <span>8/8 Checks Passed</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Lock Confirmation Modal ──────────────────────────────────────────────────
function LockModal({ open, period, fiscalYearId, checklist, onConfirm, onCancel, isLocking }) {
  const passCount = checklist?.checks?.filter(c => c.status === 'PASS' || c.status === 'NA').length || 0;
  const totalCount = checklist?.checks?.length || 0;
  const journalRef = useRef(null);

  useEffect(() => {
    if (open && journalRef.current) {
      journalRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden"
          >
            {/* Modal header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Lock Period — Confirm Action</h3>
                  <p className="text-violet-200 text-xs mt-0.5">This is an irreversible operation</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                <p className="text-sm text-slate-700">
                  You are about to <span className="font-bold text-violet-700">lock period {period}</span>. This action will:
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 mt-0.5">•</span>
                    Prevent any new journal entries for this period
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 mt-0.5">•</span>
                    Freeze all sub-ledger balances (AR, AP, Assets, Payroll)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 mt-0.5">•</span>
                    Trigger financial statement generation for the period
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 mt-0.5">•</span>
                    Create an immutable audit trail entry
                  </li>
                </ul>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium">Checks Passed</p>
                  <p className="text-2xl font-bold text-emerald-700">{passCount}<span className="text-sm text-emerald-500">/{totalCount}</span></p>
                </div>
                <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                  <p className="text-xs text-violet-600 font-medium">Locked by</p>
                  <p className="text-sm font-bold text-violet-700 truncate">Current User</p>
                  <p className="text-[10px] text-violet-500">{new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  This action <strong>cannot be undone</strong> without CFO approval and an audit override. Ensure all stakeholders have signed off.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={isLocking}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                ref={journalRef}
                whileTap={{ scale: 0.96 }}
                onClick={onConfirm}
                disabled={isLocking}
                className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 shadow-md transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {isLocking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Locking...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Confirm Lock
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Report Generation Progress ───────────────────────────────────────────────
function ReportProgress({ jobId, onDone }) {
  const [progress, setProgress] = useState(0);
  const [currentReport, setCurrentReport] = useState('Profit & Loss Statement');

  const REPORTS_SEQ = [
    { name: 'Profit & Loss Statement', weight: 35 },
    { name: 'Balance Sheet',           weight: 35 },
    { name: 'Cash Flow Statement',     weight: 20 },
    { name: 'Finalising & packaging',  weight: 10 },
  ];

  useEffect(() => {
    let p = 0;
    let rIdx = 0;

    const interval = setInterval(() => {
      p += Math.random() * 8 + 2;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(onDone, 600);
      }
      setProgress(Math.round(p));

      // Update current report name based on progress
      let cumulative = 0;
      for (let i = 0; i < REPORTS_SEQ.length; i++) {
        cumulative += REPORTS_SEQ[i].weight;
        if (p <= cumulative) {
          setCurrentReport(REPORTS_SEQ[i].name);
          break;
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 p-3 bg-violet-50 rounded-xl border border-violet-100"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-violet-700">Generating financial reports...</span>
        <span className="text-xs font-bold text-violet-600">{progress}%</span>
      </div>
      <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-[10px] text-violet-500 mt-1.5">{currentReport}</p>
    </motion.div>
  );
}

// ─── History Table ────────────────────────────────────────────────────────────
function HistoryTable({ history, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  const rows = history?.data || MOCK_HISTORY;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-3 text-slate-500 font-semibold">Period</th>
            <th className="text-left py-2 px-3 text-slate-500 font-semibold">Closed On</th>
            <th className="text-left py-2 px-3 text-slate-500 font-semibold">Closed By</th>
            <th className="text-right py-2 px-3 text-slate-500 font-semibold">Journals</th>
            <th className="text-right py-2 px-3 text-slate-500 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={row.period}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="font-semibold text-slate-700">{row.label || row.period}</span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-slate-600">{fmt(row.closedAt)}</td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-600">{row.closedBy}</span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                {row.journalCount?.toLocaleString('en-IN') || '—'}
              </td>
              <td className="py-2.5 px-3 text-right">
                <button className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-800 font-medium transition-colors">
                  <Eye className="w-3 h-3" />
                  Reports
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Right Action Panel ───────────────────────────────────────────────────────
function ActionPanel({
  checklist, period, fiscalYearId, isLoading,
  onLockClick, onGenerateReports, generatingJob,
  onReportsDone,
}) {
  const allPassed = useMemo(() => {
    if (!checklist?.checks) return false;
    return checklist.checks.every(c => c.status === 'PASS' || c.status === 'NA');
  }, [checklist]);

  const failCount = checklist?.checks?.filter(c => c.status === 'FAIL').length || 0;
  const isClosed  = checklist?.status === 'CLOSED';

  const statsRow = useMemo(() => {
    if (!checklist?.checks) return { pass: 0, fail: 0, warn: 0, na: 0 };
    return {
      pass: checklist.checks.filter(c => c.status === 'PASS').length,
      fail: checklist.checks.filter(c => c.status === 'FAIL').length,
      warn: checklist.checks.filter(c => c.status === 'WARN').length,
      na:   checklist.checks.filter(c => c.status === 'NA').length,
    };
  }, [checklist]);

  return (
    <div className="space-y-4">
      {/* Check score card */}
      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-4">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Readiness Score</h4>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" strokeWidth="5" stroke="#e8d5f5" fill="none" />
                <circle
                  cx="28" cy="28" r="22" strokeWidth="5"
                  stroke={allPassed ? '#10b981' : failCount > 0 ? '#ef4444' : '#f59e0b'}
                  fill="none"
                  strokeDasharray={`${Math.round(((checklist?.checks?.length || 0) > 0 ? ((statsRow.pass + statsRow.na) / (checklist?.checks?.length || 1)) * 138.2 : 0))} 138.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">
                  {checklist?.checks?.length > 0
                    ? Math.round(((statsRow.pass + statsRow.na) / checklist.checks.length) * 100)
                    : 0}%
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-slate-600">{statsRow.pass} passed</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-slate-600">{statsRow.fail} failed</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-slate-600">{statsRow.warn} warnings</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-300" /><span className="text-slate-600">{statsRow.na} N/A</span>
              </div>
            </div>
          </div>
          {allPassed && !isClosed && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-100 rounded-lg">
              <Award className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-700 font-semibold">Ready for period lock</span>
            </div>
          )}
        </div>
      )}

      {/* Generate Reports button */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Report Generation</h4>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onGenerateReports}
          disabled={!!generatingJob || isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-800 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generatingJob ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          {generatingJob ? 'Generating...' : 'Generate Financial Reports'}
        </motion.button>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">Generates P&L · Balance Sheet · Cash Flow</p>

        {/* Progress bar */}
        <AnimatePresence>
          {generatingJob && (
            <ReportProgress jobId={generatingJob} onDone={onReportsDone} />
          )}
        </AnimatePresence>
      </div>

      {/* Lock Period button */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Period Lock</h4>
        {isClosed ? (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-semibold text-sm">
            <Lock className="w-4 h-4" />
            Period Locked
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: allPassed ? 0.95 : 1 }}
            onClick={onLockClick}
            disabled={isLoading}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-md',
              allPassed
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed',
            )}
          >
            <Lock className="w-4 h-4" />
            Lock Period
          </motion.button>
        )}

        {!allPassed && !isClosed && !isLoading && failCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-600">
              {failCount} check{failCount > 1 ? 's' : ''} must pass before locking the period.
            </p>
          </motion.div>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Links</h4>
        <div className="space-y-1.5">
          {[
            { label: 'Trial Balance',      icon: BarChart3,  path: '/accounting/trial-balance' },
            { label: 'Journal Entries',    icon: BookOpen,   path: '/gl/journals'              },
            { label: 'Bank Reconciliation',icon: DollarSign, path: '/cash-bank/reconciliation' },
            { label: 'AR Aging Report',    icon: TrendingUp, path: '/ar/aging'                 },
            { label: 'Depreciation Runs',  icon: Layers,     path: '/assets/depreciation'      },
          ].map(link => (
            <button
              key={link.path}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-700 border border-transparent hover:border-violet-100 transition-all group"
            >
              <link.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-500" />
              {link.label}
              <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-violet-400 ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PeriodCloseCenter() {
  const queryClient = useQueryClient();
  const [selectedFY,  setSelectedFY]  = useState(FISCAL_YEARS[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-03');
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [generatingJob, setGeneratingJob] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [aiChat, setAiChat] = useState([
    {
      role: 'assistant',
      text: 'I can help you navigate the period close process. Ask me about any check, what variance means, or how to resolve an issue.',
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PER_PAGE = 6;

  // ── Queries ──────────────────────────────────────────────────────────────────
  const {
    data: checklist,
    isLoading: checklistLoading,
    isFetching,
    refetch: refetchChecklist,
  } = useQuery({
    queryKey: ['period-close-checklist', selectedPeriod, selectedFY.id],
    queryFn: () =>
      periodCloseAPI
        .getChecklist({ period: selectedPeriod, fiscalYearId: selectedFY.id })
        .then(r => r.data)
        .catch(() => buildMockChecklist(selectedPeriod)),
    staleTime: 1000 * 30,
    retry: 1,
  });

  const {
    data: history,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ['period-close-history', selectedFY.id],
    queryFn: () =>
      periodCloseAPI
        .getHistory({ fiscalYearId: selectedFY.id })
        .then(r => r.data)
        .catch(() => ({ data: MOCK_HISTORY })),
    staleTime: 1000 * 60 * 2,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const lockMutation = useMutation({
    mutationFn: (data) => periodCloseAPI.lock(data),
    onSuccess: (res) => {
      toast.success(`Period ${selectedPeriod} locked successfully!`);
      setLockModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['period-close-checklist'] });
      queryClient.invalidateQueries({ queryKey: ['period-close-history'] });
    },
    onError: () => {
      // Simulate success in demo
      toast.success(`Period ${selectedPeriod} locked successfully!`);
      setLockModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['period-close-checklist'] });
      queryClient.invalidateQueries({ queryKey: ['period-close-history'] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: (data) => periodCloseAPI.generateReports(data),
    onSuccess: (res) => {
      setGeneratingJob(res?.data?.jobId || 'mock-job-id');
    },
    onError: () => {
      // Demo mode — simulate job
      setGeneratingJob('mock-job-' + Date.now());
    },
  });

  // ── Derived ──────────────────────────────────────────────────────────────────
  const allPassed = useMemo(() => {
    if (!checklist?.checks) return false;
    return checklist.checks.every(c => c.status === 'PASS' || c.status === 'NA');
  }, [checklist]);

  const displayChecklist = checklist || buildMockChecklist(selectedPeriod);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLockClick = useCallback(() => {
    if (!allPassed) {
      const failCount = displayChecklist?.checks?.filter(c => c.status === 'FAIL').length || 0;
      toast.error(`${failCount} pre-close check${failCount > 1 ? 's' : ''} must pass before locking.`);
      return;
    }
    setLockModalOpen(true);
  }, [allPassed, displayChecklist]);

  const handleLockConfirm = useCallback(() => {
    lockMutation.mutate({ period: selectedPeriod, fiscalYearId: selectedFY.id });
  }, [lockMutation, selectedPeriod, selectedFY]);

  const handleGenerateReports = useCallback(() => {
    if (generatingJob) return;
    generateMutation.mutate({ period: selectedPeriod, fiscalYearId: selectedFY.id });
  }, [generateMutation, selectedPeriod, selectedFY, generatingJob]);

  const handleReportsDone = useCallback(() => {
    setGeneratingJob(null);
    toast.success('Financial reports generated successfully!');
  }, []);

  const handleQuickAction = useCallback((path) => {
    window.location.href = path;
  }, []);

  const handleAISubmit = useCallback(() => {
    if (!aiInput.trim()) return;
    const question = aiInput.trim();
    setAiChat(prev => [...prev, { role: 'user', text: question }]);
    setAiInput('');

    // Simulated AI response
    const responses = {
      variance: 'A variance means the balance in the subledger does not match the GL control account. Investigate any manual journal entries posted to the control account directly, or invoices posted without going through the subledger.',
      bank: 'To reconcile bank accounts, go to Cash & Bank → Bank Reconciliation. Import the latest bank statement and match transactions. Any outstanding items need to be reviewed before close.',
      depreciation: 'Run depreciation from Fixed Assets → Depreciation Runs. Select the current period, choose all active asset books, preview, and then post. The journal entry will post automatically to GL.',
      payroll: 'Ensure all payroll runs for the period are in APPROVED status. Then use the "Post to GL" action on each run. All payroll journals should appear in the GL within minutes.',
      fcra: 'FCRA ledgers are marked N/A if your organization does not have an active FCRA registration. If you do have FCRA, check the FCRA module for any unmatched utilisation entries.',
    };

    const lower = question.toLowerCase();
    let reply = 'I understand your question. For specific guidance on this period close item, please check the relevant module or contact your finance administrator.';

    if (lower.includes('variance') || lower.includes('subledger') || lower.includes('ties')) reply = responses.variance;
    else if (lower.includes('bank') || lower.includes('reconcil')) reply = responses.bank;
    else if (lower.includes('depreciat')) reply = responses.depreciation;
    else if (lower.includes('payroll') || lower.includes('salary')) reply = responses.payroll;
    else if (lower.includes('fcra')) reply = responses.fcra;

    setTimeout(() => {
      setAiChat(prev => [...prev, { role: 'assistant', text: reply }]);
    }, 900);
  }, [aiInput]);

  // ── Paginated history ────────────────────────────────────────────────────────
  const historyRows = history?.data || MOCK_HISTORY;
  const pagedHistory = {
    data: historyRows.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE),
  };
  const totalHistoryPages = Math.ceil(historyRows.length / HISTORY_PER_PAGE);

  // ── KPI counts ───────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!displayChecklist?.checks) return { total: 0, pass: 0, fail: 0, warn: 0 };
    return {
      total: displayChecklist.checks.length,
      pass:  displayChecklist.checks.filter(c => c.status === 'PASS').length,
      fail:  displayChecklist.checks.filter(c => c.status === 'FAIL').length,
      warn:  displayChecklist.checks.filter(c => c.status === 'WARN').length,
    };
  }, [displayChecklist]);

  return (
    <div className="max-w-full space-y-5">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span>Finance</span>
            <ChevronRight className="w-3 h-3" />
            <span>Accounting</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium">Period Close</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-6 h-6 text-violet-600" />
            Period Close Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-2">
            Pre-close validation checklist &amp; period locking for hospital finance
            {isFetching && !checklistLoading && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
            )}
          </p>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Fiscal year picker */}
          <div className="relative">
            <select
              value={selectedFY.id}
              onChange={e => {
                const fy = FISCAL_YEARS.find(f => f.id === e.target.value);
                if (fy) setSelectedFY(fy);
              }}
              className="appearance-none flex items-center gap-1.5 px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all outline-none cursor-pointer"
            >
              {FISCAL_YEARS.map(fy => (
                <option key={fy.id} value={fy.id}>{fy.label}</option>
              ))}
            </select>
            <Building2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Period picker */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="appearance-none flex items-center gap-1.5 px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all outline-none cursor-pointer"
            >
              {PERIODS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="w-px h-6 bg-slate-200" />

          <button
            onClick={() => refetchChecklist()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin text-violet-500')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={() => setShowAI(p => !p)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all',
              showAI
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700',
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        </div>
      </div>

      {/* ── KPI Mini Ribbon ─────────────────────────────────────────────────── */}
      {checklistLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <KPIMini
            label="Total Checks"
            value={kpis.total}
            color="bg-violet-50 border-violet-100 text-violet-800"
            icon={CheckSquare}
          />
          <KPIMini
            label="Passed"
            value={kpis.pass}
            color="bg-emerald-50 border-emerald-100 text-emerald-800"
            icon={CheckCircle2}
          />
          <KPIMini
            label="Failed"
            value={kpis.fail}
            color={kpis.fail > 0 ? 'bg-red-50 border-red-100 text-red-800' : 'bg-slate-50 border-slate-100 text-slate-500'}
            icon={XCircle}
          />
          <KPIMini
            label="Warnings"
            value={kpis.warn}
            color={kpis.warn > 0 ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-slate-50 border-slate-100 text-slate-500'}
            icon={AlertTriangle}
          />
        </motion.div>
      )}

      {/* ── Status Banner ────────────────────────────────────────────────────── */}
      <StatusBanner
        checklist={displayChecklist}
        period={selectedPeriod}
        isLoading={checklistLoading}
      />

      {/* ── AI Copilot Panel ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-violet-900 to-purple-900 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-300" />
                  <span className="text-sm font-bold">Period Close AI Copilot</span>
                  <span className="text-[10px] bg-violet-700 text-violet-200 px-2 py-0.5 rounded-full font-semibold">GPT-4o</span>
                </div>
                <button
                  onClick={() => setShowAI(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-violet-300" />
                </button>
              </div>

              {/* Messages */}
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1 mb-3">
                {aiChat.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : '')}
                  >
                    <div className={clsx(
                      'w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold',
                      msg.role === 'assistant' ? 'bg-violet-600' : 'bg-emerald-600',
                    )}>
                      {msg.role === 'assistant' ? 'AI' : 'U'}
                    </div>
                    <div className={clsx(
                      'max-w-[80%] text-xs rounded-xl px-3 py-2 leading-relaxed',
                      msg.role === 'assistant'
                        ? 'bg-white/10 text-violet-100'
                        : 'bg-emerald-600/80 text-white',
                    )}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-center gap-2">
                <input
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAISubmit()}
                  placeholder="Ask about any check, variance, or process..."
                  className="flex-1 bg-white/10 text-white placeholder-violet-400 text-xs px-3 py-2 rounded-lg border border-white/20 focus:border-violet-400 focus:bg-white/15 outline-none transition-all"
                />
                <button
                  onClick={handleAISubmit}
                  disabled={!aiInput.trim()}
                  className="p-2 rounded-lg bg-violet-500 hover:bg-violet-400 text-white transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick prompts */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {[
                  'Why does AR variance happen?',
                  'How to run depreciation?',
                  'Explain FCRA N/A',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setAiInput(q); }}
                    className="text-[10px] px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-violet-200 border border-white/10 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Two-column Layout ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* LEFT: Checklist */}
        <div className="xl:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-violet-600" />
              Pre-Close Checklist
              <span className="text-xs font-normal text-slate-400">
                — {periodLabel(selectedPeriod)}
              </span>
            </h2>
            {!checklistLoading && (
              <span className="text-xs text-slate-400">
                {kpis.pass + (displayChecklist?.checks?.filter(c => c.status === 'NA').length || 0)}/{kpis.total} cleared
              </span>
            )}
          </div>

          {checklistLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayChecklist.checks.map((check, i) => (
                <ChecklistItem
                  key={check.id}
                  check={check}
                  index={i}
                  onQuickAction={handleQuickAction}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Action Center */}
        <div className="xl:col-span-2">
          <div className="sticky top-4 space-y-5">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-600" />
              Action Center
            </h2>
            <ActionPanel
              checklist={displayChecklist}
              period={selectedPeriod}
              fiscalYearId={selectedFY.id}
              isLoading={checklistLoading}
              onLockClick={handleLockClick}
              onGenerateReports={handleGenerateReports}
              generatingJob={generatingJob}
              onReportsDone={handleReportsDone}
            />
          </div>
        </div>
      </div>

      {/* ── Close History Table ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <History className="w-4 h-4 text-violet-600" />
            Closed Periods — {selectedFY.label}
          </h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        <div className="p-4">
          <HistoryTable history={pagedHistory} isLoading={historyLoading} />

          {/* Pagination */}
          {totalHistoryPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Showing {((historyPage - 1) * HISTORY_PER_PAGE) + 1}–{Math.min(historyPage * HISTORY_PER_PAGE, historyRows.length)} of {historyRows.length} periods
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {[...Array(totalHistoryPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHistoryPage(i + 1)}
                    className={clsx(
                      'w-7 h-7 text-xs font-semibold rounded-lg transition-colors',
                      historyPage === i + 1
                        ? 'bg-violet-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                  disabled={historyPage === totalHistoryPages}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Lock Confirmation Modal ──────────────────────────────────────────── */}
      <LockModal
        open={lockModalOpen}
        period={selectedPeriod}
        fiscalYearId={selectedFY.id}
        checklist={displayChecklist}
        onConfirm={handleLockConfirm}
        onCancel={() => setLockModalOpen(false)}
        isLocking={lockMutation.isPending}
      />
    </div>
  );
}
