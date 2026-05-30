import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, LayoutDashboard, Activity, BarChart3, Shield, AlertOctagon, Users,
  Download, RefreshCw, Keyboard,
} from 'lucide-react';

import PBKPIRibbon      from './PB/PBKPIRibbon';
import PBFilterBar      from './PB/PBFilterBar';
import PBGrid           from './PB/PBGrid';
import PBDetailDrawer   from './PB/PBDetailDrawer';
import PBActivityFeed   from './PB/PBActivityFeed';
import PBAIPanel        from './PB/PBAIPanel';
import PBAnalyticsPanel from './PB/PBAnalyticsPanel';
import PBLeakagePanel   from './PB/PBLeakagePanel';
import { MOCK_KPI_VALUES, MOCK_BILLS, MOCK_CLAIMS, INSURANCE_STATUSES, fmtINRFull, fmtDate } from './PB/PBConstants';

const INIT_FILTERS = {
  search: '', dept: 'all', billType: 'all', payStatus: 'all',
  branch: 'all', risk: 'all', dateRange: 'today',
};

const BOTTOM_TABS = [
  { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3   },
  { id: 'insurance', label: 'Insurance Claims',  icon: Shield       },
  { id: 'leakage',   label: 'Leakage Alerts',    icon: AlertOctagon },
  { id: 'cashier',   label: 'Cashier Score',      icon: Users        },
];

