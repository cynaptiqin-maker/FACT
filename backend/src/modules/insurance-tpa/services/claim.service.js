'use strict';

const { v4: uuidv4 } = require('uuid');
const Decimal = require('decimal.js');
const { sequelize } = require('../../../config/database');
const accountingEngine = require('../../../shared/accounting-engine');
const { logEvent, AUDIT_ACTIONS } = require('../../../shared/audit/auditLogger');
const { eventBus } = require('../../../shared/events/eventBus');
const { EVENT_TYPES } = require('../../../shared/events/eventTypes');
const { getAgingBucket } = require('../../../shared/utils/dateUtils');

/**
 * Insurance Claim Service
 *
 * Settlement Accounting:
 * When claim is settled (insurer pays hospital):
 *   DR  Bank Account                         18,000
 *   DR  Claim Deductions / Write-off          2,000
 *       CR  Accounts Receivable - Insurance  20,000
 *
 * Partial Settlement:
 *   DR  Bank Account                         12,000
 *       CR  Accounts Receivable - Insurance  12,000
 *   (Remaining 8,000 stays outstanding)
 */

const CLAIM_ACCOUNTS = {
  AR_INSURANCE: '1101',
  BANK: '1010',
  CLAIM_WRITEOFF: '5200',  // Expense - Claim Write-offs
  CLAIM_DEDUCTION: '5201', // Expense - Claim Deductions
  DISCOUNT_TPA: '5202',    // Discount - TPA Negotiated
};

/**
 * Generate claim number.
 */
async function generateClaimNumber(tenantId, transaction) {
  const year = new Date().getFullYear();
  const [result] = await sequelize.query(
    `INSERT INTO voucher_sequences (tenant_id, voucher_type, fiscal_year, last_number, created_at, updated_at)
     VALUES (:tenantId, 'CLAIM', :year, 1, NOW(), NOW())
     ON CONFLICT (tenant_id, voucher_type, fiscal_year)
     DO UPDATE SET last_number = voucher_sequences.last_number + 1, updated_at = NOW()
     RETURNING last_number`,
    { replacements: { tenantId, year }, type: sequelize.QueryTypes.INSERT, transaction }
  );
  return `CLM-${year}-${String(result[0].last_number).padStart(6, '0')}`;
}

/**
 * Create a new insurance claim.
 */
async function createClaim(data, userId) {
  const id = uuidv4();

  return sequelize.transaction(async (t) => {
    const claimNumber = await generateClaimNumber(data.tenantId, t);

    await sequelize.query(
      `INSERT INTO claims (
        id, tenant_id, claim_number, patient_id, patient_name, patient_uhid,
        admission_id, invoice_id, insurer_id, tpa_id, policy_id, policy_number, member_id,
        status, claimed_amount, patient_liability,
        admission_date, discharge_date, diagnosis_code, diagnosis_description,
        procedure_code, procedure_description, treating_doctor, ward_type,
        documents, notes, created_by, branch_id, created_at, updated_at
      ) VALUES (
        :id, :tenantId, :claimNumber, :patientId, :patientName, :patientUhid,
        :admissionId, :invoiceId, :insurerId, :tpaId, :policyId, :policyNumber, :memberId,
        'DRAFT', :claimedAmount, :patientLiability,
        :admissionDate, :dischargeDate, :diagnosisCode, :diagnosisDesc,
        :procedureCode, :procedureDesc, :treatingDoctor, :wardType,
        :documents, :notes, :createdBy, :branchId, NOW(), NOW()
      )`,
      {
        replacements: {
          id, tenantId: data.tenantId, claimNumber,
          patientId: data.patientId, patientName: data.patientName, patientUhid: data.patientUhid || null,
          admissionId: data.admissionId || null, invoiceId: data.invoiceId || null,
          insurerId: data.insurerId, tpaId: data.tpaId || null,
          policyId: data.policyId || null, policyNumber: data.policyNumber, memberId: data.memberId || null,
          claimedAmount: data.claimedAmount, patientLiability: data.patientLiability || 0,
          admissionDate: data.admissionDate, dischargeDate: data.dischargeDate,
          diagnosisCode: data.diagnosisCode || null, diagnosisDesc: data.diagnosisDescription || null,
          procedureCode: data.procedureCode || null, procedureDesc: data.procedureDescription || null,
          treatingDoctor: data.treatingDoctor || null, wardType: data.wardType || null,
          documents: JSON.stringify(data.documents || []),
          notes: data.notes || null, createdBy: userId, branchId: data.branchId || null,
        },
        transaction: t,
      }
    );

    return { id, claimNumber, status: 'DRAFT' };
  });
}

/**
 * Advance claim to next status.
 */
