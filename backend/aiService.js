const OpenAI = require('openai');
const path = require('path');

// Load environment variables from parent directory .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { supabase } = require('./supabaseClient');
const { retryWithBackoff, classifyError } = require('./retryUtils');
const CircuitBreaker = require('./circuitBreaker');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

// Initialize circuit breaker for OpenAI (Issue #6 + #8)
// Shared across all instances via Redis
const openaiCircuitBreaker = new CircuitBreaker('openai', {
  failureThreshold: 5,       // Open after 5 failures
  successThreshold: 2,       // Close after 2 successes in HALF_OPEN
  timeout: 60000,            // 60 seconds before trying HALF_OPEN
  monitoringWindow: 60000,   // Count failures in 60 second window
});

// Rate limiting configuration
const RATE_LIMITS = {
  requestsPerMinute: 50,
  tokensPerMinute: 75000,
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
};

// ❌ DEPRECATED: In-memory queue replaced by BullMQ (Issues #2-3)
// This code is NO LONGER USED in production - kept for backward compatibility only
// New queue-based flow: server.js → queueClient.enqueue() → BullMQ → worker.js
// TODO: Remove this entire queue implementation in next cleanup PR
// The functions below (processQueue, executeRequest) are not called by new endpoints
let requestQueue = [];
let isProcessing = false;
let currentMinute = Math.floor(Date.now() / 60000);
let requestsThisMinute = 0;
let tokensThisMinute = 0;
let circuitBreakerOpen = false;
let circuitBreakerTimeout = null;

// Start minute counter
// ⚠️ STATEFUL CODE: Each instance resets its own counters independently
// With horizontal scaling: Each instance tracks separately (not synchronized)
setInterval(() => {
  currentMinute = Math.floor(Date.now() / 60000);
  requestsThisMinute = 0;
  tokensThisMinute = 0;
  console.log('🔄 Rate limiter: Minute reset', {
    minute: currentMinute,
    requests: requestsThisMinute,
    tokens: tokensThisMinute
  });
}, 60000);

// Rate limiting functions
function canMakeRequest(estimatedTokens = 0) {
  if (circuitBreakerOpen) {
    console.log('🚫 Circuit breaker is open, rejecting request');
    return false;
  }

  if (requestsThisMinute >= RATE_LIMITS.requestsPerMinute) {
    console.log('🚫 Rate limit exceeded (requests per minute)');
    return false;
  }

  if (tokensThisMinute + estimatedTokens >= RATE_LIMITS.tokensPerMinute) {
    console.log('🚫 Token limit exceeded (tokens per minute)');
    return false;
  }

  return true;
}

function updateUsage(tokens) {
  requestsThisMinute++;
  tokensThisMinute += tokens;
  console.log('📊 Rate limiter usage updated', {
    requests: requestsThisMinute,
    tokens: tokensThisMinute,
    totalTokens: tokens
  });
}

function openCircuitBreaker() {
  circuitBreakerOpen = true;
  console.log('🚨 Circuit breaker opened - pausing all requests');
  
  // Close circuit breaker after 1 minute
  circuitBreakerTimeout = setTimeout(() => {
    circuitBreakerOpen = false;
    console.log('✅ Circuit breaker closed - resuming requests');
  }, 60000);
}

function calculateBackoffDelay(retryCount) {
  const exponentialDelay = Math.min(
    RATE_LIMITS.baseDelay * Math.pow(2, retryCount),
    RATE_LIMITS.maxDelay
  );
  
  // Add jitter (±25% random variation)
  const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
  const finalDelay = exponentialDelay + jitter;
  
  console.log(`⏱️ Backoff delay calculated: ${finalDelay}ms (retry ${retryCount})`);
  return finalDelay;
}

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }

  isProcessing = true;

  while (requestQueue.length > 0) {
    // Sort by priority (higher priority first)
    requestQueue.sort((a, b) => b.priority - a.priority);

    const request = requestQueue[0];
    
    if (!canMakeRequest()) {
      // Wait until we can make a request
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }

    // Remove from queue
    requestQueue.shift();

    try {
      console.log(`🚀 Executing queued request: ${request.id}`);
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      if (error?.status === 429 && request.retryCount < RATE_LIMITS.maxRetries) {
        // Rate limit error - retry with backoff
        request.retryCount++;
        const delay = calculateBackoffDelay(request.retryCount);
        
        console.log(`🔄 Retrying request ${request.id} in ${delay}ms (attempt ${request.retryCount})`);
        
        setTimeout(() => {
          requestQueue.unshift(request);
          processQueue();
        }, delay);
      } else {
        // Other error or max retries reached
        request.reject(error);
      }
    }
  }

  isProcessing = false;
}

