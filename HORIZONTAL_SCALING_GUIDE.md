# Horizontal Scaling Configuration Guide

**Status:** ✅ Prepared for horizontal scaling (Railway UI configuration required)  
**Date:** October 12, 2025  
**Related:** Issue #1 - Enable horizontal scaling

---

## Overview

The UniLingo backend has been audited and prepared for horizontal scaling. This guide explains:
1. Current stateful code and its behavior across instances
2. How to enable autoscaling in Railway
3. What still needs Redis migration (future work)
4. Testing and validation steps

---

## Quick Start: Enable Autoscaling

### Option 1: Railway Dashboard (Recommended)

1. Go to your Railway project: https://railway.app/project/[your-project-id]
2. Click on the **backend** service
3. Go to **Settings** tab
4. Scroll to **Deployment** section
5. Configure scaling:
   ```
   Replicas: Dynamic
   Min Replicas: 1
   Max Replicas: 3
   Scale on: CPU > 70% or Memory > 80%
   ```
6. Click **Save Changes**
7. Railway will automatically handle load balancing

### Option 2: Railway CLI

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Configure autoscaling (Railway Pro required)
railway service update --replicas-min 1 --replicas-max 3

# Verify configuration
railway status
```

### Option 3: railway.toml File

Create/update `backend/railway.toml`:

```toml
[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
healthcheckPath = "/api/health"
healthcheckTimeout = 10

[scaling]
minReplicas = 1
maxReplicas = 3
targetCPU = 70
targetMemory = 80
```

---

## Stateful Code Audit

### ⚠️ In-Memory State (NOT Shared Across Instances)

The following code maintains state in memory and will **NOT** be shared if you run multiple instances:

#### 1. User Rate Limits & Tracking (`server.js` lines 67-68)
```javascript
const userRateLimits = new Map();
const userTracking = new Map();
```

**Behavior with multiple instances:**
- User hitting Instance A: Uses Instance A's counters
- Same user hitting Instance B: Uses Instance B's counters (separate)
- Result: User can bypass rate limits by spreading requests across instances

**Impact:** 🟡 Medium - Rate limits less effective but still provide some protection  
**Fix Required:** Issue #3 - Migrate to Redis (Week 3)

#### 2. OpenAI Request Queue (`aiService.js` lines 24-30)
```javascript
let requestQueue = [];
let isProcessing = false;
let requestsThisMinute = 0;
let tokensThisMinute = 0;
let circuitBreakerOpen = false;
```

**Behavior with multiple instances:**
- Each instance has its own queue
- OpenAI rate limits (50 req/min) apply across ALL instances combined
- Risk: Multiple instances could exceed OpenAI limits

**Impact:** 🔴 High - May hit OpenAI rate limits with 2+ instances  
**Fix Required:** Issue #2 - Add Redis queue (Week 1-2)

#### 3. Azure Speech Queue (`resilientPronunciationService.js`)
```javascript
this.requestQueue = [];
this.processing = 0;
this.maxConcurrent = 20;
```

**Behavior with multiple instances:**
- Each instance can process 20 concurrent
- 3 instances = 60 concurrent Azure Speech calls
- May exceed Azure tier limits (S0 tier = 20 concurrent per subscription)

**Impact:** 🟡 Medium - May need higher Azure tier  
**Fix Required:** Monitor Azure usage, upgrade tier if needed

#### 4. Cleanup Intervals (`server.js` lines 173-205)
```javascript
setInterval(() => {
  // Clean up user tracking data
}, 60 * 60 * 1000);

setInterval(() => {
  // Clean up rate limit entries
}, 60 * 60 * 1000);
```

**Behavior with multiple instances:**
- Each instance runs its own cleanup
- No coordination between instances
- Result: Redundant cleanup operations

**Impact:** 🟢 Low - Just extra CPU usage, no functional issue  
**Fix Required:** None (acceptable overhead)

---

## What Works Fine with Multiple Instances

### ✅ Stateless Components

1. **Express.js Request Handling**
   - Each request is independent
   - No shared state between requests
   - Works perfectly with load balancing

2. **External API Calls**
   - OpenAI, Azure, AWS calls are stateless
   - Each instance can make calls independently
   - (Rate limits apply across instances - see above)

3. **Database Access (Supabase)**
   - Stateless connection pooling
   - All instances share same database
   - No conflicts

4. **File Uploads**
   - Files saved to disk temporarily
   - Cleaned up after processing
   - No cross-instance dependencies

5. **Health Checks & Monitoring**
   - Each instance reports its own health
   - Railway aggregates across instances
   - Works as expected

---

## Testing Horizontal Scaling

### 1. Staging Environment Test

```bash
# Deploy to staging with 2 replicas
railway up --environment staging

# Verify 2 instances running
railway status

# Expected output:
# Service: backend
# Status: Running
# Replicas: 2/2
# URLs: https://backend-staging.railway.app
```

### 2. Health Check Test

```bash
# Test health endpoint hits different instances
for i in {1..10}; do
  curl -v https://your-backend-staging.railway.app/api/health 2>&1 | grep -E "(X-Railway-Instance|status)"
  sleep 1
done

# Expected: Different instance IDs in responses
```

### 3. Load Test

```bash
# Install k6 load testing tool
brew install k6  # macOS
# or: sudo apt install k6  # Linux

# Create load test script
cat > load-test.js <<'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function () {
  let res = http.get('https://your-backend-staging.railway.app/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
EOF

# Run load test
k6 run load-test.js

# Watch Railway metrics
railway logs --tail 100
```

### 4. Rate Limit Test (Known Issue)

```bash
# Test rate limiting behavior across instances
# This will demonstrate the per-instance rate limit issue

# Make 150 requests in 15 minutes (exceeds 100/15min limit per IP)
for i in {1..150}; do
  curl -w "%{http_code}\n" https://your-backend-staging.railway.app/api/health
  sleep 6  # 6 seconds = 10 requests/minute
done

# Expected with 1 instance: HTTP 429 after ~100 requests
# Expected with 2 instances: May not hit rate limit (each has separate counter)
```

---

## Rollback Plan

If issues arise after enabling autoscaling:

### Quick Rollback

```bash
# Set back to single instance
railway service update --replicas-min 1 --replicas-max 1

# Or in Railway Dashboard:
# Settings > Deployment > Replicas: Fixed (1)
```

### Full Rollback

```bash
# Revert to previous deployment
railway rollback

# Or redeploy previous commit
git checkout [previous-commit]
railway up
```

---

## Monitoring After Scaling

### Key Metrics to Watch

1. **OpenAI Rate Limits**
   ```bash
   # Check OpenAI errors in logs
   railway logs --filter "Rate limit exceeded"
   railway logs --filter "429"
   ```

2. **Azure Speech Errors**
   ```bash
   # Check Azure concurrency issues
   railway logs --filter "Azure Speech"
   railway logs --filter "Circuit breaker"
   ```

3. **Instance Health**
   ```bash
   # Monitor all instances
   railway logs --tail 100
   
   # Check metrics endpoint (from whitelisted IP)
   curl https://your-backend.railway.app/api/metrics
   ```

4. **Response Times**
   ```bash
   # Test from client
   time curl https://your-backend.railway.app/api/health
   
   # Check monitoring dashboard
   open https://your-backend.railway.app/monitoring
   ```

---

## Cost Impact

| Configuration | Monthly Cost | Notes |
|--------------|--------------|-------|
| **1 instance (current)** | $10-20 | Baseline |
| **2 instances (moderate load)** | $20-40 | 2x cost |
| **3 instances (peak load)** | $30-60 | 3x cost |

**Note:** Railway charges per instance runtime. Autoscaling (min 1, max 3) means:
- Light traffic: $10-20/month (1 instance)
- Heavy traffic: $30-60/month (3 instances)
- Average: ~$25-35/month

---

## Known Limitations

### Until Redis Migration (Issue #2 & #3)

1. **Rate Limits Not Enforced Globally**
   - Each instance has separate counters
   - Users can exceed limits by hitting different instances
   - Mitigation: Still provides some protection per instance

2. **OpenAI Rate Limit Risk**
   - 2 instances = 2x OpenAI requests potentially
   - May exceed OpenAI 50 req/min limit
   - Mitigation: Circuit breaker will stop requests if hit

3. **Circuit Breaker Not Shared**
   - Each instance has separate circuit breaker
   - One instance may block while others allow
   - Mitigation: Better than no circuit breaker

4. **User Tracking Not Consolidated**
   - User analytics split across instances
   - Admin dashboard shows partial data
   - Mitigation: Acceptable for now, fix in Issue #3

---

## Next Steps

1. ✅ **Complete:** Code audit for stateful components
2. ✅ **Complete:** Railway config updated with health check
3. ⏳ **In Progress:** Enable autoscaling in Railway dashboard
4. ⏳ **Pending:** Test with 2 instances in staging
5. ⏳ **Pending:** Monitor for 24 hours before production

### Future Issues

- **Issue #2 (Week 1-2):** Migrate OpenAI queue to Redis
- **Issue #3 (Week 3):** Migrate rate limits to Redis
- **Issue #4 (Week 4):** Migrate circuit breaker to Redis

---

## Acceptance Criteria

Before merging to production, verify:

- [ ] Railway autoscaling configured (min 1, max 3)
- [ ] 2 instances can run simultaneously in staging
- [ ] Health checks pass on all instances
- [ ] No regression: `/api/health` responds < 200ms
- [ ] No regression: `/api/ai/generate-flashcards` still works
- [ ] Smoke test: Generate flashcards, pronunciation assessment
- [ ] Monitoring dashboard accessible
- [ ] Logs show requests distributed across instances
- [ ] No errors in Railway logs after 1 hour

---

## Support

**Questions?** Contact the development team  
**Issues?** Check Railway logs: `railway logs --tail 100`  
**Rollback needed?** Follow the rollback plan above

---

**Last Updated:** October 12, 2025  
**Status:** Ready for staging deployment  
**Next:** Enable autoscaling in Railway dashboard