export default function BillingDashboard() {
  const [filters,     setFilters]     = useState(INIT_FILTERS);
  const [drawerBill,  setDrawerBill]  = useState(null);
  const [selected,    setSelected]    = useState(new Set());
  const [aiOpen,      setAiOpen]      = useState(false);
  const [bottomTab,   setBottomTab]   = useState('analytics');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [refreshing,  setRefreshing]  = useState(false);

  const filteredBills = useMemo(() => {
    let rows = MOCK_BILLS;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.uhid.toLowerCase().includes(q) ||
        b.doctor.toLowerCase().includes(q) ||
        b.dept.toLowerCase().includes(q)
      );
    }
    if (filters.dept      !== 'all') rows = rows.filter(b => b.dept === filters.dept);
    if (filters.billType  !== 'all') rows = rows.filter(b => b.typeKey === filters.billType);
    if (filters.payStatus !== 'all') rows = rows.filter(b => b.payStatusKey === filters.payStatus);
    if (filters.branch    !== 'all') rows = rows.filter(b => b.branch === filters.branch);
    if (filters.risk      !== 'all') rows = rows.filter(b => b.riskLevel === filters.risk);
    return rows;
  }, [filters]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[placeholder*="Search"]')?.focus();
      }
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        document.querySelector('input[placeholder*="Search"]')?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedBill(null);
        setAiOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleFilterChange = useCallback((key, val) => {
    if (key === 'reset') { setFilters(INIT_FILTERS); return; }
    setFilters(f => ({ ...f, [key]: val }));
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setLastRefresh(Date.now()); }, 900);
  }

  const refreshedAt = new Date(lastRefresh).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-0 min-w-0">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm flex-none">
            <LayoutDashboard size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-50">Patient Billing Dashboard</h1>
            <p className="text-[11px] text-slate-400">Real-time billing operations · Updated {refreshedAt}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300
              border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300
            border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download size={12} /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500
            border border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Keyboard size={11} />
            <span className="text-[10px]">⌘K search · / focus · Esc close</span>
          </button>
          <button
            onClick={() => setAiOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors
              ${aiOpen
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 shadow-sm'}`}>
            <Sparkles size={12} />
            AI Revenue Intel
          </button>
        </div>
      </div>

      {/* ── Main body: content + AI panel ── */}
      <div className="flex min-h-0">

        {/* ── Scrollable content column ── */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-5 flex flex-col gap-5">

            {/* KPI Ribbon */}
            <PBKPIRibbon values={MOCK_KPI_VALUES} />

            {/* Filter Bar */}
            <PBFilterBar filters={filters} onFilterChange={handleFilterChange} />

            {/* Operations row: hourly trend + activity feed */}
            <div className="grid grid-cols-3 gap-4">
              {/* Hourly Billed vs Collected mini-chart */}
              <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <HourlyMiniChart />
              </div>

              {/* Live activity feed */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm overflow-hidden">
                <PBActivityFeed />
              </div>
            </div>

            {/* Billing Grid */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Activity size={14} className="text-indigo-500" /> Billing Transactions
                </p>
                <span className="text-[11px] text-slate-400">Click row to expand · double-click for detail view</span>
              </div>
              <PBGrid
                bills={filteredBills}
                onOpenDrawer={setDrawerBill}
                selected={selected}
                onSelectChange={setSelected}
              />
            </div>

            {/* Bottom analytics tabs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              {/* Tab header */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                {BOTTOM_TABS.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => setBottomTab(t.id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors
                        ${bottomTab === t.id
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                      <Icon size={12} />{t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={bottomTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="p-5"
                  style={{ minHeight: 320 }}
                >
                  {bottomTab === 'analytics' && <PBAnalyticsPanel />}
                  {bottomTab === 'insurance' && <InsuranceClaimsTab />}
                  {(bottomTab === 'leakage' || bottomTab === 'cashier') && (
                    <PBLeakagePanel activeTab={bottomTab} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* ── AI panel ── */}
        <PBAIPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      </div>

      {/* Detail Drawer */}
      <PBDetailDrawer bill={drawerBill} onClose={() => setDrawerBill(null)} />
    </div>
  );
}

// ── Inline sub-components ─────────────────────────────────────────────────────

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MOCK_HOURLY_TREND, fmtINR } from './PB/PBConstants';

function HourlyMiniChart() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between flex-none">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Activity size={14} className="text-indigo-500" /> Hourly Billing Trend
        </p>
        <span className="text-[11px] text-slate-400">Today · 08:00 – 20:00</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={MOCK_HOURLY_TREND} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="hbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
          <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500"
            tickLine={false} axisLine={false} />
          <YAxis tickFormatter={v => fmtINR(v)} tick={{ fontSize: 10, fill: 'currentColor' }}
            className="text-slate-500" tickLine={false} axisLine={false} width={44} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-xl text-xs">
                  <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
                  {payload.map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5 py-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-slate-500">{p.name}:</span>
                      <span className="font-semibold">{fmtINR(p.value)}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area dataKey="billed"    name="Billed"    stroke="#6366f1" fill="url(#hbGrad)" strokeWidth={2} dot={false} />
          <Area dataKey="collected" name="Collected" stroke="#10b981" fill="url(#hcGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function InsuranceClaimsTab() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Shield size={14} className="text-violet-500" /> Active Insurance Claims
        </p>
        <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors">
          Submit Batch
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] font-semibold uppercase">
              {['Claim ID','Patient','TPA / Insurer','Amount','Submitted','Status','Aging','Action'].map(h => (
                <th key={h} className="text-left pb-2 pr-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_CLAIMS.map(c => {
              const ins = INSURANCE_STATUSES[c.statusKey] ?? INSURANCE_STATUSES.NOT_APPLICABLE;
              return (
                <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2 pr-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">{c.id}</td>
                  <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">{c.patient}</td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{c.tpa}</td>
                  <td className="py-2 pr-4 font-mono font-bold text-slate-800 dark:text-slate-200">{fmtINRFull(c.amount)}</td>
                  <td className="py-2 pr-4 text-slate-500">{fmtDate(c.submitted)}</td>
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${ins.dot}`} />
                      <span className={`text-[11px] font-semibold ${ins.text}`}>{ins.label}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`text-[11px] font-semibold ${c.agingDays > 30 ? 'text-red-600 dark:text-red-400' : c.agingDays > 14 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                      {c.agingDays}d
                    </span>
                  </td>
                  <td className="py-2">
                    <button className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[10px] font-semibold hover:bg-violet-200 transition-colors">
                      {c.statusKey === 'DENIED' ? 'Resubmit' : 'Track'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
