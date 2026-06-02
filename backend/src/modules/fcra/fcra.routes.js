'use strict';

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { asyncHandler } = require('../../shared/utils/asyncHandler');
const { logEvent, AUDIT_ACTIONS } = require('../../shared/audit/auditLogger');

const FCRARegistration = require('./models/FCRARegistration');
const FCRABankAccount  = require('./models/FCRABankAccount');
const FCRADonor        = require('./models/FCRADonor');
const FCRAReceipt      = require('./models/FCRAReceipt');
const FCRAProject      = require('./models/FCRAProject');
const FCRAUtilisation  = require('./models/FCRAUtilisation');
const FCRAAsset        = require('./models/FCRAAsset');
const FCRAAssetDisposal = require('./models/FCRAAssetDisposal');
const FCRAAssetIncome  = require('./models/FCRAAssetIncome');
const FCRACompliance   = require('./models/FCRACompliance');
const FCRAFC4          = require('./models/FCRAFC4');
const FCRAAuditLog     = require('./models/FCRAAuditLog');
const fcraAccounting   = require('./fcra.accounting');

router.use(authenticate);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function nextCode(tableName, column, prefix, padLength = 4) {
  const [rows] = await sequelize.query(
    `SELECT ${column} FROM ${tableName} ORDER BY created_at DESC LIMIT 1`,
    { type: sequelize.QueryTypes.SELECT }
  );
  const last = rows && rows[column];
  let next = 1;
  if (last) {
    const parts = last.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) next = num + 1;
  }
  return `${prefix}${String(next).padStart(padLength, '0')}`;
}

async function nextYearCode(tableName, column, prefix, year, padLength = 5) {
  const [rows] = await sequelize.query(
    `SELECT ${column} FROM ${tableName} WHERE ${column} LIKE '${prefix}${year}-%' ORDER BY created_at DESC LIMIT 1`,
    { type: sequelize.QueryTypes.SELECT }
  );
  const last = rows && rows[column];
  let next = 1;
  if (last) {
    const num = parseInt(last.split('-').pop(), 10);
    if (!isNaN(num)) next = num + 1;
  }
  return `${prefix}${year}-${String(next).padStart(padLength, '0')}`;
}

// Map FCRA local actions to central AUDIT_ACTIONS constants
const FCRA_ACTION_MAP = {
  verify:    AUDIT_ACTIONS.FCRA_RECEIPT_VERIFIED,
  approve:   AUDIT_ACTIONS.FCRA_UTILISATION_APPROVED,
  reject:    AUDIT_ACTIONS.FCRA_UTILISATION_REJECTED,
  create:    AUDIT_ACTIONS.CREATE,
  update:    AUDIT_ACTIONS.UPDATE,
  dispose:   AUDIT_ACTIONS.FCRA_ASSET_DISPOSED,
  complete:  AUDIT_ACTIONS.FCRA_COMPLIANCE_COMPLETED,
  submit:    AUDIT_ACTIONS.FCRA_FC4_SUBMITTED,
};

async function auditLog(tenantId, userId, entityType, entityId, action, oldValues, newValues, req, critical = false, transaction = null) {
  // Write to FCRA-specific audit table (keeps FCRA registration_id linkage, etc.)
  const fcraWrite = FCRAAuditLog.create({
    id: uuidv4(),
    tenant_id: tenantId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    old_values: oldValues,
    new_values: newValues,
    performed_by: userId,
    ip_address: req.ip,
  }, { transaction });

  // Fan-out: also write to central audit_logs so FCRA events appear in unified timeline
  const centralAction = FCRA_ACTION_MAP[action] || AUDIT_ACTIONS.UPDATE;
  const centralWrite = logEvent({
    tenantId,
    userId,
    userEmail: req.user?.email || null,
    userRole:  req.user?.role  || null,
    action:    centralAction,
    entity:    `FCRA_${entityType.toUpperCase()}`,
    entityId,
    before:    oldValues,
    after:     newValues,
    ipAddress: req.ip,
    module:    'fcra',
    critical,
    transaction,
  });

  if (critical) {
    // Await both writes — any failure propagates to the caller and aborts the transaction
    await fcraWrite;
    await centralWrite;
  } else {
    // Non-critical: fire-and-forget, swallow errors so main flow continues
    fcraWrite.catch(() => {});
    centralWrite.catch(() => {});
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get('/dashboard', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { tenantId } = req;
  const year = new Date().getFullYear();
  const fyStart = `${year}-04-01`;
  const fyEnd   = `${year + 1}-03-31`;

  const [
    regCount, receipts, utilisations, projects, donors, overdue, fc4
  ] = await Promise.all([
    FCRARegistration.count({ where: { tenant_id: tenantId, status: 'active' } }),
    FCRAReceipt.findAll({
      where: { tenant_id: tenantId, receipt_date: { [Op.between]: [fyStart, fyEnd] } },
      attributes: ['amount_inr', 'status'],
    }),
    FCRAUtilisation.findAll({
      where: { tenant_id: tenantId, utilization_date: { [Op.between]: [fyStart, fyEnd] }, status: 'approved' },
      attributes: ['amount', 'category'],
    }),
    FCRAProject.count({ where: { tenant_id: tenantId, status: 'active' } }),
    FCRADonor.count({ where: { tenant_id: tenantId, status: 'active' } }),
    FCRACompliance.count({
      where: { tenant_id: tenantId, status: 'overdue' },
    }),
    FCRAFC4.findOne({
      where: { tenant_id: tenantId },
      order: [['created_at', 'DESC']],
      attributes: ['financial_year', 'status', 'admin_cap_percent'],
    }),
  ]);

  const totalReceiptsINR = receipts.reduce((s, r) => s + parseFloat(r.amount_inr || 0), 0);
  const totalUtilized    = utilisations.reduce((s, u) => s + parseFloat(u.amount || 0), 0);
  const adminUtilized    = utilisations
    .filter(u => u.category === 'administrative')
    .reduce((s, u) => s + parseFloat(u.amount || 0), 0);
  const adminCapPct      = totalReceiptsINR > 0 ? (adminUtilized / totalReceiptsINR) * 100 : 0;

  // Upcoming compliance (next 60 days)
  const in60 = new Date();
  in60.setDate(in60.getDate() + 60);
  const upcoming = await FCRACompliance.count({
    where: {
      tenant_id: tenantId,
      status: { [Op.in]: ['pending', 'in_progress'] },
      due_date: { [Op.lte]: in60.toISOString().split('T')[0] },
    },
  });

  res.json({
    data: {
      kpis: {
        total_receipts_inr:  parseFloat(totalReceiptsINR.toFixed(2)),
        total_utilized:      parseFloat(totalUtilized.toFixed(2)),
        available_balance:   parseFloat((totalReceiptsINR - totalUtilized).toFixed(2)),
        admin_cap_pct:       parseFloat(adminCapPct.toFixed(2)),
        admin_cap_breach:    adminCapPct > 20,
        active_registrations: regCount,
        active_projects:     projects,
        active_donors:       donors,
        overdue_compliance:  overdue,
        upcoming_compliance: upcoming,
        fc4_last_status:     fc4?.status || 'not_filed',
        fc4_last_year:       fc4?.financial_year || null,
      },
    },
  });
}));

