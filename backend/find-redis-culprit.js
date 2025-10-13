#!/usr/bin/env node

/**
 * Redis Connection Debug Script
 * 
 * This script helps identify why the worker service connects to localhost Redis
 * instead of the Railway Redis instance.
 * 
 * Run this script in the Railway worker environment to debug the connection issue.
 */

require('dotenv').config();

console.log('🔍 Redis Connection Debug Script');
console.log('================================');

// 1. Check environment variables
console.log('\n📋 Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('  RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME || 'NOT SET');
console.log('  REDIS_PUBLIC_URL:', process.env.REDIS_PUBLIC_URL ? 'SET (length: ' + process.env.REDIS_PUBLIC_URL.length + ')' : 'NOT SET');
console.log('  REDIS_URL:', process.env.REDIS_URL ? 'SET (length: ' + process.env.REDIS_URL.length + ')' : 'NOT SET');
console.log('  REDIS_HOST:', process.env.REDIS_HOST || 'NOT SET');
console.log('  REDIS_PORT:', process.env.REDIS_PORT || 'NOT SET');
console.log('  REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? 'SET' : 'NOT SET');

// 2. Test Redis connection with different configurations
console.log('\n🔧 Testing Redis Connections:');

const Redis = require('ioredis');

async function testConnection(name, config) {
  console.log(`\n  Testing ${name}:`);
  console.log(`    Config:`, typeof config === 'string' ? config.replace(/:[^:@]+@/, ':****@') : config);
  
  try {
    const redis = new Redis(config, {
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    
    await redis.connect();
    await redis.ping();
    console.log(`    ✅ ${name}: Connection successful`);
    
    await redis.quit();
    return true;
  } catch (error) {
    console.log(`    ❌ ${name}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const tests = [];
  
  // Test 1: REDIS_PUBLIC_URL
  if (process.env.REDIS_PUBLIC_URL) {
    tests.push(testConnection('REDIS_PUBLIC_URL', process.env.REDIS_PUBLIC_URL));
  }
  
  // Test 2: REDIS_URL
  if (process.env.REDIS_URL) {
    tests.push(testConnection('REDIS_URL', process.env.REDIS_URL));
  }
  
  // Test 3: Individual config
  if (process.env.REDIS_HOST || process.env.REDIS_PORT) {
    const individualConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    };
    tests.push(testConnection('Individual Config', individualConfig));
  }
  
  // Test 4: Default localhost (this should fail in Railway)
  tests.push(testConnection('Default localhost', {
    host: 'localhost',
    port: 6379,
  }));
  
  await Promise.all(tests);
  
  // 3. Test BullMQ Worker configuration
  console.log('\n🔧 Testing BullMQ Worker Configuration:');
  
  try {
    const { Worker } = require('bullmq');
    
    // Use the same config as worker.js
    const redisConfig = {
      connection: process.env.REDIS_PUBLIC_URL ? 
        process.env.REDIS_PUBLIC_URL :
        process.env.REDIS_URL ? 
          process.env.REDIS_URL :
          {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          }
    };
    
    console.log('    Worker Redis Config:', typeof redisConfig.connection === 'string' ? 
      redisConfig.connection.replace(/:[^:@]+@/, ':****@') : redisConfig.connection);
    
    // Create a test worker (don't process jobs)
    const testWorker = new Worker('test-queue', async () => {}, {
      connection: redisConfig.connection,
      concurrency: 1,
    });
    
    // Wait for worker to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker ready timeout'));
      }, 5000);
      
      testWorker.on('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      testWorker.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    console.log('    ✅ BullMQ Worker: Connection successful');
    
    await testWorker.close();
    
  } catch (error) {
    console.log('    ❌ BullMQ Worker:', error.message);
  }
  
  // 4. Test Bottleneck configuration
  console.log('\n🔧 Testing Bottleneck Configuration:');
  
  try {
    const Bottleneck = require('bottleneck');
    
    // Parse Redis URL string into connection options for Bottleneck
    let bottleNeckConnectionOptions;
    if (process.env.REDIS_PUBLIC_URL) {
      const url = new URL(process.env.REDIS_PUBLIC_URL);
      bottleNeckConnectionOptions = {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      };
    } else if (process.env.REDIS_URL) {
      const url = new URL(process.env.REDIS_URL);
      bottleNeckConnectionOptions = {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      };
    } else {
      bottleNeckConnectionOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      };
    }
    
    console.log('    Bottleneck Config:', bottleNeckConnectionOptions);
    
    // Create a test limiter
    const testLimiter = new Bottleneck({
      id: 'test-limiter',
      datastore: 'ioredis',
      Connection: require('ioredis'),
      clientOptions: bottleNeckConnectionOptions,
      clearDatastore: false,
      reservoir: 10,
      reservoirRefreshAmount: 10,
      reservoirRefreshInterval: 60000,
    });
    
    // Test the limiter
    await testLimiter.schedule(async () => {
      return 'test';
    });
    
    console.log('    ✅ Bottleneck: Connection successful');
    
  } catch (error) {
    console.log('    ❌ Bottleneck:', error.message);
  }
  
  console.log('\n📊 Summary:');
  console.log('  If REDIS_PUBLIC_URL works but worker fails, the issue is in worker configuration.');
  console.log('  If all tests fail, the issue is with environment variables or Railway setup.');
  console.log('  If localhost test succeeds, Railway is not properly configured.');
}

runTests().catch(console.error);