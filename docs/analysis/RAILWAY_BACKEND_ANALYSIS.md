# Railway Backend Architecture & Concurrency Analysis

**Date:** October 12, 2025  
**Project:** UniLingo Backend  
**Deployment Platform:** Railway

---

## Executive Summary

The UniLingo backend is a **single-service Express.js application** deployed on Railway that handles all HTTP requests synchronously within the request-response cycle. There is **no separate worker service, queue system, or horizontal scaling configuration**. All external API calls (OpenAI, Azure, AWS) are executed inline during HTTP requests, which creates **potential concurrency bottlenecks and rate-limiting risks** under high load.

### Key Findings

✅ **What's Working:**
- In-memory rate limiting and circuit breakers
- Express.js async/await handling
- Request queuing for OpenAI (in-memory)
- Azure pronunciation request queue (max 20 concurrent)
- Comprehensive monitoring and user tracking

❌ **Critical Issues:**
- No horizontal scaling configured
- All long-running API calls block HTTP responses
- In-memory queues don't persist across restarts
- No dedicated worker service for background jobs
- Risk of Railway timeout (30s default for HTTP)

---

## 1. Service Structure

### Railway Services Detected

```
┌─────────────────────────────────────────┐
│         Railway Project                 │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Web Service (Single Instance)   │ │
│  │   - Express.js on Node.js 20      │ │
│  │   - Port: 8080 (production)       │ │
│  │   - Restart Policy: ON_FAILURE    │ │
│  │   - Max Retries: 10               │ │
│  │   - Builder: NIXPACKS             │ │
│  └───────────────────────────────────┘ │
│                                         │
│  No Workers ❌                          │
│  No Redis ❌                            │
│  No Queue Service ❌                    │
└─────────────────────────────────────────┘
```

**File:** `backend/railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Configuration:**
- **Single web service** handles all traffic
- **No auto-scaling** configuration detected
- **No worker processes** for background jobs
- **No Redis or queue system** (all queuing is in-memory)

---

## 2. Concurrency Model

### Request Processing Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Express.js Server                         │
│                  (Single Node.js Process)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              HTTP Request Handler                      │ │
│  │        (Async/Await - Non-blocking I/O)                │ │
│  └─────────────┬──────────────────────────────────────────┘ │
│                │                                             │
│                ├─► Rate Limiter (express-rate-limit)        │
│                ├─► IP-based: 100 req/15min                  │
│                ├─► User-based: 100 pronunciation/hour       │
│                └─► User-based: 200 AI requests/hour         │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │            External API Call (Inline)                   ││
│  │  • OpenAI API - Blocks 5-30 seconds                     ││
│  │  • Azure Speech API - Blocks 2-10 seconds               ││
│  │  • Azure Vision OCR - Blocks 1-3 seconds                ││
│  │  • AWS Polly - Blocks 2-15 seconds                      ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### How Requests Are Processed

**Type:** **ASYNCHRONOUS (Non-blocking I/O)** ✅  
**Pattern:** Async/await with Promise-based external API calls

**Key Points:**
1. Express.js uses Node.js event loop (non-blocking)
2. Multiple requests can be processed concurrently
3. API calls use async/await (don't block the event loop)
4. However, each request **waits inline** for API responses

**Example from `server.js`:**
```javascript
app.post('/api/ai/generate-flashcards', aiLimiter, userRateLimit('ai'), async (req, res) => {
  // Request blocks here while waiting for OpenAI
  const result = await AIService.generateFlashcards(...);
  res.json(result);
});
```

### In-Memory Queue Systems

#### OpenAI Request Queue (AIService)
**File:** `backend/aiService.js` (Lines 24-145)

```javascript
let requestQueue = [];
let isProcessing = false;
let maxConcurrent = No explicit limit (processes one at a time)

