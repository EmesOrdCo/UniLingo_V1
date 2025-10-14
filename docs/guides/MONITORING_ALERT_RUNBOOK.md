# Monitoring & Alert Runbook

**Issues:** #9 (SSE notifications) + #10 (Monitoring & alerts)  
**Date:** October 12, 2025  
**Purpose:** Operational guide for monitoring and responding to alerts

---

## Quick Reference

### Critical Alerts

| Alert | Threshold | Action | Priority |
|-------|-----------|--------|----------|
| Queue depth > 100 | 5 minutes | Scale workers | 🔴 Critical |
| Circuit breaker OPEN | Any | Investigate API | 🔴 Critical |
| Failure rate > 15% | 10 minutes | Check logs | 🔴 Critical |
| Budget kill-switch ON | Any | Review budget | 🟡 High |
| Worker down | 2 minutes | Restart worker | 🔴 Critical |

---

## Monitoring Endpoints

### 1. Alert Metrics (Primary Dashboard)

```bash
curl https://backend.railway.app/api/metrics/alerts

# Response:
{
  "metrics": {
    "queue": {
      "waiting": 25,
      "active": 3,
      "completed": 1500,
      "failed": 15
    },
    "performance": {
      "errorRate": 1.2,
      "avgResponseTime": 250,
      "requestsPerMinute": 12.5
    },
    "circuitBreakers": {
      "openai": {"state": "CLOSED", "failures": 0},
      "azure": {"state": "CLOSED", "failures": 0}
    },
    "sse": {
      "totalConnections": 5,
      "activeJobs": 3
    }
  },
  "alerts": {
    "queueDepthHigh": false,           ← Queue < 50
    "queueDepthCritical": false,       ← Queue < 100
    "failureRateHigh": false,          ← Error rate < 10%
    "circuitBreakerOpen": false,       ← All closed
    "workerStalled": false             ← Worker processing
  },
  "alertsActive": 0  ← No active alerts
}
```

**Check frequency:** Every 1-5 minutes

---

### 2. Queue Statistics

```bash
curl https://backend.railway.app/api/queue/stats

# Monitor:
{
  "waiting": 25,    ← Jobs queued
  "active": 3,      ← Currently processing (should match worker concurrency)
  "completed": 1500,
  "failed": 15      ← Watch this number
}
```

---

### 3. Circuit Breaker Status

```bash
curl https://backend.railway.app/api/circuit-breakers/status

# Monitor:
{
  "openai": {
    "state": "CLOSED",  ← OPEN = Problem!
    "failures": 2,      ← Watch if approaching threshold (5)
    "failureThreshold": 5
  }
}
```

---

### 4. Budget Status

```bash
curl https://backend.railway.app/api/admin/budget/status

# Monitor:
{
  "budget": {
    "killSwitchActive": false,  ← true = Service degraded
    "monthlyLimit": 100.00,
    "queueDepth": 28
  }
}
```

---

## Alert Response Procedures

### 🔴 ALERT: Queue Depth > 100 (Critical)

**Symptoms:**
- `/api/metrics/alerts` shows `queueDepthCritical: true`
- Jobs taking very long to process
- User complaints about slow responses

**Diagnosis:**
```bash
# Check queue stats
curl https://backend.railway.app/api/queue/stats

# Check worker health
curl https://backend-worker.railway.app/health

# Check worker logs
railway logs --service backend-worker --tail 50
```

**Actions:**

**Option 1: Scale Workers (Immediate)**
```bash
# Railway Dashboard:
# 1. Go to backend-worker service
# 2. Settings → Replicas → Increase max to 5
# 3. Save

# Or CLI:
railway service update --service backend-worker --replicas-max 5

# Monitor queue depth:
watch -n 10 'curl -s https://backend.railway.app/api/queue/stats | jq .stats.waiting'
```

**Option 2: Increase Worker Concurrency**
```javascript
// Edit backend/worker.js
const worker = new Worker('ai-jobs', processJob, {
  concurrency: 5,  // Increase from 3 to 5
  ...
});

// Deploy
railway up --service backend-worker
```

