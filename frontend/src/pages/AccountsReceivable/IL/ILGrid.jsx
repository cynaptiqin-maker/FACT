import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp, ChevronDown, ArrowUpDown, MoreHorizontal,
  Eye, Pencil, Trash2, Send, Printer, Copy, CheckSquare2,
  Square, Minus, ExternalLink,
} from 'lucide-react';
import { INVOICE_TYPES, PAYMENT_STATUSES, fmtINR, fmtDate, dueBadge } from './ILConstants';

// ─── Cell helpers ─────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const cfg = INVOICE_TYPES[type] ?? INVOICE_TYPES.SI;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.short}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = PAYMENT_STATUSES[status] ?? PAYMENT_STATUSES.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function AmountCell({ amount, highlight, currency = 'INR' }) {
  if (!amount && amount !== 0) return <span className="text-slate-300 dark:text-slate-700 font-mono text-xs">—</span>;
  const isNeg = amount < 0;
  const sym   = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '₹';
  return (
    <span className={`font-mono text-xs font-semibold tabular-nums ${highlight === 'danger' ? 'text-rose-600 dark:text-rose-400' : highlight === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
      {isNeg ? '-' : ''}{sym}{Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </span>
  );
}

function PaymentBar({ total, paid }) {
  if (!total) return null;
  const pct = Math.min(Math.round((paid / total) * 100), 100);
  if (pct === 0) return null;
  return (
    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: pct === 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b',
        }}
      />
    </div>
  );
}

function SortIcon({ col, sortBy, sortDir }) {
  if (sortBy !== col) return <ArrowUpDown size={11} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500" />;
  return sortDir === 'asc'
    ? <ChevronUp size={11} className="text-indigo-500" />
    : <ChevronDown size={11} className="text-indigo-500" />;
}

function RowMenu({ inv, onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 w-44"
            >
              {[
                { label: 'View Details', icon: Eye,          action: () => { onView?.(inv); setOpen(false); } },
                { label: 'Edit Invoice', icon: Pencil,       action: () => { onEdit?.(inv); setOpen(false); } },
                { label: 'Duplicate',    icon: Copy,         action: () => setOpen(false) },
                { label: 'Send Reminder',icon: Send,         action: () => setOpen(false) },
                { label: 'Print',        icon: Printer,      action: () => setOpen(false) },
                { label: 'Open in New',  icon: ExternalLink, action: () => setOpen(false) },
                { label: 'Delete',       icon: Trash2,       action: () => { onDelete?.(inv); setOpen(false); }, danger: true },
              ].map(({ label, icon: Icon, action, danger }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors
                    ${danger ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'invoiceNo',     label: 'Invoice No',    sortKey: 'invoiceNo',     width: 'w-36',  sticky: true },
  { id: 'invoiceDate',   label: 'Date',          sortKey: 'invoiceDate',   width: 'w-28'               },
  { id: 'customer',      label: 'Customer',      sortKey: null,            width: 'w-52'               },
  { id: 'gstin',         label: 'GSTIN',         sortKey: null,            width: 'w-36'               },
  { id: 'type',          label: 'Type',          sortKey: 'type',          width: 'w-28'               },
  { id: 'subtotal',      label: 'Subtotal',      sortKey: 'subtotal',      width: 'w-32',  align: 'right' },
  { id: 'taxTotal',      label: 'Tax',           sortKey: 'taxTotal',      width: 'w-28',  align: 'right' },
  { id: 'total',         label: 'Total',         sortKey: 'total',         width: 'w-32',  align: 'right' },
  { id: 'paidAmount',    label: 'Paid',          sortKey: 'paidAmount',    width: 'w-32',  align: 'right' },
  { id: 'balanceDue',    label: 'Balance Due',   sortKey: 'balanceDue',    width: 'w-32',  align: 'right' },
  { id: 'dueDate',       label: 'Due Date',      sortKey: 'dueDate',       width: 'w-32'               },
  { id: 'paymentStatus', label: 'Status',        sortKey: 'paymentStatus', width: 'w-32'               },
  { id: 'branch',        label: 'Branch',        sortKey: 'branch',        width: 'w-36'               },
  { id: 'actions',       label: '',              sortKey: null,            width: 'w-12'               },
];

// ─── Main Grid ────────────────────────────────────────────────────────────────
export default function ILGrid({
  invoices = [],
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  sortBy, sortDir, onSort,
  page, pageSize, onPageChange,
}) {
  const allSelected = invoices.length > 0 && invoices.every(i => selectedIds.includes(i.id));
  const someSelected = !allSelected && selectedIds.some(id => invoices.find(i => i.id === id));

  const toggleAll = () => {
    if (allSelected) onSelectionChange([]);
    else onSelectionChange(invoices.map(i => i.id));
  };

  const toggleRow = (id) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(x => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };

  const totalPages = Math.max(1, Math.ceil(invoices.length / pageSize));
  const pageInvs   = invoices.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col h-full">
      {/* table */}
      <div className="overflow-auto flex-1 rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-xs border-collapse min-w-max">
          {/* header */}
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {/* checkbox */}
              <th className="sticky left-0 z-20 w-10 bg-slate-50 dark:bg-slate-900 px-3 py-3 border-r border-slate-200 dark:border-slate-800">
                <button onClick={toggleAll} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  {allSelected    ? <CheckSquare2 size={14} className="text-indigo-600" />
                   : someSelected ? <Minus size={14} className="text-indigo-600" />
                   :                <Square size={14} />}
                </button>
              </th>
              {COLUMNS.map(col => (
                <th
                  key={col.id}
                  className={`${col.width} px-3 py-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap select-none
                    ${col.sticky ? 'sticky left-10 z-20 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800' : ''}
                    ${col.align === 'right' ? 'text-right' : 'text-left'}
                    ${col.sortKey ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 group' : ''}
                  `}
                  onClick={() => col.sortKey && onSort(col.sortKey)}
                >
                  <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    {col.label}
                    {col.sortKey && <SortIcon col={col.sortKey} sortBy={sortBy} sortDir={sortDir} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            <AnimatePresence mode="popLayout">
              {pageInvs.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Eye size={20} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No invoices match your filters</p>
                      <p className="text-xs text-slate-400">Try clearing filters or adjusting the date range</p>
                    </div>
                  </td>
                </tr>
              ) : pageInvs.map((inv, idx) => {
                const selected  = selectedIds.includes(inv.id);
                const dueBadge_ = dueBadge(inv.dueDate, inv.paymentStatus);
                const isOverdue = inv.paymentStatus === 'OVERDUE';

                return (
                  <motion.tr
                    key={inv.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => onRowClick?.(inv)}
                    className={`group cursor-pointer transition-colors
                      ${selected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }
                      ${isOverdue ? 'border-l-2 border-l-rose-400' : ''}
                    `}
                  >
                    {/* checkbox */}
                    <td
                      className="sticky left-0 z-10 w-10 px-3 py-2.5 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40"
                      onClick={e => { e.stopPropagation(); toggleRow(inv.id); }}
                    >
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                        {selected
                          ? <CheckSquare2 size={14} className="text-indigo-600" />
                          : <Square size={14} />}
                      </button>
                    </td>

                    {/* Invoice No */}
                    <td className="sticky left-10 z-10 px-3 py-2.5 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline font-mono text-[11px]">
                        {inv.invoiceNo}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{fmtDate(inv.invoiceDate)}</td>

                    {/* Customer */}
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{inv.customer.name}</div>
                      {inv.customer.id && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.customer.id}</div>}
                    </td>

                    {/* GSTIN */}
                    <td className="px-3 py-2.5">
                      {inv.gstin && inv.gstin !== 'N/A'
                        ? <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{inv.gstin}</span>
                        : <span className="text-slate-300 dark:text-slate-700">—</span>}
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2.5"><TypeBadge type={inv.type} /></td>

                    {/* Subtotal */}
                    <td className="px-3 py-2.5 text-right">
                      <AmountCell amount={inv.subtotal} currency={inv.currency} />
                    </td>

                    {/* Tax */}
                    <td className="px-3 py-2.5 text-right">
                      <AmountCell amount={inv.taxTotal} currency={inv.currency} />
                    </td>

                    {/* Total */}
                    <td className="px-3 py-2.5 text-right">
                      <AmountCell amount={inv.total} currency={inv.currency} />
                    </td>

                    {/* Paid */}
                    <td className="px-3 py-2.5 text-right">
                      <AmountCell amount={inv.paidAmount} currency={inv.currency} highlight={inv.paidAmount >= inv.total ? 'success' : undefined} />
                    </td>

                    {/* Balance Due */}
                    <td className="px-3 py-2.5 text-right">
                      <AmountCell amount={inv.balanceDue} currency={inv.currency} highlight={inv.balanceDue > 0 && inv.paymentStatus !== 'DRAFT' ? 'danger' : undefined} />
                      {inv.total > 0 && inv.paidAmount > 0 && <PaymentBar total={inv.total} paid={inv.paidAmount} />}
                    </td>

                    {/* Due Date */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-600 dark:text-slate-400 whitespace-nowrap">{fmtDate(inv.dueDate)}</span>
                        {dueBadge_ && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md w-fit ${dueBadge_.cls}`}>
                            {dueBadge_.label}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5"><StatusBadge status={inv.paymentStatus} /></td>

                    {/* Branch */}
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px]">{inv.branch}</td>

                    {/* Actions */}
                    <td className="px-2 py-2.5" onClick={e => e.stopPropagation()}>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <RowMenu
                          inv={inv}
                          onView={onRowClick}
                          onEdit={inv => console.log('edit', inv.id)}
                          onDelete={inv => console.log('delete', inv.id)}
                        />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between pt-3 px-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min((page - 1) * pageSize + 1, invoices.length)}</span>–<span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(page * pageSize, invoices.length)}</span> of <span className="font-semibold text-slate-700 dark:text-slate-300">{invoices.length}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronDown size={13} className="rotate-90" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return p <= totalPages ? (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`h-7 w-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
                  ${p === page
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                {p}
              </button>
            ) : null;
          })}
          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronDown size={13} className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}
