// ─── PatientBilling / New Invoice — Constants & Mock Data ─────────────────────

// ─── Departments ──────────────────────────────────────────────────────────────
export const NI_DEPARTMENTS = [
  { id: 'GEN_MED', name: 'General Medicine',     color: 'blue'   },
  { id: 'CARDIO',  name: 'Cardiology',           color: 'red'    },
  { id: 'NEURO',   name: 'Neurology',            color: 'purple' },
  { id: 'ORTHO',   name: 'Orthopedics',          color: 'orange' },
  { id: 'ONCO',    name: 'Oncology',             color: 'rose'   },
  { id: 'PEDS',    name: 'Pediatrics',           color: 'green'  },
  { id: 'OBG',     name: 'Obs & Gynecology',     color: 'pink'   },
  { id: 'ENT',     name: 'ENT',                  color: 'teal'   },
  { id: 'OPHTHAL', name: 'Ophthalmology',        color: 'cyan'   },
  { id: 'DERM',    name: 'Dermatology',          color: 'yellow' },
  { id: 'RADIO',   name: 'Radiology',            color: 'slate'  },
  { id: 'PATH',    name: 'Pathology / Lab',      color: 'violet' },
  { id: 'PHARM',   name: 'Pharmacy',             color: 'emerald'},
  { id: 'ICU',     name: 'Intensive Care Unit',  color: 'red'    },
  { id: 'OT',      name: 'Operation Theatre',    color: 'gray'   },
  { id: 'ER',      name: 'Emergency',            color: 'orange' },
  { id: 'PHYSIO',  name: 'Physiotherapy',        color: 'lime'   },
];

// ─── Service Categories ────────────────────────────────────────────────────────
export const NI_SERVICE_CATEGORIES = [
  { id: 'all',          label: 'All Services',       icon: 'layers'      },
  { id: 'CONSULTATION', label: 'Consultation',       icon: 'stethoscope' },
  { id: 'LAB',          label: 'Lab Tests',          icon: 'flask'       },
  { id: 'RADIOLOGY',    label: 'Radiology',          icon: 'scan'        },
  { id: 'SURGERY',      label: 'Surgery / OT',       icon: 'scissors'    },
  { id: 'ICU',          label: 'ICU Charges',        icon: 'heart-pulse' },
  { id: 'ROOM',         label: 'Room & Nursing',     icon: 'bed'         },
  { id: 'PHARMACY',     label: 'Pharmacy',           icon: 'pill'        },
  { id: 'PHYSIO',       label: 'Physiotherapy',      icon: 'activity'    },
  { id: 'PROCEDURE',    label: 'Procedures',         icon: 'zap'         },
];

