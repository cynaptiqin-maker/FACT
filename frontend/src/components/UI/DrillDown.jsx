import React from 'react';
import { X, ArrowLeft, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

/**
 * DrillDown — slide-over panel for drill-down details
 *
 * Props:
 *   open         boolean
 *   onClose      () => void
 *   title        string
 *   subtitle     string?
 *   children     ReactNode
 *   width        'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 *   actions      ReactNode — header action buttons
 */
export default function DrillDown({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'md',
  actions,
}) {
  const widthMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          'fixed top-0 right-0 h-full bg-white shadow-2xl z-50 flex flex-col w-full transition-transform duration-300 ease-out',
          widthMap[width] || widthMap.md,
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-800 truncate">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  );
}

// ─── DrillDown Section ────────────────────────────────────────────────────────
DrillDown.Section = function Section({ title, children, className }) {
  return (
    <div className={clsx('mb-6', className)}>
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
};

// ─── DrillDown Stat Row ────────────────────────────────────────────────────────
DrillDown.Stat = function Stat({ label, value, mono = false, badge, badgeColor = 'slate' }) {
  const badgeColors = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', badgeColors[badgeColor] || badgeColors.slate)}>
            {badge}
          </span>
        )}
        <span className={clsx('text-sm font-medium text-slate-800', mono && 'font-mono')}>
          {value ?? '—'}
        </span>
      </div>
    </div>
  );
};

// ─── DrillDown Link ────────────────────────────────────────────────────────────
DrillDown.Link = function Link({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
    >
      {label}
      <ExternalLink className="w-3.5 h-3.5" />
    </button>
  );
};
