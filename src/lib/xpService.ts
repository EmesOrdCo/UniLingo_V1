import { supabase } from './supabase';

export interface XPCalculation {
  baseXP: number;
  accuracyBonus: number;
  typeBonus: number;
  streakBonus: number;
  totalXP: number;
}

export interface LevelInfo {
  currentLevel: string;
  experiencePoints: number;
  nextLevelThreshold: number;
  progressPercentage: number;
  xpToNextLevel: number;
}

export class XPService {
  // XP thresholds for different levels
  private static readonly LEVELS = [
    { name: 'Beginner', threshold: 0 },
    { name: 'Elementary', threshold: 100 },
    { name: 'Intermediate', threshold: 500 },
    { name: 'Advanced', threshold: 1000 },
    { name: 'Expert', threshold: 2500 },
    { name: 'Master', threshold: 5000 },
  ];

  // Base XP values for different activity types (REDUCED)
  private static readonly ACTIVITY_BASE_XP = {
    lesson: 15,
    flashcard: 3,
    game: 8,
    exercise: 5,
  };

  // Accuracy bonus thresholds (REDUCED)
  private static readonly ACCURACY_BONUS = {
    90: 6,  // 90%+ accuracy = 6 bonus XP
    80: 4,  // 80%+ accuracy = 4 bonus XP
    70: 3,  // 70%+ accuracy = 3 bonus XP
    0: 1,   // Any accuracy = 1 bonus XP
  };

  // Activity type bonuses (REDUCED)
  private static readonly TYPE_BONUS = {
    lesson: 8,
    flashcard: 5,
    game: 6,
    exercise: 3,
  };

  /**
   * Calculate XP for a completed activity
   */
  static calculateXP(
    activityType: 'lesson' | 'flashcard' | 'game' | 'exercise',
    score: number,
    maxScore: number,
    accuracyPercentage: number,
    currentStreak: number = 0
  ): XPCalculation {
    // Base XP from score
    const baseXP = Math.round((score / maxScore) * this.ACTIVITY_BASE_XP[activityType]);

    // Accuracy bonus
    let accuracyBonus = this.ACCURACY_BONUS[0];
    if (accuracyPercentage >= 90) accuracyBonus = this.ACCURACY_BONUS[90];
    else if (accuracyPercentage >= 80) accuracyBonus = this.ACCURACY_BONUS[80];
    else if (accuracyPercentage >= 70) accuracyBonus = this.ACCURACY_BONUS[70];

    // Activity type bonus
    const typeBonus = this.TYPE_BONUS[activityType];

    // Streak bonus (max 3 XP for 7+ day streak) - REDUCED
    const streakBonus = Math.min(3, Math.floor(currentStreak / 7) * 1);

    const totalXP = baseXP + accuracyBonus + typeBonus + streakBonus;

    return {
      baseXP,
      accuracyBonus,
      typeBonus,
      streakBonus,
      totalXP,
    };
  }

