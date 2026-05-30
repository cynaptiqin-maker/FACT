import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Activity, AlertOctagon, TrendingUp, Download,
  RefreshCw, Sparkles, Wifi, WifiOff, PanelRightOpen, PanelRightClose,
  Send, UserCheck, CalendarClock, ChevronDown, FileBarChart2,
} from 'lucide-react';

import AgingKPIRibbon      from './Aging/AgingKPIRibbon';
import AgingFilterBar      from './Aging/AgingFilterBar';
import AgingAnalyticsHub   from './Aging/AgingAnalyticsHub';
import AgingGrid           from './Aging/AgingGrid';
import AgingDetailDrawer   from './Aging/AgingDetailDrawer';
import AgingAIPanel        from './Aging/AgingAIPanel';
import AgingForecastPanel  from './Aging/AgingForecastPanel';
import AgingLeakagePanel   from './Aging/AgingLeakagePanel';

import { MOCK_AGING_ROWS, AGING_BUCKET_SUMMARY } from './Aging/AgingConstants';

// ── Filter state & helpers ────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  search: '', aging: 'all', type: 'all', status: 'all',
  branch: 'all', risk: 'all', collector: 'all',
  department: 'all', amtMin: '', amtMax: '',
};

function applyFilters(rows, filters) {
  return rows.filter(r => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [
        r.invoiceNo, r.patientName, r.orgName, r.patientId,
        r.department, r.branch, r.sourceModule, r.assignedCollector,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.aging   !== 'all' && r.agingBucket      !== filters.aging)                     return false;
    if (filters.type    !== 'all' && r.type              !== filters.type)                      return false;
    if (filters.branch  !== 'all' && r.branch            !== filters.branch)                    return false;
    if (filters.risk    !== 'all' && r.riskLevel         !== filters.risk.toUpperCase())         return false;
    if (filters.collector !== 'all' && r.assignedCollector !== filters.collector)               return false;
    if (filters.department !== 'all' && r.department     !== filters.department)               return false;
    if (filters.amtMin  && r.outstandingAmount < Number(filters.amtMin))                       return false;
    if (filters.amtMax  && r.outstandingAmount > Number(filters.amtMax))                       return false;
    return true;
  });
}

const BOTTOM_TABS = [
  { id: 'forecast', label: 'Cash Flow Forecast',   icon: TrendingUp  },
  { id: 'leakage',  label: 'Revenue Leakage',      icon: AlertOctagon },
];

