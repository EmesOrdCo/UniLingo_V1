# Worker Service Deployment Guide

**Purpose:** Deploy background worker to process queued jobs  
**Issues:** #4 (Worker service) + #5 (Concurrency)  
**Date:** October 12, 2025

---

## Overview

The worker service processes jobs from the Redis queue in the background, allowing the web service to return immediately without blocking on external API calls.

**Architecture:**
```
Web Service → Enqueues job → Redis Queue → Worker Service → OpenAI/Azure/AWS
```

---

## Quick Start: Deploy Worker to Railway

### Method 1: Railway Dashboard (Recommended)

**Step 1: Create Worker Service**

1. Go to your Railway project: https://railway.app/project/[your-project-id]
2. Click **"+ New"** button
3. Select **"Empty Service"**
4. Name it: `backend-worker`

**Step 2: Configure Worker Service**

1. Click on the new `backend-worker` service
2. Go to **Settings** tab
3. Configure:

```
Repository:
  ✅ Same repo as web service
  
Root Directory:
  backend

Build Command:
  npm install

Start Command:
  npm run worker

Health Check:
  Path: /health
  Port: 3002
  
Environment Variables:
  ✅ Copy all from web service
  ✅ Add: WORKER_HEALTH_PORT=3002
```

**Step 3: Connect to Redis**

1. Still in worker service settings
2. Scroll to **Connected Services**
3. Click **"+ Add Connection"**
4. Select your Redis service
5. Railway will automatically set `REDIS_URL` for the worker

**Step 4: Deploy**

1. Click **"Deploy"** button
2. Watch logs for: `🚀 WORKER SERVICE STARTED`
3. Verify health: `curl https://backend-worker.railway.app/health`

---

### Method 2: Railway CLI

```bash
# Make sure you're in the project root
cd /Users/harryemes/UniLingo_Latest

# Link to your Railway project (if not already)
railway link

# Create new service for worker
railway service create backend-worker

# Configure the worker service
railway service --service backend-worker

# Set the start command
railway variables set START_COMMAND="npm run worker"

# Set the health check port
railway variables set WORKER_HEALTH_PORT=3002

# Link to Redis (Railway will auto-connect if Redis exists)
railway link

# Deploy the worker
railway up --service backend-worker

# Check status
railway status --service backend-worker

# View logs
railway logs --service backend-worker --tail 100
```

---

### Method 3: Using railway.toml (Advanced)

Create `backend/railway.toml`:

```toml
# Web Service
[[services]]
name = "backend-web"
startCommand = "npm start"

[services.healthcheck]
path = "/api/health"
timeout = 10

# Worker Service
[[services]]
name = "backend-worker"
startCommand = "npm run worker"

[services.healthcheck]
path = "/health"
port = 3002
timeout = 10

# Shared configuration
[build]
builder = "NIXPACKS"

[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

## Testing Worker Locally

### Setup Local Environment

```bash
# 1. Make sure Redis is running
redis-server
# or
brew services start redis

# 2. Set environment variables
# Copy from .env or set manually
export REDIS_URL="redis://localhost:6379"
export OPENAI_API_KEY="sk-..."
export SUPABASE_URL="https://..."
export SUPABASE_ANON_KEY="..."

# 3. Install dependencies
cd backend
npm install
```

### Start Worker

```bash
# Terminal 1: Start worker
npm run worker

# Expected output:
# 🚀🚀🚀 WORKER SERVICE STARTED 🚀🚀🚀
# 📋 Queue: ai-jobs
# ⚡ Concurrency: 3 jobs in parallel
# 🌐 Environment: development
# 💚 Health check server listening on port 3002

# Terminal 2: Keep web service running
npm start
```

### Test Job Processing

```bash
# Terminal 3: Enqueue a test job
curl -X POST http://localhost:3001/api/ai/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "user-id: test-user" \
  -d '{
    "content": "This is test content to verify the worker processes jobs correctly. Medical terminology includes terms like cardiology, pathology, and diagnosis.",
    "subject": "Medicine",
    "topic": "Medical Terminology",
    "userId": "test-user",
    "nativeLanguage": "Spanish"
  }'

