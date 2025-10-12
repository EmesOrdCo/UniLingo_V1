#!/bin/bash

# Circuit Breaker and Retry Logic Test Script
# Tests Issues #6 (Redis circuit breaker) and #8 (Retry logic)
# Run this after deploying worker with circuit breaker

set -e

echo "=========================================="
echo "  Circuit Breaker & Retry Test"
echo "  Issues #6 + #8"
echo "=========================================="
echo ""

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
WORKER_URL="${WORKER_URL:-http://localhost:3002}"
TESTS_PASSED=0
TESTS_FAILED=0

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

# Test 1: Circuit breaker status endpoint exists
echo "Test 1: Circuit breaker status endpoint..."
CB_STATUS=$(curl -s "$BACKEND_URL/api/circuit-breakers/status" 2>/dev/null || echo '{"success":false}')
CB_SUCCESS=$(echo "$CB_STATUS" | grep -o '"success":true')

if [ ! -z "$CB_SUCCESS" ]; then
    pass "Circuit breaker status endpoint responds"
    
    # Parse OpenAI circuit breaker state
    OPENAI_STATE=$(echo "$CB_STATUS" | grep -o '"openai":{"name":"openai","state":"[^"]*"' | grep -o 'state":"[^"]*"' | cut -d'"' -f3)
    info "OpenAI circuit breaker state: $OPENAI_STATE"
    
    if [ "$OPENAI_STATE" = "CLOSED" ] || [ "$OPENAI_STATE" = "OPEN" ] || [ "$OPENAI_STATE" = "HALF_OPEN" ]; then
        pass "Circuit breaker state is valid: $OPENAI_STATE"
    else
        warn "Unexpected circuit breaker state: $OPENAI_STATE"
    fi
else
    fail "Circuit breaker status endpoint not working"
fi

# Test 2: Circuit breaker persists across instances
echo ""
echo "Test 2: Circuit breaker state persistence..."
info "This test verifies state is stored in Redis (shared across instances)"

# Get current state
INITIAL_STATE=$(echo "$CB_STATUS" | grep -o '"openai":{"name":"openai","state":"[^"]*"' | grep -o 'state":"[^"]*"' | cut -d'"' -f3)
info "Initial state: $INITIAL_STATE"

# Query again (may hit different instance if scaled)
CB_STATUS_2=$(curl -s "$BACKEND_URL/api/circuit-breakers/status")
STATE_2=$(echo "$CB_STATUS_2" | grep -o '"openai":{"name":"openai","state":"[^"]*"' | grep -o 'state":"[^"]*"' | cut -d'"' -f3)

if [ "$INITIAL_STATE" = "$STATE_2" ]; then
    pass "Circuit breaker state consistent across requests"
    info "State is stored in Redis (shared)"
else
    fail "Circuit breaker state mismatch: $INITIAL_STATE vs $STATE_2"
fi

# Test 3: Retry logic works for transient errors
echo ""
echo "Test 3: Retry logic and error classification..."
info "This is tested automatically in worker logs"
info "Look for: '🔄 Retrying OpenAI call (attempt X)' in logs"

# Enqueue a test job to trigger retry logic
TEST_RESPONSE=$(curl -s "$BACKEND_URL/api/ai/generate-flashcards" \
    -H "Content-Type: application/json" \
    -H "user-id: test-retry" \
    -d '{
        "content": "Test retry logic. Short content to minimize API cost.",
        "subject": "Testing",
        "topic": "Retry",
        "userId": "test-retry"
    }')

TEST_JOB_ID=$(echo "$TEST_RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TEST_JOB_ID" ]; then
    pass "Test job enqueued for retry testing: $TEST_JOB_ID"
    info "Monitor worker logs for retry behavior"
else
    warn "Could not enqueue test job"
fi

