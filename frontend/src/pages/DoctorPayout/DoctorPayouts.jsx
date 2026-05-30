// ─── Doctor Payouts — Enterprise Compensation Intelligence Workspace ──────────
// Emerald theme · Real-time · AI-assisted · Deeply cross-module integrated
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote, Plus, CheckSquare, CreditCard, Download, Sparkles,
  ClipboardList, RefreshCw, Wifi, WifiOff, ChevronDown,
  GitMerge, AlertTriangle, TrendingUp, Award,
} from 'lucide-react';

import DPKPIRibbon      from './DP/DPKPIRibbon';
import DPFilterBar      from './DP/DPFilterBar';
import DPGrid           from './DP/DPGrid';
import DPDetailDrawer   from './DP/DPDetailDrawer';
import DPAIPanel        from './DP/DPAIPanel';
import DPRevenuePanel   from './DP/DPRevenuePanel';
import DPTreasuryPanel  from './DP/DPTreasuryPanel';
import DPIncentivePanel from './DP/DPIncentivePanel';
import DPAuditTimeline  from './DP/DPAuditTimeline';
import { MOCK_PAYOUTS } from './DP/DPConstants';

// ─── Bottom Panel Tabs ────────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'revenue',   label: 'Revenue Analytics',    icon: TrendingUp   },
  { id: 'treasury',  label: 'Treasury & Settlement',icon: Banknote     },
  { id: 'incentive', label: 'Incentive Performance',icon: Award        },
  { id: 'audit',     label: 'Audit & Workflow',     icon: ClipboardList},
];

// ─── Header Quick Actions ─────────────────────────────────────────────────────
const HEADER_ACTIONS = [
  { id: 'generate',  label: 'Generate Payout',  icon: Plus         },
  { id: 'approve',   label: 'Approve Payout',   icon: CheckSquare  },
  { id: 'transfer',  label: 'Process Transfer', icon: CreditCard   },
  { id: 'export',    label: 'Export',           icon: Download     },
  { id: 'reconcile', label: 'Reconcile',        icon: GitMerge     },
  { id: 'ai',        label: 'AI Analysis',      icon: Sparkles     },
  { id: 'audit',     label: 'Audit Logs',       icon: ClipboardList},
];