// ─── Service Catalog (30+ realistic healthcare services) ──────────────────────
export const NI_SERVICE_CATALOG = [
  // ── Consultations ─────────────────────────────────────────────────────────
  { code:'CONS-GP-01',    name:'General Physician Consultation',           category:'CONSULTATION', dept:'GEN_MED', unitPrice:500,   taxPct:0,  hsnCode:'999311', insuranceEligible:true,  packageable:true,  popular:true  },
  { code:'CONS-SPEC-01',  name:'Specialist Consultation (First Visit)',    category:'CONSULTATION', dept:'CARDIO',  unitPrice:1200,  taxPct:0,  hsnCode:'999311', insuranceEligible:true,  packageable:true,  popular:true  },
  { code:'CONS-SPEC-02',  name:'Specialist Consultation (Follow-up)',      category:'CONSULTATION', dept:'CARDIO',  unitPrice:700,   taxPct:0,  hsnCode:'999311', insuranceEligible:true,  packageable:false, popular:false },
  { code:'CONS-ER-01',    name:'Emergency Consultation',                   category:'CONSULTATION', dept:'ER',      unitPrice:1500,  taxPct:0,  hsnCode:'999311', insuranceEligible:true,  packageable:false, popular:true  },
  { code:'CONS-ICU-01',   name:'ICU Consultant Visit',                    category:'CONSULTATION', dept:'ICU',     unitPrice:2000,  taxPct:0,  hsnCode:'999311', insuranceEligible:true,  packageable:false, popular:false },
  { code:'CONS-TELE-01',  name:'Telemedicine Consultation',               category:'CONSULTATION', dept:'GEN_MED', unitPrice:400,   taxPct:18, hsnCode:'999311', insuranceEligible:false, packageable:false, popular:false },

  // ── Lab Tests ─────────────────────────────────────────────────────────────
  { code:'LAB-CBC-01',    name:'Complete Blood Count (CBC)',               category:'LAB', dept:'PATH', unitPrice:350,  taxPct:0, hsnCode:'999316', insuranceEligible:true,  packageable:true,  popular:true  },
  { code:'LAB-LFT-01',    name:'Liver Function Test (LFT)',               category:'LAB', dept:'PATH', unitPrice:650,  taxPct:0, hsnCode:'999316', insuranceEligible:true,  packageable:true,  popular:false },
  { code:'LAB-RFT-01',    name:'Renal Function Test (RFT)',               category:'LAB', dept:'PATH', unitPrice:600,  taxPct:0, hsnCode:'999316', insuranceEligible:true,  packageable:true,  popular:false },
  { code:'LAB-THYROID-01',name:'Thyroid Panel (TSH, T3, T4)',             category:'LAB', dept:'PATH', unitPrice:850,  taxPct:0, hsnCode:'999316', insuranceEligible:true,  packageable:true,  popular:false },
  { code:'LAB-HBA1C-01',  name:'HbA1c (Glycated Hemoglobin)',             category:'LAB', dept:'PATH', unitPrice:550,  taxPct:0, hsnCode:'999316', insuranceEligible:true,  packageable:false, popular:true  },
  { code:'LAB-CULTURE-01',name:'Blood Culture & Sensitivity',             category:'LAB', dept:'PATH', unitPrice:1200, taxPct:0, hsnCode:'999316', insuranceEligible:true,  packageable:false, popular:false },
  { code:'LAB-DENGUE-01', name:'Dengue NS1 Antigen + IgG/IgM',           category:'LAB', dept:'PATH', unitPrice:900,  taxPct:0, hsnCode:'999316', insuranceEligible:true,  packageable:false, popular:true  },
  { code:'LAB-LIPID-01',  name:'Lipid Profile (Full)',                    category:'LAB', dept:'PATH', unitPrice:700,  taxPct:0, hsnCode:'999316', insuranceEligible:true,  packageable:true,  popular:false },
  { code:'LAB-URINE-01',  name:'Urine Routine & Microscopy',             category:'LAB', dept:'PATH', unitPrice:250,  taxPct:0, hsnCode:'999316', insuranceEligible:true,  packageable:true,  popular:true  },
  { code:'LAB-PROCALC-01',name:'Procalcitonin (PCT)',                     category:'LAB', dept:'PATH', unitPrice:2200, taxPct:0, hsnCode:'999316', insuranceEligible:true,  packageable:false, popular:false },

  // ── Radiology ─────────────────────────────────────────────────────────────
  { code:'RAD-XRY-CHEST', name:'X-Ray Chest (PA View)',                   category:'RADIOLOGY', dept:'RADIO', unitPrice:400,  taxPct:0, hsnCode:'999315', insuranceEligible:true, packageable:true,  popular:true  },
  { code:'RAD-USG-ABD',   name:'USG Abdomen (Full)',                      category:'RADIOLOGY', dept:'RADIO', unitPrice:1200, taxPct:0, hsnCode:'999315', insuranceEligible:true, packageable:true,  popular:true  },
  { code:'RAD-CT-BRAIN',  name:'CT Scan Brain (Plain)',                   category:'RADIOLOGY', dept:'RADIO', unitPrice:4500, taxPct:5, hsnCode:'999315', insuranceEligible:true, packageable:false, popular:true  },
  { code:'RAD-CT-CHEST',  name:'CT Scan Chest (HRCT)',                   category:'RADIOLOGY', dept:'RADIO', unitPrice:6500, taxPct:5, hsnCode:'999315', insuranceEligible:true, packageable:false, popular:false },
  { code:'RAD-MRI-BRAIN', name:'MRI Brain (Plain + Contrast)',            category:'RADIOLOGY', dept:'RADIO', unitPrice:9500, taxPct:5, hsnCode:'999315', insuranceEligible:true, packageable:false, popular:true  },
  { code:'RAD-ECG-01',    name:'12-Lead ECG',                            category:'RADIOLOGY', dept:'CARDIO',unitPrice:300,  taxPct:0, hsnCode:'999315', insuranceEligible:true, packageable:true,  popular:true  },
  { code:'RAD-ECHO-01',   name:'Echocardiography (2D Echo)',              category:'RADIOLOGY', dept:'CARDIO',unitPrice:3500, taxPct:0, hsnCode:'999315', insuranceEligible:true, packageable:false, popular:false },

  // ── Room & Nursing ────────────────────────────────────────────────────────
  { code:'ROOM-GEN-01',   name:'General Ward (Per Day)',                  category:'ROOM', dept:'GEN_MED', unitPrice:1200, taxPct:0,  hsnCode:'999272', insuranceEligible:true, packageable:true,  popular:true  },
  { code:'ROOM-SEMI-01',  name:'Semi-Private Room (Per Day)',             category:'ROOM', dept:'GEN_MED', unitPrice:2500, taxPct:0,  hsnCode:'999272', insuranceEligible:true, packageable:false, popular:false },
  { code:'ROOM-PVT-01',   name:'Private Room (Per Day)',                  category:'ROOM', dept:'GEN_MED', unitPrice:4500, taxPct:18, hsnCode:'999272', insuranceEligible:true, packageable:false, popular:false },
  { code:'ROOM-ICU-01',   name:'ICU Bed Charges (Per Day)',               category:'ICU',  dept:'ICU',     unitPrice:8500, taxPct:0,  hsnCode:'999272', insuranceEligible:true, packageable:false, popular:true  },
  { code:'ROOM-NICU-01',  name:'NICU Bed Charges (Per Day)',              category:'ICU',  dept:'ICU',     unitPrice:7500, taxPct:0,  hsnCode:'999272', insuranceEligible:true, packageable:false, popular:false },

  // ── ICU Charges ───────────────────────────────────────────────────────────
  { code:'ICU-VENT-01',   name:'Ventilator Charges (Per Day)',            category:'ICU', dept:'ICU', unitPrice:4500, taxPct:0, hsnCode:'999316', insuranceEligible:true, packageable:false, popular:true  },
  { code:'ICU-MONITOR-01',name:'Cardiac Monitoring (Per Day)',            category:'ICU', dept:'ICU', unitPrice:1500, taxPct:0, hsnCode:'999316', insuranceEligible:true, packageable:false, popular:false },
  { code:'ICU-NURSING-01',name:'ICU Nursing Care (Per Day)',              category:'ICU', dept:'ICU', unitPrice:2000, taxPct:0, hsnCode:'999316', insuranceEligible:true, packageable:false, popular:false },

  // ── Surgery / OT ──────────────────────────────────────────────────────────
  { code:'OT-APPX-01',    name:'Appendectomy (Open)',                     category:'SURGERY', dept:'OT', unitPrice:28000, taxPct:0, hsnCode:'999316', insuranceEligible:true, packageable:true,  popular:false },
  { code:'OT-LAPAROSCOPY',name:'Diagnostic Laparoscopy',                  category:'SURGERY', dept:'OT', unitPrice:22000, taxPct:0, hsnCode:'999316', insuranceEligible:true, packageable:true,  popular:false },
  { code:'OT-CATARACT-01',name:'Cataract Surgery (Phaco)',                category:'SURGERY', dept:'OT', unitPrice:35000, taxPct:0, hsnCode:'999316', insuranceEligible:true, packageable:true,  popular:true  },
  { code:'OT-ANESTHESIA', name:'General Anesthesia Charges',              category:'SURGERY', dept:'OT', unitPrice:8500,  taxPct:0, hsnCode:'999316', insuranceEligible:true, packageable:false, popular:false },

  // ── Pharmacy ──────────────────────────────────────────────────────────────
  { code:'PHR-CONSUME-01',name:'Surgical Consumables Kit',                category:'PHARMACY', dept:'PHARM', unitPrice:2500, taxPct:12, hsnCode:'300490', insuranceEligible:false, packageable:true,  popular:true  },
  { code:'PHR-CANNULA-01',name:'IV Cannula 18G – Pack of 5',             category:'PHARMACY', dept:'PHARM', unitPrice:180,  taxPct:12, hsnCode:'900192', insuranceEligible:false, packageable:false, popular:false },
  { code:'PHR-SALINE-01', name:'Normal Saline 0.9% 500ml',               category:'PHARMACY', dept:'PHARM', unitPrice:65,   taxPct:5,  hsnCode:'300690', insuranceEligible:false, packageable:false, popular:false },

  // ── Physiotherapy ─────────────────────────────────────────────────────────
  { code:'PHYSIO-SES-01', name:'Physiotherapy Session (30 min)',          category:'PHYSIO', dept:'PHYSIO', unitPrice:600, taxPct:18, hsnCode:'999311', insuranceEligible:true, packageable:true, popular:false },
];

