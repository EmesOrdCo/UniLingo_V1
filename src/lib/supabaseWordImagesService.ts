import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const BUCKET_NAME = 'word-images';
const CACHE_PREFIX = 'word_image_';

// Image optimization settings
const IMAGE_SETTINGS = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.8, // 80% quality for good balance of size/quality
  format: 'jpeg' as const
};

export interface WordImageUploadResult {
  wordId: string;
  publicUrl: string;
  fileName: string;
  success: boolean;
  error?: string;
}

export interface WordImageBatchUploadResult {
  successful: WordImageUploadResult[];
  failed: WordImageUploadResult[];
  totalProcessed: number;
}

export class SupabaseWordImagesService {
  /**
   * Upload a single word image to Supabase Storage
   */
  static async uploadWordImage(
    imageUri: string, 
    wordId: string, 
    wordText?: string
  ): Promise<WordImageUploadResult> {
    try {
      console.log(`📤 Uploading word image for: ${wordId}`);
      
      // Optimize the image before upload
      const optimizedUri = await this.optimizeImage(imageUri);
      
      // Read the optimized image as base64
      const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
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
      
      // Create filename with word ID and sanitized word text
      const sanitizedWord = wordText ? wordText.replace(/[^a-zA-Z0-9]/g, '_') : '';
      const fileName = `${wordId}_${sanitizedWord}_${Date.now()}.jpg`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, blob, {
          cacheControl: '31536000', // 1 year cache
          upsert: true
        });
      
      if (error) {
        console.error('❌ Error uploading word image to Supabase:', error);
        return {
          wordId,
          publicUrl: '',
          fileName,
          success: false,
          error: error.message
        };
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      console.log(`✅ Word image uploaded: ${fileName}`);
      
      // Cache the URL for quick access
      await this.cacheImageUrl(wordId, publicUrl);
      
      return {
        wordId,
        publicUrl,
        fileName,
        success: true
      };
    } catch (error) {
      console.error('❌ Error uploading word image:', error);
      return {
        wordId,
        publicUrl: '',
        fileName: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch upload multiple word images
   */
  static async batchUploadWordImages(
    imageData: Array<{ imageUri: string; wordId: string; wordText?: string }>,
    onProgress?: (progress: { completed: number; total: number; current: string }) => void
  ): Promise<WordImageBatchUploadResult> {
    const results: WordImageBatchUploadResult = {
      successful: [],
      failed: [],
      totalProcessed: 0
    };

    console.log(`🚀 Starting batch upload of ${imageData.length} word images...`);

    for (let i = 0; i < imageData.length; i++) {
      const { imageUri, wordId, wordText } = imageData[i];
      
      onProgress?.({
        completed: i,
        total: imageData.length,
        current: wordText || wordId
      });

      const result = await this.uploadWordImage(imageUri, wordId, wordText);
      
      if (result.success) {
        results.successful.push(result);
      } else {
        results.failed.push(result);
      }
      
      results.totalProcessed++;
    }

    onProgress?.({
      completed: imageData.length,
      total: imageData.length,
      current: 'Complete'
    });

    console.log(`✅ Batch upload complete: ${results.successful.length} successful, ${results.failed.length} failed`);
    
    return results;
  }

  /**
   * Get word image URL (from cache or Supabase)
   */
  static async getWordImageUrl(wordId: string): Promise<string | null> {
    try {
      // First try to get from local cache
      const cachedUrl = await this.getCachedImageUrl(wordId);
      if (cachedUrl) {
        console.log(`📸 Word image loaded from cache: ${wordId}`);
        return cachedUrl;
      }
      
      // If not in cache, try to find in Supabase Storage
      console.log(`🔍 Checking Supabase Storage for word image: ${wordId}`);
      
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          search: `${wordId}_`
        });
      
      if (error) {
        console.error('❌ Error checking Supabase Storage:', error);
        return null;
      }
      
      if (files && files.length > 0) {
        // Get the most recent file for this word
        const wordFiles = files.filter(file => file.name.startsWith(`${wordId}_`));
        if (wordFiles.length > 0) {
          const latestFile = wordFiles.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(latestFile.name);
          
          const publicUrl = urlData.publicUrl;
          console.log(`📸 Word image found in Supabase Storage: ${wordId}`);
          
          // Cache the URL
          await this.cacheImageUrl(wordId, publicUrl);
          
          return publicUrl;
        }
      }
      
      console.log(`📸 No word image found for: ${wordId}`);
      return null;
    } catch (error) {
      console.error('❌ Error getting word image:', error);
      return null;
    }
  }

  /**
   * Delete word image from Supabase Storage
   */
  static async deleteWordImage(wordId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting word image: ${wordId}`);
      
      // Find the file in Supabase Storage
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          search: `${wordId}_`
        });
      
      if (listError) {
        console.error('❌ Error listing files for deletion:', listError);
        return false;
      }
      
      if (files && files.length > 0) {
        const wordFiles = files.filter(file => file.name.startsWith(`${wordId}_`));
        
        for (const file of wordFiles) {
          const { error: deleteError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([file.name]);
          
          if (deleteError) {
            console.error('❌ Error deleting file:', deleteError);
            return false;
          }
        }
        
        // Remove from cache
        await this.removeCachedImageUrl(wordId);
        
        console.log(`✅ Word image deleted: ${wordId}`);
        return true;
      }
      
      console.log(`📸 No word image found to delete: ${wordId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting word image:', error);
      return false;
    }
  }

  /**
   * Get all word images for a lesson or unit
   */
  static async getWordImagesForLesson(lessonId: string): Promise<{ wordId: string; imageUrl: string }[]> {
    try {
      // This would typically involve querying your database for words in the lesson
      // and then fetching their image URLs
      console.log(`🔍 Getting word images for lesson: ${lessonId}`);
      
      // Placeholder implementation - you'll need to adapt this based on your data structure
      const wordIds: string[] = []; // Get from your database
      
      const results = [];
      for (const wordId of wordIds) {
        const imageUrl = await this.getWordImageUrl(wordId);
        if (imageUrl) {
          results.push({ wordId, imageUrl });
        }
      }
      
      return results;
    } catch (error) {
      console.error('❌ Error getting lesson word images:', error);
      return [];
    }
  }

  /**
   * Optimize image for storage (resize and compress)
   */
  private static async optimizeImage(imageUri: string): Promise<string> {
    try {
      // For React Native, you might want to use expo-image-manipulator
      // This is a placeholder - implement based on your image optimization needs
      
      // If using expo-image-manipulator:
      // const manipulatedImage = await ImageManipulator.manipulateAsync(
      //   imageUri,
      //   [{ resize: { width: IMAGE_SETTINGS.maxWidth, height: IMAGE_SETTINGS.maxHeight } }],
      //   { compress: IMAGE_SETTINGS.quality, format: ImageManipulator.SaveFormat.JPEG }
      // );
      // return manipulatedImage.uri;
      
      // For now, return the original URI
      return imageUri;
    } catch (error) {
      console.error('❌ Error optimizing image:', error);
      return imageUri; // Fallback to original
    }
  }

  /**
   * Cache image URL locally for quick access
   */
  private static async cacheImageUrl(wordId: string, url: string): Promise<void> {
    try {
      const key = `${CACHE_PREFIX}${wordId}`;
      await AsyncStorage.setItem(key, url);
    } catch (error) {
      console.error('❌ Error caching image URL:', error);
    }
  }

  /**
   * Get cached image URL
   */
  private static async getCachedImageUrl(wordId: string): Promise<string | null> {
    try {
      const key = `${CACHE_PREFIX}${wordId}`;
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('❌ Error getting cached image URL:', error);
      return null;
    }
  }

  /**
   * Remove cached image URL
   */
  private static async removeCachedImageUrl(wordId: string): Promise<void> {
    try {
      const key = `${CACHE_PREFIX}${wordId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('❌ Error removing cached image URL:', error);
    }
  }

  /**
   * Clear all cached word images
   */
  static async clearImageCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const wordImageKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      if (wordImageKeys.length > 0) {
        await AsyncStorage.multiRemove(wordImageKeys);
        console.log(`🧹 Cleared ${wordImageKeys.length} cached word images`);
      }
    } catch (error) {
      console.error('❌ Error clearing image cache:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{ totalFiles: number; totalSize: number; bucketName: string }> {
    try {
      const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', { limit: 1000 }); // Adjust limit as needed
      
      if (error) {
        console.error('❌ Error getting storage stats:', error);
        return { totalFiles: 0, totalSize: 0, bucketName: BUCKET_NAME };
      }
      
      const totalFiles = files?.length || 0;
      const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;
      
      return {
        totalFiles,
        totalSize,
        bucketName: BUCKET_NAME
      };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return { totalFiles: 0, totalSize: 0, bucketName: BUCKET_NAME };
    }
  }
}
