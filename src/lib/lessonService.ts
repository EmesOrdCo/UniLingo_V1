import { supabase } from './supabase';
import OpenAIWithRateLimit from './openAIWithRateLimit';

// ============================================================================
// LESSON SERVICE FOR ACTUAL DATABASE SCHEMA
// ============================================================================

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
  difficulty_rank: number; // Changed from string to number to match database schema
  created_at: string;
}

export interface LessonExercise {
  id: string;
  lesson_id: string;
  exercise_type: 'flashcard_match' | 'multiple_choice' | 'fill_in_blank' | 'typing' | 'sentence_ordering' | 'memory_game' | 'word_scramble' | 'speed_challenge';
  exercise_data: any; // JSONB data
  order_index: number;
  points: number;
  created_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  started_at: string;
  completed_at?: string;
  total_score: number;
  max_possible_score: number;
  exercise_completed?: number;
  total_exercises?: number;
  time_spent_seconds?: number;
  status: string;
}

export interface AILessonResponse {
  lesson: {
    title: string;
    subject: string;
    source_pdf_name: string;
    native_language: string;
    estimated_duration: number;
    difficulty_level: 'beginner' | 'intermediate' | 'expert';
    status: 'ready';
  };
  vocabulary: Array<{
    english_term: string;
    definition: string;
    native_translation: string;
    example_sentence_en: string;
    example_sentence_native: string;
    difficulty_rank: string; // Keep as string in AI response, convert to number when saving to DB
  }>;
  exercises: Array<{
    exercise_type: 'flashcard_match' | 'multiple_choice' | 'fill_in_blank' | 'typing' | 'sentence_ordering' | 'memory_game' | 'word_scramble' | 'speed_challenge';
    order_index: number;
    points: number;
    exercise_data: any;
  }>;
}

