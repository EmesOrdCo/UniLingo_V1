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
      const goals: Omit<DailyGoal, 'id' | 'created_at'>[] = defaultGoals.map(goal => ({
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
  static async getTodayGoals(userId: string, date?: string): Promise<DailyGoal[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_date', targetDate)
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
      
      console.log(`🎯 Updating goal ${goalType}: current=${goal.current_value} + progress=${progress} = newProgress=${newProgress}, target=${goal.target_value}, completed=${completed}`);
      
      const { error } = await supabase
        .from('user_daily_goals')
        .update({
          current_value: newProgress,
          completed,
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

      let totalProgress = 0;
      const goalWeight = 25; // Each goal has 25% weight

      console.log('🎯 Processing goals for weighted percentage calculation:');
      goals.forEach(goal => {
        const goalData = {
          target: goal.target_value,
          current: goal.current_value,
          completed: goal.completed,
        };

        // Calculate progress percentage for this goal (capped at 100%)
        const goalProgress = Math.min((goal.current_value / goal.target_value) * 100, 100);
        const weightedProgress = (goalProgress / 100) * goalWeight;
        
        console.log(`🎯 Goal ${goal.goal_type}: target=${goal.target_value}, current=${goal.current_value}, progress=${goalProgress.toFixed(1)}%, weighted=${weightedProgress.toFixed(1)}%`);

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

        totalProgress += weightedProgress;
      });

      progress.overall_progress = Math.round(totalProgress);
      console.log(`🎯 Weighted percentage calculation: ${totalProgress.toFixed(1)}% = ${progress.overall_progress}%`);
      
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
      // With weighted progress, 100% means all goals are completed
      return progress ? progress.overall_progress >= 100 : false;
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

      if (!data || data.length === 0) {
        return 0;
      }

      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let currentDate = new Date(today);

      // Check if today's goals are completed
      const todayGoals = data.filter(goal => goal.goal_date === today);
      if (todayGoals.length === 0) {
        // If no goals for today, check if we need to create them
        const { data: existingGoals } = await supabase
          .from('user_daily_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('goal_date', today);
        
        if (!existingGoals || existingGoals.length === 0) {
          // Create today's goals
          await this.createDailyGoals(userId, today);
        }
      }

      // Calculate streak by checking consecutive days
      for (let i = 0; i < 365; i++) { // Check up to a year back
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateString = checkDate.toISOString().split('T')[0];
        
        const dayGoals = data.filter(goal => goal.goal_date === checkDateString);
        
        if (dayGoals.length === 0) {
          // No goals for this day, check if we need to create them
          const { data: existingGoals } = await supabase
            .from('user_daily_goals')
            .select('*')
            .eq('user_id', userId)
            .eq('goal_date', checkDateString);
          
          if (!existingGoals || existingGoals.length === 0) {
            // Create goals for this day
            await this.createDailyGoals(userId, checkDateString);
            // Re-fetch the data to include the new goals
            const { data: updatedData } = await supabase
              .from('user_daily_goals')
              .select('goal_date, completed')
              .eq('user_id', userId)
              .eq('completed', true)
              .order('goal_date', { ascending: false });
            
            if (updatedData) {
              data = updatedData;
            }
          }
        }
        
        // Check if all goals for this day are completed
        const allGoalsForDay = await this.getTodayGoals(userId, checkDateString);
        const completedGoalsForDay = allGoalsForDay.filter(goal => goal.completed);
        
        if (allGoalsForDay.length > 0 && completedGoalsForDay.length === allGoalsForDay.length) {
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
