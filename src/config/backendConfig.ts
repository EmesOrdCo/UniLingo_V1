// Backend configuration
// This will be updated dynamically when the backend starts

export const BACKEND_CONFIG = {
  // Auto-detected IP: 172.20.10.8
  BASE_URL: 'http://172.20.10.8:3001',
  ENDPOINTS: {
    HEALTH: '/health'
  }
};

// Helper function to get full endpoint URL
export const getBackendUrl = (endpoint: string = '') => {
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
};
