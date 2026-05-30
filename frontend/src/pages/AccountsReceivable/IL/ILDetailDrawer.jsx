import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, List, CreditCard, Receipt, Clock, Paperclip, MessageSquare,
  Building2, Phone, Mail, MapPin, Calendar, User, Banknote, GitBranch,
  Download, Printer, Send, Plus, CheckCircle2, AlertTriangle, Circle,
  ChevronRight, Sparkles, Copy, ExternalLink, TrendingUp,
} from 'lucide-react';
import { INVOICE_TYPES, PAYMENT_STATUSES, fmtINR, fmtDate } from './ILConstants';

const TABS = [
  { id: 'overview',   label: 'Overview',    icon: FileText     },
  { id: 'lineitems',  label: 'Line Items',  icon: List         },
  { id: 'payments',   label: 'Payments',    icon: CreditCard   },
  { id: 'gst',        label: 'GST / Tax',   icon: Receipt      },
  { id: 'audit',      label: 'Audit Trail', icon: Clock        },
  { id: 'attachments',label: 'Attachments', icon: Paperclip    },
  { id: 'notes',      label: 'Notes',       icon: MessageSquare},
];

function DetailRow({ label, value, mono, highlight, success }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-500 flex-none w-40">{label}</span>
      <span className={`text-xs text-right flex-1 font-medium ${mono ? 'font-mono' : ''} ${highlight ? 'text-rose-600 dark:text-rose-400 font-bold' : success ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function PaymentProgressBar({ total, paid }) {
  const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
  const color = pct === 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b';
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Payment Progress</span>
        <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-500 mb-0.5">Total</div>
          <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{fmtINR(total)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-500 mb-0.5">Paid</div>
          <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">{fmtINR(paid)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 dark:text-slate-500 mb-0.5">Balance</div>
          <div className={`text-xs font-bold font-mono ${total - paid > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
            {fmtINR(total - paid)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ inv }) {
  const typeCfg   = INVOICE_TYPES[inv.type]   ?? INVOICE_TYPES.SI;
  const statusCfg = PAYMENT_STATUSES[inv.paymentStatus] ?? PAYMENT_STATUSES.PENDING;
  const overdueDays = Math.floor((new Date() - new Date(inv.dueDate)) / 86400000);

  return (
    <div className="space-y-4">
      <PaymentProgressBar total={inv.total} paid={inv.paidAmount} />

      {/* status + aging */}
      <div className="flex gap-3">
        <div className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border ${statusCfg.bg} border-transparent`}>
          <span className="w-2 h-2 rounded-full flex-none" style={{ background: statusCfg.dot }} />
          <span className={`text-xs font-semibold ${statusCfg.text}`}>{statusCfg.label}</span>
        </div>
        {overdueDays > 0 && inv.paymentStatus !== 'PAID' && (
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
            <AlertTriangle size={13} className="text-rose-500 flex-none" />
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">{overdueDays}d overdue</span>
          </div>
        )}
      </div>

      {/* invoice details */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Invoice Details</h4>
        <DetailRow label="Invoice No"    value={inv.invoiceNo}      mono />
        <DetailRow label="Invoice Date"  value={fmtDate(inv.invoiceDate)} />
        <DetailRow label="Due Date"      value={fmtDate(inv.dueDate)} highlight={overdueDays > 0 && inv.paymentStatus !== 'PAID'} />
        <DetailRow label="Invoice Type"  value={typeCfg.label} />
        <DetailRow label="Currency"      value={inv.currency}       mono />
        <DetailRow label="Branch"        value={inv.branch} />
        <DetailRow label="Department"    value={inv.department} />
        <DetailRow label="Salesperson"   value={inv.salesperson} />
        <DetailRow label="GST Type"      value={inv.gstType}        mono />
        <DetailRow label="Created By"    value={inv.createdBy} />
        <DetailRow label="Created At"    value={fmtDate(inv.createdAt)} />
      </div>

      {/* customer details */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Customer / Party</h4>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-none">
            {inv.customer.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{inv.customer.name}</div>
            {inv.customer.id && <div className="text-[11px] text-slate-400 font-mono mt-0.5">{inv.customer.id}</div>}
          </div>
        </div>
        {inv.customer.phone && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1.5">
            <Phone size={12} className="text-slate-400" />
            {inv.customer.phone}
          </div>
        )}
        {inv.customer.email && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1.5">
            <Mail size={12} className="text-slate-400" />
            {inv.customer.email}
          </div>
        )}
        {inv.gstin && inv.gstin !== 'N/A' && (
          <div className="flex items-center gap-2 text-xs mt-2">
            <span className="text-slate-500">GSTIN:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{inv.gstin}</span>
          </div>
        )}
      </div>

      {/* amount summary */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Amount Summary</h4>
        <DetailRow label="Subtotal"    value={fmtINR(inv.subtotal)}  mono />
        <DetailRow label="GST / Tax"   value={fmtINR(inv.taxTotal)}  mono />
        <DetailRow label="Grand Total" value={fmtINR(inv.total)}     mono />
        <DetailRow label="Paid Amount" value={fmtINR(inv.paidAmount)} mono success={inv.paidAmount >= inv.total} />
        <DetailRow label="Balance Due" value={fmtINR(inv.balanceDue)} mono highlight={inv.balanceDue > 0 && inv.paymentStatus !== 'DRAFT'} />
      </div>
    </div>
  );
}

// ─── Tab: Line Items ──────────────────────────────────────────────────────────
function LineItemsTab({ inv }) {
  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-xs min-w-max">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {['#', 'Description', 'HSN', 'Qty', 'Unit', 'Unit Price', 'Disc%', 'Tax%', 'Tax Amt', 'Total'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {inv.lineItems.map((item, i) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
                <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-[200px]">{item.description}</td>
                <td className="px-3 py-2.5 font-mono text-slate-500 dark:text-slate-400">{item.hsn}</td>
                <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">{item.qty}</td>
                <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{item.unit}</td>
                <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2.5 text-slate-500">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                <td className="px-3 py-2.5">
                  <span className="px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded text-[10px] font-semibold">{item.taxRate}%</span>
                </td>
                <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">₹{item.taxAmt.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2.5 font-mono font-semibold text-slate-800 dark:text-slate-200">₹{item.total.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700">
            <tr>
              <td colSpan={8} className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-400">Totals</td>
              <td className="px-3 py-2.5 font-mono font-semibold text-slate-800 dark:text-slate-200">₹{inv.taxTotal.toLocaleString('en-IN')}</td>
              <td className="px-3 py-2.5 font-mono font-bold text-indigo-700 dark:text-indigo-400">₹{inv.subtotal.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {/* grand total box */}
      <div className="flex justify-end">
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 min-w-56">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-slate-600 dark:text-slate-400">Subtotal</span>
            <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">₹{inv.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">GST / Tax</span>
            <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">₹{inv.taxTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t border-indigo-200 dark:border-indigo-700 pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Grand Total</span>
            <span className="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-400">₹{inv.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Payments ────────────────────────────────────────────────────────────
function PaymentsTab({ inv }) {
  return (
    <div className="space-y-4">
      <PaymentProgressBar total={inv.total} paid={inv.paidAmount} />

      {inv.payments.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <CreditCard size={20} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No payments recorded</p>
          <p className="text-xs text-slate-400 mt-1">Balance due: <span className="font-semibold text-rose-600">{fmtINR(inv.balanceDue)}</span></p>
        </div>
      ) : (
        <div className="space-y-2">
          {inv.payments.map((p, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-none">
                <CreditCard size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{p.mode}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{fmtDate(p.date)} · {p.ref}</div>
                    {p.bank && <div className="text-[11px] text-slate-400">{p.bank}</div>}
                    {p.note && <div className="text-[11px] text-slate-500 dark:text-slate-500 italic mt-0.5">{p.note}</div>}
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-none ml-3">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {inv.balanceDue > 0 && inv.paymentStatus !== 'CANCELLED' && (
        <button className="w-full h-10 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors flex items-center justify-center gap-2">
          <Plus size={14} />Record Payment
        </button>
      )}
    </div>
  );
}

// ─── Tab: GST / Tax ───────────────────────────────────────────────────────────
function GSTTab({ inv }) {
  const isCGST = inv.gstType === 'CGST+SGST';

  const gstBreakdown = inv.lineItems.reduce((acc, item) => {
    const rate = item.taxRate;
    if (!acc[rate]) acc[rate] = { rate, taxable: 0, taxAmt: 0 };
    acc[rate].taxable += item.total;
    acc[rate].taxAmt  += item.taxAmt;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* GST type */}
      <div className="flex gap-3">
        <div className="flex-1 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">GST Type</div>
          <div className="text-sm font-bold text-cyan-700 dark:text-cyan-400">{inv.gstType}</div>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Total GST</div>
          <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">₹{inv.taxTotal.toLocaleString('en-IN')}</div>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Taxable Value</div>
          <div className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">₹{inv.subtotal.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* HSN-wise GST table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rate-wise GST Summary</h4>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">GST Rate</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-500">Taxable Value</th>
              {isCGST ? (
                <>
                  <th className="px-3 py-2 text-right font-semibold text-slate-500">CGST</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-500">SGST</th>
                </>
              ) : (
                <th className="px-3 py-2 text-right font-semibold text-slate-500">IGST</th>
              )}
              <th className="px-3 py-2 text-right font-semibold text-slate-500">Total Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {Object.values(gstBreakdown).filter(r => r.rate > 0).map(row => (
              <tr key={row.rate} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-3 py-2.5">
                  <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full text-[11px] font-semibold">{row.rate}%</span>
                </td>
                <td className="px-3 py-2.5 font-mono text-right text-slate-700 dark:text-slate-300">₹{row.taxable.toLocaleString('en-IN')}</td>
                {isCGST ? (
                  <>
                    <td className="px-3 py-2.5 font-mono text-right text-slate-700 dark:text-slate-300">₹{(row.taxAmt / 2).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className="px-3 py-2.5 font-mono text-right text-slate-700 dark:text-slate-300">₹{(row.taxAmt / 2).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  </>
                ) : (
                  <td className="px-3 py-2.5 font-mono text-right text-slate-700 dark:text-slate-300">₹{row.taxAmt.toLocaleString('en-IN')}</td>
                )}
                <td className="px-3 py-2.5 font-mono font-semibold text-right text-slate-800 dark:text-slate-200">₹{row.taxAmt.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
            <tr>
              <td className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300">Total</td>
              <td className="px-3 py-2.5 font-mono font-semibold text-right text-slate-800 dark:text-slate-200">₹{inv.subtotal.toLocaleString('en-IN')}</td>
              {isCGST ? (
                <>
                  <td className="px-3 py-2.5 font-mono font-semibold text-right text-slate-800 dark:text-slate-200">₹{(inv.taxTotal / 2).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-right text-slate-800 dark:text-slate-200">₹{(inv.taxTotal / 2).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                </>
              ) : (
                <td className="px-3 py-2.5 font-mono font-semibold text-right text-slate-800 dark:text-slate-200">₹{inv.taxTotal.toLocaleString('en-IN')}</td>
              )}
              <td className="px-3 py-2.5 font-mono font-bold text-right text-indigo-700 dark:text-indigo-400">₹{inv.taxTotal.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* zero-rated items */}
      {gstBreakdown[0] && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Zero-Rated (Nil GST)</div>
          <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">₹{gstBreakdown[0].taxable.toLocaleString('en-IN')}</div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Audit Trail ─────────────────────────────────────────────────────────
function AuditTab({ inv }) {
  const TYPE_COLORS = { CREATE: '#3b82f6', SEND: '#8b5cf6', PAYMENT: '#10b981', ALERT: '#ef4444', EDIT: '#f59e0b' };

  return (
    <div className="space-y-1">
      {inv.auditTrail.map((entry, i) => (
        <div key={i} className="relative flex gap-3 pb-4">
          {i < inv.auditTrail.length - 1 && (
            <div className="absolute left-3.5 top-7 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
          )}
          <div className="w-7 h-7 rounded-full flex-none flex items-center justify-center z-10 mt-0.5"
               style={{ background: `${TYPE_COLORS[entry.type] ?? '#64748b'}20` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[entry.type] ?? '#64748b' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{entry.action}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {fmtDate(entry.ts)} · <span className="font-medium">{entry.by}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Attachments ─────────────────────────────────────────────────────────
function AttachmentsTab({ inv }) {
  return (
    <div className="space-y-3">
      {inv.attachments.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Paperclip size={20} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No attachments</p>
        </div>
      ) : inv.attachments.map((f, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 text-[10px] font-bold flex-none">
            PDF
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{f.name}</div>
            <div className="text-[11px] text-slate-400">{f.size} · Uploaded {fmtDate(f.date)} by {f.uploadedBy}</div>
          </div>
          <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <Download size={14} />
          </button>
        </div>
      ))}
      <button className="w-full h-10 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2">
        <Plus size={14} />Upload Attachment
      </button>
    </div>
  );
}

// ─── Tab: Notes ───────────────────────────────────────────────────────────────
function NotesTab({ inv }) {
  const [note, setNote] = useState('');
  return (
    <div className="space-y-3">
      {inv.notes && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1">Invoice Note</div>
          <p className="text-xs text-slate-700 dark:text-slate-300">{inv.notes}</p>
        </div>
      )}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note for this invoice…"
          rows={4}
          className="w-full p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-transparent outline-none resize-none"
        />
        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            disabled={!note.trim()}
            className="h-7 px-3 rounded-lg bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 text-[11px] font-semibold transition-colors"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function ILDetailDrawer({ invoice, onClose }) {
  const [tab, setTab] = useState('overview');

  return (
    <AnimatePresence>
      {invoice && (
        <>
          {/* backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-[1px]"
          />

          {/* drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[600px] max-w-full bg-slate-50 dark:bg-slate-950 shadow-2xl z-50 flex flex-col"
          >
            {/* header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-none">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{invoice.invoiceNo}</h2>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${INVOICE_TYPES[invoice.type]?.bg} ${INVOICE_TYPES[invoice.type]?.text}`}>
                    {INVOICE_TYPES[invoice.type]?.short}
                  </span>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${PAYMENT_STATUSES[invoice.paymentStatus]?.bg} ${PAYMENT_STATUSES[invoice.paymentStatus]?.text}`}>
                    {PAYMENT_STATUSES[invoice.paymentStatus]?.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{invoice.customer.name} · {fmtDate(invoice.invoiceDate)}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-none">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  <Printer size={15} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  <Download size={15} />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  <Send size={15} />
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* tabs */}
            <div className="flex items-center gap-0.5 px-4 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-none overflow-x-auto scrollbar-hide">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 -mb-px
                      ${tab === t.id
                        ? 'text-indigo-700 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                        : 'text-slate-500 dark:text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    <Icon size={12} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {tab === 'overview'    && <OverviewTab    inv={invoice} />}
                  {tab === 'lineitems'   && <LineItemsTab   inv={invoice} />}
                  {tab === 'payments'    && <PaymentsTab    inv={invoice} />}
                  {tab === 'gst'         && <GSTTab         inv={invoice} />}
                  {tab === 'audit'       && <AuditTab       inv={invoice} />}
                  {tab === 'attachments' && <AttachmentsTab inv={invoice} />}
                  {tab === 'notes'       && <NotesTab       inv={invoice} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
