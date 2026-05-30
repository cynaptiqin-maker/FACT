import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, GitMerge, Download,
  Sparkles, ClipboardList, RefreshCw, Wifi, WifiOff,
  ChevronDown, PanelRightOpen, PanelRightClose,
  BarChart2, ShieldAlert, Printer,
} from 'lucide-react';

import CBKPIRibbon           from './CB/CBKPIRibbon';
import CBFilterBar           from './CB/CBFilterBar';
import CBGrid                from './CB/CBGrid';
import CBDetailDrawer        from './CB/CBDetailDrawer';
import CBAnalyticsPanel      from './CB/CBAnalyticsPanel';
import CBReconciliationPanel from './CB/CBReconciliationPanel';
import CBFraudAlerts         from './CB/CBFraudAlerts';
import CBAIPanel             from './CB/CBAIPanel';
import { MOCK_CASH_TRANSACTIONS } from './CB/CBConstants';

// ─── Coins icon (lucide may not have it in all versions) ──────────────────────
function CoinsIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="9" cy="6" rx="6" ry="3" />
      <path d="M3 6v12c0 1.66 2.69 3 6 3s6-1.34 6-3V6M21 9c0 1.66-2.69 3-6 3-1.03 0-2-.1-2.83-.28M21 6c0-1.66-2.69-3-6-3-1.03 0-2 .1-2.83.28M21 6v6" />
    </svg>
  );
}

// ─── Bottom tabs ──────────────────────────────────────────────────────────────

const BOTTOM_TABS = [
  { id: 'analytics',      label: 'Cash Flow Analytics',   icon: BarChart2  },
  { id: 'reconciliation', label: 'Reconciliation',         icon: GitMerge   },
  { id: 'fraud',          label: 'Fraud & Risk Alerts',    icon: ShieldAlert },
];

// ─── Filter hook ──────────────────────────────────────────────────────────────

