import { supabase } from './supabase';
import { XPService } from './xpService';
import { logger } from './logger';
import { ProgressTrackingService } from './progressTrackingService';

export interface DailyChallenge {
  challenge_date: string;
  game_type: string;
  xp_reward: number;
  completed: boolean;
  completed_at?: string;
}

export class DailyChallengeService {
  // Available games for daily challenge
  private static readonly AVAILABLE_GAMES = [
    'Flashcard Quiz',
    'Memory Match', 
    'Word Scramble',
    'Hangman',
    'Speed Challenge',
    'Planet Defense',
    'Listen & Type',
    'Sentence Scramble'
  ];

  /**
   * Get today's daily challenge for a user
   */
  static async getTodaysChallenge(userId: string): Promise<DailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if there's a daily challenge activity for today
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', 'daily_challenge')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .maybeSingle();

      if (error) {
        logger.error('Error getting today\'s challenge:', error);
        return null;
      }

      if (data) {
        return {
          challenge_date: today,
          game_type: data.activity_name,
          xp_reward: 50,
          completed: data.completed_at !== null,
          completed_at: data.completed_at,
        };
      }

      return null;
    } catch (error) {
      logger.error('Error getting today\'s challenge:', error);
      return null;
    }
  }

  /**
   * Create today's daily challenge if it doesn't exist
   */
  static async createTodaysChallenge(userId: string): Promise<DailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if challenge already exists
      const existingChallenge = await this.getTodaysChallenge(userId);
      if (existingChallenge) {
        return existingChallenge;
      }

      // Select random game
      const randomGame = this.AVAILABLE_GAMES[Math.floor(Math.random() * this.AVAILABLE_GAMES.length)];
      
      // Create new challenge and store it in user_activities as a pending challenge
      const newChallenge: DailyChallenge = {
        challenge_date: today,
        game_type: randomGame,
        xp_reward: 50,
        completed: false,
      };

      // Store the challenge in user_activities so it persists across sessions
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: 'daily_challenge',
          activity_name: randomGame,
          score: 0,
          max_score: 50,
          accuracy_percentage: 0,
          duration_seconds: 0,
          completed_at: null, // null means not completed yet
          created_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Error storing daily challenge:', error);
        return null;
      }

      logger.info(`Created daily challenge: ${randomGame} for ${today}`);
      return newChallenge;
    } catch (error) {
      logger.error('Error creating today\'s challenge:', error);
      return null;
    }
  }

  /**
   * Mark daily challenge as completed and award XP
   */
  static async completeChallenge(userId: string, gameType: string): Promise<boolean> {
    try {
      const challenge = await this.getTodaysChallenge(userId);
      
      if (!challenge || challenge.game_type !== gameType || challenge.completed) {
        logger.warn(`Challenge completion failed: challenge=${!!challenge}, gameType=${gameType}, completed=${challenge?.completed}`);
        return false;
      }

      // Award extra XP for daily challenge completion
      try {
        await XPService.awardXP(
          userId,
          'game', // activityType
          challenge.xp_reward, // score
          challenge.xp_reward, // maxScore (same as score for bonus XP)
          100, // accuracyPercentage (100% for completing daily challenge)
          `Daily Challenge: ${gameType}`, // activityName
          60 // durationSeconds (default 1 minute)
        );
        logger.info(`Awarded ${challenge.xp_reward} XP for daily challenge completion`);
      } catch (xpError) {
        logger.error('Error awarding XP for daily challenge:', xpError);
        // Don't fail the challenge completion if XP fails
      }

      // Mark the daily challenge as completed in user_activities
      try {
        const { error: updateError } = await supabase
          .from('user_activities')
          .update({
            completed_at: new Date().toISOString(),
            score: challenge.xp_reward,
            accuracy_percentage: 100,
            duration_seconds: 60, // Default 1 minute for daily challenge
          })
          .eq('user_id', userId)
          .eq('activity_type', 'daily_challenge')
          .eq('activity_name', gameType)
          .is('completed_at', null); // Only update if not already completed

        if (updateError) {
          logger.error('Error updating daily challenge completion:', updateError);
        } else {
          logger.info(`Daily challenge marked as completed: ${gameType}`);
        }
      } catch (logError) {
        logger.error('Error logging daily challenge completion:', logError);
        // Don't fail the challenge completion if logging fails
      }

      logger.info(`Daily challenge completed: ${gameType} (+${challenge.xp_reward} XP)`);
      return true;
    } catch (error) {
      logger.error('Error completing challenge:', error);
      return false;
    }
  }

  /**
   * Check if user has completed today's challenge
   */
  static async isChallengeCompleted(userId: string): Promise<boolean> {
    try {
      const challenge = await this.getTodaysChallenge(userId);
      return challenge?.completed || false;
    } catch (error) {
      logger.error('Error checking challenge completion:', error);
      return false;
    }
  }

  /**
   * Get challenge completion streak
   */
  static async getChallengeStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('created_at')
        .eq('user_id', userId)
        .eq('activity_type', 'daily_challenge')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error getting challenge streak:', error);
        return 0;
      }

      if (!data || data.length === 0) return 0;

      // Calculate consecutive days
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < data.length; i++) {
        const activityDate = new Date(data[i].created_at);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        // Check if this activity was completed on the expected date
        if (activityDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      logger.error('Error getting challenge streak:', error);
      return 0;
    }
  }

  /**
   * Get available games list
   */
  static getAvailableGames(): string[] {
    return [...this.AVAILABLE_GAMES];
  }
}
