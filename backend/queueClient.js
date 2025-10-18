/**
 * Queue Client - BullMQ Integration
 * Provides persistent job queue backed by Redis
 * 
 * Replaces in-memory queues with durable Redis-backed queues
 * Jobs survive server restarts and can be processed by separate worker instances
 */

const { Queue } = require('bullmq');
const crypto = require('crypto');
const { redis } = require('./redisConnection');

// Redis connection configuration (imported from centralized redisConnection.js)
const { redisConfig } = require('./redisConnection');

// Redis connection events are already handled in redisConnection.js
// No need to add duplicate listeners here

/**
 * AI Jobs Queue
 * Handles all AI-related jobs (flashcard generation, lesson generation, etc.)
 * 
 * Note: BullMQ Queue creates its own Redis connection, so we pass the connection config
 */
const aiJobsQueue = new Queue('ai-jobs', {
  connection: redisConfig, // Use the Redis config directly (REDIS_PUBLIC_URL)
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 second delay
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
      count: 500, // Keep last 500 failed jobs
    },
  }
});

/**
 * Audio Jobs Queue
 * Handles all audio-related jobs (TTS, pronunciation assessment, audio lesson generation)
 * 
 * Optimized for audio services with higher concurrency limits
 */
const audioJobsQueue = new Queue('audio-jobs', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 2, // Fewer retries for audio (faster failure)
    backoff: {
      type: 'exponential',
      delay: 1000, // Start with 1 second delay
    },
    removeOnComplete: {
      age: 1800, // Keep completed jobs for 30 minutes (shorter for audio)
      count: 200, // Keep last 200 completed jobs
    },
    removeOnFail: {
      age: 3600, // Keep failed jobs for 1 hour
      count: 100, // Keep last 100 failed jobs
    },
  }
});

/**
 * Calculate idempotency key for job deduplication
 * Creates a stable hash from userId and payload
 * 
 * @param {string} jobType - Type of job
 * @param {object} payload - Job data
 * @returns {string} - Idempotency key (hex hash)
 */
function calculateIdempotencyKey(jobType, payload) {
  // Create stable key from job type, userId, and content
  const keyData = {
    jobType,
    userId: payload.userId,
    // Include relevant fields that make the job unique
    content: payload.content?.substring(0, 1000), // First 1000 chars to limit key size
    subject: payload.subject,
    topic: payload.topic,
    nativeLanguage: payload.nativeLanguage,
  };
  
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(keyData))
    .digest('hex');
  
  return `idempotency:${jobType}:${hash}`;
}

/**
 * Check if job result exists in cache (idempotency check)
 * 
 * @param {string} idempotencyKey - Idempotency key
 * @returns {Promise<{exists: boolean, jobId?: string, result?: any}>}
 */
