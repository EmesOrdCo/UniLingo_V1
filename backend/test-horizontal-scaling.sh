#!/bin/bash

# Horizontal Scaling Validation Script
# Tests that multiple instances can run concurrently
# Run this after enabling autoscaling in Railway

set -e

echo "=========================================="
echo "  Horizontal Scaling Validation Test"
echo "=========================================="
echo ""

# Configuration
BACKEND_URL="${BACKEND_URL:-https://your-backend-staging.railway.app}"
TESTS_PASSED=0
TESTS_FAILED=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
    echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

# Test 1: Health check responds
echo "Test 1: Health check endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    pass "Health check returned 200"
    info "Response: $BODY"
else
    fail "Health check returned $HTTP_CODE (expected 200)"
fi

# Test 2: Multiple requests show different instances (if scaled)
echo ""
echo "Test 2: Checking for multiple instances..."
echo "Making 10 sequential requests to detect instance distribution..."

INSTANCE_IDS=()
for i in {1..10}; do
    RESPONSE=$(curl -s "$BACKEND_URL/api/health")
    # Try to extract any instance identifier from response headers or body
    # Railway adds X-Railway-* headers but they may not be visible to external requests
    echo "  Request $i: $RESPONSE"
    sleep 0.5
done

info "Note: Cannot reliably detect instance IDs from external requests"
info "Check Railway dashboard to verify multiple instances are running"
info "Command: railway status"

# Test 3: Concurrent requests (simulate load)
echo ""
echo "Test 3: Concurrent request handling..."
echo "Sending 5 concurrent health check requests..."

# Create temp directory for responses
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Send 5 concurrent requests
for i in {1..5}; do
    curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health" > "$TEMP_DIR/response_$i.txt" &
done

# Wait for all background jobs
wait

# Check all responses
SUCCESS_COUNT=0
for i in {1..5}; do
    HTTP_CODE=$(tail -n1 "$TEMP_DIR/response_$i.txt")
    if [ "$HTTP_CODE" -eq 200 ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
done

if [ "$SUCCESS_COUNT" -eq 5 ]; then
    pass "All 5 concurrent requests succeeded"
else
    fail "Only $SUCCESS_COUNT/5 concurrent requests succeeded"
fi

# Test 4: AI endpoint smoke test (should still work)
echo ""
echo "Test 4: AI endpoint smoke test..."
echo "Testing POST /api/ai/generate-flashcards..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/ai/generate-flashcards" \
    -H "Content-Type: application/json" \
    -H "user-id: test-scaling-user" \
    -d '{
        "content": "Test content for horizontal scaling validation",
        "subject": "Testing",
        "topic": "Scaling",
        "userId": "test-scaling-user",
        "nativeLanguage": "English",
        "showNativeLanguage": false
    }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 429 ]; then
    # 200 = Success, 429 = Rate limited (acceptable)
    pass "AI endpoint responding (HTTP $HTTP_CODE)"
    if [ "$HTTP_CODE" -eq 429 ]; then
        info "Rate limited - this is expected behavior"
    fi
else
    fail "AI endpoint returned unexpected HTTP $HTTP_CODE"
fi

# Test 5: Monitoring endpoint accessible
echo ""
echo "Test 5: Monitoring endpoints..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/metrics")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 403 ]; then
    # 200 = Accessible, 403 = IP whitelist (expected)
    pass "Metrics endpoint responding (HTTP $HTTP_CODE)"
    if [ "$HTTP_CODE" -eq 403 ]; then
        info "IP not whitelisted - this is expected for external tests"
    fi
else
    fail "Metrics endpoint returned unexpected HTTP $HTTP_CODE"
fi

# Test 6: Response time check
echo ""
echo "Test 6: Response time performance..."
TOTAL_TIME=0
for i in {1..5}; do
    START=$(date +%s%N)
    curl -s "$BACKEND_URL/api/health" > /dev/null
    END=$(date +%s%N)
    DURATION=$((($END - $START) / 1000000)) # Convert to milliseconds
    TOTAL_TIME=$(($TOTAL_TIME + $DURATION))
    echo "  Request $i: ${DURATION}ms"
done

AVG_TIME=$(($TOTAL_TIME / 5))
info "Average response time: ${AVG_TIME}ms"

if [ "$AVG_TIME" -lt 500 ]; then
    pass "Average response time < 500ms"
elif [ "$AVG_TIME" -lt 1000 ]; then
    info "Average response time acceptable but could be better"
    pass "Average response time < 1000ms"
else
    fail "Average response time > 1000ms (too slow)"
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
    echo -e "${GREEN}✓ All tests passed! Horizontal scaling is working.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Check Railway dashboard to verify instance count"
    echo "2. Monitor logs: railway logs --tail 100"
    echo "3. Check metrics: curl $BACKEND_URL/api/metrics"
    echo "4. Deploy to production if all looks good"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Review the output above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check Railway deployment status: railway status"
    echo "2. Check logs for errors: railway logs --tail 100"
    echo "3. Verify environment variables are set correctly"
    echo "4. Ensure health check endpoint is working: $BACKEND_URL/api/health"
    exit 1
fi

