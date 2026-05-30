import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { fmt } from './tbConstants';

export default function TBValidationBanner({ balanced, diff, warnings = [] }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (balanced && warnings.length === 0) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="text-sm text-emerald-700 font-medium">
          Trial Balance is balanced — Total Debits = Total Credits
        </span>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className="bg-red-50 border border-red-300 rounded-xl overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-red-700">Trial Balance Mismatch Detected</p>
          <p className="text-xs text-red-600 mt-0.5">
            Difference: <span className="font-semibold tabular-nums">₹{fmt(diff)}</span>
            {' '}· Debit and credit totals do not match. Review journal entries for errors.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {warnings.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-red-600 font-medium hover:text-red-800"
            >
              {warnings.length} warning{warnings.length > 1 ? 's' : ''}
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={() => setDismissed(true)} className="p-1 rounded hover:bg-red-100 transition-colors">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Warnings list */}
      {expanded && warnings.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-red-200">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{w}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