**Option 3: Activate Budget Kill-Switch (Emergency)**
```bash
# Stop accepting new jobs until queue clears
curl -X POST https://backend.railway.app/api/admin/budget/kill-switch \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "reason": "Queue overload - clearing backlog"}'

# Monitor queue clearing
# When waiting < 10:
curl -X POST https://backend.railway.app/api/admin/budget/kill-switch \
  -d '{"enabled": false}'
```

---

### 🔴 ALERT: Circuit Breaker OPEN

**Symptoms:**
- `/api/circuit-breakers/status` shows `state: "OPEN"`
- Jobs failing with "Circuit breaker is OPEN"
- OpenAI/Azure API errors in logs

**Diagnosis:**
```bash
# Check circuit breaker status
curl https://backend.railway.app/api/circuit-breakers/status

# Check worker logs for errors
railway logs --service backend-worker | grep -A 5 "Circuit breaker"

# Check OpenAI status
curl https://status.openai.com/api/v2/status.json
```

**Actions:**

**1. Identify root cause:**
- OpenAI rate limit exceeded → Wait or reduce concurrency
- OpenAI API down → Wait for recovery
- Invalid API key → Fix credentials
- Network issue → Check Railway network

**2. Wait for automatic recovery (60 seconds)**
```bash
# Circuit breaker will transition OPEN → HALF_OPEN → CLOSED
# Monitor:
watch -n 10 'curl -s https://backend.railway.app/api/circuit-breakers/status | jq .circuitBreakers.openai.state'
```

**3. Manual reset (if needed)**
```bash
# Only if root cause is fixed
curl -X POST https://backend.railway.app/api/circuit-breakers/reset/openai
```

---

### 🔴 ALERT: Failure Rate > 15%

**Symptoms:**
- `/api/metrics/alerts` shows `failureRateHigh: true`
- Many failed jobs in queue stats

**Diagnosis:**
```bash
# Check failure rate
curl https://backend.railway.app/api/metrics/alerts | jq .metrics.performance.errorRate

# Check failed jobs
curl https://backend.railway.app/api/queue/stats | jq .stats.failed

# Check worker logs
railway logs --service backend-worker | grep "Job failed"
```

**Common Causes:**

1. **Invalid job data** → Check job payload validation
2. **API errors** → Check OpenAI/Azure status
3. **Missing credentials** → Check environment variables
4. **Rate limits** → Reduce concurrency

**Actions:**
```bash
# View recent errors
railway logs --service backend-worker | grep -A 10 "Job failed" | tail -50

# Check specific failed job
curl https://backend.railway.app/api/job-status/[FAILED_JOB_ID]

# If API issue, check circuit breaker
curl https://backend.railway.app/api/circuit-breakers/status
```

---

### 🟡 ALERT: Budget Kill-Switch Active

**Symptoms:**
- Users getting 429 errors
- `/api/admin/budget/status` shows `killSwitchActive: true`

**Diagnosis:**
```bash
# Check budget status
curl https://backend.railway.app/api/admin/budget/status
```

**Actions:**

**1. Review why it was activated**
```bash
# Check logs for activation
railway logs | grep "Budget kill-switch activated"
```

**2. Clear queue if needed**
```bash
# Check queue depth
curl https://backend.railway.app/api/queue/stats

# Wait for queue to clear or manually clear old jobs
```

**3. Deactivate when safe**
```bash
curl -X POST https://backend.railway.app/api/admin/budget/kill-switch \
  -H "Content-Type: application/json" \
  -d '{"enabled": false, "reason": "Queue cleared, resuming normal operation"}'
```

---

### 🟡 ALERT: Worker Down/Stalled

**Symptoms:**
- `active: 0` but `waiting > 0` (jobs not being picked up)
- Worker health check fails

**Diagnosis:**
```bash
# Check worker health
curl https://backend-worker.railway.app/health

# Check Railway status
railway status --service backend-worker

# Check logs
railway logs --service backend-worker --tail 50
```

**Actions:**

