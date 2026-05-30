import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, ChevronRight, ArrowUpDown,
  MoreHorizontal, Eye, Edit, Link2, CheckCircle2, Calendar, ExternalLink,
  FileText, Activity, Sparkles, AlertTriangle, Package, ShieldCheck,
  Copy, RefreshCw, Tag,
} from 'lucide-react';
import {
  PAYMENT_STATUS_STYLES, APPROVAL_STATUS_STYLES, MATCHING_STATUS_STYLES,
  RISK_STYLES, fmtINR, fmtDate,
} from './VIConstants';

// ─── Badge Components ─────────────────────────────────────────────────────────
function StatusBadge({ status, styleMap }) {
  const s = styleMap[status] || styleMap['pending'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-none ${s.dot}`} />
      {s.label}
    </span>
  );
}

function RiskBar({ level, score }) {
  const s = RISK_STYLES[level] || RISK_STYLES.low;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className={`h-full rounded-full ${s.barColor}`}
        />
      </div>
      <span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.label}</span>
    </div>
  );
}

function PaymentProgress({ paid, total }) {
  if (!total) return <span className="text-[10px] text-slate-400">—</span>;
  const pct = Math.min(100, (paid / total) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-14 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 dark:text-slate-400">{Math.round(pct)}%</span>
    </div>
  );
}

function AvatarInitials({ name }) {
  if (!name) return <span className="text-[10px] text-slate-400">—</span>;
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');
  const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-6 h-6 rounded-full ${color} text-white text-[9px] font-bold flex items-center justify-center flex-none`}>
        {initials}
      </span>
      <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[90px]">{name.split(' ').slice(-1)[0]}</span>
    </div>
  );
}

