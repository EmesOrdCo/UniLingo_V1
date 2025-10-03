import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import OpenAI from 'openai';
import OpenAIWithRateLimit from './openAIWithRateLimit';
import { UserFlashcardService } from './userFlashcardService';
import { ENV } from './envConfig';
import { CostEstimator } from './costEstimator';
import { supabase } from './supabase';
import BackendAIService from './backendAIService';
import { SimpleTokenTracker } from './simpleTokenTracker';

// Initialize OpenAI client with rate limiting - will be created when needed
let openai: OpenAIWithRateLimit | null = null;

function getOpenAIClient(): OpenAIWithRateLimit {
  if (!openai) {
    const apiKey = ENV.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAIWithRateLimit({
      apiKey: apiKey,
    });
  }
  return openai;
}

export interface UploadProgress {
  stage: 'uploading' | 'processing' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
  cardsGenerated?: number;
}

export interface GeneratedFlashcard {
  id?: string; // Optional ID for existing flashcards
  front: string;
  back: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
  example?: string;
  pronunciation?: string;
}

export class UploadService {
  // Track if a picker is currently active
  private static isPickerActive = false;
  private static pickerRetryCount = 0;
  private static readonly MAX_RETRIES = 3;
  
  // Force reset function for stuck pickers
  static forceResetPicker() {
    this.isPickerActive = false;
    this.pickerRetryCount = 0;
    
    // Try to clear any stuck picker instances
    try {
      // Force garbage collection if possible (this is a last resort)
      if (global.gc) {
        global.gc();
      }
    } catch (e) {
      // Silent garbage collection failure
    }
  }
  