export class LessonService {
  /**
   * Convert difficulty string to number for database storage
   */
  private static convertDifficultyToNumber(difficulty: string): number {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 1;
      case 'intermediate':
        return 2;
      case 'advanced':
        return 3;
      default:
        return 1; // Default to beginner
    }
  }

  /**
   * Generate a lesson from PDF content using AI
   */
  static async generateLessonFromPDF(
    pdfText: string,
    sourcePdfName: string,
    userId: string,
    nativeLanguage: string,
    subject: string
  ): Promise<Lesson | null> {
    try {
      console.log('🚀 Starting lesson generation from PDF:', sourcePdfName);
      
      // Call AI to generate lesson content
      const aiResponse = await this.callAIGenerateLesson(pdfText, sourcePdfName, nativeLanguage, subject);
      
      if (!aiResponse) {
        throw new Error('Failed to generate lesson content from AI');
      }

      // Create lesson in database
      const lesson = await this.createLesson(userId, aiResponse.lesson);
      if (!lesson) {
        throw new Error('Failed to create lesson in database');
      }

      // Create vocabulary items
      await this.createLessonVocabulary(lesson.id, aiResponse.vocabulary);

      // Create exercises
      await this.createLessonExercises(lesson.id, aiResponse.exercises);

      console.log('✅ Lesson generated successfully:', lesson.id);
      return lesson;

    } catch (error) {
      console.error('❌ Error generating lesson from PDF:', error);
      throw error;
    }
  }

  /**
   * Call AI to generate lesson content using two-stage approach
   */
  private static async callAIGenerateLesson(
    pdfText: string,
    sourcePdfName: string,
    nativeLanguage: string,
    subject: string
  ): Promise<AILessonResponse | null> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      console.log('🔍 STAGE 1: Extracting ALL distinct keywords from PDF...');
      
      // STAGE 1: Extract ALL distinct keywords first
      const keywordPrompt = `You are an expert content analyzer specializing in extracting ALL distinct technical terms and key concepts from academic materials.

TASK: Analyze the provided PDF text and extract EVERY distinct technical term, concept, and key word that would be valuable for language learning.

REQUIREMENTS:
- Extract ALL technical terms, anatomical terms, medical procedures, scientific concepts
- Include both simple and complex terminology
- Cover ALL major topics mentioned in the PDF
- Don't skip any important concepts - be thorough and exhaustive
- Include related terms, synonyms, and variations
- Extract terms from every section and subsection
- Focus on terms that would be challenging for non-native English speakers
- NO LIMITS on the number of terms - extract everything you find

OUTPUT FORMAT: Return ONLY a JSON array of strings with ALL distinct terms found:

[
  "term1",
  "term2",
  "term3",
  ...
]

PDF Text to analyze:
${pdfText}

Subject: ${subject}

Extract ALL distinct technical terms and concepts:`;

      console.log('🔍 DEBUG: Making keyword extraction API call with rate limiting...');
      console.log('🔍 DEBUG: API Key length:', apiKey ? apiKey.length : 'undefined');
      console.log('🔍 DEBUG: API Key starts with:', apiKey ? apiKey.substring(0, 7) + '...' : 'undefined');
      
      // Initialize rate-limited OpenAI client
      const openai = new OpenAIWithRateLimit({ apiKey });
      
      try {
        // Use rate-limited OpenAI client for keyword extraction
        const keywordResponse = await openai.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert content analyzer. Extract ALL distinct technical terms and return them in a JSON array format.'
            },
            {
              role: 'user',
              content: keywordPrompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.1,
          priority: 1 // High priority for keyword extraction
        });
        
        const keywordContent = keywordResponse.content;
        
        if (!keywordContent) {
          throw new Error('No response content from OpenAI keyword extraction');
        }
        
        // Parse the keywords
        let allKeywords: string[] = [];
        try {
          const keywordJson = JSON.parse(keywordContent);
          // Handle different possible response formats
          if (Array.isArray(keywordJson)) {
            allKeywords = keywordJson;
          } else if (keywordJson.terms && Array.isArray(keywordJson.terms)) {
            allKeywords = keywordJson.terms;
          } else if (keywordJson.keywords && Array.isArray(keywordJson.keywords)) {
            allKeywords = keywordJson.keywords;
          } else {
            // Try to find any array in the response
            const values = Object.values(keywordJson);
            for (const value of values) {
              if (Array.isArray(value)) {
                allKeywords = value;
                break;
              }
            }
          }
        } catch (parseError) {
          console.error('Failed to parse keywords:', parseError);
          // Fallback: try to extract terms from the raw text
          const fallbackKeywords = this.extractKeywordsFallback(pdfText);
          allKeywords = fallbackKeywords;
        }

        console.log(`✅ STAGE 1 COMPLETE: Extracted ${allKeywords.length} distinct keywords`);
        console.log('🔍 Sample keywords:', allKeywords.slice(0, 20));

        if (allKeywords.length === 0) {
          throw new Error('No keywords could be extracted from the PDF');
        }

        // STAGE 2: Build comprehensive lesson using ALL extracted keywords
        console.log('🚀 STAGE 2: Building comprehensive lesson with all keywords...');
        
        const lessonPrompt = `You are an AI English language lesson generator specializing in comprehensive content extraction. 
Your task is to create an extensive, interactive, Duolingo-style lesson that teaches non-native speakers English subject-specific terminology.

CRITICAL REQUIREMENT: Use ALL the provided keywords to create the most comprehensive lesson possible.

=====================
INPUTS YOU WILL RECEIVE:
- Complete list of ALL extracted keywords from the PDF
- User's native language
- Subject name
- Source PDF file name

=====================
OUTPUT REQUIREMENTS:
You must return ONLY a single JSON object with three top-level keys:
- "lesson"
- "vocabulary"
- "exercises"

CRITICAL: Return ONLY valid JSON. Do not include any explanations, markdown, or text outside the JSON object.
The response must start with { and end with }.

=====================
1. LESSON OBJECT:
{
  "lesson": {
    "title": "string (comprehensive, descriptive title covering the full scope)",
    "subject": "string (subject name from input)",
    "source_pdf_name": "string (filename provided)",
    "native_language": "string (from input)",
    "estimated_duration": "integer (minutes, scale with content - aim for 60+ minutes for comprehensive content)",
    "difficulty_level": "beginner|intermediate|advanced",
    "status": "ready"
  }
}

=====================
2. VOCABULARY LIST - USE ALL KEYWORDS:
You MUST create vocabulary items for EVERY keyword provided. Do not skip any terms.

Each vocabulary item must include:
{
  "vocabulary": [
    {
      "english_term": "string (one of the provided keywords)",
      "definition": "string (clear, detailed English explanation)",
      "native_translation": "string (accurate translation in user's native language)",
      "example_sentence_en": "string (contextual example sentence)",
      "example_sentence_native": "string (translation of example sentence)",
      "difficulty_rank": "beginner|intermediate|advanced"
    }
  ]
}

VOCABULARY REQUIREMENTS:
- Create vocabulary items for EVERY keyword provided
- Ensure comprehensive coverage of all extracted terms
- Provide accurate definitions and translations
- Include contextual example sentences

=====================
3. EXERCISES ARRAY - COMPREHENSIVE PRACTICE:
Generate exercises to thoroughly practice ALL vocabulary items.
Create multiple exercise sets to cover different groups of terms.

EXERCISE TYPES TO INCLUDE:
- flashcard_match → match native language terms to English translations (multiple sets)
- multiple_choice → select correct English translation from native term (multiple questions)
- fill_in_blank → choose the missing English word from native context (multiple sentences)
- typing → type the English word from the native translation (multiple terms)
- sentence_ordering → arrange words to form correct English sentences
- word_association → connect related terms
- definition_matching → match terms to definitions

EXERCISE REQUIREMENTS:
- Create enough exercises to practice ALL vocabulary items
- Group terms logically for different exercise sets
- Ensure every term appears in multiple exercises
- Scale exercise count with vocabulary size
- IMPORTANT: Questions should present native language terms, answers should be English translations
- Users are learning English, so they should see native terms and select/type English equivalents

EXERCISE DATA STRUCTURE REQUIREMENTS:
For flashcard_match exercises, use this exact structure:
{
  "exercise_data": {
    "terms": [
      {
        "english_term": "Heart",
        "native_translation": "قلب"
      }
    ],
    "prompt": "Match the English terms with their native language translations"
  }
}

CRITICAL: Do NOT use "definition" field in exercises. Use ONLY:
- "english_term" for the English medical/scientific term
- "native_translation" for the translation in the user's native language

For multiple_choice exercises, use this structure:
{
  "exercise_data": {
    "question": "What is the English translation of 'قلب'?",
    "correct_answer": "Heart",
    "options": ["Heart", "Brain", "Lung", "Liver"],
    "prompt": "Select the correct English translation"
  }
}

=====================
FINAL OUTPUT FORMAT:
{
  "lesson": { ... },
  "vocabulary": [ ... ],
  "exercises": [ ... ]
}

=====================
CRITICAL RULES:
- Use EVERY keyword provided - do not skip any terms
- Create vocabulary items for ALL extracted terms
- Generate exercises that practice every vocabulary item
- Scale lesson duration and exercise count with vocabulary size
- Be comprehensive and thorough in coverage
- Focus on effective language learning for non-native speakers
- RETURN ONLY VALID JSON - NO EXPLANATIONS OR EXTRA TEXT

Now create a comprehensive lesson using ALL these keywords:

ALL EXTRACTED KEYWORDS: ${JSON.stringify(allKeywords)}
Subject: ${subject}
Native Language: ${nativeLanguage}
Source PDF Name: ${sourcePdfName}`;

        // Make the lesson generation request using rate-limited client
        console.log('🔍 DEBUG: Making lesson generation API call with rate limiting...');
        console.log('🔍 DEBUG: Lesson prompt length:', lessonPrompt.length);
        
        const lessonResponse = await openai.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational content designer. You MUST return ONLY valid JSON with no explanations, markdown, or text outside the JSON object. Your response must start with { and end with }.'
            },
            {
              role: 'user',
              content: lessonPrompt
            }
          ],
          max_tokens: 8000,
          temperature: 0.3,
          priority: 1 // High priority for lesson generation
        });

        const lessonContent = lessonResponse.content;
        
        if (!lessonContent) {
          throw new Error('No response content from OpenAI lesson generation');
        }

        console.log('✅ STAGE 2 COMPLETE: Lesson generated successfully');
        
        // Parse the lesson response with better error handling
        try {
          console.log('🔍 DEBUG: Raw lesson response length:', lessonContent.length);
          console.log('🔍 DEBUG: First 500 chars of response:', lessonContent.substring(0, 500));
          console.log('🔍 DEBUG: Last 500 chars of response:', lessonContent.substring(Math.max(0, lessonContent.length - 500)));
          
          // Try to clean the response if it has extra text
          let cleanedContent = lessonContent;
          
          // Remove any text before the first {
          const firstBrace = cleanedContent.indexOf('{');
          if (firstBrace > 0) {
            cleanedContent = cleanedContent.substring(firstBrace);
            console.log('🔍 DEBUG: Removed text before first brace');
          }
          
          // Remove any text after the last }
          const lastBrace = cleanedContent.lastIndexOf('}');
          if (lastBrace > 0 && lastBrace < cleanedContent.length - 1) {
            cleanedContent = cleanedContent.substring(0, lastBrace + 1);
            console.log('🔍 DEBUG: Removed text after last brace');
          }
          
          // Try to parse the cleaned content
          const lessonJson = JSON.parse(cleanedContent);
          console.log('✅ Successfully parsed lesson JSON');
          return lessonJson as AILessonResponse;
          
        } catch (parseError) {
          console.error('❌ Failed to parse lesson response:', parseError);
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
          console.error('🔍 DEBUG: Parse error details:', errorMessage);
          
          // Try to extract JSON using regex as last resort
          try {
            const jsonMatch = lessonContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              console.log('🔍 DEBUG: Attempting regex JSON extraction...');
              const extractedJson = JSON.parse(jsonMatch[0]);
              console.log('✅ Successfully extracted JSON using regex');
              return extractedJson as AILessonResponse;
            }
          } catch (regexError) {
            console.error('❌ Regex extraction also failed:', regexError);
          }
          
          throw new Error(`Invalid lesson response format from OpenAI: ${errorMessage}`);
        }
        
      } catch (error: any) {
        console.error('❌ Error in AI lesson generation:', error);
        
        // Provide clearer error messages for different scenarios
        if (error.message?.includes('quota exceeded') || error.message?.includes('billing')) {
          throw new Error('Your OpenAI account has run out of credits. Please add more credits to continue generating lessons.');
        } else if (error.message?.includes('Rate limit exceeded')) {
          console.log('🚫 Rate limit detected, this will be handled by the rate limiter');
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error calling AI to generate lesson:', error);
      throw error;
    }
  }

  /**
   * Create lesson in database
   */
  private static async createLesson(userId: string, lessonData: AILessonResponse['lesson']): Promise<Lesson | null> {
    try {
      const { data, error } = await supabase
        .from('esp_lessons')
        .insert([{
          user_id: userId,
          title: lessonData.title,
          subject: lessonData.subject,
          source_pdf_name: lessonData.source_pdf_name,
          native_language: lessonData.native_language,
          estimated_duration: lessonData.estimated_duration,
          difficulty_level: lessonData.difficulty_level,
          status: lessonData.status
        }])
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error creating lesson:', error);
      return null;
    }
  }

  /**
   * Create vocabulary items for a lesson
   */
  private static async createLessonVocabulary(lessonId: string, vocabulary: AILessonResponse['vocabulary']): Promise<void> {
    try {
      const vocabularyData = vocabulary.map(item => ({
        lesson_id: lessonId,
        english_term: item.english_term,
        definition: item.definition,
        native_translation: item.native_translation,
        example_sentence_en: item.example_sentence_en,
        example_sentence_native: item.example_sentence_native,
        difficulty_rank: this.convertDifficultyToNumber(item.difficulty_rank)
      }));

      const { error } = await supabase
        .from('lesson_vocabulary')
        .insert(vocabularyData);

      if (error) throw error;
      console.log(`✅ Created ${vocabularyData.length} vocabulary items`);

    } catch (error) {
      console.error('Error creating lesson vocabulary:', error);
      throw error;
    }
  }

  /**
   * Create exercises for a lesson
   */
  private static async createLessonExercises(lessonId: string, exercises: AILessonResponse['exercises']): Promise<void> {
    try {
      const exerciseData = exercises.map(exercise => ({
        lesson_id: lessonId,
        exercise_type: exercise.exercise_type,
        exercise_data: exercise.exercise_data,
        order_index: exercise.order_index,
        points: exercise.points
      }));

      const { error } = await supabase
        .from('lesson_exercises')
        .insert(exerciseData);

      if (error) throw error;
      console.log(`✅ Created ${exerciseData.length} exercises`);

    } catch (error) {
      console.error('Error creating lesson exercises:', error);
      throw error;
    }
  }

  /**
   * Get lesson by ID with all related data
   */
  static async getLesson(lessonId: string): Promise<{
    lesson: Lesson;
    vocabulary: LessonVocabulary[];
    exercises: LessonExercise[];
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

      // Get exercises
      const { data: exercises, error: exerciseError } = await supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');

      if (exerciseError) throw exerciseError;

      return {
        lesson,
        vocabulary: vocabulary || [],
        exercises: exercises || []
      };

    } catch (error) {
      console.error('Error getting lesson:', error);
      return null;
    }
  }

  /**
   * Get lessons by user
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
   * Get lesson progress for a user
   */
  static async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;

    } catch (error) {
      console.error('Error getting lesson progress:', error);
      return null;
    }
  }

  /**
   * Create or update lesson progress
   */
  static async updateLessonProgress(userId: string, lessonId: string, progress: Partial<LessonProgress>): Promise<void> {
    try {
      // First check if progress record already exists
      const existingProgress = await this.getLessonProgress(userId, lessonId);
      
      if (existingProgress) {
        // Update existing record - only update fields that exist in the schema
        const updateData: any = {};
        if (progress.total_score !== undefined) updateData.total_score = progress.total_score;
        if (progress.max_possible_score !== undefined) updateData.max_possible_score = progress.max_possible_score;
        if (progress.exercise_completed !== undefined) updateData.exercises_completed = progress.exercise_completed;
        if (progress.total_exercises !== undefined) updateData.total_exercises = progress.total_exercises;
        if (progress.time_spent_seconds !== undefined) updateData.time_spent_seconds = progress.time_spent_seconds;
        if (progress.status !== undefined) updateData.status = progress.status;
        if (progress.completed_at !== undefined) updateData.completed_at = progress.completed_at;
        
        const { error } = await supabase
          .from('lesson_progress')
          .update(updateData)
          .eq('user_id', userId)
          .eq('lesson_id', lessonId);

        if (error) throw error;
      } else {
        // Create new record with required fields
        const { error } = await supabase
          .from('lesson_progress')
          .insert([{
            user_id: userId,
            lesson_id: lessonId,
            started_at: new Date().toISOString(),
            total_score: progress.total_score || 0,
            max_possible_score: progress.max_possible_score || 0,
            exercises_completed: progress.exercise_completed || 0,
            total_exercises: progress.total_exercises || 0,
            time_spent_seconds: progress.time_spent_seconds || 0,
            status: progress.status || 'in_progress'
          }]);

        if (error) throw error;
      }

    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  }

  /**
   * Delete lesson and all related data
   */
  static async deleteLesson(lessonId: string): Promise<void> {
    try {
      // Delete in order due to foreign key constraints
      await supabase.from('lesson_exercises').delete().eq('lesson_id', lessonId);
      await supabase.from('lesson_vocabulary').delete().eq('lesson_id', lessonId);
      await supabase.from('lesson_progress').delete().eq('lesson_id', lessonId);
      await supabase.from('esp_lessons').delete().eq('id', lessonId);

      console.log('✅ Lesson deleted successfully');

    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  }

  /**
   * Fallback method to extract keywords if OpenAI parsing fails
   */
  private static extractKeywordsFallback(pdfText: string): string[] {
    console.log('⚠️ Using fallback keyword extraction...');
    
    // Simple regex-based extraction for technical terms
    const technicalTerms = new Set<string>();
    
    // Extract capitalized words (likely proper nouns/technical terms)
    const capitalizedWords = pdfText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    capitalizedWords.forEach(word => {
      if (word.length > 2 && !['The', 'This', 'That', 'These', 'Those', 'When', 'Where', 'Which', 'What', 'How'].includes(word)) {
        technicalTerms.add(word.toLowerCase());
      }
    });
    
    // Extract words that appear multiple times (likely important terms)
    const wordCounts = new Map<string, number>();
    const words = pdfText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    words.forEach(word => {
      if (!['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
    
    // Add frequently occurring words
    wordCounts.forEach((count, word) => {
      if (count >= 3 && word.length >= 4) {
        technicalTerms.add(word);
      }
    });
    
    const extractedTerms = Array.from(technicalTerms);
    console.log(`📝 Fallback extracted ${extractedTerms.length} terms`);
    return extractedTerms.slice(0, 100); // Limit to 100 terms max
  }
}
