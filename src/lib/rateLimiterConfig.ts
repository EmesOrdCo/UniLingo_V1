// Rate Limiter Configuration
// Adjust these values based on your OpenAI plan and requirements

export const RATE_LIMITER_CONFIG = {
  // OpenAI API Limits (adjust based on your plan)
  requestsPerMinute: 60,    // Default: 60 RPM
  tokensPerMinute: 90000,   // Default: 90K TPM
  
  // Retry Configuration
  maxRetries: 3,            // Maximum retry attempts
  baseDelay: 1000,          // Base delay in milliseconds (1 second)
  maxDelay: 30000,          // Maximum delay in milliseconds (30 seconds)
  
  // Circuit Breaker
  circuitBreakerTimeout: 60000, // Time to wait before closing circuit breaker (1 minute)
  
  // Queue Configuration
  maxQueueSize: 100,        // Maximum number of requests in queue
  priorityLevels: {
    HIGH: 2,                // Lesson generation, critical operations
    MEDIUM: 1,              // PDF analysis, content processing
    LOW: 0                  // Background tasks, non-critical operations
  }
};

// Environment-specific overrides
export const getRateLimiterConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'development') {
    // More lenient limits for development
    return {
      ...RATE_LIMITER_CONFIG,
      requestsPerMinute: 120,   // Higher limit for development
      tokensPerMinute: 180000,  // Higher token limit for development
    };
  }
  
  if (env === 'production') {
    // Stricter limits for production
    return {
      ...RATE_LIMITER_CONFIG,
      requestsPerMinute: 50,    // Conservative limit for production
      tokensPerMinute: 75000,   // Conservative token limit for production
    };
  }
  
  return RATE_LIMITER_CONFIG;
};