// ─── Registration ─────────────────────────────────────────────────────────────

router.get('/registration', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const where = { tenant_id: req.tenantId };
  if (status) where.status = status;
  const { count, rows } = await FCRARegistration.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.get('/registration/:id', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const reg = await FCRARegistration.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!reg) return res.status(404).json({ message: 'Registration not found' });
  res.json({ data: reg });
}));

router.post('/registration', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const reg = await FCRARegistration.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    ...req.body,
    created_by: req.user.id,
  });
  auditLog(req.tenantId, req.user.id, 'registration', reg.id, 'create', null, reg.toJSON(), req);

  // Auto-seed standard compliance calendar for new registration
  try {
    const currentFY = (() => {
      const now = new Date();
      const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      return `${fy}-${String(fy + 1).slice(-2)}`;
    })();
    await sequelize.query(
      'SELECT fcra_seed_compliance(:tid, :rid, :fy)',
      { replacements: { tid: req.tenantId, rid: reg.id, fy: currentFY } }
    ).catch(() => {}); // function may not exist yet — safe to ignore
  } catch (_) {}

  res.status(201).json({ data: reg, message: 'FCRA registration created' });
}));

router.put('/registration/:id', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const reg = await FCRARegistration.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!reg) return res.status(404).json({ message: 'Registration not found' });
  const old = reg.toJSON();
  await reg.update(req.body);
  auditLog(req.tenantId, req.user.id, 'registration', reg.id, 'update', old, reg.toJSON(), req);
  res.json({ data: reg, message: 'Registration updated' });
}));

// ─── Bank Accounts ────────────────────────────────────────────────────────────

router.get('/bank-accounts', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, registration_id, account_type, status } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id) where.registration_id = registration_id;
  if (account_type) where.account_type = account_type;
  if (status) where.status = status;
  const { count, rows } = await FCRABankAccount.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.get('/bank-accounts/:id', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const acc = await FCRABankAccount.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!acc) return res.status(404).json({ message: 'Bank account not found' });
  res.json({ data: acc });
}));

router.post('/bank-accounts', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const { account_type, registration_id, bank_name, branch_name } = req.body;

  // Only one active designated account allowed per registration
  if (account_type === 'designated') {
    const existing = await FCRABankAccount.count({
      where: { tenant_id: req.tenantId, registration_id, account_type: 'designated', is_active: true },
    });
    if (existing > 0) {
      return res.status(409).json({
        message: 'A designated bank account already exists for this registration. FCRA permits only one active DBA.',
      });
    }

    // FCRA 2020 amendment: DBA must be SBI (warning, not a hard block)
    const isSBI = /state bank|sbi/i.test(`${bank_name || ''} ${branch_name || ''}`);
    if (!isSBI) {
      // Return 202 with warning instead of blocking — some older registrations use other banks
      // The frontend should surface this warning prominently
      req.dbaNonSBIWarning = 'FCRA 2020 amendment requires designated accounts to be with SBI New Delhi Main Branch. This account does not appear to be SBI.';
    }
  }

  const code = await nextCode('fcra_bank_accounts', 'account_code', 'FCRABA-', 4);
  const acc = await FCRABankAccount.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    account_code: code,
    ...req.body,
    created_by: req.user.id,
  });

  // Update registration designated_bank_count
  if (account_type === 'designated') {
    await FCRARegistration.increment('designated_bank_count', {
      where: { id: registration_id, tenant_id: req.tenantId },
    });
  }

  auditLog(req.tenantId, req.user.id, 'bank_account', acc.id, 'create', null, acc.toJSON(), req);
  res.status(201).json({
    data: acc,
    message: 'Bank account created',
    ...(req.dbaNonSBIWarning ? { warning: req.dbaNonSBIWarning } : {}),
  });
}));

router.put('/bank-accounts/:id', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const acc = await FCRABankAccount.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!acc) return res.status(404).json({ message: 'Bank account not found' });
  const old = acc.toJSON();
  await acc.update(req.body);
  auditLog(req.tenantId, req.user.id, 'bank_account', acc.id, 'update', old, acc.toJSON(), req);
  res.json({ data: acc, message: 'Bank account updated' });
}));

