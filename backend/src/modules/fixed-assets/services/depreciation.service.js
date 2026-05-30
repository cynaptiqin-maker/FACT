'use strict';

const Decimal = require('decimal.js');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../../config/database');
const accountingEngine = require('../../../shared/accounting-engine');
const { logEvent, AUDIT_ACTIONS } = require('../../../shared/audit/auditLogger');
const { eventBus } = require('../../../shared/events/eventBus');
const { EVENT_TYPES } = require('../../../shared/events/eventTypes');

/**
 * Depreciation Engine
 *
 * SLM (Straight Line Method):
 *   Annual Depreciation = (Cost - Salvage Value) / Useful Life
 *   Monthly Depreciation = Annual / 12
 *
 * WDV (Written Down Value / Declining Balance):
 *   Annual Depreciation = Current Book Value × Rate%
 *   Monthly Depreciation = Annual / 12
 *
 * Accounting Entry per asset per month:
 *   DR  Depreciation Expense          1,000
 *       CR  Accumulated Depreciation  1,000
 */

/**
 * Calculate monthly depreciation for one asset.
 */
function calculateMonthlyDepreciation(asset) {
  const totalCost = new Decimal(asset.total_cost || 0);
  const salvageValue = new Decimal(asset.salvage_value || 0);
  const currentBookValue = new Decimal(asset.current_book_value || totalCost);
  const method = asset.depreciation_method;

  if (method === 'NONE' || !asset.useful_life_years) {
    return { monthlyAmount: new Decimal(0), annualAmount: new Decimal(0), method };
  }

  if (currentBookValue.lessThanOrEqualTo(salvageValue)) {
    return { monthlyAmount: new Decimal(0), annualAmount: new Decimal(0), method, fullyDepreciated: true };
  }

  let annualDepreciation;

  if (method === 'SLM') {
    const depreciableAmount = totalCost.minus(salvageValue);
    const usefulLife = new Decimal(asset.useful_life_years);
    annualDepreciation = depreciableAmount.dividedBy(usefulLife);
  } else if (method === 'WDV') {
    const rate = new Decimal(asset.depreciation_rate || 0).dividedBy(100);
    annualDepreciation = currentBookValue.times(rate);
  } else {
    annualDepreciation = new Decimal(0);
  }

  const monthlyDepreciation = annualDepreciation.dividedBy(12);

  // Ensure we don't depreciate below salvage value
  const maxMonthly = currentBookValue.minus(salvageValue);
  const finalMonthly = monthlyDepreciation.greaterThan(maxMonthly) ? maxMonthly : monthlyDepreciation;

  return {
    method,
    annualAmount: annualDepreciation.toDecimalPlaces(2),
    monthlyAmount: finalMonthly.toDecimalPlaces(2),
    currentBookValue: currentBookValue.toFixed(2),
    salvageValue: salvageValue.toFixed(2),
    rate: asset.depreciation_rate,
  };
}

/**
 * Run monthly depreciation for all assets in a tenant.
 *
 * @param {string} tenantId
 * @param {number} year - Year to run depreciation for
 * @param {number} month - Month (1-12)
 * @param {string} userId - Who triggered the run
 * @param {string} fiscalYearId
 */
