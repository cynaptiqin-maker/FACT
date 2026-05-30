import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee, Activity, Building2, Shield, ClipboardList,
  RefreshCcw, Clock, AlertOctagon, Package, ChevronRight,
} from 'lucide-react';
import { PB_KPI_CONFIG, MOCK_KPI_VALUES, fmtINR } from './PBConstants';

// ShieldAlert inline (not in older lucide)
function ShieldAlertIcon({ size = 16, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

const ICON_MAP = {
  IndianRupee, Activity, Building2, Shield, ClipboardList,
  RefreshCcw, Clock, AlertOctagon, Package, ShieldAlert: ShieldAlertIcon,
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

function KPICard({ config, value, index }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const Icon = ICON_MAP[config.icon] ?? IndianRupee;

  function formatValue(v) {
    if (config.format === 'currency') return fmtINR(v);
    if (config.format === 'percent')  return `${Math.round(v)}%`;
    if (config.format === 'minutes')  return `${Math.round(v)}m`;
    return Math.round(v).toLocaleString('en-IN');
  }

  const trendPos = config.trend > 0;
  const trendAbs = Math.abs(config.trend ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y:  0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
      className={`relative flex flex-col gap-2 p-4 rounded-2xl border bg-white dark:bg-slate-800/80
        shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer
        min-w-[160px] group
        ${config.alert ? 'border-red-200 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'}
      `}
    >
      {config.alert && (
        <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}

      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${config.accent}18` }}>
          <Icon size={16} style={{ color: config.accent }} />
        </div>
        {config.trend != null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold
            ${trendPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {trendPos ? '▲' : '▼'} {trendAbs}%
          </span>
        )}
      </div>

      <div>
        <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          style={{ color: config.alert ? '#ef4444' : undefined }}>
          {formatValue(animated)}
        </p>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5 leading-tight">
          {config.label}
        </p>
      </div>

      <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: config.accent }} />
    </motion.div>
  );
}

export default function PBKPIRibbon({ onCardClick }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
      {PB_KPI_CONFIG.map((cfg, i) => (
        <KPICard
          key={cfg.key}
          config={cfg}
          value={MOCK_KPI_VALUES[cfg.key]}
          index={i}
          onClick={() => onCardClick?.(cfg.key)}
        />
      ))}
    </div>
  );
}
