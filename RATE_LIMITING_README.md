# Rate Limiting System for OpenAI API

This system implements comprehensive rate limiting for OpenAI API calls to prevent quota and rate limit errors.

## 🚀 Features

### 1. **Queue System**
- All API requests pass through a centralized queue
- Requests are processed gradually, never exceeding API limits
- Priority-based processing (high priority requests go first)

### 2. **Exponential Backoff with Jitter**
- Automatic retry on 429 "Too Many Requests" errors
- Exponential backoff: 1s, 2s, 4s, 8s, etc.
- Random jitter prevents all clients retrying simultaneously

### 3. **Token Budget Management**
- Tracks tokens consumed per request (prompt + completion)
- Queues requests if remaining token budget is too low
- Automatic reset every minute

### 4. **Circuit Breaker**
- Temporarily pauses all requests if repeated 429 errors occur
- Automatically reopens after 1 minute
- Prevents cascading failures

### 5. **Adaptive Scheduling**
- Dynamically adjusts request pacing
- Priority system for different types of requests
- Configurable limits per environment

## 📁 Files

- `src/lib/rateLimiter.ts` - Core rate limiting logic
- `src/lib/openAIWithRateLimit.ts` - OpenAI wrapper with rate limiting
- `src/lib/rateLimiterConfig.ts` - Configuration settings
- `src/lib/lessonService.ts` - Updated lesson service using rate limiting

## ⚙️ Configuration

Edit `src/lib/rateLimiterConfig.ts` to adjust limits:

```typescript
export const RATE_LIMITER_CONFIG = {
  requestsPerMinute: 60,    // Adjust based on your OpenAI plan
  tokensPerMinute: 90000,   // Adjust based on your OpenAI plan
  maxRetries: 3,            // Maximum retry attempts
  baseDelay: 1000,          // Base delay in milliseconds
  maxDelay: 30000,          // Maximum delay in milliseconds
};
```

## 🔧 Usage

### Basic Usage

```typescript
import { openAIRateLimiter } from './lib/rateLimiter';

// Execute a request with rate limiting
const result = await openAIRateLimiter.executeRequest(
  async () => {
    // Your OpenAI API call here
    return await openai.chat.completions.create({...});
  },
  1, // Priority (higher = more important)
  100 // Estimated tokens
);
```

### Using the OpenAI Wrapper

```typescript
import OpenAIWithRateLimit from './lib/openAIWithRateLimit';

const openai = new OpenAIWithRateLimit({ 
  apiKey: 'your-api-key' 
});

// This automatically uses rate limiting
const response = await openai.createChatCompletion({
  model: 'gpt-4o-mini',
  messages: [...],
  priority: 1 // High priority
});
```

### Priority Levels

- **HIGH (2)**: Lesson generation, critical operations
- **MEDIUM (1)**: PDF analysis, content processing  
- **LOW (0)**: Background tasks, non-critical operations

## 📊 Monitoring

Check rate limiter status:

```typescript
const status = openai.getRateLimitStatus();
console.log('Queue size:', status.queueSize);
console.log('Requests this minute:', status.requestsThisMinute);
console.log('Tokens this minute:', status.tokensThisMinute);
console.log('Circuit breaker:', status.circuitBreakerOpen);
```

## 🚨 Error Handling

The system automatically handles:
- **429 Rate Limit Errors**: Retries with exponential backoff
- **Quota Exceeded**: Clear error message - requires adding credits to account
- **Circuit Breaker**: Temporarily pauses all requests

### Error Types

#### **Quota/Billing Errors** 💳
- **Error**: "You exceeded your current quota, please check your plan and billing details"
- **Cause**: Account has no credits remaining
- **Solution**: Add credits to your OpenAI account
- **System Response**: Clear error message, no retries

#### **Rate Limit Errors** 🚫
- **Error**: "Rate limit exceeded" (without quota/billing mention)
- **Cause**: Too many requests per minute
- **Solution**: Automatic retry with exponential backoff
- **System Response**: Queues requests and retries automatically

## 🔄 Migration from Direct API Calls

### Before (Direct API)
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({...})
});
```

### After (Rate Limited)
```typescript
const openai = new OpenAIWithRateLimit({ apiKey });
const response = await openai.createChatCompletion({...});
```

## 🧪 Testing

Test the rate limiter:

```typescript
// Clear queue for testing
openai.clearQueue();

// Check status
console.log(openai.getRateLimitStatus());
```

## 📈 Performance

- **Queue Processing**: Automatic, no manual intervention needed
- **Memory Usage**: Minimal overhead, cleans up old data
- **Latency**: Adds ~1-2ms per request when not rate limited
- **Scalability**: Handles hundreds of queued requests efficiently

## 🆘 Troubleshooting

### Common Issues

1. **Getting "quota exceeded" errors?** 💳
   - **Problem**: Your OpenAI account has no credits
   - **Solution**: Add credits to your OpenAI account at platform.openai.com
   - **Check**: Use the test script to verify account status
   - **Note**: This is NOT a rate limit issue - it's a billing issue

2. **Still getting rate limit errors?** 🚫
   - Check your OpenAI plan limits
   - Adjust `requestsPerMinute` and `tokensPerMinute` in config
   - Monitor queue size and processing status

3. **Requests stuck in queue?**
   - Check circuit breaker status
   - Verify API key is valid
   - Check console for error logs

4. **High latency?**
   - Reduce priority for non-critical requests
   - Check if you're hitting rate limits
   - Monitor token usage

### Debug Mode

Enable detailed logging by checking console output:
- 🔄 Rate limiter status updates
- 📋 Request queuing information
- 🚀 Request execution logs
- 🚫 Rate limit detection
- 🚨 Circuit breaker events

## 🔮 Future Enhancements

- [ ] Dashboard UI for monitoring
- [ ] Webhook notifications for rate limit events
- [ ] Advanced queue management
- [ ] Load balancing across multiple API keys
- [ ] Historical usage analytics
