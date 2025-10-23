#!/usr/bin/env node

console.log('🧪 Quick Stripe Test');
console.log('===================');

// Simple test - no async, no hanging
console.log('\n1️⃣ Testing Stripe Service...');
try {
  const stripeService = require('./backend/stripeService');
  console.log('✅ Stripe service loaded');
} catch (error) {
  console.log('❌ Stripe service error:', error.message);
}

console.log('\n2️⃣ Testing Stripe Endpoints...');
try {
  const stripeRoutes = require('./backend/stripeEndpoints');
  console.log('✅ Stripe endpoints loaded');
} catch (error) {
  console.log('❌ Stripe endpoints error:', error.message);
}

console.log('\n3️⃣ Environment Check...');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET');

console.log('\n✅ Test Complete - No Hanging!');
