import { Plus, Trash2 } from 'lucide-react';
import { PAYMENT_MODE_CONFIG, BANK_ACCOUNTS, TPA_LIST, uid, todayISO, fmtINR } from './PRConstants';

function ModeSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300
        focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
    >
      {PAYMENT_MODE_CONFIG.map(m => (
        <option key={m.id} value={m.id}>{m.label}</option>
      ))}
    </select>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300
        placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400
        transition-all tabular-nums"
    />
  );
}

function BankSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300
        focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all">
      <option value="">Select bank / gateway</option>
      {BANK_ACCOUNTS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
    </select>
  );
}

function Label({ children }) {
  return <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{children}</p>;
}

export default function PRPaymentModes({ modes, onChange, patientAdvance = 0, advanceUsed, onAdvanceChange }) {
  const addMode = () => onChange([...modes, { id: uid(), mode: 'CASH', amount: '', ref: '', bankId: '', date: todayISO() }]);
  const removeMode = (id) => onChange(modes.filter(m => m.id !== id));
  const updateMode = (id, field, value) => onChange(modes.map(m => m.id === id ? { ...m, [field]: value } : m));

  const totalModes = modes.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
  const grandTotal = totalModes + (advanceUsed || 0);

  const modeCfg = (id) => PAYMENT_MODE_CONFIG.find(m => m.id === id) ?? PAYMENT_MODE_CONFIG[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide">Payment Modes</p>
        <button onClick={addMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold
            bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors">
          <Plus size={12} /> Add Mode
        </button>
      </div>

      <div className="space-y-3">
        {modes.map((mode, idx) => {
          const cfg = modeCfg(mode.mode);
          return (
            <div key={mode.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800
                bg-slate-50/50 dark:bg-slate-800/40 space-y-3">

              {/* Row 1 */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  {idx === 0 && <Label>Mode</Label>}
                  <ModeSelect value={mode.mode} onChange={v => updateMode(mode.id, 'mode', v)} />
                </div>
                <div className="col-span-3">
                  {idx === 0 && <Label>Amount (₹)</Label>}
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">₹</span>
                    <input
                      type="number" min="0"
                      className="w-full pl-6 pr-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700
                        bg-white dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300
                        focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all tabular-nums"
                      placeholder="0.00"
                      value={mode.amount}
                      onChange={e => updateMode(mode.id, 'amount', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-span-3">
                  {idx === 0 && <Label>Reference / UTR</Label>}
                  <Input
                    placeholder={mode.mode === 'CASH' ? 'Optional' : 'Txn ID / UTR / Cheque no.'}
                    value={mode.ref}
                    onChange={e => updateMode(mode.id, 'ref', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Label>Bank / Gateway</Label>}
                  <BankSelect value={mode.bankId} onChange={v => updateMode(mode.id, 'bankId', v)} />
                </div>
                <div className="col-span-1 flex justify-end items-end pb-0.5">
                  {modes.length > 1 && (
                    <button onClick={() => removeMode(mode.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20
                        text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Insurance-specific fields */}
              {mode.mode === 'INSURANCE' && (
                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <Label>TPA / Insurer</Label>
                    <select className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300
                      focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all">
                      {TPA_LIST.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><Label>Pre-Auth No.</Label><Input placeholder="PA-2026-XXXXX" /></div>
                  <div><Label>Claim Limit (₹)</Label><Input type="number" placeholder="0.00" /></div>
                </div>
              )}

              {/* Cheque-specific fields */}
              {mode.mode === 'CHEQUE' && (
                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-700">
                  <div><Label>Cheque No.</Label><Input placeholder="000000" /></div>
                  <div><Label>Cheque Date</Label><input type="date" defaultValue={todayISO()} className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" /></div>
                  <div><Label>Drawee Bank</Label><Input placeholder="Bank name & branch" /></div>
                </div>
              )}

              {/* Advance-specific */}
              {mode.mode === 'ADVANCE' && (
                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-4 flex-wrap">
                    <p className="text-[12px] text-slate-500">
                      Available advance: <span className="font-bold text-emerald-600">{fmtINR(patientAdvance)}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Label>Use amount:</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">₹</span>
                        <input
                          type="number" min="0" max={patientAdvance}
                          className="pl-6 pr-2.5 py-1.5 w-28 rounded-xl border border-slate-200 dark:border-slate-700
                            bg-white dark:bg-slate-800 text-[12px] tabular-nums focus:outline-none
                            focus:ring-2 focus:ring-emerald-500/30 transition-all"
                          value={advanceUsed}
                          onChange={e => onAdvanceChange(Math.min(parseFloat(e.target.value)||0, patientAdvance))}
                        />
                      </div>
                      <button onClick={() => onAdvanceChange(patientAdvance)}
                        className="text-[11px] text-emerald-600 hover:underline font-semibold">
                        Use Full
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recon indicator */}
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                <span className="text-[10px] text-slate-400">Reconciliation: </span>
                <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>
                  {PAYMENT_MODE_CONFIG.find(m => m.id === mode.mode)?.recon?.replace(/_/g,' ') ?? '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals bar */}
      <div className="mt-4 flex items-center justify-end">
        <div className="flex items-center gap-6 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800">
          <div className="text-center">
            <p className="text-[9.5px] text-slate-500 uppercase tracking-wide">Advance Used</p>
            <p className="text-[13px] font-bold text-orange-300 tabular-nums">{fmtINR(advanceUsed || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-[9.5px] text-slate-500 uppercase tracking-wide">Mode Total</p>
            <p className="text-[13px] font-bold text-blue-300 tabular-nums">{fmtINR(totalModes)}</p>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-center">
            <p className="text-[9.5px] text-slate-500 uppercase tracking-wide">Grand Total</p>
            <p className="text-[18px] font-extrabold text-white tabular-nums">{fmtINR(grandTotal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
