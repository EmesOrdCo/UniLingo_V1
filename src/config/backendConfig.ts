// Backend configuration
// This will be updated dynamically when the backend starts

export const BACKEND_CONFIG = {
  // Auto-detected IP: 192.168.1.135
  BASE_URL: 'http://192.168.1.135:3001',
  ENDPOINTS: {
    HEALTH: '/health'
  }
};

// Helper function to get full endpoint URL
export const getBackendUrl = (endpoint: string = '') => {
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
};
