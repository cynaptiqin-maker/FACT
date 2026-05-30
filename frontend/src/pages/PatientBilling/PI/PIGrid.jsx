import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, MoreHorizontal, Eye, Edit3, IndianRupee,
  RefreshCcw, Send, BookOpen, FileText, GitBranch, FileSearch,
  Printer, Shield, Zap, ArrowUpDown, CheckSquare, Square,
  ExternalLink, AlertTriangle, Building2, User, Clock,
} from 'lucide-react';
import {
  BILL_TYPES, INV_STATUSES, CLAIM_STATUSES, RISK_LEVELS, WORKFLOW_STATES,
  fmtINR, fmtINRFull, fmtDate, fmtTime, MOCK_INVOICES,
} from './PIConstants';

// ─── Cell badge helpers ────────────────────────────────────────────────────────
function TypeBadge({ typeKey }) {
  const cfg = BILL_TYPES[typeKey] ?? BILL_TYPES.OP;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ statusKey }) {
  const cfg = INV_STATUSES[statusKey] ?? INV_STATUSES.PROVISIONAL;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function ClaimBadge({ statusKey }) {
  const cfg = CLAIM_STATUSES[statusKey] ?? CLAIM_STATUSES.NOT_APPLICABLE;
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={`w-1.5 h-1.5 rounded-full flex-none ${cfg.dot}`} />
      <span className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

function RiskBadge({ level }) {
  const cfg = RISK_LEVELS[level] ?? RISK_LEVELS.LOW;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function WfBadge({ state }) {
  const cfg = WORKFLOW_STATES[state];
  if (!cfg) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium"
      style={{ color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function CollectionBar({ collected, net }) {
  const pct = net > 0 ? Math.min(100, (collected / net) * 100) : 0;
  const color = pct >= 90 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10.5px] font-semibold tabular-nums" style={{ color }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

// ─── Inline expanded detail ────────────────────────────────────────────────────
function ExpandedRow({ inv, onOpenDrawer }) {
  const [tab, setTab] = useState('breakdown');
  const TABS = [
    { id:'breakdown', label:'Service Breakdown' },
    { id:'financial', label:'Financial Links'   },
    { id:'insurance', label:'Insurance'         },
    { id:'audit',     label:'Audit Trail'       },
  ];

  const xLinks = [
    { label:'View AR Entry',      icon:FileText,   href:'#', color:'text-blue-600 dark:text-blue-400'  },
    { label:'Open GL Posting',    icon:BookOpen,   href:'#', color:'text-violet-600 dark:text-violet-400' },
    { label:'View Journal',       icon:FileText,   href:'#', color:'text-cyan-600 dark:text-cyan-400'   },
    { label:'Cash Book',          icon:IndianRupee,href:'#', color:'text-emerald-600 dark:text-emerald-400' },
    { label:'Bank Recon',         icon:Building2,  href:'#', color:'text-indigo-600 dark:text-indigo-400' },
    { label:'Workflow History',   icon:GitBranch,  href:'#', color:'text-amber-600 dark:text-amber-400'  },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="mx-3 mb-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/60 dark:bg-slate-900/50 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-[11px] font-semibold transition-colors border-b-2
                ${tab === t.id
                  ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}>
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 px-3">
            {[
              { icon: Eye,       tip: 'View Full', action: () => onOpenDrawer(inv) },
              { icon: Printer,   tip: 'Print',     action: () => {} },
              { icon: Send,      tip: 'Submit Claim', action: () => {} },
            ].map(({ icon: Icon, tip, action }) => (
              <button key={tip} onClick={action} title={tip}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 transition-colors">
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {/* ── Service Breakdown ── */}
          {tab === 'breakdown' && (
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3 overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase text-[10px] tracking-wide">
                      <th className="text-left pb-2 pr-4">Service</th>
                      <th className="text-left pb-2 pr-3 whitespace-nowrap">Code</th>
                      <th className="text-right pb-2 pr-3">Qty</th>
                      <th className="text-right pb-2 pr-3">Rate</th>
                      <th className="text-right pb-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.services.map((s, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="py-1.5 pr-4 text-slate-700 dark:text-slate-300 font-medium">{s.name}</td>
                        <td className="py-1.5 pr-3 font-mono text-[11px] text-slate-400">{s.code}</td>
                        <td className="py-1.5 pr-3 text-right text-slate-500">{s.qty}</td>
                        <td className="py-1.5 pr-3 text-right font-mono text-slate-500">{fmtINRFull(s.amount / s.qty)}</td>
                        <td className="py-1.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">{fmtINRFull(s.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="col-span-2 space-y-2">
                {[
                  ['Gross Total',        fmtINRFull(inv.gross),        'text-slate-700 dark:text-slate-200', false],
                  ['Discount',           `- ${fmtINRFull(inv.discAmt)} (${inv.discPct}%)`, 'text-amber-600 dark:text-amber-400', true],
                  ['Taxable Amount',     fmtINRFull(inv.taxable),      'text-slate-700 dark:text-slate-200', false],
                  ['CGST 2.5%',          fmtINRFull(inv.cgst),         'text-slate-500 dark:text-slate-400', false],
                  ['SGST 2.5%',          fmtINRFull(inv.sgst),         'text-slate-500 dark:text-slate-400', false],
                  ['Net Amount',         fmtINRFull(inv.net),          'text-slate-900 dark:text-white font-bold', false],
                  ['Patient Share',      fmtINRFull(inv.patShare),     'text-violet-700 dark:text-violet-400', false],
                  ...(inv.isInsurance ? [['Insurance Share', fmtINRFull(inv.insShare), 'text-blue-700 dark:text-blue-400', false]] : []),
                  ['Collected',          fmtINRFull(inv.collected),    'text-emerald-700 dark:text-emerald-400 font-semibold', false],
                  ['Outstanding',        fmtINRFull(inv.outstanding),  inv.outstanding > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-400', false],
                ].map(([label, value, cls, skip]) => (
                  !skip || inv.discAmt > 0 ? (
                    <div key={label} className={`flex justify-between text-[12px] ${label === 'Net Amount' ? 'border-t border-slate-200 dark:border-slate-700 pt-2 mt-1' : ''}`}>
                      <span className="text-slate-500 dark:text-slate-400">{label}</span>
                      <span className={cls}>{value}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* ── Financial Links ── */}
          {tab === 'financial' && (
            <div className="grid grid-cols-3 gap-3">
              {xLinks.map(({ label, icon: Icon, href, color }) => (
                <a key={label} href={href}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-none">
                    <Icon size={15} className={color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{label}</p>
                    <p className="text-[10.5px] text-slate-400 font-mono truncate">
                      {label.includes('AR') ? inv.arEntry : label.includes('Journal') ? inv.jvNo : inv.invoiceNo}
                    </p>
                  </div>
                  <ExternalLink size={11} className="ml-auto text-slate-300 group-hover:text-slate-500 flex-none" />
                </a>
              ))}
              <div className="col-span-3 grid grid-cols-4 gap-3 pt-2">
                {[
                  { label:'GL Posted',     value: inv.glPosted ? '✓ Yes' : '✗ No', color: inv.glPosted ? 'text-emerald-600' : 'text-red-500' },
                  { label:'JV Number',     value: inv.jvNo ?? '—',                  color: 'text-violet-600 dark:text-violet-400 font-mono text-[11px]' },
                  { label:'AR Entry',      value: inv.arEntry ?? '—',               color: 'text-blue-600 dark:text-blue-400 font-mono text-[11px]' },
                  { label:'Fiscal Year',   value: 'FY 2025-26',                     color: 'text-slate-600 dark:text-slate-300' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                    <p className={`text-[13px] font-bold mt-0.5 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Insurance ── */}
          {tab === 'insurance' && (
            inv.isInsurance ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {[
                    ['TPA',               inv.tpa],
                    ['Insurer',           inv.insurer ?? '—'],
                    ['Policy Number',     inv.policyNo ?? '—'],
                    ['Claim Status',      CLAIM_STATUSES[inv.claimStatus]?.label ?? inv.claimStatus],
                    ['Insurance Share',   fmtINRFull(inv.insShare)],
                    ['Patient Share',     fmtINRFull(inv.patShare)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-[12px] py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400">{label}</span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-700/40">
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">Claim Timeline</p>
                    {[
                      'Claim Drafted', 'Submitted to TPA', 'Under Review', 'Query Resolved', 'Settlement'
                    ].map((stage, idx, arr) => {
                      const done = idx <= (inv.claimStatus === 'SETTLED' ? 4 : inv.claimStatus === 'QUERY_RAISED' ? 3 : inv.claimStatus === 'UNDER_REVIEW' ? 2 : inv.claimStatus === 'SUBMITTED' ? 1 : 0);
                      return (
                        <div key={stage} className="flex items-center gap-2 py-0.5">
                          <div className={`w-2.5 h-2.5 rounded-full flex-none ${done ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                          <span className={`text-[11px] ${done ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{stage}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-slate-400 text-center py-4">This invoice is not linked to insurance / TPA.</p>
            )
          )}

          {/* ── Audit Trail ── */}
          {tab === 'audit' && (
            <div className="space-y-3">
              {inv.auditTrail.map((entry, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center flex-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-none" />
                    {idx < inv.auditTrail.length - 1 && (
                      <div className="flex-1 w-px bg-slate-200 dark:bg-slate-700 mt-1" />
                    )}
                  </div>
                  <div className="pb-3 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{entry.action}</p>
                      <span className="text-[10.5px] text-slate-400 font-mono">{entry.time}</span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">{entry.note}</p>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">by {entry.user}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Row action menu ───────────────────────────────────────────────────────────
function RowMenu({ inv, onAction, onClose }) {
  const actions = [
    { label: 'View Details',       icon: Eye,          action: 'view'           },
    { label: 'Edit Invoice',       icon: Edit3,        action: 'edit'           },
    { label: 'Record Payment',     icon: IndianRupee,  action: 'payment'        },
    { label: 'Process Refund',     icon: RefreshCcw,   action: 'refund'         },
    { label: 'Submit Claim',       icon: Send,         action: 'claim', show: inv.isInsurance },
    { label: 'View AR Entry',      icon: FileText,     action: 'ar'             },
    { label: 'Open GL Posting',    icon: BookOpen,     action: 'gl'             },
    { label: 'Journal Voucher',    icon: FileText,     action: 'jv'             },
    { label: 'Workflow History',   icon: GitBranch,    action: 'workflow'       },
    { label: 'View Audit Trail',   icon: FileSearch,   action: 'audit'          },
    { label: 'Print Invoice',      icon: Printer,      action: 'print'          },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -4 }}
      transition={{ duration: 0.13 }}
      className="absolute right-8 top-8 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
        rounded-xl shadow-2xl py-1 min-w-[180px]"
    >
      {actions.filter(a => a.show !== false).map(({ label, icon: Icon, action }) => (
        <button key={action}
          onClick={() => { onAction(action, inv); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-medium text-slate-700 dark:text-slate-200
            hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-700 dark:hover:text-rose-400 transition-colors">
          <Icon size={13} />
          {label}
        </button>
      ))}
    </motion.div>
  );
}

// ─── Column header ─────────────────────────────────────────────────────────────
function ColHead({ children, sortKey, sortState, onSort, sticky, className = '' }) {
  const active = sortState?.key === sortKey;
  return (
    <th
      className={`text-left px-3 py-2.5 text-[10.5px] font-bold text-slate-500 dark:text-slate-400
        uppercase tracking-wide border-b border-slate-200 dark:border-slate-700
        bg-slate-50 dark:bg-slate-900 whitespace-nowrap select-none
        ${sticky ? 'sticky z-20 bg-slate-50 dark:bg-slate-900' : ''}
        ${className}`}
      style={sticky ? { left: sticky } : undefined}
    >
      {sortKey ? (
        <button onClick={() => onSort?.(sortKey)}
          className="flex items-center gap-1 hover:text-rose-600 transition-colors">
          {children}
          <ArrowUpDown size={10} className={active ? 'text-rose-500' : 'text-slate-300'} />
        </button>
      ) : children}
    </th>
  );
}

// ─── Main Grid ─────────────────────────────────────────────────────────────────
export default function PIGrid({ filters, selectedRows, setSelectedRows, onOpenDrawer, onRowAction }) {
  const [expandedId, setExpandedId] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [sort, setSort] = useState({ key: 'invoiceDate', dir: 'desc' });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const filtered = useMemo(() => {
    const s = filters?.search?.toLowerCase() ?? '';
    return MOCK_INVOICES.filter(inv => {
      if (s && !inv.patientName.toLowerCase().includes(s)
              && !inv.uhid.toLowerCase().includes(s)
              && !inv.invoiceNo.toLowerCase().includes(s)
              && !inv.doctor.toLowerCase().includes(s)
              && !inv.department.toLowerCase().includes(s)) return false;
      if (filters?.status && INV_STATUSES[inv.status]?.label !== filters.status) return false;
      if (filters?.billType && BILL_TYPES[inv.billType]?.label !== filters.billType) return false;
      if (filters?.department && inv.department !== filters.department) return false;
      if (filters?.tpa && inv.tpa !== filters.tpa) return false;
      if (filters?.branch && inv.branch !== filters.branch) return false;
      if (filters?.riskLevel && RISK_LEVELS[inv.riskLevel]?.label !== filters.riskLevel) return false;
      if (filters?.claimStatus && CLAIM_STATUSES[inv.claimStatus]?.label !== filters.claimStatus) return false;
      if (filters?.amtMin && inv.net < Number(filters.amtMin)) return false;
      if (filters?.amtMax && inv.net > Number(filters.amtMax)) return false;
      return true;
    }).sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'invoiceDate') return dir * (new Date(a.invoiceDate) - new Date(b.invoiceDate));
      if (sort.key === 'net')         return dir * (a.net - b.net);
      if (sort.key === 'outstanding') return dir * (a.outstanding - b.outstanding);
      if (sort.key === 'collected')   return dir * (a.collected - b.collected);
      return 0;
    });
  }, [filters, sort]);

  const paginated = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore    = paginated.length < filtered.length;

  const toggleSelect = useCallback((id) => {
    setSelectedRows(r => r.includes(id) ? r.filter(x => x !== id) : [...r, id]);
  }, [setSelectedRows]);

  const toggleAll = useCallback(() => {
    setSelectedRows(r => r.length === filtered.length ? [] : filtered.map(x => x.id));
  }, [filtered, setSelectedRows]);

  const handleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };

  const allSelected = filtered.length > 0 && selectedRows.length === filtered.length;

  return (
    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
      {/* Row count */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/60">
        <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
          {filtered.length} invoices
          {selectedRows.length > 0 && (
            <span className="ml-2 text-rose-600 dark:text-rose-400">· {selectedRows.length} selected</span>
          )}
        </span>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Paid
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Partial
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Overdue
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Leakage
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[1600px]">
          <thead>
            <tr>
              {/* Checkbox */}
              <th className="sticky left-0 z-20 w-10 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <button onClick={toggleAll} className="text-slate-400 hover:text-rose-500 transition-colors">
                  {allSelected ? <CheckSquare size={14} className="text-rose-500" /> : <Square size={14} />}
                </button>
              </th>
              <ColHead sortKey="invoiceDate" sortState={sort} onSort={handleSort} sticky="40px">Invoice No.</ColHead>
              <ColHead sticky="180px">Patient</ColHead>
              <th className="sticky left-[360px] z-20 text-left px-3 py-2.5 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 whitespace-nowrap">
                UHID
              </th>
              <ColHead>Branch</ColHead>
              <ColHead>Department</ColHead>
              <ColHead>Doctor</ColHead>
              <ColHead>Bill Type</ColHead>
              <ColHead>Date</ColHead>
              <ColHead sortKey="net" sortState={sort} onSort={handleSort}>Gross Amt</ColHead>
              <ColHead>Discount</ColHead>
              <ColHead sortKey="net" sortState={sort} onSort={handleSort}>Net Amt</ColHead>
              <ColHead sortKey="collected" sortState={sort} onSort={handleSort}>Collected</ColHead>
              <ColHead sortKey="outstanding" sortState={sort} onSort={handleSort}>Outstanding</ColHead>
              <ColHead>Collection</ColHead>
              <ColHead>Ins. Status</ColHead>
              <ColHead>Claim Status</ColHead>
              <ColHead>Pay Status</ColHead>
              <ColHead>Risk</ColHead>
              <ColHead>Workflow</ColHead>
              <ColHead>Leakage</ColHead>
              <th className="text-left px-3 py-2.5 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 w-10" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paginated.map((inv, idx) => {
                const isExp   = expandedId === inv.id;
                const isSel   = selectedRows.includes(inv.id);
                const hasLeak = inv.leakage;
                return [
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx < PAGE_SIZE ? idx * 0.015 : 0 }}
                    onClick={() => setExpandedId(isExp ? null : inv.id)}
                    className={`group border-b border-slate-100 dark:border-slate-700/50 cursor-pointer
                      transition-colors duration-100
                      ${isSel ? 'bg-rose-50/60 dark:bg-rose-900/10' : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/30'}
                      ${hasLeak ? 'border-l-2 border-l-rose-400' : ''}
                    `}
                  >
                    {/* Checkbox */}
                    <td className="sticky left-0 z-10 w-10 px-3 py-2.5 bg-inherit"
                      onClick={e => { e.stopPropagation(); toggleSelect(inv.id); }}>
                      {isSel
                        ? <CheckSquare size={14} className="text-rose-500" />
                        : <Square size={14} className="text-slate-300 group-hover:text-slate-400" />
                      }
                    </td>

                    {/* Invoice No */}
                    <td className="sticky left-[40px] z-10 px-3 py-2.5 bg-inherit">
                      <div className="flex items-center gap-1.5">
                        {isExp
                          ? <ChevronDown size={13} className="text-rose-500 flex-none" />
                          : <ChevronRight size={13} className="text-slate-300 group-hover:text-slate-500 flex-none" />
                        }
                        <span className="text-[12px] font-mono font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {inv.invoiceNo}
                        </span>
                      </div>
                    </td>

                    {/* Patient Name */}
                    <td className="sticky left-[180px] z-10 px-3 py-2.5 bg-inherit">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-none">
                          <User size={11} className="text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
                            {inv.patientName}
                          </p>
                          <p className="text-[10.5px] text-slate-400">{inv.age}y · {inv.gender}</p>
                        </div>
                      </div>
                    </td>

                    {/* UHID */}
                    <td className="sticky left-[360px] z-10 px-3 py-2.5 bg-inherit">
                      <span className="text-[11.5px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {inv.uhid}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 whitespace-nowrap">{inv.branch}</td>
                    <td className="px-3 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 whitespace-nowrap">{inv.department}</td>
                    <td className="px-3 py-2.5 text-[12px] text-slate-600 dark:text-slate-300 whitespace-nowrap">{inv.doctor}</td>

                    <td className="px-3 py-2.5"><TypeBadge typeKey={inv.billType} /></td>

                    <td className="px-3 py-2.5 text-[12px] font-mono text-slate-500 whitespace-nowrap">
                      {fmtDate(inv.invoiceDate)}
                    </td>

                    {/* Gross */}
                    <td className="px-3 py-2.5 text-right font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {fmtINR(inv.gross)}
                    </td>

                    {/* Discount */}
                    <td className="px-3 py-2.5 text-right font-mono text-[12px] whitespace-nowrap">
                      {inv.discAmt > 0
                        ? <span className="text-amber-600 dark:text-amber-400">-{fmtINR(inv.discAmt)}</span>
                        : <span className="text-slate-300 dark:text-slate-600">—</span>
                      }
                    </td>

                    {/* Net */}
                    <td className="px-3 py-2.5 text-right font-mono text-[12.5px] font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {fmtINR(inv.net)}
                    </td>

                    {/* Collected */}
                    <td className="px-3 py-2.5 text-right font-mono text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {fmtINR(inv.collected)}
                    </td>

                    {/* Outstanding */}
                    <td className="px-3 py-2.5 text-right font-mono text-[12px] font-semibold whitespace-nowrap">
                      {inv.outstanding > 0
                        ? <span className="text-red-600 dark:text-red-400">{fmtINR(inv.outstanding)}</span>
                        : <span className="text-slate-300 dark:text-slate-600">Nil</span>
                      }
                    </td>

                    {/* Collection bar */}
                    <td className="px-3 py-2.5">
                      <CollectionBar collected={inv.collected} net={inv.net} />
                    </td>

                    {/* Insurance status */}
                    <td className="px-3 py-2.5">
                      {inv.isInsurance
                        ? <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
                            <Shield size={11} className="flex-none" />
                            {inv.tpa?.split(' ')[0]}
                          </div>
                        : <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                      }
                    </td>

                    <td className="px-3 py-2.5"><ClaimBadge statusKey={inv.claimStatus} /></td>
                    <td className="px-3 py-2.5"><StatusBadge statusKey={inv.status} /></td>
                    <td className="px-3 py-2.5"><RiskBadge level={inv.riskLevel} /></td>
                    <td className="px-3 py-2.5"><WfBadge state={inv.workflowState} /></td>

                    {/* Leakage */}
                    <td className="px-3 py-2.5">
                      {hasLeak
                        ? <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold whitespace-nowrap">
                            <Zap size={11} className="flex-none" />
                            {fmtINR(inv.leakageAmt)}
                          </div>
                        : <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                      }
                    </td>

                    {/* Action menu */}
                    <td className="px-2 py-2.5 relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuId(menuId === inv.id ? null : inv.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      <AnimatePresence>
                        {menuId === inv.id && (
                          <RowMenu
                            inv={inv}
                            onAction={(action, inv) => { onRowAction?.(action, inv); if (action === 'view') onOpenDrawer(inv); }}
                            onClose={() => setMenuId(null)}
                          />
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>,

                  // Expanded row
                  isExp && (
                    <tr key={`${inv.id}-exp`}>
                      <td colSpan={23}>
                        <ExpandedRow inv={inv} onOpenDrawer={onOpenDrawer} />
                      </td>
                    </tr>
                  ),
                ];
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex items-center justify-center py-3 border-t border-slate-100 dark:border-slate-700/60">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400
              hover:bg-rose-50 dark:hover:bg-rose-900/15 rounded-xl transition-colors"
          >
            Load more ({filtered.length - paginated.length} remaining)
          </button>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <FileText size={22} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">No invoices match your filters</p>
          <p className="text-[12px] text-slate-400 mt-1">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}
