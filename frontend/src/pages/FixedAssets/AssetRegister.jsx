// ─── Asset Register — Enterprise Healthcare Asset Intelligence Workspace ──────
// Sky/Cyan theme · Real-time · AI-assisted · Deeply cross-module integrated
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, CheckSquare, ArrowRightLeft, Trash2, Download,
  Sparkles, ClipboardList, RefreshCw, Wifi, WifiOff, ChevronDown,
  Wrench, RotateCcw, TrendingDown, BarChart3, Activity, Shield,
  AlertTriangle, BookOpen, GitMerge,
} from 'lucide-react';

import ARKPIRibbon          from './AR/ARKPIRibbon';
import ARFilterBar          from './AR/ARFilterBar';
import ARGrid               from './AR/ARGrid';
import ARDetailDrawer       from './AR/ARDetailDrawer';
import ARAIPanel            from './AR/ARAIPanel';
import ARLifecycleDashboard from './AR/ARLifecycleDashboard';
import ARAuditTimeline      from './AR/ARAuditTimeline';
import { MOCK_ASSETS, fmtINR } from './AR/ARConstants';

// ─── Bottom Panel Tabs ────────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'lifecycle', label: 'Lifecycle Analytics',    icon: BarChart3    },
  { id: 'audit',     label: 'Audit & Event Timeline', icon: ClipboardList},
];

// ─── Header Quick Actions ─────────────────────────────────────────────────────
const HEADER_ACTIONS = [
  { id: 'add',         label: 'Add Asset',            icon: Plus          },
  { id: 'capitalize',  label: 'Capitalize',           icon: BookOpen      },
  { id: 'transfer',    label: 'Transfer Asset',       icon: ArrowRightLeft},
  { id: 'dispose',     label: 'Dispose Asset',        icon: Trash2        },
  { id: 'maintenance', label: 'Schedule Maintenance', icon: Wrench        },
  { id: 'export',      label: 'Export',               icon: Download      },
  { id: 'ai',          label: 'AI Analysis',          icon: Sparkles      },
  { id: 'audit',       label: 'Audit Logs',           icon: ClipboardList },
];