// ─── Mock Patients ─────────────────────────────────────────────────────────────
export const NI_MOCK_PATIENTS = [
  {
    id:'PAT-001', uhid:'UHID-2026-000123', mrn:'MRN-4521',
    name:'Rajesh Kumar Sharma', age:58, gender:'M', blood:'B+',
    phone:'9876543210', email:'rajesh.sharma@email.com',
    visitNo:'OP-2026-04521', admNo:null, ward:null, room:null, bed:null,
    dept:'Cardiology', doctor:'Dr. Priya Nair', doctorId:'DOC-001', type:'OP',
    insurance:{ tpa:'Star Health', policyNo:'SH-2024-87654', coverageAmt:300000, copay:10, validity:'2027-03-31', preAuthNo:null, preAuthStatus:null },
    corporate:null, outstanding:4200, credit:true, creditLimit:50000, lastVisit:'2026-04-15',
  },
  {
    id:'PAT-002', uhid:'UHID-2026-000456', mrn:'MRN-7832',
    name:'Meera Sundarajan', age:32, gender:'F', blood:'O+',
    phone:'9876543211', email:'meera.s@email.com',
    visitNo:null, admNo:'IP-2026-00892', ward:'Ward-C', room:'302', bed:'2',
    dept:'Obs & Gynecology', doctor:'Dr. Anitha Krishnamurthy', doctorId:'DOC-002', type:'IP',
    insurance:{ tpa:'United India', policyNo:'UI-2025-12345', coverageAmt:500000, copay:0, validity:'2026-12-31', preAuthNo:'PA-2026-8821', preAuthStatus:'APPROVED' },
    corporate:null, outstanding:0, credit:false, creditLimit:0, lastVisit:'2026-05-10',
  },
  {
    id:'PAT-003', uhid:'UHID-2026-000789', mrn:'MRN-2211',
    name:'Arun Balakrishnan', age:45, gender:'M', blood:'A+',
    phone:'9876543212', email:'arun.b@email.com',
    visitNo:null, admNo:'IP-2026-00901', ward:'ICU-A', room:'ICU-12', bed:'1',
    dept:'Intensive Care Unit', doctor:'Dr. Mohammed Iqbal', doctorId:'DOC-003', type:'ICU',
    insurance:{ tpa:'Medi Assist', policyNo:'MA-2025-99001', coverageAmt:750000, copay:5, validity:'2027-01-31', preAuthNo:'PA-2026-9012', preAuthStatus:'PENDING' },
    corporate:null, outstanding:28500, credit:true, creditLimit:100000, lastVisit:'2026-05-15',
  },
  {
    id:'PAT-004', uhid:'UHID-2026-001023', mrn:'MRN-9901',
    name:'Kavitha Rajan', age:27, gender:'F', blood:'AB-',
    phone:'9876543213', email:'kavitha.r@email.com',
    visitNo:'OP-2026-04901', admNo:null, ward:null, room:null, bed:null,
    dept:'General Medicine', doctor:'Dr. Suresh Menon', doctorId:'DOC-004', type:'OP',
    insurance:null,
    corporate:{ company:'TechCorp India Ltd.', empId:'TC-2024-5678', coverage:200000, validity:'2026-12-31' },
    outstanding:0, credit:true, creditLimit:200000, lastVisit:'2026-03-22',
  },
  {
    id:'PAT-005', uhid:'UHID-2026-000221', mrn:'MRN-3312',
    name:'Srinivasan Ramamurthy', age:71, gender:'M', blood:'O-',
    phone:'9876543214', email:'srini.r@email.com',
    visitNo:'ER-2026-01201', admNo:null, ward:null, room:null, bed:null,
    dept:'Emergency Medicine', doctor:'Dr. Lakshmi Subramanian', doctorId:'DOC-005', type:'ER',
    insurance:{ tpa:'HDFC ERGO', policyNo:'HE-2026-45678', coverageAmt:1000000, copay:0, validity:'2027-06-30', preAuthNo:null, preAuthStatus:null },
    corporate:null, outstanding:0, credit:false, creditLimit:0, lastVisit:'2026-05-19',
  },
];

