import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, ChevronUp, ArrowUpDown, MoreHorizontal,
  Eye, Calendar, CheckCircle2, GitMerge, BookOpen, ClipboardList,
  FileText, ShoppingBag, Sparkles, Activity, Zap, RefreshCw,
  ShieldAlert, CreditCard,
} from 'lucide-react';
import {
  VENDOR_CATEGORIES, PAYMENT_STATUSES, APPROVAL_STATUSES,
  PROCUREMENT_STATUSES, RISK_LEVELS, agingBadge, fmtINR,
} from './APConstants';

// ─── Cell Components ──────────────────────────────────────────────────────────
function CategoryBadge({ cat }) {
  const cfg = VENDOR_CATEGORIES[cat] ?? VENDOR_CATEGORIES.CORPORATE;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      <ShoppingBag size={9} />{cfg.label}
    </span>
  );
}

function PaymentBadge({ status }) {
  const cfg = PAYMENT_STATUSES[status] ?? PAYMENT_STATUSES.PENDING;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function ApprovalBadge({ status }) {
  const cfg = APPROVAL_STATUSES[status] ?? APPROVAL_STATUSES.PENDING;
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full flex-none ${cfg.dot}`} />
      <span className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

function ProcurementBadge({ status }) {
  const cfg = PROCUREMENT_STATUSES[status] ?? PROCUREMENT_STATUSES.OPEN;
  return (
    <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
  );
}

function RiskBar({ level, score }) {
  const cfg = RISK_LEVELS[level] ?? RISK_LEVELS.LOW;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: cfg.color }} />
      </div>
      <span className={`text-[11px] font-semibold ${cfg.badgeText}`}>{cfg.label}</span>
    </div>
  );
}

function AvatarInitials({ name, color }) {
  const parts = (name || '').split(' ');
  const init  = parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0]?.[0] ?? '?');
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-none"
      style={{ background: color ?? '#64748b' }}>
      {init.toUpperCase()}
    </div>
  );
}

function PaymentBar({ invoice, paid, outstanding }) {
  const pct = invoice > 0 ? Math.round((paid / invoice) * 100) : 0;
  return (
    <div className="min-w-[80px]">
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-slate-500 dark:text-slate-400">{pct}%</span>
        <span className="text-slate-700 dark:text-slate-300 font-mono">{fmtINR(outstanding, 'lakh')}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all"
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Row sub-component ────────────────────────────────────────────────────────
function Row({ k, v, highlight, green, mono }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-[11px] text-slate-500 dark:text-slate-500 flex-none">{k}</span>
      <span className={`text-[11px] font-medium text-right
        ${highlight ? 'text-rose-600 dark:text-rose-400'
        : green ? 'text-emerald-600 dark:text-emerald-400'
        : mono ? 'font-mono text-slate-700 dark:text-slate-300'
        : 'text-slate-700 dark:text-slate-300'}`}>
        {v}
      </span>
    </div>
  );
}

function ExpandedRow({ rec }) {
  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <td colSpan={19} className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 p-0">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 grid grid-cols-3 gap-4">
            {/* Invoice details */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText size={12} className="text-amber-500" />Invoice Details
              </h4>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <Row k="Invoice No"      v={rec.invoiceNo}      mono />
                <Row k="Vendor Code"     v={rec.vendorCode}     mono />
                <Row k="Invoice Amount"  v={`₹${rec.invoiceAmount.toLocaleString('en-IN')}`} mono />
                <Row k="Outstanding"     v={`₹${rec.outstandingAmount.toLocaleString('en-IN')}`} highlight />
                <Row k="Tax (GST)"       v={`₹${rec.taxAmount.toLocaleString('en-IN')}`} mono />
                <Row k="Department"      v={rec.department} />
                <Row k="Branch"          v={rec.branch} />
              </div>
            </div>

            {/* Procurement linkage */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Activity size={12} className="text-emerald-500" />Procurement Linkage
              </h4>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <Row k="PO Number"       v={rec.poNumber ?? 'No PO raised'} mono />
                <Row k="GRN Number"      v={rec.grnNumber ?? 'GRN pending'} mono />
                <Row k="Match Status"    v={<ProcurementBadge status={rec.procurementStatus} />} />
                <Row k="Approval Status" v={<ApprovalBadge status={rec.approvalStatus} />} />
                <Row k="Approver"        v={rec.assignedApprover} />
                {rec.paidAmount > 0 && <Row k="Paid So Far" v={`₹${rec.paidAmount.toLocaleString('en-IN')}`} green />}
              </div>
              {rec.procurementStatus === 'EXCEPTION' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2 text-[11px] text-orange-700 dark:text-orange-400">
                  ⚠ GRN mismatch detected. Requires procurement review before payment.
                </div>
              )}
              {!rec.poNumber && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-[11px] text-amber-700 dark:text-amber-400">
                  ⚠ No Purchase Order found. Retroactive PO required per policy.
                </div>
              )}
            </div>

            {/* Notes + AI */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles size={12} className="text-cyan-500" />Notes & AI Insights
              </h4>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">{rec.notes}</p>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Sparkles size={10} className="text-cyan-500" />
                    <span className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">AI Recommendation</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {rec.riskScore > 80
                      ? 'Critical payable. Immediate CFO escalation required. Vendor supply suspension risk is high — process payment within 48 hours to avoid operational disruption.'
                      : rec.riskScore > 60
                      ? 'High-priority payable overdue. Schedule for next payment batch. Vendor relationship at risk — communicate payment timeline immediately.'
                      : rec.riskScore > 30
                      ? 'Moderate risk. Ensure approval workflow is completed and payment scheduled within SLA. Verify GRN before releasing funds.'
                      : 'Low-risk payable within terms. Include in standard payment batch. All procurement controls satisfied.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors">
                  <Calendar size={12} />Schedule Payment
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <CheckCircle2 size={12} />Approve
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </td>
    </motion.tr>
  );
}

// ─── Column widths ────────────────────────────────────────────────────────────
const COL_WIDTHS = {
  sel: 40, invoice: 148, vendor: 190, category: 130, branch: 120, dept: 110,
  invDate: 100, dueDate: 100, aging: 80, amount: 120, outstanding: 120,
  paid: 140, payStatus: 120, apvStatus: 140, procStatus: 130, taxStatus: 100,
  risk: 130, approver: 140, updated: 100, actions: 80,
};

const SORT_FIELDS = ['invoice','aging','amount','outstanding'];

export default function APGrid({ rows, selectedRows, onSelect, onSelectAll, onRowClick, onAction }) {
  const [expanded,   setExpanded]   = useState(new Set());
  const [sortField,  setSortField]  = useState('aging');
  const [sortDir,    setSortDir]    = useState('desc');
  const [hoveredRow, setHoveredRow] = useState(null);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const fieldMap = { invoice: 'invoiceNo', aging: 'agingDays', amount: 'invoiceAmount', outstanding: 'outstandingAmount' };
      const f   = fieldMap[sortField] ?? sortField;
      const dir = sortDir === 'asc' ? 1 : -1;
      if (a[f] < b[f]) return -dir;
      if (a[f] > b[f]) return dir;
      return 0;
    });
  }, [rows, sortField, sortDir]);

  const toggleSort = (f) => {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const SortIcon = ({ f }) => (
    sortField === f
      ? sortDir === 'asc' ? <ChevronUp size={12} className="text-amber-500" /> : <ChevronDown size={12} className="text-amber-500" />
      : <ArrowUpDown size={11} className="text-slate-300 group-hover:text-slate-500" />
  );

  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const partial     = selectedRows.length > 0 && selectedRows.length < rows.length;

  const COLS = [
    { key: 'invoice',     label: 'Invoice No',       sortable: true  },
    { key: 'vendor',      label: 'Vendor',           sortable: false },
    { key: 'category',    label: 'Category',         sortable: false },
    { key: 'branch',      label: 'Branch',           sortable: false },
    { key: 'dept',        label: 'Department',       sortable: false },
    { key: 'invDate',     label: 'Invoice Date',     sortable: false },
    { key: 'dueDate',     label: 'Due Date',         sortable: false },
    { key: 'aging',       label: 'Aging',            sortable: true  },
    { key: 'amount',      label: 'Invoice Amt',      sortable: true  },
    { key: 'outstanding', label: 'Outstanding',      sortable: true  },
    { key: 'paid',        label: 'Payment Progress', sortable: false },
    { key: 'payStatus',   label: 'Payment',          sortable: false },
    { key: 'apvStatus',   label: 'Approval',         sortable: false },
    { key: 'procStatus',  label: 'Procurement',      sortable: false },
    { key: 'taxStatus',   label: 'Tax Status',       sortable: false },
    { key: 'risk',        label: 'Risk',             sortable: false },
    { key: 'approver',    label: 'Approver',         sortable: false },
    { key: 'updated',     label: 'Updated',          sortable: false },
    { key: 'actions',     label: '',                 sortable: false },
  ];

  const TAX_COLORS = {
    GST_FILED: 'text-emerald-600 dark:text-emerald-400',
    PENDING:   'text-amber-600 dark:text-amber-400',
    DISPUTED:  'text-red-600 dark:text-red-400',
  };

  const APPROVER_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ef4444'];

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full min-w-[2000px] border-collapse text-sm">
        {/* Sticky header */}
        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            {/* Checkbox */}
            <th style={{ width: COL_WIDTHS.sel }} className="px-3 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => el && (el.indeterminate = partial)}
                onChange={() => onSelectAll()}
                className="rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500"
              />
            </th>
            {COLS.map(col => (
              <th
                key={col.key}
                style={{ width: COL_WIDTHS[col.key] }}
                className={`px-3 py-3 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap group
                  ${col.sortable ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-300' : ''}`}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && <SortIcon f={col.key} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={20} className="py-20 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-600">
                  <RefreshCw size={32} className="opacity-40" />
                  <p className="text-sm font-medium">No payables match your filters</p>
                  <p className="text-xs">Try adjusting your search or filter criteria</p>
                </div>
              </td>
            </tr>
          ) : sorted.map((rec, idx) => {
            const isExpanded = expanded.has(rec.id);
            const isSelected = selectedRows.includes(rec.id);
            const isHovered  = hoveredRow === rec.id;
            const aging      = agingBadge(rec.agingDays);
            const isOverdue  = rec.paymentStatus === 'OVERDUE';
            const isCritical = rec.riskLevel === 'CRITICAL';
            const approverIdx= ['Dr. Anita Rao','Rajiv Sharma','Nisha Mehta','Pradeep Nair','Sunita Pillai','Arvind Kumar'].indexOf(rec.assignedApprover);

            return (
              <>
                <motion.tr
                  key={rec.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.25 }}
                  onMouseEnter={() => setHoveredRow(rec.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`border-b transition-colors cursor-pointer
                    ${isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                      : isHovered
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}
                    ${isExpanded ? 'border-l-2 border-l-amber-400' : ''}
                    ${isCritical && !isSelected ? 'border-l-2 border-l-red-500' : ''}
                  `}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={() => onSelect(rec.id)}
                      className="rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500" />
                  </td>

                  {/* Invoice */}
                  <td className="px-3 py-2.5" onClick={() => toggleExpand(rec.id)}>
                    <div className="flex items-center gap-1.5">
                      <button className="text-slate-400 hover:text-amber-500 transition-colors flex-none">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <div>
                        <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline block">
                          {rec.invoiceNo}
                        </span>
                        {isCritical && (
                          <span className="text-[9px] text-red-500 font-semibold flex items-center gap-0.5">
                            <ShieldAlert size={9} />Critical Risk
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Vendor */}
                  <td className="px-3 py-2.5" onClick={() => toggleExpand(rec.id)}>
                    <div className="flex items-center gap-2">
                      <AvatarInitials
                        name={rec.vendorName}
                        color={VENDOR_CATEGORIES[rec.category]?.color}
                      />
                      <div>
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]" title={rec.vendorName}>
                          {rec.vendorName}
                        </div>
                        <div className="text-[10px] text-slate-400">{rec.vendorCode}</div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2.5"><CategoryBadge cat={rec.category} /></td>

                  {/* Branch */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-slate-600 dark:text-slate-400">{rec.branch}</span>
                  </td>

                  {/* Department */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate block max-w-[90px]">{rec.department}</span>
                  </td>

                  {/* Invoice date */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{rec.invoiceDate}</span>
                  </td>

                  {/* Due date */}
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-mono ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {rec.dueDate}
                    </span>
                  </td>

                  {/* Aging */}
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${aging.cls}`}>
                      {aging.label}
                    </span>
                  </td>

                  {/* Invoice amount */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                      ₹{rec.invoiceAmount.toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Outstanding */}
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-mono font-bold ${rec.outstandingAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      ₹{rec.outstandingAmount.toLocaleString('en-IN')}
                    </span>
                  </td>

                  {/* Payment progress */}
                  <td className="px-3 py-2.5">
                    <PaymentBar
                      invoice={rec.invoiceAmount}
                      paid={rec.paidAmount}
                      outstanding={rec.outstandingAmount}
                    />
                  </td>

                  {/* Payment status */}
                  <td className="px-3 py-2.5"><PaymentBadge status={rec.paymentStatus} /></td>

                  {/* Approval status */}
                  <td className="px-3 py-2.5"><ApprovalBadge status={rec.approvalStatus} /></td>

                  {/* Procurement */}
                  <td className="px-3 py-2.5"><ProcurementBadge status={rec.procurementStatus} /></td>

                  {/* Tax */}
                  <td className="px-3 py-2.5">
                    <span className={`text-[11px] font-medium ${TAX_COLORS[rec.taxStatus] ?? 'text-slate-500 dark:text-slate-400'}`}>
                      {rec.taxStatus?.replace(/_/g, ' ') ?? '—'}
                    </span>
                  </td>

                  {/* Risk */}
                  <td className="px-3 py-2.5"><RiskBar level={rec.riskLevel} score={rec.riskScore} /></td>

                  {/* Approver */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <AvatarInitials name={rec.assignedApprover} color={APPROVER_COLORS[approverIdx] ?? '#6366f1'} />
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                        {rec.assignedApprover?.split(' ').slice(-1)[0]}
                      </span>
                    </div>
                  </td>

                  {/* Last updated */}
                  <td className="px-3 py-2.5">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{rec.lastUpdated}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                          <button onClick={() => onAction('view', rec)} title="View Invoice"
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors">
                            <Eye size={11} />
                          </button>
                          <button onClick={() => onAction('schedule', rec)} title="Schedule Payment"
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                            <Calendar size={11} />
                          </button>
                          <button title="More actions"
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <MoreHorizontal size={11} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </motion.tr>

                {/* Expanded row */}
                <AnimatePresence>
                  {isExpanded && <ExpandedRow key={`${rec.id}-exp`} rec={rec} />}
                </AnimatePresence>
              </>
            );
          })}
        </tbody>
      </table>

      {/* Live sync chip */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1.5 shadow-lg text-[11px] text-slate-500 dark:text-slate-400 z-20">
        <Zap size={11} className="text-amber-500 animate-pulse" />
        Live · Updated just now
      </div>
    </div>
  );
}
