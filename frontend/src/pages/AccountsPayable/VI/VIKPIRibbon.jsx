import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Clock, CheckCircle2, AlertCircle, IndianRupee,
  TrendingUp, TrendingDown, Copy, ShieldAlert, CalendarX2, ShieldX, Zap,
} from 'lucide-react';
import { KPI_CONFIG } from './VIConstants';

const ICON_MAP = {
  FileText, Clock, CheckCircle2, AlertCircle, IndianRupee,
  TrendingUp, Copy, ShieldAlert, CalendarX2, ShieldX, Zap,
};

function useCountUp(target, duration = 1200, active = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setVal(target * eased);
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return val;
}

function KPICard({ kpi, index }) {
  const animated = useCountUp(kpi.value, 1000 + index * 60);
  const Icon = ICON_MAP[kpi.icon] || FileText;
  const isPositiveTrend = kpi.trend > 0;
  const isWarningTrend  = ['pending_approvals','unmatched','outstanding','duplicate_risk','tax_warnings','overdue','fraud_alerts'].includes(kpi.id);
  const trendBad = isWarningTrend ? isPositiveTrend : !isPositiveTrend;

  const display = () => {
    if (kpi.format === 'crore') return `${kpi.prefix}${animated.toFixed(2)}${kpi.suffix}`;
    if (kpi.format === 'pct')   return `${animated.toFixed(1)}%`;
    return `${kpi.prefix}${Math.round(animated).toLocaleString('en-IN')}${kpi.suffix}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(124,58,237,0.12)' }}
      className="relative flex-none w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 cursor-pointer overflow-hidden select-none"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: kpi.color }} />

      {kpi.aiFlag && (
        <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 text-[9px] font-bold tracking-wide text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 rounded px-1 py-0.5">
          <Zap size={8} /> AI
        </span>
      )}

      <div className="flex items-start gap-2.5 mb-3">
        <div className="mt-0.5 flex-none w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}18` }}>
          <Icon size={14} style={{ color: kpi.color }} />
        </div>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight pt-0.5">{kpi.label}</p>
      </div>

      <p className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-50 tabular-nums mb-1.5">
        {display()}
      </p>

      <div className="flex items-center gap-1">
        {trendBad
          ? <TrendingUp  size={11} className="text-red-500 flex-none" />
          : <TrendingDown size={11} className="text-emerald-500 flex-none" />
        }
        <span className={`text-[10px] font-semibold ${trendBad ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
        </span>
        <span className="text-[10px] text-slate-400 truncate">{kpi.trendLabel}</span>
      </div>

      <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
           style={{ background: `radial-gradient(circle at 70% 70%, ${kpi.color}08, transparent 70%)` }} />
    </motion.div>
  );
}

export default function VIKPIRibbon() {
  const scrollRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) setCanScroll(el.scrollWidth > el.clientWidth);
  }, []);

  return (
    <div className="relative border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 py-3">
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-none pb-0.5">
        {KPI_CONFIG.map((kpi, i) => (
          <KPICard key={kpi.id} kpi={kpi} index={i} />
        ))}
      </div>
      {canScroll && (
        <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent" />
      )}
    </div>
  );
}
