/**
 * Background Worker Service
 * Processes jobs from Redis queue (BullMQ)
 * 
 * This worker:
 * - Consumes jobs from 'ai-jobs' queue
 * - Processes OpenAI API calls in background
 * - Updates job status and stores results
 * - Handles retries and failures
 * - Supports concurrent processing (3 jobs at a time)
 * 
 * Issues: #4 (Worker service) + #5 (Concurrency)
 */

// Load environment variables FIRST before any other imports
require('dotenv').config();

const { Worker } = require('bullmq');
const AIService = require('./aiService');
const path = require('path');
const { retryWithBackoff } = require('./retryUtils');
const CircuitBreaker = require('./circuitBreaker');
const { cacheJobResult } = require('./queueClient');
const notificationManager = require('./notifications');
const { openaiLimiter, azureSpeechLimiter } = require('./rateLimiter');

// Initialize circuit breakers for external services (Issue #6 + #8)
const openaiCircuitBreaker = new CircuitBreaker('openai', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
});

const azureCircuitBreaker = new CircuitBreaker('azure', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000,
});

// Redis connection configuration (same as queueClient.js)
const redisConfig = {
  connection: process.env.REDIS_URL ? 
    process.env.REDIS_URL :
    {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    }
};

// Worker statistics
const stats = {
  processed: 0,
  succeeded: 0,
  failed: 0,
  startTime: Date.now(),
  currentlyProcessing: 0,
  peakConcurrency: 0,
};

/**
 * Process a single job
 * Routes to appropriate handler based on job type
 * 
 * @param {Object} job - BullMQ job object
 * @returns {Object} - Result to be stored in job
 */
async function processJob(job) {
  const startTime = Date.now();
  
  console.log('\n' + '🔄'.repeat(30));
  console.log('🔄 WORKER: Processing Job');
  console.log('🔄'.repeat(30));
  console.log(`📋 Job ID: ${job.id}`);
  console.log(`📦 Job Type: ${job.name}`);
  console.log(`🔢 Attempt: ${job.attemptsMade + 1}/${job.opts.attempts || 3}`);
  console.log(`⏱️ Started: ${new Date().toISOString()}`);
  console.log('🔄'.repeat(30) + '\n');

  try {
    let result;

    // Route to appropriate handler based on job type
    switch (job.name) {
      case 'generate-flashcards':
        result = await handleGenerateFlashcards(job);
        break;

      case 'generate-lesson':
        result = await handleGenerateLesson(job);
        break;

      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }

    const duration = Date.now() - startTime;

    console.log('\n' + '✅'.repeat(30));
    console.log('✅ WORKER: Job Completed Successfully');
    console.log('✅'.repeat(30));
    console.log(`📋 Job ID: ${job.id}`);
    console.log(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📊 Result size: ${JSON.stringify(result).length} bytes`);
    console.log('✅'.repeat(30) + '\n');

    // Issue #7: Cache result for idempotency
    if (job.opts?.idempotencyKey) {
      await cacheJobResult(job.opts.idempotencyKey, job.id, result);
      console.log(`💾 Result cached for future idempotency checks`);
    }

    // Issue #9: Notify SSE clients of completion
    notificationManager.notify(job.id, 'completed', {
      result: result,
      duration: duration,
    });
    console.log(`📡 SSE: Completion notification sent for job ${job.id}`);

    // Update statistics
    stats.succeeded++;

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('\n' + '❌'.repeat(30));
    console.error('❌ WORKER: Job Failed');
    console.error('❌'.repeat(30));
    console.error(`📋 Job ID: ${job.id}`);
    console.error(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    console.error(`❌ Error: ${error.message}`);
    console.error(`📊 Stack trace:`, error.stack);
    console.error('❌'.repeat(30) + '\n');

    // Issue #9: Notify SSE clients of failure
    notificationManager.notify(job.id, 'failed', {
      error: error.message,
      duration: duration,
      attemptsMade: job.attemptsMade,
    });

    // Update statistics
    stats.failed++;

    // Re-throw to let BullMQ handle retry logic
    throw error;
  }
}

/**
 * Handle flashcard generation job
 * 
 * @param {Object} job - BullMQ job
 * @returns {Object} - Flashcard generation result
 */
async function handleGenerateFlashcards(job) {
  const { content, subject, topic, userId, nativeLanguage, showNativeLanguage } = job.data;

  console.log(`🤖 Processing flashcard generation...`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Topic: ${topic}`);
  console.log(`   User: ${userId}`);
  console.log(`   Content length: ${content?.length || 0} characters`);

  // Update job progress
  await job.updateProgress(10);

  // Issue #8: Wrap with circuit breaker and retry logic
  // Issue #13: Wrap with fleet-wide rate limiter (shared across all workers)
  const result = await openaiLimiter.schedule(async () => {
    return await openaiCircuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        // Call AIService to generate flashcards
        return await AIService.generateFlashcards(
          content,
          subject,
          topic,
          userId,
          nativeLanguage || 'English',
          showNativeLanguage || false
        );
      }, {
        maxAttempts: 3,
        baseDelay: 2000,
        maxDelay: 10000,
        onRetry: (error, attempt) => {
          console.log(`🔄 Retrying flashcard generation (attempt ${attempt + 2}):`, error.message);
          job.updateProgress(10 + (attempt * 5)).catch(() => {}); // Update progress on retry
        }
      });
    });
  });

  // Update job progress
  await job.updateProgress(100);

  console.log(`✅ Generated ${result.flashcards?.length || 0} flashcards`);
  console.log(`🔢 Tokens used: ${result.tokenUsage || 0}`);

  return result;
}