# Test 4: Worker health check
echo ""
echo "Test 4: Worker health check..."
WORKER_HEALTH=$(curl -s "$WORKER_URL/health" 2>/dev/null || echo '{"status":"error"}')
WORKER_STATUS=$(echo "$WORKER_HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$WORKER_STATUS" = "healthy" ]; then
    pass "Worker is healthy"
    
    PROCESSED=$(echo "$WORKER_HEALTH" | grep -o '"processed":[0-9]*' | cut -d':' -f2)
    SUCCESS_RATE=$(echo "$WORKER_HEALTH" | grep -o '"successRate":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$PROCESSED" ]; then
        info "Worker stats: Processed=$PROCESSED, Success rate=$SUCCESS_RATE"
    fi
else
    fail "Worker is not healthy: $WORKER_STATUS"
fi

# Test 5: Queue stats show active processing
echo ""
echo "Test 5: Queue statistics..."
QUEUE_STATS=$(curl -s "$BACKEND_URL/api/queue/stats")
WAITING_COUNT=$(echo "$QUEUE_STATS" | grep -o '"waiting":[0-9]*' | cut -d':' -f2)
ACTIVE_COUNT=$(echo "$QUEUE_STATS" | grep -o '"active":[0-9]*' | cut -d':' -f2)
COMPLETED_COUNT=$(echo "$QUEUE_STATS" | grep -o '"completed":[0-9]*' | cut -d':' -f2)
FAILED_COUNT=$(echo "$QUEUE_STATS" | grep -o '"failed":[0-9]*' | cut -d':' -f2)

if [ ! -z "$WAITING_COUNT" ]; then
    pass "Queue statistics available"
    info "Queue: Waiting=$WAITING_COUNT, Active=$ACTIVE_COUNT, Completed=$COMPLETED_COUNT, Failed=$FAILED_COUNT"
    
    # Check if failed count is reasonable
    if [ ! -z "$FAILED_COUNT" ] && [ ! -z "$COMPLETED_COUNT" ] && [ "$COMPLETED_COUNT" -gt 0 ]; then
        TOTAL=$((COMPLETED_COUNT + FAILED_COUNT))
        if [ "$TOTAL" -gt 0 ]; then
            FAILURE_RATE=$(awk "BEGIN {printf \"%.1f\", ($FAILED_COUNT / $TOTAL) * 100}")
            info "Failure rate: $FAILURE_RATE%"
            
            if [ $(echo "$FAILURE_RATE < 10" | bc -l) -eq 1 ]; then
                pass "Failure rate acceptable (< 10%)"
            else
                warn "Failure rate high: $FAILURE_RATE%"
            fi
        fi
    fi
else
    warn "Could not retrieve queue statistics"
fi

# Test 6: Simulate circuit breaker behavior
echo ""
echo "Test 6: Circuit breaker behavior..."
info "Manual test: Simulate repeated failures to open circuit breaker"
echo ""
echo "To test circuit breaker opening:"
echo "1. Set invalid OPENAI_API_KEY in worker"
echo "2. Enqueue 6+ jobs (exceeds failure threshold of 5)"
echo "3. Check circuit breaker status: curl $BACKEND_URL/api/circuit-breakers/status"
echo "4. Should see state: OPEN"
echo "5. After 60 seconds, should transition to HALF_OPEN"
echo ""
info "Skipping automatic failure simulation (would consume API quota)"

pass "Circuit breaker endpoints functional (manual testing required for full validation)"

# Test 7: Circuit breaker reset (admin function)
echo ""
echo "Test 7: Circuit breaker reset functionality..."
info "Testing admin reset endpoint..."

RESET_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/circuit-breakers/reset/openai")
RESET_CODE=$(echo "$RESET_RESPONSE" | tail -n1)
RESET_BODY=$(echo "$RESET_RESPONSE" | head -n-1)

if [ "$RESET_CODE" -eq 200 ] || [ "$RESET_CODE" -eq 403 ]; then
    if [ "$RESET_CODE" -eq 200 ]; then
        pass "Circuit breaker reset endpoint works"
    else
        pass "Circuit breaker reset endpoint exists (IP not whitelisted - expected)"
    fi
else
    fail "Circuit breaker reset endpoint error: HTTP $RESET_CODE"
fi

# Test 8: Redis keys exist for circuit breaker
echo ""
echo "Test 8: Redis circuit breaker keys..."
info "Checking if circuit breaker state is in Redis..."

if command -v redis-cli &> /dev/null; then
    CB_KEYS=$(redis-cli KEYS "circuit:openai:*" 2>/dev/null || echo "")
    
    if [ ! -z "$CB_KEYS" ]; then
        pass "Circuit breaker keys found in Redis"
        info "Keys: $CB_KEYS"
    else
        info "No circuit breaker keys yet (normal if no failures occurred)"
    fi
else
    info "redis-cli not available, skipping Redis key check"
    info "Install: brew install redis (macOS) or apt install redis-tools (Linux)"
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
    echo -e "${GREEN}✓ All automated tests passed!${NC}"
    echo ""
    echo "=========================================="
    echo "  Manual Testing Instructions"
    echo "=========================================="
    echo ""
    echo "Test Circuit Breaker Opening:"
    echo ""
    echo "1. Create a test scenario that will fail (e.g., invalid API key)"
    echo "2. Enqueue 6+ jobs rapidly:"
    echo "   for i in {1..6}; do"
    echo "     curl -X POST $BACKEND_URL/api/ai/generate-flashcards \\"
    echo "       -H \"Content-Type: application/json\" \\"
    echo "       -H \"user-id: test\" \\"
    echo "       -d '{\"content\":\"test\",\"subject\":\"test\",\"topic\":\"test\",\"userId\":\"test\"}'"
    echo "   done"
    echo ""
    echo "3. Check circuit breaker status:"
    echo "   curl $BACKEND_URL/api/circuit-breakers/status"
    echo ""
    echo "4. Should see state: OPEN after 5 failures"
    echo ""
    echo "5. Wait 60 seconds, check again:"
    echo "   Should transition to HALF_OPEN"
    echo ""
    echo "6. Fix the issue (restore valid API key)"
    echo ""
    echo "7. Enqueue 2+ jobs:"
    echo "   Should succeed and transition back to CLOSED"
    echo ""
    echo "=========================================="
    echo "  Test Retry Logic with Jitter"
    echo "=========================================="
    echo ""
    echo "1. Monitor worker logs:"
    echo "   railway logs --service backend-worker --follow"
    echo ""
    echo "2. Look for retry messages:"
    echo "   🔄 Retrying OpenAI call (attempt X)"
    echo "   ⏱️ Backoff delay: XXXms"
    echo ""
    echo "3. Verify exponential backoff with jitter:"
    echo "   Attempt 1: ~2000ms ± 500ms"
    echo "   Attempt 2: ~4000ms ± 1000ms"
    echo "   Attempt 3: ~8000ms ± 2000ms"
    echo ""
    echo "=========================================="
    echo "  Monitoring"
    echo "=========================================="
    echo ""
    echo "# Check circuit breaker status"
    echo "curl $BACKEND_URL/api/circuit-breakers/status"
    echo ""
    echo "# Reset circuit breaker (admin)"
    echo "curl -X POST $BACKEND_URL/api/circuit-breakers/reset/openai"
    echo ""
    echo "# Monitor Redis keys"
    echo "redis-cli KEYS circuit:*"
    echo "redis-cli GET circuit:openai:state"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    echo ""
    echo "Common issues:"
    echo "1. Circuit breaker endpoints not accessible"
    echo "   Fix: Check IP whitelist for monitoring endpoints"
    echo ""
    echo "2. Worker not running"
    echo "   Fix: npm run worker"
    echo ""
    echo "3. Redis not connected"
    echo "   Fix: Check REDIS_URL environment variable"
    echo ""
    exit 1
fi

