// ─── Revenue Sharing — KPI Ribbon ─────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CircleDollarSign, CheckCircle2, AlertCircle, Banknote, ShieldCheck,
  Clock, Building2, PieChart, AlertOctagon, ShieldAlert, ChevronRight,
} from 'lucide-react';
import { RS_KPI_CONFIG } from './RSConstants';

const ICON_MAP = {
  CircleDollarSign, CheckCircle2, AlertCircle, Banknote, ShieldCheck,
  Clock, Building2, PieChart, AlertOctagon, ShieldAlert,
};

const ACCENT = {
  amber:   { ring: 'ring-amber-400/30',   bar: 'from-amber-400 to-orange-400',  badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'  },
  emerald: { ring: 'ring-emerald-400/30', bar: 'from-emerald-400 to-teal-400',  badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
  rose:    { ring: 'ring-rose-400/30',    bar: 'from-rose-400 to-pink-400',     badge: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'      },
  violet:  { ring: 'ring-violet-400/30',  bar: 'from-violet-400 to-purple-400', badge: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' },
  blue:    { ring: 'ring-blue-400/30',    bar: 'from-blue-400 to-indigo-400',   badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'      },
  orange:  { ring: 'ring-orange-400/30',  bar: 'from-orange-400 to-red-400',    badge: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
  sky:     { ring: 'ring-sky-400/30',     bar: 'from-sky-400 to-cyan-400',      badge: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'          },
  teal:    { ring: 'ring-teal-400/30',    bar: 'from-teal-400 to-emerald-400',  badge: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'      },
  red:     { ring: 'ring-red-400/30',     bar: 'from-red-400 to-rose-400',      badge: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'          },
  yellow:  { ring: 'ring-yellow-400/30',  bar: 'from-yellow-400 to-amber-400',  badge: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' },
};

function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(target * ease);
      if (pct < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

function KPICard({ kpi, index }) {
  const animVal = useCountUp(kpi.value, 900 + index * 70);
  const Icon = ICON_MAP[kpi.icon] ?? CircleDollarSign;
  const ac = ACCENT[kpi.accent] ?? ACCENT.amber;
  const isNeg = kpi.negative;
  const trendUp = kpi.trend > 0;
  const isGood = isNeg ? !trendUp : trendUp;
  const hasAlert = (isNeg && kpi.value > 0);

  const display = () => {
    if (kpi.format === 'lakh') return `₹${animVal.toFixed(1)}L`;
    if (kpi.format === 'num')  return Math.round(animVal).toLocaleString('en-IN');
    return animVal.toFixed(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
      className={`relative flex flex-col gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 overflow-hidden cursor-pointer group hover:shadow-md transition-shadow ${hasAlert ? `ring-1 ${ac.ring}` : ''}`}
    >
      {/* Gradient top bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${ac.bar}`} />

      {/* Alert pulse */}
      {hasAlert && (
        <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}

      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-tight pr-3">
          {kpi.label}
        </p>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ac.badge} opacity-0 group-hover:opacity-100 transition-opacity flex-none`}>
          <Icon size={13} />
        </div>
      </div>

      <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
        {display()}
      </p>

      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] font-bold ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
          {trendUp ? '↑' : '↓'} {Math.abs(kpi.trend)}%
        </span>
        <span className="text-[10px] text-slate-400">vs last month</span>
      </div>

      {/* Micro bar for first 3 KPIs */}
      {index < 3 && (
        <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-auto">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${ac.bar} transition-all duration-1000`}
            style={{ width: index === 0 ? '100%' : index === 1 ? '64%' : '36%' }}
          />
        </div>
      )}
    </motion.div>
  );
}

export default function RSKPIRibbon() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3 mb-5">
      {RS_KPI_CONFIG.map((kpi, i) => (
        <KPICard key={kpi.id} kpi={kpi} index={i} />
      ))}
    </div>
  );
}
