/**
 * Audio Lesson Usage Service (Frontend)
 * Handles audio lesson usage tracking and limits
 */

import { ENV } from './envConfig';

export interface AudioLessonUsage {
  user_id: string;
  month_year: string;
  lessons_created: number;
  lessons_deleted: number;
  total_usage: number;
  remaining_lessons: number;
  can_create_more: boolean;
  updated_at: string;
}

export interface AudioLessonUsageHistory {
  id: string;
  user_id: string;
  month_year: string;
  lessons_created: number;
  lessons_deleted: number;
  total_usage: number;
  created_at: string;
  updated_at: string;
}

export interface AudioLessonUsageStats {
  monthYear: string;
  totalUsers: number;
  totalLessonsCreated: number;
  totalLessonsDeleted: number;
  totalNetUsage: number;
  usersAtLimit: number;
  averageUsage: number;
  topUsers: Array<{
    userId: string;
    totalUsage: number;
    lessonsCreated: number;
    lessonsDeleted: number;
  }>;
}

export class AudioLessonUsageService {
  private static readonly MONTHLY_LIMIT = 5;

  /**
   * Get user's current audio lesson usage
   */
  static async getUserUsage(userId: string, month?: string): Promise<AudioLessonUsage> {
    try {
      const params = new URLSearchParams();
      if (month) {
        params.append('month', month);
      }

      const response = await fetch(
        `${ENV.BACKEND_URL}/api/audio-lessons/usage/${userId}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.usage;
    } catch (error) {
      console.error('❌ Error getting user usage:', error);
      throw error;
    }
  }

  /**
   * Check if user can create more audio lessons
   */
  static async canCreateAudioLesson(userId: string): Promise<{
    canCreate: boolean;
    usage: AudioLessonUsage;
  }> {
    try {
      const response = await fetch(
        `${ENV.BACKEND_URL}/api/audio-lessons/can-create/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle limit exceeded error
        if (response.status === 429 && errorData.code === 'MONTHLY_LIMIT_EXCEEDED') {
          return {
            canCreate: false,
            usage: errorData.details
          };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        canCreate: data.canCreate,
        usage: data.usage
      };
    } catch (error) {
      console.error('❌ Error checking audio lesson creation:', error);
      throw error;
    }
  }

  /**
   * Get user's audio lesson usage history
   */
  static async getUserUsageHistory(userId: string, months: number = 6): Promise<AudioLessonUsageHistory[]> {
    try {
      const response = await fetch(
        `${ENV.BACKEND_URL}/api/audio-lessons/usage-history/${userId}?months=${months}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.history;
    } catch (error) {
      console.error('❌ Error getting usage history:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics (admin only)
   */
  static async getUsageStats(month?: string): Promise<AudioLessonUsageStats> {
    try {
      const params = new URLSearchParams();
      if (month) {
        params.append('month', month);
      }

      const response = await fetch(
        `${ENV.BACKEND_URL}/api/audio-lessons/stats?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('❌ Error getting usage stats:', error);
      throw error;
    }
  }

  /**
   * Reset user's usage (admin only)
   */
  static async resetUserUsage(userId: string, month: string): Promise<any> {
    try {
      const response = await fetch(
        `${ENV.BACKEND_URL}/api/audio-lessons/reset-usage/${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ month }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('❌ Error resetting user usage:', error);
      throw error;
    }
  }

  /**
   * Get current month-year string
   */
  static getCurrentMonthYear(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Format month-year for display
   */
  static formatMonthYear(monthYear: string): string {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

  /**
   * Get monthly limit
   */
  static getMonthlyLimit(): number {
    return this.MONTHLY_LIMIT;
  }

  /**
   * Check if usage is at limit
   */
  static isAtLimit(usage: AudioLessonUsage): boolean {
    return usage.total_usage >= this.MONTHLY_LIMIT;
  }

  /**
   * Get usage percentage
   */
  static getUsagePercentage(usage: AudioLessonUsage): number {
    return Math.round((usage.total_usage / this.MONTHLY_LIMIT) * 100);
  }

  /**
   * Get usage status color
   */
  static getUsageStatusColor(usage: AudioLessonUsage): string {
    const percentage = this.getUsagePercentage(usage);
    
    if (percentage >= 100) return '#ef4444'; // Red - at limit
    if (percentage >= 80) return '#f59e0b'; // Orange - near limit
    if (percentage >= 60) return '#eab308'; // Yellow - moderate usage
    return '#10b981'; // Green - low usage
  }

  /**
   * Get usage status text
   */
  static getUsageStatusText(usage: AudioLessonUsage): string {
    const percentage = this.getUsagePercentage(usage);
    
    if (percentage >= 100) return 'Limit Reached';
    if (percentage >= 80) return 'Near Limit';
    if (percentage >= 60) return 'Moderate Usage';
    return 'Low Usage';
  }
}

export default AudioLessonUsageService;
