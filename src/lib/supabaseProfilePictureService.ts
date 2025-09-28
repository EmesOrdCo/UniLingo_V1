import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// SECURITY FIX: User-specific cache keys to prevent data mixing
const getProfilePictureKey = (userId: string) => `user_profile_picture_${userId}`;
const BUCKET_NAME = 'profile-pictures';

export class SupabaseProfilePictureService {
  // Upload profile picture to Supabase Storage
  static async uploadProfilePicture(uri: string, userId: string): Promise<string | null> {
    try {
      console.log('📤 Uploading profile picture to Supabase Storage...');
      
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });
      
      // Convert base64 to blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      // Create filename
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('❌ Error uploading to Supabase Storage:', error);
        return null;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      console.log('✅ Profile picture uploaded to Supabase:', publicUrl);
      
      // Save URL to local storage for quick access (user-specific)
      const key = getProfilePictureKey(userId);
      await AsyncStorage.setItem(key, publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      return null;
    }
  }

  // Get profile picture URL (from cache or Supabase)
  static async getProfilePictureUrl(userId: string): Promise<string | null> {
    try {
      // First try to get from local cache (user-specific)
      const key = getProfilePictureKey(userId);
      const cachedUrl = await AsyncStorage.getItem(key);
      if (cachedUrl) {
        console.log('📸 Profile picture loaded from cache for user:', userId);
        return cachedUrl;
      }
      
      // If not in cache, try to get from Supabase Storage
      console.log('🔍 Checking Supabase Storage for profile picture of user:', userId);
      
      // SECURITY FIX: Use exact filename pattern instead of search
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          search: `${userId}-`  // More specific search pattern
        });
      
      if (error) {
        console.error('❌ Error checking Supabase Storage:', error);
        return null;
      }
      
      if (files && files.length > 0) {
        // Get the most recent file for this specific user
        const userFiles = files.filter(file => file.name.startsWith(`${userId}-`));
        if (userFiles.length > 0) {
          const latestFile = userFiles.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(latestFile.name);
          
          const publicUrl = urlData.publicUrl;
          console.log('📸 Profile picture found in Supabase Storage for user:', userId);
          
          // Cache the URL (user-specific)
          await AsyncStorage.setItem(key, publicUrl);
          
          return publicUrl;
        }
      }
      
      console.log('📸 No profile picture found for user:', userId);
      return null;
    } catch (error) {
      console.error('❌ Error getting profile picture:', error);
      return null;
    }
  }

  // Delete profile picture from Supabase Storage
  static async deleteProfilePicture(userId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting profile picture from Supabase Storage...');
      
      // Find files for this user
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          search: userId
        });
      
      if (listError) {
        console.error('❌ Error listing files:', listError);
        return false;
      }
      
      if (files && files.length > 0) {
        // Delete all files for this user
        const fileNames = files.map(file => file.name);
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(fileNames);
        
        if (deleteError) {
          console.error('❌ Error deleting files:', deleteError);
          return false;
        }
      }
      
      // Remove from local cache (user-specific)
      const key = getProfilePictureKey(userId);
      await AsyncStorage.removeItem(key);
      
      console.log('✅ Profile picture deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting profile picture:', error);
      return false;
    }
  }

  // Clear local cache (force fresh load from Supabase) - user-specific
  static async clearCache(userId: string): Promise<void> {
    try {
      const key = getProfilePictureKey(userId);
      await AsyncStorage.removeItem(key);
      console.log('🗑️ Profile picture cache cleared for user:', userId);
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
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
    }
  }
}

