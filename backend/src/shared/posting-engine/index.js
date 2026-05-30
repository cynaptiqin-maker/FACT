'use strict';

/**
 * Unified Fund & Posting Control Layer
 *
 * Central barrel export for the shared posting engine.
 *
 * @module posting-engine
 */

const { SharedPostingEngine }    = require('./SharedPostingEngine');
const { ensureFundTypeColumn }   = require('./fundTypeMigration');

const {
  FUND_TYPES,
  RECON_STATUSES,
  WORKFLOW_STATUSES,
  POSTING_EVENTS,
  FUND_ACCOUNT_PREFIXES,
  validatePostingContract,
} = require('./PostingContract');

const {
  FundTypeValidator,
  FundMixingError,
} = require('./FundTypeValidator');

const {
  PrePostValidator,
  DuplicatePostingError,
  FiscalYearClosedError,
  PeriodLockedError,
  InvalidAccountError,
  ZeroAmountError,
} = require('./PrePostValidator');

module.exports = {
  // Engine
  SharedPostingEngine,

  // Constants
  FUND_TYPES,
  RECON_STATUSES,
  WORKFLOW_STATUSES,
  POSTING_EVENTS,
  FUND_ACCOUNT_PREFIXES,

  // Contract validation
  validatePostingContract,

  // Validators (exported for custom use / testing)
  FundTypeValidator,
  PrePostValidator,

  // Error classes
  FundMixingError,
  DuplicatePostingError,
  FiscalYearClosedError,
  PeriodLockedError,
  InvalidAccountError,
  ZeroAmountError,

  // Schema migration
  ensureFundTypeColumn,
};
