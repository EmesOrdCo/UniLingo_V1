#!/usr/bin/env node

/**
 * IP Detection Script for UniLingo
 * 
 * This script detects the local IP address and updates the frontend configuration.
 * Run this script if you're having connection issues with the backend.
 * 
 * Usage: node detect-ip.js
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

function updateFrontendConfig() {
  const localIP = getLocalIP();
  const frontendConfigPath = path.join(__dirname, 'src', 'config', 'backendConfig.ts');
  
  const configContent = `// Backend configuration
// This will be updated dynamically when the backend starts

export const BACKEND_CONFIG = {
  // Auto-detected IP: ${localIP}
  BASE_URL: 'http://${localIP}:3001',
  ENDPOINTS: {
    HEALTH: '/health'
  }
};

// Helper function to get full endpoint URL
export const getBackendUrl = (endpoint: string = '') => {
  return \`\${BACKEND_CONFIG.BASE_URL}\${endpoint}\`;
};
`;

  try {
    fs.writeFileSync(frontendConfigPath, configContent);
    console.log(`✅ Frontend config updated with IP: ${localIP}`);
    console.log(`📱 Your app will now connect to: http://${localIP}:3001`);
    return localIP;
  } catch (error) {
    console.error('❌ Failed to update frontend config:', error);
    return null;
  }
}

// Run the IP detection and config update
console.log('🔍 Detecting local IP address...');
const detectedIP = updateFrontendConfig();

if (detectedIP) {
  console.log('\n🎯 Next steps:');
  console.log('1. Start your backend server: cd backend && npm start');
  console.log('2. Start your Expo app: npx expo start');
  console.log('3. Your app will automatically connect to the correct IP');
} else {
  console.log('\n❌ Failed to detect IP. Using localhost as fallback.');
}
