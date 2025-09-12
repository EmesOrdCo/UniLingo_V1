// Backend configuration
// This will be updated dynamically when the backend starts

export const BACKEND_CONFIG = {
  // Auto-detected IP: 192.168.50.141
  BASE_URL: 'http://192.168.50.141:3001',
  ENDPOINTS: {
    HEALTH: '/health',
    PDF_PROCESSING: '/api/process-pdf'
  }
};

// Helper function to get full endpoint URL
export const getBackendUrl = (endpoint: string = '') => {
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get PDF processing URL
export const getPdfProcessingUrl = () => {
  return getBackendUrl(BACKEND_CONFIG.ENDPOINTS.PDF_PROCESSING);
};