// ─── Doctors ──────────────────────────────────────────────────────────────────
export const NI_DOCTORS = [
  { id:'DOC-001', name:'Dr. Priya Nair',          dept:'Cardiology',         designation:'Senior Consultant' },
  { id:'DOC-002', name:'Dr. Anitha Krishnamurthy', dept:'Obs & Gynecology',  designation:'HOD'               },
  { id:'DOC-003', name:'Dr. Mohammed Iqbal',       dept:'ICU / Critical Care',designation:'Senior Intensivist'},
  { id:'DOC-004', name:'Dr. Suresh Menon',         dept:'General Medicine',   designation:'Consultant'        },
  { id:'DOC-005', name:'Dr. Lakshmi Subramanian',  dept:'Emergency Medicine', designation:'ER Consultant'     },
  { id:'DOC-006', name:'Dr. Ramesh Patel',         dept:'Orthopedics',        designation:'Senior Surgeon'    },
  { id:'DOC-007', name:'Dr. Kavita Singh',         dept:'Neurology',          designation:'Consultant'        },
  { id:'DOC-008', name:'Dr. Ajay Kumar',           dept:'Radiology',          designation:'Radiologist'       },
];

// ─── Packages ─────────────────────────────────────────────────────────────────
export const NI_PACKAGES = [
  {
    id:'PKG-DENGUE-01', name:'Dengue Management Package', type:'DISEASE', totalValue:12000, validity:7,
    services:[
      { code:'CONS-GP-01', qty:3 }, { code:'LAB-CBC-01', qty:4 },
      { code:'LAB-DENGUE-01', qty:1 }, { code:'ROOM-GEN-01', qty:5 },
    ],
    inclusions:['Consultation (3 visits)','CBC x4','Dengue Panel','General Ward (5 days)'],
    exclusions:['CT Scan','MRI','ICU Charges'],
    insurance:true, color:'amber',
  },
  {
    id:'PKG-CATARACT-01', name:'Cataract Surgery Package (Phaco)', type:'SURGERY', totalValue:55000, validity:14,
    services:[
      { code:'CONS-SPEC-01', qty:2 }, { code:'OT-CATARACT-01', qty:1 },
      { code:'OT-ANESTHESIA', qty:1 }, { code:'LAB-CBC-01', qty:1 },
      { code:'RAD-ECG-01', qty:1 }, { code:'ROOM-SEMI-01', qty:2 },
    ],
    inclusions:['Pre-op & post-op consultation','Phaco surgery','Standard IOL','Anesthesia','Medicines kit'],
    exclusions:['Premium IOL','ICU stays'],
    insurance:true, color:'cyan',
  },
  {
    id:'PKG-MATERNITY-01', name:'Normal Delivery Package', type:'MATERNITY', totalValue:35000, validity:7,
    services:[
      { code:'CONS-SPEC-01', qty:2 }, { code:'LAB-CBC-01', qty:2 },
      { code:'RAD-USG-ABD', qty:1 }, { code:'ROOM-SEMI-01', qty:3 },
    ],
    inclusions:['Delivery charges','Baby care 3 days','Lab investigations','USG','Medicines'],
    exclusions:['Epidural','NICU charges','C-Section upgrade'],
    insurance:true, color:'pink',
  },
  {
    id:'PKG-CARDIAC-SCREENING', name:'Comprehensive Cardiac Screening', type:'WELLNESS', totalValue:5500, validity:1,
    services:[
      { code:'CONS-SPEC-01', qty:1 }, { code:'RAD-ECG-01', qty:1 },
      { code:'RAD-ECHO-01', qty:1 }, { code:'LAB-LIPID-01', qty:1 },
      { code:'LAB-CBC-01', qty:1 },
    ],
    inclusions:['Cardiologist consultation','ECG','2D Echo','Lipid profile','CBC'],
    exclusions:['Stress test','Coronary angiography'],
    insurance:false, color:'red',
  },
];

