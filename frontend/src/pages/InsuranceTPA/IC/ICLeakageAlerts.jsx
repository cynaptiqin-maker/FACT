import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, AlertCircle, AlertTriangle, Info, ChevronRight,
  X, ArrowRight, Upload, Send, RefreshCw, TrendingDown,
} from 'lucide-react';
import { LEAKAGE_ALERTS, fmtINR } from './ICConstants';

const SEV_CFG = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-50 dark:bg-red-900/10',
    border: 'border-red-200 dark:border-red-800/40',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dot: 'bg-red-400',
    bar: '#ef4444',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-800/40',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    dot: 'bg-amber-400',
    bar: '#f59e0b',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800/40',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    dot: 'bg-blue-400',
    bar: '#3b82f6',
  },
};

const ACTION_ICONS = { 'Submit Now': Send, 'Upload Documents': Upload, 'Review Bills': RefreshCw, 'Prioritise': AlertCircle, 'Reconcile': TrendingDown };

function AlertCard({ alert, index, dismissed, onDismiss }) {
  const cfg = SEV_CFG[alert.severity] ?? SEV_CFG.info;
  const Icon = cfg.icon;
  const ActionIcon = ACTION_ICONS[alert.action] ?? ArrowRight;

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={`relative p-3.5 rounded-xl border ${cfg.bg} ${cfg.border} group`}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={14} className={`${cfg.text} flex-none mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`text-[12px] font-bold leading-tight ${cfg.text}`}>{alert.title}</p>
            <button
              onClick={() => onDismiss(alert.id)}
              className="opacity-0 group-hover:opacity-100 flex-none p-0.5 rounded text-slate-400 hover:text-slate-600 transition-all"
            >
              <X size={11} />
            </button>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2">{alert.detail}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1 text-[11px] font-bold ${cfg.text}`}>
                <Zap size={10} />
                {fmtINR(alert.impact)} at risk
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {alert.department}
              </span>
            </div>
            <button className={`flex items-center gap-1 text-[11px] font-bold ${cfg.text} hover:opacity-80 transition-opacity`}>
              <ActionIcon size={11} />
              {alert.action}
              <ChevronRight size={9} />
            </button>
          </div>
        </div>
      </div>

      {/* Impact bar */}
      <div className="mt-2.5 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (alert.impact / 5000000) * 100)}%` }}
          transition={{ delay: index * 0.06 + 0.3, duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: cfg.bar }}
        />
      </div>
    </motion.div>
  );
}

export default function ICLeakageAlerts() {
  const [dismissed, setDismissed] = useState(new Set());

  const totalImpact = LEAKAGE_ALERTS
    .filter(a => !dismissed.has(a.id))
    .reduce((sum, a) => sum + a.impact, 0);

  const activeCount = LEAKAGE_ALERTS.filter(a => !dismissed.has(a.id)).length;

  const criticalCount = LEAKAGE_ALERTS.filter(a => a.severity === 'critical' && !dismissed.has(a.id)).length;

  return (
    <div className="p-4 space-y-3">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-slate-800 dark:text-slate-100">Revenue Leakage Alerts</div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
              {activeCount} active · {criticalCount} critical · {fmtINR(totalImpact)} exposure
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
            <TrendingDown size={12} />
            {fmtINR(totalImpact)}
          </span>
        </div>
      </div>

      {/* Alert cards */}
      <AnimatePresence>
        {LEAKAGE_ALERTS.map((alert, i) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            index={i}
            dismissed={dismissed.has(alert.id)}
            onDismiss={(id) => setDismissed(prev => new Set([...prev, id]))}
          />
        ))}
      </AnimatePresence>

      {activeCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-10 text-slate-400"
        >
          <Zap size={28} className="text-emerald-400 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No active leakage alerts</p>
          <p className="text-xs mt-1">All revenue recovery actions completed</p>
        </motion.div>
      )}

      {activeCount > 0 && (
        <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
          bg-rose-50 dark:bg-rose-900/15 border border-rose-200 dark:border-rose-700/40
          text-rose-600 dark:text-rose-400 text-[12px] font-semibold hover:bg-rose-100 transition-colors">
          <Zap size={13} />
          Run Full Leakage Scan
        </button>
      )}
    </div>
  );
}