// ─── Filter Logic ─────────────────────────────────────────────────────────────
function useFilters() {
  const [filters, setFilters] = useState({
    search: '', status: 'all', payoutType: 'all', department: 'all',
    branch: 'all', employmentType: 'all', paymentStatus: 'all', riskLevel: 'all',
  });

  const onFilterChange = useCallback((key, value) => {
    if (key === 'reset') {
      setFilters({
        search: '', status: 'all', payoutType: 'all', department: 'all',
        branch: 'all', employmentType: 'all', paymentStatus: 'all', riskLevel: 'all',
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  return { filters, onFilterChange };
}

function applyFilters(payouts, f) {
  return payouts.filter(p => {
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = [p.id, p.doctorName, p.specialty, p.department, p.branch, p.payoutType]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.status         !== 'all' && p.workflowState !== f.status)           return false;
    if (f.payoutType     !== 'all' && p.payoutType    !== f.payoutType)        return false;
    if (f.department     !== 'all' && p.department    !== f.department)        return false;
    if (f.branch         !== 'all' && p.branch        !== f.branch)            return false;
    if (f.employmentType !== 'all' && p.employmentType !== f.employmentType)   return false;
    if (f.paymentStatus  !== 'all' && p.paymentStatus !== f.paymentStatus)     return false;
    if (f.riskLevel      !== 'all' && p.riskLevel     !== f.riskLevel.toUpperCase()) return false;
    return true;
  });
}

// ─── Summary Ribbon ───────────────────────────────────────────────────────────
function SummaryRibbon({ payouts, liveSync }) {
  const pendingCount = payouts.filter(p => p.workflowState === 'UNDER_REVIEW').length;
  const riskCount    = payouts.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length;
  const totalNet     = payouts.reduce((s, p) => s + p.netPayout, 0);
  const paidNet      = payouts.filter(p => p.paymentStatus === 'PAID').reduce((s, p) => s + p.netPayout, 0);
  const fmtL         = n => `₹${(n / 100000).toFixed(2)}L`;

  return (
    <div className="flex items-center gap-4 text-xs flex-wrap mt-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400 dark:text-slate-500">Total Liability</span>
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmtL(totalNet)}</span>
      </div>
      <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400 dark:text-slate-500">Paid</span>
        <span className="font-mono font-bold text-green-600 dark:text-green-400">{fmtL(paidNet)}</span>
      </div>
      <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400 dark:text-slate-500">Pending Review</span>
        <span className={`font-mono font-bold ${pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>{pendingCount}</span>
      </div>
      {riskCount > 0 && (
        <>
          <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
            <AlertTriangle size={11} />
            <span>{riskCount} risk alert{riskCount !== 1 ? 's' : ''}</span>
          </div>
        </>
      )}
      <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
      <div className={`flex items-center gap-1 ${liveSync ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400'}`}>
        {liveSync ? <Wifi size={11} /> : <WifiOff size={11} />}
        <span className="text-[10.5px]">{liveSync ? 'Live' : 'Offline'}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DoctorPayouts() {
  const { filters, onFilterChange } = useFilters();
  const [selectedRows, setSelectedRows] = useState([]);
  const [detailPayout, setDetailPayout] = useState(null);
  const [showAI, setShowAI]             = useState(true);
  const [bottomTab, setBottomTab]       = useState('revenue');
  const [showBottom, setShowBottom]     = useState(true);
  const [expandedRow, setExpandedRow]   = useState(null);
  const [liveSync, setLiveSync]         = useState(true);
  const [actionsOpen, setActionsOpen]   = useState(false);

  const filteredPayouts = useMemo(() => applyFilters(MOCK_PAYOUTS, filters), [filters]);

  const activeFilterCount = useMemo(() =>
    Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== 'all').length +
    (filters.search ? 1 : 0),
  [filters]);

  const handleSelect = useCallback((id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRows(prev => prev.length === filteredPayouts.length ? [] : filteredPayouts.map(p => p.id));
  }, [filteredPayouts]);

  const handleRowAction = useCallback((action, payout) => {
    if (action === 'view') setDetailPayout(payout);
  }, []);

  const handleBulkAction = useCallback((action) => {
    if (action === 'deselect') setSelectedRows([]);
  }, []);

  const handleExpandRow = useCallback((id) => {
    setExpandedRow(prev => prev === id ? null : id);
  }, []);

  const handleKpiClick = useCallback((kpiId) => {
    const MAP = {
      pendingPayouts:  () => onFilterChange('paymentStatus', 'UNPAID'),
      riskAlerts:      () => onFilterChange('riskLevel', 'HIGH'),
      approvedPayouts: () => onFilterChange('status', 'APPROVED'),
      insuranceLinked: () => onFilterChange('payoutType', 'INSURANCE_LINKED'),
    };
    MAP[kpiId]?.();
  }, [onFilterChange]);

  return (
    <div className="flex flex-col min-h-0">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Banknote size={20} className="text-emerald-600 dark:text-emerald-400" />
            Doctor Payouts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calculate, approve, reconcile, and optimize enterprise healthcare doctor compensation in real time.
          </p>
          <SummaryRibbon payouts={filteredPayouts} liveSync={liveSync} />
        </div>

        <div className="flex items-center gap-2 flex-none flex-wrap justify-end">
          <button
            onClick={() => setLiveSync(o => !o)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              liveSync
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            {liveSync ? <Wifi size={12} /> : <WifiOff size={12} />}
            {liveSync ? 'Live' : 'Offline'}
          </button>

          <button
            onClick={() => setShowAI(o => !o)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              showAI
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles size={12} />
            AI
          </button>

          <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
            <Plus size={13} />
            Generate Payout
          </button>

          <div className="relative">
            <button
              onClick={() => setActionsOpen(o => !o)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-emerald-300 transition-all"
            >
              Actions <ChevronDown size={11} className={`transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {actionsOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setActionsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    className="absolute right-0 top-full mt-1 z-30 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    {HEADER_ACTIONS.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActionsOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Icon size={12} className="text-slate-400 flex-none" />
                        {label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Main Content: Workspace + AI Panel ───────────────────── */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* ── Workspace ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          <DPKPIRibbon onKpiClick={handleKpiClick} />

          <DPFilterBar
            filters={filters}
            onFilterChange={onFilterChange}
            selectedCount={selectedRows.length}
            onBulkAction={handleBulkAction}
            activeFilterCount={activeFilterCount}
          />

          <DPGrid
            payouts={filteredPayouts}
            selectedRows={selectedRows}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onAction={handleRowAction}
            expandedRow={expandedRow}
            onExpand={handleExpandRow}
          />

          {/* ── Bottom Analytics ─────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-2">
              <div className="flex flex-1 overflow-x-auto">
                {BOTTOM_TABS.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setBottomTab(t.id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                        bottomTab === t.id
                          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <Icon size={12} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setShowBottom(o => !o)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors flex-none"
              >
                <ChevronDown size={14} className={`transition-transform ${showBottom ? '' : 'rotate-180'}`} />
              </button>
            </div>

            <AnimatePresence>
              {showBottom && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={bottomTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        {bottomTab === 'revenue'   && <DPRevenuePanel  />}
                        {bottomTab === 'treasury'  && <DPTreasuryPanel />}
                        {bottomTab === 'incentive' && <DPIncentivePanel/>}
                        {bottomTab === 'audit'     && <DPAuditTimeline />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right AI Panel ───────────────────────────────────────── */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 320 }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="flex-none overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
              style={{ maxHeight: 'calc(100vh - 160px)', position: 'sticky', top: 0, alignSelf: 'flex-start' }}
            >
              <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
                <DPAIPanel onClose={() => setShowAI(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail Drawer ────────────────────────────────────────── */}
      <DPDetailDrawer
        payout={detailPayout}
        onClose={() => setDetailPayout(null)}
      />
    </div>
  );
}