/**
 * Handle lesson generation job
 * 
 * @param {Object} job - BullMQ job
 * @returns {Object} - Lesson generation result
 */
async function handleGenerateLesson(job) {
  const { content, subject, topic, userId, nativeLanguage, sourceFileName } = job.data;

  console.log(`📚 Processing lesson generation...`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Topic: ${topic}`);
  console.log(`   User: ${userId}`);
  console.log(`   Source: ${sourceFileName || 'Unknown'}`);

  // Update job progress
  await job.updateProgress(10);

  // Issue #8: Wrap with circuit breaker and retry logic
  // Issue #13: Wrap with fleet-wide rate limiter (shared across all workers)
  const result = await openaiLimiter.schedule(async () => {
    return await openaiCircuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        // Call AIService to generate lesson
        return await AIService.generateLesson(
          content,
          subject,
          topic,
          userId,
          nativeLanguage || 'English',
          sourceFileName || 'Unknown Source'
        );
      }, {
        maxAttempts: 3,
        baseDelay: 3000, // Longer delay for lesson generation (more complex)
        maxDelay: 15000,
        onRetry: (error, attempt) => {
          console.log(`🔄 Retrying lesson generation (attempt ${attempt + 2}):`, error.message);
          job.updateProgress(10 + (attempt * 5)).catch(() => {});
        }
      });
    });
  });

  // Update job progress
  await job.updateProgress(100);

  console.log(`✅ Generated ${result.lessons?.length || 0} lessons`);

  return result;
}

/**
 * Create and configure BullMQ Worker
 * 
 * Concurrency: 3 jobs processed in parallel per worker instance
 * Priority: Higher priority jobs processed first
 */
const worker = new Worker('ai-jobs', processJob, {
  ...redisConfig,
  concurrency: 3, // Issue #5: Process up to 3 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // Per second (10 jobs/second per worker)
  },
  settings: {
    stalledInterval: 30000, // Check for stalled jobs every 30s
    maxStalledCount: 2, // Max 2 stalls before failing
  },
});

// Worker event handlers
worker.on('ready', () => {
  console.log('\n' + '🚀'.repeat(30));
  console.log('🚀 WORKER SERVICE STARTED');
  console.log('🚀'.repeat(30));
  console.log(`📋 Queue: ai-jobs`);
  console.log(`⚡ Concurrency: 3 jobs in parallel`);
  console.log(`🔄 Limiter: 10 jobs/second`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 PID: ${process.pid}`);
  console.log('🚀'.repeat(30) + '\n');
});

