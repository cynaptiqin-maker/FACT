import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FilePlus, IndianRupee, Send, XCircle, CheckCircle2,
  RefreshCcw, Edit3, AlertCircle, Zap, BookOpen, Bell,
} from 'lucide-react';
import { ACTIVITY_TYPES, MOCK_ACTIVITY, fmtINR } from './PIConstants';

const LUCIDE_MAP = {
  FilePlus, IndianRupee, Send, XCircle, CheckCircle2,
  RefreshCcw, Edit3, AlertCircle, Zap, BookOpen,
};

function timeAgo(ts) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60)   return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function ActivityCard({ item, index }) {
  const cfg  = ACTIVITY_TYPES[item.type] ?? ACTIVITY_TYPES.INVOICE_CREATED;
  const Icon = LUCIDE_MAP[cfg.icon] ?? FilePlus;
  const isAlert = item.type === 'CLAIM_DENIED' || item.type === 'WF_ESCALATION' || item.type === 'LEAKAGE_DETECTED';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors hover:shadow-sm
        ${isAlert
          ? 'bg-red-50/60 dark:bg-red-900/8 border-red-100 dark:border-red-900/30'
          : 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60'
        } cursor-pointer`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-none ${cfg.bg}`}>
        <Icon size={14} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 truncate">{cfg.label}</p>
          <span className="text-[10px] text-slate-400 font-mono flex-none">{timeAgo(item.ts)}</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.patient}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10.5px] font-mono font-semibold" style={{ color: cfg.color }}>{fmtINR(item.amount)}</span>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[10.5px] font-mono text-slate-400">{item.invoiceNo}</span>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[10.5px] text-slate-500">{item.dept}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function PIActivityFeed() {
  const [feed, setFeed] = useState(MOCK_ACTIVITY);
  const [filter, setFilter] = useState('ALL');
  const [pulse, setPulse] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      const newActivity = {
        id:        `a-${Date.now()}`,
        type:      ['PAYMENT_RECEIVED','INVOICE_CREATED','CLAIM_SUBMITTED','GL_POSTED'][Math.floor(Math.random() * 4)],
        patient:   ['Rajesh Kumar','Meera Devi','Arun Pillai'][Math.floor(Math.random() * 3)],
        invoiceNo: `INV-2026-${String(Math.floor(Math.random() * 99999)).padStart(6,'0')}`,
        amount:    Math.floor(Math.random() * 50_000) + 2_000,
        dept:      ['OPD','ICU','Pharmacy','OT'][Math.floor(Math.random() * 4)],
        ts:        Date.now(),
      };
      setFeed(f => [newActivity, ...f.slice(0, 19)]);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const filters = [
    { key:'ALL',      label:'All'       },
    { key:'PAYMENT',  label:'Payments'  },
    { key:'CLAIM',    label:'Claims'    },
    { key:'INVOICE',  label:'Invoices'  },
    { key:'ALERT',    label:'Alerts'    },
  ];

  const filtered = feed.filter(item => {
    if (filter === 'ALL')     return true;
    if (filter === 'PAYMENT') return item.type === 'PAYMENT_RECEIVED' || item.type === 'REFUND_PROCESSED';
    if (filter === 'CLAIM')   return item.type.includes('CLAIM');
    if (filter === 'INVOICE') return item.type.includes('INVOICE') || item.type === 'GL_POSTED';
    if (filter === 'ALERT')   return item.type === 'CLAIM_DENIED' || item.type === 'WF_ESCALATION' || item.type === 'LEAKAGE_DETECTED';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-none">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell size={15} className="text-slate-500" />
            <AnimatePresence>
              {pulse && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"
                />
              )}
            </AnimatePresence>
          </div>
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Live Activity</span>
          <span className="flex h-1.5 w-1.5">
            <span className="animate-ping absolute h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-75" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
        </div>
        <span className="text-[10.5px] text-slate-400">{feed.length} events</span>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 overflow-x-auto scrollbar-none flex-none">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-none px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors
              ${filter === f.key
                ? 'bg-rose-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {filtered.map((item, i) => (
            <ActivityCard key={item.id} item={item} index={i} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-slate-400">
            <Bell size={18} />
            <p className="text-[12px]">No activity for this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
