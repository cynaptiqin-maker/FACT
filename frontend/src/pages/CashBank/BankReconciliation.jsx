import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Upload, Zap, GitMerge, PlusCircle, Download,
  Sparkles, FileText, ChevronDown, ChevronUp, Keyboard,
  Landmark, BookOpen, AlertTriangle, Clock, CheckCircle2,
  BarChart3, ShieldAlert, Filter,
} from 'lucide-react';

import BRKPIRibbon      from './BR/BRKPIRibbon';
import BRFilterBar      from './BR/BRFilterBar';
import BRDualGrid       from './BR/BRDualGrid';
import BRDetailDrawer   from './BR/BRDetailDrawer';
import BRAIPanel        from './BR/BRAIPanel';
import BRMatchingPanel  from './BR/BRMatchingPanel';
import BRExceptionPanel from './BR/BRExceptionPanel';
import BRAnalyticsPanel from './BR/BRAnalyticsPanel';
import BRFraudPanel     from './BR/BRFraudPanel';
import { fmtINR, BANK_ACCOUNTS } from './BR/BRConstants';

const BOTTOM_TABS = [
  { id: 'matching',   label: 'Matching Engine', icon: GitMerge,    badge: '2 AI Suggestions' },
  { id: 'exceptions', label: 'Exceptions',      icon: AlertTriangle,badge: '6 Active' },
  { id: 'analytics',  label: 'Liquidity',       icon: BarChart3,   badge: null },
  { id: 'fraud',      label: 'Fraud & Risk',    icon: ShieldAlert, badge: '4 Alerts', badgeCrit: true },
];

const QUICK_ACTIONS = [
  { label: 'Import Statement',  icon: Upload,       action: 'import',   color: 'indigo' },
  { label: 'Auto Match',        icon: Zap,          action: 'automatch',color: 'violet' },
  { label: 'Reconcile Selected',icon: GitMerge,     action: 'reconcile',color: 'emerald' },
  { label: 'Create Adjustment', icon: PlusCircle,   action: 'adjust',   color: 'amber' },
  { label: 'Export',            icon: Download,     action: 'export',   color: 'slate' },
  { label: 'AI Analysis',       icon: Sparkles,     action: 'ai',       color: 'cyan' },
  { label: 'Audit Logs',        icon: FileText,     action: 'audit',    color: 'slate' },
];

const SHORTCUTS = [
  { key: 'Ctrl+K', desc: 'Global search' },
  { key: 'Ctrl+M', desc: 'Match selected' },
  { key: 'Ctrl+R', desc: 'Reconcile selected' },
  { key: '/',       desc: 'Quick filter' },
  { key: 'Enter',   desc: 'Open detail' },
];