function useFilters() {
  const INIT = {
    search: '', txnType: 'all', branch: 'all', counter: 'all',
    department: 'all', reconcile: 'all', approval: 'all',
    risk: 'all', source: 'all',
    amtMin: '', amtMax: '', riskOnly: false, unreconciledOnly: false,
  };
  const [filters, setFilters] = useState(INIT);

  const onFilterChange = useCallback((key, value) => {
    if (key === 'reset') setFilters(INIT);
    else setFilters(prev => ({ ...prev, [key]: value }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { filters, onFilterChange };
}

// ─── Filter engine ────────────────────────────────────────────────────────────

function applyFilters(rows, f) {
  return rows.filter(r => {
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = [r.id, r.voucherNo, r.narration, r.branch, r.counter,
        r.department, r.user, r.ledgerAccount, r.patientId, r.subType,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.txnType    !== 'all' && r.txnType         !== f.txnType)    return false;
    if (f.branch     !== 'all' && r.branch          !== f.branch)     return false;
    if (f.counter    !== 'all' && r.counter         !== f.counter)    return false;
    if (f.department !== 'all' && r.department      !== f.department) return false;
    if (f.reconcile  !== 'all' && r.reconcileStatus !== f.reconcile)  return false;
    if (f.approval   !== 'all' && r.approvalStatus  !== f.approval)   return false;
    if (f.risk       !== 'all' && r.riskLevel       !== f.risk)       return false;
    if (f.source     !== 'all' && r.sourceModule    !== f.source)     return false;
    const amt = r.receiptAmount + r.paymentAmount;
    if (f.amtMin && amt < Number(f.amtMin)) return false;
    if (f.amtMax && amt > Number(f.amtMax)) return false;
    if (f.riskOnly         && !['HIGH', 'CRITICAL'].includes(r.riskLevel)) return false;
    if (f.unreconciledOnly && r.reconcileStatus === 'RECONCILED')            return false;
    return true;
  });
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CashBook() {
  const { filters, onFilterChange } = useFilters();

  const [selectedRows,    setSelectedRows]    = useState([]);
  const [detailRec,       setDetailRec]       = useState(null);
  const [showAI,          setShowAI]          = useState(true);
  const [bottomTab,       setBottomTab]       = useState('analytics');
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [liveSync,        setLiveSync]        = useState(true);

  const filteredRows = useMemo(() => applyFilters(MOCK_CASH_TRANSACTIONS, filters), [filters]);

  const todayTxn      = MOCK_CASH_TRANSACTIONS.filter(r => r.dateTime.startsWith('2026-05-19'));
  const todayReceipts = todayTxn.reduce((s, r) => s + r.receiptAmount, 0);
  const todayPayments = todayTxn.reduce((s, r) => s + r.paymentAmount, 0);
  const unreconciled  = MOCK_CASH_TRANSACTIONS.filter(r => r.reconcileStatus !== 'RECONCILED').length;
  const fraudAlerts   = MOCK_CASH_TRANSACTIONS.filter(r => ['HIGH', 'CRITICAL'].includes(r.riskLevel)).length;

  const handleSelect     = useCallback((id) => setSelectedRows(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]), []);
  const handleSelectAll  = useCallback(() => setSelectedRows(p => p.length === filteredRows.length ? [] : filteredRows.map(r => r.id)), [filteredRows]);
  const handleBulkAction = useCallback((action, ids) => {
    if (action === 'clear') { setSelectedRows([]); return; }
    console.log('Bulk:', action, ids.length);
  }, []);
  const handleRowAction  = useCallback((action, rec) => { if (action === 'view') setDetailRec(rec); }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-start justify-between gap-4">

          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
              <Wallet size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-none">Cash Book</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitor, reconcile, audit, and optimise enterprise healthcare cash operations in real time
              </p>
            </div>
          </div>

          {/* Quick-stats */}
          <div className="hidden lg:flex items-center gap-4 flex-none">
            {[
              { label: "Today's Receipts",  val: `₹${(todayReceipts / 100000).toFixed(1)}L`,  color: 'text-teal-600 dark:text-teal-400'    },
              { label: "Today's Payments",  val: `₹${(todayPayments / 100000).toFixed(1)}L`,  color: 'text-red-600 dark:text-red-400'      },
              { label: 'Unreconciled',       val: String(unreconciled),                         color: 'text-orange-600 dark:text-orange-400' },
              { label: 'Fraud Alerts',       val: String(fraudAlerts),                          color: 'text-red-600 dark:text-red-400'      },
            ].map(s => (
              <div key={s.label} className="text-center px-3 border-l border-slate-200 dark:border-slate-700 first:border-0">
                <div className={`text-sm font-bold font-mono ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}

            <button onClick={() => setLiveSync(p => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors
                ${liveSync
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
              {liveSync ? <Wifi size={11} className="animate-pulse" /> : <WifiOff size={11} />}
              {liveSync ? 'Live sync active' : 'Offline mode'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-none">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md shadow-teal-200 dark:shadow-teal-900/40">
              <ArrowDownCircle size={15} />New Receipt
            </motion.button>

            <div className="flex items-center gap-1">
              {[
                { icon: ArrowUpCircle, tip: 'New Payment'      },
                { icon: CoinsIcon,     tip: 'Petty Cash Entry' },
                { icon: GitMerge,      tip: 'Reconcile Cash'   },
                { icon: Download,      tip: 'Export'           },
                { icon: Printer,       tip: 'Print Summary'    },
                { icon: ClipboardList, tip: 'Audit Logs'       },
              ].map((a, i) => (
                <button key={i} title={a.tip}
                  className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-teal-300 hover:text-teal-600 transition-colors flex items-center justify-center">
                  <a.icon size={15} />
                </button>
              ))}
            </div>

            <button onClick={() => setShowAI(p => !p)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-colors
                ${showAI
                  ? 'border-cyan-400 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-700 dark:text-cyan-400'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-cyan-300'}`}>
              <Sparkles size={13} />AI
              {showAI ? <PanelRightClose size={12} /> : <PanelRightOpen size={12} />}
            </button>

            <button title="Refresh"
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-teal-600 transition-colors flex items-center justify-center">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Ribbon ──────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <CBKPIRibbon />
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <CBFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        selectedRows={selectedRows}
        onBulkAction={handleBulkAction}
        totalCount={MOCK_CASH_TRANSACTIONS.length}
        filteredCount={filteredRows.length}
      />

      {/* ── Main Workspace ──────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Grid + Bottom panels */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          <div className="flex-1 overflow-auto">
            <CBGrid
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
            <div className="flex items-center gap-0 border-b border-slate-200 dark:border-slate-800 px-4">
              {BOTTOM_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setBottomTab(t.id); setShowBottomPanel(true); }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
                    ${bottomTab === t.id && showBottomPanel
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <t.icon size={12} />{t.label}
                  {t.id === 'fraud' && fraudAlerts > 0 && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">{fraudAlerts}</span>
                  )}
                  {t.id === 'reconciliation' && unreconciled > 0 && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">{unreconciled}</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setShowBottomPanel(p => !p)}
                className="ml-auto px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <ChevronDown size={14} className={`transition-transform ${showBottomPanel ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {showBottomPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: bottomTab === 'fraud' ? 480 : bottomTab === 'reconciliation' ? 400 : 360, opacity: 1 }}
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
                        {bottomTab === 'analytics'      && <CBAnalyticsPanel />}
                        {bottomTab === 'reconciliation' && <CBReconciliationPanel />}
                        {bottomTab === 'fraud'          && <CBFraudAlerts />}
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
                <CBAIPanel onClose={() => setShowAI(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail Drawer ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailRec && (
          <CBDetailDrawer rec={detailRec} onClose={() => setDetailRec(null)} />
        )}
      </AnimatePresence>

      {/* ── Keyboard shortcut hint ─────────────────────────────────────── */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.55, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 shadow-sm text-[10px] text-slate-500 dark:text-slate-500"
        >
          {[['⌘K','Search'],['⌘N','New Receipt'],['⌘R','Reconcile'],['/','Filter'],['Esc','Close']].map(([key, lbl]) => (
            <span key={key} className="flex items-center gap-1">
              <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 font-mono text-[9px]">{key}</kbd>
              {lbl}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
