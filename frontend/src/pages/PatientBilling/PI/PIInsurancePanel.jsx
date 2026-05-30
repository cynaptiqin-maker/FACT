import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, TrendingUp, ExternalLink, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend,
} from 'recharts';
import { TPA_AGING_DATA, CLAIM_LIFECYCLE, MOCK_INVOICES, fmtINR, fmtINRFull, CLAIM_STATUSES } from './PIConstants';

const AGING_COLORS = { '0-30':'#10b981', '31-60':'#f59e0b', '61-90':'#f97316', '90+':'#ef4444' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-lg text-[11px]">
      <p className="font-bold text-slate-600 dark:text-slate-300 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill }}>{p.name}: {fmtINR(p.value)}</p>
      ))}
    </div>
  );
};

export default function PIInsurancePanel() {
  const [view, setView] = useState('aging');

  const claimsData = MOCK_INVOICES.filter(x => x.isInsurance);
  const totalPending = claimsData.filter(x => x.claimStatus !== 'SETTLED' && x.claimStatus !== 'WRITTEN_OFF').reduce((s, x) => s + x.insShare, 0);
  const deniedCount  = claimsData.filter(x => x.claimStatus === 'REJECTED').length;
  const settledTotal = claimsData.filter(x => x.claimStatus === 'SETTLED').reduce((s, x) => s + x.insShare, 0);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-none">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-blue-500" />
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Insurance & TPA</span>
        </div>
        <div className="flex gap-1">
          {['aging','lifecycle','claims'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors
                ${view === v ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-2.5 px-3 pt-3 pb-2 flex-none">
        {[
          { label:'Total Pending',  value: fmtINR(totalPending), color:'text-amber-600 dark:text-amber-400', bg:'bg-amber-50 dark:bg-amber-900/10' },
          { label:'Settled',        value: fmtINR(settledTotal), color:'text-emerald-600 dark:text-emerald-400', bg:'bg-emerald-50 dark:bg-emerald-900/10' },
          { label:'Denied Claims',  value: deniedCount,          color:'text-red-600 dark:text-red-400', bg:'bg-red-50 dark:bg-red-900/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`p-2.5 rounded-xl ${bg} text-center`}>
            <p className={`text-[14px] font-bold ${color}`}>{value}</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {/* ── TPA Aging ── */}
        {view === 'aging' && (
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">TPA-Wise Aging Analysis</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={TPA_AGING_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="tpa" tick={{ fontSize: 9.5, fill: '#94a3b8' }}
                  tickFormatter={t => t.split(' ')[0]} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => fmtINR(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="0-30"  fill={AGING_COLORS['0-30']}  name="0-30d"  stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="31-60" fill={AGING_COLORS['31-60']} name="31-60d" stackId="a" />
                <Bar dataKey="61-90" fill={AGING_COLORS['61-90']} name="61-90d" stackId="a" />
                <Bar dataKey="90+"   fill={AGING_COLORS['90+']}   name="90+d"   stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {TPA_AGING_DATA.map((tpa, i) => (
                <motion.div key={tpa.tpa}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60
                    bg-white dark:bg-slate-800 hover:shadow-sm hover:border-blue-200 dark:hover:border-blue-700/40 transition-all group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-none">
                    <Shield size={13} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{tpa.tpa}</p>
                      <span className="text-[11.5px] font-bold font-mono text-slate-800 dark:text-white flex-none">{fmtINR(tpa.total)}</span>
                    </div>
                    <div className="flex gap-3 mt-1">
                      {Object.entries(AGING_COLORS).map(([bucket, color]) => (
                        tpa[bucket] > 0 && (
                          <span key={bucket} className="text-[10px] font-medium" style={{ color }}>
                            {bucket}: {fmtINR(tpa[bucket])}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                  <ExternalLink size={11} className="text-slate-300 group-hover:text-blue-400 flex-none transition-colors" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Claim Lifecycle ── */}
        {view === 'lifecycle' && (
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Claim Lifecycle Distribution</p>
            {CLAIM_LIFECYCLE.map((stage, i) => {
              const maxAmt = Math.max(...CLAIM_LIFECYCLE.map(s => s.amount));
              const pct = Math.round((stage.amount / maxAmt) * 100);
              const colors = ['#94a3b8','#0284c7','#6366f1','#8b5cf6','#f59e0b','#10b981','#10b981'];
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11.5px] font-medium text-slate-700 dark:text-slate-300">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] text-slate-400">{stage.count} claims</span>
                      <span className="text-[11.5px] font-bold font-mono text-slate-700 dark:text-slate-200">{fmtINR(stage.amount)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: colors[i] ?? '#6366f1' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Claims list ── */}
        {view === 'claims' && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Active Insurance Claims</p>
            {claimsData.slice(0, 12).map((inv, i) => {
              const cfg = CLAIM_STATUSES[inv.claimStatus] ?? CLAIM_STATUSES.SUBMITTED;
              return (
                <motion.div key={inv.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60
                    bg-white dark:bg-slate-800 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className={`w-2 h-2 rounded-full flex-none ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 truncate">{inv.patientName}</p>
                    <p className="text-[10.5px] text-slate-400 font-mono">{inv.invoiceNo} · {inv.tpa}</p>
                  </div>
                  <div className="text-right flex-none">
                    <p className="text-[11.5px] font-bold font-mono text-slate-700 dark:text-slate-200">{fmtINR(inv.insShare)}</p>
                    <p className={`text-[10px] font-semibold ${cfg.text}`}>{cfg.label}</p>
                  </div>
                  <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-400 flex-none transition-colors" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
