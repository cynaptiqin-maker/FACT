import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, Plus, Calendar, CheckCircle2, GitMerge, Download,
  Sparkles, ClipboardList, RefreshCw, Wifi, WifiOff,
  ChevronDown, PanelRightOpen, PanelRightClose,
  BarChart2, Zap, ShieldAlert, Activity,
} from 'lucide-react';

import APKPIRibbon    from './AP/APKPIRibbon';
import APFilterBar    from './AP/APFilterBar';
import APGrid         from './AP/APGrid';
import APDetailDrawer from './AP/APDetailDrawer';
import APAgingPanel   from './AP/APAgingPanel';
import APPaymentPanel from './AP/APPaymentPanel';
import APAIPanel      from './AP/APAIPanel';
import APFraudAlerts  from './AP/APFraudAlerts';
import { MOCK_PAYABLES } from './AP/APConstants';

// ─── Bottom tab definitions ───────────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'aging',   label: 'Aging & Spend Analytics', icon: BarChart2  },
  { id: 'payment', label: 'Payment Scheduling',       icon: Calendar   },
  { id: 'fraud',   label: 'Fraud Detection',          icon: ShieldAlert},
];

// ─── Filter hook ──────────────────────────────────────────────────────────────
function useFilters() {
  const [filters, setFilters] = useState({
    search: '', category: 'all', payStatus: 'all', apvStatus: 'all',
    aging: 'all', branch: 'all', risk: 'all', department: 'all',
    procCat: 'all', approver: 'all', amtMin: '', amtMax: '',
    fraudOnly: false,
  });

  const onFilterChange = useCallback((key, value) => {
    if (key === 'reset') {
      setFilters({
        search: '', category: 'all', payStatus: 'all', apvStatus: 'all',
        aging: 'all', branch: 'all', risk: 'all', department: 'all',
        procCat: 'all', approver: 'all', amtMin: '', amtMax: '',
        fraudOnly: false,
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  return { filters, onFilterChange };
}

// ─── Filter engine ────────────────────────────────────────────────────────────
function applyFilters(rows, filters) {
  return rows.filter(r => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = [
        r.invoiceNo, r.vendorName, r.vendorCode, r.department,
        r.branch, r.poNumber, r.grnNumber, r.notes,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    if (filters.category   !== 'all' && r.category         !== filters.category)              return false;
    if (filters.payStatus  !== 'all' && r.paymentStatus     !== filters.payStatus)             return false;
    if (filters.apvStatus  !== 'all' && r.approvalStatus    !== filters.apvStatus)             return false;
    if (filters.branch     !== 'all' && r.branch            !== filters.branch)                return false;
    if (filters.risk       !== 'all' && r.riskLevel         !== filters.risk.toUpperCase())    return false;
    if (filters.department !== 'all' && r.department        !== filters.department)            return false;
    if (filters.approver   !== 'all' && r.assignedApprover  !== filters.approver)              return false;
    if (filters.amtMin     && r.outstandingAmount < Number(filters.amtMin))                    return false;
    if (filters.amtMax     && r.outstandingAmount > Number(filters.amtMax))                    return false;
    if (filters.fraudOnly  && r.riskScore <= 60)                                               return false;
    if (filters.aging !== 'all') {
      const d = r.agingDays;
      if (filters.aging === 'current' && d > 30)              return false;
      if (filters.aging === 'days31'  && (d < 31 || d > 60))  return false;
      if (filters.aging === 'days61'  && (d < 61 || d > 90))  return false;
      if (filters.aging === 'days91'  && d < 91)              return false;
    }
    return true;
  });
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AccountsPayable() {
  const { filters, onFilterChange } = useFilters();

  const [selectedRows,      setSelectedRows]      = useState([]);
  const [detailRec,         setDetailRec]         = useState(null);
  const [showAI,            setShowAI]            = useState(true);
  const [bottomTab,         setBottomTab]         = useState('aging');
  const [showBottomPanel,   setShowBottomPanel]   = useState(true);
  const [liveSync,          setLiveSync]          = useState(true);

  const filteredRows = useMemo(() => applyFilters(MOCK_PAYABLES, filters), [filters]);

  const overdueCount  = MOCK_PAYABLES.filter(r => r.paymentStatus === 'OVERDUE').length;
  const pendingApvs   = MOCK_PAYABLES.filter(r => r.approvalStatus === 'PENDING').length;
  const totalOutstand = MOCK_PAYABLES.reduce((s, r) => s + r.outstandingAmount, 0);
  const dueToday      = MOCK_PAYABLES.filter(r => r.agingDays <= 1).reduce((s, r) => s + r.outstandingAmount, 0);

  const handleSelect    = useCallback((id) => setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]), []);
  const handleSelectAll = useCallback(() => setSelectedRows(prev => prev.length === filteredRows.length ? [] : filteredRows.map(r => r.id)), [filteredRows]);
  const handleBulkAction= useCallback((action, ids) => console.log('Bulk:', action, ids.length), []);
  const handleRowAction = useCallback((action, rec) => { if (action === 'view') setDetailRec(rec); }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-start justify-between gap-4">

          {/* Title block */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <TrendingDown size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-none">
                  Accounts Payable
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage, approve, reconcile, and optimise enterprise healthcare payables in real time
                </p>
              </div>
            </div>
          </div>

          {/* Header quick-stats */}
          <div className="hidden lg:flex items-center gap-4 flex-none">
            {[
              { label: 'Total Outstanding', val: `₹${(totalOutstand/10000000).toFixed(2)}Cr`, color: 'text-amber-600 dark:text-amber-400'     },
              { label: 'Due Today',          val: `₹${(dueToday/100000).toFixed(1)}L`,         color: 'text-rose-600 dark:text-rose-400'        },
              { label: 'Overdue Invoices',   val: String(overdueCount),                          color: 'text-red-600 dark:text-red-400'          },
              { label: 'Pending Approvals',  val: String(pendingApvs),                           color: 'text-violet-600 dark:text-violet-400'    },
            ].map(s => (
              <div key={s.label} className="text-center px-3 border-l border-slate-200 dark:border-slate-700 first:border-0">
                <div className={`text-sm font-bold font-mono ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}

            {/* Live sync indicator */}
            <button
              onClick={() => setLiveSync(p => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors
                ${liveSync
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
            >
              {liveSync ? <Wifi size={11} className="animate-pulse" /> : <WifiOff size={11} />}
              {liveSync ? 'Live sync active' : 'Offline mode'}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-none">
            {/* Primary: New Invoice */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors shadow-md shadow-amber-200 dark:shadow-amber-900/40"
            >
              <Plus size={15} />New Invoice
            </motion.button>

            {/* Secondary group */}
            <div className="flex items-center gap-1">
              {[
                { icon: Calendar,     tip: 'Schedule Payment'  },
                { icon: CheckCircle2, tip: 'Approve Invoices'  },
                { icon: Zap,          tip: 'Generate Payment Run' },
                { icon: GitMerge,     tip: 'Reconcile'         },
                { icon: Download,     tip: 'Export'            },
                { icon: ClipboardList,tip: 'Audit Logs'        },
              ].map((a, i) => (
                <button key={i} title={a.tip}
                  className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-amber-300 hover:text-amber-600 transition-colors flex items-center justify-center">
                  <a.icon size={15} />
                </button>
              ))}
            </div>

            {/* AI toggle */}
            <button
              onClick={() => setShowAI(p => !p)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-colors
                ${showAI
                  ? 'border-cyan-400 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-700 dark:text-cyan-400'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-cyan-300'}`}
            >
              <Sparkles size={13} />AI
              {showAI ? <PanelRightClose size={12} /> : <PanelRightOpen size={12} />}
            </button>

            <button title="Refresh"
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-amber-600 transition-colors flex items-center justify-center">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Ribbon ──────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <APKPIRibbon />
      </div>

      {/* ── Filter Bar (sticky) ─────────────────────────────────────────── */}
      <APFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        selectedRows={selectedRows}
        onBulkAction={handleBulkAction}
        totalCount={MOCK_PAYABLES.length}
        filteredCount={filteredRows.length}
      />

      {/* ── Main Workspace ──────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Grid + Bottom panels column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Payables Grid */}
          <div className="flex-1 overflow-auto">
            <APGrid
              rows={filteredRows}
              selectedRows={selectedRows}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onRowClick={setDetailRec}
              onAction={handleRowAction}
            />
          </div>

          {/* ── Bottom Panel ─────────────────────────────────────────── */}
          <div className="flex-none border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            {/* Tab bar */}
            <div className="flex items-center gap-0 border-b border-slate-200 dark:border-slate-800 px-4">
              {BOTTOM_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setBottomTab(t.id); setShowBottomPanel(true); }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
                    ${bottomTab === t.id && showBottomPanel
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <t.icon size={12} />{t.label}
                  {t.id === 'fraud' && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">4</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setShowBottomPanel(p => !p)}
                className="ml-auto px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <ChevronDown size={14} className={`transition-transform ${showBottomPanel ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Bottom panel content */}
            <AnimatePresence>
              {showBottomPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: bottomTab === 'fraud' ? 440 : 360, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-y-auto"
                >
                  <div className="p-5">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={bottomTab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                      >
                        {bottomTab === 'aging'   && <APAgingPanel />}
                        {bottomTab === 'payment' && <APPaymentPanel />}
                        {bottomTab === 'fraud'   && <APFraudAlerts />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── AI Panel (right) ─────────────────────────────────────────── */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="flex-none overflow-hidden"
            >
              <div className="h-full w-80">
                <APAIPanel onClose={() => setShowAI(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail Drawer ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailRec && (
          <APDetailDrawer rec={detailRec} onClose={() => setDetailRec(null)} />
        )}
      </AnimatePresence>

      {/* ── Keyboard shortcut hint ─────────────────────────────────────── */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <AnimatePresence>
          <motion.div
            key="shortcuts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.6, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 shadow-sm text-[10px] text-slate-500 dark:text-slate-500"
          >
            {[
              ['⌘K','Search'],['⌘N','New Invoice'],['⌘P','Schedule Payment'],
              ['/','Filter'],['Esc','Close'],
            ].map(([key, lbl]) => (
              <span key={key} className="flex items-center gap-1">
                <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 font-mono text-[9px]">{key}</kbd>
                {lbl}
              </span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
