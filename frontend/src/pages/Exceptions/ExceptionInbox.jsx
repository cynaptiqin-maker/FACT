// Exception Inbox — enterprise-grade exception management for FACT hospital finance
// Route: /exceptions
// Color theme: Red/orange/amber for severity, slate base
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, AlertOctagon, AlertCircle, Info,
  CheckCircle2, XCircle, Clock, Eye, ChevronDown, ChevronUp,
  RefreshCw, Search, Filter, X, Inbox,
  ShieldAlert, GitMerge, Ban, FileWarning, CreditCard,
  Scale, Timer, ClipboardCheck, Activity, Zap,
  BarChart3, TrendingUp, MessageSquare, CheckCheck,
  User, Calendar, Hash, Database, Layers, Copy,
  BellRing, WifiOff, Wifi,
} from 'lucide-react';
import api from '@/services/api';

// ─── Constants & Config ───────────────────────────────────────────────────────

const EXCEPTION_TYPES = {
  POSTING_FAILED:   { label: 'Posting Failed',     color: 'red',    icon: XCircle,       bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: '#ef4444' },
  BANK_UNMATCHED:   { label: 'Bank Unmatched',      color: 'orange', icon: GitMerge,      bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: '#f97316' },
  FCRA_ADMIN_CAP:   { label: 'FCRA Admin Cap',      color: 'purple', icon: Scale,         bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: '#8b5cf6' },
  MISSING_APPROVAL: { label: 'Missing Approval',    color: 'yellow', icon: ClipboardCheck,bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: '#eab308' },
  DUPLICATE_INVOICE:{ label: 'Duplicate Invoice',   color: 'red',    icon: Copy,          bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: '#ef4444' },
  BUDGET_BREACH:    { label: 'Budget Breach',       color: 'orange', icon: AlertOctagon,  bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: '#f97316' },
  STALE_CLAIM:      { label: 'Stale Claim',         color: 'blue',   icon: Timer,         bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: '#3b82f6' },
  AUDIT_EXCEPTION:  { label: 'Audit Exception',     color: 'red',    icon: ShieldAlert,   bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: '#ef4444' },
  RECON_MISMATCH:   { label: 'Recon Mismatch',      color: 'orange', icon: Activity,      bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: '#f97316' },
  PERIOD_OVERDUE:   { label: 'Period Overdue',      color: 'red',    icon: Calendar,      bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: '#ef4444' },
};

