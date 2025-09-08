import { supabase } from './supabase';
import GlobalCompletionLock from './globalCompletionLock';

// Import refresh context to trigger UI updates
let refreshTrigger: (() => void) | null = null;

export const setRefreshTrigger = (trigger: () => void) => {
  refreshTrigger = trigger;
};

export interface GameActivityData {
  activityType: 'game';
  activityName: string;
  durationSeconds: number;
  score: number;
  maxScore: number;
  accuracyPercentage: number;
  gameData?: any;
}

export interface FlashcardActivityData {
  activityType: 'flashcard_review';
  activityName: string;
  durationSeconds: number;
  score: number;
  maxScore: number;
  accuracyPercentage: number;
  flashcardsReviewed: number;
}

export interface LessonActivityData {
  activityType: 'lesson';
  activityName: string;
  durationSeconds: number;
  score: number;
  maxScore: number;
  accuracyPercentage: number;
  lessonId: string;
}

export interface FlashcardProgressData {
  flashcardId: string;
  isCorrect: boolean;
  responseTime?: number;
}

export interface LessonProgressData {
  lessonId: string;
  totalScore: number;
  maxPossibleScore: number;
  exercisesCompleted: number;
  totalExercises: number;
  timeSpentSeconds: number;
  status: 'in_progress' | 'completed' | 'failed';
}

export class ProgressTrackingService {
  private static callCounter = 0;
  private static lastCallTime = 0;
  
