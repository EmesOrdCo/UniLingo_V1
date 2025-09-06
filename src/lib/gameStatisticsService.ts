import { supabase } from './supabase';

export interface GameStatistics {
  gamesPlayedToday: number;
  totalGamesPlayed: number;
  averageAccuracy: number;
  totalGamingTime: number; // in minutes
  level: number;
  xp: number;
  nextLevelXp: number;
  bestScore: number;
  averageScore: number;
}

export interface GameActivity {
  id: string;
  activity_name: string;
  score: number;
  max_score: number;
  accuracy_percentage: number;
  duration_seconds: number;
  completed_at: string;
}

export class GameStatisticsService {
  
  /**
   * Get comprehensive game statistics for a user
   */
  static async getGameStatistics(userId: string): Promise<GameStatistics> {
    try {
      console.log('🎮 Fetching game statistics for user:', userId);
      
      // Get today's date for filtering
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00.000Z`;
      const todayEnd = `${today}T23:59:59.999Z`;
      
      // Get user learning stats (contains aggregated data)
      const { data: learningStats, error: statsError } = await supabase
        .from('user_learning_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (statsError) {
        console.error('❌ Error fetching learning stats:', statsError);
        throw statsError;
      }
      
      // Get today's game activities
      const { data: todayActivities, error: todayError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', 'game')
        .gte('completed_at', todayStart)
        .lte('completed_at', todayEnd);
      
      if (todayError) {
        console.error('❌ Error fetching today activities:', todayError);
        throw todayError;
      }
      
      // Get all game activities for accuracy calculation
      const { data: allGameActivities, error: allError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', 'game')
        .order('completed_at', { ascending: false });
      
      if (allError) {
        console.error('❌ Error fetching all game activities:', allError);
        throw allError;
      }
      
      // Calculate statistics
      const gamesPlayedToday = todayActivities?.length || 0;
      const totalGamesPlayed = allGameActivities?.length || 0;
      
      // Calculate average accuracy from all game activities
      const averageAccuracy = allGameActivities && allGameActivities.length > 0
        ? Math.round(allGameActivities.reduce((sum, activity) => sum + (activity.accuracy_percentage || 0), 0) / allGameActivities.length)
        : 0;
      
      // Calculate total gaming time in minutes
      const totalGamingTime = allGameActivities && allGameActivities.length > 0
        ? Math.round(allGameActivities.reduce((sum, activity) => sum + (activity.duration_seconds || 0), 0) / 60)
        : 0;
      
      // Calculate best and average scores
      const scores = allGameActivities?.map(activity => activity.score || 0) || [];
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
      
      // Get XP and level info
      const xp = learningStats?.experience_points || 0;
      const level = this.calculateLevel(xp);
      const nextLevelXp = this.getNextLevelXP(level);
      
      const stats: GameStatistics = {
        gamesPlayedToday,
        totalGamesPlayed,
        averageAccuracy,
        totalGamingTime,
        level,
        xp,
        nextLevelXp,
        bestScore,
        averageScore,
      };
      
      console.log('✅ Game statistics calculated:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Error getting game statistics:', error);
      
      // Return default stats on error
      return {
        gamesPlayedToday: 0,
        totalGamesPlayed: 0,
        averageAccuracy: 0,
        totalGamingTime: 0,
        level: 1,
        xp: 0,
        nextLevelXp: 100,
        bestScore: 0,
        averageScore: 0,
      };
    }
  }
  
  /**
   * Get recent game activities for a user
   */
  static async getRecentGameActivities(userId: string, limit: number = 10): Promise<GameActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', 'game')
        .order('completed_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('❌ Error getting recent game activities:', error);
      return [];
    }
  }
  
  /**
   * Track a completed game activity
   */
  static async trackGameActivity(
    userId: string,
    gameName: string,
    score: number,
    maxScore: number,
    accuracyPercentage: number,
    durationSeconds: number
  ): Promise<boolean> {
    try {
      console.log('🎮 Tracking game activity:', {
        userId,
        gameName,
        score,
        maxScore,
        accuracyPercentage,
        durationSeconds
      });
      
      // Insert into user_activities table
      const { error: activityError } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: 'game',
          activity_name: gameName,
          score,
          max_score: maxScore,
          accuracy_percentage: accuracyPercentage,
          duration_seconds: durationSeconds,
          completed_at: new Date().toISOString(),
        });
      
      if (activityError) {
        console.error('❌ Error tracking game activity:', activityError);
        throw activityError;
      }
      
      // Update user_learning_stats (if the RPC function exists)
      // Note: This RPC function may need to be created in Supabase
      const { error: statsError } = await supabase.rpc('increment_game_stats', {
        user_id: userId,
        games_played: 1,
        score_earned: score,
        gaming_time_seconds: durationSeconds,
        accuracy: accuracyPercentage
      });
      
      if (statsError) {
        console.error('❌ Error updating game stats:', statsError);
        // Don't throw here as the activity was already tracked
      }
      
      console.log('✅ Game activity tracked successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Error tracking game activity:', error);
      return false;
    }
  }
  
  /**
   * Calculate level based on XP
   */
  private static calculateLevel(xp: number): number {
    // Level 1: 0-99 XP
    // Level 2: 100-299 XP  
    // Level 3: 300-599 XP
    // Level 4: 600-999 XP
    // Level 5+: 1000+ XP
    
    if (xp < 100) return 1;
    if (xp < 300) return 2;
    if (xp < 600) return 3;
    if (xp < 1000) return 4;
    
    // For level 5+, calculate based on 1000 XP per level
    return Math.floor((xp - 1000) / 1000) + 5;
  }
  
  /**
   * Get XP required for next level
   */
  private static getNextLevelXP(currentLevel: number): number {
    if (currentLevel === 1) return 100;
    if (currentLevel === 2) return 300;
    if (currentLevel === 3) return 600;
    if (currentLevel === 4) return 1000;
    
    // For level 5+, next level is current level + 1
    return (currentLevel + 1) * 1000;
  }
  
  /**
   * Get game statistics summary for dashboard
   */
  static async getGameStatsSummary(userId: string): Promise<{
    todayGames: number;
    totalGames: number;
    averageAccuracy: number;
    totalTime: number;
    level: number;
    xp: number;
    nextLevelXp: number;
  }> {
    try {
      const stats = await this.getGameStatistics(userId);
      
      return {
        todayGames: stats.gamesPlayedToday,
        totalGames: stats.totalGamesPlayed,
        averageAccuracy: stats.averageAccuracy,
        totalTime: stats.totalGamingTime,
        level: stats.level,
        xp: stats.xp,
        nextLevelXp: stats.nextLevelXp,
      };
    } catch (error) {
      console.error('❌ Error getting game stats summary:', error);
      return {
        todayGames: 0,
        totalGames: 0,
        averageAccuracy: 0,
        totalTime: 0,
        level: 1,
        xp: 0,
        nextLevelXp: 100,
      };
    }
  }
}
