import { getRateLimiterConfig } from './rateLimiterConfig';

interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

interface QueuedRequest {
  id: string;
  priority: number;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  retryCount: number;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: number;
}

class RateLimiter {
  private config: RateLimitConfig;
  private requestQueue: QueuedRequest[] = [];
  private isProcessing = false;
  private currentMinute = 0;
  private requestsThisMinute = 0;
  private tokensThisMinute = 0;
  private tokenUsageHistory: TokenUsage[] = [];
  private circuitBreakerOpen = false;
  private circuitBreakerTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<RateLimitConfig> = {}) {
    const defaultConfig = getRateLimiterConfig();
    this.config = {
      ...defaultConfig,
      ...config
    };

    // Start the minute counter
    this.startMinuteCounter();
  }

  private startMinuteCounter() {
    setInterval(() => {
      this.currentMinute = Math.floor(Date.now() / 60000);
      this.requestsThisMinute = 0;
      this.tokensThisMinute = 0;
      
      // Clean up old token usage history (keep last 10 minutes)
      const tenMinutesAgo = Date.now() - 600000;
      this.tokenUsageHistory = this.tokenUsageHistory.filter(
        usage => usage.timestamp > tenMinutesAgo
      );
      
      console.log('🔄 Rate limiter: Minute reset', {
        minute: this.currentMinute,
        requests: this.requestsThisMinute,
        tokens: this.tokensThisMinute
      });
    }, 60000);
  }

  private canMakeRequest(estimatedTokens: number = 0): boolean {
    if (this.circuitBreakerOpen) {
      console.log('🚫 Circuit breaker is open, rejecting request');
      return false;
    }

    if (this.requestsThisMinute >= this.config.requestsPerMinute) {
      console.log('🚫 Rate limit exceeded (requests per minute)');
      return false;
    }

    if (this.tokensThisMinute + estimatedTokens >= this.config.tokensPerMinute) {
      console.log('🚫 Token limit exceeded (tokens per minute)');
      return false;
    }

    return true;
  }

  private updateUsage(tokens: TokenUsage) {
    this.requestsThisMinute++;
    this.tokensThisMinute += tokens.totalTokens;
    this.tokenUsageHistory.push(tokens);

    console.log('📊 Rate limiter usage updated', {
      requests: this.requestsThisMinute,
      tokens: this.tokensThisMinute,
      totalTokens: tokens.totalTokens
    });
  }

  private calculateBackoffDelay(retryCount: number): number {
    const exponentialDelay = Math.min(
      this.config.baseDelay * Math.pow(2, retryCount),
      this.config.maxDelay
    );
    
    // Add jitter (±25% random variation)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    const finalDelay = exponentialDelay + jitter;
    
    console.log(`⏱️ Backoff delay calculated: ${finalDelay}ms (retry ${retryCount})`);
    return finalDelay;
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      // Sort by priority (higher priority first)
      this.requestQueue.sort((a, b) => b.priority - a.priority);

      const request = this.requestQueue[0];
      
      if (!this.canMakeRequest()) {
        // Wait until we can make a request
        await this.delay(1000);
        continue;
      }

      // Remove from queue
      this.requestQueue.shift();

      try {
        console.log(`🚀 Executing queued request: ${request.id}`);
        const result = await request.execute();
        request.resolve(result);
      } catch (error: any) {
        if (error?.status === 429 && request.retryCount < this.config.maxRetries) {
          // Rate limit error - retry with backoff
          request.retryCount++;
          const delay = this.calculateBackoffDelay(request.retryCount);
          
          console.log(`🔄 Retrying request ${request.id} in ${delay}ms (attempt ${request.retryCount})`);
          
          setTimeout(() => {
            this.requestQueue.unshift(request);
            this.processQueue();
          }, delay);
        } else {
          // Other error or max retries reached
          request.reject(error);
        }
      }
    }

    this.isProcessing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private openCircuitBreaker() {
    this.circuitBreakerOpen = true;
    console.log('🚨 Circuit breaker opened - pausing all requests');
    
    // Close circuit breaker after 1 minute
    this.circuitBreakerTimeout = setTimeout(() => {
      this.circuitBreakerOpen = false;
      console.log('✅ Circuit breaker closed - resuming requests');
    }, 60000);
  }

  async executeRequest<T>(
    executeFn: () => Promise<T>,
    priority: number = 0,
    estimatedTokens: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        priority,
        execute: executeFn,
        resolve,
        reject,
        timestamp: Date.now(),
        retryCount: 0
      };

      if (this.canMakeRequest(estimatedTokens)) {
        // Can execute immediately
        this.requestQueue.unshift(request);
      } else {
        // Add to queue
        this.requestQueue.push(request);
        console.log(`📋 Request ${request.id} queued (priority: ${priority})`);
      }

      // Start processing if not already running
      this.processQueue();
    });
  }

  // Method to update token usage after a successful request
  updateTokenUsage(tokens: TokenUsage) {
    this.updateUsage(tokens);
  }

  // Method to handle rate limit errors
  handleRateLimitError() {
    console.log('🚫 Rate limit error detected, opening circuit breaker');
    this.openCircuitBreaker();
  }

  // Get current status
  getStatus() {
    return {
      queueSize: this.requestQueue.length,
      isProcessing: this.isProcessing,
      circuitBreakerOpen: this.circuitBreakerOpen,
      requestsThisMinute: this.requestsThisMinute,
      tokensThisMinute: this.tokensThisMinute,
      requestsPerMinute: this.config.requestsPerMinute,
      tokensPerMinute: this.config.tokensPerMinute,
      currentMinute: this.currentMinute
    };
  }

  // Clear queue (useful for testing or emergency situations)
  clearQueue() {
    this.requestQueue = [];
    console.log('🧹 Request queue cleared');
  }
}

// Create a singleton instance with OpenAI's recommended limits
export const openAIRateLimiter = new RateLimiter();

export default RateLimiter;
