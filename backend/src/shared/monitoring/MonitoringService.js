/**
 * Monitoring Service
 *
 * Lightweight, self-contained metrics and health monitoring:
 *   - Request rate, error rate, latency percentiles
 *   - Financial operation counters (postings, reconciliations, failures)
 *   - Circuit breaker state tracking
 *   - Queue depth monitoring
 *   - Exposes /api/admin/health and /metrics endpoints
 *
 * Designed to integrate with Prometheus/Grafana when added.
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      requests: { total: 0, errors: 0, latencies: [] },
      financial: {
        journalsPosted: 0,
        journalsFailed: 0,
        invoicesFinalized: 0,
        paymentsProcessed: 0,
        reconciliationsRun: 0,
        reconciliationsFailed: 0,
        sagasCompleted: 0,
        sagasCompensated: 0,
        integrityViolations: 0,
      },
      events: { published: 0, delivered: 0, deadLettered: 0, replayed: 0 },
      circuitBreakers: {},
      queues: {},
      errors: { byCode: {}, byModule: {} },
    };

    this.windowStart = Date.now();
    this.windowDuration = 60_000; // 1-minute rolling window for rate calculations

    // Rotate window every minute
    setInterval(() => this._rotateWindow(), this.windowDuration);
  }

  // ── Request tracking ───────────────────────────────────────────────────────

  recordRequest(method, path, statusCode, durationMs) {
    this.metrics.requests.total += 1;

    if (statusCode >= 500) {
      this.metrics.requests.errors += 1;
      this._incrementErrorByModule(path);
    }

    this.metrics.requests.latencies.push(durationMs);
    if (this.metrics.requests.latencies.length > 10_000) {
      this.metrics.requests.latencies.shift(); // bounded buffer
    }
  }

  // ── Financial operation tracking ───────────────────────────────────────────

  recordJournalPosted(tenantId) {
    this.metrics.financial.journalsPosted += 1;
    this.emit('journal-posted', { tenantId });
  }

  recordJournalFailed(tenantId, error) {
    this.metrics.financial.journalsFailed += 1;
    this._incrementErrorByCode(error?.code || 'UNKNOWN');
    this.emit('journal-failed', { tenantId, error });
  }

  recordInvoiceFinalized(tenantId) {
    this.metrics.financial.invoicesFinalized += 1;
  }

  recordPaymentProcessed(tenantId, amount) {
    this.metrics.financial.paymentsProcessed += 1;
    this.emit('payment-processed', { tenantId, amount });
  }

  recordReconciliation(passed) {
    this.metrics.financial.reconciliationsRun += 1;
    if (!passed) {
      this.metrics.financial.reconciliationsFailed += 1;
      this.emit('reconciliation-failed');
    }
  }

  recordSaga(completed) {
    if (completed) {
      this.metrics.financial.sagasCompleted += 1;
    } else {
      this.metrics.financial.sagasCompensated += 1;
      this.emit('saga-compensated');
    }
  }

  recordIntegrityViolation(violation) {
    this.metrics.financial.integrityViolations += 1;
    logger.warn('[Monitoring] Financial integrity violation', violation);
    this.emit('integrity-violation', violation);
  }

  // ── Circuit breaker tracking ───────────────────────────────────────────────

  recordCircuitBreakerStateChange(name, from, to) {
    this.metrics.circuitBreakers[name] = {
      state: to,
      changedAt: new Date().toISOString(),
    };

    if (to === 'OPEN') {
      logger.error(`[Monitoring] Circuit breaker OPENED: ${name}`);
      this.emit('circuit-opened', { name });
    }
  }

  // ── Queue monitoring ───────────────────────────────────────────────────────

  recordQueueDepth(queueName, depth) {
    this.metrics.queues[queueName] = { depth, recordedAt: Date.now() };
    if (depth > 1000) {
      logger.warn(`[Monitoring] Queue depth warning: ${queueName} has ${depth} pending jobs`);
      this.emit('queue-depth-warning', { queueName, depth });
    }
  }

  // ── Computed metrics ───────────────────────────────────────────────────────

  getHealthReport() {
    const latencies = this.metrics.requests.latencies;
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

    const windowSeconds = (Date.now() - this.windowStart) / 1000;
    const rps = windowSeconds > 0 ? (this.metrics.requests.total / windowSeconds).toFixed(2) : 0;
    const errorRate =
      this.metrics.requests.total > 0
        ? ((this.metrics.requests.errors / this.metrics.requests.total) * 100).toFixed(2)
        : '0.00';

    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      requests: {
        total: this.metrics.requests.total,
        errors: this.metrics.requests.errors,
        errorRate: `${errorRate}%`,
        rps,
        latency: { p50: `${p50.toFixed(0)}ms`, p95: `${p95.toFixed(0)}ms`, p99: `${p99.toFixed(0)}ms` },
      },
      financial: this.metrics.financial,
      events: this.metrics.events,
      circuitBreakers: this.metrics.circuitBreakers,
      queues: this.metrics.queues,
      errors: this.metrics.errors,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Prometheus-compatible /metrics output.
   */
  getPrometheusMetrics() {
    const h = this.getHealthReport();
    const lines = [
      `# HELP fact_requests_total Total HTTP requests`,
      `# TYPE fact_requests_total counter`,
      `fact_requests_total ${h.requests.total}`,
      `# HELP fact_errors_total Total HTTP 5xx errors`,
      `fact_errors_total ${h.requests.errors}`,
      `# HELP fact_journals_posted_total Journal entries posted`,
      `fact_journals_posted_total ${h.financial.journalsPosted}`,
      `# HELP fact_integrity_violations_total Financial integrity violations`,
      `fact_integrity_violations_total ${h.financial.integrityViolations}`,
      `# HELP fact_reconciliations_failed_total Failed reconciliations`,
      `fact_reconciliations_failed_total ${h.financial.reconciliationsFailed}`,
      `# HELP fact_sagas_compensated_total Sagas that triggered rollback`,
      `fact_sagas_compensated_total ${h.financial.sagasCompensated}`,
    ];

    for (const [name, state] of Object.entries(h.circuitBreakers)) {
      const val = state.state === 'OPEN' ? 1 : 0;
      lines.push(`fact_circuit_breaker_open{name="${name}"} ${val}`);
    }

    return lines.join('\n');
  }

  // ── Middleware ─────────────────────────────────────────────────────────────

  /**
   * Express middleware to record every request automatically.
   */
  requestTracker() {
    return (req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        this.recordRequest(req.method, req.path, res.statusCode, Date.now() - start);
      });
      next();
    };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _rotateWindow() {
    this.metrics.requests.latencies = this.metrics.requests.latencies.slice(-1000);
    this.windowStart = Date.now();
  }

  _incrementErrorByCode(code) {
    this.metrics.errors.byCode[code] = (this.metrics.errors.byCode[code] || 0) + 1;
  }

  _incrementErrorByModule(path) {
    const module = path.split('/')[2] || 'unknown';
    this.metrics.errors.byModule[module] = (this.metrics.errors.byModule[module] || 0) + 1;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

const monitoring = new MonitoringService();
module.exports = { MonitoringService, monitoring };