  /**
   * Record a game activity
   */
  static async recordGameActivity(data: GameActivityData): Promise<void> {
    const recordId = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    const now = Date.now();
    this.callCounter++;
    
    // NUCLEAR OPTION: Block any calls within 1 second
    if (now - this.lastCallTime < 1000) {
      console.log(`🚫 [${recordId}] NUCLEAR BLOCK: Call within 1 second, BLOCKING COMPLETELY`);
      return;
    }
    this.lastCallTime = now;
    
    console.log(`📊 [${recordId}] ProgressTrackingService.recordGameActivity called - CALL #${this.callCounter}`);
    console.log(`📊 [${recordId}] ProgressTrackingService.recordGameActivity called with:`, {
      activityType: data.activityType,
      activityName: data.activityName,
      score: data.score,
      maxScore: data.maxScore,
      accuracyPercentage: data.accuracyPercentage,
      timestamp: timestamp
    });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert into user_activities
      const insertData = {
        user_id: user.id,
        activity_type: data.activityType,
        activity_name: data.activityName,
        duration_seconds: data.durationSeconds,
        score: data.score,
        max_score: data.maxScore,
        accuracy_percentage: data.accuracyPercentage,
        completed_at: new Date().toISOString(),
      };
      
      console.log(`📝 [${recordId}] Inserting data:`, insertData);
      
      const { data: insertResult, error: activityError } = await supabase
        .from('user_activities')
        .insert(insertData)
        .select();

      if (activityError) {
        console.error(`❌ [${recordId}] Database insert error:`, activityError);
        throw activityError;
      }
      
      console.log(`✅ [${recordId}] Database insert result:`, insertResult);

      console.log(`✅ [${recordId}] Database insert successful for user_activities`);

      // Update user_learning_stats
      await this.updateLearningStats(user.id, {
        totalGamesPlayed: 1,
        totalScoreEarned: data.score,
        totalStudyTimeHours: data.durationSeconds / 3600,
      });

      // Update daily goals
      await this.updateDailyGoals(user.id, 'games_played', 1);
      
      // Update study time goal (convert seconds to minutes)
      const studyTimeMinutes = Math.ceil(data.durationSeconds / 60);
      if (studyTimeMinutes > 0) {
        await this.updateDailyGoals(user.id, 'study_time', studyTimeMinutes);
      }

      // Update streaks
      await this.updateStreaks(user.id, 'game_play');

      console.log(`🎯 [${recordId}] Game activity recorded successfully - ALL OPERATIONS COMPLETE`);
      
      // Trigger UI refresh
      if (refreshTrigger) {
        refreshTrigger();
      }
    } catch (error) {
      console.error(`❌ [${recordId}] Error recording game activity:`, error);
      console.error(`❌ [${recordId}] Error details:`, {
        message: error.message,
        stack: error.stack,
        data: data
      });
      throw error;
    }
  }

  /**
   * Record flashcard review activity
   */
  static async recordFlashcardActivity(data: FlashcardActivityData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert into user_activities
      const { error: activityError } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: data.activityType,
          activity_name: data.activityName,
          duration_seconds: data.durationSeconds,
          score: data.score,
          max_score: data.maxScore,
          accuracy_percentage: data.accuracyPercentage,
          completed_at: new Date().toISOString(),
        });

      if (activityError) throw activityError;

      // Update user_learning_stats
      await this.updateLearningStats(user.id, {
        totalFlashcardsReviewed: data.flashcardsReviewed,
        totalScoreEarned: data.score,
        totalStudyTimeHours: data.durationSeconds / 3600,
      });

      // Update daily goals
      await this.updateDailyGoals(user.id, 'flashcards_reviewed', data.flashcardsReviewed);
      
      // Update study time goal (convert seconds to minutes)
      const studyTimeMinutes = Math.ceil(data.durationSeconds / 60);
      if (studyTimeMinutes > 0) {
        await this.updateDailyGoals(user.id, 'study_time', studyTimeMinutes);
      }

      // Update streaks
      await this.updateStreaks(user.id, 'flashcard_review');

      console.log('✅ Flashcard activity recorded successfully');
      
      // Trigger UI refresh
      if (refreshTrigger) {
        refreshTrigger();
      }
    } catch (error) {
      console.error('❌ Error recording flashcard activity:', error);
      throw error;
    }
  }

  /**
   * Record lesson activity
   */
  static async recordLessonActivity(data: LessonActivityData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert into user_activities
      const { error: activityError } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: data.activityType,
          activity_name: data.activityName,
          duration_seconds: data.durationSeconds,
          score: data.score,
          max_score: data.maxScore,
          accuracy_percentage: data.accuracyPercentage,
          completed_at: new Date().toISOString(),
        });

      if (activityError) throw activityError;

      // Update user_learning_stats
      await this.updateLearningStats(user.id, {
        totalLessonsCompleted: 1,
        totalScoreEarned: data.score,
        totalStudyTimeHours: data.durationSeconds / 3600,
      });

      // Update daily goals
      await this.updateDailyGoals(user.id, 'lessons_completed', 1);
      
      // Update study time goal (convert seconds to minutes)
      const studyTimeMinutes = Math.ceil(data.durationSeconds / 60);
      if (studyTimeMinutes > 0) {
        await this.updateDailyGoals(user.id, 'study_time', studyTimeMinutes);
      }

      // Update streaks
      await this.updateStreaks(user.id, 'lesson_completion');

      console.log('✅ Lesson activity recorded successfully');
      
      // Trigger UI refresh
      if (refreshTrigger) {
        refreshTrigger();
      }
    } catch (error) {
      console.error('❌ Error recording lesson activity:', error);
      throw error;
    }
  }

  /**
   * Update individual flashcard progress
   */
  static async updateFlashcardProgress(data: FlashcardProgressData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if progress record exists
      const { data: existingProgress } = await supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('flashcard_id', data.flashcardId)
        .single();

      const now = new Date().toISOString();

      if (existingProgress) {
        // Update existing progress
        const updates: any = {
          last_reviewed: now,
          updated_at: now,
        };

        if (data.isCorrect) {
          updates.correct_attempts = (existingProgress.correct_attempts || 0) + 1;
          updates.consecutive_correct = (existingProgress.consecutive_correct || 0) + 1;
          updates.consecutive_incorrect = 0;
        } else {
          updates.incorrect_attempts = (existingProgress.incorrect_attempts || 0) + 1;
          updates.consecutive_incorrect = (existingProgress.consecutive_incorrect || 0) + 1;
          updates.consecutive_correct = 0;
        }

        // Calculate mastery level (simple algorithm)
        const totalAttempts = updates.correct_attempts + updates.incorrect_attempts;
        const masteryLevel = Math.round((updates.correct_attempts / totalAttempts) * 100);
        updates.mastery_level = masteryLevel;
        updates.is_mastered = masteryLevel >= 80;

        // Calculate next review date (spaced repetition)
        const daysUntilNext = data.isCorrect ? 
          Math.min(30, Math.pow(2, updates.consecutive_correct)) : 
          Math.max(1, Math.floor(updates.consecutive_incorrect / 2));
        
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNext);
        updates.next_review_date = nextReviewDate.toISOString();

        // Calculate retention score
        const retentionScore = Math.max(0, masteryLevel - (updates.consecutive_incorrect * 5));
        updates.retention_score = retentionScore;

        const { error } = await supabase
          .from('user_flashcard_progress')
          .update(updates)
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new progress record
        const newProgress = {
          user_id: user.id,
          flashcard_id: data.flashcardId,
          correct_attempts: data.isCorrect ? 1 : 0,
          incorrect_attempts: data.isCorrect ? 0 : 1,
          consecutive_correct: data.isCorrect ? 1 : 0,
          consecutive_incorrect: data.isCorrect ? 0 : 1,
          mastery_level: data.isCorrect ? 100 : 0,
          is_mastered: data.isCorrect,
          last_reviewed: now,
          next_review_date: new Date(Date.now() + (data.isCorrect ? 2 : 1) * 24 * 60 * 60 * 1000).toISOString(),
          retention_score: data.isCorrect ? 100 : 0,
          created_at: now,
          updated_at: now,
        };

        const { error } = await supabase
          .from('user_flashcard_progress')
          .insert([newProgress]);

        if (error) throw error;
      }

      console.log('✅ Flashcard progress updated successfully');
    } catch (error) {
      console.error('❌ Error updating flashcard progress:', error);
      throw error;
    }
  }

  /**
   * Update lesson progress
   */
  static async updateLessonProgress(data: LessonProgressData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if progress record exists
      const { data: existingProgress } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', data.lessonId)
        .single();

      const now = new Date().toISOString();

      if (existingProgress) {
        // Update existing progress
        const updates: any = {
          completed_at: data.status === 'completed' ? now : null,
          total_score: data.totalScore,
          max_possible_score: data.maxPossibleScore,
          exercises_completed: data.exercisesCompleted,
          total_exercises: data.totalExercises,
          time_spent_seconds: data.timeSpentSeconds,
          status: data.status,
        };

        const { error } = await supabase
          .from('lesson_progress')
          .update(updates)
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new progress record
        const newProgress = {
          user_id: user.id,
          lesson_id: data.lessonId,
          started_at: now,
          completed_at: data.status === 'completed' ? now : null,
          total_score: data.totalScore,
          max_possible_score: data.maxPossibleScore,
          exercises_completed: data.exercisesCompleted,
          total_exercises: data.totalExercises,
          time_spent_seconds: data.timeSpentSeconds,
          status: data.status,
        };

        const { error } = await supabase
          .from('lesson_progress')
          .insert([newProgress]);

        if (error) throw error;
      }

      console.log('✅ Lesson progress updated successfully');
    } catch (error) {
      console.error('❌ Error updating lesson progress:', error);
      throw error;
    }
  }

  /**
   * Update user learning stats
   */
  private static async updateLearningStats(userId: string, updates: {
    totalGamesPlayed?: number;
    totalLessonsCompleted?: number;
    totalFlashcardsReviewed?: number;
    totalScoreEarned?: number;
    totalStudyTimeHours?: number;
  }): Promise<void> {
    try {
      // Check if stats record exists
      const { data: existingStats } = await supabase
        .from('user_learning_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      const now = new Date().toISOString();

      if (existingStats) {
        // Update existing stats
        const newStats: any = {
          updated_at: now,
        };

        if (updates.totalGamesPlayed) {
          newStats.total_games_played = (existingStats.total_games_played || 0) + updates.totalGamesPlayed;
        }
        if (updates.totalLessonsCompleted) {
          newStats.total_lessons_completed = (existingStats.total_lessons_completed || 0) + updates.totalLessonsCompleted;
        }
        if (updates.totalFlashcardsReviewed) {
          newStats.total_flashcards_reviewed = (existingStats.total_flashcards_reviewed || 0) + updates.totalFlashcardsReviewed;
        }
        if (updates.totalScoreEarned) {
          newStats.total_score_earned = (existingStats.total_score_earned || 0) + updates.totalScoreEarned;
        }
        if (updates.totalStudyTimeHours) {
          newStats.total_study_time_hours = (existingStats.total_study_time_hours || 0) + updates.totalStudyTimeHours;
        }

        const { error } = await supabase
          .from('user_learning_stats')
          .update(newStats)
          .eq('id', existingStats.id);

        if (error) throw error;
      } else {
        // Create new stats record
        const newStats = {
          user_id: userId,
          total_study_time_hours: updates.totalStudyTimeHours || 0,
          total_lessons_completed: updates.totalLessonsCompleted || 0,
          total_flashcards_reviewed: updates.totalFlashcardsReviewed || 0,
          total_games_played: updates.totalGamesPlayed || 0,
          total_score_earned: updates.totalScoreEarned || 0,
          average_lesson_accuracy: 0,
          favorite_subject: null,
          best_performance_date: null,
          current_level: 'Beginner',
          experience_points: updates.totalScoreEarned || 0,
          created_at: now,
          updated_at: now,
        };

        const { error } = await supabase
          .from('user_learning_stats')
          .insert([newStats]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('❌ Error updating learning stats:', error);
      throw error;
    }
  }

  /**
   * Update daily goals
   */
  private static async updateDailyGoals(userId: string, goalType: string, increment: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if daily goal exists for today
      const { data: existingGoal } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_type', goalType)
        .eq('goal_date', today)
        .single();

      if (existingGoal) {
        // Update existing goal
        const newCurrentValue = (existingGoal.current_value || 0) + increment;
        const isCompleted = newCurrentValue >= existingGoal.target_value;

        const { error } = await supabase
          .from('user_daily_goals')
          .update({
            current_value: newCurrentValue,
            completed: isCompleted,
          })
          .eq('id', existingGoal.id);

        if (error) throw error;
      } else {
        // Create new daily goal (with default target)
        const defaultTargets: { [key: string]: number } = {
          'games_played': 3,
          'lessons_completed': 2,
          'flashcards_reviewed': 20,
          'study_time': 30, // minutes
        };

        const { error } = await supabase
          .from('user_daily_goals')
          .insert([{
            user_id: userId,
            goal_type: goalType,
            target_value: defaultTargets[goalType] || 1,
            current_value: increment,
            goal_date: today,
            completed: increment >= (defaultTargets[goalType] || 1),
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('❌ Error updating daily goals:', error);
      throw error;
    }
  }

  /**
   * Update streaks
   */
  private static async updateStreaks(userId: string, streakType: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if streak exists
      const { data: existingStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('streak_type', streakType)
        .single();

      if (existingStreak) {
        const lastActivityDate = existingStreak.last_activity_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newCurrentStreak = existingStreak.current_streak;
        let newStartDate = existingStreak.start_date;

        if (lastActivityDate === yesterdayStr || lastActivityDate === today) {
          // Streak continues
          if (lastActivityDate === yesterdayStr) {
            newCurrentStreak += 1;
          }
        } else {
          // Streak broken, reset
          newCurrentStreak = 1;
          newStartDate = today;
        }

        const newLongestStreak = Math.max(existingStreak.longest_streak, newCurrentStreak);

        const { error } = await supabase
          .from('user_streaks')
          .update({
            current_streak: newCurrentStreak,
            longest_streak: newLongestStreak,
            last_activity_date: today,
            start_date: newStartDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingStreak.id);

        if (error) throw error;
      } else {
        // Create new streak
        const { error } = await supabase
          .from('user_streaks')
          .insert([{
            user_id: userId,
            streak_type: streakType,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
            start_date: today,
            updated_at: new Date().toISOString(),
          }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('❌ Error updating streaks:', error);
      throw error;
    }
  }
}
