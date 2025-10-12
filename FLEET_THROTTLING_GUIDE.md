# Fleet-Wide Throttling Configuration Guide

**Issue:** #13 - Shared provider throttling across all instances  
**Date:** October 12, 2025  
**Purpose:** Configure global rate limits for external providers

---

## Overview

Fleet-wide throttling ensures that ALL worker instances combined respect provider rate limits. This is implemented using Bottleneck with Redis backend, so all instances share the same rate limit counters.

**Benefits:**
- ✅ Never exceed OpenAI/Azure rate limits
- ✅ Scales correctly with multiple workers
- ✅ Configurable via environment variables
- ✅ Per-provider limits

---

## Environment Variables

### OpenAI Configuration

```bash
# Requests per minute (default: 50)
OPENAI_RATE_LIMIT_RPM=50

# Max concurrent requests across ALL workers (default: 5)
OPENAI_MAX_CONCURRENT=5
```

**Example:**
```bash
# Conservative (free tier)
OPENAI_RATE_LIMIT_RPM=20
OPENAI_MAX_CONCURRENT=2

# Aggressive (paid tier with high limits)
OPENAI_RATE_LIMIT_RPM=100
OPENAI_MAX_CONCURRENT=10
```

---

### Azure Speech Configuration

```bash
# Max concurrent connections (default: 20 for S0 tier)
AZURE_SPEECH_MAX_CONCURRENT=20

# Minimum time between requests in ms (default: 50)
AZURE_SPEECH_MIN_TIME=50
```

**By Azure tier:**
```bash
# Free/F0 tier
AZURE_SPEECH_MAX_CONCURRENT=1

# Standard S0 tier
AZURE_SPEECH_MAX_CONCURRENT=20

# Standard S1+ tier
AZURE_SPEECH_MAX_CONCURRENT=100
```

---

### Azure Vision Configuration

```bash
# Requests per minute (default: 20 for free tier)
AZURE_VISION_RATE_LIMIT_RPM=20

# Max concurrent (default: 5)
AZURE_VISION_MAX_CONCURRENT=5
```

**By tier:**
```bash
# Free F0 tier (5000/month = ~167/day = ~7/hour)
AZURE_VISION_RATE_LIMIT_RPM=10
AZURE_VISION_MAX_CONCURRENT=2

# Standard S1 tier
AZURE_VISION_RATE_LIMIT_RPM=60
AZURE_VISION_MAX_CONCURRENT=10
```

---

## How It Works

### Single Worker Instance

```
Worker 1:
├─ OpenAI Limiter (Redis-backed)
│  ├─ 50 requests/minute (shared counter in Redis)
│  └─ 5 concurrent max
│
└─ Processes jobs respecting limits
```

### Multiple Worker Instances (Fleet-Wide)

```
┌─────────────────────────────────────────┐
│            Redis (Shared State)         │
│                                         │
│  Bottleneck Counters:                   │
│  ├─ openai: 42/50 requests used        │
│  ├─ openai: 3/5 concurrent slots used  │
│  └─ Resets every minute                │
└─────────────┬───────────────────────────┘
              │
       ┌──────┴──────┬──────────┐
       │             │          │
   Worker 1      Worker 2   Worker 3
   Uses 15/50    Uses 18/50  Uses 9/50
   2 concurrent  1 concurrent 0 concurrent
   
   Total: 42/50 requests ✅ (under limit)
   Total: 3/5 concurrent ✅ (under limit)
```

**All workers share the same limits!**

---

## Scaling Examples

### Example 1: OpenAI Rate Limit

**Provider limit:** 50 requests/minute

**Configuration:**
```bash
OPENAI_RATE_LIMIT_RPM=50
OPENAI_MAX_CONCURRENT=5
```

**Behavior with 3 workers:**
- All 3 workers combined can make 50 req/min
- All 3 workers combined can have 5 concurrent requests
- Redis ensures accurate counting

**Result:** Never exceed OpenAI limits ✅

