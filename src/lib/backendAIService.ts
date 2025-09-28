import { BACKEND_CONFIG } from '../config/backendConfig';

export interface BackendAIResponse {
  success: boolean;
  flashcards?: any[];
  lesson?: any;
  tokenUsage?: number;
  error?: string;
}

export interface BackendAIStatus {
  success: boolean;
  status: {
    queueSize: number;
    isProcessing: boolean;
    circuitBreakerOpen: boolean;
    requestsThisMinute: number;
    tokensThisMinute: number;
    requestsPerMinute: number;
    tokensPerMinute: number;
    currentMinute: number;
  };
  timestamp: string;
}

class BackendAIService {
  private static getBackendUrl(endpoint: string): string {
    return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
  }

  /**
   * Generate flashcards using the backend AI service
   */
  static async generateFlashcards(
    content: string,
    subject: string,
    topic: string,
    userId: string,
    nativeLanguage: string = 'English',
    showNativeLanguage: boolean = false
  ): Promise<BackendAIResponse> {
    try {
      console.log('🤖 Requesting flashcard generation from backend...');
      
      const response = await fetch(this.getBackendUrl('/api/ai/generate-flashcards'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          subject,
          topic,
          userId,
          nativeLanguage,
          showNativeLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate flashcards');
      }

      const result = await response.json();
      console.log('✅ Flashcard generation successful:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ Flashcard generation failed:', error);
      throw new Error(`Backend AI service error: ${error.message}`);
    }
  }

  /**
   * Generate lesson using the backend AI service
   */
  static async generateLesson(
    content: string,
    subject: string,
    topic: string,
    userId: string,
    nativeLanguage: string = 'English'
  ): Promise<BackendAIResponse> {
    try {
      console.log('📚 Requesting lesson generation from backend...');
      
      const response = await fetch(this.getBackendUrl('/api/ai/generate-lesson'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          subject,
          topic,
          userId,
          nativeLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate lesson');
      }

      const result = await response.json();
      console.log('✅ Lesson generation successful:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ Lesson generation failed:', error);
      throw new Error(`Backend AI service error: ${error.message}`);
    }
  }

  /**
   * Get AI service status
   */
  static async getStatus(): Promise<BackendAIStatus> {
    try {
      const response = await fetch(this.getBackendUrl('/api/ai/status'));
      
      if (!response.ok) {
        throw new Error('Failed to get AI service status');
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('❌ Failed to get AI service status:', error);
      throw new Error(`Backend AI service error: ${error.message}`);
    }
  }

  /**
   * Check if backend AI service is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.success && !status.status.circuitBreakerOpen;
    } catch (error) {
      console.warn('⚠️ Backend AI service not available:', error);
      return false;
    }
  }
}

export default BackendAIService;