async function advanceClaimStatus(claimId, tenantId, newStatus, updateData, userId) {
  const validTransitions = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['UNDER_REVIEW', 'PREAUTH_REQUESTED', 'REJECTED'],
    UNDER_REVIEW: ['PREAUTH_REQUESTED', 'CLAIM_LODGED', 'QUERY_RAISED', 'REJECTED'],
    PREAUTH_REQUESTED: ['PREAUTH_APPROVED', 'PREAUTH_DENIED'],
    PREAUTH_APPROVED: ['CLAIM_LODGED'],
    PREAUTH_DENIED: ['RESUBMITTED', 'WRITTEN_OFF'],
    CLAIM_LODGED: ['QUERY_RAISED', 'PARTIAL_SETTLEMENT', 'SETTLED', 'REJECTED'],
    QUERY_RAISED: ['QUERY_RESPONDED'],
    QUERY_RESPONDED: ['SETTLED', 'PARTIAL_SETTLEMENT', 'REJECTED'],
    PARTIAL_SETTLEMENT: ['SETTLED', 'REJECTED', 'WRITTEN_OFF'],
    REJECTED: ['RESUBMITTED', 'APPEALED', 'WRITTEN_OFF'],
    RESUBMITTED: ['SUBMITTED'],
    APPEALED: ['SETTLED', 'REJECTED'],
    SETTLED: [],
    WRITTEN_OFF: [],
  };

  const [claim] = await sequelize.query(
    `SELECT * FROM claims WHERE id = :claimId AND tenant_id = :tenantId`,
    { replacements: { claimId, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!claim) throw Object.assign(new Error('Claim not found'), { statusCode: 404 });

  const allowed = validTransitions[claim.status] || [];
  if (!allowed.includes(newStatus)) {
    throw Object.assign(
      new Error(`Invalid status transition: ${claim.status} → ${newStatus}`),
      { statusCode: 400 }
    );
  }

  return sequelize.transaction(async (t) => {
    const statusHistory = claim.status_history || [];
    statusHistory.push({
      from: claim.status, to: newStatus,
      date: new Date().toISOString(),
      remarks: updateData?.remarks,
      updatedBy: userId,
    });

    const updateFields = { status: newStatus, status_history: JSON.stringify(statusHistory) };

    if (newStatus === 'SUBMITTED') {
      updateFields.submitted_at = new Date().toISOString();
      updateFields.submitted_by = userId;
      if (updateData?.submissionMethod) updateFields.submission_method = updateData.submissionMethod;
      if (updateData?.tpaClaimNumber) updateFields.tpa_claim_number = updateData.tpaClaimNumber;
    }

    if (newStatus === 'PREAUTH_APPROVED') {
      updateFields.preauth_approved_at = new Date().toISOString();
      updateFields.preauth_number = updateData?.preauthNumber;
      updateFields.preauth_approved_amount = updateData?.preauthApprovedAmount;
    }

    if (newStatus === 'QUERY_RAISED') {
      updateFields.query_details = updateData?.queryDetails;
      updateFields.query_date = new Date().toISOString().split('T')[0];
    }

    if (newStatus === 'SETTLED' || newStatus === 'PARTIAL_SETTLEMENT') {
      await handleSettlement(claim, updateData, tenantId, userId, t);
      const settled = parseFloat(updateData?.settledAmount || claim.claimed_amount);
      updateFields.settled_amount = settled;
      updateFields.settled_at = new Date().toISOString();
      updateFields.settlement_utr = updateData?.settlementUtr;
      updateFields.settlement_date = updateData?.settlementDate;
      updateFields.deduction_amount = updateData?.deductionAmount || 0;
      updateFields.deductions = JSON.stringify(updateData?.deductions || []);

      // Reflect settlement on the linked patient invoice so AR aging stays accurate
      if (claim.invoice_id) {
        await sequelize.query(
          `UPDATE patient_invoices
           SET insurance_share   = LEAST(net_amount, insurance_share + :settled),
               balance_amount    = GREATEST(0, balance_amount - :settled),
               updated_at        = NOW()
           WHERE id = :invoiceId AND tenant_id = :tenantId`,
          { replacements: { settled, invoiceId: claim.invoice_id, tenantId }, transaction: t }
        );
      }
    }

    if (newStatus === 'REJECTED') {
      updateFields.rejection_reason = updateData?.rejectionReason;
      updateFields.rejection_date = new Date().toISOString().split('T')[0];

      // Reverse any insurance_share credited on this claim so the invoice
      // shows the full balance outstanding again
      if (claim.invoice_id && parseFloat(claim.settled_amount || 0) === 0) {
        await sequelize.query(
          `UPDATE patient_invoices
           SET insurance_share   = 0,
               balance_amount    = net_amount - paid_amount,
               updated_at        = NOW()
           WHERE id = :invoiceId AND tenant_id = :tenantId
             AND claim_id = :claimId`,
          { replacements: { invoiceId: claim.invoice_id, tenantId, claimId }, transaction: t }
        );
      }
    }

    if (newStatus === 'WRITTEN_OFF') {
      updateFields.is_written_off = true;
      const writeOffAmount = parseFloat(updateData?.writeOffAmount || claim.claimed_amount);
      updateFields.written_off_amount = writeOffAmount;
      updateFields.written_off_reason = updateData?.reason;

      // Write-off closes the insurance portion on the invoice
      if (claim.invoice_id) {
        await sequelize.query(
          `UPDATE patient_invoices
           SET insurance_share   = LEAST(net_amount, insurance_share + :writeOff),
               balance_amount    = GREATEST(0, balance_amount - :writeOff),
               updated_at        = NOW()
           WHERE id = :invoiceId AND tenant_id = :tenantId`,
          { replacements: { writeOff: writeOffAmount, invoiceId: claim.invoice_id, tenantId }, transaction: t }
        );
      }
    }

    const setClause = Object.keys(updateFields)
      .map((k) => `${k} = :${k}`)
      .join(', ');

    await sequelize.query(
      `UPDATE claims SET ${setClause}, updated_at = NOW() WHERE id = :claimId`,
      { replacements: { ...updateFields, claimId }, transaction: t }
    );

    const eventMap = {
      SUBMITTED: EVENT_TYPES.INSURANCE.CLAIM_SUBMITTED,
      PREAUTH_REQUESTED: EVENT_TYPES.INSURANCE.PREAUTH_REQUESTED,
      PREAUTH_APPROVED: EVENT_TYPES.INSURANCE.PREAUTH_APPROVED,
      SETTLED: EVENT_TYPES.INSURANCE.CLAIM_SETTLEMENT_RECEIVED,
      REJECTED: EVENT_TYPES.INSURANCE.CLAIM_REJECTED,
    };

    if (eventMap[newStatus]) {
      eventBus.publish(eventMap[newStatus], { claimId, tenantId, newStatus, ...updateData });
    }

    return { claimId, previousStatus: claim.status, newStatus };
  });
}

/**
 * Handle settlement accounting posting.
 */
async function handleSettlement(claim, settlementData, tenantId, userId, transaction) {
  const settledAmount = new Decimal(settlementData?.settledAmount || claim.claimed_amount);
  const deductionAmount = new Decimal(settlementData?.deductionAmount || 0);
  const claimedAmount = new Decimal(claim.claimed_amount);

  // Get account IDs
  const getAccountId = async (code) => {
    const [acc] = await sequelize.query(
      `SELECT id FROM accounts WHERE code = :code AND tenant_id = :tenantId`,
      { replacements: { code, tenantId }, type: sequelize.QueryTypes.SELECT, transaction }
    );
    return acc?.id;
  };

  const [bankAccountId, arInsuranceId, writeOffAccountId] = await Promise.all([
    getAccountId(CLAIM_ACCOUNTS.BANK),
    getAccountId(CLAIM_ACCOUNTS.AR_INSURANCE),
    getAccountId(CLAIM_ACCOUNTS.CLAIM_WRITEOFF),
  ]);

  if (!bankAccountId || !arInsuranceId) return; // Skip if accounts not configured

  // Find fiscal year
  const [fy] = await sequelize.query(
    `SELECT id FROM fiscal_years WHERE tenant_id = :tenantId AND status = 'ACTIVE' AND is_current = true`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!fy) return;

  const lines = [
    { accountId: bankAccountId, debit: settledAmount.toFixed(2), credit: 0 },
  ];

  if (deductionAmount.greaterThan(0) && writeOffAccountId) {
    lines.push({ accountId: writeOffAccountId, debit: deductionAmount.toFixed(2), credit: 0 });
  }

  lines.push({ accountId: arInsuranceId, debit: 0, credit: claimedAmount.toFixed(2) });

  const { journalEntryId } = await accountingEngine.postJournalEntry({
    tenantId,
    voucherType: 'RECEIPT',
    date: new Date(),
    fiscalYearId: fy.id,
    narration: `Insurance settlement: ${claim.claim_number} - ${settlementData?.settlementUtr || ''}`,
    reference: settlementData?.settlementUtr || claim.claim_number,
    sourceModule: 'insurance-tpa',
    sourceId: claim.id,
    postedBy: userId,
    lines,
    fundType: 'LOCAL',
    postingEvent: 'CLAIM_SETTLED',
    postingExplanation: {
      rule: 'Insurance claim settlement: DR Bank + DR Write-off / CR AR Insurance',
      module: 'insurance-tpa',
    },
    transaction,
  });

  await sequelize.query(
    `UPDATE claims SET journal_entry_id = :journalEntryId WHERE id = :claimId`,
    { replacements: { journalEntryId, claimId: claim.id }, transaction }
  );

  eventBus.publish(EVENT_TYPES.INSURANCE.SETTLEMENT_POSTED, {
    claimId: claim.id, journalEntryId, tenantId, settledAmount: settledAmount.toFixed(2),
  });
}

/**
 * Get TPA aging analysis.
 */
async function getTPAAgingSummary(tenantId, filters = {}) {
  const { insurerId, tpaId, dateFrom } = filters;

  const conditions = ["c.tenant_id = :tenantId AND c.status NOT IN ('SETTLED', 'WRITTEN_OFF', 'CANCELLED', 'DRAFT')"];
  const replacements = { tenantId };

  if (insurerId) { conditions.push('c.insurer_id = :insurerId'); replacements.insurerId = insurerId; }
  if (tpaId) { conditions.push('c.tpa_id = :tpaId'); replacements.tpaId = tpaId; }
  if (dateFrom) { conditions.push('c.submitted_at >= :dateFrom'); replacements.dateFrom = new Date(dateFrom); }

  const claims = await sequelize.query(
    `SELECT
       c.id, c.claim_number, c.patient_name, c.claimed_amount, c.settled_amount,
       c.pending_amount, c.status, c.submitted_at, c.insurer_id,
       i.name as insurer_name, t.name as tpa_name
     FROM claims c
     LEFT JOIN insurers i ON i.id = c.insurer_id
     LEFT JOIN tpa_companies t ON t.id = c.tpa_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.submitted_at ASC`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );

  // Group by aging bucket
  const buckets = { current: [], '0-30': [], '31-60': [], '61-90': [], '91-180': [], '180+': [] };
  let totalPending = new Decimal(0);

  for (const claim of claims) {
    const { bucket } = getAgingBucket(claim.submitted_at);
    if (buckets[bucket] !== undefined) {
      buckets[bucket].push(claim);
    }
    totalPending = totalPending.plus(new Decimal(claim.claimed_amount || 0).minus(claim.settled_amount || 0));
  }

  return {
    summary: Object.entries(buckets).map(([bucket, items]) => ({
      bucket,
      count: items.length,
      amount: items.reduce((sum, c) => sum + parseFloat(c.claimed_amount || 0), 0).toFixed(2),
    })),
    totalPending: totalPending.toFixed(2),
    totalClaims: claims.length,
    claims,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get claim statistics.
 */
async function getClaimStats(tenantId, { dateFrom, dateTo } = {}) {
  const [stats] = await sequelize.query(
    `SELECT
       COUNT(*) as total_claims,
       SUM(claimed_amount) as total_claimed,
       SUM(settled_amount) as total_settled,
       SUM(deduction_amount) as total_deductions,
       COUNT(*) FILTER (WHERE status = 'SETTLED') as settled_count,
       COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
       COUNT(*) FILTER (WHERE status IN ('SUBMITTED', 'CLAIM_LODGED', 'UNDER_REVIEW')) as pending_count,
       AVG(EXTRACT(DAY FROM (settled_at - submitted_at))) FILTER (WHERE status = 'SETTLED') as avg_settlement_days
     FROM claims
     WHERE tenant_id = :tenantId
       ${dateFrom ? 'AND submitted_at >= :dateFrom' : ''}
       ${dateTo ? 'AND submitted_at <= :dateTo' : ''}`,
    { replacements: { tenantId, dateFrom, dateTo }, type: sequelize.QueryTypes.SELECT }
  );

  return {
    totalClaims: parseInt(stats.total_claims || 0),
    totalClaimed: parseFloat(stats.total_claimed || 0).toFixed(2),
    totalSettled: parseFloat(stats.total_settled || 0).toFixed(2),
    totalDeductions: parseFloat(stats.total_deductions || 0).toFixed(2),
    settledCount: parseInt(stats.settled_count || 0),
    rejectedCount: parseInt(stats.rejected_count || 0),
    pendingCount: parseInt(stats.pending_count || 0),
    averageSettlementDays: parseFloat(stats.avg_settlement_days || 0).toFixed(1),
    collectionRate: stats.total_claimed > 0
      ? ((parseFloat(stats.total_settled || 0) / parseFloat(stats.total_claimed)) * 100).toFixed(1)
      : '0.0',
  };
}

module.exports = {
  createClaim,
  advanceClaimStatus,
  handleSettlement,
  getTPAAgingSummary,
  getClaimStats,
};
