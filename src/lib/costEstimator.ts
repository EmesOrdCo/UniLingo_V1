import { SimpleTokenTracker } from './simpleTokenTracker';

const INPUT_TOKEN_COST = 0.60; // $0.60 per 1M input tokens
const OUTPUT_TOKEN_COST = 2.40; // $2.40 per 1M output tokens
const OUTPUT_TOKEN_MULTIPLIER = 2.5; // Estimate output tokens as 2.5x input tokens

export interface CostEstimate {
  inputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  canProceed: boolean;
  remainingBudget: number;
}

export class CostEstimator {
  /**
   * Calculate token count for a given text using simple estimation
   * This is a React Native compatible alternative to tiktoken
   */
  static calculateTokens(text: string): number {
    // Simple estimation: 1 token ≈ 4 characters for English text
    // This is a reasonable approximation for most cases
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate total tokens for a conversation (system + user messages)
   */
  static calculateConversationTokens(messages: Array<{ role: string; content: string }>): number {
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
  static async estimateCost(
    userId: string, 
    messages: Array<{ role: string; content: string }>
  ): Promise<CostEstimate> {
    try {
      // Calculate input tokens
      const inputTokens = this.calculateConversationTokens(messages);
      
      // Estimate output tokens (2.5x input tokens)
      const estimatedOutputTokens = Math.ceil(inputTokens * OUTPUT_TOKEN_MULTIPLIER);
      
      // Calculate estimated cost
      const inputCost = (inputTokens / 1000000) * INPUT_TOKEN_COST;
      const outputCost = (estimatedOutputTokens / 1000000) * OUTPUT_TOKEN_COST;
      const estimatedCost = inputCost + outputCost;
      
      // Get current spending and remaining budget
      const currentSpending = await SimpleTokenTracker.getSpendingInDollars(userId);
      const remainingBudget = Math.max(0, 1.35 - currentSpending);
      
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
   * Get user-friendly error message when cost limit is exceeded
   */
  static getCostExceededMessage(estimate: CostEstimate): string {
    return `This AI usage exceeds your monthly allowance. Please try with shorter content or wait until next month when your budget resets.`;
  }

  /**
   * Get user-friendly cost information for display
   */
  static getCostInfo(estimate: CostEstimate): string {
    const costFormatted = estimate.estimatedCost.toFixed(4);
    const remainingFormatted = estimate.remainingBudget.toFixed(4);
    
    return `Estimated cost: $${costFormatted} | Remaining budget: $${remainingFormatted}`;
  }
}
