'use strict';

const { sequelize } = require('../../../config/database');
const { getReadonlySequelize } = require('../../../config/readonlyDatabase');

/**
 * AI Financial Assistant Service
 *
 * Features:
 * 1. Natural language → SQL query translation
 * 2. Expense categorization
 * 3. Anomaly detection
 * 4. Duplicate invoice detection
 * 5. Revenue leakage detection
 */

let openaiClient = null;

function getOpenAI() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    const { OpenAI } = require('openai');
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// Tables the AI is allowed to query — must match DB_SCHEMA_CONTEXT exactly.
const ALLOWED_TABLES = new Set([
  'patient_invoices', 'journal_entries', 'accounts',
  'claims', 'payroll_runs', 'assets', 'vendor_invoices',
  'fcra_receipts', 'fcra_utilisations', 'fcra_registrations',
  'financial_exceptions', 'period_close_log',
]);

// Database schema context for NL→SQL
const DB_SCHEMA_CONTEXT = `
Hospital Financial Database Schema:
- patient_invoices: id, invoice_number, patient_name, billing_type, invoice_date, net_amount, paid_amount, balance_amount, status, department, treating_doctor_name
- journal_entries: id, entry_number, voucher_type, date, narration, total_debit, total_credit, status, source_module
- accounts: id, code, name, type (ASSET/LIABILITY/EQUITY/INCOME/EXPENSE), current_balance
- claims: id, claim_number, insurer_name, claimed_amount, settled_amount, status, submitted_at
- payroll_runs: id, year, month, total_gross, total_net, total_employees, status
- assets: id, asset_name, purchase_cost, current_book_value, status, department_id
- vendor_invoices: id, vendor_name, invoice_number, net_amount, due_date, status
- fcra_receipts: id, registration_id, donor_name, amount, receipt_date, purpose, country_of_origin, currency
- fcra_utilisations: id, registration_id, utilisation_type (PROGRAMME/ADMIN/ASSET), amount, utilisation_date, project_id, purpose
- fcra_registrations: id, registration_number, organisation_name, status, valid_until
- financial_exceptions: id, exception_type, severity (CRITICAL/HIGH/MEDIUM/LOW), status (OPEN/ACKNOWLEDGED/RESOLVED/DISMISSED), title, source_module, entity_type, created_at
- period_close_log: id, period (YYYY-MM format), action (LOCK/UNLOCK), performed_at, checklist (JSONB)

Additional financial context:
- FCRA = Foreign Contribution Regulation Act. Admin expenses must stay below 20% of FCRA receipts.
- financial_exceptions tracks accounting failures, FCRA cap breaches, reconciliation mismatches, stale claims, budget breaches.
- period_close_log records when accounting periods are locked/unlocked and by whom.
- billing_type in patient_invoices: OP (OPD), IP (IPD), ICU, OT, DAYCARE, PACKAGE, PHARMACY, LAB, RADIOLOGY.
- For FCRA admin cap queries: ratio = admin utilisations / total receipts * 100; threshold = 20%.

All monetary amounts are in INR (Indian Rupees).
Tenant isolation: always filter by tenant_id.
`;

/**
 * Process natural language financial query.
 *
 * @param {string} query - Natural language question
 * @param {string} tenantId
 * @param {Object} userContext
 */