// ─── Donors ───────────────────────────────────────────────────────────────────

router.get('/donors', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, registration_id, country, status, search } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id) where.registration_id = registration_id;
  if (country) where.country = country;
  if (status) where.status = status;
  if (search) where.donor_name = { [Op.iLike]: `%${search}%` };
  const { count, rows } = await FCRADonor.findAndCountAll({
    where,
    order: [['total_contributions', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.get('/donors/:id', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const donor = await FCRADonor.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!donor) return res.status(404).json({ message: 'Donor not found' });
  res.json({ data: donor });
}));

router.post('/donors', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const code = await nextCode('fcra_donors', 'donor_code', 'FD-', 5);
  const donor = await FCRADonor.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    donor_code: code,
    ...req.body,
    created_by: req.user.id,
  });
  auditLog(req.tenantId, req.user.id, 'donor', donor.id, 'create', null, donor.toJSON(), req);
  res.status(201).json({ data: donor, message: 'Donor created' });
}));

router.put('/donors/:id', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const donor = await FCRADonor.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!donor) return res.status(404).json({ message: 'Donor not found' });
  const old = donor.toJSON();
  await donor.update(req.body);
  auditLog(req.tenantId, req.user.id, 'donor', donor.id, 'update', old, donor.toJSON(), req);
  res.json({ data: donor, message: 'Donor updated' });
}));

// ─── Receipts ─────────────────────────────────────────────────────────────────

router.get('/receipts', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, registration_id, donor_id, status, from_date, to_date, currency } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id) where.registration_id = registration_id;
  if (donor_id)        where.donor_id = donor_id;
  if (status)          where.status = status;
  if (currency)        where.currency = currency;
  if (from_date || to_date) {
    where.receipt_date = {};
    if (from_date) where.receipt_date[Op.gte] = from_date;
    if (to_date)   where.receipt_date[Op.lte] = to_date;
  }
  const { count, rows } = await FCRAReceipt.findAndCountAll({
    where,
    order: [['receipt_date', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.get('/receipts/:id', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const r = await FCRAReceipt.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!r) return res.status(404).json({ message: 'Receipt not found' });
  res.json({ data: r });
}));

router.post('/receipts', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const number = await nextYearCode('fcra_receipts', 'receipt_number', 'FCR-', year, 5);
  const receipt = await FCRAReceipt.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    receipt_number: number,
    ...req.body,
    created_by: req.user.id,
  });

  // Update donor total
  await FCRADonor.increment('total_contributions', {
    by: parseFloat(receipt.amount_inr || 0),
    where: { id: receipt.donor_id, tenant_id: req.tenantId },
  });
  await FCRADonor.update(
    { last_contribution_date: receipt.receipt_date },
    { where: { id: receipt.donor_id, tenant_id: req.tenantId } }
  );

  // Update project received amount if linked
  if (receipt.project_id) {
    await FCRAProject.increment('received_amount', {
      by: parseFloat(receipt.amount_inr || 0),
      where: { id: receipt.project_id, tenant_id: req.tenantId },
    });
  }

  auditLog(req.tenantId, req.user.id, 'receipt', receipt.id, 'create', null, receipt.toJSON(), req);
  res.status(201).json({ data: receipt, message: 'Receipt recorded' });
}));

router.put('/receipts/:id', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const r = await FCRAReceipt.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!r) return res.status(404).json({ message: 'Receipt not found' });
  const old = r.toJSON();
  await r.update(req.body);
  auditLog(req.tenantId, req.user.id, 'receipt', r.id, 'update', old, r.toJSON(), req);
  res.json({ data: r, message: 'Receipt updated' });
}));

router.post('/receipts/:id/verify', requirePermission('fcra:approve'), asyncHandler(async (req, res) => {
  const r = await FCRAReceipt.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!r) return res.status(404).json({ message: 'Receipt not found' });

  await sequelize.transaction(async (t) => {
    await r.update({ status: 'verified', verified_by: req.user.id, verified_at: new Date() }, { transaction: t });
    await auditLog(req.tenantId, req.user.id, 'receipt', r.id, 'verify', null, null, req, true, t);
  });

  // Post DR/CR journal (non-blocking, outside transaction so a journal failure does not revert the verification)
  const journal = await fcraAccounting.postReceiptVerified(req.tenantId, r.toJSON(), req.user.id);

  res.json({ data: r, message: 'Receipt verified', journal: journal ? { entry_number: journal.entry_number } : null });
}));

// ─── Projects ─────────────────────────────────────────────────────────────────

router.get('/projects', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, registration_id, status, sector } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id) where.registration_id = registration_id;
  if (status) where.status = status;
  if (sector) where.sector = sector;
  const { count, rows } = await FCRAProject.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.get('/projects/:id', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const p = await FCRAProject.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!p) return res.status(404).json({ message: 'Project not found' });
  res.json({ data: p });
}));

router.post('/projects', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const code = await nextCode('fcra_projects', 'project_code', 'FCP-', 4);
  const proj = await FCRAProject.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    project_code: code,
    ...req.body,
    created_by: req.user.id,
  });
  auditLog(req.tenantId, req.user.id, 'project', proj.id, 'create', null, proj.toJSON(), req);
  res.status(201).json({ data: proj, message: 'Project created' });
}));

