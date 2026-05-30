import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, BookOpen, Clock, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { fmt } from './tbConstants';

function useCountUp(target, duration = 900) {
  const [v, setV] = useState(0);
  const raf = useRef(null);
  const t0  = useRef(null);
  useEffect(() => {
    if (!target) { setV(0); return; }
    t0.current = null;
    const tick = (ts) => {
      if (!t0.current) t0.current = ts;
      const p = Math.min((ts - t0.current) / duration, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return v;
}

const VARIANTS = {
  blue:    { icon: 'bg-blue-100 text-blue-600',     val: 'text-blue-700'    },
  emerald: { icon: 'bg-emerald-100 text-emerald-600', val: 'text-emerald-700' },
  red:     { icon: 'bg-red-100 text-red-600',       val: 'text-red-600'     },
  slate:   { icon: 'bg-slate-100 text-slate-500',   val: 'text-slate-700'   },
  amber:   { icon: 'bg-amber-100 text-amber-600',   val: 'text-amber-700'   },
  violet:  { icon: 'bg-violet-100 text-violet-600', val: 'text-violet-700'  },
};

function Card({ icon: Icon, label, value, sub, color = 'slate', currency, highlight, pulse, onClick }) {
  const rawNum = typeof value === 'number' ? value : 0;
  const animated = useCountUp(rawNum);
  const v = VARIANTS[color] || VARIANTS.slate;

  const display = currency
    ? (typeof value === 'number' ? `₹${fmt(value, 0)}` : '—')
    : (typeof value === 'number' ? animated.toLocaleString('en-IN') : (value ?? '—'));

  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex-1 bg-white rounded-xl border p-4 min-w-0 transition-all duration-200',
        highlight ? 'border-red-300 shadow-md shadow-red-100/50 ring-1 ring-red-200' : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
        onClick && 'cursor-pointer',
      )}
      style={{ minWidth: 150 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className={clsx('text-xl font-bold tabular-nums leading-tight mt-1 truncate', v.val)}>
            {display}
          </p>
          {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 relative', v.icon)}>
          <Icon className="w-4 h-4" strokeWidth={2} />
          {pulse && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
          )}
        </div>
      </div>
      {highlight && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-red-100">
          <AlertTriangle className="w-3 h-3 text-red-500" />
          <span className="text-xs text-red-600 font-semibold">Mismatch detected</span>
        </div>
      )}
    </div>
  );
}

export default function TBSummaryCards({ totals, accountCount, suspenseCount, generatedAt, isLoading }) {
  const {
    closing_debit  = 0,
    closing_credit = 0,
  } = totals || {};

  const diff = Math.abs(parseFloat(closing_debit) - parseFloat(closing_credit));
  const balanced = diff < 0.01;
  const timeStr  = generatedAt ? new Date(generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

  const cards = [
    {
      icon: TrendingUp,
      label: 'Total Debit',
      value: parseFloat(closing_debit) || 0,
      sub: 'Closing debit balance',
      color: 'blue',
      currency: true,
    },
    {
      icon: TrendingDown,
      label: 'Total Credit',
      value: parseFloat(closing_credit) || 0,
      sub: 'Closing credit balance',
      color: 'violet',
      currency: true,
    },
    {
      icon: AlertTriangle,
      label: 'Difference',
      value: diff,
      sub: balanced ? 'Accounts balance ✓' : 'Books are out of balance',
      color: balanced ? 'emerald' : 'red',
      currency: true,
      highlight: !balanced,
      pulse: !balanced,
    },
    {
      icon: BookOpen,
      label: 'Total Ledgers',
      value: accountCount || 0,
      sub: 'Non-zero accounts',
      color: 'slate',
    },
    {
      icon: ShieldAlert,
      label: 'Suspense Accts',
      value: suspenseCount || 0,
      sub: suspenseCount > 0 ? 'Need clearing' : 'None open',
      color: suspenseCount > 0 ? 'amber' : 'slate',
      highlight: false,
    },
    {
      icon: Clock,
      label: 'Generated At',
      value: timeStr,
      sub: 'Today',
      color: 'slate',
    },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {cards.map((card) => (
        <Card
          key={card.label}
          {...card}
          value={isLoading ? null : card.value}
        />
      ))}
    </div>
  );
}