# Response (< 200ms):
# {
#   "jobId": "generate-flashcards-1697...",
#   "status": "queued"
# }

# Watch worker logs (Terminal 1) - you should see:
# 📤 Job picked up: generate-flashcards-1697...
# 🤖 Processing flashcard generation...
# ✅ Generated 15 flashcards
# ✅ Job completed: generate-flashcards-1697...

# Check job status:
curl http://localhost:3001/api/job-status/[JOB_ID]

# Expected (after ~10-20 seconds):
# {
#   "status": "completed",
#   "result": {
#     "flashcards": [...],
#     "tokenUsage": 1234
#   }
# }
```

---

## Worker Concurrency (Issue #5)

### Configuration

The worker is configured to process **3 jobs concurrently**:

```javascript
// backend/worker.js
const worker = new Worker('ai-jobs', processJob, {
  concurrency: 3,  // ← Process 3 jobs in parallel
  limiter: {
    max: 10,       // Max 10 jobs per second
    duration: 1000
  }
});
```

### How It Works

```
Queue has 5 jobs:
[Job1] [Job2] [Job3] [Job4] [Job5]

Worker (concurrency: 3):
├─ Processing Job1 (15s) ███████████████░░░░░
├─ Processing Job2 (12s) ████████████░░░░░░░░
└─ Processing Job3 (18s) ██████████████████░░

Job4 and Job5 wait until one slot frees up

When Job2 finishes (12s):
├─ Job1 still running (3s remaining)
├─ Job3 still running (6s remaining)
└─ Job4 starts processing ████████████████░░░░
```

**Benefits:**
- 3x throughput compared to sequential
- Controlled load on OpenAI (won't exceed limits)
- Better resource utilization

### Tuning Concurrency

**For low OpenAI rate limits:**
```javascript
concurrency: 2  // More conservative
```

**For high OpenAI rate limits:**
```javascript
concurrency: 5  // More aggressive
```

**Current setting:** `3` (balanced)

---

## Scaling Workers

### Horizontal Scaling (Multiple Worker Instances)

**Scenario:** Queue depth growing, need more processing power

**Option 1: Railway Dashboard**

1. Go to worker service
2. Settings → Deployment
3. Set Replicas:
   ```
   Min: 1
   Max: 3
   Scale on: CPU > 70%
   ```

**Result:** 3 workers × 3 concurrency = **9 jobs in parallel**

**Option 2: Railway CLI**

```bash
railway service update --service backend-worker --replicas-min 1 --replicas-max 3
```

### Global Concurrency Calculation

```
Formula: Total Concurrency = Workers × Concurrency per Worker

Examples:
1 worker  × 3 concurrent = 3 jobs in parallel
2 workers × 3 concurrent = 6 jobs in parallel
3 workers × 3 concurrent = 9 jobs in parallel
5 workers × 3 concurrent = 15 jobs in parallel
```

**Recommendation:** Start with 1-2 workers, scale up if queue depth > 20

---

## Monitoring Worker

### Health Check

```bash
# Check worker health
curl https://backend-worker.railway.app/health

# Expected:
# {
#   "status": "healthy",
#   "service": "worker",
#   "uptime": 3600000,
#   "stats": {
#     "processed": 150,
#     "succeeded": 148,
#     "failed": 2,
#     "currentlyProcessing": 2,
#     "peakConcurrency": 3,
#     "successRate": "98.7%"
#   }
# }
```

### Worker Logs

```bash
# View worker logs
railway logs --service backend-worker --tail 100

# Follow in real-time
railway logs --service backend-worker --follow

# Filter for specific job
railway logs --service backend-worker | grep "Job ID: [your-job-id]"

# Check for errors
railway logs --service backend-worker | grep -E "(error|failed)"
```

### Queue Monitoring

```bash
# Check queue depth (from whitelisted IP)
curl https://backend-web.railway.app/api/queue/stats

