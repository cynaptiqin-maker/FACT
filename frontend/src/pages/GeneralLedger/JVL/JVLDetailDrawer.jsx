import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  X, Edit2, RotateCcw, Copy, GitFork, Paperclip, ExternalLink,
  CheckCircle2, Clock, XCircle, AlertTriangle, FileText,
  Building2, CalendarDays, User, Layers, TrendingUp, Upload, Loader2,
} from 'lucide-react';
import { accountingAPI } from '@services/api';
import {
  VOUCHER_TYPES, POSTING_STATUS, APPROVAL_STATUS, RECON_STATUS,
  formatINR, formatDate, formatRelative,
} from './jvlConstants';

function Badge({ map, value }) {
  const cfg = map[value] || {};
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label || value}</span>;
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-gray-100 dark:border-gray-800/70 last:border-0">
      <Icon className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
      <span className="text-xs text-gray-400 dark:text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-700 dark:text-gray-200 font-medium flex-1">{value}</span>
    </div>
  );
}

export default function JVLDetailDrawer({ entry, onClose, onPosted }) {
  if (!entry) return null;
  const queryClient = useQueryClient();
  const vtCfg = VOUCHER_TYPES[entry.type] || {};
  const balanceDiff = Math.abs(entry.debit - entry.credit);
  const isBalanced = balanceDiff < 0.01;
  const canPost = entry.postingStatus !== 'posted' && entry.postingStatus !== 'reversed' && isBalanced;

  const { data: fullEntry, isLoading: linesLoading } = useQuery({
    queryKey: ['journal-entry', entry.id],
    queryFn: async () => {
      const res = await accountingAPI.getJournalEntry(entry.id);
      return res.data?.data;
    },
    enabled: !!entry.id,
    staleTime: 60_000,
  });

  const lineItems = (fullEntry?.lines || []).map((l) => ({
    account:     l.accountName  || '',
    accountCode: l.accountCode  || '',
    costCenter:  '—',
    debit:       parseFloat(l.debit)   || 0,
    credit:      parseFloat(l.credit)  || 0,
  }));

  const postMutation = useMutation({
    mutationFn: () => accountingAPI.postJournalEntry(entry.id),
    onSuccess: () => {
      toast.success(`${entry.voucherNumber} posted to General Ledger`);
      queryClient.invalidateQueries({ queryKey: ['journal-vouchers'] });
      onPosted?.(entry.id);
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to post entry';
      toast.error(msg);
    },
  });

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      className="w-[400px] flex-shrink-0 border-l border-gray-200 dark:border-[#1e3045] bg-white dark:bg-[#162030] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-start justify-between gap-2 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-[#1C3741] dark:text-sky-400 flex-shrink-0" />
            <span className="font-mono text-sm font-bold text-[#1C3741] dark:text-sky-300 truncate">
              {entry.voucherNumber}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${vtCfg.cls}`}>
              {vtCfg.label}
            </span>
            <Badge map={POSTING_STATUS} value={entry.postingStatus} />
            <Badge map={APPROVAL_STATUS} value={entry.approvalStatus} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Post Entry — primary action for approvers */}
      {canPost && (
        <div className="flex-shrink-0 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-amber-50/60 dark:bg-amber-900/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Awaiting approval</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400">Review the entry below, then post to GL</p>
              </div>
            </div>
            <button
              onClick={() => postMutation.mutate()}
              disabled={postMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
            >
              {postMutation.isPending
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Posting…</>
                : <><Upload className="h-3.5 w-3.5" />Post Entry</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Secondary actions */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a2840]/40">
        {[
          { icon: Edit2, label: 'Edit' },
          { icon: RotateCcw, label: 'Reverse' },
          { icon: Copy, label: 'Duplicate' },
          { icon: GitFork, label: 'Audit Trail' },
          { icon: Paperclip, label: 'Attachments' },
          { icon: ExternalLink, label: 'Open' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            title={label}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#1C3741] dark:hover:text-sky-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Voucher details */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Voucher Details</p>
          <MetaRow icon={CalendarDays} label="Voucher Date" value={formatDate(entry.date)} />
          <MetaRow icon={CalendarDays} label="Posting Date" value={formatDate(entry.postingDate)} />
          <MetaRow icon={Building2} label="Branch" value={entry.branch} />
          <MetaRow icon={Layers} label="Department" value={entry.department} />
          <MetaRow icon={Layers} label="Cost Center" value={entry.costCenter} />
          <MetaRow icon={TrendingUp} label="Source Module" value={entry.source} />
          <MetaRow icon={User} label="Created By" value={entry.createdBy} />
          <MetaRow icon={Clock} label="Last Modified" value={formatRelative(entry.modifiedAt)} />
          <div className="flex items-start gap-2.5 pt-2">
            <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-gray-400 dark:text-gray-500 w-28 flex-shrink-0">Narration</span>
            <span className="text-xs text-gray-700 dark:text-gray-200 flex-1 leading-relaxed">{entry.narration}</span>
          </div>
        </div>

        {/* Balance summary */}
        <div className="mx-5 mb-4 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a2840]/50">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Financial Summary</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Total Debit</p>
              <p className="font-mono text-base font-bold text-red-600 dark:text-red-400">{formatINR(entry.debit)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Total Credit</p>
              <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">{formatINR(entry.credit)}</p>
            </div>
          </div>
          <div className={[
            'flex items-center gap-2 p-2 rounded-lg text-xs font-semibold',
            isBalanced
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
          ].join(' ')}>
            {isBalanced
              ? <><CheckCircle2 className="h-3.5 w-3.5" />Journal is balanced — Dr = Cr</>
              : <><AlertTriangle className="h-3.5 w-3.5" />Variance: {formatINR(balanceDiff)} — Journal unbalanced!</>
            }
          </div>
        </div>

        {/* Line items */}
        <div className="px-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Journal Lines</p>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {linesLoading ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />Loading lines…
              </div>
            ) : lineItems.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No line items found</div>
            ) : lineItems.map((li, idx) => (
              <div
                key={idx}
                className={[
                  'px-3 py-2.5 text-xs border-b border-gray-100 dark:border-gray-800 last:border-0',
                  idx % 2 === 0 ? 'bg-white dark:bg-[#162030]' : 'bg-gray-50/50 dark:bg-[#1a2840]/30',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <span className="font-medium text-gray-700 dark:text-gray-200 leading-tight">{li.account}</span>
                  <span className="font-mono text-gray-400 dark:text-gray-500 whitespace-nowrap">{li.accountCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 dark:text-gray-500">{li.costCenter}</span>
                  <div className="flex items-center gap-3">
                    {li.debit > 0 && <span className="font-mono font-semibold text-red-600 dark:text-red-400">{formatINR(li.debit)} Dr</span>}
                    {li.credit > 0 && <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(li.credit)} Cr</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval timeline */}
        <div className="px-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Approval Workflow</p>
          <div className="space-y-1.5">
            {entry.approvalTimeline.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={[
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                    step.status === 'done'    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : step.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
                  ].join(' ')}>
                    {step.status === 'done'    ? <CheckCircle2 className="h-4 w-4" />
                      : step.status === 'pending' ? <Clock className="h-3.5 w-3.5 animate-pulse" />
                      : <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />}
                  </div>
                  {idx < entry.approvalTimeline.length - 1 && (
                    <div className={['w-px flex-1 my-1 min-h-[16px]', step.status === 'done' ? 'bg-emerald-200 dark:bg-emerald-900/50' : 'bg-gray-200 dark:bg-gray-700'].join(' ')} />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between">
                    <span className={['text-xs font-semibold', step.status === 'waiting' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'].join(' ')}>
                      {step.step}
                    </span>
                    {step.timestamp && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatRelative(step.timestamp)}</span>
                    )}
                  </div>
                  <span className={['text-[11px]', step.status === 'waiting' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'].join(' ')}>
                    {step.user}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reconciliation status */}
        <div className="mx-5 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Reconciliation</p>
          <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a2840]/40">
            <Badge map={RECON_STATUS} value={entry.reconStatus} />
            {entry.reconStatus === 'reconciled' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">Matched and reconciled</span>
            )}
            {entry.reconStatus === 'unreconciled' && (
              <button className="ml-auto text-xs font-medium text-[#1C3741] dark:text-sky-300 hover:underline">
                Start Reconciliation →
              </button>
            )}
            {entry.reconStatus === 'exception' && (
              <span className="text-xs text-red-500 dark:text-red-400">Variance detected — manual review required</span>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
