import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wifi } from 'lucide-react';
import { MOCK_ACTIVITY, fmtINR, fmtTime } from './PBConstants';

const TYPE_STYLES = {
  bill:     { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  payment:  { bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500'    },
  refund:   { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500'   },
  admit:    { bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-600 dark:text-violet-400',   dot: 'bg-violet-500'  },
  lab:      { bg: 'bg-cyan-100 dark:bg-cyan-900/30',       text: 'text-cyan-600 dark:text-cyan-400',       dot: 'bg-cyan-500'    },
  claim:    { bg: 'bg-indigo-100 dark:bg-indigo-900/30',   text: 'text-indigo-600 dark:text-indigo-400',   dot: 'bg-indigo-500'  },
  leakage:  { bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-600 dark:text-red-400',         dot: 'bg-red-500'     },
  pharmacy: { bg: 'bg-teal-100 dark:bg-teal-900/30',       text: 'text-teal-600 dark:text-teal-400',       dot: 'bg-teal-500'    },
};

export default function PBActivityFeed() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 7000);
    return () => clearInterval(t);
  }, []);

  const items = useMemo(() => {
    const rotated = [...MOCK_ACTIVITY];
    for (let i = 0; i < tick % rotated.length; i++) rotated.unshift(rotated.pop());
    return rotated.slice(0, 10);
  }, [tick]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between flex-none">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-indigo-500" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Live Billing Activity</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <Wifi size={11} /> Streaming
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => {
            const sty = TYPE_STYLES[item.type] ?? TYPE_STYLES.bill;
            return (
              <motion.div
                key={`${item.id}-${tick}-${idx}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x:   0  }}
                exit={   { opacity: 0, x:  12  }}
                transition={{ delay: idx * 0.04, duration: 0.25 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800/60
                  border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600
                  transition-colors group cursor-pointer flex-none"
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-none ${sty.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-semibold ${sty.text}`}>{item.label}</span>
                    <span className="text-[10px] text-slate-400 flex-none">{fmtTime(item.ts)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.patient.split(' ')[0]} {item.patient.split(' ')[1]}</span>
                    <span className="text-slate-400 mx-1">·</span>
                    {item.dept}
                  </p>
                </div>
                <div className="text-right flex-none">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{fmtINR(item.amount)}</p>
                  <p className="text-[10px] text-slate-400">{item.cashier.split(' ')[0]}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
