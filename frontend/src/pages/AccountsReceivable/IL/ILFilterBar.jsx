import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ChevronDown, Sparkles, SlidersHorizontal, Calendar,
  Tag, GitBranch, Globe, Trash2, Send, Download, CheckSquare,
  RefreshCw, Printer,
} from 'lucide-react';
import { QUICK_FILTERS, INVOICE_TYPES, PAYMENT_STATUSES, BRANCHES } from './ILConstants';

const TYPE_OPTIONS = Object.entries(INVOICE_TYPES).map(([k, v]) => ({ key: k, label: v.label }));
const STATUS_OPTIONS = Object.entries(PAYMENT_STATUSES).map(([k, v]) => ({ key: k, label: v.label }));
const CURRENCY_OPTIONS = [{ key: 'all', label: 'All Currencies' }, ...['INR', 'USD', 'EUR', 'GBP', 'AED'].map(c => ({ key: c, label: c }))];

function DropFilter({ icon: Icon, label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = value && value !== 'all' ? options.find(o => o.key === value) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap
          ${selected
            ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-600'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500'
          }`}
      >
        <Icon size={12} />
        {selected ? selected.label : label}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.13 }}
              className="absolute top-full mt-1 left-0 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl min-w-44 py-1 max-h-64 overflow-y-auto"
            >
              <div
                onClick={() => { onChange('all'); setOpen(false); }}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors ${value === 'all' || !value ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                All
              </div>
              {options.map(o => (
                <div
                  key={o.key}
                  onClick={() => { onChange(o.key); setOpen(false); }}
                  className={`px-3 py-2 text-xs cursor-pointer transition-colors
                    ${value === o.key
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                  {o.label}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[11px] font-medium"
    >
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900 dark:hover:text-indigo-100 ml-0.5">
        <X size={10} />
      </button>
    </motion.span>
  );
}

function BulkActionBar({ count, onBulkAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-2 h-9 px-3 rounded-lg bg-indigo-600 text-white text-xs font-medium"
    >
      <CheckSquare size={13} />
      <span className="font-semibold">{count} selected</span>
      <div className="w-px h-4 bg-indigo-400 mx-1" />
      {[
        { label: 'Send Reminder', icon: Send },
        { label: 'Export',        icon: Download },
        { label: 'Print',         icon: Printer },
        { label: 'Delete',        icon: Trash2, danger: true },
      ].map(({ label, icon: Icon, danger }) => (
        <button
          key={label}
          onClick={() => onBulkAction?.(label)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors
            ${danger ? 'hover:bg-red-500' : 'hover:bg-indigo-500'}`}
        >
          <Icon size={11} />{label}
        </button>
      ))}
    </motion.div>
  );
}

export default function ILFilterBar({
  filters, onFilterChange, selectedRows,
  onBulkAction, totalCount, filteredCount,
}) {
  const [aiMode, setAiMode]         = useState(false);
  const [searchVal, setSearchVal]   = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeChips = [];
  if (filters.type     && filters.type     !== 'all') activeChips.push({ key: 'type',     label: `Type: ${INVOICE_TYPES[filters.type]?.label}`       });
  if (filters.status   && filters.status   !== 'all') activeChips.push({ key: 'status',   label: `Status: ${PAYMENT_STATUSES[filters.status]?.label}` });
  if (filters.branch   && filters.branch   !== 'all') activeChips.push({ key: 'branch',   label: `Branch: ${filters.branch}`                          });
  if (filters.currency && filters.currency !== 'all') activeChips.push({ key: 'currency', label: `Currency: ${filters.currency}`                      });
  if (filters.dateFrom)                               activeChips.push({ key: 'dateFrom', label: `From: ${filters.dateFrom}`                           });
  if (filters.dateTo)                                 activeChips.push({ key: 'dateTo',   label: `To: ${filters.dateTo}`                               });

  const handleSearch = (v) => { setSearchVal(v); onFilterChange('search', v); };
  const clearAll = () => {
    setSearchVal('');
    ['search','type','status','branch','currency','dateFrom','dateTo','quickFilter'].forEach(k =>
      onFilterChange(k, k === 'quickFilter' ? 'all' : '')
    );
  };

  const hasActiveFilters = activeChips.length > 0 || searchVal;

  return (
    <div className="space-y-2.5">
      {/* Row 1: search + type/status/branch + advanced toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* universal search */}
        <div className={`relative flex items-center transition-all duration-200 ${aiMode ? 'flex-1 min-w-72' : 'w-72'}`}>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {aiMode
              ? <Sparkles size={14} className="text-indigo-400 animate-pulse" />
              : <Search size={14} className="text-slate-400" />}
          </div>
          <input
            value={searchVal}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && handleSearch('')}
            placeholder={aiMode ? 'Ask AI: overdue invoices above ₹50K…' : 'Invoice no, customer, GSTIN, amount…'}
            className={`h-9 w-full pl-9 pr-20 rounded-xl text-sm outline-none transition-all border
              ${aiMode
                ? 'border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30 dark:border-indigo-600 text-slate-900 dark:text-slate-100 placeholder-indigo-400'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-400 dark:focus:border-indigo-500'
              }`}
          />
          {searchVal && (
            <button onClick={() => handleSearch('')} className="absolute right-16 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X size={13} />
            </button>
          )}
          <button
            onClick={() => setAiMode(p => !p)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors
              ${aiMode
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400'
              }`}
          >
            <Sparkles size={9} />AI
          </button>
        </div>

        {/* filter dropdowns */}
        <DropFilter icon={Tag}       label="Type"       options={TYPE_OPTIONS}     value={filters.type}     onChange={v => onFilterChange('type', v)}     />
        <DropFilter icon={RefreshCw} label="Status"     options={STATUS_OPTIONS}   value={filters.status}   onChange={v => onFilterChange('status', v)}   />
        <DropFilter icon={GitBranch} label="Branch"     options={BRANCHES.slice(1).map(b => ({ key: b, label: b }))} value={filters.branch} onChange={v => onFilterChange('branch', v)} />
        <DropFilter icon={Globe}     label="Currency"   options={CURRENCY_OPTIONS.slice(1)} value={filters.currency} onChange={v => onFilterChange('currency', v)} />

        {/* date range */}
        <button
          onClick={() => setShowAdvanced(p => !p)}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
            ${showAdvanced || filters.dateFrom || filters.dateTo
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-600'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-slate-400'
            }`}
        >
          <Calendar size={12} />
          Date Range
          <ChevronDown size={11} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {/* advanced filter */}
        <button
          onClick={() => setShowAdvanced(p => !p)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-slate-400 font-medium"
        >
          <SlidersHorizontal size={12} />
          Filters
        </button>

        {/* clear all */}
        {hasActiveFilters && (
          <button onClick={clearAll} className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors font-medium">
            <X size={12} />Clear all
          </button>
        )}

        {/* results count */}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
          {filteredCount !== totalCount
            ? <><span className="font-semibold text-slate-700 dark:text-slate-300">{filteredCount}</span> of {totalCount} invoices</>
            : <><span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span> invoices</>}
        </span>
      </div>

      {/* date picker row */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 pt-1 pb-0.5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Invoice Date:</span>
                <input type="date" value={filters.dateFrom || ''} onChange={e => onFilterChange('dateFrom', e.target.value)}
                  className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-400 outline-none" />
                <span className="text-xs text-slate-400">to</span>
                <input type="date" value={filters.dateTo || ''} onChange={e => onFilterChange('dateTo', e.target.value)}
                  className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-400 outline-none" />
              </div>
              {['This Month', 'Last Month', 'This FY', 'Last FY'].map(preset => (
                <button key={preset} className="h-7 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-medium">
                  {preset}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 2: quick filter pills + bulk bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {QUICK_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => onFilterChange('quickFilter', f.id)}
              className={`h-7 px-3 rounded-full text-xs font-medium transition-all border
                ${filters.quickFilter === f.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* bulk bar */}
        <div className="ml-auto">
          <AnimatePresence>
            {selectedRows?.length > 0 && (
              <BulkActionBar count={selectedRows.length} onBulkAction={onBulkAction} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* active filter chips */}
      <AnimatePresence>
        {activeChips.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Filters:</span>
            {activeChips.map(chip => (
              <ActiveChip key={chip.key} label={chip.label} onRemove={() => onFilterChange(chip.key, chip.key === 'quickFilter' ? 'all' : '')} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
