import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

/**
 * KPICard — displays a key performance indicator with optional trend and drill-down
 *
 * Props:
 *   title        string   — label
 *   value        string   — formatted value (e.g. "₹12.4 Cr")
 *   subValue     string?  — secondary info (e.g. "as of today")
 *   trend        number?  — % change; positive=up, negative=down
 *   trendLabel   string?  — e.g. "vs last month"
 *   icon         ReactNode
 *   color        'blue'|'green'|'red'|'amber'|'purple'|'teal'
 *   onClick      function? — if provided, card is clickable (drill-down)
 *   isLoading    boolean
 *   badge        string?  — small badge text
 */

const COLOR_MAP = {
  blue: {
    bg: 'bg-brand-50',
    icon: 'text-brand-600 bg-brand-100',
    border: 'border-brand-200',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600 bg-green-100',
    border: 'border-green-200',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600 bg-red-100',
    border: 'border-red-200',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600 bg-amber-100',
    border: 'border-amber-200',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600 bg-purple-100',
    border: 'border-purple-200',
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-600 bg-teal-100',
    border: 'border-teal-200',
  },
};

export default function KPICard({
  title,
  value,
  subValue,
  trend,
  trendLabel = 'vs last period',
  icon,
  color = 'blue',
  onClick,
  isLoading = false,
  badge,
}) {
  const colors = COLOR_MAP[color] || COLOR_MAP.blue;
  const isClickable = typeof onClick === 'function';

  const trendIcon = () => {
    if (trend === undefined || trend === null) return null;
    if (trend > 0) return <TrendingUp className="w-3.5 h-3.5" />;
    if (trend < 0) return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  const trendColor =
    trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-slate-500';

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-32 h-4 bg-slate-100 rounded" />
          <div className="w-9 h-9 bg-slate-100 rounded-lg" />
        </div>
        <div className="w-24 h-7 bg-slate-100 rounded mb-2" />
        <div className="w-20 h-3 bg-slate-100 rounded" />
      </div>
    );
  }

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={clsx(
        'bg-white border rounded-xl p-5 shadow-card transition-all duration-200',
        isClickable && 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 hover:border-brand-300',
        !isClickable && 'border-slate-200'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
            {title}
          </p>
          {badge && (
            <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
              {badge}
            </span>
          )}
        </div>
        {icon && (
          <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ml-3', colors.icon)}>
            {React.cloneElement(icon, { className: 'w-4.5 h-4.5' })}
          </div>
        )}
      </div>

      <div className="mt-2">
        <p className="text-2xl font-bold text-slate-800 leading-tight font-mono">
          {value ?? '—'}
        </p>
        {subValue && (
          <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>
        )}
      </div>

      {(trend !== undefined && trend !== null) && (
        <div className={clsx('flex items-center gap-1 mt-3 text-xs font-medium', trendColor)}>
          {trendIcon()}
          <span>
            {trend > 0 ? '+' : ''}{typeof trend === 'number' ? trend.toFixed(1) : trend}%
          </span>
          <span className="text-slate-400 font-normal">{trendLabel}</span>
        </div>
      )}

      {isClickable && (
        <div className="mt-3 text-xs text-brand-600 font-medium flex items-center gap-1">
          View details
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