# Expected:
# {
#   "waiting": 5,    ← Jobs waiting to be processed
#   "active": 3,     ← Currently processing (should match concurrency)
#   "completed": 100,
#   "failed": 2
# }
```

**Alert triggers:**
- ⚠️ `waiting` > 50 → Add more workers
- ⚠️ `failed` increasing → Check worker logs
- ⚠️ `active` = 0 → Worker may be down

---

## Worker Statistics

The worker tracks and logs statistics:

```javascript
stats = {
  processed: 150,        // Total jobs processed
  succeeded: 148,        // Successfully completed
  failed: 2,             // Failed (after all retries)
  currentlyProcessing: 2,// Currently active
  peakConcurrency: 3,    // Highest concurrent jobs
  startTime: [timestamp] // When worker started
}
```

**View in logs:**
```bash
# Worker logs statistics on shutdown
railway logs --service backend-worker | grep "WORKER STATISTICS"
```

---

## Job Priority (Issue #5)

### Adding Priority to Jobs

**In web service (server.js):**

```javascript
// High priority job (processed first)
await queueClient.enqueue('generate-flashcards', payload, {
  priority: 10  // Higher number = higher priority
});

// Normal priority
await queueClient.enqueue('generate-flashcards', payload, {
  priority: 5
});

// Low priority
await queueClient.enqueue('generate-flashcards', payload, {
  priority: 1
});
```

**How BullMQ handles priority:**
- Jobs with higher priority are processed first
- Within same priority: FIFO (first in, first out)
- Useful for:
  - VIP users (priority: 10)
  - Normal users (priority: 5)
  - Batch jobs (priority: 1)

---

## Testing Worker

### Test 1: Single Job Processing

```bash
# 1. Start worker
npm run worker

# 2. Enqueue job
curl -X POST http://localhost:3001/api/ai/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "user-id: test" \
  -d '{"content":"test","subject":"test","topic":"test","userId":"test"}'

# 3. Watch worker logs
# Should see: "Job picked up" → "Job completed"

# 4. Check job status
curl http://localhost:3001/api/job-status/[JOB_ID]

# Expected: {"status": "completed", "result": {...}}
```

### Test 2: Concurrent Processing (3 jobs)

```bash
# Enqueue 5 jobs rapidly
for i in {1..5}; do
  curl -s -X POST http://localhost:3001/api/ai/generate-flashcards \
    -H "Content-Type: application/json" \
    -H "user-id: test" \
    -d "{\"content\":\"test $i\",\"subject\":\"test\",\"topic\":\"test\",\"userId\":\"test\"}" &
done

# Watch worker logs
# Should see: "Currently processing: 3 jobs" (max concurrency)
# Then as jobs complete: Job4 starts, then Job5

