import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilePlus, IndianRupee, Send, RefreshCcw, Download, Sparkles,
  FileSearch, Wifi, WifiOff, ChevronRight, LayoutGrid,
  Shield, Zap, Bell, Activity, BarChart3,
  AlertTriangle, CheckCircle2, Clock, Building2,
} from 'lucide-react';

import PIKPIRibbon     from './PI/PIKPIRibbon';
import PIFilterBar     from './PI/PIFilterBar';
import PIGrid          from './PI/PIGrid';
import PIDetailDrawer  from './PI/PIDetailDrawer';
import PIAIPanel       from './PI/PIAIPanel';
import PIActivityFeed  from './PI/PIActivityFeed';
import PIInsurancePanel from './PI/PIInsurancePanel';
import PILeakagePanel  from './PI/PILeakagePanel';
import { MOCK_KPI_VALUES, fmtINR, MOCK_INVOICES, AI_INSIGHTS } from './PI/PIConstants';

// ─── Header quick stats ────────────────────────────────────────────────────────
function HeaderStat({ label, value, icon: Icon, color, alert }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border
      ${alert ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40' : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'}`}>
      <Icon size={13} style={{ color }} />
      <div>
        <p className="text-[12.5px] font-bold font-mono" style={{ color }}>{value}</p>
        <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide leading-none">{label}</p>
      </div>
    </div>
  );
}

// ─── Real-time sync badge ──────────────────────────────────────────────────────
function SyncBadge() {
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLastSync(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor((Date.now() - lastSync) / 60_000);

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10.5px] font-semibold
      ${online
        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400'
        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400'
      }`}>
      {online
        ? <><span className="flex h-1.5 w-1.5 relative"><span className="animate-ping absolute h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-75" /><span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>Live</>
        : <><WifiOff size={11} />Offline</>
      }
      {online && <span className="text-emerald-500/60 ml-0.5">· {mins === 0 ? 'just now' : `${mins}m ago`}</span>}
    </div>
  );
}

