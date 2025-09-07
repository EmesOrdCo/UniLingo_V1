import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import OpenAI from 'openai';
import OpenAIWithRateLimit from './openAIWithRateLimit';
import { UserFlashcardService } from './userFlashcardService';
import { ENV } from './envConfig';
import { CostEstimator } from './costEstimator';
import { supabase } from './supabase';

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
  front: string;
  back: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
  example?: string;
  pronunciation?: string;
  tags?: string[];
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
    onProgress?: (progress: UploadProgress) => void
  ): Promise<GeneratedFlashcard[]> {
    try {

      
      onProgress?.({
        stage: 'generating',
        progress: 0,
        message: topic === 'AI Selection' ? 'Analyzing content structure and detecting topics...' : 'Analyzing content with AI...',
      });

      // Check if API key is available
      console.log('Checking OpenAI API key...');
      console.log('Environment variables available:', Object.keys(process.env).filter(key => key.includes('OPENAI')));

      let prompt: string;
      
      if (topic === 'AI Selection') {
        // AI Selection mode - analyze content and detect topics
        prompt = `
          Analyze the following academic text and automatically detect natural topic divisions based on headers, sections, and content themes.
          
          Subject: ${subject}
          User's Native Language: ${nativeLanguage}
          
          Text content:
          ${text}
          
          First, analyze the content structure and identify 3-8 main topics. Then generate flashcards organized by these topics.
          
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
              "tags": ["tag1", "tag2"]
            }
          ]
          
          Guidelines for AI Selection mode:
          - Analyze headers, section titles, and content structure
          - Identify natural topic divisions (e.g., "Introduction", "Key Concepts", "Common Prefixes", "Common Suffixes")
          - Create MINIMUM 10 and MAXIMUM 40 flashcards total, distributed across detected topics
          - Each topic should have at least 3-5 flashcards, with larger topics having more
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
          Analyze the following academic text and generate flashcards for key terminology and concepts.
          
          Subject: ${subject}
          Topic: ${topic}
          User's Native Language: ${nativeLanguage}
          
          Text content:
          ${text}
          
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
              "tags": ["tag2"]
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
      
      // Add timeout to prevent hanging on AI request
      const completion = await Promise.race([
        client.createChatCompletion({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI request timed out after 60 seconds')), 60000)
        )
      ]);
      console.log('OpenAI response received');
      


      onProgress?.({
        stage: 'generating',
        progress: 50,
        message: topic === 'AI Selection' ? 'Processing AI response and organizing by detected topics...' : 'Processing AI response...',
      });

      const responseText = completion.content;
      if (!responseText) {
        throw new Error('No response from AI');
      }

      // Parse the JSON response
      let flashcards: GeneratedFlashcard[];
      try {
        // Extract JSON from the response (AI might wrap it in markdown)
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          flashcards = JSON.parse(jsonMatch[0]);
          
          // Debug: Log examples to see what AI is generating
          console.log('🔍 AI Generated Examples Debug:');
          flashcards.forEach((card, index) => {
            console.log(`Card ${index + 1}: "${card.front}"`);
            console.log(`  Example: "${card.example || 'NO EXAMPLE PROVIDED'}"`);
          });
        } else {
          throw new Error('Invalid JSON format in AI response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Raw AI response:', responseText);
        throw new Error('Failed to parse AI-generated flashcards');
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
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    try {
      onProgress?.({
        stage: 'processing',
        progress: 0,
        message: 'Saving flashcards to database...',
      });

      const totalCards = flashcards.length;
      
      for (let i = 0; i < totalCards; i++) {
        const card = flashcards[i];
        
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
        
        await UserFlashcardService.createUserFlashcard({
          user_id: userId,
          subject: subject,
          topic: card.topic,
          front: card.front,
          back: card.back,
          difficulty: card.difficulty,
          example: example,
          pronunciation: card.pronunciation || '',
          tags: card.tags || [],
          native_language: nativeLanguage,
          show_native_language: showNativeLanguage
        });

        const progress = Math.round(((i + 1) / totalCards) * 100);
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
}
