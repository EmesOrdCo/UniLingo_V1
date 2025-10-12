/**
 * Redis-backed Rate Limiter
 * Shared across all service instances
 * 
 * Uses token bucket algorithm with Redis for distributed rate limiting
 * 
 * Features:
 * - Shared state across all instances
 * - Per-user and per-IP rate limiting
 * - Sliding window for accurate rate limiting
 * - Automatic cleanup of old entries
 * 
 * Issue #6: Redis-backed rate limiting
 */

const Bottleneck = require('bottleneck');
const { redis, redisConfig } = require('./redisConnection');

// Use shared Redis connection
const redisClient = redis; // Use the shared connection

/**
 * Create a Redis-backed rate limiter
 * 
 * @param {string} name - Limiter name (e.g., 'openai', 'azure-speech')
 * @param {object} options - Rate limit configuration
 * @returns {Bottleneck} - Configured limiter
 */
function createLimiter(name, options = {}) {
  // Bottleneck needs TWO Redis connections: one for commands, one for pub/sub
  // We'll use the shared connection for commands and let Bottleneck create a subscriber
  const limiter = new Bottleneck({
    id: name, // Shared across all instances
    
    // Redis connection for distributed state
    datastore: 'ioredis',
    client: redisClient, // Use shared Redis client for commands
    // Bottleneck will create its own subscriber connection using the same config
    Connection: require('ioredis'),
    clientOptions: typeof redisConfig === 'string' ? redisConfig : redisConfig,
    clearDatastore: false,
    
    // Rate limiting configuration
    reservoir: options.reservoir, // Max requests (e.g., 50 for OpenAI)
    reservoirRefreshAmount: options.reservoir,
    reservoirRefreshInterval: options.window || 60000, // 1 minute default
    
    // Concurrency
    maxConcurrent: options.maxConcurrent || null, // null = unlimited
    minTime: options.minTime || 0, // Min time between jobs
    
    // Retry configuration
    retryLimit: options.retryLimit || 2,
    
    // Tracking
    trackDoneStatus: true,
  });
  
  // Event handlers
  limiter.on('failed', (error, jobInfo) => {
    console.error(`⚠️ Rate limiter ${name}: Job failed`, {
      error: error.message,
      retryCount: jobInfo.retryCount
    });
  });
  
  limiter.on('retry', (error, jobInfo) => {
    console.log(`🔄 Rate limiter ${name}: Retrying job (attempt ${jobInfo.retryCount + 1})`);
  });
  
  limiter.on('depleted', () => {
    console.warn(`🚨 Rate limiter ${name}: Reservoir depleted (rate limit hit)`);
  });
  
  limiter.on('debug', (message) => {
    if (process.env.DEBUG_RATE_LIMITER === 'true') {
      console.log(`🔍 Rate limiter ${name}:`, message);
    }
  });
  
  console.log(`✅ Rate limiter created: ${name}`, {
    reservoir: options.reservoir,
    window: options.window,
    maxConcurrent: options.maxConcurrent
  });
  
  return limiter;
}

/**
 * Pre-configured limiters for different services
 */

// Issue #13: Fleet-wide provider throttling with environment variable configuration
// These limiters are shared across ALL instances via Redis

// OpenAI rate limiter
// Configurable via environment variables for easy tuning
const openaiLimiter = createLimiter('openai', {
  reservoir: parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '50'),     // Requests per minute
  window: 60000,           // Per minute
  maxConcurrent: parseInt(process.env.OPENAI_MAX_CONCURRENT || '5'),  // Max concurrent
  minTime: 100,            // 100ms between requests
});

console.log(`⚙️ OpenAI limiter configured: ${process.env.OPENAI_RATE_LIMIT_RPM || 50} req/min, ${process.env.OPENAI_MAX_CONCURRENT || 5} concurrent`);

// Azure Speech rate limiter  
// 20 concurrent connections (S0 tier) - configurable for higher tiers
const azureSpeechLimiter = createLimiter('azure-speech', {
  maxConcurrent: parseInt(process.env.AZURE_SPEECH_MAX_CONCURRENT || '20'),  // S0 tier default
  minTime: parseInt(process.env.AZURE_SPEECH_MIN_TIME || '50'),              // 50ms between
});

console.log(`⚙️ Azure Speech limiter configured: ${process.env.AZURE_SPEECH_MAX_CONCURRENT || 20} concurrent`);

// Azure Vision OCR rate limiter
// Conservative limit for free tier (5000/month)
const azureVisionLimiter = createLimiter('azure-vision', {
  reservoir: parseInt(process.env.AZURE_VISION_RATE_LIMIT_RPM || '20'),  // 20 per minute default
  window: 60000,           // Per minute
  maxConcurrent: parseInt(process.env.AZURE_VISION_MAX_CONCURRENT || '5'),  // Max 5 concurrent
});

console.log(`⚙️ Azure Vision limiter configured: ${process.env.AZURE_VISION_RATE_LIMIT_RPM || 20} req/min, ${process.env.AZURE_VISION_MAX_CONCURRENT || 5} concurrent`);

/**
 * Simple Redis-backed rate limiting (for IP/User limits)
 * Uses sliding window algorithm
 */
class RedisRateLimiter {
  constructor(redis) {
    this.redis = redis;
  }

  /**
   * Check and consume rate limit
   * 
   * @param {string} key - Rate limit key (e.g., 'user:123:ai' or 'ip:192.168.1.1:general')
   * @param {number} limit - Max requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
   */
  async checkLimit(key, limit, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${key}`;
    
    // Remove old entries outside the window
    await this.redis.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count requests in current window
    const currentCount = await this.redis.zcard(redisKey);
    
    if (currentCount >= limit) {
      // Rate limit exceeded
      const oldestEntry = await this.redis.zrange(redisKey, 0, 0, 'WITHSCORES');
      const resetAt = oldestEntry[1] ? new Date(parseInt(oldestEntry[1]) + windowMs) : new Date(now + windowMs);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: resetAt,
        current: currentCount,
        limit: limit,
      };
    }
    
    // Add current request
    await this.redis.zadd(redisKey, now, `${now}-${Math.random()}`);
    await this.redis.expire(redisKey, Math.ceil(windowMs / 1000) + 1);
    
    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      resetAt: new Date(now + windowMs),
      current: currentCount + 1,
      limit: limit,
    };
  }

  /**
   * Get current usage without consuming
   * 
   * @param {string} key - Rate limit key
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Promise<number>} - Current count
   */
  async getCurrentCount(key, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${key}`;
    
    // Remove old entries
    await this.redis.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count requests in window
    return await this.redis.zcard(redisKey);
  }

  /**
   * Reset rate limit for a key (admin function)
   * 
   * @param {string} key - Rate limit key to reset
   */
  async reset(key) {
    const redisKey = `ratelimit:${key}`;
    await this.redis.del(redisKey);
    console.log(`🔄 Rate limit reset: ${key}`);
  }
}

// Export singleton instance
const rateLimiter = new RedisRateLimiter(redis);

module.exports = {
  openaiLimiter,
  azureSpeechLimiter,
  azureVisionLimiter,
  rateLimiter,
  createLimiter,
  redis,
};

