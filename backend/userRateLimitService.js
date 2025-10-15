/**
 * Redis-backed User Rate Limiting Service
 * Replaces in-memory rate limiting for horizontal scaling
 * 
 * Features:
 * - Shared state across all instances via Redis
 * - Per-user and per-IP rate limiting
 * - Automatic cleanup of old data
 * - Configurable limits and windows
 * - Sliding window algorithm
 */

const { redis } = require('./redisConnection');

class UserRateLimitService {
  constructor() {
    this.redis = redis;
    this.defaultTTL = 60 * 60; // 1 hour in seconds
    this.cleanupInterval = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // Default rate limits
    this.limits = {
      general: { requests: 100, window: 15 * 60 * 1000 }, // 100 requests per 15 minutes
      ai: { requests: 20, window: 60 * 1000 }, // 20 requests per minute
      pronunciation: { requests: 10, window: 60 * 1000 }, // 10 requests per minute
      tts: { requests: 30, window: 60 * 1000 }, // 30 requests per minute
      image: { requests: 15, window: 60 * 1000 }, // 15 requests per minute
    };
    
    // Start cleanup process
    this.startCleanupProcess();
  }

  /**
   * Check if request is allowed for user/IP
   * @param {string} key - Rate limit key (user:123:ai or ip:192.168.1.1:general)
   * @param {string} type - Rate limit type (general, ai, pronunciation, tts, image)
   * @returns {Promise<object>} Rate limit result
   */
  async checkLimit(key, type = 'general') {
    try {
      const limit = this.limits[type] || this.limits.general;
      const windowMs = limit.window;
      const maxRequests = limit.requests;
      
      const now = Date.now();
      const windowStart = now - windowMs;
      const redisKey = `rate_limit:${key}:${type}`;
      
      // Remove old entries outside the window
      await this.redis.zremrangebyscore(redisKey, 0, windowStart);
      
      // Count requests in current window
      const currentCount = await this.redis.zcard(redisKey);
      
      if (currentCount >= maxRequests) {
        // Rate limit exceeded
        const oldestEntry = await this.redis.zrange(redisKey, 0, 0, 'WITHSCORES');
        const resetAt = oldestEntry[1] ? 
          new Date(parseInt(oldestEntry[1]) + windowMs) : 
          new Date(now + windowMs);
        
        return {
          allowed: false,
          remaining: 0,
          resetAt: resetAt,
          current: currentCount,
          limit: maxRequests,
          type: type
        };
      }
      
      // Add current request
      const requestId = `${now}-${Math.random()}`;
      await this.redis.zadd(redisKey, now, requestId);
      await this.redis.expire(redisKey, Math.ceil(windowMs / 1000) + 1);
      
      return {
        allowed: true,
        remaining: maxRequests - currentCount - 1,
        resetAt: new Date(now + windowMs),
        current: currentCount + 1,
        limit: maxRequests,
        type: type
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: 999,
        resetAt: new Date(Date.now() + 60000),
        current: 0,
        limit: 1000,
        type: type,
        error: error.message
      };
    }
  }

  /**
   * Check user-specific rate limit
   * @param {string} userId - User ID
   * @param {string} type - Rate limit type
   * @returns {Promise<object>} Rate limit result
   */
  async checkUserLimit(userId, type = 'general') {
    const key = `user:${userId}`;
    return await this.checkLimit(key, type);
  }

  /**
   * Check IP-specific rate limit
   * @param {string} ip - IP address
   * @param {string} type - Rate limit type
   * @returns {Promise<object>} Rate limit result
   */
  async checkIPLimit(ip, type = 'general') {
    const key = `ip:${ip}`;
    return await this.checkLimit(key, type);
  }

  /**
   * Get current usage without consuming
   * @param {string} key - Rate limit key
   * @param {string} type - Rate limit type
   * @returns {Promise<number>} Current count
   */
  async getCurrentCount(key, type = 'general') {
    try {
      const limit = this.limits[type] || this.limits.general;
      const windowMs = limit.window;
      const now = Date.now();
      const windowStart = now - windowMs;
      const redisKey = `rate_limit:${key}:${type}`;
      
      // Remove old entries
      await this.redis.zremrangebyscore(redisKey, 0, windowStart);
      
      // Count requests in window
      return await this.redis.zcard(redisKey);
    } catch (error) {
      console.error('Error getting current count:', error);
      return 0;
    }
  }

