import OpenAI from 'openai';
import { openAIRateLimiter } from './rateLimiter';
import { supabase } from './supabase';
import { SimpleTokenTracker } from './simpleTokenTracker';

interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  maxRetries?: number;
  timeout?: number;
}

interface ChatCompletionRequest {
  model: string;
  messages: any[];
  temperature?: number;
  stream?: boolean;
  priority?: number;
}

interface ChatCompletionResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class OpenAIWithRateLimit {
  private openai: OpenAI;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = {
      maxRetries: 3,
      timeout: 300000, // Increased to 5 minutes for complex operations
      ...config
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      organization: this.config.organization,
      timeout: this.config.timeout,
    });
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  private estimateRequestTokens(request: ChatCompletionRequest): number {
    let totalTokens = 0;
    
    // Estimate tokens for messages
    for (const message of request.messages) {
      totalTokens += this.estimateTokens(message.content || '');
    }
    
    // Add buffer for model overhead
    totalTokens += 100;
    
    return totalTokens;
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const estimatedTokens = this.estimateRequestTokens(request);
    const priority = request.priority || 0;

    // Get current user ID for monthly tracking
    let userId: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
      
      // Check if user has exceeded monthly limit
      if (userId) {
        const hasExceeded = await SimpleTokenTracker.hasExceededLimit(userId);
        if (hasExceeded) {
          throw new Error('Monthly token limit exceeded. Please wait until next month to continue using AI features.');
        }
        
        // Check if it's time to reset monthly usage
        await SimpleTokenTracker.checkAndResetIfNeeded(userId);
      }
    } catch (error) {
      console.warn('⚠️ Could not get user ID for token tracking:', error);
    }

    try {
      console.log('🤖 OpenAI API request queued', {
        model: request.model,
        estimatedTokens,
        priority,
        userId,
        queueSize: openAIRateLimiter.getStatus().queueSize
      });

      const response = await openAIRateLimiter.executeRequest(
        async () => {
          console.log('🚀 Executing OpenAI API request');
          
          const completion = await this.openai.chat.completions.create({
            model: request.model,
            messages: request.messages,
            temperature: request.temperature || 0.7,
            stream: request.stream || false,
          });

          // Record token usage in monthly tracking (separate input/output)
          if ('usage' in completion && completion.usage && userId) {
            await SimpleTokenTracker.recordTokenUsage(
              userId, 
              completion.usage.prompt_tokens, 
              completion.usage.completion_tokens
            );
          }

          // Update token usage in rate limiter
          if ('usage' in completion && completion.usage) {
            openAIRateLimiter.updateTokenUsage({
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
              timestamp: Date.now()
            });
          }

          return completion;
        },
        priority,
        estimatedTokens
      );

      // Extract content and usage
      const content = 'choices' in response ? response.choices[0]?.message?.content || '' : '';
      const usage = 'usage' in response && response.usage ? response.usage : {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      };

      console.log('✅ OpenAI API request successful', {
        contentLength: content.length,
        tokensUsed: usage.total_tokens,
        userId,
        contentPreview: content.substring(0, 200),
        contentEnding: content.substring(Math.max(0, content.length - 200))
      });

      return {
        content,
        usage: {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens
        }
      };

         } catch (error: any) {
       console.error('❌ OpenAI API request failed:', error);

       // Handle different types of 429 errors
       if (error?.status === 429) {
         if (error?.message?.includes('quota') || error?.message?.includes('billing')) {
           // This is a quota/billing issue, not a rate limit
           console.log('💳 Quota exceeded - this is a billing issue, not a rate limit');
           throw new Error(`OpenAI quota exceeded: ${error.message}. Please add credits to your account.`);
         } else {
           // This is a rate limit issue
           console.log('🚫 Rate limit detected, opening circuit breaker');
           openAIRateLimiter.handleRateLimitError();
           throw new Error(`Rate limit exceeded: ${error.message}. Please try again in a moment.`);
         }
       }

       // Handle other OpenAI errors
       if (error?.message) {
         throw new Error(`OpenAI API error: ${error.message}`);
       }

       throw new Error('Unknown error occurred with OpenAI API');
     }
  }

  async generateLessonContent(prompt: string, model: string = 'gpt-3.5-turbo'): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful language learning assistant. Generate structured lesson content based on the user\'s request.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.createChatCompletion({
      model,
      messages,
      temperature: 0.7,
      priority: 1 // Higher priority for lesson generation
    });

    return response.content;
  }

  async analyzePDFContent(content: string, model: string = 'gpt-3.5-turbo'): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful language learning assistant. Analyze the provided PDF content and extract key learning points.'
      },
      {
        role: 'user',
        content: `Please analyze this content and provide a structured summary:\n\n${content}`
      }
    ];

    const response = await this.createChatCompletion({
      model,
      messages,
      temperature: 0.5,
      priority: 2 // Medium priority for PDF analysis
    });

    return response.content;
  }

  // Get current rate limiter status
  getRateLimitStatus() {
    return openAIRateLimiter.getStatus();
  }

  // Clear the request queue (useful for testing or emergency situations)
  clearQueue() {
    openAIRateLimiter.clearQueue();
  }

  // Check if the error is quota-related
  isQuotaError(error: any): boolean {
    return error?.message?.includes('quota') || 
           error?.message?.includes('billing') || 
           error?.message?.includes('credit');
  }

  // Get a simple status check
  async checkAccountStatus(): Promise<{ hasCredits: boolean; message: string }> {
    try {
      // Make a minimal test request to check account status
      const response = await this.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        priority: 0 // Low priority for status check
      });
      
      return { hasCredits: true, message: 'Account has credits available' };
    } catch (error: any) {
      if (this.isQuotaError(error)) {
        return { hasCredits: false, message: 'Account has no credits - please add more' };
      }
      return { hasCredits: false, message: `Account check failed: ${error.message}` };
    }
  }
}

export default OpenAIWithRateLimit;
