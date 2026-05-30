import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

import NIHeader         from './NI/NIHeader';
import NIPatientContext from './NI/NIPatientContext';
import NIBillingSummary from './NI/NIBillingSummary';
import NILineItemGrid   from './NI/NILineItemGrid';
import NIServiceSearch  from './NI/NIServiceSearch';
import NIPackageInsurance from './NI/NIPackageInsurance';
import NIPaymentSection from './NI/NIPaymentSection';
import NIAIPanel        from './NI/NIAIPanel';
import NILeakageAlerts  from './NI/NILeakageAlerts';
import NIFinancialImpact from './NI/NIFinancialImpact';
import NIAuditTimeline  from './NI/NIAuditTimeline';

import { generateRowId, NI_SERVICE_CATALOG, fmt } from './NI/NIConstants';

const NI_INITIAL_AUDIT = [
  { id:'al-init', action:'Invoice workspace opened', detail:'New invoice initiated', type:'CREATE', user:'Billing User', role:'billing_staff', ts: new Date().toISOString() },
];

// ─── Invoice number generator ─────────────────────────────────────────────────
function genInvoiceNo() {
  const yr = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
  return `INV-${yr}-${seq}`;
}

function todayStr() {
  return new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ─── Approval status computation ──────────────────────────────────────────────
function computeApprovalStatus(lineItems, totals) {
  const maxDisc  = Math.max(...lineItems.map(li => li.discPct || 0), 0);
  const netTotal = totals.netPayable || 0;
  if (maxDisc > 25) return 'PENDING';
  if (netTotal > 100000) return 'PENDING';
  return 'APPROVED';
}

// ─── Billing calculations (pure) ──────────────────────────────────────────────
function calcTotals(lineItems, patient, paymentModes) {
  let grossCharges   = 0;
  let totalDiscount  = 0;
  let totalTax       = 0;

  lineItems.forEach(li => {
    const base = (li.qty || 0) * (li.unitPrice || 0);
    const disc = base * ((li.discPct || 0) / 100);
    const tax  = (base - disc) * ((li.taxPct || 0) / 100);
    grossCharges  += base;
    totalDiscount += disc;
    totalTax      += tax;
  });

  const taxableAmount   = grossCharges - totalDiscount;
  const rawInsurance    = patient?.insurance
    ? Math.min(patient.insurance.coverageAmt * 0.6, grossCharges * 0.65)
    : 0;
  const copayDeduction  = rawInsurance * ((patient?.insurance?.copay || 0) / 100);
  const insuranceCoverage = Math.max(0, rawInsurance - copayDeduction);
  const netPayable      = taxableAmount + totalTax - insuranceCoverage;
  const totalCollected  = paymentModes.reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding     = Math.max(0, netPayable - totalCollected);

  return {
    grossCharges,
    totalDiscount,
    taxableAmount,
    totalTax,
    insuranceCoverage,
    netPayable,
    totalCollected,
    outstanding,
  };
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function NewInvoice() {
  const navigate = useNavigate();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [invoiceNo]    = useState(genInvoiceNo);
  const [invoiceDate]  = useState(todayStr);
  const [billingType,  setBillingType]  = useState('OP');
  const [status,       setStatus]       = useState('DRAFT');
  const [syncState,    setSyncState]    = useState('synced');

  const [patient,      setPatient]      = useState(null);
  const [lineItems,    setLineItems]    = useState([]);
  const [selectedPkg,  setSelectedPkg]  = useState(null);
  const [paymentModes, setPaymentModes] = useState([]);
  const [auditLog,     setAuditLog]     = useState(NI_INITIAL_AUDIT);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [aiPanelOpen,      setAiPanelOpen]      = useState(true);
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [targetRowId,      setTargetRowId]      = useState(null);

  // ── Real-time billing calculations ──────────────────────────────────────────
  const totals = useMemo(
    () => calcTotals(lineItems, patient, paymentModes),
    [lineItems, patient, paymentModes]
  );

  const approvalStatus = useMemo(
    () => computeApprovalStatus(lineItems, totals),
    [lineItems, totals]
  );

  // ── Simulate sync state on changes ─────────────────────────────────────────
  useEffect(() => {
    setSyncState('syncing');
    const t = setTimeout(() => setSyncState('synced'), 600);
    return () => clearTimeout(t);
  }, [lineItems, patient, paymentModes]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function handler(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        // Add row shortcut — bubble to grid
        const btn = document.querySelector('[data-action="add-row"]');
        btn?.click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        handleAction('generate');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleAction('draft');
      }
      if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setServiceSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Audit logging helper ─────────────────────────────────────────────────────
  const addAuditEntry = useCallback((action, detail, type = 'EDIT') => {
    setAuditLog(prev => [...prev, {
      id: `al-${Date.now()}`,
      action, detail, type,
      user: 'Billing User',
      role: 'billing_staff',
      ts:   new Date().toISOString(),
    }]);
  }, []);

  // ── Patient selection ─────────────────────────────────────────────────────
  function handlePatientSelect(p) {
    setPatient(p);
    if (p) {
      if (p.type)        setBillingType(p.type);
      addAuditEntry(
        `Patient selected: ${p.name}`,
        `UHID: ${p.uhid} | Type: ${p.type}`,
        'EDIT'
      );
      if (p.outstanding > 0) {
        toast(`⚠ Patient has outstanding dues of ${fmt(p.outstanding)}`, { duration:5000 });
      }
    }
  }

  // ── Service search handling ──────────────────────────────────────────────────
  function handleOpenSearch(rowId) {
    setTargetRowId(rowId);
    setServiceSearchOpen(true);
  }

  function handleServiceSelect(svc) {
    if (targetRowId) {
      // Insert into specific row
      setLineItems(prev => prev.map(r => r.id === targetRowId ? {
        ...r,
        code:             svc.code,
        name:             svc.name,
        category:         svc.category,
        dept:             svc.dept,
        unitPrice:        svc.unitPrice,
        taxPct:           svc.taxPct,
        hsnCode:          svc.hsnCode,
        insuranceEligible:svc.insuranceEligible,
        packageable:      svc.packageable,
        qty:              1,
        discPct:          0,
      } : r));
    } else {
      // Add as new row
      setLineItems(prev => [...prev, {
        id:               generateRowId(),
        code:             svc.code,
        name:             svc.name,
        category:         svc.category,
        dept:             svc.dept,
        unitPrice:        svc.unitPrice,
        taxPct:           svc.taxPct,
        hsnCode:          svc.hsnCode,
        insuranceEligible:svc.insuranceEligible,
        packageable:      svc.packageable,
        qty:              1,
        discPct:          0,
        doctor:           patient?.doctor ?? '',
        doctorId:         patient?.doctorId ?? '',
        approvalStatus:   'AUTO',
        packageIncluded:  false,
        notes:            '',
      }]);
    }
    addAuditEntry(`Service added: ${svc.name}`, `Code: ${svc.code} | Rate: ${fmt(svc.unitPrice)}`, 'EDIT');
    setTargetRowId(null);
  }

  function handleMultipleServices(svcs) {
    const newRows = svcs.map(svc => ({
      id:               generateRowId(),
      code:             svc.code,
      name:             svc.name,
      category:         svc.category,
      dept:             svc.dept,
      unitPrice:        svc.unitPrice,
      taxPct:           svc.taxPct,
      hsnCode:          svc.hsnCode,
      insuranceEligible:svc.insuranceEligible,
      packageable:      svc.packageable,
      qty:              1,
      discPct:          0,
      doctor:           patient?.doctor ?? '',
      doctorId:         patient?.doctorId ?? '',
      approvalStatus:   'AUTO',
      packageIncluded:  false,
      notes:            '',
    }));
    setLineItems(prev => [...prev, ...newRows]);
    addAuditEntry(`${svcs.length} services added (bulk)`, svcs.map(s=>s.name).join(', '), 'CREATE');
    toast.success(`${svcs.length} services added to invoice`);
  }

  // ── Header actions ───────────────────────────────────────────────────────────
  function handleAction(action) {
    switch (action) {
      case 'draft':
        setStatus('DRAFT');
        addAuditEntry('Invoice saved as draft', `${lineItems.length} items | ${fmt(totals.netPayable)}`, 'EDIT');
        toast.success('Draft saved successfully');
        break;
      case 'generate':
        if (!patient) { toast.error('Please select a patient first'); return; }
        if (lineItems.length === 0) { toast.error('Add at least one billing item'); return; }
        setStatus('GENERATED');
        addAuditEntry('Invoice generated', `${invoiceNo} | ${fmt(totals.netPayable)} | ${patient.name}`, 'GENERATE');
        toast.success(`Invoice ${invoiceNo} generated successfully!`, { duration:4000 });
        break;
      case 'payment':
        if (totals.netPayable <= 0) { toast.error('No payable amount to collect'); return; }
        toast('Scroll to Payment & Collection section', { icon:'💳', duration:3000 });
        break;
      case 'print':
        addAuditEntry('Print preview opened', invoiceNo, 'EDIT');
        toast('Print preview opening…', { duration:2000 });
        window.print();
        break;
      case 'claim':
        if (!patient?.insurance) { toast.error('No insurance linked to patient'); return; }
        addAuditEntry('Insurance claim initiated', `TPA: ${patient.insurance.tpa}`, 'INSURANCE');
        toast.success('Claim submission initiated with ' + patient.insurance.tpa);
        break;
      case 'audit':
        toast('Audit log expanded below', { duration:2000 });
        break;
      default:
        toast(action);
    }
  }

  // ── Package selection ────────────────────────────────────────────────────────
  function handlePackageSelect(pkg) {
    setSelectedPkg(pkg);
    if (pkg) {
      addAuditEntry(`Package applied: ${pkg.name}`, `Value: ${fmt(pkg.totalValue)} | ${pkg.services.length} services`, 'EDIT');
      toast.success(`"${pkg.name}" package applied`);
    }
  }

  // ── Right panel content ──────────────────────────────────────────────────────
  const hasRightContent = aiPanelOpen;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <NIHeader
        invoiceNo={invoiceNo}
        invoiceDate={invoiceDate}
        billingType={billingType}
        onBillingTypeChange={setBillingType}
        status={status}
        syncState={syncState}
        aiPanelOpen={aiPanelOpen}
        onToggleAI={() => setAiPanelOpen(p => !p)}
        onAction={handleAction}
      />

      {/* ── Sticky billing summary ribbon ─────────────────────────────────── */}
      <NIBillingSummary totals={totals} />

      {/* ── Main body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: invoice workspace ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-w-0">

          {/* Patient context */}
          <div className="relative">
            <NIPatientContext
              patient={patient}
              onPatientSelect={handlePatientSelect}
            />
          </div>

          {/* Line item grid */}
          <NILineItemGrid
            lineItems={lineItems}
            setLineItems={setLineItems}
            onOpenSearch={handleOpenSearch}
          />

          {/* Package + Payment (side by side on large screens) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <NIPackageInsurance
              patient={patient}
              selectedPackage={selectedPkg}
              onPackageSelect={handlePackageSelect}
              lineItems={lineItems}
            />
            <NIPaymentSection
              paymentModes={paymentModes}
              setPaymentModes={setPaymentModes}
              totals={totals}
            />
          </div>

          {/* Audit timeline */}
          <NIAuditTimeline
            auditLog={auditLog}
            lineItems={lineItems}
            patient={patient}
          />

          {/* Bottom spacer */}
          <div className="h-6" />
        </div>

        {/* ── Right: AI + Leakage + Financial ─────────────────────────────── */}
        <AnimatePresence>
          {hasRightContent && (
            <motion.div
              initial={{ width:0, opacity:0 }}
              animate={{ width:340, opacity:1 }}
              exit={{   width:0, opacity:0 }}
              transition={{ duration:0.25, ease:'easeInOut' }}
              className="border-l border-slate-200 bg-white flex flex-col overflow-hidden shrink-0"
              style={{ width:340 }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <span className="text-xs font-semibold text-slate-500">Billing Intelligence</span>
                <button
                  onClick={() => setAiPanelOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Collapse panel"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable panel content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* AI Panel — takes bulk of space */}
                <div style={{ minHeight:420 }}>
                  <NIAIPanel
                    lineItems={lineItems}
                    patient={patient}
                    totals={totals}
                  />
                </div>

                {/* Leakage alerts */}
                <NILeakageAlerts
                  lineItems={lineItems}
                  patient={patient}
                />

                {/* Financial impact */}
                <NIFinancialImpact
                  lineItems={lineItems}
                  patient={patient}
                  totals={totals}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed panel reopen button */}
        {!hasRightContent && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            className="border-l border-slate-200 flex flex-col items-center py-4 px-1 bg-white shrink-0"
          >
            <button
              onClick={() => setAiPanelOpen(true)}
              title="Open AI panel"
              className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
            >
              <PanelRightOpen className="w-4 h-4" />
              <span className="text-[10px] font-semibold [writing-mode:vertical-rl] tracking-wider">AI + Insights</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Service Search Modal ────────────────────────────────────────────── */}
      <NIServiceSearch
        open={serviceSearchOpen}
        onClose={() => { setServiceSearchOpen(false); setTargetRowId(null); }}
        onSelect={handleServiceSelect}
        onSelectMultiple={handleMultipleServices}
      />
    </div>
  );
}
