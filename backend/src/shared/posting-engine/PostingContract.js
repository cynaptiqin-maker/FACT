'use strict';

/**
 * PostingContract — constants and structural validation for the Unified Fund & Posting Control Layer.
 *
 * @module posting-engine/PostingContract
 */

// ─── Fund Types ───────────────────────────────────────────────────────────────

const FUND_TYPES = Object.freeze({
  LOCAL:            'LOCAL',
  FCRA:             'FCRA',
  RESTRICTED_GRANT: 'RESTRICTED_GRANT',
  CORPUS:           'CORPUS',
  PROJECT:          'PROJECT',
});

// ─── Reconciliation Statuses ──────────────────────────────────────────────────

const RECON_STATUSES = Object.freeze({
  UNMATCHED:        'UNMATCHED',
  MATCH_SUGGESTED:  'MATCH_SUGGESTED',
  MATCHED:          'MATCHED',
  DISPUTED:         'DISPUTED',
  ADJUSTED:         'ADJUSTED',
  RECONCILED:       'RECONCILED',
});

// ─── Workflow Statuses ────────────────────────────────────────────────────────

const WORKFLOW_STATUSES = Object.freeze({
  DRAFT:      'DRAFT',
  VALIDATED:  'VALIDATED',
  SUBMITTED:  'SUBMITTED',
  APPROVED:   'APPROVED',
  POSTED:     'POSTED',
  RECONCILED: 'RECONCILED',
  CLOSED:     'CLOSED',
  REVERSED:   'REVERSED',
  ADJUSTED:   'ADJUSTED',
});

// ─── Posting Events ───────────────────────────────────────────────────────────

const POSTING_EVENTS = Object.freeze({
  INVOICE_POSTED:              'INVOICE_POSTED',
  VENDOR_INVOICE_POSTED:       'VENDOR_INVOICE_POSTED',
  RECEIPT_POSTED:              'RECEIPT_POSTED',
  PAYMENT_POSTED:              'PAYMENT_POSTED',
  PAYROLL_POSTED:              'PAYROLL_POSTED',
  DEPRECIATION_POSTED:         'DEPRECIATION_POSTED',
  CLAIM_SETTLED:               'CLAIM_SETTLED',
  FCRA_RECEIPT_VERIFIED:       'FCRA_RECEIPT_VERIFIED',
  FCRA_UTILISATION_APPROVED:   'FCRA_UTILISATION_APPROVED',
  FCRA_ASSET_PURCHASED:        'FCRA_ASSET_PURCHASED',
  FCRA_ASSET_DISPOSED:         'FCRA_ASSET_DISPOSED',
  FCRA_ASSET_INCOME:           'FCRA_ASSET_INCOME',
  JOURNAL_MANUAL:              'JOURNAL_MANUAL',
});

// ─── Fund Account Prefixes ────────────────────────────────────────────────────

/**
 * Maps fund type to expected account code prefix/pattern.
 * FCRA accounts must start with 'FCRA-'.
 * All other fund types must NOT have accounts starting with 'FCRA-'.
 */
const FUND_ACCOUNT_PREFIXES = Object.freeze({
  [FUND_TYPES.FCRA]:             { required: 'FCRA-',   forbidden: null },
  [FUND_TYPES.LOCAL]:            { required: null,       forbidden: 'FCRA-' },
  [FUND_TYPES.RESTRICTED_GRANT]: { required: null,       forbidden: 'FCRA-' },
  [FUND_TYPES.CORPUS]:           { required: null,       forbidden: 'FCRA-' },
  [FUND_TYPES.PROJECT]:          { required: null,       forbidden: 'FCRA-' },
});

// ─── PostingContract Shape (JSDoc) ────────────────────────────────────────────

/**
 * @typedef {Object} PostingContract
 * @property {string}  tenantId            - Required UUID of the tenant
 * @property {string}  fundType            - Required, one of FUND_TYPES
 * @property {string}  voucherType         - Required, e.g. 'JOURNAL', 'RECEIPT', 'PAYMENT'
 * @property {string}  date                - Required ISO date string (YYYY-MM-DD)
 * @property {string}  fiscalYearId        - Required UUID of the fiscal year
 * @property {string}  narration           - Required description of the posting
 * @property {string}  sourceModule        - Required, e.g. 'patient-billing', 'fcra', 'payroll'
 * @property {string}  sourceId            - Required UUID of the source record
 * @property {string}  postedBy            - Required UUID of the user posting this entry
 * @property {Array<{accountId: string, debit: number, credit: number, narration?: string}>} lines
 *                                         - Required array of journal lines
 * @property {string}  [reference]         - Optional reference / voucher number
 * @property {string}  [idempotencyKey]    - Optional, defaults to `${sourceModule}:${sourceId}`
 * @property {string}  [workflowId]        - Optional UUID of linked workflow
 * @property {string}  [approvalStatus]    - Optional workflow approval status
 * @property {string}  [postingEvent]      - Optional, one of POSTING_EVENTS
 * @property {Object}  [postingExplanation] - Optional { trigger, approvedBy, ruleApplied, notes }
 * @property {string}  [costCenterId]      - Optional cost centre UUID
 * @property {string}  [departmentId]      - Optional department UUID
 * @property {string}  [branchId]          - Optional branch UUID
 * @property {boolean} [allowFundMixing]   - Optional, default false. Skips fund-type account validation when true
 */

// ─── Structural Validator ─────────────────────────────────────────────────────

/**
 * Validates the required fields of a posting request.
 * Throws a descriptive Error if any field is invalid.
 *
 * @param {PostingContract} params
 * @throws {Error} with descriptive message if validation fails
 */
function validatePostingContract(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('PostingContract: params must be a non-null object');
  }

  const required = ['tenantId', 'fundType', 'voucherType', 'date', 'fiscalYearId', 'narration', 'sourceModule', 'sourceId', 'postedBy', 'lines'];
  for (const field of required) {
    if (params[field] === undefined || params[field] === null || params[field] === '') {
      throw new Error(`PostingContract: '${field}' is required`);
    }
  }

  if (!Object.values(FUND_TYPES).includes(params.fundType)) {
    throw new Error(
      `PostingContract: invalid fundType '${params.fundType}'. Must be one of: ${Object.values(FUND_TYPES).join(', ')}`
    );
  }

  if (!Array.isArray(params.lines)) {
    throw new Error(`PostingContract: 'lines' must be an array`);
  }

  if (params.lines.length === 0) {
    throw new Error(`PostingContract: 'lines' must not be empty`);
  }

  for (let i = 0; i < params.lines.length; i++) {
    const line = params.lines[i];
    if (!line || typeof line !== 'object') {
      throw new Error(`PostingContract: line[${i}] must be an object`);
    }
    if (!line.accountId) {
      throw new Error(`PostingContract: line[${i}].accountId is required`);
    }
    if (typeof line.debit !== 'number' || typeof line.credit !== 'number') {
      throw new Error(`PostingContract: line[${i}].debit and line[${i}].credit must be numbers`);
    }
  }

  if (params.postingEvent && !Object.values(POSTING_EVENTS).includes(params.postingEvent)) {
    throw new Error(
      `PostingContract: invalid postingEvent '${params.postingEvent}'. Must be one of: ${Object.values(POSTING_EVENTS).join(', ')}`
    );
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  FUND_TYPES,
  RECON_STATUSES,
  WORKFLOW_STATUSES,
  POSTING_EVENTS,
  FUND_ACCOUNT_PREFIXES,
  validatePostingContract,
};
