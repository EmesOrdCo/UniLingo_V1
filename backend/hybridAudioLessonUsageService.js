const { supabase } = require('./supabaseClient');

const MONTHLY_LESSON_LIMIT = 5; // User limit for audio lessons per month

class HybridAudioLessonUsageService {
  /**
   * Check if a user can create an audio lesson using the simple counter.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<boolean>} - True if user can create, false otherwise.
   */
  async canCreateAudioLesson(userId) {
    try {
      const { data, error } = await supabase.rpc('can_create_audio_lesson', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error checking audio lesson creation:', error);
        throw new Error(`Failed to check audio lesson creation: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in canCreateAudioLesson:', error);
      throw error;
    }
  }

  /**
   * Get a user's current audio lesson usage from the simple counter.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object>} - Usage information
   */
  async getUserUsage(userId) {
    try {
      const { data, error } = await supabase.rpc('get_user_audio_lesson_usage', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error getting user usage:', error);
        throw new Error(`Failed to get user usage: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return {
          current_usage: 0,
          monthly_limit: MONTHLY_LESSON_LIMIT,
          remaining_lessons: MONTHLY_LESSON_LIMIT,
          can_create: true
        };
      }

      return data[0];
    } catch (error) {
      console.error('Error in getUserUsage:', error);
      throw error;
    }
  }

  /**
   * Validate lesson creation. This is called before creating a lesson.
   * @param {string} userId - The ID of the user.
   * @throws {Error} if the limit is exceeded.
   */
  async validateLessonCreation(userId) {
    const canCreate = await this.canCreateAudioLesson(userId);
    
    if (!canCreate) {
      const usage = await this.getUserUsage(userId);
      const error = new Error(`Monthly audio lesson limit of ${MONTHLY_LESSON_LIMIT} reached.`);
      error.code = 'MONTHLY_LIMIT_EXCEEDED';
      error.details = `You have used ${usage.current_usage} audio lessons this month.`;
      throw error;
    }
  }

  /**
   * Get detailed usage history for analytics (optional).
   * @param {string} userId - The ID of the user.
   * @param {number} monthsBack - Number of months to look back.
   * @returns {Promise<Array>} - Usage history
   */
  async getUserUsageHistory(userId, monthsBack = 6) {
    try {
      const { data, error } = await supabase.rpc('get_user_usage_history', {
        user_uuid: userId,
        months_back: monthsBack
      });

      if (error) {
        console.error('Error getting usage history:', error);
        throw new Error(`Failed to get usage history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserUsageHistory:', error);
      throw error;
    }
  }

  /**
   * Get overall usage statistics for analytics (optional).
   * @param {string} month - The month in YYYY-MM format. Defaults to current month.
   * @returns {Promise<object>} - Usage statistics
   */
  async getUsageStats(month = null) {
    try {
      const { data, error } = await supabase.rpc('get_audio_lesson_usage_stats', {
        target_month: month
      });

      if (error) {
        console.error('Error getting usage statistics:', error);
        throw new Error(`Failed to get usage statistics: ${error.message}`);
      }

      return data && data.length > 0 ? data[0] : {
        month_year: month || new Date().toISOString().substring(0, 7),
        total_users: 0,
        total_lessons_created: 0,
        total_lessons_deleted: 0,
        users_at_limit: 0,
        average_usage: 0
      };
    } catch (error) {
      console.error('Error in getUsageStats:', error);
      throw error;
    }
  }

  /**
   * Reset a user's usage (call when subscription renews).
   * @param {string} userId - The ID of the user.
   * @returns {Promise<boolean>} - Success status
   */
  async resetUserUsage(userId) {
    try {
      const { data, error } = await supabase.rpc('reset_audio_lesson_usage', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error resetting user usage:', error);
        throw new Error(`Failed to reset user usage: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in resetUserUsage:', error);
      throw error;
    }
  }

  /**
   * Get the monthly limit (configurable).
   * @returns {number} - Monthly limit
   */
  getMonthlyLimit() {
    return MONTHLY_LESSON_LIMIT;
  }

  /**
   * Get current month in YYYY-MM format.
   * @returns {string} - Current month
   */
  getCurrentMonth() {
    return new Date().toISOString().substring(0, 7);
  }

  /**
   * Format month-year for display.
   * @param {string} monthYear - Month in YYYY-MM format
   * @returns {string} - Formatted month
   */
  formatMonthYear(monthYear) {
    if (!monthYear) return 'Unknown';
    
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

  /**
   * Get usage percentage for progress bar.
   * @param {object} usage - Usage object
   * @returns {number} - Percentage (0-100)
   */
  getUsagePercentage(usage) {
    if (!usage || !usage.monthly_limit) return 0;
    return Math.min(100, (usage.current_usage / usage.monthly_limit) * 100);
  }

  /**
   * Get status color based on usage.
   * @param {object} usage - Usage object
   * @returns {string} - Color code
   */
  getUsageStatusColor(usage) {
    if (!usage) return '#10b981'; // Green
    
    const percentage = this.getUsagePercentage(usage);
    
    if (percentage < 50) return '#10b981'; // Green
    if (percentage < 75) return '#f59e0b'; // Yellow
    if (percentage < 90) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Get status text based on usage.
   * @param {object} usage - Usage object
   * @returns {string} - Status text
   */
  getUsageStatusText(usage) {
    if (!usage) return 'Low Usage';
    
    const percentage = this.getUsagePercentage(usage);
    
    if (percentage < 50) return 'Low Usage';
    if (percentage < 75) return 'Moderate Usage';
    if (percentage < 90) return 'Near Limit';
    if (percentage < 100) return 'Almost Full';
    return 'Limit Reached';
  }
}

module.exports = new HybridAudioLessonUsageService();
