import { ENV } from './envConfig';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AssistantConfig {
  assistantId: string;
  threadId?: string;
  instructions?: string;
}

export class AssistantService {
  private static assistantId: string = 'asst_ERPM7MuNjRnjC1mB9VW8GeyY'; // Hardcoded assistant ID
  private static threadId: string | null = null;
  private static isInitialized = false;

  /**
   * Initialize the assistant with the hardcoded assistant ID
   */
  static async initializeAssistant(): Promise<boolean> {
    try {
      const apiKey = ENV.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Create a new thread for this conversation
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1',
        },
      });

      if (!threadResponse.ok) {
        throw new Error(`Failed to create thread: ${threadResponse.status}`);
      }

      const threadData = await threadResponse.json();
      this.threadId = threadData.id;
      this.isInitialized = true;

      console.log('✅ Assistant initialized:', {
        assistantId: this.assistantId,
        threadId: this.threadId,
      });

      return true;
    } catch (error) {
      console.error('❌ Assistant initialization error:', error);
      return false;
    }
  }

  /**
   * Send a message to your custom assistant
   */
  static async sendMessage(
    message: string,
    onProgress?: (status: string) => void
  ): Promise<string> {
    try {
      if (!this.isInitialized || !this.threadId) {
        throw new Error('Assistant not initialized');
      }

      const apiKey = ENV.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Add the user's message to the thread
      onProgress?.('Adding message to thread...');
      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1',
        },
        body: JSON.stringify({
          role: 'user',
          content: message,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error(`Failed to add message: ${messageResponse.status}`);
      }

      // Run the assistant
      onProgress?.('Running assistant...');
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1',
        },
        body: JSON.stringify({
          assistant_id: this.assistantId,
        }),
      });

      if (!runResponse.ok) {
        throw new Error(`Failed to run assistant: ${runResponse.status}`);
      }

      const runData = await runResponse.json();
      const runId = runData.id;

      // Poll for completion
      onProgress?.('Waiting for response...');
      let runStatus = 'queued';
      while (runStatus === 'queued' || runStatus === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v1',
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        runStatus = statusData.status;

        if (runStatus === 'failed') {
          throw new Error('Assistant run failed');
        }

        onProgress?.(`Status: ${runStatus}`);
      }

      // Get the assistant's response
      onProgress?.('Retrieving response...');
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1',
        },
      });

      if (!messagesResponse.ok) {
        throw new Error(`Failed to retrieve messages: ${messagesResponse.status}`);
      }

      const messagesData = await messagesResponse.json();
      const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');

      if (!assistantMessage) {
        throw new Error('No assistant response found');
      }

      return assistantMessage.content[0]?.text?.value || 'No response from assistant';

    } catch (error) {
      console.error('❌ Assistant message error:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  static async getConversationHistory(): Promise<AssistantMessage[]> {
    try {
      if (!this.isInitialized || !this.threadId) {
        return [];
      }

      const apiKey = ENV.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await fetch(`https://api.openai.com/v1/threads/${this.threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get conversation history: ${response.status}`);
      }

      const data = await response.json();
      
      return data.data.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content[0]?.text?.value || '',
        timestamp: new Date(msg.created_at * 1000),
      }));

    } catch (error) {
      console.error('❌ Get conversation history error:', error);
      return [];
    }
  }

  /**
   * Clear the current conversation thread
   */
  static async clearConversation(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.assistantId) {
        return false;
      }

      // Create a new thread to start fresh
      const apiKey = ENV.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1',
        },
      });

      if (!threadResponse.ok) {
        throw new Error(`Failed to create new thread: ${threadResponse.status}`);
      }

      const threadData = await threadResponse.json();
      this.threadId = threadData.id;

      console.log('✅ Conversation cleared, new thread created:', this.threadId);
      return true;

    } catch (error) {
      console.error('❌ Clear conversation error:', error);
      return false;
    }
  }

  /**
   * Get assistant information
   */
  static async getAssistantInfo(): Promise<any> {
    try {
      const apiKey = ENV.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await fetch(`https://api.openai.com/v1/assistants/${this.assistantId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get assistant info: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Get assistant info error:', error);
      throw error;
    }
  }

  /**
   * Check if assistant is initialized
   */
  static isReady(): boolean {
    return this.isInitialized && !!this.threadId;
  }

  /**
   * Get current assistant ID
   */
  static getAssistantId(): string {
    return this.assistantId;
  }

  /**
   * Get current thread ID
   */
  static getThreadId(): string | null {
    return this.threadId;
  }
}