**1. Restart worker**
```bash
# Railway will auto-restart on failure
# Manual restart:
railway service restart --service backend-worker
```

**2. Check for crashes**
```bash
# Look for crash logs
railway logs --service backend-worker | grep -E "(Error|Exception|crashed)"
```

**3. Scale if needed**
```bash
# Add more workers
railway service update --service backend-worker --replicas-min 2
```

---

## Monitoring Integrations

### Option 1: Sentry (Recommended)

**Setup:**
```bash
# Install Sentry
cd backend
npm install @sentry/node @sentry/profiling-node

# Add to backend/.env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Integration in server.js:**
```javascript
// Add at top of server.js
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'production',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  });
  
  // Request handler
  app.use(Sentry.Handlers.requestHandler());
  
  // Error handler (before other error handlers)
  app.use(Sentry.Handlers.errorHandler());
}
```

**Configure Alerts in Sentry:**
1. Go to Sentry project → Alerts
2. Create alert rules:
   - Error rate > 10% for 5 minutes
   - New issue type appears
   - Circuit breaker opens

---

### Option 2: Railway Alerts (Built-in)

**Setup in Railway Dashboard:**

1. Go to project → Settings → Notifications
2. Add webhook URL (Slack, Discord, etc.)
3. Configure alerts:
   - Service crashes
   - High CPU (> 80%)
   - High memory (> 80%)
   - Deployment fails

---

### Option 3: Custom Webhook Alerts

**Create monitoring script:**
```bash
#!/bin/bash
# monitor-and-alert.sh

BACKEND_URL="https://backend.railway.app"
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

while true; do
  ALERTS=$(curl -s "$BACKEND_URL/api/metrics/alerts")
  ALERT_COUNT=$(echo "$ALERTS" | jq .alertsActive)
  
  if [ "$ALERT_COUNT" -gt 0 ]; then
    # Send alert to Slack/Discord
    curl -X POST "$WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"🚨 UniLingo Alert: $ALERT_COUNT active alerts\"}"
  fi
  
  sleep 300  # Check every 5 minutes
done
```

**Run in background:**
```bash
chmod +x monitor-and-alert.sh
nohup ./monitor-and-alert.sh &
```

---

## Budget Control

### Set Monthly Budget Limit

```bash
# Set budget limit (e.g., $100/month)
curl -X POST https://backend.railway.app/api/admin/budget/set-limit \
  -H "Content-Type: application/json" \
  -d '{"limit": 100.00}'
```

### Activate Kill-Switch

```bash
# Emergency stop (prevents new jobs)
curl -X POST https://backend.railway.app/api/admin/budget/kill-switch \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "reason": "Monthly budget exceeded"}'

# Users will see: HTTP 429 "Service temporarily unavailable due to budget limits"
```

### Deactivate Kill-Switch

```bash
curl -X POST https://backend.railway.app/api/admin/budget/kill-switch \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

## Daily Monitoring Checklist

### Morning Check (5 minutes)

```bash
# 1. Check overall health
curl https://backend.railway.app/api/health

# 2. Check alert metrics
curl https://backend.railway.app/api/metrics/alerts | jq .alertsActive
# Target: 0 active alerts

# 3. Check queue depth
curl https://backend.railway.app/api/queue/stats | jq .stats.waiting
# Target: < 10

# 4. Check failure rate
curl https://backend.railway.app/api/metrics/alerts | jq .metrics.performance.errorRate
# Target: < 5%

# 5. Check circuit breakers
curl https://backend.railway.app/api/circuit-breakers/status | jq '.circuitBreakers.openai.state'
# Target: "CLOSED"
```

### Weekly Review (15 minutes)

1. **Review failure patterns**
   ```bash
   railway logs --service backend-worker | grep "Job failed" | tail -100
   ```

2. **Check resource usage**
   ```bash
   railway metrics --service backend-worker
   railway metrics --service redis
   ```

3. **Review costs**
   - Railway dashboard → Usage
   - OpenAI dashboard → Usage
   - Azure portal → Cost Management

