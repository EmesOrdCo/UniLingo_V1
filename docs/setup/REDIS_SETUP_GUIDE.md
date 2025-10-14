# Redis Setup Guide for Railway

**Purpose:** Enable persistent job queues with BullMQ  
**Issues:** #2 (Non-blocking endpoints) + #3 (Persistent queues)  
**Date:** October 12, 2025

---

## Quick Start (5 Minutes)

### Step 1: Add Redis to Railway

**Option A: Railway Dashboard (Easiest)**

1. Go to your Railway project: https://railway.app/project/[your-project-id]
2. Click **"+ New"** button
3. Select **"Database"** → **"Add Redis"**
4. Railway will automatically:
   - Provision a Redis instance
   - Set `REDIS_URL` environment variable
   - Connect it to your service
5. Done! Redis is ready.

**Option B: Railway CLI**

```bash
# Make sure you're in your project directory
cd backend

# Add Redis plugin
railway plugin:add redis

# Verify it was added
railway variables
# Should see: REDIS_URL=redis://...
```

---

### Step 2: Install Dependencies

```bash
# Install BullMQ and ioredis
cd backend
npm install bullmq@^5.1.0 ioredis@^5.3.2

# Dependencies are already in package.json if you pulled latest code
npm install
```

---

### Step 3: Verify Connection

```bash
# Start your backend locally (with Redis running)
npm start

# You should see in logs:
# ✅ Redis connected successfully

# Test the health check
curl http://localhost:3001/api/redis/health

# Expected response:
# {
#   "success": true,
#   "redis": "connected",
#   "timestamp": "2025-10-12T..."
# }
```

---

## Environment Variables

### Automatic Configuration (Railway)

When you add Redis via Railway, it automatically sets:

```bash
REDIS_URL=redis://default:password@redis.railway.internal:6379
```

The `queueClient.js` automatically detects and uses this.

### Manual Configuration (Local Development)

If running locally with your own Redis:

```bash
# Option 1: Use REDIS_URL (Railway format)
REDIS_URL=redis://localhost:6379

# Option 2: Use individual variables
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_if_any
```

Add to your `backend/.env` file:

```bash
# backend/.env
REDIS_URL=redis://localhost:6379
```

---

## Local Redis Installation

### macOS (Homebrew)

```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Or run once
redis-server

# Test connection
redis-cli ping
# Expected: PONG
```

### Ubuntu/Debian

```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# Enable on boot
sudo systemctl enable redis-server

# Test connection
redis-cli ping
# Expected: PONG
```

### Docker (All Platforms)

```bash
# Run Redis in Docker
docker run -d -p 6379:6379 redis:7-alpine

# Test connection
docker exec -it [container-id] redis-cli ping
# Expected: PONG
```

---

## Testing the Queue System

### Test 1: Enqueue a Job

```bash
# Enqueue a flashcard generation job
curl -X POST http://localhost:3001/api/ai/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "user-id: test-user" \
  -d '{
    "content": "Test content for queue system",
    "subject": "Testing",
    "topic": "Queue",
    "userId": "test-user",
    "nativeLanguage": "English",
    "showNativeLanguage": false
  }'

# Expected response (< 200ms):
# {
#   "success": true,
#   "message": "Flashcard generation job queued successfully",
#   "jobId": "generate-flashcards-1234567890-abc123",
#   "status": "queued",
#   "statusUrl": "/api/job-status/generate-flashcards-1234567890-abc123",
#   "estimatedTime": "10-30 seconds"
# }
```

### Test 2: Check Job Status

```bash
# Replace JOB_ID with the jobId from step 1
curl http://localhost:3001/api/job-status/[JOB_ID]

# Expected responses:

# Queued (immediately after enqueue):
# {
#   "success": true,
#   "status": "waiting",
#   "jobId": "generate-flashcards-1234567890-abc123",
#   "timestamp": 1234567890
# }

# Processing (when worker picks it up):
# {
#   "success": true,
#   "status": "active",
#   "jobId": "generate-flashcards-1234567890-abc123",
#   "progress": 50
# }

# Completed (after processing):
# {
#   "success": true,
#   "status": "completed",
#   "jobId": "generate-flashcards-1234567890-abc123",
#   "result": {
#     "flashcards": [...],
#     "tokenUsage": 1234
#   },
#   "completedAt": 1234567890
# }

# Failed (if error occurred):
# {
#   "success": true,
#   "status": "failed",
#   "jobId": "generate-flashcards-1234567890-abc123",
#   "error": "Error message here",
#   "attemptsMade": 3
# }
```

### Test 3: Check Queue Statistics

```bash
# From whitelisted IP (monitoring endpoint)
curl http://localhost:3001/api/queue/stats

# Expected response:
# {
#   "success": true,
#   "stats": {
#     "queue": "ai-jobs",
#     "waiting": 0,
#     "active": 1,
#     "completed": 5,
#     "failed": 0,
#     "delayed": 0,
#     "total": 6
#   }
# }
```

### Test 4: Persistence Test (Redis)

```bash
# 1. Enqueue a job
curl -X POST http://localhost:3001/api/ai/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "user-id: test-user" \
  -d '{"content":"test","subject":"test","topic":"test","userId":"test"}'

# Save the jobId from response

# 2. Stop the server
# Press Ctrl+C in terminal where server is running

# 3. Check Redis directly (job should still exist)
redis-cli
> KEYS bull:ai-jobs:*
# Should show keys for the job

# 4. Restart server
npm start

# 5. Check job status (should still be there!)
curl http://localhost:3001/api/job-status/[JOB_ID]
# Job should still exist in Redis
```

---

## BullMQ Queue Configuration

The queue is configured in `backend/queueClient.js`:

