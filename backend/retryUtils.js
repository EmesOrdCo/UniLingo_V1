/**
 * Retry Utilities with Exponential Backoff and Jitter
 * 
 * Features:
 * - Smart error classification (transient vs permanent)
 * - Exponential backoff with jitter
 * - Configurable retry strategies
 * - Detailed logging
 * 
 * Issue #8: Robust retry logic
 */

const Redis = require('ioredis');

// Redis connection
const redisConfig = process.env.REDIS_URL ? 
  process.env.REDIS_URL :
  {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  };

const redis = new Redis(redisConfig);

/**
 * Error classification
 * Determines if an error is retryable
 */
const ERROR_TYPES = {
  TRANSIENT: 'transient',     // Retry recommended
  PERMANENT: 'permanent',     // Don't retry
  RATE_LIMIT: 'rate_limit',   // Retry with backoff
};

/**
 * Classify error type based on error code/message
 * 
 * @param {Error} error - Error object
 * @returns {string} - Error type (TRANSIENT, PERMANENT, or RATE_LIMIT)
 */
function classifyError(error) {
  const message = error.message?.toLowerCase() || '';
  const code = error.code || error.status || error.statusCode;
  
  // Rate limiting errors
  if (code === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return ERROR_TYPES.RATE_LIMIT;
  }
  
  // Transient errors (network, temporary server issues)
  if (
    code === 408 || // Request Timeout
    code === 502 || // Bad Gateway
    code === 503 || // Service Unavailable
    code === 504 || // Gateway Timeout
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('network') ||
    message.includes('socket hang up') ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED'
  ) {
    return ERROR_TYPES.TRANSIENT;
  }
  
  // Permanent errors (bad request, auth, not found)
  if (
    code === 400 || // Bad Request
    code === 401 || // Unauthorized
    code === 403 || // Forbidden
    code === 404 || // Not Found
    code === 422 || // Unprocessable Entity
    message.includes('invalid') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('not found')
  ) {
    return ERROR_TYPES.PERMANENT;
  }
  
  // Default to transient (be optimistic about retrying)
  return ERROR_TYPES.TRANSIENT;
}

/**
 * Check if error should be retried
 * 
 * @param {Error} error - Error object
 * @returns {boolean} - True if should retry
 */
function shouldRetry(error) {
  const errorType = classifyError(error);
  return errorType !== ERROR_TYPES.PERMANENT;
}

/**
 * Calculate backoff delay with exponential backoff and jitter
 * 
 * @param {number} attemptNumber - Current attempt number (0-based)
 * @param {object} options - Configuration options
 * @returns {number} - Delay in milliseconds
 */
function calculateBackoff(attemptNumber, options = {}) {
  const {
    baseDelay = 1000,      // 1 second base
    maxDelay = 30000,      // 30 seconds max
    factor = 2,            // Exponential factor
    jitter = 0.25,         // 25% jitter
  } = options;
  
  // Exponential backoff: baseDelay * (factor ^ attemptNumber)
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(factor, attemptNumber),
    maxDelay
  );
  
  // Add jitter: random variation of ±jitter%
  const jitterAmount = exponentialDelay * jitter;
  const randomJitter = (Math.random() * 2 - 1) * jitterAmount;
  const finalDelay = Math.max(0, exponentialDelay + randomJitter);
  
  console.log(`⏱️ Backoff delay: ${finalDelay.toFixed(0)}ms (attempt ${attemptNumber + 1}, base: ${exponentialDelay}ms, jitter: ${randomJitter.toFixed(0)}ms)`);
  
  return Math.floor(finalDelay);
}

