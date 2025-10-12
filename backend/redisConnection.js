/**
 * Shared Redis Connection Module
 * 
 * Provides a single Redis connection instance for all services
 * to prevent multiple connections and configuration conflicts
 */

const Redis = require('ioredis');

// Redis connection configuration
const redisConfig = process.env.REDIS_URL ? 
  process.env.REDIS_URL :
  {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  };

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
