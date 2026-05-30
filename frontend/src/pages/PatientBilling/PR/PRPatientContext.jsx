import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, User, Phone, Shield, Building2, Wallet } from 'lucide-react';
import { MOCK_PATIENTS, fmtINR } from './PRConstants';
import { INV_STATUSES } from './PRConstants';

function StatusBadge({ status }) {
  const cfg = INV_STATUSES[status] ?? INV_STATUSES.PENDING;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

export default function PRPatientContext({ selectedPatient, onSelect }) {
  const [query, setQuery]     = useState(selectedPatient ? `${selectedPatient.name} · ${selectedPatient.id}` : '');
  const [open, setOpen]       = useState(false);
  const inputRef              = useRef(null);

  const filtered = MOCK_PATIENTS.filter(p =>
    !query ||
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.id.toLowerCase().includes(query.toLowerCase()) ||
    p.phone.includes(query)
  );

  const handleSelect = (p) => {
    setQuery(`${p.name} · ${p.id}`);
    setOpen(false);
    onSelect(p);
  };

  const totalOutstanding = selectedPatient
    ? selectedPatient.invoices.reduce((s, i) => s + i.outstanding, 0)
    : 0;
  const totalInsurance = selectedPatient
    ? selectedPatient.invoices.reduce((s, i) => s + i.insurancePending, 0)
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
      <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide mb-3">
        Patient & Invoice Context
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
            bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200
            placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400
            transition-all"
          placeholder="Search patient by name, UHID, or phone…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />

        <AnimatePresence>
          {open && query && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full left-0 right-0 z-40 mt-1.5 bg-white dark:bg-slate-900
                border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden"
            >
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-[12px] text-slate-400">No patients found.</p>
              ) : filtered.map(p => (
                <button key={p.id} onClick={() => handleSelect(p)}
                  className="w-full flex items-start gap-3 px-4 py-3
                    hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors
                    border-b border-slate-100 dark:border-slate-800 last:border-0 text-left">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500
                    flex items-center justify-center text-white text-[11px] font-bold flex-none">
                    {p.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.id} · {p.dept} · {p.doctor}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[11px] text-amber-600 font-semibold">Due: {fmtINR(p.invoices.reduce((s,i)=>s+i.outstanding,0))}</span>
                      {p.advance > 0 && <span className="text-[11px] text-emerald-600">Adv: {fmtINR(p.advance)}</span>}
                      {p.insurance && <span className="text-[11px] text-violet-600">{p.insurance}</span>}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 flex-none mt-1" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Patient card */}
      <AnimatePresence mode="wait">
        {selectedPatient && (
          <motion.div
            key={selectedPatient.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {/* Patient meta */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10
              border border-emerald-200/60 dark:border-emerald-800/30 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500
                flex items-center justify-center text-white text-[13px] font-bold flex-none">
                {selectedPatient.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{selectedPatient.name}</p>
                <p className="text-[11px] text-slate-400">{selectedPatient.id} · {selectedPatient.age}Y · {selectedPatient.gender}</p>
                <div className="flex flex-wrap gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500"><User size={10} />{selectedPatient.dept}</span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500"><Phone size={10} />{selectedPatient.phone}</span>
                  {selectedPatient.insurance && <span className="flex items-center gap-1 text-[11px] text-violet-600"><Shield size={10} />{selectedPatient.insurance}</span>}
                  {selectedPatient.corporate  && <span className="flex items-center gap-1 text-[11px] text-blue-600"><Building2 size={10} />{selectedPatient.corporate}</span>}
                </div>
              </div>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label:'Outstanding', value: fmtINR(totalOutstanding), color:'text-amber-600 dark:text-amber-400' },
                { label:'Advance Bal.', value: fmtINR(selectedPatient.advance), color:'text-emerald-600 dark:text-emerald-400' },
                { label:'Ins. Pending', value: fmtINR(totalInsurance), color:'text-violet-600 dark:text-violet-400' },
              ].map(item => (
                <div key={item.label} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">{item.label}</p>
                  <p className={`text-[14px] font-bold tabular-nums mt-0.5 ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Invoice list */}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Outstanding Invoices</p>
            <div className="space-y-1.5">
              {selectedPatient.invoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-2 px-3 py-2 rounded-xl
                  border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40
                  hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-default">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11.5px] font-mono font-semibold text-slate-700 dark:text-slate-300">{inv.id}</span>
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold">{inv.type}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">{inv.date} · {inv.days}d old</p>
                  </div>
                  <div className="text-right flex-none">
                    <p className="text-[12px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">{fmtINR(inv.outstanding)}</p>
                    {inv.insurancePending > 0 && (
                      <p className="text-[10px] text-violet-500">+{fmtINR(inv.insurancePending)} ins.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedPatient && (
        <div className="text-center py-8 text-slate-400">
          <User size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-[12px] font-medium">Search for a patient to begin</p>
          <p className="text-[11px] mt-0.5 opacity-70">Name, UHID, or phone number</p>
        </div>
      )}
    </div>
  );
}
