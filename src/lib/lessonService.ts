import { supabase } from './supabase';
import { ENV } from './envConfig';
import OpenAI from 'openai';
import OpenAIWithRateLimit from './openAIWithRateLimit';
import * as FileSystem from 'expo-file-system';
import { CostEstimator } from './costEstimator';
import { HolisticProgressService } from './holisticProgressService';

// Initialize OpenAI client with rate limiting
const openai = new OpenAIWithRateLimit({
  apiKey: ENV.OPENAI_API_KEY || '',
});

export interface Lesson {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  source_pdf_name: string;
  native_language: string;
  chat_content?: string; // Conversation script for this lesson
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
  keywords?: string | string[]; // Keywords for conversation exercises
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
  completed_exercises?: string[]; // Track which exercises are completed for linear progression
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
        encoding: 'base64' as any,
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
  static truncateTextForOpenAI(text: string, maxTokens: number = 50000): string {
    // Increased limit: 50,000 tokens = 200,000 characters
    const maxCharacters = maxTokens * 4;
    
    console.log(`🔍 Text length: ${text.length} chars vs ${maxCharacters} limit`);
    
    // Only truncate if necessary
    if (text.length <= maxCharacters) {
      console.log(`✅ Text within limit, no truncation needed`);
      return text;
    }
    
    const truncated = text.substring(0, maxCharacters);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > 0) {
      const result = truncated.substring(0, lastSpaceIndex) + '...';
      console.log(`✂️ Truncated: ${text.length} → ${result.length} chars`);
      return result;
    }
    
    const result = truncated + '...';
    console.log(`✂️ Truncated: ${text.length} → ${result.length} chars`);
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
      
      // Validate subject
      if (!subject || subject === 'General') {
        throw new Error('Subject not configured. Please contact customer support to set up your learning subject.');
      }
      
      console.log(`📏 Processing full text: ${pdfText.length} chars`);
      
