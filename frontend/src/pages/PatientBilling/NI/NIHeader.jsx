import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Save, Printer, ChevronDown, Sparkles, Eye,
  Send, Package, CreditCard, ClipboardList, Wifi,
  Clock, CheckCircle2, AlertTriangle, Circle, RefreshCw,
  Keyboard, ChevronRight,
} from 'lucide-react';
import { NI_BILLING_TYPES } from './NIConstants';

const STATUS_CONFIG = {
  DRAFT:     { label:'Draft',           icon:Circle,        cls:'text-slate-500  bg-slate-100  border-slate-200'  },
  PENDING:   { label:'Pending Approval',icon:Clock,         cls:'text-amber-600  bg-amber-50   border-amber-200'  },
  APPROVED:  { label:'Approved',        icon:CheckCircle2,  cls:'text-emerald-600 bg-emerald-50 border-emerald-200'},
  GENERATED: { label:'Generated',       icon:FileText,      cls:'text-sky-600    bg-sky-50     border-sky-200'    },
  ALERT:     { label:'Needs Attention', icon:AlertTriangle, cls:'text-rose-600   bg-rose-50    border-rose-200'   },
};

const QUICK_ACTIONS = [
  { id:'draft',     label:'Save Draft',         icon:Save,          kbd:'Ctrl+S', primary:false },
  { id:'generate',  label:'Generate Invoice',   icon:FileText,      kbd:'Ctrl+G', primary:true  },
  { id:'payment',   label:'Record Payment',     icon:CreditCard,    kbd:'Ctrl+P', primary:false },
  { id:'package',   label:'Apply Package',      icon:Package,       kbd:null,     primary:false },
  { id:'claim',     label:'Submit Claim',       icon:Send,          kbd:null,     primary:false },
  { id:'print',     label:'Print Preview',      icon:Printer,       kbd:'Ctrl+Pr',primary:false },
  { id:'audit',     label:'View Audit Logs',    icon:ClipboardList, kbd:null,     primary:false },
];

export default function NIHeader({
  invoiceNo, invoiceDate, billingType, status, onStatusAction,
  onBillingTypeChange, aiPanelOpen, onToggleAI, onAction, syncState,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [kbOpen, setKbOpen]     = useState(false);

  const StatusIcon = STATUS_CONFIG[status]?.icon ?? Circle;
  const statusCfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  const billType   = NI_BILLING_TYPES.find(t => t.id === billingType) ?? NI_BILLING_TYPES[0];

  const primaryActions  = QUICK_ACTIONS.filter(a => a.primary);
  const secondaryActions = QUICK_ACTIONS.filter(a => !a.primary);

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Main header row */}
      <div className="flex items-center gap-3 px-5 py-3">
        {/* Invoice identity */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-600 text-white shadow-sm">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-slate-800 text-sm leading-tight">New Invoice</h1>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-xs text-slate-500">{invoiceNo}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">{invoiceDate}</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              {/* Billing type selector */}
              <div className="flex gap-1">
                {NI_BILLING_TYPES.slice(0,5).map(t => (
                  <button
                    key={t.id}
                    onClick={() => onBillingTypeChange(t.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                      t.id === billingType
                        ? t.badgeCls + ' shadow-sm'
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t.short}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusCfg.cls}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {statusCfg.label}
        </div>

        {/* Sync indicator */}
        <div className={`flex items-center gap-1 text-xs ${syncState === 'synced' ? 'text-emerald-500' : 'text-amber-500'}`}>
          {syncState === 'syncing'
            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            : <Wifi className="w-3.5 h-3.5" />
          }
          <span className="hidden sm:inline">{syncState === 'synced' ? 'Synced' : 'Syncing…'}</span>
        </div>

        <div className="flex-1" />

        {/* Keyboard hints toggle */}
        <button
          onClick={() => setKbOpen(p => !p)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
          title="Keyboard shortcuts"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* AI toggle */}
        <button
          onClick={onToggleAI}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            aiPanelOpen
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Assist
        </button>

        {/* Primary action */}
        {primaryActions.map(a => (
          <button
            key={a.id}
            onClick={() => onAction(a.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 shadow-sm transition-all active:scale-95"
          >
            <a.icon className="w-3.5 h-3.5" />
            {a.label}
          </button>
        ))}

        {/* More actions */}
        <div className="relative">
          <button
            onClick={() => setMoreOpen(p => !p)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-all"
          >
            More
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ opacity:0, y:-6, scale:0.95 }}
                animate={{ opacity:1, y:0,  scale:1    }}
                exit={{  opacity:0, y:-6, scale:0.95 }}
                transition={{ duration:0.15 }}
                className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
              >
                {secondaryActions.map(a => (
                  <button
                    key={a.id}
                    onClick={() => { onAction(a.id); setMoreOpen(false); }}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <a.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="flex-1 text-left">{a.label}</span>
                    {a.kbd && <span className="font-mono text-[10px] text-slate-300 bg-slate-100 px-1.5 rounded">{a.kbd}</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Keyboard shortcuts panel */}
      <AnimatePresence>
        {kbOpen && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{   height:0, opacity:0 }}
            transition={{ duration:0.2 }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50"
          >
            <div className="flex flex-wrap gap-x-6 gap-y-1 px-5 py-2">
              {[
                ['Ctrl + K', 'Global search'],
                ['Ctrl + N', 'Add line item'],
                ['Ctrl + S', 'Save draft'],
                ['Ctrl + G', 'Generate invoice'],
                ['Ctrl + P', 'Record payment'],
                ['/', 'Service quick search'],
                ['Esc', 'Cancel edit'],
                ['Enter', 'Save & next row'],
                ['Tab', 'Next cell'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 shadow-sm">{key}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
