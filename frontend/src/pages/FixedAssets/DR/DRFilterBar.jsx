// ─── Depreciation Runs — Filter Bar ──────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sliders, X, Zap, ChevronDown, RotateCcw, Sparkles,
  BookOpen, Building2, Calculator, Calendar, ShieldCheck, AlertTriangle,
  Eye, TrendingDown,
} from 'lucide-react';
import { FILTER_OPTS, AI_SEARCH_HINTS } from './DRConstants';

// ─── Filter Pill ──────────────────────────────────────────────────────────────
const Pill = ({ label, onRemove }) => (
  <motion.span
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
  >
    {label}
    <button onClick={onRemove} className="ml-0.5 hover:text-red-500 transition-colors">
      <X size={10} />
    </button>
  </motion.span>
);

// ─── Generic Dropdown Filter ──────────────────────────────────────────────────
function FilterDropdown({ icon: Icon, label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const active = value && value !== 'all';

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-all ${
          active
            ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-600'
        }`}
      >
        <Icon size={13} />
        <span>{active ? value.replace(/_/g, ' ') : label}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.13 }}
            className="absolute top-full mt-1.5 left-0 z-30 min-w-[160px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
          >
            <button
              onClick={() => { onChange('all'); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[12px] transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/20 ${value === 'all' ? 'text-violet-700 dark:text-violet-300 font-semibold bg-violet-50 dark:bg-violet-900/20' : 'text-slate-600 dark:text-slate-400'}`}
            >
              All {label}s
            </button>
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[12px] transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/20 ${value === o ? 'text-violet-700 dark:text-violet-300 font-semibold bg-violet-50 dark:bg-violet-900/20' : 'text-slate-700 dark:text-slate-300'}`}
              >
                {o.replace(/_/g, ' ')}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Toggle Filter ────────────────────────────────────────────────────────────
function ToggleFilter({ icon: Icon, label, active, color = 'violet', onClick }) {
  const colors = {
    violet: { on: 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300', off: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-300' },
    orange: { on: 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300', off: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-orange-300' },
    rose:   { on: 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300', off: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-300' },
    purple: { on: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300', off: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300' },
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-all flex-shrink-0 ${colors[color][active ? 'on' : 'off']}`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

// ─── Main Filter Bar ──────────────────────────────────────────────────────────
export default function DRFilterBar({ filters, onChange, resultCount, totalCount }) {
  const [showAI,      setShowAI]      = useState(false);
  const [showAdvanced,setShowAdvanced]= useState(false);
  const searchRef = useRef(null);

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'search')  return !!v;
    if (typeof v === 'boolean') return v;
    return v && v !== 'all';
  }).length;

  const handleAI = (s) => { onChange('search', s); setShowAI(false); };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-visible">
      {/* Primary row */}
      <div className="flex flex-wrap items-center gap-2 p-3">
        {/* AI Search */}
        <div className="relative flex-1 min-w-[240px]" ref={searchRef}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => { onChange('search', e.target.value); setShowAI(false); }}
            onFocus={() => setShowAI(true)}
            placeholder="Search runs, assets, journals… or ask AI"
            className="w-full pl-9 pr-20 py-2 text-[12.5px] bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
          />
          {filters.search && (
            <button onClick={() => onChange('search', '')} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={12} />
            </button>
          )}
          <button
            onClick={() => setShowAI(!showAI)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 transition-colors"
          >
            <Sparkles size={9} /> AI
          </button>

          <AnimatePresence>
            {showAI && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.13 }}
                className="absolute top-full mt-1.5 left-0 right-0 z-40 bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <Sparkles size={12} className="text-violet-500" />
                  <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-400">AI Depreciation Search</span>
                </div>
                <div className="p-1.5 max-h-52 overflow-y-auto">
                  {AI_SEARCH_HINTS.map((h, i) => (
                    <button key={i} onClick={() => handleAI(h)} className="w-full text-left flex items-center gap-2 px-3 py-2 text-[12px] text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors">
                      <Zap size={10} className="text-violet-400 flex-shrink-0" />
                      {h}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick filters */}
        <FilterDropdown icon={Calendar}   label="Period"  options={FILTER_OPTS.periods}   value={filters.period   || 'all'} onChange={(v) => onChange('period', v)} />
        <FilterDropdown icon={BookOpen}   label="Book"    options={FILTER_OPTS.books}     value={filters.book     || 'all'} onChange={(v) => onChange('book', v)} />
        <FilterDropdown icon={Building2}  label="Branch"  options={FILTER_OPTS.branches}  value={filters.branch   || 'all'} onChange={(v) => onChange('branch', v)} />
        <FilterDropdown icon={Calculator} label="Method"  options={FILTER_OPTS.methods}   value={filters.method   || 'all'} onChange={(v) => onChange('method', v)} />
        <FilterDropdown icon={TrendingDown} label="Status" options={FILTER_OPTS.runStates} value={filters.runState || 'all'} onChange={(v) => onChange('runState', v)} />

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-all flex-shrink-0 ${
            showAdvanced || activeCount > 0
              ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-300'
          }`}
        >
          <Sliders size={13} />
          Advanced
          {activeCount > 0 && (
            <span className="w-4 h-4 text-[10px] font-bold rounded-full bg-violet-500 text-white flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            onClick={() => onChange('reset', null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-red-300 hover:text-red-500 transition-all flex-shrink-0"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}

        <span className="ml-auto text-[11px] text-slate-400 flex-shrink-0 hidden sm:block">
          {resultCount} / {totalCount} runs
        </span>
      </div>

      {/* Advanced row */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/20">
              <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">Advanced:</span>
              <FilterDropdown icon={Eye}          label="GL Status"   options={FILTER_OPTS.glStatuses} value={filters.glStatus  || 'all'} onChange={(v) => onChange('glStatus', v)} />
              <FilterDropdown icon={ShieldCheck}  label="Compliance"  options={FILTER_OPTS.compliance} value={filters.compliance|| 'all'} onChange={(v) => onChange('compliance', v)} />
              <FilterDropdown icon={AlertTriangle}label="Risk"        options={FILTER_OPTS.risk}       value={filters.risk      || 'all'} onChange={(v) => onChange('risk', v)} />

              <ToggleFilter icon={Sparkles}      label="AI Anomalies"   active={!!filters.aiAnomalies}   color="purple" onClick={() => onChange('aiAnomalies', !filters.aiAnomalies)} />
              <ToggleFilter icon={AlertTriangle} label="Has Impairment" active={!!filters.hasImpairment} color="orange" onClick={() => onChange('hasImpairment', !filters.hasImpairment)} />
              <ToggleFilter icon={RotateCcw}     label="Reversed Only"  active={!!filters.reversed}      color="rose"   onClick={() => onChange('reversed', !filters.reversed)} />
              <ToggleFilter icon={AlertTriangle} label="Fraud Flagged"  active={!!filters.fraudFlagged}  color="violet" onClick={() => onChange('fraudFlagged', !filters.fraudFlagged)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active pills */}
      <AnimatePresence>
        {activeCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap items-center gap-1.5 px-3 pb-3 overflow-hidden"
          >
            {filters.search       && <Pill label={`"${filters.search}"`} onRemove={() => onChange('search', '')} />}
            {filters.period  && filters.period  !== 'all' && <Pill label={filters.period}  onRemove={() => onChange('period', 'all')} />}
            {filters.book    && filters.book    !== 'all' && <Pill label={filters.book}    onRemove={() => onChange('book', 'all')} />}
            {filters.branch  && filters.branch  !== 'all' && <Pill label={filters.branch.replace(/_/g,' ')}  onRemove={() => onChange('branch', 'all')} />}
            {filters.method  && filters.method  !== 'all' && <Pill label={filters.method}  onRemove={() => onChange('method', 'all')} />}
            {filters.runState && filters.runState !== 'all' && <Pill label={filters.runState} onRemove={() => onChange('runState', 'all')} />}
            {filters.glStatus && filters.glStatus !== 'all' && <Pill label={`GL: ${filters.glStatus}`} onRemove={() => onChange('glStatus', 'all')} />}
            {filters.compliance && filters.compliance !== 'all' && <Pill label={`Compliance: ${filters.compliance}`} onRemove={() => onChange('compliance', 'all')} />}
            {filters.risk && filters.risk !== 'all' && <Pill label={`Risk: ${filters.risk}`} onRemove={() => onChange('risk', 'all')} />}
            {filters.aiAnomalies  && <Pill label="AI Anomalies"  onRemove={() => onChange('aiAnomalies', false)} />}
            {filters.hasImpairment && <Pill label="Has Impairment" onRemove={() => onChange('hasImpairment', false)} />}
            {filters.reversed     && <Pill label="Reversed"      onRemove={() => onChange('reversed', false)} />}
            {filters.fraudFlagged && <Pill label="Fraud Flagged" onRemove={() => onChange('fraudFlagged', false)} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
