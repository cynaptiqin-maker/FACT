import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { accountingAPI } from '@services/api';
import { format } from 'date-fns';
import {
  X, Edit2, ExternalLink, BookOpen, FileText, History,
  Receipt, Building2, StickyNote, TrendingUp, TrendingDown,
  Lock, Unlock, User, Calendar, Globe, Phone, Mail,
  Copy, ArrowUpRight, Loader2, Info,
} from 'lucide-react';
import clsx from 'clsx';
import {
  TYPE_CONFIG, STATUS_CONFIG, formatINR, formatBalance,
  formatDate, getLedgerStatus, VOUCHER_TYPE_LABELS,
} from './ledgerConstants';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'transactions', label: 'Transactions', icon: FileText },
  { id: 'audit', label: 'Audit Trail', icon: History },
  { id: 'gst', label: 'GST / Tax', icon: Receipt },
  { id: 'notes', label: 'Notes', icon: StickyNote },
];

// ─── Field row ─────────────────────────────────────────────────────────────────
function FieldRow({ label, value, copyable }) {
  const copy = () => { if (copyable && value) navigator.clipboard.writeText(String(value)); };
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50/50 transition-colors">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <div className="flex items-center gap-1.5 max-w-[55%]">
        <span className="text-xs text-slate-800 text-right truncate">{value ?? '—'}</span>
        {copyable && value && (
          <button onClick={copy} className="text-slate-300 hover:text-slate-500 transition-colors">
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Mini balance chart ───────────────────────────────────────────────────────
function MiniBalanceChart({ data }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={64}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1C3741" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1C3741" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', padding: '4px 8px' }}
          formatter={(v) => [`₹${formatINR(v)}`, 'Balance']}
        />
        <Area type="monotone" dataKey="balance" stroke="#1C3741" strokeWidth={1.5} fill="url(#balGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ account }) {
  const typeCfg = TYPE_CONFIG[account.type] || {};
  const status = getLedgerStatus(account);
  const statusCfg = STATUS_CONFIG[status];
  const bal = formatBalance(account.current_balance);

  const mockTrend = Array.from({ length: 6 }, (_, i) => ({
    month: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i],
    balance: Math.abs(parseFloat(account.current_balance || 0)) * (0.6 + Math.random() * 0.8),
  }));

  return (
    <div className="space-y-4 pb-6">
      {/* Balance hero */}
      <div className="mx-4 bg-gradient-to-br from-slate-50 to-blue-50/20 rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-medium text-slate-500 mb-1">Current Balance</p>
        <p className="text-2xl font-bold tabular-nums text-slate-900">
          ₹{bal.display !== '—' ? bal.display : '0.00'}
          {bal.drCr && (
            <span className={clsx('ml-2 text-sm font-semibold', bal.positive ? 'text-blue-500' : 'text-red-400')}>
              {bal.drCr}
            </span>
          )}
        </p>
        {account.opening_balance != null && (
          <p className="text-xs text-slate-400 mt-0.5">
            Opening: ₹{formatINR(account.opening_balance)}
          </p>
        )}
        <div className="mt-3">
          <MiniBalanceChart data={mockTrend} />
        </div>
      </div>

      {/* Account info */}
      <div>
        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Account Info</p>
        <div className="divide-y divide-slate-100 border-y border-slate-100">
          <FieldRow label="Ledger Code" value={<span className="font-mono">{account.code}</span>} copyable />
          <FieldRow label="Account Type" value={
            <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border', typeCfg.bg, typeCfg.text, typeCfg.border)}>
              <span className={clsx('w-1.5 h-1.5 rounded-full', typeCfg.dot)} />
              {typeCfg.label || account.type}
            </span>
          } />
          <FieldRow label="Normal Balance" value={typeCfg.normalBalance || '—'} />
          <FieldRow label="Parent Group" value={account.parent_name || 'Top-level'} />
          <FieldRow label="Currency" value={account.currency || 'INR'} />
          <FieldRow label="Status" value={
            <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', statusCfg.bg, statusCfg.text)}>
              <span className={clsx('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
              {statusCfg.label}
            </span>
          } />
          <FieldRow label="Credit Limit" value={account.credit_limit ? `₹${formatINR(account.credit_limit)}` : '—'} />
        </div>
      </div>

      {/* Tax info */}
      {(account.gstin || account.pan) && (
        <div>
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tax Details</p>
          <div className="divide-y divide-slate-100 border-y border-slate-100">
            {account.gstin && <FieldRow label="GSTIN" value={account.gstin} copyable />}
            {account.pan && <FieldRow label="PAN" value={account.pan} copyable />}
            {account.tds_applicable != null && <FieldRow label="TDS Applicable" value={account.tds_applicable ? 'Yes' : 'No'} />}
          </div>
        </div>
      )}

      {/* Contact info */}
      {(account.contact_person || account.email || account.phone) && (
        <div>
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact</p>
          <div className="divide-y divide-slate-100 border-y border-slate-100">
            {account.contact_person && <FieldRow label="Contact Person" value={account.contact_person} />}
            {account.email && <FieldRow label="Email" value={account.email} copyable />}
            {account.phone && <FieldRow label="Phone" value={account.phone} />}
            {account.address && <FieldRow label="Address" value={account.address} />}
          </div>
        </div>
      )}

      {/* Meta */}
      <div>
        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Meta</p>
        <div className="divide-y divide-slate-100 border-y border-slate-100">
          <FieldRow label="Created By" value={account.created_by || 'System'} />
          <FieldRow label="Created At" value={formatDate(account.created_at)} />
          <FieldRow label="Last Modified" value={formatDate(account.updated_at)} />
        </div>
      </div>
    </div>
  );
}

// ─── Transactions tab ─────────────────────────────────────────────────────────
function TransactionsTab({ accountId }) {
  const today = new Date();
  const fiscalStart = new Date(today.getFullYear(), today.getMonth() >= 3 ? 3 : -9, 1);
  const [fromDate, setFromDate] = useState(format(fiscalStart, 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(today, 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ['ledger-statement', accountId, fromDate, toDate],
    queryFn: () =>
      accountingAPI.getLedgerStatement(accountId, { from: fromDate, to: toDate })
        .then((r) => r.data.data),
    enabled: !!accountId,
  });

  const lines = data?.lines || [];
  const openingBal = parseFloat(data?.opening_balance || 0);
  const totalDebit = lines.reduce((s, l) => s + parseFloat(l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + parseFloat(l.credit || 0), 0);

  return (
    <div className="pb-6">
      {/* Date range */}
      <div className="flex gap-2 px-4 py-3 border-b border-slate-100">
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Date', 'Particulars', 'Voucher', 'Debit', 'Credit', 'Balance'].map((h, i) => (
                  <th key={h} className={clsx('px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide', i >= 3 ? 'text-right' : 'text-left')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {/* Opening balance row */}
              <tr className="bg-blue-50/30">
                <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{format(new Date(fromDate), 'd MMM yy')}</td>
                <td className="px-3 py-2.5 font-medium text-slate-600">Opening Balance</td>
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                  {openingBal > 0 ? formatINR(openingBal) : '—'}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                  {openingBal < 0 ? formatINR(Math.abs(openingBal)) : '—'}
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-700">
                  {formatINR(Math.abs(openingBal))} <span className="text-slate-400">{openingBal >= 0 ? 'Dr' : 'Cr'}</span>
                </td>
              </tr>

              {lines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                    No transactions in this period
                  </td>
                </tr>
              ) : (
                lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                      {format(new Date(line.entry_date), 'd MMM yy')}
                    </td>
                    <td className="px-3 py-2.5 max-w-[120px]">
                      <p className="text-slate-700 truncate">{line.narration || line.entry_narration || '—'}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-brand-600">{line.entry_number}</span>
                    </td>
                    <td className={clsx('px-3 py-2.5 text-right font-mono', parseFloat(line.debit) > 0 ? 'text-slate-800' : 'text-slate-300')}>
                      {parseFloat(line.debit) > 0 ? formatINR(line.debit) : '—'}
                    </td>
                    <td className={clsx('px-3 py-2.5 text-right font-mono', parseFloat(line.credit) > 0 ? 'text-slate-800' : 'text-slate-300')}>
                      {parseFloat(line.credit) > 0 ? formatINR(line.credit) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-800">
                      {formatINR(Math.abs(parseFloat(line.running_balance)))}
                      <span className="text-xs text-slate-400 ml-0.5">
                        {parseFloat(line.running_balance) >= 0 ? 'Dr' : 'Cr'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {lines.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                  <td colSpan={3} className="px-3 py-2.5 text-xs text-slate-600">Totals</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-800">{formatINR(totalDebit)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-800">{formatINR(totalCredit)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-800">
                    {lines.length > 0 && formatINR(Math.abs(parseFloat(lines[lines.length - 1].running_balance)))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Audit trail tab ──────────────────────────────────────────────────────────
function AuditTab() {
  const sampleAudit = [
    { id: 1, action: 'Created ledger', user: 'Admin', time: '3 days ago', detail: 'Initial setup' },
    { id: 2, action: 'Updated opening balance', user: 'Accountant', time: '2 days ago', detail: 'Balance corrected' },
    { id: 3, action: 'Status changed to Active', user: 'Admin', time: '1 day ago', detail: '' },
  ];

  return (
    <div className="px-4 py-4 space-y-3 pb-6">
      {sampleAudit.map((item) => (
        <div key={item.id} className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <History className="w-3 h-3 text-brand-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-700 font-medium">{item.action}</p>
            {item.detail && <p className="text-xs text-slate-400 mt-0.5">{item.detail}</p>}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">
                <User className="w-3 h-3 inline mr-0.5" />{item.user}
              </span>
              <span className="text-xs text-slate-400">
                <Calendar className="w-3 h-3 inline mr-0.5" />{item.time}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── GST tab ──────────────────────────────────────────────────────────────────
function GSTTab({ account }) {
  return (
    <div className="pb-6">
      {account.gstin || account.pan ? (
        <div>
          <div className="divide-y divide-slate-100 border-y border-slate-100">
            <FieldRow label="GSTIN" value={account.gstin} copyable />
            <FieldRow label="PAN" value={account.pan} copyable />
            <FieldRow label="GST Treatment" value={account.gst_treatment || 'Registered Business'} />
            <FieldRow label="HSN/SAC Code" value={account.hsn_code || '—'} />
            <FieldRow label="TDS Applicable" value={account.tds_applicable ? 'Yes' : 'No'} />
            <FieldRow label="TDS Category" value={account.tds_category || '—'} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <Receipt className="w-8 h-8 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 font-medium">No tax details</p>
          <p className="text-xs text-slate-400 mt-1">Add GSTIN / PAN by editing this ledger</p>
        </div>
      )}
    </div>
  );
}

// ─── Notes tab ────────────────────────────────────────────────────────────────
function NotesTab({ account }) {
  const [note, setNote] = useState(account.notes || '');
  return (
    <div className="px-4 py-4 pb-6">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add notes about this ledger…"
        rows={6}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none
          focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-700 placeholder-slate-300"
      />
      <button className="mt-2 px-4 py-1.5 bg-brand-700 text-white text-xs font-semibold rounded-lg hover:bg-brand-800 transition-colors">
        Save Note
      </button>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
export default function LedgerDetailDrawer({ account, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Reset tab on ledger change
  useEffect(() => { setActiveTab('overview'); }, [account?.id]);

  if (!account) return null;

  const status = getLedgerStatus(account);
  const statusCfg = STATUS_CONFIG[status];
  const typeCfg = TYPE_CONFIG[account.type] || {};

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-[520px] bg-white shadow-2xl flex flex-col h-full overflow-hidden"
        >
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', statusCfg.bg, statusCfg.text)}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                    {statusCfg.label}
                  </span>
                  {account.type && (
                    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border', typeCfg.bg, typeCfg.text, typeCfg.border)}>
                      {typeCfg.label}
                    </span>
                  )}
                  {account.is_frozen && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      <Lock className="w-3 h-3" /> Frozen
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-800 truncate">{account.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{account.code} · {account.parent_name || 'No group'}</p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => onEdit(account)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 text-white text-xs font-semibold rounded-lg hover:bg-brand-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 border-b border-slate-100 overflow-x-auto">
            <div className="flex min-w-max">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
                      activeTab === tab.id
                        ? 'border-brand-700 text-brand-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'overview' && <OverviewTab account={account} />}
                {activeTab === 'transactions' && <TransactionsTab accountId={account.id} />}
                {activeTab === 'audit' && <AuditTab account={account} />}
                {activeTab === 'gst' && <GSTTab account={account} />}
                {activeTab === 'notes' && <NotesTab account={account} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
