// ─── Patient Invoices — Constants, Mock Data, KPI Config ──────────────────────
// Theme: Rose / Crimson  (#f43f5e primary, #e11d48 accent)

// ─── Formatters ───────────────────────────────────────────────────────────────
export function fmtINR(n) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)}L`;
  if (Math.abs(n) >= 1_000)       return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${Number(n).toFixed(0)}`;
}
export function fmtINRFull(n) {
  return '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
export function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function fmtDateTime(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
export function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
export function pick(arr) { return arr[rand(0, arr.length - 1)]; }

// ─── Invoice / Billing Status ─────────────────────────────────────────────────
export const INV_STATUSES = {
  DRAFT:           { label: 'Draft',            bg: 'bg-slate-100 dark:bg-slate-700',        text: 'text-slate-500 dark:text-slate-300'      },
  PROVISIONAL:     { label: 'Provisional',      bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400'        },
  FINALIZED:       { label: 'Finalized',        bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-700 dark:text-violet-400'    },
  PARTIALLY_PAID:  { label: 'Partial',          bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400'      },
  PAID:            { label: 'Paid',             bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400'  },
  OVERDUE:         { label: 'Overdue',          bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-400'          },
  CANCELLED:       { label: 'Cancelled',        bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-400 dark:text-slate-500'      },
  REFUNDED:        { label: 'Refunded',         bg: 'bg-rose-100 dark:bg-rose-900/30',       text: 'text-rose-700 dark:text-rose-400'        },
};

export const CLAIM_STATUSES = {
  NOT_APPLICABLE:      { label: 'N/A',             dot: 'bg-slate-300',    text: 'text-slate-400'                        },
  PRE_AUTH_PENDING:    { label: 'Pre-Auth Req.',    dot: 'bg-sky-500',      text: 'text-sky-600 dark:text-sky-400'        },
  PRE_AUTH_APPROVED:   { label: 'Pre-Auth Apvd.',  dot: 'bg-teal-500',     text: 'text-teal-700 dark:text-teal-400'      },
  PRE_AUTH_DENIED:     { label: 'Pre-Auth Den.',   dot: 'bg-red-500',      text: 'text-red-700 dark:text-red-400'        },
  SUBMITTED:           { label: 'Submitted',        dot: 'bg-blue-500',     text: 'text-blue-700 dark:text-blue-400'      },
  UNDER_REVIEW:        { label: 'Under Review',     dot: 'bg-violet-500',   text: 'text-violet-700 dark:text-violet-400'  },
  QUERY_RAISED:        { label: 'Query Raised',     dot: 'bg-amber-500',    text: 'text-amber-700 dark:text-amber-400'    },
  PARTIAL_SETTLEMENT:  { label: 'Part. Settled',   dot: 'bg-lime-500',     text: 'text-lime-700 dark:text-lime-400'      },
  SETTLED:             { label: 'Settled',          dot: 'bg-emerald-500',  text: 'text-emerald-700 dark:text-emerald-400'},
  REJECTED:            { label: 'Rejected',         dot: 'bg-rose-600',     text: 'text-rose-700 dark:text-rose-400'      },
  WRITTEN_OFF:         { label: 'Written Off',      dot: 'bg-slate-500',    text: 'text-slate-600 dark:text-slate-400'    },
};

export const RISK_LEVELS = {
  LOW:      { label: 'Low',      score: 1, color: '#10b981', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30', badgeText: 'text-emerald-700 dark:text-emerald-400' },
  MEDIUM:   { label: 'Medium',   score: 2, color: '#f59e0b', badgeBg: 'bg-amber-100 dark:bg-amber-900/30',    badgeText: 'text-amber-700 dark:text-amber-400'    },
  HIGH:     { label: 'High',     score: 3, color: '#ef4444', badgeBg: 'bg-red-100 dark:bg-red-900/30',        badgeText: 'text-red-700 dark:text-red-400'        },
  CRITICAL: { label: 'Critical', score: 4, color: '#e11d48', badgeBg: 'bg-rose-100 dark:bg-rose-900/30',      badgeText: 'text-rose-700 dark:text-rose-400'      },
};

export const BILL_TYPES = {
  OP:         { label: 'OP',          color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20',  text: 'text-indigo-700 dark:text-indigo-400'   },
  IP:         { label: 'IP',          color: '#0891b2', bg: 'bg-cyan-50 dark:bg-cyan-900/20',      text: 'text-cyan-700 dark:text-cyan-400'       },
  ICU:        { label: 'ICU',         color: '#dc2626', bg: 'bg-red-50 dark:bg-red-900/20',        text: 'text-red-700 dark:text-red-400'         },
  OT:         { label: 'OT',          color: '#7c3aed', bg: 'bg-violet-50 dark:bg-violet-900/20',  text: 'text-violet-700 dark:text-violet-400'   },
  PHARMACY:   { label: 'Pharmacy',    color: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-700 dark:text-emerald-400' },
  LAB:        { label: 'Lab',         color: '#0284c7', bg: 'bg-sky-50 dark:bg-sky-900/20',        text: 'text-sky-700 dark:text-sky-400'         },
  RADIOLOGY:  { label: 'Radiology',   color: '#d97706', bg: 'bg-amber-50 dark:bg-amber-900/20',    text: 'text-amber-700 dark:text-amber-400'     },
  PACKAGE:    { label: 'Package',     color: '#be185d', bg: 'bg-pink-50 dark:bg-pink-900/20',      text: 'text-pink-700 dark:text-pink-400'       },
  EMERGENCY:  { label: 'Emergency',   color: '#b91c1c', bg: 'bg-rose-50 dark:bg-rose-900/20',      text: 'text-rose-700 dark:text-rose-400'       },
  DAYCARE:    { label: 'Day Care',    color: '#7c3aed', bg: 'bg-purple-50 dark:bg-purple-900/20',  text: 'text-purple-700 dark:text-purple-400'   },
  CORPORATE:  { label: 'Corporate',   color: '#1d4ed8', bg: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-700 dark:text-blue-400'       },
  GOVT:       { label: 'Govt Scheme', color: '#15803d', bg: 'bg-green-50 dark:bg-green-900/20',    text: 'text-green-700 dark:text-green-400'     },
};

export const WORKFLOW_STATES = {
  DRAFT:              { label: 'Draft',              color: '#94a3b8' },
  PENDING_APPROVAL:   { label: 'Pending Approval',   color: '#f59e0b' },
  APPROVED:           { label: 'Approved',           color: '#10b981' },
  PARTIALLY_PAID:     { label: 'Partially Paid',     color: '#f97316' },
  INSURANCE_PENDING:  { label: 'Insurance Pending',  color: '#6366f1' },
  RECONCILED:         { label: 'Reconciled',         color: '#06b6d4' },
  CLOSED:             { label: 'Closed',             color: '#64748b' },
  REFUNDED:           { label: 'Refunded',           color: '#e11d48' },
  ESCALATED:          { label: 'Escalated',          color: '#dc2626' },
};

// ─── Reference lists ───────────────────────────────────────────────────────────
export const DEPARTMENTS  = ['Cardiology','Orthopedics','Neurology','ICU','OT','Pharmacy','Laboratory','Radiology','Emergency','Oncology','Nephrology','Gynecology','Pediatrics','Dermatology','Psychiatry'];
export const DOCTORS      = ['Dr. Mehta S.','Dr. Kapoor R.','Dr. Reddy A.','Dr. Pillai N.','Dr. Sharma P.','Dr. Iyer K.','Dr. Bose T.','Dr. Nair M.','Dr. Gupta V.','Dr. Singh A.'];
export const CASHIERS     = ['Rekha Sharma','Anil Patel','Sunita Menon','Praveen Kumar','Usha Reddy','Mohan Das'];
export const TPA_LIST     = ['Star Health','United IC','New India Assurance','ICICI Lombard','HDFC Ergo','Bajaj Allianz','Care Health','Niva Bupa','Reliance Health','ManipalCigna'];
export const BRANCHES     = ['Main Hospital','North Wing','South Campus','East Block','Specialty Centre','Maternity Block'];
export const WARDS        = ['General Ward','Semi-Private','Private','ICU','NICU','PICU','HDU','Isolation','Daycare','OT Complex'];

const PATIENT_NAMES = [
  'Ramesh Kumar M.','Priya Nair S.','Suresh Patel V.','Anita Sharma','Mohammed Yunus Ali',
  'Lakshmi Devi R.','Arjun Singh B.','Fatima Begum K.','Venkat Rao T.','Meera Thomas',
  'Rajesh Gupta H.','Sita Devi P.','Arun Menon J.','Deepa Krishnan','Vikram Shah D.',
  'Nalini Iyer','Surendra Nath B.','Kamala Devi','Ravi Shankar P.','Geeta Verma',
  'Harish Chandra','Bindu Nair','Prakash Kumar','Savitri Devi','Alok Mishra',
  'Radha Krishna T.','Sanjay Tiwari','Parvati Devi','Naresh Babu K.','Seema Reddy',
];
const UHID_BASE = 100_000;

function makeServices(billType) {
  const catalog = {
    OP:        [['Consultation Fee','OPD-001',1,800],['ECG','DIA-012',1,400],['Dressing','NRS-003',1,200]],
    IP:        [['Room Charges','RCH-001',3,1800],['Nursing Charges','NRS-001',3,600],['Consultant Visit','CON-001',2,1200],['Medicines','MED-001',1,3200]],
    ICU:       [['ICU Charges','ICU-001',5,8000],['Ventilator','ICU-002',3,4500],['Medicines','MED-ICU',1,12000],['Investigations','LAB-ICU',1,6500]],
    OT:        [['OT Charges','OT-001',1,18000],['Surgeon Fee','SRG-001',1,25000],['Anaesthesia','ANA-001',1,8000],['Consumables','OT-CNS',1,4500]],
    PHARMACY:  [['Antibiotics','MED-001',14,340],['Supplements','MED-002',30,120],['Injectables','MED-003',5,680]],
    LAB:       [['CBC','LAB-001',1,280],['Liver Function','LAB-002',1,650],['Lipid Profile','LAB-003',1,480],['HbA1c','LAB-004',1,420]],
    RADIOLOGY: [['X-Ray Chest','RAD-001',2,350],['Ultrasound','RAD-002',1,800],['CT Scan','RAD-003',1,4500]],
    PACKAGE:   [['Maternity Package','PKG-001',1,45000],['Post-Natal Care','PKG-002',1,12000]],
    EMERGENCY: [['Emergency Charges','EMR-001',1,2500],['Resuscitation','EMR-002',1,5000],['Medicines','MED-EMR',1,3800]],
    DAYCARE:   [['Day Care Charges','DCR-001',1,3500],['Procedure','PRO-001',1,8000],['Medicines','MED-DCR',1,1200]],
    CORPORATE: [['Consultation Fee','CRP-001',1,1200],['Health Check','CRP-002',1,3500]],
    GOVT:      [['Govt Scheme Charges','GVT-001',1,0],['Medicines','GVT-MED',1,0]],
  };
  const items = catalog[billType] ?? catalog.OP;
  return items.map(([name, code, qty, rate]) => ({
    name, code, qty, rate, amount: qty * rate,
    taxRate: billType === 'PHARMACY' ? 12 : 5,
    taxAmt:  Math.round(qty * rate * (billType === 'PHARMACY' ? 0.12 : 0.05)),
  }));
}

function makeInvoice(i) {
  const billType = pick(Object.keys(BILL_TYPES));
  const patient  = PATIENT_NAMES[i % PATIENT_NAMES.length];
  const tpa      = Math.random() < 0.45 ? pick(TPA_LIST) : null;
  const isCorporate = !tpa && Math.random() < 0.15;
  const services = makeServices(billType);
  const gross    = services.reduce((s, x) => s + x.amount, 0);
  const discPct  = rand(0, 12);
  const discAmt  = Math.round(gross * discPct / 100);
  const taxable  = gross - discAmt;
  const cgst     = Math.round(taxable * 0.025);
  const sgst     = Math.round(taxable * 0.025);
  const net      = taxable + cgst + sgst;
  const insShare = tpa ? Math.round(net * rand(55, 85) / 100) : 0;
  const patShare = net - insShare;
  const collected = Math.random() < 0.55
    ? (Math.random() < 0.7 ? patShare : Math.round(patShare * rand(40, 85) / 100))
    : 0;
  const outstanding = net - (tpa ? 0 : collected);
  const days = rand(0, 365);
  const invDate = new Date(Date.now() - days * 86_400_000);
  const statusKeys = Object.keys(INV_STATUSES);
  const status = collected >= net ? 'PAID'
    : collected > 0 ? 'PARTIALLY_PAID'
    : days > 45 ? 'OVERDUE'
    : days > 5 ? 'FINALIZED'
    : 'PROVISIONAL';
  const claimStatus = tpa
    ? pick(['SUBMITTED','UNDER_REVIEW','SETTLED','PARTIAL_SETTLEMENT','REJECTED','QUERY_RAISED','PRE_AUTH_APPROVED'])
    : 'NOT_APPLICABLE';
  const riskLevel = days > 60 && outstanding > 20_000 ? 'HIGH'
    : days > 30 && outstanding > 10_000 ? 'MEDIUM'
    : 'LOW';
  const wfState = status === 'PAID' ? 'CLOSED'
    : tpa ? 'INSURANCE_PENDING'
    : status === 'OVERDUE' ? 'ESCALATED'
    : 'APPROVED';

  return {
    id:            `pi-${String(i + 1).padStart(5, '0')}`,
    invoiceNo:     `INV-2026-${String(i + 1).padStart(6, '0')}`,
    patientName:   patient,
    uhid:          `HC-${String(UHID_BASE + i + 1)}`,
    mobile:        `+91 ${rand(70000, 99999)}${rand(10000, 99999)}`,
    age:           rand(2, 82),
    gender:        pick(['Male','Female','Other']),
    branch:        pick(BRANCHES),
    department:    pick(DEPARTMENTS),
    doctor:        pick(DOCTORS),
    ward:          pick(WARDS),
    admissionDate: billType === 'IP' || billType === 'ICU' ? fmtDate(new Date(invDate.getTime() - rand(1, 10) * 86_400_000)) : null,
    dischargeDate: billType === 'IP' || billType === 'ICU' ? fmtDate(invDate) : null,
    billType,
    invoiceDate:   invDate.toISOString(),
    dueDate:       new Date(invDate.getTime() + 30 * 86_400_000).toISOString(),
    status,
    claimStatus,
    workflowState: wfState,
    riskLevel,
    isInsurance:   !!tpa,
    isCorporate,
    tpa:           tpa ?? null,
    policyNo:      tpa ? `POL-${rand(100000, 999999)}` : null,
    insurer:       tpa ? pick(['Star Health','National Insurance','Oriental Insurance','New India Assurance']) : null,
    services,
    gross,
    discAmt,
    discPct,
    taxable,
    cgst,
    sgst,
    net,
    insShare,
    patShare,
    collected,
    outstanding: Math.max(0, net - collected - (claimStatus === 'SETTLED' ? insShare : 0)),
    cashier:    pick(CASHIERS),
    glPosted:   status !== 'DRAFT' && status !== 'PROVISIONAL',
    jvNo:       status !== 'DRAFT' ? `JV-2026-${String(rand(1000, 9999))}` : null,
    arEntry:    status !== 'DRAFT' ? `AR-${String(rand(10000, 99999))}` : null,
    leakage:    Math.random() < 0.2,
    leakageAmt: Math.random() < 0.2 ? rand(500, 8000) : 0,
    notes:      '',
    tags:       [],
    payments: collected > 0 ? [
      {
        id: `PMT-${rand(10000,99999)}`,
        date: fmtDateTime(new Date(invDate.getTime() + rand(0, 3) * 86_400_000)),
        amount: collected,
        mode: pick(['Cash','UPI','Card','NEFT','RTGS','Cheque']),
        ref: `TXN${rand(10000000, 99999999)}`,
        cashier: pick(CASHIERS),
        status: 'COMPLETED',
      }
    ] : [],
    auditTrail: [
      { time: fmtDateTime(invDate), action: 'Invoice Created', user: pick(CASHIERS), note: 'Invoice generated from billing system' },
      ...(status !== 'DRAFT' ? [{ time: fmtDateTime(new Date(invDate.getTime() + 600_000)), action: 'Invoice Finalized', user: pick(CASHIERS), note: 'GL posted — JV generated' }] : []),
      ...(tpa ? [{ time: fmtDateTime(new Date(invDate.getTime() + 1_800_000)), action: 'Claim Submitted', user: pick(CASHIERS), note: `Submitted to ${tpa}` }] : []),
      ...(collected > 0 ? [{ time: fmtDateTime(new Date(invDate.getTime() + 2_400_000)), action: 'Payment Received', user: pick(CASHIERS), note: `Received ₹${collected.toLocaleString('en-IN')}` }] : []),
    ],
  };
}

export const MOCK_INVOICES = Array.from({ length: 50 }, (_, i) => makeInvoice(i));

// ─── KPI Configuration ────────────────────────────────────────────────────────
export const PI_KPI_CONFIG = [
  { key: 'totalInvoiceValue',  label: 'Total Invoice Value',    icon: 'IndianRupee',   format: 'currency', accent: '#f43f5e', trend: +14.2 },
  { key: 'totalCollections',   label: 'Total Collections',      icon: 'TrendingUp',    format: 'currency', accent: '#10b981', trend: +9.7  },
  { key: 'outstanding',        label: 'Outstanding Receivables',icon: 'Clock',         format: 'currency', accent: '#f59e0b', trend: -4.3  },
  { key: 'insurancePending',   label: 'Insurance Pending',      icon: 'Shield',        format: 'currency', accent: '#6366f1', trend: -2.1  },
  { key: 'overdueInvoices',    label: 'Overdue Invoices',       icon: 'AlertTriangle', format: 'count',    accent: '#ef4444', trend: null, alert: true },
  { key: 'pendingRefunds',     label: 'Pending Refunds',        icon: 'RefreshCcw',    format: 'currency', accent: '#8b5cf6', trend: null  },
  { key: 'avgCollectionDays',  label: 'Avg Collection Days',    icon: 'Calendar',      format: 'days',     accent: '#06b6d4', trend: -1.8  },
  { key: 'leakageAlerts',      label: 'Leakage Alerts',         icon: 'AlertOctagon',  format: 'count',    accent: '#e11d48', trend: null, alert: true },
  { key: 'claimDenialRisk',    label: 'Denial Risk Claims',     icon: 'ShieldOff',     format: 'count',    accent: '#dc2626', trend: null, alert: true },
  { key: 'highRiskInvoices',   label: 'High-Risk Invoices',     icon: 'Activity',      format: 'count',    accent: '#7c3aed', trend: null  },
];

export const MOCK_KPI_VALUES = {
  totalInvoiceValue: MOCK_INVOICES.reduce((s, x) => s + x.net, 0),
  totalCollections:  MOCK_INVOICES.reduce((s, x) => s + x.collected, 0),
  outstanding:       MOCK_INVOICES.reduce((s, x) => s + x.outstanding, 0),
  insurancePending:  MOCK_INVOICES.filter(x => x.isInsurance && x.claimStatus !== 'SETTLED').reduce((s, x) => s + x.insShare, 0),
  overdueInvoices:   MOCK_INVOICES.filter(x => x.status === 'OVERDUE').length,
  pendingRefunds:    rand(1_20_000, 4_80_000),
  avgCollectionDays: rand(14, 38),
  leakageAlerts:     MOCK_INVOICES.filter(x => x.leakage).length,
  claimDenialRisk:   MOCK_INVOICES.filter(x => x.claimStatus === 'REJECTED' || x.claimStatus === 'QUERY_RAISED').length,
  highRiskInvoices:  MOCK_INVOICES.filter(x => x.riskLevel === 'HIGH').length,
};

// ─── Activity Feed ─────────────────────────────────────────────────────────────
export const ACTIVITY_TYPES = {
  INVOICE_CREATED:    { label: 'Invoice Created',    icon: 'FilePlus',     color: '#6366f1', bg: 'bg-indigo-500/10' },
  PAYMENT_RECEIVED:   { label: 'Payment Received',   icon: 'IndianRupee',  color: '#10b981', bg: 'bg-emerald-500/10' },
  CLAIM_SUBMITTED:    { label: 'Claim Submitted',    icon: 'Send',         color: '#0284c7', bg: 'bg-sky-500/10' },
  CLAIM_DENIED:       { label: 'Claim Denied',       icon: 'XCircle',      color: '#ef4444', bg: 'bg-red-500/10' },
  CLAIM_SETTLED:      { label: 'Claim Settled',      icon: 'CheckCircle2', color: '#10b981', bg: 'bg-emerald-500/10' },
  REFUND_PROCESSED:   { label: 'Refund Processed',   icon: 'RefreshCcw',   color: '#8b5cf6', bg: 'bg-violet-500/10' },
  INVOICE_ADJUSTED:   { label: 'Invoice Adjusted',   icon: 'Edit3',        color: '#f59e0b', bg: 'bg-amber-500/10' },
  WF_ESCALATION:      { label: 'Escalation',         icon: 'AlertCircle',  color: '#dc2626', bg: 'bg-red-500/10' },
  LEAKAGE_DETECTED:   { label: 'Leakage Detected',   icon: 'Zap',          color: '#e11d48', bg: 'bg-rose-500/10' },
  GL_POSTED:          { label: 'GL Posted',           icon: 'BookOpen',     color: '#06b6d4', bg: 'bg-cyan-500/10' },
};

export const MOCK_ACTIVITY = [
  { id:'a1', type:'PAYMENT_RECEIVED',  patient:'Ramesh Kumar M.',  invoiceNo:'INV-2026-000012', amount:24500,  dept:'Cardiology',  ts: Date.now() - 120_000  },
  { id:'a2', type:'CLAIM_SUBMITTED',   patient:'Priya Nair S.',    invoiceNo:'INV-2026-000008', amount:85000,  dept:'ICU',         ts: Date.now() - 340_000  },
  { id:'a3', type:'INVOICE_CREATED',   patient:'Vikram Shah D.',   invoiceNo:'INV-2026-000051', amount:4800,   dept:'Pharmacy',    ts: Date.now() - 600_000  },
  { id:'a4', type:'CLAIM_DENIED',      patient:'Anita Sharma',     invoiceNo:'INV-2026-000031', amount:45000,  dept:'OT',          ts: Date.now() - 900_000  },
  { id:'a5', type:'REFUND_PROCESSED',  patient:'Suresh Patel V.',  invoiceNo:'INV-2026-000019', amount:8200,   dept:'Laboratory',  ts: Date.now() - 1_200_000 },
  { id:'a6', type:'WF_ESCALATION',     patient:'Fatima Begum K.',  invoiceNo:'INV-2026-000022', amount:68000,  dept:'Neurology',   ts: Date.now() - 1_800_000 },
  { id:'a7', type:'GL_POSTED',         patient:'Meera Thomas',     invoiceNo:'INV-2026-000015', amount:12400,  dept:'OP',          ts: Date.now() - 2_400_000 },
  { id:'a8', type:'CLAIM_SETTLED',     patient:'Mohammed Yunus',   invoiceNo:'INV-2026-000007', amount:110000, dept:'IP',          ts: Date.now() - 3_600_000 },
  { id:'a9', type:'INVOICE_ADJUSTED',  patient:'Arjun Singh B.',   invoiceNo:'INV-2026-000041', amount:32000,  dept:'Radiology',   ts: Date.now() - 5_400_000 },
  { id:'a10',type:'LEAKAGE_DETECTED',  patient:'Venkat Rao T.',    invoiceNo:'INV-2026-000028', amount:5500,   dept:'OT',          ts: Date.now() - 7_200_000 },
];

// ─── Insurance / TPA Panel ─────────────────────────────────────────────────────
export const TPA_AGING_DATA = [
  { tpa:'Star Health',           count:12, total:4_82_000, '0-30':1_20_000, '31-60':1_80_000, '61-90':1_02_000, '90+':80_000 },
  { tpa:'ICICI Lombard',         count:8,  total:3_14_000, '0-30':1_40_000, '31-60':80_000,  '61-90':60_000,  '90+':34_000 },
  { tpa:'New India Assurance',   count:6,  total:2_68_000, '0-30':80_000,  '31-60':1_10_000,'61-90':50_000,  '90+':28_000 },
  { tpa:'HDFC Ergo',             count:5,  total:1_92_000, '0-30':90_000,  '31-60':60_000,  '61-90':30_000,  '90+':12_000 },
  { tpa:'United IC',             count:4,  total:1_45_000, '0-30':70_000,  '31-60':45_000,  '61-90':20_000,  '90+':10_000 },
  { tpa:'Bajaj Allianz',         count:3,  total:98_000,   '0-30':55_000,  '31-60':28_000,  '61-90':10_000,  '90+':5_000  },
];

export const CLAIM_LIFECYCLE = [
  { stage:'Draft',           count:4,  amount:82_000   },
  { stage:'Pre-Auth',        count:8,  amount:2_40_000  },
  { stage:'Submitted',       count:15, amount:5_80_000  },
  { stage:'Under Review',    count:11, amount:4_20_000  },
  { stage:'Query Raised',    count:5,  amount:1_90_000  },
  { stage:'Partial Settled', count:3,  amount:1_10_000  },
  { stage:'Settled',         count:28, amount:9_80_000  },
];

// ─── Revenue Leakage ──────────────────────────────────────────────────────────
export const LEAKAGE_CATEGORIES = [
  { id:'lk1', category:'Unbilled Consumables',     count:8,  impact:42_000,  severity:'HIGH',   dept:'OT',          example:'OT sponges, sutures not billed in 4 invoices' },
  { id:'lk2', category:'Delayed Billing',          count:14, impact:78_000,  severity:'HIGH',   dept:'ICU',         example:'ICU stay billed 3 days after discharge' },
  { id:'lk3', category:'Unauthorized Discounts',   count:6,  impact:35_000,  severity:'MEDIUM', dept:'OPD',         example:'Discounts >15% without approval on 6 invoices' },
  { id:'lk4', category:'Package Leakage',          count:3,  impact:25_000,  severity:'MEDIUM', dept:'Maternity',   example:'Out-of-package items not billed separately' },
  { id:'lk5', category:'Insurance Non-Payables',   count:11, impact:62_000,  severity:'HIGH',   dept:'IP',          example:'Charges excluded from TPA policy billed to insurance' },
  { id:'lk6', category:'Missing Lab Charges',      count:9,  impact:18_000,  severity:'LOW',    dept:'Laboratory',  example:'Collection charges not added to lab invoices' },
  { id:'lk7', category:'Duplicate Refund Risk',    count:2,  impact:12_000,  severity:'MEDIUM', dept:'OP',          example:'Refund requested twice for same invoice' },
  { id:'lk8', category:'Pharmacy Under-billing',   count:17, impact:28_000,  severity:'LOW',    dept:'Pharmacy',    example:'Medicines dispensed but not billed in 17 OP invoices' },
];

// ─── AI Intelligence ───────────────────────────────────────────────────────────
export const AI_INSIGHTS = [
  { id:'ai1', severity:'critical', title:'₹1.23L Revenue at Risk — 3 ICU Claims Overdue 90+ Days', detail:'Claims from ICICI Lombard, New India & Star Health exceeding 90-day threshold. Immediate resubmission recommended with supporting documents.', action:'View Claims' },
  { id:'ai2', severity:'critical', title:'8 Invoices with Missing OT Consumable Charges Detected', detail:'AI identified unbilled consumables in 8 OT invoices totalling ₹42,000. Cross-referenced with OT notes and pharmacy dispense records.', action:'Fix Now' },
  { id:'ai3', severity:'warning',  title:'6 Unauthorized Discounts Detected (>15% threshold)', detail:'Cashier-level discounts exceeding approval threshold found in OPD billing. Finance manager approval required to avoid audit risk.', action:'Review Discounts' },
  { id:'ai4', severity:'warning',  title:'Predicted: 4 Star Health Claims Likely to be Denied', detail:'Based on claim history and diagnosis-procedure mismatch analysis, 4 submitted claims show high denial probability. Pre-emptive correction suggested.', action:'Review Claims' },
  { id:'ai5', severity:'info',     title:'Collection Forecast: ₹18.4L Expected This Week', detail:'Based on payment patterns, outstanding aged invoices, and insurance settlement schedules. Cash collections projected to be 12% higher than last week.', action:'View Forecast' },
];

export const AI_MESSAGES_INIT = [
  { role:'assistant', text:"Hello! I'm your AI Revenue Intelligence assistant. I've analyzed today's billing data and found 3 critical issues and 5 optimization opportunities. How can I help you?", ts: Date.now() - 10_000 },
];

export const AI_PROMPTS = [
  'Find potential revenue leakage',
  'Show invoices likely to be denied',
  'Identify high-risk outstanding invoices',
  'Forecast next week\'s collections',
  'Show ICU invoices with missing charges',
  'Which TPA has highest overdue?',
  'Detect unusual discounts today',
  'Show all escalated workflows',
];

export const COLLECTION_TREND = [
  { month:'Dec', collected:14.2, invoiced:18.6, outstanding:4.4 },
  { month:'Jan', collected:16.8, invoiced:21.2, outstanding:4.4 },
  { month:'Feb', collected:13.5, invoiced:17.8, outstanding:4.3 },
  { month:'Mar', collected:19.2, invoiced:24.5, outstanding:5.3 },
  { month:'Apr', collected:22.1, invoiced:27.8, outstanding:5.7 },
  { month:'May', collected:18.4, invoiced:23.6, outstanding:5.2 },
];

// ─── Analytics charts ─────────────────────────────────────────────────────────
export const DEPT_REVENUE = [
  { dept:'Cardiology', revenue:18.4, outstanding:3.2 },
  { dept:'Orthopedics',revenue:14.8, outstanding:2.8 },
  { dept:'ICU',        revenue:28.2, outstanding:8.4 },
  { dept:'OT',         revenue:32.6, outstanding:6.2 },
  { dept:'Pharmacy',   revenue:9.4,  outstanding:0.8 },
  { dept:'Lab',        revenue:6.2,  outstanding:0.4 },
  { dept:'Radiology',  revenue:8.8,  outstanding:1.6 },
];

export const PAYMENT_MODES = [
  { name:'Cash',   value:28, color:'#10b981' },
  { name:'UPI',    value:35, color:'#6366f1' },
  { name:'Card',   value:18, color:'#0284c7' },
  { name:'NEFT',   value:12, color:'#f59e0b' },
  { name:'RTGS',   value:7,  color:'#e11d48' },
];

// ─── Drawer tabs ───────────────────────────────────────────────────────────────
export const DRAWER_TABS = [
  { id:'overview',   label:'Overview',    icon:'LayoutDashboard' },
  { id:'services',   label:'Services',    icon:'List'            },
  { id:'financial',  label:'Financial',   icon:'BookOpen'        },
  { id:'insurance',  label:'Insurance',   icon:'Shield'          },
  { id:'payments',   label:'Payments',    icon:'IndianRupee'     },
  { id:'workflow',   label:'Workflow',    icon:'GitBranch'       },
  { id:'audit',      label:'Audit',       icon:'FileSearch'      },
  { id:'gl',         label:'GL Journals', icon:'Landmark'        },
];
