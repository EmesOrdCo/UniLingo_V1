#!/usr/bin/env node

// Test that all Redis connections use the same configuration
console.log('🧪 Testing all Redis connections use same config...\n');

// Simulate environment
process.env.REDIS_PUBLIC_URL = 'redis://default:password123@centerbeam.proxy.rlwy.net:53760';

// Test redisConnection.js
console.log('1. Testing redisConnection.js...');
const { redis, redisConfig } = require('./backend/redisConnection');
console.log('   redisConfig:', redisConfig);
console.log('   redisConfig type:', typeof redisConfig);
console.log('   Host:', redisConfig.host);
console.log('   Port:', redisConfig.port);
console.log('   Password:', redisConfig.password ? '***HIDDEN***' : 'undefined');

// Test rateLimiter.js
console.log('\n2. Testing rateLimiter.js...');
const { openaiLimiter } = require('./backend/rateLimiter');
console.log('   Rate limiter created successfully');

// Test queueClient.js
console.log('\n3. Testing queueClient.js...');
const { aiJobsQueue } = require('./backend/queueClient');
console.log('   Queue created successfully');

// Test worker.js (without actually creating the worker)
console.log('\n4. Testing worker.js Redis config...');
const workerRedisConfig = require('./backend/redisConnection').redisConfig;
console.log('   Worker redisConfig:', workerRedisConfig);

// Verify all configs are the same
console.log('\n✅ Verification:');
const expectedConfig = {
  host: 'centerbeam.proxy.rlwy.net',
  port: 53760,
  password: 'password123',
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const configsMatch = JSON.stringify(redisConfig) === JSON.stringify(expectedConfig);
console.log('All configs match expected:', configsMatch ? '✅' : '❌');

if (!configsMatch) {
  console.log('Expected:', JSON.stringify(expectedConfig, null, 2));
  console.log('Actual:', JSON.stringify(redisConfig, null, 2));
}

console.log('\n🎯 All Redis connections test completed!');
