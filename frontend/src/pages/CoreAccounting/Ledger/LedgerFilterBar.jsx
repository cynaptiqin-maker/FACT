import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, SlidersHorizontal, ToggleLeft, ToggleRight } from 'lucide-react';
import clsx from 'clsx';
import { QUICK_FILTERS, GROUP_OPTIONS, TYPE_CONFIG } from './ledgerConstants';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'frozen', label: 'Frozen' },
];

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white
          focus:outline-none focus:ring-2 focus:ring-brand-500/30 hover:border-slate-300 transition-colors cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={clsx(
        'flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all',
        value
          ? 'bg-brand-700 text-white border-brand-700'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      {value ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

export default function LedgerFilterBar({
  search, onSearch,
  filters, onFilter,
  toggles, onToggle,
  quickFilter, onQuickFilter,
  totalResults,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef(null);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const hasActiveFilters = filters.type || filters.status || filters.group || toggles.activeOnly || toggles.showFrozen;

  const clearAll = () => {
    onSearch('');
    onFilter({ type: '', status: '', group: '' });
    onToggle({ activeOnly: false, showFrozen: false });
    onQuickFilter(QUICK_FILTERS[0]);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      {/* Main bar */}
      <div className="flex flex-wrap items-center gap-3 p-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search ledger name, code, GSTIN… ( / )"
            className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-brand-500/30 hover:border-slate-300 transition-colors"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <Select
          value={filters.type}
          onChange={(v) => onFilter({ ...filters, type: v })}
          options={TYPE_OPTIONS.slice(1)}
          placeholder="All Types"
        />
        <Select
          value={filters.status}
          onChange={(v) => onFilter({ ...filters, status: v })}
          options={STATUS_OPTIONS.slice(1)}
          placeholder="All Status"
        />

        <div className="hidden md:block">
          <Select
            value={filters.group}
            onChange={(v) => onFilter({ ...filters, group: v })}
            options={GROUP_OPTIONS.map(g => ({ value: g, label: g }))}
            placeholder="All Groups"
          />
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
            showAdvanced
              ? 'bg-slate-100 border-slate-300 text-slate-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
            hasActiveFilters && !showAdvanced && 'border-brand-300 text-brand-700',
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
          )}
        </button>

        {/* Result count + clear */}
        {totalResults != null && (
          <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
            {totalResults.toLocaleString()} ledger{totalResults !== 1 ? 's' : ''}
          </span>
        )}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Advanced row */}
      {showAdvanced && (
        <div className="px-3 pb-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <Toggle
            label="Active only"
            value={toggles.activeOnly}
            onChange={(v) => onToggle({ ...toggles, activeOnly: v })}
          />
          <Toggle
            label="Show frozen"
            value={toggles.showFrozen}
            onChange={(v) => onToggle({ ...toggles, showFrozen: v })}
          />
          <div className="md:hidden">
            <Select
              value={filters.group}
              onChange={(v) => onFilter({ ...filters, group: v })}
              options={GROUP_OPTIONS.map(g => ({ value: g, label: g }))}
              placeholder="All Groups"
            />
          </div>
        </div>
      )}

      {/* Quick filter pills */}
      <div className="px-3 pb-3 flex flex-wrap gap-1.5 border-t border-slate-50">
        {QUICK_FILTERS.map((qf) => (
          <button
            key={qf.id}
            onClick={() => onQuickFilter(qf)}
            className={clsx(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
              quickFilter?.id === qf.id
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100',
            )}
          >
            {qf.label}
          </button>
        ))}
      </div>
    </div>
  );
}
