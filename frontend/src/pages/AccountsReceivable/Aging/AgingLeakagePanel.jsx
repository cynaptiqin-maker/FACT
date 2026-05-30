import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertOctagon, AlertTriangle, Info, Zap, ChevronDown,
  ArrowRight, DollarSign, RefreshCw, Sparkles,
} from 'lucide-react';
import { LEAKAGE_ALERTS } from './AgingConstants';

const SEV_META = {
  critical: {
    icon: AlertOctagon, label: 'Critical',
    iconColor: 'text-red-500 dark:text-red-400',
    border: 'border-red-200 dark:border-red-900/40',
    bg: 'bg-red-50 dark:bg-red-900/10',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  high: {
    icon: Zap, label: 'High',
    iconColor: 'text-orange-500 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-900/40',
    bg: 'bg-orange-50 dark:bg-orange-900/10',
    badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  medium: {
    icon: AlertTriangle, label: 'Medium',
    iconColor: 'text-amber-500 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-900/40',
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  low: {
    icon: Info, label: 'Low',
    iconColor: 'text-blue-500 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-900/40',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
};

const CATEGORY_COLORS = {
  'Missing Claims':         '#ef4444',
  'Underbilled':            '#f97316',
  'Delayed Submission':     '#ef4444',
  'Unreconciled Settlements':'#f59e0b',
  'Denied Claims':          '#f59e0b',
  'Write-Off Alert':        '#3b82f6',
};

function LeakageCard({ alert, idx }) {
  const [open, setOpen] = useState(false);
  const meta = SEV_META[alert.severity] ?? SEV_META.medium;
  const Icon = meta.icon;
  const categoryColor = CATEGORY_COLORS[alert.category] ?? '#94a3b8';
  const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className={`rounded-xl border ${meta.border} overflow-hidden`}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-start gap-3 p-3.5 text-left ${meta.bg} transition-opacity hover:opacity-90`}
      >
        {/* Severity icon */}
        <div className={`mt-0.5 flex-none ${meta.iconColor}`}>
          <Icon size={15} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Category + confidence */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: categoryColor + '20', color: categoryColor }}>
              {alert.category}
            </span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-auto">
              AI confidence: <strong className="text-slate-600 dark:text-slate-400">{alert.aiConfidence}%</strong>
            </span>
          </div>
          <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">{alert.title}</div>
        </div>

        {/* Impact amount */}
        <div className="flex-none text-right ml-2">
          <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">{fmt(alert.impact)}</div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500">at risk</div>
        </div>

        <ChevronDown size={14} className={`flex-none text-slate-400 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3.5 border-t border-current/10 bg-white dark:bg-slate-900 space-y-3">
              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{alert.description}</p>

              {/* Details row */}
              <div className="flex flex-wrap gap-3 text-[11px]">
                {[
                  { label: 'Branch',     val: alert.branch },
                  { label: 'Department', val: alert.dept   },
                  { label: 'Accounts',   val: alert.accounts },
                  { label: 'Detected',   val: new Date(alert.detectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="text-slate-400 dark:text-slate-500">{label}:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{val}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {alert.severity === 'critical' ? (
                  <>
                    <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700 transition-colors">
                      <Zap size={11} />Immediate Action
                    </button>
                    <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-[11px] font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      Assign & Track <ArrowRight size={11} />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      View Accounts <ArrowRight size={11} />
                    </button>
                    <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      Mark Resolved
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AgingLeakagePanel() {
  const totalImpact = LEAKAGE_ALERTS.reduce((s, a) => s + a.impact, 0);
  const criticalCount = LEAKAGE_ALERTS.filter(a => a.severity === 'critical').length;
  const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Leakage Risk',   val: fmt(totalImpact),     color: 'text-rose-600 dark:text-rose-400',   icon: DollarSign   },
          { label: 'Critical Alerts',      val: criticalCount,        color: 'text-red-600 dark:text-red-400',     icon: AlertOctagon },
          { label: 'AI Detection Rate',    val: '96%',                color: 'text-cyan-600 dark:text-cyan-400',   icon: Sparkles     },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={12} className={color} />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <div className={`text-base font-bold font-mono ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Revenue Leakage Alerts — {LEAKAGE_ALERTS.length} detected
        </div>
        <button className="flex items-center gap-1 text-[10px] text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 transition-colors">
          <RefreshCw size={9} />Re-scan
        </button>
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        {LEAKAGE_ALERTS.map((alert, i) => (
          <LeakageCard key={alert.id} alert={alert} idx={i} />
        ))}
      </div>

      {/* AI attribution */}
      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 pt-1">
        <Sparkles size={9} className="text-cyan-400" />
        Leakage detection powered by FACT AI — comparing billing, clinical, and TPA records in real time
      </div>
    </div>
  );
}
