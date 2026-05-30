import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, MoreHorizontal, Eye, FileText, GitMerge,
  AlertTriangle, Upload, CreditCard, BookOpen, Landmark, ClipboardList,
  Workflow, Sparkles, CheckSquare, Square, ExternalLink, AlertCircle,
  Zap, ArrowUpRight,
} from 'lucide-react';
import { CLAIM_STATUSES, CLAIM_TYPES, RISK_LEVELS, AGING_BUCKETS, fmtINR, fmtDate } from './ICConstants';

function StatusBadge({ status }) {
  const cfg = CLAIM_STATUSES[status] ?? CLAIM_STATUSES.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const cfg = CLAIM_TYPES[type] ?? CLAIM_TYPES.TPA;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${cfg.lightBg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function RiskBadge({ level, score }) {
  const cfg = RISK_LEVELS[level] ?? RISK_LEVELS.LOW;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
      {score != null && (
        <span className="text-[10px] text-slate-400 font-mono">{score}%</span>
      )}
    </div>
  );
}

function AgingCell({ days }) {
  const bucket = days > 120 ? AGING_BUCKETS[4] : days > 90 ? AGING_BUCKETS[3] : days > 60 ? AGING_BUCKETS[2] : days > 30 ? AGING_BUCKETS[1] : AGING_BUCKETS[0];
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full flex-none" style={{ background: bucket.color }} />
      <span className="text-xs font-mono font-semibold" style={{ color: bucket.color }}>
        {days}d
      </span>
    </div>
  );
}

