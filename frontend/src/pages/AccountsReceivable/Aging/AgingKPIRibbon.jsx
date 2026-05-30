import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Landmark, CheckCircle2, Clock, AlertTriangle, AlertOctagon,
  Shield, Flame, Gauge, Sparkles, Zap, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { AGING_KPIS } from './AgingConstants';

const ICON_MAP = { Landmark, CheckCircle2, Clock, AlertTriangle, AlertOctagon, Shield, Flame, Gauge, Sparkles, Zap };

const COLOR_MAP = {
  blue:    { grad: 'from-blue-500 to-blue-600',    ring: 'ring-blue-200 dark:ring-blue-800',    num: 'text-blue-700 dark:text-blue-300',    soft: 'bg-blue-50 dark:bg-blue-900/20'    },
  emerald: { grad: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-200 dark:ring-emerald-800', num: 'text-emerald-700 dark:text-emerald-300', soft: 'bg-emerald-50 dark:bg-emerald-900/20' },
  amber:   { grad: 'from-amber-400 to-orange-500', ring: 'ring-amber-200 dark:ring-amber-800',   num: 'text-amber-700 dark:text-amber-300',   soft: 'bg-amber-50 dark:bg-amber-900/20'   },
  orange:  { grad: 'from-orange-400 to-red-500',   ring: 'ring-orange-200 dark:ring-orange-800', num: 'text-orange-700 dark:text-orange-300', soft: 'bg-orange-50 dark:bg-orange-900/20' },
  red:     { grad: 'from-red-500 to-rose-600',     ring: 'ring-red-200 dark:ring-red-800',       num: 'text-red-700 dark:text-red-300',       soft: 'bg-red-50 dark:bg-red-900/20'       },
  violet:  { grad: 'from-violet-500 to-purple-600',ring: 'ring-violet-200 dark:ring-violet-800', num: 'text-violet-700 dark:text-violet-300', soft: 'bg-violet-50 dark:bg-violet-900/20' },
  rose:    { grad: 'from-rose-500 to-pink-600',    ring: 'ring-rose-200 dark:ring-rose-800',     num: 'text-rose-700 dark:text-rose-300',     soft: 'bg-rose-50 dark:bg-rose-900/20'     },
  cyan:    { grad: 'from-cyan-500 to-blue-500',    ring: 'ring-cyan-200 dark:ring-cyan-800',     num: 'text-cyan-700 dark:text-cyan-300',     soft: 'bg-cyan-50 dark:bg-cyan-900/20'     },
  indigo:  { grad: 'from-indigo-500 to-violet-600',ring: 'ring-indigo-200 dark:ring-indigo-800', num: 'text-indigo-700 dark:text-indigo-300', soft: 'bg-indigo-50 dark:bg-indigo-900/20' },
};

function useCountUp(target, duration = 1200, active = true) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, active]);
  return val;
}

function KPICard({ kpi, idx }) {
  const [hovered, setHovered] = useState(false);
  const meta   = COLOR_MAP[kpi.color] ?? COLOR_MAP.blue;
  const Icon   = ICON_MAP[kpi.icon]   ?? Landmark;
  const count  = useCountUp(kpi.value, 900 + idx * 60);
  const isMonetary = kpi.display.startsWith('₹');
  const isPct      = kpi.display.endsWith('%');

  const displayVal = isMonetary ? kpi.display
    : isPct ? `${count}%`
    : kpi.display;

  const TrendIcon = kpi.trendUp === true ? TrendingUp : kpi.trendUp === false ? TrendingDown : Minus;
  const trendColor = kpi.trendNeutral
    ? 'text-slate-500 dark:text-slate-400'
    : kpi.trendUp
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-500 dark:text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.4, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex-none w-[172px] rounded-xl border bg-white dark:bg-slate-900 overflow-hidden cursor-pointer
        transition-shadow duration-200 group
        ${hovered ? 'shadow-lg ring-1 ' + meta.ring : 'shadow-sm border-slate-200 dark:border-slate-800'}`}
    >
      {/* colour accent bar */}
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${meta.grad}`} />

      <div className="p-3.5">
        {/* Icon + label row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className={`w-7 h-7 rounded-lg ${meta.soft} flex items-center justify-center ring-1 ${meta.ring}`}>
            <Icon size={14} className={meta.num} />
          </div>
          <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${trendColor}`}>
            <TrendIcon size={10} />
            <span>{kpi.trend}</span>
          </div>
        </div>

        {/* Value */}
        <div className={`text-[17px] font-bold font-mono tracking-tight leading-none mb-1 ${meta.num}`}>
          {displayVal}
        </div>

        {/* Label */}
        <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-tight mb-1">
          {kpi.label}
        </div>

        {/* Suffix */}
        <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
          {kpi.suffix}
        </div>

        {/* Hover sparkline placeholder */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0, height: hovered ? 20 : 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 overflow-hidden"
        >
          <div className="flex items-end gap-0.5 h-5">
            {[40, 55, 45, 70, 60, 80, 65, 90].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm bg-gradient-to-t ${meta.grad} opacity-70`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function AgingKPIRibbon({ activeFilter, onFilterClick }) {
  return (
    <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
      {AGING_KPIS.map((kpi, i) => (
        <KPICard key={kpi.id} kpi={kpi} idx={i} />
      ))}
    </div>
  );
}