const initFilters = {
  search: '', bankAccount: '', branch: '', type: '', method: '',
  status: '', risk: '', source: '',
  amtMin: '', amtMax: '', dateFrom: '', dateTo: '',
  unmatchedOnly: false, exceptionsOnly: false, riskOnly: false,
};

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`w-3.5 h-3.5 text-${color}-500`} />
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}:</span>
      <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400`}>{value}</span>
    </div>
  );
}

export default function BankReconciliation() {
  const [filters,         setFilters]         = useState(initFilters);
  const [selectedSys,     setSelectedSys]     = useState([]);
  const [selectedBank,    setSelectedBank]    = useState([]);
  const [detailRec,       setDetailRec]       = useState(null);
  const [detailType,      setDetailType]      = useState(null);
  const [showAI,          setShowAI]          = useState(true);
  const [bottomTab,       setBottomTab]       = useState('matching');
  const [showBottom,      setShowBottom]      = useState(true);
  const [liveSync,        setLiveSync]        = useState(true);
  const [showShortcuts,   setShowShortcuts]   = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(BANK_ACCOUNTS[0]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
  }, []);

  const handleBulkAction = useCallback((action) => {
    const ids = [...selectedSys, ...selectedBank];
    console.log(`Bulk action: ${action} on`, ids);
    if (action === 'match') { setSelectedSys([]); setSelectedBank([]); }
  }, [selectedSys, selectedBank]);

  const handleOpenDetail = useCallback((rec, type) => {
    setDetailRec(rec);
    setDetailType(type);
  }, []);

  const handleDrawerAction = useCallback((action, rec) => {
    console.log(`Drawer action: ${action}`, rec);
    if (action === 'match') setDetailRec(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '?' && !e.target.matches('input,textarea')) setShowShortcuts(s => !s);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const totalSelected = selectedSys.length + selectedBank.length;
  const bankBalance = BANK_ACCOUNTS.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-['Open_Sans',system-ui,sans-serif]">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
          {/* Title */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GitMerge className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Bank Reconciliation</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reconcile, validate, analyze, and optimize enterprise banking transactions in real time.</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-3 pl-12 flex-wrap">
              <StatPill icon={Landmark}     label="Bank Balance"  value={fmtINR(bankBalance, 'crore')} color="indigo" />
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <StatPill icon={BookOpen}     label="Book Balance"  value={fmtINR(102920000, 'crore')}  color="violet" />
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <StatPill icon={AlertTriangle}label="Variance"      value={fmtINR(260000, 'lakh')}      color="amber" />
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <StatPill icon={Clock}        label="Settlements"   value="3 Pending"                    color="cyan" />
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              {/* Live sync indicator */}
              <button
                onClick={() => setLiveSync(s => !s)}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${liveSync ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <span className={liveSync ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                  {liveSync ? 'Live · Synced just now' : 'Sync paused'}
                </span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-start gap-2 flex-shrink-0 flex-wrap">
            {/* Bank account selector */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Landmark className="w-3.5 h-3.5" />
                <span>{selectedAccount.name}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              <div className="absolute right-0 top-full mt-1.5 z-30 hidden group-hover:block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl min-w-[220px] py-1 overflow-hidden">
                {BANK_ACCOUNTS.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccount(acc)}
                    className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                      selectedAccount.id === acc.id
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="font-semibold">{acc.name}</div>
                    <div className="text-slate-400 text-[10px] mt-0.5">{acc.bank} · {fmtINR(acc.balance, 'lakh')} · {acc.lastSync}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick action buttons */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
              <Upload className="w-3.5 h-3.5" />
              Import Statement
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors">
              <Zap className="w-3.5 h-3.5" />
              Auto Match
            </button>
            <button
              onClick={() => setShowAI(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                showAI
                  ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-600 dark:text-cyan-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-cyan-400/40 hover:text-cyan-500'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Assistant
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => setShowShortcuts(s => !s)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI RIBBON ──────────────────────────────────────────────────── */}
      <BRKPIRibbon />

      {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
      <BRFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        total={29}
        filtered={12}
        selectedCount={totalSelected}
        onBulkAction={handleBulkAction}
      />

      {/* ── MAIN WORKSPACE ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Dual grid + bottom panel column */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Dual reconciliation grid */}
          <div className="flex-1 overflow-hidden">
            <BRDualGrid
              filters={filters}
              selectedSys={selectedSys}
              selectedBank={selectedBank}
              onSelectSys={setSelectedSys}
              onSelectBank={setSelectedBank}
              onOpenDetail={handleOpenDetail}
            />
          </div>

          {/* Bottom panel */}
          <div className={`flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${showBottom ? 'h-72' : 'h-9'}`}>
            {/* Tab bar */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 h-9 flex-shrink-0">
              <div className="flex flex-1 overflow-x-auto">
                {BOTTOM_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setBottomTab(tab.id); setShowBottom(true); }}
                    className={`flex items-center gap-1.5 px-3 h-9 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                      bottomTab === tab.id && showBottom
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        tab.badgeCrit
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowBottom(s => !s)}
                className="px-3 h-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-l border-slate-200 dark:border-slate-800 transition-colors flex-shrink-0"
              >
                {showBottom ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {showBottom && (
                <motion.div
                  key={bottomTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="h-[calc(100%-36px)] overflow-hidden"
                >
                  {bottomTab === 'matching'   && <BRMatchingPanel  onAcceptMatch={id => console.log('Accepted', id)} />}
                  {bottomTab === 'exceptions' && <BRExceptionPanel />}
                  {bottomTab === 'analytics'  && <BRAnalyticsPanel />}
                  {bottomTab === 'fraud'      && <BRFraudPanel />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              key="ai-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="flex-shrink-0 overflow-hidden border-l border-slate-200 dark:border-slate-800"
            >
              <div className="w-[300px] h-full">
                <BRAIPanel onClose={() => setShowAI(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── DETAIL DRAWER ────────────────────────────────────────────────── */}
      <BRDetailDrawer
        rec={detailRec}
        type={detailType}
        onClose={() => setDetailRec(null)}
        onAction={handleDrawerAction}
      />

      {/* ── KEYBOARD SHORTCUTS PANEL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-800 dark:bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4 w-80"
          >
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold">Keyboard Shortcuts</span>
            </div>
            <div className="space-y-1.5">
              {SHORTCUTS.map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{s.desc}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-slate-700 text-[11px] font-mono text-slate-200 border border-slate-600">{s.key}</kbd>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-3 w-full text-[11px] text-slate-400 hover:text-slate-200 text-center"
            >
              Press ? to toggle
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BULK SELECTION FLOATING BAR ──────────────────────────────────── */}
      <AnimatePresence>
        {totalSelected > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20"
          >
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {totalSelected} item{totalSelected > 1 ? 's' : ''} selected
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <button onClick={() => handleBulkAction('match')}    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors">
              <GitMerge className="w-3.5 h-3.5" /> Match Selected
            </button>
            <button onClick={() => handleBulkAction('reconcile')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reconcile
            </button>
            <button onClick={() => handleBulkAction('export')}   className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={() => { setSelectedSys([]); setSelectedBank([]); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <span className="text-xs">Clear</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
