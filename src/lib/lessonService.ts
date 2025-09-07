import { supabase } from './supabase';
import { ENV } from './envConfig';
import OpenAI from 'openai';
import OpenAIWithRateLimit from './openAIWithRateLimit';
import * as FileSystem from 'expo-file-system';
import { CostEstimator } from './costEstimator';

// Initialize OpenAI client with rate limiting
const openai = new OpenAIWithRateLimit({
  apiKey: ENV.OPENAI_API_KEY,
});

export interface Lesson {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  source_pdf_name: string;
  native_language: string;
  estimated_duration: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'ready';
  created_at: string;
  updated_at: string;
}

export interface LessonVocabulary {
  id: string;
  lesson_id: string;
  english_term: string;
  definition: string;
  native_translation: string;
  example_sentence_en: string;
  example_sentence_native: string;
  difficulty_rank: number;
  created_at: string;
}

export interface LessonProgress {
  id: string;
  lesson_id: string;
  user_id: string;
  total_score: number;
  max_possible_score: number;
  time_spent_seconds: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
  // New fields for precise resume functionality
  current_exercise?: string; // 'flashcards', 'flashcard-quiz', etc.
  current_question_index?: number; // Question index within the current exercise
}

export class LessonService {
  /**
   * Convert PDF to text using backend server
   */
  static async convertPdfToText(pdfUri: string): Promise<string> {
    try {
      console.log('🔍 Converting PDF to text using backend server...');
      
      // Read the PDF file as base64
      const pdfBase64 = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // PDF text extraction now handled by Zapier webhook
      // This function will be updated to work with the webhook flow
      throw new Error('PDF text extraction is now handled by Zapier webhook. Please use the webhook-based flow.');

    } catch (error) {
      console.error('❌ PDF text extraction error:', error);
      throw error; // Re-throw the original error
    }
  }

  /**
   * Truncate text to fit within OpenAI's token limit
   */
  static truncateTextForOpenAI(text: string, maxTokens: number = 10000): string {
    // Super aggressive: only 10,000 tokens = 40,000 characters
    const maxCharacters = maxTokens * 4;
    
    console.log(`🔍 AGGRESSIVE truncation: ${text.length} chars vs ${maxCharacters} limit`);
    
    // Always truncate for proof of concept
    const truncated = text.substring(0, maxCharacters);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > 0) {
      const result = truncated.substring(0, lastSpaceIndex) + '...';
      console.log(`✂️ AGGRESSIVE truncation: ${text.length} → ${result.length} chars`);
      return result;
    }
    
