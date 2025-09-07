import { supabase } from './supabase';

const SPENDING_LIMIT = 5.00; // $5.00 limit
const INPUT_TOKEN_COST = 0.60; // $0.60 per 1M input tokens
const OUTPUT_TOKEN_COST = 2.40; // $2.40 per 1M output tokens

export class SimpleTokenTracker {
  /**
   * Record token usage for a user (separate input/output)
   */
  static async recordTokenUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_tokens', {
        user_id: userId,
        input_count: inputTokens,
        output_count: outputTokens
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording token usage:', error);
      throw error;
    }
  }

  /**
   * Get current month's token usage for a user
   */
  static async getCurrentUsage(userId: string): Promise<{ inputTokens: number; outputTokens: number }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('input_tokens, output_tokens')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() for new users

      if (error) {
        console.error('Error getting current usage:', error);
        return { inputTokens: 0, outputTokens: 0 };
      }

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
      return { inputTokens: 0, outputTokens: 0 };
    }
  }

  /**
   * Calculate spending percentage based on token usage
   */
  static async getSpendingPercentage(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_spending_percentage', {
        user_id: userId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating spending percentage:', error);
      return 0;
    }
  }

  /**
   * Calculate spending in dollars
   */
  static async getSpendingInDollars(userId: string): Promise<number> {
    try {
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
   * Check if user has exceeded spending limit
   */
  static async hasExceededLimit(userId: string): Promise<boolean> {
    const spendingPercentage = await this.getSpendingPercentage(userId);
    return spendingPercentage >= 100;
  }

  /**
   * Get remaining spending capacity
   */
  static async getRemainingSpending(userId: string): Promise<number> {
    const currentSpending = await this.getSpendingInDollars(userId);
    return Math.max(0, SPENDING_LIMIT - currentSpending);
  }

  /**
   * Reset monthly usage (called on account anniversary)
   */
  static async resetMonthlyUsage(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('reset_monthly_tokens', {
        user_id: userId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
      throw error;
    }
  }

  /**
   * Check if it's time to reset monthly usage based on account creation date
   */
  static async checkAndResetIfNeeded(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('account_created_date, input_tokens, output_tokens')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() for new users

      if (error) {
        console.error('Error checking reset date:', error);
        return;
      }

      // If no data found (new user), skip reset check
      if (!data?.account_created_date) {
        console.log('No account creation date found for user:', userId);
        return;
      }

      const accountDate = new Date(data.account_created_date);
      const today = new Date();
      
      // Check if it's the same day of the month as account creation
      if (accountDate.getDate() === today.getDate()) {
        // Reset if it's been more than 0 days since last reset
        await this.resetMonthlyUsage(userId);
      }
    } catch (error) {
      console.error('Error checking reset date:', error);
    }
  }
}
