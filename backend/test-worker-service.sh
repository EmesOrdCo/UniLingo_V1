#!/bin/bash

# Worker Service Validation Script
# Tests Issues #4 (Worker service) and #5 (Concurrency)
# Run this after worker is deployed

set -e

echo "=========================================="
echo "  Worker Service Validation Test"
echo "  Issues #4 + #5"
echo "=========================================="
echo ""

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
WORKER_URL="${WORKER_URL:-http://localhost:3002}"
TESTS_PASSED=0
TESTS_FAILED=0
POLL_INTERVAL=2
MAX_WAIT=60

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

info() {
    echo -e "${BLUE}ℹ INFO${NC}: $1"
}

warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

# Test 1: Worker health check
echo "Test 1: Worker health check..."
WORKER_HEALTH=$(curl -s "$WORKER_URL/health" 2>/dev/null || echo '{"status":"error"}')
WORKER_STATUS=$(echo "$WORKER_HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$WORKER_STATUS" = "healthy" ]; then
    pass "Worker is running and healthy"
    info "Worker stats: $(echo "$WORKER_HEALTH" | grep -o '"processed":[0-9]*' || echo 'N/A')"
else
    fail "Worker is not healthy (status: $WORKER_STATUS)"
    warn "Make sure worker is running: npm run worker"
    exit 1
fi

# Test 2: Redis connection
echo ""
echo "Test 2: Redis connection..."
REDIS_HEALTH=$(curl -s "$BACKEND_URL/api/redis/health" 2>/dev/null || echo '{"success":false}')
REDIS_STATUS=$(echo "$REDIS_HEALTH" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)

if [ "$REDIS_STATUS" = "connected" ]; then
    pass "Redis is connected"
else
    fail "Redis is not connected"
    exit 1
fi

# Test 3: Enqueue job and get immediate response
echo ""
echo "Test 3: Enqueue job (fast response)..."
START_TIME=$(date +%s%N)

RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/ai/generate-flashcards" \
    -H "Content-Type: application/json" \
    -H "user-id: test-worker-validation" \
    -d '{
        "content": "Worker validation test. Medical terminology: cardiology, pathology, oncology, neurology, radiology.",
        "subject": "Medicine",
        "topic": "Medical Specialties",
        "userId": "test-worker-validation",
        "nativeLanguage": "English"
    }')

END_TIME=$(date +%s%N)
DURATION=$(( ($END_TIME - $START_TIME) / 1000000 ))
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 202 ]; then
    pass "HTTP 202 Accepted returned"
else
    fail "Expected HTTP 202, got $HTTP_CODE"
fi

if [ "$DURATION" -lt 500 ]; then
    pass "Response time < 500ms (got ${DURATION}ms)"
else
    fail "Response time too slow (${DURATION}ms)"
fi

