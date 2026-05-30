/**
 * Saga Orchestrator
 *
 * Coordinates multi-step financial workflows across modules using the
 * choreography-based saga pattern. Each step has a forward action and a
 * compensating (rollback) action. If any step fails, all completed steps
 * are rolled back in reverse order.
 *
 * Usage:
 *   const saga = new Saga('InvoicePosting', tenantId)
 *     .step('createJournal', createFn, rollbackCreateFn)
 *     .step('updateARBalance', updateFn, rollbackUpdateFn)
 *     .step('notifyDashboard', notifyFn)    // compensating optional
 *   await saga.execute(context)
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// ─── Status Constants ──────────────────────────────────────────────────────────

const SAGA_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  COMPENSATING: 'COMPENSATING',
  COMPENSATED: 'COMPENSATED',
  FAILED: 'FAILED',
};

// ─── Saga ─────────────────────────────────────────────────────────────────────

class Saga {
  constructor(name, tenantId, options = {}) {
    this.id = uuidv4();
    this.name = name;
    this.tenantId = tenantId;
    this.steps = [];
    this.status = SAGA_STATUS.PENDING;
    this.completedSteps = [];
    this.context = {};
    this.startedAt = null;
    this.completedAt = null;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 500;
    this.onRollbackError = options.onRollbackError || null;
  }

  /**
   * Register a saga step.
   * @param {string} name - Step identifier
   * @param {Function} action - async (context) => result
   * @param {Function} compensate - async (context, stepResult) => void (optional)
   * @param {Object} opts - { retries, critical }
   */
  step(name, action, compensate = null, opts = {}) {
    this.steps.push({
      name,
      action,
      compensate,
      retries: opts.retries ?? this.maxRetries,
      critical: opts.critical ?? true,
    });
    return this;
  }

  /**
   * Execute the saga. Returns { success, context, steps, error? }
   */
  async execute(initialContext = {}) {
    this.context = { ...initialContext, sagaId: this.id };
    this.status = SAGA_STATUS.RUNNING;
    this.startedAt = new Date();

    logger.info(`[Saga:${this.name}] Starting`, {
      sagaId: this.id,
      tenantId: this.tenantId,
      steps: this.steps.map((s) => s.name),
    });

    for (const step of this.steps) {
      const result = await this._executeStep(step);

      if (!result.success) {
        if (step.critical) {
          logger.error(`[Saga:${this.name}] Critical step failed: ${step.name}`, {
            sagaId: this.id,
            error: result.error,
          });
          await this._compensate();
          this.status = SAGA_STATUS.COMPENSATED;
          this.completedAt = new Date();
          return {
            success: false,
            sagaId: this.id,
            context: this.context,
            steps: this.completedSteps,
            error: result.error,
            compensated: true,
          };
        }
        // Non-critical step: log and continue
        logger.warn(`[Saga:${this.name}] Non-critical step failed: ${step.name}`, {
          sagaId: this.id,
          error: result.error,
        });
      }
    }

    this.status = SAGA_STATUS.COMPLETED;
    this.completedAt = new Date();

    logger.info(`[Saga:${this.name}] Completed successfully`, {
      sagaId: this.id,
      durationMs: this.completedAt - this.startedAt,
    });

    return {
      success: true,
      sagaId: this.id,
      context: this.context,
      steps: this.completedSteps,
    };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  async _executeStep(step) {
    let lastError;

    for (let attempt = 1; attempt <= step.retries + 1; attempt++) {
      try {
        const result = await step.action(this.context);
        this.context[`${step.name}Result`] = result;
        this.completedSteps.push({
          name: step.name,
          status: 'COMPLETED',
          result,
          attempt,
        });
        return { success: true, result };
      } catch (err) {
        lastError = err;
        logger.warn(`[Saga:${this.name}] Step ${step.name} attempt ${attempt} failed`, {
          sagaId: this.id,
          error: err.message,
        });

        if (attempt <= step.retries) {
          await this._sleep(this.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    this.completedSteps.push({
      name: step.name,
      status: 'FAILED',
      error: lastError?.message,
    });

    return { success: false, error: lastError };
  }

  async _compensate() {
    this.status = SAGA_STATUS.COMPENSATING;
    const stepsToCompensate = [...this.completedSteps].reverse();

    logger.info(`[Saga:${this.name}] Starting compensation`, {
      sagaId: this.id,
      stepsToCompensate: stepsToCompensate.map((s) => s.name),
    });

    for (const completed of stepsToCompensate) {
      const stepDef = this.steps.find((s) => s.name === completed.name);
      if (!stepDef?.compensate) continue;

      try {
        await stepDef.compensate(this.context, completed.result);
        logger.info(`[Saga:${this.name}] Compensated step: ${completed.name}`, {
          sagaId: this.id,
        });
      } catch (err) {
        logger.error(`[Saga:${this.name}] Compensation FAILED for step: ${completed.name}`, {
          sagaId: this.id,
          error: err.message,
        });
        if (this.onRollbackError) {
          await this.onRollbackError(completed.name, err, this.context);
        }
        // Continue compensating remaining steps even if one fails
      }
    }
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ─── Pre-Built Saga Templates ─────────────────────────────────────────────────

/**
 * Invoice Finalization Saga:
 * Finalize Invoice → Post to AR → Post to GL → Send Notification → Audit
 */
function buildInvoiceFinalizationSaga(tenantId, services) {
  const { billingService, arService, accountingService, notificationService, auditService } =
    services;

  return new Saga('InvoiceFinalization', tenantId)
    .step(
      'finalizeInvoice',
      async (ctx) => billingService.finalizeInvoice(ctx.invoiceId, ctx.userId),
      async (ctx, result) => billingService.revertFinalize(ctx.invoiceId, ctx.userId)
    )
    .step(
      'postToAR',
      async (ctx) => arService.createReceivable(ctx.invoiceId, ctx.finalizeInvoiceResult),
      async (ctx, result) => arService.reverseReceivable(result?.id)
    )
    .step(
      'postToGL',
      async (ctx) =>
        accountingService.postJournal({
          source: 'BILLING',
          sourceId: ctx.invoiceId,
          tenantId: ctx.tenantId,
          lines: ctx.finalizeInvoiceResult?.glLines,
        }),
      async (ctx, result) => accountingService.reverseJournal(result?.journalId, ctx.userId)
    )
    .step(
      'sendNotification',
      async (ctx) =>
        notificationService.send({
          type: 'INVOICE_FINALIZED',
          recipientId: ctx.finalizeInvoiceResult?.billedToUserId,
          payload: { invoiceId: ctx.invoiceId },
        }),
      null, // notification failure is non-critical
      { critical: false }
    )
    .step(
      'auditLog',
      async (ctx) =>
        auditService.log({
          action: 'INVOICE_FINALIZED',
          table: 'patient_invoices',
          recordId: ctx.invoiceId,
          userId: ctx.userId,
          tenantId: ctx.tenantId,
        }),
      null,
      { critical: false }
    );
}

/**
 * Payment Receipt Saga:
 * Record Payment → Update Invoice → Update AR → Post to GL → Update Treasury
 */
function buildPaymentReceiptSaga(tenantId, services) {
  const { billingService, arService, accountingService, treasuryService } = services;

  return new Saga('PaymentReceipt', tenantId)
    .step(
      'recordPayment',
      async (ctx) => billingService.recordPayment(ctx.invoiceId, ctx.payment),
      async (ctx, result) => billingService.reversePayment(result?.paymentId)
    )
    .step(
      'allocateToAR',
      async (ctx) => arService.allocatePayment(ctx.invoiceId, ctx.recordPaymentResult),
      async (ctx, result) => arService.reverseAllocation(result?.allocationId)
    )
    .step(
      'postGLReceipt',
      async (ctx) =>
        accountingService.postJournal({
          source: 'PAYMENT',
          sourceId: ctx.recordPaymentResult?.paymentId,
          tenantId: ctx.tenantId,
          lines: ctx.recordPaymentResult?.glLines,
        }),
      async (ctx, result) => accountingService.reverseJournal(result?.journalId, ctx.userId)
    )
    .step(
      'updateTreasury',
      async (ctx) =>
        treasuryService?.updateCashPosition(ctx.payment.bankAccountId, ctx.payment.amount),
      null,
      { critical: false }
    );
}

/**
 * Claim Settlement Saga:
 * Settle Claim → Update Invoice → Post to AR → Post to GL → Notify
 */
function buildClaimSettlementSaga(tenantId, services) {
  const { claimService, arService, accountingService, notificationService } = services;

  return new Saga('ClaimSettlement', tenantId)
    .step(
      'settleClaim',
      async (ctx) => claimService.settle(ctx.claimId, ctx.settlement),
      async (ctx, result) => claimService.reverseSettlement(ctx.claimId)
    )
    .step(
      'updateARBalance',
      async (ctx) => arService.applyClaimSettlement(ctx.claimId, ctx.settleClaimResult),
      async (ctx, result) => arService.reverseClaimSettlement(result?.id)
    )
    .step(
      'postSettlementGL',
      async (ctx) =>
        accountingService.postJournal({
          source: 'CLAIM_SETTLEMENT',
          sourceId: ctx.claimId,
          tenantId: ctx.tenantId,
          lines: ctx.settleClaimResult?.glLines,
        }),
      async (ctx, result) => accountingService.reverseJournal(result?.journalId, ctx.userId)
    )
    .step(
      'notifySettlement',
      async (ctx) =>
        notificationService.send({
          type: 'CLAIM_SETTLED',
          payload: { claimId: ctx.claimId, amount: ctx.settleClaimResult?.settled_amount },
        }),
      null,
      { critical: false }
    );
}

module.exports = {
  Saga,
  SAGA_STATUS,
  buildInvoiceFinalizationSaga,
  buildPaymentReceiptSaga,
  buildClaimSettlementSaga,
};
