// Backend configuration
// This will be updated dynamically when the backend starts

export const BACKEND_CONFIG = {
  // Auto-detected IP: 192.168.1.146
  BASE_URL: 'http://192.168.1.146:3001',
  ENDPOINTS: {
    PROCESS_PDF: '/api/process-pdf',
    HEALTH: '/health',
    TEST_PROCESSING: '/api/test-processing'
  }
};

// Helper function to get full endpoint URL
export const getBackendUrl = (endpoint: string = '') => {
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get PDF processing endpoint
export const getPdfProcessingUrl = () => {
  return getBackendUrl(BACKEND_CONFIG.ENDPOINTS.PROCESS_PDF);
};