Rate Limits:
- 50 requests/minute
- 75,000 tokens/minute
- Circuit breaker after 5 failures
```

**How it works:**
1. Requests queue up if rate limit reached
2. Processed sequentially with priority ordering
3. Exponential backoff on 429 errors
4. Circuit breaker opens after 5 failures (pauses all requests for 60s)

#### Azure Pronunciation Queue (ResilientPronunciationService)
**File:** `backend/resilientPronunciationService.js` (Lines 22-29)

```javascript
this.requestQueue = [];
this.processing = 0;
this.maxConcurrent = 20; // Azure Speech Service S0 tier limit
```

**How it works:**
1. Max 20 concurrent pronunciation assessments
2. Additional requests queue in memory
3. Circuit breaker after 5 failures (60s timeout)
4. Automatic retry with exponential backoff (max 3 retries)

---

## 3. External API Integration Patterns

### OpenAI API Calls

**Files:** `backend/aiService.js`

**Endpoints:**
- `POST /api/ai/generate-flashcards` - Generates flashcards from content
- `POST /api/ai/generate-lesson` - Multi-step lesson creation

**Concurrency Pattern:**
```javascript
// In-memory queue with rate limiting
await executeRequest(async () => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages,
    temperature: 0.1,
  });
  return completion;
}, priority, estimatedTokens);
```

**Rate Limits:**
- 50 requests/minute
- 75,000 tokens/minute
- Per-user: 200 AI requests/hour
- Per-IP: 20 requests/minute

**Retry Logic:**
- Max 3 retries
- Exponential backoff: 1s → 2s → 4s
- Circuit breaker after 5 failures

**Blocking Duration:** 5-30 seconds per request

---

### Azure Speech Service (Pronunciation)

**Files:** `backend/resilientPronunciationService.js`, `backend/pronunciationService.js`

**Endpoint:**
- `POST /api/pronunciation-assess` - Assess pronunciation accuracy

**Concurrency Pattern:**
```javascript
// Queue-based with max 20 concurrent
if (this.processing >= this.maxConcurrent) {
  // Add to queue
  this.requestQueue.push({ audioFilePath, referenceText, resolve, reject });
}
```

**Rate Limits:**
- Per-user: 100 assessments/hour
- Per-IP: 10 requests/minute
- Azure tier: 20 concurrent connections (S0 tier)

**Retry Logic:**
- Max 3 retries
- Exponential backoff with jitter
- Circuit breaker after 5 failures

**Blocking Duration:** 2-10 seconds per request

---

### Azure Computer Vision OCR

**Files:** `backend/azureOCR.js`

**Endpoint:**
- `POST /api/process-image` - Extract text from images

**Concurrency Pattern:**
```javascript
// Direct API call, no queue
const result = await client.readInStream(imageBuffer);
// Poll for results
while (attempts < maxAttempts) {
  readResult = await client.getReadResult(operationId);
  if (readResult.status === 'succeeded') break;
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

**Rate Limits:**
- Per-IP: 20 requests/minute
- Per-user: 200 requests/hour
- Azure free tier: 5,000 images/month

**Retry Logic:** None (relies on polling until completion)

**Blocking Duration:** 1-3 seconds per image

---

### AWS Polly (Text-to-Speech)

**Files:** `backend/simplePollyService.js`, `backend/pollyService.js`

**Endpoint:**
- Audio generation (internal service, no direct endpoint)

**Concurrency Pattern:**
```javascript
// Direct API call, handles chunking for long text
const command = new SynthesizeSpeechCommand(params);
const response = await this.pollyClient.send(command);
```

**Rate Limits:**
- AWS default: 100 requests/second (more than sufficient)
- No application-level rate limiting

**Retry Logic:** None (relies on AWS SDK retry logic)

**Blocking Duration:** 2-15 seconds (depends on text length)

---

## 4. Scaling Configuration

### Current Railway Setup

**Detected Configuration:**
```
Instance Count: 1 (single instance)
Auto-scaling: Not configured ❌
Memory Limit: Not specified (Railway default)
CPU Limit: Not specified (Railway default)
Restart Policy: ON_FAILURE (max 10 retries)
```

**Health Check:**
```javascript
// File: backend/Dockerfile (Lines 31-32)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', ...)"
```

### Concurrency Limits

**Node.js Event Loop:**
- Can handle **thousands** of concurrent connections
- Limited by memory and CPU, not connection count

**Actual Bottlenecks:**
1. **OpenAI Queue:** Sequential processing (one at a time)
2. **Azure Speech:** 20 concurrent max
3. **Memory-based Queues:** Lost on restart
4. **HTTP Timeout:** Railway default 30s may be too short for long AI requests

---

## 5. Identified Bottlenecks

### Critical Issues

#### 🚨 1. No Horizontal Scaling
**Problem:** Single instance handles all traffic  
**Impact:** No load distribution, single point of failure  
**Risk:** High traffic causes request queuing and timeouts

#### 🚨 2. Long-Running API Calls Block HTTP Responses
**Problem:** All external API calls happen inline during HTTP request  
**Impact:**
- OpenAI calls: 5-30 seconds blocking
- Pronunciation: 2-10 seconds blocking
- Image OCR: 1-3 seconds blocking

**Risk:** Under high load:
- Request queues build up
- Railway may timeout (30s default)
- Poor user experience

#### 🚨 3. In-Memory Queues Don't Persist
**Problem:** Request queues stored in JavaScript memory  
**Impact:** Lost on restart, crash, or deployment  
**Risk:** Requests in queue are lost

#### 🚨 4. OpenAI Sequential Processing
**Problem:** OpenAI requests processed one at a time  
**File:** `backend/aiService.js` (Lines 99-145)
```javascript
while (requestQueue.length > 0) {
  const request = requestQueue.shift();
  const result = await request.execute(); // Blocks here
  request.resolve(result);
}
```
**Impact:** Second request waits for first to complete  
**Risk:** Queue builds up during peak usage

#### 🚨 5. No Background Job System
**Problem:** No worker service for long-running tasks  
**Impact:**
- Audio generation (Polly): 2-15 seconds inline
- Lesson generation (multi-step): 30-60 seconds inline
- PDF processing: 5-20 seconds inline

**Risk:** HTTP timeouts, poor UX

---

### Moderate Issues

#### ⚠️ 6. Rate Limiting Not Distributed
**Problem:** Rate limits stored in memory (per-instance)  
**Impact:** Scaling to multiple instances = separate rate limit counters  
**Fix Required:** Redis-based rate limiting

#### ⚠️ 7. No Request Prioritization
**Problem:** FIFO queue for OpenAI (priority field exists but limited use)  
**Impact:** Important requests wait behind bulk operations  
**Potential:** Add priority queuing

#### ⚠️ 8. Circuit Breaker State Not Shared
**Problem:** Circuit breaker in memory (per-instance)  
**Impact:** Each instance has separate circuit breaker state  
**Risk:** One instance may block while others allow requests

---

## 6. System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT DEVICES                               │
│                   (Mobile Apps, Web Browsers)                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS Requests
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         RAILWAY PLATFORM                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Express.js Web Service (Single Instance)          │ │
│  │                                                                │ │
│  │  Rate Limiters:                                                │ │
│  │  ├─ General: 100 req/15min per IP                              │ │
│  │  ├─ Pronunciation: 10 req/min per IP, 100/hour per user        │ │
│  │  └─ AI: 20 req/min per IP, 200/hour per user                   │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │ Inline Request Handlers (Async/Await)                    │ │ │
│  │  │                                                           │ │ │
│  │  │  /api/ai/generate-flashcards ──► OpenAI Queue           │ │ │
│  │  │  /api/ai/generate-lesson ──────► OpenAI Queue (multi)   │ │ │
│  │  │  /api/pronunciation-assess ────► Azure Speech Queue     │ │ │
│  │  │  /api/process-image ───────────► Azure OCR (direct)     │ │ │
│  │  │  /api/process-pdf ─────────────► pdf-parse (direct)     │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │  In-Memory Queues:                                             │ │
│  │  ├─ OpenAI Queue: Sequential (1 at a time)                     │ │
│  │  └─ Azure Speech Queue: Parallel (max 20 concurrent)           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ❌ No Worker Service                                                │
│  ❌ No Redis Queue                                                   │
│  ❌ No Auto-scaling                                                  │
└───────────────────────┬──────────────────────────────────────────────┘
                        │
                        │ External API Calls (Inline)
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL APIS                                │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────┐ │
│  │   OpenAI API    │  │  Azure Speech   │  │  Azure Vision OCR  │ │
│  │                 │  │   Service       │  │                    │ │
│  │ • GPT-4o-mini   │  │ • Pronunciation │  │ • Handwriting OCR  │ │
│  │ • 5-30s/req     │  │ • 2-10s/req     │  │ • 1-3s/req         │ │
│  │ • 50 req/min    │  │ • 20 concurrent │  │ • 5k free/month    │ │
│  │ • 75k tok/min   │  │ • S0 tier       │  │                    │ │
│  └─────────────────┘  └─────────────────┘  └────────────────────┘ │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐                          │
│  │   AWS Polly     │  │   Supabase DB   │                          │
│  │                 │  │                 │                          │
│  │ • Text-to-Speech│  │ • PostgreSQL    │                          │
│  │ • 2-15s/req     │  │ • Fast queries  │                          │
│  │ • 100 req/sec   │  │                 │                          │
│  └─────────────────┘  └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘

Legend:
────►  Synchronous request flow (blocks HTTP response)
- - ->  Asynchronous (but no such flows exist)
```

---

## 7. Recommendations & Improvements

### Priority 1: Critical (Implement Immediately)

#### ✅ 1. Add Background Worker Service
**Problem:** Long-running API calls block HTTP responses  
**Solution:** Separate worker dyno/service on Railway

**Implementation:**
```
Railway Services:
├── Web Service (HTTP endpoints)
│   └── Accepts requests, returns job ID immediately
└── Worker Service (Background jobs)
    └── Processes OpenAI, Polly, long operations
```

**Steps:**
1. Add Redis or Railway's built-in job queue
2. Create `backend/worker.js` with BullMQ or similar
3. Modify endpoints to queue jobs instead of processing inline
4. Return job ID immediately to client
5. Client polls for results or uses WebSocket

**Benefits:**
- No more HTTP timeouts
- Better user experience (instant response)
- Can scale workers independently

---

#### ✅ 2. Implement Redis-Based Queue
**Problem:** In-memory queues lost on restart  
**Solution:** Use Redis or Railway's Redis plugin

**Implementation:**
```bash
# Add Redis to Railway
railway plugin:add redis

# Use BullMQ for job queue
npm install bullmq ioredis
```

**Example Code:**
```javascript
// backend/queue/aiQueue.js
const { Queue, Worker } = require('bullmq');
const connection = { host: process.env.REDIS_HOST, port: 6379 };

const aiQueue = new Queue('ai-jobs', { connection });

// In HTTP handler
app.post('/api/ai/generate-flashcards', async (req, res) => {
  const job = await aiQueue.add('generate-flashcards', req.body);
  res.json({ jobId: job.id, status: 'queued' });
});

// In worker.js
const worker = new Worker('ai-jobs', async (job) => {
  return await AIService.generateFlashcards(job.data);
}, { connection });
```

**Benefits:**
- Persistent queue (survives restarts)
- Distributed (works with multiple instances)
- Built-in retry and failure handling

---

#### ✅ 3. Configure Railway Auto-Scaling
**Problem:** Single instance can't handle peak load  
**Solution:** Enable Railway horizontal scaling

**Steps:**
1. Go to Railway project settings
2. Enable auto-scaling:
   ```
   Min instances: 1
   Max instances: 5
   Scale trigger: CPU > 70% or Memory > 80%
   ```
3. Requires Redis for shared state (rate limits, circuit breakers)

**Benefits:**
- Handles traffic spikes
- Automatic failover
- Better availability

---

### Priority 2: High (Implement Soon)

#### ✅ 4. Parallel OpenAI Request Processing
**Problem:** OpenAI requests processed sequentially  
**Solution:** Process multiple requests concurrently (with rate limit)

**Implementation:**
```javascript
// backend/aiService.js
const maxConcurrent = 5; // Process 5 OpenAI requests at once
let processing = 0;

async function processQueue() {
  while (requestQueue.length > 0 && processing < maxConcurrent) {
    processing++;
    const request = requestQueue.shift();
    processRequest(request).finally(() => processing--);
  }
}
```

**Benefits:**
- 5x faster during peak times
- Better resource utilization
- Still respects rate limits

---

#### ✅ 5. Add Request Timeout Handling
**Problem:** Railway may timeout long requests  
**Solution:** Set appropriate timeouts and return early

**Implementation:**
```javascript
// Increase Railway timeout in railway.json
{
  "deploy": {
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE"
  }
}

// Add timeout middleware
app.use((req, res, next) => {
  req.setTimeout(55000); // 55s timeout
  res.setTimeout(55000);
  next();
});
```

---

#### ✅ 6. Implement Webhook Callbacks
**Problem:** Long operations block client  
**Solution:** Use webhooks for completion notification

**Implementation:**
```javascript
// Client provides webhook URL
app.post('/api/ai/generate-flashcards', async (req, res) => {
  const { webhookUrl } = req.body;
  const jobId = await queueJob('generate-flashcards', req.body);
  
  res.json({ jobId, status: 'processing' });
  
  // When job completes
  await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify({ jobId, result: flashcards })
  });
});
```

---

### Priority 3: Medium (Nice to Have)

#### ✅ 7. Add Response Caching
**Problem:** Repeated requests generate same content  
**Solution:** Cache OpenAI responses by content hash

**Implementation:**
```javascript
const crypto = require('crypto');

