import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, X, CheckCircle2, Printer,
  Banknote, Smartphone, Building2, FileText, Shield,
  Wallet, AlertTriangle, RefreshCcw,
} from 'lucide-react';
import { NI_PAYMENT_MODES, fmt } from './NIConstants';

const MODE_ICONS = {
  CASH:      Banknote,
  CARD:      CreditCard,
  UPI:       Smartphone,
  NEFT:      Building2,
  CHEQUE:    FileText,
  INSURANCE: Shield,
  CORPORATE: Building2,
  WALLET:    Wallet,
};

const MODE_COLORS = {
  CASH:      'emerald',
  CARD:      'blue',
  UPI:       'violet',
  NEFT:      'indigo',
  CHEQUE:    'orange',
  INSURANCE: 'teal',
  CORPORATE: 'slate',
  WALLET:    'pink',
};

function colorCls(color, variant = 'bg') {
  const map = {
    emerald:{ bg:'bg-emerald-50 border-emerald-200', icon:'text-emerald-600', badge:'bg-emerald-100 text-emerald-700', btn:'bg-emerald-600 hover:bg-emerald-700' },
    blue:   { bg:'bg-blue-50   border-blue-200',    icon:'text-blue-600',    badge:'bg-blue-100   text-blue-700',    btn:'bg-blue-600   hover:bg-blue-700'   },
    violet: { bg:'bg-violet-50 border-violet-200',  icon:'text-violet-600',  badge:'bg-violet-100 text-violet-700',  btn:'bg-violet-600 hover:bg-violet-700' },
    indigo: { bg:'bg-indigo-50 border-indigo-200',  icon:'text-indigo-600',  badge:'bg-indigo-100 text-indigo-700',  btn:'bg-indigo-600 hover:bg-indigo-700' },
    orange: { bg:'bg-orange-50 border-orange-200',  icon:'text-orange-600',  badge:'bg-orange-100 text-orange-700',  btn:'bg-orange-600 hover:bg-orange-700' },
    teal:   { bg:'bg-teal-50   border-teal-200',    icon:'text-teal-600',    badge:'bg-teal-100   text-teal-700',    btn:'bg-teal-600   hover:bg-teal-700'   },
    slate:  { bg:'bg-slate-50  border-slate-200',   icon:'text-slate-600',   badge:'bg-slate-100  text-slate-700',   btn:'bg-slate-600  hover:bg-slate-700'  },
    pink:   { bg:'bg-pink-50   border-pink-200',    icon:'text-pink-600',    badge:'bg-pink-100   text-pink-700',    btn:'bg-pink-600   hover:bg-pink-700'   },
  };
  return map[color]?.[variant] ?? '';
}

