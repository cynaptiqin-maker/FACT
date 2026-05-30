// Insurance Claims Dashboard — world-class enterprise healthcare revenue cycle intelligence
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Plus, Send, Upload, AlertTriangle, CreditCard, Download,
  Sparkles, ClipboardList, RefreshCw, Wifi, WifiOff,
  ChevronDown, PanelRightOpen, PanelRightClose,
  BarChart2, Zap, GitMerge, Activity, TrendingDown,
} from 'lucide-react';

import ICKPIRibbon          from './IC/ICKPIRibbon';
import ICFilterBar          from './IC/ICFilterBar';
import ICGrid               from './IC/ICGrid';
import ICDetailDrawer       from './IC/ICDetailDrawer';
import ICAIPanel            from './IC/ICAIPanel';
import ICLeakageAlerts      from './IC/ICLeakageAlerts';
import ICLifecycleDashboard from './IC/ICLifecycleDashboard';
import ICDenialAnalytics    from './IC/ICDenialAnalytics';
import ICSettlementPanel    from './IC/ICSettlementPanel';
import { MOCK_CLAIMS }      from './IC/ICConstants';

// ─── Bottom tabs ──────────────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'lifecycle',  label: 'Claims Lifecycle',      icon: Activity    },
  { id: 'denial',     label: 'Denial Analytics',      icon: TrendingDown},
  { id: 'settlement', label: 'Settlement & Recovery', icon: GitMerge    },
  { id: 'leakage',    label: 'Revenue Leakage',       icon: Zap         },
];

// ─── Header action buttons ────────────────────────────────────────────────────
const HEADER_ACTIONS_SECONDARY = [
  { id: 'submit',  label: 'Submit Claim',      icon: Send         },
  { id: 'upload',  label: 'Upload Docs',       icon: Upload       },
  { id: 'denial',  label: 'Process Denial',    icon: AlertTriangle},
  { id: 'settle',  label: 'Record Settlement', icon: CreditCard   },
  { id: 'export',  label: 'Export',            icon: Download     },
  { id: 'ai',      label: 'AI Analysis',       icon: Sparkles     },
  { id: 'audit',   label: 'Audit Logs',        icon: ClipboardList},
];

