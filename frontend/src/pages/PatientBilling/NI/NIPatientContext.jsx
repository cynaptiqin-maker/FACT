import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, X, QrCode, AlertCircle, CheckCircle2,
  Clock, ShieldCheck, Building2, CreditCard, Phone,
  ChevronDown, ChevronUp, Droplets, MapPin, Stethoscope,
  Bed, Badge, AlertTriangle,
} from 'lucide-react';
import { NI_MOCK_PATIENTS, NI_BILLING_TYPES } from './NIConstants';

function TypeBadge({ type }) {
  const cfg = NI_BILLING_TYPES.find(t => t.id === type);
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeCls}`}>
      {cfg.short}
    </span>
  );
}

function PreAuthBadge({ status }) {
  if (!status) return null;
  const map = {
    APPROVED: { cls:'bg-emerald-100 text-emerald-700 border-emerald-200', label:'Pre-Auth Approved', icon:CheckCircle2 },
    PENDING:  { cls:'bg-amber-100  text-amber-700  border-amber-200',  label:'Pre-Auth Pending',  icon:Clock          },
    REJECTED: { cls:'bg-red-100    text-red-700    border-red-200',    label:'Pre-Auth Rejected', icon:AlertCircle    },
  };
  const c = map[status];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.cls}`}>
      <c.icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function PatientResultRow({ patient, onSelect }) {
  return (
    <button
      onClick={() => onSelect(patient)}
      className="flex items-start gap-3 w-full px-4 py-3 hover:bg-sky-50 transition-colors text-left group"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-sky-100 text-sky-600 font-bold text-sm shrink-0 mt-0.5 group-hover:bg-sky-200 transition-colors">
        {patient.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-800">{patient.name}</span>
          <TypeBadge type={patient.type} />
          {patient.outstanding > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-1.5 py-0.5">
              <AlertTriangle className="w-2.5 h-2.5" />
              Due ₹{patient.outstanding.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
          <span className="font-mono text-slate-400">{patient.uhid}</span>
          <span>·</span>
          <span>{patient.age}Y {patient.gender}</span>
          <span>·</span>
          <span>{patient.dept}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{patient.phone}</span>
        </div>
        {patient.admNo && (
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <Bed className="w-3 h-3" />
            Admission {patient.admNo} · {patient.ward} / {patient.room} / Bed {patient.bed}
          </div>
        )}
      </div>
      <div className="shrink-0 text-xs text-slate-400 mt-0.5">
        {patient.insurance ? (
          <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck className="w-3.5 h-3.5" />{patient.insurance.tpa}</span>
        ) : patient.corporate ? (
          <span className="flex items-center gap-1 text-sky-600"><Building2 className="w-3.5 h-3.5" />Corporate</span>
        ) : (
          <span className="text-slate-300">Self-pay</span>
        )}
      </div>
    </button>
  );
}

export default function NIPatientContext({ patient, onPatientSelect }) {
  const [query, setQuery]         = useState('');
  const [open, setOpen]           = useState(false);
  const [expanded, setExpanded]   = useState(true);
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  const results = query.trim().length >= 1
    ? NI_MOCK_PATIENTS.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.uhid.toLowerCase().includes(query.toLowerCase()) ||
        p.phone.includes(query) ||
        (p.admNo && p.admNo.toLowerCase().includes(query.toLowerCase())) ||
        (p.visitNo && p.visitNo.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSelect(p) {
    onPatientSelect(p);
    setQuery('');
    setOpen(false);
    setExpanded(true);
  }

  function clearPatient() {
    onPatientSelect(null);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // ── No patient selected — search bar ─────────────────────────────────────
  if (!patient) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible" ref={wrapRef}>
        <div className="px-4 py-3.5">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-sky-600" />
            <h3 className="font-semibold text-sm text-slate-700">Patient Selection</h3>
            <span className="text-xs text-rose-500 font-medium">* Required</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search by patient name, UHID, phone, visit number…"
              className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-400 bg-slate-50 transition-all placeholder:text-slate-400"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" title="Scan QR/Barcode">
              <QrCode className="w-4 h-4" />
            </button>
          </div>

          {/* Recent patients shortcut */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-xs text-slate-400 self-center">Recent:</span>
            {NI_MOCK_PATIENTS.slice(0,3).map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 transition-all"
              >
                <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-600 text-[10px] font-bold flex items-center justify-center">{p.name.charAt(0)}</span>
                {p.name.split(' ')[0]} · {p.uhid.split('-').pop()}
              </button>
            ))}
          </div>
        </div>

        {/* Search results dropdown */}
        <AnimatePresence>
          {open && results.length > 0 && (
            <motion.div
              initial={{ opacity:0, y:-4 }}
              animate={{ opacity:1, y:0 }}
              exit={{   opacity:0, y:-4 }}
              transition={{ duration:0.15 }}
              className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-50"
              style={{ top:'100%' }}
            >
              <div className="px-4 py-2 text-[10px] text-slate-400 font-medium bg-slate-50">
                {results.length} patient{results.length !== 1 ? 's' : ''} found
              </div>
              {results.map(p => <PatientResultRow key={p.id} patient={p} onSelect={handleSelect} />)}
            </motion.div>
          )}
          {open && query.trim().length >= 1 && results.length === 0 && (
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-6 text-center z-50"
              style={{ top:'100%' }}
            >
              <User className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No patients match <span className="font-medium text-slate-600">"{query}"</span></p>
              <p className="text-xs text-slate-300 mt-1">Try searching by UHID or phone number</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Patient selected — detailed card ──────────────────────────────────────
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-600 px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 text-white font-bold text-lg backdrop-blur-sm shadow-inner">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base leading-tight">{patient.name}</h3>
                <TypeBadge type={patient.type} />
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-sky-100 text-xs">
                <span className="font-mono">{patient.uhid}</span>
                <span className="text-sky-300">·</span>
                <span>{patient.age}Y {patient.gender === 'M' ? 'Male' : 'Female'}</span>
                <span className="text-sky-300">·</span>
                <span className="flex items-center gap-0.5"><Droplets className="w-3 h-3 text-red-300" />{patient.blood}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {patient.outstanding > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs font-semibold shadow">
                <AlertTriangle className="w-3 h-3" />
                Due ₹{patient.outstanding.toLocaleString('en-IN')}
              </div>
            )}
            <button
              onClick={() => setExpanded(p => !p)}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={clearPatient}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Change patient"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-sky-100">
          <span className="flex items-center gap-1">
            <Stethoscope className="w-3 h-3 text-sky-300" />
            {patient.doctor}
          </span>
          <span className="text-sky-400">·</span>
          <span className="flex items-center gap-1">
            <Badge className="w-3 h-3 text-sky-300" />
            {patient.dept}
          </span>
          {patient.admNo ? (
            <>
              <span className="text-sky-400">·</span>
              <span className="flex items-center gap-1">
                <Bed className="w-3 h-3 text-sky-300" />
                {patient.ward} / Rm {patient.room} / Bed {patient.bed}
              </span>
            </>
          ) : patient.visitNo ? (
            <>
              <span className="text-sky-400">·</span>
              <span>{patient.visitNo}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Expanded detail section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{   height:0, opacity:0 }}
            transition={{ duration:0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              {/* Insurance / TPA */}
              <div className="px-4 py-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Insurance / TPA</div>
                {patient.insurance ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-slate-700">{patient.insurance.tpa}</span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <div>Policy: <span className="font-mono text-slate-600">{patient.insurance.policyNo}</span></div>
                      <div>Coverage: <span className="font-medium text-emerald-600">₹{(patient.insurance.coverageAmt/100000).toFixed(1)}L</span></div>
                      <div>Co-pay: <span className="font-medium text-slate-700">{patient.insurance.copay}%</span></div>
                      <div>Valid till: <span className="text-slate-600">{patient.insurance.validity}</span></div>
                    </div>
                    {patient.insurance.preAuthStatus && (
                      <PreAuthBadge status={patient.insurance.preAuthStatus} />
                    )}
                  </div>
                ) : patient.corporate ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-sky-500" />
                      <span className="text-sm font-semibold text-slate-700">{patient.corporate.company}</span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <div>Employee ID: <span className="font-mono text-slate-600">{patient.corporate.empId}</span></div>
                      <div>Coverage: <span className="font-medium text-sky-600">₹{(patient.corporate.coverage/100000).toFixed(1)}L</span></div>
                      <div>Valid till: <span className="text-slate-600">{patient.corporate.validity}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <CreditCard className="w-4 h-4" />
                    Self-pay patient
                  </div>
                )}
              </div>

              {/* Credit & Outstanding */}
              <div className="px-4 py-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Credit & Balance</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Credit Eligible</span>
                    <span className={`text-xs font-semibold ${patient.credit ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {patient.credit ? `Yes — ₹${(patient.creditLimit/1000).toFixed(0)}K limit` : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Outstanding</span>
                    <span className={`text-sm font-bold ${patient.outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {patient.outstanding > 0 ? `₹${patient.outstanding.toLocaleString('en-IN')}` : 'Nil'}
                    </span>
                  </div>
                  {patient.outstanding > 0 && (
                    <div className="w-full bg-rose-100 rounded-full h-1.5">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (patient.outstanding / (patient.creditLimit || 50000)) * 100)}%` }} />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Last Visit</span>
                    <span className="font-medium text-slate-600">{patient.lastVisit}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Identifiers */}
              <div className="px-4 py-3">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Identifiers</div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{patient.phone}</div>
                  <div className="font-mono text-slate-600">{patient.uhid}</div>
                  <div className="font-mono text-slate-400">MRN: {patient.mrn}</div>
                  {patient.admNo && <div className="font-mono text-emerald-600">{patient.admNo}</div>}
                  {patient.visitNo && <div className="font-mono text-sky-600">{patient.visitNo}</div>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
