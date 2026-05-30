import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, RefreshCw, Sparkles, History, ChevronDown, Building2,
  Calendar, BarChart3, Shield, Plus, FileBarChart, Play,
  CheckCircle2, Settings, Zap, ArrowRight, TrendingUp,
  BookOpen, Bell, User, Search, Command, Globe,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import GLKPIRibbon    from './GL/GLKPIRibbon';
import GLFilterBar    from './GL/GLFilterBar';
import GLGrid         from './GL/GLGrid';
import GLDetailDrawer from './GL/GLDetailDrawer';
import GLAIPanel      from './GL/GLAIPanel';
import GLTrendChart   from './GL/GLTrendChart';
import { RECON_SUMMARY, LEDGER_ENTRIES } from './GL/glConstants';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  brand: '#1C3741',
  pearl: '#FFF7E6',
};

// ─── Context pill ──────────────────────────────────────────────────────────────
function CtxPill({ icon: Icon, label, value, accent = false }) {
  return (
    <button className={clsx(
      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all',
      accent
        ? 'bg-brand-800 text-pearl-100 border-brand-700 hover:bg-brand-700'
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
    )}>
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      {label && <span className="hidden sm:inline text-slate-400">{label}:</span>}
      <span className="font-semibold">{value}</span>
      <ChevronDown className="w-3 h-3 ml-0.5 opacity-50 flex-shrink-0" />
    </button>
  );
}

// ─── Header action button ──────────────────────────────────────────────────────
function ActionBtn({ icon: Icon, label, onClick, primary, ai, badge }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
        primary && 'bg-brand-800 text-pearl-100 border-brand-700 hover:bg-brand-700 shadow-sm',
        ai     && 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 shadow-sm hover:shadow-md',
        !primary && !ai && 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white
          text-[9px] font-bold flex items-center justify-center shadow">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Reconciliation status strip ──────────────────────────────────────────────
function ReconStrip() {
  const pct = RECON_SUMMARY.percentComplete;
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-center gap-2 flex-shrink-0">
        <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
        <span className="text-xs font-semibold text-slate-700">Reconciliation</span>
      </div>
      {/* Progress bar */}
      <div className="flex-1 min-w-[80px]">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="h-full bg-emerald-500 rounded-full"
          />
        </div>
      </div>
      <span className="text-xs font-bold text-emerald-600 flex-shrink-0">{pct}%</span>
      <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 flex-shrink-0">
        <span><span className="font-semibold text-emerald-600">{RECON_SUMMARY.reconciled.toLocaleString()}</span> matched</span>
        <span><span className="font-semibold text-amber-600">{RECON_SUMMARY.unreconciled}</span> pending</span>
        <span><span className="font-semibold text-violet-600">{RECON_SUMMARY.partial}</span> partial</span>
      </div>
      <button className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold
        text-brand-700 hover:bg-brand-50 rounded-lg transition-colors ml-auto flex-shrink-0">
        Run Auto-Reconcile <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Live indicator + sync info ────────────────────────────────────────────────
function LiveBar() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-slate-500">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium text-emerald-700">Live</span>
      </div>
      <span className="text-slate-300">·</span>
      <span>FY 2025-26</span>
      <span className="text-slate-300">·</span>
      <span>Period: May 2026</span>
      <span className="text-slate-300">·</span>
      <span>Synced <span className="text-slate-700 font-medium">2 min ago</span></span>
      <span className="text-slate-300">·</span>
      <span><span className="font-semibold text-slate-700">{LEDGER_ENTRIES.length}</span> entries this period</span>
    </div>
  );
}

