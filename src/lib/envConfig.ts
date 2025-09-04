// Environment configuration for Expo
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Load environment variables from Expo config
const getEnvironmentVariable = (key: string): string | undefined => {
  // Try to get from Expo config first
  if (Constants.expoConfig?.extra) {
    const extra = Constants.expoConfig.extra;
    switch (key) {
      case 'EXPO_PUBLIC_SUPABASE_URL':
        return extra.supabaseUrl;
      case 'EXPO_PUBLIC_SUPABASE_ANON_KEY':
        return extra.supabaseAnonKey;
      case 'EXPO_PUBLIC_OPENAI_API_KEY':
        return extra.openaiApiKey;
      case 'EXPO_PUBLIC_BACKEND_URL':
        return extra.backendUrl;
      default:
        break;
    }
  }
  
  // Fallback to process.env
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
