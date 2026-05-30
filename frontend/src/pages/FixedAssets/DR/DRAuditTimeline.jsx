// ─── Depreciation Runs — Global Audit Timeline ───────────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Filter, ChevronDown, User, Bot, CheckCircle,
  AlertTriangle, RefreshCw, FileText, Lock, Eye, X,
} from 'lucide-react';
import { GLOBAL_AUDIT, AUDIT_TYPES } from './DRConstants';

// normalise severity from constants (INFO/CRITICAL/HIGH/MEDIUM) → lowercase for SEV_CFG
const normSev = s => (s || 'info').toLowerCase();

// convert AUDIT_TYPES object → array for dropdowns & lookup
const AUDIT_TYPES_ARR = Object.entries(AUDIT_TYPES).map(([id, cfg]) => ({ id, ...cfg }));

function fmtDateTime(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ts; }
}

const SEV_CFG = {
  critical: { text: 'text-red-700 dark:text-red-400',    bg: 'bg-red-100 dark:bg-red-900/40',    dot: 'bg-red-500'    },
  high:     { text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40', dot: 'bg-amber-500'  },
  medium:   { text: 'text-blue-700 dark:text-blue-400',   bg: 'bg-blue-100 dark:bg-blue-900/40',   dot: 'bg-blue-500'   },
  low:      { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', dot: 'bg-emerald-500' },
  info:     { text: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-100 dark:bg-slate-700',    dot: 'bg-slate-400'  },
};

const ACTOR_ICON = {
  user:   User,
  system: RefreshCw,
  ai:     Bot,
  audit:  Shield,
};

function TypeFilterDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11.5px] font-medium text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
      >
        <Filter size={11} />
        {selected?.label || 'All Types'}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 z-30 min-w-[180px] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 overflow-hidden"
          >
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-[11.5px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              All Types
            </button>
            {options.map(o => (
              <button
                key={o.id}
                onClick={() => { onChange(o.id); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[11.5px] flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${value === o.id ? 'font-semibold text-violet-600 dark:text-violet-400' : 'text-slate-700 dark:text-slate-300'}`}
              >
                <span className={`w-2 h-2 rounded-full ${o.color}`} />
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AuditEvent({ event, index }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV_CFG[normSev(event.severity)] || SEV_CFG.info;
  // infer actor type from user name
  const actorType = event.user === 'System' ? 'system' : event.user === 'AI Engine' ? 'ai' : 'user';
  const ActorIcon = ACTOR_ICON[actorType] || User;
  const typeConfig = AUDIT_TYPES_ARR.find(t => t.id === event.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, duration: 0.3 }}
      className="relative flex gap-3"
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ring-2 ring-white dark:ring-slate-900 ${sev.dot}`} />
        <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1 min-h-[24px]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div
          className="flex items-start justify-between gap-2 cursor-pointer group"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-start gap-2 min-w-0">
            <div className={`p-1 rounded-md flex-shrink-0 mt-0.5 ${sev.bg}`}>
              <ActorIcon size={11} className={sev.text} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">{event.action}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] text-slate-400 tabular-nums">{fmtDateTime(event.ts)}</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{event.user}</span>
                {event.runId && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-[10px] text-violet-600 dark:text-violet-400 font-mono">{event.runId}</span>
                  </>
                )}
                {typeConfig && (
                  <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${sev.bg} ${sev.text}`}>
                    {typeConfig.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronDown
            size={13}
            className={`text-slate-400 flex-shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''} opacity-0 group-hover:opacity-100`}
          />
        </div>

        <AnimatePresence>
          {expanded && event.details && false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 ml-7 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                {event.details.before && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Before</p>
                    <pre className="text-[10.5px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">{JSON.stringify(event.details.before, null, 2)}</pre>
                  </div>
                )}
                {event.details.after && (
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">After</p>
                    <pre className="text-[10.5px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">{JSON.stringify(event.details.after, null, 2)}</pre>
                  </div>
                )}
                {event.details.note && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">{event.details.note}</p>
                )}
                {event.hash && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <Lock size={10} className="text-emerald-500" />
                    <span className="text-[10px] text-slate-400 font-mono">{event.hash}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function DRAuditTimeline() {
  const AUDIT_TYPES_OPTS = AUDIT_TYPES_ARR;
  const [typeFilter, setTypeFilter] = useState(null);
  const [sevFilter, setSevFilter]   = useState(null);
  const [search, setSearch]         = useState('');

  const filtered = GLOBAL_AUDIT.filter(e => {
    if (typeFilter && e.type !== typeFilter) return false;
    if (sevFilter  && normSev(e.severity) !== sevFilter) return false;
    if (search && !e.action.toLowerCase().includes(search.toLowerCase()) &&
                  !e.user?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-violet-600 dark:text-violet-400" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Global Audit Timeline</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 font-bold">
            {filtered.length} events
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
            <Lock size={10} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Immutable log</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
            <Eye size={10} className="text-blue-600 dark:text-blue-400" />
            <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">INDAS compliant</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search events…"
          className="flex-1 min-w-[160px] text-[11.5px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-violet-400"
        />
        <TypeFilterDropdown value={typeFilter} onChange={setTypeFilter} options={AUDIT_TYPES_OPTS} />
        <div className="flex items-center gap-1">
          {['critical', 'high', 'medium', 'low'].map(s => (
            <button
              key={s}
              onClick={() => setSevFilter(prev => prev === s ? null : s)}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold transition-all capitalize ${
                sevFilter === s
                  ? `${SEV_CFG[s].bg} ${SEV_CFG[s].text}`
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
          {(typeFilter || sevFilter || search) && (
            <button
              onClick={() => { setTypeFilter(null); setSevFilter(null); setSearch(''); }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-[12px]">No audit events match the current filters.</div>
        ) : (
          <div>
            {filtered.map((event, i) => (
              <AuditEvent key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <Lock size={11} className="text-emerald-500" />
        <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
          All entries are cryptographically signed (SHA-256) and write-once. Tampering is detected automatically.
        </p>
      </div>
    </div>
  );
}
