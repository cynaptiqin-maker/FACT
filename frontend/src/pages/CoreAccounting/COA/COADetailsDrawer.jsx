import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, BookOpen, Settings, GitBranch, Building2, Tag,
  Workflow, FileText, History, Sparkles, Edit2,
  ExternalLink, ChevronRight, Clock, User, AlertCircle,
  CheckCircle, ArrowUpRight, TrendingUp, Layers,
} from 'lucide-react';
import clsx from 'clsx';
import { TYPE_CONFIG, HEALTHCARE_DEPARTMENTS, SAMPLE_ACTIVITY, formatINR } from './coaConstants';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'mapping', label: 'Mapping', icon: Tag },
  { id: 'transactions', label: 'Txns', icon: FileText },
  { id: 'audit', label: 'Audit', icon: History },
  { id: 'ai', label: 'AI Insights', icon: Sparkles },
];

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ account }) {
  const cfg = TYPE_CONFIG[account.type] || {};

  const fields = [
    { label: 'Account Code', value: <span className="font-mono">{account.code}</span> },
    { label: 'Account Type', value: (
      <span className={clsx('inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg border', cfg.bg, cfg.text, cfg.border)}>
        <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dotColor)} />
        {cfg.label}
      </span>
    )},
    { label: 'Normal Balance', value: account.normal_balance || (cfg.normalBalance ?? '—') },
    { label: 'Parent Group', value: account.parent_name || account.parent_id ? (
      <button className="flex items-center gap-1 text-blue-600 hover:underline">
        {account.parent_name || 'View parent'}
        <ExternalLink className="w-3 h-3" />
      </button>
    ) : 'Top-level' },
    { label: 'Currency', value: account.currency || 'INR' },
    { label: 'Status', value: (
      <span className={clsx(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        account.is_active !== false
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-500',
      )}>
        <span className={clsx('w-1.5 h-1.5 rounded-full', account.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400')} />
        {account.is_active !== false ? 'Active' : 'Inactive'}
      </span>
    )},
    { label: 'Group Account', value: account.is_group ? 'Yes' : 'No' },
    { label: 'Created By', value: account.created_by || 'System' },
    { label: 'Last Modified', value: account.updated_at
      ? new Date(account.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—' },
  ];

  return (
    <div className="space-y-5">
      {/* Balance summary */}
      {account.current_balance != null && (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1 font-medium">Current Balance</p>
          <p className="text-2xl font-bold tabular-nums text-slate-900">
            {formatINR(account.current_balance)}
          </p>
          {account.opening_balance != null && (
            <p className="text-xs text-slate-400 mt-1">
              Opening: {formatINR(account.opening_balance)}
            </p>
          )}
        </div>
      )}

      {/* Field grid */}
      <div className="grid grid-cols-1 gap-0 divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50/50 transition-colors">
            <span className="text-xs text-slate-500 font-medium">{label}</span>
            <span className="text-xs text-slate-800 text-right max-w-[60%]">{value}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      {account.description && (
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-slate-500 font-medium mb-1">Description</p>
          <p className="text-xs text-slate-700 leading-relaxed">{account.description}</p>
        </div>
      )}

      {/* Children count for groups */}
      {account.is_group && account.children?.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3.5 py-3 border border-blue-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">
              {account.children.length} sub-account{account.children.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Expand all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ account }) {
  const settings = [
    { label: 'GST Applicable', value: account.is_gst_applicable, tag: 'compliance' },
    { label: 'TDS Applicable', value: account.is_tds_applicable, tag: 'compliance' },
    { label: 'Cost Centre Enforcement', value: false, tag: 'control' },
    { label: 'Approval Required', value: false, tag: 'governance' },
    { label: 'Multi-currency', value: false, tag: 'finance' },
    { label: 'Auto-posting', value: false, tag: 'automation' },
  ];

  const tagColors = {
    compliance: 'bg-orange-50 text-orange-600',
    control: 'bg-violet-50 text-violet-600',
    governance: 'bg-blue-50 text-blue-600',
    finance: 'bg-emerald-50 text-emerald-600',
    automation: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {settings.map(({ label, value, tag }) => (
          <div key={label} className="flex items-center justify-between px-3.5 py-3 bg-white">
            <div>
              <p className="text-xs font-medium text-slate-700">{label}</p>
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', tagColors[tag] || 'bg-slate-100 text-slate-500')}>
                {tag}
              </span>
            </div>
            <div className={clsx(
              'w-8 h-4.5 rounded-full flex items-center px-0.5 transition-colors',
              value ? 'bg-emerald-500 justify-end' : 'bg-slate-200 justify-start',
            )}>
              <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-amber-800">No transaction limits set</p>
          <p className="text-xs text-amber-600 mt-0.5">Configure debit/credit limits to enforce financial controls.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Mapping Tab ──────────────────────────────────────────────────────────────
function MappingTab({ account }) {
  const dept = HEALTHCARE_DEPARTMENTS.find((d) => d.value === account.department);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
        <div className="flex items-center justify-between px-3.5 py-3 bg-white">
          <span className="text-xs text-slate-500 font-medium">Department</span>
          <span className={clsx('text-xs font-medium', dept ? 'text-slate-800' : 'text-amber-600')}>
            {dept?.label || '⚠ Not mapped'}
          </span>
        </div>
        <div className="flex items-center justify-between px-3.5 py-3 bg-white">
          <span className="text-xs text-slate-500 font-medium">Branch</span>
          <span className="text-xs text-slate-800">{account.branch || 'All Branches'}</span>
        </div>
        <div className="flex items-center justify-between px-3.5 py-3 bg-white">
          <span className="text-xs text-slate-500 font-medium">Cost Centre</span>
          <span className="text-xs text-slate-400">Not assigned</span>
        </div>
        <div className="flex items-center justify-between px-3.5 py-3 bg-white">
          <span className="text-xs text-slate-500 font-medium">Healthcare Module</span>
          <span className="text-xs text-slate-400">Not mapped</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">GST / Tax Mapping</p>
        <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          <div className="flex items-center justify-between px-3.5 py-3 bg-white">
            <span className="text-xs text-slate-500 font-medium">GST Rate</span>
            <span className={clsx('text-xs', account.is_gst_applicable ? 'text-slate-800' : 'text-slate-400')}>
              {account.is_gst_applicable ? '18% (default)' : 'Not applicable'}
            </span>
          </div>
          <div className="flex items-center justify-between px-3.5 py-3 bg-white">
            <span className="text-xs text-slate-500 font-medium">TDS Section</span>
            <span className={clsx('text-xs', account.is_tds_applicable ? 'text-slate-800' : 'text-slate-400')}>
              {account.is_tds_applicable ? 'Section 194C' : 'Not applicable'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
function TransactionsTab({ account }) {
  const placeholderTxns = [
    { date: '15 May 2025', ref: 'JV-2025-0142', narration: 'Patient collection — OPD', debit: 0, credit: 25000 },
    { date: '14 May 2025', ref: 'JV-2025-0139', narration: 'TPA settlement — Star Health', debit: 0, credit: 180000 },
    { date: '13 May 2025', ref: 'JV-2025-0135', narration: 'Pharmacy revenue', debit: 0, credit: 45200 },
    { date: '12 May 2025', ref: 'JV-2025-0130', narration: 'Refund — cancelled procedure', debit: 8000, credit: 0 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Recent transactions</p>
        <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
          View ledger <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
          <span className="text-[10px] font-semibold text-slate-400 uppercase w-20">Date</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase flex-1">Narration</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase w-20 text-right">Dr / Cr</span>
        </div>
        {placeholderTxns.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
            <span className="text-[10px] text-slate-400 w-20 flex-shrink-0">{t.date}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 truncate">{t.narration}</p>
              <p className="text-[10px] font-mono text-slate-400">{t.ref}</p>
            </div>
            <span className={clsx('text-[11px] font-mono font-semibold w-20 text-right', t.credit > 0 ? 'text-emerald-600' : 'text-red-600')}>
              {t.credit > 0 ? `+${formatINR(t.credit)}` : `-${formatINR(t.debit)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────
function AuditTab({ account }) {
  return (
    <div className="space-y-2">
      {SAMPLE_ACTIVITY.slice(0, 4).map((event) => {
        const iconMap = {
          create: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          update: { icon: Edit2, color: 'text-blue-600 bg-blue-50' },
          import: { icon: ArrowUpRight, color: 'text-violet-600 bg-violet-50' },
          approve: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          disable: { icon: X, color: 'text-red-600 bg-red-50' },
        };
        const { icon: Icon, color } = iconMap[event.type] || { icon: Clock, color: 'text-slate-500 bg-slate-100' };

        return (
          <div key={event.id} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700">
                <span className="font-medium">{event.user}</span> {event.action}{' '}
                <span className="font-medium">{event.target}</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{event.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── AI Insights Tab ──────────────────────────────────────────────────────────
function AIInsightsTab({ account }) {
  const insights = [
    {
      icon: '✅',
      type: 'success',
      title: 'Account structure is optimal',
      body: `"${account.name}" is correctly placed under its parent group. Hierarchy depth is appropriate.`,
    },
    {
      icon: '💡',
      type: 'info',
      title: 'Similar accounts detected',
      body: 'There are 2 accounts with similar naming patterns. Review to ensure no duplication.',
      action: 'Review',
    },
    {
      icon: '⚠️',
      type: 'warning',
      title: 'Missing department mapping',
      body: 'This account has no department assignment. Cost-centre reporting may be incomplete.',
      action: 'Map now',
    },
  ];

  const colors = {
    success: 'border-emerald-200 bg-emerald-50/50',
    info: 'border-blue-200 bg-blue-50/50',
    warning: 'border-amber-200 bg-amber-50/50',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        Powered by FinOS AI
      </div>
      {insights.map((ins, i) => (
        <div key={i} className={clsx('rounded-xl border p-3.5 space-y-1.5', colors[ins.type])}>
          <div className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5">{ins.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-800">{ins.title}</p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{ins.body}</p>
            </div>
          </div>
          {ins.action && (
            <button className="text-xs font-medium text-blue-600 hover:underline ml-6">
              {ins.action} →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function COADetailsDrawer({ account, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!account) return null;

  const cfg = TYPE_CONFIG[account.type] || {};

  const TAB_CONTENT = {
    overview: <OverviewTab account={account} />,
    settings: <SettingsTab account={account} />,
    mapping: <MappingTab account={account} />,
    transactions: <TransactionsTab account={account} />,
    audit: <AuditTab account={account} />,
    ai: <AIInsightsTab account={account} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="w-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Drawer header */}
      <div className={clsx('px-4 py-4 border-b border-slate-200', cfg.gradient ? `bg-gradient-to-r ${cfg.gradient}` : 'bg-slate-50')}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border', cfg.bg, cfg.text, cfg.border)}>
                {cfg.label}
              </span>
              {account.is_group && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  GROUP
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">{account.name}</h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{account.code}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit?.(account)}
              className="p-1.5 rounded-lg hover:bg-white/80 text-slate-500 hover:text-blue-600 transition-colors"
              title="Edit account"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/80 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Balance preview in header */}
        {account.current_balance != null && (
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-mono font-semibold text-slate-700">
              {formatINR(account.current_balance)}
            </span>
            <span className="text-xs text-slate-400">current balance</span>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 bg-white overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
            )}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {TAB_CONTENT[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Drawer footer actions */}
      <div className="border-t border-slate-200 px-4 py-3 flex gap-2 bg-slate-50/60">
        <button
          onClick={() => onEdit?.(account)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edit Account
        </button>
        <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <FileText className="w-3.5 h-3.5" />
          Ledger
        </button>
      </div>
    </motion.div>
  );
}
