import AsyncStorage from '@react-native-async-storage/async-storage';

// SECURITY FIX: User-specific cache keys to prevent data mixing
const getProfilePictureKey = (userId: string) => `user_profile_picture_${userId}`;

export class ProfilePictureService {
  // Save profile picture URI to AsyncStorage
  static async saveProfilePicture(uri: string, userId: string): Promise<void> {
    try {
      const key = getProfilePictureKey(userId);
      await AsyncStorage.setItem(key, uri);
      console.log('✅ Profile picture saved to storage for user:', userId);
    } catch (error) {
      console.error('❌ Error saving profile picture:', error);
      throw error;
    }
  }

  // Load profile picture URI from AsyncStorage
  static async loadProfilePicture(userId: string): Promise<string | null> {
    try {
      const key = getProfilePictureKey(userId);
      const uri = await AsyncStorage.getItem(key);
      console.log('📸 Profile picture loaded from storage for user:', userId, uri ? 'Found' : 'Not found');
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
      await AsyncStorage.removeItem(key);
      console.log('🗑️ Profile picture removed from storage for user:', userId);
    } catch (error) {
      console.error('❌ Error removing profile picture:', error);
      throw error;
    }
  }

  // Check if profile picture exists
  static async hasProfilePicture(userId: string): Promise<boolean> {
    try {
      const key = getProfilePictureKey(userId);
      const uri = await AsyncStorage.getItem(key);
      return uri !== null;
    } catch (error) {
      console.error('❌ Error checking profile picture:', error);
      return false;
    }
  }

  // Clear profile picture cache for specific user
  static async clearCache(userId: string): Promise<void> {
    try {
      const key = getProfilePictureKey(userId);
      await AsyncStorage.removeItem(key);
      console.log('🗑️ Profile picture cache cleared for user:', userId);
    } catch (error) {
      console.error('❌ Error clearing profile picture cache:', error);
      throw error;
    }
  }

  // Clear ALL profile picture caches (for debugging)
  static async clearAllCaches(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const profilePictureKeys = keys.filter(key => key.startsWith('user_profile_picture_'));
      await AsyncStorage.multiRemove(profilePictureKeys);
      console.log('🗑️ All profile picture caches cleared');
    } catch (error) {
      console.error('❌ Error clearing all profile picture caches:', error);
      throw error;
    }
  }
}
