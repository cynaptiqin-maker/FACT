// ─── Asset Register — Advanced Filter & Search Bar ────────────────────────────
// AI-powered natural language search · Sticky filter toolbar · Sky theme
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Sparkles, ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';

const AI_SUGGESTIONS = [
  'Show ICU assets nearing replacement',
  'Find idle radiology equipment',
  'Show assets with expired AMC',
  'Detect underutilized biomedical devices',
  'Show high-risk assets across all branches',
  'Find assets with expiring insurance',
  'Show PET-CT and MRI with age > 5 years',
  'Identify all assets under maintenance today',
];

const CATEGORY_OPTIONS = [
  { value: 'all',               label: 'All Categories' },
  { value: 'RADIOLOGY',         label: 'Radiology Equipment' },
  { value: 'CRITICAL_CARE',     label: 'Critical Care / ICU' },
  { value: 'OT_EQUIPMENT',      label: 'OT Equipment' },
  { value: 'LABORATORY',        label: 'Laboratory Equipment' },
  { value: 'IT_INFRASTRUCTURE', label: 'IT Infrastructure' },
  { value: 'BIOMEDICAL',        label: 'Biomedical Devices' },
  { value: 'FURNITURE_FIXTURE', label: 'Furniture & Fixtures' },
  { value: 'BUILDING',          label: 'Building & Civil' },
  { value: 'VEHICLES',          label: 'Vehicles & Transport' },
  { value: 'HVAC_UTILITIES',    label: 'HVAC & Utilities' },
];

const DEPT_OPTIONS = [
  { value: 'all', label: 'All Departments' },
  { value: 'Radiology', label: 'Radiology' },
  { value: 'Critical Care / ICU', label: 'Critical Care / ICU' },
  { value: 'OT / Surgery', label: 'OT / Surgery' },
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Pathology Laboratory', label: 'Laboratory' },
  { value: 'Nephrology / Dialysis', label: 'Nephrology' },
  { value: 'Nuclear Medicine', label: 'Nuclear Medicine' },
  { value: 'Emergency Services', label: 'Emergency' },
  { value: 'IT / Radiology', label: 'IT Infrastructure' },
  { value: 'Facilities / OT Block', label: 'Facilities' },
];

const BRANCH_OPTIONS = [
  { value: 'all', label: 'All Branches' },
  { value: 'Main Campus', label: 'Main Campus' },
  { value: 'North Branch', label: 'North Branch' },
  { value: 'South Branch', label: 'South Branch' },
  { value: 'East Branch', label: 'East Branch' },
  { value: 'West Branch', label: 'West Branch' },
];

const STATUS_OPTIONS = [
  { value: 'all',               label: 'All Status' },
  { value: 'ACTIVE',            label: 'Active' },
  { value: 'ACQUIRED',          label: 'Acquired' },
  { value: 'CAPITALIZED',       label: 'Capitalized' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'IMPAIRED',          label: 'Impaired' },
  { value: 'PENDING_DISPOSAL',  label: 'Pending Disposal' },
  { value: 'DISPOSED',          label: 'Disposed' },
];

const AMC_OPTIONS = [
  { value: 'all',          label: 'All AMC' },
  { value: 'ACTIVE',       label: 'AMC Active' },
  { value: 'EXPIRING_SOON',label: 'Expiring Soon' },
  { value: 'EXPIRED',      label: 'AMC Expired' },
  { value: 'NONE',         label: 'No AMC' },
];

const INSURANCE_OPTIONS = [
  { value: 'all',          label: 'All Insurance' },
  { value: 'ACTIVE',       label: 'Insured' },
  { value: 'EXPIRING',     label: 'Expiring' },
  { value: 'EXPIRED',      label: 'Expired' },
  { value: 'NONE',         label: 'Uninsured' },
];

const RISK_OPTIONS = [
  { value: 'all',      label: 'All Risk Levels' },
  { value: 'LOW',      label: 'Low Risk' },
  { value: 'MEDIUM',   label: 'Medium Risk' },
  { value: 'HIGH',     label: 'High Risk' },
  { value: 'CRITICAL', label: 'Critical Risk' },
];

const DEPR_METHOD_OPTIONS = [
  { value: 'all', label: 'All Methods' },
  { value: 'SLM', label: 'SLM' },
  { value: 'WDV', label: 'WDV' },
];

