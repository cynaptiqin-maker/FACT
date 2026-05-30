'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const billingService = require('./services/billing.service');
const { asyncHandler } = require('../../shared/utils/asyncHandler');

router.use(authenticate);

// ─── Invoices ─────────────────────────────────────────────────────────────────
router.get('/invoices', requirePermission('billing:read'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, from, to, search, billing_type } = req.query;
  const { PatientInvoice } = require('./models/PatientInvoice');
  const { Op } = require('sequelize');

  const where = { tenant_id: req.tenantId };
  if (status) where.status = status;
  if (billing_type) where.billing_type = billing_type;
  if (from || to) {
    where.invoice_date = {};
    if (from) where.invoice_date[Op.gte] = from;
    if (to) where.invoice_date[Op.lte] = to;
  }
  if (search) {
    where[Op.or] = [
      { invoice_number: { [Op.iLike]: `%${search}%` } },
      { patient_name: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await PatientInvoice.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['invoice_date', 'DESC']],
  });

  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.post('/invoices', requirePermission('billing:write'), asyncHandler(async (req, res) => {
  const invoice = await billingService.createInvoice({ ...req.body, tenantId: req.tenantId, createdBy: req.user.id });
  res.status(201).json({ data: invoice, message: 'Invoice created' });
}));

router.get('/invoices/:id', requirePermission('billing:read'), asyncHandler(async (req, res) => {
  const { PatientInvoice, InvoiceLineItem } = require('./models/PatientInvoice');
  const invoice = await PatientInvoice.findOne({
    where: { id: req.params.id, tenant_id: req.tenantId },
    include: [{ model: InvoiceLineItem, as: 'line_items' }],
  });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  res.json({ data: invoice });
}));

router.post('/invoices/:id/finalize', requirePermission('billing:post'), asyncHandler(async (req, res) => {
  const invoice = await billingService.finalizeInvoice(req.params.id, req.tenantId, req.user.id);
  res.json({ data: invoice, message: 'Invoice finalized and posted to accounting' });
}));

router.post('/invoices/:id/payment', requirePermission('billing:write'), asyncHandler(async (req, res) => {
  const result = await billingService.receivePayment({
    invoiceId: req.params.id,
    tenantId: req.tenantId,
    ...req.body,
    receivedBy: req.user.id,
  });
  res.json({ data: result, message: 'Payment recorded' });
}));

router.post('/invoices/:id/cancel', requirePermission('billing:write'), asyncHandler(async (req, res) => {
  const { PatientInvoice } = require('./models/PatientInvoice');
  await PatientInvoice.update(
    { status: 'CANCELLED', cancellation_reason: req.body.reason },
    { where: { id: req.params.id, tenant_id: req.tenantId } }
  );
  res.json({ message: 'Invoice cancelled' });
}));

// ─── Bulk import invoices from CSV ────────────────────────────────────────────
// Body: { rows: [{ patientName, invoiceNumber, invoiceDate, dueDate, totalAmount, billingType, status }] }
router.post('/invoices/import', requirePermission('billing:write'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ success: false, error: 'rows array is required' });

  const { v4: uuidv4 } = require('uuid');
  const created = []; const errors = [];

  for (const [idx, row] of rows.entries()) {
    const rowNum = idx + 2;
    const { patientName, invoiceNumber, invoiceDate, dueDate, totalAmount, billingType, status } = row;
    if (!patientName || !invoiceDate || !totalAmount) {
      errors.push({ row: rowNum, error: 'patientName, invoiceDate and totalAmount are required' }); continue;
    }
    const amount = Number(totalAmount);
    if (isNaN(amount) || amount < 0) {
      errors.push({ row: rowNum, error: 'totalAmount must be a non-negative number' }); continue;
    }
    try {
      const id = uuidv4();
      const invNo = invoiceNumber || `INV-IMP-${Date.now()}-${idx}`;
      await sequelize.query(
        `INSERT INTO patient_invoices
           (id, tenant_id, invoice_number, patient_name, invoice_date, due_date,
            total_amount, net_amount, paid_amount, balance_amount, billing_type, status, created_at, updated_at)
         VALUES
           (:id, :tenantId, :invoiceNumber, :patientName, :invoiceDate, :dueDate,
            :amount, :amount, 0, :amount, :billingType, :status, NOW(), NOW())
         ON CONFLICT (invoice_number, tenant_id) DO NOTHING`,
        {
          replacements: {
            id, tenantId: req.tenantId, invoiceNumber: invNo,
            patientName, invoiceDate, dueDate: dueDate || null,
            amount, billingType: billingType || 'OP',
            status: status || 'DRAFT',
          },
          type: sequelize.QueryTypes.INSERT,
        }
      );
      created.push(invNo);
    } catch (err) {
      errors.push({ row: rowNum, error: err.message });
    }
  }

  res.json({ success: true, data: { created: created.length, errors } });
}));

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', requirePermission('billing:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [results] = await sequelize.query(`
    SELECT
      COUNT(*) FILTER (WHERE status NOT IN ('CANCELLED')) AS total_invoices,
      SUM(net_amount) FILTER (WHERE status NOT IN ('CANCELLED','DRAFT')) AS total_billed,
      SUM(paid_amount) AS total_collected,
      SUM(balance_amount) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID')) AS total_outstanding,
      COUNT(*) FILTER (WHERE status = 'DRAFT') AS drafts,
      COUNT(*) FILTER (WHERE status = 'FINALIZED') AS pending_payment
    FROM patient_invoices
    WHERE tenant_id = :tenantId
  `, { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT });
  res.json({ data: results });
}));

module.exports = router;
