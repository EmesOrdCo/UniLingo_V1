import { supabase } from './supabase';
import OpenAIWithRateLimit from './openAIWithRateLimit';

// ============================================================================
// IMPROVED LESSON SERVICE WITH BETTER STRUCTURE AND QUALITY
// ============================================================================

export interface ImprovedLesson {
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

export interface ImprovedLessonVocabulary {
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

export interface ImprovedLessonExercise {
  id: string;
  lesson_id: string;
  exercise_type: 'flashcard_match' | 'multiple_choice' | 'fill_in_blank' | 'typing' | 'sentence_ordering' | 'memory_game' | 'word_scramble' | 'speed_challenge';
  exercise_data: ImprovedExerciseData;
  order_index: number;
  points: number;
  created_at: string;
}

// Improved exercise data structure with consistent format
export interface ImprovedExerciseData {
  prompt: string;
  instructions?: string;
  questions: ExerciseQuestion[];
  metadata?: {
    vocabulary_terms_used: string[];
    difficulty_adjustment?: number;
    time_estimate?: number;
  };
}

export interface ExerciseQuestion {
  id: string;
  question: string;
  correct_answer: string;
  options?: string[];
  explanation?: string;
  vocabulary_term?: string;
  difficulty?: number;
}

export interface ImprovedAILessonResponse {
  lesson: {
    title: string;
    subject: string;
    source_pdf_name: string;
    native_language: string;
    estimated_duration: number;
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    status: 'ready';
  };
  vocabulary: Array<{
    english_term: string;
    definition: string;
    native_translation: string;
    example_sentence_en: string;
    example_sentence_native: string;
    difficulty_rank: string;
  }>;
  exercises: Array<{
    exercise_type: 'flashcard_match' | 'multiple_choice' | 'fill_in_blank' | 'typing' | 'sentence_ordering' | 'memory_game' | 'word_scramble' | 'speed_challenge';
    order_index: number;
    points: number;
    exercise_data: ImprovedExerciseData;
  }>;
}

export class ImprovedLessonService {
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
   * Generate a lesson from PDF content using improved AI prompts
   */
  static async generateLessonFromPDF(
    pdfText: string,
    sourcePdfName: string,
    userId: string,
    nativeLanguage: string,
    subject: string
  ): Promise<ImprovedLesson | null> {
    try {
      console.log('🚀 Starting IMPROVED lesson generation from PDF:', sourcePdfName);
      console.log('🔍 DEBUG: Function parameters:', { sourcePdfName, userId, nativeLanguage, subject });
      console.log('🔍 DEBUG: PDF text length:', pdfText.length);
      
      // Call AI to generate improved lesson content
      console.log('🔍 DEBUG: About to call callImprovedAIGenerateLesson...');
      const aiResponse = await this.callImprovedAIGenerateLesson(pdfText, sourcePdfName, nativeLanguage, subject);
      console.log('🔍 DEBUG: callImprovedAIGenerateLesson completed, response:', !!aiResponse);
      
      if (!aiResponse) {
        throw new Error('Failed to generate improved lesson content from AI');
      }

      // Create lesson in database
      console.log('🔍 DEBUG: About to create lesson in database...');
      const lesson = await this.createImprovedLesson(userId, aiResponse.lesson);
      if (!lesson) {
        throw new Error('Failed to create improved lesson in database');
      }
      console.log('🔍 DEBUG: Lesson created in database:', lesson.id);

      // Create vocabulary items
      console.log('🔍 DEBUG: About to create vocabulary items...');
      await this.createImprovedLessonVocabulary(lesson.id, aiResponse.vocabulary);

      // Create exercises with improved structure
      console.log('🔍 DEBUG: About to create exercises...');
      await this.createImprovedLessonExercises(lesson.id, aiResponse.exercises);

      console.log('✅ IMPROVED lesson generated successfully:', lesson.id);
      return lesson;

    } catch (error) {
      console.error('❌ CRITICAL ERROR in generateLessonFromPDF:', error);
      console.error('🔍 DEBUG: Error stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('🔍 DEBUG: Error name:', error instanceof Error ? error.name : 'No name');
      console.error('🔍 DEBUG: Error message:', error instanceof Error ? error.message : String(error));
      
      // Try emergency lesson creation as absolute last resort
      try {
        console.log('🚨 Attempting emergency lesson creation...');
        const emergencyLesson = await this.createEmergencyLesson(userId, sourcePdfName, nativeLanguage, subject, pdfText);
        if (emergencyLesson) {
          console.log('🚨 Emergency lesson created successfully, returning it instead of throwing error');
          return emergencyLesson;
        }
      } catch (emergencyError) {
        console.error('🚨 Emergency lesson creation also failed:', emergencyError);
      }
      
      throw error;
    }
  }

  /**
   * Call AI to generate improved lesson content with better structure
   */
  private static async callImprovedAIGenerateLesson(
    pdfText: string,
    sourcePdfName: string,
    nativeLanguage: string,
    subject: string
  ): Promise<ImprovedAILessonResponse | null> {
    try {
      console.log('🔍 DEBUG: callImprovedAIGenerateLesson started');
      console.log('🔍 DEBUG: Parameters:', { sourcePdfName, nativeLanguage, subject });
      console.log('🔍 DEBUG: PDF text length:', pdfText.length);
      
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      console.log('🔍 DEBUG: OpenAI API key found');

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

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY a JSON array of strings
- Do NOT include any explanations, markdown, or text outside the JSON
- The response must start with [ and end with ]
- Do NOT use backticks, code blocks, or any markdown formatting
- Do NOT add any formatting or extra text
- Return raw, unformatted JSON only

REQUIRED FORMAT:
[
  "term1",
  "term2",
  "term3"
]

PDF Text to analyze:
${pdfText}

Subject: ${subject}

Extract ALL distinct technical terms and concepts. Return ONLY the JSON array:`;

      // Initialize rate-limited OpenAI client
      const openai = new OpenAIWithRateLimit({ apiKey });
      
      try {
        // Use rate-limited OpenAI client for keyword extraction
        const keywordResponse = await openai.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert content analyzer. You MUST return ONLY a JSON array of strings with no explanations, markdown, or text outside the JSON. Your response must start with [ and end with ]. Do NOT use backticks, code blocks, or any markdown formatting. Return raw JSON only. IMPORTANT: Do not wrap your response in any formatting characters.'
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
        
                 // Parse the keywords with robust error handling
         let allKeywords: string[] = [];
         try {
           console.log('🔍 DEBUG: About to start keyword parsing...');
           console.log('🔍 DEBUG: Raw keyword response length:', keywordContent.length);
           console.log('🔍 DEBUG: First 200 chars of response:', keywordContent.substring(0, 200));
           console.log('🔍 DEBUG: Last 200 chars of response:', keywordContent.substring(Math.max(0, keywordContent.length - 200)));
           
           // NUCLEAR DEBUGGING: Log every character that might be problematic
           console.log('🔍 NUCLEAR DEBUG: Checking for problematic characters...');
           const problematicChars = [];
           for (let i = 0; i < keywordContent.length; i++) {
             const char = keywordContent[i];
             if (char === '`' || char === '```' || char === '```json' || char === '```json\n') {
               problematicChars.push({ position: i, char: char, context: keywordContent.substring(Math.max(0, i-10), i+10) });
             }
           }
           if (problematicChars.length > 0) {
             console.log('🔍 NUCLEAR DEBUG: Found problematic characters:', problematicChars);
           }
           
           // Try multiple cleaning strategies
           console.log('🔍 DEBUG: About to call cleanAIResponse...');
           let cleanedContent = this.cleanAIResponse(keywordContent);
           console.log('🔍 DEBUG: cleanAIResponse completed, cleaned content length:', cleanedContent.length);
           console.log('🔍 DEBUG: Cleaned content using centralized function');
           
           // If the first cleaning attempt doesn't work, try more aggressive cleaning
           if (!cleanedContent.includes('[') && !cleanedContent.includes('{')) {
             console.log('🔍 DEBUG: First cleaning failed, trying more aggressive approach...');
             cleanedContent = this.cleanAIResponse(keywordContent.replace(/[`'"]/g, ''));
           }
           
           // Try to parse the cleaned content
           console.log('🔍 DEBUG: About to call JSON.parse with cleaned content...');
           console.log('🔍 DEBUG: Cleaned content to parse:', cleanedContent);
           const keywordJson = JSON.parse(cleanedContent);
           console.log('✅ Successfully parsed keywords JSON');
          
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
          console.error('❌ CRITICAL: Failed to parse keywords:', parseError);
          console.error('🔍 DEBUG: Parse error type:', typeof parseError);
          console.error('🔍 DEBUG: Parse error constructor:', parseError?.constructor?.name);
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
          console.error('🔍 DEBUG: Parse error details:', errorMessage);
          console.error('🔍 DEBUG: Parse error stack:', parseError instanceof Error ? parseError.stack : 'No stack trace');
          console.error('🔍 DEBUG: Raw content that failed to parse:', keywordContent);
          console.error('🔍 DEBUG: Raw content length:', keywordContent.length);
          console.error('🔍 DEBUG: Raw content first 500 chars:', keywordContent.substring(0, 500));
          console.error('🔍 DEBUG: Raw content last 500 chars:', keywordContent.substring(Math.max(0, keywordContent.length - 500)));
          
          // Try to extract JSON using regex as last resort
          try {
            // Use the centralized cleaning function
            const cleanedContent = this.cleanAIResponse(keywordContent);
            const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              console.log('🔍 DEBUG: Attempting regex JSON extraction...');
              const extractedJson = JSON.parse(jsonMatch[0]);
              console.log('✅ Successfully extracted keywords using regex');
              
              if (Array.isArray(extractedJson)) {
                allKeywords = extractedJson;
              } else if (extractedJson.terms && Array.isArray(extractedJson.terms)) {
                allKeywords = extractedJson.terms;
              } else if (extractedJson.keywords && Array.isArray(extractedJson.keywords)) {
                allKeywords = extractedJson.keywords;
              }
            }
          } catch (regexError) {
            console.error('❌ Regex extraction also failed:', regexError);
          }
          
          // Try even more aggressive extraction if regex failed
          if (allKeywords.length === 0) {
            try {
              console.log('🔍 DEBUG: Attempting ultra-aggressive JSON extraction...');
              // Try to find any array-like structure
              const ultraCleaned = keywordContent
                .replace(/[`'"]/g, '') // Remove all quotes and backticks
                .replace(/[^\w\s\[\]{},.-]/g, '') // Keep only safe characters
                .replace(/\s+/g, ' '); // Normalize whitespace
              
              const ultraMatch = ultraCleaned.match(/\[[\s\S]*\]/);
              if (ultraMatch) {
                console.log('🔍 DEBUG: Found potential JSON with ultra-cleaning');
                const extractedJson = JSON.parse(ultraMatch[0]);
                if (Array.isArray(extractedJson)) {
                  allKeywords = extractedJson;
                  console.log('✅ Successfully extracted keywords with ultra-cleaning');
                }
              }
            } catch (ultraError) {
              console.error('❌ Ultra-aggressive extraction also failed:', ultraError);
            }
          }
          
          // If all parsing attempts failed, use fallback
          if (allKeywords.length === 0) {
            console.log('🔄 Using fallback keyword extraction');
            const fallbackKeywords = this.extractKeywordsFallback(pdfText);
            allKeywords = fallbackKeywords;
          }
          
                     // Nuclear option: if even fallback failed, try to extract from the AI response itself
           if (allKeywords.length === 0) {
             console.log('☢️ Using nuclear keyword extraction from AI response...');
             try {
               // Try to extract any words that look like technical terms from the AI response
               const words = keywordContent.split(/\s+/);
               const potentialTerms = words
                 .filter(word => {
                   // Must be at least 4 characters and look like a technical term
                   if (word.length < 4) return false;
                   if (!/^[a-zA-Z-]+$/.test(word)) return false;
                   
                   // Filter out common words
                   const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'with', 'this', 'that', 'they', 'have', 'from', 'will', 'would', 'could', 'should', 'what', 'when', 'where', 'why', 'which', 'there', 'their', 'here', 'been', 'being', 'over', 'under', 'above', 'below', 'between', 'among', 'through', 'during', 'before', 'after', 'while', 'since', 'until', 'unless', 'although', 'because', 'however', 'therefore', 'moreover', 'furthermore', 'nevertheless', 'consequently', 'accordingly', 'meanwhile', 'otherwise', 'likewise', 'similarly', 'additionally', 'further', 'besides', 'moreover', 'furthermore', 'in', 'on', 'at', 'by', 'to', 'of', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now'];
                   if (commonWords.includes(word.toLowerCase())) return false;
                   
                   return true;
                 })
                 .slice(0, 25); // Take first 25 potential terms
               
               if (potentialTerms.length > 0) {
                 allKeywords = potentialTerms;
                 console.log(`☢️ Nuclear extraction found ${potentialTerms.length} potential terms from AI response`);
                 console.log('🔍 Sample nuclear terms:', potentialTerms.slice(0, 10));
               }
             } catch (nuclearError) {
               console.error('☢️ Nuclear extraction failed:', nuclearError);
             }
           }
           
           // FINAL NUCLEAR OPTION: Try to extract ANY array-like structure from the corrupted response
           if (allKeywords.length === 0) {
             console.log('☢️ FINAL NUCLEAR: Attempting to extract ANY array structure...');
             try {
               // Look for any pattern that looks like an array
               const arrayPatterns = [
                 /\[[^\]]*\]/g,  // Simple arrays
                 /\[[^\[\]]*\[[^\[\]]*\]/g,  // Nested arrays
                 /\[[^\[\]]*"[^"]*"[^\[\]]*\]/g,  // Arrays with quotes
               ];
               
               for (const pattern of arrayPatterns) {
                 const matches = keywordContent.match(pattern);
                 if (matches && matches.length > 0) {
                   console.log('☢️ FINAL NUCLEAR: Found potential array pattern:', matches[0]);
                   try {
                     // Try to clean and parse this pattern
                     const cleanedPattern = matches[0].replace(/[`'"]/g, '').replace(/```/g, '');
                     const parsed = JSON.parse(cleanedPattern);
                     if (Array.isArray(parsed)) {
                       allKeywords = parsed;
                       console.log('☢️ FINAL NUCLEAR: Successfully extracted array!');
                       break;
                     }
                                        } catch (parseError) {
                       const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
                       console.log('☢️ FINAL NUCLEAR: Pattern found but failed to parse:', errorMessage);
                     }
                 }
               }
             } catch (finalNuclearError) {
               console.error('☢️ FINAL NUCLEAR: All extraction methods failed:', finalNuclearError);
             }
           }
          
