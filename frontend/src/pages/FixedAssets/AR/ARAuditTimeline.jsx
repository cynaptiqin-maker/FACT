// ─── Asset Register — Audit & Workflow Timeline ───────────────────────────────
// Immutable audit log · Asset lifecycle events · Cross-module activity
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Package, TrendingDown, Wrench, Shield,
  ArrowRightLeft, Trash2, RefreshCw, CheckCircle2, AlertTriangle,
  GitCommit, FileText, BookOpen, Zap, Eye, Filter, ChevronDown,
} from 'lucide-react';
import { fmtDateTime, fmtDate } from './ARConstants';

const EVENT_CONFIG = {
  ASSET_ACQUIRED:          { icon: Package,       color: '#0ea5e9', label: 'Asset Acquired',          bg: 'bg-sky-50 dark:bg-sky-900/20'      },
  ASSET_CAPITALIZED:       { icon: BookOpen,      color: '#8b5cf6', label: 'Asset Capitalized',       bg: 'bg-violet-50 dark:bg-violet-900/20' },
  DEPRECIATION_RUN:        { icon: TrendingDown,  color: '#f43f5e', label: 'Depreciation Posted',     bg: 'bg-rose-50 dark:bg-rose-900/20'    },
  AMC_RENEWED:             { icon: RefreshCw,     color: '#06b6d4', label: 'AMC Renewed',             bg: 'bg-cyan-50 dark:bg-cyan-900/20'    },
  INSURANCE_RENEWED:       { icon: Shield,        color: '#10b981', label: 'Insurance Renewed',       bg: 'bg-emerald-50 dark:bg-emerald-900/20'},
  MAINTENANCE_COMPLETED:   { icon: Wrench,        color: '#f59e0b', label: 'Maintenance Completed',   bg: 'bg-amber-50 dark:bg-amber-900/20'  },
  MAINTENANCE_SCHEDULED:   { icon: Wrench,        color: '#f97316', label: 'Maintenance Scheduled',   bg: 'bg-orange-50 dark:bg-orange-900/20'},
  ASSET_TRANSFERRED:       { icon: ArrowRightLeft,color: '#7c3aed', label: 'Asset Transferred',       bg: 'bg-violet-50 dark:bg-violet-900/20'},
  ASSET_DISPOSED:          { icon: Trash2,        color: '#ef4444', label: 'Asset Disposed',          bg: 'bg-red-50 dark:bg-red-900/20'      },
  REVALUATION_SKIPPED:     { icon: GitCommit,     color: '#94a3b8', label: 'Revaluation Skipped',     bg: 'bg-slate-50 dark:bg-slate-800'     },
  GL_POSTED:               { icon: FileText,      color: '#6366f1', label: 'GL Entry Posted',         bg: 'bg-indigo-50 dark:bg-indigo-900/20'},
  COMPLIANCE_RENEWED:      { icon: CheckCircle2,  color: '#10b981', label: 'Compliance Updated',      bg: 'bg-emerald-50 dark:bg-emerald-900/20'},
  RISK_DETECTED:           { icon: AlertTriangle, color: '#ef4444', label: 'Risk Alert Raised',       bg: 'bg-red-50 dark:bg-red-900/20'      },
  WORKFLOW_ESCALATED:      { icon: Zap,           color: '#f97316', label: 'Workflow Escalated',      bg: 'bg-orange-50 dark:bg-orange-900/20'},
};