async function runMonthlyDepreciation(tenantId, year, month, userId, fiscalYearId) {
  // Check if already run for this month
  const [existingRun] = await sequelize.query(
    `SELECT id FROM depreciation_runs
     WHERE tenant_id = :tenantId AND fiscal_year = :year AND period_month = :month AND status = 'COMPLETED'`,
    { replacements: { tenantId, year, month }, type: sequelize.QueryTypes.SELECT }
  );

  if (existingRun) {
    throw Object.assign(new Error(`Depreciation already run for ${year}-${month}`), { statusCode: 409 });
  }

  // Get all active depreciable assets
  const assets = await sequelize.query(
    `SELECT a.*, ac.asset_account_id as default_dep_expense_account,
            ac.accumulated_depreciation_account_id as default_accum_dep_account
     FROM assets a
     LEFT JOIN asset_categories ac ON ac.id = a.category_id
     WHERE a.tenant_id = :tenantId AND a.status = 'ACTIVE'
       AND a.depreciation_method != 'NONE'
       AND a.capitalization_date IS NOT NULL
       AND a.capitalization_date <= MAKE_DATE(:year, :month, 28)`,
    { replacements: { tenantId, year, month }, type: sequelize.QueryTypes.SELECT }
  );

  const runId = uuidv4();
  const runDate = new Date(year, month - 1, 28); // Last working day of month

  // Create run record
  await sequelize.query(
    `INSERT INTO depreciation_runs (id, tenant_id, fiscal_year, period_month, run_date, status,
     total_assets, initiated_by, created_at, updated_at)
     VALUES (:id, :tenantId, :year, :month, :runDate, 'PROCESSING', :totalAssets, :initiatedBy, NOW(), NOW())`,
    { replacements: { id: runId, tenantId, year, month, runDate, totalAssets: assets.length, initiatedBy: userId } }
  );

  const results = [];
  let totalDepreciation = new Decimal(0);
  let errorCount = 0;

  for (const asset of assets) {
    try {
      const depCalc = calculateMonthlyDepreciation(asset);
      if (depCalc.monthlyAmount.isZero()) continue;

      const depAmount = depCalc.monthlyAmount;
      totalDepreciation = totalDepreciation.plus(depAmount);

      const newBookValue = new Decimal(asset.current_book_value).minus(depAmount);
      const newAccumDep = new Decimal(asset.accumulated_depreciation || 0).plus(depAmount);

      await sequelize.transaction(async (t) => {
        // Create schedule record
        const scheduleId = uuidv4();
        await sequelize.query(
          `INSERT INTO depreciation_schedules (id, asset_id, tenant_id, run_id, period_year, period_month,
           depreciation_amount, accumulated_depreciation, book_value_before, book_value_after,
           method, created_at, updated_at)
           VALUES (:id, :assetId, :tenantId, :runId, :year, :month,
           :depAmount, :accumDep, :bookBefore, :bookAfter, :method, NOW(), NOW())`,
          {
            replacements: {
              id: scheduleId, assetId: asset.id, tenantId, runId, year, month,
              depAmount: depAmount.toFixed(2),
              accumDep: newAccumDep.toFixed(2),
              bookBefore: asset.current_book_value,
              bookAfter: newBookValue.toFixed(2),
              method: depCalc.method,
            },
            transaction: t,
          }
        );

        // Update asset book value
        await sequelize.query(
          `UPDATE assets SET
           current_book_value = :newBookValue,
           accumulated_depreciation = :newAccumDep,
           last_depreciation_date = :runDate,
           updated_at = NOW()
           WHERE id = :assetId`,
          { replacements: { newBookValue: newBookValue.toFixed(2), newAccumDep: newAccumDep.toFixed(2), runDate, assetId: asset.id }, transaction: t }
        );

        // Post journal entry for this asset
        const depExpenseAccountId = asset.depreciation_account_id || asset.default_dep_expense_account;
        const accumDepAccountId = asset.accumulated_dep_account_id || asset.default_accum_dep_account;

        if (depExpenseAccountId && accumDepAccountId) {
          await accountingEngine.postJournalEntry({
            tenantId,
            voucherType: 'JOURNAL',
            date: runDate,
            fiscalYearId,
            narration: `Depreciation: ${asset.asset_name} - ${year}-${String(month).padStart(2, '0')}`,
            sourceModule: 'fixed-assets',
            sourceId: runId,
            postedBy: userId,
            lines: [
              { accountId: depExpenseAccountId, debit: depAmount.toFixed(2), credit: 0 },
              { accountId: accumDepAccountId, debit: 0, credit: depAmount.toFixed(2) },
            ],
            fundType: 'LOCAL',
            postingEvent: 'DEPRECIATION_POSTED',
            postingExplanation: {
              rule: 'Asset depreciation: DR Depreciation Expense / CR Accumulated Depreciation',
              module: 'fixed-assets',
              assetId: asset.id,
            },
            transaction: t,
          });
        }
      });

      results.push({
        assetId: asset.id, assetCode: asset.asset_code,
        depreciationAmount: depAmount.toFixed(2), newBookValue: newBookValue.toFixed(2),
      });
    } catch (err) {
      errorCount++;
      results.push({ assetId: asset.id, error: err.message });
    }
  }

  // Update run status
  await sequelize.query(
    `UPDATE depreciation_runs SET status = 'COMPLETED', completed_at = NOW(),
     total_depreciation = :totalDep, error_count = :errorCount, updated_at = NOW()
     WHERE id = :runId`,
    { replacements: { totalDep: totalDepreciation.toFixed(2), errorCount, runId } }
  );

  eventBus.publish(EVENT_TYPES.ASSETS.DEPRECIATION_RUN, {
    runId, tenantId, year, month, totalDepreciation: totalDepreciation.toFixed(2), assetCount: assets.length,
  });

  return {
    runId,
    period: `${year}-${String(month).padStart(2, '0')}`,
    totalAssets: assets.length,
    totalDepreciation: totalDepreciation.toFixed(2),
    errorCount,
    results,
  };
}

/**
 * Get depreciation schedule for an asset.
 */
async function getAssetDepreciationSchedule(assetId, tenantId) {
  const [asset] = await sequelize.query(
    `SELECT * FROM assets WHERE id = :assetId AND tenant_id = :tenantId`,
    { replacements: { assetId, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });

  const schedule = [];
  let bookValue = new Decimal(asset.total_cost || 0);
  const salvage = new Decimal(asset.salvage_value || 0);
  const usefulLife = parseFloat(asset.useful_life_years || 5);
  const capitalizationDate = asset.capitalization_date ? new Date(asset.capitalization_date) : new Date();

  for (let month = 0; month < usefulLife * 12; month++) {
    const periodDate = new Date(capitalizationDate.getFullYear(), capitalizationDate.getMonth() + month, 1);
    const calc = calculateMonthlyDepreciation({ ...asset, current_book_value: bookValue.toFixed(2) });

    if (calc.monthlyAmount.isZero() || bookValue.lessThanOrEqualTo(salvage)) break;

    bookValue = bookValue.minus(calc.monthlyAmount);

    schedule.push({
      period: `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`,
      depreciation: calc.monthlyAmount.toFixed(2),
      bookValue: bookValue.toFixed(2),
    });
  }

  return { asset, schedule };
}

module.exports = {
  calculateMonthlyDepreciation,
  runMonthlyDepreciation,
  getAssetDepreciationSchedule,
};
