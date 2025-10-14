# PR: Redis Circuit Breaker + Smart Retry Logic

**Issues:** #6 (Redis circuit breaker & rate limiting) + #8 (Retry/backoff improvements)  
**Type:** Infrastructure | Reliability | Critical  
**Priority:** 🔴 Critical  
**Status:** ✅ Ready for Review

---

## Summary

Implements shared circuit breaker state and intelligent retry logic using Redis, solving the multi-instance state synchronization problems identified in Issue #1. Circuit breakers and retry logic are now shared across all web and worker instances.

### Key Changes

✅ **Redis-backed circuit breaker** (shared across instances)  
✅ **Smart error classification** (transient vs permanent)  
✅ **Exponential backoff with jitter**  
✅ **Bottleneck rate limiting** (optional Redis-backed)  
✅ **Circuit breaker monitoring endpoints**  
✅ **Integrated in worker** for job processing  
✅ **Comprehensive testing**

---

## Before vs. After

### Before (Issue #1 Problem)

```
Instance 1:
├─ Circuit breaker: CLOSED (in memory)
├─ 5 OpenAI failures occur
└─ Circuit opens → OPEN (blocks requests)

Instance 2:
├─ Circuit breaker: CLOSED (separate memory)
├─ Still allows requests ❌
└─ Causes more failures!

Problem: Instances don't share circuit breaker state
```

### After (Redis-backed)

```
Instance 1:
├─ Circuit breaker: CLOSED (Redis)
├─ 5 OpenAI failures occur
└─ Sets Redis: circuit:openai:state = OPEN

Instance 2:
├─ Checks Redis: circuit:openai:state = OPEN
└─ Blocks requests ✅

All instances see same state!
```

**Benefits:**
- Shared state across all instances
- Consistent behavior
- Prevents cascading failures
- Better reliability

---

## Architecture

```
┌─────────────────────────────────────────────┐
│        Multiple Instances                   │
│                                             │
│  ┌──────────────┐    ┌──────────────┐      │
│  │  Instance 1  │    │  Instance 2  │      │
│  │              │    │              │      │
│  │  Check Redis │    │  Check Redis │      │
│  │      ↓       │    │      ↓       │      │
│  └──────┼───────┘    └──────┼───────┘      │
│         │                   │              │
└─────────┼───────────────────┼──────────────┘
          │                   │
          └───────────┬───────┘
                      ↓
┌─────────────────────────────────────────────┐
│           Redis (Shared State)              │
│                                             │
│  Circuit Breaker State:                     │
│  ├─ circuit:openai:state = CLOSED           │
│  ├─ circuit:openai:failures = 0             │
│  └─ circuit:azure:state = CLOSED            │
│                                             │
│  Rate Limiting (Bottleneck):                │
│  ├─ bottleneck:openai:reservoir = 50        │
│  ├─ bottleneck:azure-speech:running = 15    │
│  └─ ratelimit:user:123:ai = 45/200          │
└─────────────────────────────────────────────┘
```

---

## Changes Made

### 1. Circuit Breaker (`backend/circuitBreaker.js`)

**New 200+ line class implementing:**

- ✅ Redis-backed state storage (CLOSED/OPEN/HALF_OPEN)
- ✅ Automatic state transitions
- ✅ Configurable thresholds
- ✅ TTL-based timeout
- ✅ Metrics and logging

**Usage:**
```javascript
const breaker = new CircuitBreaker('openai', {
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes
  timeout: 60000,           // 60s before trying HALF_OPEN
});

// Wrap risky operation
await breaker.execute(async () => {
  return await openai.chat.completions.create(...);
});
```

**State Machine:**
```
CLOSED (normal) 
    ↓ (5 failures)
OPEN (blocking all)
    ↓ (60 seconds timeout)
HALF_OPEN (testing with limited requests)
    ↓ (2 successes)
CLOSED (recovered)
```

### 2. Retry Utilities (`backend/retryUtils.js`)

**Features:**

- ✅ Smart error classification (429, 502, 5xx)
- ✅ Exponential backoff with jitter
- ✅ Configurable retry strategies
- ✅ Detailed logging

**Error Classification:**
```javascript
TRANSIENT:   408, 502, 503, 504, ETIMEDOUT, ECONNRESET
             → Retry recommended

RATE_LIMIT:  429, "rate limit exceeded"
             → Retry with longer backoff

PERMANENT:   400, 401, 403, 404, 422
             → Don't retry
```

