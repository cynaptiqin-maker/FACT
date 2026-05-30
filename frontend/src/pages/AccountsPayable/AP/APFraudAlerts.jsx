import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, ChevronDown, ChevronRight, CheckCircle2,
  Eye, AlertTriangle, Ban, RefreshCw, Sparkles,
} from 'lucide-react';
import { FRAUD_ALERTS } from './APConstants';

const TYPE_LABELS = {
  DUPLICATE_INVOICE:      'Duplicate Invoice',
  SPLIT_INVOICE:          'Split Invoice',
  VENDOR_RISK:            'Vendor Risk',
  PRICE_ANOMALY:          'Price Anomaly',
  UNAUTHORIZED_APPROVAL:  'Unauthorized Approval',
};

const SEVERITY_STYLES = {
  CRITICAL: {
    border: 'border-red-200 dark:border-red-900/60',
    bg:     'bg-red-50 dark:bg-red-950/25',
    badge:  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    icon:   'text-red-600 dark:text-red-400',
    dot:    'bg-red-500',
  },
  HIGH: {
    border: 'border-orange-200 dark:border-orange-900/60',
    bg:     'bg-orange-50 dark:bg-orange-950/25',
    badge:  'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
    icon:   'text-orange-600 dark:text-orange-400',
    dot:    'bg-orange-500',
  },
  MEDIUM: {
    border: 'border-amber-200 dark:border-amber-900/60',
    bg:     'bg-amber-50 dark:bg-amber-950/25',
    badge:  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
    icon:   'text-amber-600 dark:text-amber-400',
    dot:    'bg-amber-500',
  },
  LOW: {
    border: 'border-slate-200 dark:border-slate-700',
    bg:     'bg-slate-50 dark:bg-slate-900',
    badge:  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    icon:   'text-slate-500',
    dot:    'bg-slate-400',
  },
};

const STATUS_STYLES = {
  open:      { label: 'Open',      bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-400'    },
  reviewing: { label: 'Reviewing', bg: 'bg-amber-100 dark:bg-amber-900/30',text: 'text-amber-700 dark:text-amber-400' },
  resolved:  { label: 'Resolved',  bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
};

// Risk summary donut-ish bars at top
const FRAUD_SUMMARY = [
  { label: 'Duplicate Invoice',    count: 1, exposure: 178000,  color: '#ef4444' },
  { label: 'Split Invoice',        count: 1, exposure: 580000,  color: '#f97316' },
  { label: 'Vendor Risk',          count: 1, exposure: 410000,  color: '#f59e0b' },
  { label: 'Price Anomaly',        count: 1, exposure: 264000,  color: '#8b5cf6' },
  { label: 'Unauthorized Approval',count: 1, exposure: 225000,  color: '#6366f1' },
];
const TOTAL_EXPOSURE = FRAUD_SUMMARY.reduce((s, f) => s + f.exposure, 0);

function FraudCard({ alert, index }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.MEDIUM;
  const sts = STATUS_STYLES[alert.status]     ?? STATUS_STYLES.open;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`border rounded-xl overflow-hidden ${sev.border} ${sev.bg}`}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(p => !p)}
      >
        <div className={`w-1.5 h-1.5 rounded-full flex-none ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${sev.badge} px-1.5 py-0.5 rounded-full`}>
              {alert.severity}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {TYPE_LABELS[alert.type] ?? alert.type}
            </span>
            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${sts.bg} ${sts.text}`}>
              {sts.label}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{alert.title}</div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Vendor: <span className="font-medium text-slate-700 dark:text-slate-300">{alert.vendor}</span></span>
            <span>·</span>
            <span>₹{(alert.amount/100000).toFixed(2)}L exposure</span>
            <span>·</span>
            <span>{alert.dept}</span>
          </div>
        </div>
        <div className="flex-none">
          {expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-700 pt-3">
                {alert.desc}
              </p>

              {/* AI analysis */}
              <div className="bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1.5">
                  <Sparkles size={11} className="text-cyan-500" />
                  <span className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide">AI Assessment</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {alert.type === 'DUPLICATE_INVOICE'
                    ? 'Pattern matches 92% of known duplicate billing scenarios. Cross-reference GRN dates and delivery receipts before payment.'
                    : alert.type === 'SPLIT_INVOICE'
                    ? 'Deliberate invoice splitting below approval threshold is a Class A fraud indicator. Requires management review and retroactive full-value approval.'
                    : alert.type === 'VENDOR_RISK'
                    ? 'New vendor with unverified credentials poses significant payment risk. Validate GSTIN, PAN, and bank details before any fund release.'
                    : alert.type === 'PRICE_ANOMALY'
                    ? 'Unit price deviation exceeds 25% control threshold. Compare against market benchmarks and previous PO rates before approval.'
                    : 'Approval policy violation detected. Ensure all delegated authority limits are respected. Document exception approval in audit trail.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {alert.status !== 'resolved' ? (
                  <>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 transition-colors">
                      <Ban size={11} />Block Payment
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors">
                      <Eye size={11} />Review Invoice
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors ml-auto">
                      <CheckCircle2 size={11} />Mark Resolved
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                    <CheckCircle2 size={12} />Resolved on {alert.detectedAt}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function APFraudAlerts() {
  const openAlerts = FRAUD_ALERTS.filter(a => a.status !== 'resolved').length;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex items-center gap-6 p-4 bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/50 rounded-xl">
        <div className="flex items-center gap-2 flex-none">
          <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center">
            <ShieldAlert size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-rose-700 dark:text-rose-400">{openAlerts} Active Alerts</div>
            <div className="text-[11px] text-rose-600 dark:text-rose-500">Total exposure: ₹{(TOTAL_EXPOSURE/100000).toFixed(2)}L</div>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3">
          {FRAUD_SUMMARY.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: f.color }} />
              <span className="text-slate-600 dark:text-slate-400 hidden lg:block">{f.label}:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">₹{(f.exposure/100000).toFixed(1)}L</span>
            </div>
          ))}
        </div>

        <button className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-amber-600 flex-none">
          <RefreshCw size={11} />Refresh
        </button>
      </div>

      {/* Exposure bar */}
      <div className="space-y-1">
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Exposure Distribution
        </div>
        <div className="h-2.5 flex rounded-full overflow-hidden gap-px">
          {FRAUD_SUMMARY.map((f, i) => (
            <motion.div
              key={i}
              initial={{ flexGrow: 0 }}
              animate={{ flexGrow: f.exposure }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              style={{ background: f.color }}
              title={`${f.label}: ₹${(f.exposure/100000).toFixed(2)}L`}
            />
          ))}
        </div>
      </div>

      {/* Alert cards */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={13} className="text-rose-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fraud Detection Alerts</span>
          <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">AI-monitored in real time</span>
        </div>
        {FRAUD_ALERTS.map((alert, i) => (
          <FraudCard key={alert.id} alert={alert} index={i} />
        ))}
      </div>
    </div>
  );
}
