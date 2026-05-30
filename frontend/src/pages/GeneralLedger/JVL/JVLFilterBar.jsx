import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, SlidersHorizontal, X, ChevronDown,
  CalendarRange, LayoutList, Clock, FilePen, CalendarCheck, AlertTriangle,
} from 'lucide-react';
import { BRANCHES, DEPARTMENTS, SOURCE_MODULES, QUICK_FILTERS, SAVED_VIEWS, AI_QUICK_PROMPTS } from './jvlConstants';

const VIEW_ICONS = { LayoutList, Clock, FilePen, CalendarCheck, AlertTriangle };

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-3 pr-7 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2840] text-gray-700 dark:text-gray-200 appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-1 focus:ring-[#1C3741]/30 transition-colors"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
    </div>
  );
}

export default function JVLFilterBar({ filters, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const suggestRef = useRef(null);

  const activeCount = [
    filters.branch !== 'All Branches',
    filters.department !== 'All Departments',
    filters.source !== 'All Sources',
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin,
    filters.amountMax,
  ].filter(Boolean).length;

  const set = (key, val) => onChange({ ...filters, [key]: val });

  useEffect(() => {
    const handler = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (val) => {
    set('search', val);
    setShowSuggestions(aiMode && val.length === 0);
  };

  const applyPrompt = (prompt) => {
    set('search', prompt);
    setShowSuggestions(false);
    searchRef.current?.blur();
  };

  const clearAll = () => {
    onChange({
      search: '', quickFilter: 'all', branch: 'All Branches', department: 'All Departments',
      source: 'All Sources', dateFrom: '', dateTo: '', amountMin: '', amountMax: '',
    });
  };

  return (
    <div className="flex-shrink-0 bg-white dark:bg-[#162030] border-b border-gray-200 dark:border-[#1e3045]">
      {/* Primary row */}
      <div className="flex items-center gap-2 px-6 py-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-xl" ref={suggestRef}>
          <div className={[
            'flex items-center gap-2 h-9 px-3 rounded-xl border transition-all',
            aiMode
              ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-800'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a2840] focus-within:border-[#1C3741]/40 focus-within:ring-1 focus-within:ring-[#1C3741]/15',
          ].join(' ')}>
            {aiMode
              ? <Sparkles className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
              : <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            }
            <input
              ref={searchRef}
              type="text"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => aiMode && setShowSuggestions(true)}
              placeholder={aiMode ? 'Ask AI: "Show unapproved ICU adjustments"…' : 'Search voucher no., narration, amount, account…'}
              className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
            />
            {filters.search && (
              <button onClick={() => set('search', '')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showSuggestions && aiMode && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white dark:bg-[#1e2d42] border border-gray-200 dark:border-[#2a3f5e] rounded-xl shadow-xl overflow-hidden"
              >
                <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  AI Suggestions
                </p>
                {AI_QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPrompt(p)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  >
                    <Sparkles className="h-3 w-3 text-violet-400 flex-shrink-0" />
                    {p}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { setAiMode(!aiMode); if (!aiMode) setShowSuggestions(true); }}
          className={[
            'h-9 px-3 flex items-center gap-1.5 rounded-xl text-sm font-medium border transition-all',
            aiMode
              ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300 hover:text-violet-600',
          ].join(' ')}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI Search</span>
        </motion.button>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={[
            'h-9 px-3 flex items-center gap-1.5 rounded-xl text-sm font-medium border transition-all',
            showAdvanced
              ? 'bg-[#1C3741] text-white border-[#1C3741]'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300',
          ].join(' ')}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className={['text-[10px] font-bold px-1.5 py-0.5 rounded-full', showAdvanced ? 'bg-white/20 text-white' : 'bg-[#1C3741] text-white'].join(' ')}>
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button onClick={clearAll} className="h-9 px-3 text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-colors">
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}

        <div className="flex-1" />

        {/* Saved views */}
        <div className="hidden lg:flex items-center gap-1">
          {SAVED_VIEWS.map((v) => {
            const Icon = VIEW_ICONS[v.icon];
            const isActive = filters.quickFilter === v.id;
            return (
              <button
                key={v.id}
                onClick={() => set('quickFilter', v.id)}
                className={[
                  'h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-[#1C3741] text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                <Icon className="h-3 w-3" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick filter chips */}
      <div className="flex items-center gap-1.5 px-6 pb-2 overflow-x-auto scrollbar-none">
        {QUICK_FILTERS.map((qf) => {
          const isActive = filters.quickFilter === qf.id;
          return (
            <button
              key={qf.id}
              onClick={() => set('quickFilter', qf.id)}
              className={[
                'flex-shrink-0 h-7 px-3 rounded-full text-xs font-medium border transition-all',
                isActive
                  ? 'bg-[#1C3741] text-white border-[#1C3741] shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-[#1a2840]',
              ].join(' ')}
            >
              {qf.label}
            </button>
          );
        })}
      </div>

      {/* Advanced filters panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
          >
            <div className="flex flex-wrap items-center gap-2 px-6 py-3">
              <FilterSelect label="Branch" value={filters.branch} onChange={(v) => set('branch', v)} options={BRANCHES} />
              <FilterSelect label="Department" value={filters.department} onChange={(v) => set('department', v)} options={DEPARTMENTS} />
              <FilterSelect label="Source" value={filters.source} onChange={(v) => set('source', v)} options={SOURCE_MODULES} />

              <div className="flex items-center gap-1.5">
                <CalendarRange className="h-3.5 w-3.5 text-gray-400" />
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => set('dateFrom', e.target.value)}
                  className="h-8 px-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2840] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#1C3741]/30"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => set('dateTo', e.target.value)}
                  className="h-8 px-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2840] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#1C3741]/30"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">₹ Min</span>
                <input
                  type="number"
                  value={filters.amountMin}
                  onChange={(e) => set('amountMin', e.target.value)}
                  placeholder="0"
                  className="h-8 w-28 px-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2840] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#1C3741]/30"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">Max</span>
                <input
                  type="number"
                  value={filters.amountMax}
                  onChange={(e) => set('amountMax', e.target.value)}
                  placeholder="∞"
                  className="h-8 w-28 px-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2840] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#1C3741]/30"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
