import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, XCircle, Zap, AlertOctagon, ChevronRight,
  TrendingUp, TrendingDown, AlertCircle, Shield,
} from 'lucide-react';
import { fmtINR, TAR_DENIAL_REASONS, TPA_PERFORMANCE, TAR_LEAKAGE_ALERTS } from './TARConstants';

const HIGH_RISK_TPAS = TPA_PERFORMANCE.filter(t => t.highRisk >= 2 || t.trend < -4).map(t => ({
  tpa:         t.tpa,
  denialRate:  100 - t.recoveryRate,
  outstanding: t.outstanding,
  trend:       t.trend,
  highRisk:    t.highRisk,
}));

const EXPOSURE_CARDS = [
  { label: 'Total Denied Amount',    value: 7430000,  format: 'inr', color: '#ef4444', icon: XCircle,        sub: '89 claims denied'         },
  { label: 'Avoidable Denials',      value: 52,       format: 'pct', color: '#f59e0b', icon: AlertCircle,    sub: '~₹3.86Cr recoverable'     },
  { label: 'Revenue at Risk',        value: 11880000, format: 'inr', color: '#dc2626', icon: AlertOctagon,   sub: '>180d — write-off zone'   },
];

const ESCALATION_ALERTS = [
  { id: 'ESC-001', claim: 'CLM-2026-00601', days: 196, tpa: 'National Insurance',    amount: 3200000, threshold: '>180d — IRDAI zone' },
  { id: 'ESC-002', claim: 'CLM-2026-00703', days: 95,  tpa: 'HDFC ERGO Health',      amount: 840000,  threshold: '90d — critical'     },
  { id: 'ESC-003', claim: 'CLM-2026-00705', days: 105, tpa: 'Aditya Birla Health',   amount: 1860000, threshold: '>90d — legal risk'  },
  { id: 'ESC-004', claim: 'CLM-2026-00804', days: 59,  tpa: 'MD India TPA',          amount: 1240000, threshold: '60d threshold'      },
];

const SEVERITY_STYLES = {
  critical: { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800/40', text: 'text-red-700 dark:text-red-400', icon: AlertCircle },
  warning:  { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle },
  info:     { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800/40', text: 'text-blue-700 dark:text-blue-400', icon: Shield },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-[11px]">
      <p className="font-bold text-slate-600 dark:text-slate-300 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.name === 'Denials' ? p.value : `₹${(p.value / 100000).toFixed(2)}L`}
        </p>
      ))}
    </div>
  );
};

export default function TARDenialRiskPanel() {
  const denialData = TAR_DENIAL_REASONS.map(r => ({
    reason: r.reason.length > 22 ? r.reason.slice(0, 22) + '…' : r.reason,
    Amount: +(r.amount / 100000).toFixed(2),
    Denials: r.count,
  }));

  return (
    <div className="p-5 space-y-6 bg-slate-50 dark:bg-slate-950">

      {/* Exposure Summary */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
          Denial & Revenue Risk Summary
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {EXPOSURE_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                style={{ borderTop: `3px solid ${card.color}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} style={{ color: card.color }} />
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400">{card.label}</span>
                </div>
                <div className="text-[20px] font-bold font-mono mb-0.5" style={{ color: card.color }}>
                  {card.format === 'inr' ? fmtINR(card.value) : `${card.value}%`}
                </div>
                <div className="text-[10.5px] text-slate-400">{card.sub}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Denial Reasons Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">Denial Reasons Breakdown</h3>
          <p className="text-[10.5px] text-slate-400 mb-3">Amount (₹L) and count by denial reason</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={denialData} layout="vertical" margin={{ top: 4, right: 50, bottom: 0, left: 140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                <YAxis dataKey="reason" type="category" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Amount" name="Amount ₹L" fill="#ef4444" radius={[0, 3, 3, 0]}
                  label={{ position: 'right', fontSize: 9, fill: '#ef4444', formatter: v => `₹${v}L` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High-Risk TPA Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200">High-Risk TPA Watch List</h3>
            <p className="text-[10.5px] text-slate-400 mt-0.5">TPAs with high denial rate or slow settlement</p>
          </div>
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {['TPA', 'Denial Rate', 'Outstanding', 'Trend', 'Action'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HIGH_RISK_TPAS.map((tpa, i) => (
                  <tr key={tpa.tpa} className="border-b border-slate-100 dark:border-slate-800 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                    <td className="px-3 py-2.5 text-[11.5px] font-semibold text-slate-800 dark:text-slate-100 max-w-[120px] truncate">{tpa.tpa}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[12px] font-mono font-bold ${tpa.denialRate > 25 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {tpa.denialRate}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11.5px] font-mono text-amber-600 dark:text-amber-400 font-semibold">{fmtINR(tpa.outstanding)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {tpa.trend < 0
                        ? <TrendingDown size={13} className="text-red-400" />
                        : <TrendingUp size={13} className="text-emerald-500" />
                      }
                    </td>
                    <td className="px-3 py-2.5">
                      <button className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5">
                        Escalate <ChevronRight size={9} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Revenue Leakage Alerts */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Revenue Leakage Alerts</h3>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{TAR_LEAKAGE_ALERTS.length} active leakage vectors detected by AI</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {TAR_LEAKAGE_ALERTS.filter(a => a.severity === 'critical').length} Critical
          </span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {TAR_LEAKAGE_ALERTS.map((alert, i) => {
            const cfg = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-start gap-3 px-5 py-3.5 ${cfg.bg} border-l-4 ${cfg.border}`}
              >
                <Icon size={14} className={`${cfg.text} flex-none mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`text-[12px] font-bold ${cfg.text}`}>{alert.title}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{alert.detail}</div>
                    </div>
                    <div className="flex-none text-right">
                      <div className={`text-[13px] font-bold font-mono ${cfg.text}`}>{fmtINR(alert.impact)}</div>
                      <div className="text-[10px] text-slate-400">at risk</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <button className={`flex items-center gap-1 text-[11px] font-bold ${cfg.text} hover:opacity-80 border ${cfg.border} px-2.5 py-1 rounded-lg`}>
                      {alert.action} <ChevronRight size={9} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Aging Escalation Risk */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Aging Escalation Tracker</h3>
          <p className="text-[10.5px] text-slate-400 mt-0.5">Claims approaching critical aging thresholds</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {ESCALATION_ALERTS.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="p-3.5 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50/60 dark:bg-red-900/10"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold font-mono text-red-700 dark:text-red-400">{a.claim}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                  {a.days}d
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mb-1">{a.tpa}</div>
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-mono font-bold text-red-600 dark:text-red-400">{fmtINR(a.amount)}</span>
                <span className="text-[9.5px] text-red-500 font-semibold">{a.threshold}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
