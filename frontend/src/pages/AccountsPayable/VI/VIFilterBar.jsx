import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, ChevronDown, X, SlidersHorizontal, Sparkles,
  CheckSquare, Download, CheckCircle2, Link2, Trash2, Zap,
} from 'lucide-react';
import {
  BRANCH_OPTIONS, DEPT_OPTIONS, CATEGORY_OPTIONS,
  PAYMENT_STATUS_STYLES, APPROVAL_STATUS_STYLES, MATCHING_STATUS_STYLES,
} from './VIConstants';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Payment' },
  { value: 'pending',   label: 'Pending'   },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'partial',   label: 'Partial'   },
  { value: 'paid',      label: 'Paid'      },
  { value: 'overdue',   label: 'Overdue'   },
  { value: 'on_hold',   label: 'On Hold'   },
];

const APPROVAL_STATUS_OPTIONS = [
  { value: 'all',          label: 'All Approval'  },
  { value: 'draft',        label: 'Draft'         },
  { value: 'pending',      label: 'Pending'       },
  { value: 'under_review', label: 'Under Review'  },
  { value: 'approved',     label: 'Approved'      },
  { value: 'rejected',     label: 'Rejected'      },
  { value: 'escalated',    label: 'Escalated'     },
];

const MATCHING_STATUS_OPTIONS = [
  { value: 'all',           label: 'All Matching'   },
  { value: 'matched',       label: 'Matched'        },
  { value: 'partial_match', label: 'Partial Match'  },
  { value: 'unmatched',     label: 'Unmatched'      },
  { value: 'exception',     label: 'Exception'      },
  { value: 'override',      label: 'Override'       },
];

const RISK_OPTIONS = [
  { value: 'all',      label: 'All Risk'   },
  { value: 'low',      label: 'Low'        },
  { value: 'medium',   label: 'Medium'     },
  { value: 'high',     label: 'High'       },
  { value: 'critical', label: 'Critical'   },
];

const AI_SUGGESTIONS = [
  'Show unmatched pharmacy invoices',
  'Find duplicate vendor invoices',
  'ICU invoices pending approval',
  'Invoices with GST mismatch',
  'Overdue invoices this month',
  'High-risk unmatched invoices',
];

function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = value && value !== 'all';
  const currentLabel = options.find(o => o.value === value)?.label || label;

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          active
            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-violet-300'
        }`}
      >
        <span className="max-w-[90px] truncate">{active ? currentLabel : label}</span>
        <ChevronDown size={12} className={`flex-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 left-0 z-50 min-w-[160px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-56 overflow-y-auto py-1">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    value === opt.value
                      ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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

export default function VIFilterBar({ filters, onFilterChange, resultCount, totalCount, selectedCount, onBulkApprove, onBulkMatch, onBulkExport, onBulkDelete }) {
  const [showAI, setShowAI] = useState(false);
  const searchRef = useRef(null);

  const activeFilters = Object.entries(filters)
    .filter(([k, v]) => k !== 'search' && v && v !== 'all')
    .map(([k, v]) => ({ key: k, value: v }));

  const filterLabel = k => ({
    branch: 'Branch', department: 'Dept', category: 'Category',
    paymentStatus: 'Payment', approvalStatus: 'Approval', matchingStatus: 'Matching', riskLevel: 'Risk',
  }[k] || k);

  return (
    <div className="sticky top-[60px] z-30 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      {/* Main filter row */}
      <div className="flex items-center gap-2 px-6 py-2.5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            value={filters.search || ''}
            onChange={e => onFilterChange('search', e.target.value)}
            onFocus={() => setShowAI(true)}
            onBlur={() => setTimeout(() => setShowAI(false), 200)}
            placeholder="Search invoices, vendors, PO…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 transition-all"
          />
          <AnimatePresence>
            {showAI && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-violet-500" />
                  <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">AI Search</span>
                </div>
                {AI_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => { onFilterChange('search', s); setShowAI(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter dropdowns */}
        <FilterDropdown label="Branch"    value={filters.branch}         options={BRANCH_OPTIONS}          onChange={v => onFilterChange('branch', v)} />
        <FilterDropdown label="Dept"      value={filters.department}     options={DEPT_OPTIONS}            onChange={v => onFilterChange('department', v)} />
        <FilterDropdown label="Category"  value={filters.category}       options={CATEGORY_OPTIONS}        onChange={v => onFilterChange('category', v)} />
        <FilterDropdown label="Payment"   value={filters.paymentStatus}  options={PAYMENT_STATUS_OPTIONS}  onChange={v => onFilterChange('paymentStatus', v)} />
        <FilterDropdown label="Approval"  value={filters.approvalStatus} options={APPROVAL_STATUS_OPTIONS} onChange={v => onFilterChange('approvalStatus', v)} />
        <FilterDropdown label="Matching"  value={filters.matchingStatus} options={MATCHING_STATUS_OPTIONS} onChange={v => onFilterChange('matchingStatus', v)} />
        <FilterDropdown label="Risk"      value={filters.riskLevel}      options={RISK_OPTIONS}            onChange={v => onFilterChange('riskLevel', v)} />

        {activeFilters.length > 0 && (
          <button
            onClick={() => onFilterChange('reset')}
            className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-1"
          >
            <X size={11} /> Clear all
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-slate-400 whitespace-nowrap">
            {resultCount} of {totalCount} invoices
          </span>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-all border border-transparent hover:border-violet-200 dark:hover:border-violet-800">
            <SlidersHorizontal size={13} /> Columns
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all shadow-sm" onClick={onBulkExport}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 px-6 pb-2.5 flex-wrap overflow-hidden"
          >
            {activeFilters.map(f => (
              <motion.span
                key={f.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[10px] font-semibold border border-violet-200 dark:border-violet-800"
              >
                <span className="text-violet-500 dark:text-violet-400">{filterLabel(f.key)}:</span> {f.value}
                <button onClick={() => onFilterChange(f.key, 'all')} className="ml-0.5 hover:text-red-500 transition-colors">
                  <X size={9} />
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 px-6 py-2 bg-violet-50 dark:bg-violet-900/20 border-t border-violet-200 dark:border-violet-800 overflow-hidden"
          >
            <CheckSquare size={14} className="text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 mr-2">
              {selectedCount} selected
            </span>
            <button onClick={onBulkApprove} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all">
              <CheckCircle2 size={11} /> Approve
            </button>
            <button onClick={onBulkMatch} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
              <Link2 size={11} /> Match PO/GRN
            </button>
            <button onClick={onBulkExport} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:border-violet-300 transition-all">
              <Download size={11} /> Export Selected
            </button>
            <button onClick={onBulkDelete} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all border border-transparent hover:border-red-200">
              <Trash2 size={11} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
