import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { commandCenterAPI } from '@services/api';
import { useAuthStore } from '@store/authStore';
import {
  LayoutGrid, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Activity, Zap,
  Maximize2, Minimize2, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

import TaskInbox from './TaskInbox';
import FinancialPulse from './FinancialPulse';
import AlertFeed from './AlertFeed';
import QuickActions from './QuickActions';
import AICommandCopilot from './AICommandCopilot';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(name) {
  if (!name) return 'there';
  return name.split(' ')[0];
}

// ─── Status Strip ─────────────────────────────────────────────────────────────
function StatusStrip({ summary, isLoading }) {
  const tasks = summary?.taskCounts || {};
  const total = tasks.total || 0;
  const urgent = (tasks.pendingApprovals || 0) + (tasks.payrollRuns || 0) + (tasks.claimsRejected || 0) + (tasks.fcraComplianceOverdue || 0);
  const fcraCapPct = tasks.fcraAdminCapPct || 0;
  const fcraCapBreach = tasks.fcraAdminCapBreach || false;

  const items = [
    {
      icon: CheckCircle,
      label: 'Pending Tasks',
      value: isLoading ? '—' : total,
      color: total > 0 ? 'text-amber-600' : 'text-green-600',
      bg: total > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200',
    },
    {
      icon: AlertTriangle,
      label: 'Urgent Items',
      value: isLoading ? '—' : urgent,
      color: urgent > 0 ? 'text-red-600' : 'text-green-600',
      bg: urgent > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200',
    },
    {
      icon: Activity,
      label: 'Draft Invoices',
      value: isLoading ? '—' : (tasks.pendingInvoices || 0),
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      icon: Clock,
      label: 'Journals to Post',
      value: isLoading ? '—' : (tasks.journalsDraft || 0),
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200',
    },
    {
      icon: Zap,
      label: 'FCRA Admin Cap',
      value: isLoading ? '—' : `${fcraCapPct}%`,
      color: fcraCapBreach ? 'text-red-600' : fcraCapPct > 15 ? 'text-amber-600' : 'text-green-600',
      bg: fcraCapBreach ? 'bg-red-50 border-red-200' : fcraCapPct > 15 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl border', item.bg)}>
            <Icon className={clsx('w-4 h-4 flex-shrink-0', item.color)} />
            <div className="min-w-0">
              <p className={clsx('text-lg font-bold font-mono leading-none', item.color)}>
                {isLoading
                  ? <span className="inline-block w-6 h-5 bg-current/20 rounded animate-pulse" />
                  : item.value}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ children, className, collapsible = false, defaultOpen = true, label }) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);

  if (!collapsible) {
    return (
      <div className={clsx('relative', expanded && 'fixed inset-4 z-40 shadow-2xl', className)}>
        {expanded && <div className="absolute inset-0 bg-white rounded-xl overflow-hidden">{children}</div>}
        {!expanded && <div className="h-full">{children}</div>}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-2 right-2 z-50 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 hover:text-slate-700 transition-colors"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {label}
      </button>
      {open && children}
    </div>
  );
}

// ─── CommandCenter ────────────────────────────────────────────────────────────
export default function CommandCenter() {
  const { user } = useAuthStore();
  const [layout, setLayout] = useState('default'); // 'default' | 'focus-tasks' | 'focus-pulse'
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: summaryData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['command-center-summary'],
    queryFn: () => commandCenterAPI.getSummary().then(r => r.data.data),
    staleTime: 1000 * 60 * 3,
    refetchInterval: 1000 * 60 * 5,
    onSuccess: () => setLastRefresh(new Date()),
  });

  // Global refresh — refetches all command center queries
  async function handleRefreshAll() {
    await refetch();
    setLastRefresh(new Date());
  }

  return (
    <div className="flex flex-col h-full gap-4 p-6 min-h-0 overflow-y-auto">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
              <LayoutGrid className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Financial Command Center</h1>
          </div>
          <p className="text-sm text-slate-500">
            {getGreeting()}, {getFirstName(user?.name || user?.full_name)}.
            {' '}Here's your financial pulse for {format(new Date(), 'EEEE, dd MMMM yyyy')}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout switcher */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {[
              { key: 'default',     label: 'Full' },
              { key: 'focus-tasks', label: 'Tasks' },
              { key: 'focus-pulse', label: 'Pulse' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setLayout(opt.key)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  layout === opt.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Last refresh indicator */}
          <span className="text-xs text-slate-400 hidden sm:block">
            Updated {format(lastRefresh, 'HH:mm')}
          </span>

          {/* Refresh all */}
          <button
            onClick={handleRefreshAll}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            Refresh All
          </button>
        </div>
      </div>

      {/* ── Status Strip ─────────────────────────────────────────────────────── */}
      <StatusStrip summary={summaryData} isLoading={isLoading} />

      {/* ── Main Layout ──────────────────────────────────────────────────────── */}
      {layout === 'default' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">

          {/* Left column — Task Inbox */}
          <div className="lg:col-span-3 flex flex-col min-h-0" style={{ minHeight: 480 }}>
            <TaskInbox />
          </div>

          {/* Center column — Financial Pulse */}
          <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
            <FinancialPulse />
          </div>

          {/* Right column — AI Copilot + Quick Actions + Alerts */}
          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            {/* AI Copilot - takes most space */}
            <div className="flex-1 min-h-0" style={{ minHeight: 380 }}>
              <AICommandCopilot />
            </div>
            {/* Quick Actions */}
            <div style={{ maxHeight: 320, minHeight: 200 }}>
              <QuickActions />
            </div>
          </div>
        </div>
      )}

      {layout === 'focus-tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Wide task inbox */}
          <div className="lg:col-span-7 flex flex-col min-h-0" style={{ minHeight: 540 }}>
            <TaskInbox />
          </div>
          {/* Alert feed + Quick Actions */}
          <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
            <div className="flex-1 min-h-0" style={{ minHeight: 280 }}>
              <AlertFeed />
            </div>
            <div style={{ minHeight: 240 }}>
              <QuickActions />
            </div>
          </div>
        </div>
      )}

      {layout === 'focus-pulse' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Full-width financial pulse */}
          <div className="lg:col-span-8 flex flex-col min-h-0" style={{ minHeight: 480 }}>
            <FinancialPulse />
          </div>
          {/* AI Copilot */}
          <div className="lg:col-span-4 flex flex-col min-h-0" style={{ minHeight: 480 }}>
            <AICommandCopilot />
          </div>
        </div>
      )}

      {/* ── Secondary row — Alert feed (shown in default + focus-pulse layouts) ─ */}
      {layout !== 'focus-tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1" style={{ minHeight: 260 }}>
            <AlertFeed />
          </div>
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
              <span className="ml-auto text-xs text-slate-400">Last 15 transactions</span>
            </div>
            <RecentActivity />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recent Activity (inline component) ──────────────────────────────────────
function RecentActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['command-center-activity'],
    queryFn: () => commandCenterAPI.getActivity().then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const rows = data || [];

  const STATUS_COLORS = {
    PAID: 'bg-green-100 text-green-700',
    FINALIZED: 'bg-blue-100 text-blue-700',
    DRAFT: 'bg-slate-100 text-slate-600',
    POSTED: 'bg-teal-100 text-teal-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    REJECTED: 'bg-red-100 text-red-700',
    APPROVED: 'bg-green-100 text-green-700',
    PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  };

  const TYPE_LABELS = {
    invoice:      'Patient Invoice',
    journal:      'Journal Entry',
    claim:        'Insurance Claim',
    fcra_receipt: 'FC Receipt',
    fcra_util:    'FC Voucher',
  };

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 bg-slate-100 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-slate-100 rounded w-2/3" />
              <div className="h-2.5 bg-slate-100 rounded w-1/3" />
            </div>
            <div className="w-16 h-5 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-slate-400 text-center py-6">No recent activity to display.</p>
    );
  }

  return (
    <div className="space-y-1.5 overflow-y-auto max-h-48">
      {rows.map((row, i) => {
        let ts = '';
        try { ts = format(new Date(row.ts), 'dd MMM HH:mm'); } catch {}
        const statusCls = STATUS_COLORS[row.status] || 'bg-slate-100 text-slate-600';

        return (
          <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700 truncate">{row.ref}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 truncate">{row.entity}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {TYPE_LABELS[row.type] || row.type} · {ts}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {row.amount > 0 && (
                <span className="text-xs font-mono font-medium text-slate-700">
                  ₹{Number(row.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              )}
              <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-semibold', statusCls)}>
                {row.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
