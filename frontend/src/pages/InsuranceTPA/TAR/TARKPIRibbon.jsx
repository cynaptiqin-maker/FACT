import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee, Clock, Timer, AlertCircle, AlertTriangle, AlertOctagon,
  TrendingUp, XCircle, CalendarClock, ShieldAlert, ChevronRight, Sparkles,
} from 'lucide-react';
import { TAR_KPI_CONFIG } from './TARConstants';

const ICONS = {
  IndianRupee, Clock, Timer, AlertCircle, AlertTriangle, AlertOctagon,
  TrendingUp, XCircle, CalendarClock, ShieldAlert,
};

const NEGATIVE_IDS = new Set([
  'deniedExposure', 'bucket91_180', 'bucket180plus', 'avgSettleDays', 'highRiskTPAs', 'bucket61_90',
]);

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(target * ease);
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

function KPICard({ kpi, index, onClick, active }) {
  const animVal = useCountUp(kpi.value, 1000 + index * 80);
  const Icon = ICONS[kpi.icon] ?? IndianRupee;

  const displayVal = () => {
    if (kpi.format === 'lakh') return `₹${(animVal / 100000).toFixed(2)}L`;
    if (kpi.format === 'pct')  return `${animVal.toFixed(1)}%`;
    if (kpi.format === 'num')  return Math.round(animVal).toLocaleString('en-IN');
    return animVal.toFixed(0);
  };

  const isNegativeKPI = NEGATIVE_IDS.has(kpi.id);
  const trendUp = kpi.trend > 0;
  const isPositive = isNegativeKPI ? !trendUp : trendUp;

  // Aging bucket visual bar
  const isAgingBucket = kpi.id.startsWith('bucket') && kpi.id !== 'bucket0_30';
  const bucketPct = kpi.id === 'bucket0_30' ? 24 : kpi.id === 'bucket31_60' ? 27 : kpi.id === 'bucket61_90' ? 20 : kpi.id === 'bucket91_180' ? 18 : 11;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.13)' }}
      onClick={() => onClick?.(kpi.id)}
      className={`relative flex-none w-52 bg-white dark:bg-slate-900 border rounded-xl p-4 cursor-pointer group overflow-hidden transition-all
        ${active
          ? 'border-amber-400 dark:border-amber-500 shadow-lg shadow-amber-100 dark:shadow-amber-900/20'
          : 'border-slate-200 dark:border-slate-800'
        }`}
    >
      {/* Top color bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: kpi.color }} />

      {/* AI flag */}
      {kpi.aiFlag && (
        <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
          <Sparkles size={8} />AI
        </span>
      )}

      {/* Icon + Label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}1a` }}>
          <Icon size={15} style={{ color: kpi.color }} />
        </div>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight pr-6">{kpi.label}</span>
      </div>

      {/* Animated value */}
      <div className="text-[20px] font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight mb-0.5">
        {displayVal()}
      </div>

      {/* Sub-text */}
      {kpi.sub && (
        <div className="text-[10.5px] text-slate-400 dark:text-slate-500 mb-1.5">{kpi.sub}</div>
      )}

      {/* Aging bucket mini bar */}
      {(kpi.id.startsWith('bucket')) && (
        <div className="mt-1 mb-1 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${bucketPct}%`, background: kpi.color }}
          />
        </div>
      )}

      {/* Trend */}
      <div className={`flex items-center gap-1 text-[11px] font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        <TrendingUp size={11} className={trendUp ? '' : 'rotate-180'} />
        <span>
          {kpi.trend > 0 ? '+' : ''}{kpi.trend}
          {kpi.format === 'pct' ? 'pp' : kpi.id === 'avgSettleDays' ? 'd' : '%'} {kpi.trendLabel}
        </span>
      </div>

      {/* Active indicator */}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl" style={{ background: kpi.color }} />
      )}

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
        style={{ background: `radial-gradient(circle at 80% 20%, ${kpi.color}0d, transparent 70%)` }}
      />
    </motion.div>
  );
}

export default function TARKPIRibbon({ onBucketFilter, activeFilter }) {
  const ref = useRef(null);

  return (
    <div className="relative px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="absolute right-6 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />
      <ChevronRight size={13} className="absolute right-7 top-1/2 -translate-y-1/2 z-20 text-slate-400 animate-pulse" />
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide pr-8">
        {TAR_KPI_CONFIG.map((kpi, i) => (
          <KPICard
            key={kpi.id}
            kpi={kpi}
            index={i}
            onClick={onBucketFilter}
            active={activeFilter === kpi.id}
          />
        ))}
      </div>
    </div>
  );
}
