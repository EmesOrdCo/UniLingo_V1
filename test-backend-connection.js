#!/usr/bin/env node

/**
 * Script to test backend connectivity
 * Helps diagnose connection issues between frontend and backend
 */

// Simple test without importing the config
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://unilingov1-production.up.railway.app';

async function testBackendConnection() {
  const backendUrl = BACKEND_URL;
  
  console.log('🔧 Testing Backend Connection');
  console.log('='.repeat(50));
  console.log(`Backend URL: ${backendUrl}`);
  console.log('');
  
  // Test health endpoint
  try {
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed');
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Timestamp: ${healthData.timestamp}`);
    } else {
      console.log(`❌ Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
  }
  
  console.log('');
  
  // Test backend info endpoint
  try {
    console.log('ℹ️  Testing backend info endpoint...');
    const infoResponse = await fetch(`${backendUrl}/api/backend-info`);
    
    if (infoResponse.ok) {
      const infoData = await infoResponse.json();
      console.log('✅ Backend info retrieved');
      console.log(`   Railway URL: ${infoData.backendInfo.railwayUrl || 'Not available'}`);
      console.log(`   Service Name: ${infoData.backendInfo.serviceName || 'Not available'}`);
      console.log(`   Port: ${infoData.backendInfo.port}`);
      console.log(`   Environment: ${infoData.backendInfo.nodeEnv}`);
    } else {
      console.log(`❌ Backend info failed: ${infoResponse.status} ${infoResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Backend info error: ${error.message}`);
  }
  
  console.log('');
  
  // Test pronunciation status endpoint
  try {
    console.log('🎤 Testing pronunciation status endpoint...');
    const statusResponse = await fetch(`${backendUrl}/api/pronunciation/status`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Pronunciation status retrieved');
      console.log(`   Circuit Breaker: ${statusData.status.circuitBreaker.state}`);
      console.log(`   Queue Size: ${statusData.status.queue.size}`);
      console.log(`   Azure Config: ${statusData.azureConfig.hasSpeechKey ? 'Configured' : 'Missing'}`);
    } else {
      console.log(`❌ Pronunciation status failed: ${statusResponse.status} ${statusResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Pronunciation status error: ${error.message}`);
  }
  
  console.log('');
  console.log('='.repeat(50));
  console.log('🔧 Connection Test Complete');
}

// Run the test
testBackendConnection().catch(console.error);