    const result = truncated + '...';
    console.log(`✂️ AGGRESSIVE truncation: ${text.length} → ${result.length} chars`);
    return result;
  }

  /**
   * Extract keywords from PDF using OpenAI
   */
  static async extractKeywordsFromPDF(
    pdfText: string,
    subject: string,
    nativeLanguage: string
  ): Promise<string[]> {
    try {
      console.log('🔍 Extracting keywords from PDF...');
      
      // Truncate text to fit within OpenAI's token limit
      const truncatedText = this.truncateTextForOpenAI(pdfText);
      console.log(`📏 Original text length: ${pdfText.length} chars`);
      console.log(`📏 Truncated text length: ${truncatedText.length} chars`);
      
      const prompt = `Extract terms: ${truncatedText}`;

      // Prepare messages for cost estimation
      const messages = [
        {
          role: 'system',
          content: 'You are an expert content analyzer. You MUST return ONLY a JSON array of strings with no explanations, markdown, or text outside the JSON. Your response must start with [ and end with ]. Do NOT use backticks, code blocks, or any markdown formatting. Return raw JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Get current user for cost estimation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Estimate cost before making the API call
      const costEstimate = await CostEstimator.estimateCost(user.id, messages);
      
      if (!costEstimate.canProceed) {
        throw new Error(CostEstimator.getCostExceededMessage(costEstimate));
      }

      console.log('Cost estimation:', CostEstimator.getCostInfo(costEstimate));

      const response = await openai.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 4000,
          temperature: 0.1,
      });

      const content = response.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Clean the response
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```/, '');
      }
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/\s*```/, '');
      }

      const keywords = JSON.parse(cleanedContent);
      
      if (!Array.isArray(keywords)) {
        throw new Error('Invalid response format from OpenAI');
      }

      console.log(`✅ Extracted ${keywords.length} keywords`);
      return keywords;

    } catch (error) {
      console.error('❌ Error extracting keywords:', error);
      throw error;
    }
  }

  /**
   * Generate vocabulary from keywords using OpenAI
   */
  static async generateVocabularyFromKeywords(
    keywords: string[],
    subject: string,
    nativeLanguage: string
  ): Promise<Omit<LessonVocabulary, 'id' | 'lesson_id' | 'created_at'>[]> {
    try {
      console.log('🔍 Generating vocabulary from keywords...');
      
      const prompt = `Create vocabulary entries for these keywords. Return ONLY a JSON array:

Keywords: ${keywords.slice(0, 10).join(', ')} ${keywords.length > 10 ? `(+${keywords.length - 10} more)` : ''}
Subject: ${subject}
Language: ${nativeLanguage}

Format:
[{"english_term": "word", "definition": "meaning", "native_translation": "translation", "example_sentence_en": "example", "example_sentence_native": "translated example", "difficulty_rank": 2}]

Return ONLY the JSON array:`;

      // Prepare messages for cost estimation
      const messages = [
        {
          role: 'system',
          content: 'You are an expert language teacher. You MUST return ONLY a JSON array of objects with no explanations, markdown, or text outside the JSON. Your response must start with [ and end with ]. Do NOT use backticks, code blocks, or any markdown formatting. Return raw JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Get current user for cost estimation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Estimate cost before making the API call
      const costEstimate = await CostEstimator.estimateCost(user.id, messages);
      
      if (!costEstimate.canProceed) {
        throw new Error(CostEstimator.getCostExceededMessage(costEstimate));
      }

      console.log('Cost estimation:', CostEstimator.getCostInfo(costEstimate));
        
      const response = await openai.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 8000,
        temperature: 0.2,
      });

      const content = response.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Clean the response
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```/, '');
      }
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/\s*```/, '');
      }

      const vocabulary = JSON.parse(cleanedContent);
      
      if (!Array.isArray(vocabulary)) {
        throw new Error('Invalid response format from OpenAI');
      }

      console.log(`✅ Generated ${vocabulary.length} vocabulary entries`);
      return vocabulary;

    } catch (error) {
      console.error('❌ Error generating vocabulary:', error);
      throw error;
    }
  }

  /**
   * Create a new lesson from PDF
   */
  static async createLessonFromPDF(
    pdfUri: string,
    pdfName: string,
    userId: string,
    subject: string,
    nativeLanguage: string
  ): Promise<Lesson> {
    try {
      console.log('🚀 Creating lesson from PDF...');

      // Step 1: PDF text extraction handled by backend API
      // This function will be updated to work with the API flow
      throw new Error('PDF text extraction is handled by backend API. Please use the API-based flow.');
      
      // This function is now deprecated - PDF processing is handled by backend API
      // and lesson creation is handled directly in the CreateLessonScreen
      throw new Error('This function is deprecated. Use the backend API flow in CreateLessonScreen.');

    } catch (error) {
      console.error('❌ Error creating lesson:', error);
      throw error;
    }
  }

  /**
   * Get lesson by ID with vocabulary
   */
  static async getLesson(lessonId: string): Promise<{
    lesson: Lesson;
    vocabulary: LessonVocabulary[];
  } | null> {
    try {
      // Get lesson
      const { data: lesson, error: lessonError } = await supabase
        .from('esp_lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError || !lesson) {
        throw new Error('Lesson not found');
      }

      // Get vocabulary
      const { data: vocabulary, error: vocabError } = await supabase
        .from('lesson_vocabulary')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at');

      if (vocabError) throw vocabError;

      // Vocabulary data is already in the correct format (keywords field)
      const mappedVocabulary = vocabulary || [];

      return {
        lesson,
        vocabulary: mappedVocabulary
      };

    } catch (error) {
      console.error('Error getting lesson:', error);
      return null;
    }
  }

  /**
   * Get user's lessons
   */
  static async getUserLessons(userId: string): Promise<Lesson[]> {
    try {
      const { data, error } = await supabase
        .from('esp_lessons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting user lessons:', error);
      return [];
    }
  }

  /**
   * Get or create lesson progress
   */
  static async getLessonProgress(lessonId: string, userId: string): Promise<LessonProgress | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting lesson progress:', error);
      return null;
    }
  }

  /**
   * Create or update lesson progress
   */
  static async updateLessonProgress(
    lessonId: string,
    userId: string,
    progressData: Partial<LessonProgress>
  ): Promise<LessonProgress> {
    try {
      const existingProgress = await this.getLessonProgress(lessonId, userId);
      
      if (existingProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from('lesson_progress')
          .update({
            ...progressData
          })
          .eq('id', existingProgress.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating lesson progress:', error);
          throw error;
        }
        return data;
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from('lesson_progress')
          .insert([{
            lesson_id: lessonId,
            user_id: userId,
            total_score: 0,
            max_possible_score: 0,
            time_spent_seconds: 0,
            started_at: new Date().toISOString(),
            ...progressData
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating lesson progress:', error);
          throw error;
        }
        return data;
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  }

  /**
   * Complete lesson
   */
  static async completeLesson(lessonId: string, userId: string, finalScore: number, maxScore: number, timeSpent: number): Promise<void> {
    try {
      await this.updateLessonProgress(lessonId, userId, {
        total_score: finalScore,
        max_possible_score: maxScore,
        time_spent_seconds: timeSpent,
        completed_at: new Date().toISOString()
      });

      // Update streak for lesson completion
      try {
        const { HolisticProgressService } = await import('./holisticProgressService');
        await HolisticProgressService.updateStreak(userId, 'daily_study');
        console.log('✅ Streak updated for lesson completion');
      } catch (streakError) {
        console.error('❌ Error updating streak:', streakError);
        // Don't fail lesson completion if streak update fails
      }

      console.log('✅ Lesson completed successfully');
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    }
  }

  /**
   * Delete a lesson and all related data
   */
  static async deleteLesson(lessonId: string, userId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Starting deletion of lesson ${lessonId} for user ${userId}`);

      // First, verify the lesson belongs to the user
      const { data: lesson, error: lessonError } = await supabase
        .from('esp_lessons')
        .select('id, user_id, title')
        .eq('id', lessonId)
        .eq('user_id', userId)
        .single();

      if (lessonError || !lesson) {
        throw new Error('Lesson not found or does not belong to user');
      }

      console.log(`✅ Verified lesson ownership: "${lesson.title}"`);

      // Delete in order: dependent tables first, then main table
      
      // 1. Delete lesson progress records
      const { error: progressError } = await supabase
        .from('lesson_progress')
        .delete()
        .eq('lesson_id', lessonId);

      if (progressError) {
        console.error('❌ Error deleting lesson progress:', progressError);
        throw progressError;
      }
      console.log('✅ Deleted lesson progress records');

      // 2. Delete lesson vocabulary
      const { error: vocabError } = await supabase
        .from('lesson_vocabulary')
        .delete()
        .eq('lesson_id', lessonId);

      if (vocabError) {
        console.error('❌ Error deleting lesson vocabulary:', vocabError);
        throw vocabError;
      }
      console.log('✅ Deleted lesson vocabulary');

      // 3. Finally, delete the main lesson record
      const { error: lessonDeleteError } = await supabase
        .from('esp_lessons')
        .delete()
        .eq('id', lessonId)
        .eq('user_id', userId); // Double-check user ownership

      if (lessonDeleteError) {
        console.error('❌ Error deleting lesson:', lessonDeleteError);
        throw lessonDeleteError;
      }
      console.log('✅ Deleted main lesson record');

      console.log(`🎉 Successfully deleted lesson "${lesson.title}" and all related data`);
      return true;

    } catch (error) {
      console.error('❌ Error deleting lesson:', error);
      return false;
    }
  }
}