// ─── Bottom panel tab bar ──────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { id:'activity',   label:'Activity Feed', icon:Bell,       badge: null },
  { id:'insurance',  label:'Insurance',     icon:Shield,     badge: null },
  { id:'leakage',    label:'Leakage',       icon:Zap,        badge: AI_INSIGHTS.filter(x => x.severity === 'critical').length },
  { id:'analytics',  label:'Analytics',     icon:BarChart3,  badge: null },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PatientInvoices() {
  const [filters, setFilters]           = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [drawerInv, setDrawerInv]       = useState(null);
  const [aiOpen, setAiOpen]             = useState(false);
  const [bottomTab, setBottomTab]       = useState('activity');
  const [kpiFilter, setKpiFilter]       = useState(null);
  const pageRef = useRef(null);

  const resetFilters = useCallback(() => setFilters({}), []);

  const handleBulkAction = useCallback((action, rows) => {
    if (action === 'clearSelection') { setSelectedRows([]); return; }
    console.log('Bulk action:', action, rows);
  }, []);

  const handleRowAction = useCallback((action, inv) => {
    if (action === 'view') setDrawerInv(inv);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); /* global search */ }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); /* new invoice  */ }
      if (e.key === 'Escape' && drawerInv)            { setDrawerInv(null); }
      if (e.key === 'Escape' && aiOpen)               { setAiOpen(false);   }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawerInv, aiOpen]);

  const overdueCount = MOCK_INVOICES.filter(x => x.status === 'OVERDUE').length;
  const criticalCount = AI_INSIGHTS.filter(x => x.severity === 'critical').length;

  return (
    <div ref={pageRef} className="flex flex-col min-h-0 h-full bg-slate-50/80 dark:bg-slate-950">

      {/* ══════════════════════════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: title + subtitle + stats */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">
                Patient Invoices
              </h1>
              <SyncBadge />
              {criticalCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/25 border border-red-200 dark:border-red-800/40 text-[10.5px] font-bold text-red-700 dark:text-red-400"
                >
                  <AlertTriangle size={10} />
                  {criticalCount} critical alerts
                </motion.div>
              )}
            </div>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              Monitor, reconcile, and optimize enterprise healthcare billing in real time.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-2 mt-3">
              <HeaderStat label="Invoices Today"  value="127"                              icon={FilePlus}       color="#6366f1" />
              <HeaderStat label="Collections"     value={fmtINR(MOCK_KPI_VALUES.totalCollections)}  icon={IndianRupee} color="#10b981" />
              <HeaderStat label="Outstanding"     value={fmtINR(MOCK_KPI_VALUES.outstanding)}        icon={Clock}       color="#f59e0b" />
              <HeaderStat label="Ins. Pending"    value={fmtINR(MOCK_KPI_VALUES.insurancePending)}   icon={Shield}      color="#6366f1" />
              <HeaderStat label="Overdue"         value={overdueCount}                     icon={AlertTriangle}  color="#ef4444" alert={overdueCount > 10} />
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex flex-wrap gap-2 items-start flex-none">
            {/* Primary actions */}
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold
              bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-colors">
              <FilePlus size={14} />
              New Invoice
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold
              bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors">
              <IndianRupee size={14} />
              Record Payment
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold
              bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-colors">
              <Send size={14} />
              Submit Claim
            </button>

            {/* Secondary actions */}
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold
              border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
              text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-colors">
              <RefreshCcw size={14} />
              Refund
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold
              border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
              text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-colors">
              <Download size={14} />
              Export
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold
              border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
              text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-colors">
              <FileSearch size={14} />
              Audit Logs
            </button>
            <button
              onClick={() => setAiOpen(p => !p)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold shadow-sm transition-all
                ${aiOpen
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0'
                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-rose-300'
                }`}>
              <Sparkles size={14} />
              AI Analysis
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BODY
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4 min-h-0">

        {/* ── Main column ── */}
        <div className="flex flex-col flex-1 gap-4 min-w-0 overflow-y-auto">

          {/* KPI Ribbon */}
          <section>
            <PIKPIRibbon onCardClick={setKpiFilter} />
          </section>

          {/* Filter Bar — sticky within scroll */}
          <section className="sticky top-0 z-30">
            <PIFilterBar
              filters={filters}
              setFilters={setFilters}
              selectedRows={selectedRows}
              onBulkAction={handleBulkAction}
              onResetFilters={resetFilters}
            />
          </section>

          {/* Invoice Grid */}
          <section>
            <PIGrid
              filters={filters}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              onOpenDrawer={setDrawerInv}
              onRowAction={handleRowAction}
            />
          </section>

          {/* ── Bottom panel tabs ── */}
          <section className="flex flex-col min-h-[360px]">
            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-b-0 border-slate-200 dark:border-slate-700 rounded-t-2xl px-3 pt-2.5">
              {BOTTOM_TABS.map(({ id, label, icon: Icon, badge }) => (
                <button key={id} onClick={() => setBottomTab(id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-[12px] font-semibold
                    transition-colors border-b-2
                    ${bottomTab === id
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/5'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}>
                  <Icon size={13} />
                  {label}
                  {badge > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-b-2xl rounded-tr-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={bottomTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="h-full"
                >
                  {bottomTab === 'activity'  && <PIActivityFeed />}
                  {bottomTab === 'insurance' && <PIInsurancePanel />}
                  {bottomTab === 'leakage'   && <PILeakagePanel />}
                  {bottomTab === 'analytics' && <AnalyticsTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* ── AI Side Panel ── */}
        <AnimatePresence>
          {aiOpen && (
            <motion.aside
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: 340, marginLeft: 0 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="flex-none overflow-hidden"
              style={{ minWidth: 0 }}
            >
              <div className="w-[340px] h-full">
                <PIAIPanel onClose={() => setAiOpen(false)} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Floating AI button (when panel closed) ── */}
      <AnimatePresence>
        {!aiOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => setAiOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-2xl
              bg-gradient-to-br from-rose-500 to-pink-600 text-white
              shadow-lg shadow-rose-500/30 flex items-center justify-center"
          >
            <Sparkles size={20} />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl animate-ping bg-rose-400 opacity-30" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Detail Drawer ── */}
      <AnimatePresence>
        {drawerInv && (
          <PIDetailDrawer inv={drawerInv} onClose={() => setDrawerInv(null)} />
        )}
      </AnimatePresence>

      {/* ── Keyboard shortcuts hint ── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <AnimatePresence>
          {false && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/90 text-white text-[11px] backdrop-blur-sm"
            >
              {[
                { key:'⌘K', label:'Search' },
                { key:'⌘N', label:'New Invoice' },
                { key:'⌘P', label:'Payment' },
                { key:'/',   label:'Filter' },
              ].map(({ key, label }) => (
                <span key={key} className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">{key}</kbd>
                  <span className="text-white/60">{label}</span>
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Analytics tab (inline, lightweight) ──────────────────────────────────────
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DEPT_REVENUE, PAYMENT_MODES } from './PI/PIConstants';

function AnalyticsTab() {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 h-full overflow-y-auto">
      {/* Department revenue */}
      <div className="col-span-2">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">Department Revenue vs Outstanding (₹L)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={DEPT_REVENUE} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={d => d.substring(0, 5)} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <RechartTooltip
              contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 11 }}
            />
            <Bar dataKey="revenue"     name="Revenue"     fill="#f43f5e" radius={[3,3,0,0]} />
            <Bar dataKey="outstanding" name="Outstanding" fill="#fda4af" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment mode mix */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">Payment Mode Mix</p>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie data={PAYMENT_MODES} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
              {PAYMENT_MODES.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <RechartTooltip
              contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-1 mt-2">
          {PAYMENT_MODES.map(m => (
            <div key={m.name} className="flex items-center gap-1.5 text-[10.5px]">
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: m.color }} />
              <span className="text-slate-600 dark:text-slate-400">{m.name}</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 ml-auto">{m.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Collection efficiency */}
      <div className="col-span-3 grid grid-cols-4 gap-3">
        {[
          { label:'Collection Efficiency',    value:'78.4%', sub:'vs 72.1% last month', color:'text-emerald-600 dark:text-emerald-400', good:true  },
          { label:'Avg Days to Collect',      value:'18.2d', sub:'↓ 2.1d improvement',  color:'text-blue-600 dark:text-blue-400',       good:true  },
          { label:'Insurance Recovery Rate',  value:'86.3%', sub:'vs 89% target',        color:'text-amber-600 dark:text-amber-400',     good:false },
          { label:'Bad Debt Provision',       value:'₹4.8L', sub:'1.2% of invoices',    color:'text-red-600 dark:text-red-400',          good:false },
        ].map(({ label, value, sub, color, good }) => (
          <div key={label} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className={`text-[17px] font-bold mt-0.5 ${color}`}>{value}</p>
            <p className={`text-[10.5px] font-medium mt-0.5 ${good ? 'text-emerald-500' : 'text-amber-500'}`}>{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
