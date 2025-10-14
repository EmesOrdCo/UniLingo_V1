// Backend configuration
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
  
  // Fallback to local development URL
  return 'http://10.24.17.209:3001';
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
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
};
