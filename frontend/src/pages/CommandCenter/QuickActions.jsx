import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus, CheckSquare, CreditCard, ShieldCheck,
  BookOpen, GitBranch, BarChart3, Users,
  RefreshCw, ChevronRight, Keyboard, Globe,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Action definitions ───────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: 'new-invoice',
    label: 'New Patient Invoice',
    shortLabel: 'New Invoice',
    icon: FilePlus,
    href: '/billing/new',
    color: 'blue',
    shortcut: 'N',
    description: 'Raise OP/IP/Package bill',
  },
  {
    id: 'approve-vendor',
    label: 'Approve Vendor Bill',
    shortLabel: 'Approve Bill',
    icon: CheckSquare,
    href: '/ap/vendor-invoices',
    color: 'green',
    shortcut: 'A',
    description: 'Review & approve AP invoices',
  },
  {
    id: 'record-payment',
    label: 'Record Payment',
    shortLabel: 'Payment',
    icon: CreditCard,
    href: '/billing/payment',
    color: 'teal',
    shortcut: 'P',
    description: 'Patient or vendor payment',
  },
  {
    id: 'submit-claim',
    label: 'Submit Insurance Claim',
    shortLabel: 'Claim',
    icon: ShieldCheck,
    href: '/insurance',
    color: 'purple',
    shortcut: 'C',
    description: 'File TPA/insurer claim',
  },
  {
    id: 'post-journal',
    label: 'Post Journal Entry',
    shortLabel: 'Journal',
    icon: BookOpen,
    href: '/accounting/journal',
    color: 'indigo',
    shortcut: 'J',
    description: 'Manual accounting entry',
  },
  {
    id: 'reconcile-bank',
    label: 'Reconcile Bank',
    shortLabel: 'Reconcile',
    icon: RefreshCw,
    href: '/cash-bank/reconciliation',
    color: 'cyan',
    shortcut: 'R',
    description: 'Match bank statements',
  },
  {
    id: 'run-payroll',
    label: 'Run Payroll',
    shortLabel: 'Payroll',
    icon: Users,
    href: '/payroll/run',
    color: 'amber',
    shortcut: 'W',
    description: 'Process staff salaries',
  },
  {
    id: 'view-reports',
    label: 'Financial Reports',
    shortLabel: 'Reports',
    icon: BarChart3,
    href: '/reports',
    color: 'rose',
    shortcut: 'F',
    description: 'P&L, Balance Sheet, Cash Flow',
  },
  {
    id: 'fcra-receipt',
    label: 'Record FC Receipt',
    shortLabel: 'FC Receipt',
    icon: Globe,
    href: '/fcra/receipts',
    color: 'green',
    shortcut: 'G',
    description: 'Log foreign contribution receipt',
  },
];

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50   hover:bg-blue-100',   icon: 'text-blue-600',   border: 'border-blue-100',   kbd: 'bg-blue-100 text-blue-600' },
  green:  { bg: 'bg-green-50  hover:bg-green-100',  icon: 'text-green-600',  border: 'border-green-100',  kbd: 'bg-green-100 text-green-600' },
  teal:   { bg: 'bg-teal-50   hover:bg-teal-100',   icon: 'text-teal-600',   border: 'border-teal-100',   kbd: 'bg-teal-100 text-teal-600' },
  purple: { bg: 'bg-purple-50 hover:bg-purple-100', icon: 'text-purple-600', border: 'border-purple-100', kbd: 'bg-purple-100 text-purple-600' },
  indigo: { bg: 'bg-indigo-50 hover:bg-indigo-100', icon: 'text-indigo-600', border: 'border-indigo-100', kbd: 'bg-indigo-100 text-indigo-600' },
  cyan:   { bg: 'bg-cyan-50   hover:bg-cyan-100',   icon: 'text-cyan-600',   border: 'border-cyan-100',   kbd: 'bg-cyan-100 text-cyan-600' },
  amber:  { bg: 'bg-amber-50  hover:bg-amber-100',  icon: 'text-amber-600',  border: 'border-amber-100',  kbd: 'bg-amber-100 text-amber-600' },
  rose:   { bg: 'bg-rose-50   hover:bg-rose-100',   icon: 'text-rose-600',   border: 'border-rose-100',   kbd: 'bg-rose-100 text-rose-600' },
};

// ─── Single Action Button ─────────────────────────────────────────────────────
function ActionButton({ action, onClick }) {
  const c = COLOR_MAP[action.color] || COLOR_MAP.blue;
  const Icon = action.icon;

  return (
    <button
      onClick={() => onClick(action.href)}
      title={action.description}
      className={clsx(
        'group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border transition-all duration-150',
        c.bg, c.border,
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1'
      )}
    >
      <div className={clsx('w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm', c.icon)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{action.shortLabel}</p>
        <p className="text-[11px] text-slate-500 truncate hidden sm:block">{action.description}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <kbd className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono', c.kbd, c.border)}>
          Alt+{action.shortcut}
        </kbd>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
      </div>
    </button>
  );
}

// ─── QuickActions ─────────────────────────────────────────────────────────────
export default function QuickActions() {
  const navigate = useNavigate();

  // Register Alt+key shortcuts
  const handleKeyDown = useCallback((e) => {
    if (!e.altKey) return;
    const key = e.key.toUpperCase();
    const action = QUICK_ACTIONS.find(a => a.shortcut === key);
    if (action) {
      e.preventDefault();
      navigate(action.href);
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
            <Keyboard className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Quick Actions</h3>
            <p className="text-[11px] text-slate-500">Alt+key shortcuts</p>
          </div>
        </div>
      </div>

      {/* Action grid */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {QUICK_ACTIONS.map(action => (
          <ActionButton
            key={action.id}
            action={action}
            onClick={(href) => navigate(href)}
          />
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
        <kbd className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded border border-slate-300">
          Ctrl+K
        </kbd>
        <p className="text-[11px] text-slate-500">for global search & more actions</p>
      </div>
    </div>
  );
}
