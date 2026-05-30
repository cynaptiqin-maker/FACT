import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ChevronRight, Loader2, Sparkles, CheckCircle, BookOpen, Tag, Settings } from 'lucide-react';
import clsx from 'clsx';
import {
  ACCOUNT_TYPES, TYPE_CONFIG, HEALTHCARE_DEPARTMENTS,
  HEALTHCARE_MAPPINGS, CURRENCIES,
} from './coaConstants';

const schema = z.object({
  code: z.string().min(2, 'Account code is required').max(20),
  name: z.string().min(2, 'Account name is required').max(120),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  parent_id: z.string().optional(),
  is_group: z.boolean().default(false),
  description: z.string().max(500).optional(),
  currency: z.string().default('INR'),
  department: z.string().optional(),
  healthcare_mapping: z.string().optional(),
  is_gst_applicable: z.boolean().default(false),
  is_tds_applicable: z.boolean().default(false),
  opening_balance: z.string().optional(),
  normal_balance: z.enum(['DEBIT', 'CREDIT']).optional(),
});

const STEPS = [
  { id: 'basic', label: 'Basic Info', icon: BookOpen },
  { id: 'mapping', label: 'Mapping', icon: Tag },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Step indicator
function StepIndicator({ steps, currentStep }) {
  const currentIdx = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;

        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2">
              <div className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400',
              )}>
                {done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={clsx(
                'text-xs font-medium hidden sm:inline',
                active ? 'text-slate-800' : done ? 'text-emerald-600' : 'text-slate-400',
              )}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={clsx(
                'flex-1 h-px mx-3 transition-colors duration-300',
                idx < currentIdx ? 'bg-emerald-400' : 'bg-slate-200',
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Field wrapper
function Field({ label, error, required, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

// Input styles
const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder:text-slate-400';
const selectCls = `${inputCls} cursor-pointer appearance-none`;

export default function COACreateModal({ onClose, onSuccess, parentAccounts = [], editAccount = null }) {
  const [step, setStep] = useState('basic');
  const stepIdx = STEPS.findIndex((s) => s.id === step);
  const isEdit = !!editAccount;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: editAccount
      ? { ...editAccount, opening_balance: editAccount.opening_balance?.toString() }
      : {
          type: 'ASSET',
          is_group: false,
          is_gst_applicable: false,
          is_tds_applicable: false,
          currency: 'INR',
        },
  });

  const watchType = watch('type');
  const watchIsGroup = watch('is_group');
  const typeCfg = TYPE_CONFIG[watchType] || {};

  // Auto-set normal balance when type changes
  useEffect(() => {
    setValue('normal_balance', typeCfg.normalBalance || 'DEBIT');
  }, [watchType]);

  const onSubmit = async (data) => {
    try {
      if (data.opening_balance) {
        data.opening_balance = parseFloat(data.opening_balance.replace(/,/g, '')) || 0;
      }
      await onSuccess?.(data);
      reset();
      onClose();
    } catch {
      // error handled upstream via toast
    }
  };

  const goNext = () => {
    const nextIdx = Math.min(stepIdx + 1, STEPS.length - 1);
    setStep(STEPS[nextIdx].id);
  };

  const goBack = () => {
    const prevIdx = Math.max(stepIdx - 1, 0);
    setStep(STEPS[prevIdx].id);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 36 }}
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEdit ? 'Edit Account' : 'New Account'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit ? `Updating: ${editAccount.name}` : 'Add a ledger or group to your COA'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="px-6 py-4 border-b border-slate-100">
            <StepIndicator steps={STEPS} currentStep={step} />
          </div>

          {/* Form content */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait">
                {/* ── Step 1: Basic Info ── */}
                {step === 'basic' && (
                  <motion.div
                    key="basic"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {/* Account type selector — visual cards */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">
                        Account Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {ACCOUNT_TYPES.map((type) => {
                          const cfg = TYPE_CONFIG[type];
                          const active = watchType === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setValue('type', type)}
                              className={clsx(
                                'py-2.5 px-1 rounded-xl border-2 text-center transition-all duration-150',
                                active
                                  ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                                  : 'border-slate-200 hover:border-slate-300 text-slate-500',
                              )}
                            >
                              <span className={clsx('block text-[10px] font-bold uppercase', active ? cfg.text : 'text-slate-400')}>
                                {cfg.shortLabel}
                              </span>
                              <span className={clsx('block text-[9px] mt-0.5', active ? cfg.text : 'text-slate-400')}>
                                {cfg.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Account Code" required error={errors.code?.message} hint="e.g. 1010, 3020">
                        <input
                          {...register('code')}
                          placeholder="e.g. 1010"
                          className={clsx(inputCls, 'font-mono')}
                        />
                      </Field>
                      <Field label="Normal Balance">
                        <select {...register('normal_balance')} className={selectCls}>
                          <option value="DEBIT">Debit</option>
                          <option value="CREDIT">Credit</option>
                        </select>
                      </Field>
                    </div>

                    <Field label="Account Name" required error={errors.name?.message}>
                      <input
                        {...register('name')}
                        placeholder="e.g. Cash in Hand"
                        className={inputCls}
                      />
                    </Field>

                    <Field label="Parent Group" hint="Leave blank for a top-level account">
                      <select {...register('parent_id')} className={selectCls}>
                        <option value="">No parent — top level</option>
                        {parentAccounts
                          .filter((a) => a.type === watchType || !a.type)
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} — {a.name}
                            </option>
                          ))}
                      </select>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Currency">
                        <select {...register('currency')} className={selectCls}>
                          {CURRENCIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Opening Balance" hint="Optional, can add later">
                        <input
                          {...register('opening_balance')}
                          placeholder="0.00"
                          type="text"
                          inputMode="decimal"
                          className={clsx(inputCls, 'font-mono')}
                        />
                      </Field>
                    </div>

                    <Field label="Description">
                      <textarea
                        {...register('description')}
                        placeholder="Optional description of this account's purpose"
                        rows={2}
                        className={clsx(inputCls, 'resize-none')}
                      />
                    </Field>

                    {/* Group toggle */}
                    <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Group Account</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Acts as a structural node; cannot post transactions directly</p>
                      </div>
                      <input
                        type="checkbox"
                        {...register('is_group')}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                      />
                    </label>
                  </motion.div>
                )}

                {/* ── Step 2: Mapping ── */}
                {step === 'mapping' && (
                  <motion.div
                    key="mapping"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    <div className="flex items-start gap-2.5 bg-violet-50 border border-violet-200 rounded-xl p-3.5">
                      <Sparkles className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-violet-800">Healthcare Mapping</p>
                        <p className="text-xs text-violet-600 mt-0.5">Map this account to healthcare workflows for accurate departmental reporting and cost allocation.</p>
                      </div>
                    </div>

                    <Field label="Department" hint="Which department does this account belong to?">
                      <select {...register('department')} className={selectCls}>
                        <option value="">Select department…</option>
                        {HEALTHCARE_DEPARTMENTS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Healthcare Module Mapping" hint="Map to a specific clinical or operational workflow">
                      <select {...register('healthcare_mapping')} className={selectCls}>
                        <option value="">None</option>
                        {HEALTHCARE_MAPPINGS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label} ({m.category})</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Branch Applicability" hint="Leave blank to apply to all branches">
                      <select className={selectCls}>
                        <option value="">All Branches</option>
                        <option value="main">Main Hospital</option>
                        <option value="branch1">Branch — Koramangala</option>
                        <option value="branch2">Branch — Whitefield</option>
                      </select>
                    </Field>
                  </motion.div>
                )}

                {/* ── Step 3: Settings ── */}
                {step === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    <p className="text-xs text-slate-500">Configure tax and compliance settings for this account.</p>

                    {[
                      {
                        key: 'is_gst_applicable',
                        label: 'GST Applicable',
                        desc: 'Transactions on this account will be subject to GST',
                        tag: 'Tax',
                        color: 'orange',
                      },
                      {
                        key: 'is_tds_applicable',
                        label: 'TDS Applicable',
                        desc: 'TDS will be deducted on transactions for this account',
                        tag: 'Tax',
                        color: 'sky',
                      },
                    ].map(({ key, label, desc, tag, color }) => (
                      <label key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-700">{label}</p>
                            <span className={`text-[9px] font-bold bg-${color}-50 text-${color}-600 border border-${color}-200 px-1.5 py-0.5 rounded uppercase`}>
                              {tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          {...register(key)}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                        />
                      </label>
                    ))}

                    {/* Summary preview */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200 p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-600 mb-3">Account Summary</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400">Type</span>
                          <p className={clsx('font-semibold mt-0.5', typeCfg.text || 'text-slate-700')}>{typeCfg.label || watchType}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Normal Balance</span>
                          <p className="font-semibold text-slate-700 mt-0.5">{typeCfg.normalBalance || '—'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Account</span>
                          <p className="font-semibold text-slate-700 mt-0.5">{watchIsGroup ? 'Group' : 'Ledger'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Currency</span>
                          <p className="font-semibold text-slate-700 mt-0.5">{watch('currency') || 'INR'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/60">
              <button
                type="button"
                onClick={stepIdx === 0 ? onClose : goBack}
                className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {stepIdx === 0 ? 'Cancel' : '← Back'}
              </button>

              <div className="flex items-center gap-2">
                {/* Step dots */}
                <div className="flex gap-1.5">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.id}
                      className={clsx(
                        'h-1.5 rounded-full transition-all',
                        i === stepIdx ? 'w-4 bg-blue-600' : i < stepIdx ? 'w-1.5 bg-emerald-500' : 'w-1.5 bg-slate-300',
                      )}
                    />
                  ))}
                </div>
              </div>

              {stepIdx < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isEdit ? 'Update Account' : 'Create Account'}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
