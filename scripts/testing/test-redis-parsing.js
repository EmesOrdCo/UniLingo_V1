#!/usr/bin/env node

// Test Redis URL parsing logic
console.log('🧪 Testing Redis URL parsing logic...\n');

// Simulate Railway Redis URL
const REDIS_PUBLIC_URL = 'redis://default:password123@centerbeam.proxy.rlwy.net:53760';

console.log('Input URL:', REDIS_PUBLIC_URL);

// Test the parsing logic from worker.js
let redisConfig;
if (REDIS_PUBLIC_URL) {
  const url = new URL(REDIS_PUBLIC_URL);
  redisConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

console.log('\nParsed config:');
console.log(JSON.stringify(redisConfig, null, 2));

// Verify expected values
console.log('\n✅ Verification:');
console.log('Host:', redisConfig.host === 'centerbeam.proxy.rlwy.net' ? '✅' : '❌');
console.log('Port:', redisConfig.port === 53760 ? '✅' : '❌');
console.log('Password:', redisConfig.password === 'password123' ? '✅' : '❌');
console.log('maxRetriesPerRequest:', redisConfig.maxRetriesPerRequest === null ? '✅' : '❌');
console.log('enableReadyCheck:', redisConfig.enableReadyCheck === false ? '✅' : '❌');

// Test edge cases
console.log('\n🧪 Testing edge cases...');

// Test without password
const urlNoPassword = 'redis://centerbeam.proxy.rlwy.net:53760';
const parsedNoPassword = new URL(urlNoPassword);
console.log('No password URL:', urlNoPassword);
console.log('Parsed password:', parsedNoPassword.password || 'undefined');

// Test with default port
const urlDefaultPort = 'redis://default:password@centerbeam.proxy.rlwy.net';
const parsedDefaultPort = new URL(urlDefaultPort);
console.log('Default port URL:', urlDefaultPort);
console.log('Parsed port:', parseInt(parsedDefaultPort.port) || 6379);

console.log('\n🎯 Redis URL parsing test completed!');