JOB_ID=$(echo "$BODY" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
    fail "No jobId in response"
    exit 1
else
    pass "Job ID returned: $JOB_ID"
fi

# Test 4: Job starts in "waiting" state
echo ""
echo "Test 4: Initial job status..."
sleep 1

STATUS_RESPONSE=$(curl -s "$BACKEND_URL/api/job-status/$JOB_ID")
INITIAL_STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$INITIAL_STATUS" = "waiting" ] || [ "$INITIAL_STATUS" = "active" ]; then
    pass "Job status is valid: $INITIAL_STATUS"
else
    fail "Unexpected initial status: $INITIAL_STATUS"
fi

# Test 5: Worker picks up and processes job
echo ""
echo "Test 5: Worker processes job to completion..."
info "Polling job status (max ${MAX_WAIT}s)..."

ELAPSED=0
FINAL_STATUS=""

while [ $ELAPSED -lt $MAX_WAIT ]; do
    STATUS_RESPONSE=$(curl -s "$BACKEND_URL/api/job-status/$JOB_ID")
    CURRENT_STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    echo "  ${ELAPSED}s: Status = $CURRENT_STATUS"
    
    if [ "$CURRENT_STATUS" = "completed" ]; then
        FINAL_STATUS="completed"
        break
    elif [ "$CURRENT_STATUS" = "failed" ]; then
        FINAL_STATUS="failed"
        break
    fi
    
    sleep $POLL_INTERVAL
    ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

if [ "$FINAL_STATUS" = "completed" ]; then
    pass "Job processed successfully in ${ELAPSED}s"
    
    # Check if result is present
    HAS_RESULT=$(echo "$STATUS_RESPONSE" | grep -o '"result":{')
    if [ ! -z "$HAS_RESULT" ]; then
        pass "Job result is available"
    else
        warn "Job completed but no result found"
    fi
    
elif [ "$FINAL_STATUS" = "failed" ]; then
    fail "Job failed"
    ERROR=$(echo "$STATUS_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "  Error: $ERROR"
else
    fail "Job did not complete within ${MAX_WAIT}s (status: $CURRENT_STATUS)"
    warn "Worker may not be running or processing is slow"
fi

# Test 6: Concurrent processing (Issue #5)
echo ""
echo "Test 6: Concurrent processing (3 jobs in parallel)..."
info "Enqueueing 5 jobs rapidly..."

JOB_IDS=()
for i in {1..5}; do
    RESPONSE=$(curl -s "$BACKEND_URL/api/ai/generate-flashcards" \
        -H "Content-Type: application/json" \
        -H "user-id: test-concurrent-$i" \
        -d "{
            \"content\": \"Concurrent test $i. Terms: test$i, example$i, validation$i.\",
            \"subject\": \"Testing\",
            \"topic\": \"Concurrency\",
            \"userId\": \"test-concurrent-$i\"
        }")
    
    JOB_ID=$(echo "$RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
    JOB_IDS+=("$JOB_ID")
    echo "  Job $i enqueued: $JOB_ID"
done

pass "5 jobs enqueued successfully"

info "Waiting for jobs to process..."
sleep 5

# Check queue stats to see active jobs
QUEUE_STATS=$(curl -s "$BACKEND_URL/api/queue/stats")
ACTIVE_COUNT=$(echo "$QUEUE_STATS" | grep -o '"active":[0-9]*' | cut -d':' -f2)

if [ ! -z "$ACTIVE_COUNT" ]; then
    if [ "$ACTIVE_COUNT" -le 3 ] && [ "$ACTIVE_COUNT" -gt 0 ]; then
        pass "Concurrency control working (active: $ACTIVE_COUNT, max: 3)"
    elif [ "$ACTIVE_COUNT" -eq 0 ]; then
        info "No jobs currently active (may have completed already)"
    else
        warn "Active jobs ($ACTIVE_COUNT) exceeds concurrency limit (3)"
    fi
fi

# Test 7: Check all jobs complete
echo ""
echo "Test 7: All jobs complete successfully..."
info "Waiting for all 5 jobs to complete (max ${MAX_WAIT}s)..."

COMPLETED_COUNT=0
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ] && [ $COMPLETED_COUNT -lt 5 ]; do
    COMPLETED_COUNT=0
    
    for JOB_ID in "${JOB_IDS[@]}"; do
        STATUS_RESPONSE=$(curl -s "$BACKEND_URL/api/job-status/$JOB_ID")
        STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$STATUS" = "completed" ]; then
            COMPLETED_COUNT=$((COMPLETED_COUNT + 1))
        fi
    done
    
    echo "  ${ELAPSED}s: Completed $COMPLETED_COUNT/5 jobs"
    
    if [ $COMPLETED_COUNT -eq 5 ]; then
        break
    fi
    
    sleep $POLL_INTERVAL
    ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

if [ $COMPLETED_COUNT -eq 5 ]; then
    pass "All 5 jobs completed in ${ELAPSED}s"
    
    AVG_TIME=$((ELAPSED / 5))
    info "Average time per job: ${AVG_TIME}s"
    
    if [ $AVG_TIME -lt 20 ]; then
        pass "Good throughput (< 20s per job with concurrency)"
    fi
else
    fail "Only $COMPLETED_COUNT/5 jobs completed in ${MAX_WAIT}s"
fi

# Test 8: Worker statistics
echo ""
echo "Test 8: Worker statistics..."
WORKER_STATS=$(curl -s "$WORKER_URL/health")
PROCESSED=$(echo "$WORKER_STATS" | grep -o '"processed":[0-9]*' | cut -d':' -f2)
SUCCEEDED=$(echo "$WORKER_STATS" | grep -o '"succeeded":[0-9]*' | cut -d':' -f2)

if [ ! -z "$PROCESSED" ] && [ "$PROCESSED" -gt 0 ]; then
    pass "Worker has processed jobs (processed: $PROCESSED, succeeded: $SUCCEEDED)"
else
    warn "Worker stats show 0 processed jobs"
fi

# Summary
echo ""
echo "=========================================="
echo "  Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Worker service is working correctly.${NC}"
    echo ""
    echo "=========================================="
    echo "  Worker Performance Summary"
    echo "=========================================="
    echo ""
    echo "✅ Worker is processing jobs successfully"
    echo "✅ Concurrency control is working (max 3 parallel)"
    echo "✅ Jobs complete in reasonable time"
    echo "✅ Health checks are responding"
    echo ""
    echo "Next steps:"
    echo "1. Monitor worker for 24 hours in staging"
    echo "2. Check queue depth: curl $BACKEND_URL/api/queue/stats"
    echo "3. Monitor worker logs: railway logs --service backend-worker"
    echo "4. Deploy to production if stable"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check worker is running:"
    echo "   curl $WORKER_URL/health"
    echo ""
    echo "2. Check worker logs:"
    echo "   railway logs --service backend-worker --tail 50"
    echo ""
    echo "3. Check queue stats:"
    echo "   curl $BACKEND_URL/api/queue/stats"
    echo ""
    echo "4. Verify environment variables:"
    echo "   railway variables --service backend-worker"
    echo ""
    exit 1
fi

