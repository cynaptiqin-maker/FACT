import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Plus, CreditCard, Send, GitMerge, Download,
  Sparkles, ClipboardList, RefreshCw, Wifi, WifiOff,
  ChevronDown, PanelRightOpen, PanelRightClose,
  BarChart2, Workflow, AlertOctagon, Activity,
} from 'lucide-react';

import ARKPIRibbon       from './AR/ARKPIRibbon';
import ARFilterBar       from './AR/ARFilterBar';
import ARGrid            from './AR/ARGrid';
import ARDetailDrawer    from './AR/ARDetailDrawer';
import ARAgingPanel      from './AR/ARAgingPanel';
import ARWorkflowPanel   from './AR/ARWorkflowPanel';
import ARAIPanel         from './AR/ARAIPanel';
import ARLeakageAlerts   from './AR/ARLeakageAlerts';
import { MOCK_RECEIVABLES } from './AR/ARConstants';

const BOTTOM_TABS = [
  { id: 'aging',     label: 'Aging Analytics',   icon: BarChart2   },
  { id: 'workflow',  label: 'Collections',        icon: Workflow    },
  { id: 'leakage',   label: 'Revenue Leakage',    icon: AlertOctagon},
];

const HEADER_ACTIONS = [
  { id: 'invoice',   label: 'New Invoice',     icon: Plus,         primary: true  },
  { id: 'payment',   label: 'Record Payment',  icon: CreditCard,   primary: false },
  { id: 'reminder',  label: 'Send Reminder',   icon: Send,         primary: false },
  { id: 'reconcile', label: 'Reconcile',       icon: GitMerge,     primary: false },
  { id: 'export',    label: 'Export',          icon: Download,     primary: false },
  { id: 'ai',        label: 'AI Analysis',     icon: Sparkles,     primary: false },
  { id: 'audit',     label: 'Audit Logs',      icon: ClipboardList,primary: false },
];

