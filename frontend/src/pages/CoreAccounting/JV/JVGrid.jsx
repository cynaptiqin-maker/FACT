import React, { useCallback, useEffect, useId } from 'react';
import { useFieldArray, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, Copy } from 'lucide-react';
import clsx from 'clsx';
import JVAccountPicker from './JVAccountPicker';
import { COST_CENTERS } from './jvConstants';

const EMPTY_LINE = () => ({
  account_id: '', account_label: '', account_type: '',
  narration: '', debit: '', credit: '', cost_center_id: '',
});

function fmt(val) {
  const n = parseFloat(val);
  if (!n || isNaN(n)) return null;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

// ── Single grid row ───────────────────────────────────────────────────────────
function GridRow({ index, field, control, register, errors, remove, append, watch, setValue, isLast, totalRows }) {
  const line     = watch(`lines.${index}`);
  const hasDebit  = parseFloat(line?.debit  || 0) > 0;
  const hasCredit = parseFloat(line?.credit || 0) > 0;
  const rowErrors = errors.lines?.[index];
  const hasError  = rowErrors?.account_id || rowErrors?.message;

  const clearCredit = () => setValue(`lines.${index}.credit`, '');
  const clearDebit  = () => setValue(`lines.${index}.debit`,  '');

  const duplicate = () => {
    const cur = watch(`lines.${index}`);
    append({ ...cur, debit: '', credit: '' });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.12 } }}
      transition={{ duration: 0.16 }}
      className={clsx(
        'flex items-center gap-2 px-3 py-2 border-b border-slate-50 group transition-colors',
        hasError    ? 'bg-red-50/40 border-b-red-100' : 'hover:bg-slate-50/70',
        isLast      && 'border-b-0',
      )}
    >
      {/* Row # + drag handle */}
      <div className="w-10 flex items-center gap-0.5 flex-shrink-0">
        <GripVertical className="w-3 h-3 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        <span className="text-[11px] text-slate-400 font-mono w-4 text-right select-none">
          {index + 1}
        </span>
      </div>

      {/* Ledger Account */}
      <div className="flex-1 min-w-[200px]">
        <Controller
          control={control}
          name={`lines.${index}.account_id`}
          render={({ field: f }) => (
            <JVAccountPicker
              value={
                line?.account_id
                  ? { id: line.account_id, label: line.account_label, type: line.account_type }
                  : null
              }
              onChange={(acc) => {
                f.onChange(acc.id);
                setValue(`lines.${index}.account_label`, acc.label);
                setValue(`lines.${index}.account_type`,  acc.type);
              }}
              error={rowErrors?.account_id}
            />
          )}
        />
      </div>

      {/* Description / narration */}
      <div className="w-44 flex-shrink-0">
        <input
          {...register(`lines.${index}.narration`)}
          type="text"
          placeholder="Optional note…"
          className={clsx(
            'w-full h-9 px-2.5 text-sm border border-slate-200 rounded-lg bg-white',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            'hover:border-slate-300 placeholder:text-slate-300 transition-colors',
          )}
        />
      </div>

      {/* Cost Center */}
      <div className="w-[120px] flex-shrink-0">
        <select
          {...register(`lines.${index}.cost_center_id`)}
          className={clsx(
            'w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-slate-300',
            'transition-colors text-slate-600 appearance-none cursor-pointer',
          )}
        >
          <option value="">— None —</option>
          {COST_CENTERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Debit */}
      <div className="w-32 flex-shrink-0">
        <Controller
          control={control}
          name={`lines.${index}.debit`}
          render={({ field: f }) => (
            <input
              value={f.value}
              onChange={(e) => { f.onChange(e); if (e.target.value) clearCredit(); }}
              onBlur={f.onBlur}
              type="number"
              step="0.01"
              min="0"
              placeholder="—"
              className={clsx(
                'w-full h-9 px-2.5 text-sm text-right font-mono border rounded-lg',
                'focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-300 transition-all',
                hasDebit
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold focus:ring-emerald-400'
                  : 'border-slate-200 bg-white hover:border-slate-300 focus:ring-brand-500',
              )}
            />
          )}
        />
      </div>

      {/* Credit */}
      <div className="w-32 flex-shrink-0">
        <Controller
          control={control}
          name={`lines.${index}.credit`}
          render={({ field: f }) => (
            <input
              value={f.value}
              onChange={(e) => { f.onChange(e); if (e.target.value) clearDebit(); }}
              onBlur={f.onBlur}
              type="number"
              step="0.01"
              min="0"
              placeholder="—"
              className={clsx(
                'w-full h-9 px-2.5 text-sm text-right font-mono border rounded-lg',
                'focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-300 transition-all',
                hasCredit
                  ? 'border-red-300 bg-red-50 text-red-800 font-bold focus:ring-red-400'
                  : 'border-slate-200 bg-white hover:border-slate-300 focus:ring-brand-500',
              )}
            />
          )}
        />
      </div>

      {/* Row actions */}
      <div className="w-14 flex items-center justify-end gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={duplicate}
          title="Duplicate row"
          className="p-1.5 rounded-md text-slate-300 hover:text-brand-500 hover:bg-brand-50 transition-colors"
        >
          <Copy className="w-3 h-3" />
        </button>
        {totalRows > 2 && (
          <button
            type="button"
            onClick={() => remove(index)}
            title="Delete row (Alt+D)"
            className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main grid ─────────────────────────────────────────────────────────────────
export default function JVGrid({ control, register, errors, watch, setValue }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = watch('lines') || [];

  const totalDebit  = lines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const diff        = Math.abs(totalDebit - totalCredit);
  const isBalanced  = diff < 0.005 && totalDebit > 0;
  const hasActivity = totalDebit > 0 || totalCredit > 0;

  const addLine = useCallback(() => append(EMPTY_LINE()), [append]);

  // Alt+N → add line
  useEffect(() => {
    const h = (e) => { if (e.altKey && e.key === 'n') { e.preventDefault(); addLine(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [addLine]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">

      {/* Column headers */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="w-10 flex-shrink-0" />
        <div className="flex-1 min-w-[200px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ledger Account</span>
        </div>
        <div className="w-44 flex-shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</span>
        </div>
        <div className="w-[120px] flex-shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cost Center</span>
        </div>
        <div className="w-32 flex-shrink-0 text-right">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Debit ₹</span>
        </div>
        <div className="w-32 flex-shrink-0 text-right">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Credit ₹</span>
        </div>
        <div className="w-14 flex-shrink-0" />
      </div>

      {/* Rows */}
      <div>
        <AnimatePresence initial={false}>
          {fields.map((field, idx) => (
            <GridRow
              key={field.id}
              index={idx}
              field={field}
              control={control}
              register={register}
              errors={errors}
              remove={remove}
              append={append}
              watch={watch}
              setValue={setValue}
              isLast={idx === fields.length - 1}
              totalRows={fields.length}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer: add line + totals */}
      <div className="flex items-center justify-between px-3 py-3 bg-slate-50/60 border-t border-slate-100">

        {/* Add line */}
        <button
          type="button"
          onClick={addLine}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Line
          <kbd className="ml-1 text-[9px] font-mono text-slate-400 bg-white border border-slate-200 px-1 rounded">Alt+N</kbd>
        </button>

        {/* Totals + balance badge */}
        <div className="flex items-center gap-5">
          <TotalCol label="Total Debit" value={totalDebit} color="emerald" />
          <TotalCol label="Total Credit" value={totalCredit} color="red" />

          <div className={clsx(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all',
            isBalanced
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : hasActivity
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-400 border-slate-200',
          )}>
            {isBalanced
              ? '✓ Balanced'
              : hasActivity
                ? `Diff ₹${diff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : 'No entries yet'}
          </div>
        </div>
      </div>
    </div>
  );
}

function TotalCol({ label, value, color }) {
  const colors = {
    emerald: 'text-emerald-700',
    red:     'text-red-600',
  };
  return (
    <div className="text-right">
      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">{label}</p>
      <p className={clsx('text-sm font-bold font-mono', value > 0 ? colors[color] : 'text-slate-300')}>
        {value > 0 ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
      </p>
    </div>
  );
}