router.put('/projects/:id', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const proj = await FCRAProject.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!proj) return res.status(404).json({ message: 'Project not found' });
  const old = proj.toJSON();
  await proj.update(req.body);
  auditLog(req.tenantId, req.user.id, 'project', proj.id, 'update', old, proj.toJSON(), req);
  res.json({ data: proj, message: 'Project updated' });
}));

// ─── Utilisation ──────────────────────────────────────────────────────────────

router.get('/utilisation', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, registration_id, project_id, category, status, from_date, to_date } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id) where.registration_id = registration_id;
  if (project_id)  where.project_id = project_id;
  if (category)    where.category = category;
  if (status)      where.status = status;
  if (from_date || to_date) {
    where.utilization_date = {};
    if (from_date) where.utilization_date[Op.gte] = from_date;
    if (to_date)   where.utilization_date[Op.lte] = to_date;
  }
  const { count, rows } = await FCRAUtilisation.findAndCountAll({
    where,
    order: [['utilization_date', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.get('/utilisation/:id', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const u = await FCRAUtilisation.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!u) return res.status(404).json({ message: 'Utilisation voucher not found' });
  res.json({ data: u });
}));

router.post('/utilisation', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const { registration_id, project_id, amount, category } = req.body;
  const amt = parseFloat(amount || 0);

  // Check available FC balance (total verified receipts - total approved utilisations)
  const [receiptsSum] = await sequelize.query(
    `SELECT COALESCE(SUM(amount_inr), 0) AS total FROM fcra_receipts
     WHERE tenant_id = :tid AND registration_id = :rid
     AND status IN ('verified','partially_utilized','fully_utilized')`,
    { replacements: { tid: req.tenantId, rid: registration_id }, type: sequelize.QueryTypes.SELECT }
  );
  const [utilSum] = await sequelize.query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM fcra_utilisations
     WHERE tenant_id = :tid AND registration_id = :rid AND status = 'approved'`,
    { replacements: { tid: req.tenantId, rid: registration_id }, type: sequelize.QueryTypes.SELECT }
  );
  const available = parseFloat(receiptsSum.total) - parseFloat(utilSum.total);
  if (amt > available) {
    return res.status(422).json({
      message: `Utilisation amount ₹${amt.toLocaleString('en-IN')} exceeds available FC balance ₹${available.toLocaleString('en-IN')}. Cannot create voucher.`,
    });
  }

  // Check project budget if project linked
  if (project_id) {
    const project = await FCRAProject.findOne({ where: { id: project_id, tenant_id: req.tenantId } });
    if (project) {
      const remaining = parseFloat(project.received_amount) - parseFloat(project.utilized_amount);
      if (amt > remaining) {
        return res.status(422).json({
          message: `Utilisation exceeds project budget. Project has ₹${remaining.toLocaleString('en-IN')} remaining.`,
        });
      }
    }
  }

  // Admin cap pre-check (warn at 15%, block draft creation at 19.5% to give approval headroom)
  if (category === 'administrative') {
    const totalReceiptsINR = parseFloat(receiptsSum.total);
    const [adminSum] = await sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM fcra_utilisations
       WHERE tenant_id = :tid AND registration_id = :rid AND status = 'approved' AND category = 'administrative'`,
      { replacements: { tid: req.tenantId, rid: registration_id }, type: sequelize.QueryTypes.SELECT }
    );
    const currentAdminTotal = parseFloat(adminSum.total);
    const newAdminTotal = currentAdminTotal + amt;
    const newAdminPct = totalReceiptsINR > 0 ? (newAdminTotal / totalReceiptsINR) * 100 : 0;

    if (newAdminPct > 20) {
      return res.status(422).json({
        message: `Admin cap breach: this expense would push administrative spending to ${newAdminPct.toFixed(1)}%, exceeding the FCRA 20% limit.`,
        admin_cap_pct: newAdminPct,
      });
    }
    if (newAdminPct > 19) {
      req.adminCapWarning = { level: 'critical', pct: newAdminPct, message: `Critical: admin spending will reach ${newAdminPct.toFixed(1)}% (limit 20%).` };
    } else if (newAdminPct > 15) {
      req.adminCapWarning = { level: 'warn', pct: newAdminPct, message: `Warning: admin spending will reach ${newAdminPct.toFixed(1)}% (limit 20%).` };
    }
  }

  const year = new Date().getFullYear();
  const number = await nextYearCode('fcra_utilisations', 'voucher_number', 'FUV-', year, 5);
  const util = await FCRAUtilisation.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    voucher_number: number,
    ...req.body,
    status: 'draft',
    created_by: req.user.id,
  });
  auditLog(req.tenantId, req.user.id, 'utilisation', util.id, 'create', null, util.toJSON(), req);
  res.status(201).json({
    data: util,
    message: 'Utilisation voucher created',
    ...(req.adminCapWarning ? { warning: req.adminCapWarning } : {}),
  });
}));

router.put('/utilisation/:id', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const util = await FCRAUtilisation.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!util) return res.status(404).json({ message: 'Utilisation voucher not found' });
  if (util.status === 'approved') return res.status(400).json({ message: 'Cannot edit an approved voucher' });
  const old = util.toJSON();
  await util.update(req.body);
  auditLog(req.tenantId, req.user.id, 'utilisation', util.id, 'update', old, util.toJSON(), req);
  res.json({ data: util, message: 'Voucher updated' });
}));

