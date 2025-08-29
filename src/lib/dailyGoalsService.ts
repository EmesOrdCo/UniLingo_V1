import { supabase } from './supabase';

export interface DailyGoal {
  id?: string;
  user_id: string;
  goal_type: 'study_time' | 'lessons_completed' | 'flashcards_reviewed' | 'games_played';
  target_value: number;
  current_value: number;
  goal_date: string; // YYYY-MM-DD format
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DailyGoalProgress {
  study_time: { target: number; current: number; completed: boolean };
  lessons_completed: { target: number; current: number; completed: boolean };
  flashcards_reviewed: { target: number; current: number; completed: boolean };
  games_played: { target: number; current: number; completed: boolean };
  overall_progress: number; // Percentage of all goals completed
}

export class DailyGoalsService {
  // Create daily goals for a user
  static async createDailyGoals(userId: string, date: string = new Date().toISOString().split('T')[0]): Promise<DailyGoal[]> {
    try {
      // Get user's current level and preferences
      const { data: userProfile } = await supabase
        .from('users')
        .select('level, target_language')
        .eq('id', userId)
        .single();

      const userLevel = userProfile?.level || 'beginner';
      
      // Define default goals based on user level
      const defaultGoals = this.getDefaultGoalsByLevel(userLevel);
      
      // Create goals for the specified date
      const goals: Omit<DailyGoal, 'id' | 'created_at' | 'updated_at'>[] = defaultGoals.map(goal => ({
        user_id: userId,
        goal_type: goal.type,
        target_value: goal.target,
        current_value: 0,
        goal_date: date,
        completed: false,
      }));

      // Insert all goals
      const { data, error } = await supabase
        .from('user_daily_goals')
        .insert(goals)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error creating daily goals:', error);
      return [];
    }
  }

  // Get default goals based on user level
  private static getDefaultGoalsByLevel(level: string): Array<{ type: DailyGoal['goal_type']; target: number }> {
    switch (level) {
      case 'beginner':
        return [
          { type: 'study_time', target: 15 }, // 15 minutes
          { type: 'lessons_completed', target: 1 }, // 1 lesson
          { type: 'flashcards_reviewed', target: 10 }, // 10 cards
          { type: 'games_played', target: 1 }, // 1 game
        ];
      case 'intermediate':
        return [
          { type: 'study_time', target: 30 }, // 30 minutes
          { type: 'lessons_completed', target: 2 }, // 2 lessons
          { type: 'flashcards_reviewed', target: 20 }, // 20 cards
          { type: 'games_played', target: 2 }, // 2 games
        ];
      case 'advanced':
        return [
          { type: 'study_time', target: 45 }, // 45 minutes
          { type: 'lessons_completed', target: 3 }, // 3 lessons
          { type: 'flashcards_reviewed', target: 30 }, // 30 cards
          { type: 'games_played', target: 3 }, // 3 games
        ];
      default:
        return [
          { type: 'study_time', target: 20 }, // 20 minutes
          { type: 'lessons_completed', target: 1 }, // 1 lesson
          { type: 'flashcards_reviewed', target: 15 }, // 15 cards
          { type: 'games_played', target: 1 }, // 1 game
        ];
    }
  }

  // Get today's goals for a user
  static async getTodayGoals(userId: string): Promise<DailyGoal[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_date', today)
        .order('goal_type');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching today goals:', error);
      return [];
    }
  }

  // Update goal progress when an activity is completed
  static async updateGoalProgress(
    userId: string, 
    goalType: DailyGoal['goal_type'], 
    progress: number,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<boolean> {
    try {
      // Find the goal for today
      const { data: goal } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_type', goalType)
        .eq('goal_date', date)
        .maybeSingle();

      if (!goal) {
        // Create goals for today if they don't exist
        await this.createDailyGoals(userId, date);
        return this.updateGoalProgress(userId, goalType, progress, date);
      }

      // Update progress
      const newProgress = goal.current_value + progress;
      const completed = newProgress >= goal.target_value;
      
      const { error } = await supabase
        .from('user_daily_goals')
        .update({
          current_value: newProgress,
          completed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goal.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      return false;
    }
  }

  // Get goal progress summary for today
  static async getTodayGoalProgress(userId: string): Promise<DailyGoalProgress | null> {
    try {
      const goals = await this.getTodayGoals(userId);
      
      if (goals.length === 0) {
        // Create goals if they don't exist
        await this.createDailyGoals(userId);
        return this.getTodayGoalProgress(userId);
      }

      // Convert goals to progress format
      const progress: DailyGoalProgress = {
        study_time: { target: 0, current: 0, completed: false },
        lessons_completed: { target: 0, current: 0, completed: false },
        flashcards_reviewed: { target: 0, current: 0, completed: false },
        games_played: { target: 0, current: 0, completed: false },
        overall_progress: 0,
      };

      let completedGoals = 0;
      let totalGoals = goals.length;

      goals.forEach(goal => {
        const goalData = {
          target: goal.target_value,
          current: goal.current_value,
          completed: goal.completed,
        };

        switch (goal.goal_type) {
          case 'study_time':
            progress.study_time = goalData;
            break;
          case 'lessons_completed':
            progress.lessons_completed = goalData;
            break;
          case 'flashcards_reviewed':
            progress.flashcards_reviewed = goalData;
            break;
          case 'games_played':
            progress.games_played = goalData;
            break;
        }

        if (goal.completed) completedGoals++;
      });

      progress.overall_progress = Math.round((completedGoals / totalGoals) * 100);
      
      return progress;
    } catch (error) {
      console.error('Error getting goal progress:', error);
      return null;
    }
  }

  // Check if user has completed all goals for today
  static async hasCompletedAllGoals(userId: string): Promise<boolean> {
    try {
      const progress = await this.getTodayGoalProgress(userId);
      return progress ? progress.overall_progress === 100 : false;
    } catch (error) {
      console.error('Error checking goal completion:', error);
      return false;
    }
  }

  // Get goal completion streak
  static async getGoalCompletionStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('goal_date, completed')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('goal_date', { ascending: false });

      if (error) throw error;

      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let currentDate = new Date(today);

      for (const goal of data || []) {
        const goalDate = new Date(goal.goal_date);
        const daysDiff = Math.floor((currentDate.getTime() - goalDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error getting goal completion streak:', error);
      return 0;
    }
  }
}
