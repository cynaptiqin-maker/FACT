// ─── Doctor Payouts — Incentive & Deduction Intelligence Panel ────────────────
import { motion } from 'framer-motion';
import {
  Award, TrendingUp, TrendingDown, ShieldAlert,
  Zap, BarChart2, AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { MOCK_PAYOUTS, REVENUE_SHARING_RULES, fmtINR } from './DPConstants';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-xl text-xs">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500 dark:text-slate-400">{p.name}</span>
          </div>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmtINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Incentive Leaderboard ─────────────────────────────────────────────────────
function IncentiveLeaderboard() {
  const leaders = [...MOCK_PAYOUTS]
    .filter(p => p.incentiveAmount > 0)
    .sort((a, b) => b.incentiveAmount - a.incentiveAmount)
    .slice(0, 8);

  const maxInc = leaders[0]?.incentiveAmount ?? 1;

  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-3">Top Incentive Earners — Apr 2026</p>
      <div className="space-y-2">
        {leaders.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3">
            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-none ${
              i === 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
              i === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' :
              i === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
              'bg-slate-50 dark:bg-slate-800/60 text-slate-400'
            }`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{p.doctorName}</span>
                <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400 ml-2 flex-none">{fmtINR(p.incentiveAmount)}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(p.incentiveAmount / maxInc) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="h-full rounded-full"
                  style={{ background: p.avatarColor }}
                />
              </div>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-500">{p.department}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Incentive Type Breakdown ──────────────────────────────────────────────────
function IncentiveTypeBreakdown() {
  const otPool   = MOCK_PAYOUTS.filter(p => p.otRevenue > 0).reduce((s, p) => s + Math.round(p.incentiveAmount * 0.6), 0);
  const icuPool  = MOCK_PAYOUTS.filter(p => p.icuRevenue > 0).reduce((s, p) => s + Math.round(p.incentiveAmount * 0.3), 0);
  const perfPool = MOCK_PAYOUTS.reduce((s, p) => s + Math.round(p.incentiveAmount * 0.1), 0);

  const data = [
    { type: 'OT Incentive',       val: otPool,   color: '#8b5cf6', pct: ((otPool/(otPool+icuPool+perfPool))*100).toFixed(0) },
    { type: 'ICU Bonus',          val: icuPool,  color: '#f97316', pct: ((icuPool/(otPool+icuPool+perfPool))*100).toFixed(0) },
    { type: 'Performance Bonus',  val: perfPool, color: '#059669', pct: ((perfPool/(otPool+icuPool+perfPool))*100).toFixed(0) },
  ];

  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-3">Incentive Pool Breakdown (Apr 2026)</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {data.map(d => (
          <div key={d.type} className="text-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
            <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mb-0.5 truncate">{d.type}</p>
            <p className="font-mono font-bold text-sm" style={{ color: d.color }}>{fmtINR(d.val)}</p>
            <p className="text-[9px]" style={{ color: d.color }}>{d.pct}% of pool</p>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: -22, bottom: 0 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b18" />
          <XAxis dataKey="type" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="val" name="Amount" radius={[4,4,0,0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Revenue Sharing Rules Table ──────────────────────────────────────────────
function RevSharingRules() {
  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Revenue Sharing Rules by Specialty</p>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-5 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Specialty</span>
          <span className="text-right">Consult</span>
          <span className="text-right">Procedure</span>
          <span className="text-right">OT</span>
          <span className="text-right">ICU</span>
        </div>
        {REVENUE_SHARING_RULES.map((r, i) => (
          <div key={r.specialty} className={`grid grid-cols-5 px-3 py-2 text-xs border-t border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{r.specialty}</span>
            <span className="text-right font-mono text-emerald-600 dark:text-emerald-400">{r.consultPct}%</span>
            <span className="text-right font-mono text-sky-600 dark:text-sky-400">{r.procedurePct}%</span>
            <span className="text-right font-mono text-violet-600 dark:text-violet-400">{r.otPct > 0 ? `${r.otPct}%` : '—'}</span>
            <span className="text-right font-mono text-orange-600 dark:text-orange-400">{r.icuPct > 0 ? `${r.icuPct}%` : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Deduction Summary ─────────────────────────────────────────────────────────
function DeductionSummary() {
  const totalTDS      = MOCK_PAYOUTS.reduce((s, p) => s + p.tdsDeduction, 0);
  const totalProfTax  = MOCK_PAYOUTS.reduce((s, p) => s + p.profTaxDeduction, 0);
  const totalOther    = MOCK_PAYOUTS.reduce((s, p) => s + p.otherDeductions, 0);

  return (
    <div>
      <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-3">Statutory Deduction Summary — Apr 2026</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'TDS Deducted',       val: totalTDS,     color: '#ef4444', note: '@ 10% on rev share' },
          { label: 'Professional Tax',   val: totalProfTax, color: '#f97316', note: 'Statutory'           },
          { label: 'Other Deductions',   val: totalOther,   color: '#f59e0b', note: 'Misc adjustments'   },
        ].map(d => (
          <div key={d.label} className="p-3 rounded-xl border border-rose-100 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20">
            <p className="text-[9.5px] text-slate-500 dark:text-slate-400">{d.label}</p>
            <p className="font-mono font-bold text-sm mt-0.5" style={{ color: d.color }}>{fmtINR(d.val)}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500">{d.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between px-3 py-2.5 bg-rose-100 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800/40 font-bold">
        <span className="text-xs text-rose-700 dark:text-rose-400">Total Deductions</span>
        <span className="font-mono text-xs text-rose-700 dark:text-rose-400">{fmtINR(totalTDS + totalProfTax + totalOther)}</span>
      </div>
    </div>
  );
}

// ─── Main Incentive Panel ──────────────────────────────────────────────────────
export default function DPIncentivePanel() {
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <IncentiveTypeBreakdown />
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <IncentiveLeaderboard />
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <DeductionSummary />
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <RevSharingRules />
      </div>
    </div>
  );
}
