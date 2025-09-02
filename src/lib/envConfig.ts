// Environment configuration for Expo
import { Platform } from 'react-native';

// Load environment variables based on platform
const getEnvironmentVariable = (key: string): string | undefined => {
  // For development, try to load from .env files
  if (__DEV__) {
    // In Expo, environment variables are automatically loaded
    // but we need to ensure they're available
    return process.env[key];
  }
  
  // For production, use the bundled environment variables
  return process.env[key];
};

// Export environment configuration
export const ENV = {
  SUPABASE_URL: getEnvironmentVariable('EXPO_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvironmentVariable('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  OPENAI_API_KEY: getEnvironmentVariable('EXPO_PUBLIC_OPENAI_API_KEY'),
  CLOUDMERSIVE_API_KEY: getEnvironmentVariable('EXPO_PUBLIC_CLOUDMERSIVE_API_KEY'),
};

// Debug logging
console.log('🔧 Environment Configuration:', {
  SUPABASE_URL: ENV.SUPABASE_URL ? 'Configured' : 'Not configured',
  SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY ? 'Configured' : 'Not configured',
  OPENAI_API_KEY: ENV.OPENAI_API_KEY ? `Configured (${ENV.OPENAI_API_KEY.length} chars)` : 'Not configured',
  CLOUDMERSIVE_API_KEY: ENV.CLOUDMERSIVE_API_KEY ? `Configured (${ENV.CLOUDMERSIVE_API_KEY.length} chars)` : 'Not configured',
  Platform: Platform.OS,
  IsDev: __DEV__,
});