router.post('/utilisation/:id/approve', requirePermission('fcra:approve'), asyncHandler(async (req, res) => {
  const util = await FCRAUtilisation.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!util) return res.status(404).json({ message: 'Utilisation voucher not found' });
  if (util.status === 'approved') return res.status(400).json({ message: 'Already approved' });

  // Admin cap hard enforcement at approval stage
  if (util.category === 'administrative') {
    const [receiptsSum] = await sequelize.query(
      `SELECT COALESCE(SUM(amount_inr), 0) AS total FROM fcra_receipts
       WHERE tenant_id = :tid AND registration_id = :rid
       AND status IN ('verified','partially_utilized','fully_utilized')`,
      { replacements: { tid: req.tenantId, rid: util.registration_id }, type: sequelize.QueryTypes.SELECT }
    );
    const [adminSum] = await sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM fcra_utilisations
       WHERE tenant_id = :tid AND registration_id = :rid AND status = 'approved' AND category = 'administrative'`,
      { replacements: { tid: req.tenantId, rid: util.registration_id }, type: sequelize.QueryTypes.SELECT }
    );
    const totalReceiptsINR = parseFloat(receiptsSum.total);
    const newAdminTotal    = parseFloat(adminSum.total) + parseFloat(util.amount);
    const newAdminPct      = totalReceiptsINR > 0 ? (newAdminTotal / totalReceiptsINR) * 100 : 0;

    if (newAdminPct > 20) {
      return res.status(422).json({
        message: `Cannot approve: this would breach the FCRA 20% administrative cap (${newAdminPct.toFixed(1)}% after approval). Reject or reduce this expense.`,
        admin_cap_pct: newAdminPct,
      });
    }

    const warning = newAdminPct > 19
      ? { level: 'critical', pct: newAdminPct }
      : newAdminPct > 15
        ? { level: 'warn', pct: newAdminPct }
        : null;

    await sequelize.transaction(async (t) => {
      await util.update({ status: 'approved', approved_by: req.user.id, approved_at: new Date() }, { transaction: t });
      await auditLog(req.tenantId, req.user.id, 'utilisation', util.id, 'approve', null, null, req, true, t);
    });

    if (util.project_id) {
      await FCRAProject.increment('utilized_amount', { by: parseFloat(util.amount), where: { id: util.project_id, tenant_id: req.tenantId } });
      await FCRAProject.increment('admin_utilized',  { by: parseFloat(util.amount), where: { id: util.project_id, tenant_id: req.tenantId } });
    }

    const journal = await fcraAccounting.postUtilisationApproved(req.tenantId, util.toJSON(), req.user.id);
    return res.json({ data: util, message: 'Voucher approved', ...(warning ? { warning } : {}), journal: journal ? { entry_number: journal.entry_number } : null });
  }

  // Non-admin category
  await sequelize.transaction(async (t) => {
    await util.update({ status: 'approved', approved_by: req.user.id, approved_at: new Date() }, { transaction: t });
    await auditLog(req.tenantId, req.user.id, 'utilisation', util.id, 'approve', null, null, req, true, t);
  });

  if (util.project_id) {
    await FCRAProject.increment('utilized_amount', { by: parseFloat(util.amount), where: { id: util.project_id, tenant_id: req.tenantId } });
  }

  const journal = await fcraAccounting.postUtilisationApproved(req.tenantId, util.toJSON(), req.user.id);
  res.json({ data: util, message: 'Voucher approved', journal: journal ? { entry_number: journal.entry_number } : null });
}));

router.post('/utilisation/:id/reject', requirePermission('fcra:approve'), asyncHandler(async (req, res) => {
  const util = await FCRAUtilisation.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!util) return res.status(404).json({ message: 'Utilisation voucher not found' });

  await sequelize.transaction(async (t) => {
    await util.update({ status: 'rejected', rejected_by: req.user.id, rejected_at: new Date(), rejection_reason: req.body.reason }, { transaction: t });
    await auditLog(req.tenantId, req.user.id, 'utilisation', util.id, 'reject', null, null, req, true, t);
  });

  res.json({ data: util, message: 'Voucher rejected' });
}));

// ─── Assets ───────────────────────────────────────────────────────────────────

router.get('/assets', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, registration_id, asset_type, status } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id) where.registration_id = registration_id;
  if (asset_type) where.asset_type = asset_type;
  if (status)     where.status = status;
  const { count, rows } = await FCRAAsset.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.post('/assets', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const code = await nextCode('fcra_assets', 'asset_code', 'FCRA-A-', 4);
  const asset = await FCRAAsset.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    asset_code: code,
    ...req.body,
    created_by: req.user.id,
  });
  auditLog(req.tenantId, req.user.id, 'asset', asset.id, 'create', null, asset.toJSON(), req);

  const journal = await fcraAccounting.postAssetPurchased(req.tenantId, asset.toJSON(), req.user.id);
  res.status(201).json({ data: asset, message: 'Asset created', journal: journal ? { entry_number: journal.entry_number } : null });
}));

router.put('/assets/:id', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const asset = await FCRAAsset.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  const old = asset.toJSON();
  await asset.update(req.body);
  auditLog(req.tenantId, req.user.id, 'asset', asset.id, 'update', old, asset.toJSON(), req);
  res.json({ data: asset, message: 'Asset updated' });
}));

// ─── Asset Disposals ──────────────────────────────────────────────────────────

router.get('/asset-disposals', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, registration_id } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id) where.registration_id = registration_id;
  const { count, rows } = await FCRAAssetDisposal.findAndCountAll({
    where,
    order: [['disposal_date', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.post('/asset-disposals', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const code = await nextCode('fcra_asset_disposals', 'disposal_code', 'FCRD-', 4);
  const disposal = await FCRAAssetDisposal.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    disposal_code: code,
    ...req.body,
    created_by: req.user.id,
  });
  const asset = await FCRAAsset.findOne({ where: { id: req.body.asset_id, tenant_id: req.tenantId } });
  await FCRAAsset.update({ status: 'disposed' }, { where: { id: req.body.asset_id, tenant_id: req.tenantId } });
  auditLog(req.tenantId, req.user.id, 'asset_disposal', disposal.id, 'create', null, disposal.toJSON(), req);

  const journal = await fcraAccounting.postAssetDisposal(req.tenantId, disposal.toJSON(), asset?.toJSON(), req.user.id);
  res.status(201).json({ data: disposal, message: 'Asset disposal recorded', journal: journal ? { entry_number: journal.entry_number } : null });
}));

// ─── Asset Income ─────────────────────────────────────────────────────────────

router.get('/asset-income', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, registration_id, asset_id } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id) where.registration_id = registration_id;
  if (asset_id) where.asset_id = asset_id;
  const { count, rows } = await FCRAAssetIncome.findAndCountAll({
    where,
    order: [['income_date', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.post('/asset-income', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const code = await nextCode('fcra_asset_incomes', 'income_code', 'FCRI-', 4);
  const income = await FCRAAssetIncome.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    income_code: code,
    ...req.body,
    created_by: req.user.id,
  });
  auditLog(req.tenantId, req.user.id, 'asset_income', income.id, 'create', null, income.toJSON(), req);

  const journal = await fcraAccounting.postAssetIncome(req.tenantId, income.toJSON(), req.user.id);
  res.status(201).json({ data: income, message: 'Asset income recorded', journal: journal ? { entry_number: journal.entry_number } : null });
}));

// ─── Compliance Calendar ──────────────────────────────────────────────────────

router.get('/compliance', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, registration_id, status, compliance_type, from_date, to_date } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id)   where.registration_id = registration_id;
  if (status)            where.status = status;
  if (compliance_type)   where.compliance_type = compliance_type;
  if (from_date || to_date) {
    where.due_date = {};
    if (from_date) where.due_date[Op.gte] = from_date;
    if (to_date)   where.due_date[Op.lte] = to_date;
  }
  const { count, rows } = await FCRACompliance.findAndCountAll({
    where,
    order: [['due_date', 'ASC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.get('/compliance/:id', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const c = await FCRACompliance.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!c) return res.status(404).json({ message: 'Compliance item not found' });
  res.json({ data: c });
}));

router.post('/compliance', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const item = await FCRACompliance.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    ...req.body,
    created_by: req.user.id,
  });
  auditLog(req.tenantId, req.user.id, 'compliance', item.id, 'create', null, item.toJSON(), req);
  res.status(201).json({ data: item, message: 'Compliance item created' });
}));

router.put('/compliance/:id', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const item = await FCRACompliance.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!item) return res.status(404).json({ message: 'Compliance item not found' });
  const old = item.toJSON();
  await item.update(req.body);
  auditLog(req.tenantId, req.user.id, 'compliance', item.id, 'update', old, item.toJSON(), req);
  res.json({ data: item, message: 'Compliance item updated' });
}));

router.post('/compliance/:id/complete', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const item = await FCRACompliance.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!item) return res.status(404).json({ message: 'Compliance item not found' });
  await item.update({ status: 'completed', completed_date: req.body.completed_date || new Date().toISOString().split('T')[0] });
  auditLog(req.tenantId, req.user.id, 'compliance', item.id, 'update', null, null, req);
  res.json({ data: item, message: 'Marked as completed' });
}));

// ─── FC-4 Filings ─────────────────────────────────────────────────────────────

router.get('/fc4', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { registration_id, status } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id) where.registration_id = registration_id;
  if (status) where.status = status;
  const { count, rows } = await FCRAFC4.findAndCountAll({
    where,
    order: [['financial_year', 'DESC']],
  });
  res.json({ data: rows, total: count });
}));

router.get('/fc4/:id', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const f = await FCRAFC4.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!f) return res.status(404).json({ message: 'FC-4 filing not found' });
  res.json({ data: f });
}));

router.post('/fc4', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const code = await nextCode('fcra_fc4_filings', 'filing_code', 'FC4-', 4);
  const filing = await FCRAFC4.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    filing_code: code,
    ...req.body,
    created_by: req.user.id,
  });
  auditLog(req.tenantId, req.user.id, 'fc4_filing', filing.id, 'create', null, filing.toJSON(), req);
  res.status(201).json({ data: filing, message: 'FC-4 draft created' });
}));

router.put('/fc4/:id', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const filing = await FCRAFC4.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!filing) return res.status(404).json({ message: 'FC-4 filing not found' });
  const old = filing.toJSON();
  await filing.update(req.body);
  auditLog(req.tenantId, req.user.id, 'fc4_filing', filing.id, 'update', old, filing.toJSON(), req);
  res.json({ data: filing, message: 'FC-4 updated' });
}));

// Auto-compute FC-4 financials from actual receipts + utilisations
router.post('/fc4/:id/compute', requirePermission('fcra:write'), asyncHandler(async (req, res) => {
  const filing = await FCRAFC4.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!filing) return res.status(404).json({ message: 'FC-4 not found' });

  const fy = filing.financial_year; // e.g. "2024-25"
  const [startY, endY] = fy.split('-').map(y => parseInt(y));
  const fyStart = `${startY}-04-01`;
  const fyEnd   = `${2000 + (endY % 100)}-03-31`;

  const receipts = await FCRAReceipt.findAll({
    where: {
      tenant_id: req.tenantId,
      registration_id: filing.registration_id,
      status: { [Op.in]: ['verified', 'partially_utilized', 'fully_utilized'] },
      receipt_date: { [Op.between]: [fyStart, fyEnd] },
    },
    attributes: ['amount_inr'],
  });
  const utilisations = await FCRAUtilisation.findAll({
    where: {
      tenant_id: req.tenantId,
      registration_id: filing.registration_id,
      status: 'approved',
      utilization_date: { [Op.between]: [fyStart, fyEnd] },
    },
    attributes: ['amount', 'category'],
  });

  const totalReceipts    = receipts.reduce((s, r) => s + parseFloat(r.amount_inr || 0), 0);
  const adminExpenses    = utilisations.filter(u => u.category === 'administrative').reduce((s, u) => s + parseFloat(u.amount), 0);
  const programmeExpenses = utilisations.filter(u => u.category === 'programme').reduce((s, u) => s + parseFloat(u.amount), 0);
  const capitalExpenses  = utilisations.filter(u => u.category === 'capital').reduce((s, u) => s + parseFloat(u.amount), 0);
  const totalUtilized    = adminExpenses + programmeExpenses + capitalExpenses;

  await filing.update({
    total_receipts_fc: totalReceipts,
    total_utilized_fc: totalUtilized,
    admin_expenses:    adminExpenses,
    programme_expenses: programmeExpenses,
    capital_expenses:  capitalExpenses,
  });

  res.json({ data: filing, message: 'FC-4 financials computed from actual data' });
}));

// ─── Reports ──────────────────────────────────────────────────────────────────

router.get('/reports/receipts-summary', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { registration_id, financial_year } = req.query;
  const year = parseInt((financial_year || `${new Date().getFullYear()}-25`).split('-')[0]);
  const fyStart = `${year}-04-01`;
  const fyEnd   = `${year + 1}-03-31`;
  const where = { tenant_id: req.tenantId, receipt_date: { [Op.between]: [fyStart, fyEnd] } };
  if (registration_id) where.registration_id = registration_id;

  const [byCurrency, byPurpose, byMonth] = await Promise.all([
    sequelize.query(
      `SELECT currency, COUNT(*) as count, SUM(amount) as total_foreign, SUM(amount_inr) as total_inr
       FROM fcra_receipts WHERE tenant_id = :tenantId AND receipt_date BETWEEN :start AND :end
       ${registration_id ? 'AND registration_id = :regId' : ''}
       GROUP BY currency ORDER BY total_inr DESC`,
      { replacements: { tenantId: req.tenantId, start: fyStart, end: fyEnd, regId: registration_id }, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT purpose_code, COUNT(*) as count, SUM(amount_inr) as total_inr
       FROM fcra_receipts WHERE tenant_id = :tenantId AND receipt_date BETWEEN :start AND :end
       ${registration_id ? 'AND registration_id = :regId' : ''}
       GROUP BY purpose_code ORDER BY total_inr DESC`,
      { replacements: { tenantId: req.tenantId, start: fyStart, end: fyEnd, regId: registration_id }, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT TO_CHAR(receipt_date, 'YYYY-MM') as month, COUNT(*) as count, SUM(amount_inr) as total_inr
       FROM fcra_receipts WHERE tenant_id = :tenantId AND receipt_date BETWEEN :start AND :end
       ${registration_id ? 'AND registration_id = :regId' : ''}
       GROUP BY month ORDER BY month`,
      { replacements: { tenantId: req.tenantId, start: fyStart, end: fyEnd, regId: registration_id }, type: sequelize.QueryTypes.SELECT }
    ),
  ]);
  res.json({ data: { by_currency: byCurrency, by_purpose: byPurpose, by_month: byMonth } });
}));

router.get('/reports/utilisation-summary', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { registration_id, financial_year } = req.query;
  const year = parseInt((financial_year || `${new Date().getFullYear()}-25`).split('-')[0]);
  const fyStart = `${year}-04-01`;
  const fyEnd   = `${year + 1}-03-31`;

  const [byCategory, byProject] = await Promise.all([
    sequelize.query(
      `SELECT category, COUNT(*) as count, SUM(amount) as total
       FROM fcra_utilisations WHERE tenant_id = :tenantId AND status = 'approved'
       AND utilization_date BETWEEN :start AND :end
       ${registration_id ? 'AND registration_id = :regId' : ''}
       GROUP BY category`,
      { replacements: { tenantId: req.tenantId, start: fyStart, end: fyEnd, regId: registration_id }, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT p.project_name, p.project_code, SUM(u.amount) as utilized, p.received_amount
       FROM fcra_utilisations u
       JOIN fcra_projects p ON u.project_id = p.id
       WHERE u.tenant_id = :tenantId AND u.status = 'approved'
       AND u.utilization_date BETWEEN :start AND :end
       ${registration_id ? 'AND u.registration_id = :regId' : ''}
       GROUP BY p.id, p.project_name, p.project_code, p.received_amount
       ORDER BY utilized DESC`,
      { replacements: { tenantId: req.tenantId, start: fyStart, end: fyEnd, regId: registration_id }, type: sequelize.QueryTypes.SELECT }
    ),
  ]);
  res.json({ data: { by_category: byCategory, by_project: byProject } });
}));

