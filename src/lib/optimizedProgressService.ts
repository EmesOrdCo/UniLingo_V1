import { supabase } from './supabase';
import ProgressCacheService from './progressCacheService';
import MemoryCache from './memoryCache';
import { ProgressInsights, HolisticProgressService } from './holisticProgressService';
import { XPService } from './xpService';

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
      // Get current streak using HolisticProgressService for proper calculation
      const dailyStreak = await HolisticProgressService.getCurrentStreak(userId, 'daily_study');
      console.log('🔍 OptimizedProgressService - Streak data:', { 
        current: dailyStreak?.current_streak, 
        longest: dailyStreak?.longest_streak,
        userId 
      });
      
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

      // Calculate level progress using XPService for consistency
      const levelProgress = learningStats 
        ? XPService.calculateLevelInfo(learningStats.experience_points || 0)
        : {
            currentLevel: 'Beginner',
            experiencePoints: 0,
            nextLevelThreshold: 100,
            progressPercentage: 0,
          };

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
   * Clear all cached data for a user (useful for debugging)
   */
  static async clearUserCache(userId: string): Promise<void> {
    try {
      await ProgressCacheService.clearUserCache(userId);
      console.log('🗑️ Cleared all cached data for user:', userId);
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }

  /**
   * Get study dates with caching
   */
  static async getStudyDates(userId: string, forceRefresh: boolean = false): Promise<string[]> {
    try {
      // Try cache first (unless force refresh is requested)
      if (!forceRefresh) {
        const cachedDates = await ProgressCacheService.getStudyDates(userId);
        if (cachedDates) {
          return cachedDates;
        }
      }

      // Fetch from database
      const { data: activities } = await supabase
        .from('user_activities')
        .select('completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      const dates = activities?.map(activity => {
        // Use local date formatting to match the calendar's isStudyDay function
        const date = new Date(activity.completed_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }) || [];

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
   * Force refresh progress data
   */
  static async forceRefresh(userId: string): Promise<ProgressInsights | null> {
    await this.clearUserCache(userId);
    return await this.getProgressInsights(userId, true);
  }

  /**
   * Prefetch progress data in background for faster loading
   * Call this when the app starts or user navigates near the progress screen
   */
  static async prefetchProgressData(userId: string): Promise<void> {
    try {
      console.log('🚀 Prefetching progress data in background...');
      
      // Check if we already have fresh data
      const isFresh = await ProgressCacheService.isCacheFresh(`progress_insights_${userId}`);
      if (isFresh) {
        console.log('📦 Progress data already fresh, skipping prefetch');
        return;
      }
      
      // Prefetch in background without blocking
      this.fetchAndCacheProgressInsights(userId).catch(error => {
        console.log('⚠️ Background prefetch failed (non-critical):', error);
      });
      
      // Also prefetch study dates
      this.getStudyDates(userId).catch(error => {
        console.log('⚠️ Background prefetch of study dates failed (non-critical):', error);
      });
      
    } catch (error) {
      // Silent fail for prefetch
      console.log('⚠️ Prefetch error (non-critical):', error);
    }
  }

  /**
   * Get progress insights with immediate cache return and background refresh
   * This provides the fastest possible user experience
   */
  static async getProgressInsightsFast(userId: string): Promise<ProgressInsights | null> {
    try {
      const memoryKey = `progress_insights_${userId}`;
      
      // First, check memory cache for instant access
      const memoryData = MemoryCache.get<ProgressInsights>(memoryKey);
      if (memoryData) {
        console.log('⚡ Returning data from memory cache (instant)');
        return memoryData;
      }
      
      // Second, check AsyncStorage cache
      const cachedData = await ProgressCacheService.getProgressInsights(userId);
      if (cachedData) {
        console.log('📦 Returning cached progress data from storage');
        
        // Store in memory cache for next time
        MemoryCache.set(memoryKey, cachedData);
        
        // Check if cache is stale and refresh in background
        const isFresh = await ProgressCacheService.isCacheFresh(`progress_insights_${userId}`);
        if (!isFresh) {
          console.log('🔄 Refreshing stale data in background...');
          this.refreshProgressInsightsInBackground(userId);
        }
        
        return cachedData;
      }
      
      // No cache available, fetch fresh data
      console.log('🌐 No cache available, fetching fresh data...');
      const freshData = await this.fetchAndCacheProgressInsights(userId);
      
      // Store in memory cache
      if (freshData) {
        MemoryCache.set(memoryKey, freshData);
      }
      
      return freshData;
      
    } catch (error) {
      console.error('Error getting fast progress insights:', error);
      return null;
    }
  }
}

export default OptimizedProgressService;
