// Backend configuration
// This will be updated dynamically when the backend starts

export const BACKEND_CONFIG = {
  // Railway production backend
  BASE_URL: 'https://unilingov1-production.up.railway.app',
  ENDPOINTS: {
    HEALTH: '/health'
  }
};

// Helper function to get full endpoint URL
export const getBackendUrl = (endpoint: string = '') => {
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
};
