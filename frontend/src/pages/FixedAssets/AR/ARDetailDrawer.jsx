// ─── Asset Register — Full Asset Detail Drawer ────────────────────────────────
// 7-tab drawer · Procurement chain · Financial timeline · Lifecycle · Audit
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Package, FileText, BookOpen, Wrench, Shield, GitMerge,
  ClipboardList, ExternalLink, ChevronRight, TrendingDown,
  Building2, Calendar, DollarSign, AlertTriangle, CheckCircle2,
  ArrowRightLeft, Trash2, RotateCcw, Activity, Award, Zap,
} from 'lucide-react';
import {
  ASSET_WORKFLOW_STATES, ASSET_CONDITIONS, AMC_STATUSES,
  INSURANCE_STATUSES, MAINTENANCE_STATUSES, RISK_LEVELS,
  COMPLIANCE_STATUSES, DEPRECIATION_METHODS,
  fmtINR, fmtINRFull, fmtDate, fmtPct, fmtYears, MOCK_AUDIT_EVENTS,
} from './ARConstants';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: Package     },
  { id: 'procurement', label: 'Procurement', icon: FileText    },
  { id: 'financial',   label: 'Financial',   icon: BookOpen    },
  { id: 'lifecycle',   label: 'Lifecycle',   icon: Activity    },
  { id: 'insurance',   label: 'Insurance',   icon: Shield      },
  { id: 'workflow',    label: 'Workflow',    icon: GitMerge    },
  { id: 'audit',       label: 'Audit Trail', icon: ClipboardList },
];

