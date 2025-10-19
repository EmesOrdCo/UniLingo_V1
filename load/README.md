# UniLingo Health Monitoring

This directory contains simple health monitoring for the UniLingo backend.

## What We Monitor

- **Basic Connectivity**: Can we reach the backend?
- **Health Endpoints**: Are the health check endpoints responding?
- **Core Functionality**: Are key API endpoints accessible?

## How It Works

The health check runs automatically:
- Every 6 hours via GitHub Actions
- On every push to main branch
- Manually via GitHub Actions UI

## What Gets Tested

1. **Basic Health Check** (`/api/health`)
   - Verifies backend is running
   - Quick response time check

2. **Detailed Health Check** (`/api/health/detailed`)
   - Service status monitoring
   - Performance metrics
   - Circuit breaker status

3. **Core Endpoints**
   - Rate limiting status
   - Key API accessibility

## Why This Approach

- ✅ **Simple**: No complex configuration
- ✅ **Fast**: Completes in under 30 seconds
- ✅ **Reliable**: Tests actual functionality
- ✅ **Maintainable**: Easy to understand and modify
- ✅ **No False Alerts**: Only fails on real issues

## Manual Testing

If you need to run a manual health check:

```bash
# Test basic health
curl -f "$STAGING_BASE_URL/api/health"

# Test detailed health
curl -f "$STAGING_BASE_URL/api/health/detailed"
```

## Monitoring Philosophy

We focus on **detecting real problems** rather than testing theoretical limits. 
The backend already has:
- Circuit breakers for service protection
- Rate limiting for abuse prevention  
- Performance monitoring
- Error handling and logging

Our health check ensures these systems are working and the backend is accessible.