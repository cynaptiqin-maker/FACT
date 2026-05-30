// ─── Asset Register — Enterprise Asset Management Grid ────────────────────────
// 22-column · Sticky columns · Expandable rows · Bulk actions · Sky theme
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, MoreHorizontal, Eye, FileText,
  Wrench, ArrowRightLeft, Trash2, ClipboardList, Sparkles,
  CheckSquare, Square, ExternalLink, AlertTriangle, Shield,
  ShieldAlert, PauseCircle, Activity, BookOpen, GitMerge,
  Building2, Package, TrendingDown, AlertCircle,
} from 'lucide-react';
import {
  ASSET_WORKFLOW_STATES, ASSET_CONDITIONS, AMC_STATUSES,
  INSURANCE_STATUSES, MAINTENANCE_STATUSES, RISK_LEVELS,
  UTILIZATION_STATUSES, DEPRECIATION_METHODS,
  fmtINR, fmtDate, fmtPct, fmtYears,
} from './ARConstants';

// ─── Badge Components ─────────────────────────────────────────────────────────
function WorkflowBadge({ state }) {
  const cfg = ASSET_WORKFLOW_STATES[state] ?? ASSET_WORKFLOW_STATES.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function ConditionBadge({ condition }) {
  const cfg = ASSET_CONDITIONS[condition] ?? ASSET_CONDITIONS.GOOD;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function AmcBadge({ status }) {
  const cfg = AMC_STATUSES[status] ?? AMC_STATUSES.NONE;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function InsuranceBadge({ status }) {
  const cfg = INSURANCE_STATUSES[status] ?? INSURANCE_STATUSES.NONE;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function MaintenanceBadge({ status }) {
  const cfg = MAINTENANCE_STATUSES[status] ?? MAINTENANCE_STATUSES.OK;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function RiskBadge({ level }) {
  const cfg = RISK_LEVELS[level] ?? RISK_LEVELS.LOW;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function UtilizationBadge({ status, rate }) {
  const cfg = UTILIZATION_STATUSES[status] ?? UTILIZATION_STATUSES.MODERATE;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rate}%`, background: cfg.text.includes('emerald') ? '#10b981' : cfg.text.includes('sky') ? '#0ea5e9' : cfg.text.includes('amber') ? '#f59e0b' : '#f43f5e' }}
        />
      </div>
      <span className={`text-[10px] font-semibold ${cfg.text}`}>{rate}%</span>
    </div>
  );
}

function DeprMethodBadge({ method }) {
  const cfg = DEPRECIATION_METHODS[method] ?? DEPRECIATION_METHODS.SLM;
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700">
      {cfg.label}
    </span>
  );
}

function AssetIcon({ category }) {
  const colors = { RADIOLOGY: '#0ea5e9', CRITICAL_CARE: '#ef4444', OT_EQUIPMENT: '#8b5cf6', LABORATORY: '#f59e0b', IT_INFRASTRUCTURE: '#6366f1', BIOMEDICAL: '#06b6d4', VEHICLES: '#059669', HVAC_UTILITIES: '#0891b2', FURNITURE_FIXTURE: '#64748b', BUILDING: '#92400e' };
  const color = colors[category] ?? '#94a3b8';
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none" style={{ background: `${color}18` }}>
      <Package size={14} style={{ color }} />
    </div>
  );
}

// ─── Inline Expanded Asset Detail Row ────────────────────────────────────────
function ExpandedRow({ asset, onOpenDrawer }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={24} className="p-0">
        <div className="bg-sky-50/60 dark:bg-sky-900/10 border-t border-b border-sky-100 dark:border-sky-800/40 px-4 py-4">
          <div className="grid grid-cols-4 gap-4">
            {/* Asset Profile */}
            <div className="col-span-1">
              <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-2.5">Asset Profile</p>
              <div className="space-y-1.5">
                <InfoRow label="Serial No." value={asset.serialNumber} mono />
                <InfoRow label="Model" value={asset.modelNumber} />
                <InfoRow label="Manufacturer" value={asset.manufacturer} />
                <InfoRow label="Warranty Expiry" value={fmtDate(asset.warrantyExpiry)} />
                <InfoRow label="Put to Use" value={fmtDate(asset.putToUseDate)} />
                <InfoRow label="Useful Life" value={fmtYears(asset.usefulLife)} />
                <InfoRow label="Life Remaining" value={fmtYears(asset.assetLifeRemaining)} />
                {asset.biomedicaLicenseNo && <InfoRow label="CDSCO/AERB Lic." value={asset.biomedicaLicenseNo} mono />}
              </div>
            </div>

            {/* Procurement Chain */}
            <div className="col-span-1">
              <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-2.5">Procurement Chain</p>
              <div className="space-y-2">
                <ProcurementStep icon={FileText} label="Purchase Order" value={asset.poNumber} color="#0ea5e9" />
                <ProcurementStep icon={Package} label="GRN" value={asset.grnNumber} color="#06b6d4" />
                <ProcurementStep icon={FileText} label="Vendor Invoice" value={asset.vendorInvoiceNumber} color="#8b5cf6" />
                <ProcurementStep icon={BookOpen} label="AP Entry" value={asset.apEntryId} color="#f59e0b" />
                <ProcurementStep icon={GitMerge} label="GL Posting" value={asset.glPostingId} color="#10b981" />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="col-span-1">
              <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-2.5">Financial Summary</p>
              <div className="space-y-1.5">
                <InfoRow label="Gross Value" value={fmtINR(asset.grossValue)} highlight />
                <InfoRow label="Acc. Depreciation" value={fmtINR(asset.accumulatedDepreciation)} negative />
                <InfoRow label="Net Book Value" value={fmtINR(asset.netBookValue)} highlight />
                <InfoRow label="Salvage Value" value={fmtINR(asset.salvageValue)} />
                <InfoRow label="Depreciation Rate" value={`${asset.depreciationRate}% p.a.`} />
                <InfoRow label="GL Account" value={asset.glAccount} mono />
                <InfoRow label="Replacement Cost" value={fmtINR(asset.replacementCost)} />
              </div>
            </div>

            {/* Coverage & Risk */}
            <div className="col-span-1">
              <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-2.5">Coverage & Risk</p>
              <div className="space-y-1.5">
                <InfoRow label="Insurance" value={asset.insuranceProvider} />
                <InfoRow label="Policy No." value={asset.insurancePolicyNo} mono />
                <InfoRow label="Insured Value" value={fmtINR(asset.insuredValue)} />
                <InfoRow label="AMC Vendor" value={asset.amcVendor ?? '—'} />
                <InfoRow label="AMC Expiry" value={fmtDate(asset.amcExpiry)} />
                <InfoRow label="AMC Value" value={fmtINR(asset.amcValue)} />
                <InfoRow label="Next Maintenance" value={fmtDate(asset.nextMaintenanceDate)} />
              </div>
            </div>
          </div>

          {/* Tags + Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-sky-100 dark:border-sky-800/40">
            <div className="flex flex-wrap gap-1.5">
              {asset.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-full text-[10px] font-medium">
                  #{tag}
                </span>
              ))}
            </div>
            <button
              onClick={() => onOpenDrawer(asset)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
            >
              <Eye size={12} />
              Full Asset View
            </button>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

function InfoRow({ label, value, mono, highlight, negative }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-none">{label}</span>
      <span className={`text-[10.5px] font-medium text-right truncate max-w-[140px] ${
        highlight ? 'text-sky-700 dark:text-sky-400 font-bold' :
        negative  ? 'text-rose-600 dark:text-rose-400' :
        mono      ? 'font-mono text-slate-600 dark:text-slate-300 text-[9.5px]' :
                    'text-slate-700 dark:text-slate-300'
      }`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function ProcurementStep({ icon: Icon, label, value, color }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded flex items-center justify-center flex-none" style={{ background: `${color}18` }}>
        <Icon size={10} style={{ color }} />
      </div>
      <div>
        <p className="text-[9px] text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-[10.5px] font-medium text-slate-700 dark:text-slate-300 font-mono">{value}</p>
      </div>
      <ExternalLink size={9} className="ml-auto text-slate-300 dark:text-slate-600 hover:text-sky-500 cursor-pointer flex-none" />
    </div>
  );
}

// ─── Bulk Action Toolbar ──────────────────────────────────────────────────────
function BulkActionBar({ selectedCount, onClear, onBulkAction }) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center gap-2.5 px-3 py-2 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl mb-2"
        >
          <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
            {selectedCount} asset{selectedCount > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            {[
              { label: 'Depreciation Run', icon: TrendingDown },
              { label: 'Schedule Maintenance', icon: Wrench },
              { label: 'Export', icon: FileText },
              { label: 'Dispose', icon: Trash2, danger: true },
            ].map(({ label, icon: Icon, danger }) => (
              <button
                key={label}
                onClick={() => onBulkAction(label)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                  danger
                    ? 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                    : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                <Icon size={11} />{label}
              </button>
            ))}
          </div>
          <button onClick={onClear} className="ml-auto text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronDown size={14} className="rotate-180" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Grid Row ─────────────────────────────────────────────────────────────────
function AssetRow({ asset, isSelected, isExpanded, onSelect, onExpand, onOpenDrawer, onAction }) {
  return (
    <>
      <tr
        className={`group border-b border-slate-100 dark:border-slate-700/50 hover:bg-sky-50/40 dark:hover:bg-sky-900/10 transition-colors cursor-pointer ${
          isSelected ? 'bg-sky-50/60 dark:bg-sky-900/15' : 'bg-white dark:bg-slate-800/30'
        } ${isExpanded ? 'bg-sky-50/60 dark:bg-sky-900/15' : ''}`}
      >
        {/* Checkbox */}
        <td className="sticky left-0 z-10 w-10 px-3 py-2.5 bg-inherit" onClick={(e) => { e.stopPropagation(); onSelect(asset.id); }}>
          {isSelected
            ? <CheckSquare size={14} className="text-sky-500" />
            : <Square size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
          }
        </td>

        {/* Expand */}
        <td className="sticky left-10 z-10 w-8 px-1 py-2.5 bg-inherit" onClick={() => onExpand(asset.id)}>
          {isExpanded
            ? <ChevronDown size={13} className="text-sky-500" />
            : <ChevronRight size={13} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
          }
        </td>

        {/* Asset ID */}
        <td className="sticky left-[4.5rem] z-10 min-w-[120px] px-3 py-2.5 bg-inherit" onClick={() => onExpand(asset.id)}>
          <span className="text-[10.5px] font-mono font-semibold text-sky-600 dark:text-sky-400">{asset.id}</span>
        </td>

        {/* Asset Name */}
        <td className="min-w-[240px] px-3 py-2.5" onClick={() => onOpenDrawer(asset)}>
          <div className="flex items-center gap-2">
            <AssetIcon category={asset.assetCategory} />
            <div>
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight max-w-[200px] truncate">{asset.assetName}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{asset.subCategory}</p>
            </div>
          </div>
        </td>

        {/* Category */}
        <td className="min-w-[130px] px-3 py-2.5">
          <span className="text-[10.5px] text-slate-600 dark:text-slate-400">{asset.assetCategory.replace('_', ' ').replace(/\b\w/g, c => c)}</span>
        </td>

        {/* Department */}
        <td className="min-w-[140px] px-3 py-2.5">
          <span className="text-[10.5px] text-slate-600 dark:text-slate-400 truncate block max-w-[130px]">{asset.department}</span>
        </td>

        {/* Branch */}
        <td className="min-w-[110px] px-3 py-2.5">
          <div className="flex items-center gap-1">
            <Building2 size={10} className="text-slate-400 flex-none" />
            <span className="text-[10.5px] text-slate-600 dark:text-slate-400">{asset.branch}</span>
          </div>
        </td>

        {/* Vendor */}
        <td className="min-w-[150px] px-3 py-2.5">
          <span className="text-[10.5px] text-slate-600 dark:text-slate-400 truncate block max-w-[140px]">{asset.vendor}</span>
        </td>

        {/* PO Number */}
        <td className="min-w-[120px] px-3 py-2.5">
          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">{asset.poNumber}</span>
        </td>

        {/* Acquisition Date */}
        <td className="min-w-[100px] px-3 py-2.5">
          <span className="text-[10.5px] text-slate-600 dark:text-slate-400">{fmtDate(asset.acquisitionDate)}</span>
        </td>

        {/* Capitalization Date */}
        <td className="min-w-[110px] px-3 py-2.5">
          <span className="text-[10.5px] text-slate-600 dark:text-slate-400">{fmtDate(asset.capitalizationDate)}</span>
        </td>

        {/* Gross Value */}
        <td className="min-w-[110px] px-3 py-2.5 text-right">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{fmtINR(asset.grossValue)}</span>
        </td>

        {/* Accumulated Depreciation */}
        <td className="min-w-[120px] px-3 py-2.5 text-right">
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">({fmtINR(asset.accumulatedDepreciation)})</span>
        </td>

        {/* Net Book Value */}
        <td className="min-w-[110px] px-3 py-2.5 text-right">
          <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400">{fmtINR(asset.netBookValue)}</span>
        </td>

        {/* Depr Method */}
        <td className="min-w-[70px] px-3 py-2.5">
          <DeprMethodBadge method={asset.depreciationMethod} />
        </td>

        {/* AMC Status */}
        <td className="min-w-[110px] px-3 py-2.5">
          <AmcBadge status={asset.amcStatus} />
        </td>

        {/* Insurance Status */}
        <td className="min-w-[110px] px-3 py-2.5">
          <InsuranceBadge status={asset.insuranceStatus} />
        </td>

        {/* Maintenance Status */}
        <td className="min-w-[110px] px-3 py-2.5">
          <MaintenanceBadge status={asset.maintenanceStatus} />
        </td>

        {/* Utilization */}
        <td className="min-w-[120px] px-3 py-2.5">
          <UtilizationBadge status={asset.utilizationStatus} rate={asset.utilizationRate} />
        </td>

        {/* Condition */}
        <td className="min-w-[90px] px-3 py-2.5">
          <ConditionBadge condition={asset.assetCondition} />
        </td>

        {/* Risk Level */}
        <td className="min-w-[85px] px-3 py-2.5">
          <RiskBadge level={asset.riskLevel} />
        </td>

        {/* Workflow Status */}
        <td className="min-w-[130px] px-3 py-2.5">
          <WorkflowBadge state={asset.workflowState} />
        </td>

        {/* Last Updated */}
        <td className="min-w-[120px] px-3 py-2.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{fmtDate(asset.lastUpdated)}</span>
        </td>

        {/* Actions */}
        <td className="sticky right-0 z-10 min-w-[100px] px-3 py-2.5 bg-inherit">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onOpenDrawer(asset)} title="View Details" className="p-1 rounded hover:bg-sky-100 dark:hover:bg-sky-900/30 text-sky-600 dark:text-sky-400 transition-colors">
              <Eye size={12} />
            </button>
            <button onClick={() => onAction('maintenance', asset)} title="Schedule Maintenance" className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 transition-colors">
              <Wrench size={12} />
            </button>
            <button onClick={() => onAction('transfer', asset)} title="Transfer Asset" className="p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-600 dark:text-violet-400 transition-colors">
              <ArrowRightLeft size={12} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onAction('menu', asset); }} title="More Actions" className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
              <MoreHorizontal size={12} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Detail Row */}
      <AnimatePresence>
        {isExpanded && (
          <ExpandedRow key={`exp-${asset.id}`} asset={asset} onOpenDrawer={onOpenDrawer} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Grid Header ──────────────────────────────────────────────────────────────
function GridHeader({ allSelected, onSelectAll, sortCol, sortDir, onSort }) {
  const Col = ({ col, label, className = '', right = false }) => (
    <th
      onClick={() => col && onSort(col)}
      className={`px-3 py-2.5 text-left whitespace-nowrap ${col ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''} ${className}`}
    >
      <div className={`flex items-center gap-1 ${right ? 'justify-end' : ''}`}>
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        {col && (
          <span className={`text-[9px] transition-opacity ${sortCol === col ? 'opacity-100 text-sky-500' : 'opacity-0 group-hover:opacity-50 text-slate-400'}`}>
            {sortDir === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-20">
      <tr className="border-b border-slate-200 dark:border-slate-700">
        <th className="sticky left-0 z-30 w-10 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80">
          <button onClick={onSelectAll}>{allSelected ? <CheckSquare size={13} className="text-sky-500" /> : <Square size={13} className="text-slate-400" />}</button>
        </th>
        <th className="sticky left-10 z-30 w-8 px-1 py-2.5 bg-slate-50 dark:bg-slate-800/80" />
        <Col col="id"                  label="Asset ID"       className="sticky left-[4.5rem] z-30 bg-slate-50 dark:bg-slate-800/80" />
        <Col col="assetName"           label="Asset Name"     />
        <Col col="assetCategory"       label="Category"       />
        <Col col="department"          label="Department"     />
        <Col col="branch"              label="Branch"         />
        <Col                           label="Vendor"         />
        <Col col="poNumber"            label="PO No."         />
        <Col col="acquisitionDate"     label="Acquired"       />
        <Col col="capitalizationDate"  label="Capitalized"    />
        <Col col="grossValue"          label="Gross Value"    right />
        <Col col="accumulatedDepreciation" label="Acc. Depr." right />
        <Col col="netBookValue"        label="Net Book Value" right />
        <Col                           label="Method"         />
        <Col col="amcStatus"           label="AMC"            />
        <Col col="insuranceStatus"     label="Insurance"      />
        <Col col="maintenanceStatus"   label="Maintenance"    />
        <Col col="utilizationRate"     label="Utilization"    />
        <Col col="assetCondition"      label="Condition"      />
        <Col col="riskLevel"           label="Risk"           />
        <Col col="workflowState"       label="Status"         />
        <Col col="lastUpdated"         label="Updated"        />
        <th className="sticky right-0 z-30 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
  );
}

// ─── Main Grid Component ──────────────────────────────────────────────────────
export default function ARGrid({ assets, onOpenDrawer }) {
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(new Set());
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  const handleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selected.size === assets.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(assets.map(a => a.id)));
    }
  }, [assets, selected.size]);

  const handleExpand = useCallback((id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSort = useCallback((col) => {
    setSortDir(prev => (sortCol === col && prev === 'asc') ? 'desc' : 'asc');
    setSortCol(col);
  }, [sortCol]);

  const sorted = [...assets].sort((a, b) => {
    const va = a[sortCol], vb = b[sortCol];
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (assets.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl py-20 text-center">
        <Package size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No assets found</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Adjust your filters or add a new asset</p>
      </div>
    );
  }

  return (
    <div>
      <BulkActionBar
        selectedCount={selected.size}
        onClear={() => setSelected(new Set())}
        onBulkAction={(action) => console.log('Bulk:', action, [...selected])}
      />

      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full min-w-max border-collapse">
            <GridHeader
              allSelected={selected.size === assets.length && assets.length > 0}
              onSelectAll={handleSelectAll}
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <tbody>
              {sorted.map(asset => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  isSelected={selected.has(asset.id)}
                  isExpanded={expanded.has(asset.id)}
                  onSelect={handleSelect}
                  onExpand={handleExpand}
                  onOpenDrawer={onOpenDrawer}
                  onAction={(action, a) => console.log('Action:', action, a.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
          <span className="text-[10.5px] text-slate-400 dark:text-slate-500">
            {sorted.length} assets · {selected.size > 0 ? `${selected.size} selected · ` : ''}
            Total NBV: <span className="font-semibold text-sky-600 dark:text-sky-400">{fmtINR(sorted.reduce((s, a) => s + a.netBookValue, 0))}</span>
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Gross: <span className="font-semibold text-slate-600 dark:text-slate-400">{fmtINR(sorted.reduce((s, a) => s + a.grossValue, 0))}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