                     // Log a warning about the parsing issue
           console.warn('⚠️ Keyword parsing failed, but fallback extraction was successful. This may indicate AI response formatting issues (backticks, markdown).');
           
           // Additional debugging information
           console.log('🔍 DEBUG: Final fallback keywords count:', allKeywords.length);
           console.log('🔍 DEBUG: Sample fallback keywords:', allKeywords.slice(0, 5));
           
           // CRITICAL: If we have keywords from fallback, don't throw an error
           if (allKeywords.length > 0) {
             console.log('✅ SUCCESS: Fallback extraction provided keywords, continuing with lesson generation');
           }
         }

        console.log(`✅ STAGE 1 COMPLETE: Extracted ${allKeywords.length} distinct keywords`);
        console.log('🔍 Sample keywords:', allKeywords.slice(0, 20));

        // Final safety check - ensure we have keywords
        if (allKeywords.length === 0) {
          console.error('❌ CRITICAL: All keyword extraction methods failed!');
          console.error('🔍 DEBUG: Raw AI response:', keywordContent);
          console.error('🔍 DEBUG: This indicates a severe issue with the AI response format');
          
          // Last resort: create a minimal set of keywords from the PDF text
          console.log('🆘 Using emergency keyword extraction...');
          const emergencyKeywords = this.extractEmergencyKeywords(pdfText);
          allKeywords = emergencyKeywords;
          
          if (allKeywords.length === 0) {
            throw new Error('CRITICAL: All keyword extraction methods failed. The AI response appears to be completely malformed.');
          }
        }
        
