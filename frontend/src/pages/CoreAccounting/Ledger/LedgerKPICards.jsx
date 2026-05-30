import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen, CheckCircle, TrendingUp, TrendingDown,
  Lock, RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import { formatINR } from './ledgerConstants';

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const rafId = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!target) { setValue(0); return; }
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

const VARIANTS = {
  blue:    { icon: 'bg-blue-100 text-blue-600',    val: 'text-blue-700',    ring: '' },
  emerald: { icon: 'bg-emerald-100 text-emerald-600', val: 'text-emerald-700', ring: '' },
  violet:  { icon: 'bg-violet-100 text-violet-600',  val: 'text-violet-700',  ring: '' },
  cyan:    { icon: 'bg-cyan-100 text-cyan-600',    val: 'text-cyan-700',    ring: '' },
  amber:   { icon: 'bg-amber-100 text-amber-600',  val: 'text-amber-700',   ring: 'ring-2 ring-amber-200' },
  slate:   { icon: 'bg-slate-100 text-slate-500',  val: 'text-slate-700',   ring: '' },
};

function KPICard({ icon: Icon, label, value, sub, color = 'slate', isCurrency, highlight, onClick }) {
  const numericVal = isCurrency ? 0 : (typeof value === 'number' ? value : 0);
  const animated = useCountUp(numericVal);
  const v = VARIANTS[color] || VARIANTS.slate;

  let display;
  if (isCurrency) {
    display = typeof value === 'number' ? `₹${formatINR(value)}` : '—';
  } else {
    display = typeof value === 'number' ? animated : (value ?? '—');
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex-1 bg-white rounded-xl border border-slate-200 p-4 min-w-0',
        'hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer',
        highlight && v.ring,
      )}
      style={{ minWidth: 140 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className={clsx('text-xl font-bold tabular-nums leading-tight mt-1 truncate', v.val)}>
            {display}
          </p>
          {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', v.icon)}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>

      {highlight && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs text-amber-600 font-medium">Needs review</span>
        </div>
      )}
    </div>
  );
}

export default function LedgerKPICards({ stats, onFilter }) {
  const {
    total = 0,
    active = 0,
    frozen = 0,
    debitTotal = 0,
    creditTotal = 0,
    recentlyModified = 0,
  } = stats || {};

  const cards = [
    {
      icon: BookOpen,
      label: 'Total Ledgers',
      value: total,
      sub: `${active} active · ${total - active} inactive`,
      color: 'blue',
      filter: null,
    },
    {
      icon: CheckCircle,
      label: 'Active Ledgers',
      value: active,
      sub: total ? `${Math.round((active / total) * 100)}% of total` : '—',
      color: 'emerald',
      filter: 'active',
    },
    {
      icon: TrendingUp,
      label: 'Total Debit Bal.',
      value: debitTotal,
      sub: 'Aggregate Dr balances',
      color: 'violet',
      isCurrency: true,
      filter: null,
    },
    {
      icon: TrendingDown,
      label: 'Total Credit Bal.',
      value: creditTotal,
      sub: 'Aggregate Cr balances',
      color: 'cyan',
      isCurrency: true,
      filter: null,
    },
    {
      icon: Lock,
      label: 'Frozen Ledgers',
      value: frozen,
      sub: frozen > 0 ? 'No transactions allowed' : 'None frozen',
      color: frozen > 0 ? 'amber' : 'slate',
      highlight: frozen > 0,
      filter: 'frozen',
    },
    {
      icon: RefreshCw,
      label: 'Recently Modified',
      value: recentlyModified,
      sub: 'Last 7 days',
      color: 'slate',
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
