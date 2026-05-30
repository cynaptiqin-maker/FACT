import React, { useState } from 'react';
import { Hash, Sparkles, ChevronDown, Tag } from 'lucide-react';
import clsx from 'clsx';
import { VOUCHER_TYPES, NARRATION_TEMPLATES, COST_CENTERS, DEPARTMENTS } from './jvConstants';

const inputBase = [
  'w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white',
  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
  'hover:border-slate-300 transition-colors',
  'placeholder:text-slate-400 text-slate-800 font-medium',
].join(' ');

function Field({ label, required, error, hint, children, className }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1">{error}</p>}
      {hint && !error && <p className="text-slate-400 text-[10px] mt-0.5">{hint}</p>}
    </div>
  );
}

export default function JVMeta({ register, errors, watch, setValue }) {
  const [showTemplates, setShowTemplates] = useState(false);

  const applyTemplate = (tpl) => {
    setValue('narration', tpl.replace(/\{[^}]+\}/g, '…'));
    setShowTemplates(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-brand-600 rounded-full" />
        <h2 className="text-sm font-bold text-slate-700">Voucher Details</h2>
        <span className="text-[10px] text-slate-400 ml-auto">All fields optional except marked *</span>
      </div>

      {/* Row 1: Core metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">

        <Field label="Voucher Type" required>
          <div className="relative">
            <select {...register('voucher_type')} className={clsx(inputBase, 'pr-8 appearance-none cursor-pointer')}>
              {VOUCHER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </Field>

        <Field label="Voucher No." hint="Auto-generated if blank">
          <div className="relative">
            <Hash className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
            <input
              {...register('voucher_number')}
              type="text"
              placeholder="JV-2026-XXXX"
              className={clsx(inputBase, 'pl-8 font-mono text-xs text-slate-600')}
            />
          </div>
        </Field>

        <Field label="Entry Date" required error={errors.entry_date?.message}>
          <input {...register('entry_date')} type="date" className={inputBase} />
        </Field>

        <Field label="Posting Date">
          <input {...register('posting_date')} type="date" className={inputBase} />
        </Field>

        <Field label="Currency">
          <div className="relative">
            <select {...register('currency')} className={clsx(inputBase, 'pr-8 appearance-none cursor-pointer font-mono')}>
              <option value="INR">₹ INR — Indian Rupee</option>
              <option value="USD">$ USD — US Dollar</option>
              <option value="EUR">€ EUR — Euro</option>
              <option value="GBP">£ GBP — British Pound</option>
              <option value="AED">د.إ AED — UAE Dirham</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </Field>

        <Field label="Reference No." hint="PO / Invoice / Claim #">
          <input
            {...register('reference_number')}
            type="text"
            placeholder="REF-XXXX"
            className={inputBase}
          />
        </Field>
      </div>

      {/* Row 2: Org / classification */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">

        <Field label="Branch">
          <div className="relative">
            <select {...register('branch')} className={clsx(inputBase, 'pr-8 appearance-none cursor-pointer')}>
              <option value="">— All Branches —</option>
              <option value="main">Main Hospital</option>
              <option value="north">North Wing</option>
              <option value="south">South Clinic</option>
              <option value="college">Medical College</option>
              <option value="research">Research Centre</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </Field>

        <Field label="Department">
          <div className="relative">
            <select {...register('department')} className={clsx(inputBase, 'pr-8 appearance-none cursor-pointer')}>
              <option value="">— None —</option>
              {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </Field>

        <Field label="Cost Center">
          <div className="relative">
            <select {...register('cost_center')} className={clsx(inputBase, 'pr-8 appearance-none cursor-pointer')}>
              <option value="">— None —</option>
              {COST_CENTERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </Field>

        <Field label="Project / Grant">
          <input
            {...register('project')}
            type="text"
            placeholder="e.g. WHO Grant 2026"
            className={inputBase}
          />
        </Field>

        <Field label="Tags">
          <div className="relative">
            <Tag className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
            <input
              {...register('tags')}
              type="text"
              placeholder="tpa, accrual, q1…"
              className={clsx(inputBase, 'pl-8')}
            />
          </div>
        </Field>

        <Field label="Exchange Rate">
          <input
            {...register('exchange_rate')}
            type="number"
            step="0.0001"
            placeholder="1.0000"
            className={clsx(inputBase, 'font-mono text-right')}
          />
        </Field>
      </div>

      {/* Row 3: Narration — full width */}
      <Field
        label="Narration"
        required
        error={errors.narration?.message}
      >
        <div className="relative">
          <div className="flex items-start gap-2">
            <textarea
              {...register('narration')}
              rows={2}
              placeholder="Being journal entry for… (describe the business purpose)"
              className={clsx(
                'flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
                'hover:border-slate-300 transition-colors placeholder:text-slate-400 resize-none',
                errors.narration && 'border-red-300 bg-red-50/30',
              )}
            />
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowTemplates(s => !s)}
                className={clsx(
                  'flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-lg border transition-colors',
                  showTemplates
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'text-brand-700 border-brand-200 bg-brand-50 hover:bg-brand-100',
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Templates
              </button>
            </div>
          </div>

          {showTemplates && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-0.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide px-2 py-1">
                Narration Templates
              </p>
              {NARRATION_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="w-full text-left text-xs text-slate-600 hover:bg-brand-50 hover:text-brand-700 px-2 py-2 rounded-lg transition-colors"
                >
                  {tpl}
                </button>
              ))}
            </div>
          )}
        </div>
      </Field>
    </div>
  );
}
