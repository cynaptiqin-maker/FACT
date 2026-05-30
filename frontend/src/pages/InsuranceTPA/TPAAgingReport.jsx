// TPA Aging Report — World-class enterprise TPA receivables management
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Send, CreditCard, AlertTriangle, Download, Sparkles,
  RefreshCw, Wifi, WifiOff, ChevronDown, GitMerge, Activity,
  TrendingDown, Zap, BarChart2, PanelRightClose, PanelRightOpen,
  IndianRupee, Shield, XCircle, Phone, ChevronUp,
} from 'lucide-react';

import TARKPIRibbon        from './TAR/TARKPIRibbon';
import TARFilterBar        from './TAR/TARFilterBar';
import TARGrid             from './TAR/TARGrid';
import TARDetailDrawer     from './TAR/TARDetailDrawer';
import TARAIPanel          from './TAR/TARAIPanel';
import TARAgingDashboard   from './TAR/TARAgingDashboard';
import TARRecoveryPanel    from './TAR/TARRecoveryPanel';
import TARDenialRiskPanel  from './TAR/TARDenialRiskPanel';
import TARSettlementForecast from './TAR/TARSettlementForecast';
import { MOCK_AGING_CLAIMS, fmtINR } from './TAR/TARConstants';

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'aging',      label: 'Aging Analysis',      icon: BarChart2   },
  { id: 'recovery',   label: 'Recovery Analytics',  icon: Activity    },
  { id: 'denial',     label: 'Denial & Risk',       icon: TrendingDown},
  { id: 'settlement', label: 'Settlement Forecast', icon: GitMerge    },
];

