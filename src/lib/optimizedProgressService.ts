import { supabase } from './supabase';
import ProgressCacheService from './progressCacheService';
import { ProgressInsights, HolisticProgressService } from './holisticProgressService';

class OptimizedProgressService {
  /**
   * Get progress insights with caching
   * This method implements a cache-first strategy with background refresh
   */
  static async getProgressInsights(userId: string, forceRefresh: boolean = false): Promise<ProgressInsights | null> {
    try {
      // If not forcing refresh, try to get from cache first
      if (!forceRefresh) {
        const cachedData = await ProgressCacheService.getProgressInsights(userId);
        if (cachedData) {
          console.log('📦 Using cached progress insights');
          
          // Check if cache is fresh (less than 1 minute old)
          const isFresh = await ProgressCacheService.isCacheFresh(`progress_insights_${userId}`);
          
          if (isFresh) {
            return cachedData;
          } else {
            // Cache is stale, refresh in background
            console.log('🔄 Cache is stale, refreshing in background...');
            this.refreshProgressInsightsInBackground(userId);
            return cachedData; // Return stale data immediately
          }
        }
      }

      console.log('🌐 Fetching fresh progress insights from server...');
      return await this.fetchAndCacheProgressInsights(userId);
    } catch (error) {
      console.error('Error getting progress insights:', error);
      
      // Fallback to cache even if stale
      const cachedData = await ProgressCacheService.getProgressInsights(userId);
      if (cachedData) {
        console.log('📦 Using stale cached data as fallback');
        return cachedData;
      }
      
      return null;
    }
  }

  /**
   * Fetch fresh data and cache it
   */
  private static async fetchAndCacheProgressInsights(userId: string): Promise<ProgressInsights | null> {
    try {
      // Get current streak
      const dailyStreak = await this.getCurrentStreak(userId);
      
      // Get today's progress using the smart query function
      const today = new Date().toISOString().split('T')[0];
      const { data: todayProgressResult } = await supabase
        .rpc('get_daily_progress', { user_uuid: userId, target_date: today });
      const todayProgress = todayProgressResult ? JSON.parse(todayProgressResult) : null;

      // Get weekly progress (last 7 days) - optimized batch query
      const weeklyProgress = await this.getWeeklyProgressBatch(userId);

      // Get monthly progress (last 30 days) - optimized batch query
      const monthlyProgress = await this.getMonthlyProgressBatch(userId);

      // Get recent activities
      const recentActivities = await this.getRecentActivities(userId, 5);

      // Get today's goals
      const todayGoals = await this.getTodayGoals(userId);

      // Get achievements
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(5);

      // Get learning stats for level progress
      const { data: learningStats } = await supabase
        .from('user_learning_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Calculate level progress
      const levelProgress = this.calculateLevelProgress(learningStats);

      // Get flashcard statistics
      const flashcardStats = await this.getFlashcardStats(userId);

      const progressData: ProgressInsights = {
        currentStreak: dailyStreak?.current_streak || 0,
        longestStreak: dailyStreak?.longest_streak || 0,
        todayProgress: todayProgress || null,
        weeklyProgress: weeklyProgress || [],
        monthlyProgress: monthlyProgress || [],
        recentActivities,
        upcomingGoals: todayGoals,
        achievements: achievements || [],
        levelProgress,
        flashcardStats,
      };

      // Cache the data
      await ProgressCacheService.setProgressInsights(userId, progressData);
      
      return progressData;
    } catch (error) {
      console.error('Error fetching progress insights:', error);
      return null;
    }
  }

  /**
   * Refresh progress insights in background without blocking UI
   */
  private static async refreshProgressInsightsInBackground(userId: string): Promise<void> {
    try {
      await this.fetchAndCacheProgressInsights(userId);
      console.log('✅ Background refresh completed');
    } catch (error) {
      console.error('❌ Background refresh failed:', error);
    }
  }

  /**
   * Get weekly progress using batch query instead of individual calls
   */
  private static async getWeeklyProgressBatch(userId: string): Promise<any[]> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      // Create date range for batch query
      const startDate = weekAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      // Use a single RPC call for the entire week if available
      const { data: weeklyData } = await supabase
        .rpc('get_weekly_progress', { 
          user_uuid: userId, 
          start_date: startDate, 
          end_date: endDate 
        });
      
      if (weeklyData) {
        return weeklyData;
      }
      
      // Fallback to individual calls if batch RPC doesn't exist
      const weeklyProgress: any[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekAgo);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        const { data: dayProgress } = await supabase
          .rpc('get_daily_progress', { user_uuid: userId, target_date: dateString });
        
        if (dayProgress) {
          weeklyProgress.push(JSON.parse(dayProgress));
        } else {
          weeklyProgress.push({
            date: dateString,
            total_study_time_minutes: 0,
            lessons_completed: 0,
            flashcards_reviewed: 0,
            games_played: 0,
            total_score: 0,
            average_accuracy: 0,
            streak_maintained: false,
            goals_achieved: 0,
            total_goals: 0
          });
        }
      }
      
