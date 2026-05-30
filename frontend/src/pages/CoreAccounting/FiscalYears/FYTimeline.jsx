import React, { useState } from 'react';
import { Lock, ChevronDown, ChevronRight, Dot } from 'lucide-react';
import clsx from 'clsx';
import { FY_STATUS, PERIOD_STATUS, generatePeriods, fyLabel, formatFYDate } from './fyConstants';

// ─── Period node tooltip ──────────────────────────────────────────────────────
function PeriodTooltip({ period, fyName }) {
  const cfg = PERIOD_STATUS[period.status] || PERIOD_STATUS.FUTURE;
  return (
    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none
      w-48 bg-slate-900 text-white rounded-xl shadow-2xl px-3 py-2.5 text-xs">
      <p className="font-semibold text-white">{period.name}</p>
      <p className="text-slate-300 mt-0.5">{fyName}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className={clsx('w-2 h-2 rounded-full', cfg.dot || 'bg-slate-400')} />
        <span className="text-slate-200">{cfg.label}</span>
        {period.is_locked && <Lock className="w-3 h-3 text-violet-400 ml-1" />}
      </div>
      <p className="text-slate-400 mt-1 text-[10px]">
        {formatFYDate(period.start_date)} – {formatFYDate(period.end_date)}
      </p>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
    </div>
  );
}

// ─── Single period node ───────────────────────────────────────────────────────
function PeriodNode({ period, fyName, onSelect, selected }) {
  const [hover, setHover] = useState(false);
  const cfg = PERIOD_STATUS[period.status] || PERIOD_STATUS.FUTURE;

  return (
    <div
      className="relative flex flex-col items-center gap-0.5 cursor-pointer group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onSelect(period)}
    >
      {/* Month label */}
      <span className={clsx(
        'text-[9px] font-semibold uppercase leading-none mb-0.5 transition-colors',
        period.isCurrent ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600',
      )}>
        {period.shortName}
      </span>

      {/* Node bar */}
      <div
        className={clsx(
          'w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150',
          cfg.timeline,
          selected ? 'ring-2 ring-offset-1 ring-brand-500 scale-110' : 'group-hover:scale-110 group-hover:shadow-md',
          period.isCurrent && 'ring-2 ring-offset-1 ring-emerald-400',
        )}
      >
        {period.is_locked
          ? <Lock className="w-3 h-3 text-white/80" />
          : period.status === 'OPEN' && period.isCurrent
            ? <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            : <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
        }
      </div>

      {/* Tooltip */}
      {hover && <PeriodTooltip period={period} fyName={fyName} />}
    </div>
  );
}

