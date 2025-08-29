import { supabase } from './supabase';

export interface UserActivity {
  id?: string;
  user_id: string;
  activity_type: 'lesson' | 'flashcard' | 'game' | 'exercise';
  activity_id?: string;
  activity_name?: string;
  duration_seconds: number;
  score: number;
  max_score: number;
  accuracy_percentage: number;
  completed_at: Date;
}

export interface StudySession {
  id?: string;
  user_id: string;
  session_type: 'lesson' | 'flashcard' | 'game' | 'mixed';
  start_time: Date;
  end_time?: Date;
  total_duration_seconds: number;
  activities_completed: number;
  total_score: number;
  average_accuracy: number;
  study_environment?: string;
  energy_level?: number;
  focus_level?: number;
}

export interface UserStreak {
  id?: string;
  user_id: string;
  streak_type: 'daily_study' | 'weekly_lessons' | 'monthly_goals';
  current_streak: number;
  longest_streak: number;
  last_activity_date?: Date;
  start_date: Date;
}

export interface DailyGoal {
  id?: string;
  goal_type: 'study_time' | 'lessons_completed' | 'flashcards_reviewed' | 'games_played';
  target_value: number;
  current_value: number;
  goal_date: Date;
  completed: boolean;
}

export interface ProgressSummary {
  id?: string;
  user_id: string;
  summary_date: Date;
  total_study_time_minutes: number;
  lessons_completed: number;
  flashcards_reviewed: number;
  games_played: number;
  total_score: number;
  average_accuracy: number;
  streak_maintained: boolean;
  goals_achieved: number;
  total_goals: number;
}

export interface LearningStats {
  id?: string;
  user_id: string;
  total_study_time_hours: number;
  total_lessons_completed: number;
  total_flashcards_reviewed: number;
  total_games_played: number;
  total_score_earned: number;
  average_lesson_accuracy: number;
  favorite_subject?: string;
  best_performance_date?: Date;
  current_level: string;
  experience_points: number;
}

export interface UserAchievement {
  id?: string;
  user_id: string;
  achievement_type: 'streak' | 'accuracy' | 'time' | 'completion';
  achievement_name: string;
  achievement_description: string;
  earned_at: Date;
  achievement_data?: any;
}

export interface ProgressInsights {
  currentStreak: number;
  longestStreak: number;
  todayProgress: ProgressSummary | null;
  weeklyProgress: ProgressSummary[];
  monthlyProgress: ProgressSummary[];
  recentActivities: UserActivity[];
  upcomingGoals: DailyGoal[];
  achievements: UserAchievement[];
  levelProgress: {
    currentLevel: string;
    experiencePoints: number;
    nextLevelThreshold: number;
    progressPercentage: number;
  };
}

export class HolisticProgressService {
  // =====================================================
  // ACTIVITY TRACKING
  // =====================================================

  static async trackActivity(activity: Omit<UserActivity, 'id' | 'completed_at'>): Promise<UserActivity | null> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .insert({
          ...activity,
          completed_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tracking activity:', error);
      return null;
    }
  }

  static async getRecentActivities(userId: string, limit: number = 10): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  // =====================================================
  // STUDY SESSIONS
  // =====================================================

