'use strict';

/**
 * FundTypeValidator — validates that journal lines use accounts consistent
 * with the declared fund type, preventing accidental cross-fund contamination.
 *
 * Rules:
 *   FCRA fund type   → all accounts must have codes starting with 'FCRA-'
 *                       OR be explicitly tagged as 'cross-fund' in their tags JSONB column
 *   All other types  → NO accounts may have codes starting with 'FCRA-'
 *   allowFundMixing  → bypasses all checks
 *
 * @module posting-engine/FundTypeValidator
 */

const { FUND_TYPES } = require('./PostingContract');

// ─── Error Class ──────────────────────────────────────────────────────────────

class FundMixingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FundMixingError';
    this.statusCode = 422;
  }
}

// ─── Validator ────────────────────────────────────────────────────────────────

class FundTypeValidator {
  /**
   * @param {import('sequelize').Sequelize} sequelize
   */
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  /**
   * Validate that all accounts in `lines` are consistent with `fundType`.
   *
   * @param {Object} params
   * @param {string}  params.tenantId
   * @param {string}  params.fundType        - One of FUND_TYPES
   * @param {Array}   params.lines           - Array of { accountId, ... }
   * @param {boolean} [params.allowFundMixing=false] - If true, skip all checks
   * @returns {Promise<{ valid: true }>}
   * @throws {FundMixingError} if a fund-mixing violation is detected
   */
  async validate({ tenantId, fundType, lines, allowFundMixing = false }) {
    if (allowFundMixing) {
      return { valid: true };
    }

    // Collect unique account IDs
    const uniqueAccountIds = [...new Set(lines.map(l => l.accountId).filter(Boolean))];
    if (uniqueAccountIds.length === 0) {
      return { valid: true };
    }

    // Fetch account codes and tags in one query using IN clause with positional params
    const placeholders = uniqueAccountIds.map((_, i) => `:accountId${i}`).join(', ');
    const replacements = { tenantId };
    uniqueAccountIds.forEach((id, i) => {
      replacements[`accountId${i}`] = id;
    });

    const accounts = await this.sequelize.query(
      `SELECT id, code, tags FROM accounts
       WHERE id IN (${placeholders}) AND tenant_id = :tenantId`,
      { replacements, type: this.sequelize.QueryTypes.SELECT }
    );

    // Build a lookup map
    const accountMap = {};
    for (const acc of accounts) {
      accountMap[acc.id] = acc;
    }

    if (fundType === FUND_TYPES.FCRA) {
      // All accounts must start with 'FCRA-' OR be tagged 'cross-fund'
      for (const accountId of uniqueAccountIds) {
        const acc = accountMap[accountId];
        if (!acc) continue; // PrePostValidator will catch missing accounts

        const isFcraCode = acc.code && acc.code.startsWith('FCRA-');
        const tags = this._parseTags(acc.tags);
        const isCrossFund = tags.includes('cross-fund');

        if (!isFcraCode && !isCrossFund) {
          throw new FundMixingError(
            `FundTypeValidator: account '${acc.code}' (id: ${accountId}) is not a valid FCRA account. ` +
            `FCRA postings require accounts with codes starting with 'FCRA-' or tagged as 'cross-fund'.`
          );
        }
      }
    } else {
      // LOCAL, RESTRICTED_GRANT, CORPUS, PROJECT — no FCRA accounts allowed
      for (const accountId of uniqueAccountIds) {
        const acc = accountMap[accountId];
        if (!acc) continue; // PrePostValidator will catch missing accounts

        const isFcraCode = acc.code && acc.code.startsWith('FCRA-');
        if (isFcraCode) {
          throw new FundMixingError(
            `FundTypeValidator: account '${acc.code}' (id: ${accountId}) is an FCRA account ` +
            `but the posting fund type is '${fundType}'. Use FCRA accounts only for FCRA fund postings.`
          );
        }
      }
    }

    return { valid: true };
  }

  /**
   * Parse tags field — handles both JSONB array (already parsed by Sequelize) and raw JSON string.
   * @private
   */
  _parseTags(tags) {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  FundTypeValidator,
  FundMixingError,
};
