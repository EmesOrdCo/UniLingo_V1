import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const PROFILE_PICTURE_KEY = 'user_profile_picture';
const BUCKET_NAME = 'profile-pictures';

export class SupabaseProfilePictureService {
  // Upload profile picture to Supabase Storage
  static async uploadProfilePicture(uri: string, userId: string): Promise<string | null> {
    try {
      console.log('📤 Uploading profile picture to Supabase Storage...');
      
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
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
      
      // Save URL to local storage for quick access
      await AsyncStorage.setItem(PROFILE_PICTURE_KEY, publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      return null;
    }
  }

  // Get profile picture URL (from cache or Supabase)
  static async getProfilePictureUrl(userId: string): Promise<string | null> {
    try {
      // First try to get from local cache
      const cachedUrl = await AsyncStorage.getItem(PROFILE_PICTURE_KEY);
      if (cachedUrl) {
        console.log('📸 Profile picture loaded from cache');
        return cachedUrl;
      }
      
      // If not in cache, try to get from Supabase Storage
      console.log('🔍 Checking Supabase Storage for profile picture...');
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          search: userId
        });
      
      if (error) {
        console.error('❌ Error checking Supabase Storage:', error);
        return null;
      }
      
      if (files && files.length > 0) {
        // Get the most recent file
        const latestFile = files.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(latestFile.name);
        
        const publicUrl = urlData.publicUrl;
        console.log('📸 Profile picture found in Supabase Storage');
        
        // Cache the URL
        await AsyncStorage.setItem(PROFILE_PICTURE_KEY, publicUrl);
        
        return publicUrl;
      }
      
      console.log('📸 No profile picture found');
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
      
      // Remove from local cache
      await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
      
      console.log('✅ Profile picture deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting profile picture:', error);
      return false;
    }
  }

  // Clear local cache (force fresh load from Supabase)
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_PICTURE_KEY);
      console.log('🗑️ Profile picture cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }
}

