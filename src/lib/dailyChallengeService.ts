import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

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
    'Type What You Hear',
    'Sentence Scramble'
  ];

  private static readonly STORAGE_KEY = 'daily_challenge';

  /**
   * Get today's daily challenge for a user
   */
  static async getTodaysChallenge(userId: string): Promise<DailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `${this.STORAGE_KEY}_${userId}`;
      
      const storedChallenge = await AsyncStorage.getItem(storageKey);
      
      if (storedChallenge) {
        const challenge: DailyChallenge = JSON.parse(storedChallenge);
        
        // Check if it's still today's challenge
        if (challenge.challenge_date === today) {
          return challenge;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting today\'s challenge:', error);
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
      
      // Create new challenge
      const newChallenge: DailyChallenge = {
        challenge_date: today,
        game_type: randomGame,
        xp_reward: 50,
        completed: false,
      };

      // Store in AsyncStorage
      const storageKey = `${this.STORAGE_KEY}_${userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newChallenge));
      
      console.log(`🎯 Created daily challenge: ${randomGame} for ${today}`);
      return newChallenge;
    } catch (error) {
      console.error('Error creating today\'s challenge:', error);
      return null;
    }
  }

  /**
   * Mark daily challenge as completed
   */
  static async completeChallenge(userId: string, gameType: string): Promise<boolean> {
    try {
      const challenge = await this.getTodaysChallenge(userId);
      
      if (!challenge || challenge.game_type !== gameType) {
        return false;
      }

      // Update challenge
      const updatedChallenge: DailyChallenge = {
        ...challenge,
        completed: true,
        completed_at: new Date().toISOString(),
      };

      // Store updated challenge
      const storageKey = `${this.STORAGE_KEY}_${userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedChallenge));
      
      console.log(`✅ Daily challenge completed: ${gameType}`);
      return true;
    } catch (error) {
      console.error('Error completing challenge:', error);
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
      console.error('Error checking challenge completion:', error);
      return false;
    }
  }

  /**
   * Get challenge completion streak (using existing daily goals)
   */
  static async getChallengeStreak(userId: string): Promise<number> {
    try {
      // Use existing daily goals to track streak
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('goal_date, completed')
        .eq('user_id', userId)
        .eq('goal_type', 'games_played')
        .eq('completed', true)
        .order('goal_date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return 0;

      // Calculate consecutive days
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < data.length; i++) {
        const goalDate = new Date(data[i].goal_date);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        // Check if this goal was completed on the expected date
        if (goalDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error getting challenge streak:', error);
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
