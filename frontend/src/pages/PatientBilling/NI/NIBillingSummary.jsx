import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown, Shield, Receipt, Wallet,
  AlertCircle, ArrowUpRight, CheckCircle2,
} from 'lucide-react';
import { fmt } from './NIConstants';

function AnimatedAmount({ value, className = '' }) {
  const prevRef  = useRef(value);
  const [display, setDisplay] = useState(value);
  const [flash,   setFlash]   = useState(null);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(value > prevRef.current ? 'up' : 'down');
      setDisplay(value);
      prevRef.current = value;
      const t = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <motion.span
      key={display}
      initial={{ opacity:0.6, y: flash === 'up' ? 4 : flash === 'down' ? -4 : 0 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
      className={`${className} ${
        flash === 'up'   ? 'text-emerald-600' :
        flash === 'down' ? 'text-rose-600'    : ''
      } transition-colors duration-500`}
    >
      {fmt(display)}
    </motion.span>
  );
}

const RIBBON_ITEMS = [
  {
    key:'grossCharges',
    label:'Gross Charges',
    icon:Receipt,
    iconCls:'text-slate-500',
    valueCls:'text-slate-800',
    border:'border-slate-200',
    bg:'bg-white',
  },
  {
    key:'totalDiscount',
    label:'Discount',
    icon:TrendingDown,
    iconCls:'text-amber-500',
    valueCls:'text-amber-600',
    border:'border-amber-100',
    bg:'bg-amber-50/60',
    prefix:'−',
  },
  {
    key:'totalTax',
    label:'GST / Tax',
    icon:ArrowUpRight,
    iconCls:'text-violet-400',
    valueCls:'text-violet-600',
    border:'border-violet-100',
    bg:'bg-violet-50/60',
    prefix:'+',
  },
  {
    key:'insuranceCoverage',
    label:'Insurance',
    icon:Shield,
    iconCls:'text-emerald-500',
    valueCls:'text-emerald-600',
    border:'border-emerald-100',
    bg:'bg-emerald-50/60',
    prefix:'−',
  },
  {
    key:'netPayable',
    label:'Net Payable',
    icon:Wallet,
    iconCls:'text-sky-600',
    valueCls:'text-sky-700',
    border:'border-sky-200',
    bg:'bg-sky-50',
    highlight:true,
  },
  {
    key:'totalCollected',
    label:'Collected',
    icon:CheckCircle2,
    iconCls:'text-emerald-500',
    valueCls:'text-emerald-600',
    border:'border-emerald-200',
    bg:'bg-emerald-50/80',
  },
  {
    key:'outstanding',
    label:'Outstanding',
    icon:AlertCircle,
    iconCls:'text-rose-500',
    valueCls:'text-rose-600',
    border:'border-rose-200',
    bg:'bg-rose-50/80',
  },
];

export default function NIBillingSummary({ totals }) {
  return (
    <div className="border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm">
      <div className="flex items-stretch divide-x divide-slate-200">
        {RIBBON_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const val  = totals[item.key] ?? 0;
          return (
            <div
              key={item.key}
              className={`flex-1 flex flex-col justify-center px-4 py-2.5 min-w-0 ${item.bg} ${
                item.highlight ? 'shadow-inner' : ''
              } ${idx === 0 ? '' : ''}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${item.iconCls}`} />
                <span className="text-[10px] font-medium text-slate-500 truncate">{item.label}</span>
              </div>
              <div className={`flex items-baseline gap-0.5 font-bold text-sm tabular-nums ${item.highlight ? 'text-base' : ''}`}>
                {item.prefix && (
                  <span className={`text-xs ${item.prefix === '−' ? 'text-rose-400' : 'text-violet-400'}`}>{item.prefix}</span>
                )}
                <AnimatedAmount value={val} className={`${item.valueCls} ${item.highlight ? 'font-extrabold' : ''}`} />
              </div>
            </div>
          );
        })}

        {/* Billing progress indicator */}
        <div className="px-4 py-2.5 flex flex-col justify-center bg-white min-w-28">
          <div className="text-[10px] font-medium text-slate-500 mb-1">Collection</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width:0 }}
                animate={{
                  width: totals.netPayable > 0
                    ? `${Math.min(100, (totals.totalCollected / totals.netPayable) * 100)}%`
                    : '0%'
                }}
                transition={{ duration:0.4, ease:'easeOut' }}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 w-8 text-right">
              {totals.netPayable > 0
                ? `${Math.min(100, Math.round((totals.totalCollected / totals.netPayable) * 100))}%`
                : '0%'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