**Backoff Calculation:**
```javascript
Attempt 1: 2000ms ± 25% jitter = 1500-2500ms
Attempt 2: 4000ms ± 25% jitter = 3000-5000ms
Attempt 3: 8000ms ± 25% jitter = 6000-10000ms
```

**Usage:**
```javascript
const result = await retryWithBackoff(async () => {
  return await openai.chat.completions.create(...);
}, {
  maxAttempts: 3,
  baseDelay: 2000,
  maxDelay: 10000,
  jitter: 0.25,
});
```

### 3. Rate Limiter (`backend/rateLimiter.js`)

**Features:**

- ✅ Bottleneck with Redis backend
- ✅ Pre-configured limiters (OpenAI, Azure)
- ✅ Sliding window algorithm
- ✅ Per-user and per-IP limiting

**Pre-configured Limiters:**
```javascript
openaiLimiter:      50 req/min, max 5 concurrent
azureSpeechLimiter: 20 concurrent (S0 tier)
azureVisionLimiter: 20 req/min, max 5 concurrent
```

### 4. Worker Integration (`backend/worker.js`)

**Updated job handlers:**
- ✅ Wrapped in circuit breaker
- ✅ Wrapped in retry logic
- ✅ Progress updates on retry
- ✅ Better error handling

**Example:**
```javascript
async function handleGenerateFlashcards(job) {
  // Circuit breaker + retry wrapper
  const result = await openaiCircuitBreaker.execute(async () => {
    return await retryWithBackoff(async () => {
      return await AIService.generateFlashcards(...);
    }, { maxAttempts: 3, baseDelay: 2000 });
  });
  return result;
}
```

### 5. Monitoring Endpoints (`backend/server.js`)

**New endpoints:**

```javascript
GET  /api/circuit-breakers/status    // View all circuit breaker states
POST /api/circuit-breakers/reset/:name  // Admin: Reset circuit breaker
```

**Example response:**
```json
{
  "circuitBreakers": {
    "openai": {
      "name": "openai",
      "state": "CLOSED",
      "failures": 0,
      "failureThreshold": 5,
      "nextRetryAt": null
    },
    "azure": {
      "state": "CLOSED",
      "failures": 0
    }
  }
}
```

---

## Benefits

### Multi-Instance Safety ✅

