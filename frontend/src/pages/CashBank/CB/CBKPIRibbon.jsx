import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee, TrendingUp, TrendingDown, AlertTriangle, GitMerge,
  Wallet, ArrowDownCircle, ArrowUpCircle, Building2, ChevronRight, Sparkles,
} from 'lucide-react';
import { CB_KPI_CONFIG } from './CBConstants';

function CoinsIcon({ size, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={style}>
      <ellipse cx="9" cy="6" rx="6" ry="3" />
      <path d="M3 6v12c0 1.66 2.69 3 6 3s6-1.34 6-3V6" />
      <path d="M21 9c0 1.66-2.69 3-6 3-1.03 0-2-.1-2.83-.28M21 6c0-1.66-2.69-3-6-3-1.03 0-2 .1-2.83.28M21 6v6" />
    </svg>
  );
}

function ShieldAlertIcon({ size, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const ICONS = {
  IndianRupee, TrendingUp, AlertTriangle, GitMerge,
  Wallet, ArrowDownCircle, ArrowUpCircle, Building2,
  Coins: CoinsIcon, ShieldAlert: ShieldAlertIcon,
};

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const pct  = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(target * ease);
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

const BAD_IDS = new Set(['totalPayments', 'unreconciled', 'variance', 'highRisk', 'pettyCash']);

function KPICard({ kpi, index }) {
  const animVal = useCountUp(kpi.value, 1000 + index * 80);
  const Icon    = ICONS[kpi.icon] ?? IndianRupee;
  const trendUp = kpi.trend > 0;
  const isGood  = BAD_IDS.has(kpi.id) ? !trendUp : trendUp;

  const displayVal = () => {
    if (kpi.format === 'crore') return `₹${(animVal / 10000000).toFixed(2)}Cr`;
    if (kpi.format === 'lakh')  return `₹${(animVal / 100000).toFixed(2)}L`;
    if (kpi.format === 'pct')   return `${animVal.toFixed(1)}%`;
    if (kpi.format === 'num')   return Math.round(animVal).toString();
    return animVal.toFixed(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      className="relative flex-none w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 cursor-pointer group overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: kpi.color }} />

      {kpi.aiFlag && (
        <span className="absolute top-3 right-3 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400">
          <Sparkles size={9} />AI
        </span>
      )}

      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}1a` }}>
          <Icon size={15} style={{ color: kpi.color }} />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{kpi.label}</span>
      </div>

      <div className="text-xl font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight mb-1">
        {displayVal()}
      </div>

      {kpi.trend !== 0 && (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          <TrendingDown size={11} className={trendUp ? 'rotate-180' : ''} style={{ color: 'currentColor' }} />
          <span>{Math.abs(kpi.trend)}{kpi.format === 'pct' ? 'pp' : '%'} {kpi.trendLabel}</span>
        </div>
      )}

      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
        style={{ background: `radial-gradient(circle at 80% 20%, ${kpi.color}0d, transparent 70%)` }}
      />
    </motion.div>
  );
}

export default function CBKPIRibbon() {
  const ref = useRef(null);
  return (
    <div className="relative">
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
      <ChevronRight size={14} className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-slate-400 animate-pulse" />
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide pr-8">
        {CB_KPI_CONFIG.map((kpi, i) => (
          <KPICard key={kpi.id} kpi={kpi} index={i} />
        ))}
      </div>
    </div>
  );
}
