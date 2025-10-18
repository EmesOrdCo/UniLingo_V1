/**
 * Audio Worker Service
 * Processes audio-related jobs from Redis queue (BullMQ)
 * 
 * This worker handles:
 * - AWS Polly TTS requests
 * - Azure Speech pronunciation assessments
 * - Audio lesson generation
 * - High concurrency for audio services (50+ concurrent jobs)
 * 
 * Optimized for audio services which have higher rate limits than OpenAI
 */

// Load environment variables FIRST before any other imports
require('dotenv').config();

const { Worker } = require('bullmq');
const PollyService = require('./pollyService');
const SimplePollyService = require('./simplePollyService');
const ResilientPronunciationService = require('./resilientPronunciationService');
const path = require('path');
const { retryWithBackoff } = require('./retryUtils');
const CircuitBreaker = require('./circuitBreaker');
const { cacheJobResult } = require('./queueClient');
const notificationManager = require('./notifications');
const { azureSpeechLimiter } = require('./rateLimiter');
const { redis } = require('./redisConnection');

// Initialize circuit breakers for audio services
const pollyCircuitBreaker = new CircuitBreaker('polly', {
  failureThreshold: 10, // Higher threshold for audio services
  successThreshold: 3,
  timeout: 30000, // Shorter timeout for faster recovery
});

const azureCircuitBreaker = new CircuitBreaker('azure-speech', {
  failureThreshold: 8,
  successThreshold: 3,
  timeout: 30000,
});

// Redis connection configuration
const { redisConfig } = require('./redisConnection');

console.log('🔍 Audio Worker Redis Environment Variables:');
console.log('  REDIS_PUBLIC_URL:', process.env.REDIS_PUBLIC_URL ? 'SET (length: ' + process.env.REDIS_PUBLIC_URL.length + ')' : 'NOT SET');
console.log('  REDIS_URL:', process.env.REDIS_URL ? 'SET (length: ' + process.env.REDIS_URL.length + ')' : 'NOT SET');
console.log('🔧 Audio Worker Redis Config:', redisConfig);

// Worker statistics
const stats = {
  processed: 0,
  succeeded: 0,
  failed: 0,
  startTime: Date.now(),
  currentlyProcessing: 0,
  peakConcurrency: 0,
};

// Initialize services
const pollyService = new PollyService();
const simplePollyService = new SimplePollyService();
const pronunciationService = new ResilientPronunciationService();

/**
 * Process a single audio job
 * Routes to appropriate handler based on job type
 * 
 * @param {Object} job - BullMQ job object
 * @returns {Object} - Result to be stored in job
 */