// ─── Insurance / TPA List ─────────────────────────────────────────────────────
export const NI_TPA_LIST = [
  { id:'TPA-STAR',      name:'Star Health Insurance',    cashlessLimit:500000,  avgApprovalHrs:2,   claimRejectionRate:8  },
  { id:'TPA-UIIC',      name:'United India Insurance',   cashlessLimit:300000,  avgApprovalHrs:4,   claimRejectionRate:12 },
  { id:'TPA-HDFC',      name:'HDFC ERGO Health',         cashlessLimit:1000000, avgApprovalHrs:1.5, claimRejectionRate:5  },
  { id:'TPA-MEDASSIST', name:'Medi Assist TPA',          cashlessLimit:750000,  avgApprovalHrs:3,   claimRejectionRate:10 },
  { id:'TPA-ICICI',     name:'ICICI Lombard Health',     cashlessLimit:800000,  avgApprovalHrs:2,   claimRejectionRate:6  },
  { id:'GOVT-ESI',      name:'ESI Scheme (Government)',  cashlessLimit:200000,  avgApprovalHrs:24,  claimRejectionRate:15 },
  { id:'GOVT-PMJAY',   name:'PM-JAY (Ayushman Bharat)', cashlessLimit:500000,  avgApprovalHrs:6,   claimRejectionRate:20 },
];