async function checkIdempotency(idempotencyKey) {
  try {
    const cached = await redis.get(idempotencyKey);
    
    if (cached) {
      const data = JSON.parse(cached);
      console.log(`🔍 Idempotency match found: ${idempotencyKey}`);
      console.log(`   Original job: ${data.jobId}`);
      console.log(`   Cached at: ${new Date(data.cachedAt).toISOString()}`);
      
      return {
        exists: true,
        jobId: data.jobId,
        result: data.result,
        cachedAt: data.cachedAt,
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error(`⚠️ Idempotency check failed:`, error);
    return { exists: false }; // Fail open - allow job to proceed
  }
}

/**
 * Cache job result for idempotency (after job completes)
 * 
 * @param {string} idempotencyKey - Idempotency key
 * @param {string} jobId - Job ID
 * @param {any} result - Job result
 * @param {number} ttl - Time to live in seconds (default: 24 hours)
 */
async function cacheJobResult(idempotencyKey, jobId, result, ttl = 86400) {
  try {
    const cacheData = {
      jobId,
      result,
      cachedAt: Date.now(),
    };
    
    await redis.setex(idempotencyKey, ttl, JSON.stringify(cacheData));
    console.log(`💾 Cached result for idempotency: ${idempotencyKey} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error(`⚠️ Failed to cache result:`, error);
    // Don't throw - caching failure shouldn't break the job
  }
}

/**
 * Enqueue a job to the AI jobs queue with idempotency support
 * 
 * @param {string} jobType - Type of job (e.g., 'generate-flashcards', 'generate-lesson')
 * @param {object} payload - Job data
 * @param {object} opts - Optional BullMQ job options
 * @param {boolean} opts.enableIdempotency - Enable idempotency checking (default: true)
 * @param {string} opts.idempotencyKey - Custom idempotency key (optional)
 * @returns {Promise<{jobId: string, queue: string, fromCache?: boolean, result?: any}>}
 */
async function enqueue(jobType, payload, opts = {}) {
  try {
    console.log(`📋 Enqueueing job: ${jobType}`);
    console.log(`📦 Payload keys: ${Object.keys(payload).join(', ')}`);
    
    // Issue #7: Check idempotency
    const enableIdempotency = opts.enableIdempotency !== false; // Default: true
    
    if (enableIdempotency) {
      const idempotencyKey = opts.idempotencyKey || calculateIdempotencyKey(jobType, payload);
      const cached = await checkIdempotency(idempotencyKey);
      
      if (cached.exists) {
        console.log(`✅ Returning cached result (idempotency match)`);
        console.log(`   Avoided duplicate OpenAI call! 💰`);
        
        return {
          jobId: cached.jobId,
          queue: 'ai-jobs',
          fromCache: true,
          result: cached.result,
          cachedAt: cached.cachedAt,
        };
      }
      
      // Store idempotency key with job metadata
      opts.idempotencyKey = idempotencyKey;
    }
    
    const job = await aiJobsQueue.add(jobType, payload, {
      ...opts,
      // Ensure job has a unique ID for tracking
      jobId: opts.jobId || `${jobType}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });
    
    console.log(`✅ Job enqueued successfully: ${job.id}`);
    
    return {
      jobId: job.id,
      queue: 'ai-jobs',
      fromCache: false,
    };
  } catch (error) {
    console.error(`❌ Failed to enqueue job:`, error);
    throw new Error(`Queue error: ${error.message}`);
  }
}

/**
 * Enqueue an audio job to the audio jobs queue
 * 
 * @param {string} jobType - Type of audio job (e.g., 'generate-audio-lesson', 'assess-pronunciation')
 * @param {object} payload - Job data
 * @param {object} opts - Optional BullMQ job options
 * @returns {Promise<{jobId: string, queue: string}>}
 */
async function enqueueAudio(jobType, payload, opts = {}) {
  try {
    console.log(`🎵 Enqueueing audio job: ${jobType}`);
    console.log(`📦 Payload keys: ${Object.keys(payload).join(', ')}`);
    
    const job = await audioJobsQueue.add(jobType, payload, {
      ...opts,
      // Ensure job has a unique ID for tracking
      jobId: opts.jobId || `${jobType}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });
    
    console.log(`✅ Audio job enqueued successfully: ${job.id}`);
    
    return {
      jobId: job.id,
      queue: 'audio-jobs',
    };
  } catch (error) {
    console.error(`❌ Failed to enqueue audio job:`, error);
    throw new Error(`Audio queue error: ${error.message}`);
  }
}

/**
 * Get job status and result
 * 
 * @param {string} jobId - Job ID to query
 * @returns {Promise<{status: string, progress?: number, result?: any, error?: string}>}
 */
async function getJobStatus(jobId) {
  try {
    // Try AI jobs queue first
    let job = await aiJobsQueue.getJob(jobId);
    let queueName = 'ai-jobs';
    
    // If not found in AI queue, try audio queue
    if (!job) {
      job = await audioJobsQueue.getJob(jobId);
      queueName = 'audio-jobs';
    }
    
    if (!job) {
      return {
        status: 'not_found',
        error: 'Job not found. It may have been completed and removed.'
      };
    }
    
    const state = await job.getState();
    const progress = job.progress;
    
    const response = {
      status: state, // 'waiting', 'active', 'completed', 'failed', 'delayed'
      jobId: job.id,
      queue: queueName,
      timestamp: job.timestamp,
    };
    
    // Add progress if available
    if (progress !== undefined) {
      response.progress = progress;
    }
    
    // Add result if completed
    if (state === 'completed') {
      response.result = job.returnvalue;
      response.completedAt = job.finishedOn;
    }
    
    // Add error if failed
    if (state === 'failed') {
      response.error = job.failedReason;
      response.failedAt = job.finishedOn;
      response.attemptsMade = job.attemptsMade;
    }
    
    return response;
  } catch (error) {
    console.error(`❌ Failed to get job status:`, error);
    throw new Error(`Failed to retrieve job status: ${error.message}`);
  }
}

/**
 * Get queue statistics
 * 
 * @returns {Promise<object>}
 */
async function getQueueStats() {
  try {
    const counts = await aiJobsQueue.getJobCounts();
    
    return {
      queue: 'ai-jobs',
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0)
    };
  } catch (error) {
    console.error(`❌ Failed to get queue stats:`, error);
    return {
      queue: 'ai-jobs',
      error: error.message
    };
  }
}

/**
 * Health check for Redis connection
 * 
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('❌ Redis health check failed:', error);
    return false;
  }
}

/**
 * Clean up old jobs
 * Useful for maintenance
 * 
 * @param {number} olderThan - Remove jobs older than this many milliseconds
 * @param {string} status - Job status to clean ('completed' or 'failed')
 */
async function cleanOldJobs(olderThan = 86400000, status = 'completed') {
  try {
    const cleaned = await aiJobsQueue.clean(olderThan, 1000, status);
    console.log(`🧹 Cleaned ${cleaned.length} ${status} jobs older than ${olderThan}ms`);
    return cleaned;
  } catch (error) {
    console.error(`❌ Failed to clean old jobs:`, error);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
async function close() {
  console.log('🔌 Closing queue connections...');
  await aiJobsQueue.close();
  await audioJobsQueue.close();
  await redis.quit();
  console.log('✅ Queue connections closed');
}

// Handle process shutdown gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queue connections...');
  await close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing queue connections...');
  await close();
  process.exit(0);
});

module.exports = {
  enqueue,
  enqueueAudio,
  getJobStatus,
  getQueueStats,
  healthCheck,
  cleanOldJobs,
  close,
  aiJobsQueue,
  audioJobsQueue,
  redis,
  // Issue #7: Idempotency functions
  calculateIdempotencyKey,
  checkIdempotency,
  cacheJobResult,
};