  /**
   * Award XP to a user for completing an activity
   */
  static async awardXP(
    userId: string,
    activityType: 'lesson' | 'flashcard' | 'game' | 'exercise',
    score: number,
    maxScore: number,
    accuracyPercentage: number,
    activityName?: string,
    durationSeconds?: number
  ): Promise<XPCalculation | null> {
    try {
      console.log('🎯 Awarding XP for activity:', {
        userId,
        activityType,
        score,
        maxScore,
        accuracyPercentage,
        activityName,
      });

      // Get current streak for bonus calculation
      const currentStreak = await this.getCurrentStreak(userId);

      // Calculate XP
      const xpCalculation = this.calculateXP(
        activityType,
        score,
        maxScore,
        accuracyPercentage,
        currentStreak
      );

      console.log('🎯 XP calculation:', xpCalculation);

      // Update user_learning_stats
      const { data: currentStats, error: statsError } = await supabase
        .from('user_learning_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (statsError) {
        console.error('❌ Error fetching current stats:', statsError);
        return null;
      }

      // Initialize stats if they don't exist
      if (!currentStats) {
        await this.initializeUserStats(userId);
      }

      // Calculate new stats
      const newExperiencePoints = (currentStats?.experience_points || 0) + xpCalculation.totalXP;
      const newTotalScore = (currentStats?.total_score_earned || 0) + score;

      // Update activity-specific counters
      const updateData: any = {
        experience_points: newExperiencePoints,
        total_score_earned: newTotalScore,
        updated_at: new Date().toISOString(),
      };

      // Update activity-specific counters
      switch (activityType) {
        case 'lesson':
          updateData.total_lessons_completed = (currentStats?.total_lessons_completed || 0) + 1;
          break;
        case 'flashcard':
          updateData.total_flashcards_reviewed = (currentStats?.total_flashcards_reviewed || 0) + 1;
          break;
        case 'game':
          updateData.total_games_played = (currentStats?.total_games_played || 0) + 1;
          break;
      }

      // Update average lesson accuracy if it's a lesson
      if (activityType === 'lesson') {
        const currentAccuracy = currentStats?.average_lesson_accuracy || 0;
        const totalLessons = (currentStats?.total_lessons_completed || 0) + 1;
        const newAverageAccuracy = ((currentAccuracy * (totalLessons - 1)) + accuracyPercentage) / totalLessons;
        updateData.average_lesson_accuracy = Math.round(newAverageAccuracy * 100) / 100;
      }

      // Update the user_learning_stats
      let updateError;
      if (currentStats) {
        // Update existing record
        const { error } = await supabase
          .from('user_learning_stats')
          .update(updateData)
          .eq('user_id', userId);
        updateError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_learning_stats')
          .insert({
            user_id: userId,
            ...updateData,
          });
        updateError = error;
      }

      if (updateError) {
        console.error('❌ Error updating learning stats:', updateError);
        return null;
      }

      // Log the activity
      await this.logActivity(userId, activityType, score, maxScore, accuracyPercentage, xpCalculation.totalXP, activityName, durationSeconds);

      // Update streak for any activity completion
      try {
        const { HolisticProgressService } = await import('./holisticProgressService');
        await HolisticProgressService.updateStreak(userId, 'daily_study');
        console.log('✅ Streak updated for activity completion');
      } catch (streakError) {
        console.error('❌ Error updating streak:', streakError);
        // Don't fail the XP award if streak update fails
      }

      console.log('✅ XP awarded successfully:', xpCalculation.totalXP);
      return xpCalculation;
    } catch (error) {
      console.error('❌ Error awarding XP:', error);
      return null;
    }
  }

