import React from 'react';
import {
  Save, Send, RotateCcw, Copy, Upload, Clock,
  CheckCircle2, AlertCircle, Loader2, Keyboard, ArrowLeft, Plus,
  Network,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { STATUS_CONFIG, VOUCHER_TYPES } from './jvConstants';

function ActionBtn({ icon: Icon, label, onClick, disabled, variant = 'ghost', title }) {
  const base = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1';
  const styles = {
    ghost:   'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-300',
    primary: 'text-white bg-brand-700 hover:bg-brand-800 shadow-sm focus:ring-brand-500',
    success: 'text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm focus:ring-emerald-400',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(base, styles[variant], disabled && 'opacity-50 cursor-not-allowed pointer-events-none')}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function JVHeader({
  voucherType, voucherNumber, status, lastSaved, isSaving,
  isBalanced, isSubmitting, isSubmitted,
  onSave, onSubmit, onNew, onReverse, onDuplicate, onImport, onShowShortcuts,
}) {
  const navigate   = useNavigate();
  const vType      = VOUCHER_TYPES.find(v => v.value === voucherType) || VOUCHER_TYPES[0];
  const statusCfg  = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Brand accent stripe */}
      <div className="h-0.5 bg-gradient-to-r from-brand-700 via-brand-500 to-cyan-400" />

      <div className="px-5 py-4 flex items-start justify-between gap-4">

        {/* ── Left: title, breadcrumb, status pills ─────────────────────── */}
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            {/* Icon + title row */}
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Network className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">
                    {vType.label}
                  </h1>
                  {voucherNumber && (
                    <span className="font-mono text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {voucherNumber}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Enterprise double-entry journal · Real-time validation · Audit-ready
                </p>
              </div>
            </div>

            {/* Status pills row */}
            <div className="flex items-center gap-2 flex-wrap ml-[44px]">
              <span className={clsx('text-[11px] font-bold px-2.5 py-0.5 rounded-full', statusCfg.className)}>
                {statusCfg.label}
              </span>

              {isBalanced ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Balanced
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                  <AlertCircle className="w-3 h-3" />
                  Unbalanced
                </span>
              )}

              <span className="w-px h-3 bg-slate-200" />

              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                {isSaving ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                ) : lastSaved ? (
                  <><Clock className="w-3 h-3" /> Saved {format(lastSaved, 'HH:mm:ss')}</>
                ) : (
                  <><Clock className="w-3 h-3" /> Unsaved draft</>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: action toolbar ──────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={onShowShortcuts}
            title="Keyboard shortcuts (Ctrl+/)"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          <ActionBtn icon={Plus}      label="New"       onClick={onNew}       title="New voucher (Ctrl+N)" />
          <ActionBtn icon={Upload}    label="Import"    onClick={onImport}    title="Import from Excel/CSV" />
          <ActionBtn icon={Copy}      label="Duplicate" onClick={onDuplicate} title="Duplicate this voucher" />
          <ActionBtn icon={RotateCcw} label="Reverse"   onClick={onReverse}   title="Reverse a posted voucher" />

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          <ActionBtn
            icon={Save}
            label="Save Draft"
            onClick={onSave}
            title="Save as draft (Ctrl+S)"
          />
          <ActionBtn
            icon={isSubmitted ? CheckCircle2 : isSubmitting ? Loader2 : Send}
            label={isSubmitted ? 'Submitted' : isSubmitting ? 'Submitting…' : 'Submit'}
            onClick={onSubmit}
            disabled={!isBalanced || isSubmitting || isSubmitted}
            variant={isSubmitted ? 'success' : 'primary'}
            title={isSubmitted ? 'Already submitted — create another or view in list' : 'Submit for approval (Ctrl+Enter)'}
          />
        </div>
      </div>
    </div>
  );
}