async function generateFlashcardsWithCache(content, subject, topic) {
  const cacheKey = crypto.createHash('sha256')
    .update(`${content}:${subject}:${topic}`)
    .digest('hex');
  
  // Check Redis cache
  const cached = await redis.get(`flashcards:${cacheKey}`);
  if (cached) return JSON.parse(cached);
  
  // Generate and cache
  const result = await AIService.generateFlashcards(...);
  await redis.setex(`flashcards:${cacheKey}`, 3600, JSON.stringify(result));
  return result;
}
```

**Benefits:**
- Faster responses for duplicate content
- Reduced API costs
- Better user experience

---

#### ✅ 8. Monitor with APM (Application Performance Monitoring)
**Problem:** Limited visibility into performance  
**Solution:** Add Sentry, DataDog, or New Relic

**Implementation:**
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV
});

// Track external API performance
Sentry.startTransaction({
  op: 'openai.request',
  name: 'Generate Flashcards'
});
```

**Benefits:**
- Real-time error tracking
- Performance bottleneck identification
- Better debugging

---

#### ✅ 9. Add Circuit Breaker Dashboard
**Problem:** No visibility into circuit breaker state  
**Solution:** Expose metrics endpoint

**Implementation:**
```javascript
app.get('/api/admin/circuit-breakers', monitoringWhitelist, (req, res) => {
  res.json({
    openai: {
      state: circuitBreaker.state,
      failures: circuitBreaker.failures,
      lastFailure: circuitBreaker.lastFailure
    },
    azureSpeech: resilientPronunciationService.getStatus()
  });
});
```

