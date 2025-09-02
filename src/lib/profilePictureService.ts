import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_PICTURE_KEY = 'user_profile_picture';

export class ProfilePictureService {
  // Save profile picture URI to AsyncStorage
  static async saveProfilePicture(uri: string): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_PICTURE_KEY, uri);
      console.log('✅ Profile picture saved to storage');
    } catch (error) {
      console.error('❌ Error saving profile picture:', error);
      throw error;
    }
  }

  // Load profile picture URI from AsyncStorage
  static async loadProfilePicture(): Promise<string | null> {
    try {
      const uri = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      console.log('📸 Profile picture loaded from storage:', uri ? 'Found' : 'Not found');
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
      console.log('🗑️ Profile picture removed from storage');
    } catch (error) {
      console.error('❌ Error removing profile picture:', error);
      throw error;
    }
  }

  // Check if profile picture exists
  static async hasProfilePicture(): Promise<boolean> {
    try {
      const uri = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      return uri !== null;
    } catch (error) {
      console.error('❌ Error checking profile picture:', error);
      return false;
    }
  }
}
