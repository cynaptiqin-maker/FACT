// ─── Depreciation Runs — Enterprise Healthcare FinOS Workspace ───────────────
// Violet/Purple theme · Multi-book · AI-assisted · Deeply cross-module integrated
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, Play, Calendar, RefreshCw, RotateCcw, Download,
  Sparkles, ClipboardList, BookOpen, BarChart3, Landmark, AlertTriangle,
  Wifi, WifiOff, Shield, Activity, Layers,
} from 'lucide-react';

import DRKPIRibbon          from './DRKPIRibbon';
import DRFilterBar          from './DRFilterBar';
import DRGrid               from './DRGrid';
import DRDetailDrawer       from './DRDetailDrawer';
import DRAIPanel            from './DRAIPanel';
import DRAnalyticsDashboard from './DRAnalyticsDashboard';
import DRAuditTimeline      from './DRAuditTimeline';
import DRAccountingPanel    from './DRAccountingPanel';
import DRMultiBookPanel     from './DRMultiBookPanel';
import DRTreasuryPanel      from './DRTreasuryPanel';
import { MOCK_RUNS, fmtINR, AI_INSIGHTS } from './DRConstants';

// ─── Bottom Panel Tabs ────────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'analytics',   label: 'Depreciation Analytics', icon: BarChart3    },
  { id: 'accounting',  label: 'GL Accounting Impact',   icon: BookOpen     },
  { id: 'multibook',   label: 'Multi-Book Compliance',  icon: Layers       },
  { id: 'treasury',    label: 'Treasury & Forecast',    icon: Landmark     },
  { id: 'audit',       label: 'Audit Timeline',         icon: ClipboardList},
];

// ─── Header Quick Actions ─────────────────────────────────────────────────────
const HEADER_ACTIONS = [
  { id: 'run',       label: 'Run Depreciation', icon: Play,       primary: true  },
  { id: 'schedule',  label: 'Schedule',         icon: Calendar,   primary: false },
  { id: 'recalc',    label: 'Recalculate',      icon: RefreshCw,  primary: false },
  { id: 'reverse',   label: 'Reverse',          icon: RotateCcw,  primary: false },
  { id: 'export',    label: 'Export',           icon: Download,   primary: false },
  { id: 'ai',        label: 'AI Analysis',      icon: Sparkles,   primary: false, ai: true },
  { id: 'audit',     label: 'Audit Logs',       icon: ClipboardList, primary: false },
];

