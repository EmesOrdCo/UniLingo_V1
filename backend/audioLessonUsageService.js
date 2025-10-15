/**
 * Audio Lesson Usage Tracking Service
 * Enforces 5 lessons per month limit and prevents deletion abuse
 */

const { supabase } = require('./supabaseClient');

class AudioLessonUsageService {
  constructor() {
    this.MONTHLY_LIMIT = 5;
    console.log('📊 AudioLessonUsageService initialized with limit:', this.MONTHLY_LIMIT);
  }

  /**
   * Get current month-year string
   */
  getCurrentMonthYear() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Check if user can create more audio lessons this month
   */
  async canCreateAudioLesson(userId) {
    try {
      console.log(`🔍 Checking if user ${userId} can create audio lesson`);
      
      const { data, error } = await supabase
        .rpc('can_create_audio_lesson', { p_user_id: userId });

      if (error) {
        console.error('❌ Error checking audio lesson creation limit:', error);
        throw new Error(`Failed to check usage limit: ${error.message}`);
      }

      const canCreate = data === true;
      console.log(`📊 User ${userId} can create lesson: ${canCreate}`);
      
      return canCreate;
    } catch (error) {
      console.error('❌ Error in canCreateAudioLesson:', error);
      throw error;
    }
  }

  /**
   * Get user's current audio lesson usage for the month
   */
  async getUserUsage(userId, monthYear = null) {
    try {
      console.log(`📊 Getting usage for user ${userId}, month: ${monthYear || 'current'}`);
      
      const { data, error } = await supabase
        .rpc('get_user_audio_lesson_usage', { 
          p_user_id: userId,
          p_month_year: monthYear 
        });

      if (error) {
        console.error('❌ Error getting user usage:', error);
        throw new Error(`Failed to get usage: ${error.message}`);
      }

      console.log(`📊 User usage retrieved:`, data);
      return data;
    } catch (error) {
      console.error('❌ Error in getUserUsage:', error);
      throw error;
    }
  }

  /**
   * Increment lesson creation count
   */
  async incrementLessonCreation(userId) {
    try {
      console.log(`➕ Incrementing lesson creation for user ${userId}`);
      
      const { data, error } = await supabase
        .rpc('increment_lesson_creation', { p_user_id: userId });

      if (error) {
        console.error('❌ Error incrementing lesson creation:', error);
        throw new Error(`Failed to increment creation: ${error.message}`);
      }

      console.log(`✅ Lesson creation incremented:`, data);
      return data;
    } catch (error) {
      console.error('❌ Error in incrementLessonCreation:', error);
      throw error;
    }
  }

  /**
   * Increment lesson deletion count
   */
  async incrementLessonDeletion(userId) {
    try {
      console.log(`➖ Incrementing lesson deletion for user ${userId}`);
      
      const { data, error } = await supabase
        .rpc('increment_lesson_deletion', { p_user_id: userId });

      if (error) {
        console.error('❌ Error incrementing lesson deletion:', error);
        throw new Error(`Failed to increment deletion: ${error.message}`);
      }

      console.log(`✅ Lesson deletion incremented:`, data);
      return data;
    } catch (error) {
      console.error('❌ Error in incrementLessonDeletion:', error);
      throw error;
    }
  }

  /**
   * Validate audio lesson creation request
   */
  async validateLessonCreation(userId) {
    try {
      console.log(`🔍 Validating lesson creation for user ${userId}`);
      
      // Check if user can create more lessons
      const canCreate = await this.canCreateAudioLesson(userId);
      
      if (!canCreate) {
        // Get current usage for error message
        const usage = await this.getUserUsage(userId);
        
        const error = new Error('Monthly audio lesson limit reached');
        error.code = 'MONTHLY_LIMIT_EXCEEDED';
        error.details = {
          limit: this.MONTHLY_LIMIT,
          currentUsage: usage.total_usage,
          remainingLessons: usage.remaining_lessons,
          monthYear: usage.month_year
        };
        
        throw error;
      }

      console.log(`✅ Lesson creation validated for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error validating lesson creation:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics for monitoring
   */
  async getUsageStats(monthYear = null) {
    try {
      const targetMonth = monthYear || this.getCurrentMonthYear();
      console.log(`📊 Getting usage stats for month: ${targetMonth}`);
      
      const { data, error } = await supabase
        .from('audio_lesson_usage')
        .select('*')
        .eq('month_year', targetMonth)
        .order('total_usage', { ascending: false });

      if (error) {
        console.error('❌ Error getting usage stats:', error);
        throw new Error(`Failed to get stats: ${error.message}`);
      }

      // Calculate summary statistics
      const stats = {
        monthYear: targetMonth,
        totalUsers: data.length,
        totalLessonsCreated: data.reduce((sum, record) => sum + record.lessons_created, 0),
        totalLessonsDeleted: data.reduce((sum, record) => sum + record.lessons_deleted, 0),
        totalNetUsage: data.reduce((sum, record) => sum + record.total_usage, 0),
        usersAtLimit: data.filter(record => record.total_usage >= this.MONTHLY_LIMIT).length,
        averageUsage: data.length > 0 ? data.reduce((sum, record) => sum + record.total_usage, 0) / data.length : 0,
        topUsers: data.slice(0, 10).map(record => ({
          userId: record.user_id,
          totalUsage: record.total_usage,
          lessonsCreated: record.lessons_created,
          lessonsDeleted: record.lessons_deleted
        }))
      };

      console.log(`📊 Usage stats calculated:`, stats);
      return stats;
    } catch (error) {
      console.error('❌ Error in getUsageStats:', error);
      throw error;
    }
  }

  /**
   * Get user's usage history (multiple months)
   */
  async getUserUsageHistory(userId, months = 6) {
    try {
      console.log(`📊 Getting usage history for user ${userId}, ${months} months`);
      
      const { data, error } = await supabase
        .from('audio_lesson_usage')
        .select('*')
        .eq('user_id', userId)
        .order('month_year', { ascending: false })
        .limit(months);

      if (error) {
        console.error('❌ Error getting usage history:', error);
        throw new Error(`Failed to get history: ${error.message}`);
      }

      console.log(`📊 Usage history retrieved: ${data.length} months`);
      return data;
    } catch (error) {
      console.error('❌ Error in getUserUsageHistory:', error);
      throw error;
    }
  }

  /**
   * Reset user's usage for a specific month (admin function)
   */
  async resetUserUsage(userId, monthYear) {
    try {
      console.log(`🔄 Resetting usage for user ${userId}, month: ${monthYear}`);
      
      const { data, error } = await supabase
        .from('audio_lesson_usage')
        .update({
          lessons_created: 0,
          lessons_deleted: 0,
          total_usage: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('month_year', monthYear)
        .select()
        .single();

      if (error) {
        console.error('❌ Error resetting user usage:', error);
        throw new Error(`Failed to reset usage: ${error.message}`);
      }

      console.log(`✅ User usage reset:`, data);
      return data;
    } catch (error) {
      console.error('❌ Error in resetUserUsage:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new AudioLessonUsageService();
