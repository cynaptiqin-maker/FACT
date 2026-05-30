import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingAPI } from '@services/api';
import toast from 'react-hot-toast';
import {
  X, CheckCircle, Clock, Lock, AlertTriangle,
  ChevronRight, PlayCircle, ShieldCheck, Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import { fyLabel, YEAR_END_STEPS } from './fyConstants';

// ─── Step row ─────────────────────────────────────────────────────────────────
function StepRow({ step, stepState }) {
  const isComplete = stepState === 'done';
  const isRunning  = stepState === 'running';
  const isBlocked  = stepState === 'blocked';
  const isPending  = stepState === 'pending';
  const isLocked   = stepState === 'locked';

  return (
    <div className={clsx(
      'flex items-start gap-3 p-3.5 rounded-xl border transition-all',
      isComplete ? 'bg-emerald-50 border-emerald-200' :
      isRunning  ? 'bg-blue-50 border-blue-300 shadow-sm' :
      isBlocked  ? 'bg-red-50 border-red-200' :
      isPending  ? 'bg-amber-50 border-amber-200' :
                   'bg-slate-50 border-slate-200 opacity-60',
    )}>
      {/* Step indicator */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
        isComplete ? 'bg-emerald-500 text-white' :
        isRunning  ? 'bg-blue-500 text-white' :
        isBlocked  ? 'bg-red-400 text-white' :
        isPending  ? 'bg-amber-500 text-white' :
                     'bg-slate-300 text-white',
      )}>
        {isComplete ? <CheckCircle className="w-4 h-4" /> :
         isRunning  ? <Loader2 className="w-4 h-4 animate-spin" /> :
         isBlocked  ? <AlertTriangle className="w-4 h-4" /> :
         isLocked   ? <Lock className="w-4 h-4" /> :
                      step.id}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-semibold', isLocked ? 'text-slate-400' : 'text-slate-700')}>
          {step.label}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
        {isRunning && (
          <div className="mt-2 w-full h-1 bg-blue-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          </div>
        )}
        {isBlocked && (
          <p className="text-xs text-red-600 mt-1 font-medium">Blocked: unresolved issues detected</p>
        )}
      </div>

      {/* Status badge */}
      <span className={clsx(
        'text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
        isComplete ? 'text-emerald-700 bg-emerald-100' :
        isRunning  ? 'text-blue-700 bg-blue-100' :
        isBlocked  ? 'text-red-600 bg-red-100' :
        isPending  ? 'text-amber-700 bg-amber-100' :
                     'text-slate-400 bg-slate-100',
      )}>
        {isComplete ? 'Done' : isRunning ? 'Running…' : isBlocked ? 'Blocked' : isPending ? 'Ready' : 'Waiting'}
      </span>
    </div>
  );
}

export default function FYYearEndModal({ open, fy, onClose }) {
  const queryClient = useQueryClient();

  // Step states: done | running | pending | blocked | locked
  const [stepStates, setStepStates] = useState({
    1: 'done', 2: 'done', 3: 'pending', 4: 'locked', 5: 'locked', 6: 'locked', 7: 'locked',
  });
  const [stage, setStage] = useState('ready'); // ready | running | done | error
  const [currentStep, setCurrentStep] = useState(null);

  const closeMutation = useMutation({
    mutationFn: () => accountingAPI.closeFiscalYear(fy.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      toast.success(`${fyLabel(fy)} closed successfully`);
      setStage('done');
    },
    onError: (e) => {
      setStage('error');
      toast.error(e.response?.data?.message || 'Year-end process failed');
    },
  });

  const runProcess = async () => {
    setStage('running');
    const steps = [3, 4, 5, 6, 7];
    for (const sid of steps) {
      setCurrentStep(sid);
      setStepStates(prev => ({ ...prev, [sid]: 'running' }));
      await new Promise(r => setTimeout(r, 1800));
      setStepStates(prev => ({ ...prev, [sid]: 'done' }));
    }
    closeMutation.mutate();
  };

  const completedCount = Object.values(stepStates).filter(s => s === 'done').length;
  const totalSteps     = YEAR_END_STEPS.length;
  const pct            = Math.round((completedCount / totalSteps) * 100);

  return (
    <AnimatePresence>
      {open && fy && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
            onClick={stage !== 'running' ? onClose : undefined}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className={clsx(
              'flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0',
              stage === 'done' ? 'bg-emerald-50' : stage === 'error' ? 'bg-red-50' : '',
            )}>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {stage === 'done' ? '✓ Year-End Complete' : stage === 'error' ? '✗ Process Failed' : 'Year-End Closing Process'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{fyLabel(fy)}</p>
              </div>
              <button
                onClick={onClose}
                disabled={stage === 'running'}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-100 flex-shrink-0">
              <motion.div
                className={clsx('h-full rounded-r-full', stage === 'done' ? 'bg-emerald-500' : stage === 'error' ? 'bg-red-500' : 'bg-amber-500')}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2.5">
              {YEAR_END_STEPS.map(step => (
                <StepRow key={step.id} step={step} stepState={stepStates[step.id] || 'locked'} />
              ))}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              {stage === 'done' ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-sm font-semibold">Fiscal year successfully closed and locked.</span>
                  </div>
                  <button onClick={onClose} className="px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-800 transition-colors">
                    Done
                  </button>
                </div>
              ) : stage === 'error' ? (
                <div className="flex items-center gap-3">
                  <p className="flex-1 text-sm text-red-600 font-medium">Process failed. Review errors above.</p>
                  <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                    Close
                  </button>
                </div>
              ) : stage === 'running' ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <p className="text-sm text-slate-600 font-medium flex-1">Processing year-end… Do not close this window.</p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">
                      Steps 1–2 completed · Steps 3–7 will run in sequence. This cannot be undone.
                    </p>
                  </div>
                  <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={runProcess}
                    className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" /> Run Year-End
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
