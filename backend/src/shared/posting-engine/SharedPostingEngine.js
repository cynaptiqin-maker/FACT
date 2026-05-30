'use strict';

/**
 * SharedPostingEngine — the unified fund & posting control layer.
 *
 * Sits above accountingEngine.postJournalEntry() and adds:
 *   - Structural validation  (PostingContract)
 *   - Pre-posting checks     (PrePostValidator)
 *   - Fund-type enforcement  (FundTypeValidator)
 *   - Double-entry posting   (accountingEngine)
 *   - Audit logging          (auditLogger, non-blocking)
 *   - Enriched result with reconStatus and postingEvent
 *
 * Usage:
 *   const engine = SharedPostingEngine.create();
 *   const result = await engine.post(contract);
 *
 * @module posting-engine/SharedPostingEngine
 */

const { validatePostingContract, RECON_STATUSES } = require('./PostingContract');
const { PrePostValidator }  = require('./PrePostValidator');
const { FundTypeValidator } = require('./FundTypeValidator');
const { AUDIT_ACTIONS }     = require('../audit/auditLogger');

// ─── Engine ───────────────────────────────────────────────────────────────────

class SharedPostingEngine {
  /**
   * @param {Object} deps
   * @param {import('sequelize').Sequelize} deps.sequelize
   * @param {Object} deps.accountingEngine  - must expose postJournalEntry()
   * @param {Object} deps.auditLogger       - must expose logEvent()
   * @param {Object} [deps.logger]          - winston-compatible logger
   */
  constructor({ sequelize, accountingEngine, auditLogger, logger }) {
    this.sequelize        = sequelize;
    this.accountingEngine = accountingEngine;
    this.auditLogger      = auditLogger;
    this.logger           = logger || console;

    this.prePostValidator  = new PrePostValidator(sequelize);
    this.fundTypeValidator = new FundTypeValidator(sequelize);
  }

  /**
   * Post a journal entry through the full validation and audit pipeline.
   *
   * @param {import('./PostingContract').PostingContract} contract
   * @returns {Promise<Object>} Enriched posting result
   */
  async post(contract) {
    // ── Step 1: Structural validation ─────────────────────────────────────────
    validatePostingContract(contract);

    // ── Step 2: Resolve idempotency key ───────────────────────────────────────
    const idempotencyKey = contract.idempotencyKey || `${contract.sourceModule}:${contract.sourceId}`;

    // ── Step 3: Pre-posting business checks ───────────────────────────────────
    await this.prePostValidator.validate({
      tenantId:       contract.tenantId,
      fundType:       contract.fundType,
      fiscalYearId:   contract.fiscalYearId,
      date:           contract.date,
      sourceModule:   contract.sourceModule,
      sourceId:       contract.sourceId,
      idempotencyKey,
      lines:          contract.lines,
      allowReversal:  contract.allowReversal || false,
    });

    // ── Step 4: Fund-type account validation ──────────────────────────────────
    await this.fundTypeValidator.validate({
      tenantId:        contract.tenantId,
      fundType:        contract.fundType,
      lines:           contract.lines,
      allowFundMixing: contract.allowFundMixing || false,
    });

    // ── Step 5: Double-entry post via existing accounting engine ──────────────
    const result = await this.accountingEngine.postJournalEntry({
      tenantId:           contract.tenantId,
      voucherType:        contract.voucherType,
      date:               contract.date,
      fiscalYearId:       contract.fiscalYearId,
      narration:          contract.narration,
      reference:          contract.reference,
      sourceModule:       contract.sourceModule,
      sourceId:           contract.sourceId,
      postedBy:           contract.postedBy,
      lines:              contract.lines,
      costCenterId:       contract.costCenterId,
      departmentId:       contract.departmentId,
      branchId:           contract.branchId,
      workflowId:         contract.workflowId,
      // Persist fund & reconciliation enrichment to journal_entries row
      fundType:           contract.fundType,
      postingEvent:       contract.postingEvent || null,
      postingExplanation: contract.postingExplanation || null,
      reconStatus:        RECON_STATUSES.UNMATCHED,
    });

    // ── Step 6: Audit logging (non-blocking — never lets audit failure block post) ──
    try {
      await this.auditLogger.logEvent({
        tenantId:  contract.tenantId,
        userId:    contract.postedBy,
        action:    AUDIT_ACTIONS.JOURNAL_POSTED,
        entity:    contract.sourceModule,
        entityId:  contract.sourceId,
        module:    contract.sourceModule,
        metadata: {
          entryNumber:        result.entryNumber,
          fundType:           contract.fundType,
          postingEvent:       contract.postingEvent,
          postingExplanation: contract.postingExplanation,
          idempotencyKey,
        },
      });
    } catch (auditErr) {
      // Audit failure is non-fatal: log the warning and continue
      this.logger.warn
        ? this.logger.warn('SharedPostingEngine: audit logging failed (non-fatal)', {
            error:   auditErr.message,
            sourceModule: contract.sourceModule,
            sourceId:     contract.sourceId,
          })
        : this.logger.warn(`SharedPostingEngine: audit logging failed (non-fatal): ${auditErr.message}`);
    }

    // ── Step 7: Return enriched result ────────────────────────────────────────
    return {
      ...result,
      fundType:           contract.fundType,
      sourceModule:       contract.sourceModule,
      sourceId:           contract.sourceId,
      idempotencyKey,
      postingEvent:       contract.postingEvent || null,
      reconStatus:        RECON_STATUSES.UNMATCHED,
      postingExplanation: contract.postingExplanation || null,
    };
  }

  // ─── Factory ─────────────────────────────────────────────────────────────────

  /**
   * Convenience factory — reads sequelize, accountingEngine, and auditLogger
   * from their canonical shared module paths.
   *
   * @returns {SharedPostingEngine}
   */
  static create() {
    const { sequelize }      = require('../../config/database');
    const accountingEngine   = require('../../shared/accounting-engine');
    const auditLogger        = require('../../shared/audit/auditLogger');
    const logger             = require('../../shared/utils/logger');

    return new SharedPostingEngine({ sequelize, accountingEngine, auditLogger, logger });
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { SharedPostingEngine };
