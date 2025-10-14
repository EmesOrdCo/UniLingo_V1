#!/usr/bin/env node

/**
 * Script to set the correct backend URL for the frontend
 * This helps resolve connectivity issues between frontend and backend
 */

const fs = require('fs');
const path = require('path');

// Common Railway deployment patterns
const RAILWAY_URL_PATTERNS = [
  'https://backend-production-xxxx.up.railway.app',
  'https://unilingo-backend-production.up.railway.app',
  'https://backend-xxxx.up.railway.app',
  'https://unilingo-backend-xxxx.up.railway.app'
];

function updateBackendConfig(backendUrl) {
  const configPath = path.join(__dirname, 'src', 'config', 'backendConfig.ts');
  
  const configContent = `// Backend configuration
// This will be updated dynamically when the backend starts

// Function to determine the correct backend URL
function getBackendBaseUrl(): string {
  // Check if we're in production (Railway deployment)
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_STATIC_URL) {
    // Use Railway URL if available
    const railwayUrl = process.env.RAILWAY_STATIC_URL;
    if (railwayUrl) {
      return railwayUrl;
    }
  }
  
  // Check if we have a custom backend URL from environment
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  
  // Fallback to configured backend URL
  return '${backendUrl}';
}

const backendBaseUrl = getBackendBaseUrl();

export const BACKEND_CONFIG = {
  // Dynamically determined backend URL
  BASE_URL: backendBaseUrl,
  ENDPOINTS: {
    HEALTH: '/health'
  }
};

// Debug logging
console.log('🔧 Backend Configuration:', {
  baseUrl: backendBaseUrl,
  nodeEnv: process.env.NODE_ENV,
  railwayUrl: process.env.RAILWAY_STATIC_URL,
  customBackendUrl: process.env.EXPO_PUBLIC_BACKEND_URL
});

// Helper function to get full endpoint URL
export const getBackendUrl = (endpoint: string = '') => {
  return \`\${BACKEND_CONFIG.BASE_URL}\${endpoint}\`;
};
`;

  try {
    fs.writeFileSync(configPath, configContent);
    console.log(`✅ Backend config updated with URL: ${backendUrl}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to update backend config:', error);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔧 Backend URL Configuration Script');
    console.log('');
    console.log('Usage:');
    console.log('  node set-backend-url.js <backend-url>');
    console.log('');
    console.log('Examples:');
    console.log('  node set-backend-url.js https://your-backend.up.railway.app');
    console.log('  node set-backend-url.js http://localhost:3001');
    console.log('  node set-backend-url.js http://10.24.17.209:3001');
    console.log('');
    console.log('Common Railway URLs:');
    RAILWAY_URL_PATTERNS.forEach(pattern => {
      console.log(`  ${pattern}`);
    });
    return;
  }
  
  const backendUrl = args[0];
  
  // Validate URL format
  try {
    new URL(backendUrl);
  } catch (error) {
    console.error('❌ Invalid URL format:', backendUrl);
    console.log('Please provide a valid URL (e.g., https://your-backend.up.railway.app)');
    return;
  }
  
  console.log(`🔧 Setting backend URL to: ${backendUrl}`);
  
  if (updateBackendConfig(backendUrl)) {
    console.log('');
    console.log('✅ Backend configuration updated successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your Expo development server');
    console.log('2. Test the pronunciation assessment feature');
    console.log('3. Check the frontend logs for the backend URL being used');
  }
}

main();
