#!/usr/bin/env node

/**
 * Redis Connection Test Script
 * 
 * This script tests the Redis connection and shows what environment variables
 * are actually being passed to the application.
 */

console.log('🔍 Redis Connection Test');
console.log('========================');

// Show all environment variables related to Redis
console.log('\n📋 Environment Variables:');
console.log('REDIS_URL:', process.env.REDIS_URL || 'NOT SET');
console.log('REDIS_HOST:', process.env.REDIS_HOST || 'NOT SET');
console.log('REDIS_PORT:', process.env.REDIS_PORT || 'NOT SET');
console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***HIDDEN***' : 'NOT SET');

// Test Redis connection
const Redis = require('ioredis');

console.log('\n🔌 Testing Redis Connection...');

try {
  const redisConfig = process.env.REDIS_URL ? 
    process.env.REDIS_URL :
    {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    };

  console.log('Redis Config:', redisConfig);

  const redis = new Redis(redisConfig);

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully!');
    process.exit(0);
  });

  redis.on('error', (error) => {
    console.log('❌ Redis connection error:', error.message);
    process.exit(1);
  });

  // Test with a timeout
  setTimeout(() => {
    console.log('⏰ Connection timeout after 5 seconds');
    process.exit(1);
  }, 5000);

} catch (error) {
  console.log('❌ Error creating Redis connection:', error.message);
  process.exit(1);
}