function PaymentModeEntry({ entry, onUpdate, onRemove }) {
  const mode     = NI_PAYMENT_MODES.find(m => m.id === entry.modeId);
  const color    = MODE_COLORS[entry.modeId] ?? 'slate';
  const Icon     = MODE_ICONS[entry.modeId] ?? CreditCard;

  if (!mode) return null;

  return (
    <motion.div
      layout
      initial={{ opacity:0, x:-10 }}
      animate={{ opacity:1, x:0  }}
      exit={{   opacity:0, x:10  }}
      transition={{ duration:0.18 }}
      className={`p-3 rounded-xl border ${colorCls(color,'bg')}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm`}>
          <Icon className={`w-4 h-4 ${colorCls(color,'icon')}`} />
        </div>
        <span className="text-sm font-semibold text-slate-700">{mode.name}</span>
        <button onClick={() => onRemove(entry.id)} className="ml-auto p-1 rounded hover:bg-white/60 text-slate-400 hover:text-rose-500 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-medium text-slate-500 mb-1 block">Amount (₹)</label>
          <input
            type="number"
            min={0}
            value={entry.amount || ''}
            onChange={e => onUpdate(entry.id, 'amount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className={`w-full px-3 py-2 text-sm font-mono font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white`}
          />
        </div>
        {mode.requiresRef && (
          <div>
            <label className="text-[10px] font-medium text-slate-500 mb-1 block">{mode.refLabel}</label>
            <input
              type="text"
              value={entry.ref || ''}
              onChange={e => onUpdate(entry.id, 'ref', e.target.value)}
              placeholder={mode.refLabel}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function NIPaymentSection({ paymentModes, setPaymentModes, totals }) {
  const [addOpen, setAddOpen] = useState(false);

  const totalCollected = paymentModes.reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding    = Math.max(0, (totals.netPayable || 0) - totalCollected);
  const overpaid       = totalCollected > (totals.netPayable || 0);
  const isSettled      = outstanding < 1 && (totals.netPayable || 0) > 0;

  const usedModeIds = paymentModes.map(p => p.modeId);

  function addMode(modeId) {
    const id = `pmt-${Date.now()}`;
    setPaymentModes(prev => [...prev, { id, modeId, amount:0, ref:'' }]);
    setAddOpen(false);
  }

  function updateEntry(id, field, value) {
    setPaymentModes(prev => prev.map(p => p.id === id ? { ...p, [field]:value } : p));
  }

  function removeEntry(id) {
    setPaymentModes(prev => prev.filter(p => p.id !== id));
  }

  function quickSettle() {
    const remaining = outstanding;
    if (remaining <= 0) return;
    if (paymentModes.length > 0) {
      const lastId = paymentModes[paymentModes.length - 1].id;
      setPaymentModes(prev => prev.map(p =>
        p.id === lastId ? { ...p, amount: (p.amount || 0) + remaining } : p
      ));
    } else {
      addMode('CASH');
      setTimeout(() => {
        setPaymentModes(prev => prev.map((p,i) => i === 0 ? { ...p, amount:remaining } : p));
      }, 50);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-sky-600" />
          <h3 className="font-semibold text-sm text-slate-700">Payment & Collection</h3>
        </div>
        {isSettled && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            <CheckCircle2 className="w-3 h-3" /> Settled
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Balance summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-sky-50 border border-sky-200 rounded-xl">
            <div className="text-xs text-sky-600 font-medium mb-0.5">Net Payable</div>
            <div className="text-base font-bold text-sky-800 font-mono">{fmt(totals.netPayable || 0)}</div>
          </div>
          <div className="text-center p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="text-xs text-emerald-600 font-medium mb-0.5">Collected</div>
            <div className="text-base font-bold text-emerald-800 font-mono">{fmt(totalCollected)}</div>
          </div>
          <div className={`text-center p-3 rounded-xl border ${
            outstanding > 0
              ? 'bg-rose-50 border-rose-200'
              : overpaid
              ? 'bg-amber-50 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-xs font-medium mb-0.5 ${outstanding > 0 ? 'text-rose-600' : overpaid ? 'text-amber-600' : 'text-slate-500'}`}>
              {outstanding > 0 ? 'Outstanding' : overpaid ? 'Overpaid' : 'Balance'}
            </div>
            <div className={`text-base font-bold font-mono ${outstanding > 0 ? 'text-rose-700' : overpaid ? 'text-amber-700' : 'text-slate-500'}`}>
              {fmt(outstanding > 0 ? outstanding : overpaid ? totalCollected - (totals.netPayable||0) : 0)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {(totals.netPayable || 0) > 0 && (
          <div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-all ${isSettled ? 'bg-emerald-500' : 'bg-sky-500'}`}
                animate={{ width:`${Math.min(100, (totalCollected / (totals.netPayable||1)) * 100)}%` }}
                transition={{ duration:0.4, ease:'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{Math.min(100, Math.round((totalCollected/(totals.netPayable||1))*100))}% collected</span>
              {outstanding > 0 && (
                <button onClick={quickSettle} className="text-sky-500 hover:underline flex items-center gap-0.5">
                  <RefreshCcw className="w-2.5 h-2.5" /> Quick settle
                </button>
              )}
            </div>
          </div>
        )}

        {/* Overpaid warning */}
        {overpaid && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Collected amount exceeds net payable by <strong>{fmt(totalCollected - (totals.netPayable||0))}</strong>.
              Adjust amounts or process a refund.
            </p>
          </div>
        )}

        {/* Payment mode entries */}
        <div className="space-y-2">
          <AnimatePresence>
            {paymentModes.map(entry => (
              <PaymentModeEntry key={entry.id} entry={entry} onUpdate={updateEntry} onRemove={removeEntry} />
            ))}
          </AnimatePresence>
        </div>

        {/* Add mode button */}
        <div className="relative">
          <button
            onClick={() => setAddOpen(p => !p)}
            className="flex items-center gap-1.5 w-full px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Payment Mode
          </button>

          <AnimatePresence>
            {addOpen && (
              <motion.div
                initial={{ opacity:0, y:-6, scale:0.97 }}
                animate={{ opacity:1, y:0,  scale:1    }}
                exit={{   opacity:0, y:-6, scale:0.97  }}
                transition={{ duration:0.15 }}
                className="absolute left-0 right-0 bottom-full mb-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20"
              >
                <div className="p-2 grid grid-cols-2 gap-1">
                  {NI_PAYMENT_MODES.filter(m => !usedModeIds.includes(m.id)).map(mode => {
                    const Icon  = MODE_ICONS[mode.id] ?? CreditCard;
                    const color = MODE_COLORS[mode.id] ?? 'slate';
                    return (
                      <button
                        key={mode.id}
                        onClick={() => addMode(mode.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:shadow-sm ${colorCls(color,'bg')}`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${colorCls(color,'icon')}`} />
                        {mode.name}
                      </button>
                    );
                  })}
                  {NI_PAYMENT_MODES.filter(m => !usedModeIds.includes(m.id)).length === 0 && (
                    <div className="col-span-2 text-center py-3 text-xs text-slate-400">All payment modes added</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Receipt actions */}
        {paymentModes.length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-all active:scale-95">
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Collection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
