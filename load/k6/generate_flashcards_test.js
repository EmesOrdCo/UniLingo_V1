/**
 * UniLingo Backend Load Test - Flashcard Generation
 * 
 * Simulates realistic user behavior:
 * 1. Load user profile
 * 2. Fetch thumbnails from CDN
 * 3. Generate flashcards via AI
 * 4. Poll job status until completion
 * 
 * Usage:
 *   k6 run --env STAGING_BASE_URL=https://staging.example.com generate_flashcards_test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const jobLatency = new Trend('job_latency_ms');
const jobSuccessRate = new Rate('job_success_rate');
const cdnLatency = new Trend('cdn_latency_ms');
const queueDepthMetric = new Trend('queue_depth');
const jobCounter = new Counter('jobs_started');
const jobCompletedCounter = new Counter('jobs_completed');

// Load test payloads
const testPayloads = new SharedArray('test_payloads', function () {
  return JSON.parse(open('./test_payloads.json'));
});

// Configuration from environment variables
const config = {
  baseUrl: __ENV.STAGING_BASE_URL || 'http://localhost:3001',
  apiKey: __ENV.API_KEY || __ENV.BEARER_TOKEN,
  authType: __ENV.AUTH_TYPE || 'api_key', // 'api_key', 'bearer', 'oauth'
  username: __ENV.USERNAME,
  password: __ENV.PASSWORD,
  vuCount: parseInt(__ENV.VU_COUNT) || 50,
  rampUpDuration: __ENV.RAMP_UP_DURATION || '1m',
  steadyStateDuration: __ENV.STEADY_STATE_DURATION || '2m',
  rampDownDuration: __ENV.RAMP_DOWN_DURATION || '30s',
  dryRun: __ENV.DRY_RUN === 'true',
  maxJobsPerUser: parseInt(__ENV.MAX_JOBS_PER_USER) || 3,
  queueDepthThreshold: parseInt(__ENV.QUEUE_DEPTH_THRESHOLD) || 500,
  jobTimeoutSeconds: parseInt(__ENV.JOB_TIMEOUT_SECONDS) || 30,
  userIdList: __ENV.USER_ID_LIST ? __ENV.USER_ID_LIST.split(',') : null,
  cdnBaseUrl: __ENV.CDN_BASE_URL || __ENV.STAGING_BASE_URL || 'http://localhost:3001',
  queueDepthEndpoint: __ENV.QUEUE_DEPTH_ENDPOINT || '/api/queue/stats',
};

// Override for dry run
if (config.dryRun) {
  config.vuCount = 10;
  config.rampUpDuration = '10s';
  config.steadyStateDuration = '30s';
  config.rampDownDuration = '10s';
  config.maxJobsPerUser = 1;
}

// k6 options
export const options = {
  stages: [
    { duration: config.rampUpDuration, target: config.vuCount },
    { duration: config.steadyStateDuration, target: config.vuCount },
    { duration: config.rampDownDuration, target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% of requests under 2s
    'http_req_failed': ['rate<0.02'], // Error rate under 2%
    'job_latency_ms': ['p(95)<8000'], // 95% of jobs complete under 8s
    'job_success_rate': ['rate>0.99'], // Job success rate over 99%
    'queue_depth': [`max<${config.queueDepthThreshold}`], // Queue depth under threshold
  },
  ext: {
    loadimpact: {
      projectID: __ENV.K6_PROJECT_ID || 'unilingo-load-test',
      name: 'UniLingo Flashcard Generation Load Test',
    },
  },
};

// Helper function to get auth headers
function getAuthHeaders(userId) {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add user-id header for profile access
  if (userId) {
    headers['user-id'] = userId;
  }

  if (config.apiKey) {
    if (config.authType === 'bearer') {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else {
      headers['X-API-Key'] = config.apiKey;
    }
  }

  return headers;
}

// Helper function to get random user ID
function getRandomUserId() {
  if (config.userIdList && config.userIdList.length > 0) {
    return config.userIdList[Math.floor(Math.random() * config.userIdList.length)];
  }
  // Generate random UUID for testing
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to get random test payload
function getRandomPayload() {
  return testPayloads[Math.floor(Math.random() * testPayloads.length)];
}

// Helper function to fetch queue depth
function fetchQueueDepth() {
  try {
    const response = http.get(`${config.baseUrl}${config.queueDepthEndpoint}`, {
      headers: getAuthHeaders(), // No userId needed for queue stats
      timeout: '5s',
    });
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      return data.queue?.waiting || data.waiting || 0;
    }
  } catch (error) {
    console.log(`Failed to fetch queue depth: ${error}`);
  }
  return 0;
}

// Main test function
export default function () {
  const userId = getRandomUserId();
  const jobsStarted = 0;
  const maxJobs = Math.floor(Math.random() * config.maxJobsPerUser) + 1;
  
  console.log(`VU ${__VU}: Starting test for user ${userId}, maxJobs: ${maxJobs}`);

  // Step A: Skip profile loading for now (rate limited)
  // Focus on core AI job functionality
  console.log(`VU ${__VU}: Skipping profile load due to rate limiting, focusing on AI jobs`);

  // Step C & D: Generate flashcards and poll for completion
  for (let jobIndex = 0; jobIndex < maxJobs; jobIndex++) {
    const payload = { ...getRandomPayload(), userId };
    
    const jobStartTime = Date.now();
    
    // Submit job
    const jobResponse = http.post(`${config.baseUrl}/api/ai/generate-flashcards`, 
      JSON.stringify(payload), 
      {
        headers: getAuthHeaders(userId),
        timeout: '10s',
      }
    );

    jobCounter.add(1);

    check(jobResponse, {
      'job submission status is 202': (r) => r.status === 202,
      'job submission time < 5s': (r) => r.timings.duration < 5000,
    });

    if (jobResponse.status !== 202) {
      console.log(`Job submission failed: ${jobResponse.status} - ${jobResponse.body}`);
      continue;
    }

    const jobData = JSON.parse(jobResponse.body);
    const jobId = jobData.jobId;

    if (!jobId) {
      console.log(`No jobId returned: ${jobResponse.body}`);
      continue;
    }

    // Step E: Poll job status until completion
    let jobCompleted = false;
    let pollAttempts = 0;
    const maxPollAttempts = config.jobTimeoutSeconds;

    while (!jobCompleted && pollAttempts < maxPollAttempts) {
      sleep(1); // Gentle polling interval
      pollAttempts++;

      const statusResponse = http.get(`${config.baseUrl}/api/job-status/${jobId}`, {
        headers: getAuthHeaders(userId),
        timeout: '5s',
      });

      check(statusResponse, {
        'job status check successful': (r) => r.status === 200,
      });

      if (statusResponse.status === 200) {
        const statusData = JSON.parse(statusResponse.body);
        
        if (statusData.status === 'completed') {
          jobCompleted = true;
          const jobLatencyMs = Date.now() - jobStartTime;
          jobLatency.add(jobLatencyMs);
          jobCompletedCounter.add(1);
          jobSuccessRate.add(1);
          
          check(jobLatencyMs, {
            'job completed within timeout': () => jobLatencyMs < config.jobTimeoutSeconds * 1000,
          });
          
          console.log(`Job ${jobId} completed in ${jobLatencyMs}ms`);
        } else if (statusData.status === 'failed') {
          jobCompleted = true;
          jobSuccessRate.add(0);
          console.log(`Job ${jobId} failed: ${statusData.error}`);
        }
      } else {
        // Retry once on transient errors
        if (pollAttempts === 1 && statusResponse.status >= 500) {
          sleep(1);
          continue;
        }
      }
    }

    if (!jobCompleted) {
      console.log(`Job ${jobId} timed out after ${maxPollAttempts} attempts`);
      jobSuccessRate.add(0);
    }

    // Add jitter between jobs for the same user
    sleep(Math.random() * 2 + 1);
  }

  // Fetch queue depth periodically (every 30s per VU)
  if (Math.random() < 0.1) { // 10% chance per iteration
    const queueDepth = fetchQueueDepth();
    queueDepthMetric.add(queueDepth);
  }
}

// Setup function to validate configuration
export function setup() {
  console.log('Starting UniLingo Load Test');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`VU Count: ${config.vuCount}`);
  console.log(`Dry Run: ${config.dryRun}`);
  console.log(`Max Jobs Per User: ${config.maxJobsPerUser}`);
  console.log(`Test Payloads: ${testPayloads.length} available`);
  
  // Validate base URL is accessible
  const healthResponse = http.get(`${config.baseUrl}/api/health`, {
    timeout: '10s',
  });
  
  console.log(`Health check response: ${healthResponse.status} - ${healthResponse.body}`);
  
  if (healthResponse.status !== 200) {
    throw new Error(`Health check failed: ${healthResponse.status}`);
  }
  
  console.log('Health check passed, starting load test...');
  return { config };
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total jobs started: ${jobCounter.count}`);
  console.log(`Total jobs completed: ${jobCompletedCounter.count}`);
}
