import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertOctagon, AlertTriangle, FileWarning, GitMerge,
  Search, Repeat2, ChevronRight, CheckCircle2, Eye,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { LEAKAGE_ALERTS } from './ARConstants';

const TYPE_CONFIG = {
  UNDERBILLING:       { icon: AlertTriangle, label: 'Underbilling',        color: '#f97316', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-900/50' },
  MISSING_INVOICE:    { icon: FileWarning,   label: 'Missing Invoice',      color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-200 dark:border-red-900/50'       },
  DELAYED_COLLECTION: { icon: AlertOctagon,  label: 'Delayed Collection',   color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-900/50'   },
  UNRECONCILED:       { icon: GitMerge,      label: 'Unreconciled',         color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-900/50' },
  WRITE_OFF_ANOMALY:  { icon: Search,        label: 'Write-off Anomaly',    color: '#06b6d4', bg: 'bg-cyan-50 dark:bg-cyan-900/20',     border: 'border-cyan-200 dark:border-cyan-900/50'     },
  DUPLICATE_ADJUST:   { icon: Repeat2,       label: 'Duplicate Adjustment', color: '#64748b', bg: 'bg-slate-50 dark:bg-slate-900/50',   border: 'border-slate-200 dark:border-slate-700'       },
};

const SEVERITY_DOT = { HIGH: 'bg-red-500', MEDIUM: 'bg-amber-500', LOW: 'bg-slate-400' };
const STATUS_STYLE = {
  open:      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  reviewing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function AlertCard({ alert, idx, onResolve }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.UNRECONCILED;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className={`border rounded-xl overflow-hidden ${cfg.border} ${alert.status === 'resolved' ? 'opacity-60' : ''}`}
    >
      <div className={`p-3 ${cfg.bg} cursor-pointer`} onClick={() => setExpanded(p => !p)}>
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-none" style={{ background: `${cfg.color}22` }}>
            <Icon size={14} style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{alert.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[alert.status]}`}>
                {alert.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{cfg.label}</span>
              <span className="text-[11px] text-slate-400">·</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{alert.dept}</span>
              {alert.invoice && <>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">{alert.invoice}</span>
              </>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-none">
            <div className="text-right">
              <div className="text-sm font-bold font-mono" style={{ color: cfg.color }}>
                ₹{alert.amount.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-end gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[alert.severity]}`} />
                <span className="text-[10px] text-slate-400">{alert.severity}</span>
              </div>
            </div>
            <ChevronRight size={14} className={`text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{alert.desc}</p>
              <div className="flex items-center gap-2">
                {alert.status !== 'resolved' && (
                  <>
                    <button
                      onClick={() => onResolve(alert.id)}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 size={11} />Mark Resolved
                    </button>
                    <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Eye size={11} />Investigate
                    </button>
                  </>
                )}
                <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ml-auto">
                  <ArrowRight size={11} />Open in Audit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ARLeakageAlerts({ alerts: propAlerts }) {
  const [alerts, setAlerts] = useState(propAlerts ?? LEAKAGE_ALERTS);
  const [filter, setFilter] = useState('all');

  const totalImpact  = alerts.filter(a => a.status !== 'resolved').reduce((s, a) => s + a.amount, 0);
  const openCount    = alerts.filter(a => a.status === 'open').length;
  const reviewCount  = alerts.filter(a => a.status === 'reviewing').length;
  const resolvedCount= alerts.filter(a => a.status === 'resolved').length;

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.status === filter);

  const handleResolve = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Impact',     val: `₹${(totalImpact/100000).toFixed(1)}L`, color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-50 dark:bg-rose-900/10'     },
          { label: 'Open Alerts',      val: openCount,    color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/10' },
          { label: 'Under Review',     val: reviewCount,  color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/10'   },
          { label: 'Resolved',         val: resolvedCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
            className={`${s.bg} border border-transparent rounded-xl p-3 text-center`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* AI summary */}
      <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl">
        <Sparkles size={14} className="text-rose-500 flex-none mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">AI Leakage Summary</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Estimated revenue leakage of ₹{(totalImpact/100000).toFixed(1)}L detected across {openCount + reviewCount} active alerts.
            ICU underbilling and delayed collections represent the highest impact areas. Resolving these could recover ₹6.3L this quarter.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { id: 'all',       label: `All (${alerts.length})`     },
          { id: 'open',      label: `Open (${openCount})`        },
          { id: 'reviewing', label: `Reviewing (${reviewCount})` },
          { id: 'resolved',  label: `Resolved (${resolvedCount})`},
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === f.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.map((alert, i) => (
          <AlertCard key={alert.id} alert={alert} idx={i} onResolve={handleResolve} />
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-slate-400 dark:text-slate-600 gap-2">
            <CheckCircle2 size={32} className="opacity-40" />
            <p className="text-sm">No alerts in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
