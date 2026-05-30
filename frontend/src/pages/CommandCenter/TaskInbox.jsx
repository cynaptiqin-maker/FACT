import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { commandCenterAPI } from '@services/api';
import {
  FileText, CheckCircle, BookOpen, Users, ShieldAlert,
  ArrowRight, Clock, AlertTriangle, Loader2, RefreshCw,
  Filter, ChevronDown, Globe, Calendar,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY = {
  high:   { cls: 'bg-red-100 text-red-700 border-red-200',    dot: 'bg-red-500',    label: 'High' },
  medium: { cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Med' },
  low:    { cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', label: 'Low' },
};

const TYPE_ICONS = {
  INVOICE_DRAFT:      FileText,
  AP_APPROVAL:        CheckCircle,
  JOURNAL_DRAFT:      BookOpen,
  PAYROLL_PENDING:    Users,
  CLAIM_REJECTED:     ShieldAlert,
  FCRA_UTILISATION:   Globe,
  FCRA_COMPLIANCE:    Calendar,
};

const TYPE_COLORS = {
  INVOICE_DRAFT:      'text-blue-600 bg-blue-50',
  AP_APPROVAL:        'text-green-600 bg-green-50',
  JOURNAL_DRAFT:      'text-purple-600 bg-purple-50',
  PAYROLL_PENDING:    'text-indigo-600 bg-indigo-50',
  CLAIM_REJECTED:     'text-red-600 bg-red-50',
  FCRA_UTILISATION:   'text-green-700 bg-green-50',
  FCRA_COMPLIANCE:    'text-emerald-600 bg-emerald-50',
};

function formatINR(n) {
  if (!n && n !== 0) return '—';
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

// ─── Single task row ──────────────────────────────────────────────────────────
function TaskRow({ task, onAction }) {
  const Icon = TYPE_ICONS[task.type] || FileText;
  const p = PRIORITY[task.priority] || PRIORITY.low;
  const iconCls = TYPE_COLORS[task.type] || 'text-slate-500 bg-slate-50';

  return (
    <div className="group flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
         onClick={() => onAction(task)}>
      {/* Type icon */}
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', iconCls)}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
          <span className={clsx('flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border', p.cls)}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', p.dot)} />
            {p.label}
          </span>
        </div>
        <p className="text-xs text-slate-500 truncate">{task.subtitle}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-slate-400">{task.module}</span>
          {task.amount > 0 && (
            <span className="text-xs font-mono font-medium text-slate-700">{formatINR(task.amount)}</span>
          )}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={(e) => { e.stopPropagation(); onAction(task); }}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        {task.action}
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── TaskInbox ────────────────────────────────────────────────────────────────
export default function TaskInbox() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['command-center-tasks'],
    queryFn: () => commandCenterAPI.getTasks({ limit: 30 }).then(r => r.data),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 3,
  });

  const tasks = data?.data || [];
  const total = data?.total || 0;

  const TYPE_FILTER_OPTIONS = [
    { value: 'all',              label: 'All Tasks' },
    { value: 'AP_APPROVAL',      label: 'Approvals' },
    { value: 'INVOICE_DRAFT',    label: 'Invoices' },
    { value: 'CLAIM_REJECTED',   label: 'Claims' },
    { value: 'JOURNAL_DRAFT',    label: 'Journals' },
    { value: 'PAYROLL_PENDING',  label: 'Payroll' },
    { value: 'FCRA_UTILISATION', label: 'FCRA' },
  ];

  const visible = filter === 'all' ? tasks : tasks.filter(t => t.type === filter);

  const highCount = tasks.filter(t => t.priority === 'high').length;

  function handleAction(task) {
    navigate(task.href);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Task Inbox</h3>
            <p className="text-[11px] text-slate-500">
              {isLoading ? 'Loading…' : `${total} items`}
              {highCount > 0 && !isLoading && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                  {highCount} urgent
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 overflow-x-auto scrollbar-none">
        {TYPE_FILTER_OPTIONS.map(opt => {
          const count = opt.value === 'all' ? tasks.length : tasks.filter(t => t.type === opt.value).length;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={clsx(
                'flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                filter === opt.value
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              {opt.label}
              {count > 0 && (
                <span className={clsx(
                  'inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold',
                  filter === opt.value ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
            <p className="text-sm font-medium text-slate-600">All clear!</p>
            <p className="text-xs text-slate-400">No pending tasks in this category.</p>
          </div>
        ) : (
          visible.map(task => (
            <TaskRow key={task.id} task={task} onAction={handleAction} />
          ))
        )}
      </div>

      {/* Footer */}
      {visible.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            Showing {visible.length} of {total} tasks · Auto-refreshes every 3 min
          </p>
        </div>
      )}
    </div>
  );
}