function RowMenu({ claim, onAction }) {
  const [open, setOpen] = useState(false);

  const actions = [
    { id: 'view',      icon: Eye,           label: 'View Details'       },
    { id: 'invoice',   icon: FileText,       label: 'View Invoice'       },
    { id: 'ar',        icon: ArrowUpRight,   label: 'View AR Entry'      },
    { id: 'denial',    icon: AlertTriangle,  label: 'Open Denial Flow'   },
    { id: 'upload',    icon: Upload,         label: 'Upload Documents'   },
    { id: 'settle',    icon: CreditCard,     label: 'Record Settlement'  },
    { id: 'gl',        icon: BookOpen,       label: 'View GL Postings'   },
    { id: 'bank',      icon: Landmark,       label: 'Bank Reconciliation'},
    { id: 'audit',     icon: ClipboardList,  label: 'Audit Trail'        },
    { id: 'workflow',  icon: Workflow,       label: 'Workflow History'   },
    { id: 'ai',        icon: Sparkles,       label: 'AI Analysis'        },
  ];

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MoreHorizontal size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-8 z-50 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 overflow-hidden"
            >
              {actions.map(a => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(a.id, claim); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Icon size={12} className="flex-none text-slate-400" />
                    {a.label}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function HoverInsight({ claim }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute left-0 right-0 bottom-full mb-1 z-30 pointer-events-none"
    >
      <div className="mx-4 bg-slate-900 dark:bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl">
        <div className="flex items-start gap-4 text-[11px]">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1.5">
              <Sparkles size={10} />
              AI Claim Intelligence
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-slate-400">Denial Risk:</span>
              <span className={`font-bold ${claim.aiDenialRisk > 60 ? 'text-red-400' : claim.aiDenialRisk > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {claim.aiDenialRisk}%
              </span>
              <span className="text-slate-400">Recovery Prob:</span>
              <span className={`font-bold ${claim.aiRecoveryProb > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {claim.aiRecoveryProb}%
              </span>
              {claim.leakage && (
                <>
                  <span className="text-rose-400 flex items-center gap-1"><Zap size={10} />Leakage:</span>
                  <span className="text-rose-300 text-[10.5px]">{claim.leakageNote}</span>
                </>
              )}
              {claim.missingDocs?.length > 0 && (
                <>
                  <span className="text-amber-400">Missing Docs:</span>
                  <span className="text-amber-300">{claim.missingDocs.length} document(s)</span>
                </>
              )}
            </div>
          </div>
          <div className="flex-none text-right">
            <div className="text-slate-400 mb-0.5">AR Entry</div>
            <div className="text-indigo-400 font-mono font-bold">{claim.arEntry ?? '—'}</div>
            <div className="text-slate-400 mt-1 mb-0.5">GL Posting</div>
            <div className="text-indigo-400 font-mono font-bold">{claim.glPosting ?? '—'}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GridRow({ claim, selected, onSelect, onExpand, expanded, onAction }) {
  const [hovering, setHovering] = useState(false);

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => onExpand(claim.id)}
        className={`relative group border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors
          ${selected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/50'}
          ${expanded ? 'bg-indigo-50 dark:bg-indigo-900/15' : ''}
        `}
      >
        {/* Checkbox */}
        <td className="sticky left-0 z-10 w-10 bg-inherit pl-4 pr-2 py-3" onClick={e => { e.stopPropagation(); onSelect(claim.id); }}>
          {selected
            ? <CheckSquare size={15} className="text-indigo-500" />
            : <Square size={15} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
          }
        </td>

        {/* Claim No */}
        <td className="px-3 py-3 min-w-[9rem]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">{claim.id}</span>
            {claim.preAuthNo && (
              <span className="text-[10px] text-slate-400">PA: {claim.preAuthNo}</span>
            )}
          </div>
        </td>

        {/* Patient */}
        <td className="px-3 py-3 min-w-[11rem]">
          <div className="font-semibold text-[12.5px] text-slate-800 dark:text-slate-100">{claim.patientName}</div>
          <div className="text-[10.5px] text-slate-400 mt-0.5">{claim.age}y · {claim.gender}</div>
        </td>

        {/* UHID */}
        <td className="px-3 py-3 min-w-[7rem]">
          <span className="font-mono text-[11.5px] text-slate-600 dark:text-slate-300">{claim.uhid}</span>
        </td>

        {/* Invoice */}
        <td className="px-3 py-3 min-w-[9rem]">
          <button
            onClick={e => { e.stopPropagation(); onAction('invoice', claim); }}
            className="font-mono text-[11.5px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            {claim.invoiceNo}
            <ExternalLink size={9} />
          </button>
        </td>

        {/* TPA */}
        <td className="px-3 py-3 min-w-[11rem]">
          <div className="text-[12px] font-medium text-slate-700 dark:text-slate-200 leading-tight">{claim.tpa}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{claim.branch}</div>
        </td>

        {/* Type */}
        <td className="px-3 py-3 min-w-[8rem]">
          <TypeBadge type={claim.claimType} />
        </td>

        {/* Dept */}
        <td className="px-3 py-3 min-w-[9rem]">
          <div className="text-[12px] text-slate-700 dark:text-slate-200">{claim.department}</div>
          <div className="text-[10px] text-slate-400 truncate max-w-[8rem]">{claim.doctor}</div>
        </td>

        {/* Claim Amt */}
        <td className="px-3 py-3 min-w-[8rem] text-right">
          <span className="font-mono text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{fmtINR(claim.claimAmount)}</span>
        </td>

        {/* Approved */}
        <td className="px-3 py-3 min-w-[7rem] text-right">
          <span className={`font-mono text-[12px] font-semibold ${claim.approvedAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            {claim.approvedAmount > 0 ? fmtINR(claim.approvedAmount) : '—'}
          </span>
        </td>

        {/* Denied */}
        <td className="px-3 py-3 min-w-[7rem] text-right">
          <span className={`font-mono text-[12px] font-semibold ${claim.deniedAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
            {claim.deniedAmount > 0 ? fmtINR(claim.deniedAmount) : '—'}
          </span>
        </td>

        {/* Outstanding */}
        <td className="px-3 py-3 min-w-[7rem] text-right">
          <span className={`font-mono text-[12px] font-bold ${claim.outstandingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
            {claim.outstandingAmount > 0 ? fmtINR(claim.outstandingAmount) : 'Nil'}
          </span>
        </td>

        {/* Status */}
        <td className="px-3 py-3 min-w-[9rem]">
          <StatusBadge status={claim.status} />
        </td>

        {/* Aging */}
        <td className="px-3 py-3 min-w-[6rem]">
          <AgingCell days={claim.agingDays} />
        </td>

        {/* Settlement */}
        <td className="px-3 py-3 min-w-[8rem]">
          <span className={`text-[11px] font-semibold ${
            claim.settlementStatus === 'SETTLED'  ? 'text-emerald-600 dark:text-emerald-400' :
            claim.settlementStatus === 'PARTIAL'  ? 'text-amber-600 dark:text-amber-400' :
            claim.settlementStatus === 'PENDING'  ? 'text-blue-600 dark:text-blue-400' :
            'text-slate-400'
          }`}>
            {claim.settlementStatus?.replace('_', ' ') ?? '—'}
          </span>
        </td>

        {/* Risk */}
        <td className="px-3 py-3 min-w-[6rem]">
          <RiskBadge level={claim.riskLevel} score={claim.aiDenialRisk} />
        </td>

        {/* Workflow */}
        <td className="px-3 py-3 min-w-[11rem]">
          <div className="flex items-center gap-1.5">
            {claim.leakage && <Zap size={11} className="text-rose-400 flex-none" />}
            {claim.missingDocs?.length > 0 && <AlertCircle size={11} className="text-amber-400 flex-none" />}
            <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">{claim.workflowStatus}</span>
          </div>
        </td>

        {/* Updated */}
        <td className="px-3 py-3 min-w-[9rem]">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{claim.lastUpdated}</span>
        </td>

        {/* Actions */}
        <td className="px-3 py-3 min-w-[5rem]" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onAction('view', claim); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <Eye size={13} />
            </button>
            <RowMenu claim={claim} onAction={onAction} />
          </div>
        </td>

        {/* Hover insight tooltip */}
        <AnimatePresence>
          {hovering && claim.aiDenialRisk > 0 && (
            <td className="absolute inset-0 pointer-events-none" style={{ display: 'contents' }}>
              <HoverInsight claim={claim} />
            </td>
          )}
        </AnimatePresence>
      </motion.tr>

      {/* Expand indicator */}
      {expanded && (
        <tr>
          <td colSpan={20} className="bg-indigo-50/50 dark:bg-indigo-900/10 px-4 py-1">
            <div className="flex items-center gap-2 text-[10.5px] text-indigo-500 font-medium">
              <ChevronDown size={11} />
              Expanded — use the detail drawer for full claim information
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ICGrid({
  claims, selectedRows, onSelect, onSelectAll,
  expandedRow, onExpand, onRowAction,
}) {
  const allSelected = claims.length > 0 && selectedRows.length === claims.length;

  return (
    <div className="relative overflow-auto flex-1">
      <table className="w-full border-collapse text-left" style={{ minWidth: '1600px' }}>
        <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-900 w-10 pl-4 pr-2 py-3" onClick={onSelectAll}>
              {allSelected
                ? <CheckSquare size={15} className="text-indigo-500 cursor-pointer" />
                : <Square size={15} className="text-slate-300 dark:text-slate-600 cursor-pointer hover:text-slate-500" />
              }
            </th>
            {[
              'Claim No.','Patient','UHID','Invoice','Insurance / TPA','Type',
              'Department / Doctor','','Claim Amt','Approved','Denied',
              'Outstanding','Status','Aging','Settlement','Risk','Workflow','Updated','Actions',
            ].map((col, i) => (
              <th key={i} className="px-3 py-3 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {claims.length === 0 ? (
            <tr>
              <td colSpan={20} className="py-16 text-center text-slate-400 dark:text-slate-500">
                <div className="flex flex-col items-center gap-3">
                  <Shield size={32} className="text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-medium">No claims match the current filters</p>
                  <p className="text-xs text-slate-400">Adjust filters or search to see claims</p>
                </div>
              </td>
            </tr>
          ) : (
            claims.map(claim => (
              <GridRow
                key={claim.id}
                claim={claim}
                selected={selectedRows.includes(claim.id)}
                onSelect={onSelect}
                expanded={expandedRow === claim.id}
                onExpand={onExpand}
                onAction={onRowAction}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
