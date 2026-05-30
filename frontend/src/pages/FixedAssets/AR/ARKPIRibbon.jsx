// ─── Asset Register — KPI Summary Ribbon ────────────────────────────────────
// 10 executive KPI cards · Sky/Cyan theme · Real-time AI alerts
import { motion } from 'framer-motion';
import {
  Package, BookOpen, TrendingDown, Shield, ShieldAlert,
  Wrench, PauseCircle, AlertTriangle, RotateCcw, XCircle,
  TrendingUp, TrendingDown as TDown, Minus,
} from 'lucide-react';
import { AR_KPI_CONFIG, fmtINR } from './ARConstants';

const ICON_MAP = {
  Package, BookOpen, TrendingDown, Shield, ShieldAlert,
  Wrench, PauseCircle, AlertTriangle, RotateCcw, XCircle,
};

function formatKpiValue(value, format) {
  if (format === 'crore') {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000)   return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
  if (format === 'lakh') {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000)   return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
  if (format === 'count') return value.toLocaleString('en-IN');
  return fmtINR(value);
}

function TrendIndicator({ trend, trendLabel }) {
  if (trend == null) return (
    <span className="text-[10px] text-slate-400 dark:text-slate-500">No trend data</span>
  );
  const isUp = trend > 0;
  const isDown = trend < 0;
  const color = isUp ? 'text-emerald-600 dark:text-emerald-400' : isDown ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400';
  const Icon = isUp ? TrendingUp : isDown ? TDown : Minus;
  return (
    <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${color}`}>
      <Icon size={11} />
      <span>{Math.abs(trend)}%</span>
      <span className="font-normal text-slate-400 dark:text-slate-500 ml-0.5">{trendLabel}</span>
    </div>
  );
}

function KpiCard({ kpi, index }) {
  const Icon = ICON_MAP[kpi.icon] ?? Package;
  const formattedValue = formatKpiValue(kpi.value, kpi.format);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="relative bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow duration-200 group cursor-pointer overflow-hidden"
    >
      {/* Gradient accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${kpi.color}cc, ${kpi.color}44)` }}
      />

      {/* AI flag badge */}
      {kpi.aiFlag && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 rounded-full">
          <div className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">AI</span>
        </div>
      )}

      {/* Icon + Label */}
      <div className="flex items-start gap-2.5 mt-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
          style={{ background: `${kpi.color}18` }}
        >
          <Icon size={16} style={{ color: kpi.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 leading-tight truncate pr-4">
            {kpi.label}
          </p>
        </div>
      </div>

      {/* Value */}
      <div className="mt-2.5">
        <motion.div
          key={kpi.value}
          initial={{ opacity: 0.5, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-none tracking-tight"
          style={{ color: kpi.color }}
        >
          {formattedValue}
        </motion.div>
      </div>

      {/* Sub label */}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-tight truncate">
        {kpi.sub}
      </p>

      {/* Trend */}
      <div className="mt-2">
        <TrendIndicator trend={kpi.trend} trendLabel={kpi.trendLabel} />
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${kpi.color}08 0%, transparent 70%)` }}
      />
    </motion.div>
  );
}

export default function ARKPIRibbon({ className = '' }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3 ${className}`}>
      {AR_KPI_CONFIG.map((kpi, i) => (
        <KpiCard key={kpi.id} kpi={kpi} index={i} />
      ))}
    </div>
  );
}
