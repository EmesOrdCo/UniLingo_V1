import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import OpenAI from 'openai';
import { UserFlashcardService } from './userFlashcardService';

// Initialize OpenAI client - will be created when needed
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // For web compatibility
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

  static async extractTextFromPDF(uri: string): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        throw new Error('PDF file not found');
      }

      // For now, we'll simulate text extraction with a more realistic approach
      // In a production app, you'd want to use a proper PDF parsing library
      // This is a temporary solution that provides better testing
      

      
      // Simulate processing time and return realistic sample content
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      
      // Return realistic academic content that would come from a PDF
      const sampleText = `Introduction to Medical Terminology

Medical terminology is the language used by healthcare professionals to describe the human body, medical conditions, and treatments. Understanding medical terminology is essential for effective communication in healthcare settings.

Key Concepts:
1. Root Words: The foundation of medical terms, often derived from Greek or Latin
2. Prefixes: Added to the beginning of root words to modify meaning
3. Suffixes: Added to the end of root words to indicate procedures or conditions

Common Medical Prefixes:
- "Cardio-" refers to the heart
- "Neuro-" refers to the nervous system
- "Hemo-" refers to blood
- "Osteo-" refers to bones

Common Medical Suffixes:
- "-itis" indicates inflammation
- "-ectomy" indicates surgical removal
- "-ology" indicates the study of
- "-pathy" indicates disease

Examples of Medical Terms:
- Cardiology: The study of the heart
- Neurology: The study of the nervous system
- Hematology: The study of blood
- Osteology: The study of bones

Understanding these building blocks allows healthcare professionals to break down complex medical terms and understand their meanings. This knowledge is crucial for accurate diagnosis, treatment planning, and patient communication.`;
      

      return sampleText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  static async generateFlashcards(
    text: string,
    subject: string,
    topic: string,
    nativeLanguage: string,
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
          
          Generate flashcards in the following JSON format:
          [
            {
              "front": "English terminology or concept",
              "back": "${nativeLanguage} translation ONLY (no English)",
              "topic": "Detected topic name based on content analysis",
              "difficulty": "beginner|intermediate|expert",
              "example": "Optional example sentence in English",
              "pronunciation": "Optional pronunciation guide for English term",
              "tags": ["tag1", "tag2"]
            }
          ]
          
          Guidelines for AI Selection mode:
          - Analyze headers, section titles, and content structure
          - Identify natural topic divisions (e.g., "Introduction", "Key Concepts", "Common Prefixes", "Common Suffixes")
          - Create 15-40 flashcards total, distributed across detected topics
          - Focus on KEY TERMINOLOGY and IMPORTANT CONCEPTS from the text
          - Front: English term/concept (e.g., "Cardiology", "Inflammation", "Surgical removal")
          - Back: ${nativeLanguage} translation of the English term
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
          
          Generate flashcards in the following JSON format:
          [
            {
              "front": "English terminology or concept",
              "back": "${nativeLanguage} translation ONLY (no English)",
              "topic": "${topic}",
              "difficulty": "beginner|intermediate|expert",
              "example": "Optional example sentence in English",
              "pronunciation": "Optional pronunciation guide for English term",
              "tags": ["tag2"]
            }
          ]
          
          Guidelines:
          - Create 10-30 flashcards depending on content length and complexity
          - Focus on KEY TERMINOLOGY and IMPORTANT CONCEPTS from the text
          - Front: English term/concept (e.g., "Cardiology", "Inflammation", "Surgical removal")
          - Back: ${nativeLanguage} translation of the English term
          - Vary difficulty levels appropriately
          - Make cards suitable for language learning and terminology study
          - Ensure accuracy and educational value
        `;
      }


      
      console.log('Sending request to OpenAI...');
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert language learning content creator. You MUST create terminology flashcards with English terms on the front and native language translations on the back. NEVER put English definitions on the back - only translations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      console.log('OpenAI response received');
      


      onProgress?.({
        stage: 'generating',
        progress: 50,
        message: topic === 'AI Selection' ? 'Processing AI response and organizing by detected topics...' : 'Processing AI response...',
      });

      const responseText = completion.choices[0]?.message?.content;
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
        } else {
          throw new Error('Invalid JSON format in AI response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
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
        
        await UserFlashcardService.createUserFlashcard({
          user_id: userId,
          subject: subject,
          topic: card.topic,
          front: card.front,
          back: card.back,
          difficulty: card.difficulty,
          example: card.example || '',
          pronunciation: card.pronunciation || '',
          tags: card.tags || [],
          native_language: nativeLanguage
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