router.get('/reports/admin-cap', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { registration_id, financial_year } = req.query;
  const year = parseInt((financial_year || `${new Date().getFullYear()}-25`).split('-')[0]);
  const fyStart = `${year}-04-01`;
  const fyEnd   = `${year + 1}-03-31`;
  const where = { tenant_id: req.tenantId, receipt_date: { [Op.between]: [fyStart, fyEnd] } };
  if (registration_id) where.registration_id = registration_id;

  const receipts = await FCRAReceipt.findAll({ where, attributes: ['amount_inr'] });
  const adminUtilisations = await FCRAUtilisation.findAll({
    where: {
      tenant_id: req.tenantId,
      status: 'approved',
      category: 'administrative',
      utilization_date: { [Op.between]: [fyStart, fyEnd] },
      ...(registration_id ? { registration_id } : {}),
    },
    attributes: ['amount'],
  });

  const totalReceipts = receipts.reduce((s, r) => s + parseFloat(r.amount_inr || 0), 0);
  const adminTotal    = adminUtilisations.reduce((s, u) => s + parseFloat(u.amount), 0);
  const adminPct      = totalReceipts > 0 ? (adminTotal / totalReceipts) * 100 : 0;
  const breachAmount  = adminPct > 20 ? adminTotal - (totalReceipts * 0.2) : 0;

  res.json({
    data: {
      total_receipts_inr:  parseFloat(totalReceipts.toFixed(2)),
      admin_utilized:      parseFloat(adminTotal.toFixed(2)),
      admin_cap_pct:       parseFloat(adminPct.toFixed(2)),
      cap_limit:           20,
      is_breached:         adminPct > 20,
      breach_amount:       parseFloat(breachAmount.toFixed(2)),
      remaining_headroom:  parseFloat(Math.max(0, totalReceipts * 0.2 - adminTotal).toFixed(2)),
    },
  });
}));