  static async pickPDF(): Promise<DocumentPicker.DocumentPickerResult> {
    try {
      // Check if we've exceeded retry attempts
      if (this.pickerRetryCount >= this.MAX_RETRIES) {
        this.forceResetPicker();
      }
      
      // Check if another picker is already active
      if (this.isPickerActive) {
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (this.isPickerActive) {
          this.forceResetPicker();
        }
      }
      
      this.isPickerActive = true;
      this.pickerRetryCount++;
      
      try {
        // Try multiple picker strategies
        let result: DocumentPicker.DocumentPickerResult | null = null;
        let lastError: any = null;
        
        // Strategy 1: Standard PDF picker
        try {
          result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            copyToCacheDirectory: true,
            multiple: false,
          });
        } catch (error) {
          lastError = error;
          
          // Strategy 2: Wait and retry with same config
          try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            result = await DocumentPicker.getDocumentAsync({
              type: 'application/pdf',
              copyToCacheDirectory: true,
              multiple: false,
            });
          } catch (error2) {
            lastError = error2;
            
            // Strategy 3: More permissive picker
            try {
              result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
                multiple: false,
              });
            } catch (error3) {
              lastError = error3;
            }
          }
        }
        
        if (!result) {
          throw lastError || new Error('All picker strategies failed');
        }
        

        
        if (!result.assets || result.assets.length === 0) {
          throw new Error('No file selected');
        }
        
        // Validate the selected file
        const selectedFile = result.assets[0];
        if (!selectedFile.name || !selectedFile.name.toLowerCase().endsWith('.pdf')) {
          throw new Error('Please select a PDF file');
        }
        

        
        // Reset retry count on success
        this.pickerRetryCount = 0;
        return result;
        
      } finally {
        // Always reset the picker state
        this.isPickerActive = false;

      }
      
    } catch (error) {
      console.error('Error picking PDF:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Different document picking in progress')) {
          // This is the critical error - try to recover
          this.forceResetPicker();
          
          if (this.pickerRetryCount < this.MAX_RETRIES) {
            // Wait a bit and retry
            await new Promise(resolve => setTimeout(resolve, 3000));
            return this.pickPDF(); // Recursive retry
          } else {
            throw new Error('Document picker is stuck. Please restart the app and try again.');
          }
        } else if (error.message.includes('already in use')) {
          throw new Error('Document picker is busy. Please wait a moment and try again.');
        } else if (error.message.includes('Please select a PDF file')) {
          throw error; // Re-throw validation errors
        }
      }
      
      throw new Error('Failed to pick PDF file. Please ensure you have permission to access files and try again.');
    }
  }

  // PDF text extraction removed - now handled by backend API
  static async extractTextFromPDF(uri: string): Promise<string> {
    throw new Error('PDF text extraction is handled by backend API. Please use the API-based flow.');
  }

  static async generateFlashcards(
    text: string,
    subject: string,
    topic: string,
    nativeLanguage: string,
    showNativeLanguage: boolean = false,
    onProgress?: (progress: UploadProgress) => void,
    abortSignal?: AbortSignal,
    isCancelled?: () => boolean,
    userId?: string
  ): Promise<GeneratedFlashcard[]> {
    let aiTimeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Validate subject
      if (!subject || subject === 'General') {
        throw new Error('Subject not configured. Please contact customer support to set up your learning subject.');
      }

      // Validate userId
      if (!userId) {
        throw new Error('User ID is required for AI flashcard generation');
      }

      onProgress?.({
        stage: 'generating',
        progress: 0,
        message: topic === 'AI Selection' ? 'Analyzing content structure and detecting topics...' : 'Analyzing content with AI...',
      });

      // Try backend AI service first
      try {
        console.log('🤖 Attempting to use backend AI service...');
        const backendResult = await BackendAIService.generateFlashcards(
          text, 
          subject, 
          topic, 
          userId, 
          nativeLanguage, 
          showNativeLanguage
        );
        
        if (backendResult.success && backendResult.flashcards) {
          console.log('✅ Backend AI service successful');
          onProgress?.({
            stage: 'completed',
            progress: 100,
            message: `Generated ${backendResult.flashcards.length} flashcards`,
            cardsGenerated: backendResult.flashcards.length
          });
          
          // Convert backend format to frontend format
          return backendResult.flashcards.map((card: any) => ({
            front: card.front || card.term,
            back: card.back || card.definition,
            subject: card.subject || subject,
            topic: card.topic || topic,
            difficulty: card.difficulty || 'beginner',
            example: card.example,
            pronunciation: card.pronunciation
          }));
        }
      } catch (backendError) {
        console.warn('⚠️ Backend AI service failed, falling back to direct OpenAI:', backendError);
      }

      // Fallback to direct OpenAI (existing logic)
      console.log('🔄 Using direct OpenAI as fallback...');
      console.log('Checking OpenAI API key...');
      console.log('Environment variables available:', Object.keys(process.env).filter(key => key.includes('OPENAI')));

      let prompt: string;
      
      if (topic === 'AI Selection') {
        // AI Selection mode - analyze content and detect topics
        prompt = `
          Analyze the following ${subject} text and automatically detect natural topic divisions based on headers, sections, and content themes.
          
          Subject: ${subject}
          User's Native Language: ${nativeLanguage}
          
          Text content:
          ${text}
          
          First, analyze the content structure and identify 3-8 main topics. Then generate flashcards organized by these topics.
          
          Focus on extracting ALL important ${subject} terminology, concepts, and vocabulary from this content.
          
          CRITICAL INSTRUCTION: You MUST create terminology flashcards with English terms on the front and ${nativeLanguage} translations on the back. DO NOT put English definitions on the back.
          
          EXAMPLE SENTENCE GUIDELINES:
          - MANDATORY: Every flashcard MUST have an example sentence
          - The example sentence MUST contain the exact front term
          - Keep sentences simple and clear
          - Make the target term the main focus of the sentence
          - Use contextually relevant examples from the academic field
          - Avoid overly complex medical/scientific jargon in examples
          - Prioritize relevance over simplicity (better to be slightly complex but relevant than simple but irrelevant)
          - Examples should help students understand how the term is used in practice
          
          Generate flashcards in the following JSON format:
          [
            {
              "front": "English terminology or concept",
              "back": "${nativeLanguage} translation ONLY (no English)",
              "topic": "Detected topic name based on content analysis",
              "difficulty": "beginner|intermediate|expert",
              "example": "MANDATORY: Example sentence in English that MUST contain the front term",
              "pronunciation": "Optional pronunciation guide for English term",
            }
          ]
          
          Guidelines for AI Selection mode:
          - Analyze headers, section titles, and content structure
          - Identify natural topic divisions (e.g., "Introduction", "Key Concepts", "Common Prefixes", "Common Suffixes")
          - Create MINIMUM 10 and MAXIMUM 40 flashcards total, distributed across detected topics
          - CRITICAL: Each topic MUST have at least 5 flashcards - NO EXCEPTIONS
          - If you cannot create 5+ flashcards for a topic, merge it with another topic
          - Focus on KEY TERMINOLOGY and IMPORTANT CONCEPTS from the text
          - Front: English term/concept (e.g., "Cardiology", "Inflammation", "Surgical removal")
          - Back: ${nativeLanguage} translation of the English term
          - Example: MUST include a clear, simple example sentence in English that demonstrates how the term is used in context. The example MUST contain the exact front term. Keep the sentence straightforward with the target term being the main focus, but prioritize relevance over simplicity
          - Vary difficulty levels appropriately for each topic
          - Make cards suitable for language learning and terminology study
          - Ensure accuracy and educational value
          - Use descriptive topic names that reflect the actual content structure
        `;
      } else {
        // Standard topic mode
        prompt = `
          Analyze the following ${subject} text and generate flashcards for key terminology and concepts.
          
          Subject: ${subject}
          Topic: ${topic}
          User's Native Language: ${nativeLanguage}
          
          Text content:
          ${text}
          
          Focus on extracting ALL important ${subject} terminology, concepts, and vocabulary from this content.
          
          CRITICAL INSTRUCTION: You MUST create terminology flashcards with English terms on the front and ${nativeLanguage} translations on the back. DO NOT put English definitions on the back.
          
          EXAMPLE SENTENCE GUIDELINES:
          - MANDATORY: Every flashcard MUST have an example sentence
          - The example sentence MUST contain the exact front term
          - Keep sentences simple and clear
          - Make the target term the main focus of the sentence
          - Use contextually relevant examples from the academic field
          - Avoid overly complex medical/scientific jargon in examples
          - Prioritize relevance over simplicity (better to be slightly complex but relevant than simple but irrelevant)
          - Examples should help students understand how the term is used in practice
          
          Generate flashcards in the following JSON format:
          [
            {
              "front": "English terminology or concept",
              "back": "${nativeLanguage} translation ONLY (no English)",
              "topic": "${topic}",
              "difficulty": "beginner|intermediate|expert",
              "example": "MANDATORY: Example sentence in English that MUST contain the front term",
              "pronunciation": "Optional pronunciation guide for English term",
            }
          ]
          
          Guidelines:
          - Create MINIMUM 10 and MAXIMUM 40 flashcards depending on content length and complexity
          - Focus on KEY TERMINOLOGY and IMPORTANT CONCEPTS from the text
          - Front: English term/concept (e.g., "Cardiology", "Inflammation", "Surgical removal")
          - Back: ${nativeLanguage} translation of the English term
          - Example: MUST include a clear, simple example sentence in English that demonstrates how the term is used in context. The example MUST contain the exact front term. Keep the sentence straightforward with the target term being the main focus, but prioritize relevance over simplicity
          - Vary difficulty levels appropriately
          - Make cards suitable for language learning and terminology study
          - Ensure accuracy and educational value
        `;
      }


      
      console.log('Sending request to OpenAI...');
      const client = getOpenAIClient();
      
      // Prepare messages for cost estimation
      const systemPrompt = showNativeLanguage 
        ? `You are an expert language learning content creator. You MUST create terminology flashcards with ${nativeLanguage} terms on the front and English translations on the back. NEVER put ${nativeLanguage} definitions on the back - only English translations. ALWAYS include simple, relevant example sentences in ${nativeLanguage} that demonstrate how each term is used in context. Each example sentence MUST contain the exact front term. Keep examples straightforward with the target term as the main focus, but prioritize relevance over simplicity.`
        : `You are an expert language learning content creator. You MUST create terminology flashcards with English terms on the front and ${nativeLanguage} translations on the back. NEVER put English definitions on the back - only ${nativeLanguage} translations. ALWAYS include simple, relevant example sentences in English that demonstrate how each term is used in context. Each example sentence MUST contain the exact front term. Keep examples straightforward with the target term as the main focus, but prioritize relevance over simplicity.`;

      const messages = [
        {
          role: 'system',
          content: systemPrompt
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
      
      // Check if cancelled before starting AI request
      if (abortSignal?.aborted || isCancelled?.()) {
        throw new Error('Request cancelled');
      }
      
      // Add timeout to prevent hanging on AI request
      let aiTimeoutId: NodeJS.Timeout | null = null;
      const completion = await Promise.race([
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.1,
          // Remove max_tokens to allow full responses
        }),
        new Promise((_, reject) => {
          aiTimeoutId = setTimeout(() => reject(new Error('AI request timed out after 1 hour')), 3600000);
        })
      ]);
      
      // Clear the timeout if the request completes successfully
      if (aiTimeoutId) {
        clearTimeout(aiTimeoutId);
      }
      
      // Check if cancelled after AI request
      if (abortSignal?.aborted || isCancelled?.()) {
        throw new Error('Request cancelled');
      }
      
      console.log('OpenAI response received');
      
      // Record token usage in monthly tracking
      if ('usage' in completion && completion.usage && userId) {
        try {
          await SimpleTokenTracker.recordTokenUsage(
            userId, 
            completion.usage.prompt_tokens, 
            completion.usage.completion_tokens
          );
          console.log(`📊 Recorded token usage: ${completion.usage.prompt_tokens} input, ${completion.usage.completion_tokens} output`);
        } catch (error) {
          console.error('Error recording token usage:', error);
        }
      }

      // Check if cancelled before processing AI response
      if (abortSignal?.aborted || isCancelled?.()) {
        throw new Error('Request cancelled');
      }
      
      onProgress?.({
        stage: 'generating',
        progress: 50,
        message: topic === 'AI Selection' ? 'Processing AI response and organizing by detected topics...' : 'Processing AI response...',
      });

      const responseText = (completion as any).content;
      if (!responseText) {
        throw new Error('No response from AI');
      }
      
      // Check if cancelled before parsing AI response
      if (abortSignal?.aborted || isCancelled?.()) {
        throw new Error('Request cancelled');
      }

      // Parse the JSON response
      let flashcards: GeneratedFlashcard[] = [];
      try {
        // Check if cancelled before parsing
        if (abortSignal?.aborted || isCancelled?.()) {
          throw new Error('Request cancelled');
        }
        
        console.log('🔍 Raw AI response length:', responseText.length);
        console.log('🔍 Raw AI response preview:', responseText.substring(0, 500));
        console.log('🔍 Raw AI response ending:', responseText.substring(Math.max(0, responseText.length - 500)));
        
        // Clean the response text
        let cleanedResponse = responseText.trim();
        
        // Remove markdown code blocks if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/\s*```/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/\s*```/, '');
        }
        
        // Check if response is truncated (common issue with large responses)
        if (!cleanedResponse.endsWith(']') && !cleanedResponse.endsWith('}')) {
          console.warn('⚠️ Response appears to be truncated - missing closing bracket');
          console.warn('⚠️ Last 100 characters:', cleanedResponse.substring(Math.max(0, cleanedResponse.length - 100)));
        }
        
        // Extract JSON array from the response
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          console.log('🔍 Extracted JSON length:', jsonString.length);
          console.log('🔍 Extracted JSON preview:', jsonString.substring(0, 200));
          console.log('🔍 Extracted JSON ending:', jsonString.substring(Math.max(0, jsonString.length - 200)));
          
          try {
            flashcards = JSON.parse(jsonString);
            
            // Validate flashcards structure
            if (!Array.isArray(flashcards)) {
              throw new Error('AI response is not an array');
            }
            
            console.log('✅ Successfully parsed', flashcards.length, 'flashcards');
            
            // Debug: Log examples to see what AI is generating
            console.log('🔍 AI Generated Examples Debug:');
            flashcards.forEach((card, index) => {
              console.log(`Card ${index + 1}: "${card.front}"`);
              console.log(`  Example: "${card.example || 'NO EXAMPLE PROVIDED'}"`);
            });
          } catch (jsonParseError) {
            console.error('❌ JSON parsing failed:', jsonParseError);
            console.error('❌ JSON string length:', jsonString.length);
            console.error('❌ JSON string preview:', jsonString.substring(0, 1000));
            console.log('🔄 Attempting to parse truncated response...');
            console.log('🔍 JSON string to parse:', jsonString.substring(0, 500));
            console.log('🔍 JSON string ending:', jsonString.substring(Math.max(0, jsonString.length - 500)));
            
            // Fall back to truncated response parsing
            const flashcards: any[] = [];
            let braceCount = 0;
            let currentObject = '';
            let inString = false;
            let escapeNext = false;
            
            for (let i = 0; i < jsonString.length; i++) {
              const char = jsonString[i];
              
              if (escapeNext) {
                currentObject += char;
                escapeNext = false;
                continue;
              }
              
              if (char === '\\') {
                currentObject += char;
                escapeNext = true;
                continue;
              }
              
              if (char === '"' && !escapeNext) {
                inString = !inString;
                currentObject += char;
                continue;
              }
              
              if (!inString) {
                if (char === '{') {
                  if (braceCount === 0) {
                    currentObject = '';
                  }
                  braceCount++;
                  currentObject += char;
                } else if (char === '}') {
                  braceCount--;
                  currentObject += char;
                  
                  if (braceCount === 0) {
                    // Complete object found
                    try {
                      const parsed = JSON.parse(currentObject);
                      if (parsed && typeof parsed === 'object' && parsed.front && parsed.back) {
                        flashcards.push(parsed);
                        console.log('✅ Parsed complete object:', parsed.front);
                      }
                    } catch (e) {
                      console.warn('⚠️ Failed to parse object:', currentObject.substring(0, 100));
                    }
                    currentObject = '';
                  }
                } else if (braceCount > 0) {
                  currentObject += char;
                }
              } else {
                currentObject += char;
              }
            }
            
            if (flashcards.length > 0) {
              console.log('✅ Successfully parsed', flashcards.length, 'flashcards from truncated response');
              
              // Debug: Log examples
              console.log('🔍 AI Generated Examples Debug (from truncated response):');
              flashcards.forEach((card, index) => {
                console.log(`Card ${index + 1}: "${card.front}"`);
                console.log(`  Example: "${card.example || 'NO EXAMPLE PROVIDED'}"`);
              });
            } else {
              console.error('❌ No complete flashcards found in truncated response');
              throw new Error('No complete flashcards found in truncated response');
            }
          }
        } else {
          // Try to handle truncated responses by finding incomplete JSON
          console.warn('⚠️ No complete JSON array found, attempting to parse truncated response...');
          
          // Look for the start of a JSON array
          const arrayStart = cleanedResponse.indexOf('[');
          if (arrayStart !== -1) {
            // Extract everything from the array start
            const partialJson = cleanedResponse.substring(arrayStart);
            console.log('🔍 Found partial JSON starting at position:', arrayStart);
            console.log('🔍 Partial JSON length:', partialJson.length);
            console.log('🔍 Partial JSON ending:', partialJson.substring(Math.max(0, partialJson.length - 200)));
            
            // Try to find complete objects within the partial JSON using a more robust approach
            const flashcards: any[] = [];
            let braceCount = 0;
            let currentObject = '';
            let inString = false;
            let escapeNext = false;
            
            for (let i = 0; i < partialJson.length; i++) {
              const char = partialJson[i];
              
              if (escapeNext) {
                currentObject += char;
                escapeNext = false;
                continue;
              }
              
              if (char === '\\') {
                currentObject += char;
                escapeNext = true;
                continue;
              }
              
              if (char === '"' && !escapeNext) {
                inString = !inString;
                currentObject += char;
                continue;
              }
              
              if (!inString) {
                if (char === '{') {
                  if (braceCount === 0) {
                    currentObject = '';
                  }
                  braceCount++;
                  currentObject += char;
                } else if (char === '}') {
                  braceCount--;
                  currentObject += char;
                  
                  if (braceCount === 0) {
                    // Complete object found
                    try {
                      const parsed = JSON.parse(currentObject);
                      if (parsed && typeof parsed === 'object' && parsed.front && parsed.back) {
                        flashcards.push(parsed);
                        console.log('✅ Parsed complete object:', parsed.front);
                      }
                    } catch (e) {
                      console.warn('⚠️ Failed to parse object:', currentObject.substring(0, 100));
                    }
                    currentObject = '';
                  }
                } else if (braceCount > 0) {
                  currentObject += char;
                }
              } else {
                currentObject += char;
              }
            }
            
            if (flashcards.length > 0) {
              console.log('✅ Successfully parsed', flashcards.length, 'flashcards from truncated response');
              
              // Debug: Log examples
              console.log('🔍 AI Generated Examples Debug (from truncated response):');
              flashcards.forEach((card, index) => {
                console.log(`Card ${index + 1}: "${card.front}"`);
                console.log(`  Example: "${card.example || 'NO EXAMPLE PROVIDED'}"`);
              });
            } else {
              console.error('❌ No complete objects found in truncated response');
              throw new Error('No complete flashcards found in truncated response');
            }
          } else {
            console.error('❌ No JSON array found in response');
            console.error('❌ Response length:', cleanedResponse.length);
            console.error('❌ Response preview:', cleanedResponse.substring(0, 500));
            console.error('❌ Response ending:', cleanedResponse.substring(Math.max(0, cleanedResponse.length - 500)));
            throw new Error('Invalid JSON format in AI response');
          }
        }
      } catch (parseError) {
        console.error('❌ Error parsing AI response:', parseError);
        console.error('❌ Raw AI response length:', responseText.length);
        console.error('❌ Raw AI response preview:', responseText.substring(0, 1000));
        throw new Error('Failed to parse AI-generated flashcards');
      }

      // Check if cancelled before final progress update
      if (abortSignal?.aborted || isCancelled?.()) {
        throw new Error('Request cancelled');
      }
      
      // Apply topic validation for AI Selection mode to enforce minimum keywords per topic
      if (topic === 'AI Selection') {
        flashcards = this.validateAndFixFlashcardTopics(flashcards);
      }

      onProgress?.({
        stage: 'generating',
        progress: 100,
        message: topic === 'AI Selection' 
          ? `Generated ${flashcards.length} flashcards across multiple detected topics!`
          : `Generated ${flashcards.length} flashcards!`,
        cardsGenerated: flashcards.length,
      });

      return flashcards;
    } catch (error) {
      console.error('Error generating flashcards:', error);
      
      // Clear any AI timeout that might be running
      if (aiTimeoutId) {
        clearTimeout(aiTimeoutId);
      }
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('OpenAI API key is invalid or expired. Please check your API key.');
        } else if (error.message.includes('429')) {
          throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
        } else if (error.message.includes('timeout')) {
          throw new Error('OpenAI API request timed out. Please check your internet connection and try again.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error connecting to OpenAI. Please check your internet connection.');
        }
      }
      
      throw new Error('Failed to generate flashcards with AI. Please try again.');
    }
  }

  static async saveFlashcardsToDatabase(
    flashcards: GeneratedFlashcard[],
    userId: string,
    subject: string,
    nativeLanguage: string,
    showNativeLanguage: boolean = false,
    onProgress?: (progress: UploadProgress) => void,
    isCancelled?: () => boolean
  ): Promise<void> {
    try {
      onProgress?.({
        stage: 'processing',
        progress: 0,
        message: 'Saving flashcards to database...',
      });

      // Deduplicate flashcards before saving
      const uniqueFlashcards = this.deduplicateFlashcards(flashcards);
      console.log(`🧹 Deduplicated flashcards: ${flashcards.length} → ${uniqueFlashcards.length}`);
      
      const totalCards = uniqueFlashcards.length;
      
      for (let i = 0; i < totalCards; i++) {
        // Check if cancelled before processing each card
        if (isCancelled?.()) {
          console.log('🚫 Upload cancelled during database save - stopping save process');
          throw new Error('Request cancelled');
        }
        
        const card = uniqueFlashcards[i];
        
        // Ensure example is not empty - if AI didn't provide one, create a simple one
        let example = card.example || '';
        if (!example.trim()) {
          // Create a simple, relevant example based on the term
          const term = card.front.toLowerCase();
          example = `The ${term} is essential in this field.`;
        }
        
        // Validate that example contains the front term
        if (!example.toLowerCase().includes(card.front.toLowerCase())) {
          console.warn(`⚠️ Example doesn't contain front term "${card.front}": "${example}"`);
          // Create a corrected example
          const term = card.front.toLowerCase();
          example = `The ${term} is important in this field.`;
        }
        
        if (card.id) {
          // Update existing flashcard
          await UserFlashcardService.updateUserFlashcard(card.id, {
            subject: subject,
            topic: card.topic,
            front: card.front,
            back: card.back,
            difficulty: card.difficulty,
            example: example,
            pronunciation: card.pronunciation || '',
            native_language: nativeLanguage,
            show_native_language: showNativeLanguage
          });
        } else {
          // Create new flashcard
          await UserFlashcardService.createUserFlashcard({
            user_id: userId,
            subject: subject,
            topic: card.topic,
            front: card.front,
            back: card.back,
            difficulty: card.difficulty,
            example: example,
            pronunciation: card.pronunciation || '',
            native_language: nativeLanguage,
            show_native_language: showNativeLanguage
          });
        }

        const progress = Math.round(((i + 1) / totalCards) * 100);
        
        // Check if cancelled before updating progress
        if (isCancelled?.()) {
          console.log('🚫 Upload cancelled during progress update - stopping save process');
          throw new Error('Request cancelled');
        }
        
        onProgress?.({
          stage: 'processing',
          progress,
          message: `Saving card ${i + 1} of ${totalCards}...`,
          cardsGenerated: i + 1,
        });
      }

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Successfully created ${totalCards} flashcards!`,
        cardsGenerated: totalCards,
      });
    } catch (error) {
      console.error('Error saving flashcards to database:', error);
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Failed to save flashcards to database',
      });
      throw new Error('Failed to save flashcards to database');
    }
  }

  /**
   * Deduplicate flashcards based on front text and topic
   */
  static deduplicateFlashcards(flashcards: GeneratedFlashcard[]): GeneratedFlashcard[] {
    const seen = new Set<string>();
    const unique: GeneratedFlashcard[] = [];
    
    for (const card of flashcards) {
      // Create a unique key based on front text and topic
      const key = `${card.front.toLowerCase().trim()}_${card.topic.toLowerCase().trim()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(card);
      } else {
        console.log(`🔄 Skipping duplicate flashcard: "${card.front}" in topic "${card.topic}"`);
      }
    }
    
    return unique;
  }

  /**
   * Validate and fix flashcard topics to enforce minimum 5 flashcards per topic
   */
  static validateAndFixFlashcardTopics(flashcards: GeneratedFlashcard[]): GeneratedFlashcard[] {
    try {
      console.log('🔍 Validating flashcard topics for minimum 5 flashcards per topic...');
      
      const MIN_FLASHCARDS = 5;
      
      // Clean and group flashcards by topic
      const topicGroups: { [key: string]: GeneratedFlashcard[] } = {};
      
      flashcards.forEach(card => {
        // Ensure topic is a clean string
        let topic = String(card.topic || 'General').trim();
        
        // Fix corrupted topic names that contain [object Object]
        if (topic.includes('[object Object]')) {
          topic = 'General';
        }
        
        if (!topicGroups[topic]) {
          topicGroups[topic] = [];
        }
        topicGroups[topic].push({ ...card, topic });
      });
      
      const topicNames = Object.keys(topicGroups);
      console.log(`📊 Found ${topicNames.length} topics`);
      topicNames.forEach(topic => {
        console.log(`  - ${topic}: ${topicGroups[topic].length} flashcards`);
      });
      
      // Check if all topics already have 5+ flashcards
      const allValid = topicNames.every(topic => topicGroups[topic].length >= MIN_FLASHCARDS);
      if (allValid) {
        console.log('✅ All topics already have 5+ flashcards');
        return flashcards;
      }
      
      // Find the largest topic
      let largestTopic = topicNames[0] || 'General';
      let maxSize = topicGroups[largestTopic]?.length || 0;
      
      topicNames.forEach(topic => {
        if (topicGroups[topic].length > maxSize) {
          maxSize = topicGroups[topic].length;
          largestTopic = topic;
        }
      });
      
      console.log(`🔗 Largest topic: "${largestTopic}" with ${maxSize} flashcards`);
      
      // Merge small topics into the largest one
      const result: GeneratedFlashcard[] = [];
      
      topicNames.forEach(topic => {
        const cards = topicGroups[topic];
        
        if (cards.length >= MIN_FLASHCARDS) {
          // Keep valid topics as-is
          result.push(...cards);
        } else {
          // Merge small topics into the largest topic
          console.log(`  - Merging "${topic}" (${cards.length} cards) into "${largestTopic}"`);
          const mergedCards = cards.map(card => ({ ...card, topic: largestTopic }));
          result.push(...mergedCards);
        }
      });
      
      console.log(`✅ Topic validation complete: ${result.length} flashcards`);
      return result;
      
    } catch (error) {
      console.error('❌ Error validating flashcard topics:', error);
      return flashcards; // Return original flashcards if validation fails
    }
  }
}