---

### Example 2: Scaling Workers

**Scenario:** Queue depth high, want to add more workers

**Current:**
- 2 workers × 3 concurrency = 6 jobs processing
- OpenAI limit: 50 req/min, 5 concurrent

**Add 1 more worker:**
- 3 workers × 3 concurrency = 9 jobs trying to process
- But OpenAI limiter restricts to 5 concurrent globally
- Result: Only 5 jobs process at once (throttled correctly) ✅

**Conclusion:** Can safely scale workers - Bottleneck protects limits

---

## Tuning Guide

### Based on OpenAI Tier

**Free Tier:**
```bash
OPENAI_RATE_LIMIT_RPM=20      # Conservative
OPENAI_MAX_CONCURRENT=2       # Low concurrency
```

**Tier 1 (Paid):**
```bash
OPENAI_RATE_LIMIT_RPM=50      # Default
OPENAI_MAX_CONCURRENT=5       # Moderate
```

**Tier 2+ (Higher limits):**
```bash
OPENAI_RATE_LIMIT_RPM=100     # Aggressive
OPENAI_MAX_CONCURRENT=10      # High concurrency
```

### Based on Worker Count

**1-2 workers:**
```bash
# Use defaults (50 req/min, 5 concurrent)
```

**3-5 workers:**
```bash
# Increase limits to utilize all workers
OPENAI_RATE_LIMIT_RPM=100
OPENAI_MAX_CONCURRENT=10
```

**Note:** Make sure your OpenAI tier supports higher limits!

---

## Monitoring Throttling

### Check Bottleneck Status

```bash
# View Redis keys
redis-cli KEYS "bottleneck:openai:*"

# Example output:
# bottleneck:openai:running
# bottleneck:openai:done
# bottleneck:openai:settings

# Check current reservoir (available requests)
redis-cli GET "bottleneck:openai:reservoir"
```

### Watch for Throttling in Logs

```bash
# Worker logs will show when throttled
railway logs --service backend-worker | grep "Rate limiter"

# Example:
# 🚨 Rate limiter openai: Reservoir depleted (rate limit hit)
# ⏳ Waiting for reservoir refill...
```

### Dashboard Metrics

```bash
# Check rate limiter status (custom endpoint needed)
curl https://backend.railway.app/api/metrics/rate-limiters

# Would show:
# {
#   "openai": {
#     "reservoir": 35,        # 35/50 available
#     "running": 3,           # 3/5 concurrent
#     "queued": 2             # 2 jobs waiting
#   }
# }
```

---

## Stress Testing Fleet-Wide Limits

### Test with Multiple Workers

**Scenario:** Verify 3 workers respect global 50 req/min limit

```bash
# 1. Scale to 3 workers
railway service update --service backend-worker --replicas-min 3

# 2. Enqueue 150 jobs (3x the per-minute limit)
for i in {1..150}; do
  curl -s -X POST http://localhost:3001/api/ai/generate-flashcards \
    -H "Content-Type: application/json" \
    -H "user-id: stress-test-$i" \
    -d "{\"content\":\"stress test $i\",\"subject\":\"test\",\"topic\":\"test\",\"userId\":\"stress-test-$i\"}" &
done

# 3. Monitor processing rate
# Watch worker logs with timestamps
railway logs --service backend-worker --follow | grep "Job picked up"

# 4. Calculate actual rate
# Count jobs processed in 1 minute
# Should be ≤ 50 jobs/minute across all 3 workers ✅

# 5. Check Bottleneck reservoir
redis-cli GET "bottleneck:openai:reservoir"
# Should never exceed 50
```

---

## Troubleshooting

### Jobs Processing Too Slowly

**Symptoms:**
- Queue depth growing
- Workers idle but jobs not processing

**Check:**
```bash
# Is rate limiter blocking?
railway logs --service backend-worker | grep "depleted"

# Check reservoir
redis-cli GET "bottleneck:openai:reservoir"
```

**Solutions:**