const ALL_EVENTS = [
  { id: 'EVT-001', event: 'ASSET_ACQUIRED',       assetId: 'FA-2026-000001', assetName: 'GE Revolution EVO CT Scanner',    user: 'Priya Mehta',    role: 'Procurement Manager', ts: '2024-08-15T09:30:00', note: 'PO-2024-00892 fulfilled. GRN-2024-01823 verified. Asset received at 2nd Floor Imaging Wing.',          amount: 45000000  },
  { id: 'EVT-002', event: 'ASSET_CAPITALIZED',    assetId: 'FA-2026-000001', assetName: 'GE Revolution EVO CT Scanner',    user: 'Priya Mehta',    role: 'Accounts Manager',   ts: '2024-09-01T10:30:00', note: 'Capitalization approved. GL account 1500-RADIOLOGY-CT posted. JV-2024-09231 created.',               amount: 45000000  },
  { id: 'EVT-003', event: 'AMC_RENEWED',          assetId: 'FA-2026-000001', assetName: 'GE Revolution EVO CT Scanner',    user: 'Suresh Kumar',   role: 'Facilities Manager', ts: '2024-09-05T11:00:00', note: 'AMC contract with GE Healthcare Services activated. Annual value ₹12L.',                                amount: 1200000   },
  { id: 'EVT-004', event: 'INSURANCE_RENEWED',    assetId: 'FA-2026-000001', assetName: 'GE Revolution EVO CT Scanner',    user: 'Kavitha R.',     role: 'Finance Executive',  ts: '2024-09-10T09:00:00', note: 'Insurance policy BAJ-EQP-2024-78230 issued by Bajaj Allianz. Sum insured ₹4.5Cr.',                     amount: 45000000  },
  { id: 'EVT-005', event: 'DEPRECIATION_RUN',     assetId: 'FA-2026-000001', assetName: 'GE Revolution EVO CT Scanner',    user: 'System / Auto',  role: 'System',             ts: '2025-03-31T23:59:00', note: 'Annual depreciation FY 2024-25. WDV method. Charge ₹33.75L. Closing NBV ₹4.16Cr.',                   amount: 3375000   },
  { id: 'EVT-006', event: 'ASSET_ACQUIRED',       assetId: 'FA-2026-000007', assetName: 'da Vinci Si Surgical System',     user: 'Anand Iyer',     role: 'CFO',                ts: '2022-03-15T14:00:00', note: 'High-value robotic surgery asset acquired. Board approval on file. PO-2022-00189.',                    amount: 180000000 },
  { id: 'EVT-007', event: 'MAINTENANCE_SCHEDULED',assetId: 'FA-2026-000007', assetName: 'da Vinci Si Surgical System',     user: 'Biomedical Dept',role: 'Biomedical Team',    ts: '2026-05-10T08:00:00', note: 'Quarterly maintenance initiated by Intuitive Surgical. Expected completion 25 May 2026.',               amount: 0         },
  { id: 'EVT-008', event: 'RISK_DETECTED',        assetId: 'FA-2026-000015', assetName: 'Siemens Biograph mCT PET-CT',     user: 'AI Engine',      role: 'AI Risk Monitor',    ts: '2026-05-18T07:30:00', note: 'AI detected potential duplicate capitalization pattern. Flagged for CFO review. Risk ID: RISK-2026-088.',amount: 0         },
  { id: 'EVT-009', event: 'DEPRECIATION_RUN',     assetId: 'FA-2026-000015', assetName: 'Siemens Biograph mCT PET-CT',     user: 'System / Auto',  role: 'System',             ts: '2026-03-31T23:59:00', note: 'Annual depreciation FY 2025-26. WDV method. Charge ₹2.39Cr. Closing NBV ₹13.53Cr.',                  amount: 23881786  },
  { id: 'EVT-010', event: 'MAINTENANCE_COMPLETED',assetId: 'FA-2026-000001', assetName: 'GE Revolution EVO CT Scanner',    user: 'GE Technician',  role: 'Vendor Technician',  ts: '2026-03-15T14:00:00', note: 'Q1 preventive maintenance completed. All safety checks passed. Next due: 15-Jun-2026.',                 amount: 0         },
  { id: 'EVT-011', event: 'INSURANCE_RENEWED',    assetId: 'FA-2026-000009', assetName: 'Fresenius Dialysis Machines',     user: 'Kavitha R.',     role: 'Finance Executive',  ts: '2026-04-01T10:00:00', note: 'Insurance renewed for dialysis set. NIA policy NIA-EQP-2023-77821 extended to Sep 2026.',              amount: 14400000  },
  { id: 'EVT-012', event: 'REVALUATION_SKIPPED',  assetId: 'FA-2026-000007', assetName: 'da Vinci Si Surgical System',     user: 'CFO Approval',   role: 'CFO',                ts: '2026-04-01T10:00:00', note: 'Revaluation skipped per board resolution dated 28-Mar-2026. Cost model retained.',                      amount: 0         },
  { id: 'EVT-013', event: 'COMPLIANCE_RENEWED',   assetId: 'FA-2026-000015', assetName: 'Siemens Biograph mCT PET-CT',     user: 'Safety Officer', role: 'Radiation Safety',   ts: '2025-09-15T11:00:00', note: 'AERB license renewed. Radiation safety audit passed. Next calibration: Jul-2026.',                     amount: 0         },
  { id: 'EVT-014', event: 'ASSET_CAPITALIZED',    assetId: 'FA-2026-000014', assetName: 'Mindray DC-70 4D Color Doppler',  user: 'Priya Mehta',    role: 'Accounts Manager',   ts: '2025-02-01T10:30:00', note: 'New echo system capitalized. GL account 1500-CARDIO-ECHO. JV-2025-02200 posted.',                       amount: 5800000   },
  { id: 'EVT-015', event: 'DEPRECIATION_RUN',     assetId: 'FA-2026-000003', assetName: 'Dräger Evita V500 Ventilators',   user: 'System / Auto',  role: 'System',             ts: '2026-03-31T23:59:00', note: 'Annual depreciation FY 2025-26. SLM method. Charge ₹12.8L. Closing NBV ₹1.12Cr.',                    amount: 1280000   },
];

