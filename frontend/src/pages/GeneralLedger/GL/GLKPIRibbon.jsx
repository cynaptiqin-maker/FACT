import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee, TrendingUp, ArrowUpDown, RefreshCw,
  Clock, AlertTriangle, GitBranch, CheckCircle2,
  TrendingDown,
} from 'lucide-react';
import { KPI_DATA, fmtCurrency } from './glConstants';

const KPI_CONFIG = [
  {
    key: 'totalDebits',
    label: 'Total Debits',
    icon: TrendingDown,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    accent: 'from-red-500/8 to-transparent',
    border: 'border-red-100',
    valueClass: 'text-red-700',
    good: 'down',
  },
  {
    key: 'totalCredits',
    label: 'Total Credits',
    icon: TrendingUp,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accent: 'from-emerald-500/8 to-transparent',
    border: 'border-emerald-100',
    valueClass: 'text-emerald-700',
    good: 'up',
  },
  {
    key: 'netMovement',
    label: 'Net Movement',
    icon: ArrowUpDown,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    accent: 'from-cyan-500/8 to-transparent',
    border: 'border-cyan-100',
    valueClass: 'text-cyan-700',
    good: 'up',
  },
  {
    key: 'outstandingRecon',
    label: 'Outstanding Recon',
    icon: RefreshCw,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accent: 'from-amber-500/8 to-transparent',
    border: 'border-amber-100',
    valueClass: 'text-amber-700',
    good: 'down',
  },
  {
    key: 'unpostedEntries',
    label: 'Unposted Entries',
    icon: Clock,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    accent: 'from-orange-500/8 to-transparent',
    border: 'border-orange-100',
    valueClass: 'text-orange-700',
    good: 'down',
  },
  {
    key: 'suspiciousTransactions',
    label: 'Suspicious Entries',
    icon: AlertTriangle,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    accent: 'from-rose-500/8 to-transparent',
    border: 'border-rose-200',
    valueClass: 'text-rose-700',
    good: 'down',
    pulse: true,
  },
  {
    key: 'branchVariance',
    label: 'Branch Variance',
    icon: GitBranch,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accent: 'from-violet-500/8 to-transparent',
    border: 'border-violet-100',
    valueClass: 'text-violet-700',
    good: 'down',
  },
  {
    key: 'pendingApprovals',
    label: 'Pending Approvals',
    icon: CheckCircle2,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    accent: 'from-slate-500/5 to-transparent',
    border: 'border-slate-200',
    valueClass: 'text-slate-700',
    good: 'down',
  },
];

function useCounter(target, duration = 1000) {
  const [count, setCount] = useState(0);
  const raf   = useRef(null);
  const start = useRef(null);

  useEffect(() => {
    start.current = null;
    const animate = (ts) => {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return count;
}

function KPICard({ cfg, data, index }) {
  const Icon   = cfg.icon;
  const raw    = data.value;
  const count  = useCounter(cfg.key.includes('total') || cfg.key === 'netMovement' ? 0 : raw, 800 + index * 60);
  const isGood = (data.dir === 'down' && cfg.good === 'down') || (data.dir === 'up' && cfg.good === 'up');

  const displayVal = data.fmt === 'currency'
    ? fmtCurrency(raw, true)
    : (cfg.key.includes('total') || cfg.key === 'netMovement' ? fmtCurrency(raw, true) : count.toLocaleString('en-IN'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`
        relative flex-shrink-0 w-[200px] bg-white rounded-xl border ${cfg.border}
        shadow-kpi p-4 cursor-pointer group
        hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200
        overflow-hidden
      `}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.accent} pointer-events-none`} />

      {/* Pulse for anomaly */}
      {cfg.pulse && data.value > 0 && (
        <span className="absolute top-3 right-3 w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
        </span>
      )}

      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
      </div>

      {/* Value */}
      <p className={`text-xl font-bold tracking-tight ${cfg.valueClass} leading-none mb-1`}>
        {displayVal}
      </p>

      {/* Label */}
      <p className="text-xs text-slate-500 font-medium leading-snug mb-2">{cfg.label}</p>

      {/* Delta */}
      <div className="flex items-center gap-1">
        {data.dir === 'up'
          ? <TrendingUp  className={`w-3 h-3 ${isGood ? 'text-emerald-500' : 'text-red-500'}`} />
          : <TrendingDown className={`w-3 h-3 ${isGood ? 'text-emerald-500' : 'text-red-500'}`} />
        }
        <span className={`text-[11px] font-semibold ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>
          {data.dir === 'up' ? '+' : ''}{data.delta}%
        </span>
        <span className="text-[10px] text-slate-400 ml-0.5">vs last period</span>
      </div>

      {/* Hover shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
        bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
    </motion.div>
  );
}

export default function GLKPIRibbon() {
  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {KPI_CONFIG.map((cfg, i) => (
          <KPICard key={cfg.key} cfg={cfg} data={KPI_DATA[cfg.key]} index={i} />
        ))}
      </div>
      {/* Fade edge */}
      <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />
    </div>
  );
}