        // Ensure we have a reasonable number of keywords
        if (allKeywords.length < 5) {
          console.warn('⚠️ Warning: Very few keywords extracted. This may affect lesson quality.');
          // Try to supplement with more terms from the PDF
          const additionalTerms = this.extractKeywordsFallback(pdfText);
                     allKeywords = Array.from(new Set([...allKeywords, ...additionalTerms]));
          console.log(`🔄 Supplemented keywords to ${allKeywords.length} total terms`);
        }

        // STAGE 2: Build comprehensive lesson using ALL extracted keywords with IMPROVED structure
        console.log('🚀 STAGE 2: Building IMPROVED comprehensive lesson with all keywords...');
        
        const improvedLessonPrompt = `You are an AI English language lesson generator specializing in creating HIGH-QUALITY, STRUCTURED educational content.
Your task is to create an extensive, interactive lesson that teaches non-native speakers English subject-specific terminology.

CRITICAL REQUIREMENT: Use ALL the provided keywords to create the most comprehensive lesson possible with CONSISTENT, HIGH-QUALITY exercise structure.

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
Do NOT use backticks, code blocks, or any markdown formatting.
Return raw, unformatted JSON only.

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
3. EXERCISES ARRAY - IMPROVED STRUCTURE:
Generate exercises with CONSISTENT, HIGH-QUALITY structure. Each exercise must follow this exact format:

{
  "exercises": [
    {
      "exercise_type": "flashcard_match|multiple_choice|fill_in_blank|typing|sentence_ordering|memory_game|word_scramble|speed_challenge",
      "order_index": "integer (1, 2, 3, etc.)",
      "points": "integer (1-5 points per exercise)",
      "exercise_data": {
        "prompt": "string (clear instruction for the exercise)",
        "instructions": "string (optional additional guidance)",
        "questions": [
          {
            "id": "string (unique identifier)",
            "question": "string (the actual question)",
            "correct_answer": "string (the right answer)",
            "options": ["array", "of", "answer", "choices"] (for multiple choice),
            "explanation": "string (optional explanation of the answer)",
            "vocabulary_term": "string (which vocabulary term this question tests)",
            "difficulty": "integer (1-5 difficulty rating)"
          }
        ],
        "metadata": {
          "vocabulary_terms_used": ["array", "of", "terms"],
          "difficulty_adjustment": "integer (optional difficulty modifier)",
          "time_estimate": "integer (seconds per question)"
        }
      }
    }
  ]
}

EXERCISE REQUIREMENTS:
- Create 8-12 exercises total
- Each exercise should test 5-10 vocabulary terms
- Ensure every vocabulary term appears in multiple exercises
- Use consistent question structure within each exercise type
- Include clear prompts and instructions
- Add metadata for better tracking and analytics

EXERCISE TYPE SPECIFICATIONS:

1. FLASHCARD_MATCH:
   - Prompt: "Match each English term with its correct translation"
   - Questions: One per vocabulary term
   - Options: Include 3-4 wrong answers per question

2. MULTIPLE_CHOICE:
   - Prompt: "Choose the correct definition for each term"
   - Questions: One per vocabulary term
   - Options: 4 choices per question

3. FILL_IN_BLANK:
   - Prompt: "Complete the sentence with the correct term"
   - Questions: Use example sentences from vocabulary
   - Options: 4-5 choices per question

4. TYPING:
   - Prompt: "Type the English term for each translation"
   - Questions: One per vocabulary term
   - No options needed (user types answer)

5. SENTENCE_ORDERING:
   - Prompt: "Arrange the words to form a complete sentence"
   - Questions: Use example sentences from vocabulary
   - Provide scrambled word order

6. MEMORY_GAME:
   - Prompt: "Find matching pairs of terms and definitions"
   - Questions: Group related terms together
   - Create pairs for matching

7. WORD_SCRAMBLE:
   - Prompt: "Unscramble the letters to form the correct term"
   - Questions: One per vocabulary term
   - Scramble the English terms

8. SPEED_CHALLENGE:
   - Prompt: "Quickly identify the correct term"
   - Questions: Simple recognition questions
   - Focus on speed and accuracy

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
- Generate exercises with CONSISTENT, STRUCTURED format
- Follow the exact exercise_data structure provided
- Include metadata for better tracking
- Scale lesson duration and exercise count with vocabulary size
- Be comprehensive and thorough in coverage
- Focus on effective language learning for non-native speakers
- RETURN ONLY VALID JSON - NO EXPLANATIONS OR EXTRA TEXT
- Do NOT use backticks, code blocks, or any markdown formatting
- Return raw, unformatted JSON only

Now create a comprehensive, STRUCTURED lesson using ALL these keywords:

ALL EXTRACTED KEYWORDS: ${JSON.stringify(allKeywords)}
Subject: ${subject}
Native Language: ${nativeLanguage}
Source PDF Name: ${sourcePdfName}`;

