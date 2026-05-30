'use strict';

const express = require('express');
const router  = express.Router();
const { authenticate }       = require('../../../middleware/auth');
const { requirePermission }  = require('../../../middleware/rbac');
const { asyncHandler }       = require('../../../shared/utils/asyncHandler');
const apService              = require('../services/ap.service');
const { getEntityAuditTrail } = require('../../../shared/audit/auditLogger');

router.use(authenticate);

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD & ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/ap/dashboard
 * KPI strip: totals, overdue count, 5-bucket aging summary.
 */
router.get('/dashboard', requirePermission('ap:read'), asyncHandler(async (req, res) => {
  const data = await apService.getAPDashboard(req.tenantId, {
    branchId: req.query.branchId,
  });
  res.json({ success: true, data });
}));

/**
 * GET /api/ap/aging
 * Per-vendor aging breakdown: 5 buckets × vendor.
 */
router.get('/aging', requirePermission('ap:read'), asyncHandler(async (req, res) => {
  const data = await apService.getVendorAging(req.tenantId, {
    branchId: req.query.branchId,
  });
  res.json({ success: true, data, total: data.length });
}));

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR INVOICES — LIST & CREATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/ap/invoices
 * Paginated invoice list with filters.
 *
 * Query params:
 *   status, vendorId, dateFrom, dateTo, dueDateFrom, dueDateTo,
 *   search, isOverdue, branchId, isAccountingPosted, page, limit
 */
router.get('/invoices', requirePermission('ap:read'), asyncHandler(async (req, res) => {
  const {
    status, vendorId, dateFrom, dateTo,
    dueDateFrom, dueDateTo, search, isOverdue,
    branchId, isAccountingPosted, page, limit,
  } = req.query;

  const result = await apService.getVendorInvoices(
    req.tenantId,
    {
      status,
      vendorId,
      dateFrom,
      dateTo,
      dueDateFrom,
      dueDateTo,
      search,
      branchId,
      isOverdue:          isOverdue === 'true',
      isAccountingPosted: isAccountingPosted === undefined
        ? undefined
        : isAccountingPosted === 'true',
    },
    { page, limit }
  );

  res.json({ success: true, ...result });
}));

/**
 * POST /api/ap/invoices
 * Create a vendor invoice (PENDING status — no GL impact yet).
 *
 * Body: {
 *   vendorId, vendorName?, invoiceNumber?, invoiceDate, dueDate?,
 *   netAmount, cgstAmount?, sgstAmount?, igstAmount?,
 *   tdsAmount?, tdsSection?, narration?, expenseAccountCode?,
 *   purchaseOrderId?, fiscalYearId?, branchId?
 * }
 */
router.post('/invoices', requirePermission('ap:write'), asyncHandler(async (req, res) => {
  const result = await apService.createVendorInvoice(
    { ...req.body, tenantId: req.tenantId },
    req.user.id
  );
  res.status(201).json({ success: true, data: result });
}));

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR INVOICES — SINGLE RECORD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/ap/invoices/:id
 * Full invoice detail: header + journal lines + payment history.
 */
router.get('/invoices/:id', requirePermission('ap:read'), asyncHandler(async (req, res) => {
  const invoice = await apService.getVendorInvoiceById(req.params.id, req.tenantId);
  if (!invoice) {
    return res.status(404).json({ success: false, error: 'Vendor invoice not found' });
  }
  res.json({ success: true, data: invoice });
}));

/**
 * GET /api/ap/invoices/:id/audit
 * Full immutable audit trail for a vendor invoice.
 */
router.get('/invoices/:id/audit', requirePermission('ap:read'), asyncHandler(async (req, res) => {
  const trail = await getEntityAuditTrail('VendorInvoice', req.params.id, req.tenantId);
  res.json({ success: true, data: trail });
}));

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/ap/invoices/:id/approve
 * Approve invoice — moves PENDING → APPROVED.
 * Required before posting to GL.
 */
router.post(
  '/invoices/:id/approve',
  requirePermission('ap:approve'),
  asyncHandler(async (req, res) => {
    const result = await apService.approveVendorInvoice(req.params.id, req.tenantId, req.user.id);
    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/ap/invoices/:id/post
 * Post invoice to GL — creates the double-entry journal entry.
 *
 * This is the call that closes the critical gap:
 *   DR  Expense / Input GST
 *       CR  AP-Vendor + TDS Payable
 *
 * Invoice must be in APPROVED or PENDING status.
 */
router.post(
  '/invoices/:id/post',
  requirePermission('ap:post'),
  asyncHandler(async (req, res) => {
    const result = await apService.postVendorInvoice(req.params.id, req.tenantId, req.user.id);
    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/ap/invoices/:id/reverse
 * Reverse a posted invoice — creates a countertransaction, marks as CANCELLED.
 * Invoice must have zero paid_amount (reverse payments first).
 *
 * Body: { reason: string }
 */
router.post(
  '/invoices/:id/reverse',
  requirePermission('ap:reverse'),
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: 'reason is required for reversal' });
    }
    const result = await apService.reverseVendorInvoice(
      req.params.id, req.tenantId, req.user.id, reason
    );
    res.json({ success: true, data: result });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/ap/invoices/:id/payments
 * Record a payment and post it to the GL.
 *
 *   DR  AP-Vendor  (payment_amount)
 *       CR  Bank / Cash
 *
 * Invoice must be posted (is_accounting_posted = true) before payment is allowed.
 *
 * Body: {
 *   amount, paymentMode ('BANK'|'CASH'|'NEFT'|'RTGS'|'CHEQUE'|'UPI'),
 *   referenceNumber?, paymentDate?, bankAccountCode?, narration?
 * }
 */
router.post(
  '/invoices/:id/payments',
  requirePermission('ap:pay'),
  asyncHandler(async (req, res) => {
    const result = await apService.recordVendorPayment(
      { ...req.body, tenantId: req.tenantId, invoiceId: req.params.id },
      req.user.id
    );
    res.status(201).json({ success: true, data: result });
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// VENDORS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/ap/vendors
 * Active vendors list with outstanding AP balance.
 */
router.get('/vendors', requirePermission('ap:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../../config/database');
  const search   = req.query.search ? `%${req.query.search}%` : null;
  const page     = parseInt(req.query.page) || 1;
  const limit    = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset   = (page - 1) * limit;

  const conditions   = ['v.tenant_id = :tenantId AND v.is_active = true'];
  const replacements = { tenantId: req.tenantId, limit, offset };

  if (search) {
    conditions.push('(v.name ILIKE :search OR v.vendor_code ILIKE :search OR v.gstin ILIKE :search)');
    replacements.search = search;
  }
  const where = conditions.join(' AND ');

  const rows = await sequelize.query(
    `SELECT
       v.*,
       COALESCE(SUM(vi.net_amount - COALESCE(vi.tds_amount,0) - COALESCE(vi.paid_amount,0))
         FILTER (WHERE vi.status NOT IN ('PAID','CANCELLED')), 0) AS outstanding_balance,
       COUNT(vi.id) FILTER (WHERE vi.status NOT IN ('PAID','CANCELLED'))  AS open_invoices
     FROM vendors v
     LEFT JOIN vendor_invoices vi ON vi.vendor_id = v.id AND vi.tenant_id = v.tenant_id
     WHERE ${where}
     GROUP BY v.id
     ORDER BY v.name
     LIMIT :limit OFFSET :offset`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );

  res.json({ success: true, data: rows, page, limit });
}));

module.exports = router;
