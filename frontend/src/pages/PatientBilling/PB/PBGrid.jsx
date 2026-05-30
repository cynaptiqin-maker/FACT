import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, ArrowUpDown, MoreHorizontal,
  IndianRupee, Eye, Printer, RefreshCcw, FileText, Shield,
} from 'lucide-react';
import {
  BILL_TYPES, PAYMENT_STATUSES, INSURANCE_STATUSES, RISK_LEVELS,
  fmtINR, fmtINRFull, fmtDate, fmtTime,
} from './PBConstants';

// ─── Cell renderers ────────────────────────────────────────────────────────────
function TypeBadge({ typeKey }) {
  const cfg = BILL_TYPES[typeKey] ?? BILL_TYPES.OP_CONSULTATION;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}
function PayBadge({ statusKey }) {
  const cfg = PAYMENT_STATUSES[statusKey] ?? PAYMENT_STATUSES.PENDING;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}
function InsBadge({ statusKey }) {
  const cfg = INSURANCE_STATUSES[statusKey] ?? INSURANCE_STATUSES.NOT_APPLICABLE;
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full flex-none ${cfg.dot}`} />
      <span className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}
function RiskBadge({ level }) {
  const cfg = RISK_LEVELS[level] ?? RISK_LEVELS.LOW;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.label}
    </span>
  );
}

// ─── Inline expand ─────────────────────────────────────────────────────────────
function ExpandedRow({ bill, onOpenDrawer }) {
  const [tab, setTab] = useState('breakdown');
  const tabs = [
    { id: 'breakdown', label: 'Service Breakdown' },
    { id: 'payments',  label: 'Payment History'   },
    { id: 'insurance', label: 'Insurance'         },
    { id: 'audit',     label: 'Audit Trail'       },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="mx-4 mb-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-[11px] font-semibold transition-colors border-b-2
                ${tab === t.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 px-3">
            {[
              { icon: Eye,       label: 'View' },
              { icon: Printer,   label: 'Print' },
              { icon: RefreshCcw,label: 'Refund' },
            ].map(({ icon: Icon, label }) => (
              <button key={label} onClick={() => onOpenDrawer(bill)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300
                  border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors">
                <Icon size={11} />{label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {tab === 'breakdown' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wide">
                      <th className="text-left pb-2">Service</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Rate</th>
                      <th className="text-right pb-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.services.map((s, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-1.5 text-slate-700 dark:text-slate-300">{s.name}</td>
                        <td className="py-1.5 text-right text-slate-500">{s.qty}</td>
                        <td className="py-1.5 text-right font-mono text-slate-500">{fmtINRFull(s.rate / s.qty)}</td>
                        <td className="py-1.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">{fmtINRFull(s.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-300 dark:border-slate-600 font-bold">
                      <td colSpan={3} className="pt-2 text-slate-700 dark:text-slate-300">Gross Total</td>
                      <td className="pt-2 text-right font-mono text-slate-900 dark:text-white">{fmtINRFull(bill.gross)}</td>
                    </tr>
                    {bill.disc > 0 && (
                      <tr>
                        <td colSpan={3} className="py-1 text-amber-600 dark:text-amber-400">Discount</td>
                        <td className="py-1 text-right font-mono text-amber-600 dark:text-amber-400">-{fmtINRFull(bill.disc)}</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50 dark:bg-emerald-900/20">
                      <td colSpan={3} className="py-1.5 px-2 font-bold text-emerald-700 dark:text-emerald-400 rounded-l">Net Payable</td>
                      <td className="py-1.5 pr-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 rounded-r">{fmtINRFull(bill.net)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">Payment Summary</p>
                  {[
                    { label: 'Net Amount', value: fmtINRFull(bill.net),         cls: 'text-slate-700 dark:text-slate-300' },
                    { label: 'Paid',       value: fmtINRFull(bill.paid),         cls: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Outstanding',value: fmtINRFull(bill.outstanding),  cls: 'text-red-600 dark:text-red-400 font-bold' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-[12px] py-0.5">
                      <span className="text-slate-500">{r.label}</span>
                      <span className={`font-mono ${r.cls}`}>{r.value}</span>
                    </div>
                  ))}
                  <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (bill.paid / bill.net) * 100).toFixed(0)}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{Math.round((bill.paid / bill.net) * 100)}% collected</p>
                </div>
                <button onClick={() => onOpenDrawer(bill)}
                  className="w-full py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                  Open Full Detail →
                </button>
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div className="overflow-x-auto">
              {bill.payments.length ? (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase tracking-wide">
                      {['Date','Mode','Reference','Amount','By'].map(h => (
                        <th key={h} className="text-left pb-2 pr-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bill.payments.map((p, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-400">{fmtDate(p.date)}</td>
                        <td className="py-1.5 pr-3">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[11px] font-medium">{p.mode}</span>
                        </td>
                        <td className="py-1.5 pr-3 font-mono text-slate-500">{p.ref}</td>
                        <td className="py-1.5 pr-3 font-mono font-semibold text-emerald-600">{fmtINRFull(p.amount)}</td>
                        <td className="py-1.5 text-slate-500">{p.by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-slate-400 text-sm py-4 text-center">No payment records found.</p>}
            </div>
          )}

          {tab === 'insurance' && (
            <div className="grid grid-cols-2 gap-4 text-[12px]">
              <div className="p-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20">
                <p className="font-semibold text-violet-700 dark:text-violet-300 mb-3">TPA / Insurance</p>
                {[
                  ['TPA',           bill.tpa ?? 'N/A'],
                  ['Status',        INSURANCE_STATUSES[bill.insKey]?.label ?? '—'],
                  ['Claimed Amt',   fmtINRFull(bill.net * 0.8)],
                  ['Approved Amt',  bill.insKey === 'APPROVED' ? fmtINRFull(bill.net * 0.75) : '—'],
                  ['Pre-Auth',      'Obtained'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-0.5">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-600 dark:text-slate-300 mb-3">Claim Timeline</p>
                {['Bill Generated','Pre-auth Submitted','Pre-auth Approved','Claim Submitted','Under Review'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 py-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-none ${i < 3 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className={i < 3 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div className="space-y-2 text-[12px]">
              {[
                { user:'System',      action:'Bill Created',           color:'bg-emerald-500' },
                { user:'Rekha Sharma',action:'Services Added',         color:'bg-blue-500'    },
                { user:'Rekha Sharma',action:'Discount Applied (8%)',  color:'bg-amber-500'   },
                { user:'Dr. Mehta S.',action:'Bill Countersigned',     color:'bg-violet-500'  },
                { user:'Rekha Sharma',action:'Payment Recorded',       color:'bg-emerald-500' },
                { user:'System',      action:'Receipt Generated',      color:'bg-slate-400'   },
              ].map((e, i) => (
                <div key={i} className="flex items-start gap-3 pb-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-none ${e.color}`} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 w-28 flex-none">{e.user}</span>
                  <span className="text-slate-500 flex-1">{e.action}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{fmtTime(bill.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Grid ─────────────────────────────────────────────────────────────────
const COLS = [
  { key: 'id',          label: 'Bill No.',      w: 'w-36',   sortable: true  },
  { key: 'name',        label: 'Patient',        w: 'w-40',   sortable: true  },
  { key: 'dept',        label: 'Department',     w: 'w-28',   sortable: true  },
  { key: 'typeKey',     label: 'Type',           w: 'w-32',   sortable: false },
  { key: 'date',        label: 'Date',           w: 'w-26',   sortable: true  },
  { key: 'net',         label: 'Net Amount',     w: 'w-24 text-right', sortable: true  },
  { key: 'outstanding', label: 'Outstanding',    w: 'w-24 text-right', sortable: true  },
  { key: 'payStatusKey',label: 'Pay Status',     w: 'w-28',   sortable: false },
  { key: 'insKey',      label: 'Insurance',      w: 'w-32',   sortable: false },
  { key: 'riskLevel',   label: 'Risk',           w: 'w-20',   sortable: true  },
  { key: 'cashier',     label: 'Cashier',        w: 'w-28',   sortable: true  },
  { key: '_actions',    label: '',               w: 'w-16',   sortable: false },
];

const PAGE_SIZE = 15;

export default function PBGrid({ bills, onOpenDrawer, selected, onSelectChange }) {
  const [expanded, setExpanded]   = useState(null);
  const [page, setPage]           = useState(0);
  const [sortKey, setSortKey]     = useState('date');
  const [sortDir, setSortDir]     = useState(-1);

  const sorted = useMemo(() => {
    return [...bills].sort((a, z) => {
      let av = a[sortKey], zv = z[sortKey];
      if (typeof av === 'string') { av = av.toLowerCase(); zv = zv.toLowerCase(); }
      return (av < zv ? -1 : av > zv ? 1 : 0) * sortDir;
    });
  }, [bills, sortKey, sortDir]);

  const paged      = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  }

  const allSelected = paged.length > 0 && paged.every(b => selected.has(b.id));

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm">
            <span className="font-semibold text-indigo-700 dark:text-indigo-300">{selected.size} selected</span>
            <div className="flex gap-2 ml-auto">
              {['Submit Claims','Send Reminder','Export','Print'].map(a => (
                <button key={a} className="px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">{a}</button>
              ))}
              <button onClick={() => onSelectChange(new Set())} className="px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:underline">Clear</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <table className="min-w-full text-[12px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <th className="w-10 px-3 py-3">
                <input type="checkbox" className="rounded" checked={allSelected}
                  onChange={e => onSelectChange(e.target.checked ? new Set(paged.map(b => b.id)) : new Set())} />
              </th>
              <th className="w-8 px-1 py-3" />
              {COLS.map(c => (
                <th key={c.key}
                  onClick={() => c.sortable && toggleSort(c.key)}
                  className={`px-3 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap
                    ${c.w} ${c.sortable ? 'cursor-pointer hover:text-slate-800 dark:hover:text-slate-200' : ''} transition-colors`}>
                  <span className="flex items-center gap-1">
                    {c.label}
                    {c.sortable && sortKey === c.key && <span className="text-[10px]">{sortDir === 1 ? '▲' : '▼'}</span>}
                    {c.sortable && sortKey !== c.key && <ArrowUpDown size={10} className="opacity-30" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map(bill => (
              <>
                <tr key={bill.id}
                  className={`border-b border-slate-100 dark:border-slate-700/60 hover:bg-indigo-50/30 dark:hover:bg-slate-700/30
                    transition-colors group
                    ${expanded === bill.id ? 'bg-indigo-50/50 dark:bg-slate-700/40' : ''}
                    ${selected.has(bill.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-800/20'}`}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" className="rounded" checked={selected.has(bill.id)}
                      onChange={() => {
                        const ns = new Set(selected);
                        ns.has(bill.id) ? ns.delete(bill.id) : ns.add(bill.id);
                        onSelectChange(ns);
                      }} />
                  </td>
                  <td className="px-1 py-2.5">
                    <button onClick={() => setExpanded(expanded === bill.id ? null : bill.id)}
                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {expanded === bill.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{bill.id}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{bill.name}</p>
                    <p className="text-slate-400 text-[10px]">{bill.uhid}</p>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{bill.dept}</td>
                  <td className="px-3 py-2.5"><TypeBadge typeKey={bill.typeKey} /></td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(bill.date)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">{fmtINR(bill.net)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`font-mono font-bold ${bill.outstanding > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {bill.outstanding > 0 ? fmtINR(bill.outstanding) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5"><PayBadge statusKey={bill.payStatusKey} /></td>
                  <td className="px-3 py-2.5"><InsBadge statusKey={bill.insKey} /></td>
                  <td className="px-3 py-2.5"><RiskBadge level={bill.riskLevel} /></td>
                  <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{bill.cashier.split(' ')[0]}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onOpenDrawer(bill)} title="Open Detail"
                        className="p-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-500 transition-colors">
                        <Eye size={13} />
                      </button>
                      <button title="Record Payment"
                        className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors">
                        <IndianRupee size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
                <AnimatePresence>
                  {expanded === bill.id && (
                    <tr key={`${bill.id}-exp`}>
                      <td colSpan={14} className="p-0">
                        <ExpandedRow bill={bill} onOpenDrawer={onOpenDrawer} />
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={14} className="py-16 text-center text-slate-400 bg-white dark:bg-slate-800/20">
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={32} className="opacity-30" />
                    <p className="font-semibold">No billing records found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 px-1">
        <span>{sorted.length} records · Page {page + 1} of {Math.max(1, totalPages)}</span>
        <div className="flex items-center gap-1">
          {[
            { label:'«', action:() => setPage(0),               disabled: page === 0 },
            { label:'‹', action:() => setPage(p => p-1),        disabled: page === 0 },
            { label:'›', action:() => setPage(p => p+1),        disabled: page >= totalPages - 1 },
            { label:'»', action:() => setPage(totalPages - 1),  disabled: page >= totalPages - 1 },
          ].map((b, i) => (
            <button key={i} disabled={b.disabled} onClick={b.action}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-30
                hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-mono">
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
