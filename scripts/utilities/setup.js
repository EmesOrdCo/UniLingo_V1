#!/usr/bin/env node

/**
 * UniLingo Setup Script
 * 
 * This script sets up the project for new users by:
 * 1. Detecting the local IP address
 * 2. Updating frontend configuration
 * 3. Installing dependencies
 * 4. Starting the backend server
 * 
 * Usage: node setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 UniLingo Setup Script');
console.log('========================\n');

// Step 1: Detect IP and update config
console.log('1️⃣ Detecting local IP address...');
try {
  execSync('node detect-ip.js', { stdio: 'inherit' });
  console.log('✅ IP detection complete\n');
} catch (error) {
  console.log('❌ IP detection failed, using localhost\n');
}

// Step 2: Install dependencies
console.log('2️⃣ Installing dependencies...');
try {
  console.log('   Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('   Installing backend dependencies...');
  execSync('cd backend && npm install', { stdio: 'inherit' });
  
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.log('❌ Failed to install dependencies:', error.message);
  console.log('   Please run: npm install && cd backend && npm install\n');
}

// Step 3: Check environment
console.log('3️⃣ Checking environment configuration...');
if (fs.existsSync('.env')) {
  console.log('✅ .env file found');
} else {
  console.log('⚠️  .env file not found');
  console.log('   Please create a .env file with your Supabase credentials');
}

if (fs.existsSync('backend/.env')) {
  console.log('✅ Backend .env file found');
} else {
  console.log('⚠️  Backend .env file not found');
  console.log('   Please create backend/.env with your API keys');
}

console.log('\n🎯 Setup complete! Next steps:');
console.log('1. Configure your .env files with API keys');
console.log('2. Start backend: cd backend && npm start');
console.log('3. Start frontend: npx expo start');
console.log('4. Your app will automatically connect to the correct IP\n');

console.log('📱 If you have connection issues, run: node detect-ip.js');
