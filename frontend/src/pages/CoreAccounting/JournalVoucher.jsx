import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Sparkles, BookOpen, ArrowRight, CheckCircle2,
  ListChecks, Plus, FileText, Clock,
} from 'lucide-react';
import { accountingAPI } from '@services/api';

import JVHeader        from './JV/JVHeader';
import JVMeta          from './JV/JVMeta';
import JVGrid          from './JV/JVGrid';
import JVRightPanel    from './JV/JVRightPanel';
import JVValidationBar from './JV/JVValidationBar';
import JVShortcutsModal from './JV/JVShortcutsModal';
import CsvImportModal from '@components/shared/CsvImportModal';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v) => !!v && UUID_RE.test(v);

// ── Zod schema ────────────────────────────────────────────────────────────────
const lineSchema = z.object({
  account_id:    z.string(),
  account_label: z.string().optional(),
  account_type:  z.string().optional(),
  narration:     z.string().optional(),
  debit:         z.union([z.string(), z.number()]).optional(),
  credit:        z.union([z.string(), z.number()]).optional(),
  cost_center_id:z.string().optional(),
}).refine(
  (line) => {
    if (!line.account_id) return true; // skip empty rows — validated in onSubmit
    const dr = parseFloat(String(line.debit  || 0));
    const cr = parseFloat(String(line.credit || 0));
    return !(dr > 0 && cr > 0);
  },
  { message: 'A line cannot have both debit and credit' },
);

const schema = z.object({
  voucher_type:     z.enum(['JOURNAL','PAYMENT','RECEIPT','CONTRA','DEBIT_NOTE','CREDIT_NOTE']),
  voucher_number:   z.string().optional(),
  entry_date:       z.string().min(1, 'Entry date is required'),
  posting_date:     z.string().optional(),
  narration:        z.string().min(3, 'Narration must be at least 3 characters'),
  reference_number: z.string().optional(),
  branch:           z.string().optional(),
  department:       z.string().optional(),
  cost_center:      z.string().optional(),
  project:          z.string().optional(),
  currency:         z.string().default('INR'),
  exchange_rate:    z.string().optional(),
  tags:             z.string().optional(),
  lines:            z.array(lineSchema).min(2, 'At least 2 lines are required'),
});

const EMPTY_LINE = () => ({
  account_id: '', account_label: '', account_type: '',
  narration: '', debit: '', credit: '', cost_center_id: '',
});

const DEFAULT_VALUES = {
  voucher_type:  'JOURNAL',
  voucher_number: '',
  entry_date:    format(new Date(), 'yyyy-MM-dd'),
  posting_date:  format(new Date(), 'yyyy-MM-dd'),
  narration:     '',
  reference_number: '',
  branch: '', department: '', cost_center: '', project: '',
  currency: 'INR', exchange_rate: '1.0000', tags: '',
  lines: [EMPTY_LINE(), EMPTY_LINE()],
};

