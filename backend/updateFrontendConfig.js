const fs = require('fs');
const path = require('path');
const getLocalIP = require('./getLocalIP');

function updateFrontendConfig() {
  const localIP = getLocalIP();
  const frontendConfigPath = path.join(__dirname, '..', 'src', 'config', 'backendConfig.ts');
  
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
    return localIP;
  } catch (error) {
    console.error('❌ Failed to update frontend config:', error);
    return null;
  }
}

module.exports = updateFrontendConfig;