async function processNaturalLanguageQuery(query, tenantId, userContext) {
  const openai = getOpenAI();

  // Store query for analytics
  const { v4: uuidv4 } = require('uuid');
  const queryId = uuidv4();

  try {
    const systemPrompt = `You are a hospital financial data analyst.
Convert the user's question into a PostgreSQL SELECT query.
${DB_SCHEMA_CONTEXT}
Rules:
1. Always add WHERE tenant_id = '${tenantId}' to every table query
2. Never generate UPDATE, INSERT, DELETE, or DDL statements
3. Use aggregations when the user asks for totals, averages, etc.
4. Return ONLY valid SQL, no explanation
5. Limit results to 100 rows unless a specific number is requested
6. For date ranges, use CURRENT_DATE, DATE_TRUNC etc.`;

    const sqlResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Question: ${query}\n\nGenerate SQL query:` },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const generatedSQL = sqlResponse.choices[0]?.message?.content?.trim();

    // Must be a SELECT
    if (!generatedSQL?.toUpperCase().trimStart().startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed');
    }

    const BLOCKED_SQL = /\b(pg_catalog|information_schema|pg_class|pg_proc|SLEEP|BENCHMARK|LOAD_FILE|INTO\s+OUTFILE)\b/i;
    if (BLOCKED_SQL.test(generatedSQL)) {
      throw new Error('Query contains disallowed SQL patterns');
    }

    // Allowlist: only tables declared in DB_SCHEMA_CONTEXT may be queried.
    // Parse every FROM/JOIN token and reject anything outside the list.
    const FROM_JOIN_RE = /\b(?:FROM|JOIN)\s+(\w+)/gi;
    let tableMatch;
    while ((tableMatch = FROM_JOIN_RE.exec(generatedSQL)) !== null) {
      const table = tableMatch[1].toLowerCase();
      if (!ALLOWED_TABLES.has(table)) {
        throw new Error(`Query references unauthorized table: ${table}`);
      }
    }

    // Belt-and-suspenders: the literal tenant UUID must still appear in the SQL.
    // A UUID appearing only in a comment or string is a sign of a malformed query.
    if (!generatedSQL.includes(tenantId)) {
      throw new Error('Generated query is missing required tenant_id filter');
    }

    // Execute on read-only connection inside a transaction so SET LOCAL is scoped.
    // Setting app.current_tenant_id enables PostgreSQL RLS policies to enforce
    // tenant isolation at the DB layer without additional code changes.
    // statement_timeout=10s on the connection cancels the query server-side.
    const roSequelize = getReadonlySequelize();
    let results;
    let txn;
    try {
      txn = await roSequelize.transaction();
      await roSequelize.query(
        `SELECT set_config('app.current_tenant_id', :tenantId, true)`,
        { replacements: { tenantId }, transaction: txn }
      );
      results = await Promise.race([
        roSequelize.query(generatedSQL, { type: roSequelize.QueryTypes.SELECT, transaction: txn }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timed out')), 10_000)),
      ]);
      await txn.commit();
    } catch (dbErr) {
      if (txn) await txn.rollback().catch(() => {});
      throw new Error(`Query execution failed: ${dbErr.message}`);
    }

    // Generate natural language summary of results
    const summaryResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a hospital CFO assistant. Summarize the query results in 2-3 sentences. Be specific with numbers. Format amounts in Indian notation (Lakhs, Crores).',
        },
        {
          role: 'user',
          content: `Question: ${query}\n\nResults: ${JSON.stringify(results.slice(0, 10))}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const summary = summaryResponse.choices[0]?.message?.content?.trim();

    // Store for analytics
    await sequelize.query(
      `INSERT INTO ai_queries (id, tenant_id, query, generated_sql, result_count, summary, user_id, created_at)
       VALUES (:id, :tenantId, :query, :sql, :count, :summary, :userId, NOW())`,
      {
        replacements: {
          id: queryId, tenantId, query, sql: generatedSQL,
          count: results.length, summary, userId: userContext?.id || null,
        },
      }
    ).catch(() => {}); // Non-blocking

    return {
      queryId,
      query,
      sql: generatedSQL,
      results,
      summary,
      rowCount: results.length,
    };
  } catch (err) {
    // Log failed query
    await sequelize.query(
      `INSERT INTO ai_queries (id, tenant_id, query, error, user_id, created_at)
       VALUES (:id, :tenantId, :query, :error, :userId, NOW())`,
      {
        replacements: { id: queryId, tenantId, query, error: err.message, userId: userContext?.id || null },
      }
    ).catch(() => {});

    throw err;
  }
}

/**
 * Detect anomalies in financial data.
 * Returns a list of suspicious patterns.
 */