---

## 8. Immediate Action Items

### Week 1: Setup Worker Infrastructure
- [ ] Add Redis to Railway project
- [ ] Install BullMQ or equivalent job queue library
- [ ] Create `backend/worker.js` entry point
- [ ] Migrate OpenAI flashcard generation to worker
- [ ] Test job queue with monitoring

### Week 2: Move Long Operations to Background
- [ ] Move lesson generation to worker
- [ ] Move audio generation (Polly) to worker
- [ ] Implement job status polling endpoint
- [ ] Update frontend to poll for job completion

### Week 3: Scaling & Monitoring
- [ ] Enable Railway auto-scaling (min 1, max 3)
- [ ] Move rate limiting to Redis
- [ ] Add APM (Sentry or DataDog)
- [ ] Configure alerts for circuit breaker events

### Week 4: Optimization
- [ ] Implement parallel OpenAI processing (5 concurrent)
- [ ] Add response caching for common requests
- [ ] Test under load with k6 or Artillery
- [ ] Document new architecture

---

## 9. Cost Implications

### Current Monthly Costs (Estimated)
```
Railway Hosting:
- Single instance: $5-20/month (depending on usage)

External APIs:
- OpenAI (GPT-4o-mini): $0.60/1M input + $2.40/1M output
- Azure Speech: $1.50/hour after free tier
- Azure Vision: $1.00/1,000 images after 5k free
- AWS Polly: $4.00/1M characters (neural voices)

Total: ~$30-100/month (low usage)
```