function FilterSelect({ value, onChange, options, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-2.5 pr-6 py-1.5 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:focus:ring-sky-500 cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

function ActiveFilterBadge({ label, onRemove }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-full text-[10px] font-medium"
    >
      {label}
      <button onClick={onRemove} className="hover:text-sky-900 dark:hover:text-sky-200 transition-colors">
        <X size={9} />
      </button>
    </motion.span>
  );
}

export default function ARFilterBar({ filters, onFilterChange, resultCount, totalCount }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const searchRef = useRef(null);

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'search' && v !== 'all'
  ).length;

  const hasSearch = !!filters.search;

  const getActiveFilterLabels = () => {
    const labels = [];
    if (filters.category    !== 'all') labels.push({ key: 'category',   label: CATEGORY_OPTIONS.find(o => o.value === filters.category)?.label });
    if (filters.department  !== 'all') labels.push({ key: 'department', label: DEPT_OPTIONS.find(o => o.value === filters.department)?.label });
    if (filters.branch      !== 'all') labels.push({ key: 'branch',     label: BRANCH_OPTIONS.find(o => o.value === filters.branch)?.label });
    if (filters.status      !== 'all') labels.push({ key: 'status',     label: STATUS_OPTIONS.find(o => o.value === filters.status)?.label });
    if (filters.amcStatus   !== 'all') labels.push({ key: 'amcStatus',  label: AMC_OPTIONS.find(o => o.value === filters.amcStatus)?.label });
    if (filters.insurance   !== 'all') labels.push({ key: 'insurance',  label: INSURANCE_OPTIONS.find(o => o.value === filters.insurance)?.label });
    if (filters.risk        !== 'all') labels.push({ key: 'risk',       label: RISK_OPTIONS.find(o => o.value === filters.risk)?.label });
    if (filters.deprMethod  !== 'all') labels.push({ key: 'deprMethod', label: DEPR_METHOD_OPTIONS.find(o => o.value === filters.deprMethod)?.label });
    return labels;
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm">
      {/* Primary Row */}
      <div className="flex items-center gap-2.5 p-3">
        {/* AI Search */}
        <div ref={searchRef} className="relative flex-1 min-w-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets or ask AI: 'Show ICU assets nearing replacement'"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-9 pr-24 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400 dark:focus:ring-sky-500 focus:border-sky-400 dark:focus:border-sky-500 transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {hasSearch && (
                <button onClick={() => onFilterChange('search', '')} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={12} />
                </button>
              )}
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 rounded text-[9px] font-bold text-violet-600 dark:text-violet-400">
                <Sparkles size={8} />
                AI
              </div>
            </div>
          </div>

          {/* AI Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && !filters.search && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-violet-500" />
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">AI Suggested Searches</span>
                </div>
                {AI_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { onFilterChange('search', s); setShowSuggestions(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                  >
                    <span className="text-violet-500 mr-1.5">→</span>{s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Filters */}
        <FilterSelect value={filters.category}   onChange={(v) => onFilterChange('category', v)}   options={CATEGORY_OPTIONS}    className="w-36" />
        <FilterSelect value={filters.department} onChange={(v) => onFilterChange('department', v)} options={DEPT_OPTIONS}         className="w-32" />
        <FilterSelect value={filters.branch}     onChange={(v) => onFilterChange('branch', v)}     options={BRANCH_OPTIONS}      className="w-28" />
        <FilterSelect value={filters.status}     onChange={(v) => onFilterChange('status', v)}     options={STATUS_OPTIONS}      className="w-32" />
        <FilterSelect value={filters.risk}       onChange={(v) => onFilterChange('risk', v)}       options={RISK_OPTIONS}        className="w-28" />

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
            showAdvanced || activeFilterCount > 0
              ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-400'
              : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <SlidersHorizontal size={12} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-sky-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Reset */}
        {(activeFilterCount > 0 || hasSearch) && (
          <button
            onClick={() => onFilterChange('reset')}
            className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Advanced Filter Row */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2.5 px-3 pb-3 border-t border-slate-100 dark:border-slate-700 pt-2.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                <Filter size={10} />
                <span>More Filters:</span>
              </div>
              <FilterSelect value={filters.amcStatus}  onChange={(v) => onFilterChange('amcStatus', v)}  options={AMC_OPTIONS}         className="w-32" />
              <FilterSelect value={filters.insurance}  onChange={(v) => onFilterChange('insurance', v)}  options={INSURANCE_OPTIONS}   className="w-32" />
              <FilterSelect value={filters.deprMethod} onChange={(v) => onFilterChange('deprMethod', v)} options={DEPR_METHOD_OPTIONS}  className="w-28" />

              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.aiRisk === true}
                  onChange={(e) => onFilterChange('aiRisk', e.target.checked ? true : 'all')}
                  className="rounded border-slate-300 dark:border-slate-600 text-sky-500 focus:ring-sky-400"
                />
                AI High-Risk Only
              </label>

              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.maintenanceDue === true}
                  onChange={(e) => onFilterChange('maintenanceDue', e.target.checked ? true : 'all')}
                  className="rounded border-slate-300 dark:border-slate-600 text-sky-500 focus:ring-sky-400"
                />
                Maintenance Due
              </label>

              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.idleOnly === true}
                  onChange={(e) => onFilterChange('idleOnly', e.target.checked ? true : 'all')}
                  className="rounded border-slate-300 dark:border-slate-600 text-sky-500 focus:ring-sky-400"
                />
                Idle Assets Only
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Badges */}
      <AnimatePresence>
        {getActiveFilterLabels().length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-1.5 px-3 pb-2.5 border-t border-slate-50 dark:border-slate-700/50 pt-2 overflow-hidden"
          >
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium self-center">Active:</span>
            {getActiveFilterLabels().map(({ key, label }) => (
              <ActiveFilterBadge key={key} label={label} onRemove={() => onFilterChange(key, 'all')} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Count */}
      <div className="px-3 pb-2 flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          Showing <span className="font-semibold text-sky-600 dark:text-sky-400">{resultCount}</span> of <span className="font-medium">{totalCount}</span> assets
        </span>
        {resultCount !== totalCount && (
          <span className="text-[10px] text-violet-500 dark:text-violet-400 flex items-center gap-0.5">
            <Filter size={9} /> Filtered
          </span>
        )}
      </div>
    </div>
  );
}