        // Make the lesson generation request using rate-limited client
        console.log('🔍 DEBUG: Making IMPROVED lesson generation API call with rate limiting...');
        console.log('🔍 DEBUG: Improved lesson prompt length:', improvedLessonPrompt.length);
        
        const lessonResponse = await openai.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational content designer. You MUST return ONLY valid JSON with no explanations, markdown, or text outside the JSON object. Your response must start with { and end with }. Do NOT use backticks, code blocks, or any markdown formatting. Return raw JSON only. IMPORTANT: Do not wrap your response in any formatting characters. Follow the EXACT structure specified in the prompt.'
            },
            {
              role: 'user',
              content: improvedLessonPrompt
            }
          ],
          max_tokens: 12000, // Increased for better structure
          temperature: 0.2, // Lower temperature for more consistent output
          priority: 1 // High priority for lesson generation
        });

        const lessonContent = lessonResponse.content;
        
        if (!lessonContent) {
          throw new Error('No response content from OpenAI improved lesson generation');
        }

        console.log('✅ STAGE 2 COMPLETE: IMPROVED lesson generated successfully');
        
        // Parse the lesson response with better error handling
        try {
          console.log('🔍 DEBUG: Raw improved lesson response length:', lessonContent.length);
          console.log('🔍 DEBUG: First 500 chars of response:', lessonContent.substring(0, 500));
          console.log('🔍 DEBUG: Last 500 chars of response:', lessonContent.substring(Math.max(0, lessonContent.length - 500)));
          
          // Use the centralized cleaning function
          let cleanedContent = this.cleanAIResponse(lessonContent);
          console.log('🔍 DEBUG: Cleaned content using centralized function');
          
          // Try to parse the cleaned content
          const lessonJson = JSON.parse(cleanedContent);
          console.log('✅ Successfully parsed IMPROVED lesson JSON');
          
          // Validate the structure
          this.validateImprovedLessonStructure(lessonJson);
          
          return lessonJson as ImprovedAILessonResponse;
          
        } catch (parseError) {
          console.error('❌ Failed to parse improved lesson response:', parseError);
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
          console.error('🔍 DEBUG: Parse error details:', errorMessage);
          console.error('🔍 DEBUG: Raw content that failed to parse:', lessonContent);
          
          // Try to extract JSON using regex as last resort
          try {
            // Use the centralized cleaning function
            const cleanedContent = this.cleanAIResponse(lessonContent);
            const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              console.log('🔍 DEBUG: Attempting regex JSON extraction...');
              const extractedJson = JSON.parse(jsonMatch[0]);
              console.log('✅ Successfully extracted JSON using regex');
              
              // Validate the structure
              this.validateImprovedLessonStructure(extractedJson);
              
              return extractedJson as ImprovedAILessonResponse;
            }
          } catch (regexError) {
            console.error('❌ Regex extraction also failed:', regexError);
          }
          
          throw new Error(`Invalid improved lesson response format from OpenAI. This may be due to markdown formatting (backticks) in the response. Error: ${errorMessage}`);
        }
        
      } catch (error: any) {
        console.error('❌ Error in AI improved lesson generation:', error);
        
        // Provide clearer error messages for different scenarios
        if (error.message?.includes('quota exceeded') || error.message?.includes('billing')) {
          throw new Error('Your OpenAI account has run out of credits. Please add more credits to continue generating lessons.');
        } else if (error.message?.includes('Rate limit exceeded')) {
          console.log('🚫 Rate limit detected, this will be handled by the rate limiter');
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Error calling AI to generate improved lesson:', error);
      throw error;
    }
  }

  /**
   * Validate the improved lesson structure
   */
  private static validateImprovedLessonStructure(lessonData: any): void {
    if (!lessonData.lesson || !lessonData.vocabulary || !lessonData.exercises) {
      throw new Error('Invalid lesson structure: missing required top-level keys');
    }
    
    if (!Array.isArray(lessonData.vocabulary) || lessonData.vocabulary.length === 0) {
      throw new Error('Invalid lesson structure: vocabulary must be a non-empty array');
    }
    
    if (!Array.isArray(lessonData.exercises) || lessonData.exercises.length === 0) {
      throw new Error('Invalid lesson structure: exercises must be a non-empty array');
    }
    
    // Validate each exercise has the required structure
    lessonData.exercises.forEach((exercise: any, index: number) => {
      if (!exercise.exercise_data || !exercise.exercise_data.questions) {
        throw new Error(`Invalid exercise structure at index ${index}: missing exercise_data or questions`);
      }
      
      if (!Array.isArray(exercise.exercise_data.questions) || exercise.exercise_data.questions.length === 0) {
        throw new Error(`Invalid exercise structure at index ${index}: questions must be a non-empty array`);
      }
    });
    
    console.log('✅ IMPROVED lesson structure validation passed');
  }

     /**
    * ULTRA-AGGRESSIVE AI response cleaning with comprehensive debugging
    */
   private static cleanAIResponse(content: string): string {
     console.log('🧹 STARTING ULTRA-AGGRESSIVE CLEANING');
     console.log('🔍 Original content length:', content.length);
     console.log('🔍 Original content preview (first 200 chars):', content.substring(0, 200));
     console.log('🔍 Original content preview (last 200 chars):', content.substring(Math.max(0, content.length - 200)));
     
     let cleaned = content;
     let cleaningStep = 0;
     
     // STEP 1: Remove all types of backticks and markdown
     cleaningStep++;
     console.log(`🧹 STEP ${cleaningStep}: Removing backticks and markdown`);
     cleaned = cleaned.replace(/```json\s*/g, '');
     cleaned = cleaned.replace(/```\s*/g, '');
     cleaned = cleaned.replace(/`/g, '');
     
     // NUCLEAR CLEANING: Remove any remaining problematic characters
     cleaned = cleaned.replace(/[`'"]/g, '');
     cleaned = cleaned.replace(/```/g, '');
     cleaned = cleaned.replace(/``/g, '');
     
     console.log(`   After step ${cleaningStep}:`, cleaned.substring(0, 100));
    
    // STEP 2: Remove any text before the first bracket/brace
    cleaningStep++;
    console.log(`🧹 STEP ${cleaningStep}: Removing text before JSON`);
    const firstBracket = cleaned.indexOf('[');
    const firstBrace = cleaned.indexOf('{');
    if (firstBracket > 0 && (firstBrace === -1 || firstBracket < firstBrace)) {
      cleaned = cleaned.substring(firstBracket);
      console.log(`   Found first bracket at position ${firstBracket}, removed text before it`);
    } else if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
      console.log(`   Found first brace at position ${firstBrace}, removed text before it`);
    } else {
      console.log(`   ⚠️ No JSON brackets found! Content:`, cleaned.substring(0, 100));
    }
    
    // STEP 3: Remove any text after the last bracket/brace
    cleaningStep++;
    console.log(`🧹 STEP ${cleaningStep}: Removing text after JSON`);
    const lastBracket = cleaned.lastIndexOf(']');
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBracket > 0 && (lastBrace === -1 || lastBracket > lastBrace)) {
      cleaned = cleaned.substring(0, lastBracket + 1);
      console.log(`   Found last bracket at position ${lastBracket}, removed text after it`);
    } else if (lastBrace > 0) {
      cleaned = cleaned.substring(0, lastBrace + 1);
      console.log(`   Found last brace at position ${lastBrace}, removed text after it`);
    }
    
    // STEP 4: Remove trailing commas
    cleaningStep++;
    console.log(`🧹 STEP ${cleaningStep}: Removing trailing commas`);
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // STEP 5: Ultra-aggressive cleaning for edge cases
    cleaningStep++;
    console.log(`🧹 STEP ${cleaningStep}: Ultra-aggressive cleaning`);
    cleaned = cleaned.replace(/^[^[{]*/, '');
    cleaned = cleaned.replace(/[^}\]]*$/, '');
    
    // STEP 6: Remove control characters and normalize whitespace
    cleaningStep++;
    console.log(`🧹 STEP ${cleaningStep}: Removing control characters`);
    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // STEP 7: Final safety cleaning
    cleaningStep++;
    console.log(`🧹 STEP ${cleaningStep}: Final safety cleaning`);
    cleaned = cleaned.replace(/^\s*```\s*/, '');
    cleaned = cleaned.replace(/\s*```\s*$/, '');
    cleaned = cleaned.replace(/^\s*`\s*/, '');
    cleaned = cleaned.replace(/\s*`\s*$/, '');
    
    console.log('🧹 CLEANING COMPLETE');
    console.log('🔍 Final cleaned content length:', cleaned.length);
    console.log('🔍 Final cleaned content preview (first 200 chars):', cleaned.substring(0, 200));
    console.log('🔍 Final cleaned content preview (last 200 chars):', cleaned.substring(Math.max(0, cleaned.length - 200)));
    
    // VALIDATION: Check if we still have JSON structure
    if (!cleaned.includes('[') && !cleaned.includes('{')) {
      console.error('❌ CRITICAL: Cleaning removed ALL JSON structure!');
      console.error('🔍 This indicates the AI response is completely malformed');
      console.error('🔍 Original content:', content);
      console.error('🔍 Cleaned content:', cleaned);
    }
    
    return cleaned.trim();
  }

  /**
   * Nuclear-level keyword extraction when all other methods fail
   */
  private static extractNuclearKeywords(pdfText: string): string[] {
    console.log('☢️ NUCLEAR KEYWORD EXTRACTION ACTIVATED');
    console.log('🔍 PDF text length:', pdfText.length);
    console.log('🔍 PDF text preview:', pdfText.substring(0, 200));
    
    // Extract any words that look like technical terms
    const words = pdfText.split(/\s+/);
    console.log('🔍 Total words found:', words.length);
    
    const technicalTerms = words
      .filter(word => {
        // Must be at least 3 characters
        if (word.length < 3) return false;
        
        // Must contain only letters and possibly hyphens
        if (!/^[a-zA-Z-]+$/.test(word)) return false;
        
        // Filter out very common words
        const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'with', 'this', 'that', 'they', 'have', 'from', 'will', 'would', 'could', 'should', 'what', 'when', 'where', 'why', 'which', 'there', 'their', 'here', 'been', 'being', 'over', 'under', 'above', 'below', 'between', 'among', 'through', 'during', 'before', 'after', 'while', 'since', 'until', 'unless', 'although', 'because', 'however', 'therefore', 'moreover', 'furthermore', 'nevertheless', 'consequently', 'accordingly', 'meanwhile', 'otherwise', 'likewise', 'similarly', 'additionally', 'further', 'besides', 'moreover', 'furthermore', 'in', 'on', 'at', 'by', 'to', 'of', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now'];
        if (commonWords.includes(word.toLowerCase())) return false;
        
        return true;
      })
      .slice(0, 25); // Take first 25 terms
    
    console.log(`☢️ Nuclear extraction found ${technicalTerms.length} terms`);
    console.log('🔍 Sample nuclear terms:', technicalTerms.slice(0, 10));
    
    return technicalTerms;
  }

  /**
   * Intelligent fallback keyword extraction from PDF
   */
  private static extractKeywordsFallback(pdfText: string): string[] {
    console.log('🔄 Using intelligent fallback keyword extraction');
    console.log('🔍 PDF text length:', pdfText.length);
    
    // More intelligent fallback keyword extraction
    const words = pdfText.split(/\s+/);
         const uniqueWords = Array.from(new Set(words));
    console.log('🔍 Unique words found:', uniqueWords.length);
    
    // Filter for meaningful terms
    const meaningfulTerms = uniqueWords
      .filter(word => {
        // Must be at least 4 characters
        if (word.length < 4) return false;
        
        // Must be only letters (no numbers or special chars)
        if (!/^[a-zA-Z]+$/.test(word)) return false;
        
        // Filter out common stop words
        const stopWords = [
          'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
        ];
        if (stopWords.includes(word.toLowerCase())) return false;
        
        return true;
      })
      .sort((a, b) => b.length - a.length); // Sort by length (longer words first)
    
    // Take the most meaningful terms
    const selectedTerms = meaningfulTerms.slice(0, 30);
    
    console.log(`🔄 Fallback extracted ${selectedTerms.length} meaningful terms`);
    console.log('🔍 Sample fallback terms:', selectedTerms.slice(0, 10));
    
    return selectedTerms;
  }



  /**
   * Emergency keyword extraction when all other methods fail
   */
  private static extractEmergencyKeywords(pdfText: string): string[] {
    console.log('🆘 Using emergency keyword extraction - this should never happen normally');
    
    // Extract any words that look like technical terms
    const words = pdfText.split(/\s+/);
    const technicalTerms = words
      .filter(word => {
        // Must be at least 3 characters
        if (word.length < 3) return false;
        
        // Must contain only letters and possibly hyphens
        if (!/^[a-zA-Z-]+$/.test(word)) return false;
        
        // Filter out very common words
        const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'with', 'this', 'that', 'they', 'have', 'from', 'will', 'would', 'could', 'should', 'what', 'when', 'where', 'why', 'which', 'there', 'their', 'here', 'been', 'being', 'over', 'under', 'above', 'below', 'between', 'among', 'through', 'during', 'before', 'after', 'while', 'since', 'until', 'unless', 'although', 'because', 'however', 'therefore', 'moreover', 'furthermore', 'nevertheless', 'consequently', 'accordingly', 'meanwhile', 'otherwise', 'likewise', 'similarly', 'additionally', 'further', 'besides', 'moreover', 'furthermore', 'in', 'on', 'at', 'by', 'to', 'of', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now'];
        if (commonWords.includes(word.toLowerCase())) return false;
        
        return true;
      })
      .slice(0, 20); // Take first 20 terms
    
    console.log(`🆘 Emergency extraction found ${technicalTerms.length} terms`);
    return technicalTerms;
  }



  /**
   * Create improved lesson in database
   */
  private static async createImprovedLesson(userId: string, lessonData: ImprovedAILessonResponse['lesson']): Promise<ImprovedLesson | null> {
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
      console.error('Error creating improved lesson:', error);
      return null;
    }
  }

  /**
   * Create improved vocabulary items for a lesson
   */
  private static async createImprovedLessonVocabulary(lessonId: string, vocabulary: ImprovedAILessonResponse['vocabulary']): Promise<void> {
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
      console.log(`✅ Created ${vocabularyData.length} improved vocabulary items`);

    } catch (error) {
      console.error('Error creating improved lesson vocabulary:', error);
      throw error;
    }
  }

  /**
   * Create improved exercises for a lesson
   */
  private static async createImprovedLessonExercises(lessonId: string, exercises: ImprovedAILessonResponse['exercises']): Promise<void> {
    try {
      const exerciseData = exercises.map(exercise => ({
        lesson_id: lessonId,
        exercise_type: exercise.exercise_type,
        content: exercise.exercise_data, // Use 'content' to match existing database
        points: exercise.points || 10
      }));

      const { error } = await supabase
        .from('lesson_exercises')
        .insert(exerciseData);

      if (error) throw error;
      console.log(`✅ Created ${exerciseData.length} improved exercises`);

    } catch (error) {
      console.error('Error creating improved lesson exercises:', error);
      throw error;
    }
  }

  /**
   * Get improved lesson by ID with all related data
   */
  static async getImprovedLesson(lessonId: string): Promise<{
    lesson: ImprovedLesson;
    vocabulary: ImprovedLessonVocabulary[];
    exercises: ImprovedLessonExercise[];
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
        .order('created_at'); // Use created_at since order_index doesn't exist

      if (exerciseError) throw exerciseError;

      return {
        lesson,
        vocabulary: vocabulary || [],
        exercises: exercises || []
      };

    } catch (error) {
      console.error('Error getting improved lesson:', error);
      return null;
    }
  }

  /**
   * Get improved lessons by user
   */
  static async getUserImprovedLessons(userId: string): Promise<ImprovedLesson[]> {
    try {
      const { data, error } = await supabase
        .from('esp_lessons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error getting user improved lessons:', error);
      return [];
    }
  }

  /**
   * EMERGENCY FALLBACK: Create a minimal lesson when all else fails
   */
  private static async createEmergencyLesson(
    userId: string,
    sourcePdfName: string,
    nativeLanguage: string,
    subject: string,
    pdfText: string
  ): Promise<ImprovedLesson | null> {
    try {
      console.log('🚨 EMERGENCY: Creating minimal lesson as last resort...');
      
      // Extract basic terms from PDF text
      const emergencyTerms = this.extractEmergencyKeywords(pdfText);
      console.log('🚨 Emergency terms extracted:', emergencyTerms.length);
      
      // Create a minimal lesson structure
      const emergencyLessonData = {
        title: `Emergency ${subject} Lesson`,
        subject: subject,
        source_pdf_name: sourcePdfName,
        native_language: nativeLanguage,
        estimated_duration: 30,
        difficulty_level: 'beginner' as const,
        status: 'ready' as const
      };
      
      // Create lesson in database
      const lesson = await this.createImprovedLesson(userId, emergencyLessonData);
      if (!lesson) {
        throw new Error('Failed to create emergency lesson in database');
      }
      
      // Create minimal vocabulary
      const emergencyVocabulary = emergencyTerms.slice(0, 10).map((term, index) => ({
        english_term: term,
        definition: `Emergency definition for ${term}`,
        native_translation: `[${nativeLanguage} translation needed]`,
        example_sentence_en: `This is an example sentence using ${term}.`,
        example_sentence_native: `[${nativeLanguage} example needed]`,
        difficulty_rank: 'beginner'
      }));
      
      await this.createImprovedLessonVocabulary(lesson.id, emergencyVocabulary);
      
      // Create minimal exercise
      const emergencyExercise = {
        exercise_type: 'flashcard_match' as const,
        order_index: 1,
        points: 5,
        exercise_data: {
          prompt: 'Match the terms with their definitions',
          questions: emergencyTerms.slice(0, 5).map((term, index) => ({
            id: `emergency_${index}`,
            question: `What is ${term}?`,
            correct_answer: `Emergency definition for ${term}`,
            options: [
              `Emergency definition for ${term}`,
              'Incorrect option 1',
              'Incorrect option 2',
              'Incorrect option 3'
            ]
          }))
        }
      };
      
      await this.createImprovedLessonExercises(lesson.id, [emergencyExercise]);
      
      console.log('🚨 Emergency lesson created successfully:', lesson.id);
      return lesson;
      
    } catch (error) {
      console.error('🚨 CRITICAL: Even emergency lesson creation failed:', error);
      return null;
    }
  }
}


