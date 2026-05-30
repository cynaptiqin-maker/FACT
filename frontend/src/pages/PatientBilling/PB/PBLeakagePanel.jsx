import { motion } from 'framer-motion';
import { AlertOctagon, TrendingUp, ChevronRight, Users, Clock } from 'lucide-react';
import { MOCK_LEAKAGE, MOCK_CASHIERS, fmtINR, fmtTime } from './PBConstants';

const SEV_STYLES = {
  critical: { border: 'border-red-200 dark:border-red-900/50',   bg: 'bg-red-50 dark:bg-red-950/20',    dot: 'bg-red-500',   text: 'text-red-700 dark:text-red-400',   badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'   },
  warning:  { border: 'border-amber-200 dark:border-amber-900/50',bg: 'bg-amber-50 dark:bg-amber-950/20',dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400',badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'},
  info:     { border: 'border-blue-200 dark:border-blue-900/50',  bg: 'bg-blue-50 dark:bg-blue-950/20',  dot: 'bg-blue-500',  text: 'text-blue-700 dark:text-blue-400',  badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'  },
};

function LeakageAlert({ item, idx }) {
  const s = SEV_STYLES[item.severity] ?? SEV_STYLES.info;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.25 }}
      className={`border rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow ${s.border} ${s.bg}`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-none ${s.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`text-[11px] font-bold ${s.text}`}>{item.type}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${s.badge}`}>{fmtINR(item.amount)}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{item.detail}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-slate-400">{item.dept}</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-[10px] text-slate-400">{fmtTime(item.ts)}</span>
          </div>
        </div>
        <button className={`text-[10px] font-semibold flex items-center gap-0.5 mt-0.5 flex-none ${s.text} hover:underline`}>
          Fix <ChevronRight size={10} />
        </button>
      </div>
    </motion.div>
  );
}

function CashierRow({ cashier, idx }) {
  const barW = `${cashier.efficiency}%`;
  const effColor = cashier.efficiency >= 90 ? 'bg-emerald-500' : cashier.efficiency >= 75 ? 'bg-amber-500' : 'bg-red-500';
  const effText  = cashier.efficiency >= 90 ? 'text-emerald-600 dark:text-emerald-400' : cashier.efficiency >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07, duration: 0.25 }}
      className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-none">
            {cashier.name.split(' ')[0][0]}{cashier.name.split(' ')[1]?.[0] ?? ''}
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{cashier.name}</p>
            <p className="text-[10px] text-slate-400">{cashier.txns} txns · avg {cashier.avgTime}min</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{fmtINR(cashier.collected)}</p>
          <p className={`text-[10px] font-semibold ${effText}`}>{cashier.efficiency}% eff.</p>
        </div>
      </div>
      <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${effColor}`}
          initial={{ width: 0 }}
          animate={{ width: barW }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.07 + 0.2 }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-400">{cashier.refunds} refunds</span>
        <span className="text-[10px] text-slate-400">{barW} efficiency</span>
      </div>
    </motion.div>
  );
}

export default function PBLeakagePanel({ activeTab }) {
  const totalLeakage = MOCK_LEAKAGE.reduce((s, l) => s + l.amount, 0);
  const critical     = MOCK_LEAKAGE.filter(l => l.severity === 'critical').length;

  if (activeTab === 'cashier') {
    return (
      <div className="flex flex-col gap-3 h-full overflow-y-auto">
        <div className="flex items-center justify-between flex-none">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-indigo-500" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Cashier Performance</p>
          </div>
          <span className="text-[11px] text-slate-400">{MOCK_CASHIERS.length} cashiers on shift</span>
        </div>
        <div className="space-y-2">
          {MOCK_CASHIERS.map((c, i) => <CashierRow key={c.name} cashier={c} idx={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {/* Summary */}
      <div className="flex items-center justify-between flex-none">
        <div className="flex items-center gap-2">
          <AlertOctagon size={14} className="text-red-500" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Revenue Leakage</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[11px] font-semibold">
            {critical} Critical
          </span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{fmtINR(totalLeakage)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 flex-none">
        {[
          { label: 'Total Leakage',  value: fmtINR(totalLeakage), color: 'text-red-600 dark:text-red-400'   },
          { label: 'Critical Alerts', value: `${critical}`,        color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Depts Affected', value: `${new Set(MOCK_LEAKAGE.map(l => l.dept)).size}`, color: 'text-blue-600 dark:text-blue-400' },
        ].map(s => (
          <div key={s.label} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-center">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 flex-1">
        {MOCK_LEAKAGE.map((item, i) => <LeakageAlert key={item.id} item={item} idx={i} />)}
      </div>

      <button className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors flex-none">
        <TrendingUp size={14} /> Generate Leakage Report
      </button>
    </div>
  );
}