// ─── Default filter state ──────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  search:   '',
  quick:    'all',
  branch:   'all',
  dept:     'all',
  vtype:    'all',
  status:   'all',
  recon:    'all',
  source:   'all',
  dateFrom: '',
  dateTo:   '',
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GeneralLedger() {
  const navigate = useNavigate();
  const [filters,      setFilters]      = useState(DEFAULT_FILTERS);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [rightPanel,   setRightPanel]   = useState('ai');   // 'ai' | 'detail' | null
  const [showChart,    setShowChart]    = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSelectEntry = useCallback((entry) => {
    setSelectedEntry(entry);
    setRightPanel('detail');
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedEntry(null);
    setRightPanel('ai');
  }, []);

  const handleCloseAI = useCallback(() => {
    setRightPanel(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Ledger refreshed — 3 new entries');
    }, 1200);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans" style={{ '--topbar': '60px' }}>

      {/* ═══════════════════════════════════════════════════════════
          PAGE HEADER
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        {/* Top row: title + context pills + actions */}
        <div className="flex items-start justify-between gap-4 mb-3">
          {/* Title block */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <BookOpen className="w-4 h-4 text-brand-600" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">General Ledger</h1>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold
                rounded-full border border-emerald-200">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Analyze, reconcile, and audit enterprise financial transactions in real time.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end flex-shrink-0">
            <ActionBtn
              icon={RefreshCw}
              label="Refresh"
              onClick={handleRefresh}
              className={clsx(isRefreshing && 'animate-spin')}
            />
            <ActionBtn
              icon={BarChart3}
              label="Analytics"
              onClick={() => setShowChart(p => !p)}
              primary={showChart}
            />
            <ActionBtn
              icon={RefreshCw}
              label="Reconcile"
              onClick={() => toast.success('Reconciliation job queued')}
            />
            <ActionBtn
              icon={Download}
              label="Export"
              onClick={() => toast.success('Preparing Excel export…')}
            />
            <ActionBtn
              icon={History}
              label="Audit Trail"
              onClick={() => navigate('/admin/audit-logs')}
            />
            <ActionBtn
              icon={Sparkles}
              label="AI Analysis"
              ai
              onClick={() => setRightPanel(p => p === 'ai' ? null : 'ai')}
              badge={5}
            />
            <ActionBtn
              icon={Plus}
              label="New Journal"
              primary
              onClick={() => toast.success('Opening journal voucher…')}
            />
          </div>
        </div>

        {/* Context pills row */}
        <div className="flex items-center gap-2 flex-wrap">
          <CtxPill icon={Globe}     label="Org"    value="Apollo Healthcare Group" />
          <CtxPill icon={Building2} label="Branch" value="All Branches"            />
          <CtxPill icon={Calendar}  label="FY"     value="2025–26"                 />
          <CtxPill icon={Calendar}  label="Period" value="May 2026"                />
          <div className="flex-1" />
          <LiveBar />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          KPI RIBBON
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-slate-100">
        <GLKPIRibbon />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          FILTER BAR
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-slate-100 shadow-sm">
        <GLFilterBar
          filters={filters}
          setFilters={setFilters}
          onClear={clearFilters}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN WORKSPACE
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: ledger workspace ──────────────────────────────── */}
        <div className={clsx(
          'flex flex-col flex-1 min-w-0 overflow-hidden',
          rightPanel && 'border-r border-slate-200',
        )}>
          {/* Reconciliation status strip */}
          <div className="px-6 py-3 flex-shrink-0 space-y-3">
            <ReconStrip />

            {/* Analytics chart */}
            <AnimatePresence>
              {showChart && (
                <GLTrendChart onCollapse={() => setShowChart(false)} />
              )}
            </AnimatePresence>
          </div>

          {/* Main GL grid */}
          <div className="flex-1 px-6 pb-6 overflow-hidden">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-hidden">
              <GLGrid
                filters={filters}
                onSelectEntry={handleSelectEntry}
              />
            </div>
          </div>
        </div>

        {/* ── Right: AI panel or detail drawer ────────────────────── */}
        <AnimatePresence>
          {rightPanel === 'ai' && (
            <motion.div
              key="ai-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="flex-shrink-0 overflow-hidden h-full"
              style={{ maxHeight: 'calc(100vh - 220px)' }}
            >
              <GLAIPanel onClose={handleCloseAI} />
            </motion.div>
          )}

          {rightPanel === 'detail' && selectedEntry && (
            <motion.div
              key="detail-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 420, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="flex-shrink-0 overflow-hidden h-full"
              style={{ maxHeight: 'calc(100vh - 220px)' }}
            >
              <GLDetailDrawer
                entry={selectedEntry}
                onClose={handleCloseDetail}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          FLOATING QUICK ACTIONS (bottom-right)
      ═══════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {/* AI toggle (when panel is closed) */}
        {!rightPanel && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setRightPanel('ai')}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl
              bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-semibold
              shadow-xl hover:shadow-2xl transition-shadow"
            title="Open AI Assistant"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">5 Insights</span>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
