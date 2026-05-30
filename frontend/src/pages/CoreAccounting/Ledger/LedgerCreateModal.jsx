import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingAPI } from '@services/api';
import toast from 'react-hot-toast';
import {
  X, ChevronDown, ChevronUp, Sparkles, Info,
  BookOpen, DollarSign, Receipt, Phone, Settings2,
} from 'lucide-react';
import clsx from 'clsx';
import { GROUP_OPTIONS, CURRENCY_OPTIONS, TYPE_CONFIG } from './ledgerConstants';

// ─── Zod schema ───────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  alias: z.string().max(80).optional().or(z.literal('')),
  code: z.string().max(20).optional().or(z.literal('')),
  parent_name: z.string().min(1, 'Group is required'),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  opening_balance: z.string().optional().or(z.literal('')),
  normal_balance: z.enum(['Dr', 'Cr']).optional(),
  currency: z.string().default('INR'),
  credit_limit: z.string().optional().or(z.literal('')),
  gstin: z.string().max(15).optional().or(z.literal('')),
  pan: z.string().max(10).optional().or(z.literal('')),
  tds_applicable: z.boolean().optional(),
  contact_person: z.string().max(80).optional().or(z.literal('')),
  phone: z.string().max(15).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  is_frozen: z.boolean().optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
});