  static async startStudySession(session: Omit<StudySession, 'id' | 'start_time'>): Promise<StudySession | null> {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          ...session,
          start_time: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting study session:', error);
      return null;
    }
  }

  static async endStudySession(sessionId: string, endData: Partial<StudySession>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('study_sessions')
        .update({
          ...endData,
          end_time: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error ending study session:', error);
      return false;
    }
  }

  // =====================================================
  // STREAK MANAGEMENT
  // =====================================================

  static async updateStreak(userId: string, streakType: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current streak
      const { data: currentStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('streak_type', streakType)
        .maybeSingle();

      if (currentStreak) {
        const lastActivity = currentStreak.last_activity_date;
        const daysSinceLastActivity = Math.floor(
          (new Date(today).getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastActivity === 1) {
          // Continue streak
          const newStreak = currentStreak.current_streak + 1;
          const longestStreak = Math.max(newStreak, currentStreak.longest_streak);
          
          await supabase
            .from('user_streaks')
            .update({
              current_streak: newStreak,
              longest_streak: longestStreak,
              last_activity_date: today,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentStreak.id);
        } else if (daysSinceLastActivity > 1) {
          // Reset streak
          await supabase
            .from('user_streaks')
            .update({
              current_streak: 1,
              last_activity_date: today,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentStreak.id);
        }
      } else {
        // Create new streak
        await supabase
          .from('user_streaks')
          .insert({
            user_id: userId,
            streak_type: streakType,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
            start_date: today,
          });
      }

      return true;
    } catch (error) {
      console.error('Error updating streak:', error);
      return false;
    }
  }

  static async getCurrentStreak(userId: string, streakType: string): Promise<UserStreak | null> {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('streak_type', streakType)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching current streak:', error);
      return null;
    }
  }

  // =====================================================
  // DAILY GOALS
  // =====================================================

  static async setDailyGoal(userId: string, goal: Omit<DailyGoal, 'id' | 'goal_date' | 'completed'>): Promise<DailyGoal | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('user_daily_goals')
        .insert({
          ...goal,
          user_id: userId,
          goal_date: today,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting daily goal:', error);
      return null;
    }
  }

  static async updateGoalProgress(userId: string, goalType: string, progress: number): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: goal } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_type', goalType)
        .eq('goal_date', today)
        .maybeSingle();

      if (goal) {
        const newProgress = goal.current_value + progress;
        const completed = newProgress >= goal.target_value;
        
        await supabase
          .from('user_daily_goals')
          .update({
            current_value: newProgress,
            completed,
          })
          .eq('id', goal.id);
      }

      return true;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      return false;
    }
  }

  static async getTodayGoals(userId: string): Promise<DailyGoal[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_date', today);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching today goals:', error);
      return [];
    }
  }

  // =====================================================
  // PROGRESS ANALYTICS
  // =====================================================

  static async getProgressInsights(userId: string): Promise<ProgressInsights | null> {
    try {
      // Get current streak
      const dailyStreak = await this.getCurrentStreak(userId, 'daily_study');
      
      // Get today's progress
      const today = new Date().toISOString().split('T')[0];
      const { data: todayProgress } = await supabase
        .from('user_progress_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('summary_date', today)
        .maybeSingle();

      // Get weekly progress (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weeklyProgress } = await supabase
        .from('user_progress_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('summary_date', weekAgo.toISOString().split('T')[0])
        .order('summary_date', { ascending: true });

      // Get monthly progress (last 30 days)
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const { data: monthlyProgress } = await supabase
        .from('user_progress_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('summary_date', monthAgo.toISOString().split('T')[0])
        .order('summary_date', { ascending: true });

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
        .maybeSingle(); // Use maybeSingle() to handle no rows

      // Calculate level progress
      const levelProgress = this.calculateLevelProgress(learningStats);

      return {
        currentStreak: dailyStreak?.current_streak || 0,
        longestStreak: dailyStreak?.longest_streak || 0,
        todayProgress: todayProgress || null,
        weeklyProgress: weeklyProgress || [],
        monthlyProgress: monthlyProgress || [],
        recentActivities,
        upcomingGoals: todayGoals,
        achievements: achievements || [],
        levelProgress,
      };
    } catch (error) {
      console.error('Error fetching progress insights:', error);
      return null;
    }
  }

  private static calculateLevelProgress(stats: LearningStats | null) {
    if (!stats) {
      return {
        currentLevel: 'Beginner',
        experiencePoints: 0,
        nextLevelThreshold: 100,
        progressPercentage: 0,
      };
    }

    const levels = [
      { name: 'Beginner', threshold: 0 },
      { name: 'Elementary', threshold: 100 },
      { name: 'Intermediate', threshold: 500 },
      { name: 'Advanced', threshold: 1000 },
      { name: 'Expert', threshold: 2500 },
      { name: 'Master', threshold: 5000 },
    ];

    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = 0; i < levels.length - 1; i++) {
      if (stats.experience_points >= levels[i].threshold && stats.experience_points < levels[i + 1].threshold) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1];
        break;
      }
    }

    const progressInLevel = stats.experience_points - currentLevel.threshold;
    const levelRange = nextLevel.threshold - currentLevel.threshold;
    const progressPercentage = Math.min(100, Math.max(0, (progressInLevel / levelRange) * 100));

    return {
      currentLevel: currentLevel.name,
      experiencePoints: stats.experience_points,
      nextLevelThreshold: nextLevel.threshold,
      progressPercentage: Math.round(progressPercentage),
    };
  }

  // =====================================================
  // ACHIEVEMENT SYSTEM
  // =====================================================

  static async checkAndAwardAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const newAchievements: UserAchievement[] = [];
      
      // Get current stats
      const { data: learningStats } = await supabase
        .from('user_learning_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle() to handle no rows

      const dailyStreak = await this.getCurrentStreak(userId, 'daily_study');

      if (learningStats) {
        // Check for streak achievements
        if (dailyStreak && dailyStreak.current_streak >= 7 && dailyStreak.current_streak % 7 === 0) {
          const achievement = await this.awardAchievement(userId, 'streak', `7-Day Streak #${Math.floor(dailyStreak.current_streak / 7)}`, 
            `Maintained a ${dailyStreak.current_streak}-day study streak!`);
          if (achievement) newAchievements.push(achievement);
        }

        // Check for accuracy achievements
        if (learningStats.average_lesson_accuracy >= 90) {
          const achievement = await this.awardAchievement(userId, 'accuracy', 'Accuracy Master', 
            'Achieved 90%+ accuracy in lessons!');
          if (achievement) newAchievements.push(achievement);
        }

        // Check for completion achievements
        if (learningStats.total_lessons_completed >= 10) {
          const achievement = await this.awardAchievement(userId, 'completion', 'Lesson Champion', 
            'Completed 10 lessons!');
          if (achievement) newAchievements.push(achievement);
        }

        // Check for time achievements
        if (learningStats.total_study_time_hours >= 10) {
          const achievement = await this.awardAchievement(userId, 'time', 'Dedicated Learner', 
            'Spent 10+ hours studying!');
          if (achievement) newAchievements.push(achievement);
        }
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  private static async awardAchievement(userId: string, type: string, name: string, description: string): Promise<UserAchievement | null> {
    try {
      // Check if already awarded
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_name', name)
        .maybeSingle();

      if (existing) return null; // Already awarded

      // Award new achievement
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_type: type,
          achievement_name: name,
          achievement_description: description,
          earned_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return null;
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  static async initializeUserProgress(userId: string): Promise<boolean> {
    try {
      // Create initial learning stats
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

      // Create initial daily goals
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('user_daily_goals')
        .insert([
          {
            user_id: userId,
            goal_type: 'study_time',
            target_value: 30,
            goal_date: today,
          },
          {
            user_id: userId,
            goal_type: 'lessons_completed',
            target_value: 1,
            goal_date: today,
          },
          {
            user_id: userId,
            goal_type: 'flashcards_reviewed',
            target_value: 10,
            goal_date: today,
          },
        ]);

      return true;
    } catch (error) {
      console.error('Error initializing user progress:', error);
      return false;
    }
  }
}
