import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Zap } from 'lucide-react';
import clsx from 'clsx';

export default function JVValidationBar({ errors, diff, isBalanced, lineCount, activeLines }) {
  const issues = [];

  if (activeLines > 0 && !isBalanced) {
    issues.push({
      type: 'error',
      msg: `Voucher unbalanced by ₹${diff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    });
  }
  if (lineCount < 2 && activeLines < 2) {
    issues.push({ type: 'error', msg: 'Minimum 2 journal lines required' });
  }
  if (errors.narration) {
    issues.push({ type: 'error', msg: `Narration: ${errors.narration.message}` });
  }
  if (errors.entry_date) {
    issues.push({ type: 'error', msg: `Date: ${errors.entry_date.message}` });
  }
  if (errors.lines && !Array.isArray(errors.lines) && errors.lines.message) {
    issues.push({ type: 'error', msg: errors.lines.message });
  }

  const hasErrors  = issues.some(i => i.type === 'error');
  const hasWarnings = issues.some(i => i.type === 'warning');
  const allClear   = !hasErrors && !hasWarnings && isBalanced;

  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs transition-colors',
      hasErrors   ? 'bg-red-50 border-red-200'         :
      hasWarnings ? 'bg-amber-50 border-amber-200'     :
      allClear    ? 'bg-emerald-50 border-emerald-200' :
                    'bg-slate-50 border-slate-200',
    )}>
      {/* Icon */}
      {hasErrors ? (
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
      ) : allClear ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      ) : (
        <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
      )}

      {/* Issues or all-clear */}
      <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-0.5">
        {issues.length > 0 ? (
          issues.map((issue, i) => (
            <span
              key={i}
              className={clsx(
                'font-semibold',
                issue.type === 'error'   ? 'text-red-600'   :
                issue.type === 'warning' ? 'text-amber-600' : 'text-slate-600',
              )}
            >
              {issue.msg}
            </span>
          ))
        ) : allClear ? (
          <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            All validations passed · Ready to submit
          </span>
        ) : (
          <span className="text-slate-500">Add journal lines to begin</span>
        )}
      </div>

      {/* Right: metadata */}
      <div className="flex-shrink-0 flex items-center gap-3 text-slate-400">
        <span className="flex items-center gap-1">
          <span className="font-semibold text-slate-600">{activeLines}</span> active lines
        </span>
        <span className="w-px h-3 bg-slate-300" />
        <span className="flex items-center gap-1">
          <span className={clsx(
            'w-1.5 h-1.5 rounded-full animate-pulse',
            allClear ? 'bg-emerald-400' : hasErrors ? 'bg-red-400' : 'bg-amber-400',
          )} />
          FinOS · JV v2
        </span>
      </div>
    </div>
  );
}
