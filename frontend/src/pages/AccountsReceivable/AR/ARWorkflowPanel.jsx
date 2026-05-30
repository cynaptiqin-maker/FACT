import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, Clock, CheckCircle2, Phone, Mail, MessageSquare,
  ChevronRight, ArrowRight, Zap, Calendar, Flag,
} from 'lucide-react';
import { COLLECTOR_WORKLOADS } from './ARConstants';

function CollectorCard({ c, idx }) {
  const load = Math.round((c.assigned / 35) * 100);
  const hasBreaches = c.slaBreaches > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className={`bg-white dark:bg-slate-900 border rounded-xl p-3 hover:shadow-md transition-shadow
        ${hasBreaches ? 'border-orange-200 dark:border-orange-900/50' : 'border-slate-200 dark:border-slate-800'}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-none"
             style={{ background: c.color }}>
          {c.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{c.name}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.assigned} accounts assigned</div>
        </div>
        {hasBreaches && (
          <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            <Flag size={9} />{c.slaBreaches}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-50">{c.followUpsDue}</div>
          <div className="text-[10px] text-slate-400">Follow-ups</div>
        </div>
        <div>
          <div className={`text-sm font-bold ${c.slaBreaches > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {c.slaBreaches}
          </div>
          <div className="text-[10px] text-slate-400">SLA Breach</div>
        </div>
        <div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{(c.collected/100000).toFixed(1)}L</div>
          <div className="text-[10px] text-slate-400">Collected</div>
        </div>
      </div>

      {/* Load bar */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-slate-400">Workload</span>
          <span className={`font-semibold ${load > 85 ? 'text-rose-500' : load > 70 ? 'text-amber-500' : 'text-emerald-500'}`}>{load}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
               style={{
                 width: `${load}%`,
                 background: load > 85 ? '#ef4444' : load > 70 ? '#f59e0b' : '#10b981'
               }} />
        </div>
      </div>
    </motion.div>
  );
}

const FOLLOWUPS = [
  { id: 'FU-001', invoice: 'INV-2026-00847', name: 'Rajesh Kumar Sharma', due: 'Today',       type: 'CALL',  priority: 'HIGH',     collector: 'Priya Sharma',  amount: 148500 },
  { id: 'FU-002', invoice: 'INV-2026-00760', name: 'Sunita Verma',         due: 'Overdue 3d', type: 'CALL',  priority: 'CRITICAL', collector: 'Suresh Nair',   amount: 95000  },
  { id: 'FU-003', invoice: 'INV-2026-00719', name: 'Oriental Insurance',   due: 'Today',       type: 'EMAIL', priority: 'HIGH',     collector: 'Rahul Mehta',   amount: 88000  },
  { id: 'FU-004', invoice: 'INV-2026-00744', name: 'Lakshmi Devi',         due: 'Overdue 2d', type: 'CALL',  priority: 'CRITICAL', collector: 'Kiran Pillai',  amount: 126500 },
  { id: 'FU-005', invoice: 'INV-2026-00755', name: 'Geeta Bose',           due: 'Tomorrow',    type: 'SMS',   priority: 'MEDIUM',   collector: 'Priya Sharma',  amount: 28900  },
  { id: 'FU-006', invoice: 'INV-2026-00806', name: 'HDFC Ergo Health',     due: 'Tomorrow',    type: 'EMAIL', priority: 'MEDIUM',   collector: 'Rahul Mehta',   amount: 780000 },
];

const PRIORITY_STYLES = {
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  HIGH:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  MEDIUM:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  LOW:      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const ACTION_ICONS = { CALL: Phone, EMAIL: Mail, SMS: MessageSquare };

export default function ARWorkflowPanel() {
  const [view, setView] = useState('followups');

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Follow-ups Due',  val: 49, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'SLA Breaches',    val: 12, color: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-50 dark:bg-rose-900/20'   },
          { label: 'Escalations',     val: 5,  color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Completed Today', val: 18, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${s.bg} rounded-xl p-3 text-center border border-transparent`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex gap-2">
        {[
          { id: 'followups',  label: 'Follow-up Queue',   icon: Calendar },
          { id: 'collectors', label: 'Collector Workload', icon: Users    },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${view === v.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            <v.icon size={12} />{v.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === 'followups' && (
          <motion.div key="fu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {FOLLOWUPS.map((fu, i) => {
              const ActionIcon = ACTION_ICONS[fu.type] ?? Phone;
              const isOverdue = fu.due.startsWith('Overdue');
              return (
                <motion.div key={fu.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-slate-900 transition-colors hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer
                    ${isOverdue ? 'border-red-200 dark:border-red-900/50' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-none ${isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                    <ActionIcon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{fu.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-none ${PRIORITY_STYLES[fu.priority]}`}>{fu.priority}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-mono">{fu.invoice}</span>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400">₹{fu.amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="text-right flex-none">
                    <div className={`text-[11px] font-semibold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>{fu.due}</div>
                    <div className="text-[10px] text-slate-400">{fu.collector.split(' ')[0]}</div>
                  </div>
                  <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {view === 'collectors' && (
          <motion.div key="col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-3 gap-3">
            {COLLECTOR_WORKLOADS.map((c, i) => <CollectorCard key={c.name} c={c} idx={i} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
