import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Unlock, Lock, Clock, AlertTriangle, Building2, ShieldAlert, ListChecks } from 'lucide-react';
import clsx from 'clsx';

function useCountUp(target, duration = 800) {
  const [v, setV] = useState(0);
  const raf = useRef(null); const t0 = useRef(null);
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
  blue:    { icon: 'bg-blue-100 text-blue-600',       val: 'text-blue-700',    bar: 'bg-blue-500'    },
  emerald: { icon: 'bg-emerald-100 text-emerald-600', val: 'text-emerald-700', bar: 'bg-emerald-500' },
  violet:  { icon: 'bg-violet-100 text-violet-600',   val: 'text-violet-700',  bar: 'bg-violet-500'  },
  amber:   { icon: 'bg-amber-100 text-amber-600',     val: 'text-amber-700',   bar: 'bg-amber-500'   },
  red:     { icon: 'bg-red-100 text-red-600',         val: 'text-red-600',     bar: 'bg-red-500'     },
  slate:   { icon: 'bg-slate-100 text-slate-500',     val: 'text-slate-700',   bar: 'bg-slate-400'   },
  orange:  { icon: 'bg-orange-100 text-orange-600',   val: 'text-orange-700',  bar: 'bg-orange-500'  },
  sky:     { icon: 'bg-sky-100 text-sky-600',         val: 'text-sky-700',     bar: 'bg-sky-500'     },
};

function KPICard({ icon: Icon, label, value, sub, color = 'slate', alert, barPct, onClick }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const v = VARIANTS[color] || VARIANTS.slate;
  const display = typeof value === 'number' ? animated : (value ?? '—');

  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex-1 bg-white rounded-xl border p-4 min-w-0 transition-all duration-200 group',
        alert ? 'border-red-200 shadow-red-100/50 shadow-md ring-1 ring-red-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
        onClick && 'cursor-pointer',
      )}
      style={{ minWidth: 140 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className={clsx('text-2xl font-bold tabular-nums leading-tight mt-1', v.val)}>
            {display}
          </p>
          {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', v.icon)}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>

      {/* Mini progress bar */}
      {barPct != null && (
        <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-700', v.bar)}
            style={{ width: `${Math.min(barPct, 100)}%` }}
          />
        </div>
      )}

      {/* Alert pulse */}
      {alert && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-red-100">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-600 font-medium">Requires action</span>
        </div>
      )}
    </div>
  );
}

export default function FYKPICards({ fiscalYears, onFilter }) {
  const active    = fiscalYears.filter(f => f.status === 'ACTIVE').length;
  const openPeriods = fiscalYears.reduce((s, f) => {
    const p = f.periods || [];
    return s + p.filter(pp => pp.status === 'OPEN').length;
  }, 0);
  const locked    = fiscalYears.filter(f => f.status === 'LOCKED').length;
  const pending   = fiscalYears.filter(f => ['PARTIALLY_CLOSED', 'UNDER_AUDIT'].includes(f.status)).length;
  const drafts    = fiscalYears.filter(f => f.status === 'DRAFT').length;
  const branchPending = fiscalYears.reduce((s, f) => s + ((f.branch_count || 0) - (f.branches_closed || 0)), 0);
  const compWarnings  = fiscalYears.filter(f => f.compliance_ok === false && f.status === 'ACTIVE').length;
  const total     = fiscalYears.length;
  const closedPct = total ? Math.round((fiscalYears.filter(f => ['CLOSED','LOCKED','ARCHIVED'].includes(f.status)).length / total) * 100) : 0;

  const cards = [
    { icon: Calendar,    label: 'Active Fiscal Years', value: active,       sub: `${total} total configured`, color: 'blue',    filter: 'ACTIVE'                  },
    { icon: Unlock,      label: 'Open Periods',        value: openPeriods,  sub: 'Accepting journal entries', color: 'emerald', filter: 'open_periods'             },
    { icon: Lock,        label: 'Locked Years',        value: locked,       sub: 'No further posting allowed', color: 'violet', filter: 'LOCKED'                  },
    { icon: Clock,       label: 'Pending Closure',     value: pending,      sub: 'Need year-end action',       color: 'amber',  filter: 'pending', alert: pending > 0 },
    { icon: Building2,   label: 'Branches Pending',    value: branchPending,sub: 'Not yet period-closed',      color: branchPending > 0 ? 'orange' : 'slate', alert: branchPending > 2 },
    { icon: ShieldAlert, label: 'Compliance Warnings', value: compWarnings, sub: 'GST / TDS issues',           color: compWarnings > 0 ? 'red' : 'slate', alert: compWarnings > 0 },
    { icon: ListChecks,  label: 'Draft Years',         value: drafts,       sub: 'Not yet activated',          color: 'sky',    filter: 'DRAFT'                    },
    { icon: AlertTriangle,label:'Closure Progress',    value: `${closedPct}%`, sub: 'Years fully closed',      color: 'slate',  barPct: closedPct                  },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map(c => (
        <KPICard key={c.label} {...c} onClick={() => c.filter && onFilter?.(c.filter)} />
      ))}
    </div>
  );
}