  /**
   * Reset rate limit for a key (admin function)
   * @param {string} key - Rate limit key to reset
   * @param {string} type - Rate limit type
   */
  async reset(key, type = 'general') {
    try {
      const redisKey = `rate_limit:${key}:${type}`;
      await this.redis.del(redisKey);
      console.log(`🔄 Rate limit reset: ${key}:${type}`);
      return true;
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      return false;
    }
  }

  /**
   * Reset user rate limits (admin function)
   * @param {string} userId - User ID to reset
   * @param {string} type - Rate limit type (optional, resets all if not specified)
   */
  async resetUser(userId, type = null) {
    try {
      const key = `user:${userId}`;
      
      if (type) {
        await this.reset(key, type);
      } else {
        // Reset all types for user
        const pipeline = this.redis.pipeline();
        Object.keys(this.limits).forEach(limitType => {
          pipeline.del(`rate_limit:${key}:${limitType}`);
        });
        await pipeline.exec();
      }
      
      console.log(`🔄 User rate limits reset: ${userId}${type ? `:${type}` : ''}`);
      return true;
    } catch (error) {
      console.error('Error resetting user rate limits:', error);
      return false;
    }
  }

  /**
   * Clean up old rate limit data
   */
  async cleanupOldData() {
    try {
      const pattern = 'rate_limit:*';
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }

      let cleanedCount = 0;
      const now = Date.now();
      
      // Check each key and clean up old entries
      for (const key of keys) {
        const keyParts = key.split(':');
        if (keyParts.length >= 4) {
          const type = keyParts[keyParts.length - 1];
          const limit = this.limits[type] || this.limits.general;
          const windowMs = limit.window;
          const windowStart = now - windowMs;
          
          // Remove old entries
          const removed = await this.redis.zremrangebyscore(key, 0, windowStart);
          if (removed > 0) {
            cleanedCount += removed;
          }
          
          // Check if key is now empty and can be deleted
          const count = await this.redis.zcard(key);
          if (count === 0) {
            await this.redis.del(key);
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Rate limit cleanup: ${cleanedCount} old entries removed`);
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up rate limit data:', error);
      return 0;
    }
  }

  /**
   * Start cleanup process
   */
  startCleanupProcess() {
    // Run cleanup every hour
    setInterval(async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        console.error('Error in rate limit cleanup process:', error);
      }
    }, this.cleanupInterval);
    
    console.log('🧹 Rate limit cleanup process started');
  }

  /**
   * Get rate limiting statistics
   */
  async getStats() {
    try {
      const pattern = 'rate_limit:*';
      const keys = await this.redis.keys(pattern);
      
      const stats = {
        totalKeys: keys.length,
        byType: {},
        totalRequests: 0
      };
      
      // Count by type
      for (const key of keys) {
        const keyParts = key.split(':');
        if (keyParts.length >= 4) {
          const type = keyParts[keyParts.length - 1];
          const count = await this.redis.zcard(key);
          
          if (!stats.byType[type]) {
            stats.byType[type] = 0;
          }
          stats.byType[type] += count;
          stats.totalRequests += count;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting rate limit stats:', error);
      return {
        totalKeys: 0,
        byType: {},
        totalRequests: 0
      };
    }
  }

  /**
   * Update rate limit configuration
   * @param {string} type - Rate limit type
   * @param {object} config - New configuration
   */
  updateLimit(type, config) {
    if (this.limits[type]) {
      this.limits[type] = { ...this.limits[type], ...config };
      console.log(`⚙️ Rate limit updated: ${type}`, this.limits[type]);
    }
  }

  /**
   * Get all rate limit configurations
   */
  getLimits() {
    return { ...this.limits };
  }
}

// Export singleton instance
const userRateLimitService = new UserRateLimitService();

module.exports = userRateLimitService;
