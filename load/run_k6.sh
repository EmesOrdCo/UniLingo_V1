#!/bin/bash

# UniLingo Load Test Runner
# Convenience script to run k6 load tests with proper configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_STAGING_BASE_URL="http://localhost:3001"
DEFAULT_VU_COUNT=50
DEFAULT_RAMP_UP="1m"
DEFAULT_STEADY_STATE="2m"
DEFAULT_RAMP_DOWN="30s"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -u, --url URL           Staging base URL (default: $DEFAULT_STAGING_BASE_URL)"
    echo "  -k, --api-key KEY       API key for authentication"
    echo "  -v, --vus COUNT         Number of virtual users (default: $DEFAULT_VU_COUNT)"
    echo "  -r, --ramp-up TIME      Ramp-up duration (default: $DEFAULT_RAMP_UP)"
    echo "  -s, --steady TIME       Steady state duration (default: $DEFAULT_STEADY_STATE)"
    echo "  -d, --ramp-down TIME    Ramp-down duration (default: $DEFAULT_RAMP_DOWN)"
    echo "  --dry-run               Run in dry-run mode (10 VUs, shorter duration)"
    echo "  --smoke-test            Run smoke test (50 VUs, 1 minute)"
    echo "  --full-test             Run full production test (5000 VUs, 17 minutes)"
    echo "  --auth-type TYPE        Authentication type: api_key, bearer, oauth (default: api_key)"
    echo "  --username USER         Username for OAuth (if applicable)"
    echo "  --password PASS         Password for OAuth (if applicable)"
    echo "  --max-jobs-per-user N   Maximum jobs per user (default: 3)"
    echo "  --queue-threshold N     Queue depth threshold (default: 500)"
    echo "  --job-timeout N         Job timeout in seconds (default: 30)"
    echo "  --user-ids LIST         Comma-separated list of user IDs to test"
    echo "  --cdn-url URL           CDN base URL for thumbnail testing"
    echo "  --output-dir DIR        Output directory for reports (default: ./load-results)"
    echo ""
    echo "Environment Variables:"
    echo "  STAGING_BASE_URL        Staging base URL"
    echo "  API_KEY                 API key for authentication"
    echo "  BEARER_TOKEN            Bearer token for authentication"
    echo "  VU_COUNT                Number of virtual users"
    echo "  DRY_RUN                 Set to 'true' for dry run mode"
    echo ""
    echo "Examples:"
    echo "  $0 --smoke-test"
    echo "  $0 --full-test --url https://staging.unilingo.com"
    echo "  $0 --dry-run --vus 20"
    echo "  $0 -u https://api.example.com -k my-api-key -v 100"
}

# Parse command line arguments
STAGING_BASE_URL="$DEFAULT_STAGING_BASE_URL"
VU_COUNT="$DEFAULT_VU_COUNT"
RAMP_UP="$DEFAULT_RAMP_UP"
STEADY_STATE="$DEFAULT_STEADY_STATE"
RAMP_DOWN="$DEFAULT_RAMP_DOWN"
API_KEY=""
AUTH_TYPE="api_key"
USERNAME=""
PASSWORD=""
MAX_JOBS_PER_USER=3
QUEUE_THRESHOLD=500
JOB_TIMEOUT=30
USER_IDS=""
CDN_URL=""
OUTPUT_DIR="./load-results"
DRY_RUN=false
SMOKE_TEST=false
FULL_TEST=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -u|--url)
            STAGING_BASE_URL="$2"
            shift 2
            ;;
        -k|--api-key)
            API_KEY="$2"
            shift 2
            ;;
        -v|--vus)
            VU_COUNT="$2"
            shift 2
            ;;
        -r|--ramp-up)
            RAMP_UP="$2"
            shift 2
            ;;
        -s|--steady)
            STEADY_STATE="$2"
            shift 2
            ;;
        -d|--ramp-down)
            RAMP_DOWN="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --smoke-test)
            SMOKE_TEST=true
            shift
            ;;
        --full-test)
            FULL_TEST=true
            shift
            ;;
        --auth-type)
            AUTH_TYPE="$2"
            shift 2
            ;;
        --username)
            USERNAME="$2"
            shift 2
            ;;
        --password)
            PASSWORD="$2"
            shift 2
            ;;
        --max-jobs-per-user)
            MAX_JOBS_PER_USER="$2"
            shift 2
            ;;
        --queue-threshold)
            QUEUE_THRESHOLD="$2"
            shift 2
            ;;
        --job-timeout)
            JOB_TIMEOUT="$2"
            shift 2
            ;;
        --user-ids)
            USER_IDS="$2"
            shift 2
            ;;
        --cdn-url)
            CDN_URL="$2"
            shift 2
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Override with environment variables if set
STAGING_BASE_URL="${STAGING_BASE_URL:-${STAGING_BASE_URL:-$DEFAULT_STAGING_BASE_URL}}"
API_KEY="${API_KEY:-${API_KEY:-${BEARER_TOKEN:-}}}"
VU_COUNT="${VU_COUNT:-${VU_COUNT:-$DEFAULT_VU_COUNT}}"