async function processAudioJob(job) {
  const startTime = Date.now();
  
  console.log('\n' + '🎵'.repeat(30));
  console.log('🎵 AUDIO WORKER: Processing Job');
  console.log('🎵'.repeat(30));
  console.log(`📋 Job ID: ${job.id}`);
  console.log(`📦 Job Type: ${job.name}`);
  console.log(`🔢 Attempt: ${job.attemptsMade + 1}/${job.opts.attempts || 2}`);
  console.log(`⏱️ Started: ${new Date().toISOString()}`);
  console.log('🎵'.repeat(30) + '\n');

  try {
    let result;

    // Route to appropriate handler based on job type
    switch (job.name) {
      case 'generate-audio-lesson':
        result = await handleGenerateAudioLesson(job);
        break;

      case 'create-simple-audio':
        result = await handleCreateSimpleAudio(job);
        break;

      case 'assess-pronunciation':
        result = await handleAssessPronunciation(job);
        break;

      default:
        throw new Error(`Unknown audio job type: ${job.name}`);
    }

    const duration = Date.now() - startTime;

    console.log('\n' + '✅'.repeat(30));
    console.log('✅ AUDIO WORKER: Job Completed Successfully');
    console.log('✅'.repeat(30));
    console.log(`📋 Job ID: ${job.id}`);
    console.log(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📊 Result size: ${JSON.stringify(result).length} bytes`);
    console.log('✅'.repeat(30) + '\n');

    // Cache result for idempotency
    if (job.opts?.idempotencyKey) {
      await cacheJobResult(job.opts.idempotencyKey, job.id, result);
      console.log(`💾 Result cached for future idempotency checks`);
    }

    // Notify SSE clients of completion
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
    console.error('❌ AUDIO WORKER: Job Failed');
    console.error('❌'.repeat(30));
    console.error(`📋 Job ID: ${job.id}`);
    console.error(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    console.error(`❌ Error: ${error.message}`);
    console.error(`📊 Stack trace:`, error.stack);
    console.error('❌'.repeat(30) + '\n');

    // Notify SSE clients of failure
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
 * Handle audio lesson generation job
 * 
 * @param {Object} job - BullMQ job
 * @returns {Object} - Audio lesson generation result
 */
async function handleGenerateAudioLesson(job) {
  const { lessonId, userId } = job.data;

  console.log(`🎵 Processing audio lesson generation...`);
  console.log(`   Lesson ID: ${lessonId}`);
  console.log(`   User: ${userId}`);

  // Update job progress
  await job.updateProgress(10);

  // Wrap with circuit breaker and retry logic
  const result = await pollyCircuitBreaker.execute(async () => {
    return await retryWithBackoff(async () => {
      // Call PollyService to generate audio lesson
      return await pollyService.generateAudioLesson(lessonId, userId);
    }, {
      maxAttempts: 2, // Fewer retries for audio (faster failure)
      baseDelay: 1000,
      maxDelay: 5000,
      onRetry: (error, attempt) => {
        console.log(`🔄 Retrying audio lesson generation (attempt ${attempt + 2}):`, error.message);
        job.updateProgress(10 + (attempt * 10)).catch(() => {});
      }
    });
  });

  // Update job progress
  await job.updateProgress(100);

  console.log(`✅ Generated audio lesson: ${result.id}`);
  console.log(`🔗 URL: ${result.audio_url}`);

  return result;
}

/**
 * Handle simple audio creation job
 * 
 * @param {Object} job - BullMQ job
 * @returns {Object} - Simple audio creation result
 */
async function handleCreateSimpleAudio(job) {
  const { title, scriptText, userId, nativeLanguage } = job.data;

  console.log(`🎙️ Processing simple audio creation...`);
  console.log(`   Title: ${title}`);
  console.log(`   User: ${userId}`);
  console.log(`   Language: ${nativeLanguage}`);
  console.log(`   Script length: ${scriptText?.length || 0} characters`);

  // Update job progress
  await job.updateProgress(10);

  // Wrap with circuit breaker and retry logic
  const result = await pollyCircuitBreaker.execute(async () => {
    return await retryWithBackoff(async () => {
      // Call SimplePollyService to create audio
      return await simplePollyService.createAudioLesson(title, scriptText, userId, nativeLanguage);
    }, {
      maxAttempts: 2,
      baseDelay: 1000,
      maxDelay: 5000,
      onRetry: (error, attempt) => {
        console.log(`🔄 Retrying simple audio creation (attempt ${attempt + 2}):`, error.message);
        job.updateProgress(10 + (attempt * 10)).catch(() => {});
      }
    });
  });

  // Update job progress
  await job.updateProgress(100);

  console.log(`✅ Created simple audio: ${result.id}`);
  console.log(`🔗 URL: ${result.audio_url}`);

  return result;
}

/**
 * Handle pronunciation assessment job
 * 
 * @param {Object} job - BullMQ job
 * @returns {Object} - Pronunciation assessment result
 */
async function handleAssessPronunciation(job) {
  const { audioFilePath, referenceText } = job.data;

  console.log(`🎤 Processing pronunciation assessment...`);
  console.log(`   Audio file: ${audioFilePath}`);
  console.log(`   Reference text: ${referenceText}`);

  // Update job progress
  await job.updateProgress(10);

  // Wrap with circuit breaker and Azure rate limiter
  const result = await azureSpeechLimiter.schedule(async () => {
    return await azureCircuitBreaker.execute(async () => {
      return await retryWithBackoff(async () => {
        // Call ResilientPronunciationService to assess pronunciation
        return await pronunciationService.assessPronunciationWithResilience(audioFilePath, referenceText);
      }, {
        maxAttempts: 2,
        baseDelay: 1000,
        maxDelay: 5000,
        onRetry: (error, attempt) => {
          console.log(`🔄 Retrying pronunciation assessment (attempt ${attempt + 2}):`, error.message);
          job.updateProgress(10 + (attempt * 10)).catch(() => {});
        }
      });
    });
  });

  // Update job progress
  await job.updateProgress(100);

  console.log(`✅ Pronunciation assessment completed`);
  console.log(`📊 Score: ${result.pronunciationScore || 'N/A'}`);

  return result;
}

/**
 * Create and configure BullMQ Worker for audio jobs
 * 
 * Concurrency: 50 jobs processed in parallel per worker instance
 * Optimized for audio services with higher rate limits
 */
const worker = new Worker('audio-jobs', processAudioJob, {
  connection: redisConfig,
  concurrency: 80, // High concurrency for audio services (increased from 50)
  limiter: {
    max: 100, // Max 100 jobs per second per worker
    duration: 1000,
  },
  settings: {
    stalledInterval: 15000, // Check for stalled jobs every 15s (shorter for audio)
    maxStalledCount: 1, // Max 1 stall before failing (audio jobs are faster)
  },
});

// Worker event handlers
worker.on('ready', () => {
  console.log('\n' + '🎵'.repeat(30));
  console.log('🎵 AUDIO WORKER SERVICE STARTED');
  console.log('🎵'.repeat(30));
  console.log(`📋 Queue: audio-jobs`);
  console.log(`⚡ Concurrency: 80 jobs in parallel`);
  console.log(`🔄 Limiter: 100 jobs/second`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 PID: ${process.pid}`);
  console.log('🎵'.repeat(30) + '\n');
});

