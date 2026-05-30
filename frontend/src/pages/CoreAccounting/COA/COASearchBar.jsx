import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, X, ChevronDown, Filter,
  Clock, Star, Zap, LayoutGrid, List,
} from 'lucide-react';
import clsx from 'clsx';
import { ACCOUNT_TYPES, TYPE_CONFIG, AI_PROMPTS } from './coaConstants';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'groups', label: 'Groups only' },
  { value: 'ledgers', label: 'Ledgers only' },
];

export default function COASearchBar({
  search,
  onSearch,
  typeFilter,
  onTypeFilter,
  statusFilter,
  onStatusFilter,
  viewMode,
  onViewMode,
  resultCount,
  totalCount,
  onAISearch,
}) {
  const [focused, setFocused] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setShowAISuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowAISuggestions(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleFocus = () => {
    setFocused(true);
    if (!search) setShowAISuggestions(true);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    onSearch(val);
    setShowAISuggestions(val.length === 0);
  };

  const handleClear = () => {
    onSearch('');
    inputRef.current?.focus();
    setShowAISuggestions(true);
  };

  const handleAIPrompt = (prompt) => {
    onAISearch?.(prompt.text);
    onSearch(prompt.text);
    setShowAISuggestions(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search + view controls row */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-2xl">
          <div
            className={clsx(
              'flex items-center gap-2 bg-white border rounded-xl px-3.5 transition-all duration-200',
              focused
                ? 'border-blue-400 ring-2 ring-blue-100 shadow-sm'
                : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search accounts, codes, departments…"
              value={search}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={() => setFocused(false)}
              className="flex-1 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none min-w-0"
            />

            {search ? (
              <button
                onClick={handleClear}
                className="flex-shrink-0 p-0.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex flex-shrink-0 items-center gap-1 text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                ⌘K
              </kbd>
            )}

            <button
              onClick={() => setShowAISuggestions((s) => !s)}
              className={clsx(
                'flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                showAISuggestions
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50',
              )}
              title="AI-powered search suggestions"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI</span>
            </button>
          </div>

          {/* AI suggestions dropdown */}
          <AnimatePresence>
            {showAISuggestions && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="px-3 pt-3 pb-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    AI Smart Search
                  </div>
                  <div className="grid grid-cols-1 gap-0.5">
                    {AI_PROMPTS.map((prompt) => (
                      <button
                        key={prompt.text}
                        onMouseDown={() => handleAIPrompt(prompt)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-violet-50 group transition-colors"
                      >
                        <span className="text-base leading-none">{prompt.icon}</span>
                        <span className="flex-1 text-sm text-slate-700 group-hover:text-violet-800">
                          {prompt.text}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                          {prompt.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 px-3 py-2 bg-slate-50/60">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    <Clock className="w-3 h-3" />
                    Recently Viewed
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Cash in Hand', 'Patient Receivables', 'Pharmacy Revenue'].map((name) => (
                      <button
                        key={name}
                        onMouseDown={() => { onSearch(name); setShowAISuggestions(false); }}
                        className="text-xs text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md hover:border-slate-300 hover:bg-slate-50"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Result count */}
        {search && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden sm:inline text-xs text-slate-500 whitespace-nowrap"
          >
            {resultCount} of {totalCount} accounts
          </motion.span>
        )}

        {/* View mode toggle */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => onViewMode?.('tree')}
            className={clsx(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'tree'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-600',
            )}
            title="Tree view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewMode?.('flat')}
            className={clsx(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'flat'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-600',
            )}
            title="Flat list"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter pills row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Type:</span>
        </div>

        <button
          onClick={() => onTypeFilter('ALL')}
          className={clsx(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
            typeFilter === 'ALL'
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
          )}
        >
          All Types
        </button>

        {ACCOUNT_TYPES.map((type) => {
          const cfg = TYPE_CONFIG[type];
          const active = typeFilter === type;
          return (
            <button
              key={type}
              onClick={() => onTypeFilter(active ? 'ALL' : type)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
                active
                  ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300',
              )}
            >
              {cfg.label}
            </button>
          );
        })}

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilter?.(e.target.value)}
            className="appearance-none text-xs text-slate-600 bg-white border border-slate-200 rounded-full px-3 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-slate-300 cursor-pointer"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>

        {(search || typeFilter !== 'ALL' || statusFilter !== 'all') && (
          <button
            onClick={() => {
              onSearch('');
              onTypeFilter('ALL');
              onStatusFilter?.('all');
            }}
            className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