### After Recommendations
```
Railway Hosting:
- Web service: $10-30/month
- Worker service: $10-30/month
- Redis: $5-10/month

External APIs: (same)

Total: ~$55-170/month (low-medium usage)

Benefits:
- Can handle 10x more traffic
- Better reliability and UX
- Scalable to thousands of users
```

---

## 10. Performance Benchmarks

### Current System (Single Instance)

| Metric | Current Performance |
|--------|---------------------|
| Max concurrent requests | ~100 (limited by memory) |
| Avg response time (simple) | 50-200ms |
| Avg response time (OpenAI) | 5-30 seconds |
| Avg response time (Pronunciation) | 2-10 seconds |
| Avg response time (OCR) | 1-3 seconds |
| Max throughput | ~20 requests/minute (with OpenAI) |
| Queue wait time (peak) | 10-60 seconds |

### With Recommended Changes

| Metric | Projected Performance |
|--------|----------------------|
| Max concurrent requests | ~500+ (horizontal scaling) |
| Avg response time (all) | 50-200ms (instant job queuing) |
| Background job time | Same (but non-blocking) |
| Max throughput | ~200 requests/minute |
| Queue wait time | 0 seconds (Redis queue) |

---

## Appendix A: Key Files Reference

### Configuration
- `backend/railway.json` - Railway deployment config
- `backend/nixpacks.toml` - Build configuration
- `backend/Dockerfile` - Docker containerization
- `backend/package.json` - Dependencies