worker.on('active', (job) => {
  stats.currentlyProcessing++;
  stats.peakConcurrency = Math.max(stats.peakConcurrency, stats.currentlyProcessing);
  
  console.log(`📤 Audio job picked up: ${job.id} (${job.name})`);
  console.log(`   Currently processing: ${stats.currentlyProcessing} jobs`);
  
  // Notify SSE clients that job is active
  notificationManager.notify(job.id, 'active', {
    message: 'Audio job is now being processed',
  });
});

worker.on('completed', (job, result) => {
  stats.processed++;
  stats.currentlyProcessing--;
  
  console.log(`✅ Audio job completed: ${job.id}`);
  console.log(`   Total processed: ${stats.processed}`);
  console.log(`   Success rate: ${((stats.succeeded / stats.processed) * 100).toFixed(1)}%`);
});

worker.on('failed', (job, error) => {
  stats.currentlyProcessing--;
  
  console.error(`❌ Audio job failed: ${job?.id || 'unknown'}`);
  console.error(`   Error: ${error.message}`);
  console.error(`   Attempt: ${job?.attemptsMade || 0}/${job?.opts?.attempts || 2}`);
  
  if (job && job.attemptsMade >= (job.opts?.attempts || 2)) {
    console.error(`   ⚠️ Max retries reached - job will not retry`);
  }
});

worker.on('stalled', (jobId) => {
  console.warn(`⚠️ Audio job stalled: ${jobId}`);
  console.warn(`   Job appears to be stuck, will be retried`);
});

worker.on('error', (error) => {
  console.error('❌ Audio worker error:', error);
  console.error('   Error details:', {
    message: error.message,
    code: error.code,
    errno: error.errno,
    syscall: error.syscall,
    address: error.address,
    port: error.port,
  });
  
  // If it's a Redis connection error, log additional details
  if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
    console.error('🔍 Redis connection error detected!');
    console.error('   This suggests the worker is trying to connect to localhost Redis');
    console.error('   Check that REDIS_PUBLIC_URL is properly set in Railway');
    console.error('   Current Redis config:', redisConfig);
  }
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n⚠️ Received ${signal}, shutting down audio worker gracefully...`);
  
  // Print final statistics
  const uptime = Date.now() - stats.startTime;
  const uptimeMinutes = (uptime / 1000 / 60).toFixed(2);
  
  console.log('\n' + '📊'.repeat(30));
  console.log('📊 AUDIO WORKER STATISTICS');
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
    console.log('✅ Audio worker closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Health check endpoint for monitoring
const http = require('http');
const HEALTH_PORT = process.env.AUDIO_WORKER_PORT || 3002;

const healthServer = http.createServer((req, res) => {
  if (req.url === '/api/health' || req.url === '/health' || req.url === '/') {
    const uptime = Date.now() - stats.startTime;
    const uptimeMinutes = (uptime / 1000 / 60).toFixed(2);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'audio-worker',
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
  console.log(`💚 Audio worker health check server listening on port ${HEALTH_PORT}`);
  console.log(`   Health check: http://localhost:${HEALTH_PORT}/api/health`);
});

console.log('\n🎬 Audio worker initialization complete, waiting for audio jobs...\n');

// Keep process alive
process.stdin.resume();
