import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen, CheckCircle, XCircle, GitBranch,
  AlertTriangle, Clock, RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const rafId = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (target == null || target === 0) { setValue(0); return; }
    startRef.current = null;
    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return value;
}

// All color variants written as complete static strings so Tailwind doesn't purge them
const VARIANTS = {
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    val: 'text-blue-700',
    ring: '',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    val: 'text-emerald-700',
    ring: '',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-500',
    val: 'text-slate-700',
    ring: '',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-600',
    val: 'text-amber-700',
    ring: 'ring-2 ring-amber-300',
  },
  red: {
    icon: 'bg-red-100 text-red-600',
    val: 'text-red-600',
    ring: 'ring-2 ring-red-300',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-600',
    val: 'text-violet-700',
    ring: '',
  },
  cyan: {
    icon: 'bg-cyan-100 text-cyan-600',
    val: 'text-cyan-700',
    ring: '',
  },
};

function KPICard({ icon: Icon, label, value, sub, color = 'slate', highlight, onClick }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const v = VARIANTS[color] || VARIANTS.slate;
  const display = typeof value === 'number' ? animated : (value ?? '—');

  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex-1 bg-white rounded-xl border border-slate-200 p-4 cursor-pointer',
        'hover:border-slate-300 hover:shadow-md transition-all duration-200 min-w-0',
        highlight && v.ring,
      )}
      style={{ minWidth: '120px' }}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Text side */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className={clsx('text-2xl font-bold tabular-nums leading-tight mt-1', v.val)}>
            {display}
          </p>
          {sub && (
            <p className="text-xs text-slate-400 mt-1 leading-snug truncate">{sub}</p>
          )}
        </div>

        {/* Icon side */}
        <div className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
          v.icon,
        )}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>

      {/* Alert pulse dot */}
      {highlight && (
        <div className="flex items-center gap-1 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs text-amber-600 font-medium">Needs attention</span>
        </div>
      )}
    </div>
  );
}

export default function COAKPICards({ stats, onFilter }) {
  const {
    total = 0,
    active = 0,
    inactive = 0,
    groups = 0,
    unmapped = 0,
    pendingApproval = 0,
    recentlyModified = 0,
  } = stats || {};

  const cards = [
    {
      icon: BookOpen,
      label: 'Total Accounts',
      value: total,
      sub: `${groups} groups · ${total - groups} ledgers`,
      color: 'blue',
      filter: null,
    },
    {
      icon: CheckCircle,
      label: 'Active Ledgers',
      value: active,
      sub: `${total ? Math.round((active / total) * 100) : 0}% of total`,
      color: 'emerald',
      filter: 'active',
    },
    {
      icon: XCircle,
      label: 'Inactive',
      value: inactive,
      sub: inactive > 0 ? 'Review for cleanup' : 'None disabled',
      color: 'slate',
      filter: 'inactive',
    },
    {
      icon: GitBranch,
      label: 'Groups',
      value: groups,
      sub: 'Structural nodes',
      color: 'violet',
      filter: 'groups',
    },
    {
      icon: AlertTriangle,
      label: 'Unmapped',
      value: unmapped,
      sub: unmapped > 0 ? 'Missing dept map' : 'All mapped',
      color: unmapped > 0 ? 'amber' : 'slate',
      highlight: unmapped > 0,
      filter: 'unmapped',
    },
    {
      icon: Clock,
      label: 'Pending Approval',
      value: pendingApproval,
      sub: pendingApproval > 0 ? 'Awaiting review' : 'Queue clear',
      color: pendingApproval > 0 ? 'red' : 'slate',
      highlight: pendingApproval > 0,
      filter: 'pending',
    },
    {
      icon: RefreshCw,
      label: 'Modified',
      value: recentlyModified,
      sub: 'Last 7 days',
      color: 'cyan',
      filter: 'recent',
    },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {cards.map((card) => (
        <KPICard
          key={card.label}
          {...card}
          onClick={() => card.filter && onFilter?.(card.filter)}
        />
      ))}
    </div>
  );
}
