import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import {
  FileText, FilePen, CheckCircle2, Clock, XCircle,
  AlertTriangle, RefreshCw, ShieldAlert,
} from 'lucide-react';
import { KPI_CONFIG, MOCK_KPIS } from './jvlConstants';

const ICON_MAP = { FileText, FilePen, CheckCircle2, Clock, XCircle, AlertTriangle, RefreshCw, ShieldAlert };

function AnimatedCount({ target }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString('en-IN'));

  useEffect(() => {
    const ctrl = animate(count, target, { duration: 1.2, ease: 'easeOut' });
    return ctrl.stop;
  }, [target]);

  return <motion.span>{rounded}</motion.span>;
}

export default function JVLKPIRibbon({ kpis = MOCK_KPIS, activeFilter, onFilterChange }) {
  return (
    <div className="flex-shrink-0 bg-white dark:bg-[#162030] border-b border-gray-200 dark:border-[#1e3045] px-6 py-3">
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-2.5">
        {KPI_CONFIG.map((cfg, i) => {
          const Icon = ICON_MAP[cfg.icon];
          const value = kpis[cfg.id] ?? 0;
          const isActive = activeFilter === cfg.filterKey;
          const isCritical = cfg.critical && value > 0;

          return (
            <motion.button
              key={cfg.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => cfg.filterKey && onFilterChange(isActive ? 'all' : cfg.filterKey)}
              className={[
                'relative flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left select-none',
                cfg.filterKey ? 'cursor-pointer' : 'cursor-default',
                isActive
                  ? 'border-[#1C3741] bg-[#1C3741] shadow-md ring-1 ring-[#1C3741]/30'
                  : isCritical
                    ? 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-900/10 hover:border-red-400 hover:shadow-sm'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a2840] hover:border-gray-300 dark:hover:border-[#2a3f5e] hover:shadow-sm',
              ].join(' ')}
            >
              {isCritical && !isActive && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}

              <div className={[
                'p-1.5 rounded-lg',
                isActive ? 'bg-white/15' : cfg.bgCls,
              ].join(' ')}>
                <Icon className={['h-3.5 w-3.5', isActive ? 'text-white' : cfg.colorCls].join(' ')} />
              </div>

              <span className={[
                'text-xl font-bold font-mono tabular-nums leading-none',
                isActive ? 'text-white' : 'text-gray-900 dark:text-white',
              ].join(' ')}>
                <AnimatedCount target={value} />
              </span>

              <span className={[
                'text-[11px] leading-tight font-medium',
                isActive ? 'text-white/75' : 'text-gray-500 dark:text-gray-400',
              ].join(' ')}>
                {cfg.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
