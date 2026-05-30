import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, ChevronDown, ChevronUp, User, Edit3,
  Plus, Trash2, CreditCard, Shield, FileText,
  CheckCircle2, AlertTriangle, Lock,
} from 'lucide-react';

const ACTION_ICONS = {
  CREATE:   { icon:Plus,         cls:'bg-sky-100    text-sky-600'    },
  EDIT:     { icon:Edit3,        cls:'bg-amber-100  text-amber-600'  },
  DELETE:   { icon:Trash2,       cls:'bg-rose-100   text-rose-600'   },
  PAYMENT:  { icon:CreditCard,   cls:'bg-emerald-100 text-emerald-600'},
  APPROVE:  { icon:CheckCircle2, cls:'bg-emerald-100 text-emerald-600'},
  INSURANCE:{ icon:Shield,       cls:'bg-teal-100   text-teal-600'   },
  GENERATE: { icon:FileText,     cls:'bg-indigo-100 text-indigo-600' },
  WARNING:  { icon:AlertTriangle,cls:'bg-amber-100  text-amber-600'  },
  LOCK:     { icon:Lock,         cls:'bg-slate-100  text-slate-600'  },
};

function TimelineEntry({ entry, isLast }) {
  const config = ACTION_ICONS[entry.type] ?? ACTION_ICONS.EDIT;
  const Icon   = config.icon;
  const time   = new Date(entry.ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const date   = new Date(entry.ts).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});

  return (
    <div className="flex gap-3 relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[14px] top-8 bottom-0 w-px bg-slate-100" />
      )}

      {/* Icon */}
      <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 mt-0.5 z-10 ${config.cls}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-slate-700">{entry.action}</div>
            {entry.detail && <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{entry.detail}</p>}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-mono text-slate-400">{time}</div>
            <div className="text-[10px] text-slate-300">{date}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-[8px] font-bold">
            {entry.user.charAt(0)}
          </div>
          <span className="text-[10px] text-slate-400">{entry.user} · {entry.role}</span>
        </div>
        {entry.before && entry.after && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-mono">{entry.before}</span>
            <span className="text-slate-300">→</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-mono">{entry.after}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function buildTimeline(auditLog, lineItems, patient) {
  const entries = [...auditLog];

  if (patient) {
    entries.push({
      id:`tl-pat-${Date.now()}`, type:'EDIT', user:'Billing User', role:'billing_staff',
      action:`Patient selected: ${patient.name}`,
      detail:`UHID: ${patient.uhid} · Type: ${patient.type}`,
      ts: new Date(Date.now() - 20000).toISOString(),
    });
  }

  if (lineItems.length > 0) {
    entries.push({
      id:`tl-items-${Date.now()}`, type:'EDIT', user:'Billing User', role:'billing_staff',
      action:`${lineItems.length} line item${lineItems.length !== 1?'s':''} added`,
      detail: lineItems.slice(0,2).map(li => li.name || 'Unnamed service').join(', ') + (lineItems.length > 2 ? ` +${lineItems.length-2} more` : ''),
      ts: new Date(Date.now() - 10000).toISOString(),
    });
  }

  return entries.sort((a,b) => new Date(b.ts) - new Date(a.ts));
}

export default function NIAuditTimeline({ auditLog, lineItems, patient }) {
  const [expanded, setExpanded] = useState(false);

  const timeline = buildTimeline(auditLog, lineItems, patient);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <span className="font-semibold text-sm text-slate-700">Audit Timeline</span>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
            {timeline.length} event{timeline.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Lock className="w-2.5 h-2.5" /> Immutable log
          </span>
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
            <div className="px-4 py-3 border-t border-slate-100">
              {timeline.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No activity yet on this invoice</div>
              ) : (
                <div>
                  {timeline.map((entry, idx) => (
                    <TimelineEntry key={entry.id} entry={entry} isLast={idx === timeline.length - 1} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
