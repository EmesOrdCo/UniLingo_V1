import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SECURITY UTILITY: User Data Isolation Service
 * 
 * This service ensures complete user data isolation by:
 * 1. Clearing all user-specific cached data
 * 2. Preventing data leakage between user sessions
 * 3. Providing comprehensive cleanup functions
 */
export class UserDataIsolationService {
  
  /**
   * Clear ALL user-specific data for a given user ID
   * This is called during sign out to prevent data leakage
   */
  static async clearUserData(userId: string): Promise<void> {
    try {
      console.log('🔒 SECURITY: Clearing all user data for user:', userId);
      
      // Get all AsyncStorage keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter keys that are user-specific
      const userSpecificKeys = allKeys.filter(key => 
        key.includes(userId) || 
        key.startsWith('user_profile_picture_') ||
        key.startsWith('user_profile_picture_timestamp_') ||
        key.startsWith('user_data_') ||
        key.startsWith('user_cache_') ||
        key.startsWith('user_session_') ||
        key.startsWith('onboarding:v1:data:') ||
        key.startsWith('onboarding:v1:complete:') ||
        key.startsWith('subscription_data_') ||
        key.startsWith('paywall_shown_')
      );
      
      if (userSpecificKeys.length > 0) {
        console.log('🗑️ Clearing user-specific keys:', userSpecificKeys);
        await AsyncStorage.multiRemove(userSpecificKeys);
        console.log('✅ User data cleared successfully');
      } else {
        console.log('ℹ️ No user-specific data found to clear');
      }
      
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
      throw error;
    }
  }
  
  /**
   * Clear ALL cached data (for debugging or security purposes)
   * WARNING: This will clear data for ALL users
   */
  static async clearAllCachedData(): Promise<void> {
    try {
      console.log('🚨 SECURITY: Clearing ALL cached data');
      
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter out system keys that should not be cleared
      const systemKeys = [
        '@react-native-async-storage/async-storage',
        'expo-secure-store',
        'expo-notifications',
        'expo-device',
        'expo-constants'
      ];
      
      const userDataKeys = allKeys.filter(key => 
        !systemKeys.some(systemKey => key.startsWith(systemKey)) &&
        (key.startsWith('user_') || 
         key.includes('profile_picture') ||
         key.includes('user_data') ||
         key.includes('user_cache'))
      );
      
      if (userDataKeys.length > 0) {
        console.log('🗑️ Clearing all user data keys:', userDataKeys);
        await AsyncStorage.multiRemove(userDataKeys);
        console.log('✅ All user data cleared');
      } else {
        console.log('ℹ️ No user data found to clear');
      }
      
    } catch (error) {
      console.error('❌ Error clearing all cached data:', error);
      throw error;
    }
  }
  
  /**
   * Verify user data isolation
   * Checks if any user-specific data exists for a given user
   */
  static async verifyUserDataIsolation(userId: string): Promise<{
    hasUserData: boolean;
    userKeys: string[];
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userKeys = allKeys.filter(key => key.includes(userId));
      
      return {
        hasUserData: userKeys.length > 0,
        userKeys
      };
    } catch (error) {
      console.error('❌ Error verifying user data isolation:', error);
      return {
        hasUserData: false,
        userKeys: []
      };
    }
  }
  
  /**
   * Get all user-specific keys in storage
   * Useful for debugging data isolation issues
   */
  static async getAllUserKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys.filter(key => 
        key.startsWith('user_') || 
        key.includes('profile_picture') ||
        key.includes('user_data') ||
        key.includes('user_cache')
      );
    } catch (error) {
      console.error('❌ Error getting user keys:', error);
      return [];
    }
  }
  
  /**
   * Security audit: Check for potential data leakage
   * Returns a report of any potential security issues
   */
  static async securityAudit(): Promise<{
    hasGlobalKeys: boolean;
    globalKeys: string[];
    hasUserSpecificKeys: boolean;
    userKeys: string[];
    recommendations: string[];
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Check for global keys that might cause data mixing
      const globalKeys = allKeys.filter(key => 
        key === 'user_profile_picture' ||
        key === 'user_profile_picture_timestamp' ||
        key === 'user_data' ||
        key === 'user_cache'
      );
      
      // Check for user-specific keys
      const userKeys = allKeys.filter(key => 
        key.startsWith('user_profile_picture_') ||
        key.startsWith('user_data_') ||
        key.startsWith('user_cache_')
      );
      
      const recommendations: string[] = [];
      
      if (globalKeys.length > 0) {
        recommendations.push('CRITICAL: Found global user data keys that could cause data mixing');
        recommendations.push('Action: Replace global keys with user-specific keys');
      }
      
      if (userKeys.length === 0 && allKeys.length > 0) {
        recommendations.push('WARNING: No user-specific keys found, all data might be global');
      }
      
      return {
        hasGlobalKeys: globalKeys.length > 0,
        globalKeys,
        hasUserSpecificKeys: userKeys.length > 0,
        userKeys,
        recommendations
      };
      
    } catch (error) {
      console.error('❌ Error during security audit:', error);
      return {
        hasGlobalKeys: false,
        globalKeys: [],
        hasUserSpecificKeys: false,
        userKeys: [],
        recommendations: ['Error during security audit']
      };
    }
  }
}