// ─── Filter Logic ─────────────────────────────────────────────────────────────
function useFilters() {
  const [filters, setFilters] = useState({
    search:       '',
    book:         'all',
    method:       'all',
    branch:       'all',
    category:     'all',
    status:       'all',
    glStatus:     'all',
    compliance:   'all',
    risk:         'all',
    aiAnomalies:  false,
    hasImpairment:false,
    reversed:     false,
    fraudFlagged: false,
  });

  const onFilterChange = useCallback((key, value) => {
    if (key === 'reset') {
      setFilters({
        search: '', book: 'all', method: 'all', branch: 'all',
        category: 'all', status: 'all', glStatus: 'all', compliance: 'all',
        risk: 'all', aiAnomalies: false, hasImpairment: false,
        reversed: false, fraudFlagged: false,
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  return { filters, onFilterChange };
}

function applyFilters(runs, f) {
  return runs.filter(r => {
    if (f.search) {
      const q   = f.search.toLowerCase();
      const hay = [r.id, r.period, r.book, r.method, r.branch, r.assetCategory, r.createdBy, r.journalRef, r.notes]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.book       !== 'all' && r.book             !== f.book)       return false;
    if (f.method     !== 'all' && r.method            !== f.method)     return false;
    if (f.branch     !== 'all' && r.branch            !== f.branch)     return false;
    if (f.category   !== 'all' && r.assetCategory     !== f.category)   return false;
    if (f.status     !== 'all' && r.workflowStatus    !== f.status)     return false;
    if (f.glStatus   !== 'all' && r.glStatus          !== f.glStatus)   return false;
    if (f.compliance !== 'all' && r.complianceStatus  !== f.compliance) return false;
    if (f.risk       !== 'all' && r.riskLevel         !== f.risk)       return false;
    if (f.aiAnomalies   && r.riskLevel !== 'HIGH' && r.riskLevel !== 'CRITICAL') return false;
    if (f.hasImpairment && !(r.impairmentImpact > 0))                   return false;
    if (f.reversed      && r.workflowStatus !== 'REVERSED')             return false;
    if (f.fraudFlagged  && (!r.fraudFlags || r.fraudFlags.length === 0)) return false;
    return true;
  });
}

// ─── Summary Ribbon ───────────────────────────────────────────────────────────
function SummaryRibbon({ runs, liveSync }) {
  const posted       = runs.filter(r => r.workflowStatus === 'POSTED' || r.workflowStatus === 'RECONCILED').length;
  const pending      = runs.filter(r => r.workflowStatus === 'PENDING' || r.workflowStatus === 'PREVIEWED').length;
  const criticalRisk = runs.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length;
  const totalAmt     = runs.reduce((s, r) => s + (r.currentDep || 0), 0);
  const impaired     = runs.filter(r => r.impairmentImpact > 0).length;
  const fraudged     = runs.filter(r => r.fraudFlags?.length > 0).length;

  return (
    <div className="flex items-center gap-3 flex-wrap text-[10.5px]">
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${liveSync ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
        <span className="text-slate-500 dark:text-slate-400">{liveSync ? 'Live' : 'Offline'}</span>
      </div>
      <span className="text-slate-300 dark:text-slate-600">|</span>
      <span className="text-slate-500 dark:text-slate-400">
        <span className="font-bold text-emerald-600 dark:text-emerald-400">{posted}</span> posted
      </span>
      <span className="text-slate-300 dark:text-slate-600">·</span>
      <span className="text-slate-500 dark:text-slate-400">
        <span className="font-bold text-amber-600 dark:text-amber-400">{pending}</span> pending
      </span>
      <span className="text-slate-300 dark:text-slate-600">·</span>
      <span className="text-slate-500 dark:text-slate-400">
        Total: <span className="font-bold text-violet-700 dark:text-violet-400">{fmtINR(totalAmt)}</span>
      </span>
      {criticalRisk > 0 && (
        <>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="flex items-center gap-1 text-red-500 font-semibold">
            <AlertTriangle size={11} /> {criticalRisk} high-risk
          </span>
        </>
      )}
      {impaired > 0 && (
        <>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="flex items-center gap-1 text-orange-500 font-semibold">
            <Activity size={11} /> {impaired} impairment
          </span>
        </>
      )}
      {fraudged > 0 && (
        <>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="flex items-center gap-1 text-rose-500 font-semibold">
            <Shield size={11} /> {fraudged} fraud flags
          </span>
        </>
      )}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
function PageHeader({ filteredRuns, liveSync, onToggleLive, onAction, showAI, onToggleAI }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <TrendingDown size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Depreciation Runs</h1>
            <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
              Fixed Assets
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 ml-[2.6rem]">
            Multi-book depreciation engine · IFRS · Statutory · IT Act · Impairment · Compliance · Treasury intelligence
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {HEADER_ACTIONS.map(a => {
            const Icon     = a.icon;
            const isActive = a.ai && showAI;
            return (
              <button
                key={a.id}
                onClick={() => a.ai ? onToggleAI() : onAction(a.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                  a.primary
                    ? 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600'
                    : isActive
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Icon size={12} className={a.ai && !isActive ? 'text-violet-500' : ''} />
                <span className="hidden sm:inline">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Ribbon */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SummaryRibbon runs={filteredRuns} liveSync={liveSync} />
        <button
          onClick={onToggleLive}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10.5px] font-medium transition-colors ${
            liveSync
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 text-slate-400'
          }`}
        >
          {liveSync ? <Wifi size={11} /> : <WifiOff size={11} />}
          {liveSync ? 'Live sync' : 'Reconnect'}
        </button>
      </div>
    </div>
  );
}

// ─── Bottom Analytics Panel ───────────────────────────────────────────────────
function BottomPanel({ activeTab, onTabChange }) {
  return (
    <div>
      {/* Tab Selector */}
      <div className="flex items-center gap-1 mb-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit overflow-x-auto scrollbar-hide">
        {BOTTOM_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={11} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'analytics'  && <DRAnalyticsDashboard />}
          {activeTab === 'accounting' && <DRAccountingPanel />}
          {activeTab === 'multibook'  && <DRMultiBookPanel />}
          {activeTab === 'treasury'   && <DRTreasuryPanel />}
          {activeTab === 'audit'      && <DRAuditTimeline />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Floating AI FAB ──────────────────────────────────────────────────────────
function FloatingAIFab({ onClick, insightCount }) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-shadow z-30"
      title="Open AI Depreciation Assistant"
    >
      <Sparkles size={18} />
      {insightCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
          {insightCount}
        </span>
      )}
    </motion.button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DepreciationRuns() {
  const { filters, onFilterChange } = useFilters();
  const [selectedRun, setSelectedRun] = useState(null);
  const [showAI,      setShowAI]      = useState(false);
  const [bottomTab,   setBottomTab]   = useState('analytics');
  const [liveSync,    setLiveSync]    = useState(true);

  const filteredRuns = useMemo(
    () => applyFilters(MOCK_RUNS, filters),
    [filters]
  );

  const handleAction = useCallback((actionId) => {
    console.log('Header action:', actionId);
  }, []);

  const criticalInsights = AI_INSIGHTS.filter(i => i.severity === 'CRITICAL').length;

  return (
    <div className="flex h-full min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Main Workspace */}
      <div className={`flex-1 min-w-0 flex flex-col gap-4 p-4 lg:p-6 transition-all duration-300 ${showAI ? 'mr-[360px]' : ''}`}>

        {/* Page Header */}
        <PageHeader
          filteredRuns={filteredRuns}
          liveSync={liveSync}
          onToggleLive={() => setLiveSync(v => !v)}
          onAction={handleAction}
          showAI={showAI}
          onToggleAI={() => setShowAI(v => !v)}
        />

        {/* KPI Ribbon */}
        <DRKPIRibbon />

        {/* Filter Bar */}
        <DRFilterBar
          filters={filters}
          onChange={onFilterChange}
          resultCount={filteredRuns.length}
          totalCount={MOCK_RUNS.length}
        />

        {/* Data Grid */}
        <DRGrid
          runs={filteredRuns}
          onOpenDrawer={setSelectedRun}
        />

        {/* Bottom Analytics Panel */}
        <BottomPanel
          activeTab={bottomTab}
          onTabChange={setBottomTab}
        />
      </div>

      {/* Right AI Panel — Slide in */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-0 top-0 h-full w-[360px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-xl z-20 overflow-hidden"
          >
            <DRAIPanel onClose={() => setShowAI(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI FAB (visible when AI panel is closed) */}
      {!showAI && (
        <FloatingAIFab onClick={() => setShowAI(true)} insightCount={criticalInsights} />
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedRun && (
          <DRDetailDrawer
            run={selectedRun}
            onClose={() => setSelectedRun(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