const SEVERITIES = {
  CRITICAL: { label: 'Critical', dot: 'bg-red-500',    text: 'text-red-600',    badge: 'bg-red-100 text-red-700 border-red-200',    ring: 'ring-red-300',    order: 0 },
  HIGH:     { label: 'High',     dot: 'bg-orange-400', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700 border-orange-200', ring: 'ring-orange-200', order: 1 },
  MEDIUM:   { label: 'Medium',   dot: 'bg-yellow-400', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', ring: 'ring-yellow-200', order: 2 },
  LOW:      { label: 'Low',      dot: 'bg-slate-400',  text: 'text-slate-500',  badge: 'bg-slate-100 text-slate-600 border-slate-200',  ring: 'ring-slate-200',  order: 3 },
};

const STATUSES = {
  OPEN:         { label: 'Open',         bg: 'bg-red-100',    text: 'text-red-700',    icon: AlertCircle  },
  ACKNOWLEDGED: { label: 'Acknowledged', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Eye          },
  RESOLVED:     { label: 'Resolved',     bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle2 },
  DISMISSED:    { label: 'Dismissed',    bg: 'bg-slate-100',  text: 'text-slate-500',  icon: Ban          },
};

const ENTITY_LABELS = {
  patient_invoice: 'Patient Invoice',
  vendor_invoice:  'Vendor Invoice',
  claim:           'Insurance Claim',
  payroll_run:     'Payroll Run',
  asset:           'Fixed Asset',
  journal_entry:   'Journal Entry',
};

// ─── Data normaliser (DB snake_case → component camelCase) ───────────────────

function normalizeException(row) {
  if (!row) return row;
  return {
    id:              row.id,
    exceptionType:   row.exceptionType   ?? row.exception_type,
    severity:        row.severity,
    status:          row.status,
    title:           row.title,
    description:     row.description,
    entityType:      row.entityType      ?? row.entity_type,
    entityId:        row.entityId        ?? row.entity_id,
    sourceModule:    row.sourceModule    ?? row.source_module,
    raisedBy:        row.raisedBy        ?? row.raised_by,
    metadata:        row.metadata        ?? {},
    acknowledgedBy:  row.acknowledgedBy  ?? row.acknowledged_by,
    acknowledgedAt:  row.acknowledgedAt  ?? row.acknowledged_at,
    resolvedBy:      row.resolvedBy      ?? row.resolved_by,
    resolvedAt:      row.resolvedAt      ?? row.resolved_at,
    resolution:      row.resolution      ?? row.resolution_note,
    dismissedBy:     row.dismissedBy     ?? row.dismissed_by,
    dismissedAt:     row.dismissedAt     ?? row.dismissed_at,
    dismissReason:   row.dismissReason   ?? row.dismiss_reason,
    createdAt:       row.createdAt       ?? row.created_at,
    updatedAt:       row.updatedAt       ?? row.updated_at,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function clsx(...args) {
  return args.filter(Boolean).join(' ');
}

// ─── API Functions ────────────────────────────────────────────────────────────

const exceptionsAPI = {
  getExceptions: (params) => api.get('/api/exceptions', { params }),
  getStats:      ()       => api.get('/api/exceptions/stats'),
  acknowledge:   (id)     => api.post(`/api/exceptions/${id}/acknowledge`),
  resolve:       (id, data) => api.post(`/api/exceptions/${id}/resolve`, data),
  dismiss:       (id, data) => api.post(`/api/exceptions/${id}/dismiss`, data),
};

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KPICard({ label, value, icon: Icon, colorClass, badgeClass, pulse, isLoading }) {
  return (
    <div className={clsx('flex items-center gap-4 px-5 py-4 rounded-2xl border bg-white shadow-sm', badgeClass || 'border-slate-200')}>
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', colorClass.bg)}>
        <Icon className={clsx('w-5 h-5', colorClass.icon)} />
      </div>
      <div className="min-w-0 flex-1">
        {isLoading ? (
          <div className="h-7 w-16 bg-slate-100 rounded animate-pulse mb-1" />
        ) : (
          <div className="flex items-center gap-2">
            <span className={clsx('text-2xl font-bold font-mono leading-none', colorClass.value)}>{value}</span>
            {pulse && value > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'OPEN',        label: 'Open' },
  { key: 'ACKNOWLEDGED',label: 'Acknowledged' },
  { key: 'RESOLVED',    label: 'Resolved' },
  { key: 'DISMISSED',   label: 'Dismissed' },
];

const SEVERITY_FILTERS = [
  { key: 'all',      label: 'All Severities' },
  { key: 'CRITICAL', label: 'Critical' },
  { key: 'HIGH',     label: 'High' },
  { key: 'MEDIUM',   label: 'Medium' },
  { key: 'LOW',      label: 'Low' },
];

const TYPE_FILTER_OPTIONS = [
  { key: 'all', label: 'All Types' },
  ...Object.entries(EXCEPTION_TYPES).map(([k, v]) => ({ key: k, label: v.label })),
];

function FilterBar({ filters, onChange, activeCount }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search exceptions, entities, descriptions…"
          value={filters.search}
          onChange={e => onChange('search', e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 text-slate-700 placeholder:text-slate-400"
        />
        {filters.search && (
          <button onClick={() => onChange('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status pill tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
        {STATUS_FILTERS.map(s => (
          <button
            key={s.key}
            onClick={() => onChange('status', s.key)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              filters.status === s.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Type select */}
      <select
        value={filters.type}
        onChange={e => onChange('type', e.target.value)}
        className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 cursor-pointer"
      >
        {TYPE_FILTER_OPTIONS.map(o => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>

      {/* Severity select */}
      <select
        value={filters.severity}
        onChange={e => onChange('severity', e.target.value)}
        className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 cursor-pointer"
      >
        {SEVERITY_FILTERS.map(o => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>

      {/* Clear filters */}
      {activeCount > 0 && (
        <button
          onClick={() => onChange('reset')}
          className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear ({activeCount})
        </button>
      )}

      <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
        <Filter className="w-3.5 h-3.5" />
        <span>Filters</span>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ExceptionCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-slate-100 rounded w-48" />
            <div className="h-5 w-16 bg-slate-100 rounded-full ml-auto" />
          </div>
          <div className="h-3 bg-slate-100 rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-4 w-20 bg-slate-100 rounded-full" />
            <div className="h-4 w-24 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Metadata JSON Viewer ─────────────────────────────────────────────────────

function MetadataViewer({ data }) {
  if (!data || Object.keys(data).length === 0) return <p className="text-xs text-slate-400">No metadata available.</p>;

  return (
    <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
      <div className="space-y-1">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 text-xs font-mono">
            <span className="text-sky-400 flex-shrink-0">{key}:</span>
            <span className={clsx(
              'break-all',
              typeof value === 'number' ? 'text-amber-300' :
              typeof value === 'boolean' ? 'text-purple-300' :
              Array.isArray(value) ? 'text-green-300' :
              'text-slate-300'
            )}>
              {Array.isArray(value)
                ? `[${value.join(', ')}]`
                : typeof value === 'object' && value !== null
                  ? JSON.stringify(value)
                  : String(value)
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Resolution Form ──────────────────────────────────────────────────────────

function ResolveForm({ exception, onResolve, onCancel, isLoading }) {
  const [note, setNote] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 pt-3 border-t border-slate-100"
    >
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span className="text-sm font-semibold text-slate-700">Resolve Exception</span>
      </div>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Describe how this exception was resolved (required)…"
        rows={3}
        className="w-full text-sm border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-300 text-slate-700 placeholder:text-slate-400 bg-slate-50"
      />
      <div className="flex gap-2 mt-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => note.trim() && onResolve(exception.id, { resolution: note })}
          disabled={!note.trim() || isLoading}
          className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
          <CheckCircle2 className="w-3.5 h-3.5" />
          Mark Resolved
        </button>
      </div>
    </motion.div>
  );
}

// ─── Dismiss Form ─────────────────────────────────────────────────────────────

function DismissForm({ exception, onDismiss, onCancel, isLoading }) {
  const [reason, setReason] = useState('');
  const DISMISS_REASONS = [
    'Amount below threshold — no action required',
    'False positive — rule too broad',
    'Already handled outside the system',
    'Superseded by a newer exception',
    'Business policy exception approved',
    'Other',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 pt-3 border-t border-slate-100"
    >
      <div className="flex items-center gap-2 mb-2">
        <Ban className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-700">Dismiss Exception</span>
        <span className="text-xs text-slate-400">— Select or enter reason</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {DISMISS_REASONS.map(r => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={clsx(
              'px-3 py-1.5 text-xs rounded-xl border transition-colors',
              reason === r
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Or enter a custom reason…"
        rows={2}
        className="w-full text-sm border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-700 placeholder:text-slate-400 bg-slate-50"
      />
      <div className="flex gap-2 mt-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => reason.trim() && onDismiss(exception.id, { reason })}
          disabled={!reason.trim() || isLoading}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-600 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
          <Ban className="w-3.5 h-3.5" />
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

// ─── Exception Card ───────────────────────────────────────────────────────────

function ExceptionCard({ exception, onAcknowledge, onResolve, onDismiss, mutatingId }) {
  const [expanded, setExpanded] = useState(false);
  const [actionMode, setActionMode] = useState(null); // 'resolve' | 'dismiss' | null

  const exType = EXCEPTION_TYPES[exception.exceptionType] || EXCEPTION_TYPES.POSTING_FAILED;
  const severity = SEVERITIES[exception.severity] || SEVERITIES.LOW;
  const status = STATUSES[exception.status] || STATUSES.OPEN;
  const StatusIcon = status.icon;
  const TypeIcon = exType.icon;

  const isActing = mutatingId === exception.id;
  const isClosed = exception.status === 'RESOLVED' || exception.status === 'DISMISSED';

  function handleActionCancel() { setActionMode(null); }

  function handleResolve(id, data) {
    onResolve(id, data);
    setActionMode(null);
  }

  function handleDismiss(id, data) {
    onDismiss(id, data);
    setActionMode(null);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -4 }}
      transition={{ duration: 0.18 }}
      className={clsx(
        'bg-white border rounded-2xl overflow-hidden transition-shadow',
        exception.severity === 'CRITICAL' && exception.status === 'OPEN'
          ? 'border-red-200 shadow-sm shadow-red-50'
          : 'border-slate-200 shadow-sm',
        expanded ? 'shadow-md' : 'hover:shadow-md',
      )}
    >
      {/* Severity left accent bar */}
      <div className="flex">
        <div className={clsx(
          'w-1 flex-shrink-0 rounded-l-2xl',
          exception.severity === 'CRITICAL' ? 'bg-red-500' :
          exception.severity === 'HIGH'     ? 'bg-orange-400' :
          exception.severity === 'MEDIUM'   ? 'bg-yellow-400' :
          'bg-slate-300'
        )} />

        <div className="flex-1 p-4">
          {/* Main row */}
          <div className="flex items-start gap-3">
            {/* Type icon */}
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border', exType.bg, exType.border)}>
              <TypeIcon className={clsx('w-4.5 h-4.5', exType.text)} />
            </div>

            {/* Center content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Severity badge */}
                  <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border', severity.badge)}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', severity.dot,
                      exception.severity === 'CRITICAL' && exception.status === 'OPEN' ? 'animate-pulse' : ''
                    )} />
                    {severity.label}
                  </span>
                  {/* Type chip */}
                  <span className={clsx('px-2.5 py-1 rounded-full text-[11px] font-medium border', exType.bg, exType.border, exType.text)}>
                    {exType.label}
                  </span>
                  {/* Status badge */}
                  <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', status.bg, status.text)}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>
                {/* Time + expand toggle */}
                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                  <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(exception.createdAt)}</span>
                  <button
                    onClick={() => { setExpanded(v => !v); setActionMode(null); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-1">{exception.title}</h3>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{exception.description}</p>

              {/* Entity row */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Layers className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-slate-600">{ENTITY_LABELS[exception.entityType] || exception.entityType}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono">{exception.entityId}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <User className="w-3 h-3" />
                  <span>{exception.raisedBy === 'SYSTEM' ? 'System' : exception.raisedBy}</span>
                </div>
              </div>

              {/* Acknowledged / Resolved / Dismissed note */}
              {exception.status === 'ACKNOWLEDGED' && exception.acknowledgedBy && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-yellow-700 bg-yellow-50 rounded-lg px-2.5 py-1.5 w-fit">
                  <Eye className="w-3 h-3" />
                  <span>Acknowledged by <strong>{exception.acknowledgedBy}</strong> · {timeAgo(exception.acknowledgedAt)}</span>
                </div>
              )}
              {exception.status === 'RESOLVED' && exception.resolvedBy && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 rounded-lg px-2.5 py-1.5">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span>Resolved by <strong>{exception.resolvedBy}</strong> · {timeAgo(exception.resolvedAt)}: "{exception.resolution}"</span>
                </div>
              )}
              {exception.status === 'DISMISSED' && exception.dismissedBy && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-100 rounded-lg px-2.5 py-1.5">
                  <Ban className="w-3 h-3 flex-shrink-0" />
                  <span>Dismissed by <strong>{exception.dismissedBy}</strong> · {timeAgo(exception.dismissedAt)}: "{exception.dismissReason}"</span>
                </div>
              )}
            </div>

            {/* Action buttons column */}
            {!isClosed && (
              <div className="flex flex-col gap-1.5 flex-shrink-0 ml-2">
                {exception.status === 'OPEN' && (
                  <button
                    onClick={() => onAcknowledge(exception.id)}
                    disabled={isActing}
                    title="Acknowledge"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {isActing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => setActionMode(actionMode === 'resolve' ? null : 'resolve')}
                  disabled={isActing}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors disabled:opacity-50 whitespace-nowrap',
                    actionMode === 'resolve'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                  )}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Resolve
                </button>
                <button
                  onClick={() => setActionMode(actionMode === 'dismiss' ? null : 'dismiss')}
                  disabled={isActing}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors disabled:opacity-50 whitespace-nowrap',
                    actionMode === 'dismiss'
                      ? 'bg-slate-600 text-white border-slate-600'
                      : 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  <Ban className="w-3 h-3" />
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Expanded section */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-slate-100"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Metadata */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Metadata</span>
                    </div>
                    <MetadataViewer data={exception.metadata} />
                  </div>

                  {/* Timeline */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Timeline</span>
                    </div>
                    <div className="space-y-2">
                      <TimelineItem
                        icon={AlertCircle}
                        iconClass="text-red-500"
                        label="Exception Raised"
                        time={fmtDateTime(exception.createdAt)}
                        by="System"
                      />
                      {exception.acknowledgedAt && (
                        <TimelineItem
                          icon={Eye}
                          iconClass="text-yellow-500"
                          label="Acknowledged"
                          time={fmtDateTime(exception.acknowledgedAt)}
                          by={exception.acknowledgedBy}
                        />
                      )}
                      {exception.resolvedAt && (
                        <TimelineItem
                          icon={CheckCircle2}
                          iconClass="text-green-500"
                          label="Resolved"
                          time={fmtDateTime(exception.resolvedAt)}
                          by={exception.resolvedBy}
                        />
                      )}
                      {exception.dismissedAt && (
                        <TimelineItem
                          icon={Ban}
                          iconClass="text-slate-500"
                          label="Dismissed"
                          time={fmtDateTime(exception.dismissedAt)}
                          by={exception.dismissedBy}
                        />
                      )}
                      {!exception.resolvedAt && !exception.dismissedAt && (
                        <TimelineItem
                          icon={BellRing}
                          iconClass="text-slate-400 animate-pulse"
                          label="Awaiting Action"
                          time="Now"
                          by=""
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Action forms */}
                <AnimatePresence>
                  {actionMode === 'resolve' && !isClosed && (
                    <ResolveForm
                      key="resolve-form"
                      exception={exception}
                      onResolve={handleResolve}
                      onCancel={handleActionCancel}
                      isLoading={isActing}
                    />
                  )}
                  {actionMode === 'dismiss' && !isClosed && (
                    <DismissForm
                      key="dismiss-form"
                      exception={exception}
                      onDismiss={handleDismiss}
                      onCancel={handleActionCancel}
                      isLoading={isActing}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed action forms (available even when not expanded) */}
          {!expanded && (
            <AnimatePresence>
              {actionMode === 'resolve' && !isClosed && (
                <ResolveForm
                  key="resolve-form-c"
                  exception={exception}
                  onResolve={handleResolve}
                  onCancel={handleActionCancel}
                  isLoading={isActing}
                />
              )}
              {actionMode === 'dismiss' && !isClosed && (
                <DismissForm
                  key="dismiss-form-c"
                  exception={exception}
                  onDismiss={handleDismiss}
                  onCancel={handleActionCancel}
                  isLoading={isActing}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TimelineItem({ icon: Icon, iconClass, label, time, by }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className={clsx('w-3 h-3', iconClass)} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-700">{label}</p>
        <p className="text-[11px] text-slate-400">{time}{by ? ` · ${by}` : ''}</p>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-base font-semibold text-slate-600 mb-1">
        {hasFilters ? 'No exceptions match your filters' : 'Exception inbox is clear'}
      </h3>
      <p className="text-sm text-slate-400 max-w-xs">
        {hasFilters
          ? 'Try adjusting your filters or search terms to find exceptions.'
          : 'All financial exceptions have been resolved. Great work!'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 px-4 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </motion.div>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────

function SummaryBar({ total, filtered, page, pageSize, onPrev, onNext }) {
  const start = Math.min((page - 1) * pageSize + 1, filtered);
  const end   = Math.min(page * pageSize, filtered);
  const totalPages = Math.ceil(filtered / pageSize);

  return (
    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
      <span>
        {filtered === total
          ? `Showing ${start}–${end} of ${total} exceptions`
          : `${filtered} of ${total} exceptions (filtered) · showing ${start}–${end}`}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <span className="px-2 font-medium text-slate-600">{page} / {totalPages || 1}</span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── AI Insights Sidebar ──────────────────────────────────────────────────────

const AI_INSIGHTS = [
  {
    id: 'ai-1', severity: 'critical',
    title: '3 Critical exceptions need immediate attention',
    detail: 'POSTING_FAILED and AUDIT_EXCEPTION items can cause compliance failures if not resolved before period close.',
    metric: '₹6.3L at risk',
  },
  {
    id: 'ai-2', severity: 'warning',
    title: 'FCRA admin cap breached — reclass costs',
    detail: 'Admin expenditure is 1.4% over statutory limit. Reclassify ₹1.18L of shared-service costs to programme activities.',
    metric: '1.4% over limit',
  },
  {
    id: 'ai-3', severity: 'warning',
    title: 'Bank reconciliation open — day-end risk',
    detail: 'HDFC current account ₹38,420 mismatch should be closed today before day-end reports are generated.',
    metric: '₹38.4K mismatch',
  },
  {
    id: 'ai-4', severity: 'info',
    title: 'Duplicate invoice risk — review before payment',
    detail: '96% similarity score detected between 2 PharmaCorp invoices. Hold payment until verified.',
    metric: '₹1.25L duplicate risk',
  },
];

function AIInsightsPanel({ exceptions }) {
  const [aiMsg, setAiMsg] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Exception AI ready. I can help you triage, prioritise, and resolve financial exceptions faster. Ask me anything about the current exception queue.',
    },
  ]);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend() {
    if (!aiMsg.trim()) return;
    const q = aiMsg.trim();
    setAiMsg('');
    setMessages(prev => [
      ...prev,
      { role: 'user', text: q },
      { role: 'ai', text: 'AI analysis is being processed. In production, this connects to the FACT AI Engine endpoint for real-time exception intelligence.' },
    ]);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Exception AI</p>
          <p className="text-[10px] text-slate-400 leading-none">Triage & resolution assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Insights */}
      <div className="px-3 py-2 space-y-2 border-b border-slate-100 flex-shrink-0">
        {AI_INSIGHTS.map(insight => (
          <div
            key={insight.id}
            className={clsx(
              'flex items-start gap-2.5 p-2.5 rounded-xl border text-xs',
              insight.severity === 'critical' ? 'bg-red-50 border-red-200' :
              insight.severity === 'warning'  ? 'bg-amber-50 border-amber-200' :
              'bg-blue-50 border-blue-200'
            )}
          >
            <div className={clsx(
              'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              insight.severity === 'critical' ? 'bg-red-200' :
              insight.severity === 'warning'  ? 'bg-amber-200' :
              'bg-blue-200'
            )}>
              {insight.severity === 'critical'
                ? <AlertOctagon className="w-3 h-3 text-red-600" />
                : insight.severity === 'warning'
                  ? <AlertTriangle className="w-3 h-3 text-amber-600" />
                  : <Info className="w-3 h-3 text-blue-600" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className={clsx(
                'font-semibold leading-snug mb-0.5',
                insight.severity === 'critical' ? 'text-red-800' :
                insight.severity === 'warning'  ? 'text-amber-800' :
                'text-blue-800'
              )}>
                {insight.title}
              </p>
              <p className={clsx(
                'leading-snug text-[11px]',
                insight.severity === 'critical' ? 'text-red-600' :
                insight.severity === 'warning'  ? 'text-amber-600' :
                'text-blue-600'
              )}>
                {insight.detail}
              </p>
              <span className={clsx(
                'inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                insight.severity === 'critical' ? 'bg-red-100 text-red-700' :
                insight.severity === 'warning'  ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              )}>
                {insight.metric}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={clsx(
              'max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed',
              msg.role === 'user'
                ? 'bg-slate-800 text-white rounded-br-sm'
                : 'bg-slate-100 text-slate-700 rounded-bl-sm'
            )}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Quick prompts */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {['Show critical items', 'Why did posting fail?', 'FCRA cap status'].map(p => (
            <button
              key={p}
              onClick={() => { setAiMsg(p); }}
              className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiMsg}
            onChange={e => setAiMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about exceptions…"
            className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 bg-slate-50 text-slate-700 placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!aiMsg.trim()}
            className="px-3 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-40 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

export default function ExceptionInbox() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '', status: 'OPEN', type: 'all', severity: 'all' });
  const [page, setPage] = useState(1);
  const [mutatingId, setMutatingId] = useState(null);
  const [liveSync, setLiveSync] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Data fetching ─────────────────────────────────────────────────────────
  const statsQuery = useQuery({
    queryKey: ['exception-stats'],
    queryFn: () => exceptionsAPI.getStats().then(r => r.data?.data ?? r.data),
    staleTime: 1000 * 60 * 2,
    refetchInterval: liveSync ? 1000 * 60 * 2 : false,
    onSuccess: () => setLastRefresh(new Date()),
    retry: 1,
  });

  const exceptionsQuery = useQuery({
    queryKey: ['exceptions', filters, page],
    queryFn: () => exceptionsAPI.getExceptions({
      status: filters.status !== 'all' ? filters.status : undefined,
      type:   filters.type   !== 'all' ? filters.type   : undefined,
      severity: filters.severity !== 'all' ? filters.severity : undefined,
      page,
      limit: PAGE_SIZE,
    }).then(r => ({
      ...r.data,
      data: (r.data?.data ?? []).map(normalizeException),
    })),
    staleTime: 1000 * 30,
    refetchInterval: liveSync ? 1000 * 60 : false,
    onSuccess: () => setLastRefresh(new Date()),
    retry: 1,
    keepPreviousData: true,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const acknowledgeMutation = useMutation({
    mutationFn: (id) => exceptionsAPI.acknowledge(id),
    onMutate: (id) => setMutatingId(id),
    onSettled: () => {
      setMutatingId(null);
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['exception-stats'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }) => exceptionsAPI.resolve(id, data),
    onMutate: ({ id }) => setMutatingId(id),
    onSettled: () => {
      setMutatingId(null);
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['exception-stats'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: ({ id, data }) => exceptionsAPI.dismiss(id, data),
    onMutate: ({ id }) => setMutatingId(id),
    onSettled: () => {
      setMutatingId(null);
      queryClient.invalidateQueries({ queryKey: ['exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['exception-stats'] });
    },
  });

  const rawExceptions = exceptionsQuery.data?.data ?? [];
  const _statsRaw     = statsQuery.data ?? {};
  const stats = {
    open:          parseInt(_statsRaw.open          ?? 0, 10),
    critical:      parseInt(_statsRaw.critical      ?? 0, 10),
    acknowledged:  parseInt(_statsRaw.acknowledged  ?? 0, 10),
    resolvedToday: parseInt(_statsRaw.resolved_today ?? _statsRaw.resolvedToday ?? 0, 10),
  };
  const apiTotal = exceptionsQuery.data?.total ?? rawExceptions.length;

  const filteredExceptions = useMemo(() => {
    return rawExceptions.filter(ex => {
      if (filters.status !== 'all' && ex.status !== filters.status) return false;
      if (filters.type   !== 'all' && ex.exceptionType !== filters.type) return false;
      if (filters.severity !== 'all' && ex.severity !== filters.severity) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = [ex.title, ex.description, ex.entityId, ex.exceptionType, ex.entityType, ex.raisedBy]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rawExceptions, filters]);

  // Sort: CRITICAL first, then by createdAt desc
  const sortedExceptions = useMemo(() => {
    return [...filteredExceptions].sort((a, b) => {
      const so = (SEVERITIES[a.severity]?.order ?? 99) - (SEVERITIES[b.severity]?.order ?? 99);
      if (so !== 0) return so;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [filteredExceptions]);

  // Paginate
  const paginatedExceptions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedExceptions.slice(start, start + PAGE_SIZE);
  }, [sortedExceptions, page]);

  // ── Filter change handler ──────────────────────────────────────────────────
  const handleFilterChange = useCallback((key, value) => {
    if (key === 'reset') {
      setFilters({ search: '', status: 'OPEN', type: 'all', severity: 'all' });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    setPage(1);
  }, []);

  const activeFilterCount = useMemo(() =>
    (filters.search ? 1 : 0) +
    (filters.status !== 'OPEN' ? 1 : 0) +
    (filters.type !== 'all' ? 1 : 0) +
    (filters.severity !== 'all' ? 1 : 0),
  [filters]);

  // ── Action handlers ────────────────────────────────────────────────────────
  function handleAcknowledge(id) { acknowledgeMutation.mutate(id); }
  function handleResolve(id, data) { resolveMutation.mutate({ id, data }); }
  function handleDismiss(id, data) { dismissMutation.mutate({ id, data }); }

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ['exceptions'] });
    queryClient.invalidateQueries({ queryKey: ['exception-stats'] });
    setLastRefresh(new Date());
  }

  const isLoading = exceptionsQuery.isLoading;
  const isFetching = exceptionsQuery.isFetching || statsQuery.isFetching;

  // ── KPI config ─────────────────────────────────────────────────────────────
  const KPI_CARDS = [
    {
      label: 'Open Exceptions',
      value: stats.open ?? 0,
      icon: AlertCircle,
      pulse: true,
      badgeClass: 'border-red-200 bg-red-50/50',
      colorClass: { bg: 'bg-red-100', icon: 'text-red-600', value: 'text-red-700' },
    },
    {
      label: 'Critical Items',
      value: stats.critical ?? 0,
      icon: AlertOctagon,
      pulse: true,
      badgeClass: 'border-orange-200 bg-orange-50/50',
      colorClass: { bg: 'bg-orange-100', icon: 'text-orange-600', value: 'text-orange-700' },
    },
    {
      label: 'Acknowledged',
      value: stats.acknowledged ?? 0,
      icon: Eye,
      pulse: false,
      badgeClass: 'border-yellow-200 bg-yellow-50/50',
      colorClass: { bg: 'bg-yellow-100', icon: 'text-yellow-600', value: 'text-yellow-700' },
    },
    {
      label: 'Resolved Today',
      value: stats.resolvedToday ?? 0,
      icon: CheckCheck,
      pulse: false,
      badgeClass: 'border-green-200 bg-green-50/50',
      colorClass: { bg: 'bg-green-100', icon: 'text-green-600', value: 'text-green-700' },
    },
  ];

  return (
    <div className="flex flex-col min-h-0 h-full overflow-y-auto bg-slate-50">
      <div className="flex flex-col gap-4 p-6 flex-1">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-sm">
                <BellRing className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-none">Exception Inbox</h1>
                <p className="text-xs text-slate-400 mt-0.5">Financial integrity monitoring · FACT</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Monitor, triage, and resolve system-detected financial exceptions across all modules.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Live sync toggle */}
            <button
              onClick={() => setLiveSync(v => !v)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors',
                liveSync
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500'
              )}
            >
              {liveSync ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {liveSync ? 'Live' : 'Paused'}
            </button>

            {/* AI panel toggle */}
            <button
              onClick={() => setShowAI(v => !v)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors',
                showAI
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-white border-slate-200 text-slate-500'
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              AI Panel
            </button>

            {/* Last refresh */}
            <span className="text-xs text-slate-400 hidden sm:block">
              Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {KPI_CARDS.map(card => (
            <KPICard key={card.label} {...card} isLoading={statsQuery.isLoading} />
          ))}
        </div>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <div className={clsx('grid gap-4', showAI ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1')}>

          {/* Exception list column */}
          <div className={clsx('flex flex-col gap-3', showAI ? 'lg:col-span-8' : '')}>

            {/* Filter bar */}
            <FilterBar filters={filters} onChange={handleFilterChange} activeCount={activeFilterCount} />

            {/* Summary bar */}
            <SummaryBar
              total={apiTotal}
              filtered={sortedExceptions.length}
              page={page}
              pageSize={PAGE_SIZE}
              onPrev={() => setPage(p => Math.max(1, p - 1))}
              onNext={() => setPage(p => p + 1)}
            />

            {/* Exception cards */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <ExceptionCardSkeleton key={i} />)}
              </div>
            ) : paginatedExceptions.length === 0 ? (
              <EmptyState
                hasFilters={activeFilterCount > 0 || filters.search.length > 0}
                onClear={() => handleFilterChange('reset')}
              />
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {paginatedExceptions.map(ex => (
                    <ExceptionCard
                      key={ex.id}
                      exception={ex}
                      onAcknowledge={handleAcknowledge}
                      onResolve={handleResolve}
                      onDismiss={handleDismiss}
                      mutatingId={mutatingId}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}

            {/* Bottom pagination (if many items) */}
            {sortedExceptions.length > PAGE_SIZE && (
              <SummaryBar
                total={apiTotal}
                filtered={sortedExceptions.length}
                page={page}
                pageSize={PAGE_SIZE}
                onPrev={() => setPage(p => Math.max(1, p - 1))}
                onNext={() => setPage(p => p + 1)}
              />
            )}
          </div>

          {/* AI Panel */}
          <AnimatePresence>
            {showAI && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="lg:col-span-4 flex flex-col"
                style={{ minHeight: 600 }}
              >
                <AIInsightsPanel exceptions={sortedExceptions} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
