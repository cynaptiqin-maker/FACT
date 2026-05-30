import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { commandCenterAPI } from '@services/api';
import {
  AlertTriangle, Clock, ShieldAlert, CheckCircle,
  ArrowRight, Bell, RefreshCw, Globe, Calendar,
} from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

// ─── Severity config ──────────────────────────────────────────────────────────
const SEVERITY = {
  high: {
    bar:    'bg-red-500',
    badge:  'bg-red-100 text-red-700',
    icon:   'text-red-500 bg-red-50',
    ring:   'ring-red-200',
    label:  'Critical',
  },
  medium: {
    bar:    'bg-amber-400',
    badge:  'bg-amber-100 text-amber-700',
    icon:   'text-amber-500 bg-amber-50',
    ring:   'ring-amber-200',
    label:  'Warning',
  },
  low: {
    bar:    'bg-blue-400',
    badge:  'bg-blue-100 text-blue-700',
    icon:   'text-blue-500 bg-blue-50',
    ring:   'ring-blue-200',
    label:  'Info',
  },
  info: {
    bar:    'bg-green-400',
    badge:  'bg-green-100 text-green-700',
    icon:   'text-green-500 bg-green-50',
    ring:   'ring-green-200',
    label:  'Healthy',
  },
};

const TYPE_ICONS = {
  AR_OVERDUE:              AlertTriangle,
  AP_OVERDUE:              Clock,
  CLAIM_STALE:             ShieldAlert,
  ALL_CLEAR:               CheckCircle,
  FCRA_ADMIN_CAP:          Globe,
  FCRA_COMPLIANCE_OVERDUE: Calendar,
  FCRA_FC4_DUE:            Calendar,
};

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ alert, onNavigate }) {
  const cfg = SEVERITY[alert.severity] || SEVERITY.info;
  const Icon = TYPE_ICONS[alert.type] || Bell;

  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(alert.ts), { addSuffix: true });
  } catch {
    timeAgo = '';
  }

  return (
    <div className={clsx(
      'relative rounded-xl border p-4 transition-all hover:shadow-sm overflow-hidden',
      alert.severity === 'high' && 'border-red-200 bg-red-50/40',
      alert.severity === 'medium' && 'border-amber-200 bg-amber-50/40',
      alert.severity === 'info' && 'border-green-200 bg-green-50/40',
      alert.severity === 'low' && 'border-blue-200 bg-blue-50/40',
    )}>
      {/* Severity bar */}
      <div className={clsx('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', cfg.bar)} />

      <div className="flex items-start gap-3 pl-2">
        {/* Icon */}
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.icon)}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
            <span className={clsx('flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold', cfg.badge)}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>
          <div className="flex items-center justify-between mt-2">
            {timeAgo && <p className="text-[11px] text-slate-400">{timeAgo}</p>}
            {alert.action && alert.href && (
              <button
                onClick={() => onNavigate(alert.href)}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                {alert.action}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AlertFeed ────────────────────────────────────────────────────────────────
export default function AlertFeed() {
  const navigate = useNavigate();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['command-center-alerts'],
    queryFn: () => commandCenterAPI.getAlerts().then(r => r.data),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  const alerts = data?.data || [];
  const criticalCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className={clsx(
            'w-7 h-7 rounded-lg flex items-center justify-center',
            criticalCount > 0 ? 'bg-red-500' : 'bg-green-500'
          )}>
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Alert Feed</h3>
            <p className="text-[11px] text-slate-500">
              {isLoading ? 'Loading…' : (
                criticalCount > 0
                  ? <span className="text-red-600 font-semibold">{criticalCount} critical</span>
                  : 'All clear'
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

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-full" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : (
          alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onNavigate={(href) => navigate(href)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
        <p className="text-xs text-slate-500 text-center">
          AI-monitored · Refreshes every 5 min
        </p>
      </div>
    </div>
  );
}