// ─── Custom hook: Filters ─────────────────────────────────────────────────────
function useFilters() {
  const [filters, setFilters] = useState({
    search:     '',
    aging:      'all',
    tpa:        'all',
    claimType:  'all',
    department: 'all',
    risk:       'all',
    followUp:   'all',
    settlement: 'all',
    branch:     'all',
    workflow:   'all',
  });

  const onFilterChange = useCallback((key, value) => {
    if (key === 'reset') {
      setFilters({
        search: '', aging: 'all', tpa: 'all', claimType: 'all',
        department: 'all', risk: 'all', followUp: 'all',
        settlement: 'all', branch: 'all', workflow: 'all',
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  return { filters, onFilterChange };
}

// ─── Filter logic ─────────────────────────────────────────────────────────────
function applyFilters(claims, f) {
  return claims.filter(c => {
    if (f.search) {
      const q   = f.search.toLowerCase();
      const hay = [c.id, c.patientName, c.uhid, c.invoiceNo, c.tpa, c.department, c.doctor, c.diagnosis, c.arEntryNo]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.aging      !== 'all' && c.agingBucket      !== f.aging)                     return false;
    if (f.tpa        !== 'all' && c.tpa              !== f.tpa)                        return false;
    if (f.claimType  !== 'all' && c.claimType        !== f.claimType)                  return false;
    if (f.department !== 'all' && c.department       !== f.department)                 return false;
    if (f.risk       !== 'all' && c.riskLevel        !== f.risk.toUpperCase())         return false;
    if (f.followUp   !== 'all' && c.followUpStatus   !== f.followUp.toUpperCase())     return false;
    if (f.settlement !== 'all' && c.settlementStatus !== f.settlement.toUpperCase())   return false;
    if (f.branch     !== 'all' && c.branch           !== f.branch)                     return false;
    return true;
  });
}

// ─── Computed header stats from mock data ─────────────────────────────────────
function computeStats(claims) {
  const total       = claims.reduce((s, c) => s + (c.outstandingAmount ?? 0), 0);
  const overdue90   = claims.filter(c => c.agingDays > 90).reduce((s, c) => s + (c.outstandingAmount ?? 0), 0);
  const critical    = claims.filter(c => c.riskLevel === 'CRITICAL').length;
  const highRisk    = claims.filter(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length;
  return { total, overdue90, critical, highRisk };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TPAAgingReport() {
  const { filters, onFilterChange } = useFilters();
  const [selectedRows,  setSelectedRows]  = useState([]);
  const [expandedRow,   setExpandedRow]   = useState(null);
  const [detailClaim,   setDetailClaim]   = useState(null);
  const [showAI,        setShowAI]        = useState(true);
  const [bottomTab,     setBottomTab]     = useState('aging');
  const [showBottom,    setShowBottom]    = useState(true);
  const [liveSync,      setLiveSync]      = useState(true);
  const [actionsOpen,   setActionsOpen]   = useState(false);
  const [kpiFilter,     setKpiFilter]     = useState(null);

  // Filtered dataset
  const filteredClaims = useMemo(
    () => applyFilters(MOCK_AGING_CLAIMS, filters),
    [filters],
  );

  // Header stats
  const stats = useMemo(() => computeStats(MOCK_AGING_CLAIMS), []);
  const filteredStats = useMemo(() => computeStats(filteredClaims), [filteredClaims]);

  // KPI ribbon filter logic
  const handleBucketFilter = useCallback((kpiId) => {
    const BUCKET_MAP = {
      bucket0_30:   'current',
      bucket31_60:  'days31',
      bucket61_90:  'days61',
      bucket91_180: 'days91',
      bucket180plus:'days121',
    };
    const bucket = BUCKET_MAP[kpiId];
    if (bucket) {
      setKpiFilter(kpiId === kpiFilter ? null : kpiId);
      onFilterChange('aging', kpiId === kpiFilter ? 'all' : bucket);
    } else {
      setKpiFilter(kpiId === kpiFilter ? null : kpiId);
    }
  }, [kpiFilter, onFilterChange]);

  const handleBulkAction = useCallback((action) => {
    console.log('Bulk action:', action, selectedRows);
  }, [selectedRows]);

  const secondaryActions = [
    { id: 'followup',  label: 'Start Follow-up',    icon: Phone,           color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { id: 'settle',    label: 'Record Settlement',   icon: CreditCard,      color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { id: 'escalate',  label: 'Escalate',            icon: AlertTriangle,   color: 'bg-red-500 hover:bg-red-600 text-white' },
    { id: 'export',    label: 'Export',              icon: Download,        color: 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white' },
    { id: 'reconcile', label: 'Reconcile',           icon: GitMerge,        color: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800' },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-950">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <header className="flex-none bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          {/* Title block */}
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Clock size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                TPA Aging Report
              </h1>
              {/* Live sync dot */}
              <button
                onClick={() => setLiveSync(s => !s)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-all
                  ${liveSync
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
              >
                {liveSync
                  ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><Wifi size={10} />Live</>
                  : <><WifiOff size={10} />Paused</>
                }
              </button>
            </div>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 ml-11">
              Monitor, recover, reconcile, and optimize enterprise insurance receivables in real time.
            </p>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {secondaryActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  className={`flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold transition-colors ${action.color}`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              );
            })}

            {/* AI toggle */}
            <button
              onClick={() => setShowAI(s => !s)}
              className={`flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold border transition-all
                ${showAI
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Sparkles size={14} />
              AI
            </button>
          </div>
        </div>

        {/* Header stats chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatChip
            icon={IndianRupee}
            label="Total Outstanding"
            value={fmtINR(stats.total)}
            color="indigo"
          />
          <StatChip
            icon={AlertTriangle}
            label="90d+ Overdue"
            value={fmtINR(stats.overdue90)}
            color="red"
          />
          <StatChip
            icon={Shield}
            label="High-Risk Claims"
            value={`${stats.highRisk} claims`}
            color="orange"
          />
          <StatChip
            icon={XCircle}
            label="Critical Risk"
            value={`${stats.critical} critical`}
            color="red"
          />
          {filteredClaims.length !== MOCK_AGING_CLAIMS.length && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40">
              <Zap size={10} />
              Filtered: {filteredClaims.length} of {MOCK_AGING_CLAIMS.length} records
            </motion.div>
          )}
        </div>
      </header>

      {/* ── KPI Ribbon ───────────────────────────────────────────────── */}
      <TARKPIRibbon onBucketFilter={handleBucketFilter} activeFilter={kpiFilter} />

      {/* ── Filter Bar ───────────────────────────────────────────────── */}
      <TARFilterBar
        filters={filters}
        onChange={onFilterChange}
        total={MOCK_AGING_CLAIMS.length}
        filtered={filteredClaims.length}
        selectedCount={selectedRows.length}
        onBulkAction={handleBulkAction}
      />

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: Grid + Bottom Panels ─────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Grid */}
          <div className="flex-1 min-h-0 overflow-auto">
            <TARGrid
              claims={filteredClaims}
              selectedRows={selectedRows}
              onSelectionChange={setSelectedRows}
              expandedRow={expandedRow}
              onExpandRow={setExpandedRow}
              onViewDetail={setDetailClaim}
            />
          </div>

          {/* ── Bottom Analytics Panel ─────────────────────────────── */}
          {showBottom && (
            <div className="flex-none border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* Tab bar */}
              <div className="flex items-center gap-1 px-4 py-1.5 border-b border-slate-200 dark:border-slate-800">
                {BOTTOM_TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setBottomTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg transition-colors
                        ${bottomTab === tab.id
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                      <Icon size={12} />
                      {tab.label}
                    </button>
                  );
                })}
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => setShowBottom(false)}
                    className="flex items-center gap-1 px-2 py-1.5 text-[10.5px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronDown size={12} />
                    Hide
                  </button>
                </div>
              </div>

              {/* Tab Panels */}
              <div className="max-h-[500px] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {bottomTab === 'aging' && (
                    <motion.div key="aging"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}>
                      <TARAgingDashboard />
                    </motion.div>
                  )}
                  {bottomTab === 'recovery' && (
                    <motion.div key="recovery"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}>
                      <TARRecoveryPanel />
                    </motion.div>
                  )}
                  {bottomTab === 'denial' && (
                    <motion.div key="denial"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}>
                      <TARDenialRiskPanel />
                    </motion.div>
                  )}
                  {bottomTab === 'settlement' && (
                    <motion.div key="settlement"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}>
                      <TARSettlementForecast />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Show bottom button when hidden */}
          {!showBottom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-none border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2"
            >
              <button
                onClick={() => setShowBottom(true)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
              >
                <ChevronUp size={13} />
                Show Analytics Panels
              </button>
            </motion.div>
          )}
        </div>

        {/* ── Right: AI Panel ───────────────────────────────────────── */}
        <AnimatePresence>
          {showAI && (
            <TARAIPanel key="ai-panel" onClose={() => setShowAI(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail Drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailClaim && (
          <TARDetailDrawer
            key="detail-drawer"
            claim={detailClaim}
            onClose={() => setDetailClaim(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── StatChip component ───────────────────────────────────────────────────────
function StatChip({ icon: Icon, label, value, color }) {
  const COLOR_MAP = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/40 text-indigo-700 dark:text-indigo-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/40 text-orange-700 dark:text-orange-400',
    red:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40 text-red-700 dark:text-red-400',
    emerald:'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold ${COLOR_MAP[color] ?? COLOR_MAP.indigo}`}>
      <Icon size={11} />
      <span className="text-[10px] opacity-70">{label}:</span>
      <span className="font-bold font-mono">{value}</span>
    </div>
  );
}
