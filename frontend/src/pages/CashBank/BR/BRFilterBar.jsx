import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, ChevronDown, Sparkles,
  Filter, RefreshCw, Download,
} from 'lucide-react';
import { BANK_ACCOUNTS, BRANCHES, MATCH_STATUS, PAYMENT_METHODS, SOURCE_MODULES } from './BRConstants';

const STATUS_OPTIONS = Object.entries(MATCH_STATUS).map(([k, v]) => ({ id: k, label: v.label }));
const METHOD_OPTIONS = PAYMENT_METHODS.map(m => ({ id: m, label: m }));
const TYPE_OPTIONS   = ['RECEIPT','PAYMENT','SETTLEMENT','REFUND','BANK_CHARGE','TRANSFER','GATEWAY'].map(t => ({ id: t, label: t.replace('_', ' ') }));
const RISK_OPTIONS   = ['LOW','MEDIUM','HIGH','CRITICAL'].map(r => ({ id: r, label: r }));

function DropFilter({ label, options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          value
            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/40 dark:text-indigo-300'
            : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
        } hover:border-indigo-300 dark:hover:border-indigo-500/40`}
      >
        <span>{value ? options.find(o => o.id === value)?.label || label : label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl min-w-[160px] overflow-hidden"
          >
            <div className="py-1 max-h-52 overflow-y-auto">
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                {placeholder || 'All'}
              </button>
              {options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { onChange(opt.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    value === opt.id
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-500/30"
    >
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors">
        <X className="w-2.5 h-2.5" />
      </button>
    </motion.span>
  );
}

const AI_PROMPTS = [
  'Show unmatched UPI settlements',
  'Find delayed insurance settlements',
  'Detect duplicate transactions',
  'Show critical risk items',
];

export default function BRFilterBar({ filters, onFilterChange, total, filtered, selectedCount, onBulkAction }) {
  const [showMore, setShowMore] = useState(false);
  const [aiSearch, setAiSearch] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const hasActive = Object.entries(filters).some(([k, v]) => k !== 'search' && v);
  const activeCount = Object.values(filters).filter(v => v && v !== '').length;

  const handleReset = () => {
    ['bankAccount','branch','type','method','status','risk','source','unmatchedOnly','exceptionsOnly','dateFrom','dateTo'].forEach(k => onFilterChange(k, ''));
    onFilterChange('search', '');
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex-shrink-0">
      {/* Primary filter row */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          {aiSearch ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/50 bg-cyan-500/5 dark:bg-cyan-500/10">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <input
                autoFocus
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { onFilterChange('search', aiInput); setAiSearch(false); } if (e.key === 'Escape') setAiSearch(false); }}
                placeholder="Ask AI: 'show unmatched UPI settlements'…"
                className="flex-1 bg-transparent text-xs text-cyan-300 placeholder-cyan-500/60 outline-none"
              />
              <button onClick={() => setAiSearch(false)} className="text-cyan-500 hover:text-cyan-300">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:border-indigo-400 dark:focus-within:border-indigo-500/60 transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                value={filters.search || ''}
                onChange={e => onFilterChange('search', e.target.value)}
                placeholder="Search ref, narration, bank ref…"
                className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none"
              />
              {filters.search && (
                <button onClick={() => onFilterChange('search', '')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* AI search toggle */}
        <button
          onClick={() => { setAiSearch(s => !s); setAiInput(''); }}
          title="AI Natural Language Search"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            aiSearch
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-cyan-400/50 hover:text-cyan-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Search</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        <DropFilter label="Bank Account" options={BANK_ACCOUNTS.map(b => ({ id: b.id, label: b.name }))} value={filters.bankAccount} onChange={v => onFilterChange('bankAccount', v)} />
        <DropFilter label="Branch"       options={BRANCHES.slice(1)}                                     value={filters.branch}      onChange={v => onFilterChange('branch', v)} />
        <DropFilter label="Status"       options={STATUS_OPTIONS}                                         value={filters.status}      onChange={v => onFilterChange('status', v)} />
        <DropFilter label="Risk"         options={RISK_OPTIONS.map(r => ({ id: r, label: r }))}           value={filters.risk}        onChange={v => onFilterChange('risk', v)} />

        <button
          onClick={() => setShowMore(s => !s)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            showMore
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/40 dark:text-indigo-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          More {activeCount > 0 && <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px]">{activeCount}</span>}
        </button>

        {(hasActive || filters.search) && (
          <button onClick={handleReset} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {selectedCount > 0 && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{selectedCount} selected</span>
                <button onClick={() => onBulkAction('match')}    className="px-2 py-1 text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">Match</button>
                <button onClick={() => onBulkAction('export')}   className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Export</button>
                <button onClick={() => onBulkAction('adjust')}   className="px-2 py-1 text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-500/30 hover:bg-amber-500/20 transition-colors">Adjust</button>
              </motion.div>
            </AnimatePresence>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {filtered} / {total} txns
          </span>
        </div>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 px-4 pb-2.5 pt-0.5 border-t border-slate-100 dark:border-slate-800">
              <DropFilter label="Type"       options={TYPE_OPTIONS}                                               value={filters.type}   onChange={v => onFilterChange('type', v)} />
              <DropFilter label="Method"     options={METHOD_OPTIONS}                                             value={filters.method} onChange={v => onFilterChange('method', v)} />
              <DropFilter label="Source"     options={SOURCE_MODULES.map(s => ({ id: s, label: s.replace('_',' ') }))} value={filters.source} onChange={v => onFilterChange('source', v)} />

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Amount:</span>
                <input type="number" placeholder="Min" value={filters.amtMin || ''} onChange={e => onFilterChange('amtMin', e.target.value)}
                  className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-indigo-400 outline-none" />
                <span className="text-slate-400">–</span>
                <input type="number" placeholder="Max" value={filters.amtMax || ''} onChange={e => onFilterChange('amtMax', e.target.value)}
                  className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-indigo-400 outline-none" />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Date:</span>
                <input type="date" value={filters.dateFrom || ''} onChange={e => onFilterChange('dateFrom', e.target.value)}
                  className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-indigo-400 outline-none" />
                <span className="text-slate-400">to</span>
                <input type="date" value={filters.dateTo || ''} onChange={e => onFilterChange('dateTo', e.target.value)}
                  className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-indigo-400 outline-none" />
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={!!filters.unmatchedOnly} onChange={e => onFilterChange('unmatchedOnly', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-red-500 focus:ring-red-400" />
                <span className="text-xs text-slate-600 dark:text-slate-300">Unmatched only</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={!!filters.exceptionsOnly} onChange={e => onFilterChange('exceptionsOnly', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-400" />
                <span className="text-xs text-slate-600 dark:text-slate-300">Exceptions only</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={!!filters.riskOnly} onChange={e => onFilterChange('riskOnly', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-rose-500 focus:ring-rose-400" />
                <span className="text-xs text-slate-600 dark:text-slate-300">Risk flags only</span>
              </label>
            </div>

            {/* AI quick prompts */}
            <div className="flex items-center gap-2 px-4 pb-2.5 pt-0.5">
              <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              <span className="text-[10px] text-cyan-400 font-medium mr-1">Quick AI:</span>
              {AI_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => { onFilterChange('search', p); setShowMore(false); }}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/8 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 hover:bg-cyan-500/15 transition-colors whitespace-nowrap"
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter chips */}
      <AnimatePresence>
        {hasActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-1.5 px-4 pb-2 overflow-hidden"
          >
            {filters.status      && <ActiveChip label={`Status: ${MATCH_STATUS[filters.status]?.label}`}  onRemove={() => onFilterChange('status', '')} />}
            {filters.branch      && <ActiveChip label={`Branch: ${filters.branch}`}                        onRemove={() => onFilterChange('branch', '')} />}
            {filters.risk        && <ActiveChip label={`Risk: ${filters.risk}`}                             onRemove={() => onFilterChange('risk', '')} />}
            {filters.type        && <ActiveChip label={`Type: ${filters.type}`}                             onRemove={() => onFilterChange('type', '')} />}
            {filters.method      && <ActiveChip label={`Method: ${filters.method}`}                         onRemove={() => onFilterChange('method', '')} />}
            {filters.bankAccount && <ActiveChip label={`Bank: ${BANK_ACCOUNTS.find(b=>b.id===filters.bankAccount)?.name}`} onRemove={() => onFilterChange('bankAccount', '')} />}
            {filters.unmatchedOnly && <ActiveChip label="Unmatched only" onRemove={() => onFilterChange('unmatchedOnly', false)} />}
            {filters.exceptionsOnly && <ActiveChip label="Exceptions only" onRemove={() => onFilterChange('exceptionsOnly', false)} />}
            {filters.riskOnly    && <ActiveChip label="Risk flags only"   onRemove={() => onFilterChange('riskOnly', false)} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
