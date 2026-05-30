'use strict';

const { Redis } = require('ioredis');
const { Queue, Worker, QueueEvents, FlowProducer } = require('bullmq');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// ─── Redis Connection Options ─────────────────────────────────────────────────
const redisConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'fact:',
  maxRetriesPerRequest: null, // Required for BullMQ
  retryStrategy: (times) => {
    if (times > 10) {
      logger.error('Redis connection failed after 10 retries');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
    return targetErrors.some((e) => err.message.includes(e));
  },
  lazyConnect: false,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// ─── Main Redis Client (general purpose) ─────────────────────────────────────
let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  redisClient = new Redis(redisConnectionOptions);

  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('ready', () => logger.info('Redis ready'));
  redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
  redisClient.on('close', () => logger.warn('Redis connection closed'));
  redisClient.on('reconnecting', (delay) => logger.info('Redis reconnecting', { delay }));

  return redisClient;
}

// ─── Subscriber Client (for pub/sub) ─────────────────────────────────────────
let subscriberClient = null;

function getSubscriberClient() {
  if (subscriberClient) return subscriberClient;
  subscriberClient = new Redis({ ...redisConnectionOptions, keyPrefix: '' });
  return subscriberClient;
}

// ─── BullMQ Connection (separate from main client) ───────────────────────────
const bullMQConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  maxRetriesPerRequest: null,
};

// ─── Queue Definitions ────────────────────────────────────────────────────────
const QUEUE_NAMES = {
  ACCOUNTING: 'fact-accounting',
  BILLING: 'fact-billing',
  REPORT: 'fact-report',
  NOTIFICATION: 'fact-notification',
  AI: 'fact-ai',
  PAYROLL: 'fact-payroll',
  DEPRECIATION: 'fact-depreciation',
  CLAIM: 'fact-claim',
  AUDIT: 'fact-audit',
  EXPORT: 'fact-export',
};

const queues = {};
const queueEvents = {};

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: { count: 100, age: 24 * 3600 },
  removeOnFail: { count: 200, age: 7 * 24 * 3600 },
};

/**
 * Get or create a BullMQ queue by name.
 */
function getQueue(name) {
  if (queues[name]) return queues[name];

  queues[name] = new Queue(name, {
    connection: bullMQConnection,
    defaultJobOptions,
  });

  queues[name].on('error', (err) => {
    logger.error('Queue error', { queue: name, error: err.message });
  });

  logger.info('Queue initialized', { name });
  return queues[name];
}

/**
 * Get or create queue events for monitoring.
 */
function getQueueEvents(name) {
  if (queueEvents[name]) return queueEvents[name];

  queueEvents[name] = new QueueEvents(name, { connection: bullMQConnection });
  return queueEvents[name];
}

/**
 * Create a BullMQ worker for a queue.
 */
function createWorker(queueName, processor, options = {}) {
  const worker = new Worker(queueName, processor, {
    connection: bullMQConnection,
    concurrency: options.concurrency || 5,
    limiter: options.limiter,
    ...options,
  });

  worker.on('completed', (job) => {
    logger.info('Job completed', { queue: queueName, jobId: job.id, jobName: job.name });
  });

  worker.on('failed', (job, err) => {
    logger.error('Job failed', {
      queue: queueName,
      jobId: job?.id,
      jobName: job?.name,
      error: err.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on('stalled', (jobId) => {
    logger.warn('Job stalled', { queue: queueName, jobId });
  });

  logger.info('Worker created', { queue: queueName, concurrency: options.concurrency || 5 });
  return worker;
}

/**
 * Initialize all queues at startup.
 */
function initQueues() {
  Object.values(QUEUE_NAMES).forEach((name) => getQueue(name));
  logger.info('All queues initialized', { count: Object.keys(QUEUE_NAMES).length });
  return queues;
}

/**
 * Add a job to a specific queue.
 */
async function addJob(queueName, jobName, data, options = {}) {
  const queue = getQueue(queueName);
  const job = await queue.add(jobName, data, {
    ...defaultJobOptions,
    ...options,
  });
  logger.debug('Job added', { queue: queueName, jobName, jobId: job.id });
  return job;
}

/**
 * Schedule a delayed job.
 */
async function scheduleJob(queueName, jobName, data, delayMs) {
  return addJob(queueName, jobName, data, { delay: delayMs });
}

/**
 * Add a repeatable job (cron).
 */
async function addRepeatableJob(queueName, jobName, data, cronExpression) {
  const queue = getQueue(queueName);
  return queue.add(jobName, data, {
    repeat: { cron: cronExpression },
    jobId: `${jobName}-repeatable`,
  });
}

/**
 * Close all connections gracefully.
 */
async function closeRedisConnections() {
  const closePromises = [];

  if (redisClient) closePromises.push(redisClient.quit());
  if (subscriberClient) closePromises.push(subscriberClient.quit());

  for (const queue of Object.values(queues)) {
    closePromises.push(queue.close());
  }

  for (const events of Object.values(queueEvents)) {
    closePromises.push(events.close());
  }

  await Promise.allSettled(closePromises);
  logger.info('All Redis connections closed');
}

/**
 * Test Redis connectivity.
 */
async function testRedisConnection() {
  const client = getRedisClient();
  const pong = await client.ping();
  if (pong === 'PONG') {
    logger.info('Redis connection test passed');
    return true;
  }
  throw new Error('Redis ping failed');
}

module.exports = {
  getRedisClient,
  getSubscriberClient,
  getQueue,
  getQueueEvents,
  createWorker,
  initQueues,
  addJob,
  scheduleJob,
  addRepeatableJob,
  closeRedisConnections,
  testRedisConnection,
  QUEUE_NAMES,
  bullMQConnection,
};