// ─── Tax Groups ───────────────────────────────────────────────────────────────
export const NI_TAX_GROUPS = [
  { id:'EXEMPT', name:'Exempt (Healthcare)', rate:0  },
  { id:'GST5',   name:'GST 5%',              rate:5  },
  { id:'GST12',  name:'GST 12%',             rate:12 },
  { id:'GST18',  name:'GST 18%',             rate:18 },
];

// ─── Payment Modes ────────────────────────────────────────────────────────────
export const NI_PAYMENT_MODES = [
  { id:'CASH',      name:'Cash',                 requiresRef:false, refLabel:''                },
  { id:'CARD',      name:'Card (Debit/Credit)',   requiresRef:true,  refLabel:'Last 4 Digits'   },
  { id:'UPI',       name:'UPI',                  requiresRef:true,  refLabel:'UTR Number'       },
  { id:'NEFT',      name:'NEFT / Bank Transfer',  requiresRef:true,  refLabel:'Transaction Ref'  },
  { id:'CHEQUE',    name:'Cheque',               requiresRef:true,  refLabel:'Cheque No.'       },
  { id:'INSURANCE', name:'Insurance / TPA',      requiresRef:false, refLabel:''                },
  { id:'CORPORATE', name:'Corporate Credit',     requiresRef:false, refLabel:''                },
  { id:'WALLET',    name:'Digital Wallet',       requiresRef:true,  refLabel:'Wallet TxnID'     },
];

// ─── Billing Types ────────────────────────────────────────────────────────────
export const NI_BILLING_TYPES = [
  { id:'OP',  label:'Outpatient',        short:'OP',  badgeCls:'bg-sky-100 text-sky-700 border-sky-200'         },
  { id:'IP',  label:'Inpatient',         short:'IP',  badgeCls:'bg-emerald-100 text-emerald-700 border-emerald-200'},
  { id:'ICU', label:'ICU',              short:'ICU', badgeCls:'bg-red-100 text-red-700 border-red-200'          },
  { id:'OT',  label:'Operation Theatre', short:'OT',  badgeCls:'bg-purple-100 text-purple-700 border-purple-200' },
  { id:'ER',  label:'Emergency',         short:'ER',  badgeCls:'bg-orange-100 text-orange-700 border-orange-200' },
  { id:'LAB', label:'Lab',              short:'LAB', badgeCls:'bg-cyan-100 text-cyan-700 border-cyan-200'        },
  { id:'RAD', label:'Radiology',         short:'RAD', badgeCls:'bg-violet-100 text-violet-700 border-violet-200' },
  { id:'PHR', label:'Pharmacy',          short:'PHR', badgeCls:'bg-teal-100 text-teal-700 border-teal-200'       },
];

// ─── Approval Rules ───────────────────────────────────────────────────────────
export const NI_APPROVAL_RULES = [
  { id:'AR-001', condition:'DISCOUNT_GT_15', label:'Discount > 15%',           approver:'Billing Supervisor', slaMin:30  },
  { id:'AR-002', condition:'DISCOUNT_GT_25', label:'Discount > 25%',           approver:'Finance Manager',    slaMin:120 },
  { id:'AR-003', condition:'INVOICE_GT_100K',label:'Invoice Value > ₹1,00,000',approver:'Finance Manager',    slaMin:240 },
  { id:'AR-004', condition:'INS_OVERRIDE',   label:'Insurance Override',        approver:'Medical Supt.',     slaMin:60  },
  { id:'AR-005', condition:'REFUND',         label:'Refund Processing',         approver:'Billing Supervisor', slaMin:60  },
];

