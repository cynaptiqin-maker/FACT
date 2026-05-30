import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingAPI } from '@services/api';
import toast from 'react-hot-toast';
import { X, Calendar, Info, Sparkles, CheckSquare } from 'lucide-react';
import clsx from 'clsx';
import { FY_STATUS, generatePeriods, fyLabel } from './fyConstants';

const schema = z.object({
  name:       z.string().min(3, 'Name must be at least 3 characters').max(60),
  start_date: z.string().min(1, 'Start date is required'),
  end_date:   z.string().min(1, 'End date is required'),
  status:     z.enum(['DRAFT', 'ACTIVE', 'OPEN']),
  auto_periods: z.boolean().optional(),
}).refine(d => new Date(d.end_date) > new Date(d.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
});

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inp = (err) => clsx(
  'w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2',
  err ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 hover:border-slate-300 focus:ring-brand-500/20',
);

export default function FYCreateModal({ open, onClose, editFY, onSuccess }) {
  const queryClient = useQueryClient();
  const isEditing   = !!editFY;
  const [preview, setPreview] = useState([]);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', start_date: '', end_date: '', status: 'DRAFT', auto_periods: true },
  });

  const watchStart  = watch('start_date');
  const watchEnd    = watch('end_date');
  const watchAuto   = watch('auto_periods');

  // Auto-name the FY from dates
  useEffect(() => {
    if (watchStart && watchEnd && !isEditing) {
      const s = new Date(watchStart); const e = new Date(watchEnd);
      if (e > s) {
        setValue('name', `FY ${s.getFullYear()}–${String(e.getFullYear()).slice(2)}`);
      }
    }
  }, [watchStart, watchEnd, isEditing, setValue]);

  // Live period preview
  useEffect(() => {
    if (watchStart) {
      setPreview(generatePeriods(watchStart));
    }
  }, [watchStart]);

  // Populate when editing
  useEffect(() => {
    if (editFY) {
      reset({
        name:         editFY.name || fyLabel(editFY),
        start_date:   editFY.start_date?.slice(0, 10) || '',
        end_date:     editFY.end_date?.slice(0, 10)   || '',
        status:       editFY.status || 'DRAFT',
        auto_periods: true,
      });
    } else {
      // Default to current FY start
      const now = new Date();
      const fyStart = now.getMonth() >= 3
        ? new Date(now.getFullYear(), 3, 1)
        : new Date(now.getFullYear() - 1, 3, 1);
      const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31);
      reset({
        name: '', start_date: '', end_date: '', status: 'DRAFT', auto_periods: true,
      });
    }
  }, [editFY, open, reset]);

  const createMutation = useMutation({
    mutationFn: (data) => accountingAPI.createFiscalYear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      toast.success('Fiscal year created');
      onSuccess?.(); onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create fiscal year'),
  });

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const busy = isSubmitting || createMutation.isPending;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {isEditing ? 'Edit Fiscal Year' : 'Create New Fiscal Year'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEditing ? 'Update fiscal year configuration' : 'Set up a new accounting year with auto-generated periods'}
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                {/* FY Name */}
                <Field label="Fiscal Year Name" required error={errors.name?.message} hint="Auto-filled from dates — you can override">
                  <input
                    {...register('name')}
                    placeholder="e.g. FY 2025–26"
                    className={inp(errors.name)}
                  />
                </Field>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start Date" required error={errors.start_date?.message}>
                    <input {...register('start_date')} type="date" className={inp(errors.start_date)} />
                  </Field>
                  <Field label="End Date" required error={errors.end_date?.message}>
                    <input {...register('end_date')} type="date" className={inp(errors.end_date)} />
                  </Field>
                </div>

                {/* Status */}
                <Field label="Initial Status" required error={errors.status?.message}>
                  <select {...register('status')} className={inp(errors.status)}>
                    {['DRAFT', 'ACTIVE', 'OPEN'].map(s => (
                      <option key={s} value={s}>{FY_STATUS[s]?.label || s}</option>
                    ))}
                  </select>
                </Field>

                {/* Auto-generate periods */}
                <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <input
                    {...register('auto_periods')}
                    type="checkbox"
                    id="auto_p"
                    className="rounded border-blue-300 text-brand-600 focus:ring-brand-500/20 mt-0.5"
                  />
                  <div>
                    <label htmlFor="auto_p" className="text-sm font-medium text-blue-800 cursor-pointer">
                      Auto-generate 12 monthly periods
                    </label>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Creates Apr–Mar accounting periods automatically. You can modify them afterwards.
                    </p>
                  </div>
                </div>

                {/* Period preview */}
                {watchAuto && preview.length > 0 && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">Periods that will be created</span>
                    </div>
                    <div className="grid grid-cols-4 gap-px bg-slate-100">
                      {preview.map(p => (
                        <div key={p.id} className="bg-white px-2.5 py-2 text-center">
                          <p className="text-[10px] font-bold text-slate-600">{p.shortName}</p>
                          <p className="text-[9px] text-slate-400">{new Date(p.start_date).getFullYear()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info notice */}
                <div className="flex gap-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                  <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  Only one fiscal year can have status "Active" at a time. Activating this year will not deactivate others automatically.
                </div>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {busy && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isEditing ? 'Update' : 'Create Fiscal Year'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