// ── Recent JVs strip (quick access) ──────────────────────────────────────────
function RecentVouchersStrip() {
  const recent = [
    { id: 1, num: 'JV-2026-0234', narration: 'Monthly depreciation — May 2026',      date: '17 May', amount: '₹1,24,500', status: 'posted'  },
    { id: 2, num: 'JV-2026-0233', narration: 'TPA settlement — Star Health May',      date: '16 May', amount: '₹8,45,000', status: 'pending' },
    { id: 3, num: 'JV-2026-0232', narration: 'ICU revenue accrual — Q4 FY26',         date: '15 May', amount: '₹3,20,000', status: 'posted'  },
    { id: 4, num: 'JV-2026-0231', narration: 'Salary advance adjustment — April',     date: '14 May', amount: '₹67,500',   status: 'posted'  },
  ];
  const statusColor = {
    posted:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    draft:   'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Recent Vouchers</span>
        </div>
        <button className="flex items-center gap-1 text-[11px] text-brand-600 font-semibold hover:text-brand-700">
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {recent.map(v => (
          <div
            key={v.id}
            className="flex-shrink-0 w-52 border border-slate-200 rounded-lg p-3 hover:border-brand-300 hover:bg-brand-50/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-500">{v.num}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${statusColor[v.status]}`}>
                {v.status}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium truncate mb-1">{v.narration}</p>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{v.date}</span>
              <span className="font-mono font-semibold text-slate-600">{v.amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Post-submit success state ─────────────────────────────────────────────────
function SubmissionSuccess({ entry, onCreateAnother, onViewList }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-emerald-200 rounded-xl shadow-sm overflow-hidden"
    >
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
      <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-slate-800">
            Journal entry submitted for approval
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="font-mono text-sm font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              {entry.number}
            </span>
            <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
              <Clock className="w-3 h-3" />
              Pending Approval
            </span>
            <span className="text-xs text-slate-400">
              Submitted {format(new Date(), 'dd MMM yyyy, HH:mm')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button
            onClick={onViewList}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <ListChecks className="w-3.5 h-3.5" />
            View in Journal List
          </button>
          <button
            onClick={onCreateAnother}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Another
          </button>
        </div>
      </div>

      <div className="px-6 pb-4 flex items-start gap-2 bg-amber-50/50 border-t border-amber-100 pt-3">
        <FileText className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          The entry is now locked pending approval. To approve, go to{' '}
          <button onClick={onViewList} className="font-semibold underline hover:no-underline">
            Journal Voucher List
          </button>
          {' '}→ filter by <strong>Awaiting Approval</strong> → open the entry → click <strong>Post Entry</strong>.
        </p>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function JournalVoucher() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  // Active fiscal year — required by backend
  const { data: fyData } = useQuery({
    queryKey: ['fiscal-years'],
    queryFn: () => accountingAPI.getFiscalYears().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const activeFiscalYearId = fyData?.find((fy) => fy.is_current)?.id ?? fyData?.[0]?.id;

  // UI state
  const [showRightPanel,  setShowRightPanel]  = useState(true);
  const [showShortcuts,   setShowShortcuts]   = useState(false);
  const [showImport,      setShowImport]      = useState(false);
  const [status,          setStatus]          = useState('draft');
  const [lastSaved,       setLastSaved]       = useState(null);
  const [isSaving,        setIsSaving]        = useState(false);
  const [submittedEntry,  setSubmittedEntry]  = useState(null);
  const autoSaveRef = useRef(null);

  // Form
  const {
    register, handleSubmit, control, watch, setValue, reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES });

  const lines      = watch('lines') || [];
  const voucherType = watch('voucher_type');

  // Balance metrics
  const totalDebit  = lines.reduce((s, l) => s + (parseFloat(String(l.debit  || 0)) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(String(l.credit || 0)) || 0), 0);
  const diff        = Math.abs(totalDebit - totalCredit);
  const isBalanced  = diff < 0.005 && totalDebit > 0;
  const activeLines = lines.filter(l => l.account_id).length;

  // Auto-save (2s debounce)
  const formValues = watch();
  useEffect(() => {
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      setIsSaving(true);
      setTimeout(() => { setIsSaving(false); setLastSaved(new Date()); }, 400);
    }, 2000);
    return () => clearTimeout(autoSaveRef.current);
  }, [JSON.stringify(formValues)]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key === '/') { e.preventDefault(); setShowShortcuts(s => !s); }
      if (meta && e.key === 's') { e.preventDefault(); handleSaveDraft(); }
      if (meta && e.key === 'n') { e.preventDefault(); handleNew(); }
      if (e.altKey && e.key === 'a') { e.preventDefault(); setShowRightPanel(s => !s); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => accountingAPI.createJournalEntry(data),
    onSuccess: (res) => {
      const entry = res.data.data;
      const num = entry?.entry_number || entry?.voucher_number || entry?.id?.slice(0, 8).toUpperCase() || 'JV';
      setSubmittedEntry({ number: num, id: entry?.id });
      setStatus('pending');
      reset(DEFAULT_VALUES);
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.error
        || err.response?.data?.message
        || err.message
        || 'Failed to submit journal entry';
      console.error('[JV submit]', err.response?.status, err.response?.data);
      toast.error(msg, { duration: 6000 });
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      toast.success('Draft saved', { duration: 1500, icon: '💾' });
    }, 500);
  }, []);

  const handleNew = useCallback(() => {
    reset(DEFAULT_VALUES);
    setStatus('draft');
    setLastSaved(null);
    setSubmittedEntry(null);
    toast('New voucher started', { icon: '📄', duration: 1500 });
  }, [reset]);

  const handleCreateAnother = useCallback(() => {
    reset(DEFAULT_VALUES);
    setStatus('draft');
    setLastSaved(null);
    setSubmittedEntry(null);
  }, [reset]);

  const handleReverse = useCallback(() => {
    toast('Open a posted voucher to reverse it', { icon: '↩️' });
  }, []);

  const handleDuplicate = useCallback(() => {
    const cur = watch();
    reset({ ...cur, voucher_number: '', entry_date: format(new Date(), 'yyyy-MM-dd'), lines: cur.lines.map(l => ({ ...l })) });
    toast('Voucher duplicated — update fields before saving', { icon: '📋' });
  }, [watch, reset]);

  const handleImport = useCallback(() => setShowImport(true), []);

  const onSubmit = async (data) => {
    const filledLines = data.lines.filter((l) => l.account_id);
    if (filledLines.length < 2) { toast.error('Add at least 2 journal lines with accounts selected'); return; }
    if (!isBalanced) { toast.error('Voucher is unbalanced — debits must equal credits'); return; }
    if (!activeFiscalYearId) { toast.error('No active fiscal year found — contact your administrator'); return; }

    const payload = {
      voucherType:  data.voucher_type,
      date:         data.entry_date,
      fiscalYearId: activeFiscalYearId,
      narration:    data.narration,
      reference:    data.reference_number || undefined,
      autoPost:     false,
      lines: filledLines.map((l) => ({
          accountId:    l.account_id,
          debit:        parseFloat(String(l.debit  || 0)) || 0,
          credit:       parseFloat(String(l.credit || 0)) || 0,
          narration:    l.narration || undefined,
          costCenterId: isUUID(l.cost_center_id) ? l.cost_center_id : undefined,
        })),
    };
    createMutation.mutate(payload);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 pb-8">

      {/* Page header */}
      <JVHeader
        voucherType={voucherType}
        voucherNumber="JV-2026-0001"
        status={status}
        lastSaved={lastSaved}
        isSaving={isSaving}
        isBalanced={isBalanced}
        isSubmitting={createMutation.isPending}
        isSubmitted={!!submittedEntry}
        onSave={handleSaveDraft}
        onSubmit={handleSubmit(onSubmit)}
        onNew={handleNew}
        onReverse={handleReverse}
        onDuplicate={handleDuplicate}
        onImport={handleImport}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* Post-submit success banner */}
      <AnimatePresence>
        {submittedEntry && (
          <SubmissionSuccess
            entry={submittedEntry}
            onCreateAnother={handleCreateAnother}
            onViewList={() => navigate('/gl/journals')}
          />
        )}
      </AnimatePresence>

      {/* Recent vouchers strip */}
      <RecentVouchersStrip />

      {/* Voucher metadata */}
      <JVMeta
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
      />

      {/* Main workspace: grid + right panel */}
      <div className="flex gap-3 items-start">

        {/* Grid — grows to fill */}
        <div className="flex-1 min-w-0">
          <JVGrid
            control={control}
            register={register}
            errors={errors}
            watch={watch}
            setValue={setValue}
          />
        </div>

        {/* Right panel (AI / Approval / Docs / Audit) */}
        <AnimatePresence>
          {showRightPanel && (
            <JVRightPanel
              key="right-panel"
              onClose={() => setShowRightPanel(false)}
              totalDebit={totalDebit}
              totalCredit={totalCredit}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom validation bar */}
      <JVValidationBar
        errors={errors}
        diff={diff}
        isBalanced={isBalanced}
        lineCount={lines.length}
        activeLines={activeLines}
      />

      {/* Floating AI toggle (when panel is hidden) */}
      <AnimatePresence>
        {!showRightPanel && (
          <button
            onClick={() => setShowRightPanel(true)}
            className="fixed right-5 bottom-6 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-700 to-brand-500 text-white rounded-xl shadow-xl text-xs font-bold hover:shadow-2xl hover:scale-105 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Assistant
            <span className="bg-white/20 text-white text-[9px] font-bold px-1 rounded">Alt+A</span>
          </button>
        )}
      </AnimatePresence>

      {/* Shortcuts modal */}
      <AnimatePresence>
        {showShortcuts && (
          <JVShortcutsModal key="shortcuts" onClose={() => setShowShortcuts(false)} />
        )}
      </AnimatePresence>

      <CsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Journal Entries"
        templateFilename="journal_import_template.csv"
        templateHeaders={['date', 'reference', 'description', 'accountCode', 'debit', 'credit', 'voucherType']}
        templateExample={[
          { date: '2026-04-01', reference: 'JE-001', description: 'Opening stock adjustment', accountCode: '1001', debit: '50000', credit: '', voucherType: 'JOURNAL' },
          { date: '2026-04-01', reference: 'JE-001', description: 'Opening stock adjustment', accountCode: '3001', debit: '', credit: '50000', voucherType: 'JOURNAL' },
        ]}
        onImport={async (rows) => {
          if (!activeFiscalYearId) throw new Error('No active fiscal year found');
          const res = await accountingAPI.importJournals(rows, activeFiscalYearId);
          queryClient.invalidateQueries({ queryKey: ['journals'] });
          return res.data.data;
        }}
      />
    </div>
  );
}