async function detectAnomalies(tenantId) {
  const anomalies = [];

  // 1. Duplicate invoices — same amount, same patient, same day
  const duplicateInvoices = await sequelize.query(
    `SELECT patient_name, invoice_date, net_amount, COUNT(*) as count,
            array_agg(invoice_number) as invoice_numbers
     FROM patient_invoices
     WHERE tenant_id = :tenantId AND status != 'CANCELLED'
     GROUP BY patient_name, invoice_date, net_amount
     HAVING COUNT(*) > 1`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (duplicateInvoices.length > 0) {
    anomalies.push({
      type: 'DUPLICATE_INVOICE',
      severity: 'HIGH',
      description: `${duplicateInvoices.length} potential duplicate invoices detected`,
      items: duplicateInvoices,
    });
  }

  // 2. Imbalanced journals (should never happen, but check)
  const imbalancedJournals = await sequelize.query(
    `SELECT entry_number, ABS(total_debit - total_credit) as imbalance
     FROM journal_entries
     WHERE tenant_id = :tenantId AND status = 'POSTED'
       AND ABS(total_debit - total_credit) > 0.01
     LIMIT 20`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (imbalancedJournals.length > 0) {
    anomalies.push({
      type: 'IMBALANCED_JOURNAL',
      severity: 'CRITICAL',
      description: `${imbalancedJournals.length} journal entries have DR≠CR imbalance`,
      items: imbalancedJournals,
    });
  }

  // 3. Claims with settlement less than 50% of claimed amount
  const lowSettlements = await sequelize.query(
    `SELECT claim_number, claimed_amount, settled_amount,
            ROUND((settled_amount / NULLIF(claimed_amount, 0)) * 100, 1) as settlement_ratio
     FROM claims
     WHERE tenant_id = :tenantId AND status = 'SETTLED'
       AND (settled_amount / NULLIF(claimed_amount, 0)) < 0.5
     ORDER BY claimed_amount DESC LIMIT 10`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (lowSettlements.length > 0) {
    anomalies.push({
      type: 'LOW_CLAIM_SETTLEMENT',
      severity: 'MEDIUM',
      description: `${lowSettlements.length} claims settled below 50% of claimed amount`,
      items: lowSettlements,
    });
  }

  // 4. Outstanding AR over 90 days
  const oldAR = await sequelize.query(
    `SELECT patient_name, invoice_number, net_amount, balance_amount, invoice_date,
            CURRENT_DATE - invoice_date as days_outstanding
     FROM patient_invoices
     WHERE tenant_id = :tenantId AND status IN ('FINALIZED', 'PARTIALLY_PAID')
       AND invoice_date < CURRENT_DATE - 90
     ORDER BY balance_amount DESC LIMIT 10`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (oldAR.length > 0) {
    anomalies.push({
      type: 'STALE_AR',
      severity: 'HIGH',
      description: `${oldAR.length} invoices outstanding over 90 days`,
      items: oldAR,
    });
  }

  return {
    anomalyCount: anomalies.length,
    anomalies,
    criticalCount: anomalies.filter((a) => a.severity === 'CRITICAL').length,
    highCount: anomalies.filter((a) => a.severity === 'HIGH').length,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate AI insights for CFO dashboard.
 */
async function generateCFOInsights(tenantId, dashboardData) {
  const openai = getOpenAI();

  const prompt = `You are a hospital CFO advisor. Based on this financial summary, provide 3 specific, actionable insights.

Financial Summary:
- Total Revenue YTD: ${dashboardData.revenue?.ytd}
- This Month Revenue: ${dashboardData.revenue?.thisMonth}
- Outstanding AR: ${dashboardData.accountsReceivable?.outstanding}
- Cash Position: ${dashboardData.cashPosition}
- Pending Insurance Claims: ${dashboardData.insurance?.pendingClaims} (${dashboardData.insurance?.pendingCount} claims)
- Accounts Payable: ${dashboardData.accountsPayable}
- FCRA Admin Cap %: ${dashboardData.fcra?.adminCapPct || 'N/A'}
- Open Financial Exceptions: ${dashboardData.exceptions?.open || 0} (Critical: ${dashboardData.exceptions?.critical || 0})
- Period Close Status: Last locked ${dashboardData.periodClose?.lastLocked?.period || 'not yet locked'}

Format your response as 3 bullet points, each starting with an emoji.`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 300,
  });

  return {
    insights: response.choices[0]?.message?.content?.trim(),
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  processNaturalLanguageQuery,
  detectAnomalies,
  generateCFOInsights,
};
