import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Printer, RotateCcw, Bot, X, ChevronDown,
  CheckCircle2, Clock, AlertTriangle, XCircle,
  Wifi, WifiOff, Receipt, ArrowLeft, RefreshCw,
  Activity, GitBranch, BarChart2, ShieldAlert,
} from 'lucide-react';

import PRKPIRibbon          from './PR/PRKPIRibbon';
import PRPatientContext      from './PR/PRPatientContext';
import PRPaymentModes        from './PR/PRPaymentModes';
import PRAllocationGrid      from './PR/PRAllocationGrid';
import PRRightPanel          from './PR/PRRightPanel';
import { AuditPanel, ReconciliationPanel, AnalyticsPanel, ActivityPanel } from './PR/PRBottomPanels';
import {
  genReceiptNo, fmtINR, fmtDateTime, todayISO,
  PR_KPI_CONFIG, MOCK_KPI_VALUES, COUNTERS, uid,
} from './PR/PRConstants';

// ─── Inline micro-components ─────────────────────────────────────────────────
function SyncBadge({ online }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold
      ${online ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
               : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
      {online ? <Wifi size={10} /> : <WifiOff size={10} />}
      {online ? 'Live' : 'Offline'}
    </div>
  );
}

function HeaderStat({ label, value, accent }) {
  return (
    <div className="text-right">
      <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-[13px] font-bold tabular-nums" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function ReceiptStatusBadge({ status }) {
  const cfg = {
    DRAFT:     { bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-500',                label: 'Draft'     },
    POSTED:    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: 'Posted'   },
    PARTIAL:   { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-300',    label: 'Partial'  },
    REVERSED:  { bg: 'bg-rose-100 dark:bg-rose-900/30',       text: 'text-rose-700 dark:text-rose-400',      label: 'Reversed' },
    PENDING:   { bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-300',      label: 'Pending'  },
  }[status] ?? { bg: 'bg-slate-100', text: 'text-slate-500', label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
      {status === 'POSTED' && <CheckCircle2 size={10} />}
      {status === 'DRAFT'  && <Clock size={10} />}
      {status === 'REVERSED' && <XCircle size={10} />}
      {cfg.label}
    </span>
  );
}

function CollectionSummaryBar({ totalModes, advanceUsed, totalAllocated, unallocated, patient }) {
  const grandTotal = totalModes + (advanceUsed || 0);
  return (
    <div className="flex-none bg-slate-900 dark:bg-slate-950 border-b border-slate-800">
      <div className="flex items-center gap-0 overflow-x-auto">
        {[
          { label: 'Total Collected',   value: fmtINR(grandTotal),          color: '#34d399' },
          { label: 'Allocated',         value: fmtINR(totalAllocated),       color: '#818cf8' },
          { label: 'Unallocated',       value: fmtINR(Math.max(0, unallocated)), color: unallocated > 0 ? '#fbbf24' : '#34d399' },
          { label: 'Patient Outstanding', value: patient ? fmtINR(patient.invoices.reduce((s,i) => s+i.outstanding, 0)) : '—', color: '#f87171' },
          { label: 'Advance Balance',   value: patient ? fmtINR(patient.advance) : '—', color: '#fb923c' },
          { label: 'Ins. Pending',      value: patient ? fmtINR(patient.invoices.reduce((s,i) => s+i.insurancePending, 0)) : '—', color: '#c084fc' },
          { label: 'Mode Total',        value: fmtINR(totalModes),           color: '#60a5fa' },
          { label: 'Advance Used',      value: fmtINR(advanceUsed || 0),     color: '#fb923c' },
        ].map(item => (
          <div key={item.label} className="flex-none px-5 py-2.5 border-r border-slate-800 last:border-0">
            <p className="text-[9px] text-slate-500 uppercase tracking-wide whitespace-nowrap">{item.label}</p>
            <p className="text-[13px] font-bold tabular-nums mt-0.5" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Print Modal ──────────────────────────────────────────────────────────────
function PrintModal({ receiptNo, receiptDate, patient, totalModes, advanceUsed, modes, allocations, onClose }) {
  const grandTotal = totalModes + (advanceUsed || 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Receipt header */}
        <div className="bg-emerald-600 text-white px-6 py-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80">FACT FinOS Healthcare</p>
          <p className="text-[18px] font-extrabold mt-0.5">Payment Receipt</p>
          <p className="text-[11px] opacity-80 mt-0.5 font-mono">{receiptNo}</p>
        </div>

        <div className="px-5 py-4 space-y-3 text-[12px]">
          {[
            ['Date', receiptDate ? new Date(receiptDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'],
            ['Patient', patient?.name ?? '—'],
            ['UHID', patient?.id ?? '—'],
            ['Department', patient?.dept ?? '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-slate-400">{k}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span>
            </div>
          ))}

          <div className="pt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Payment Breakdown</p>
            {modes.map(m => (
              m.amount ? (
                <div key={m.id} className="flex justify-between text-[11px] py-1">
                  <span className="text-slate-500">{m.mode}</span>
                  <span className="font-semibold tabular-nums">{fmtINR(parseFloat(m.amount) || 0)}</span>
                </div>
              ) : null
            ))}
            {advanceUsed > 0 && (
              <div className="flex justify-between text-[11px] py-1">
                <span className="text-slate-500">Advance Adjusted</span>
                <span className="font-semibold tabular-nums">{fmtINR(advanceUsed)}</span>
              </div>
            )}
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 flex justify-between items-center">
            <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Total Collected</span>
            <span className="text-[18px] font-extrabold text-emerald-600 tabular-nums">{fmtINR(grandTotal)}</span>
          </div>

          <p className="text-[9.5px] text-slate-400 text-center pt-1">
            This is a computer-generated receipt. No signature required.
          </p>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-3 flex gap-2">
          <button onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold transition-colors">
            <Printer size={13} /> Print
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-[12px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Refund Modal ─────────────────────────────────────────────────────────────
function RefundModal({ receiptNo, grandTotal, onClose, onConfirm }) {
  const [pin, setPin]       = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError]   = useState('');

  const submit = () => {
    if (pin !== '1234') { setError('Invalid supervisor PIN'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Enter refund amount'); return; }
    if (!reason) { setError('Reason is required'); return; }
    onConfirm({ amount: parseFloat(amount), reason, pin });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Process Refund</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{receiptNo}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Refund Amount (max {fmtINR(grandTotal)})</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">₹</span>
              <input type="number" className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all tabular-nums"
                value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" max={grandTotal} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Reason</p>
            <textarea rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
              value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for refund…" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Supervisor PIN</p>
            <input type="password" maxLength={6} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
              value={pin} onChange={e => setPin(e.target.value)} placeholder="••••••" />
          </div>
          {error && <p className="text-[11px] text-rose-500 font-semibold">{error}</p>}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-3 flex gap-2">
          <button onClick={submit}
            className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-semibold transition-colors">
            Confirm Refund
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-[12px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3500); return () => clearTimeout(t); }, []);
  const colors = { success: 'bg-emerald-600', error: 'bg-rose-600', info: 'bg-blue-600' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl text-white shadow-xl ${colors[type] ?? colors.info}`}>
      {type === 'success' && <CheckCircle2 size={15} />}
      {type === 'error' && <AlertTriangle size={15} />}
      <span className="text-[12.5px] font-semibold">{msg}</span>
      <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100"><X size={13} /></button>
    </motion.div>
  );
}

// ─── Bottom tab config ─────────────────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'activity',       label: 'Activity',       icon: Activity },
  { id: 'audit',          label: 'Audit Trail',     icon: GitBranch },
  { id: 'reconciliation', label: 'Reconciliation',  icon: RefreshCw },
  { id: 'analytics',      label: 'Analytics',       icon: BarChart2 },
];

// ─── Main PaymentReceipt ──────────────────────────────────────────────────────
export default function PaymentReceipt() {
  const [receiptNo,   setReceiptNo]   = useState(() => genReceiptNo());
  const [receiptDate, setReceiptDate] = useState(todayISO());
  const [counter,     setCounter]     = useState(COUNTERS[0].id);
  const [status,      setStatus]      = useState('DRAFT');
  const [patient,     setPatient]     = useState(null);
  const [allocations, setAllocations] = useState({});
  const [advanceUsed, setAdvanceUsed] = useState(0);
  const [modes,       setModes]       = useState([{ id: uid(), mode: 'CASH', amount: '', ref: '', bankId: '', date: todayISO() }]);
  const [aiOpen,      setAiOpen]      = useState(false);
  const [bottomTab,   setBottomTab]   = useState('activity');
  const [kpiFilter,   setKpiFilter]   = useState(null);
  const [showPrint,   setShowPrint]   = useState(false);
  const [showRefund,  setShowRefund]  = useState(false);
  const [toast,       setToast]       = useState(null);
  const [online]                      = useState(true);
  const [saving,      setSaving]      = useState(false);

  const totalModes     = modes.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const grandTotal     = totalModes + (advanceUsed || 0);
  const unallocated    = grandTotal - totalAllocated;

  const fraudAlerts = [
    ...(grandTotal > 500000 ? [{ sev: 'HIGH', msg: 'Single receipt exceeds ₹5L — dual approval required' }] : []),
    ...(modes.filter(m => m.mode === 'CASH' && (parseFloat(m.amount) || 0) > 200000).length ? [{ sev: 'MED', msg: 'Cash payment >₹2L — PAN capture mandatory' }] : []),
    ...(modes.length > 3 ? [{ sev: 'LOW', msg: 'Multiple payment modes — verify source of funds' }] : []),
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); setShowPrint(true); }
      if (e.key === 'Escape') { setShowPrint(false); setShowRefund(false); setAiOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modes, patient, allocations, advanceUsed]);

  const handleSave = useCallback(async () => {
    if (!patient)    { setToast({ msg: 'Select a patient first', type: 'error' }); return; }
    if (grandTotal <= 0) { setToast({ msg: 'Enter payment amount', type: 'error' }); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setStatus('POSTED');
    setSaving(false);
    setToast({ msg: `Receipt ${receiptNo} posted successfully`, type: 'success' });
  }, [patient, grandTotal, receiptNo]);

  const handleReset = () => {
    setReceiptNo(genReceiptNo());
    setReceiptDate(todayISO());
    setStatus('DRAFT');
    setPatient(null);
    setAllocations({});
    setAdvanceUsed(0);
    setModes([{ id: uid(), mode: 'CASH', amount: '', ref: '', bankId: '', date: todayISO() }]);
    setToast({ msg: 'Form reset', type: 'info' });
  };

  const handleRefundConfirm = ({ amount, reason }) => {
    setStatus('REVERSED');
    setShowRefund(false);
    setToast({ msg: `Refund of ${fmtINR(amount)} processed`, type: 'info' });
  };

  return (
    <div className="flex flex-col min-h-0 h-full">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Left: title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Receipt size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Payment Receipt</h1>
                <ReceiptStatusBadge status={status} />
                <SyncBadge online={online} />
                {fraudAlerts.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                    <ShieldAlert size={10} /> {fraudAlerts.length} Alert{fraudAlerts.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{receiptNo} · {fmtDateTime(Date.now())}</p>
            </div>
          </div>

          {/* Center: header stats */}
          <div className="hidden md:flex items-center gap-6">
            <HeaderStat label="Total Collected" value={fmtINR(grandTotal)} accent="#10b981" />
            <HeaderStat label="Allocated"        value={fmtINR(totalAllocated)} accent="#818cf8" />
            <HeaderStat label="Unallocated"      value={fmtINR(Math.max(0, unallocated))} accent={unallocated > 0 ? '#f59e0b' : '#10b981'} />
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {/* Counter select */}
            <select value={counter} onChange={e => setCounter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all hidden sm:block">
              {COUNTERS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>

            {/* Date */}
            <input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all hidden sm:block" />

            <button onClick={() => setAiOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors
                ${aiOpen ? 'bg-violet-600 text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <Bot size={13} /> AI
            </button>

            <button onClick={() => setShowPrint(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Printer size={13} /> Print
            </button>

            {status === 'POSTED' && (
              <button onClick={() => setShowRefund(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors">
                <RotateCcw size={13} /> Refund
              </button>
            )}

            <button onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <RotateCcw size={13} />
            </button>

            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-semibold text-white shadow-sm transition-all
                ${saving ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}`}>
              <Save size={13} />
              {saving ? 'Saving…' : 'Post Receipt'}
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Ribbon ──────────────────────────────────────────────────────── */}
      <div className="flex-none px-4 pt-3 pb-0">
        <PRKPIRibbon kpis={PR_KPI_CONFIG} values={MOCK_KPI_VALUES} active={kpiFilter} onFilter={setKpiFilter} />
      </div>

      {/* ── Collection Summary Bar ──────────────────────────────────────────── */}
      <CollectionSummaryBar
        totalModes={totalModes}
        advanceUsed={advanceUsed}
        totalAllocated={totalAllocated}
        unallocated={unallocated}
        patient={patient}
      />

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4 min-h-0">

        {/* ── Main scroll column ──────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto gap-4 pr-1">

          {/* Row 1: Patient context + Payment modes */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            <div className="xl:col-span-2">
              <PRPatientContext selectedPatient={patient} onSelect={setPatient} />
            </div>
            <div className="xl:col-span-3">
              <PRPaymentModes
                modes={modes}
                onChange={setModes}
                patientAdvance={patient?.advance ?? 0}
                advanceUsed={advanceUsed}
                onAdvanceChange={setAdvanceUsed}
              />
            </div>
          </div>

          {/* Row 2: Allocation Grid */}
          <PRAllocationGrid
            patient={patient}
            allocations={allocations}
            onChange={setAllocations}
            totalCollected={grandTotal}
          />

          {/* Row 3: Bottom tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-2 pt-2 gap-1">
              {BOTTOM_TABS.map(tab => {
                const Icon = tab.icon;
                const active = bottomTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setBottomTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-[11px] font-semibold transition-colors
                      ${active
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-b-white dark:border-b-slate-900 border-slate-200 dark:border-slate-700'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <Icon size={12} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="h-72 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={bottomTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
                  {bottomTab === 'activity'       && <ActivityPanel />}
                  {bottomTab === 'audit'          && <AuditPanel />}
                  {bottomTab === 'reconciliation' && <ReconciliationPanel />}
                  {bottomTab === 'analytics'      && <AnalyticsPanel />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Spacer */}
          <div className="h-4" />
        </div>

        {/* ── Right panel (AI / Risk / Treasury / Workflow) ──────────────── */}
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              key="right-panel"
              initial={{ opacity: 0, x: 32, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 360 }}
              exit={{ opacity: 0, x: 32, width: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex-none overflow-hidden"
              style={{ width: 360 }}
            >
              <div className="h-full w-[360px]">
                <PRRightPanel fraudAlerts={fraudAlerts} patient={patient} grandTotal={grandTotal} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Floating AI button (mobile / collapsed) ─────────────────────────── */}
      {!aiOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setAiOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl flex items-center justify-center transition-colors md:hidden">
          <Bot size={20} />
        </motion.button>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPrint && (
          <PrintModal
            receiptNo={receiptNo}
            receiptDate={receiptDate}
            patient={patient}
            totalModes={totalModes}
            advanceUsed={advanceUsed}
            modes={modes}
            allocations={allocations}
            onClose={() => setShowPrint(false)}
          />
        )}
        {showRefund && (
          <RefundModal
            receiptNo={receiptNo}
            grandTotal={grandTotal}
            onClose={() => setShowRefund(false)}
            onConfirm={handleRefundConfirm}
          />
        )}
      </AnimatePresence>

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
