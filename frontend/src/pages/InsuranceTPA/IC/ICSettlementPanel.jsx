import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from 'recharts';
import { SETTLEMENT_FORECAST, fmtINR } from './ICConstants';
import {
  CreditCard, CheckCircle2, Clock, TrendingUp, IndianRupee,
  Landmark, ArrowRight, ExternalLink, Sparkles,
} from 'lucide-react';

const RECENT_SETTLEMENTS = [
  { claimId: 'CLM-2026-00741', patient: 'Sanjay Pillai', tpa: 'ICICI Lombard', amount: 621000, date: '2026-05-16', ref: 'ICICI/NEFT/2026/4218', mode: 'NEFT', days: 18 },
  { claimId: 'CLM-2026-00684', patient: 'Priya Menon',   tpa: 'HDFC ERGO',     amount: 384000, date: '2026-05-14', ref: 'HDFCERGO/CHQ/7821', mode: 'Cheque', days: 24 },
  { claimId: 'CLM-2026-00659', patient: 'Arjun Nair',    tpa: 'Star Health',    amount: 518000, date: '2026-05-12', ref: 'STAR/RTGS/2026/3142', mode: 'RTGS', days: 31 },
  { claimId: 'CLM-2026-00672', patient: 'Lakshmi Krishnan', tpa: 'ECHS Board', amount: 156000, date: '2026-04-28', ref: 'ECHS/CHQ/2026/8412', mode: 'Cheque', days: 46 },
];

const PENDING_SETTLEMENTS = [
  { claimId: 'CLM-2026-00821', patient: 'Meena Nair',   tpa: 'HDFC ERGO', amount: 512000, approvedDate: '2026-05-02', waitDays: 18 },
  { claimId: 'CLM-2026-00762', patient: 'Anitha Verma', tpa: 'CGHS',      amount: 336000, approvedDate: '2026-05-05', waitDays: 15 },
  { claimId: 'CLM-2026-00798', patient: 'Kiran Kumar',  tpa: 'New India', amount: 284000, approvedDate: '2026-04-28', waitDays: 22 },
  { claimId: 'CLM-2026-00743', patient: 'Sunita Raju',  tpa: 'Star Health',amount: 196000, approvedDate: '2026-04-20', waitDays: 30 },
];

const RECOVERY_TREND = [
  { month: 'Dec', value: 6240, target: 7000 },
  { month: 'Jan', value: 7180, target: 7500 },
  { month: 'Feb', value: 7640, target: 7500 },
  { month: 'Mar', value: 8420, target: 8000 },
  { month: 'Apr', value: 9180, target: 8500 },
  { month: 'May', value: 10240,target: 9000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-xl text-[11px]">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: ₹{p.value}L
        </p>
      ))}
    </div>
  );
};

export default function ICSettlementPanel() {
  return (
    <div className="p-4 space-y-5">

      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: CreditCard,    label: 'Settled This Month',  val: '₹1.82Cr', sub: '28 claims',         color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/15' },
          { icon: Clock,         label: 'Pending Settlement',  val: '₹2.16Cr', sub: '34 claims approved', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/15' },
          { icon: TrendingUp,    label: 'Recovery Rate',       val: '87.3%',   sub: 'vs 85.2% target',    color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/15' },
          { icon: IndianRupee,   label: 'Avg Settlement Days', val: '34d',     sub: 'Target: 30 days',     color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/15' },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className={`p-3 rounded-xl border border-transparent ${m.bg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className={m.color} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{m.label}</span>
              </div>
              <div className={`text-[15px] font-bold font-mono ${m.color}`}>{m.val}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ── Recovery Trend vs Target ────────────────────────────────── */}
      <div>
        <h3 className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mb-1">Recovery vs Target</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={RECOVERY_TREND} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value"  name="Actual Recovery ₹"   stroke="#6366f1" fill="#6366f115" strokeWidth={2.5} dot={{ r: 3 }} />
              <Area type="monotone" dataKey="target" name="Target ₹"            stroke="#10b981" fill="none"      strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Settlement Forecast ─────────────────────────────────────── */}
      <div>
        <h3 className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mb-1">AI Settlement Forecast</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SETTLEMENT_FORECAST} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x="Wk 23" stroke="#6366f1" strokeDasharray="3 3" />
              <Bar dataKey="actual"   name="Actual ₹"   fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="forecast" name="Forecast ₹" fill="#a78bfa80" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500" />Actual</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-300" />AI Forecast</span>
        </div>
      </div>

      {/* ── Pending Settlements ─────────────────────────────────────── */}
      <div>
        <h3 className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mb-2">Awaiting Settlement — {PENDING_SETTLEMENTS.length} Claims</h3>
        <div className="space-y-2">
          {PENDING_SETTLEMENTS.map((s, i) => (
            <motion.div
              key={s.claimId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11.5px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">{s.claimId}</span>
                  <span className="text-[10.5px] text-slate-400">{s.tpa}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{s.patient}</div>
              </div>
              <div className="text-right flex-none ml-3">
                <div className="text-[12.5px] font-bold font-mono text-amber-600 dark:text-amber-400">{fmtINR(s.amount)}</div>
                <div className="text-[10px] text-slate-400">{s.waitDays}d waiting</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Recent Settlements ──────────────────────────────────────── */}
      <div>
        <h3 className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mb-2">Recent Settlements</h3>
        <div className="space-y-2">
          {RECENT_SETTLEMENTS.map((s, i) => (
            <motion.div
              key={s.claimId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-none">
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">{s.claimId}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{s.mode}</span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">{s.patient} · {s.tpa}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{s.ref}</div>
                </div>
              </div>
              <div className="text-right flex-none">
                <div className="text-[12.5px] font-bold font-mono text-emerald-600 dark:text-emerald-400">{fmtINR(s.amount)}</div>
                <div className="text-[10px] text-slate-400">{s.date} · {s.days}d</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Integration Links ───────────────────────────────────────── */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <Landmark size={12} className="text-indigo-400" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Cross-Module Integration</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'View AR Entries', color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Bank Reconciliation', color: 'text-teal-600 dark:text-teal-400' },
            { label: 'GL Postings', color: 'text-violet-600 dark:text-violet-400' },
            { label: 'Treasury Report', color: 'text-indigo-600 dark:text-indigo-400' },
          ].map(({ label, color }) => (
            <button key={label}
              className={`flex items-center gap-1.5 text-[11px] font-semibold ${color} hover:opacity-80 transition-opacity`}>
              <ArrowRight size={10} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