// ─── Helper Components ────────────────────────────────────────────────────────
function InfoSection({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoField({ label, value, mono, highlight, negative, halfWidth }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-50 dark:border-slate-700/30 last:border-0 ${halfWidth ? 'w-full' : ''}`}>
      <span className="text-[10.5px] text-slate-400 dark:text-slate-500 flex-none min-w-[120px]">{label}</span>
      <span className={`text-[11px] font-medium text-right ${
        highlight ? 'text-sky-700 dark:text-sky-400 font-bold' :
        negative  ? 'text-rose-600 dark:text-rose-400 font-semibold' :
        mono      ? 'font-mono text-slate-600 dark:text-slate-300 text-[10px]' :
                    'text-slate-700 dark:text-slate-300'
      }`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function StatusChip({ label, bg, text, dot }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${bg} ${text}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: dot }} />}
      {label}
    </span>
  );
}

function ProcurementNode({ icon: Icon, title, id, date, amount, status, color, isLast }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-none border-2 border-white dark:border-slate-800 shadow" style={{ background: `${color}20`, borderColor: color }}>
          <Icon size={14} style={{ color }} />
        </div>
        {!isLast && <div className="w-px flex-1 mt-1" style={{ background: `${color}40` }} />}
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{title}</p>
          {status && (
            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              {status}
            </span>
          )}
        </div>
        {id && <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{id}</p>}
        <div className="flex items-center gap-3 mt-1">
          {date && <span className="text-[10px] text-slate-400 dark:text-slate-500">{fmtDate(date)}</span>}
          {amount > 0 && <span className="text-[10.5px] font-semibold text-slate-700 dark:text-slate-300">{fmtINR(amount)}</span>}
        </div>
      </div>
    </div>
  );
}

function DepreciationChart({ data }) {
  if (!data?.length) return <p className="text-xs text-slate-400 text-center py-4">No depreciation history available</p>;
  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="nbvGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="fy" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
        <Tooltip
          formatter={(v, name) => [fmtINR(v), name === 'grossValue' ? 'Gross Value' : name === 'netBook' ? 'Net Book Value' : 'Acc. Depr.']}
          contentStyle={{ fontSize: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
        />
        <Area type="monotone" dataKey="grossValue" stroke="#0ea5e9" strokeWidth={1.5} fill="url(#grossGrad)" strokeDasharray="4 2" />
        <Area type="monotone" dataKey="netBook"    stroke="#10b981" strokeWidth={2}   fill="url(#nbvGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MaintenanceTimeline({ asset }) {
  const events = [
    { label: 'Next Maintenance',  date: asset.nextMaintenanceDate,  status: 'UPCOMING', color: '#0ea5e9' },
    { label: 'Last Maintenance',  date: asset.lastMaintenanceDate,  status: 'COMPLETED', color: '#10b981' },
    { label: 'AMC Expiry',        date: asset.amcExpiry,            status: AMC_STATUSES[asset.amcStatus]?.label, color: asset.amcStatus === 'ACTIVE' ? '#10b981' : '#f59e0b' },
    { label: 'Warranty Expiry',   date: asset.warrantyExpiry,       status: 'WARRANTY', color: '#8b5cf6' },
    { label: 'Calibration Due',   date: asset.calibrationDueDate,   status: 'SCHEDULED', color: '#f59e0b' },
    { label: 'Replacement ETA',   date: asset.replacementForecast,  status: 'FORECAST', color: '#f97316' },
  ].filter(e => e.date);

  return (
    <div className="space-y-2.5">
      {events.map((e, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-none" style={{ background: e.color }} />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-600 dark:text-slate-300">{e.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-medium text-slate-700 dark:text-slate-200">{fmtDate(e.date)}</span>
              <span className="text-[9.5px] px-1.5 py-0.5 rounded-full" style={{ background: `${e.color}20`, color: e.color }}>{e.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────
function OverviewTab({ asset }) {
  const wfCfg  = ASSET_WORKFLOW_STATES[asset.workflowState] ?? ASSET_WORKFLOW_STATES.ACTIVE;
  const cndCfg = ASSET_CONDITIONS[asset.assetCondition]    ?? ASSET_CONDITIONS.GOOD;
  const rskCfg = RISK_LEVELS[asset.riskLevel]              ?? RISK_LEVELS.LOW;

  return (
    <div className="space-y-6 p-5">
      {/* Status Row */}
      <div className="flex flex-wrap gap-2">
        <StatusChip {...wfCfg} />
        <StatusChip {...cndCfg} />
        <StatusChip label={rskCfg.label + ' Risk'} bg={rskCfg.bg} text={rskCfg.text} />
        {asset.complianceStatus && (
          <StatusChip {...(COMPLIANCE_STATUSES[asset.complianceStatus] ?? COMPLIANCE_STATUSES.COMPLIANT)} />
        )}
      </div>

      {/* Key Financials */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Gross Value',      value: fmtINR(asset.grossValue),             color: '#0ea5e9' },
          { label: 'Net Book Value',   value: fmtINR(asset.netBookValue),            color: '#10b981' },
          { label: 'Acc. Depr.',       value: `(${fmtINR(asset.accumulatedDepreciation)})`, color: '#f43f5e' },
          { label: 'Utilization',      value: `${asset.utilizationRate}%`,           color: '#8b5cf6' },
          { label: 'Useful Life Left', value: fmtYears(asset.assetLifeRemaining),   color: '#f59e0b' },
          { label: 'Replacement Cost', value: fmtINR(asset.replacementCost),        color: '#f97316' },
        ].map(k => (
          <div key={k.label} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3 text-center">
            <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mb-1">{k.label}</p>
            <p className="text-sm font-bold leading-tight" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Asset Identity */}
      <InfoSection title="Asset Identity">
        <InfoField label="Asset ID"         value={asset.id}            mono />
        <InfoField label="Serial Number"    value={asset.serialNumber}  mono />
        <InfoField label="Model"            value={asset.modelNumber}         />
        <InfoField label="Manufacturer"     value={asset.manufacturer}        />
        <InfoField label="Sub-Category"     value={asset.subCategory}         />
        <InfoField label="Department"       value={asset.department}           />
        <InfoField label="Branch / Location"value={`${asset.branch} · ${asset.floor}`} />
      </InfoSection>

      {/* Acquisition */}
      <InfoSection title="Acquisition Details">
        <InfoField label="Acquisition Date"    value={fmtDate(asset.acquisitionDate)}    />
        <InfoField label="Capitalization Date" value={fmtDate(asset.capitalizationDate)} />
        <InfoField label="Put to Use Date"     value={fmtDate(asset.putToUseDate)}       />
        <InfoField label="Warranty Expiry"     value={fmtDate(asset.warrantyExpiry)}     />
        <InfoField label="Useful Life"         value={fmtYears(asset.usefulLife)}        />
        <InfoField label="Vendor"              value={asset.vendor}                       />
      </InfoSection>

      {/* Biomedical / Regulatory */}
      {(asset.biomedicaLicenseNo || asset.calibrationDueDate) && (
        <InfoSection title="Regulatory & Compliance">
          {asset.biomedicaLicenseNo && <InfoField label="CDSCO / AERB License" value={asset.biomedicaLicenseNo} mono />}
          {asset.calibrationDueDate && <InfoField label="Calibration Due" value={fmtDate(asset.calibrationDueDate)} />}
          <InfoField label="Compliance Status" value={COMPLIANCE_STATUSES[asset.complianceStatus]?.label ?? '—'} />
        </InfoSection>
      )}

      {/* Tags */}
      <div>
        <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-2">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {asset.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-full text-[10px] font-medium">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProcurementTab({ asset }) {
  return (
    <div className="p-5 space-y-6">
      <InfoSection title="Procurement Chain">
        <div className="mt-1">
          <ProcurementNode icon={FileText}   title="Purchase Order"   id={asset.poNumber}              date={asset.acquisitionDate}     amount={asset.grossValue} status="Approved"     color="#0ea5e9" />
          <ProcurementNode icon={Package}    title="Goods Receipt Note" id={asset.grnNumber}           date={asset.acquisitionDate}     amount={0}                status="GRN Posted"   color="#06b6d4" />
          <ProcurementNode icon={FileText}   title="Vendor Invoice"   id={asset.vendorInvoiceNumber}   date={asset.acquisitionDate}     amount={asset.grossValue} status="Verified"     color="#8b5cf6" />
          <ProcurementNode icon={BookOpen}   title="AP Entry"         id={asset.apEntryId}             date={asset.capitalizationDate}  amount={asset.grossValue} status="Posted"       color="#f59e0b" />
          <ProcurementNode icon={GitMerge}   title="GL Posting"       id={asset.glPostingId}           date={asset.capitalizationDate}  amount={asset.grossValue} status="Reconciled"   color="#10b981" isLast />
        </div>
      </InfoSection>

      <InfoSection title="Vendor Details">
        <InfoField label="Vendor Name"  value={asset.vendor}   />
        <InfoField label="Vendor ID"    value={asset.vendorId} mono />
        <InfoField label="GL Account"   value={asset.glAccount} mono />
      </InfoSection>

      <InfoSection title="Financial Postings">
        <InfoField label="Gross Value at Acquisition" value={fmtINRFull(asset.grossValue)} highlight />
        <InfoField label="Capitalization GL"          value={asset.glAccount}              mono      />
        <InfoField label="JV Reference"               value={asset.glPostingId}            mono      />
        <InfoField label="AP Entry"                   value={asset.apEntryId}              mono      />
      </InfoSection>
    </div>
  );
}

function FinancialTab({ asset }) {
  const deprCfg = DEPRECIATION_METHODS[asset.depreciationMethod] ?? DEPRECIATION_METHODS.SLM;
  const deprPct = ((asset.accumulatedDepreciation / asset.grossValue) * 100).toFixed(1);

  return (
    <div className="p-5 space-y-6">
      {/* Valuation Summary */}
      <InfoSection title="Asset Valuation">
        <InfoField label="Gross Value"               value={fmtINRFull(asset.grossValue)}                highlight />
        <InfoField label="Accumulated Depreciation"  value={`(${fmtINRFull(asset.accumulatedDepreciation)})`} negative />
        <InfoField label="Net Book Value"            value={fmtINRFull(asset.netBookValue)}              highlight />
        <InfoField label="Salvage Value"             value={fmtINRFull(asset.salvageValue)}                       />
        <InfoField label="Depreciation %"           value={`${deprPct}% depreciated`}                            />
        <InfoField label="Replacement Cost (Est.)"  value={fmtINRFull(asset.replacementCost)}                    />
      </InfoSection>

      {/* Depreciation Parameters */}
      <InfoSection title="Depreciation Parameters">
        <InfoField label="Method"        value={`${deprCfg.fullLabel} (${deprCfg.label})`} />
        <InfoField label="Annual Rate"   value={`${asset.depreciationRate}% p.a.`}          />
        <InfoField label="Useful Life"   value={fmtYears(asset.usefulLife)}                />
        <InfoField label="Life Consumed" value={fmtYears(asset.usefulLife - asset.assetLifeRemaining)} />
        <InfoField label="Life Remaining"value={fmtYears(asset.assetLifeRemaining)}        />
      </InfoSection>

      {/* Depreciation Schedule Chart */}
      {asset.depreciationHistory?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-3">
            Depreciation History & Trend
          </p>
          <DepreciationChart data={asset.depreciationHistory} />
        </div>
      )}

      {/* Year-by-Year Schedule */}
      {asset.depreciationHistory?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-2">
            Schedule (FY-wise)
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
            <table className="w-full min-w-max text-[10.5px]">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {['FY', 'Opening Value', 'Depr. Charge', 'Closing Value', 'Method'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {asset.depreciationHistory.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <td className="px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300">{row.fy}</td>
                    <td className="px-3 py-1.5 text-sky-700 dark:text-sky-400 font-semibold">{fmtINR(row.opening)}</td>
                    <td className="px-3 py-1.5 text-rose-600 dark:text-rose-400">({fmtINR(row.charge)})</td>
                    <td className="px-3 py-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">{fmtINR(row.closing)}</td>
                    <td className="px-3 py-1.5">
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-mono font-bold text-slate-600 dark:text-slate-300">{row.method}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LifecycleTab({ asset }) {
  const amcCfg = AMC_STATUSES[asset.amcStatus] ?? AMC_STATUSES.NONE;
  const mntCfg = MAINTENANCE_STATUSES[asset.maintenanceStatus] ?? MAINTENANCE_STATUSES.OK;

  return (
    <div className="p-5 space-y-6">
      {/* Asset Lifecycle Timeline */}
      <InfoSection title="Asset Lifecycle Timeline">
        <MaintenanceTimeline asset={asset} />
      </InfoSection>

      {/* AMC / Contract Details */}
      <InfoSection title="AMC / Service Contract">
        <div className="flex items-center gap-2 mb-2">
          <StatusChip label={amcCfg.label} bg={amcCfg.bg} text={amcCfg.text} dot={amcCfg.dot} />
        </div>
        <InfoField label="AMC Vendor"         value={asset.amcVendor ?? 'Not applicable'}    />
        <InfoField label="AMC Expiry"         value={fmtDate(asset.amcExpiry)}               />
        <InfoField label="Annual AMC Value"   value={fmtINRFull(asset.amcValue)}             />
      </InfoSection>

      {/* Maintenance History */}
      <InfoSection title="Maintenance Status">
        <div className="flex items-center gap-2 mb-2">
          <StatusChip label={mntCfg.label} bg={mntCfg.bg} text={mntCfg.text} dot={mntCfg.dot} />
        </div>
        <InfoField label="Last Maintenance"   value={fmtDate(asset.lastMaintenanceDate)} />
        <InfoField label="Next Maintenance"   value={fmtDate(asset.nextMaintenanceDate)} />
        <InfoField label="Calibration Due"    value={fmtDate(asset.calibrationDueDate)} />
      </InfoSection>

      {/* Utilization */}
      <InfoSection title="Utilization Analytics">
        <div className="mt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Overall Utilization</span>
            <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{asset.utilizationRate}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${asset.utilizationRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: asset.utilizationRate >= 80 ? '#10b981' : asset.utilizationRate >= 50 ? '#0ea5e9' : asset.utilizationRate >= 30 ? '#f59e0b' : '#f43f5e' }}
            />
          </div>
          <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-1">
            {asset.utilizationRate >= 80 ? 'High utilization — asset working at full capacity' :
             asset.utilizationRate >= 50 ? 'Moderate utilization — consider peak scheduling' :
             asset.utilizationRate >= 30 ? 'Below average — review redeployment options' :
             'Critically underutilized — immediate review required'}
          </p>
        </div>
      </InfoSection>

      {/* Replacement Planning */}
      <InfoSection title="Replacement Planning">
        <InfoField label="Forecast Replacement" value={fmtDate(asset.replacementForecast)}  />
        <InfoField label="Estimated Cost"       value={fmtINRFull(asset.replacementCost)}   />
        <InfoField label="Life Remaining"       value={fmtYears(asset.assetLifeRemaining)}  />
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl">
          <p className="text-[10.5px] font-semibold text-amber-700 dark:text-amber-400">CapEx Planning Note</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">
            Budget {fmtINR(asset.replacementCost)} for replacement by {fmtDate(asset.replacementForecast)}.
            Include in CapEx plan FY {new Date(asset.replacementForecast).getFullYear() - 1}-{new Date(asset.replacementForecast).getFullYear()}.
          </p>
        </div>
      </InfoSection>
    </div>
  );
}

function InsuranceTab({ asset }) {
  const insCfg = INSURANCE_STATUSES[asset.insuranceStatus] ?? INSURANCE_STATUSES.NONE;
  const cmpCfg = COMPLIANCE_STATUSES[asset.complianceStatus] ?? COMPLIANCE_STATUSES.COMPLIANT;

  return (
    <div className="p-5 space-y-6">
      {/* Insurance Coverage */}
      <InfoSection title="Insurance Coverage">
        <div className="flex items-center gap-2 mb-3">
          <StatusChip label={insCfg.label} bg={insCfg.bg} text={insCfg.text} dot={insCfg.dot} />
          {asset.insuranceStatus === 'EXPIRING' && (
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle size={10} /> Renewal required soon
            </span>
          )}
        </div>
        <InfoField label="Insurance Provider"   value={asset.insuranceProvider ?? '—'}       />
        <InfoField label="Policy Number"        value={asset.insurancePolicyNo ?? '—'}  mono />
        <InfoField label="Insured Value"        value={fmtINRFull(asset.insuredValue)}   highlight />
        <InfoField label="Policy Expiry"        value={fmtDate(asset.insuranceExpiry)}        />
      </InfoSection>

      {/* Compliance Status */}
      <InfoSection title="Regulatory Compliance">
        <div className="flex items-center gap-2 mb-2">
          <StatusChip label={cmpCfg.label} bg={cmpCfg.bg} text={cmpCfg.text} dot={cmpCfg.dot} />
        </div>
        {asset.biomedicaLicenseNo && (
          <InfoField label="CDSCO / AERB License" value={asset.biomedicaLicenseNo} mono />
        )}
        <InfoField label="Calibration Due"       value={fmtDate(asset.calibrationDueDate)} />

        {/* Compliance Checklist */}
        <div className="mt-3 space-y-2">
          {[
            { label: 'Biomedical License',     ok: !!asset.biomedicaLicenseNo },
            { label: 'Insurance Active',       ok: asset.insuranceStatus === 'ACTIVE'   },
            { label: 'AMC Coverage',           ok: asset.amcStatus === 'ACTIVE'         },
            { label: 'Calibration Current',    ok: asset.calibrationDueDate ? new Date(asset.calibrationDueDate) > new Date() : true },
            { label: 'Maintenance Current',    ok: asset.maintenanceStatus === 'OK'     },
          ].map(({ label, ok }) => (
            <div key={label} className="flex items-center gap-2">
              {ok
                ? <CheckCircle2 size={13} className="text-emerald-500 flex-none" />
                : <AlertTriangle size={13} className="text-amber-500 flex-none" />
              }
              <span className={`text-[11px] ${ok ? 'text-slate-600 dark:text-slate-300' : 'text-amber-700 dark:text-amber-400 font-medium'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </InfoSection>
    </div>
  );
}

function WorkflowTab({ asset }) {
  const wfCfg = ASSET_WORKFLOW_STATES[asset.workflowState] ?? ASSET_WORKFLOW_STATES.ACTIVE;
  const STEPS = ['DRAFT','ACQUIRED','CAPITALIZED','ACTIVE','UNDER_MAINTENANCE','REVALUED','IMPAIRED','PENDING_DISPOSAL','DISPOSED'];
  const currentIdx = STEPS.indexOf(asset.workflowState);

  return (
    <div className="p-5 space-y-6">
      <InfoSection title="Workflow State">
        <div className="flex items-center gap-2 mb-4">
          <StatusChip label={wfCfg.label} bg={wfCfg.bg} text={wfCfg.text} dot={wfCfg.dot} />
        </div>
        {/* State machine stepper */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center gap-0 min-w-max">
            {STEPS.slice(0, 5).map((step, i) => {
              const cfg = ASSET_WORKFLOW_STATES[step];
              const isDone = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={step} className="flex items-center">
                  <div className={`flex flex-col items-center gap-1 w-20 ${isCurrent ? 'opacity-100' : isDone ? 'opacity-80' : 'opacity-40'}`}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all"
                      style={{
                        borderColor: isCurrent ? cfg.dot : isDone ? '#10b981' : '#e2e8f0',
                        background: isCurrent ? `${cfg.dot}20` : isDone ? '#d1fae520' : 'transparent',
                      }}
                    >
                      {isDone ? <CheckCircle2 size={12} className="text-emerald-500" /> : (
                        <span className="text-[8px] font-bold" style={{ color: isCurrent ? cfg.dot : '#94a3b8' }}>{i + 1}</span>
                      )}
                    </div>
                    <span className="text-[8.5px] text-slate-500 dark:text-slate-400 text-center leading-tight">{cfg.label}</span>
                  </div>
                  {i < 4 && <div className={`w-8 h-px mb-4 transition-colors ${isDone ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </InfoSection>

      {/* Quick Actions */}
      <InfoSection title="Asset Actions">
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[
            { label: 'Transfer Asset',  icon: ArrowRightLeft, color: '#8b5cf6' },
            { label: 'Schedule Maint.', icon: Wrench,         color: '#f59e0b' },
            { label: 'Dispose Asset',   icon: Trash2,         color: '#ef4444' },
            { label: 'Revalue Asset',   icon: RotateCcw,      color: '#06b6d4' },
          ].map(({ label, icon: Icon, color }) => (
            <button
              key={label}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-none" style={{ background: `${color}18` }}>
                <Icon size={12} style={{ color }} />
              </div>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{label}</span>
            </button>
          ))}
        </div>
      </InfoSection>
    </div>
  );
}

function AuditTab({ asset }) {
  const events = MOCK_AUDIT_EVENTS.filter(e => e.asset === asset.id);

  return (
    <div className="p-5 space-y-6">
      <InfoSection title="Immutable Audit Trail">
        {events.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No audit events for this asset.</p>
        ) : (
          <div className="space-y-0">
            {events.map((ev, i) => (
              <div key={ev.id} className="flex gap-3 pb-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-sky-500 flex-none mt-1.5" />
                  {i < events.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200">{ev.event.replace(/_/g, ' ')}</span>
                    <span className="text-[9.5px] font-mono text-slate-400 dark:text-slate-500">{ev.id}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{ev.note}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9.5px] font-semibold text-sky-600 dark:text-sky-400">{ev.user}</span>
                    <span className="text-[9.5px] text-slate-400 dark:text-slate-500">· {ev.role}</span>
                    <span className="text-[9.5px] text-slate-400 dark:text-slate-500">· {fmtDate(ev.ts)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </InfoSection>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function ARDetailDrawer({ asset, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!asset) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-[640px] max-w-full z-50 bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-slate-200 dark:border-slate-700 flex-none">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none" style={{ background: '#0ea5e920' }}>
            <Package size={18} style={{ color: '#0ea5e9' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-sky-600 dark:text-sky-400">{asset.id}</p>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight mt-0.5 pr-6 truncate">{asset.assetName}</h2>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">{asset.department} · {asset.branch}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors flex-none">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto flex-none">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[10.5px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={11} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'overview'    && <OverviewTab    asset={asset} />}
              {activeTab === 'procurement' && <ProcurementTab asset={asset} />}
              {activeTab === 'financial'   && <FinancialTab   asset={asset} />}
              {activeTab === 'lifecycle'   && <LifecycleTab   asset={asset} />}
              {activeTab === 'insurance'   && <InsuranceTab   asset={asset} />}
              {activeTab === 'workflow'    && <WorkflowTab    asset={asset} />}
              {activeTab === 'audit'       && <AuditTab       asset={asset} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
