'use strict';

/**
 * FACT Accounting Engine - Main Orchestrator
 *
 * Exports all accounting engine functionality from a single entry point.
 * This is the primary interface for all modules that need to post financial transactions.
 */

const doubleEntry = require('./doubleEntry');
const journal = require('./journal');
const ledger = require('./ledger');

module.exports = {
  // Double-entry core
  validateEntries: doubleEntry.validateEntries,
  postTransaction: doubleEntry.postTransaction,
  reverseTransaction: doubleEntry.reverseTransaction,
  getTrialBalance: doubleEntry.getTrialBalance,
  ACCOUNT_TYPES: doubleEntry.ACCOUNT_TYPES,
  NORMAL_BALANCE: doubleEntry.NORMAL_BALANCE,

  // Journal management
  generateEntryNumber: journal.generateEntryNumber,
  createJournalEntry: journal.createJournalEntry,
  postJournalEntry: journal.postJournalEntry,
  getJournalEntry: journal.getJournalEntry,
  listJournalEntries: journal.listJournalEntries,
  VOUCHER_TYPES: journal.VOUCHER_TYPES,

  // Ledger queries
  getLedgerBalance: ledger.getLedgerBalance,
  getLedgerStatement: ledger.getLedgerStatement,
  getSubLedgerSummary: ledger.getSubLedgerSummary,
};
