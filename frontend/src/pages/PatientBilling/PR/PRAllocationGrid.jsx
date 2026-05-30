import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ChevronDown, ChevronRight, ExternalLink, BookOpen, GitBranch, FileSearch } from 'lucide-react';
import { fmtINR, fmtDate, INV_STATUSES } from './PRConstants';

function StatusBadge({ status }) {
  const cfg = INV_STATUSES[status] ?? INV_STATUSES.PENDING;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function AllocInput({ value, onChange, max }) {
  return (
    <div className="relative w-28">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">₹</span>
      <input
        type="number" min="0" max={max}
        className="w-full pl-5 pr-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 text-[11.5px] text-slate-700 dark:text-slate-300
          focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all tabular-nums"
        placeholder="0"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function ExpandedRow({ inv, alloc }) {
  return (
    <tr>
      <td colSpan={10} className="px-4 pb-4 bg-emerald-50/40 dark:bg-emerald-900/5 border-b border-slate-100 dark:border-slate-800">
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-3 gap-4 pt-3"
        >
          {/* Financial breakdown */}
          <div>
            <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide mb-2">Financial Details</p>
            {[
              ['Type',            inv.type],
              ['Gross Amount',    fmtINR(inv.gross)],
              ['Previously Paid', fmtINR(inv.collected)],
              ['Insurance Share', fmtINR(inv.insurancePending)],
              ['Net Outstanding', fmtINR(inv.outstanding)],
              ['This Allocation', fmtINR(alloc || 0)],
              ['Balance After',   fmtINR(Math.max(0, inv.outstanding - (alloc || 0)))],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[11px] py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">{k}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{v}</span>
              </div>
            ))}
          </div>

          {/* GL & Journal */}
          <div>
            <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide mb-2">GL & Journal</p>
            {[
              ['Journal Voucher', 'JV-2026-09112'],
              ['GL Account',      '12001 – Accounts Receivable'],
              ['Cost Centre',     `OPD – ${inv.type}`],
              ['AR Entry',        `AR-${Math.floor(Math.random()*90000+10000)}`],
              ['Posted By',       'Auto-GL Engine'],
              ['Tax Code',        inv.type === 'PHARMACY' ? 'GST 12%' : 'Exempt'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[11px] py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">{k}</span>
                <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">{v}</span>
              </div>
            ))}
          </div>

          {/* Cross-module links */}
          <div>
            <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide mb-2">Linked Modules</p>
            {[
              { icon: ExternalLink, label: 'Open Invoice →',          href: '#' },
              { icon: BookOpen,    label: 'View GL Posting →',        href: '#' },
              { icon: GitBranch,   label: 'Workflow Timeline →',      href: '#' },
              { icon: FileSearch,  label: 'Audit Trail →',            href: '#' },
              { icon: ExternalLink,label: 'Bank Reconciliation →',    href: '#' },
            ].map(({ icon: Icon, label }) => (
              <button key={label}
                className="flex items-center gap-1.5 w-full text-left text-[11px] text-emerald-600 dark:text-emerald-400
                  hover:text-emerald-700 py-1.5 border-b border-slate-100 dark:border-slate-800 hover:underline transition-colors">
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>
        </motion.div>
      </td>
    </tr>
  );
}

export default function PRAllocationGrid({ patient, allocations, onChange, totalCollected }) {
  const [expanded, setExpanded] = useState(null);

  if (!patient) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-10 shadow-sm text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <BookOpen size={18} className="text-slate-300" />
        </div>
        <p className="text-[13px] font-semibold text-slate-400">Select a patient to view outstanding invoices</p>
        <p className="text-[11px] text-slate-400 mt-1 opacity-70">Allocation workspace will appear here</p>
      </div>
    );
  }

  const invoices = patient.invoices;
  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  const autoAllocate = () => {
    let remaining = totalCollected;
    const next = {};
    for (const inv of [...invoices].sort((a, b) => b.days - a.days)) {
      if (remaining <= 0) break;
      const alloc = Math.min(remaining, inv.outstanding);
      next[inv.id] = alloc;
      remaining -= alloc;
    }
    onChange(next);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide">Invoice Allocation</p>
        <div className="flex gap-2">
          <button onClick={autoAllocate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold
              bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors">
            <Zap size={11} /> Auto-Allocate
          </button>
          <button onClick={() => onChange({})}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold
              border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <X size={11} /> Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              {['Invoice','Date','Type','Gross','Collected','Outstanding','Ins. Pending','Allocate','Balance','Status',''].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[9.5px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              const alloc = parseFloat(allocations[inv.id]) || 0;
              const balance = Math.max(0, inv.outstanding - alloc);
              const isExp = expanded === inv.id;
              const derivedStatus = alloc >= inv.outstanding ? 'PAID' : alloc > 0 ? 'PARTIAL' : inv.status;

              return [
                <tr key={inv.id}
                  className={`border-t border-slate-100 dark:border-slate-800 transition-colors
                    ${isExp ? 'bg-emerald-50/50 dark:bg-emerald-900/5' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                  <td className="px-3 py-2.5">
                    <button onClick={() => setExpanded(isExp ? null : inv.id)}
                      className="flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                      {isExp ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
                      {inv.id.split('-').slice(-1)[0]}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-400 whitespace-nowrap">{inv.date}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9.5px] font-bold text-slate-500 dark:text-slate-400">{inv.type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{fmtINR(inv.gross)}</td>
                  <td className="px-3 py-2.5 text-[11.5px] text-emerald-600 dark:text-emerald-400 tabular-nums">{fmtINR(inv.collected)}</td>
                  <td className="px-3 py-2.5 text-[11.5px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{fmtINR(inv.outstanding)}</td>
                  <td className="px-3 py-2.5 text-[11.5px] text-violet-500 tabular-nums">
                    {inv.insurancePending > 0 ? fmtINR(inv.insurancePending) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <AllocInput
                      value={allocations[inv.id] || ''}
                      max={inv.outstanding}
                      onChange={v => onChange({ ...allocations, [inv.id]: parseFloat(v) || 0 })}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] font-bold tabular-nums"
                    style={{ color: balance === 0 ? '#10b981' : '#f59e0b' }}>
                    {fmtINR(balance)}
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge status={derivedStatus} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => onChange({ ...allocations, [inv.id]: inv.outstanding })}
                        className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9.5px] font-bold hover:bg-emerald-200 transition-colors">
                        Full
                      </button>
                      <button onClick={() => onChange({ ...allocations, [inv.id]: 0 })}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 text-[9.5px] font-bold hover:bg-slate-200 transition-colors">
                        0
                      </button>
                    </div>
                  </td>
                </tr>,
                isExp && <ExpandedRow key={`${inv.id}-exp`} inv={inv} alloc={allocations[inv.id]} />,
              ];
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700">
              <td colSpan={3} className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Totals</td>
              <td className="px-3 py-2.5 text-[12px] font-bold text-slate-700 dark:text-slate-200 tabular-nums">{fmtINR(invoices.reduce((s,i)=>s+i.gross,0))}</td>
              <td className="px-3 py-2.5 text-[12px] font-bold text-emerald-600 tabular-nums">{fmtINR(invoices.reduce((s,i)=>s+i.collected,0))}</td>
              <td className="px-3 py-2.5 text-[12px] font-bold text-amber-600 tabular-nums">{fmtINR(invoices.reduce((s,i)=>s+i.outstanding,0))}</td>
              <td className="px-3 py-2.5 text-[12px] font-bold text-violet-500 tabular-nums">{fmtINR(invoices.reduce((s,i)=>s+i.insurancePending,0))}</td>
              <td className="px-3 py-2.5 text-[12px] font-bold tabular-nums" style={{color:'#10b981'}}>{fmtINR(totalAllocated)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