  /**
   * Get current level information for a user
   */
  static async getLevelInfo(userId: string): Promise<LevelInfo | null> {
    try {
      const { data: stats, error } = await supabase
        .from('user_learning_stats')
        .select('experience_points, current_level')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching level info:', error);
        return null;
      }

      if (!stats) {
        return {
          currentLevel: 'Beginner',
          experiencePoints: 0,
          nextLevelThreshold: 100,
          progressPercentage: 0,
          xpToNextLevel: 100,
        };
      }

      return this.calculateLevelInfo(stats.experience_points);
    } catch (error) {
      console.error('❌ Error getting level info:', error);
      return null;
    }
  }

  /**
   * Calculate level information from XP
   */
  static calculateLevelInfo(experiencePoints: number): LevelInfo {
    let currentLevel = this.LEVELS[0];
    let nextLevel = this.LEVELS[1];

    for (let i = 0; i < this.LEVELS.length - 1; i++) {
      if (experiencePoints >= this.LEVELS[i].threshold && experiencePoints < this.LEVELS[i + 1].threshold) {
        currentLevel = this.LEVELS[i];
        nextLevel = this.LEVELS[i + 1];
        break;
      }
    }

    // If user is at max level
    if (experiencePoints >= this.LEVELS[this.LEVELS.length - 1].threshold) {
      currentLevel = this.LEVELS[this.LEVELS.length - 1];
      nextLevel = this.LEVELS[this.LEVELS.length - 1];
    }

    const progressInLevel = experiencePoints - currentLevel.threshold;
    const levelRange = nextLevel.threshold - currentLevel.threshold;
    const progressPercentage = levelRange > 0 ? Math.min(100, Math.max(0, (progressInLevel / levelRange) * 100)) : 100;
    const xpToNextLevel = Math.max(0, nextLevel.threshold - experiencePoints);

    return {
      currentLevel: currentLevel.name,
      experiencePoints,
      nextLevelThreshold: nextLevel.threshold,
      progressPercentage: Math.round(progressPercentage),
      xpToNextLevel,
    };
  }

  /**
   * Update user's level based on current XP
   */
  static async updateUserLevel(userId: string): Promise<string | null> {
    try {
      const levelInfo = await this.getLevelInfo(userId);
      if (!levelInfo) return null;

      const { error } = await supabase
        .from('user_learning_stats')
        .update({
          current_level: levelInfo.currentLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating user level:', error);
        return null;
      }

      return levelInfo.currentLevel;
    } catch (error) {
      console.error('❌ Error updating user level:', error);
      return null;
    }
  }

  /**
   * Get current streak for XP bonus calculation
   */
  private static async getCurrentStreak(userId: string): Promise<number> {
    try {
      const { data: streak, error } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .eq('streak_type', 'daily_study')
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching streak:', error);
        return 0;
      }

      return streak?.current_streak || 0;
    } catch (error) {
      console.error('❌ Error getting current streak:', error);
      return 0;
    }
  }

  /**
   * Initialize user stats if they don't exist
   */
  private static async initializeUserStats(userId: string): Promise<void> {
    try {
      // Check if record already exists
      const { data: existing } = await supabase
        .from('user_learning_stats')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('user_learning_stats')
          .insert({
            user_id: userId,
            total_study_time_hours: 0,
            total_lessons_completed: 0,
            total_flashcards_reviewed: 0,
            total_games_played: 0,
            total_score_earned: 0,
            average_lesson_accuracy: 0,
            current_level: 'Beginner',
            experience_points: 0,
          });
        console.log('✅ User stats initialized for user:', userId);
      } else {
        console.log('ℹ️ User stats already exist for user:', userId);
      }
    } catch (error) {
      console.error('❌ Error initializing user stats:', error);
    }
  }

  /**
   * Log activity for tracking
   */
  private static async logActivity(
    userId: string,
    activityType: string,
    score: number,
    maxScore: number,
    accuracyPercentage: number,
    xpEarned: number,
    activityName?: string,
    durationSeconds?: number
  ): Promise<void> {
    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_name: activityName,
          score,
          max_score: maxScore,
          accuracy_percentage: accuracyPercentage,
          duration_seconds: durationSeconds || 0,
          completed_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('❌ Error logging activity:', error);
    }
  }

  /**
   * Get XP breakdown for debugging
   */
  static async getXPBreakdown(userId: string): Promise<{
    totalXP: number;
    levelInfo: LevelInfo;
    recentActivities: any[];
  } | null> {
    try {
      const { data: stats } = await supabase
        .from('user_learning_stats')
        .select('experience_points')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: activities } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (!stats) return null;

      return {
        totalXP: stats.experience_points,
        levelInfo: this.calculateLevelInfo(stats.experience_points),
        recentActivities: activities || [],
      };
    } catch (error) {
      console.error('❌ Error getting XP breakdown:', error);
      return null;
    }
  }

  /**
   * Test function to manually award XP for debugging
   */
  static async testAwardXP(userId: string): Promise<XPCalculation | null> {
    try {
      console.log('🧪 Testing XP award for user:', userId);
      
      // Award 50 XP for a test lesson
      const result = await this.awardXP(
        userId,
        'lesson',
        8,
        10,
        80,
        'Test Lesson'
      );
      
      console.log('🧪 Test XP award result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in test XP award:', error);
      return null;
    }
  }
}