# Verify in logs:
# ✅ Up to 3 jobs processing simultaneously
# ✅ Jobs 4 and 5 wait until slots free up
```

### Test 3: Job Persistence

```bash
# 1. Enqueue job
JOB_ID=$(curl -s -X POST http://localhost:3001/api/ai/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "user-id: test" \
  -d '{"content":"test","subject":"test","topic":"test","userId":"test"}' \
  | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

# 2. Stop worker (Ctrl+C)

# 3. Check job still in queue
curl http://localhost:3001/api/job-status/$JOB_ID
# Expected: {"status": "waiting"}  ← Still there!

# 4. Restart worker
npm run worker

# 5. Watch logs - worker picks up the job
# Job should complete even though worker was restarted
```

---

## Troubleshooting

### Problem: Worker not picking up jobs

**Check 1: Is worker running?**
```bash
railway status --service backend-worker
# or
ps aux | grep "node worker.js"
```

**Check 2: Is Redis connected?**
```bash
curl https://backend-worker.railway.app/health
# Check: "status": "healthy"
```

**Check 3: Are jobs in queue?**
```bash
curl https://backend-web.railway.app/api/queue/stats
# Check: "waiting": number
```

**Check 4: Check worker logs**
```bash
railway logs --service backend-worker --tail 50
# Look for: "WORKER SERVICE STARTED"
# Look for: "Job picked up"
```

---

### Problem: Jobs failing with errors

**Check OpenAI credentials:**
```bash
railway variables --service backend-worker | grep OPENAI_API_KEY
```

**Check worker logs:**
```bash
railway logs --service backend-worker | grep -A 10 "Job failed"
```

**Common issues:**
- Missing environment variables
- OpenAI API key not set
- Supabase credentials not copied to worker
- Network connectivity issues

---

### Problem: Worker using too much memory

**Check memory usage:**
```bash
railway metrics --service backend-worker
```

**Solutions:**

1. **Reduce concurrency:**
   ```javascript
   concurrency: 2  // Instead of 3
   ```

2. **Add memory limit:**
   ```bash
   # Railway dashboard: Settings → Resources
   # Set memory limit: 512MB or 1GB
   ```

3. **Scale horizontally:**
   ```bash
   # Add more workers with lower concurrency each
   # 2 workers × 2 concurrent = 4 total (same as 1 worker × 4)
   ```

---

## Environment Variables

### Required for Worker

```bash
# Redis (auto-set by Railway)
REDIS_URL=redis://...

# OpenAI
OPENAI_API_KEY=sk-...
# or
EXPO_PUBLIC_OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# Azure (if needed)
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=...
AZURE_VISION_ENDPOINT=...
AZURE_VISION_KEY=...

# AWS (if needed)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Worker-specific
WORKER_HEALTH_PORT=3002  # Optional, defaults to 3002
NODE_ENV=production
```

### Copying Variables from Web to Worker

**Railway Dashboard:**
1. Go to web service → Settings → Variables
2. Click **"Copy All"**
3. Go to worker service → Settings → Variables
4. Click **"Paste"**
5. Add `WORKER_HEALTH_PORT=3002`

**Railway CLI:**
```bash
# Export from web service
railway variables --service backend-web > web-vars.txt

# Import to worker service
railway variables --service backend-worker < web-vars.txt

# Add worker-specific variable
railway variables set WORKER_HEALTH_PORT=3002 --service backend-worker
```

---

## Worker Performance

### Expected Performance

| Metric | Value |
|--------|-------|
| Concurrency | 3 jobs in parallel |
| Jobs/minute | ~6-15 (depends on job complexity) |
| Memory usage | 200-500MB |
| CPU usage | 20-60% |
| Success rate | > 95% |

### Scaling Guidelines

| Queue Depth | Worker Config | Total Concurrency |
|-------------|---------------|-------------------|
| < 10 jobs | 1 worker × 3 | 3 parallel |
| 10-30 jobs | 2 workers × 3 | 6 parallel |
| 30-60 jobs | 3 workers × 3 | 9 parallel |
| 60+ jobs | 4-5 workers × 3 | 12-15 parallel |

**Cost per worker:** ~$10-20/month

---

## Monitoring

### Health Checks

```bash
# Web service health
curl https://backend-web.railway.app/api/health

# Worker health
curl https://backend-worker.railway.app/health

# Redis health
curl https://backend-web.railway.app/api/redis/health

# Queue stats
curl https://backend-web.railway.app/api/queue/stats
```

### Key Metrics to Watch

1. **Queue Depth (`waiting`)**
   - < 10: Healthy
   - 10-30: Moderate load
   - 30+: Consider adding workers

2. **Active Jobs**
   - Should match concurrency × worker count
   - 1 worker: active = 0-3
   - 2 workers: active = 0-6

3. **Success Rate**
   - > 95%: Healthy
   - 90-95%: Investigate failures
   - < 90%: Check worker logs for errors

4. **Worker Memory**
   - < 400MB: Healthy
   - 400-700MB: Moderate
   - > 700MB: May need more workers or less concurrency

---

## Cost Analysis

### Worker Service Costs

| Configuration | Monthly Cost | Throughput |
|--------------|--------------|------------|
| **1 worker (concurrency: 3)** | $10-20 | 6-15 jobs/min |
| **2 workers (concurrency: 3)** | $20-40 | 12-30 jobs/min |
| **3 workers (concurrency: 3)** | $30-60 | 18-45 jobs/min |

**Total System Cost:**

| Component | Cost/Month |
|-----------|-----------|
| Web service (1-3 instances) | $10-60 |
| Worker service (1-3 instances) | $10-60 |
| Redis | $5-10 |
| **Total** | **$25-130** |

**Typical production:** ~$50-70/month

---

## Testing Checklist

Before deploying to production:

- [ ] Worker starts successfully locally
- [ ] Worker processes test job to completion
- [ ] 3 jobs process concurrently (verify in logs)
- [ ] Jobs persist across worker restart
- [ ] Health check endpoint responds
- [ ] Worker handles job failures gracefully
- [ ] Worker logs are clear and useful
- [ ] No memory leaks after processing 50+ jobs
- [ ] Redis connection is stable
- [ ] All environment variables set correctly

---

## Sample Logs

### Successful Job Processing

```
🚀🚀🚀 WORKER SERVICE STARTED 🚀🚀🚀
📋 Queue: ai-jobs
⚡ Concurrency: 3 jobs in parallel
💚 Health check server listening on port 3002

🎬 Worker initialization complete, waiting for jobs...

📤 Job picked up: generate-flashcards-1697123456789-abc123 (generate-flashcards)
   Currently processing: 1 jobs

🔄🔄🔄 WORKER: Processing Job 🔄🔄🔄
📋 Job ID: generate-flashcards-1697123456789-abc123
📦 Job Type: generate-flashcards
🔢 Attempt: 1/3
⏱️ Started: 2025-10-12T10:30:00.000Z

🤖 Processing flashcard generation...
   Subject: Medicine
   Topic: Cardiology
   User: user-123
   Content length: 2500 characters

✅ Generated 15 flashcards
🔢 Tokens used: 3456

✅✅✅ WORKER: Job Completed Successfully ✅✅✅
📋 Job ID: generate-flashcards-1697123456789-abc123
⏱️ Duration: 12.45s
📊 Result size: 15234 bytes

✅ Job completed: generate-flashcards-1697123456789-abc123
   Total processed: 1
   Success rate: 100.0%
```

### Concurrent Processing

```
📤 Job picked up: job-001 (generate-flashcards)
   Currently processing: 1 jobs

📤 Job picked up: job-002 (generate-flashcards)
   Currently processing: 2 jobs

📤 Job picked up: job-003 (generate-flashcards)
   Currently processing: 3 jobs

[Job-004 waits...]
[Job-005 waits...]

✅ Job completed: job-002
   Currently processing: 2 jobs

📤 Job picked up: job-004 (generate-flashcards)
   Currently processing: 3 jobs

✅ Job completed: job-001
   Currently processing: 2 jobs

📤 Job picked up: job-005 (generate-flashcards)
   Currently processing: 3 jobs
```

---

## Rollback Plan

### Stop Worker Service

**Railway Dashboard:**
1. Go to worker service
2. Settings → General
3. Click **"Delete Service"**

**Railway CLI:**
```bash
railway service delete --service backend-worker
```

### Disable Worker (Keep Service)

**Railway Dashboard:**
1. Go to worker service
2. Deployments → Click latest deployment
3. Click **"Remove"**

**Result:** Jobs will queue but not process (web still works)

---

## Next Steps

### After Worker is Stable (Week 2)

**Issue #6:** Redis Rate Limiting
- Move rate limits to Redis
- Share across all instances

**Issue #7:** Idempotency Keys
- Prevent duplicate jobs
- Cache results

**Issue #8:** Improved Retry Logic
- Better error classification
- Smarter backoff

---

## Quick Reference

### Start Worker Locally

```bash
# Terminal 1: Web service
npm start

# Terminal 2: Worker
npm run worker

# Terminal 3: Test
curl -X POST http://localhost:3001/api/ai/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "user-id: test" \
  -d '{"content":"test","subject":"test","topic":"test","userId":"test"}'
```

### Monitor Worker

```bash
# Health
curl http://localhost:3002/health

# Queue stats
curl http://localhost:3001/api/queue/stats

# Job status
curl http://localhost:3001/api/job-status/[JOB_ID]

# Worker logs
railway logs --service backend-worker --follow
```

---

## Support

**Questions?** Check:
1. Worker health: `curl .../health`
2. Worker logs: `railway logs --service backend-worker`
3. Queue stats: `curl .../api/queue/stats`
4. Redis connection: `curl .../api/redis/health`

**Need help?** Contact development team with:
- Worker logs
- Queue statistics
- Job ID that's stuck
- Error messages

---

**Last Updated:** October 12, 2025  
**Status:** ✅ Ready for Deployment  
**Next:** Issue #6 (Redis Rate Limiting)

