import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, FunnelChart, Funnel, LabelList,
  AreaChart, Area, LineChart, Line, Legend,
} from 'recharts';
import {
  LIFECYCLE_FUNNEL, CLAIMS_TREND, AGING_BUCKETS, DENIAL_BREAKDOWN, fmtINR,
} from './ICConstants';
import { TrendingUp, AlertOctagon, CheckCircle2, XCircle } from 'lucide-react';

const AGING_DATA = [
  { bucket: '0–30d',  count: 312,  value: 18640 },
  { bucket: '31–60d', count: 248,  value: 16820 },
  { bucket: '61–90d', count: 186,  value: 14180 },
  { bucket: '91–120d',count: 143,  value: 11820 },
  { bucket: '120d+',  count: 64,   value: 7840  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-xl text-[11px]">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color ?? p.fill }}>
          {p.name}: {typeof p.value === 'number' && p.dataKey !== 'count' ? `₹${p.value}L` : p.value}
        </p>
      ))}
    </div>
  );
};

function FunnelStage({ stage, index, total }) {
  const pct = Math.round((stage.count / total) * 100);
  const width = 40 + pct * 0.6;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex items-center gap-3 group"
    >
      {/* Stage bar */}
      <div className="flex-none w-36 flex justify-end">
        <div
          className="h-8 rounded-l-full flex items-center justify-end pr-3"
          style={{ width: `${width}%`, background: `${stage.color}20`, border: `1.5px solid ${stage.color}40` }}
        >
          <span className="text-[10.5px] font-bold" style={{ color: stage.color }}>{stage.count}</span>
        </div>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 truncate">{stage.stage}</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">{fmtINR(stage.amount)}</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: `${stage.color}20`, color: stage.color }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Conversion drop */}
      {index > 0 && (
        <div className="flex-none text-[10px] text-slate-400 w-10 text-right">
          -{Math.round(100 - pct)}%
        </div>
      )}
    </motion.div>
  );
}

export default function ICLifecycleDashboard() {
  const totalStart = LIFECYCLE_FUNNEL[0].count;

  return (
    <div className="p-4 space-y-6">

      {/* ── Claims Lifecycle Funnel ─────────────────────────────────────── */}
      <div>
        <h3 className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">Claims Lifecycle Funnel</h3>
        <p className="text-[10.5px] text-slate-400 mb-4">Stage-by-stage conversion from preauth to settlement</p>
        <div className="space-y-2.5">
          {LIFECYCLE_FUNNEL.map((stage, i) => (
            <FunnelStage key={stage.stage} stage={stage} index={i} total={totalStart} />
          ))}
        </div>

        {/* Conversion summary */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Preauth → Submit', val: `${Math.round(LIFECYCLE_FUNNEL[2].count / LIFECYCLE_FUNNEL[0].count * 100)}%`, color: '#6366f1' },
            { label: 'Submit → Approve', val: `${Math.round(LIFECYCLE_FUNNEL[4].count / LIFECYCLE_FUNNEL[2].count * 100)}%`, color: '#10b981' },
            { label: 'Approve → Settled',val: `${Math.round(LIFECYCLE_FUNNEL[6].count / LIFECYCLE_FUNNEL[4].count * 100)}%`, color: '#f59e0b' },
          ].map(m => (
            <div key={m.label} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-[16px] font-bold font-mono" style={{ color: m.color }}>{m.val}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Claims Aging Heatmap ────────────────────────────────────────── */}
      <div>
        <h3 className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mb-1">Claims Aging Distribution</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={AGING_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Claims" radius={[4, 4, 0, 0]}
                fill="#6366f1"
                label={{ position: 'top', fontSize: 10, fill: '#64748b' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Monthly Claims Trend ────────────────────────────────────────── */}
      <div>
        <h3 className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mb-1">Monthly Claims Performance</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CLAIMS_TREND} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
              <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="approved"  name="Approved"  stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="denied"    name="Denied"    stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="settled"   name="Settled"   stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── KPI Summary Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: CheckCircle2, label: 'Approval Rate', val: '63.1%', sub: 'Approved / Submitted', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/15' },
          { icon: XCircle, label: 'Denial Rate', val: '8.2%', sub: 'vs 9.8% last quarter', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/15' },
          { icon: TrendingUp, label: 'Settlement Rate', val: '29.2%', sub: 'Settled / Approved', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/15' },
          { icon: AlertOctagon, label: '90d+ Exposure', val: '₹11.8Cr', sub: '143 claims', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/15' },
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
    </div>
  );
}
