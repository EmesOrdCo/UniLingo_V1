/**
 * Redis-backed Circuit Breaker
 * Shared across all service instances
 * 
 * States: CLOSED (normal) → OPEN (blocking) → HALF_OPEN (testing) → CLOSED
 * 
 * Features:
 * - Shared state in Redis (all instances see same state)
 * - Automatic state transitions
 * - Configurable thresholds and timeouts
 * - Metrics emission
 * 
 * Issue #6 + #8: Circuit breaker with Redis state
 */

const { redis } = require('./redisConnection');

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    
    // Configuration
    this.config = {
      failureThreshold: options.failureThreshold || 5,    // Failures before opening
      successThreshold: options.successThreshold || 2,     // Successes to close from half-open
      timeout: options.timeout || 60000,                   // Time in OPEN before trying HALF_OPEN (ms)
      halfOpenMaxAttempts: options.halfOpenMaxAttempts || 3, // Max attempts in HALF_OPEN
      monitoringWindow: options.monitoringWindow || 60000, // Window to count failures (ms)
    };
    
    // Use shared Redis connection
    this.redis = redis;
    
    // Redis keys
    this.keys = {
      state: `circuit:${name}:state`,
      failures: `circuit:${name}:failures`,
      successes: `circuit:${name}:successes`,
      openedAt: `circuit:${name}:opened_at`,
      attempts: `circuit:${name}:attempts`,
    };
    
    console.log(`🔌 Circuit Breaker initialized: ${name}`);
  }

  /**
   * Get current circuit breaker state from Redis
   * @returns {Promise<string>} - 'CLOSED', 'OPEN', or 'HALF_OPEN'
   */
  async getState() {
    const state = await this.redis.get(this.keys.state);
    return state || 'CLOSED';
  }

  /**
   * Execute function with circuit breaker protection
   * 
   * @param {Function} fn - Async function to execute
   * @returns {Promise} - Result of function or circuit breaker error
   */
  async execute(fn) {
    const state = await this.getState();
    
    // Check if circuit is OPEN
    if (state === 'OPEN') {
      const openedAt = parseInt(await this.redis.get(this.keys.openedAt) || '0');
      const now = Date.now();
      
      // Check if timeout has passed
      if (now - openedAt > this.config.timeout) {
        console.log(`🔄 Circuit breaker ${this.name}: OPEN → HALF_OPEN (timeout passed)`);
        await this.transitionToHalfOpen();
      } else {
        const remainingMs = this.config.timeout - (now - openedAt);
        throw new Error(`Circuit breaker is OPEN for ${this.name}. Retry in ${Math.ceil(remainingMs / 1000)}s`);
      }
    }
    
    // Execute the function
    try {
      const result = await fn();
      await this.recordSuccess();
      return result;
    } catch (error) {
      await this.recordFailure();
      throw error;
    }
  }

  /**
   * Record a successful execution
   */
  async recordSuccess() {
    const state = await this.getState();
    
    if (state === 'HALF_OPEN') {
      const successes = await this.redis.incr(this.keys.successes);
      
      if (successes >= this.config.successThreshold) {
        console.log(`✅ Circuit breaker ${this.name}: HALF_OPEN → CLOSED (success threshold reached)`);
        await this.transitionToClosed();
      } else {
        console.log(`✅ Circuit breaker ${this.name}: HALF_OPEN success ${successes}/${this.config.successThreshold}`);
      }
    }
    
    // Always reset failure count on success
    await this.redis.del(this.keys.failures);
  }

  /**
   * Record a failed execution
   */
  async recordFailure() {
    const state = await this.getState();
    
    // Add failure to count with expiry (monitoring window)
    await this.redis.incr(this.keys.failures);
    await this.redis.expire(this.keys.failures, Math.ceil(this.config.monitoringWindow / 1000));
    
    const failures = parseInt(await this.redis.get(this.keys.failures) || '0');
    
    if (state === 'HALF_OPEN') {
      console.log(`❌ Circuit breaker ${this.name}: HALF_OPEN → OPEN (failure during test)`);
      await this.transitionToOpen();
    } else if (state === 'CLOSED' && failures >= this.config.failureThreshold) {
      console.log(`❌ Circuit breaker ${this.name}: CLOSED → OPEN (${failures} failures)`);
      await this.transitionToOpen();
    } else {
      console.log(`⚠️ Circuit breaker ${this.name}: Failure ${failures}/${this.config.failureThreshold}`);
    }
  }

  /**
   * Transition to OPEN state
   */
  async transitionToOpen() {
    await this.redis.set(this.keys.state, 'OPEN');
    await this.redis.set(this.keys.openedAt, Date.now().toString());
    await this.redis.del(this.keys.successes);
    
    // Emit metric/log
    console.log(`🚨 Circuit breaker ${this.name} is now OPEN - blocking all requests`);
    console.log(`   Will transition to HALF_OPEN after ${this.config.timeout}ms`);
  }

  /**
   * Transition to HALF_OPEN state
   */
  async transitionToHalfOpen() {
    await this.redis.set(this.keys.state, 'HALF_OPEN');
    await this.redis.set(this.keys.attempts, '0');
    await this.redis.del(this.keys.successes);
    await this.redis.del(this.keys.failures);
    
    console.log(`🔄 Circuit breaker ${this.name} is now HALF_OPEN - testing with limited requests`);
  }

  /**
   * Transition to CLOSED state
   */
  async transitionToClosed() {
    await this.redis.set(this.keys.state, 'CLOSED');
    await this.redis.del(this.keys.failures);
    await this.redis.del(this.keys.successes);
    await this.redis.del(this.keys.openedAt);
    await this.redis.del(this.keys.attempts);
    
    console.log(`✅ Circuit breaker ${this.name} is now CLOSED - normal operation resumed`);
  }

  /**
   * Get circuit breaker status and metrics
   * @returns {Promise<Object>}
   */
  async getStatus() {
    const state = await this.getState();
    const failures = parseInt(await this.redis.get(this.keys.failures) || '0');
    const successes = parseInt(await this.redis.get(this.keys.successes) || '0');
    const openedAt = parseInt(await this.redis.get(this.keys.openedAt) || '0');
    
    return {
      name: this.name,
      state: state,
      failures: failures,
      successes: successes,
      failureThreshold: this.config.failureThreshold,
      successThreshold: this.config.successThreshold,
      openedAt: openedAt ? new Date(openedAt).toISOString() : null,
      nextRetryAt: openedAt && state === 'OPEN' ? 
        new Date(openedAt + this.config.timeout).toISOString() : null,
    };
  }

  /**
   * Manually reset circuit breaker (admin function)
   */
  async reset() {
    await this.transitionToClosed();
    console.log(`🔄 Circuit breaker ${this.name} manually reset to CLOSED`);
  }

  /**
   * Clean up Redis connection
   */
  async close() {
    await this.redis.quit();
  }
}

module.exports = CircuitBreaker;