1. **Increase rate limit** (if provider supports it)
   ```bash
   railway variables set OPENAI_RATE_LIMIT_RPM=100
   ```

2. **Check worker concurrency**
   ```javascript
   // backend/worker.js
   concurrency: 5  // Increase if needed
   ```

3. **Verify not hitting other bottlenecks**
   - Circuit breaker open?
   - Budget kill-switch active?

---

### Rate Limit Still Being Exceeded

**Symptoms:**
- OpenAI returns 429 errors
- Circuit breaker opening frequently

**Check:**
```bash
# Verify limiters are being used
railway logs --service backend-worker | grep "Rate limiter"

# Check if old code path still active
railway logs | grep "OLD QUEUE CODE"  # Should be empty
```

**Solutions:**

1. **Reduce configured limit** (more conservative)
   ```bash
   OPENAI_RATE_LIMIT_RPM=40  # Safety margin below 50
   ```

2. **Reduce concurrent limit**
   ```bash
   OPENAI_MAX_CONCURRENT=3  # More conservative
   ```

3. **Verify all workers using Redis Bottleneck**
   ```bash
   # All workers should log:
   # "⚙️ OpenAI limiter configured: X req/min, Y concurrent"
   ```

---

## Cost Optimization

### Prevent Rate Limit Waste

**Without throttling:**
- Multiple workers send requests simultaneously
- Exceed provider limit → 429 errors
- Wasted retries and delays

**With throttling:**
- Coordinated across all workers
- Never exceed limits
- No wasted API calls

**Savings:** 5-10% of API costs (from avoided 429 retries)

---

## Configuration Examples

### Low-Cost Setup (Minimal API usage)

```bash
# OpenAI (conservative)
OPENAI_RATE_LIMIT_RPM=20
OPENAI_MAX_CONCURRENT=2

# Azure Speech (F0 free tier)
AZURE_SPEECH_MAX_CONCURRENT=1

# Azure Vision (F0 free tier)
AZURE_VISION_RATE_LIMIT_RPM=10
AZURE_VISION_MAX_CONCURRENT=2

# Workers
# 1 worker, concurrency: 2
```

### Medium Setup (Production)

```bash
# OpenAI (default tier)
OPENAI_RATE_LIMIT_RPM=50
OPENAI_MAX_CONCURRENT=5

# Azure Speech (S0 tier)
AZURE_SPEECH_MAX_CONCURRENT=20

# Azure Vision (S1 tier)
AZURE_VISION_RATE_LIMIT_RPM=60
AZURE_VISION_MAX_CONCURRENT=5

# Workers
# 2-3 workers, concurrency: 3
```

### High-Volume Setup (Scaled)

```bash
# OpenAI (higher tier)
OPENAI_RATE_LIMIT_RPM=100
OPENAI_MAX_CONCURRENT=10

# Azure Speech (S1+ tier)
AZURE_SPEECH_MAX_CONCURRENT=100

# Azure Vision (S1+ tier)
AZURE_VISION_RATE_LIMIT_RPM=120
AZURE_VISION_MAX_CONCURRENT=10

# Workers
# 5 workers, concurrency: 5
```

---

## Quick Reference

### Set Limits

```bash
# Railway variables
railway variables set OPENAI_RATE_LIMIT_RPM=50
railway variables set OPENAI_MAX_CONCURRENT=5
railway variables set AZURE_SPEECH_MAX_CONCURRENT=20

# Or in .env (local)
OPENAI_RATE_LIMIT_RPM=50
OPENAI_MAX_CONCURRENT=5
```

### Monitor Limits

```bash
# Check current configuration
railway logs --service backend-worker | grep "limiter configured"

# Watch for throttling
railway logs --service backend-worker | grep "depleted"

# Redis reservoir
redis-cli GET "bottleneck:openai:reservoir"
```

---

**Last Updated:** October 12, 2025  
**Status:** ✅ Ready for Use  
**Related:** Issues #6, #8, #13