// ─── AI Context ───────────────────────────────────────────────────────────────

router.get('/ai/context', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { tenantId } = req;
  const year = new Date().getFullYear();
  const fyStart = `${year}-04-01`;
  const fyEnd   = `${year + 1}-03-31`;

  const [registrations, receipts, utilisations, projects, compliance, fc4] = await Promise.all([
    FCRARegistration.findAll({ where: { tenant_id: tenantId }, attributes: ['fcra_number', 'organization_name', 'status', 'valid_upto'] }),
    FCRAReceipt.findAll({
      where: { tenant_id: tenantId, receipt_date: { [Op.between]: [fyStart, fyEnd] } },
      attributes: ['amount_inr', 'currency', 'status'],
    }),
    FCRAUtilisation.findAll({
      where: { tenant_id: tenantId, utilization_date: { [Op.between]: [fyStart, fyEnd] }, status: 'approved' },
      attributes: ['amount', 'category'],
    }),
    FCRAProject.findAll({ where: { tenant_id: tenantId, status: 'active' }, attributes: ['project_name', 'received_amount', 'utilized_amount', 'admin_cap_percent'] }),
    FCRACompliance.findAll({
      where: { tenant_id: tenantId, status: { [Op.in]: ['pending', 'overdue'] } },
      order: [['due_date', 'ASC']],
      limit: 10,
      attributes: ['title', 'compliance_type', 'due_date', 'status'],
    }),
    FCRAFC4.findOne({ where: { tenant_id: tenantId }, order: [['created_at', 'DESC']], attributes: ['financial_year', 'status', 'admin_cap_percent'] }),
  ]);

  const totalReceipts = receipts.reduce((s, r) => s + parseFloat(r.amount_inr || 0), 0);
  const totalUtilized = utilisations.reduce((s, u) => s + parseFloat(u.amount), 0);
  const adminUtilized = utilisations.filter(u => u.category === 'administrative').reduce((s, u) => s + parseFloat(u.amount), 0);

  res.json({
    data: {
      context: {
        registrations: registrations.map(r => r.toJSON()),
        fy_receipts_inr: totalReceipts,
        fy_utilized: totalUtilized,
        fy_balance: totalReceipts - totalUtilized,
        admin_cap_pct: totalReceipts > 0 ? (adminUtilized / totalReceipts) * 100 : 0,
        active_projects: projects.map(p => p.toJSON()),
        pending_compliance: compliance.map(c => c.toJSON()),
        last_fc4: fc4?.toJSON() || null,
      },
    },
  });
}));