```javascript
{
  attempts: 3, // Retry failed jobs up to 3 times
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2 second delay, doubles each retry
  },
  removeOnComplete: {
    age: 3600, // Keep completed jobs for 1 hour
    count: 100, // Keep last 100 completed jobs
  },
  removeOnFail: {
    age: 86400, // Keep failed jobs for 24 hours
    count: 500, // Keep last 500 failed jobs
  },
}
```

### Tuning Options

**For high-volume production:**

```javascript
removeOnComplete: {
  age: 300, // Keep for 5 minutes only
  count: 50,
}
```

**For debugging/development:**

```javascript
removeOnComplete: {
  age: 86400, // Keep for 24 hours
  count: 1000,
}
```

---

## Monitoring Redis

### Redis CLI Commands

```bash
# Connect to Redis
redis-cli

# Or with password
redis-cli -a your_password

# Check if Redis is running
> PING
PONG

# List all keys (WARNING: slow on large DBs)
> KEYS *

# List BullMQ job keys only
> KEYS bull:ai-jobs:*

# Get number of jobs
> LLEN bull:ai-jobs:wait
> LLEN bull:ai-jobs:active

# Get memory usage
> INFO memory

# Get connected clients
> CLIENT LIST

# Monitor commands in real-time
> MONITOR
```

### Railway Redis Monitoring

1. Go to Railway dashboard
2. Click on **Redis** service
3. Go to **Metrics** tab
4. Monitor:
   - Memory usage
   - Connections
   - CPU usage
   - Network I/O

---

## Troubleshooting

### Problem: Cannot connect to Redis

**Check 1: Is Redis running?**

```bash
# Local
redis-cli ping

# Railway
railway logs --service redis

# Docker
docker ps | grep redis
```

**Check 2: Environment variables set?**

```bash
# Check .env file
cat backend/.env | grep REDIS

# Check Railway variables
railway variables | grep REDIS
```

**Check 3: Network connectivity**

```bash
# Test connection
telnet localhost 6379
# or
nc -zv localhost 6379
```

---

### Problem: Jobs not being processed

**Check 1: Is worker running?**

```bash
# For now (no worker yet), jobs won't process
# This is expected until Issue #4 (Worker service)

# You can still enqueue and check status
# Jobs will be waiting in queue
```

**Check 2: Queue statistics**

```bash
curl http://localhost:3001/api/queue/stats

# If "waiting" count keeps growing, worker isn't running
```

**Check 3: Redis logs**

```bash
# Railway
railway logs --service redis

# Local
redis-cli
> MONITOR
```

---

### Problem: Jobs disappearing after restart

**This should NOT happen with Redis!**

If it does:

```bash
# Check 1: Is REDIS_URL set correctly?
echo $REDIS_URL

# Check 2: Is Redis persistent?
redis-cli CONFIG GET dir
redis-cli CONFIG GET save

# Check 3: Check Redis logs for errors
railway logs --service redis
```

---

### Problem: Out of memory

**Check Redis memory:**

```bash
redis-cli INFO memory | grep used_memory_human
```

**Solutions:**

1. **Reduce TTL for completed jobs:**
   ```javascript
   removeOnComplete: { age: 300 } // 5 minutes instead of 1 hour
   ```

2. **Increase Railway Redis plan:**
   - Go to Redis service
   - Settings → Upgrade Plan

3. **Clear old jobs manually:**
   ```bash
   redis-cli FLUSHDB # WARNING: Deletes all keys!
   ```

---

## Cost & Limits

### Railway Redis Pricing

| Plan | Memory | Price | Good For |
|------|--------|-------|----------|
| **Hobby** | 100MB | Free | Development |
| **Developer** | 512MB | $5/month | Small production |
| **Team** | 2GB | $10/month | Medium production |
| **Enterprise** | Custom | Custom | Large scale |

**Current usage:** ~10-50MB for typical workload

### Memory Estimates

```
Per job in queue: ~1-5KB
1,000 jobs = ~1-5MB
10,000 jobs = ~10-50MB
100,000 jobs = ~100-500MB
```

**Recommendation:** Start with **Developer plan ($5/month)** for production

---

## Next Steps

After Redis is set up:

1. ✅ **Complete Issue #2 & #3** (you are here)
2. ⏳ **Issue #4:** Add Worker Service to process jobs
3. ⏳ **Issue #5:** Add worker concurrency (3 parallel jobs)
4. ⏳ **Issue #6:** Move rate limits to Redis

---

## Quick Reference

### Useful Commands

```bash
# Check Redis health
curl http://localhost:3001/api/redis/health

# Check queue stats
curl http://localhost:3001/api/queue/stats

# Enqueue test job
curl -X POST http://localhost:3001/api/ai/generate-flashcards \
  -H "Content-Type: application/json" \
  -H "user-id: test" \
  -d '{"content":"test","subject":"test","topic":"test","userId":"test"}'

# Check job status
curl http://localhost:3001/api/job-status/[JOB_ID]

# View Redis keys
redis-cli KEYS bull:ai-jobs:*

# Monitor Redis commands
redis-cli MONITOR
```

### Important Files

- `backend/queueClient.js` - Queue client implementation
- `backend/server.js` - Queue-based endpoints
- `backend/package.json` - Dependencies (bullmq, ioredis)
- `backend/.env` - Environment variables

---

## Support

**Problems?** Check:
1. Redis is running: `redis-cli ping`
2. Environment variables set: `echo $REDIS_URL`
3. Dependencies installed: `npm list bullmq ioredis`
4. Railway logs: `railway logs`

**Still stuck?** Create an issue with:
- Error logs
- Redis status
- Environment variables (redact passwords!)

---

**Last Updated:** October 12, 2025  
**Status:** ✅ Ready for Use  
**Next:** Issue #4 (Worker Service)

