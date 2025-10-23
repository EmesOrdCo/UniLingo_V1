import { getBackendUrl } from '../config/backendConfig';

export interface AudioLessonUsage {
  current_usage: number;
  monthly_limit: number;
  remaining_lessons: number;
  can_create: boolean;
  total_usage?: number;
}

export interface UsageHistoryEntry {
  month_year: string;
  lessons_created: number;
  lessons_deleted: number;
  net_usage: number;
}

export interface UsageStats {
  month_year: string;
  total_users: number;
  total_lessons_created: number;
  total_lessons_deleted: number;
  users_at_limit: number;
  average_usage: number;
}

class HybridAudioLessonUsageService {
  private backendUrl: string;
  private monthlyLimit: number = 5;

  constructor() {
    this.backendUrl = getBackendUrl();
  }

  /**
   * Get user's current audio lesson usage.
   * @param userId - The user's ID
   * @returns Promise<AudioLessonUsage>
   */
  async getUserUsage(userId: string): Promise<AudioLessonUsage> {
    const url = `${this.backendUrl}/api/audio-lessons/usage/${userId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      if (!response.ok) {
        let errorMessage = 'Failed to fetch audio lesson usage';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }
      
      return data.usage;
    } catch (error) {
      console.error('Network error loading usage data:', error);
      console.error('Attempted URL:', url);
      console.error('Backend URL:', this.backendUrl);
      // Return a fallback usage object when network fails
      return {
        current_usage: 0,
        monthly_limit: this.monthlyLimit,
        remaining_lessons: this.monthlyLimit,
        can_create: true,
        total_usage: 0
      };
    }
  }

  /**
   * Check if user can create an audio lesson.
   * @param userId - The user's ID
   * @returns Promise<{canCreate: boolean, usage: AudioLessonUsage}>
   */
  async canCreateAudioLesson(userId: string): Promise<{ canCreate: boolean; usage: AudioLessonUsage }> {
    const url = `${this.backendUrl}/api/audio-lessons/can-create/${userId}`;
    
    try {
      const response = await fetch(url);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check audio lesson creation status');
      }
      
      return { canCreate: data.canCreate, usage: data.usage };
    } catch (error) {
      console.error('Network error checking audio lesson creation status:', error);
      // Return a fallback response when network fails
      const fallbackUsage: AudioLessonUsage = {
        current_usage: 0,
        monthly_limit: this.monthlyLimit,
        remaining_lessons: this.monthlyLimit,
        can_create: true,
        total_usage: 0
      };
      return { canCreate: true, usage: fallbackUsage };
    }
  }

  /**
   * Get user's usage history for analytics.
   * @param userId - The user's ID
   * @param monthsBack - Number of months to look back (default: 6)
   * @returns Promise<UsageHistoryEntry[]>
   */
  async getUserUsageHistory(userId: string, monthsBack: number = 6): Promise<UsageHistoryEntry[]> {
    const url = `${this.backendUrl}/api/audio-lessons/usage-history/${userId}?months=${monthsBack}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      let errorMessage = 'Failed to fetch usage history';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
    
    return data.history;
  }

  /**
   * Get overall usage statistics (admin only).
   * @param month - Month in YYYY-MM format (optional)
   * @returns Promise<UsageStats>
   */
  async getUsageStats(month?: string): Promise<UsageStats> {
    const url = new URL(`${this.backendUrl}/api/audio-lessons/stats`);
    if (month) {
      url.searchParams.append('month', month);
    }
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      let errorMessage = 'Failed to fetch usage statistics';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
    return data.stats;
  }

  /**
   * Reset user's usage (admin only).
   * @param userId - The user's ID
   * @returns Promise<boolean>
   */
  async resetUserUsage(userId: string): Promise<boolean> {
    const url = `${this.backendUrl}/api/audio-lessons/reset-usage/${userId}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to reset user usage';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
    return data.success;
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get the monthly limit.
   * @returns number
   */
  getMonthlyLimit(): number {
    return this.monthlyLimit;
  }

  /**
   * Get current month in YYYY-MM format.
   * @returns string
   */
  getCurrentMonth(): string {
    return new Date().toISOString().substring(0, 7);
  }

  /**
   * Format month-year for display.
   * @param monthYear - Month in YYYY-MM format
   * @returns string - Formatted month
   */
  formatMonthYear(monthYear: string): string {
    if (!monthYear) return 'Unknown';
    
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

  /**
   * Get usage percentage for progress bar.
   * @param usage - Usage object
   * @returns number - Percentage (0-100)
   */
  getUsagePercentage(usage: AudioLessonUsage): number {
    if (!usage || !usage.monthly_limit) return 0;
    return Math.min(100, (usage.current_usage / usage.monthly_limit) * 100);
  }

  /**
   * Get status color based on usage.
   * @param usage - Usage object
   * @returns string - Color code
   */
  getUsageStatusColor(usage: AudioLessonUsage): string {
    if (!usage) return '#10b981'; // Green
    
    const percentage = this.getUsagePercentage(usage);
    
    if (percentage < 50) return '#10b981'; // Green
    if (percentage < 75) return '#f59e0b'; // Yellow
    if (percentage < 90) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * Get status text based on usage.
   * @param usage - Usage object
   * @returns string - Status text
   */
  getUsageStatusText(usage: AudioLessonUsage): string {
    if (!usage) return 'Low Usage';
    
    const percentage = this.getUsagePercentage(usage);
    
    if (percentage < 50) return 'Low Usage';
    if (percentage < 75) return 'Moderate Usage';
    if (percentage < 90) return 'Near Limit';
    if (percentage < 100) return 'Almost Full';
    return 'Limit Reached';
  }

  /**
   * Check if usage is at limit.
   * @param usage - Usage object
   * @returns boolean
   */
  isAtLimit(usage: AudioLessonUsage): boolean {
    return usage && usage.current_usage >= usage.monthly_limit;
  }

  /**
   * Check if usage is near limit (90%+).
   * @param usage - Usage object
   * @returns boolean
   */
  isNearLimit(usage: AudioLessonUsage): boolean {
    return usage && this.getUsagePercentage(usage) >= 90;
  }
}

export default new HybridAudioLessonUsageService();