function OcrBadge({ score }) {
  const color = score >= 95 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
                score >= 80 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' :
                              'text-red-600 bg-red-50 dark:bg-red-900/20';
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${color}`}>{score}%</span>
  );
}

// ─── Expanded Row Detail ──────────────────────────────────────────────────────
function ExpandedDetail({ inv }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4">
        {/* Invoice Details */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <FileText size={13} className="text-violet-500" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Line Items</span>
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left pb-1 font-semibold">Description</th>
                <th className="text-right pb-1 font-semibold">Qty</th>
                <th className="text-right pb-1 font-semibold">Rate</th>
                <th className="text-right pb-1 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(inv.lineItems || []).map((li, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-1 pr-2 text-slate-600 dark:text-slate-400 truncate max-w-[160px]">{li.desc}</td>
                  <td className="py-1 text-right text-slate-700 dark:text-slate-300 font-mono">{li.qty}</td>
                  <td className="py-1 text-right text-slate-700 dark:text-slate-300 font-mono">{fmtINR(li.rate)}</td>
                  <td className="py-1 text-right text-slate-800 dark:text-slate-200 font-mono font-semibold">{fmtINR(li.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                <td colSpan={3} className="pt-1.5 text-right pr-2">Total</td>
                <td className="pt-1.5 text-right font-mono">{fmtINR(inv.invoiceAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Procurement Linkage */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Activity size={13} className="text-blue-500" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Procurement Linkage</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Purchase Order', value: inv.poNumber, icon: Package,      ok: !!inv.poNumber   },
              { label: 'GRN Number',     value: inv.grnNumber, icon: ShieldCheck, ok: !!inv.grnNumber  },
              { label: 'PO/GRN Match',   value: inv.matchingStatus === 'matched' ? '3-Way Verified' : 'Pending Verification', icon: Link2, ok: inv.matchingStatus === 'matched' },
              { label: 'Tax Status',     value: inv.taxStatus === 'valid' ? 'GST Valid' : 'Mismatch Detected', icon: ShieldCheck, ok: inv.taxStatus === 'valid' },
              { label: 'OCR Confidence', value: `${inv.ocrConfidence}% confidence`, icon: Sparkles,    ok: inv.ocrConfidence >= 90 },
            ].map(row => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Icon size={11} /> {row.label}
                  </div>
                  <span className={`text-[11px] font-semibold ${row.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {row.value || '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes & Actions */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles size={13} className="text-amber-500" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Notes & Actions</span>
          </div>
          {inv.notes && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {inv.notes}
            </p>
          )}
          {inv.riskScore >= 70 && (
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-2">
              <AlertTriangle size={11} className="text-red-500 mt-0.5 flex-none" />
              <p className="text-[10px] text-red-700 dark:text-red-300 leading-relaxed">
                AI: High-risk invoice detected. Manual review recommended before approval.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-md transition-all">
              <Eye size={10} /> View Invoice
            </button>
            <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all">
              <Link2 size={10} /> Match PO/GRN
            </button>
            <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:border-violet-300 transition-all">
              <ExternalLink size={10} /> Journal
            </button>
            <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:border-violet-300 transition-all">
              <Tag size={10} /> Audit Trail
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Column Header ─────────────────────────────────────────────────────────────
function ColHeader({ label, sortKey, currentSort, onSort, className = '' }) {
  const active = currentSort?.key === sortKey;
  return (
    <th
      className={`px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 cursor-pointer select-none whitespace-nowrap group ${className}`}
      onClick={() => onSort && onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {onSort && (
          active
            ? currentSort.dir === 'asc'
              ? <ChevronUp  size={11} className="text-violet-500" />
              : <ChevronDown size={11} className="text-violet-500" />
            : <ArrowUpDown size={11} className="text-slate-300 group-hover:text-slate-400" />
        )}
      </div>
    </th>
  );
}

// ─── Main Grid ────────────────────────────────────────────────────────────────
export default function VIGrid({ rows, onOpenDrawer }) {
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [sort, setSort] = useState({ key: 'invoiceDate', dir: 'desc' });

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const allSelected = rows.length > 0 && rows.every(r => selected.has(r.id));
  const someSelected = rows.some(r => selected.has(r.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r.id)));
  };

  const toggleExpand = id => setExpanded(p => (p === id ? null : id));

  const handleSort = key => {
    setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const sorted = [...rows].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const va = a[sort.key] ?? '';
    const vb = b[sort.key] ?? '';
    if (typeof va === 'number') return (va - vb) * dir;
    return va.toString().localeCompare(vb.toString()) * dir;
  });

  return (
    <div className="flex-1 overflow-auto">
      <table className="min-w-[2400px] w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="w-8 pl-4 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                onChange={toggleAll}
                className="w-3.5 h-3.5 accent-violet-600 cursor-pointer"
              />
            </th>
            <th className="w-7 py-2.5" />
            <ColHeader label="Invoice #"       sortKey="invoiceNo"       currentSort={sort} onSort={handleSort} className="min-w-[150px]" />
            <ColHeader label="Vendor"          sortKey="vendorName"      currentSort={sort} onSort={handleSort} className="min-w-[180px]" />
            <ColHeader label="Category"        sortKey="vendorCategory"  currentSort={sort} onSort={handleSort} className="min-w-[130px]" />
            <ColHeader label="Branch"          sortKey="branch"          currentSort={sort} onSort={handleSort} className="min-w-[120px]" />
            <ColHeader label="Department"      sortKey="department"      currentSort={sort} onSort={handleSort} className="min-w-[110px]" />
            <ColHeader label="Invoice Date"    sortKey="invoiceDate"     currentSort={sort} onSort={handleSort} className="min-w-[110px]" />
            <ColHeader label="Due Date"        sortKey="dueDate"         currentSort={sort} onSort={handleSort} className="min-w-[105px]" />
            <ColHeader label="PO Number"       sortKey="poNumber"        currentSort={sort} onSort={handleSort} className="min-w-[120px]" />
            <ColHeader label="GRN Status"      sortKey="grnNumber"       currentSort={sort} onSort={handleSort} className="min-w-[115px]" />
            <ColHeader label="Invoice Amt"     sortKey="invoiceAmount"   currentSort={sort} onSort={handleSort} className="min-w-[115px]" />
            <ColHeader label="Tax Amt"         sortKey="taxAmount"       currentSort={sort} onSort={handleSort} className="min-w-[100px]" />
            <ColHeader label="Outstanding"     sortKey="outstandingAmount" currentSort={sort} onSort={handleSort} className="min-w-[110px]" />
            <ColHeader label="Paid %"          sortKey="paidAmount"      currentSort={sort} onSort={handleSort} className="min-w-[100px]" />
            <ColHeader label="Matching"        sortKey="matchingStatus"  currentSort={sort} onSort={handleSort} className="min-w-[120px]" />
            <ColHeader label="Approval"        sortKey="approvalStatus"  currentSort={sort} onSort={handleSort} className="min-w-[120px]" />
            <ColHeader label="Payment"         sortKey="paymentStatus"   currentSort={sort} onSort={handleSort} className="min-w-[110px]" />
            <ColHeader label="Risk"            sortKey="riskScore"       currentSort={sort} onSort={handleSort} className="min-w-[130px]" />
            <ColHeader label="OCR"             sortKey="ocrConfidence"   currentSort={sort} onSort={handleSort} className="min-w-[70px]" />
            <ColHeader label="Approver"        sortKey="assignedApprover" currentSort={sort} onSort={handleSort} className="min-w-[140px]" />
            <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 min-w-[100px]">Actions</th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((inv, idx) => {
            const isSelected  = selected.has(inv.id);
            const isExpanded  = expanded === inv.id;
            const isCritical  = inv.riskLevel === 'critical';
            const isOverdue   = inv.paymentStatus === 'overdue';

            return (
              <React.Fragment key={inv.id}>
                <motion.tr
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  className={`group border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer ${
                    isSelected ? 'bg-violet-50 dark:bg-violet-950/25' :
                    isExpanded ? 'bg-slate-50 dark:bg-slate-900/60' :
                    'hover:bg-slate-50/80 dark:hover:bg-slate-900/40'
                  } ${isCritical ? 'border-l-2 border-l-red-500' : isOverdue ? 'border-l-2 border-l-orange-400' : ''}`}
                  onClick={() => toggleExpand(inv.id)}
                >
                  {/* Checkbox */}
                  <td className="pl-4 py-2.5" onClick={e => { e.stopPropagation(); toggleSelect(inv.id); }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(inv.id)} className="w-3.5 h-3.5 accent-violet-600 cursor-pointer" onClick={e => e.stopPropagation()} />
                  </td>

                  {/* Expand toggle */}
                  <td className="py-2.5 pr-1 text-slate-400">
                    <ChevronRight size={13} className={`transition-transform ${isExpanded ? 'rotate-90 text-violet-500' : ''}`} />
                  </td>

                  {/* Invoice # */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-violet-700 dark:text-violet-400">{inv.invoiceNo}</span>
                      {inv.riskScore >= 80 && <AlertTriangle size={11} className="text-red-500 flex-none" />}
                    </div>
                  </td>

                  {/* Vendor */}
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{inv.vendorName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{inv.vendorCode}</p>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                      {inv.vendorCategory}
                    </span>
                  </td>

                  {/* Branch */}
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{inv.branch}</td>

                  {/* Dept */}
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">{inv.department}</td>

                  {/* Invoice Date */}
                  <td className="px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">{fmtDate(inv.invoiceDate)}</td>

                  {/* Due Date */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`text-[11px] font-mono ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                      {fmtDate(inv.dueDate)}
                    </span>
                    {inv.agingDays > 0 && (
                      <span className={`ml-1 text-[9px] font-bold ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                        {isOverdue ? `+${inv.agingDays}d` : `${inv.agingDays}d`}
                      </span>
                    )}
                  </td>

                  {/* PO # */}
                  <td className="px-3 py-2.5">
                    {inv.poNumber
                      ? <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">{inv.poNumber}</span>
                      : <span className="text-[10px] text-red-500 font-semibold">No PO</span>}
                  </td>

                  {/* GRN Status */}
                  <td className="px-3 py-2.5">
                    {inv.grnNumber
                      ? <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">{inv.grnNumber}</span>
                      : <span className="text-[10px] text-amber-500 font-semibold">Pending GRN</span>}
                  </td>

                  {/* Invoice Amount */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-[12px] font-bold font-mono text-slate-800 dark:text-slate-200">{fmtINR(inv.invoiceAmount)}</span>
                  </td>

                  {/* Tax Amount */}
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{fmtINR(inv.taxAmount)}</span>
                  </td>

                  {/* Outstanding */}
                  <td className="px-3 py-2.5 text-right">
                    <span className={`text-[12px] font-bold font-mono ${inv.outstandingAmount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600'}`}>
                      {fmtINR(inv.outstandingAmount)}
                    </span>
                  </td>

                  {/* Payment % */}
                  <td className="px-3 py-2.5">
                    <PaymentProgress paid={inv.paidAmount} total={inv.invoiceAmount} />
                  </td>

                  {/* Matching */}
                  <td className="px-3 py-2.5">
                    <StatusBadge status={inv.matchingStatus} styleMap={MATCHING_STATUS_STYLES} />
                  </td>

                  {/* Approval */}
                  <td className="px-3 py-2.5">
                    <StatusBadge status={inv.approvalStatus} styleMap={APPROVAL_STATUS_STYLES} />
                  </td>

                  {/* Payment */}
                  <td className="px-3 py-2.5">
                    <StatusBadge status={inv.paymentStatus} styleMap={PAYMENT_STATUS_STYLES} />
                  </td>

                  {/* Risk */}
                  <td className="px-3 py-2.5">
                    <RiskBar level={inv.riskLevel} score={inv.riskScore} />
                  </td>

                  {/* OCR */}
                  <td className="px-3 py-2.5">
                    <OcrBadge score={inv.ocrConfidence} />
                  </td>

                  {/* Approver */}
                  <td className="px-3 py-2.5">
                    <AvatarInitials name={inv.assignedApprover} />
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button title="View"   onClick={() => onOpenDrawer(inv)} className="p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 text-slate-500 hover:text-violet-600 transition-colors"><Eye    size={13} /></button>
                      <button title="Edit"   className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-500 hover:text-blue-600 transition-colors">                                    <Edit   size={13} /></button>
                      <button title="Match"  className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-500 hover:text-emerald-600 transition-colors">                           <Link2  size={13} /></button>
                      <button title="More"   className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">                                                          <MoreHorizontal size={13} /></button>
                    </motion.div>
                  </td>
                </motion.tr>

                <AnimatePresence>
                  {isExpanded && (
                    <tr>
                      <td colSpan={22} className="p-0">
                        <ExpandedDetail inv={inv} />
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <FileText size={24} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No invoices found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Adjust your filters or upload a new invoice</p>
        </div>
      )}

      {/* Real-time sync indicator */}
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="fixed bottom-4 right-6 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live sync
      </motion.div>
    </div>
  );
}
