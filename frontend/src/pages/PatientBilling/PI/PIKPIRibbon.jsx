import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee, TrendingUp, Clock, Shield, AlertTriangle,
  RefreshCcw, Calendar, AlertOctagon, Activity,
} from 'lucide-react';
import { PI_KPI_CONFIG, MOCK_KPI_VALUES, fmtINR } from './PIConstants';

function ShieldOffIcon({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19.7 14a6.9 6.9 0 0 0 .3-2V5l-8-3-3.2 1.2" />
      <path d="m4.7 4.7-1.7.3V12c0 6 8 10 8 10a20.3 20.3 0 0 0 5.62-4.38" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

const ICON_MAP = {
  IndianRupee, TrendingUp, Clock, Shield, AlertTriangle,
  RefreshCcw, Calendar, AlertOctagon, Activity, ShieldOff: ShieldOffIcon,
};

function useCountUp(target, duration = 1400) {
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

function KPICard({ config, value, index, onClick }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const Icon = ICON_MAP[config.icon] ?? IndianRupee;

  function formatValue(v) {
    if (config.format === 'currency') return fmtINR(v);
    if (config.format === 'percent')  return `${Math.round(v)}%`;
    if (config.format === 'days')     return `${Math.round(v)}d`;
    return Math.round(v).toLocaleString('en-IN');
  }

  const trendPos = (config.trend ?? 0) > 0;
  const trendAbs = Math.abs(config.trend ?? 0);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.38, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={() => onClick?.(config.key)}
      className={`relative flex flex-col gap-2 p-4 rounded-2xl border bg-white dark:bg-slate-800/90
        shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer text-left
        min-w-[158px] max-w-[158px] group flex-none
        ${config.alert
          ? 'border-red-200 dark:border-red-800/60'
          : 'border-slate-200 dark:border-slate-700'
        }`}
    >
      {/* Pulsing alert dot */}
      {config.alert && (
        <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: config.accent }} />
          <span className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: config.accent }} />
        </span>
      )}

      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-none"
          style={{ background: `${config.accent}18` }}>
          <Icon size={15} style={{ color: config.accent }} />
        </div>
        {config.trend != null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold tabular-nums
            ${trendPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {trendPos ? '▲' : '▼'} {trendAbs}%
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[20px] font-bold tracking-tight leading-tight"
          style={{ color: config.alert ? config.accent : undefined }}
          data-default-class="text-slate-900 dark:text-slate-50">
          {formatValue(animated)}
        </p>
        <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5 leading-tight truncate">
          {config.label}
        </p>
      </div>

      {/* Bottom color strip on hover */}
      <div
        className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: config.accent }}
      />
    </motion.button>
  );
}

export default function PIKPIRibbon({ onCardClick }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
      {PI_KPI_CONFIG.map((cfg, i) => (
        <KPICard
          key={cfg.key}
          config={cfg}
          value={MOCK_KPI_VALUES[cfg.key] ?? 0}
          index={i}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