      return weeklyProgress;
    } catch (error) {
      console.error('Error getting weekly progress:', error);
      return [];
    }
  }

  /**
   * Get monthly progress using batch query instead of individual calls
   */
  private static async getMonthlyProgressBatch(userId: string): Promise<any[]> {
    try {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      // Create date range for batch query
      const startDate = monthAgo.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      // Use a single RPC call for the entire month if available
      const { data: monthlyData } = await supabase
        .rpc('get_monthly_progress', { 
          user_uuid: userId, 
          start_date: startDate, 
          end_date: endDate 
        });
      
      if (monthlyData) {
        return monthlyData;
      }
      
      // Fallback to individual calls if batch RPC doesn't exist
      const monthlyProgress: any[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date(monthAgo);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        const { data: dayProgress } = await supabase
          .rpc('get_daily_progress', { user_uuid: userId, target_date: dateString });
        
        if (dayProgress) {
          monthlyProgress.push(JSON.parse(dayProgress));
        }
      }
      
      return monthlyProgress;
    } catch (error) {
      console.error('Error getting monthly progress:', error);
      return [];
    }
  }

  /**
   * Get study dates with caching
   */
  static async getStudyDates(userId: string): Promise<string[]> {
    try {
      // Try cache first
      const cachedDates = await ProgressCacheService.getStudyDates(userId);
      if (cachedDates) {
        return cachedDates;
      }

      // Fetch from database
      const { data: activities } = await supabase
        .from('user_activities')
        .select('completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      const dates = activities?.map(activity => 
        new Date(activity.completed_at).toISOString().split('T')[0]
      ) || [];

      const uniqueDates = [...new Set(dates)].sort();
      
      // Cache the result
      await ProgressCacheService.setStudyDates(userId, uniqueDates);
      
      return uniqueDates;
    } catch (error) {
      console.error('Error getting study dates:', error);
      return [];
    }
  }

  /**
   * Get current streak with caching
   */
  private static async getCurrentStreak(userId: string): Promise<any> {
    try {
      // Try cache first
      const cachedStreak = await ProgressCacheService.getCurrentStreak(userId);
      if (cachedStreak) {
        return cachedStreak;
      }

      // Fetch from database
      const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('streak_type', 'daily_study')
        .maybeSingle();

      console.log('🔍 Streak data from database:', streak);

      // Cache the result
      if (streak) {
        await ProgressCacheService.setCurrentStreak(userId, streak);
      }

      return streak;
    } catch (error) {
      console.error('Error getting current streak:', error);
      return null;
    }
  }

  /**
   * Get recent activities with caching
   */
  private static async getRecentActivities(userId: string, limit: number = 5): Promise<any[]> {
    try {
      // Try cache first
      const cachedActivities = await ProgressCacheService.getRecentActivities(userId);
      if (cachedActivities) {
        return cachedActivities;
      }

      // Fetch from database
      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      const activitiesList = activities || [];
      
      // Cache the result
      await ProgressCacheService.setRecentActivities(userId, activitiesList);
      
      return activitiesList;
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }

  /**
   * Get today's goals with caching
   */
  private static async getTodayGoals(userId: string): Promise<any[]> {
    try {
      // Try cache first
      const cachedGoals = await ProgressCacheService.getTodayGoals(userId);
      if (cachedGoals) {
        return cachedGoals;
      }

      // Fetch from database
      const today = new Date().toISOString().split('T')[0];
      const { data: goals } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_date', today);

      const goalsList = goals || [];
      
      // Cache the result
      await ProgressCacheService.setTodayGoals(userId, goalsList);
      
      return goalsList;
    } catch (error) {
      console.error('Error getting today goals:', error);
      return [];
    }
  }

  /**
   * Get flashcard statistics
   */
  private static async getFlashcardStats(userId: string): Promise<any> {
    try {
      // Use HolisticProgressService directly since it's now statically imported
      return await HolisticProgressService.getFlashcardStats(userId);
    } catch (error) {
      console.error('Error getting flashcard stats:', error);
      return {
        totalCards: 0,
        masteredCards: 0,
        dayStreak: 0,
        averageAccuracy: 0,
        bestTopic: 'None',
        weakestTopic: 'None',
      };
    }
  }

  /**
   * Calculate level progress
   */
  private static calculateLevelProgress(learningStats: any): any {
    if (!learningStats) {
      return {
        currentLevel: 'Beginner',
        experiencePoints: 0,
        nextLevelThreshold: 100,
        progressPercentage: 0,
      };
    }

    const levels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert', 'Master'];
    const thresholds = [0, 100, 500, 1000, 2500, 5000];
    
    let currentLevel = 'Beginner';
    let nextLevelThreshold = 100;
    let progressPercentage = 0;
    
    const xp = learningStats.experience_points || 0;
    
    for (let i = 0; i < thresholds.length - 1; i++) {
      if (xp >= thresholds[i] && xp < thresholds[i + 1]) {
        currentLevel = levels[i];
        nextLevelThreshold = thresholds[i + 1];
        progressPercentage = ((xp - thresholds[i]) / (thresholds[i + 1] - thresholds[i])) * 100;
        break;
      }
    }
    
    if (xp >= thresholds[thresholds.length - 1]) {
      currentLevel = levels[levels.length - 1];
      nextLevelThreshold = thresholds[thresholds.length - 1];
      progressPercentage = 100;
    }
    
    return {
      currentLevel,
      experiencePoints: xp,
      nextLevelThreshold,
      progressPercentage: Math.round(progressPercentage),
    };
  }

  /**
   * Clear cache for a user (useful when data changes)
   */
  static async clearUserCache(userId: string): Promise<void> {
    await ProgressCacheService.clearUserCache(userId);
  }

  /**
   * Force refresh progress data
   */
  static async forceRefresh(userId: string): Promise<ProgressInsights | null> {
    await this.clearUserCache(userId);
    return await this.getProgressInsights(userId, true);
  }
}

export default OptimizedProgressService;
