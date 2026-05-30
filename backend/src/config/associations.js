'use strict';

/**
 * Sequelize model associations.
 * Called once during server bootstrap after all models are pre-loaded.
 * Defines ORM-level relationships so .include() queries work correctly.
 */
function setupAssociations() {
  const JournalEntry  = require('../modules/core-accounting/models/JournalEntry');
  const JournalLine   = require('../modules/core-accounting/models/JournalLine');
  const PatientInvoice = require('../modules/patient-billing/models/PatientInvoice');
  const Claim         = require('../modules/insurance-tpa/models/Claim');

  // ── JournalEntry ↔ JournalLine ──────────────────────────────────────────────
  JournalEntry.hasMany(JournalLine, { foreignKey: 'journal_entry_id', as: 'lines' });
  JournalLine.belongsTo(JournalEntry, { foreignKey: 'journal_entry_id', as: 'journalEntry' });

  // ── JournalEntry self-reference (reversals) ──────────────────────────────────
  JournalEntry.belongsTo(JournalEntry, { foreignKey: 'reversal_of', as: 'originalEntry' });
  JournalEntry.hasOne(JournalEntry,   { foreignKey: 'reversal_of', as: 'reversalEntry' });

  // ── PatientInvoice ↔ JournalEntry ────────────────────────────────────────────
  PatientInvoice.belongsTo(JournalEntry, { foreignKey: 'journal_entry_id', as: 'journalEntry' });
  JournalEntry.hasMany(PatientInvoice,   { foreignKey: 'journal_entry_id', as: 'patientInvoices' });

  // ── PatientInvoice ↔ Claim ────────────────────────────────────────────────────
  PatientInvoice.belongsTo(Claim, { foreignKey: 'claim_id',    as: 'claim' });
  Claim.belongsTo(PatientInvoice, { foreignKey: 'invoice_id',  as: 'invoice' });

  // ── Claim ↔ JournalEntry ──────────────────────────────────────────────────────
  Claim.belongsTo(JournalEntry,      { foreignKey: 'journal_entry_id', as: 'journalEntry' });
  JournalEntry.hasMany(Claim,        { foreignKey: 'journal_entry_id', as: 'claims' });
}

module.exports = { setupAssociations };