router.post('/ai/chat', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ message: 'Message is required' });

  let openaiModule;
  try {
    openaiModule = require('openai');
  } catch {
    return res.json({
      data: {
        reply: 'AI assistant requires OpenAI configuration. Please set OPENAI_API_KEY in your environment.',
      },
    });
  }

  const OpenAI = openaiModule.default || openaiModule;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `You are an FCRA (Foreign Contribution Regulation Act) compliance expert assistant for Indian NGOs.
You help organizations manage their FCRA registrations, foreign receipts, project utilisation, and annual FC-4 filings.
Key rules you enforce: admin expenses cannot exceed 20% of total foreign contributions received; all foreign receipts must be deposited in the designated FCRA account; FC-4 must be filed by 31st December each year.
Current FCRA context: ${JSON.stringify(context || {})}
Be concise, cite specific FCRA rules where relevant, and flag compliance risks.`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
    max_tokens: 800,
    temperature: 0.3,
  });

  res.json({ data: { reply: completion.choices[0].message.content } });
}));

// ─── Accounting / Journal Drill-Down ─────────────────────────────────────────

router.get('/journals/:sourceId', requirePermission('fcra:read'), asyncHandler(async (req, res) => {
  const journals = await fcraAccounting.getJournalsForSource(req.tenantId, req.params.sourceId);
  res.json({ data: journals });
}));

// ─── Audit Log ────────────────────────────────────────────────────────────────

const fcraAuditLogHandler = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, registration_id, entity_type } = req.query;
  const where = { tenant_id: req.tenantId };
  if (registration_id) where.registration_id = registration_id;
  if (entity_type) where.entity_type = entity_type;
  const { count, rows } = await FCRAAuditLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
});

router.get('/audit-log',  requirePermission('fcra:read'), fcraAuditLogHandler);
router.get('/audit-logs', requirePermission('fcra:read'), fcraAuditLogHandler);

module.exports = router;
