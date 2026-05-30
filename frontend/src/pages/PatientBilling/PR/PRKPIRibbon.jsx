import { motion } from 'framer-motion';
import {
  TrendingUp, Banknote, CreditCard, Shield, Scale, Clock,
  RotateCcw, RefreshCcw, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { fmtINR, PR_KPI_CONFIG, MOCK_KPI_VALUES } from './PRConstants';

const ICON_MAP = { TrendingUp, Banknote, CreditCard, Shield, Scale, Clock, RotateCcw, RefreshCcw, AlertTriangle, CheckCircle2 };

function KPICard({ cfg, value, onClick, active }) {
  const Icon = ICON_MAP[cfg.icon] ?? TrendingUp;
  const displayVal = cfg.fmt === 'currency' ? fmtINR(value) : value;
  const isAlert = cfg.alert && (cfg.fmt === 'count' ? value > 0 : value > 0);

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(active ? null : cfg.key)}
      className={`relative flex flex-col gap-1.5 p-3.5 rounded-2xl border text-left transition-all
        ${active
          ? 'border-[var(--accent)] shadow-md ring-1 ring-[var(--accent)]/30'
          : isAlert
            ? 'border-red-200 dark:border-red-800/40 bg-red-50/60 dark:bg-red-900/10 hover:border-red-300'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      style={{ '--accent': cfg.accent }}
    >
      {/* Pulse for alerts */}
      {isAlert && (
        <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
          <span className="animate-ping absolute h-2 w-2 rounded-full bg-red-400 opacity-75" />
          <span className="relative h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}

      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-none"
          style={{ background: `${cfg.accent}18` }}>
          <Icon size={13} style={{ color: cfg.accent }} />
        </div>
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide leading-tight">
          {cfg.label}
        </p>
      </div>

      <p className="text-[17px] font-bold leading-tight tabular-nums"
        style={{ color: active ? cfg.accent : isAlert ? '#dc2626' : '#0f172a' }}>
        {displayVal}
      </p>

      {cfg.trend != null && (
        <p className={`text-[10px] font-semibold ${cfg.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {cfg.trend >= 0 ? '↑' : '↓'} {Math.abs(cfg.trend)}% vs yesterday
        </p>
      )}
    </motion.button>
  );
}

export default function PRKPIRibbon({ onCardClick, activeCard }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-2.5">
      {PR_KPI_CONFIG.map(cfg => (
        <KPICard
          key={cfg.key}
          cfg={cfg}
          value={MOCK_KPI_VALUES[cfg.key]}
          onClick={onCardClick}
          active={activeCard === cfg.key}
        />
      ))}
    </div>
  );
}
