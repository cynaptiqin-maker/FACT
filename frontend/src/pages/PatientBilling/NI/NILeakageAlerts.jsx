import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp,
  Zap, TrendingDown, X, CheckCircle2,
} from 'lucide-react';
import { NI_LEAKAGE_RULES, fmt } from './NIConstants';

const SEVERITY_CONFIG = {
  HIGH:   { icon:AlertTriangle, bg:'bg-rose-50',   border:'border-rose-200',   icon_cls:'text-rose-500',   badge:'bg-rose-100 text-rose-700 border-rose-300',   label:'High'   },
  MEDIUM: { icon:AlertCircle,   bg:'bg-amber-50',  border:'border-amber-200',  icon_cls:'text-amber-500',  badge:'bg-amber-100 text-amber-700 border-amber-300', label:'Medium' },
  LOW:    { icon:Info,          bg:'bg-sky-50',    border:'border-sky-200',    icon_cls:'text-sky-500',    badge:'bg-sky-100 text-sky-700 border-sky-300',       label:'Low'    },
};

function LeakageRuleCard({ rule, dismissed, onDismiss, onFix }) {
  const sev  = SEVERITY_CONFIG[rule.severity] ?? SEVERITY_CONFIG.LOW;
  const Icon = sev.icon;

  return (
    <motion.div
      layout
      initial={{ opacity:0, x:-10 }}
      animate={{ opacity:1, x:0 }}
      exit={{   opacity:0, x:10, height:0 }}
      transition={{ duration:0.2 }}
      className={`rounded-xl border p-3 ${sev.bg} ${sev.border}`}
    >
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 ${sev.icon_cls} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${sev.badge}`}>
              {sev.label}
            </span>
            <span className="text-[10px] text-slate-500">{rule.category.replace(/_/g,' ')}</span>
          </div>
          <p className="text-xs font-medium text-slate-700 mt-1 leading-snug">{rule.message}</p>
          {rule.impact > 0 && (
            <p className="text-[10px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {fmt(rule.impact)} revenue at risk
            </p>
          )}
          <p className="text-[10px] text-slate-500 mt-1">
            Recommended: <span className="font-medium text-slate-600">{rule.fix}</span>
          </p>
          <div className="flex gap-1.5 mt-2">
            <button
              onClick={() => onFix(rule)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-300 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
            >
              <Zap className="w-2.5 h-2.5 text-sky-500" /> Fix Now
            </button>
            <button
              onClick={() => onDismiss(rule.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NILeakageAlerts({ lineItems, patient }) {
  const [expanded,   setExpanded]   = useState(true);
  const [dismissed,  setDismissed]  = useState(new Set());
  const [fixedItems, setFixedItems] = useState(new Set());

  // Compute which rules fire based on current invoice state
  const activeRules = NI_LEAKAGE_RULES.filter(rule => {
    if (dismissed.has(rule.id) || fixedItems.has(rule.id)) return false;
    switch (rule.trigger) {
      case 'ICU_NO_VENT':
        return patient?.type === 'ICU' && !lineItems.some(li => li.code === 'ICU-VENT-01');
      case 'SURGERY_NO_CONSUMABLES':
        return lineItems.some(li => li.category === 'SURGERY') && !lineItems.some(li => li.category === 'PHARMACY');
      case 'IP_NO_ROOM':
        return (patient?.type === 'IP' || patient?.type === 'ICU') && !lineItems.some(li => li.category === 'ROOM' || li.category === 'ICU');
      case 'EXCESS_DISCOUNT':
        return lineItems.some(li => (li.discPct || 0) > 20);
      case 'CONSULT_NO_LABS':
        return lineItems.some(li => li.category === 'CONSULTATION') && !lineItems.some(li => li.category === 'LAB');
      default:
        return false;
    }
  });

  const totalImpact = activeRules.reduce((s, r) => s + r.impact, 0);

  function handleFix(rule) {
    setFixedItems(prev => new Set([...prev, rule.id]));
  }

  function handleDismiss(id) {
    setDismissed(prev => new Set([...prev, id]));
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-6 h-6 rounded-md ${activeRules.length > 0 ? 'bg-rose-100' : 'bg-slate-100'}`}>
            <AlertTriangle className={`w-3.5 h-3.5 ${activeRules.length > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
          </div>
          <span className="font-semibold text-sm text-slate-700">Leakage Alerts</span>
          {activeRules.length > 0 ? (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200">
              {activeRules.length}
            </span>
          ) : (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-semibold border border-emerald-200">
              <CheckCircle2 className="w-2.5 h-2.5" /> Clear
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalImpact > 0 && (
            <span className="text-xs font-bold text-rose-600">{fmt(totalImpact)} at risk</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{   height:0, opacity:0 }}
            transition={{ duration:0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {activeRules.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No leakage risks detected</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {lineItems.length === 0 ? 'Add billing items to begin analysis' : 'Invoice looks complete'}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {activeRules.map(rule => (
                    <LeakageRuleCard
                      key={rule.id}
                      rule={rule}
                      dismissed={dismissed.has(rule.id)}
                      onDismiss={handleDismiss}
                      onFix={handleFix}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