4. **Adjust scaling if needed**
   - Too many failures → Reduce concurrency
   - Queue always deep → Add workers
   - Low usage → Reduce min replicas

---

## Alert Thresholds

### Queue Depth

```javascript
queueDepthHigh: waiting > 50        // Warning
queueDepthCritical: waiting > 100   // Critical
```

**Actions:**
- Warning (50): Monitor, prepare to scale
- Critical (100): Scale workers immediately

---

### Failure Rate

```javascript
failureRateHigh: errorRate > 10%    // High
failureRateCritical: errorRate > 20% // Critical
```

**Actions:**
- High (10%): Investigate logs
- Critical (20%): Activate kill-switch, debug

---

### Circuit Breaker

```javascript
circuitBreakerOpen: state === 'OPEN'  // Critical
```

**Actions:**
- Check provider status (OpenAI/Azure)
- Wait for automatic recovery (60s)
- Manual reset if provider is healthy

---

## SSE Notifications (Issue #9)

### Using SSE from Web Client

**JavaScript Example:**
```javascript
// Connect to job events
const jobId = 'your-job-id';
const eventSource = new EventSource(`/api/job-events?jobId=${jobId}`);

eventSource.addEventListener('connected', (e) => {
  console.log('Connected to SSE');
});

eventSource.addEventListener('active', (e) => {
  console.log('Job started processing');
});

eventSource.addEventListener('completed', (e) => {
  const data = JSON.parse(e.data);
  console.log('Job completed!', data.result);
  eventSource.close(); // Close connection
});

eventSource.addEventListener('failed', (e) => {
  const data = JSON.parse(e.data);
  console.error('Job failed:', data.error);
  eventSource.close();
});

eventSource.addEventListener('heartbeat', (e) => {
  console.log('💓 Connection alive');
});
```

### Test SSE Locally

```bash
# Open in browser:
http://localhost:3001/sse-example.html

# Or use curl:
curl -N http://localhost:3001/api/job-events?jobId=your-job-id

# Will stream events in real-time:
# event: connected
# data: {"jobId":"...","message":"Connected"}
#
# event: active
# data: {"jobId":"...","message":"Job is now being processed"}
#
# event: completed
# data: {"jobId":"...","result":{...}}
```

---

## Sentry Integration (Optional)

### Setup

```bash
# 1. Install Sentry
npm install @sentry/node@^7.100.0

# 2. Add to .env
SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/7654321
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# 3. Integration already provided in monitoring guide
```

### Configure Alerts in Sentry

**Error Rate Alert:**
- Condition: Error count > 10 in 5 minutes
- Action: Email + Slack notification
- Include: Stack trace, user context

**Circuit Breaker Alert:**
- Condition: Issue titled "Circuit breaker"
- Action: Immediate notification
- Priority: Critical

**Worker Crash Alert:**
- Condition: Error in backend-worker service
- Action: Page on-call engineer
- Priority: Critical

---

## Synthetic Load Testing (for alerts)

### Generate Queue Depth Alert

```bash
# Enqueue 120 jobs rapidly (exceeds threshold of 100)
for i in {1..120}; do
  curl -s -X POST http://localhost:3001/api/ai/generate-flashcards \
    -H "Content-Type: application/json" \
    -H "user-id: load-test-$i" \
    -d "{\"content\":\"load test $i\",\"subject\":\"test\",\"topic\":\"test\",\"userId\":\"load-test-$i\"}" &
done

# Check alert status
curl http://localhost:3001/api/metrics/alerts | jq .alerts.queueDepthCritical
# Expected: true

# Monitor queue
watch -n 5 'curl -s http://localhost:3001/api/queue/stats | jq .stats.waiting'
```

### Trigger Circuit Breaker

```bash
# Set invalid OpenAI key temporarily
railway variables set OPENAI_API_KEY=invalid --service backend-worker

# Enqueue 6 jobs (exceeds threshold of 5)
for i in {1..6}; do
  curl -s -X POST http://localhost:3001/api/ai/generate-flashcards \
    -H "Content-Type: application/json" \
    -H "user-id: test" \
    -d '{"content":"test","subject":"test","topic":"test","userId":"test"}'
  sleep 1
done

# Check circuit breaker (should be OPEN)
curl http://localhost:3001/api/circuit-breakers/status | jq .circuitBreakers.openai.state

# Restore valid key
railway variables set OPENAI_API_KEY=sk-real-key --service backend-worker
```