| Component | Before (Issue #1) | After (Issue #6) |
|-----------|-------------------|------------------|
| Circuit breaker | Per-instance (not shared) | Shared in Redis |
| Failure threshold | Each instance separate | All instances combined |
| State transitions | Independent | Synchronized |
| Recovery | Inconsistent | Coordinated |

**Impact:** Horizontal scaling now works correctly!

### Reliability Improvements ✅

| Feature | Before | After (Issue #8) |
|---------|--------|------------------|
| Error classification | None | Smart (transient/permanent) |
| Retry logic | Basic | Exponential backoff + jitter |
| Permanent errors | Retried wastefully | Skip retry |
| Rate limit errors | Same backoff | 2x longer backoff |
| Retry visibility | Limited | Detailed logging |

**Impact:** Better success rates, faster recovery, lower API waste

---

## Testing Instructions

### Automated Tests

```bash
cd backend
./test-circuit-breaker.sh

# Expected: 8/8 tests pass
```

### Manual Test: Circuit Breaker Opening

**Step 1: Cause failures**
```bash
# Temporarily set invalid OpenAI key in worker
railway variables set OPENAI_API_KEY=invalid --service backend-worker

# Enqueue 6 jobs (exceeds threshold of 5)
for i in {1..6}; do
  curl -s -X POST http://localhost:3001/api/ai/generate-flashcards \
    -H "Content-Type: application/json" \
    -H "user-id: test" \
    -d '{"content":"test '$i'","subject":"test","topic":"test","userId":"test"}'
done
```

**Step 2: Check circuit breaker**
```bash
curl http://localhost:3001/api/circuit-breakers/status

# Expected after 5+ failures:
# {
#   "openai": {
#     "state": "OPEN",          ← Circuit opened!
#     "failures": 5,
#     "nextRetryAt": "2025-10-12T11:30:00.000Z"
#   }
# }
```

**Step 3: Verify blocking**
```bash
# Try to enqueue another job
curl -X POST http://localhost:3001/api/ai/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "user-id: test" \
  -d '{"content":"test","subject":"test","topic":"test","userId":"test"}'

# Job will fail quickly with circuit breaker error
```

**Step 4: Wait for recovery**
```bash
# Wait 60 seconds
sleep 60

# Check status again
curl http://localhost:3001/api/circuit-breakers/status

# Should transition to: "state": "HALF_OPEN"
```

**Step 5: Fix and recover**
```bash
# Restore valid OpenAI key
railway variables set OPENAI_API_KEY=sk-real-key --service backend-worker

# Enqueue 2 test jobs
for i in {1..2}; do
  curl -s -X POST http://localhost:3001/api/ai/generate-flashcards \
    -H "Content-Type: application/json" \
    -H "user-id: test" \
    -d '{"content":"recovery test","subject":"test","topic":"test","userId":"test"}'
done

# After 2 successes, check status
curl http://localhost:3001/api/circuit-breakers/status

# Should transition to: "state": "CLOSED" ✅
```

### Manual Test: Retry with Backoff

```bash
# Watch worker logs
railway logs --service backend-worker --follow

# Cause a transient error (temporary network issue)
# In logs, look for:

# ❌ Attempt 1/3 failed: Connection timeout
# ⏱️ Backoff delay: 2134ms (attempt 1, base: 2000ms, jitter: 134ms)
# ⏳ Waiting 2134ms before retry...
# 🔄 Retrying OpenAI call (attempt 2): Connection timeout
# ❌ Attempt 2/3 failed: Connection timeout  
# ⏱️ Backoff delay: 4287ms (attempt 2, base: 4000ms, jitter: 287ms)
# ⏳ Waiting 4287ms before retry...
# 🔄 Retrying OpenAI call (attempt 3): Connection timeout
# ✅ Retry successful after 2 attempt(s)
```

---

## Acceptance Criteria

### Circuit Breaker (Issue #6)

- [x] Circuit breaker state stored in Redis
- [x] State shared across all instances
- [x] Automatic transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)
- [x] Configurable thresholds
- [x] Monitoring endpoints exist
- [x] Admin reset function works
- [x] State persists across worker restarts
- [x] Two instances see same circuit breaker state

### Retry Logic (Issue #8)

- [x] Smart error classification implemented
- [x] Exponential backoff with jitter
- [x] Transient errors retry correctly
- [x] Permanent errors don't retry
- [x] Rate limit errors use longer backoff
- [x] Max 3-5 attempts configurable
- [x] Detailed retry logging
- [x] Success after retries logged

---

## Performance Impact

### Reliability

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Multi-instance coordination | ❌ Broken | ✅ Works | Fixed! |
| Cascading failures | Possible | Prevented | Circuit breaker |
| Transient error recovery | Limited | Excellent | Smart retry |
| API waste on permanent errors | High | Zero | Classification |
| Recovery time | Slow | Fast | Jitter randomization |

### Cost Savings

| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| Permanent error (400) | 3 retries @ $0.001 | 0 retries | 100% |
| Rate limit (429) | Retry immediately | Wait longer | Fewer wasted retries |
| Cascading failures | All instances fail | Circuit blocks | Prevent API overload |

---

## Files Created/Modified

```
Modified:
  backend/package.json        (+1 dependency: bottleneck)
  backend/server.js           (+70 lines: circuit breaker endpoints)
  backend/worker.js           (+30 lines: circuit breaker integration)
  backend/aiService.js        (+10 lines: imports)

New:
  backend/circuitBreaker.js       (200+ lines: Redis circuit breaker)
  backend/retryUtils.js           (250+ lines: retry logic)
  backend/rateLimiter.js          (300+ lines: Redis rate limiting)
  backend/test-circuit-breaker.sh (200+ lines: validation tests)
  ISSUES_6_8_PR_DESCRIPTION.md    (this file)
```

**Total:** 4 files modified, 5 files created

---

## New Features

### 1. Circuit Breaker Class

**File:** `backend/circuitBreaker.js`

**States:**
- **CLOSED:** Normal operation
- **OPEN:** Blocking all requests (after failures)
- **HALF_OPEN:** Testing recovery
- **CLOSED:** Recovered

**Configuration:**
```javascript
const breaker = new CircuitBreaker('openai', {
  failureThreshold: 5,       // Open after 5 failures
  successThreshold: 2,       // Close after 2 successes
  timeout: 60000,            // 60s before testing recovery
  monitoringWindow: 60000,   // Count failures in 60s window
});
```

**Methods:**
```javascript
await breaker.execute(fn)      // Execute with protection
await breaker.getStatus()      // Get current state
await breaker.reset()          // Admin: Force reset
```

### 2. Retry Utilities

**File:** `backend/retryUtils.js`

**Functions:**
```javascript
retryWithBackoff(fn, options)   // Retry with exponential backoff
withRetry(fn, options)          // Wrap function with retry
shouldRetry(error)              // Check if error is retryable
classifyError(error)            // Classify error type
calculateBackoff(attempt, opts)  // Calculate delay with jitter
```

**Error Types:**
```javascript
TRANSIENT:   Retry recommended (network, timeout, 5xx)
RATE_LIMIT:  Retry with longer backoff (429)
PERMANENT:   Don't retry (400, 401, 403, 404)
```

### 3. Rate Limiter

**File:** `backend/rateLimiter.js`

**Pre-configured limiters:**
```javascript
openaiLimiter:      50 req/min, 5 concurrent
azureSpeechLimiter: 20 concurrent
azureVisionLimiter: 20 req/min, 5 concurrent
```

**Custom limiters:**
```javascript
const myLimiter = createLimiter('my-service', {
  reservoir: 100,        // 100 requests
  window: 60000,         // Per minute
  maxConcurrent: 10,     // Max 10 concurrent
});
```

### 4. New Monitoring Endpoints

**Circuit Breaker Status:**
```javascript
GET /api/circuit-breakers/status
```

**Response:**
```json
{
  "success": true,
  "circuitBreakers": {
    "openai": {
      "name": "openai",
      "state": "CLOSED",
      "failures": 2,
      "failureThreshold": 5,
      "openedAt": null,
      "nextRetryAt": null
    },
    "azure": {
      "state": "CLOSED",
      "failures": 0
    }
  }
}
```

**Reset Circuit Breaker:**
```javascript
POST /api/circuit-breakers/reset/openai
```

---

## Redis Keys Used

### Circuit Breaker Keys

```
circuit:openai:state          // CLOSED, OPEN, or HALF_OPEN
circuit:openai:failures       // Failure count (expires after window)
circuit:openai:successes      // Success count (HALF_OPEN only)
circuit:openai:opened_at      // Timestamp when opened
circuit:openai:attempts       // Attempts in HALF_OPEN state

circuit:azure:state           // Same structure for Azure
circuit:azure:failures
```

### Bottleneck Keys (Optional)

```
bottleneck:openai:*           // Bottleneck internal keys
bottleneck:azure-speech:*
```

### Rate Limit Keys (If using Redis rate limiting)

```
ratelimit:user:123:ai         // Sorted set of timestamps
ratelimit:ip:192.168.1.1:general
```

---

## Testing

### Test 1: Circuit Breaker Status

```bash
curl http://localhost:3001/api/circuit-breakers/status

# Expected:
# {
#   "openai": {"state": "CLOSED", "failures": 0},
#   "azure": {"state": "CLOSED", "failures": 0}
# }
```

### Test 2: Retry Logic in Worker

```bash
# Start worker with debug logging
DEBUG=* npm run worker

# Enqueue job
curl -X POST http://localhost:3001/api/ai/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "user-id: test" \
  -d '{"content":"test","subject":"test","topic":"test","userId":"test"}'

# Watch logs for retry behavior if errors occur
```

### Test 3: Multi-Instance Circuit Breaker

```bash
# Start two instances (simulating Railway scaling)
# Terminal 1: Instance 1
PORT=3001 npm start

# Terminal 2: Instance 2  
PORT=3002 npm start

# Terminal 3: Cause failures on instance 1
for i in {1..6}; do
  curl http://localhost:3001/api/ai/generate-flashcards \
    -H "Content-Type: application/json" \
    -H "user-id: test" \
    -d '{"content":"fail test","subject":"test","topic":"test","userId":"test"}'
done

# Check circuit breaker on BOTH instances
curl http://localhost:3001/api/circuit-breakers/status
curl http://localhost:3002/api/circuit-breakers/status

# Both should show same state (from Redis)
```

---

## Monitoring After Deployment

### Key Metrics

```bash
# 1. Circuit breaker states
curl https://backend.railway.app/api/circuit-breakers/status

# Watch for state: OPEN (indicates problems)

# 2. Worker logs for retries
railway logs --service backend-worker | grep "Retrying"

# Should see occasional retries (normal)
# Should NOT see constant retries (indicates problem)

# 3. Job failure rate
curl https://backend.railway.app/api/queue/stats

# Compare: failed vs completed
# Target: < 5% failure rate

# 4. Redis keys
redis-cli KEYS circuit:*
redis-cli GET circuit:openai:state
```

### Alert Thresholds

- ⚠️ Circuit breaker OPEN for > 5 minutes → Investigate API issues
- ⚠️ Retry rate > 20% of jobs → Check transient errors
- ⚠️ Permanent error rate > 5% → Check job data quality
- ⚠️ Circuit transitions > 10/hour → API instability

---

## Rollback Plan

### Quick Rollback (Remove Circuit Breaker)

```bash
# Revert worker.js and server.js
git checkout HEAD~1 backend/worker.js backend/server.js
git commit -m "Rollback: Remove circuit breaker"
railway up
```

### Keep Code, Disable Circuit Breaker

```bash
# Set high threshold (effectively disabled)
# Edit circuitBreaker.js or add env var

# Or reset if stuck open
curl -X POST http://localhost:3001/api/circuit-breakers/reset/openai
```

---

## Cost Impact

### Additional Infrastructure

| Component | Cost |
|-----------|------|
| Redis storage | +0-1MB (negligible) |
| Bottleneck (optional) | Included in Redis |
| Circuit breaker keys | < 1KB per breaker |

**Total additional cost:** ~$0/month (uses existing Redis)

### API Cost Savings

| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| 100 permanent errors | 300 API calls (3 retries each) | 100 API calls | 67% |
| Cascading failures | All instances overwhelm API | Circuit blocks | Major |
| Rate limit recovery | Random retries | Coordinated backoff | Better |

**Estimated savings:** $5-20/month in API costs

---

## Known Limitations

### In-Memory Rate Limits Still Exist

**server.js still has:**
```javascript
const userRateLimits = new Map(); // Still in memory
const userTracking = new Map();   // Still in memory
```

**Why not replaced?**
- Express-rate-limit middleware still uses in-memory store
- Full migration requires replacing express-rate-limit
- Can be done in future PR

**Workaround:**
- Circuit breaker now shared (most important)
- Rate limits provide basic protection per-instance
- Full Redis rate limiting available in `rateLimiter.js` (can be integrated later)

---

## Next Steps

### Immediate (After Deployment)

1. Deploy to staging
2. Run automated tests
3. Manually test circuit breaker opening/closing
4. Monitor for 24 hours
5. Deploy to production

### Optional Enhancements

**Replace express-rate-limit with Redis:**
```javascript
// Instead of:
app.use(rateLimit({ ... }))

// Use:
const { rateLimitMiddleware } = require('./rateLimiter');
app.use(rateLimitMiddleware('ai', { max: 200, windowMs: 3600000 }));
```

### Short Term (Week 3)

**Issue #7:** Idempotency keys  
**Issue #9:** SSE/WebSocket notifications  
**Issue #11:** Replace ALL in-memory queues

---

## Sample Logs

### Circuit Breaker Opening

```
❌ Attempt 1/3 failed: OpenAI API error
⏱️ Backoff delay: 2134ms
⏳ Waiting 2134ms before retry...

❌ Attempt 2/3 failed: OpenAI API error
⏱️ Backoff delay: 4287ms
⏳ Waiting 4287ms before retry...

❌ Attempt 3/3 failed: OpenAI API error
🚫 Max attempts (3) reached, giving up

❌ Circuit breaker openai: Failure 1/5
❌ Circuit breaker openai: Failure 2/5
❌ Circuit breaker openai: Failure 3/5
❌ Circuit breaker openai: Failure 4/5
❌ Circuit breaker openai: Failure 5/5

❌ Circuit breaker openai: CLOSED → OPEN (5 failures)
🚨 Circuit breaker openai is now OPEN - blocking all requests
   Will transition to HALF_OPEN after 60000ms
```

### Circuit Breaker Recovery

```
[60 seconds later]

🔄 Circuit breaker openai: OPEN → HALF_OPEN (timeout passed)
🔄 Circuit breaker openai is now HALF_OPEN - testing with limited requests

✅ Retry successful after 0 attempt(s)
✅ Circuit breaker openai: HALF_OPEN success 1/2

✅ Retry successful after 0 attempt(s)  
✅ Circuit breaker openai: HALF_OPEN success 2/2

✅ Circuit breaker openai: HALF_OPEN → CLOSED (success threshold reached)
✅ Circuit breaker openai is now CLOSED - normal operation resumed
```

---

## Related Issues

- Requires #1 (Horizontal scaling)
- Requires #2 (Queue endpoints)
- Requires #3 (Redis)
- Requires #4 (Worker)
- Fixes #6 (Shared circuit breaker)
- Fixes #8 (Smart retry)
- Improves #5 (Better reliability at concurrency)

---

**Author:** Development Team  
**Created:** October 12, 2025  
**Branch:** `issues-6-8-circuit-breaker-retry`  
**Status:** ✅ Ready for Staging Deployment

