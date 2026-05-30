import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, CheckCircle2, XCircle, AlertCircle, Landmark, BookOpen,
  TrendingDown, Clock, ShieldAlert, Sparkles, TrendingUp,
} from 'lucide-react';
import { BR_KPI_CONFIG, fmtINR } from './BRConstants';

const ICONS = { BarChart3, CheckCircle2, XCircle, AlertCircle, Landmark, BookOpen, TrendingDown, Clock, ShieldAlert, Sparkles, TrendingUp };

const COLORS = {
  blue:    { card: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',     icon: 'bg-blue-500/15 text-blue-400',     glow: 'hover:shadow-blue-500/10' },
  emerald: { card: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20', icon: 'bg-emerald-500/15 text-emerald-400', glow: 'hover:shadow-emerald-500/10' },
  red:     { card: 'from-red-500/10 to-red-600/5 border-red-500/20',        icon: 'bg-red-500/15 text-red-400',       glow: 'hover:shadow-red-500/10' },
  amber:   { card: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',  icon: 'bg-amber-500/15 text-amber-400',   glow: 'hover:shadow-amber-500/10' },
  indigo:  { card: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20', icon: 'bg-indigo-500/15 text-indigo-400', glow: 'hover:shadow-indigo-500/10' },
  violet:  { card: 'from-violet-500/10 to-violet-600/5 border-violet-500/20', icon: 'bg-violet-500/15 text-violet-400', glow: 'hover:shadow-violet-500/10' },
  orange:  { card: 'from-orange-500/10 to-orange-600/5 border-orange-500/20', icon: 'bg-orange-500/15 text-orange-400', glow: 'hover:shadow-orange-500/10' },
  cyan:    { card: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',     icon: 'bg-cyan-500/15 text-cyan-400',     glow: 'hover:shadow-cyan-500/10' },
  rose:    { card: 'from-rose-500/10 to-rose-600/5 border-rose-500/20',     icon: 'bg-rose-500/15 text-rose-400',     glow: 'hover:shadow-rose-500/10' },
  purple:  { card: 'from-purple-500/10 to-purple-600/5 border-purple-500/20', icon: 'bg-purple-500/15 text-purple-400', glow: 'hover:shadow-purple-500/10' },
};

function useCountUp(target) {
  const [val, setVal] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const dur = 1000;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return val;
}

function KPICard({ kpi, index }) {
  const Icon = ICONS[kpi.icon];
  const cl = COLORS[kpi.color] || COLORS.blue;
  const animated = useCountUp(kpi.value);
  const display = kpi.format === 'lakh' || kpi.format === 'crore'
    ? fmtINR(animated, kpi.format)
    : animated.toLocaleString('en-IN');
  const pct = kpi.prev ? Math.round(((kpi.value - kpi.prev) / kpi.prev) * 100) : 0;
  const isPositive = kpi.trend === 'up'
    ? !['red', 'orange', 'rose'].includes(kpi.color)
    : ['red', 'orange', 'rose'].includes(kpi.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.4, ease: 'easeOut' }}
      className={`relative flex-shrink-0 w-44 rounded-xl border bg-gradient-to-br ${cl.card} p-3.5 cursor-pointer hover:shadow-lg ${cl.glow} transition-all duration-200`}
    >
      {kpi.aiFlag && (
        <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] text-cyan-400 font-semibold tracking-wide">
          <Sparkles className="w-2.5 h-2.5" /> AI
        </span>
      )}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2.5 ${cl.icon}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mb-1 pr-5">{kpi.label}</div>
      <div className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">{display}</div>
      <div className="flex items-center gap-1 mt-1.5">
        <TrendingUp
          className={`w-3 h-3 flex-shrink-0 ${isPositive ? 'text-emerald-400' : 'text-red-400'} ${kpi.trend === 'down' ? 'rotate-180' : ''}`}
        />
        <span className={`text-[10px] font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {pct >= 0 ? '+' : ''}{pct}% vs yesterday
        </span>
      </div>
      <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 truncate">{kpi.desc}</div>
    </motion.div>
  );
}

export default function BRKPIRibbon() {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-3 flex-shrink-0 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
      {BR_KPI_CONFIG.map((kpi, i) => (
        <KPICard key={kpi.id} kpi={kpi} index={i} />
      ))}
    </div>
  );
}