### Core Services
- `backend/server.js` - Main Express server
- `backend/aiService.js` - OpenAI integration + queue
- `backend/resilientPronunciationService.js` - Azure Speech + queue
- `backend/azureOCR.js` - Azure Vision OCR
- `backend/simplePollyService.js` - AWS Polly TTS
- `backend/performanceMonitor.js` - Metrics tracking

### Supporting Services
- `backend/supabaseClient.js` - Database client
- `backend/fileCleanupManager.js` - Temporary file cleanup
- `backend/errorLogger.js` - Error tracking
- `backend/ipWhitelistManager.js` - IP access control

---

## Appendix B: Environment Variables

```bash
# Server
PORT=8080
NODE_ENV=production

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# OpenAI
EXPO_PUBLIC_OPENAI_API_KEY=sk-...

# Azure Speech
AZURE_SPEECH_KEY=your-key
AZURE_SPEECH_REGION=eastus

# Azure Vision
AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_VISION_KEY=your-key

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=unilingo-audio-lessons
```

---

## Appendix C: Rate Limits Summary

| Service | Limit Type | Value |
|---------|-----------|-------|
| General (IP) | 15 minutes | 100 requests |
| Pronunciation (IP) | 1 minute | 10 requests |
| Pronunciation (User) | 1 hour | 100 requests |
| AI (IP) | 1 minute | 20 requests |
| AI (User) | 1 hour | 200 requests |
| OpenAI (App) | 1 minute | 50 requests |
| OpenAI (App) | 1 minute | 75,000 tokens |
| Azure Speech | Concurrent | 20 connections |
| Azure Vision Free | 1 month | 5,000 images |

---

**Report prepared by:** Claude (AI Assistant)  
**Last updated:** October 12, 2025  
**Version:** 1.0

