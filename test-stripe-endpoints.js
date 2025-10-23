#!/usr/bin/env node

console.log('🧪 Testing Stripe Integration');
console.log('================================');

// Test 1: Check if Stripe service loads
console.log('\n1️⃣ Testing Stripe Service...');
try {
  const stripeService = require('./backend/stripeService');
  console.log('✅ Stripe service loaded successfully');
} catch (error) {
  console.log('❌ Stripe service failed:', error.message);
  process.exit(1);
}

// Test 2: Check if Stripe endpoints load
console.log('\n2️⃣ Testing Stripe Endpoints...');
try {
  const stripeRoutes = require('./backend/stripeEndpoints');
  console.log('✅ Stripe endpoints loaded successfully');
} catch (error) {
  console.log('❌ Stripe endpoints failed:', error.message);
  process.exit(1);
}

// Test 3: Check environment variables
console.log('\n3️⃣ Testing Environment Variables...');
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY', 
  'STRIPE_WEBHOOK_SECRET'
];

let envOk = true;
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Configured`);
  } else {
    console.log(`❌ ${varName}: Missing`);
    envOk = false;
  }
});

if (!envOk) {
  console.log('\n⚠️  Some environment variables are missing');
  console.log('   Make sure to set them in your .env file');
}

// Test 4: Test backend connection
console.log('\n4️⃣ Testing Backend Connection...');
const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://unilingov1-production.up.railway.app';

fetch(`${backendUrl}/api/health`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend is running:', data.status);
    
    // Test Stripe endpoints
    console.log('\n5️⃣ Testing Stripe Endpoints on Backend...');
    return fetch(`${backendUrl}/api/stripe/paid-items`);
  })
  .then(response => {
    if (response.ok) {
      console.log('✅ Stripe endpoints are working!');
    } else {
      console.log('❌ Stripe endpoints not found (404)');
      console.log('   This means the backend needs to be deployed with new code');
    }
  })
  .catch(error => {
    console.log('❌ Backend connection failed:', error.message);
  })
  .finally(() => {
    console.log('\n🎉 Test Complete!');
    process.exit(0);
  });
