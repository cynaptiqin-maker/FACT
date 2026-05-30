'use strict';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const isBetween = require('dayjs/plugin/isBetween');
const quarterOfYear = require('dayjs/plugin/quarterOfYear');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(quarterOfYear);

const DEFAULT_TZ = 'Asia/Kolkata';
const FISCAL_YEAR_START_MONTH = parseInt(process.env.FISCAL_YEAR_START_MONTH, 10) || 4; // April

/**
 * Get current financial year boundaries.
 * Indian fiscal year: April 1 to March 31
 */
function getCurrentFiscalYear(date = new Date()) {
  const d = dayjs(date).tz(DEFAULT_TZ);
  const month = d.month() + 1; // 1-based
  const year = d.year();

  let startYear, endYear;
  if (month >= FISCAL_YEAR_START_MONTH) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }

  return {
    startYear,
    endYear,
    label: `FY ${startYear}-${String(endYear).slice(-2)}`,
    start: dayjs(`${startYear}-${String(FISCAL_YEAR_START_MONTH).padStart(2, '0')}-01`).startOf('day').toDate(),
    end: dayjs(`${endYear}-${String(FISCAL_YEAR_START_MONTH - 1).padStart(2, '0')}-01`)
      .subtract(1, 'day')
      .endOf('day')
      .toDate(),
  };
}

/**
 * Get fiscal quarter for a date.
 */
function getFiscalQuarter(date = new Date()) {
  const d = dayjs(date).tz(DEFAULT_TZ);
  const month = d.month() + 1;

  // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
  const adjustedMonth = ((month - FISCAL_YEAR_START_MONTH + 12) % 12) + 1;
  const quarter = Math.ceil(adjustedMonth / 3);

  return { quarter, label: `Q${quarter}` };
}

/**
 * Get period label for a date (e.g., "Apr 2026").
 */
function getPeriodLabel(date = new Date()) {
  return dayjs(date).tz(DEFAULT_TZ).format('MMM YYYY');
}

/**
 * Get start and end of a month.
 */
function getMonthBounds(year, month) {
  const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('day');
  const end = start.endOf('month');
  return { start: start.toDate(), end: end.toDate() };
}

/**
 * Format date for display.
 */
function formatDate(date, format = 'DD MMM YYYY') {
  if (!date) return '';
  return dayjs(date).tz(DEFAULT_TZ).format(format);
}

/**
 * Format datetime for display.
 */
function formatDateTime(date, format = 'DD MMM YYYY HH:mm') {
  if (!date) return '';
  return dayjs(date).tz(DEFAULT_TZ).format(format);
}

/**
 * Check if a date falls in a date range.
 */
function isInRange(date, start, end) {
  return dayjs(date).isBetween(dayjs(start), dayjs(end), 'day', '[]');
}

/**
 * Add days to a date.
 */
function addDays(date, days) {
  return dayjs(date).add(days, 'day').toDate();
}

/**
 * Days between two dates.
 */
function daysBetween(start, end) {
  return dayjs(end).diff(dayjs(start), 'day');
}

/**
 * Get aging bucket for an outstanding amount.
 */
function getAgingBucket(dueDate) {
  const days = daysBetween(new Date(dueDate), new Date());

  if (days <= 0) return { bucket: 'current', label: 'Current', days };
  if (days <= 30) return { bucket: '0-30', label: '0-30 days', days };
  if (days <= 60) return { bucket: '31-60', label: '31-60 days', days };
  if (days <= 90) return { bucket: '61-90', label: '61-90 days', days };
  if (days <= 180) return { bucket: '91-180', label: '91-180 days', days };
  return { bucket: '180+', label: '180+ days', days };
}

/**
 * Parse ISO date string safely.
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = dayjs(dateStr);
  if (!d.isValid()) return null;
  return d.toDate();
}

/**
 * Get all months in a fiscal year.
 */
function getFiscalYearMonths(startYear) {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const month = ((FISCAL_YEAR_START_MONTH - 1 + i) % 12) + 1;
    const year = month >= FISCAL_YEAR_START_MONTH ? startYear : startYear + 1;
    months.push({
      year,
      month,
      label: dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('MMM YYYY'),
      start: dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('day').toDate(),
      end: dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').toDate(),
    });
  }
  return months;
}

module.exports = {
  dayjs,
  DEFAULT_TZ,
  getCurrentFiscalYear,
  getFiscalQuarter,
  getPeriodLabel,
  getMonthBounds,
  formatDate,
  formatDateTime,
  isInRange,
  addDays,
  daysBetween,
  getAgingBucket,
  parseDate,
  getFiscalYearMonths,
};
