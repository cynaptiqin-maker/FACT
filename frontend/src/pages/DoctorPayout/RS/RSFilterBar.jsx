// ─── Revenue Sharing — Filter Bar ─────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { RULE_STATUSES, RISK_LEVELS, REVENUE_MODELS } from './RSConstants';

const DEPARTMENTS = ['Cardiology','Neurology','Orthopedics','ICU','Oncology','Radiology','General Surgery','Obstetrics','Pediatrics'];

const AI_SUGGESTIONS = [
  'Show unrealized cardiology revenue',
  'Find abnormal surgeon revenue allocations',
  'Show insurance-linked ICU incentives',
  'Detect unusual revenue-sharing patterns',
  'List all high-risk compensation rules',
  'Show escalated rules this month',
];

const DEFAULT_FILTERS = {
  search: '', department: '', revenueModel: '', status: '', riskLevel: '',
  realization: '', aiAnomaly: false,
};

export default function RSFilterBar({ filters, onChange, onReset }) {
  const [aiMode, setAiMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  const activeCount = Object.entries(filters).filter(([k, v]) => v !== '' && v !== false && k !== 'search').length;

  const handleSearch = (val) => {
    onChange({ search: val });
    if (val.length > 1) {
      setSuggestions(AI_SUGGESTIONS.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 4));
      setShowSug(true);
    } else setShowSug(false);
  };

  const applyAI = (s) => {
    onChange({ search: s });
    setShowSug(false);
    if (s.includes('high-risk'))    onChange({ riskLevel: 'HIGH' });
    if (s.includes('cardiology'))   onChange({ department: 'Cardiology' });
    if (s.includes('escalated'))    onChange({ status: 'ESCALATED' });
    if (s.includes('insurance'))    onChange({ revenueModel: 'Insurance-Linked' });
    if (s.includes('icu'))          onChange({ department: 'ICU' });
    if (s.includes('abnormal') || s.includes('unusual')) onChange({ aiAnomaly: true });
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && !inputRef.current?.matches(':focus')) {
        e.preventDefault(); inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-4 shadow-sm">
      <div className="flex items-center gap-2">
        {/* AI toggle */}
        <button
          onClick={() => setAiMode(!aiMode)}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
            aiMode
              ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-amber-300'
          }`}
        >
          <Sparkles size={12} /> AI
        </button>

        {/* Search */}
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            value={filters.search}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => filters.search && setShowSug(true)}
            onBlur={() => setTimeout(() => setShowSug(false), 200)}
            placeholder={aiMode ? 'Ask AI: "Show unrealized cardiology revenue"…' : 'Search by doctor, department, rule ID… (press / to focus)'}
            className="w-full pl-8 pr-8 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
          />
          {filters.search && (
            <button onClick={() => onChange({ search: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={12} />
            </button>
          )}
          {showSug && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">AI Suggestions</span>
              </div>
              {suggestions.map((s, i) => (
                <button key={i} onMouseDown={() => applyAI(s)} className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2 transition-colors">
                  <Sparkles size={10} className="text-amber-500 shrink-0" /> {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
            activeCount > 0
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300'
              : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-amber-300'
          }`}
        >
          <SlidersHorizontal size={12} />
          Filters
          {activeCount > 0 && <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center">{activeCount}</span>}
        </button>

        {activeCount > 0 && (
          <button onClick={onReset} className="px-2.5 py-2 text-xs font-medium text-red-500 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
            Clear
          </button>
        )}
      </div>

      {/* AI quick prompts */}
      {aiMode && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-[10px] text-slate-400">Quick:</span>
          {AI_SUGGESTIONS.slice(0, 4).map(s => (
            <button key={s} onClick={() => applyAI(s)} className="px-2 py-0.5 text-[10px] rounded-full border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors whitespace-nowrap">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Expanded filters */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { key: 'department',   label: 'Department',    opts: ['', ...DEPARTMENTS].map(v => ({ v, l: v || 'All Departments' })) },
            { key: 'revenueModel', label: 'Revenue Model', opts: ['', ...Object.values(REVENUE_MODELS)].map(v => ({ v, l: v || 'All Models' })) },
            { key: 'status',       label: 'Status',        opts: ['', ...Object.keys(RULE_STATUSES)].map(v => ({ v, l: v ? RULE_STATUSES[v].label : 'All Statuses' })) },
            { key: 'riskLevel',    label: 'Risk Level',    opts: ['', ...Object.keys(RISK_LEVELS)].map(v => ({ v, l: v ? RISK_LEVELS[v].label : 'All Risks' })) },
            { key: 'realization',  label: 'Realization',   opts: [{ v: '', l: 'All' }, { v: 'realized', l: 'Fully Realized' }, { v: 'partial', l: 'Partial' }, { v: 'unrealized', l: 'Unrealized' }] },
          ].map(f => (
            <select key={f.key} value={filters[f.key]} onChange={e => onChange({ [f.key]: e.target.value })}
              className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400">
              {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          ))}
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
            <input type="checkbox" checked={filters.aiAnomaly} onChange={e => onChange({ aiAnomaly: e.target.checked })} className="accent-amber-500 w-3 h-3" />
            <span className="text-amber-600 dark:text-amber-400 font-semibold">AI Anomalies</span>
          </label>
        </div>
      )}
    </div>
  );
}
