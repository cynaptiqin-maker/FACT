import { motion } from 'framer-motion';
import {
  Calendar, Zap, CheckCircle2, Clock, TrendingDown,
  AlertTriangle, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts';
import { PAYMENT_SCHEDULE } from './APConstants';

const PRIORITY_STYLES = {
  HIGH:   { bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-400',    dot: 'bg-red-500'    },
  MEDIUM: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500'  },
  LOW:    { bg: 'bg-slate-100 dark:bg-slate-800',    text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400'  },
};

const STATUS_STYLES = {
  ready:   { icon: CheckCircle2, color: 'text-emerald-500' },
  pending: { icon: Clock,        color: 'text-slate-400'   },
};

const WEEKLY_OUTFLOW = [
  { week: 'May 20', outflow: 11650, critical: 9200 },
  { week: 'May 27', outflow: 15420, critical: 6800 },
  { week: 'Jun 03', outflow: 8200,  critical: 3400 },
  { week: 'Jun 10', outflow: 6100,  critical: 1200 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <div className="text-slate-300 font-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-mono">₹{p.value?.toLocaleString()}K</span>
        </div>
      ))}
    </div>
  );
}

export default function APPaymentPanel() {
  const totalReady = PAYMENT_SCHEDULE
    .filter(p => p.status === 'ready')
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = PAYMENT_SCHEDULE
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="grid grid-cols-3 gap-6">

      {/* ── Payment Schedule List ────────────────────── */}
      <div className="col-span-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Upcoming Payments</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{PAYMENT_SCHEDULE.length} scheduled</span>
        </div>

        <div className="space-y-2">
          {PAYMENT_SCHEDULE.map((item, i) => {
            const pri = PRIORITY_STYLES[item.priority];
            const sts = STATUS_STYLES[item.status];
            const StsIcon = sts.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-300 dark:hover:border-amber-700 transition-colors cursor-pointer group"
              >
                <StsIcon size={14} className={`flex-none ${sts.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{item.vendor}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.date}</div>
                </div>
                <div className="text-right flex-none">
                  <div className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                    ₹{(item.amount/100000).toFixed(1)}L
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${pri.bg} ${pri.text}`}>
                    {item.priority}
                  </span>
                </div>
                <ArrowRight size={12} className="text-slate-300 group-hover:text-amber-500 transition-colors flex-none" />
              </motion.div>
            );
          })}
        </div>

        {/* Batch summary */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
            <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
              ₹{(totalReady/100000).toFixed(1)}L
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5 flex items-center justify-center gap-1">
              <CheckCircle2 size={10} />Ready to Pay
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
            <div className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">
              ₹{(totalPending/100000).toFixed(1)}L
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 flex items-center justify-center gap-1">
              <Clock size={10} />Awaiting Approval
            </div>
          </div>
        </div>

        <button className="w-full h-9 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2">
          <Zap size={13} />Generate Payment Batch
        </button>
      </div>

      {/* ── Weekly Outflow Chart ─────────────────────── */}
      <div className="col-span-1 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingDown size={14} className="text-rose-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Weekly Cash Outflow Projection</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={WEEKLY_OUTFLOW} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={v => `₹${(v/1000).toFixed(0)}L`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="outflow"  name="Total Outflow"    fill="#f59e0b" radius={[4,4,0,0]} />
            <Bar dataKey="critical" name="Critical/Overdue" fill="#ef4444" radius={[4,4,0,0]} />
            <ReferenceLine y={10000} stroke="#f97316" strokeDasharray="4 2"
              label={{ value: 'Budget', fill: '#f97316', fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <div className="w-3 h-3 rounded bg-amber-500" />Total Outflow
          </div>
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <div className="w-3 h-3 rounded bg-red-500" />Critical/Overdue
          </div>
        </div>

        {/* Working capital alert */}
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Working Capital Alert</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            ₹8.2Cr projected outflow in next 14 days exceeds available cash buffer by ₹2.4Cr. Review deferred payment options for non-critical vendors.
          </p>
        </div>
      </div>

      {/* ── Payment Insights ─────────────────────────── */}
      <div className="col-span-1 space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-cyan-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Optimisation</span>
        </div>

        {[
          {
            title: 'Early Payment Discount',
            desc: 'Pay PharmaCare, BD Medical, and Baxter by 22 May to earn 2% discount.',
            saving: '₹24,800',
            color: 'emerald',
          },
          {
            title: 'Deferred Payment Candidates',
            desc: 'Wipro IT and HCL Healthcare IT can be safely deferred 30 days without SLA breach.',
            saving: '₹6.35L cash preserved',
            color: 'blue',
          },
          {
            title: 'Batch Consolidation',
            desc: 'Consolidating 7 ICU/OT vendor payments into one NEFT batch saves ₹3,200 in bank charges.',
            saving: '₹3,200',
            color: 'amber',
          },
          {
            title: 'Priority Escalations',
            desc: 'KIMS Biomedical and Abbott require urgent CFO approval to release payment and restore services.',
            saving: 'Operational risk',
            color: 'red',
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className={`rounded-xl border p-3 space-y-1
              ${item.color === 'emerald' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
              : item.color === 'blue'    ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
              : item.color === 'amber'   ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
              : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}
          >
            <div className={`text-xs font-semibold
              ${item.color === 'emerald' ? 'text-emerald-700 dark:text-emerald-400'
              : item.color === 'blue'    ? 'text-blue-700 dark:text-blue-400'
              : item.color === 'amber'   ? 'text-amber-700 dark:text-amber-400'
              : 'text-red-700 dark:text-red-400'}`}>{item.title}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Impact: {item.saving}</span>
              <button className="text-[10px] font-semibold text-slate-500 hover:text-amber-600 flex items-center gap-0.5">
                View <ArrowRight size={9} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
