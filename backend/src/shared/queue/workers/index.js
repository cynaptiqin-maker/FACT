'use strict';

const { createWorker, QUEUE_NAMES } = require('../../../config/redis');
const logger = require('../../utils/logger');

// ─── Accounting Worker ────────────────────────────────────────────────────────
async function startAccountingWorker() {
  return createWorker(QUEUE_NAMES.ACCOUNTING, async (job) => {
    const { name, data } = job;
    logger.info('Processing accounting job', { name, jobId: job.id });

    switch (name) {
      case 'post-journal': {
        const { postJournalEntry } = require('../../accounting-engine/journal');
        await postJournalEntry(data);
        break;
      }
      case 'recalculate-balances': {
        logger.info('Recalculating balances for tenant', { tenantId: data.tenantId });
        break;
      }
      default:
        logger.warn('Unknown accounting job', { name });
    }
  });
}

// ─── Report Worker ────────────────────────────────────────────────────────────
async function startReportWorker() {
  return createWorker(QUEUE_NAMES.REPORT, async (job) => {
    const { name, data } = job;
    logger.info('Processing report job', { name, jobId: job.id });

    const reportService = require('../../../modules/reporting/services/report.service');
    switch (name) {
      case 'generate-pl':
        await reportService.generatePL(data.tenantId, data.fromDate, data.toDate, data.filters);
        break;
      case 'generate-balance-sheet':
        await reportService.generateBalanceSheet(data.tenantId, data.asOfDate, data.filters);
        break;
      default:
        logger.warn('Unknown report job', { name });
    }
  });
}

// ─── Depreciation Worker ──────────────────────────────────────────────────────
async function startDepreciationWorker() {
  return createWorker(QUEUE_NAMES.DEPRECIATION, async (job) => {
    const { name, data } = job;
    logger.info('Processing depreciation job', { name, jobId: job.id });

    const depService = require('../../../modules/fixed-assets/services/depreciation.service');
    switch (name) {
      case 'run-monthly-depreciation':
        await depService.runMonthlyDepreciation(data.tenantId, data.period, data.postedBy);
        break;
      default:
        logger.warn('Unknown depreciation job', { name });
    }
  });
}

// ─── AI Worker ────────────────────────────────────────────────────────────────
async function startAIWorker() {
  return createWorker(QUEUE_NAMES.AI, async (job) => {
    const { name, data } = job;
    logger.info('Processing AI job', { name, jobId: job.id });

    const aiService = require('../../../modules/ai-engine/services/aiAssistant.service');
    switch (name) {
      case 'detect-anomalies':
        if (data.tenantId) await aiService.detectAnomalies(data.tenantId);
        break;
      default:
        logger.warn('Unknown AI job', { name });
    }
  });
}

// ─── Payroll Worker ───────────────────────────────────────────────────────────
async function startPayrollWorker() {
  return createWorker(QUEUE_NAMES.PAYROLL, async (job) => {
    const { name, data } = job;
    logger.info('Processing payroll job', { name, jobId: job.id });

    const payrollService = require('../../../modules/payroll/services/payroll.service');
    switch (name) {
      case 'run-payroll':
        await payrollService.runPayroll(data.tenantId, data.period, data.initiatedBy);
        break;
      case 'post-payroll-accounting':
        await payrollService.postPayrollToAccounting(data.runId, data.tenantId, data.postedBy);
        break;
      default:
        logger.warn('Unknown payroll job', { name });
    }
  });
}

// ─── Notification Worker ──────────────────────────────────────────────────────
async function startNotificationWorker() {
  return createWorker(QUEUE_NAMES.NOTIFICATION, async (job) => {
    const { name, data } = job;
    logger.info('Processing notification job', { name, jobId: job.id });
    // Notification implementations: email/sms via nodemailer/twilio
    // Stub: just log for now
    logger.debug('Notification job processed', { name, recipient: data.recipient });
  });
}

// ─── Scheduled Reports Worker ─────────────────────────────────────────────────
async function startScheduledReportsWorker() {
  return createWorker(QUEUE_NAMES.REPORT, async (job) => {
    const { name, data } = job;
    if (!name.startsWith('scheduled-')) return; // only handle scheduled jobs

    const reportService = require('../../../modules/reporting/services/report.service');
    const { getFinancialHealthEngine } = require('../../../modules/reporting/services/FinancialHealthEngine');
    const { sequelize } = require('../../../config/database');
    const engine = getFinancialHealthEngine(sequelize);

    logger.info(`Running scheduled report: ${name}`, { tenantId: data.tenantId });

    switch (name) {
      case 'scheduled-daily-cfo-summary': {
        const [dashboard, health] = await Promise.all([
          reportService.getCFODashboard(data.tenantId),
          engine.computeHealthScore(data.tenantId),
        ]);
        logger.info('Daily CFO summary generated', { tenantId: data.tenantId, healthScore: health.overallScore });
        break;
      }
      case 'scheduled-weekly-collections': {
        const to = new Date().toISOString().slice(0, 10);
        const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        await reportService.generatePL(data.tenantId, from, to, {});
        logger.info('Weekly collections report generated', { tenantId: data.tenantId, from, to });
        break;
      }
      case 'scheduled-monthly-board-pack': {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
        const to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
        const [pl, bs, cf] = await Promise.all([
          reportService.generatePL(data.tenantId, from, to, {}),
          reportService.generateBalanceSheet(data.tenantId, to, {}),
          reportService.generateCashFlow(data.tenantId, from, to),
        ]);
        logger.info('Monthly board pack generated', { tenantId: data.tenantId, period: `${from} to ${to}` });
        break;
      }
      default:
        logger.warn('Unknown scheduled report job', { name });
    }
  });
}

// ─── Start All Workers ────────────────────────────────────────────────────────
async function startAllWorkers() {
  const workers = [];

  const workerStartFunctions = [
    { name: 'accounting', fn: startAccountingWorker },
    { name: 'report', fn: startReportWorker },
    { name: 'depreciation', fn: startDepreciationWorker },
    { name: 'ai', fn: startAIWorker },
    { name: 'payroll', fn: startPayrollWorker },
    { name: 'notification', fn: startNotificationWorker },
    { name: 'scheduled-reports', fn: startScheduledReportsWorker },
  ];

  for (const { name, fn } of workerStartFunctions) {
    try {
      const worker = await fn();
      if (worker) {
        workers.push(worker);
        logger.debug(`Worker started: ${name}`);
      }
    } catch (err) {
      logger.warn(`Failed to start ${name} worker (non-fatal)`, { error: err.message });
    }
  }

  return workers;
}

module.exports = { startAllWorkers };
