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
const redisConfig = process.env.REDIS_PUBLIC_URL ? 
  process.env.REDIS_PUBLIC_URL :
  process.env.REDIS_URL ? 
    process.env.REDIS_URL :
    {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    };

console.log('🔧 Redis Config Type:', typeof redisConfig);
if (typeof redisConfig === 'string') {
  console.log('🔧 Redis URL (masked):', redisConfig.replace(/:[^:@]+@/, ':****@'));
} else {
  console.log('🔧 Redis Config:', redisConfig);
}

// Create a single Redis connection instance
const redis = new Redis(redisConfig);

// Error handling
redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message);
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