// ─── Filter logic ─────────────────────────────────────────────────────────────
function useFilters() {
  const [filters, setFilters] = useState({
    search: '', status: 'all', claimType: 'all', tpa: 'all',
    aging: 'all', risk: 'all', department: 'all',
    settlement: 'all', branch: 'all',
  });

  const onFilterChange = useCallback((key, value) => {
    if (key === 'reset') {
      setFilters({
        search: '', status: 'all', claimType: 'all', tpa: 'all',
        aging: 'all', risk: 'all', department: 'all', settlement: 'all', branch: 'all',
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  return { filters, onFilterChange };
}

function applyFilters(claims, f) {
  return claims.filter(c => {
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = [c.id, c.patientName, c.uhid, c.invoiceNo, c.tpa, c.department, c.doctor, c.branch, c.diagnosis]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.status     !== 'all' && c.status          !== f.status)              return false;
    if (f.claimType  !== 'all' && c.claimType        !== f.claimType)           return false;
    if (f.tpa        !== 'all' && c.tpa              !== f.tpa)                 return false;
    if (f.risk       !== 'all' && c.riskLevel        !== f.risk.toUpperCase())  return false;
    if (f.department !== 'all' && c.department       !== f.department)          return false;
    if (f.settlement !== 'all' && c.settlementStatus !== f.settlement)          return false;
    if (f.branch     !== 'all' && c.branch           !== f.branch)              return false;
    if (f.aging      !== 'all') {
      const d = c.agingDays;
      if (f.aging === 'current'  && (d < 0  || d > 30))  return false;
      if (f.aging === 'days31'   && (d < 31 || d > 60))  return false;
      if (f.aging === 'days61'   && (d < 61 || d > 90))  return false;
      if (f.aging === 'days91'   && (d < 91 || d > 120)) return false;
      if (f.aging === 'days121'  && d < 121)              return false;
    }
    return true;
  });
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ClaimsDashboard() {
  const { filters, onFilterChange } = useFilters();
  const [selectedRows, setSelectedRows] = useState([]);
  const [detailClaim, setDetailClaim]   = useState(null);
  const [showAI, setShowAI]             = useState(true);
  const [bottomTab, setBottomTab]       = useState('lifecycle');
  const [showBottom, setShowBottom]     = useState(true);
  const [expandedRow, setExpandedRow]   = useState(null);
  const [liveSync, setLiveSync]         = useState(true);
  const [actionsOpen, setActionsOpen]   = useState(false);

  const filteredClaims = useMemo(() => applyFilters(MOCK_CLAIMS, filters), [filters]);

  const activeFilterCount = useMemo(() =>
    Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== 'all').length
    + (filters.search ? 1 : 0),
  [filters]);

  const handleSelect = useCallback((id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRows(prev => prev.length === filteredClaims.length ? [] : filteredClaims.map(c => c.id));
  }, [filteredClaims]);

  const handleRowAction = useCallback((action, claim) => {
    if (action === 'view') setDetailClaim(claim);
  }, []);

  const handleExpandRow = useCallback((id) => {
    setExpandedRow(prev => prev === id ? null : id);
    const claim = MOCK_CLAIMS.find(c => c.id === id);
    if (claim) setDetailClaim(claim);
  }, []);

  // Derived summary stats
  const pendingCount       = MOCK_CLAIMS.filter(c => ['SUBMITTED','UNDER_REVIEW','PENDING_DOCS'].includes(c.status)).length;
  const deniedCount        = MOCK_CLAIMS.filter(c => c.status === 'DENIED').length;
  const criticalAgingCount = MOCK_CLAIMS.filter(c => c.agingDays > 90).length;
  const leakageCount       = MOCK_CLAIMS.filter(c => c.leakage).length;

  const BottomTabContent = {
    lifecycle:  ICLifecycleDashboard,
    denial:     ICDenialAnalytics,
    settlement: ICSettlementPanel,
    leakage:    ICLeakageAlerts,
  }[bottomTab] ?? ICLifecycleDashboard;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-start justify-between gap-4">

          {/* Title */}
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-none">
                  Insurance Claims Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Monitor, optimize, reconcile and recover enterprise healthcare insurance revenue in real time
                </p>
              </div>
            </div>
          </div>

          {/* Header quick-stats */}
          <div className="hidden lg:flex items-center gap-4 flex-none">
            {[
              { label: 'Total Claims Value', val: '₹8.43Cr',            color: 'text-indigo-600 dark:text-indigo-400'   },
              { label: 'Pending Claims',     val: String(pendingCount),  color: 'text-amber-600 dark:text-amber-400'     },
              { label: 'Denied Claims',      val: String(deniedCount),   color: 'text-red-600 dark:text-red-400'         },
              { label: 'Aging 90d+',         val: String(criticalAgingCount), color: 'text-rose-600 dark:text-rose-400'  },
              { label: 'Leakage Alerts',     val: String(leakageCount),  color: 'text-rose-700 dark:text-rose-400'       },
            ].map(s => (
              <div key={s.label} className="text-center px-3 border-l border-slate-200 dark:border-slate-700 first:border-0">
                <div className={`text-sm font-bold font-mono ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-none">
            <button
              onClick={() => setLiveSync(s => !s)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-colors
                ${liveSync
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
            >
              {liveSync ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}
              {liveSync ? 'Live' : 'Offline'}
            </button>

            <button className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 transition-colors">
              <Plus size={13} />
              New Claim
            </button>

            <div className="relative">
              <button
                onClick={() => setActionsOpen(o => !o)}
                className="flex items-center gap-1 h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Actions
                <ChevronDown size={12} className={`transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {actionsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setActionsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.13 }}
                      className="absolute right-0 top-10 z-20 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1"
                    >
                      {HEADER_ACTIONS_SECONDARY.map(a => {
                        const Icon = a.icon;
                        return (
                          <button key={a.id}
                            onClick={() => setActionsOpen(false)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300
                              hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors">
                            <Icon size={13} className="text-slate-400 flex-none" />
                            {a.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setShowAI(s => !s)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-colors
                ${showAI
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/40 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <Sparkles size={12} />
              {showAI ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
            </button>
          </div>
        </div>

        {/* Bulk action bar */}
        <AnimatePresence>
          {selectedRows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {selectedRows.length} claim{selectedRows.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Submit All', icon: Send      },
                  { label: 'Export',     icon: Download  },
                  { label: 'Resubmit',   icon: RefreshCw },
                  { label: 'Reconcile',  icon: GitMerge  },
                ].map(a => {
                  const Icon = a.icon;
                  return (
                    <button key={a.label}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg
                        bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400
                        text-xs font-semibold hover:bg-indigo-200 transition-colors">
                      <Icon size={11} />
                      {a.label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setSelectedRows([])}
                className="ml-auto text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Clear selection
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── KPI Ribbon ──────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <ICKPIRibbon />
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <ICFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        activeCount={activeFilterCount}
      />

      {/* ── Main workspace (grid + AI panel) ────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Grid area */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Results bar */}
          <div className="flex-none flex items-center justify-between px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''}
              </span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                </span>
              )}
              {liveSync && (
                <span className="flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time sync
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: 'High Risk',    val: MOCK_CLAIMS.filter(c => ['HIGH','CRITICAL'].includes(c.riskLevel)).length, color: 'text-red-500' },
                { label: 'Leakage',      val: MOCK_CLAIMS.filter(c => c.leakage).length, color: 'text-rose-500' },
                { label: 'Missing Docs', val: MOCK_CLAIMS.filter(c => c.missingDocs?.length > 0).length, color: 'text-amber-500' },
              ].map(s => (
                <span key={s.label} className={`text-[10.5px] font-medium text-slate-500 dark:text-slate-400 ${s.color}`}>
                  {s.label}: <b className="font-mono">{s.val}</b>
                </span>
              ))}
            </div>
          </div>

          {/* Claims grid */}
          <ICGrid
            claims={filteredClaims}
            selectedRows={selectedRows}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            expandedRow={expandedRow}
            onExpand={handleExpandRow}
            onRowAction={handleRowAction}
          />

          {/* ── Bottom analytics panel ───────────────────────────────────── */}
          <div className="flex-none border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Tab bar */}
            <div className="flex items-center justify-between px-6">
              <div className="flex">
                {BOTTOM_TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setBottomTab(tab.id); setShowBottom(true); }}
                      className={`flex items-center gap-1.5 px-4 py-3 text-[11.5px] font-semibold border-b-2 transition-colors whitespace-nowrap
                        ${bottomTab === tab.id && showBottom
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                      <Icon size={12} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setShowBottom(s => !s)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded"
              >
                <ChevronDown size={13} className={`transition-transform ${showBottom ? '' : 'rotate-180'}`} />
                {showBottom ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {/* Panel content */}
            <AnimatePresence>
              {showBottom && (
                <motion.div
                  key={bottomTab}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 380 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-y-auto border-t border-slate-100 dark:border-slate-800"
                  style={{ maxHeight: 380 }}
                >
                  <BottomTabContent />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── AI right panel ───────────────────────────────────────────── */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              key="ai-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="flex-none overflow-hidden border-l border-slate-200 dark:border-slate-800"
              style={{ minWidth: 0 }}
            >
              <div className="w-[340px] h-full">
                <ICAIPanel onClose={() => setShowAI(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Claim detail drawer ──────────────────────────────────────────── */}
      <ICDetailDrawer claim={detailClaim} onClose={() => setDetailClaim(null)} />

      {/* ── Floating AI button (when panel hidden) ───────────────────────── */}
      <AnimatePresence>
        {!showAI && (
          <motion.button
            key="ai-fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setShowAI(true)}
            className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-2xl
              bg-gradient-to-br from-indigo-500 to-purple-600
              shadow-xl shadow-indigo-300/40 dark:shadow-indigo-900/40
              flex items-center justify-center text-white
              hover:scale-105 active:scale-95 transition-transform"
          >
            <Sparkles size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
