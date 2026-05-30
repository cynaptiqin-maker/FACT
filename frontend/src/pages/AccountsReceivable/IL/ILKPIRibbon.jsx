import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, IndianRupee, CheckCircle2, TrendingUp, AlertTriangle,
  AlertOctagon, FilePen, Clock, Receipt, Percent, ChevronRight, Sparkles,
} from 'lucide-react';
import { IL_KPI_CONFIG, fmtINR } from './ILConstants';

const ICONS = { FileText, IndianRupee, CheckCircle2, TrendingUp, AlertTriangle, AlertOctagon, FilePen, Clock, Receipt, Percent };

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const raf = (ts) => {
      if (!start) start = ts;
      const pct  = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(target * ease);
      if (pct < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

const BAD_IDS = new Set(['overdue', 'overdueValue', 'draft']);

function KPICard({ kpi, index, onKpiClick }) {
  const animVal = useCountUp(kpi.value, 900 + index * 70);
  const Icon    = ICONS[kpi.icon] ?? FileText;
  const trendUp = kpi.trend > 0;
  const good    = BAD_IDS.has(kpi.id) ? !trendUp : trendUp;

  const display = () => {
    if (kpi.format === 'crore') return fmtINR(animVal, 'crore');
    if (kpi.format === 'lakh')  return fmtINR(animVal, 'lakh');
    if (kpi.format === 'pct')   return `${animVal.toFixed(1)}%`;
    return Math.round(animVal).toLocaleString('en-IN');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.38, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 10px 28px rgba(0,0,0,0.10)' }}
      onClick={() => onKpiClick?.(kpi.id)}
      className="relative flex-none w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 cursor-pointer group overflow-hidden select-none"
    >
      {/* colour bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: kpi.color }} />

      {/* AI badge */}
      {kpi.aiFlag && (
        <span className="absolute top-3 right-3 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400">
          <Sparkles size={9} /> AI
        </span>
      )}

      {/* icon + label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}1a` }}>
          <Icon size={14} style={{ color: kpi.color }} />
        </div>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">{kpi.label}</span>
      </div>

      {/* value */}
      <div className="text-xl font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight mb-1">
        {display()}
      </div>

      {/* trend */}
      <div className={`flex items-center gap-1 text-[11px] font-semibold ${good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        <TrendingUp size={11} className={trendUp ? '' : 'rotate-180'} />
        <span>{Math.abs(kpi.trend)}% {kpi.trendLabel}</span>
      </div>

      {/* hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
        style={{ background: `radial-gradient(circle at 80% 20%, ${kpi.color}10, transparent 65%)` }}
      />
    </motion.div>
  );
}

export default function ILKPIRibbon({ onKpiClick }) {
  const ref = useRef(null);

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none rounded-r-xl" />
      <ChevronRight size={13} className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-slate-400 animate-pulse" />
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide pr-6">
        {IL_KPI_CONFIG.map((kpi, i) => (
          <KPICard key={kpi.id} kpi={kpi} index={i} onKpiClick={onKpiClick} />
        ))}
      </div>
    </div>
  );
}