function useFilters() {
  const [filters, setFilters] = useState({
    search: '', type: 'all', status: 'all', aging: 'all',
    branch: 'all', risk: 'all', collector: 'all',
    department: 'all', insStatus: 'all',
    amtMin: '', amtMax: '',
  });

  const onFilterChange = useCallback((key, value) => {
    if (key === 'reset') {
      setFilters({ search: '', type: 'all', status: 'all', aging: 'all', branch: 'all', risk: 'all', collector: 'all', department: 'all', insStatus: 'all', amtMin: '', amtMax: '' });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  return { filters, onFilterChange };
}

function applyFilters(rows, filters) {
  return rows.filter(r => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = [r.invoiceNo, r.patientName, r.orgName, r.patientId, r.department, r.branch, r.sourceModule]
        .filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    if (filters.type    !== 'all' && r.type              !== filters.type)           return false;
    if (filters.status  !== 'all' && r.collectionStatus  !== filters.status)         return false;
    if (filters.branch  !== 'all' && r.branch            !== filters.branch)         return false;
    if (filters.risk    !== 'all' && r.riskLevel         !== filters.risk.toUpperCase()) return false;
    if (filters.collector !== 'all' && !r.assignedCollector.includes(filters.collector)) return false;
    if (filters.department !== 'all' && r.department     !== filters.department)     return false;
    if (filters.insStatus !== 'all' && r.insuranceStatus !== filters.insStatus)      return false;
    if (filters.amtMin  && r.outstandingAmount < Number(filters.amtMin))             return false;
    if (filters.amtMax  && r.outstandingAmount > Number(filters.amtMax))             return false;
    if (filters.aging   !== 'all') {
      const d = r.agingDays;
      if (filters.aging === 'current' && (d < 0  || d > 30)) return false;
      if (filters.aging === 'days31'  && (d < 31 || d > 60)) return false;
      if (filters.aging === 'days61'  && (d < 61 || d > 90)) return false;
      if (filters.aging === 'days91'  && d < 91)             return false;
    }
    return true;
  });
}

export default function AccountsReceivable() {
  const navigate = useNavigate();
  const { filters, onFilterChange } = useFilters();
  const [selectedRows, setSelectedRows]     = useState([]);
  const [detailRec, setDetailRec]           = useState(null);
  const [showAI, setShowAI]                 = useState(true);
  const [bottomTab, setBottomTab]           = useState('aging');
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [liveSync, setLiveSync]             = useState(true);
  const [headerActionsOpen, setHeaderActionsOpen] = useState(false);

  const filteredRows = useMemo(() => applyFilters(MOCK_RECEIVABLES, filters), [filters]);

  const handleSelect = useCallback((id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRows(prev => prev.length === filteredRows.length ? [] : filteredRows.map(r => r.id));
  }, [filteredRows]);

  const handleBulkAction = useCallback((action, ids) => {
    console.log('Bulk action:', action, 'on', ids.length, 'rows');
    // wire to API
  }, []);

  const handleRowAction = useCallback((action, rec) => {
    if (action === 'view') setDetailRec(rec);
  }, []);

  const handleExportAR = useCallback(() => {
    const headers = ['Invoice #','Patient','Type','Branch','Billed On','Due Date','Outstanding','Status','Risk'];
    const rows = filteredRows.map(r => [
      r.invoiceNo, r.patientName, r.type, r.branch, r.billingDate,
      r.dueDate, r.outstandingAmount, r.collectionStatus, r.riskLevel,
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ar-receivables.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported ar-receivables.csv');
  }, [filteredRows]);

  // Live sync ticker
  const syncText = liveSync ? 'Live sync active' : 'Offline mode';

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                <TrendingUp size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-none">
                  Accounts Receivable
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Monitor, manage, reconcile and optimise enterprise healthcare receivables in real time
                </p>
              </div>
            </div>
          </div>

          {/* Header quick-stats */}
          <div className="hidden lg:flex items-center gap-4 flex-none">
            {[
              { label: 'Total Outstanding', val: '₹5.28Cr', color: 'text-blue-600 dark:text-blue-400'    },
              { label: "Today's Collections", val: '₹18.4L', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Ins. Claims Pending', val: '₹2.12Cr', color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Pending Follow-ups',  val: '49',      color: 'text-amber-600 dark:text-amber-400'   },
            ].map(s => (
              <div key={s.label} className="text-center px-3 border-l border-slate-200 dark:border-slate-700 first:border-0">
                <div className={`text-sm font-bold font-mono ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}

            {/* Live sync */}
            <button
              onClick={() => setLiveSync(p => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors
                ${liveSync
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
            >
              {liveSync ? <Wifi size={11} className="animate-pulse" /> : <WifiOff size={11} />}
              {syncText}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-none">
            {/* Primary: New Invoice */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/billing/new')}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 dark:shadow-blue-900/40"
            >
              <Plus size={15} />New Invoice
            </motion.button>

            {/* Secondary group */}
            <div className="flex items-center gap-1">
              {[
                { id: 'payment',   icon: CreditCard, tip: 'Record Payment',  action: () => navigate('/billing/payment') },
                { id: 'reminder',  icon: Send,       tip: 'Send Reminder',   action: () => toast.success('Reminder batch queued for selected records') },
                { id: 'reconcile', icon: GitMerge,   tip: 'Reconcile',       action: () => navigate('/cash-bank/reconciliation') },
                { id: 'export',    icon: Download,   tip: 'Export',          action: handleExportAR },
              ].map(a => (
                <button key={a.id} title={a.tip} onClick={a.action}
                  className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center">
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

            <button
              title="Refresh"
              onClick={() => {
                setSelectedRows([]);
                toast.success('Receivables refreshed — data is current');
              }}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Ribbon ──────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <ARKPIRibbon />
      </div>

      {/* ── Filter Bar (sticky) ──────────────────────────────────────────── */}
      <ARFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        selectedRows={selectedRows}
        onBulkAction={handleBulkAction}
        totalCount={MOCK_RECEIVABLES.length}
        filteredCount={filteredRows.length}
      />

      {/* ── Main Workspace ───────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Grid + bottom panels column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Receivables Grid */}
          <div className="flex-1 overflow-auto">
            <ARGrid
              rows={filteredRows}
              selectedRows={selectedRows}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onRowClick={setDetailRec}
              onAction={handleRowAction}
            />
          </div>

          {/* ── Bottom Panel ──────────────────────────────────────────── */}
          <div className="flex-none border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            {/* Bottom tab bar */}
            <div className="flex items-center gap-0 border-b border-slate-200 dark:border-slate-800 px-4">
              {BOTTOM_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setBottomTab(t.id);
                    setShowBottomPanel(true);
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
                    ${bottomTab === t.id && showBottomPanel
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <t.icon size={12} />{t.label}
                  {t.id === 'leakage' && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">5</span>
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
                  animate={{ height: 340, opacity: 1 }}
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
                        {bottomTab === 'aging'    && <ARAgingPanel />}
                        {bottomTab === 'workflow' && <ARWorkflowPanel />}
                        {bottomTab === 'leakage'  && <ARLeakageAlerts />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── AI Panel (right) ──────────────────────────────────────────── */}
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
                <ARAIPanel onClose={() => setShowAI(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail Drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailRec && (
          <ARDetailDrawer rec={detailRec} onClose={() => setDetailRec(null)} />
        )}
      </AnimatePresence>

      {/* ── Keyboard shortcuts hint ───────────────────────────────────────── */}
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
              ['⌘K','Search'],['⌘N','New Invoice'],['⌘R','Record Payment'],
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
