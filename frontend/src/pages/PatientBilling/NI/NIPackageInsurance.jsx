import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Shield, ChevronDown, ChevronUp, CheckCircle2,
  X, AlertTriangle, Clock, Info, ExternalLink, Percent,
  BarChart2, Sparkles,
} from 'lucide-react';
import { NI_PACKAGES, NI_TPA_LIST, fmt } from './NIConstants';

// ─── Package utilization bar ──────────────────────────────────────────────────
function UtilBar({ used, total, label }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const color = pct > 90 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono font-semibold text-slate-700">{fmt(used)} / {fmt(total)}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color} transition-all`}
          initial={{ width:0 }}
          animate={{ width:`${pct}%` }}
          transition={{ duration:0.5, ease:'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Package selector card ────────────────────────────────────────────────────
function PackageOption({ pkg, selected, onSelect }) {
  const colorMap = {
    amber:'bg-amber-50 border-amber-300 text-amber-700',
    cyan: 'bg-cyan-50  border-cyan-300  text-cyan-700',
    pink: 'bg-pink-50  border-pink-300  text-pink-700',
    red:  'bg-red-50   border-red-300   text-red-700',
  };
  const typeBadgeCls = colorMap[pkg.color] ?? 'bg-slate-50 border-slate-300 text-slate-700';

  return (
    <button
      onClick={() => onSelect(pkg)}
      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
        selected?.id === pkg.id
          ? 'border-sky-500 bg-sky-50 shadow-md'
          : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-800 leading-tight">{pkg.name}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${typeBadgeCls}`}>{pkg.type}</span>
            {pkg.insurance && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold">
                <Shield className="w-2.5 h-2.5" /> TPA
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
            <span>{pkg.services.length} services</span>
            <span>·</span>
            <span>Valid {pkg.validity} days</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-bold text-slate-800">{fmt(pkg.totalValue)}</div>
          <div className="text-[10px] text-slate-400">Package price</div>
        </div>
      </div>
      {selected?.id === pkg.id && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-sky-600 font-semibold">
          <CheckCircle2 className="w-3 h-3" /> Selected
        </div>
      )}
    </button>
  );
}

// ─── Package detail view ──────────────────────────────────────────────────────
function PackageDetail({ pkg, lineItems }) {
  const packagedServices = pkg.services.map(ps => {
    const used = lineItems.filter(li => li.code === ps.code).reduce((s,li) => s + (li.qty||0), 0);
    return { ...ps, used, pending: Math.max(0, ps.qty - used) };
  });
  const usedValue   = packagedServices.reduce((s, ps) => {
    const svcPrice = NI_PACKAGES.find(p => p.id === pkg.id)?.services
      ? 0 : 0; // simplified
    return s;
  }, 0);

  return (
    <div className="space-y-3 mt-3">
      <UtilBar used={pkg.totalValue * 0.3} total={pkg.totalValue} label="Package Utilisation" />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Inclusions</div>
          <ul className="space-y-1">
            {pkg.inclusions.map(inc => (
              <li key={inc} className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                {inc}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Exclusions</div>
          <ul className="space-y-1">
            {pkg.exclusions.map(exc => (
              <li key={exc} className="flex items-start gap-1.5 text-xs text-slate-500">
                <X className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
                {exc}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── TPA / Insurance section ──────────────────────────────────────────────────
function TPASection({ patientInsurance }) {
  const [expanded, setExpanded] = useState(true);
  const tpa = patientInsurance
    ? NI_TPA_LIST.find(t => t.name.toLowerCase().includes(patientInsurance.tpa.toLowerCase()))
    : null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-slate-700">Insurance / TPA</span>
          {patientInsurance && (
            <span className="text-xs text-emerald-600 font-medium">{patientInsurance.tpa}</span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{   height:0, opacity:0 }}
            transition={{ duration:0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {patientInsurance ? (
                <>
                  {/* Insurer stats */}
                  {tpa && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <div className="text-xs font-bold text-slate-700">{fmt(tpa.cashlessLimit)}</div>
                        <div className="text-[10px] text-slate-400">Cashless Limit</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <div className="text-xs font-bold text-slate-700">{tpa.avgApprovalHrs}h</div>
                        <div className="text-[10px] text-slate-400">Avg Approval</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded-lg">
                        <div className={`text-xs font-bold ${tpa.claimRejectionRate > 15 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {tpa.claimRejectionRate}%
                        </div>
                        <div className="text-[10px] text-slate-400">Rejection Rate</div>
                      </div>
                    </div>
                  )}

                  {/* Pre-auth status */}
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Pre-authorisation</span>
                      {patientInsurance.preAuthNo ? (
                        <span className={`font-semibold flex items-center gap-1 ${
                          patientInsurance.preAuthStatus === 'APPROVED' ? 'text-emerald-600' :
                          patientInsurance.preAuthStatus === 'PENDING'  ? 'text-amber-600'  : 'text-rose-600'
                        }`}>
                          {patientInsurance.preAuthStatus === 'APPROVED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {patientInsurance.preAuthStatus}
                        </span>
                      ) : (
                        <button className="text-sky-600 font-semibold hover:underline flex items-center gap-0.5">
                          Request Pre-auth <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {patientInsurance.preAuthNo && (
                      <div className="text-[10px] font-mono text-slate-500">Ref: {patientInsurance.preAuthNo}</div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Co-pay liability</span>
                      <span className="font-semibold text-amber-600">{patientInsurance.copay}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Policy valid till</span>
                      <span className="font-medium text-slate-700">{patientInsurance.validity}</span>
                    </div>
                  </div>

                  {/* Non-payables alert */}
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                      Items marked <strong>non-payable</strong> by this insurer will not be covered:
                      Cosmetic procedures, sundry charges, registration fees.
                    </p>
                  </div>

                  {/* Split billing toggle */}
                  <div className="flex items-center justify-between p-3 bg-sky-50 border border-sky-200 rounded-lg">
                    <div>
                      <div className="text-xs font-semibold text-sky-800">Split Billing</div>
                      <div className="text-[10px] text-sky-600">Separate insurance and patient payable portions</div>
                    </div>
                    <button className="px-3 py-1 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors">
                      Enable
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Shield className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No insurance linked</p>
                  <p className="text-xs text-slate-300 mt-0.5">Select a patient with insurance or add TPA details</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NIPackageInsurance({ patient, selectedPackage, onPackageSelect, lineItems }) {
  const [pkgExpanded, setPkgExpanded] = useState(true);
  const [showDetail,  setShowDetail]  = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <Package className="w-4 h-4 text-sky-600" />
        <h3 className="font-semibold text-sm text-slate-700">Packages & Insurance</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Package section */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setPkgExpanded(p => !p)}
            className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-semibold text-slate-700">Procedure Packages</span>
              {selectedPackage && (
                <span className="text-xs text-sky-600 font-medium">{selectedPackage.name}</span>
              )}
            </div>
            {pkgExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          <AnimatePresence>
            {pkgExpanded && (
              <motion.div
                initial={{ height:0, opacity:0 }}
                animate={{ height:'auto', opacity:1 }}
                exit={{   height:0, opacity:0 }}
                transition={{ duration:0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {/* Active package detail */}
                  {selectedPackage ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-semibold text-slate-700">{selectedPackage.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowDetail(p => !p)}
                            className="text-xs text-sky-600 hover:underline flex items-center gap-1"
                          >
                            <BarChart2 className="w-3 h-3" /> {showDetail ? 'Hide' : 'Show'} details
                          </button>
                          <button
                            onClick={() => onPackageSelect(null)}
                            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-500">Package Value</span>
                        <span className="font-bold text-sky-700">{fmt(selectedPackage.totalValue)}</span>
                      </div>

                      {showDetail && <PackageDetail pkg={selectedPackage} lineItems={lineItems} />}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs text-slate-500">Select a package to auto-apply rates</span>
                      </div>
                      <div className="space-y-2">
                        {NI_PACKAGES.map(pkg => (
                          <PackageOption key={pkg.id} pkg={pkg} selected={selectedPackage} onSelect={onPackageSelect} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Insurance section */}
        <TPASection patientInsurance={patient?.insurance ?? null} />
      </div>
    </div>
  );
}
