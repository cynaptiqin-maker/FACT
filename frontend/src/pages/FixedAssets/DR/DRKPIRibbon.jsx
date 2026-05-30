// ─── Depreciation Runs — KPI Ribbon ──────────────────────────────────────────
import { motion } from 'framer-motion';
import {
  TrendingDown, Layers, Clock, RefreshCw, AlertTriangle, BookOpen,
  ShieldAlert, Landmark, Zap, Package, TrendingUp, Minus,
} from 'lucide-react';
import { DR_KPIS, fmtINR } from './DRConstants';

const ICONS = {
  TrendingDown, Layers, Clock, RefreshCw, AlertTriangle,
  BookOpen, ShieldAlert, Landmark, Zap, Package,
};

const COLOR_RING = {
  violet: 'ring-violet-200 dark:ring-violet-800/50',
  indigo: 'ring-indigo-200 dark:ring-indigo-800/50',
  amber:  'ring-amber-200 dark:ring-amber-800/50',
  blue:   'ring-blue-200 dark:ring-blue-800/50',
  cyan:   'ring-cyan-200 dark:ring-cyan-800/50',
  orange: 'ring-orange-200 dark:ring-orange-800/50',
  purple: 'ring-purple-200 dark:ring-purple-800/50',
  red:    'ring-red-200 dark:ring-red-800/50',
  teal:   'ring-teal-200 dark:ring-teal-800/50',
  rose:   'ring-rose-200 dark:ring-rose-800/50',
};

function KPICard({ kpi, index }) {
  const Icon = ICONS[kpi.icon] || TrendingDown;
  const ring = COLOR_RING[kpi.color] || COLOR_RING.violet;
  const val  = kpi.format === 'INR'
    ? fmtINR(kpi.value)
    : kpi.value.toLocaleString('en-IN');

  const isNegativeTrend = ['amber','orange','red','rose'].includes(kpi.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.38, ease: 'easeOut' }}
      className={`relative bg-white dark:bg-slate-800 rounded-xl p-3.5 ring-1 ${ring} hover:shadow-md transition-all group cursor-pointer overflow-hidden`}
    >
      {/* gradient bar */}
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${kpi.gradient}`} />

      {/* AI badge */}
      {kpi.aiFlag && (
        <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
          <Zap size={8} className="fill-current" /> AI
        </span>
      )}

      <div className="flex items-start gap-2.5 mt-0.5">
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${kpi.gradient} opacity-90 flex-shrink-0`}>
          <Icon size={14} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-tight line-clamp-2">
            {kpi.label}
          </p>
          <p className="text-[17px] font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums leading-tight">
            {val}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {kpi.trend === 'up'
              ? <TrendingUp size={10} className={isNegativeTrend ? 'text-red-500' : 'text-emerald-500'} />
              : kpi.trend === 'down'
              ? <TrendingDown size={10} className="text-emerald-500" />
              : <Minus size={10} className="text-slate-400" />}
            <span className={`text-[10px] font-semibold tabular-nums ${
              isNegativeTrend && kpi.trend === 'up' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {kpi.trendPct > 0 ? '+' : ''}{kpi.trendPct.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400">vs last</span>
          </div>
        </div>
      </div>

      {/* AI tooltip */}
      {kpi.aiFlag && kpi.aiMessage && (
        <div className="absolute z-20 hidden group-hover:block bottom-full left-0 mb-2 w-60 bg-slate-900 dark:bg-slate-700 text-white text-[11px] rounded-xl p-3 shadow-2xl pointer-events-none">
          <p className="text-purple-400 font-semibold mb-1 flex items-center gap-1">
            <Zap size={10} className="fill-current" /> AI Alert
          </p>
          <p className="leading-relaxed">{kpi.aiMessage}</p>
          <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-slate-900 dark:bg-slate-700 rotate-45" />
        </div>
      )}
    </motion.div>
  );
}

export default function DRKPIRibbon() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-2.5">
      {DR_KPIS.map((kpi, i) => (
        <KPICard key={kpi.id} kpi={kpi} index={i} />
      ))}
    </div>
  );
}
