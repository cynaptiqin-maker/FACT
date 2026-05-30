import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Trash2, ChevronDown, ChevronUp, Copy,
  GripVertical, AlertTriangle, CheckCircle2, Clock,
  Package, Shield, Info, Edit3, X, MoreHorizontal,
  ScanLine, Upload, Zap, FileSpreadsheet,
} from 'lucide-react';
import { NI_DEPARTMENTS, NI_DOCTORS, NI_TAX_GROUPS, generateRowId, calcRowTotal, fmt } from './NIConstants';

// ─── Approval status badge ────────────────────────────────────────────────────
function ApprovalBadge({ status }) {
  const map = {
    AUTO:     { label:'Auto',    cls:'bg-emerald-50 text-emerald-600 border-emerald-200', icon:CheckCircle2 },
    PENDING:  { label:'Pending', cls:'bg-amber-50  text-amber-600  border-amber-200',  icon:Clock          },
    APPROVED: { label:'Approved',cls:'bg-sky-50    text-sky-600    border-sky-200',    icon:CheckCircle2   },
    REJECTED: { label:'Rejected',cls:'bg-rose-50   text-rose-600   border-rose-200',   icon:X              },
  };
  const c = map[status ?? 'AUTO'];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${c.cls}`}>
      <c.icon className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

// ─── Expanded row detail ───────────────────────────────────────────────────────
function ExpandedRowDetail({ row }) {
  const dept = NI_DEPARTMENTS.find(d => d.id === row.dept);
  const base = (row.qty || 0) * (row.unitPrice || 0);
  const disc = base * ((row.discPct || 0) / 100);
  const tax  = (base - disc) * ((row.taxPct || 0) / 100);

  return (
    <motion.tr
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{   opacity:0 }}
      transition={{ duration:0.15 }}
    >
      <td colSpan={13} className="bg-slate-50/80 border-b border-slate-100 px-6 py-4">
        <div className="grid grid-cols-4 gap-6">
          {/* Calculation breakdown */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Calculation</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Base Amount</span><span className="font-mono font-medium">{fmt(base)}</span></div>
              <div className="flex justify-between text-amber-600"><span>Discount ({row.discPct || 0}%)</span><span className="font-mono">− {fmt(disc)}</span></div>
              <div className="flex justify-between text-violet-600"><span>Tax ({row.taxPct || 0}%)</span><span className="font-mono">+ {fmt(tax)}</span></div>
              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1 mt-1">
                <span>Net Total</span><span className="font-mono">{fmt(calcRowTotal(row))}</span>
              </div>
            </div>
          </div>

          {/* Service details */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Service Details</div>
            <div className="space-y-1 text-xs text-slate-600">
              <div>Code: <span className="font-mono text-slate-700">{row.code || '—'}</span></div>
              <div>HSN: <span className="font-mono text-slate-700">{row.hsnCode || '—'}</span></div>
              <div>Department: <span className="font-medium">{dept?.name || row.dept || '—'}</span></div>
              <div>Category: <span className="font-medium">{row.category || '—'}</span></div>
            </div>
          </div>

          {/* Insurance & package */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Insurance & Package</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <Shield className={`w-3.5 h-3.5 ${row.insuranceEligible ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className={row.insuranceEligible ? 'text-emerald-600' : 'text-slate-400'}>
                  {row.insuranceEligible ? 'Insurance Eligible' : 'Not Covered'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Package className={`w-3.5 h-3.5 ${row.packageIncluded ? 'text-sky-500' : 'text-slate-300'}`} />
                <span className={row.packageIncluded ? 'text-sky-600' : 'text-slate-400'}>
                  {row.packageIncluded ? 'In Package' : 'Not in Package'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes</div>
            {row.notes
              ? <p className="text-xs text-slate-600 leading-relaxed">{row.notes}</p>
              : <p className="text-xs text-slate-300 italic">No notes added</p>
            }
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Single line item row ─────────────────────────────────────────────────────
function LineItemRow({ row, idx, isEditing, isExpanded, onEdit, onSave, onCancel, onUpdate, onRemove, onExpand, onDuplicate, onOpenSearch }) {
  const depts   = NI_DEPARTMENTS;
  const doctors = NI_DOCTORS;
  const taxes   = NI_TAX_GROUPS;
  const net     = calcRowTotal(row);

  function cellInput(field, type = 'text', opts = {}) {
    const { min, max, step, className: cls = '' } = opts;
    return (
      <input
        type={type}
        value={row[field] ?? ''}
        onChange={e => onUpdate(row.id, field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        min={min} max={max} step={step}
        className={`w-full px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white ${cls}`}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSave(); } if (e.key === 'Escape') onCancel(); }}
      />
    );
  }

  function selectInput(field, options, labelKey = 'name', valueKey = 'id') {
    return (
      <select
        value={row[field] ?? ''}
        onChange={e => onUpdate(row.id, field, e.target.value)}
        className="w-full px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white"
      >
        <option value="">—</option>
        {options.map(o => (
          <option key={o[valueKey]} value={o[valueKey]}>{o[labelKey]}</option>
        ))}
      </select>
    );
  }

  const rowCls = `border-b border-slate-100 text-xs transition-colors ${
    isEditing ? 'bg-sky-50/60 shadow-inner' : 'hover:bg-slate-50/50'
  }`;

  return (
    <>
      <tr className={rowCls} onDoubleClick={onEdit}>
        {/* Drag handle + index */}
        <td className="pl-3 pr-2 py-2 w-10">
          <div className="flex items-center gap-1 text-slate-300">
            <GripVertical className="w-3.5 h-3.5 cursor-grab" />
            <span className="text-slate-400 font-mono text-[10px]">{String(idx + 1).padStart(2,'0')}</span>
          </div>
        </td>

        {/* Service code */}
        <td className="px-2 py-2 w-28">
          {isEditing ? (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1 w-full px-2 py-1 text-xs border border-sky-300 rounded bg-white hover:bg-sky-50 text-left transition-colors"
            >
              <Search className="w-3 h-3 text-sky-400 shrink-0" />
              <span className={`truncate ${row.code ? 'text-slate-700 font-mono' : 'text-slate-300'}`}>
                {row.code || 'Search…'}
              </span>
            </button>
          ) : (
            <span className={`font-mono text-[10px] ${row.code ? 'text-slate-600' : 'text-slate-300'}`}>
              {row.code || '—'}
            </span>
          )}
        </td>

        {/* Description */}
        <td className="px-2 py-2 min-w-[180px]">
          {isEditing ? cellInput('name', 'text', { className:'min-w-[160px]' }) : (
            <div>
              <div className={`font-medium leading-tight ${row.name ? 'text-slate-700' : 'text-slate-300 italic'}`}>
                {row.name || 'Click to search service…'}
              </div>
              {row.category && <div className="text-[10px] text-slate-400 mt-0.5">{row.category}</div>}
            </div>
          )}
        </td>

        {/* Department */}
        <td className="px-2 py-2 w-28">
          {isEditing ? selectInput('dept', depts) : (
            <span className="text-slate-500 text-[10px]">{NI_DEPARTMENTS.find(d => d.id === row.dept)?.name || row.dept || '—'}</span>
          )}
        </td>

        {/* Doctor */}
        <td className="px-2 py-2 w-28">
          {isEditing ? (
            <select
              value={row.doctorId ?? ''}
              onChange={e => {
                const doc = doctors.find(d => d.id === e.target.value);
                onUpdate(row.id, 'doctorId', e.target.value);
                onUpdate(row.id, 'doctor', doc?.name ?? '');
              }}
              className="w-full px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 bg-white"
            >
              <option value="">—</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          ) : (
            <span className="text-slate-500 text-[10px] truncate block max-w-[100px]">{row.doctor || '—'}</span>
          )}
        </td>

        {/* Qty */}
        <td className="px-2 py-2 w-16 text-center">
          {isEditing
            ? cellInput('qty', 'number', { min:1, step:1, className:'text-center w-14' })
            : <span className="text-slate-700 font-medium">{row.qty ?? 1}</span>
          }
        </td>

        {/* Unit Price */}
        <td className="px-2 py-2 w-24 text-right">
          {isEditing
            ? cellInput('unitPrice', 'number', { min:0, step:0.01, className:'text-right w-20' })
            : <span className="font-mono text-slate-700">{fmt(row.unitPrice ?? 0)}</span>
          }
        </td>

        {/* Disc % */}
        <td className="px-2 py-2 w-16 text-center">
          {isEditing
            ? cellInput('discPct', 'number', { min:0, max:100, step:0.5, className:'text-center w-14' })
            : (
              <span className={`${(row.discPct || 0) > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                {row.discPct || 0}%
              </span>
            )
          }
        </td>

        {/* Tax % */}
        <td className="px-2 py-2 w-20">
          {isEditing ? (
            <select
              value={row.taxPct ?? 0}
              onChange={e => onUpdate(row.id, 'taxPct', parseFloat(e.target.value))}
              className="w-full px-1.5 py-1 text-xs border border-sky-300 rounded focus:outline-none bg-white"
            >
              {taxes.map(t => <option key={t.id} value={t.rate}>{t.name}</option>)}
            </select>
          ) : (
            <span className={`${(row.taxPct || 0) > 0 ? 'text-violet-600 font-medium' : 'text-slate-400'}`}>
              {(row.taxPct || 0) > 0 ? `GST ${row.taxPct}%` : 'Exempt'}
            </span>
          )}
        </td>

        {/* Net Amount */}
        <td className="px-2 py-2 w-28 text-right">
          <span className="font-mono font-semibold text-slate-800">{fmt(net)}</span>
        </td>

        {/* Package */}
        <td className="px-2 py-2 w-24 text-center">
          {row.packageIncluded ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-600 border border-sky-200">
              <Package className="w-2.5 h-2.5" /> Pkg
            </span>
          ) : (
            <span className="text-slate-300 text-[10px]">—</span>
          )}
        </td>

        {/* Approval */}
        <td className="px-2 py-2 w-24">
          <ApprovalBadge status={row.approvalStatus ?? 'AUTO'} />
        </td>

        {/* Actions */}
        <td className="px-2 py-2 w-20">
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button onClick={onSave}   title="Save (Enter)" className="p-1 rounded hover:bg-emerald-100 text-emerald-600 transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                <button onClick={onCancel} title="Cancel (Esc)" className="p-1 rounded hover:bg-rose-100    text-rose-500    transition-colors"><X className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <>
                <button onClick={onEdit}      title="Edit row"      className="p-1 rounded hover:bg-sky-100   text-slate-400 hover:text-sky-600   transition-colors"><Edit3   className="w-3.5 h-3.5" /></button>
                <button onClick={onExpand}    title="Expand details" className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <button onClick={onDuplicate} title="Duplicate"     className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Copy    className="w-3.5 h-3.5" /></button>
                <button onClick={() => onRemove(row.id)} title="Delete" className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-500 transition-colors"><Trash2  className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && !isEditing && <ExpandedRowDetail key={`exp-${row.id}`} row={row} />}
      </AnimatePresence>
    </>
  );
}

// ─── Grand totals footer ──────────────────────────────────────────────────────
function GridFooter({ lineItems }) {
  const gross   = lineItems.reduce((s,r) => s + (r.qty||0)*(r.unitPrice||0), 0);
  const discAmt = lineItems.reduce((s,r) => {
    const b = (r.qty||0)*(r.unitPrice||0);
    return s + b * ((r.discPct||0)/100);
  }, 0);
  const taxAmt  = lineItems.reduce((s,r) => {
    const b = (r.qty||0)*(r.unitPrice||0);
    const d = b * ((r.discPct||0)/100);
    return s + (b-d) * ((r.taxPct||0)/100);
  }, 0);
  const net = lineItems.reduce((s,r) => s + calcRowTotal(r), 0);

  return (
    <tfoot>
      <tr className="bg-slate-50 border-t-2 border-slate-200">
        <td colSpan={6} className="px-4 py-3">
          <span className="text-xs font-semibold text-slate-500">{lineItems.length} line item{lineItems.length !== 1 ? 's' : ''}</span>
        </td>
        <td className="px-2 py-3 text-right"><span className="font-mono font-semibold text-sm text-slate-700">{fmt(gross)}</span></td>
        <td className="px-2 py-3 text-center"><span className="font-mono text-amber-600 text-xs font-semibold">−{fmt(discAmt)}</span></td>
        <td className="px-2 py-3 text-center"><span className="font-mono text-violet-600 text-xs font-semibold">+{fmt(taxAmt)}</span></td>
        <td className="px-2 py-3 text-right"><span className="font-mono font-bold text-base text-slate-900">{fmt(net)}</span></td>
        <td colSpan={3} />
      </tr>
    </tfoot>
  );
}

// ─── Column header ────────────────────────────────────────────────────────────
function TH({ children, className = '' }) {
  return (
    <th className={`px-2 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

// ─── Main grid component ──────────────────────────────────────────────────────
export default function NILineItemGrid({ lineItems, setLineItems, onOpenSearch }) {
  const [editRowId,     setEditRowId]     = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const tableRef = useRef(null);

  const addRow = useCallback(() => {
    const row = {
      id: generateRowId(), code:'', name:'', category:'', dept:'', doctor:'', doctorId:'',
      qty:1, unitPrice:0, discPct:0, taxPct:0,
      hsnCode:'', insuranceEligible:true, packageIncluded:false,
      approvalStatus:'AUTO', notes:'',
    };
    setLineItems(prev => [...prev, row]);
    setEditRowId(row.id);
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior:'smooth', block:'end' }), 100);
  }, [setLineItems]);

  const updateRow = useCallback((id, field, value) => {
    setLineItems(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, [setLineItems]);

  const removeRow = useCallback((id) => {
    setLineItems(prev => prev.filter(r => r.id !== id));
    if (editRowId === id) setEditRowId(null);
  }, [setLineItems, editRowId]);

  const duplicateRow = useCallback((row) => {
    const newRow = { ...row, id: generateRowId(), approvalStatus:'AUTO' };
    setLineItems(prev => {
      const idx = prev.findIndex(r => r.id === row.id);
      const next = [...prev];
      next.splice(idx + 1, 0, newRow);
      return next;
    });
  }, [setLineItems]);

  function handleOpenSearch(rowId) {
    setEditRowId(rowId);
    onOpenSearch(rowId);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" ref={tableRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-sky-100 text-sky-600">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-slate-700">Invoice Line Items</h3>
          {lineItems.length > 0 && (
            <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
              {lineItems.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 hidden md:inline">
            <kbd className="font-mono bg-slate-100 px-1 rounded">Ctrl+N</kbd> add · <kbd className="font-mono bg-slate-100 px-1 rounded">/</kbd> search · <kbd className="font-mono bg-slate-100 px-1 rounded">Esc</kbd> cancel
          </span>
          <button
            onClick={() => onOpenSearch(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Search className="w-3.5 h-3.5" /> Search Services
          </button>
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors" title="Import from clinical orders">
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors" title="Scan barcode">
            <ScanLine className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <TH className="w-12 pl-3">#</TH>
              <TH className="w-28">Code</TH>
              <TH className="min-w-[180px]">Description</TH>
              <TH className="w-28">Department</TH>
              <TH className="w-28">Doctor</TH>
              <TH className="w-16 text-center">Qty</TH>
              <TH className="w-24 text-right">Rate</TH>
              <TH className="w-16 text-center">Disc%</TH>
              <TH className="w-20">Tax</TH>
              <TH className="w-28 text-right">Net Amount</TH>
              <TH className="w-24 text-center">Package</TH>
              <TH className="w-24">Approval</TH>
              <TH className="w-20">Actions</TH>
            </tr>
          </thead>

          <AnimatePresence initial={false}>
            {lineItems.map((row, idx) => (
              <motion.tbody
                key={row.id}
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                exit={{   opacity:0 }}
                transition={{ duration:0.18 }}
              >
                <LineItemRow
                  row={row} idx={idx}
                  isEditing={editRowId === row.id}
                  isExpanded={expandedRowId === row.id}
                  onEdit={() => setEditRowId(row.id)}
                  onSave={() => setEditRowId(null)}
                  onCancel={() => setEditRowId(null)}
                  onUpdate={updateRow}
                  onRemove={removeRow}
                  onDuplicate={() => duplicateRow(row)}
                  onExpand={() => setExpandedRowId(expandedRowId === row.id ? null : row.id)}
                  onOpenSearch={() => handleOpenSearch(row.id)}
                />
              </motion.tbody>
            ))}
          </AnimatePresence>

          {lineItems.length > 0 && <GridFooter lineItems={lineItems} />}
        </table>
      </div>

      {/* Empty state */}
      {lineItems.length === 0 && (
        <div className="py-16 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 mx-auto mb-4">
            <Zap className="w-7 h-7 text-sky-400" />
          </div>
          <h4 className="font-semibold text-slate-600 mb-1">No billing items yet</h4>
          <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
            Add services from the catalog, search by service name, or link clinical orders.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onOpenSearch(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-200 text-sky-600 text-sm hover:bg-sky-50 transition-all"
            >
              <Search className="w-4 h-4" /> Search Services
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Row Manually
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-slate-300">
            <span>Press <kbd className="font-mono bg-slate-100 text-slate-500 px-1 rounded">Ctrl+N</kbd> to add a row</span>
            <span>Press <kbd className="font-mono bg-slate-100 text-slate-500 px-1 rounded">/</kbd> to search</span>
          </div>
        </div>
      )}

      {/* Editing hint */}
      {editRowId && (
        <div className="px-4 py-2 bg-sky-50 border-t border-sky-100 flex items-center gap-2 text-xs text-sky-600">
          <Info className="w-3.5 h-3.5" />
          Editing row — press <kbd className="font-mono bg-sky-100 px-1 rounded">Enter</kbd> to save or <kbd className="font-mono bg-sky-100 px-1 rounded">Esc</kbd> to cancel. Double-click any row to edit.
        </div>
      )}
    </div>
  );
}