# Handle preset test configurations
if [ "$SMOKE_TEST" = true ]; then
    VU_COUNT=50
    RAMP_UP="30s"
    STEADY_STATE="1m"
    RAMP_DOWN="30s"
    print_status "Running smoke test configuration"
elif [ "$FULL_TEST" = true ]; then
    VU_COUNT=5000
    RAMP_UP="5m"
    STEADY_STATE="10m"
    RAMP_DOWN="2m"
    print_status "Running full production test configuration"
elif [ "$DRY_RUN" = true ]; then
    VU_COUNT=10
    RAMP_UP="10s"
    STEADY_STATE="30s"
    RAMP_DOWN="10s"
    MAX_JOBS_PER_USER=1
    print_status "Running dry run configuration"
fi

# Validate required parameters
if [ -z "$STAGING_BASE_URL" ]; then
    print_error "Staging base URL is required. Use -u/--url or set STAGING_BASE_URL environment variable."
    exit 1
fi

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    print_error "k6 is not installed. Please install k6 first:"
    echo "  macOS: brew install k6"
    echo "  Linux: https://k6.io/docs/getting-started/installation/"
    echo "  Docker: docker run --rm -i grafana/k6 run - <script.js"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate timestamp for unique filenames
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$OUTPUT_DIR/k6_results_${TIMESTAMP}.json"
REPORT_FILE="$OUTPUT_DIR/load_test_report_${TIMESTAMP}.md"

# Print configuration
print_status "Load Test Configuration:"
echo "  Base URL: $STAGING_BASE_URL"
echo "  Virtual Users: $VU_COUNT"
echo "  Ramp Up: $RAMP_UP"
echo "  Steady State: $STEADY_STATE"
echo "  Ramp Down: $RAMP_DOWN"
echo "  Auth Type: $AUTH_TYPE"
echo "  Max Jobs Per User: $MAX_JOBS_PER_USER"
echo "  Queue Threshold: $QUEUE_THRESHOLD"
echo "  Job Timeout: ${JOB_TIMEOUT}s"
echo "  Output Directory: $OUTPUT_DIR"
echo "  Dry Run: $DRY_RUN"

# Check if API key is provided
if [ -z "$API_KEY" ]; then
    print_warning "No API key provided. Some endpoints may fail without authentication."
fi

# Prepare k6 environment variables
export STAGING_BASE_URL
export API_KEY
export AUTH_TYPE
export USERNAME
export PASSWORD
export VU_COUNT
export RAMP_UP_DURATION="$RAMP_UP"
export STEADY_STATE_DURATION="$STEADY_STATE"
export RAMP_DOWN_DURATION="$RAMP_DOWN"
export MAX_JOBS_PER_USER
export QUEUE_DEPTH_THRESHOLD="$QUEUE_THRESHOLD"
export JOB_TIMEOUT_SECONDS="$JOB_TIMEOUT"
export USER_ID_LIST="$USER_IDS"
export CDN_BASE_URL="$CDN_URL"
export DRY_RUN

# Change to k6 directory
cd "$(dirname "$0")/k6"

# Run k6 test
print_status "Starting k6 load test..."
print_status "Test script: generate_flashcards_test.js"
print_status "Output file: $OUTPUT_FILE"

k6 run \
    --out json="$OUTPUT_FILE" \
    generate_flashcards_test.js

# Check if k6 completed successfully
if [ $? -eq 0 ]; then
    print_success "Load test completed successfully!"
    
    # Generate human-readable report
    print_status "Generating load test report..."
    
    # Create report using template
    if [ -f "../report_template.md" ]; then
        cp "../report_template.md" "$REPORT_FILE"
        print_success "Report template copied to: $REPORT_FILE"
        print_status "Please fill in the actual metrics and analysis in the report."
    else
        print_warning "Report template not found. Creating basic report..."
        
        cat > "$REPORT_FILE" << EOF
# UniLingo Load Test Report

**Test Date:** $(date)
**Configuration:** $VU_COUNT VUs, $RAMP_UP ramp-up, $STEADY_STATE steady-state, $RAMP_DOWN ramp-down
**Target URL:** $STAGING_BASE_URL

## Test Results

Please analyze the k6 JSON output file: \`$OUTPUT_FILE\`

## Key Metrics to Review

- HTTP request success rate
- Response time percentiles (p50, p95, p99)
- Job completion rate and latency
- Queue depth monitoring
- Error rates by endpoint

## Acceptance Criteria

- [ ] 95th percentile job latency < 8s
- [ ] Overall error rate < 2%
- [ ] Queue depth < $QUEUE_THRESHOLD
- [ ] Job success rate > 99%

## Recommendations

[Fill in recommendations based on test results]

EOF
    fi
    
    print_success "Load test report generated: $REPORT_FILE"
    print_status "Files created:"
    echo "  - k6 results: $OUTPUT_FILE"
    echo "  - Test report: $REPORT_FILE"
    
else
    print_error "Load test failed!"
    exit 1
fi
