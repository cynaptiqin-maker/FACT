// ─── Revenue Sharing — Enterprise Compensation Intelligence Workspace ──────────
// Amber/gold theme · Real-time · AI-assisted · Cross-module integrated
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Plus, CheckSquare, Download, Sparkles,
  ClipboardList, Wifi, WifiOff, ChevronDown,
  TrendingUp, Banknote, ShieldAlert, AlertTriangle,
  RefreshCw, GitBranch,
} from 'lucide-react';

import RSKPIRibbon   from './RS/RSKPIRibbon';
import RSFilterBar   from './RS/RSFilterBar';
import RSGrid        from './RS/RSGrid';
import RSAIPanel     from './RS/RSAIPanel';
import {
  RSRevenuePanel,
  RSTreasuryPanel,
  RSFraudMonitor,
  RSAuditTimeline,
} from './RS/RSAnalyticsPanels';
import { MOCK_RULES } from './RS/RSConstants';

// ─── Bottom Panel Tabs ────────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'revenue',  label: 'Revenue Analytics',    icon: TrendingUp   },
  { id: 'treasury', label: 'Treasury & Settlement', icon: Banknote     },
  { id: 'fraud',    label: 'Fraud Monitor',         icon: ShieldAlert  },
  { id: 'audit',    label: 'Audit & Workflow',      icon: ClipboardList },
];

// ─── Header Quick Actions ─────────────────────────────────────────────────────
const HEADER_ACTIONS = [
  { id: 'new',      label: 'New Rule',          icon: Plus         },
  { id: 'approve',  label: 'Approve Selected',  icon: CheckSquare  },
  { id: 'export',   label: 'Export',            icon: Download     },
  { id: 'refresh',  label: 'Refresh Data',      icon: RefreshCw    },
  { id: 'branch',   label: 'Branch Override',   icon: GitBranch    },
  { id: 'ai',       label: 'AI Analysis',       icon: Sparkles     },
  { id: 'audit',    label: 'Audit Logs',        icon: ClipboardList },
];

// ─── Default Filters ──────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  search: '', department: '', revenueModel: '', status: '', riskLevel: '',
  realization: '', aiAnomaly: false,
};

// ─── Filter Logic ─────────────────────────────────────────────────────────────
function applyFilters(rules, f) {
  return rules.filter(r => {
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = [r.id, r.doctor, r.department, r.revenueModel, r.status]
        .filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.department   && r.department   !== f.department)   return false;
    if (f.revenueModel && r.revenueModel !== f.revenueModel) return false;
    if (f.status       && r.status       !== f.status)       return false;
    if (f.riskLevel    && r.riskLevel    !== f.riskLevel)    return false;
    if (f.aiAnomaly    && !r.aiFlag)                         return false;
    if (f.realization) {
      const pct = r.totalBilled > 0 ? (r.realized / r.totalBilled) * 100 : 0;
      if (f.realization === 'realized'   && pct < 95)               return false;
      if (f.realization === 'partial'    && (pct < 50 || pct >= 95)) return false;
      if (f.realization === 'unrealized' && pct >= 50)              return false;
    }
    return true;
  });
}

// ─── Summary Ribbon ───────────────────────────────────────────────────────────
function SummaryRibbon({ rules, liveSync }) {
  const pendingCount  = rules.filter(r => r.status === 'UNDER_REVIEW').length;
  const riskCount     = rules.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length;
  const totalRevenue  = rules.reduce((s, r) => s + (r.totalBilled || 0), 0);
  const totalRealized = rules.reduce((s, r) => s + (r.realized || 0), 0);
  const fmtL = n => `₹${(n / 100000).toFixed(1)}L`;

  return (
    <div className="flex items-center gap-4 text-xs flex-wrap mt-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400 dark:text-slate-500">Gross Revenue</span>
        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{fmtL(totalRevenue)}</span>
      </div>
      <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400 dark:text-slate-500">Realized</span>
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmtL(totalRealized)}</span>
      </div>
      <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400 dark:text-slate-500">Pending Review</span>
        <span className={`font-mono font-bold ${pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
          {pendingCount}
        </span>
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
      <div className={`flex items-center gap-1 ${liveSync ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'}`}>
        {liveSync ? <Wifi size={11} /> : <WifiOff size={11} />}
        <span className="text-[10.5px]">{liveSync ? 'Live' : 'Offline'}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RevenueSharing() {
  const [filters, setFilters]         = useState(DEFAULT_FILTERS);
  const [showAI, setShowAI]           = useState(true);
  const [bottomTab, setBottomTab]     = useState('revenue');
  const [showBottom, setShowBottom]   = useState(true);
  const [liveSync, setLiveSync]       = useState(true);
  const [actionsOpen, setActionsOpen] = useState(false);

  const handleFilterChange = useCallback((patch) => {
    setFilters(prev => ({ ...prev, ...patch }));
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Used only for the summary ribbon — RSGrid does its own filtering internally
  const filteredRules = useMemo(() => applyFilters(MOCK_RULES, filters), [filters]);

  return (
    <div className="flex flex-col min-h-0">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Share2 size={20} className="text-amber-600 dark:text-amber-400" />
            Revenue Sharing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure, monitor, and optimize doctor revenue allocation rules with AI-powered anomaly detection.
          </p>
          <SummaryRibbon rules={filteredRules} liveSync={liveSync} />
        </div>

        <div className="flex items-center gap-2 flex-none flex-wrap justify-end">
          {/* Live sync toggle */}
          <button
            onClick={() => setLiveSync(o => !o)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              liveSync
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            {liveSync ? <Wifi size={12} /> : <WifiOff size={12} />}
            {liveSync ? 'Live' : 'Offline'}
          </button>

          {/* AI toggle */}
          <button
            onClick={() => setShowAI(o => !o)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              showAI
                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles size={12} />
            AI
          </button>

          {/* Primary CTA */}
          <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors">
            <Plus size={13} />
            New Rule
          </button>

          {/* Actions dropdown */}
          <div className="relative">
            <button
              onClick={() => setActionsOpen(o => !o)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-amber-300 transition-all"
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

      {/* ── Main Content: Workspace + AI Panel ───────────────────────── */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* ── Workspace ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          <RSKPIRibbon />

          <RSFilterBar
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleFilterReset}
          />

          <RSGrid filters={filters} onSelect={() => {}} />

          {/* ── Bottom Analytics ───────────────────────────────────── */}
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
                          ? 'border-amber-500 text-amber-600 dark:text-amber-400'
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
                        {bottomTab === 'revenue'  && <RSRevenuePanel  />}
                        {bottomTab === 'treasury' && <RSTreasuryPanel />}
                        {bottomTab === 'fraud'    && <RSFraudMonitor  />}
                        {bottomTab === 'audit'    && <RSAuditTimeline />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right AI Panel ─────────────────────────────────────────── */}
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
                <RSAIPanel onClose={() => setShowAI(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
