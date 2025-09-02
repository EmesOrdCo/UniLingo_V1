import { supabase } from './supabase';
import { ENV } from './envConfig';
import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
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
  current_step: 'flashcards' | 'game1' | 'game2' | 'game3' | 'completed';
  flashcards_completed: boolean;
  game1_completed: boolean;
  game2_completed: boolean;
  game3_completed: boolean;
  total_score: number;
  max_possible_score: number;
  time_spent_seconds: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
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

      // Call backend server instead of Cloudmersive directly
      const response = await fetch('http://192.168.1.187:3001/api/extract-pdf-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: pdfBase64
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 Error response body:', errorText);
        throw new Error(`Backend server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Text extracted from PDF successfully via backend');
      return result.text;

    } catch (error) {
      console.error('❌ Error converting PDF to text:', error);
      throw new Error('Failed to convert PDF to text. Please ensure the PDF contains readable text.');
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

      const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
            content: 'You are an expert content analyzer. You MUST return ONLY a JSON array of strings with no explanations, markdown, or text outside the JSON. Your response must start with [ and end with ]. Do NOT use backticks, code blocks, or any markdown formatting. Return raw JSON only.'
            },
            {
              role: 'user',
            content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
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
      
      const prompt = `You are an expert language teacher creating vocabulary lessons for non-native English speakers.

TASK: Create comprehensive vocabulary entries for each provided keyword, considering the user's subject and native language.

REQUIREMENTS:
- Create vocabulary items for EVERY keyword provided
- Provide accurate definitions and translations
- Include contextual example sentences
- Assign appropriate difficulty ranks (1=beginner, 2=intermediate, 3=advanced)
- Consider the subject context for definitions
- Ensure translations are accurate for the specified native language

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY a JSON array of objects
- Do NOT include any explanations, markdown, or text outside the JSON
- The response must start with [ and end with ]
- Do NOT use backticks, code blocks, or any markdown formatting
- Return raw, unformatted JSON only

REQUIRED FORMAT:
[
  {
    "english_term": "string",
    "definition": "string",
    "native_translation": "string",
    "example_sentence_en": "string",
    "example_sentence_native": "string",
    "difficulty_rank": "number (1-3)"
  }
]

Keywords to process:
${JSON.stringify(keywords)}

Subject: ${subject}
Native Language: ${nativeLanguage}

Create vocabulary entries for ALL keywords. Return ONLY the JSON array:`;
        
      const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
            content: 'You are an expert language teacher. You MUST return ONLY a JSON array of objects with no explanations, markdown, or text outside the JSON. Your response must start with [ and end with ]. Do NOT use backticks, code blocks, or any markdown formatting. Return raw JSON only.'
            },
            {
              role: 'user',
            content: prompt
            }
          ],
          max_tokens: 8000,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
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

      // Step 1: Convert PDF to text using Cloudmersive
      const pdfText = await this.convertPdfToText(pdfUri);
      
      // Step 2: Extract keywords
      const keywords = await this.extractKeywordsFromPDF(pdfText, subject, nativeLanguage);
      
      // Step 3: Generate vocabulary
      const vocabulary = await this.generateVocabularyFromKeywords(keywords, subject, nativeLanguage);
      
      // Step 4: Create lesson in database
      const lessonTitle = `${subject} Vocabulary Lesson`;
      const estimatedDuration = Math.max(30, vocabulary.length * 2); // 2 minutes per term, minimum 30 minutes
      
      const { data: lesson, error: lessonError } = await supabase
        .from('esp_lessons')
        .insert([{
          user_id: userId,
          title: lessonTitle,
          subject: subject,
          source_pdf_name: pdfName,
          native_language: nativeLanguage,
          estimated_duration: estimatedDuration,
          difficulty_level: 'intermediate',
          status: 'ready'
        }])
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Step 5: Create vocabulary entries
      const vocabularyData = vocabulary.map(item => ({
        lesson_id: lesson.id,
        english_term: item.english_term,
        definition: item.definition,
        native_translation: item.native_translation,
        example_sentence_en: item.example_sentence_en,
        example_sentence_native: item.example_sentence_native,
        difficulty_rank: item.difficulty_rank
      }));

      const { error: vocabError } = await supabase
        .from('lesson_vocabulary')
        .insert(vocabularyData);

      if (vocabError) throw vocabError;

      console.log('✅ Lesson created successfully:', lesson.id);
      return lesson;

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

      return {
        lesson,
        vocabulary: vocabulary || []
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
            ...progressData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from('lesson_progress')
          .insert([{
            lesson_id: lessonId,
            user_id: userId,
            current_step: 'flashcards',
            flashcards_completed: false,
            game1_completed: false,
            game2_completed: false,
            game3_completed: false,
            total_score: 0,
            max_possible_score: 0,
            time_spent_seconds: 0,
            started_at: new Date().toISOString(),
            ...progressData
          }])
          .select()
          .single();

        if (error) throw error;
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
        current_step: 'completed',
        total_score: finalScore,
        max_possible_score: maxScore,
        time_spent_seconds: timeSpent,
        completed_at: new Date().toISOString()
      });

      console.log('✅ Lesson completed successfully');
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    }
  }
}
