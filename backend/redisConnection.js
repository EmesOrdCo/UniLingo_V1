/**
 * Shared Redis Connection Module
 * 
 * Provides a single Redis connection instance for all services
 * to prevent multiple connections and configuration conflicts
 */

const Redis = require('ioredis');

// Debug: Log what environment variables we have
console.log('🔍 Redis Environment Variables:');
console.log('  REDIS_PUBLIC_URL:', process.env.REDIS_PUBLIC_URL ? 'SET (length: ' + process.env.REDIS_PUBLIC_URL.length + ')' : 'NOT SET');
console.log('  REDIS_URL:', process.env.REDIS_URL ? 'SET (length: ' + process.env.REDIS_URL.length + ')' : 'NOT SET');
console.log('  REDIS_HOST:', process.env.REDIS_HOST || 'NOT SET');
console.log('  REDIS_PORT:', process.env.REDIS_PORT || 'NOT SET');
console.log('  REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? 'SET' : 'NOT SET');

// Redis connection configuration - prioritize REDIS_PUBLIC_URL for Railway deployment
// Parse Redis URL into connection options to ensure all connections use the same config
let redisConfig;
if (process.env.REDIS_PUBLIC_URL) {
  const url = new URL(process.env.REDIS_PUBLIC_URL);
  redisConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
} else if (process.env.REDIS_URL) {
  const url = new URL(process.env.REDIS_URL);
  redisConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
} else {
  redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

console.log('🔧 Redis Config Type:', typeof redisConfig);
console.log('🔧 Redis Config:', redisConfig);

// Create a single Redis connection instance
console.log('🔧 Creating Redis connection with config...');
const redis = new Redis(redisConfig, {
  lazyConnect: false, // Connect immediately
  enableOfflineQueue: false, // Fail fast if connection is down
});

// Error handling
redis.on('error', (error) => {
  console.error('❌ [SHARED REDIS] Redis connection error:', error.message);
  console.error('   Stack trace:', error.stack);
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('✅ Redis ready for operations');
});

redis.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

module.exports = {
  redis,
  redisConfig
};
