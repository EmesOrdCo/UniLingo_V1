import { supabase } from './supabase';
import { logger } from './logger';

const GENERAL_LESSONS_BUCKET = 'General_Lessons';

export interface WordImageMapping {
  word: string;
  imageUrl: string;
}

export class WordImageService {
  /**
   * Get image URL for a specific word from Supabase Storage
   * Images are expected to be named with the word (e.g., "hello.jpg", "goodbye.png")
   */
  static async getWordImageUrl(word: string): Promise<string | null> {
    try {
      logger.info(`🖼️ Fetching image for word: ${word}`);
      
      // Normalize the word (lowercase, trim spaces)
      const normalizedWord = word.toLowerCase().trim().replace(/\s+/g, '_');
      
      // List all files in the General_Lessons bucket that match the word
      const { data: files, error } = await supabase.storage
        .from(GENERAL_LESSONS_BUCKET)
        .list('', {
          search: normalizedWord
        });
      
      if (error) {
        logger.error(`Error listing images for word "${word}":`, error);
        return null;
      }
      
      if (!files || files.length === 0) {
        logger.warn(`⚠️ No image found for word: ${word}`);
        return null;
      }
      
      // Find exact match or the first file that contains the word
      const imageFile = files.find(file => {
        const fileName = file.name.toLowerCase();
        return fileName.startsWith(normalizedWord) || fileName.includes(normalizedWord);
      });
      
      if (!imageFile) {
        logger.warn(`⚠️ No matching image file found for word: ${word}`);
        return null;
      }
      
      // Get public URL for the image
      const { data: urlData } = supabase.storage
        .from(GENERAL_LESSONS_BUCKET)
        .getPublicUrl(`Images/${imageFile.name}`);
      
      const publicUrl = urlData.publicUrl;
      logger.info(`✅ Found image for "${word}": ${imageFile.name}`);
      
      return publicUrl;
    } catch (error) {
      logger.error(`Error getting image URL for word "${word}":`, error);
      return null;
    }
  }
  
  /**
   * Get image URLs for multiple words in batch
   */
  static async getBatchWordImageUrls(words: string[]): Promise<Map<string, string>> {
    const imageMap = new Map<string, string>();
    
    try {
      logger.info(`🖼️ Fetching images for ${words.length} words`);
      
      // List all files in the General_Lessons/Images folder
      const { data: files, error } = await supabase.storage
        .from(GENERAL_LESSONS_BUCKET)
        .list('Images');
      
      if (error) {
        logger.error('Error listing images from General_Lessons bucket:', error);
        return imageMap;
      }
      
      if (!files || files.length === 0) {
        logger.warn('⚠️ No images found in General_Lessons bucket');
        return imageMap;
      }
      
      logger.info(`📂 Found ${files.length} files in General_Lessons bucket`);
      
      // For each word, find matching image
      for (const word of words) {
        const normalizedWord = word.toLowerCase().trim().replace(/\s+/g, '_');
        
        // Find exact match or the first file that contains the word
        const imageFile = files.find(file => {
          const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, ''); // Remove extension
          return fileName === normalizedWord || 
                 fileName.startsWith(normalizedWord) || 
                 fileName.includes(normalizedWord);
        });
        
        if (imageFile) {
          const { data: urlData } = supabase.storage
            .from(GENERAL_LESSONS_BUCKET)
            .getPublicUrl(`Images/${imageFile.name}`);
          
          imageMap.set(word, urlData.publicUrl);
          logger.info(`✅ Mapped "${word}" -> ${imageFile.name}`);
        } else {
          logger.warn(`⚠️ No image found for: ${word}`);
        }
      }
      
      logger.info(`✅ Successfully mapped ${imageMap.size}/${words.length} words to images`);
      return imageMap;
    } catch (error) {
      logger.error('Error getting batch word images:', error);
      return imageMap;
    }
  }
  
  /**
   * Update subject_words table with image URLs
   * This should be run once to populate the image_url column
   */
  static async updateWordImagesInDatabase(subjectName?: string): Promise<number> {
    try {
      logger.info('🔄 Updating word images in database...');
      
      // Fetch vocabulary words
      let query = supabase
        .from('subject_words')
        .select('id, english_translation, word_phrase, subject');
      
      if (subjectName) {
        query = query.eq('subject', subjectName);
      }
      
      const { data: words, error: fetchError } = await query;
      
      if (fetchError) {
        logger.error('Error fetching words:', fetchError);
        return 0;
      }
      
      if (!words || words.length === 0) {
        logger.warn('No words found to update');
        return 0;
      }
      
      logger.info(`📝 Found ${words.length} words to process`);
      
      // Get all word names for batch processing
      const wordNames = words.map(w => w.english_translation || w.word_phrase);
      const imageMap = await this.getBatchWordImageUrls(wordNames);
      
      // Update each word with its image URL
      let updatedCount = 0;
      for (const word of words) {
        const wordKey = word.english_translation || word.word_phrase;
        const imageUrl = imageMap.get(wordKey);
        
        if (imageUrl) {
          const { error: updateError } = await supabase
            .from('subject_words')
            .update({ image_url: imageUrl })
            .eq('id', word.id);
          
          if (updateError) {
            logger.error(`Error updating word ${word.id}:`, updateError);
          } else {
            updatedCount++;
          }
        }
      }
      
      logger.info(`✅ Updated ${updatedCount}/${words.length} words with image URLs`);
      return updatedCount;
    } catch (error) {
      logger.error('Error updating word images in database:', error);
      return 0;
    }
  }
  
  /**
   * List all images in the General_Lessons bucket for debugging
   */
  static async listAllImages(): Promise<string[]> {
    try {
      const { data: files, error } = await supabase.storage
        .from(GENERAL_LESSONS_BUCKET)
        .list('Images');
      
      if (error) {
        logger.error('Error listing images:', error);
        return [];
      }
      
      const fileNames = files?.map(file => file.name) || [];
      logger.info(`📂 Found ${fileNames.length} images in General_Lessons bucket`);
      return fileNames;
    } catch (error) {
      logger.error('Error listing all images:', error);
      return [];
    }
  }
}

