import React, { useState, useRef, useEffect } from 'react';
import {
  Search, X, ChevronDown, SlidersHorizontal, Calendar,
  Building2, ToggleLeft, ToggleRight, RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import { currentFYDates, FY_PRESETS, TYPE_CONFIG, TYPE_ORDER } from './tbConstants';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  ...TYPE_ORDER.map(t => ({ value: t, label: TYPE_CONFIG[t].label })),
];

function Select({ value, onChange, options, className }) {
  return (
    <div className={clsx('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-7 py-2 border border-slate-200 rounded-lg text-xs
          text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20
          hover:border-slate-300 transition-colors cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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

export default function TBControlPanel({
  params, onParamsChange,
  search, onSearch,
  typeFilter, onTypeFilter,
  opts, onOptsChange,
  onRefresh, isFetching,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef(null);
  const presets = FY_PRESETS();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const hasFilters = typeFilter || opts.showZero || opts.showInactive || opts.showOpening;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      {/* Row 1: dates + search + type */}
      <div className="flex flex-wrap items-center gap-3 p-3">
        {/* Date range */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="date"
            value={params.from}
            onChange={(e) => onParamsChange({ ...params, from: e.target.value })}
            className="bg-transparent text-xs text-slate-700 focus:outline-none w-28"
          />
          <span className="text-slate-300 text-xs">→</span>
          <input
            type="date"
            value={params.to}
            onChange={(e) => onParamsChange({ ...params, to: e.target.value })}
            className="bg-transparent text-xs text-slate-700 focus:outline-none w-28"
          />
        </div>

        {/* FY quick presets */}
        <div className="flex gap-1">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => onParamsChange({ ...params, from: p.from, to: p.to })}
              className={clsx(
                'px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all whitespace-nowrap',
                params.from === p.from && params.to === p.to
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Search */}
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search ledger / group… ( / )"
            className="w-full pl-8 pr-7 py-2 border border-slate-200 rounded-lg text-xs
              focus:outline-none focus:ring-2 focus:ring-brand-500/20 hover:border-slate-300 transition-colors"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <Select value={typeFilter} onChange={onTypeFilter} options={TYPE_OPTIONS} className="w-36" />

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
            showAdvanced ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
            hasFilters && !showAdvanced && 'border-brand-300 text-brand-700',
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Options
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Row 2: advanced options */}
      {showAdvanced && (
        <div className="px-3 pb-3 pt-2.5 flex flex-wrap items-center gap-2.5 border-t border-slate-100">
          <Toggle
            label="Show zero balances"
            value={opts.showZero}
            onChange={(v) => onOptsChange({ ...opts, showZero: v })}
          />
          <Toggle
            label="Include inactive"
            value={opts.showInactive}
            onChange={(v) => onOptsChange({ ...opts, showInactive: v })}
          />
          <Toggle
            label="Show opening balance"
            value={opts.showOpening}
            onChange={(v) => onOptsChange({ ...opts, showOpening: v })}
          />
          <Toggle
            label="Show transactions"
            value={opts.showPeriod}
            onChange={(v) => onOptsChange({ ...opts, showPeriod: v })}
          />
          {hasFilters && (
            <button
              onClick={() => {
                onOptsChange({ showZero: false, showInactive: false, showOpening: false, showPeriod: false });
                onTypeFilter('');
                onSearch('');
              }}
              className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Reset all
            </button>
          )}
        </div>
      )}

      {/* Row 3: type pills */}
      <div className="px-3 pb-3 flex gap-1.5 flex-wrap border-t border-slate-50">
        <button
          onClick={() => onTypeFilter('')}
          className={clsx(
            'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
            !typeFilter ? 'bg-brand-700 text-white border-brand-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300',
          )}
        >
          All
        </button>
        {TYPE_ORDER.map((t) => {
          const cfg = TYPE_CONFIG[t];
          return (
            <button
              key={t}
              onClick={() => onTypeFilter(typeFilter === t ? '' : t)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                typeFilter === t
                  ? `${cfg.bg} ${cfg.text} ${cfg.border} font-semibold`
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300',
              )}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