/**
 * Retry a function with exponential backoff and jitter
 * 
 * @param {Function} fn - Async function to retry
 * @param {object} options - Retry configuration
 * @returns {Promise} - Result of function or final error
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 5,
    baseDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    jitter = 0.25,
    onRetry = null,         // Callback (error, attempt) => {}
    shouldRetryFn = shouldRetry,
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      
      if (attempt > 0) {
        console.log(`✅ Retry successful after ${attempt} attempt(s)`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      const errorType = classifyError(error);
      
      console.error(`❌ Attempt ${attempt + 1}/${maxAttempts} failed:`, {
        error: error.message,
        type: errorType,
        code: error.code || error.status || error.statusCode,
      });
      
      // Check if we should retry this error
      if (!shouldRetryFn(error)) {
        console.error(`🚫 Error is permanent, not retrying:`, error.message);
        throw error;
      }
      
      // Last attempt - don't wait, just throw
      if (attempt >= maxAttempts - 1) {
        console.error(`🚫 Max attempts (${maxAttempts}) reached, giving up`);
        throw error;
      }
      
      // Calculate delay
      let delay;
      if (errorType === ERROR_TYPES.RATE_LIMIT) {
        // For rate limit errors, use longer backoff
        delay = calculateBackoff(attempt, {
          baseDelay: baseDelay * 2, // 2x longer for rate limits
          maxDelay: maxDelay,
          factor: factor,
          jitter: jitter,
        });
      } else {
        delay = calculateBackoff(attempt, {
          baseDelay,
          maxDelay,
          factor,
          jitter,
        });
      }
      
      // Call retry callback if provided
      if (onRetry) {
        try {
          await onRetry(error, attempt);
        } catch (callbackError) {
          console.error('⚠️ Retry callback error:', callbackError);
        }
      }
      
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All attempts failed
  throw lastError;
}

/**
 * Wrap a function with retry logic
 * Returns a new function that automatically retries on failure
 * 
 * @param {Function} fn - Function to wrap
 * @param {object} options - Retry options
 * @returns {Function} - Wrapped function with retry
 */
function withRetry(fn, options = {}) {
  return async (...args) => {
    return retryWithBackoff(() => fn(...args), options);
  };
}

/**
 * Check if user/IP is rate limited (Redis-backed)
 * 
 * @param {string} identifier - User ID or IP address
 * @param {string} action - Action type (e.g., 'ai', 'pronunciation')
 * @param {object} limits - { max: number, windowMs: number }
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: Date}>}
 */
async function checkRateLimit(identifier, action, limits) {
  const key = `ratelimit:${identifier}:${action}`;
  const now = Date.now();
  const windowStart = now - limits.windowMs;
  
  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);
  
  // Count current requests
  const currentCount = await redis.zcard(key);
  
  if (currentCount >= limits.max) {
    // Get oldest entry to calculate reset time
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetAt = oldest[1] ? new Date(parseInt(oldest[1]) + limits.windowMs) : new Date(now + limits.windowMs);
    
    console.warn(`🚨 Rate limit exceeded: ${identifier} - ${action} (${currentCount}/${limits.max})`);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: resetAt,
      current: currentCount,
      limit: limits.max,
    };
  }
  
  // Add current request
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, Math.ceil(limits.windowMs / 1000) + 1);
  
  return {
    allowed: true,
    remaining: limits.max - currentCount - 1,
    resetAt: new Date(now + limits.windowMs),
    current: currentCount + 1,
    limit: limits.max,
  };
}

/**
 * Express middleware for Redis-backed rate limiting
 * 
 * @param {string} action - Action type
 * @param {object} limits - Rate limit configuration
 * @returns {Function} - Express middleware
 */
function rateLimitMiddleware(action, limits) {
  return async (req, res, next) => {
    const userId = req.headers['user-id'] || req.body?.userId || 'anonymous';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check user rate limit
    const userLimit = await checkRateLimit(userId, action, limits);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': userLimit.limit,
      'X-RateLimit-Remaining': userLimit.remaining,
      'X-RateLimit-Reset': userLimit.resetAt.toISOString(),
    });
    
    if (!userLimit.allowed) {
      return res.status(429).json({
        error: `Rate limit exceeded for ${action}`,
        code: 'RATE_LIMIT_EXCEEDED',
        resetAt: userLimit.resetAt.toISOString(),
        current: userLimit.current,
        limit: userLimit.limit,
      });
    }
    
    next();
  };
}

/**
 * Get rate limit status for monitoring
 * 
 * @param {string} identifier - User ID or IP
 * @param {string} action - Action type
 * @param {number} windowMs - Time window
 * @returns {Promise<number>} - Current count
 */
async function getRateLimitStatus(identifier, action, windowMs) {
  const key = `ratelimit:${identifier}:${action}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  await redis.zremrangebyscore(key, 0, windowStart);
  return await redis.zcard(key);
}

module.exports = {
  // Retry utilities
  retryWithBackoff,
  withRetry,
  shouldRetry,
  classifyError,
  calculateBackoff,
  
  // Redis rate limiting
  checkRateLimit,
  rateLimitMiddleware,
  getRateLimitStatus,
  
  // Error types
  ERROR_TYPES,
};

