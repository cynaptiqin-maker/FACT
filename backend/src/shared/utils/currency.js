'use strict';

const Decimal = require('decimal.js');

// Configure for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -20,
  toExpPos: 20,
});

/**
 * FACT Currency Utility
 *
 * All financial calculations use Decimal.js to avoid IEEE 754 floating-point issues.
 * Example: 0.1 + 0.2 = 0.30000000000000004 in plain JS
 *          new Decimal(0.1).plus(0.2) = 0.3
 */

const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
};

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || 'INR';

/**
 * Create a Decimal from a value (safe from null/undefined/NaN).
 */
function toDecimal(value) {
  if (value === null || value === undefined || value === '') return new Decimal(0);
  if (value instanceof Decimal) return value;
  if (typeof value === 'string') value = value.replace(/,/g, '');
  try {
    const d = new Decimal(value);
    if (d.isNaN()) return new Decimal(0);
    return d;
  } catch {
    return new Decimal(0);
  }
}

/**
 * Round to currency's decimal places.
 */
function round(value, currencyCode = DEFAULT_CURRENCY) {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.INR;
  return toDecimal(value).toDecimalPlaces(currency.decimals, Decimal.ROUND_HALF_UP);
}

/**
 * Add two financial values.
 */
function add(a, b) {
  return toDecimal(a).plus(toDecimal(b));
}

/**
 * Subtract b from a.
 */
function subtract(a, b) {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * Multiply with rounding.
 */
function multiply(a, b, currencyCode = DEFAULT_CURRENCY) {
  const result = toDecimal(a).times(toDecimal(b));
  return round(result, currencyCode);
}

/**
 * Divide with rounding.
 */
function divide(a, b, currencyCode = DEFAULT_CURRENCY) {
  const divisor = toDecimal(b);
  if (divisor.isZero()) throw new Error('Division by zero');
  return round(toDecimal(a).dividedBy(divisor), currencyCode);
}

/**
 * Calculate percentage.
 */
function percentage(amount, rate) {
  return toDecimal(amount).times(toDecimal(rate)).dividedBy(100);
}

/**
 * Calculate amount from percentage and base.
 */
function percentageOf(base, rate) {
  return percentage(base, rate);
}

/**
 * Sum an array of values.
 */
function sum(values) {
  return values.reduce((acc, val) => acc.plus(toDecimal(val)), new Decimal(0));
}

/**
 * Format amount for display.
 */
function format(value, currencyCode = DEFAULT_CURRENCY, options = {}) {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const decimal = round(value, currencyCode);
  const { showSymbol = true, showCode = false } = options;

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(parseFloat(decimal.toFixed(currency.decimals)));

  const parts = [];
  if (showSymbol) parts.push(currency.symbol);
  parts.push(formatted);
  if (showCode) parts.push(currency.code);

  return parts.join(' ');
}

/**
 * Convert to fixed string for DB storage (4 decimal places for precision).
 */
function toDBString(value) {
  return toDecimal(value).toFixed(4);
}

/**
 * Convert to display string (2 decimal places).
 */
function toDisplayString(value, currencyCode = DEFAULT_CURRENCY) {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.INR;
  return toDecimal(value).toFixed(currency.decimals);
}

/**
 * Check if amount is zero.
 */
function isZero(value) {
  return toDecimal(value).isZero();
}

/**
 * Check if a > b.
 */
function isGreaterThan(a, b) {
  return toDecimal(a).greaterThan(toDecimal(b));
}

/**
 * Distribute amount proportionally across weights, ensuring sum is exact.
 * Example: distribute(100, [1, 1, 1]) → [33.34, 33.33, 33.33]
 */
function distribute(total, weights, currencyCode = DEFAULT_CURRENCY) {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const decimals = currency.decimals;

  const totalDecimal = toDecimal(total);
  const totalWeight = sum(weights);

  if (totalWeight.isZero()) {
    const equal = divide(totalDecimal, weights.length, currencyCode);
    return weights.map(() => equal);
  }

  const shares = weights.map((w) =>
    toDecimal(w).dividedBy(totalWeight).times(totalDecimal).toDecimalPlaces(decimals, Decimal.ROUND_FLOOR)
  );

  // Distribute remainder to last item to ensure total matches exactly
  const allocated = sum(shares);
  const remainder = totalDecimal.minus(allocated);
  shares[shares.length - 1] = shares[shares.length - 1].plus(remainder);

  return shares;
}

module.exports = {
  Decimal,
  toDecimal,
  round,
  add,
  subtract,
  multiply,
  divide,
  percentage,
  percentageOf,
  sum,
  format,
  toDBString,
  toDisplayString,
  isZero,
  isGreaterThan,
  distribute,
  CURRENCIES,
  DEFAULT_CURRENCY,
};
