# UniLingo Railway Backend - Concurrency Summary

**Quick Reference Guide** | October 12, 2025

---

## Current Architecture

```
┌─────────────┐
│   Clients   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────┐
│  Railway Web Service    │
│  (Single Instance)      │
│                         │
│  ┌───────────────────┐  │
│  │  Express.js       │  │
│  │  • Async/Await    │  │
│  │  • Rate Limiting  │  │
│  └─────────┬─────────┘  │
│            │             │
│  ┌─────────▼─────────┐  │
│  │  In-Memory Queues │  │
│  │  • OpenAI (1x)    │  │
│  │  • Azure (20x)    │  │
│  └─────────┬─────────┘  │
│            │             │
└────────────┼─────────────┘
             │ Inline API Calls
             ▼
┌──────────────────────────┐
│   External APIs          │
│  • OpenAI (5-30s)        │
│  • Azure Speech (2-10s)  │
│  • Azure OCR (1-3s)      │
│  • AWS Polly (2-15s)     │
└──────────────────────────┘
```

**❌ No Workers | ❌ No Redis | ❌ No Auto-scaling**

---

## Key Findings

### ✅ What's Working
- **Async I/O**: Node.js handles multiple connections efficiently
- **Rate Limiting**: Per-IP and per-user limits in place
- **Circuit Breakers**: Fail-safe for API failures
- **Monitoring**: Comprehensive metrics and health checks
- **Request Queuing**: In-memory queues for OpenAI and Azure

### 🚨 Critical Issues

| Issue | Impact | Risk Level |
|-------|--------|------------|
| **No horizontal scaling** | Single point of failure | 🔴 High |
| **Blocking API calls** | 5-30s HTTP response times | 🔴 High |
| **In-memory queues** | Lost on restart | 🔴 High |
| **Sequential OpenAI** | 1 request at a time | 🟡 Medium |
| **No background workers** | Timeouts under load | 🔴 High |

---

## How Concurrent Requests Are Handled

### Example: 10 Users Generate Flashcards Simultaneously

**Current Behavior:**
```
User 1:  [████████████████████] 20s → Response
User 2:     [█████████████████] 19s → Response
User 3:        [████████████] 12s → Response
User 4:           [███████] 7s → Response
User 5:              [██] 2s → Response
...
Total: 79 seconds for 10 users
```

**Problem:** Each request blocks HTTP response while waiting for OpenAI

**What Should Happen (with workers):**
```
All Users: [✓] 0.2s → Job ID returned
           [Background processing: 20s]
           [Webhook notification]
           
Total: 0.2 seconds for all users
```

---

## API Concurrency Patterns

| Service | Pattern | Concurrency | Blocking Time |
|---------|---------|-------------|---------------|
| **OpenAI** | Sequential queue | 1 at a time | 5-30 seconds |
| **Azure Speech** | Parallel queue | Max 20 | 2-10 seconds |
| **Azure OCR** | Direct call | No limit | 1-3 seconds |
| **AWS Polly** | Direct call | No limit | 2-15 seconds |
| **PDF Parse** | Direct call | No limit | 5-20 seconds |

### Rate Limits

```
General (IP):        100 requests / 15 minutes
Pronunciation (IP):  10 requests / minute
Pronunciation (User): 100 requests / hour
AI (IP):             20 requests / minute
AI (User):           200 requests / hour

OpenAI (App):        50 requests / minute
OpenAI (App):        75,000 tokens / minute
Azure Speech:        20 concurrent connections
```

---

## Bottleneck Analysis

### 1. OpenAI Sequential Processing 🔴
```javascript
// backend/aiService.js (Lines 99-145)
while (requestQueue.length > 0) {
  const request = requestQueue.shift();
  const result = await request.execute(); // ⏳ Blocks here
  request.resolve(result);
}
```
**Impact:** Second user waits for first user to complete  
**Solution:** Process 5 requests concurrently instead of 1