// ─── Section accordion ────────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, open, onToggle, children }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">{title}</p>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4 border-t border-slate-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Form field helpers ───────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (hasError) => clsx(
  'w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2',
  hasError
    ? 'border-red-300 focus:ring-red-500/20'
    : 'border-slate-200 hover:border-slate-300 focus:ring-brand-500/20',
);

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function LedgerCreateModal({ open, onClose, editAccount, onSuccess }) {
  const queryClient = useQueryClient();
  const isEditing = !!editAccount;

  const [sections, setSections] = useState({
    basic: true,
    financial: true,
    tax: false,
    contact: false,
    advanced: false,
  });

  const toggleSection = (key) => setSections(s => ({ ...s, [key]: !s[key] }));

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', alias: '', code: '', parent_name: '', type: 'asset',
      opening_balance: '', normal_balance: 'Dr', currency: 'INR',
      credit_limit: '', gstin: '', pan: '', tds_applicable: false,
      contact_person: '', phone: '', email: '', address: '',
      is_frozen: false, notes: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editAccount) {
      reset({
        name: editAccount.name || '',
        alias: editAccount.alias || '',
        code: editAccount.code || '',
        parent_name: editAccount.parent_name || '',
        type: editAccount.type || 'asset',
        opening_balance: editAccount.opening_balance != null ? String(editAccount.opening_balance) : '',
        normal_balance: editAccount.normal_balance || 'Dr',
        currency: editAccount.currency || 'INR',
        credit_limit: editAccount.credit_limit != null ? String(editAccount.credit_limit) : '',
        gstin: editAccount.gstin || '',
        pan: editAccount.pan || '',
        tds_applicable: editAccount.tds_applicable || false,
        contact_person: editAccount.contact_person || '',
        phone: editAccount.phone || '',
        email: editAccount.email || '',
        address: editAccount.address || '',
        is_frozen: editAccount.is_frozen || false,
        notes: editAccount.notes || '',
      });
    } else {
      reset({ name: '', alias: '', code: '', parent_name: '', type: 'asset', currency: 'INR', normal_balance: 'Dr' });
    }
  }, [editAccount, reset, open]);

  // Auto-set normal_balance when type changes
  const watchedType = watch('type');
  useEffect(() => {
    const cfg = TYPE_CONFIG[watchedType];
    if (cfg?.normalBalance) setValue('normal_balance', cfg.normalBalance);
  }, [watchedType, setValue]);

  const createMutation = useMutation({
    mutationFn: (data) => accountingAPI.createAccount({ ...data, is_group: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-management'] });
      toast.success('Ledger created successfully');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create ledger');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => accountingAPI.updateAccount(editAccount.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-management'] });
      toast.success('Ledger updated successfully');
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update ledger');
    },
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      opening_balance: data.opening_balance ? parseFloat(data.opening_balance) : 0,
      credit_limit: data.credit_limit ? parseFloat(data.credit_limit) : null,
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const busy = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {isEditing ? 'Edit Ledger' : 'Create New Ledger'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEditing ? 'Update ledger details below' : 'Add a new account to your chart of accounts'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-xs font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Suggest
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

                {/* Basic information */}
                <Section icon={BookOpen} title="Basic Information" subtitle="Name, code and group" open={sections.basic} onToggle={() => toggleSection('basic')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="Ledger Name" required error={errors.name?.message}>
                        <input {...register('name')} placeholder="e.g. Trade Receivables - ABC Ltd" className={inputCls(!!errors.name)} />
                      </Field>
                    </div>
                    <Field label="Alias / Short Name" error={errors.alias?.message} hint="Optional alternate name">
                      <input {...register('alias')} placeholder="e.g. ABC Ltd" className={inputCls(!!errors.alias)} />
                    </Field>
                    <Field label="Ledger Code" error={errors.code?.message} hint="Auto-generated if blank">
                      <input {...register('code')} placeholder="e.g. TRA-001" className={inputCls(!!errors.code)} />
                    </Field>
                    <Field label="Account Type" required error={errors.type?.message}>
                      <select {...register('type')} className={inputCls(!!errors.type)}>
                        {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Under Group" required error={errors.parent_name?.message}>
                      <select {...register('parent_name')} className={inputCls(!!errors.parent_name)}>
                        <option value="">Select group…</option>
                        {GROUP_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </Field>
                  </div>
                </Section>

                {/* Financial details */}
                <Section icon={DollarSign} title="Financial Details" subtitle="Balance, currency, limits" open={sections.financial} onToggle={() => toggleSection('financial')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Opening Balance" error={errors.opening_balance?.message} hint="As of financial year start">
                      <input {...register('opening_balance')} type="number" step="0.01" placeholder="0.00" className={inputCls(!!errors.opening_balance)} />
                    </Field>
                    <Field label="Normal Balance" error={errors.normal_balance?.message}>
                      <select {...register('normal_balance')} className={inputCls(!!errors.normal_balance)}>
                        <option value="Dr">Debit (Dr)</option>
                        <option value="Cr">Credit (Cr)</option>
                      </select>
                    </Field>
                    <Field label="Currency" error={errors.currency?.message}>
                      <select {...register('currency')} className={inputCls(!!errors.currency)}>
                        {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Credit Limit" error={errors.credit_limit?.message} hint="0 = no limit">
                      <input {...register('credit_limit')} type="number" step="0.01" placeholder="0.00" className={inputCls(!!errors.credit_limit)} />
                    </Field>
                  </div>
                </Section>

                {/* Tax information */}
                <Section icon={Receipt} title="Tax Information" subtitle="GSTIN, PAN, TDS" open={sections.tax} onToggle={() => toggleSection('tax')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="GSTIN" error={errors.gstin?.message}>
                      <input {...register('gstin')} placeholder="22AAAAA0000A1Z5" className={inputCls(!!errors.gstin)} maxLength={15} />
                    </Field>
                    <Field label="PAN" error={errors.pan?.message}>
                      <input {...register('pan')} placeholder="AAAAA0000A" className={inputCls(!!errors.pan)} maxLength={10} />
                    </Field>
                    <div className="sm:col-span-2 flex items-center gap-3">
                      <input
                        {...register('tds_applicable')}
                        type="checkbox"
                        id="tds"
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                      />
                      <label htmlFor="tds" className="text-sm text-slate-700">TDS Applicable</label>
                    </div>
                  </div>
                </Section>

                {/* Contact information */}
                <Section icon={Phone} title="Contact Information" subtitle="Person, email, address" open={sections.contact} onToggle={() => toggleSection('contact')}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Contact Person" error={errors.contact_person?.message}>
                      <input {...register('contact_person')} placeholder="Full name" className={inputCls(!!errors.contact_person)} />
                    </Field>
                    <Field label="Phone" error={errors.phone?.message}>
                      <input {...register('phone')} placeholder="+91 98765 43210" className={inputCls(!!errors.phone)} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Email" error={errors.email?.message}>
                        <input {...register('email')} type="email" placeholder="accounts@company.com" className={inputCls(!!errors.email)} />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Address" error={errors.address?.message}>
                        <textarea {...register('address')} rows={2} placeholder="Street, City, State, PIN" className={inputCls(!!errors.address) + ' resize-none'} />
                      </Field>
                    </div>
                  </div>
                </Section>

                {/* Advanced */}
                <Section icon={Settings2} title="Advanced" subtitle="Freeze, budget, notes" open={sections.advanced} onToggle={() => toggleSection('advanced')}>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          {...register('is_frozen')}
                          type="checkbox"
                          id="frozen"
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500/30 mt-0.5"
                        />
                        <div>
                          <label htmlFor="frozen" className="text-sm font-medium text-amber-800">Freeze this ledger</label>
                          <p className="text-xs text-amber-600 mt-0.5">No new transactions will be allowed</p>
                        </div>
                      </div>
                    </div>
                    <Field label="Internal Notes" error={errors.notes?.message}>
                      <textarea
                        {...register('notes')}
                        rows={3}
                        placeholder="Any notes for accountants…"
                        className={inputCls(!!errors.notes) + ' resize-none'}
                      />
                    </Field>
                  </div>
                </Section>

              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                <p className="text-xs text-slate-400">
                  <Info className="w-3 h-3 inline mr-0.5" />
                  Changes are reflected immediately in trial balance
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {busy && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {isEditing ? 'Update Ledger' : 'Create Ledger'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
