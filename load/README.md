# UniLingo Backend Load Testing

This directory contains a comprehensive load testing solution for the UniLingo backend using k6. The tests simulate realistic user behavior including profile loading, AI-powered flashcard generation, and job status polling.

## Quick Start

### Prerequisites

- [k6](https://k6.io/docs/getting-started/installation/) installed
- Access to staging environment
- API key or authentication token

### Running Tests

```bash
# Smoke test (50 VUs, 1 minute)
./run_k6.sh --smoke-test

# Full production test (5000 VUs, 17 minutes)
./run_k6.sh --full-test --url https://staging.unilingo.com

# Custom test
./run_k6.sh --vus 100 --steady 5m --url https://staging.unilingo.com
```

## Test Scenarios

### User Journey Simulation

Each virtual user (VU) follows this realistic journey:

1. **Profile Load** - `GET /api/profile/:userId`
2. **CDN Thumbnail Fetch** - `HEAD` requests to CDN URLs
3. **AI Job Submission** - `POST /api/ai/generate-flashcards`
4. **Job Status Polling** - `GET /api/job-status/:jobId` until completion
5. **Metrics Collection** - Record job latency and success rates

### Test Configurations

| Test Type | VUs | Duration | Use Case |
|-----------|-----|----------|---------|
| Smoke | 50 | 1m | Quick validation |
| Full | 5000 | 17m | Production readiness |
| Custom | Variable | Variable | Specific scenarios |

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STAGING_BASE_URL` | Staging environment URL | `http://localhost:3001` | Yes |
| `API_KEY` | API key for authentication | - | Yes* |
| `BEARER_TOKEN` | Bearer token for authentication | - | Yes* |
| `VU_COUNT` | Number of virtual users | `50` | No |
| `RAMP_UP_DURATION` | Ramp-up duration | `1m` | No |
| `STEADY_STATE_DURATION` | Steady state duration | `2m` | No |
| `RAMP_DOWN_DURATION` | Ramp-down duration | `30s` | No |
| `MAX_JOBS_PER_USER` | Max jobs per user | `3` | No |
| `QUEUE_DEPTH_THRESHOLD` | Queue depth threshold | `500` | No |
| `JOB_TIMEOUT_SECONDS` | Job timeout in seconds | `30` | No |
| `DRY_RUN` | Run in dry-run mode | `false` | No |

*Either `API_KEY` or `BEARER_TOKEN` is required for authentication.

### Command Line Options

```bash
./run_k6.sh [OPTIONS]

Options:
  -h, --help              Show help message
  -u, --url URL           Staging base URL
  -k, --api-key KEY       API key for authentication
  -v, --vus COUNT         Number of virtual users
  -r, --ramp-up TIME      Ramp-up duration
  -s, --steady TIME       Steady state duration
  -d, --ramp-down TIME    Ramp-down duration
  --dry-run               Run in dry-run mode
  --smoke-test            Run smoke test
  --full-test             Run full production test
  --auth-type TYPE        Authentication type: api_key, bearer, oauth
  --username USER         Username for OAuth
  --password PASS         Password for OAuth
  --max-jobs-per-user N   Maximum jobs per user
  --queue-threshold N     Queue depth threshold
  --job-timeout N         Job timeout in seconds
  --user-ids LIST         Comma-separated list of user IDs
  --cdn-url URL           CDN base URL for thumbnail testing
  --output-dir DIR        Output directory for reports
```

## Test Payloads

The test uses realistic payloads from `k6/test_payloads.json`:

```json
[
  {
    "content": "The cardiovascular system consists of the heart, blood vessels, and blood...",
    "subject": "Anatomy and Physiology",
    "topic": "Cardiovascular System",
    "nativeLanguage": "Spanish",
    "showNativeLanguage": false
  }
]
```

## Metrics Collected

### HTTP Metrics
- Request count and success rate
- Response time percentiles (p50, p95, p99)
- Error rates by status code (4xx, 5xx, 429)

### Job Metrics
- Jobs started and completed
- Job success rate
- Job latency distribution (POST → succeeded)
- Queue depth monitoring

### Custom Metrics
- `job_latency_ms` - Time from job submission to completion
- `job_success_rate` - Percentage of successful jobs
- `cdn_latency_ms` - CDN thumbnail fetch latency
- `queue_depth` - Current queue depth

## Acceptance Criteria

The test fails if any of these criteria are not met:

1. **Job Latency (95th percentile) < 8s**
   - Measures end-to-end job completion time
   - Threshold: 8 seconds for cached assets, 20 seconds for cold loads

2. **Overall Error Rate < 2%**
   - Includes 4xx, 5xx, and 429 errors
   - Threshold: 2% across all requests

3. **Queue Depth < 500**
   - Maximum queue depth during test
   - Threshold: 500 jobs for more than 2 minutes

4. **Job Success Rate > 99%**
   - Percentage of jobs that complete successfully
   - Threshold: 99%

## CI/CD Integration

### GitHub Actions

The load test is integrated with GitHub Actions via `.github/workflows/load-test.yml`:

```yaml
# Manual trigger
on:
  workflow_dispatch:
    inputs:
      test_type:
        description: 'Type of load test to run'
        type: choice
        options: [smoke, full, custom]

# Scheduled nightly run
on:
  schedule:
    - cron: '0 2 * * *'
```

### Required Secrets

Configure these secrets in your GitHub repository:

- `STAGING_BASE_URL` - Staging environment URL
- `API_KEY` - API key for authentication
- `BEARER_TOKEN` - Bearer token (alternative to API_KEY)
- `CDN_BASE_URL` - CDN base URL (optional)
- `QUEUE_DEPTH_ENDPOINT` - Queue depth endpoint (optional)

### Workflow Steps

1. **Smoke Test** - Quick validation (50 VUs, 1 minute)
2. **Full Test** - Production readiness (5000 VUs, 17 minutes)
3. **Custom Test** - Configurable parameters
4. **Artifact Upload** - Results and reports
5. **Acceptance Check** - Automated pass/fail validation

## Local Development

### Installation

```bash
# Install k6
# macOS
brew install k6

# Linux
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Docker
docker run --rm -i grafana/k6 run - < k6/generate_flashcards_test.js
```

### Running Locally

```bash
# Set environment variables
export STAGING_BASE_URL="https://staging.unilingo.com"
export API_KEY="your-api-key"

# Run smoke test
./run_k6.sh --smoke-test

# Run with custom parameters
./run_k6.sh --vus 100 --steady 5m --max-jobs-per-user 2
```

### Docker Alternative

```bash
# Build Docker image
docker build -t unilingo-load-test .

# Run test
docker run --rm \
  -e STAGING_BASE_URL="https://staging.unilingo.com" \
  -e API_KEY="your-api-key" \
  -v $(pwd)/results:/app/results \
  unilingo-load-test
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify API key or bearer token
   - Check authentication type configuration
   - Ensure staging environment is accessible

2. **Job Timeouts**
   - Increase `JOB_TIMEOUT_SECONDS`
   - Check queue depth and worker capacity
   - Verify AI service responsiveness

3. **High Error Rates**
   - Check staging environment health
   - Verify rate limiting configuration
   - Review error logs for patterns

4. **Queue Depth Exceeded**
   - Increase worker capacity
   - Optimize job processing time
   - Adjust rate limiting

### Debug Mode

```bash
# Enable verbose logging
export K6_LOG_LEVEL=debug
./run_k6.sh --smoke-test
```

### Health Checks

```bash
# Check staging environment
curl -f "$STAGING_BASE_URL/api/health"

# Check queue depth
curl -f "$STAGING_BASE_URL/api/metrics/queue-depth"
```

## Results Analysis

### Output Files

- `k6_results_*.json` - Raw k6 metrics
- `load_test_report_*.md` - Human-readable report
- `job_latencies_*.csv` - Job latency data

### Key Metrics to Monitor

1. **Response Time Trends**
   - Look for degradation over time
   - Identify performance bottlenecks
   - Monitor percentile changes

2. **Error Patterns**
   - Analyze error types and frequencies
   - Check for correlation with load
   - Identify failure modes

3. **Queue Behavior**
   - Monitor queue depth trends
   - Check for queue saturation
   - Analyze job processing rates

4. **Resource Utilization**
   - CPU and memory usage
   - Network I/O patterns
   - Database connection pools

## Best Practices

### Test Design
- Start with smoke tests
- Gradually increase load
- Monitor system resources
- Use realistic test data

### Environment Preparation
- Ensure staging mirrors production
- Pre-warm caches and databases
- Monitor system health during tests
- Have rollback plans ready

### Result Interpretation
- Focus on trends over absolute values
- Consider business impact
- Validate with multiple test runs
- Document findings and recommendations

## Contributing

### Adding New Test Scenarios

1. Create new test payload in `k6/test_payloads.json`
2. Update test script if needed
3. Add new metrics if required
4. Update documentation

### Modifying Acceptance Criteria

1. Update thresholds in k6 script
2. Modify GitHub Actions workflow
3. Update report template
4. Document changes

## Support

For issues or questions:
- Check troubleshooting section
- Review k6 documentation
- Open GitHub issue
- Contact development team

---

**Last Updated:** [DATE]  
**Version:** 1.0.0  
**Maintainer:** UniLingo Development Team