### 2. In-Memory Queues 🔴
```javascript
let requestQueue = []; // ❌ Lost on restart
```
**Impact:** Requests lost on deployment or crash  
**Solution:** Use Redis + BullMQ for persistent queues

### 3. No Background Workers 🔴
```javascript
app.post('/api/ai/generate-flashcards', async (req, res) => {
  const result = await AIService.generateFlashcards(...); // ⏳ Blocks HTTP
  res.json(result);
});
```
**Impact:** HTTP timeout risk (Railway default: 30s)  
**Solution:** Return job ID immediately, process in background

---

## Recommended Architecture

```
┌────────────┐
│  Clients   │
└─────┬──────┘
      │
      ▼
┌─────────────────────────┐
│  Web Service            │ ◄─┐
│  (Auto-scale 1-5)       │   │ Read status
│  • Return job IDs       │   │
│  • No blocking (< 200ms)│   │
└─────────┬───────────────┘   │
          │                   │
          ▼                   │
┌─────────────────────────┐   │
│  Redis                  │   │
│  • Job queue (BullMQ)   │───┘
│  • Rate limits (shared) │
│  • Circuit breaker      │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  Worker Service         │
│  (Auto-scale 1-3)       │
│  • OpenAI (5x parallel) │
│  • Audio generation     │
│  • Long operations      │
└─────────┬───────────────┘
          │
          ▼
    External APIs
```

---

## Implementation Plan

### Week 1: Foundation
```bash
# Add Redis
railway plugin:add redis

# Install dependencies
npm install bullmq ioredis

# Create worker
touch backend/worker.js
```

**Changes:**
- Move OpenAI flashcard generation to background
- Return job IDs instead of results
- Test job queue functionality

### Week 2: Migration
- Move lesson generation to worker
- Move audio generation to worker
- Add job status polling endpoint
- Update frontend to handle async jobs

### Week 3: Scaling
- Enable Railway auto-scaling (min: 1, max: 5)
- Move rate limits to Redis
- Add Sentry APM
- Configure alerts

### Week 4: Optimization
- Parallel OpenAI processing (5 concurrent)
- Response caching with Redis
- Load testing
- Documentation

---

## Cost Impact

| Configuration | Monthly Cost | Capacity |
|--------------|--------------|----------|
| **Current** | $40-70 | ~100 active users, 20 req/min |
| **Recommended** | $70-140 | ~1,000 active users, 200 req/min |
| **ROI** | +100% cost | +1,000% capacity |

---

## Performance Comparison

| Metric | Current | With Workers |
|--------|---------|--------------|
| HTTP response time | 5-30 seconds | < 200ms |
| Max throughput | ~20 AI req/min | ~200 AI req/min |
| Queue persistence | ❌ Lost on restart | ✅ Redis-backed |
| Scaling | ❌ Single instance | ✅ Auto-scale |
| Concurrent OpenAI | 1 request | 5 requests |

---

## Critical Next Steps

1. **Add Redis** to Railway project
2. **Create worker service** (`backend/worker.js`)
3. **Migrate flashcard generation** to background job
4. **Test with staging environment**
5. **Deploy to production** with monitoring

---

## Quick Test

To see the concurrency issue in action:

```bash
# Send 5 flashcard requests simultaneously
for i in {1..5}; do
  curl -X POST https://your-railway-app.com/api/ai/generate-flashcards \
    -H "Content-Type: application/json" \
    -d '{"content":"test","subject":"test","topic":"test","userId":"test"}' &
done

# Watch logs - you'll see sequential processing
```

**Current behavior:** 5 requests take ~60 seconds (12s each)  
**Expected with workers:** All return job IDs in < 1 second

---

## Questions?

**Contact:** Development Team  
**Full Report:** `RAILWAY_BACKEND_ANALYSIS.md`  
**Diagram:** `RAILWAY_ARCHITECTURE_DIAGRAM.txt`

---

**Report Date:** October 12, 2025  
**Version:** 1.0