// ─── Leakage Detection Rules ──────────────────────────────────────────────────
export const NI_LEAKAGE_RULES = [
  { id:'LR-001', trigger:'ICU_NO_VENT',             severity:'HIGH',   impact:4500, category:'MISSING_CHARGE',   message:'ICU patient — Ventilator charges not billed', fix:'Add ventilator charges (ICU-VENT-01)' },
  { id:'LR-002', trigger:'SURGERY_NO_CONSUMABLES',  severity:'HIGH',   impact:2500, category:'MISSING_CHARGE',   message:'Surgery detected — Consumables not captured', fix:'Add surgical consumables kit (PHR-CONSUME-01)' },
  { id:'LR-003', trigger:'IP_NO_ROOM',              severity:'HIGH',   impact:1200, category:'MISSING_CHARGE',   message:'Inpatient admission — Room charges not added', fix:'Add room/bed charges per day' },
  { id:'LR-004', trigger:'EXCESS_DISCOUNT',         severity:'MEDIUM', impact:0,    category:'UNAUTHORIZED',     message:'Discount > 20% applied — Approval required', fix:'Submit for management approval' },
  { id:'LR-005', trigger:'CONSULT_NO_LABS',         severity:'LOW',    impact:700,  category:'OPTIMIZATION',     message:'Consultation without lab orders — check missed investigations', fix:'Review clinical orders for unbilled labs' },
  { id:'LR-006', trigger:'PACKAGE_PARTIAL',         severity:'MEDIUM', impact:0,    category:'PACKAGE_LEAKAGE',  message:'Package selected but services billed outside', fix:'Include in package or justify separate billing' },
];

// ─── GL Account Map ───────────────────────────────────────────────────────────
export const NI_GL_ACCOUNTS = {
  patientDebtors:      { code:'1100-PTNS',  name:'Patient Debtors (OP)'        },
  insuranceDebtors:    { code:'1101-INS',   name:'Insurance Receivable'        },
  corporateDebtors:    { code:'1102-CORP',  name:'Corporate Debtors'           },
  revenueConsultation: { code:'4100-CONS',  name:'Consultation Revenue'        },
  revenueLab:          { code:'4200-LAB',   name:'Laboratory Revenue'          },
  revenueRadiology:    { code:'4300-RAD',   name:'Radiology Revenue'           },
  revenueOT:           { code:'4400-OT',    name:'Surgical Revenue'            },
  revenueICU:          { code:'4500-ICU',   name:'ICU Revenue'                 },
  revenueRoom:         { code:'4600-ROOM',  name:'Room Revenue'                },
  revenuePharmacy:     { code:'4700-PHARM', name:'Pharmacy Revenue'            },
  gstPayable:          { code:'2200-GST',   name:'GST Output Tax Payable'      },
  discountAllowed:     { code:'5100-DISC',  name:'Discount Allowed'            },
};

// ─── AI Prompts ───────────────────────────────────────────────────────────────
export const NI_AI_PROMPTS = [
  'Detect missing billable items',
  'Check insurance eligibility',
  'Show package leakage risks',
  'Estimate claim approval probability',
  'Validate GST calculations',
  'Recommend billing optimization',
  'Detect duplicate charges',
  'Show revenue impact summary',
];

// ─── Initial AI Messages ──────────────────────────────────────────────────────
export const NI_INITIAL_AI_MESSAGES = [
  {
    id: 'ai-init-1',
    role: 'assistant',
    text: 'Hello! I\'m your **AI Billing Assistant**. I can help you detect missing charges, validate insurance eligibility, optimize package utilization, and ensure accurate GST calculations.',
    ts: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: 'ai-init-2',
    role: 'assistant',
    text: 'Start by selecting a patient or adding line items — I\'ll analyse your invoice in real-time and flag any billing risks.',
    ts: new Date(Date.now() - 25000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function generateRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
}

export function calcRowTotal(row) {
  const base = (row.qty || 0) * (row.unitPrice || 0);
  const disc = base * ((row.discPct || 0) / 100);
  const tax  = (base - disc) * ((row.taxPct || 0) / 100);
  return base - disc + tax;
}

export function fmt(n) {
  if (n == null || isNaN(n)) return '₹0';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
