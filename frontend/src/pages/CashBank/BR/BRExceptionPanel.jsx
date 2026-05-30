import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, AlertOctagon, Info, CheckCircle2,
  User, ArrowUpRight, MessageSquare, Clock,
} from 'lucide-react';
import { EXCEPTIONS, fmtINR } from './BRConstants';

const SEV_STYLES = {
  critical: { icon: AlertOctagon,  text: 'text-red-600 dark:text-red-400',    bg: 'bg-red-500/8 dark:bg-red-500/12',     border: 'border-red-200 dark:border-red-500/25',    badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' },
  high:     { icon: AlertTriangle, text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/8 dark:bg-orange-500/12', border: 'border-orange-200 dark:border-orange-500/25', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300' },
  medium:   { icon: AlertTriangle, text: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-500/8 dark:bg-amber-500/12',   border: 'border-amber-200 dark:border-amber-500/25',  badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' },
  low:      { icon: Info,          text: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-500/8 dark:bg-blue-500/12',     border: 'border-blue-200 dark:border-blue-500/25',    badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' },
};

const STATUS_STYLES = {
  OPEN:       'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
  ESCALATED:  'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
  IN_REVIEW:  'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  RESOLVED:   'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
};

const TYPE_LABELS = {
  UNIDENTIFIED_CREDIT: 'Unidentified Credit',
  DUPLICATE_DEBIT:     'Duplicate Debit',
  BOOK_BANK_VARIANCE:  'Book/Bank Variance',
  MISSING_BANK_ENTRY:  'Missing Bank Entry',
  UNAUTHORIZED_DEBIT:  'Unauthorized Debit',
  UNBOOKED_BANK_CHARGE:'Unbooked Charge',
};

function ExceptionCard({ exc, index }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(exc.status);
  const sev = SEV_STYLES[exc.severity] || SEV_STYLES.low;
  const Icon = sev.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-xl border ${sev.border} ${sev.bg} overflow-hidden`}
    >
      <div
        className="flex items-start gap-3 p-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${sev.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-800 dark:text-white">{TYPE_LABELS[exc.type] || exc.type}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sev.badge}`}>{exc.severity.toUpperCase()}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}>{status}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{fmtINR(exc.amount)}</span>
            <span className="text-[10px] text-slate-400">{exc.ref}</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />{exc.date}
            </span>
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
            <div className="px-3 pb-3 space-y-3 border-t border-current/10">
              <div className="mt-3 flex items-start gap-1.5">
                <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 dark:text-slate-300">{exc.note}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Assigned to:</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{exc.assignee}</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {status !== 'RESOLVED' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setStatus('RESOLVED'); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Resolve
                  </button>
                )}
                {status === 'OPEN' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setStatus('ESCALATED'); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-400 text-[11px] font-medium border border-orange-200 dark:border-orange-500/30 hover:bg-orange-500/20 transition-colors"
                  >
                    <ArrowUpRight className="w-3 h-3" /> Escalate
                  </button>
                )}
                <button className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  Add Note
                </button>
                <button className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  View Txn
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BRExceptionPanel() {
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL'
    ? EXCEPTIONS
    : EXCEPTIONS.filter(e => e.severity === filter.toLowerCase() || e.status === filter);

  const counts = {
    critical: EXCEPTIONS.filter(e => e.severity === 'critical').length,
    high: EXCEPTIONS.filter(e => e.severity === 'high').length,
    open: EXCEPTIONS.filter(e => e.status === 'OPEN').length,
    escalated: EXCEPTIONS.filter(e => e.status === 'ESCALATED').length,
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Critical', value: counts.critical, color: 'red' },
          { label: 'High',     value: counts.high,     color: 'orange' },
          { label: 'Open',     value: counts.open,     color: 'amber' },
          { label: 'Escalated',value: counts.escalated,color: 'rose' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl bg-${color}-500/8 dark:bg-${color}-500/12 border border-${color}-200 dark:border-${color}-500/20 p-2.5 text-center`}>
            <div className={`text-xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {['ALL','critical','high','medium','OPEN','ESCALATED','IN_REVIEW'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              filter === f
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/40 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            {f === 'ALL' ? `All (${EXCEPTIONS.length})` : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Exception list */}
      <div className="space-y-2">
        {filtered.map((exc, i) => (
          <ExceptionCard key={exc.id} exc={exc} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
            No exceptions match this filter
          </div>
        )}
      </div>
    </div>
  );
}
