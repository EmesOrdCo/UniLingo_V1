// Backend configuration
// Dynamic configuration that works for all users everywhere

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
  
  // For development, use localhost (works for all users)
  return 'http://localhost:3001';
}

const backendBaseUrl = getBackendBaseUrl();

export const BACKEND_CONFIG = {
  // Dynamically determined backend URL
  BASE_URL: backendBaseUrl,
  ENDPOINTS: {
    HEALTH: '/health'
  }
};

// Helper function to get full endpoint URL
export const getBackendUrl = (endpoint: string = '') => {
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
};
