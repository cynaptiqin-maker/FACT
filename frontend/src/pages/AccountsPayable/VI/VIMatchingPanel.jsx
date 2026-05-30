import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, ShieldX, TrendingUp, CheckCircle2, AlertTriangle, X,
  Package, FileText, Activity, Copy, Clock, IndianRupee,
  BarChart3, AlertCircle, ShieldAlert,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { MOCK_INVOICES, fmtINR, AGING_BUCKETS } from './VIConstants';

// ─── Matching Panel ───────────────────────────────────────────────────────────
const MATCH_DATA = [
  { label: 'Matched',       count: 1412, pct: 76, color: '#10b981' },
  { label: 'Partial',       count: 148,  pct: 8,  color: '#f59e0b' },
  { label: 'Unmatched',     count: 287,  pct: 16, color: '#ef4444' },
];

const PO_EXCEPTIONS = [
  { inv: 'VINV-2026-00852', vendor: 'Sunrise Medical',     issue: 'No PO reference',       severity: 'critical', amount: 127500  },
  { inv: 'VINV-2026-00848', vendor: 'Biomedical Innovations', issue: 'GRN not received',   severity: 'high',     amount: 2150000 },
  { inv: 'VINV-2026-00855', vendor: 'Oracle Health Systems', issue: 'PO amount variance ₹12K', severity: 'medium', amount: 980000 },
  { inv: 'VINV-2026-00858', vendor: 'Sunrise Medical',     issue: 'Quantity mismatch 21G vs 20G', severity: 'critical', amount: 127800 },
];

const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-100 dark:bg-red-900/25',    text: 'text-red-700 dark:text-red-300',    dot: 'bg-red-500'    },
  high:     { bg: 'bg-orange-100 dark:bg-orange-900/25',text:'text-orange-700 dark:text-orange-300',dot:'bg-orange-500' },
  medium:   { bg: 'bg-amber-100 dark:bg-amber-900/25', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500'  },
};

function MatchingTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
      className="grid grid-cols-2 gap-4 p-4 h-full">

      {/* Left: Match Status Breakdown */}
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Invoice Matching Status</p>
          <div className="flex gap-2">
            <div className="w-32 h-32 relative flex-none">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                {(() => {
                  let offset = 0;
                  return MATCH_DATA.map((d) => {
                    const dash = (d.pct / 100) * 100;
                    const el = (
                      <circle key={d.label} cx="18" cy="18" r="15.9" fill="none"
                        stroke={d.color} strokeWidth="3.5"
                        strokeDasharray={`${dash} ${100 - dash}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="butt"
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">1847</span>
                <span className="text-[9px] text-slate-400">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {MATCH_DATA.map(d => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">{d.label}</span>
                    </div>
                    <span className="text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300">{d.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.pct}%` }}
                      transition={{ duration: 0.7, delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Matching types */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Matching Method Breakdown</p>
          <div className="space-y-1.5">
            {[
              { label: '3-Way Match (PO + GRN + Inv)', count: 1156, total: 1847 },
              { label: '2-Way Match (PO + Invoice)',   count: 256,  total: 1847 },
              { label: 'Manual Override',              count: 48,   total: 1847 },
              { label: 'No Match',                     count: 287,  total: 1847 },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{row.count}</span>
                </div>
                <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-400" style={{ width: `${(row.count / row.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Exceptions */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Procurement Exceptions ({PO_EXCEPTIONS.length})</p>
        <div className="space-y-2">
          {PO_EXCEPTIONS.map((ex, i) => {
            const s = SEVERITY_COLORS[ex.severity] || SEVERITY_COLORS.medium;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className={`p-2.5 rounded-xl border ${s.bg} border-slate-200 dark:border-slate-700`}>
                <div className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-none ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[10px] font-bold ${s.text} truncate`}>{ex.inv}</p>
                      <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 flex-none">{fmtINR(ex.amount)}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{ex.vendor}</p>
                    <p className={`text-[10px] ${s.text} mt-0.5`}>{ex.issue}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-3 flex gap-1.5">
          <button className="flex-1 py-1.5 text-[11px] font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all">
            Bulk Match All
          </button>
          <button className="flex-1 py-1.5 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:border-violet-300 transition-all">
            Export Exceptions
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Fraud Detection Panel ─────────────────────────────────────────────────────
const FRAUD_ALERTS = [
  {
    id: 'f1', type: 'Duplicate Invoice', severity: 'critical', exposure: 255300,
    inv1: 'VINV-2026-00852', inv2: 'VINV-2026-00858', vendor: 'Sunrise Medical Disposables',
    detail: 'Near-identical line items. Price differs by 0.23%. Same vendor, 25 days apart.',
    score: 94,
  },
  {
    id: 'f2', type: 'No PO Reference', severity: 'critical', exposure: 127500,
    inv1: 'VINV-2026-00852', inv2: null, vendor: 'Sunrise Medical Disposables',
    detail: 'Invoice submitted without purchase order. Vendor had prior dispute in March.',
    score: 91,
  },
  {
    id: 'f3', type: 'GRN Not Received', severity: 'high', exposure: 2150000,
    inv1: 'VINV-2026-00848', inv2: null, vendor: 'Biomedical Innovations Ltd',
    detail: 'High-value equipment invoice submitted before goods received. Escalated.',
    score: 78,
  },
  {
    id: 'f4', type: 'GST Mismatch', severity: 'medium', exposure: 29000,
    inv1: 'VINV-2026-00855', inv2: null, vendor: 'Oracle Health Systems',
    detail: 'Tax amount declared differs from PO reference by ₹12,000.',
    score: 40,
  },
  {
    id: 'f5', type: 'Split Invoice Pattern', severity: 'medium', exposure: 347000,
    inv1: 'VINV-2026-00852', inv2: 'VINV-2026-00858', vendor: 'Sunrise Medical Disposables',
    detail: 'Two invoices just below ₹1.5L approval threshold from same vendor in 25 days.',
    score: 62,
  },
];

const SEVERITY_BADGE = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  high:     'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  medium:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
};

function FraudTab() {
  const totalExposure = FRAUD_ALERTS.reduce((s, a) => s + a.exposure, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
      className="flex flex-col h-full">

      {/* Summary bar */}
      <div className="flex gap-3 px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex-none">
        {[
          { label: 'Total Alerts', value: FRAUD_ALERTS.length, color: 'text-slate-700 dark:text-slate-200' },
          { label: 'Critical',     value: 2,                   color: 'text-red-600 dark:text-red-400'    },
          { label: 'Exposure',     value: fmtINR(totalExposure), color: 'text-orange-600 dark:text-orange-400' },
        ].map(s => (
          <div key={s.label} className="flex-1 text-center">
            <p className={`text-base font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alert cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {FRAUD_ALERTS.map((alert, i) => (
          <motion.div key={alert.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle size={13} className={`flex-none mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'high' ? 'text-orange-500' : 'text-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{alert.type}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${SEVERITY_BADGE[alert.severity]}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{alert.vendor}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2">{alert.detail}</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-400">Financial Exposure</p>
                <p className="text-[11px] font-bold font-mono text-red-600 dark:text-red-400">{fmtINR(alert.exposure)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400">Risk Score</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${alert.score}%` }} />
                  </div>
                  <span className="text-[10px] font-bold font-mono text-red-600 dark:text-red-400">{alert.score}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button className="flex-1 py-1 text-[10px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md transition-all">
                Flag & Hold
              </button>
              <button className="flex-1 py-1 text-[10px] font-semibold border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-md hover:border-violet-300 transition-all">
                Investigate
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Cash Flow Panel ──────────────────────────────────────────────────────────
const VENDOR_CONCENTRATION = [
  { vendor: 'GE Healthcare',         amount: 58.0, pct: 31.5 },
  { vendor: 'Siemens Healthineers',  amount: 32.0, pct: 17.4 },
  { vendor: 'Roche Diagnostics',     amount: 12.5, pct: 6.8  },
  { vendor: 'MedPlus Healthcare',    amount: 8.4,  pct: 4.6  },
  { vendor: 'Others',                amount: 73.5, pct: 39.7 },
];

const WEEKLY_PAYABLE = [
  { week: 'May W3', amount: 18.5 },
  { week: 'May W4', amount: 32.1 },
  { week: 'Jun W1', amount: 61.2 },
  { week: 'Jun W2', amount: 27.5 },
  { week: 'Jun W3', amount: 44.8 },
  { week: 'Jun W4', amount: 33.1 },
];

const PayableTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-[11px] shadow-xl">
      <p className="text-slate-300 font-semibold">{label}</p>
      <p className="text-violet-300">Payable: ₹{payload[0].value}L</p>
    </div>
  );
};

function CashFlowTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
      className="grid grid-cols-2 gap-4 p-4 h-full">

      {/* Weekly Payable Chart */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Weekly Payable Schedule (₹L)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={WEEKLY_PAYABLE} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <Tooltip content={<PayableTooltip />} />
            <Bar dataKey="amount" name="Payable" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { label: 'Total Scheduled', value: '₹2.17 Cr', color: 'text-violet-700 dark:text-violet-300' },
            { label: 'Peak Week',       value: '₹61.2L',   color: 'text-orange-600 dark:text-orange-400' },
            { label: 'Avg Weekly',      value: '₹36.2L',   color: 'text-slate-700 dark:text-slate-300'   },
            { label: 'Cash at Risk',    value: '₹25.5L',   color: 'text-red-600 dark:text-red-400'       },
          ].map(m => (
            <div key={m.label} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-center">
              <p className={`text-[13px] font-bold font-mono ${m.color}`}>{m.value}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Concentration */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Vendor Concentration Risk</p>
        <div className="space-y-2">
          {VENDOR_CONCENTRATION.map((v, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{v.vendor}</span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">₹{v.amount}L</span>
                  <span className="text-slate-400">({v.pct}%)</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${v.pct}%` }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: ['#7c3aed','#8b5cf6','#a78bfa','#c4b5fd','#ede9fe'][i] }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-1.5">
            <AlertCircle size={11} className="text-amber-500 flex-none mt-0.5" />
            <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
              GE Healthcare represents 31.5% of payable exposure. Concentration risk: HIGH. Consider payment schedule diversification.
            </p>
          </div>
        </div>

        <div className="mt-2">
          <button className="w-full py-2 text-[11px] font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all">
            Schedule Batch Payment
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Bottom Panel ─────────────────────────────────────────────────────────
const PANEL_TABS = [
  { id: 'matching',  label: 'PO/GRN Matching',    icon: Link2,    height: 320 },
  { id: 'fraud',     label: 'Fraud Detection',     icon: ShieldX,  height: 440 },
  { id: 'cashflow',  label: 'Cash Flow Impact',    icon: TrendingUp, height: 320 },
];

export default function VIMatchingPanel({ activeTab, onTabChange }) {
  const panelHeight = PANEL_TABS.find(t => t.id === activeTab)?.height || 320;

  return (
    <div className="flex-none border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-slate-100 dark:border-slate-800 px-4 pt-0">
        {PANEL_TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold border-b-2 transition-all ${
                active
                  ? 'border-violet-500 text-violet-700 dark:text-violet-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5 py-1.5">
          <BarChart3 size={13} className="text-slate-400" />
          <span className="text-[10px] text-slate-400 font-semibold">Procurement Intelligence</span>
        </div>
      </div>

      {/* Panel content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: panelHeight }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          {activeTab === 'matching'  && <MatchingTab  />}
          {activeTab === 'fraud'     && <FraudTab     />}
          {activeTab === 'cashflow'  && <CashFlowTab  />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
