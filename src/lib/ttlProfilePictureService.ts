import AsyncStorage from '@react-native-async-storage/async-storage';

// SECURITY FIX: User-specific cache keys to prevent data mixing
const getProfilePictureKey = (userId: string) => `user_profile_picture_${userId}`;
const getCacheTimestampKey = (userId: string) => `user_profile_picture_timestamp_${userId}`;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class TTLProfilePictureService {
  // Save profile picture URI to AsyncStorage with timestamp
  static async saveProfilePicture(uri: string, userId: string): Promise<void> {
    try {
      const timestamp = Date.now();
      const key = getProfilePictureKey(userId);
      const timestampKey = getCacheTimestampKey(userId);
      await AsyncStorage.setItem(key, uri);
      await AsyncStorage.setItem(timestampKey, timestamp.toString());
      console.log('✅ Profile picture saved to storage with TTL for user:', userId);
    } catch (error) {
      console.error('❌ Error saving profile picture:', error);
      throw error;
    }
  }

  // Load profile picture URI from AsyncStorage (check TTL first)
  static async loadProfilePicture(userId: string): Promise<string | null> {
    try {
      const key = getProfilePictureKey(userId);
      const timestampKey = getCacheTimestampKey(userId);
      const uri = await AsyncStorage.getItem(key);
      const timestampStr = await AsyncStorage.getItem(timestampKey);
      
      if (!uri || !timestampStr) {
        console.log('📸 No cached profile picture found for user:', userId);
        return null;
      }
      
      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      const age = now - timestamp;
      
      if (age > CACHE_TTL) {
        console.log('📸 Profile picture cache expired for user:', userId, 'clearing...');
        await this.clearCache(userId);
        return null;
      }
      
      console.log(`📸 Profile picture loaded from cache for user: ${userId} (age: ${Math.round(age / 1000 / 60)} minutes)`);
      return uri;
    } catch (error) {
      console.error('❌ Error loading profile picture:', error);
      return null;
    }
  }

  // Remove profile picture from AsyncStorage
  static async removeProfilePicture(userId: string): Promise<void> {
    try {
      const key = getProfilePictureKey(userId);
      const timestampKey = getCacheTimestampKey(userId);
      await AsyncStorage.removeItem(key);
      await AsyncStorage.removeItem(timestampKey);
      console.log('🗑️ Profile picture removed from storage for user:', userId);
    } catch (error) {
      console.error('❌ Error removing profile picture:', error);
      throw error;
    }
  }

  // Check if profile picture exists and is not expired
  static async hasValidProfilePicture(userId: string): Promise<boolean> {
    try {
      const key = getProfilePictureKey(userId);
      const timestampKey = getCacheTimestampKey(userId);
      const uri = await AsyncStorage.getItem(key);
      const timestampStr = await AsyncStorage.getItem(timestampKey);
      
      if (!uri || !timestampStr) {
        return false;
      }
      
      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      const age = now - timestamp;
      
      return age <= CACHE_TTL;
    } catch (error) {
      console.error('❌ Error checking profile picture:', error);
      return false;
    }
  }

  // Clear cache manually for specific user
  static async clearCache(userId: string): Promise<void> {
    try {
      const key = getProfilePictureKey(userId);
      const timestampKey = getCacheTimestampKey(userId);
      await AsyncStorage.removeItem(key);
      await AsyncStorage.removeItem(timestampKey);
      console.log('🗑️ Profile picture cache cleared for user:', userId);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  // Get cache age in minutes for specific user
  static async getCacheAge(userId: string): Promise<number | null> {
    try {
      const timestampKey = getCacheTimestampKey(userId);
      const timestampStr = await AsyncStorage.getItem(timestampKey);
      if (!timestampStr) return null;
      
      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      return Math.round((now - timestamp) / 1000 / 60);
    } catch (error) {
      console.error('❌ Error getting cache age:', error);
      return null;
    }
  }

  // Clear ALL profile picture caches (for debugging)
  static async clearAllCaches(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const profilePictureKeys = keys.filter(key => 
        key.startsWith('user_profile_picture_') || 
        key.startsWith('user_profile_picture_timestamp_')
      );
      await AsyncStorage.multiRemove(profilePictureKeys);
      console.log('🗑️ All profile picture caches cleared');
    } catch (error) {
      console.error('❌ Error clearing all profile picture caches:', error);
      throw error;
    }
  }
}