const EVENT_TYPE_OPTIONS = [
  { value: 'all',                  label: 'All Events'           },
  { value: 'ASSET_ACQUIRED',       label: 'Acquisitions'         },
  { value: 'ASSET_CAPITALIZED',    label: 'Capitalizations'      },
  { value: 'DEPRECIATION_RUN',     label: 'Depreciation Runs'    },
  { value: 'AMC_RENEWED',          label: 'AMC Renewals'         },
  { value: 'INSURANCE_RENEWED',    label: 'Insurance Renewals'   },
  { value: 'MAINTENANCE_COMPLETED',label: 'Maintenance'          },
  { value: 'RISK_DETECTED',        label: 'Risk Alerts'          },
];

function AuditEventCard({ event, index }) {
  const cfg = EVENT_CONFIG[event.event] ?? EVENT_CONFIG.ASSET_ACQUIRED;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="flex gap-3 group"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center flex-none">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm flex-none z-10"
          style={{ background: `${cfg.color}18`, borderColor: `${cfg.color}30` }}
        >
          <Icon size={13} style={{ color: cfg.color }} />
        </div>
        <div className="w-px flex-1 mt-1 bg-slate-100 dark:bg-slate-700 group-last:hidden" />
      </div>

      {/* Event Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div
          className={`rounded-xl border p-3 ${cfg.bg} border-slate-100 dark:border-slate-700/50`}
        >
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{cfg.label}</span>
                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">{event.id}</span>
              </div>
              <p className="text-[10.5px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">{event.assetName}</p>
              <p className="text-[9.5px] font-mono text-slate-400 dark:text-slate-500">{event.assetId}</p>
            </div>
            <div className="text-right flex-none">
              <p className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">{fmtDate(event.ts)}</p>
              {event.amount > 0 && (
                <p className="text-[10px] font-bold mt-0.5" style={{ color: cfg.color }}>
                  {event.event === 'DEPRECIATION_RUN' ? `(${(event.amount / 100000).toFixed(2)}L)` : `₹${(event.amount / 100000).toFixed(2)}L`}
                </p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{event.note}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9.5px] font-semibold" style={{ color: cfg.color }}>{event.user}</span>
            <span className="text-[9.5px] text-slate-400 dark:text-slate-500">· {event.role}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ARAuditTimeline() {
  const [filter, setFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const filtered = ALL_EVENTS.filter(e => filter === 'all' || e.event === filter);
  const displayed = showAll ? filtered : filtered.slice(0, 8);

  return (
    <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <ClipboardList size={15} className="text-sky-600 dark:text-sky-400" />
          <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Audit & Event Timeline</span>
          <span className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-[9px] font-bold rounded-full">
            {ALL_EVENTS.length} events
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-6 pr-5 py-1 text-[10.5px] bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-400 appearance-none cursor-pointer"
            >
              {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="p-4">
        <AnimatePresence>
          <div className="space-y-0">
            {displayed.map((event, i) => (
              <AuditEventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        </AnimatePresence>

        {/* Show More */}
        {filtered.length > 8 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-3 mt-2 text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 border border-dashed border-sky-200 dark:border-sky-800/60 rounded-xl hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
          >
            <ChevronDown size={12} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
            {showAll ? 'Show less' : `Show ${filtered.length - 8} more events`}
          </button>
        )}
      </div>
    </div>
  );
}