async function executeRequest(executeFn, priority = 0, estimatedTokens = 0) {
  return new Promise((resolve, reject) => {
    const request = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      priority,
      execute: executeFn,
      resolve,
      reject,
      timestamp: Date.now(),
      retryCount: 0
    };

    if (canMakeRequest(estimatedTokens)) {
      // Can execute immediately
      requestQueue.unshift(request);
    } else {
      // Add to queue
      requestQueue.push(request);
      console.log(`📋 Request ${request.id} queued (priority: ${priority})`);
    }

    // Start processing if not already running
    processQueue();
  });
}

// AI Service functions
class AIService {
  static async generateFlashcards(content, subject, topic, userId, nativeLanguage = 'English', showNativeLanguage = false) {
    // Match frontend prompt structure exactly
    let prompt;
    
    if (topic === 'AI Selection') {
      // AI Selection mode - analyze content and detect topics
      prompt = `
        Analyze the following ${subject} text and automatically detect natural topic divisions based on headers, sections, and content themes.
        
        Subject: ${subject}
        User's Native Language: ${nativeLanguage}
        
        Text content:
        ${content}
        
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
        ${content}
        
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

    try {
      // Estimate cost before making the API call
      const costEstimate = await this.estimateCost(userId, messages);
      
      if (!costEstimate.canProceed) {
        throw new Error(this.getCostExceededMessage(costEstimate));
      }

      console.log('Cost estimation:', this.getCostInfo(costEstimate));

      // Issue #8: Use circuit breaker and retry logic
      const response = await openaiCircuitBreaker.execute(async () => {
        return await retryWithBackoff(async () => {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.1,
          });
          return completion;
        }, {
          maxAttempts: 3,
          baseDelay: 2000,
          maxDelay: 10000,
          onRetry: (error, attempt) => {
            console.log(`🔄 Retrying OpenAI call (attempt ${attempt + 1}):`, error.message);
          }
        });
      });

      const content = response.choices[0]?.message?.content || '';
      updateUsage(response.usage?.total_tokens || 0);

      // Record token usage in user's database entry
      if (response.usage && userId) {
        try {
          const { error: tokenError } = await supabase.rpc('increment_tokens', {
            user_id: userId,
            input_count: response.usage.prompt_tokens,
            output_count: response.usage.completion_tokens
          });

          if (tokenError) {
            console.error('Failed to record token usage:', tokenError);
          } else {
            console.log(`📊 Recorded token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
          }
        } catch (error) {
          console.error('Error recording token usage:', error);
        }
      }

      // Parse JSON response (handle markdown formatting) - MATCH FRONTEND EXACTLY
      let flashcards = [];
      try {
        console.log('🔍 Raw AI response length:', content.length);
        console.log('🔍 Raw AI response preview:', content.substring(0, 500));
        console.log('🔍 Raw AI response ending:', content.substring(Math.max(0, content.length - 500)));
        
        // Clean the response text
        let cleanedResponse = content.trim();
        
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
            const flashcards = [];
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
            const flashcards = [];
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
        console.error('❌ Raw AI response length:', content.length);
        console.error('❌ Raw AI response preview:', content.substring(0, 1000));
        throw new Error('Failed to parse AI-generated flashcards');
      }

      // Apply topic validation for AI Selection mode to enforce minimum keywords per topic
      if (topic === 'AI Selection') {
        flashcards = this.validateAndFixFlashcardTopics(flashcards);
      }

      // Deduplicate flashcards before saving
      const uniqueFlashcards = this.deduplicateFlashcards(flashcards);
      console.log(`🧹 Deduplicated flashcards: ${flashcards.length} → ${uniqueFlashcards.length}`);

      // Note: Flashcards are NOT automatically saved to database
      // They will be saved when the user explicitly clicks "Save" in the frontend
      console.log(`📋 Generated ${uniqueFlashcards.length} flashcards - ready for user review and save`);

      return {
        success: true,
        flashcards: uniqueFlashcards || [],
        tokenUsage: response.usage?.total_tokens || 0
      };

    } catch (error) {
      console.error('Flashcard generation error:', error);
      
      if (error?.status === 429) {
        openCircuitBreaker();
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  static async generateLesson(content, subject, topic, userId, nativeLanguage = 'English', sourceFileName = 'Unknown Source') {
    // Backend lesson generation now matches frontend LessonService.createLessonFromPDF exactly
    // Step 1: extractKeywordsFromPDF
    // Step 2: groupKeywordsIntoTopic  
    // Step 3: generateVocabularyFromTopics
    // Step 4: Create lesson record in database with source filename
    // Step 5: Store vocabulary in database
    
    try {
      console.log('🚀 Creating lesson from content...');

      console.log('🔍 Step 1: Extracting keywords from content...');
      console.log(`📏 Content length: ${content.length} characters`);
      
      // Step 1: Extract keywords from content
      const keywords = await this.extractKeywordsFromContent(content, subject, userId);
      
      console.log('🔍 Step 2: Grouping keywords into topics...');
      console.log(`📊 Keywords extracted: ${keywords.length} (proportional to content)`);
      
      // Step 2: Group keywords into topics
      const topics = await this.groupKeywordsIntoTopic(keywords, subject, userId);
      
      console.log('🔍 Step 3: Generating vocabulary from topics...');
      console.log(`📚 Topics created: ${topics.length} (proportional to ${keywords.length} keywords)`);
      
      // Step 3: Generate vocabulary from topics
      const topicVocabulary = await this.generateVocabularyFromTopics(topics, subject, nativeLanguage, userId);

      // Step 4: Create separate lesson for each topic
      const createdLessons = [];
      
      for (const topic of topicVocabulary) {
        // Create lesson record for this topic
        const { data: lesson, error: lessonError} = await supabase
          .from('esp_lessons')
          .insert([{
            user_id: userId,
            title: `${subject} - ${topic.topicName}`,
            subject: subject,
            source_pdf_name: sourceFileName,
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
            
            // Generate conversation script for this lesson
            try {
              console.log('🎭 Generating conversation script for lesson...');
              const conversationScript = await this.generateConversationScript(
                topic.vocabulary, 
                subject, 
                nativeLanguage, 
                userId
              );
              
              // Store conversation script in the lesson record
              const { error: updateError } = await supabase
                .from('esp_lessons')
                .update({ chat_content: JSON.stringify(conversationScript) })
                .eq('id', lesson.id);
              
              if (updateError) {
                console.error('❌ Error storing conversation script:', updateError);
              } else {
                console.log('✅ Conversation script generated and stored in lesson');
              }
            } catch (conversationError) {
              console.error('❌ Error generating conversation script:', conversationError);
              // Don't fail the entire lesson creation if conversation generation fails
            }
          }
        }

        createdLessons.push(lesson);
        console.log(`✅ Created lesson: ${lesson?.title || 'Unknown'}`);
      }

      console.log(`✅ Created ${createdLessons.length} lessons`);

      return {
        success: true,
        lessons: createdLessons,
        tokenUsage: 0 // Will be calculated from individual steps
      };

    } catch (error) {
      console.error('Lesson generation error:', error);
      
      if (error?.status === 429) {
        openCircuitBreaker();
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  // Step 1: Extract keywords from content (matches frontend extractKeywordsFromPDF)
  static async extractKeywordsFromContent(content, subject, userId) {
    const prompt = `Extract ALL important ${subject} terminology, concepts, and vocabulary from this content. 
      
IMPORTANT: Extract ONLY the key terms that actually appear in the content. The number of terms should be PROPORTIONAL to the content length and density:
- Short content with few terms: Extract 5-20 terms
- Medium content: Extract 20-50 terms
- Long/dense content: Extract 50-100+ terms

DO NOT pad the list with related terms that don't appear in the content. Quality over quantity.

Include:
- Technical terms and definitions
- Key concepts and principles
- Important phrases and compound terms
- Medical/scientific terminology (if applicable)

Content: ${content}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert content analyzer. IMPORTANT: Extract ONLY terms that appear in the provided content. The number of terms should match the content density - do not pad with related terms. You MUST return ONLY a JSON array of strings with no explanations, markdown, or text outside the JSON. Your response must start with [ and end with ]. Do NOT use backticks, code blocks, or any markdown formatting. Return raw JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      // Estimate cost before making the API call
      const costEstimate = await this.estimateCost(userId, messages);
      
      if (!costEstimate.canProceed) {
        throw new Error(this.getCostExceededMessage(costEstimate));
      }

      console.log('Cost estimation:', this.getCostInfo(costEstimate));

      const response = await executeRequest(
        async () => {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.1,
          });
          return completion;
        },
        1, // Medium priority
        costEstimate.inputTokens + costEstimate.estimatedOutputTokens
      );

      const content = response.choices[0]?.message?.content || '';
      updateUsage(response.usage?.total_tokens || 0);

      // Record token usage in user's database entry
      if (response.usage && userId) {
        try {
          const { error: tokenError } = await supabase.rpc('increment_tokens', {
            user_id: userId,
            input_count: response.usage.prompt_tokens,
            output_count: response.usage.completion_tokens
          });

          if (tokenError) {
            console.error('Failed to record token usage:', tokenError);
          } else {
            console.log(`📊 Recorded token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
          }
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
      
      // Deduplicate keywords (matches frontend)
      const deduplicatedKeywords = this.deduplicateKeywords(keywords);
      console.log(`✅ After deduplication: ${deduplicatedKeywords.length} keywords`);
      
      return deduplicatedKeywords;

    } catch (error) {
      console.error('❌ Error extracting keywords:', error);
      throw error;
    }
  }

  // Step 2: Group keywords into topics (matches frontend groupKeywordsIntoTopic)
  static async groupKeywordsIntoTopic(keywords, subject, userId) {
    const prompt = `Group these ${subject} keywords into logical topics. Return ONLY a JSON array:

Keywords: ${keywords.join(', ')}

IMPORTANT: The number of topics should be PROPORTIONAL to the number of keywords:
- 5-15 keywords: Create 1-2 topics
- 15-30 keywords: Create 2-4 topics
- 30-60 keywords: Create 3-6 topics
- 60+ keywords: Create 4-8 topics

DO NOT create many small topics if there are only a few keywords. It's better to have fewer, well-organized topics than many sparse ones.

Format:
[{"topicName": "Topic Name", "keywords": ["keyword1", "keyword2", ...]}]

Requirements:
- Each topic should ideally have 5-30 keywords (minimum 3 for small content)
- Group related keywords together
- Create meaningful topic names based on the keywords
- Ensure all keywords are included in exactly one topic
- Adapt the number of topics to the keyword count
- Return ONLY the JSON array:`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert educational content organizer. IMPORTANT: Create a number of topics proportional to the keyword count. Fewer keywords = fewer topics. Do not create many sparse topics. You MUST return ONLY a JSON array of objects with no explanations, markdown, or text outside the JSON. Your response must start with [ and end with ]. Do NOT use backticks, code blocks, or any markdown formatting. Return raw JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      // Estimate cost before making the API call
      const costEstimate = await this.estimateCost(userId, messages);
      
      if (!costEstimate.canProceed) {
        throw new Error(this.getCostExceededMessage(costEstimate));
      }

      console.log('Cost estimation:', this.getCostInfo(costEstimate));
        
      const response = await executeRequest(
        async () => {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.1,
          });
          return completion;
        },
        1, // Medium priority
        costEstimate.inputTokens + costEstimate.estimatedOutputTokens
      );

      const content = response.choices[0]?.message?.content || '';
      updateUsage(response.usage?.total_tokens || 0);

      // Record token usage in user's database entry
      if (response.usage && userId) {
        try {
          const { error: tokenError } = await supabase.rpc('increment_tokens', {
            user_id: userId,
            input_count: response.usage.prompt_tokens,
            output_count: response.usage.completion_tokens
          });

          if (tokenError) {
            console.error('Failed to record token usage:', tokenError);
          } else {
            console.log(`📊 Recorded token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
          }
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
      
      // Validate and fix topics (matches frontend)
      const validatedTopics = this.validateAndFixTopics(topics);
      console.log(`✅ After validation: ${validatedTopics.length} topics`);
      
      return validatedTopics;

    } catch (error) {
      console.error('❌ Error grouping keywords into topics:', error);
      throw error;
    }
  }

  // Step 3: Generate vocabulary from topics (matches frontend generateVocabularyFromTopics)
  static async generateVocabularyFromTopics(topics, subject, nativeLanguage, userId) {
    const prompt = `CRITICAL INSTRUCTION: You MUST ONLY create vocabulary entries for the EXACT keywords provided below. DO NOT add any additional terms or words that are not in the keyword list.

Create vocabulary entries for ONLY these specific keywords. Return ONLY a JSON array:

Topics: ${topics.map(topic => `${topic.topicName}: ${topic.keywords.join(', ')}`).join('\n')}
Subject: ${subject}
Language: ${nativeLanguage}

STRICT REQUIREMENTS:
- ONLY use keywords that appear in the topic lists above
- DO NOT invent, add, or suggest any additional vocabulary terms
- Each keyword must become ONE vocabulary entry
- The english_term field MUST exactly match a keyword from the lists above

Format:
[{"topicName": "Topic Name", "vocabulary": [{"english_term": "EXACT keyword from list", "definition": "meaning", "native_translation": "translation", "example_sentence_en": "example", "example_sentence_native": "translated example"}]}]

Return ONLY the JSON array:`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert language teacher. CRITICAL: You must ONLY create vocabulary entries for the EXACT keywords provided by the user. DO NOT add, invent, or suggest any additional terms. You MUST return ONLY a JSON array of objects with no explanations, markdown, or text outside the JSON. Your response must start with [ and end with ]. Do NOT use backticks, code blocks, or any markdown formatting. Return raw JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      // Estimate cost before making the API call
      const costEstimate = await this.estimateCost(userId, messages);
      
      if (!costEstimate.canProceed) {
        throw new Error(this.getCostExceededMessage(costEstimate));
      }

      console.log('Cost estimation:', this.getCostInfo(costEstimate));
        
      const response = await executeRequest(
        async () => {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.1,
          });
          return completion;
        },
        1, // Medium priority
        costEstimate.inputTokens + costEstimate.estimatedOutputTokens
      );

      const content = response.choices[0]?.message?.content || '';
      updateUsage(response.usage?.total_tokens || 0);

      // Record token usage in user's database entry
      if (response.usage && userId) {
        try {
          const { error: tokenError } = await supabase.rpc('increment_tokens', {
            user_id: userId,
            input_count: response.usage.prompt_tokens,
            output_count: response.usage.completion_tokens
          });

          if (tokenError) {
            console.error('Failed to record token usage:', tokenError);
          } else {
            console.log(`📊 Recorded token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
          }
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
      
      // Validate that all vocabulary terms match the provided keywords
      const validatedVocabulary = this.validateVocabularyAgainstKeywords(topicVocabulary, topics);
      
      return validatedVocabulary;

    } catch (error) {
      console.error('❌ Error generating vocabulary from topics:', error);
      throw error;
    }
  }

  // Validate vocabulary against provided keywords to prevent AI hallucination
  static validateVocabularyAgainstKeywords(topicVocabulary, originalTopics) {
    try {
      console.log('🔍 Validating vocabulary against provided keywords to prevent AI hallucination...');
      
      // Create a set of all valid keywords (normalized)
      const validKeywords = new Set();
      originalTopics.forEach(topic => {
        topic.keywords.forEach(keyword => {
          validKeywords.add(keyword.toLowerCase().trim());
        });
      });
      
      console.log(`📊 Valid keywords count: ${validKeywords.size}`);
      
      // Filter vocabulary to only include terms that match provided keywords
      const validated = topicVocabulary.map(topic => {
        const validatedVocab = topic.vocabulary.filter(vocab => {
          const term = vocab.english_term.toLowerCase().trim();
          const isValid = validKeywords.has(term);
          
          if (!isValid) {
            console.warn(`⚠️ Removing hallucinated term: "${vocab.english_term}" (not in original keywords)`);
          }
          
          return isValid;
        });
        
        return {
          ...topic,
          vocabulary: validatedVocab
        };
      });
      
      // Count total before/after
      const totalBefore = topicVocabulary.reduce((sum, t) => sum + t.vocabulary.length, 0);
      const totalAfter = validated.reduce((sum, t) => sum + t.vocabulary.length, 0);
      const removed = totalBefore - totalAfter;
      
      if (removed > 0) {
        console.warn(`🚫 Removed ${removed} hallucinated vocabulary terms`);
      }
      
      console.log(`✅ Validation complete: ${totalAfter} valid vocabulary terms (${removed} removed)`);
      return validated;
      
    } catch (error) {
      console.error('❌ Error validating vocabulary:', error);
      return topicVocabulary; // Return original if validation fails
    }
  }

  // Validate and fix topics (matches frontend lessonService)
  static validateAndFixTopics(topics) {
    try {
      console.log('🔍 Validating topics for minimum keyword requirements...');
      
      const MIN_KEYWORDS = 3;
      const validatedTopics = [];
      const smallTopics = [];
      
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
        
        const smallTopic = smallTopics.shift();
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
          // Merge with the best topic
          validatedTopics[bestMergeIndex].keywords.push(...keywordsToRedistribute);
          console.log(`🔗 Merged small topic "${smallTopic.topicName}" into "${validatedTopics[bestMergeIndex].topicName}"`);
        } else {
          // No suitable topic found, keep as is
          validatedTopics.push(smallTopic);
          console.log(`⚠️ Could not merge "${smallTopic.topicName}", keeping as is`);
        }
      }
      
      // Add any remaining small topics
      validatedTopics.push(...smallTopics);
      
      console.log(`✅ Topic validation complete: ${validatedTopics.length} topics`);
      return validatedTopics;
      
    } catch (error) {
      console.error('❌ Error validating topics:', error);
      return topics; // Return original topics if validation fails
    }
  }

  // Deduplicate keywords (matches frontend lessonService)
  static deduplicateKeywords(keywords) {
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
      const groupedKeywords = [];
      const processed = new Set();
      
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
   * Deduplicate flashcards based on front text and topic
   */
  static deduplicateFlashcards(flashcards) {
    const seen = new Set();
    const unique = [];
    
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
  static validateAndFixFlashcardTopics(flashcards) {
    try {
      console.log('🔍 Validating flashcard topics for minimum 5 flashcards per topic...');
      
      const MIN_FLASHCARDS = 5;
      
      // Clean and group flashcards by topic
      const topicGroups = {};
      
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
      const result = [];
      
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

  /**
   * Calculate token count for a given text using simple estimation
   * This is a Node.js compatible alternative to tiktoken
   */
  static calculateTokens(text) {
    // Simple estimation: 1 token ≈ 4 characters for English text
    // This is a reasonable approximation for most cases
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate total tokens for a conversation (system + user messages)
   */
  static calculateConversationTokens(messages) {
    let totalTokens = 0;
    
    for (const message of messages) {
      totalTokens += this.calculateTokens(message.content);
    }
    
    // Add overhead for message formatting (rough estimate)
    totalTokens += messages.length * 4;
    
    return totalTokens;
  }

  /**
   * Estimate the cost of an API call before making it
   */
  static async estimateCost(userId, messages) {
    try {
      const INPUT_TOKEN_COST = 0.60; // $0.60 per 1M input tokens
      const OUTPUT_TOKEN_COST = 2.40; // $2.40 per 1M output tokens
      const OUTPUT_TOKEN_MULTIPLIER = 2.5; // Estimate output tokens as 2.5x input tokens
      
      // Calculate input tokens
      const inputTokens = this.calculateConversationTokens(messages);
      
      // Estimate output tokens (2.5x input tokens)
      const estimatedOutputTokens = Math.ceil(inputTokens * OUTPUT_TOKEN_MULTIPLIER);
      
      // Calculate estimated cost
      const inputCost = (inputTokens / 1000000) * INPUT_TOKEN_COST;
      const outputCost = (estimatedOutputTokens / 1000000) * OUTPUT_TOKEN_COST;
      const estimatedCost = inputCost + outputCost;
      
      // Get current spending and remaining budget
      const currentSpending = await this.getSpendingInDollars(userId);
      const remainingBudget = Math.max(0, 5.00 - currentSpending);
      
      // Check if we can proceed
      const canProceed = estimatedCost <= remainingBudget;
      
      return {
        inputTokens,
        estimatedOutputTokens,
        estimatedCost,
        canProceed,
        remainingBudget
      };
    } catch (error) {
      console.error('Error estimating cost:', error);
      // Return safe defaults that will block the operation
      return {
        inputTokens: 0,
        estimatedOutputTokens: 0,
        estimatedCost: 0,
        canProceed: false,
        remainingBudget: 0
      };
    }
  }

  /**
   * Get current month's token usage for a user
   */
  static async getCurrentUsage(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('input_tokens, output_tokens')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() for new users

      if (error) throw error;

      // If no data found (new user), return zeros
      if (!data) {
        console.log('No token usage data found for new user:', userId);
        return { inputTokens: 0, outputTokens: 0 };
      }

      return {
        inputTokens: data.input_tokens || 0,
        outputTokens: data.output_tokens || 0
      };
    } catch (error) {
      console.error('Error getting current usage:', error);
      throw error;
    }
  }

  /**
   * Calculate spending in dollars
   */
  static async getSpendingInDollars(userId) {
    try {
      const INPUT_TOKEN_COST = 0.60; // $0.60 per 1M input tokens
      const OUTPUT_TOKEN_COST = 2.40; // $2.40 per 1M output tokens
      
      const usage = await this.getCurrentUsage(userId);
      
      const inputCost = (usage.inputTokens / 1000000) * INPUT_TOKEN_COST;
      const outputCost = (usage.outputTokens / 1000000) * OUTPUT_TOKEN_COST;
      
      return inputCost + outputCost;
    } catch (error) {
      console.error('Error calculating spending in dollars:', error);
      return 0;
    }
  }

  /**
   * Get user-friendly error message when cost limit is exceeded
   */
  static getCostExceededMessage(estimate) {
    return `This AI usage exceeds your monthly allowance. Please try with shorter content or wait until next month when your budget resets.`;
  }

  /**
   * Get user-friendly cost information for display
   */
  static getCostInfo(estimate) {
    const costFormatted = estimate.estimatedCost.toFixed(4);
    const remainingFormatted = estimate.remainingBudget.toFixed(4);
    
    return `Estimated cost: $${costFormatted} | Remaining budget: $${remainingFormatted}`;
  }

  static getStatus() {
    return {
      queueSize: requestQueue.length,
      isProcessing: isProcessing,
      circuitBreakerOpen: circuitBreakerOpen,
      requestsThisMinute: requestsThisMinute,
      tokensThisMinute: tokensThisMinute,
      requestsPerMinute: RATE_LIMITS.requestsPerMinute,
      tokensPerMinute: RATE_LIMITS.tokensPerMinute,
      currentMinute: currentMinute
    };
  }

  /**
   * Generate conversation script for lesson vocabulary
   */
  static async generateConversationScript(lessonVocabulary, subject, nativeLanguage, userId) {
    const prompt = `Create a natural 2-way conversation script based on the lesson vocabulary provided below.

Subject: ${subject}
User's Native Language: ${nativeLanguage}
Total Vocabulary Terms: ${lessonVocabulary.length}

Lesson Vocabulary (ALL must be included):
${lessonVocabulary.map(vocab => `- ${vocab.english_term}: ${vocab.definition}`).join('\n')}

CRITICAL REQUIREMENTS:
1. Create a casual but respectful conversation between "Assistant" and "User"
2. Include ALL ${lessonVocabulary.length} vocabulary terms - EVERY SINGLE ONE must appear at least once
3. Create exactly 6-8 full exchanges (Assistant speaks, then User responds = 1 exchange)
4. Distribute vocabulary evenly across ALL exchanges
5. Start with Assistant greeting/introducing the topic
6. Each User response should use 1-2 vocabulary terms naturally
7. Keep responses conversational and natural, not forced
8. Make the conversation flow logically and build on previous exchanges
9. Ensure vocabulary is used in meaningful context, not just mentioned
10. Make it relevant to the subject matter: ${subject}

STRUCTURE GUIDE:
- Exchange 1: Assistant introduces topic, User responds with 1-2 vocab terms
- Exchange 2-7: Continue natural conversation, each User response uses 1-2 vocab terms
- Exchange 8 (optional): Conclusion/summary if needed to cover all vocabulary

FORMAT: Return a JSON object with this exact structure:
{
  "conversation": [
    {
      "speaker": "Assistant",
      "message": "Hello! Let's talk about [topic]."
    },
    {
      "speaker": "User", 
      "message": "Great! I'm interested in learning about [vocabulary term]."
    },
    {
      "speaker": "Assistant",
      "message": "That's wonderful! Can you tell me about [related question]?"
    },
    {
      "speaker": "User",
      "message": "Sure! [Answer using vocabulary terms naturally]."
    }
  ]
}

VALIDATION CHECKLIST:
✓ All ${lessonVocabulary.length} vocabulary terms are used
✓ 6-8 full exchanges (12-16 total messages)
✓ Conversation starts with Assistant
✓ User responses contain the vocabulary to be practiced
✓ Natural flow and context

Return ONLY the JSON object, no explanations or markdown formatting.`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert conversation designer for language learning. Create natural, engaging conversations that incorporate ALL lesson vocabulary seamlessly. Ensure EVERY vocabulary term is used at least once across 6-8 exchanges. Return ONLY valid JSON with no explanations, markdown, or additional text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      console.log('🎭 Generating conversation script...');
      console.log(`📊 Vocabulary count: ${lessonVocabulary.length} terms`);
      
      // Estimate cost before making the API call
      const costEstimate = await this.estimateCost(userId, messages);
      console.log(`💰 Estimated cost: $${costEstimate.toFixed(4)}`);

      if (!await this.canMakeRequest(costEstimate)) {
        throw new Error('Rate limit exceeded or insufficient quota');
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000, // Increased for longer conversations
      });

      // Update rate limiting counters
      this.updateRateLimitCounters(costEstimate);

      const content = response.choices[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse the JSON response
      let conversationData;
      try {
        conversationData = JSON.parse(content);
      } catch (parseError) {
        console.error('❌ Error parsing conversation JSON:', parseError);
        throw new Error('Invalid JSON response from OpenAI');
      }

      if (!conversationData.conversation || !Array.isArray(conversationData.conversation)) {
        throw new Error('Invalid conversation format');
      }

      console.log(`✅ Generated conversation with ${conversationData.conversation.length} exchanges`);
      
      return conversationData;

    } catch (error) {
      console.error('❌ Error generating conversation script:', error);
      throw error;
    }
  }
}

module.exports = AIService;