---

## Metric Interpretation

### Queue Depth Trends

```
Healthy:     0-10 jobs waiting
Moderate:    10-50 jobs waiting (scale soon)
High:        50-100 jobs waiting (scale now)
Critical:    100+ jobs waiting (emergency scale)
```

### Failure Patterns

```
Transient:   Occasional failures (< 5%) = Normal
Intermittent: Failures come and go (5-10%) = Monitor
Sustained:   Constant failures (> 10%) = Problem
Critical:    Most jobs failing (> 20%) = Emergency
```

### Circuit Breaker States

```
CLOSED:      Normal operation ✅
HALF_OPEN:   Testing recovery (2-3 minutes) ⚠️
OPEN:        Blocking requests (investigate) 🔴
```

---

## Cost Control

### Monthly Budget Tracking

**Monitor costs:**
```bash
# OpenAI usage
https://platform.openai.com/usage

# Azure costs
https://portal.azure.com (Cost Management)

# Railway costs
https://railway.app/account/usage
```

### Budget Alert Thresholds

**Set alerts at:**
- 50% of budget → Warning email
- 75% of budget → Reduce concurrency
- 90% of budget → Activate kill-switch
- 100% of budget → Full kill-switch

### Cost Optimization

**If approaching budget:**

1. **Reduce worker concurrency** (3 → 2)
2. **Reduce max workers** (3 → 2)
3. **Activate kill-switch for non-critical jobs**
4. **Increase idempotency TTL** (reduce duplicate work)
5. **Review job payload sizes** (shorter content = fewer tokens)

---

## Escalation

### Level 1: Automated Recovery

- Circuit breaker: Auto-recovers in 60s
- Worker crash: Auto-restarts (Railway policy)
- Transient errors: Auto-retry with backoff

### Level 2: On-Call Engineer

**Trigger when:**
- Queue depth > 100 for > 10 minutes
- Circuit breaker open for > 5 minutes
- Failure rate > 20% for > 10 minutes
- Worker repeatedly crashing

**Actions:**
- Scale workers
- Investigate logs
- Reset circuit breaker if appropriate
- Activate kill-switch if emergency

### Level 3: Senior Engineer / DevOps

**Trigger when:**
- Budget exceeded
- Database issues
- Redis down
- Persistent API failures
- Infrastructure changes needed

---

## Useful Commands Reference

```bash
# === Health Checks ===
curl https://backend.railway.app/api/health
curl https://backend-worker.railway.app/health
curl https://backend.railway.app/api/redis/health

# === Monitoring ===
curl https://backend.railway.app/api/metrics/alerts
curl https://backend.railway.app/api/queue/stats
curl https://backend.railway.app/api/circuit-breakers/status
curl https://backend.railway.app/api/sse/stats

# === Budget Control ===
curl https://backend.railway.app/api/admin/budget/status
curl -X POST https://backend.railway.app/api/admin/budget/kill-switch \
  -d '{"enabled": true|false}'

# === Circuit Breaker ===
curl -X POST https://backend.railway.app/api/circuit-breakers/reset/openai

# === Logs ===
railway logs --service backend-worker --tail 100 --follow
railway logs --service backend --tail 100

# === Scaling ===
railway service update --service backend-worker --replicas-max 5
```

---

## Dashboard Setup

### Create Simple Monitoring Dashboard

**File:** `backend/public/monitoring-dashboard.html`

**Features:**
- Real-time metrics refresh
- Alert indicators
- Queue depth chart
- Circuit breaker status
- Budget status
- Quick actions (kill-switch, reset breaker)

**Access:** `https://backend.railway.app/monitoring-dashboard.html`

---

**Last Updated:** October 12, 2025  
**Owner:** DevOps Team  
**On-Call:** [Your team contact]