// ─── Filter Logic ─────────────────────────────────────────────────────────────
function useFilters() {
  const [filters, setFilters] = useState({
    search:       '',
    category:     'all',
    department:   'all',
    branch:       'all',
    status:       'all',
    amcStatus:    'all',
    insurance:    'all',
    risk:         'all',
    deprMethod:   'all',
    aiRisk:       'all',
    maintenanceDue: 'all',
    idleOnly:     'all',
  });

  const onFilterChange = useCallback((key, value) => {
    if (key === 'reset') {
      setFilters({
        search: '', category: 'all', department: 'all', branch: 'all',
        status: 'all', amcStatus: 'all', insurance: 'all', risk: 'all',
        deprMethod: 'all', aiRisk: 'all', maintenanceDue: 'all', idleOnly: 'all',
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  return { filters, onFilterChange };
}

function applyFilters(assets, f) {
  return assets.filter(a => {
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = [a.id, a.assetName, a.assetCategory, a.department, a.branch, a.vendor, a.serialNumber, a.subCategory, ...a.tags]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.category    !== 'all' && a.assetCategory     !== f.category)    return false;
    if (f.department  !== 'all' && a.department        !== f.department)  return false;
    if (f.branch      !== 'all' && a.branch            !== f.branch)      return false;
    if (f.status      !== 'all' && a.workflowState     !== f.status)      return false;
    if (f.amcStatus   !== 'all' && a.amcStatus         !== f.amcStatus)   return false;
    if (f.insurance   !== 'all' && a.insuranceStatus   !== f.insurance)   return false;
    if (f.risk        !== 'all' && a.riskLevel         !== f.risk)        return false;
    if (f.deprMethod  !== 'all' && a.depreciationMethod !== f.deprMethod) return false;
    if (f.aiRisk      === true  && a.riskLevel !== 'HIGH' && a.riskLevel !== 'CRITICAL') return false;
    if (f.maintenanceDue === true && a.maintenanceStatus !== 'DUE' && a.maintenanceStatus !== 'OVERDUE') return false;
    if (f.idleOnly    === true  && a.utilizationStatus !== 'IDLE') return false;
    return true;
  });
}

// ─── Summary Ribbon ───────────────────────────────────────────────────────────
function SummaryRibbon({ assets, liveSync }) {
  const activeCount      = assets.filter(a => a.workflowState === 'ACTIVE').length;
  const highRiskCount    = assets.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length;
  const totalGross       = assets.reduce((s, a) => s + a.grossValue, 0);
  const totalNBV         = assets.reduce((s, a) => s + a.netBookValue, 0);
  const maintenanceDue   = assets.filter(a => a.maintenanceStatus === 'DUE' || a.maintenanceStatus === 'OVERDUE').length;
  const amcExpiring      = assets.filter(a => a.amcStatus === 'EXPIRING_SOON').length;

  return (
    <div className="flex items-center gap-3 flex-wrap text-[10.5px]">
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${liveSync ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
        <span className="text-slate-500 dark:text-slate-400">{liveSync ? 'Live' : 'Offline'}</span>
      </div>
      <span className="text-slate-300 dark:text-slate-600">|</span>
      <span className="text-slate-500 dark:text-slate-400">{activeCount} active assets</span>
      <span className="text-slate-300 dark:text-slate-600">·</span>
      <span className="text-slate-500 dark:text-slate-400">Gross: <span className="font-bold text-sky-700 dark:text-sky-400">{fmtINR(totalGross)}</span></span>
      <span className="text-slate-300 dark:text-slate-600">·</span>
      <span className="text-slate-500 dark:text-slate-400">NBV: <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmtINR(totalNBV)}</span></span>
      {highRiskCount > 0 && (
        <>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="flex items-center gap-1 text-red-500 font-semibold">
            <AlertTriangle size={11} /> {highRiskCount} high-risk
          </span>
        </>
      )}
      {maintenanceDue > 0 && (
        <>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="flex items-center gap-1 text-amber-500 font-semibold">
            <Wrench size={11} /> {maintenanceDue} maintenance due
          </span>
        </>
      )}
      {amcExpiring > 0 && (
        <>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="flex items-center gap-1 text-orange-500 font-semibold">
            <Shield size={11} /> {amcExpiring} AMC expiring
          </span>
        </>
      )}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
function PageHeader({ filteredAssets, liveSync, onToggleLive, onAction, showAI, onToggleAI }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-sm">
              <Package size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Asset Register</h1>
            <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
              Fixed Assets
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 ml-[2.6rem]">
            Track, capitalize, depreciate, maintain, and optimize enterprise healthcare assets in real time.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {HEADER_ACTIONS.map(a => {
            const Icon = a.icon;
            const isPrimary = a.id === 'add' || a.id === 'capitalize';
            const isAI      = a.id === 'ai';
            const isActive  = isAI && showAI;
            return (
              <button
                key={a.id}
                onClick={() => a.id === 'ai' ? onToggleAI() : onAction(a.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                  isPrimary
                    ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600'
                    : isActive
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Icon size={12} className={isAI && !isActive ? 'text-violet-500' : ''} />
                <span className="hidden sm:inline">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Ribbon */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SummaryRibbon assets={filteredAssets} liveSync={liveSync} />
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
      <div className="flex items-center gap-1 mb-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit">
        {BOTTOM_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-400 shadow-sm'
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
          {activeTab === 'lifecycle' && <ARLifecycleDashboard />}
          {activeTab === 'audit'     && <ARAuditTimeline />}
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
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-shadow z-30 group"
      title="Open AI Asset Assistant"
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
export default function AssetRegister() {
  const { filters, onFilterChange } = useFilters();
  const [selectedAsset, setSelectedAsset]   = useState(null);
  const [showAI,        setShowAI]          = useState(false);
  const [bottomTab,     setBottomTab]       = useState('lifecycle');
  const [liveSync,      setLiveSync]        = useState(true);

  const filteredAssets = useMemo(
    () => applyFilters(MOCK_ASSETS, filters),
    [filters]
  );

  const handleAction = useCallback((actionId) => {
    console.log('Header action:', actionId);
  }, []);

  const highRiskInsights = 3; // from AI_INSIGHTS with severity HIGH

  return (
    <div className="flex h-full min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Main Workspace */}
      <div className={`flex-1 min-w-0 flex flex-col gap-4 p-4 lg:p-6 transition-all duration-300 ${showAI ? 'mr-[360px]' : ''}`}>
        {/* Page Header */}
        <PageHeader
          filteredAssets={filteredAssets}
          liveSync={liveSync}
          onToggleLive={() => setLiveSync(v => !v)}
          onAction={handleAction}
          showAI={showAI}
          onToggleAI={() => setShowAI(v => !v)}
        />

        {/* KPI Ribbon */}
        <ARKPIRibbon />

        {/* Filter Bar */}
        <ARFilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          resultCount={filteredAssets.length}
          totalCount={MOCK_ASSETS.length}
        />

        {/* Asset Grid */}
        <ARGrid
          assets={filteredAssets}
          onOpenDrawer={setSelectedAsset}
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
            <ARAIPanel onClose={() => setShowAI(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI FAB (visible when AI panel is closed) */}
      {!showAI && (
        <FloatingAIFab onClick={() => setShowAI(true)} insightCount={highRiskInsights} />
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedAsset && (
          <ARDetailDrawer
            asset={selectedAsset}
            onClose={() => setSelectedAsset(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
