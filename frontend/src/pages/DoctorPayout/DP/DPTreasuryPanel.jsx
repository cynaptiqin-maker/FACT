// ─── Doctor Payouts — Treasury & Settlement Panel ─────────────────────────────
import { motion } from 'framer-motion';
import {
  Landmark, CreditCard, Clock, CheckCircle2, AlertTriangle,
  ArrowUpRight, GitMerge, Shield, TrendingUp,
} from 'lucide-react';
import { TREASURY_SETTLEMENTS, MONTHLY_TREND, fmtINR, fmtDate, MOCK_PAYOUTS } from './DPConstants';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from 'recharts';

const STATUS_CFG = {
  SETTLED:    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2, dot: '#10b981' },
  IN_PROCESS: { bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400',       icon: Clock,        dot: '#3b82f6' },
  PENDING:    { bg: 'bg-amber-100 dark:bg-amber-900/30',      text: 'text-amber-700 dark:text-amber-400',     icon: AlertTriangle,dot: '#f59e0b' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-xl text-xs">
      <p className="font-bold text-slate-600 dark:text-slate-300 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500 dark:text-slate-400 capitalize">{p.name}</span>
          </div>
          <span className="font-mono font-semibold" style={{ color: p.color }}>{fmtINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Settlement Readiness ─────────────────────────────────────────────────────
function SettlementReadiness() {
  const pending   = MOCK_PAYOUTS.filter(p => p.paymentStatus === 'PENDING_TRANSFER').reduce((s, p) => s + p.netPayout, 0);
  const paid      = MOCK_PAYOUTS.filter(p => p.paymentStatus === 'PAID').reduce((s, p) => s + p.netPayout, 0);
  const unpaid    = MOCK_PAYOUTS.filter(p => p.paymentStatus === 'UNPAID').reduce((s, p) => s + p.netPayout, 0);
  const total     = pending + paid + unpaid;

  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-3">Treasury Settlement Readiness</p>
      <div className="h-3 rounded-full overflow-hidden flex gap-0.5 mb-3">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(paid / total) * 100}%` }} transition={{ duration: 0.8 }} className="h-full bg-emerald-500 rounded-l-full" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${(pending / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.1 }} className="h-full bg-amber-400" />
        <motion.div initial={{ width: 0 }} animate={{ width: `${(unpaid / total) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full bg-rose-400 rounded-r-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Paid & Settled', val: paid,    color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', pct: (paid/total*100).toFixed(0) },
          { label: 'Pending Transfer',val: pending, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20',   pct: (pending/total*100).toFixed(0) },
          { label: 'Unpaid / Hold',   val: unpaid,  color: '#f43f5e', bg: 'bg-rose-50 dark:bg-rose-900/20',     pct: (unpaid/total*100).toFixed(0) },
        ].map(c => (
          <div key={c.label} className={`p-2.5 rounded-xl border ${c.bg} border-opacity-50`} style={{ borderColor: `${c.color}40` }}>
            <p className="text-[9.5px] text-slate-500 dark:text-slate-400">{c.label}</p>
            <p className="font-mono font-bold text-sm mt-0.5" style={{ color: c.color }}>{fmtINR(c.val)}</p>
            <p className="text-[9.5px]" style={{ color: c.color }}>{c.pct}% of total</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Active Transfers ─────────────────────────────────────────────────────────
function ActiveTransfers() {
  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Active & Pending Bank Transfers</p>
      <div className="space-y-2">
        {TREASURY_SETTLEMENTS.map((t, i) => {
          const cfg = STATUS_CFG[t.status] ?? STATUS_CFG.PENDING;
          const StatusIcon = cfg.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-none">
                <Landmark size={14} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{t.doctor}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.id} · {t.bank} {t.account}</p>
              </div>
              <div className="text-right flex-none">
                <p className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{fmtINR(t.amount)}</p>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold ${cfg.bg} ${cfg.text}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                  {t.status.replace('_', ' ')}
                </span>
              </div>
              {t.delay > 0 && (
                <div className="flex items-center gap-0.5 text-[9.5px] text-amber-600 dark:text-amber-400 font-semibold flex-none">
                  <Clock size={9} />+{t.delay}d
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Cash Flow Impact Chart ───────────────────────────────────────────────────
function CashFlowChart() {
  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Monthly Cash Outflow — Doctor Payouts</p>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={MONTHLY_TREND} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b18" />
          <XAxis dataKey="month" tick={{ fontSize: 9.5, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="payout" name="Payout" stroke="#059669" fill="url(#cashGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Treasury Summary KPIs ────────────────────────────────────────────────────
function TreasurySummary() {
  const pendingAmt  = MOCK_PAYOUTS.filter(p => p.paymentStatus !== 'PAID').reduce((s, p) => s + p.netPayout, 0);
  const onHoldAmt   = MOCK_PAYOUTS.filter(p => p.approvalStatus === 'ON_HOLD').reduce((s, p) => s + p.netPayout, 0);
  const reconAmt    = MOCK_PAYOUTS.filter(p => p.settlementStatus === 'RECONCILED').reduce((s, p) => s + p.netPayout, 0);

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Pending Cash Outflow', val: pendingAmt, color: '#f59e0b', icon: Clock         },
        { label: 'On Hold Exposure',     val: onHoldAmt,  color: '#ef4444', icon: Shield        },
        { label: 'Reconciled',           val: reconAmt,   color: '#10b981', icon: CheckCircle2  },
      ].map(c => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon size={12} style={{ color: c.color }} />
              <p className="text-[9.5px] text-slate-400 dark:text-slate-500">{c.label}</p>
            </div>
            <p className="font-mono font-bold text-sm" style={{ color: c.color }}>{fmtINR(c.val)}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Treasury Panel ──────────────────────────────────────────────────────
export default function DPTreasuryPanel() {
  return (
    <div className="space-y-5">
      <TreasurySummary />
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <SettlementReadiness />
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <CashFlowChart />
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <ActiveTransfers />
      </div>
    </div>
  );
}
