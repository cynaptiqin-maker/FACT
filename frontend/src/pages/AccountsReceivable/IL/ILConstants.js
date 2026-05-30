// ─── Invoice List Constants & Mock Data ──────────────────────────────────────

export const INVOICE_TYPES = {
  SI:  { label: 'Sales Invoice',    short: 'SI',  color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30',      text: 'text-blue-700 dark:text-blue-400'       },
  PI:  { label: 'Purchase Invoice', short: 'PI',  color: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-900/30',  text: 'text-violet-700 dark:text-violet-400'   },
  CN:  { label: 'Credit Note',      short: 'CN',  color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-400'         },
  DN:  { label: 'Debit Note',       short: 'DN',  color: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30',  text: 'text-orange-700 dark:text-orange-400'   },
  PRO: { label: 'Proforma',         short: 'PRO', color: '#64748b', bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-600 dark:text-slate-400'     },
  ADV: { label: 'Advance Receipt',  short: 'ADV', color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-400' },
};

export const PAYMENT_STATUSES = {
  PAID:      { label: 'Paid',           bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: '#10b981' },
  PARTIAL:   { label: 'Partial',        bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400',       dot: '#3b82f6' },
  PENDING:   { label: 'Pending',        bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400',     dot: '#f59e0b' },
  OVERDUE:   { label: 'Overdue',        bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-400',         dot: '#ef4444' },
  DRAFT:     { label: 'Draft',          bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-600 dark:text-slate-400',     dot: '#94a3b8' },
  CANCELLED: { label: 'Cancelled',      bg: 'bg-gray-100 dark:bg-gray-800',          text: 'text-gray-500 dark:text-gray-400',       dot: '#9ca3af' },
};

export const GST_RATES    = [0, 5, 12, 18, 28];
export const CURRENCIES   = ['INR', 'USD', 'EUR', 'GBP', 'AED'];
export const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'NEFT', 'RTGS', 'Cheque', 'UPI', 'Online Portal', 'Insurance'];

export const BRANCHES    = ['All Branches', 'Main Campus', 'North Wing', 'South Clinic', 'East Block', 'Specialty Center', 'Cardiac Care'];
export const DEPARTMENTS = ['All Departments', 'Cardiology', 'ICU', 'OT', 'Pharmacy', 'Radiology', 'Pathology', 'Nephrology', 'General Surgery', 'Oncology', 'Administration', 'Emergency', 'Pediatrics'];
export const SALESPERSONS = ['All', 'Priya Sharma', 'Rahul Mehta', 'Ananya Iyer', 'Suresh Nair', 'Deepa Rao', 'Kiran Pillai', 'System'];

export const QUICK_FILTERS = [
  { id: 'all',       label: 'All Invoices' },
  { id: 'paid',      label: 'Paid'         },
  { id: 'pending',   label: 'Pending'      },
  { id: 'overdue',   label: 'Overdue'      },
  { id: 'draft',     label: 'Draft'        },
  { id: 'cancelled', label: 'Cancelled'    },
  { id: 'gst',       label: 'GST Invoices' },
  { id: 'credit',    label: 'Credit Notes' },
  { id: 'purchase',  label: 'Purchase'     },
];

// ─── KPI Configuration ───────────────────────────────────────────────────────
export const IL_KPI_CONFIG = [
  { id: 'total',        label: 'Total Invoices',      value: 2847,      format: 'num',   trend: +12.4, trendLabel: 'vs last month', color: '#3b82f6', icon: 'FileText',      aiFlag: false },
  { id: 'totalValue',   label: 'Invoice Value',       value: 184200000, format: 'crore', trend: +8.2,  trendLabel: 'vs last month', color: '#8b5cf6', icon: 'IndianRupee',   aiFlag: false },
  { id: 'paid',         label: 'Paid',                value: 1842,      format: 'num',   trend: +6.1,  trendLabel: 'vs last month', color: '#10b981', icon: 'CheckCircle2',  aiFlag: false },
  { id: 'paidValue',    label: 'Amount Collected',    value: 124800000, format: 'crore', trend: +4.8,  trendLabel: 'vs last month', color: '#10b981', icon: 'TrendingUp',    aiFlag: false },
  { id: 'overdue',      label: 'Overdue',             value: 287,       format: 'num',   trend: +18.3, trendLabel: 'vs last month', color: '#ef4444', icon: 'AlertTriangle', aiFlag: true  },
  { id: 'overdueValue', label: 'Overdue Amount',      value: 34200000,  format: 'crore', trend: +14.7, trendLabel: 'vs last month', color: '#ef4444', icon: 'AlertOctagon',  aiFlag: true  },
  { id: 'draft',        label: 'Draft',               value: 134,       format: 'num',   trend: -5.2,  trendLabel: 'vs last month', color: '#64748b', icon: 'FilePen',       aiFlag: false },
  { id: 'pending',      label: 'Pending',             value: 423,       format: 'num',   trend: +3.1,  trendLabel: 'vs last month', color: '#f59e0b', icon: 'Clock',         aiFlag: false },
  { id: 'gstLiability', label: 'GST Liability',       value: 22104000,  format: 'crore', trend: +7.9,  trendLabel: 'vs last month', color: '#06b6d4', icon: 'Receipt',       aiFlag: false },
  { id: 'collection',   label: 'Collection Rate',     value: 67.8,      format: 'pct',   trend: -2.4,  trendLabel: 'vs last month', color: '#f59e0b', icon: 'Percent',       aiFlag: true  },
];

// ─── Mock Data Builder ───────────────────────────────────────────────────────
const mkItems = (items) =>
  items.map((it, i) => ({
    id: `item-${i + 1}`,
    description: it[0], hsn: it[1],
    qty: it[2], unit: it[3], unitPrice: it[4],
    discount: it[5] || 0, taxRate: it[6],
    taxAmt: Math.round(((it[4] * it[2]) * (1 - (it[5] || 0) / 100)) * (it[6] / 100)),
    total:  Math.round(it[4] * it[2] * (1 - (it[5] || 0) / 100)),
  }));

const mkInv = (id, no, date, dueDate, type, customer, gstin, branch, dept, salesperson, currency, items, payStatus, payments, notes) => {
  const subtotal  = items.reduce((s, i) => s + i.total, 0);
  const taxTotal  = items.reduce((s, i) => s + i.taxAmt, 0);
  const total     = subtotal + taxTotal;
  const paid      = payments.reduce((s, p) => s + (p.amount > 0 ? p.amount : 0), 0);
  return {
    id, invoiceNo: no, invoiceDate: date, dueDate, type,
    customer, gstin, branch, department: dept, salesperson, currency,
    lineItems: items, subtotal, taxTotal, total,
    paidAmount: paid, balanceDue: total - paid,
    paymentStatus: payStatus, payments, notes,
    createdBy: salesperson, createdAt: `${date}T09:00:00Z`, modifiedAt: `${date}T11:30:00Z`,
    gstType: (branch === 'East Block' && currency === 'INR') ? 'IGST' : 'CGST+SGST',
    auditTrail: [
      { action: 'Created',            by: salesperson,    ts: `${date}T09:00:00Z`, type: 'CREATE'  },
      ...(payStatus !== 'DRAFT'  ? [{ action: 'Sent to Customer', by: salesperson,    ts: `${date}T09:30:00Z`, type: 'SEND'    }] : []),
      ...(paid > 0               ? [{ action: 'Payment Received', by: 'Finance Team', ts: `${date}T14:00:00Z`, type: 'PAYMENT' }] : []),
      ...(payStatus === 'OVERDUE'? [{ action: 'Overdue Flag Set',  by: 'System',       ts: `${dueDate}T00:01:00Z`, type: 'ALERT'   }] : []),
    ],
    attachments: payStatus === 'PAID' ? [{ name: 'payment_receipt.pdf', size: '84 KB', uploadedBy: 'Finance', date }] : [],
  };
};

// ─── 25 Mock Invoices ────────────────────────────────────────────────────────
export const MOCK_INVOICES = [
  mkInv('inv-001','INV-2026-00921','2026-05-12','2026-05-27','SI',
    { name:'Rajesh Kumar Sharma', id:'HC-004231', phone:'9876543210', email:'rajesh@email.com' },
    'N/A','Main Campus','Cardiology','Priya Sharma','INR',
    mkItems([
      ['Angioplasty Procedure','99213',1,'Procedure',185000,0,18],
      ['Stent (Drug Eluting)','90110',2,'Nos',45000,0,12],
      ['ICU Stay – 2 Days','S01.1',2,'Day',8500,0,5],
      ['Medicines & Consumables','B05XA',1,'Kit',12400,5,12],
    ]),
    'PARTIAL',
    [{ date:'2026-05-12', mode:'Cash',  ref:'RCPT-0042', amount:100000, bank:'Reception Counter', note:'Initial deposit on admission' }],
    'Balance due after insurance settlement'
  ),
  mkInv('inv-002','INV-2026-00918','2026-05-10','2026-05-25','SI',
    { name:'Infosys Employee Health Program', id:'CORP-0091', phone:'8030001234', email:'corp@infosys.com' },
    '29AABCI1234A1ZP','Specialty Center','General Surgery','Ananya Iyer','INR',
    mkItems([
      ['Laparoscopic Cholecystectomy','S80.1',1,'Procedure',120000,10,18],
      ['Anesthesia Charges','B40.0',1,'Procedure',18000,0,18],
      ['Post-Op ICU – 1 Day','S01.1',1,'Day',8500,0,5],
      ['Consumables Package','B05XA',1,'Kit',8200,0,12],
    ]),
    'PENDING',[],
    'Corporate invoice – NET 30 payment terms'
  ),
  mkInv('inv-003','INV-2026-00914','2026-05-08','2026-05-23','PI',
    { name:'MedTech India Pvt Ltd', id:'VEND-0028', phone:'2240001111', email:'ap@medtech.in' },
    '27AABCM1234B1ZK','Main Campus','Administration','Suresh Nair','INR',
    mkItems([
      ['Surgical Gloves (Sterile) – 500 pairs','4015.19',500,'Pairs',180,0,18],
      ['Disposable Syringes 5ml – 1000 pcs','9018.31',1000,'Nos',12,5,12],
      ['IV Cannula 18G – 200 pcs','9018.39',200,'Nos',45,0,12],
      ['Suture Kit (Assorted) – 50 sets','3006.10',50,'Sets',220,0,12],
    ]),
    'PAID',
    [{ date:'2026-05-11', mode:'NEFT', ref:'NEFT2026051188', amount:281940, bank:'HDFC Bank – Ops Account', note:'Full settlement' }],
    'Purchase invoice – verified and approved'
  ),
  mkInv('inv-004','INV-2026-00909','2026-05-05','2026-05-20','SI',
    { name:'APSRTC Employee Health Scheme', id:'GOVT-0014', phone:'4023001111', email:'health@apsrtc.gov.in' },
    '36AAAAG1234C1ZL','Main Campus','Cardiology','Rahul Mehta','INR',
    mkItems([
      ['Echocardiography','93306',3,'Procedure',4500,0,18],
      ['Treadmill Test (TMT)','93015',2,'Procedure',3200,0,18],
      ['Holter Monitoring – 48hr','93228',1,'Procedure',6800,0,18],
      ['Consultation – Cardiologist','99213',5,'Visit',1500,0,18],
    ]),
    'PENDING',[],
    'Government scheme invoice – SLA 45 days'
  ),
  mkInv('inv-005','INV-2026-00902','2026-05-01','2026-05-16','SI',
    { name:'Kavitha Nair', id:'HC-004400', phone:'9845001234', email:'kavitha@email.com' },
    'N/A','North Wing','Pediatrics','Kiran Pillai','INR',
    mkItems([
      ['Pediatric Consultation','99212',2,'Visit',1200,0,18],
      ['Vaccination Package (6 vaccines)','90471',1,'Package',8400,0,5],
      ['CBC + Urine Routine','85025',1,'Panel',840,0,12],
    ]),
    'PAID',
    [{ date:'2026-05-02', mode:'UPI', ref:'UPI202605020001', amount:13186, bank:'Razorpay UPI', note:'Settled at counter' }],
    'Routine pediatric checkup'
  ),
  mkInv('inv-006','INV-2026-00895','2026-04-28','2026-05-13','CN',
    { name:'Arjun Reddy', id:'HC-004195', phone:'9900001234', email:'arjun@email.com' },
    'N/A','Cardiac Care','OT','Priya Sharma','INR',
    mkItems([
      ['OT Charge Reversal','S80.1',1,'Credit',-15000,0,18],
      ['Anesthesia Reversal','B40.0',1,'Credit',-4000,0,18],
    ]),
    'PAID',
    [{ date:'2026-04-28', mode:'Bank Transfer', ref:'REV-0041', amount:19000, bank:'HDFC – Patient Refund', note:'Adjusted against original invoice' }],
    'Credit note for billing correction on INV-2026-00841'
  ),
  mkInv('inv-007','INV-2026-00888','2026-04-25','2026-05-25','SI',
    { name:'Wipro Technologies', id:'CORP-0105', phone:'8040001234', email:'billing@wipro.com' },
    '29AABCW1234D1ZX','Specialty Center','General Surgery','Ananya Iyer','INR',
    mkItems([
      ['Annual Corporate Health Check – 50 employees','99213',50,'Package',2800,5,18],
      ['Additional Lab Tests (opted)','85027',18,'Panel',1200,0,12],
      ['Physiotherapy Sessions','97001',12,'Session',800,0,18],
    ]),
    'DRAFT',[],
    'Quarterly corporate billing – pending approval'
  ),
  mkInv('inv-008','INV-2026-00881','2026-04-22','2026-05-07','PI',
    { name:'SRL Diagnostics', id:'VEND-0041', phone:'2240009876', email:'accounts@srl.in' },
    '27AABCS1234E1ZM','Main Campus','Pathology','Suresh Nair','INR',
    mkItems([
      ['PCR Machine Consumables – Monthly Kit','3821.00',1,'Kit',84000,0,18],
      ['Reagent Set A – ELISA Panel','3002.10',5,'Pack',12400,0,18],
      ['Calibration Standards Set','3002.90',2,'Set',8200,0,18],
    ]),
    'OVERDUE',[],
    'Payment overdue since 07 May 2026 – escalated to AP team'
  ),
  mkInv('inv-009','INV-2026-00874','2026-04-18','2026-05-03','SI',
    { name:'Mohammed Irfan', id:'HC-003601', phone:'9900009876', email:'irfan@email.com' },
    'N/A','Main Campus','Emergency','Deepa Rao','INR',
    mkItems([
      ['Emergency Admission & Stabilisation','S09.0',1,'Episode',22000,0,18],
      ['ICU – 1 Night','S01.1',1,'Day',8500,0,5],
      ['CT Scan – Brain','70553',1,'Scan',7200,0,18],
      ['Blood Products – 2 Units','P50.1',2,'Unit',4500,0,0],
    ]),
    'OVERDUE',[],
    'Patient uncontactable – case referred to legal team'
  ),
  mkInv('inv-010','INV-2026-00867','2026-04-15','2026-04-30','SI',
    { name:'HDFC Ergo Health Insurance', id:'INS-0019', phone:'1800001234', email:'claims@hdfcergo.com' },
    '27AABCH1234F1ZN','North Wing','Oncology','Rahul Mehta','INR',
    mkItems([
      ['Chemotherapy Cycle 3 – FOLFOX','99600',1,'Cycle',145000,0,18],
      ['Anti-emetic Medication Kit','A09AA',1,'Kit',8400,0,12],
      ['Oncology Consultation','99213',2,'Visit',2500,0,18],
      ['PET CT Scan – Full Body','78816',1,'Scan',42000,0,18],
    ]),
    'PAID',
    [{ date:'2026-05-08', mode:'RTGS', ref:'RTGS20260508INS', amount:235820, bank:'Axis Bank – Insurance Pool', note:'Full claim settlement' }],
    'Insurance claim INS-2026-HDFC-4412 settled'
  ),
  mkInv('inv-011','INV-2026-00860','2026-04-12','2026-04-27','PI',
    { name:'Biotronic GmbH', id:'VEND-0062', phone:'+4989001234', email:'billing@biotronic.de' },
    '27AABCB1234G1ZO','Main Campus','Cardiology','Suresh Nair','EUR',
    mkItems([
      ['Cardiac Pacemaker – Edora 8 DR-T','9021.10',2,'Nos',42000,0,0],
      ['Lead Set (Bipolar)','9021.90',2,'Set',8400,0,0],
      ['Programmer Device Rental – 6 months','8543.70',1,'Period',3200,0,0],
    ]),
    'PARTIAL',
    [{ date:'2026-04-20', mode:'NEFT', ref:'SWIFT20260420BIO', amount:50000, bank:'SBI – Import Account', note:'50% advance against PO' }],
    'Import invoice – customs cleared, balance on delivery'
  ),
  mkInv('inv-012','INV-2026-00851','2026-04-08','2026-04-23','SI',
    { name:'Tata Consultancy Services', id:'CORP-0087', phone:'2240005678', email:'corporate@tcs.com' },
    '27AABCT1234H1ZP','Specialty Center','Radiology','Ananya Iyer','INR',
    mkItems([
      ['MRI Brain with Contrast','70553',8,'Scan',12000,10,18],
      ['MRI Spine – Lumbar','72148',5,'Scan',9800,10,18],
      ['CT Abdomen','74178',6,'Scan',7400,10,18],
      ['X-Ray – Chest PA','71046',20,'Study',650,0,18],
    ]),
    'PARTIAL',
    [{ date:'2026-05-01', mode:'Bank Transfer', ref:'TCS-PAY-0441', amount:190000, bank:'HDFC – TCS Account', note:'Partial payment per AR note' }],
    'Balance ₹1.9L expected 31 May 2026'
  ),
  mkInv('inv-013','INV-2026-00843','2026-04-04','2026-04-19','SI',
    { name:'Lakshmi Devi', id:'HC-003715', phone:'9876000012', email:'lakshmi@email.com' },
    'N/A','South Clinic','Nephrology','Kiran Pillai','INR',
    mkItems([
      ['Hemodialysis Session','90935',8,'Session',3200,0,5],
      ['AV Fistula Creation','36821',1,'Procedure',45000,0,18],
      ['EPO Injection 4000IU','B03XA01',4,'Vial',1800,0,12],
    ]),
    'OVERDUE',[],
    'Patient has payment arrangement but not honoured'
  ),
  mkInv('inv-014','INV-2026-00836','2026-03-30','2026-04-14','SI',
    { name:'New India Assurance', id:'INS-0031', phone:'1800002345', email:'tpa@nia.in' },
    '27AAACN1234I1ZQ','East Block','Neurology','Deepa Rao','INR',
    mkItems([
      ['Brain Tumor Resection','61500',1,'Procedure',320000,0,18],
      ['Neurosurgery ICU – 5 Days','S01.1',5,'Day',9200,0,5],
      ['MRI Pre/Post Op','70553',2,'Scan',12000,0,18],
    ]),
    'PENDING',[],
    'TPA file under review at New India Assurance'
  ),
  mkInv('inv-015','INV-2026-00828','2026-03-25','2026-04-09','PI',
    { name:'Siemens Healthineers', id:'VEND-0055', phone:'2240007890', email:'billing@siemens.com' },
    '27AABCS1234J1ZR','Main Campus','Radiology','Suresh Nair','INR',
    mkItems([
      ['MRI Magnet Service Contract – Q1','9022.14',1,'Quarter',280000,5,18],
      ['CT Scanner Preventive Maintenance','9022.12',1,'Service',85000,5,18],
      ['Spare Parts – Gradient Coil Assembly','9022.90',1,'Set',42000,0,18],
    ]),
    'PAID',
    [{ date:'2026-04-01', mode:'RTGS', ref:'RTGS20260401SIE', amount:468918, bank:'SBI – Ops Account', note:'Annual service contract Q1 settlement' }],
    'Q1 2026 service contract fully paid'
  ),
  mkInv('inv-016','INV-2026-00819','2026-03-20','2026-04-04','SI',
    { name:'Vikas Malhotra', id:'HC-004512', phone:'9812001234', email:'vikas@email.com' },
    'N/A','Main Campus','Pathology','Priya Sharma','INR',
    mkItems([
      ['Comprehensive Blood Panel','85025',1,'Panel',1840,0,12],
      ['Liver Function Test','80076',1,'Test',680,0,12],
      ['Thyroid Profile (T3/T4/TSH)','84443',1,'Panel',920,0,12],
      ['HbA1c','83036',1,'Test',420,0,12],
    ]),
    'PAID',
    [{ date:'2026-03-20', mode:'UPI', ref:'UPI202603200002', amount:4307, bank:'Razorpay UPI', note:'Paid at collection centre' }],
    'Routine checkup labs – fully settled'
  ),
  mkInv('inv-017','INV-2026-00812','2026-03-15','2026-03-30','DN',
    { name:'SRL Diagnostics', id:'VEND-0041', phone:'2240009876', email:'accounts@srl.in' },
    '27AABCS1234E1ZM','Main Campus','Pathology','Suresh Nair','INR',
    mkItems([['Reagent Batch Recall – Returned','3002.10',3,'Pack',12400,0,18]]),
    'PAID',
    [{ date:'2026-03-18', mode:'Bank Transfer', ref:'DN-SETTLE-0018', amount:43944, bank:'HDFC – AP Account', note:'Adjusted against next PO' }],
    'Debit note for returned expired reagent batch'
  ),
  mkInv('inv-018','INV-2026-00805','2026-03-10','2026-03-25','SI',
    { name:'ECHS – Ex-Servicemen Scheme', id:'GOVT-0028', phone:'1100001111', email:'echs@mod.gov.in' },
    '07AAACE1234K1ZS','Main Campus','Orthopedics','Deepa Rao','INR',
    mkItems([
      ['Total Knee Replacement (TKR)','27447',1,'Procedure',285000,0,18],
      ['Implant – Knee Prosthesis','9021.31',2,'Implant',92000,0,5],
      ['Post-Op Physiotherapy','97001',10,'Session',1200,0,18],
      ['Post-Op ICU – 3 Days','S01.1',3,'Day',8500,0,5],
    ]),
    'PENDING',[],
    'ECHS claim submitted – expected settlement within 45 days'
  ),
  mkInv('inv-019','INV-2026-00797','2026-03-05','2026-03-20','SI',
    { name:'United India Insurance', id:'INS-0022', phone:'1800003456', email:'tpa@uii.in' },
    '27AAACU1234L1ZT','East Block','Oncology','Rahul Mehta','INR',
    mkItems([
      ['Radiation Therapy – 15 Fractions','77402',15,'Fraction',18000,0,18],
      ['Treatment Planning CT','77295',1,'Plan',28000,0,18],
      ['Oncology Consultation','99213',3,'Visit',2500,0,18],
    ]),
    'PARTIAL',
    [{ date:'2026-04-10', mode:'RTGS', ref:'UIC-SETTLE-0291', amount:84000, bank:'Axis Bank – Insurance Pool', note:'30% partial settlement' }],
    'Claim dispute on Day 3–5 fractions pending resolution'
  ),
  mkInv('inv-020','INV-2026-00788','2026-02-28','2026-03-15','PI',
    { name:'Cipla Ltd', id:'VEND-0012', phone:'2240001122', email:'accounts@cipla.com' },
    '27AAACC1234M1ZU','Main Campus','Pharmacy','Suresh Nair','INR',
    mkItems([
      ['Oncology Drug Kit – Cycle 3','3004.90',10,'Kit',84000,5,12],
      ['Antibiotic Stock – Meropenem 1g','3004.20',200,'Vial',320,0,12],
      ['Cardiac Medication Bundle','3004.90',1,'Bundle',38400,5,12],
    ]),
    'PAID',
    [{ date:'2026-03-02', mode:'NEFT', ref:'NEFT20260302CIP', amount:1207872, bank:'SBI – Pharmacy Account', note:'Monthly pharma supply fully paid' }],
    'February Cipla monthly supply invoice – closed'
  ),
  mkInv('inv-021','INV-2026-00779','2026-02-22','2026-03-09','SI',
    { name:'Meena Pillai', id:'HC-004150', phone:'9900005678', email:'meena@email.com' },
    'N/A','Cardiac Care','Cardiology','Kiran Pillai','INR',
    mkItems([
      ['Cardiac Catheterisation','93458',1,'Procedure',28000,0,18],
      ['Consultation – Senior Cardiologist','99214',2,'Visit',2000,0,18],
      ['ECG + Holter – 24hr','93224',1,'Panel',3800,0,18],
    ]),
    'PARTIAL',
    [{ date:'2026-02-25', mode:'Cash', ref:'RCPT-0087', amount:36700, bank:'Reception Counter', note:'Initial payment at discharge' }],
    'Instalment arrangement ₹20K due 30 May'
  ),
  mkInv('inv-022','INV-2026-00771','2026-02-18','2026-03-05','SI',
    { name:'Pradeep Joshi', id:'HC-003540', phone:'9800001234', email:'pradeep@email.com' },
    'N/A','East Block','OT','Priya Sharma','INR',
    mkItems([
      ['Abdominal Hernia Repair (Laparoscopic)','49650',1,'Procedure',85000,0,18],
      ['Surgical Mesh Implant','V53.99',1,'Implant',28000,0,5],
      ['OT Consumables','S80.1',1,'Set',12400,0,12],
    ]),
    'OVERDUE',[],
    'Legal notice issued – case with legal team'
  ),
  mkInv('inv-023','INV-2026-00764','2026-02-14','2026-03-01','PI',
    { name:'Abbott India Ltd', id:'VEND-0018', phone:'2240004567', email:'finance@abbott.in' },
    '27AAACA1234N1ZV','Main Campus','ICU','Suresh Nair','INR',
    mkItems([
      ['Ventilator Consumables Kit – Monthly','9019.20',5,'Kit',18400,0,18],
      ['PICC Line Set – 10 pcs','9018.39',10,'Set',2800,0,12],
      ['Parenteral Nutrition Solution 1000ml','B05BA',50,'Bag',1200,0,0],
    ]),
    'PAID',
    [{ date:'2026-02-18', mode:'NEFT', ref:'NEFT20260218ABB', amount:304368, bank:'SBI – ICU Supplies', note:'February ICU consumables' }],
    'February Abbott ICU supply – fully paid'
  ),
  mkInv('inv-024','INV-2026-00755','2026-02-10','2026-02-25','SI',
    { name:'Geeta Bose', id:'HC-003800', phone:'9700001234', email:'geeta@email.com' },
    'N/A','South Clinic','Radiology','Kiran Pillai','INR',
    mkItems([
      ['MRI Knee – Left','73721',1,'Scan',7800,0,18],
      ['X-Ray Knee AP + Lateral','73560',2,'Study',620,0,18],
    ]),
    'OVERDUE',[],
    '3 follow-ups done. Phone unreachable. Considering write-off'
  ),
  mkInv('inv-025','INV-2026-00748','2026-02-05','2026-02-20','SI',
    { name:'Star Health Insurance', id:'INS-0008', phone:'1800004567', email:'tpa@starhealth.in' },
    '33AAACS1234O1ZW','North Wing','ICU','Deepa Rao','INR',
    mkItems([
      ['ICU Stay – 5 Days (Critical)','S01.1',5,'Day',14000,0,5],
      ['Ventilator Support – 72 hours','94656',1,'Episode',42000,0,18],
      ['Critical Care Medicines','B05XA',1,'Kit',28400,0,12],
      ['ICU Nursing Charges','Z49.2',5,'Day',2800,0,18],
    ]),
    'PENDING',[],
    'TPA file submitted. Cashless denied – resubmitting as reimbursement'
  ),
];

// ─── Analytics Data ───────────────────────────────────────────────────────────
export const COLLECTION_TREND = [
  { month: 'Nov 25', invoiced: 14200, collected: 11800 },
  { month: 'Dec 25', invoiced: 16100, collected: 12600 },
  { month: 'Jan 26', invoiced: 17400, collected: 13200 },
  { month: 'Feb 26', invoiced: 18200, collected: 13800 },
  { month: 'Mar 26', invoiced: 17800, collected: 12400 },
  { month: 'Apr 26', invoiced: 19400, collected: 13100 },
  { month: 'May 26', invoiced: 18420, collected: 12480 },
];

export const TOP_CUSTOMERS = [
  { name: 'HDFC Ergo Insurance',       amount: 8420000, pct: 100 },
  { name: 'Infosys Health Program',     amount: 6200000, pct: 74  },
  { name: 'New India Assurance',        amount: 5840000, pct: 69  },
  { name: 'APSRTC Health Scheme',       amount: 4120000, pct: 49  },
  { name: 'TCS Employee Health',        amount: 3800000, pct: 45  },
];

export const REVENUE_BY_BRANCH = [
  { name: 'Main Campus',      value: 62400000, color: '#3b82f6' },
  { name: 'Specialty Center', value: 38200000, color: '#8b5cf6' },
  { name: 'North Wing',       value: 32100000, color: '#10b981' },
  { name: 'East Block',       value: 28400000, color: '#f59e0b' },
  { name: 'Cardiac Care',     value: 14600000, color: '#ef4444' },
  { name: 'South Clinic',     value: 8500000,  color: '#06b6d4' },
];

export const AGING_BUCKETS_DATA = [
  { label: '0–30 days',  count: 423, amount: 42800000, pct: 36.8, color: '#10b981' },
  { label: '31–60 days', count: 187, amount: 31200000, pct: 26.9, color: '#f59e0b' },
  { label: '61–90 days', count: 112, amount: 24600000, pct: 21.2, color: '#f97316' },
  { label: '90+ days',   count: 68,  amount: 17400000, pct: 15.1, color: '#ef4444' },
];

// ─── AI Insights ──────────────────────────────────────────────────────────────
export const IL_AI_INSIGHTS = [
  {
    id: 'ai-inv-001', severity: 'critical', icon: 'AlertOctagon',
    title: '4 Purchase Invoices Overdue – Vendor Risk',
    detail: 'INV-2026-00881 (SRL Diagnostics) is 12 days overdue. Supply disruption risk if not cleared within 3 days.',
    action: 'Schedule Payments',
  },
  {
    id: 'ai-inv-002', severity: 'warning', icon: 'AlertTriangle',
    title: 'GST Mismatch in 3 East Block Invoices',
    detail: 'IGST applied instead of CGST+SGST on intra-state transactions. Potential GSTR-1 filing error.',
    action: 'Review GST',
  },
  {
    id: 'ai-inv-003', severity: 'info', icon: 'TrendingUp',
    title: 'May Collections Forecast: ₹1.87Cr',
    detail: 'Based on promise-to-pay records, insurance approvals, and payment terms across 423 pending invoices.',
    action: 'View Forecast',
  },
  {
    id: 'ai-inv-004', severity: 'warning', icon: 'Copy',
    title: 'Possible Duplicate Invoice Detected',
    detail: 'INV-2026-00874 shares identical customer, amount, and department with an adjacent entry within 2 days.',
    action: 'Compare Invoices',
  },
  {
    id: 'ai-inv-005', severity: 'info', icon: 'Sparkles',
    title: 'Recurring Invoice Opportunity – 2 Corporates',
    detail: 'Infosys and TCS billing patterns suggest monthly auto-scheduling. Saves 6 manual touchpoints/month.',
    action: 'Set Up Recurring',
  },
];

export const IL_AI_PROMPTS = [
  'Which invoices are overdue by more than 30 days?',
  'Show GST summary for May 2026',
  'Top 5 customers by outstanding balance',
  'Flag invoices with possible duplicates',
  'What is the collection efficiency this month?',
  'Show all purchase invoices pending payment',
  'Invoices with GST mismatch or filing risk',
  'Predict next month revenue from current pipeline',
];

// ─── Formatters ───────────────────────────────────────────────────────────────
export const fmtINR = (val, format = 'plain') => {
  if (val == null) return '—';
  if (format === 'crore') return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (format === 'lakh')  return `₹${(val / 100000).toFixed(2)}L`;
  if (format === 'pct')   return `${val}%`;
  if (format === 'num')   return String(val);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val);
};

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const dueBadge = (dueDate, status) => {
  if (['PAID', 'CANCELLED', 'DRAFT'].includes(status)) return null;
  const days = Math.floor((new Date(dueDate) - new Date()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  if (days <= 7) return { label: `Due in ${days}d`,  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  return null;
};