// ─── Single fiscal year timeline row ─────────────────────────────────────────
function FYTimelineRow({ fy, selectedPeriod, onSelectPeriod, onSelectFY, isSelected }) {
  const [expanded, setExpanded] = useState(fy.status === 'ACTIVE');
  const periods  = fy.periods || generatePeriods(fy.start_date);
  const fyStatus = FY_STATUS[fy.status] || FY_STATUS.DRAFT;
  const label    = fyLabel(fy);

  // Closed/locked progress
  const closedCount = periods.filter(p => ['CLOSED', 'LOCKED'].includes(p.status)).length;
  const pct         = Math.round((closedCount / 12) * 100);

  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200',
        isSelected ? 'border-brand-300 bg-brand-50/30 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300',
      )}
    >
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => { onSelectFY(fy); setExpanded(e => !e); }}
      >
        {/* Expand toggle */}
        <div className="w-5 h-5 flex items-center justify-center text-slate-400 flex-shrink-0">
          {expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />}
        </div>

        {/* FY name + status */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <span className={clsx(
            'text-sm font-bold',
            isSelected ? 'text-brand-700' : 'text-slate-800',
          )}>
            {label}
          </span>
          <span className={clsx(
            'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
            fyStatus.bg, fyStatus.text, fyStatus.border,
          )}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', fyStatus.dot)} />
            {fyStatus.label}
          </span>
          {fy.is_locked && <Lock className="w-3.5 h-3.5 text-violet-500" />}
        </div>

        {/* Compact period strip (always visible) */}
        <div className="flex gap-1 flex-1 items-center overflow-x-auto">
          {periods.map((p) => {
            const pCfg = PERIOD_STATUS[p.status] || PERIOD_STATUS.FUTURE;
            return (
              <div
                key={p.id}
                title={`${p.shortName}: ${pCfg.label}`}
                className={clsx(
                  'h-2 flex-1 min-w-[8px] rounded-sm transition-all',
                  pCfg.timeline,
                  p.isCurrent && 'ring-1 ring-emerald-400',
                )}
              />
            );
          })}
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0 ml-2">
          <span className="hidden sm:block">{closedCount}/12 closed</span>
          <div className="hidden md:flex items-center gap-1">
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span>{pct}%</span>
          </div>
          <span className="text-slate-400">
            {fy.branches_closed || 0}/{fy.branch_count || 5} branches
          </span>
        </div>
      </div>

      {/* Expanded: detailed period nodes */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100">
          {/* Quarters labels */}
          <div className="flex gap-1 mb-2">
            {['Q1 Apr–Jun', 'Q2 Jul–Sep', 'Q3 Oct–Dec', 'Q4 Jan–Mar'].map((q, i) => (
              <div key={q} className="flex-1 text-center">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{q}</span>
              </div>
            ))}
          </div>

          {/* Period nodes grouped in 4 quarters of 3 */}
          <div className="flex gap-1">
            {[0, 1, 2, 3].map(qi => (
              <div
                key={qi}
                className={clsx(
                  'flex-1 flex gap-1 justify-around p-2 rounded-lg',
                  qi % 2 === 0 ? 'bg-slate-50' : 'bg-white',
                )}
              >
                {periods.slice(qi * 3, qi * 3 + 3).map(p => (
                  <PeriodNode
                    key={p.id}
                    period={p}
                    fyName={label}
                    onSelect={onSelectPeriod}
                    selected={selectedPeriod?.id === p.id}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Status legend */}
          <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-slate-100">
            {Object.entries(PERIOD_STATUS).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={clsx('w-3 h-3 rounded', cfg.timeline)} />
                <span className="text-[10px] text-slate-400">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline header bar ──────────────────────────────────────────────────────
function TimelineHeader() {
  const now = new Date();
  const curMonth = now.toLocaleString('en-IN', { month: 'short' });
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 mb-3">
      <div className="w-5 flex-shrink-0" />
      <div className="min-w-[140px] text-xs font-semibold text-slate-500 uppercase tracking-wide">Fiscal Year</div>
      <div className="flex gap-1 flex-1 items-center">
        {months.map(m => (
          <div key={m} className={clsx(
            'flex-1 text-center text-[9px] font-semibold uppercase tracking-widest',
            m === curMonth ? 'text-emerald-600' : 'text-slate-400',
          )}>
            {m}
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-400 flex-shrink-0 hidden md:block">Period Coverage</div>
    </div>
  );
}

// ─── Full timeline component ──────────────────────────────────────────────────
export default function FYTimeline({ fiscalYears, selectedFY, onSelectFY, selectedPeriod, onSelectPeriod }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Fiscal Calendar Timeline</h3>
          <p className="text-xs text-slate-400 mt-0.5">Click any year to manage · Expand to view period detail</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Current period active</span>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <TimelineHeader />
        {fiscalYears.map(fy => (
          <FYTimelineRow
            key={fy.id}
            fy={fy}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={onSelectPeriod}
            onSelectFY={onSelectFY}
            isSelected={selectedFY?.id === fy.id}
          />
        ))}
        {fiscalYears.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">
            No fiscal years configured. Create your first fiscal year to begin.
          </div>
        )}
      </div>
    </div>
  );
}