      const prompt = `Extract ALL important ${subject} terminology, concepts, and vocabulary from this content. 
      
Include:
- Technical terms and definitions
- Key concepts and principles
- Important phrases and compound terms
- Medical/scientific terminology (if applicable)
- Return at least 50-100 terms if possible

Content: ${pdfText}`;

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
          temperature: 0.1,
      });

      const content = response.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Record token usage in monthly tracking
      if ('usage' in response && response.usage) {
        try {
          const { SimpleTokenTracker } = await import('./simpleTokenTracker');
          await SimpleTokenTracker.recordTokenUsage(
            user.id, 
            response.usage.prompt_tokens, 
            response.usage.completion_tokens
          );
          console.log(`📊 Recorded token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
        } catch (error) {
          console.error('Error recording token usage:', error);
        }
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
   * Extract keywords from PDF pages individually for large PDFs
   */
  static async extractKeywordsFromPages(
    pages: string[],
    subject: string,
    nativeLanguage: string
  ): Promise<string[]> {
    try {
      console.log(`🔍 Extracting keywords from ${pages.length} pages...`);
      
      // Validate subject
      if (!subject || subject === 'General') {
        throw new Error('Subject not configured. Please contact customer support to set up your learning subject.');
      }
      
      const allKeywords: string[] = [];
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageNumber = i + 1;
        
        console.log(`📄 Processing page ${pageNumber}/${pages.length}...`);
        
        // Skip empty pages
        if (!page || page.trim().length < 50) {
          console.log(`⚠️ Skipping empty page ${pageNumber}`);
          continue;
        }
        
        console.log(`📏 Processing full page ${pageNumber}: ${page.length} chars`);
        
        const prompt = `Extract ALL important ${subject} terminology, concepts, and vocabulary from this page. 

Page ${pageNumber} content: ${page}

Include:
- Technical terms and definitions
- Key concepts and principles  
- Important phrases and compound terms
- Medical/scientific terminology (if applicable)
- Return at least 20-50 terms per page if possible

Return ONLY a JSON array of strings with no explanations, markdown, or formatting.`;

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
          throw new Error(`Page ${pageNumber}: ${CostEstimator.getCostExceededMessage(costEstimate)}`);
        }

        console.log(`💰 Page ${pageNumber} cost estimation:`, CostEstimator.getCostInfo(costEstimate));

        const response = await openai.createChatCompletion({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.1,
        });

        const content = response.content;
        if (!content) {
          console.warn(`⚠️ No response for page ${pageNumber}, skipping`);
          continue;
        }

        // Record token usage in monthly tracking
        if ('usage' in response && response.usage) {
          try {
            const { SimpleTokenTracker } = await import('./simpleTokenTracker');
            await SimpleTokenTracker.recordTokenUsage(
              user.id, 
              response.usage.prompt_tokens, 
              response.usage.completion_tokens
            );
            console.log(`📊 Page ${pageNumber} token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
          } catch (error) {
            console.error('Error recording token usage:', error);
          }
        }

        // Clean the response
        let cleanedContent = content.trim();
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```/, '');
        }
        if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/\s*```/, '');
        }

        try {
          const pageKeywords = JSON.parse(cleanedContent);
          
          if (Array.isArray(pageKeywords)) {
            allKeywords.push(...pageKeywords);
            console.log(`✅ Page ${pageNumber}: Extracted ${pageKeywords.length} keywords`);
          } else {
            console.warn(`⚠️ Page ${pageNumber}: Invalid response format, skipping`);
          }
        } catch (parseError) {
          console.warn(`⚠️ Page ${pageNumber}: Failed to parse keywords, skipping`);
        }
      }
      
      console.log(`📊 Total keywords extracted: ${allKeywords.length}`);
      
      // Deduplicate keywords intelligently
      const deduplicatedKeywords = this.deduplicateKeywords(allKeywords);
      console.log(`🧹 After deduplication: ${deduplicatedKeywords.length} keywords`);
      
      return deduplicatedKeywords;

    } catch (error) {
      console.error('❌ Error extracting keywords from pages:', error);
      throw error;
    }
  }

  /**
   * Intelligently deduplicate keywords while preserving nested terms
   */
  static deduplicateKeywords(keywords: string[]): string[] {
    try {
      console.log('🧹 Starting intelligent keyword deduplication...');
      
      // Clean and normalize keywords
      const cleanedKeywords = keywords
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 1) // Remove single characters
        .filter(k => !/^\d+$/.test(k)); // Remove pure numbers
      
      // Remove exact duplicates
      const uniqueKeywords = [...new Set(cleanedKeywords)];
      console.log(`📊 After exact deduplication: ${uniqueKeywords.length} keywords`);
      
      // Group similar keywords (but preserve nested terms)
      const groupedKeywords: string[] = [];
      const processed = new Set<string>();
      
      for (const keyword of uniqueKeywords) {
        if (processed.has(keyword)) continue;
        
        // Find similar keywords (contained within each other)
        const similarKeywords = uniqueKeywords.filter(k => 
          k !== keyword && 
          !processed.has(k) &&
          (k.includes(keyword) || keyword.includes(k))
        );
        
        if (similarKeywords.length > 0) {
          // Keep the longest/most specific term
          const allTerms = [keyword, ...similarKeywords];
          const longestTerm = allTerms.reduce((longest, current) => 
            current.length > longest.length ? current : longest
          );
          
          groupedKeywords.push(longestTerm);
          
          // Mark all similar terms as processed
          allTerms.forEach(term => processed.add(term));
          
          console.log(`🔗 Grouped: [${allTerms.join(', ')}] → "${longestTerm}"`);
        } else {
          groupedKeywords.push(keyword);
          processed.add(keyword);
        }
      }
      
      console.log(`✅ Final deduplicated keywords: ${groupedKeywords.length}`);
      return groupedKeywords;
      
    } catch (error) {
      console.error('❌ Error deduplicating keywords:', error);
      // Return original keywords if deduplication fails
      return [...new Set(keywords.map(k => k.trim()).filter(k => k.length > 1))];
    }
  }

  /**
   * Group keywords into topics and generate topic names
   */
  static async groupKeywordsIntoTopic(
    keywords: string[],
    subject: string
  ): Promise<Array<{ topicName: string; keywords: string[] }>> {
    try {
      console.log('🔍 Grouping keywords into topics...');
      
      // Validate subject
      if (!subject || subject === 'General') {
        throw new Error('Subject not configured. Please contact customer support to set up your learning subject.');
      }
      
      const prompt = `Group these ${subject} keywords into logical topics. Each topic should have 3-30 keywords. Return ONLY a JSON array:

Keywords: ${keywords.join(', ')}

Format:
[{"topicName": "Topic Name", "keywords": ["keyword1", "keyword2", ...]}]

Requirements:
- Each topic should have 3-30 keywords
- Group related keywords together
- Create meaningful topic names based on the keywords
- Ensure all keywords are included in exactly one topic
- Let the content determine the number of topics (no fixed count)
- Return ONLY the JSON array:`;

      // Prepare messages for cost estimation
      const messages = [
        {
          role: 'system',
          content: 'You are an expert educational content organizer. You MUST return ONLY a JSON array of objects with no explanations, markdown, or text outside the JSON. Your response must start with [ and end with ]. Do NOT use backticks, code blocks, or any markdown formatting. Return raw JSON only.'
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
          temperature: 0.1,
      });

      const content = response.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Record token usage in monthly tracking
      if ('usage' in response && response.usage) {
        try {
          const { SimpleTokenTracker } = await import('./simpleTokenTracker');
          await SimpleTokenTracker.recordTokenUsage(
            user.id, 
            response.usage.prompt_tokens, 
            response.usage.completion_tokens
          );
          console.log(`📊 Recorded token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
        } catch (error) {
          console.error('Error recording token usage:', error);
        }
      }

      // Clean the response
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```/, '');
      }
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/\s*```/, '');
      }

      const topics = JSON.parse(cleanedContent);
      
      if (!Array.isArray(topics)) {
        throw new Error('Invalid response format from OpenAI');
      }

      console.log(`✅ Grouped keywords into ${topics.length} topics`);
      
      // Validate and fix small topics
      const validatedTopics = this.validateAndFixTopics(topics);
      console.log(`✅ After validation: ${validatedTopics.length} topics`);
      
      return validatedTopics;

    } catch (error) {
      console.error('❌ Error grouping keywords:', error);
      throw error;
    }
  }

  /**
   * Validate and fix topics with minimum keyword requirements
   */
  static validateAndFixTopics(topics: Array<{ topicName: string; keywords: string[] }>): Array<{ topicName: string; keywords: string[] }> {
    try {
      console.log('🔍 Validating topics for minimum keyword requirements...');
      
      const MIN_KEYWORDS = 3;
      const validatedTopics: Array<{ topicName: string; keywords: string[] }> = [];
      const smallTopics: Array<{ topicName: string; keywords: string[] }> = [];
      
      // Separate valid and small topics
      for (const topic of topics) {
        if (topic.keywords && topic.keywords.length >= MIN_KEYWORDS) {
          validatedTopics.push(topic);
        } else {
          smallTopics.push(topic);
        }
      }
      
      console.log(`📊 Valid topics: ${validatedTopics.length}, Small topics: ${smallTopics.length}`);
      
      if (smallTopics.length === 0) {
        return validatedTopics;
      }
      
      // Try to redistribute keywords from small topics
      let redistributionAttempts = 0;
      const maxAttempts = 3;
      
      while (smallTopics.length > 0 && redistributionAttempts < maxAttempts) {
        redistributionAttempts++;
        console.log(`🔄 Redistribution attempt ${redistributionAttempts}/${maxAttempts}`);
        
        const smallTopic = smallTopics.shift()!;
        const keywordsToRedistribute = smallTopic.keywords || [];
        
        if (keywordsToRedistribute.length === 0) {
          continue;
        }
        
        // Try to find the best topic to merge with
        let bestMergeIndex = -1;
        let bestScore = -1;
        
        for (let i = 0; i < validatedTopics.length; i++) {
          const topic = validatedTopics[i];
          const currentSize = topic.keywords.length;
          const newSize = currentSize + keywordsToRedistribute.length;
          
          // Prefer topics that won't exceed 30 keywords
          if (newSize <= 30) {
            const score = 30 - newSize; // Higher score for topics closer to 30
            if (score > bestScore) {
              bestScore = score;
              bestMergeIndex = i;
            }
          }
        }
        
        if (bestMergeIndex !== -1) {
          // Merge with existing topic
          validatedTopics[bestMergeIndex].keywords.push(...keywordsToRedistribute);
          console.log(`🔗 Merged "${smallTopic.topicName}" (${keywordsToRedistribute.length} keywords) into "${validatedTopics[bestMergeIndex].topicName}"`);
        } else {
          // Create new topic if no suitable merge found
          if (keywordsToRedistribute.length >= MIN_KEYWORDS) {
            validatedTopics.push({
              topicName: smallTopic.topicName,
              keywords: keywordsToRedistribute
            });
            console.log(`➕ Created new topic "${smallTopic.topicName}" with ${keywordsToRedistribute.length} keywords`);
          } else {
            // Force merge with smallest topic
            const smallestTopicIndex = validatedTopics.reduce((minIndex, topic, index) => 
              topic.keywords.length < validatedTopics[minIndex].keywords.length ? index : minIndex, 0
            );
            validatedTopics[smallestTopicIndex].keywords.push(...keywordsToRedistribute);
            console.log(`🔗 Force merged "${smallTopic.topicName}" into "${validatedTopics[smallestTopicIndex].topicName}"`);
          }
        }
      }
      
      // Handle any remaining small topics by force merging
      for (const smallTopic of smallTopics) {
        if (smallTopic.keywords && smallTopic.keywords.length > 0) {
          const smallestTopicIndex = validatedTopics.reduce((minIndex, topic, index) => 
            topic.keywords.length < validatedTopics[minIndex].keywords.length ? index : minIndex, 0
          );
          validatedTopics[smallestTopicIndex].keywords.push(...smallTopic.keywords);
          console.log(`🔗 Final merge: "${smallTopic.topicName}" into "${validatedTopics[smallestTopicIndex].topicName}"`);
        }
      }
      
      console.log(`✅ Topic validation complete: ${validatedTopics.length} topics`);
      return validatedTopics;
      
    } catch (error) {
      console.error('❌ Error validating topics:', error);
      return topics; // Return original topics if validation fails
    }
  }

  /**
   * Generate vocabulary from multiple topics using OpenAI
   */
  static async generateVocabularyFromTopics(
    topics: Array<{ topicName: string; keywords: string[] }>,
    subject: string,
    nativeLanguage: string
  ): Promise<Array<{ topicName: string; vocabulary: Omit<LessonVocabulary, 'id' | 'lesson_id' | 'created_at'>[] }>> {
    try {
      console.log('🔍 Generating vocabulary from topics...');
      
      const prompt = `Create vocabulary entries for these topic groups. Return ONLY a JSON array:

Topics: ${topics.map(topic => `${topic.topicName}: ${topic.keywords.join(', ')}`).join('\n')}
Subject: ${subject}
Language: ${nativeLanguage}

Format:
[{"topicName": "Topic Name", "vocabulary": [{"english_term": "word", "definition": "meaning", "native_translation": "translation", "example_sentence_en": "example", "example_sentence_native": "translated example"}]}]

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
          temperature: 0.1,
      });

      const content = response.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Record token usage in monthly tracking
      if ('usage' in response && response.usage) {
        try {
          const { SimpleTokenTracker } = await import('./simpleTokenTracker');
          await SimpleTokenTracker.recordTokenUsage(
            user.id, 
            response.usage.prompt_tokens, 
            response.usage.completion_tokens
          );
          console.log(`📊 Recorded token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
        } catch (error) {
          console.error('Error recording token usage:', error);
        }
      }

      // Clean the response
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```/, '');
      }
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/```\s*/, '').replace(/\s*```/, '');
      }

      const topicVocabulary = JSON.parse(cleanedContent);
      
      if (!Array.isArray(topicVocabulary)) {
        throw new Error('Invalid response format from OpenAI');
      }

      console.log(`✅ Generated vocabulary for ${topicVocabulary.length} topics`);
      return topicVocabulary;

    } catch (error) {
      console.error('❌ Error generating vocabulary from topics:', error);
      throw error;
    }
  }

  /**
   * Generate vocabulary from keywords using OpenAI (legacy method for single topic)
   */
  static async generateVocabularyFromKeywords(
    keywords: string[],
    subject: string,
    nativeLanguage: string
  ): Promise<Omit<LessonVocabulary, 'id' | 'lesson_id' | 'created_at'>[]> {
    try {
      console.log('🔍 Generating vocabulary from keywords...');
      
      const prompt = `Create vocabulary entries for these keywords. Return ONLY a JSON array:

Keywords: ${keywords.join(', ')}
Subject: ${subject}
Language: ${nativeLanguage}

Format:
[{"english_term": "word", "definition": "meaning", "native_translation": "translation", "example_sentence_en": "example", "example_sentence_native": "translated example"}]

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
          temperature: 0.1,
      });

      const content = response.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Record token usage in monthly tracking
      if ('usage' in response && response.usage) {
        try {
          const { SimpleTokenTracker } = await import('./simpleTokenTracker');
          await SimpleTokenTracker.recordTokenUsage(
            user.id, 
            response.usage.prompt_tokens, 
            response.usage.completion_tokens
          );
          console.log(`📊 Recorded token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
        } catch (error) {
          console.error('Error recording token usage:', error);
        }
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
    pdfText: string,
    pdfName: string,
    userId: string,
    subject: string,
    nativeLanguage: string
  ): Promise<Lesson> {
    try {
      console.log('🚀 Creating lesson from PDF...');

      // Step 1: Extract keywords from PDF
      const keywords = await this.extractKeywordsFromPDF(pdfText, subject, nativeLanguage);
      
      // Step 2: Group keywords into topics
      const topics = await this.groupKeywordsIntoTopic(keywords, subject);
      
      // Step 3: Generate vocabulary from topics
      const topicVocabulary = await this.generateVocabularyFromTopics(topics, subject, nativeLanguage);

      // Create separate lesson for each topic
      const createdLessons = [];
      
      for (const topic of topicVocabulary) {
        // Create lesson record for this topic
        const { data: lesson, error: lessonError } = await supabase
          .from('esp_lessons')
          .insert([{
            user_id: userId,
            title: `${subject} - ${topic.topicName}`,
            subject: subject,
            source_pdf_name: topic.topicName,
            native_language: nativeLanguage
          }])
          .select()
          .single();

        if (lessonError) {
          console.error(`❌ Error creating lesson for topic ${topic.topicName}:`, lessonError);
          continue;
        }

        // Store vocabulary for this lesson
        if (topic.vocabulary && topic.vocabulary.length > 0) {
          const vocabularyWithLessonId = topic.vocabulary.map(vocab => ({
            lesson_id: lesson.id,
            keywords: vocab.english_term,
            definition: vocab.definition,
            native_translation: vocab.native_translation,
            example_sentence_en: vocab.example_sentence_en,
            example_sentence_native: vocab.example_sentence_native
          }));

          const { error: vocabError } = await supabase
            .from('lesson_vocabulary')
            .insert(vocabularyWithLessonId);

          if (vocabError) {
            console.error(`❌ Error storing vocabulary for topic ${topic.topicName}:`, vocabError);
          } else {
            console.log(`✅ Stored ${vocabularyWithLessonId.length} vocabulary items for lesson: ${topic.topicName}`);
          }
        }

        createdLessons.push(lesson);
        console.log(`✅ Created lesson: ${lesson?.title || 'Unknown'}`);
      }

      console.log(`✅ Created ${createdLessons.length} lessons`);
      return createdLessons; // Return all lessons

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
   * Get lesson vocabulary for conversation lessons
   */
  static async getLessonVocabulary(lessonId: string): Promise<LessonVocabulary[]> {
    try {
      const { data: vocabulary, error } = await supabase
        .from('lesson_vocabulary')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at');

      if (error) throw error;

      return vocabulary || [];
    } catch (error) {
      console.error('Error getting lesson vocabulary:', error);
      return [];
    }
  }

  /**
   * Fix all existing lessons for a user (progress)
   */
  static async fixExistingLessons(userId: string): Promise<void> {
    try {
      console.log('🔧 Fixing existing lessons for user...');
      
      // Ensure all lessons have progress records
      await this.ensureProgressRecords(userId);
      
      console.log('✅ Finished fixing existing lessons');
    } catch (error) {
      console.error('❌ Error fixing existing lessons:', error);
      throw error;
    }
  }

  /**
   * Ensure all lessons have progress records
   */
  static async ensureProgressRecords(userId: string): Promise<void> {
    try {
      console.log('📊 Ensuring all lessons have progress records...');
      
      // Get all lessons without progress records
      const { data: lessonsWithoutProgress, error: lessonsError } = await supabase
        .from('esp_lessons')
        .select(`
          id,
          title,
          lesson_progress!left(*)
        `)
        .eq('user_id', userId);

      if (lessonsError) throw lessonsError;

      for (const lesson of lessonsWithoutProgress || []) {
        // If no progress record exists, create one
        if (!lesson.lesson_progress || lesson.lesson_progress.length === 0) {
          const { error: insertError } = await supabase
            .from('lesson_progress')
            .insert([{
              user_id: userId,
              lesson_id: lesson.id,
              started_at: null,
              completed_at: null,
              total_score: 0,
              max_possible_score: 0,
              exercises_completed: 0,
              total_exercises: 5,
              time_spent_seconds: 0,
              status: 'not_started',
            }]);

          if (insertError) {
            console.error(`❌ Error creating progress record for lesson ${lesson.id}:`, insertError);
          } else {
            console.log(`✅ Created progress record for lesson: ${lesson?.title || 'Unknown'}`);
          }
        }
      }
      
      console.log('✅ Finished ensuring progress records');
    } catch (error) {
      console.error('❌ Error ensuring progress records:', error);
      throw error;
    }
  }


  /**
   * Get user's lessons with vocabulary counts and progress data
   */
  static async getUserLessonsWithProgress(userId: string): Promise<(Lesson & { vocab_count: number; progress?: LessonProgress })[]> {
    try {
      const { data, error } = await supabase
        .from('esp_lessons')
        .select(`
          *,
          lesson_vocabulary(count),
          lesson_progress!left(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to include vocab_count and progress
      const lessonsWithProgress = (data || []).map(lesson => {
        const progress = lesson.lesson_progress && lesson.lesson_progress.length > 0 ? lesson.lesson_progress[0] : null;
        
        return {
          ...lesson,
          vocab_count: lesson.lesson_vocabulary?.[0]?.count || 0,
          progress: progress
        };
      });

      return lessonsWithProgress;

    } catch (error) {
      console.error('Error getting user lessons with progress:', error);
      return [];
    }
  }

  /**
   * Get user's lessons with vocabulary counts
   */
  static async getUserLessonsWithVocabCount(userId: string): Promise<(Lesson & { vocab_count: number })[]> {
    try {
      const { data, error } = await supabase
        .from('esp_lessons')
        .select(`
          *,
          lesson_vocabulary(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to include vocab_count
      const lessonsWithCount = (data || []).map(lesson => ({
        ...lesson,
        vocab_count: lesson.lesson_vocabulary?.[0]?.count || 0
      }));

      return lessonsWithCount;

    } catch (error) {
      console.error('Error getting user lessons with vocab count:', error);
      return [];
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

      console.log(`✅ Verified lesson ownership: "${lesson?.title || 'Unknown'}"`);

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

      console.log(`🎉 Successfully deleted lesson "${lesson?.title || 'Unknown'}" and all related data`);
      return true;

    } catch (error) {
      console.error('❌ Error deleting lesson:', error);
      return false;
    }
  }
}
