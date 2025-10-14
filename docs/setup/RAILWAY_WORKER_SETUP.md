# Railway Worker Service Setup

**Important:** Railway services cannot be defined in `railway.json` for multi-service setups from the same repo. You must create separate services via the Railway Dashboard or CLI.

---

## Why Not railway.json?

Railway's `railway.json` is designed for **single-service deployments**. When you need multiple services (web + worker) from the same repository, you must:

1. Create services separately in Railway Dashboard/CLI
2. Configure each service individually
3. Point both to the same repository
4. Use different start commands

**This is Railway's recommended approach for monorepos.**

---

## Adding Worker Service

### Method 1: Railway Dashboard (Easiest)

**Step 1: Create Worker Service**

1. Go to Railway project
2. Click **"+ New"** → **"Empty Service"**
3. Name: `backend-worker`
4. Click **"Add Service"**

**Step 2: Connect to GitHub Repo**

1. Click on `backend-worker` service
2. Settings → **"Connect to GitHub Repo"**
3. Select same repository as web service
4. Root Directory: `backend`
5. Save

**Step 3: Configure Build & Start**

Settings → Deployment:
```
Build Command: npm install
Start Command: npm run worker
Root Directory: backend

Health Check:
  Path: /health
  Port: 3002
  Timeout: 10s
```

**Step 4: Add Environment Variables**

Settings → Variables:

```
Option A: Copy from web service
  - Click "Raw Editor"
  - Copy all variables from backend-web service
  - Paste into backend-worker
  - Add: WORKER_HEALTH_PORT=3002

Option B: Link shared variables
  - Railway Pro feature
  - Create shared variable group
  - Both services use same vars
```

**Step 5: Connect to Redis**

Settings → Connect:
- Click **"+ New Connection"**
- Select Redis service
- Railway auto-sets `REDIS_URL`

**Step 6: Deploy**

- Click **"Deploy"**
- Watch logs for `🚀 WORKER SERVICE STARTED`

---

### Method 2: Railway CLI

```bash
# From project root
cd /Users/harryemes/UniLingo_Latest

# Link to Railway project
railway link

# Create worker service
railway service create backend-worker

# Switch to worker service context
railway service --service backend-worker

# Set root directory
railway variables set RAILWAY_SERVICE_ROOT=backend

# Set start command  
railway variables set RAILWAY_RUN_COMMAND="npm run worker"

# Set health check port
railway variables set WORKER_HEALTH_PORT=3002

# Copy all env vars from web service (manual)
# Get from web service:
railway service --service backend
railway variables > web-vars.txt

# Apply to worker:
railway service --service backend-worker
# Manually copy variables or use Railway dashboard

# Deploy worker
railway up --service backend-worker

# Check status
railway status --service backend-worker

# View logs
railway logs --service backend-worker --tail 100
```

---

## Verifying Deployment

### Check Both Services Running

```bash
# List all services
railway status

# Expected output:
# backend (web)
#   Status: Running
#   URL: https://backend-production.up.railway.app
#   
# backend-worker
#   Status: Running
#   URL: https://backend-worker-production.up.railway.app
#   
# redis
#   Status: Running
```

### Test Worker Health

```bash
# Web service health
curl https://backend-production.up.railway.app/api/health

# Worker health
curl https://backend-worker-production.up.railway.app/health

# Expected from worker:
# {
#   "status": "healthy",
#   "service": "worker",
#   "stats": {
#     "processed": 0,
#     "succeeded": 0,
#     "currentlyProcessing": 0
#   }
# }
```

### Test End-to-End

```bash
# 1. Enqueue job via web service
curl -X POST https://backend-production.up.railway.app/api/ai/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "user-id: test" \
  -d '{"content":"test","subject":"test","topic":"test","userId":"test"}'

# Response: {"jobId": "..."}

# 2. Check job status
curl https://backend-production.up.railway.app/api/job-status/[JOB_ID]

# Should transition:
# waiting → active → completed

# 3. Check worker logs
railway logs --service backend-worker

# Should see:
# 📤 Job picked up: [JOB_ID]
# ✅ Job completed: [JOB_ID]
```

---

## Scaling Workers

### Horizontal Scaling

**Railway Dashboard:**
1. Go to worker service
2. Settings → Deployment → Replicas
3. Set:
   ```
   Type: Dynamic
   Min: 1
   Max: 3
   Scale trigger: CPU > 70% OR Queue depth > 20
   ```

**Total Concurrency:**
```
1 worker  × 3 concurrent = 3 jobs in parallel
2 workers × 3 concurrent = 6 jobs in parallel  
3 workers × 3 concurrent = 9 jobs in parallel
```

### When to Scale

| Queue Depth | Recommended Workers | Total Concurrency |
|-------------|-------------------|-------------------|
| 0-10 | 1 | 3 |
| 10-30 | 2 | 6 |
| 30-60 | 3 | 9 |
| 60+ | 4-5 | 12-15 |

**Cost:** ~$10-20 per worker per month

---

## Troubleshooting

### Worker Not Starting

**Check 1: Start command correct?**
```bash
railway variables --service backend-worker | grep RAILWAY_RUN_COMMAND
# Should be: npm run worker
```

**Check 2: Dependencies installed?**
```bash
railway logs --service backend-worker | grep "npm install"
# Should see successful install
```

**Check 3: worker.js exists?**
```bash
# In your repo
ls backend/worker.js
# Should exist
```

### Worker Not Processing Jobs

**Check 1: Redis connected?**
```bash
curl https://backend-worker.railway.app/health
# Check: "status": "healthy"

railway logs --service backend-worker | grep "Redis connected"
```

**Check 2: Environment variables?**
```bash
railway variables --service backend-worker | grep -E "(REDIS_URL|OPENAI_API_KEY)"
```

**Check 3: Jobs in queue?**
```bash
curl https://backend.railway.app/api/queue/stats
# Check: "waiting": number
```

### Jobs Failing

**Check logs:**
```bash
railway logs --service backend-worker | grep -A 20 "Job failed"
```

**Common issues:**
- Missing OPENAI_API_KEY
- Missing SUPABASE credentials
- OpenAI rate limit exceeded
- Invalid job data

---

## Cost Implications

### Worker Service Costs

| Configuration | Monthly Cost |
|--------------|--------------|
| 1 worker (always on) | $10-20 |
| 2 workers (auto-scale) | $20-40 |
| 3 workers (peak) | $30-60 |

### Total System Cost

| Component | Cost/Month |
|-----------|-----------|
| Web service (1-3 instances) | $10-60 |
| Worker service (1-3 instances) | $10-60 |
| Redis (Developer plan) | $5-10 |
| **Total** | **$25-130** |

**Typical production:** $50-70/month for medium traffic

---

## Next Steps

After worker is deployed:

1. ✅ Convert other blocking endpoints to queue-based
2. ✅ Add more job types (lesson generation, audio generation)
3. ✅ Implement Redis rate limiting (Issue #6)
4. ✅ Add idempotency keys (Issue #7)
5. ✅ Improve retry logic (Issue #8)

---

**Last Updated:** October 12, 2025  
**Status:** ✅ Ready for Deployment  
**Related:** Issues #4 + #5

