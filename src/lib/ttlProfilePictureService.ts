import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_PICTURE_KEY = 'user_profile_picture';
const CACHE_TIMESTAMP_KEY = 'user_profile_picture_timestamp';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class TTLProfilePictureService {
  // Save profile picture URI to AsyncStorage with timestamp
  static async saveProfilePicture(uri: string): Promise<void> {
    try {
      const timestamp = Date.now();
      await AsyncStorage.setItem(PROFILE_PICTURE_KEY, uri);
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString());
      console.log('✅ Profile picture saved to storage with TTL');
    } catch (error) {
      console.error('❌ Error saving profile picture:', error);
      throw error;
    }
  }

  // Load profile picture URI from AsyncStorage (check TTL first)
  static async loadProfilePicture(): Promise<string | null> {
    try {
      const uri = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (!uri || !timestampStr) {
        console.log('📸 No cached profile picture found');
        return null;
      }
      
      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      const age = now - timestamp;
      
      if (age > CACHE_TTL) {
        console.log('📸 Profile picture cache expired, clearing...');
        await this.clearCache();
        return null;
      }
      
      console.log(`📸 Profile picture loaded from cache (age: ${Math.round(age / 1000 / 60)} minutes)`);
      return uri;
    } catch (error) {
      console.error('❌ Error loading profile picture:', error);
      return null;
    }
  }

  // Remove profile picture from AsyncStorage
  static async removeProfilePicture(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log('🗑️ Profile picture removed from storage');
    } catch (error) {
      console.error('❌ Error removing profile picture:', error);
      throw error;
    }
  }

  // Check if profile picture exists and is not expired
  static async hasValidProfilePicture(): Promise<boolean> {
    try {
      const uri = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      
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

  // Clear cache manually
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log('🗑️ Profile picture cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  // Get cache age in minutes
  static async getCacheAge(): Promise<number | null> {
    try {
      const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestampStr) return null;
      
      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      return Math.round((now - timestamp) / 1000 / 60);
    } catch (error) {
      console.error('❌ Error getting cache age:', error);
      return null;
    }
  }
}