worker.on('active', (job) => {
  stats.currentlyProcessing++;
  stats.peakConcurrency = Math.max(stats.peakConcurrency, stats.currentlyProcessing);
  
  console.log(`📤 Job picked up: ${job.id} (${job.name})`);
  console.log(`   Currently processing: ${stats.currentlyProcessing} jobs`);
  
  // Issue #9: Notify SSE clients that job is active
  notificationManager.notify(job.id, 'active', {
    message: 'Job is now being processed',
  });
});

worker.on('completed', (job, result) => {
  stats.processed++;
  stats.currentlyProcessing--;
  
  console.log(`✅ Job completed: ${job.id}`);
  console.log(`   Total processed: ${stats.processed}`);
  console.log(`   Success rate: ${((stats.succeeded / stats.processed) * 100).toFixed(1)}%`);
});

worker.on('failed', (job, error) => {
  stats.currentlyProcessing--;
  
  console.error(`❌ Job failed: ${job?.id || 'unknown'}`);
  console.error(`   Error: ${error.message}`);
  console.error(`   Attempt: ${job?.attemptsMade || 0}/${job?.opts?.attempts || 3}`);
  
  if (job && job.attemptsMade >= (job.opts?.attempts || 3)) {
    console.error(`   ⚠️ Max retries reached - job will not retry`);
  }
});

worker.on('stalled', (jobId) => {
  console.warn(`⚠️ Job stalled: ${jobId}`);
  console.warn(`   Job appears to be stuck, will be retried`);
});

worker.on('error', (error) => {
  console.error('❌ Worker error:', error);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n⚠️ Received ${signal}, shutting down gracefully...`);
  
  // Print final statistics
  const uptime = Date.now() - stats.startTime;
  const uptimeMinutes = (uptime / 1000 / 60).toFixed(2);
  
  console.log('\n' + '📊'.repeat(30));
  console.log('📊 WORKER STATISTICS');
  console.log('📊'.repeat(30));
  console.log(`⏱️ Uptime: ${uptimeMinutes} minutes`);
  console.log(`📋 Total processed: ${stats.processed}`);
  console.log(`✅ Succeeded: ${stats.succeeded}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📊 Success rate: ${stats.processed > 0 ? ((stats.succeeded / stats.processed) * 100).toFixed(1) : 0}%`);
  console.log(`⚡ Peak concurrency: ${stats.peakConcurrency}`);
  console.log(`📈 Jobs/minute: ${stats.processed > 0 ? (stats.processed / (uptime / 1000 / 60)).toFixed(2) : 0}`);
  console.log('📊'.repeat(30) + '\n');
  
  try {
    await worker.close();
    console.log('✅ Worker closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Health check endpoint for monitoring (simple HTTP server)
// This allows Railway/monitoring to check if worker is alive
const http = require('http');
const HEALTH_PORT = process.env.WORKER_HEALTH_PORT || 3002;

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    const uptime = Date.now() - stats.startTime;
    const uptimeMinutes = (uptime / 1000 / 60).toFixed(2);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'worker',
      uptime: uptime,
      uptimeMinutes: uptimeMinutes,
      stats: {
        processed: stats.processed,
        succeeded: stats.succeeded,
        failed: stats.failed,
        currentlyProcessing: stats.currentlyProcessing,
        peakConcurrency: stats.peakConcurrency,
        successRate: stats.processed > 0 ? ((stats.succeeded / stats.processed) * 100).toFixed(1) + '%' : '0%',
      },
      timestamp: new Date().toISOString(),
      pid: process.pid,
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

healthServer.listen(HEALTH_PORT, () => {
  console.log(`💚 Health check server listening on port ${HEALTH_PORT}`);
  console.log(`   Health check: http://localhost:${HEALTH_PORT}/health`);
});

console.log('\n🎬 Worker initialization complete, waiting for jobs...\n');

// Keep process alive
process.stdin.resume();