// ── Bucket Summary Bar ────────────────────────────────────────────────────────
function BucketSummaryBar({ activeFilter, onFilterClick }) {
  return (
    <div className="flex items-stretch gap-0 border-b border-slate-200 dark:border-slate-800">
      {AGING_BUCKET_SUMMARY.map((b, i) => (
        <button
          key={b.key}
          onClick={() => onFilterClick(b.key === activeFilter ? 'all' : b.key)}
          className={`flex-1 flex flex-col items-center justify-center py-3 px-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 relative transition-colors group
            ${b.key === activeFilter ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'}`}
        >
          {/* Active indicator */}
          {b.key === activeFilter && (
            <motion.div layoutId="bucket-bar-indicator"
              className="absolute inset-x-0 top-0 h-0.5 rounded-full"
              style={{ background: b.color }} />
          )}
          {/* Value */}
          <div className="text-sm font-bold font-mono leading-none mb-0.5" style={{ color: b.color }}>
            ₹{(b.amount / 100000).toFixed(1)}L
          </div>
          {/* Label */}
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{b.label}</div>
          {/* Count + pct */}
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{b.count} inv · {b.pct}%</div>
          {/* Mini progress bar */}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-100 dark:bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${b.pct}%` }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.7, ease: 'easeOut' }}
              className="h-full"
              style={{ background: b.color + '80' }}
            />
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AgingReport() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedRows, setSelectedRows]     = useState([]);
  const [detailRec, setDetailRec]           = useState(null);
  const [showAI, setShowAI]                 = useState(true);
  const [showAnalytics, setShowAnalytics]   = useState(true);
  const [bottomTab, setBottomTab]           = useState('forecast');
  const [showBottom, setShowBottom]         = useState(true);
  const [liveSync, setLiveSync]             = useState(true);

  const onFilterChange = useCallback((key, val) => {
    if (key === 'reset') { setFilters(DEFAULT_FILTERS); setSelectedRows([]); return; }
    setFilters(prev => ({ ...prev, [key]: val }));
  }, []);

  const filteredRows = useMemo(() => applyFilters(MOCK_AGING_ROWS, filters), [filters]);

  const handleSelect = useCallback((id) =>
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]), []);
  const handleSelectAll = useCallback(() =>
    setSelectedRows(prev => prev.length === filteredRows.length ? [] : filteredRows.map(r => r.id)), [filteredRows]);
  const handleBulkAction = useCallback((action, ids) => {
    if (action === 'clear') { setSelectedRows([]); return; }
    console.log('Bulk action:', action, 'on', ids.length, 'rows');
  }, []);
  const handleRowAction = useCallback((action, rec) => {
    if (action === 'view') setDetailRec(rec);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50 dark:shadow-blue-900/40">
              <FileBarChart2 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-none">
                AR Aging Report
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Analyze, forecast, prioritize, and optimize healthcare receivables with real-time aging intelligence
              </p>
            </div>
          </div>

          {/* Header quick stats */}
          <div className="hidden xl:flex items-center gap-0 divide-x divide-slate-200 dark:divide-slate-700 flex-none">
            {[
              { label: 'Total Outstanding', val: '₹5.28Cr', color: 'text-blue-600 dark:text-blue-400'    },
              { label: 'Overdue 90+ Days',  val: '₹1.43Cr', color: 'text-red-600 dark:text-red-400'      },
              { label: 'Avg Aging Days',    val: '54d',      color: 'text-amber-600 dark:text-amber-400'  },
              { label: 'High-Risk Accounts',val: '28',       color: 'text-rose-600 dark:text-rose-400'    },
            ].map(s => (
              <div key={s.label} className="text-center px-4 first:pl-0">
                <div className={`text-sm font-bold font-mono ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-none flex-wrap justify-end">
            {/* Live sync */}
            <button onClick={() => setLiveSync(p => !p)}
              className={`hidden sm:flex items-center gap-1.5 h-9 px-2.5 rounded-xl border text-[11px] font-medium transition-colors
                ${liveSync
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
              {liveSync ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}
              {liveSync ? 'Live' : 'Offline'}
            </button>

            {/* Secondary actions */}
            {[
              { icon: Download,     tip: 'Export Report'   },
              { icon: Send,         tip: 'Send Reminders'  },
              { icon: UserCheck,    tip: 'Assign Collectors'},
              { icon: CalendarClock,tip: 'Schedule Report' },
              { icon: RefreshCw,    tip: 'Refresh'         },
            ].map(a => (
              <button key={a.tip} title={a.tip}
                className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center">
                <a.icon size={15} />
              </button>
            ))}

            {/* AI toggle */}
            <button onClick={() => setShowAI(p => !p)}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-semibold transition-colors
                ${showAI
                  ? 'border-cyan-400 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-700 dark:text-cyan-400'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-cyan-300'}`}>
              <Sparkles size={13} />AI
              {showAI ? <PanelRightClose size={12} /> : <PanelRightOpen size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Ribbon ─────────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <AgingKPIRibbon />
      </div>

      {/* ── Bucket Summary Bar ─────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900">
        <BucketSummaryBar activeFilter={filters.aging} onFilterClick={v => onFilterChange('aging', v)} />
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <AgingFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        selectedRows={selectedRows}
        onBulkAction={handleBulkAction}
        totalCount={MOCK_AGING_ROWS.length}
        filteredCount={filteredRows.length}
      />

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left/center column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Analytics Hub (collapsible) */}
          <AnimatePresence initial={false}>
            {showAnalytics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="flex-none overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
              >
                <div className="p-4">
                  <AgingAnalyticsHub />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analytics toggle strip */}
          <button
            onClick={() => setShowAnalytics(p => !p)}
            className="flex-none flex items-center justify-center gap-1.5 h-6 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <BarChart2 size={10} />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            <ChevronDown size={10} className={`transition-transform ${showAnalytics ? 'rotate-180' : ''}`} />
          </button>

          {/* Aging Grid */}
          <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
            <AgingGrid
              rows={filteredRows}
              selectedRows={selectedRows}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onRowClick={setDetailRec}
              onAction={handleRowAction}
            />
          </div>

          {/* ── Bottom Panel ──────────────────────────────────────────────── */}
          <div className="flex-none border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            {/* Tab bar */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4">
              {BOTTOM_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setBottomTab(t.id); setShowBottom(true); }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
                    ${bottomTab === t.id && showBottom
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <t.icon size={12} />{t.label}
                  {t.id === 'leakage' && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">6</span>
                  )}
                </button>
              ))}
              <button onClick={() => setShowBottom(p => !p)}
                className="ml-auto px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <ChevronDown size={14} className={`transition-transform ${showBottom ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Bottom panel content */}
            <AnimatePresence>
              {showBottom && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 380, opacity: 1 }}
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
                        {bottomTab === 'forecast' && <AgingForecastPanel />}
                        {bottomTab === 'leakage'  && <AgingLeakagePanel />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right AI Panel ────────────────────────────────────────────────── */}
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
                <AgingAIPanel onClose={() => setShowAI(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailRec && (
          <AgingDetailDrawer rec={detailRec} onClose={() => setDetailRec(null)} />
        )}
      </AnimatePresence>

      {/* ── Keyboard shortcut hint ─────────────────────────────────────────── */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 2.5, duration: 0.5 }}
          className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 shadow-sm text-[10px] text-slate-500 dark:text-slate-500"
        >
          {[
            ['⌘K','Search'], ['⌘E','Export'], ['/','Filter'], ['A','Analytics'], ['Esc','Close'],
          ].map(([key, lbl]) => (
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
