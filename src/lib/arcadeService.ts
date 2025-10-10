import { supabase } from './supabase';
import { XPService } from './xpService';

export interface ArcadeGame {
  id: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  game_url: string;
  xp_cost: number;
  category: 'puzzle' | 'arcade' | 'classic' | 'action';
  difficulty: 'easy' | 'medium' | 'hard';
  is_active: boolean;
  play_count: number;
  created_at: string;
}

export interface GamePlay {
  id: string;
  user_id: string;
  game_id: string;
  xp_spent: number;
  score?: number;
  duration_seconds?: number;
  played_at: string;
}

export interface HighScore {
  id: string;
  user_id: string;
  game_id: string;
  high_score: number;
  achieved_at: string;
}

export class ArcadeService {
  // Track recent game plays to prevent duplicates
  private static recentGamePlays = new Map<string, number>();
  private static readonly DUPLICATE_THRESHOLD_MS = 5000; // 5 seconds

  /**
   * Get all active arcade games
   */
  static async getActiveGames(): Promise<ArcadeGame[]> {
    try {
      const { data, error } = await supabase
        .from('arcade_games')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        // Table doesn't exist yet - return empty array silently
        if (error.code === 'PGRST205') {
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching arcade games:', error);
      return [];
    }
  }

  /**
   * Get a specific game by ID
   */
  static async getGameById(gameId: string): Promise<ArcadeGame | null> {
    try {
      const { data, error } = await supabase
        .from('arcade_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching game:', error);
      return null;
    }
  }

  /**
   * Record a game play
   */
  static async recordGamePlay(
    userId: string,
    gameId: string,
    score?: number,
    durationSeconds?: number
  ): Promise<boolean> {
    try {
      // Create a unique key for this game play to prevent duplicates
      const now = Date.now();
      const playKey = `${userId}-${gameId}-${score || 'no-score'}-${Math.floor(durationSeconds || 0)}`;
      
      // Check if we've recorded this exact game play recently
      const lastRecorded = this.recentGamePlays.get(playKey);
      if (lastRecorded && (now - lastRecorded) < this.DUPLICATE_THRESHOLD_MS) {
        console.log('🚫 Preventing duplicate game play record:', playKey);
        return true; // Return true but don't record
      }

      console.log('📝 Recording game play:', { userId, gameId, score, durationSeconds });

      const { error } = await supabase
        .from('user_game_plays')
        .insert({
          user_id: userId,
          game_id: gameId,
          xp_spent: 0, // Free for now
          score: score,
          duration_seconds: durationSeconds,
        });

      if (error) throw error;

      // Record this play to prevent duplicates
      this.recentGamePlays.set(playKey, now);

      // Clean up old entries (keep only last 100 entries)
      if (this.recentGamePlays.size > 100) {
        const entries = Array.from(this.recentGamePlays.entries());
        entries.sort((a, b) => b[1] - a[1]); // Sort by timestamp descending
        this.recentGamePlays = new Map(entries.slice(0, 50)); // Keep only recent 50
      }

      // Increment play count
      await this.incrementPlayCount(gameId);

      console.log('✅ Game play recorded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error recording game play:', error);
      return false;
    }
  }

  /**
   * Update high score if new score is higher
   */
  static async updateHighScore(
    userId: string,
    gameId: string,
    score: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_high_score', {
        p_user_id: userId,
        p_game_id: gameId,
        p_score: score,
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error updating high score:', error);
      return false;
    }
  }

  /**
   * Get user's high score for a specific game
   */
  static async getUserHighScore(
    userId: string,
    gameId: string
  ): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('user_game_highscores')
        .select('high_score')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data?.high_score || null;
    } catch (error) {
      console.error('Error fetching high score:', error);
      return null;
    }
  }

  /**
   * Get all user's high scores
   */
  static async getUserHighScores(userId: string): Promise<Map<string, number>> {
    try {
      const { data, error } = await supabase
        .from('user_game_highscores')
        .select('game_id, high_score')
        .eq('user_id', userId);

      if (error) {
        // Table doesn't exist yet - return empty map silently
        if (error.code === 'PGRST205') {
          return new Map();
        }
        throw error;
      }

      const highScores = new Map<string, number>();
      data?.forEach((record) => {
        highScores.set(record.game_id, record.high_score);
      });

      return highScores;
    } catch (error) {
      console.error('Error fetching user high scores:', error);
      return new Map();
    }
  }

  /**
   * Get user's game play history
   */
  static async getUserGamePlays(
    userId: string,
    limit: number = 10
  ): Promise<GamePlay[]> {
    try {
      const { data, error } = await supabase
        .from('user_game_plays')
        .select('*')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching game plays:', error);
      return [];
    }
  }

  /**
   * Get total games played by user
   */
  static async getUserTotalPlays(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_game_plays')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching total plays:', error);
      return 0;
    }
  }

  /**
   * Get leaderboard for a specific game
   */
  static async getGameLeaderboard(
    gameId: string,
    limit: number = 10
  ): Promise<Array<{ user_id: string; high_score: number; achieved_at: string }>> {
    try {
      const { data, error } = await supabase
        .from('user_game_highscores')
        .select('user_id, high_score, achieved_at')
        .eq('game_id', gameId)
        .order('high_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  /**
   * Increment game play count
   */
  private static async incrementPlayCount(gameId: string): Promise<void> {
    try {
      await supabase.rpc('increment_game_play_count', {
        p_game_id: gameId,
      });
    } catch (error) {
      console.error('Error incrementing play count:', error);
    }
  }

  /**
   * Get games by category
   */
  static async getGamesByCategory(
    category: 'puzzle' | 'arcade' | 'classic' | 'action'
  ): Promise<ArcadeGame[]> {
    try {
      const { data, error } = await supabase
        .from('arcade_games')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching games by category:', error);
      return [];
    }
  }

  /**
   * Check if user can play a game (has enough available XP)
   */
  static async canPlayGame(userId: string, gameId: string): Promise<{ canPlay: boolean; availableXP: number; gameCost: number; message?: string }> {
    try {
      // Get game cost
      const game = await this.getGameById(gameId);
      if (!game) {
        return { canPlay: false, availableXP: 0, gameCost: 0, message: 'Game not found' };
      }

      // If game is free, always allow
      if (game.xp_cost === 0) {
        return { canPlay: true, availableXP: 0, gameCost: 0 };
      }

      // Get user's available XP
      const availableXP = await XPService.getAvailableXP(userId);

      // Check if user has enough XP
      const canPlay = availableXP >= game.xp_cost;
      const message = canPlay ? undefined : `Need ${game.xp_cost} XP (You have ${availableXP} XP)`;

      return { canPlay, availableXP, gameCost: game.xp_cost, message };
    } catch (error) {
      console.error('Error checking if user can play game:', error);
      return { canPlay: false, availableXP: 0, gameCost: 0, message: 'Error checking XP' };
    }
  }

  /**
   * Purchase and start playing a game (spends XP if needed)
   */
  static async purchaseGame(userId: string, gameId: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Check if can play
      const playCheck = await this.canPlayGame(userId, gameId);
      
      if (!playCheck.canPlay) {
        return { success: false, message: playCheck.message };
      }

      // If game has a cost, spend the XP
      if (playCheck.gameCost > 0) {
        const game = await this.getGameById(gameId);
        const spent = await XPService.spendXP(userId, playCheck.gameCost, `Arcade: ${game?.name}`);
        
        if (!spent) {
          return { success: false, message: 'Failed to spend XP' };
        }

        console.log(`💰 Spent ${playCheck.gameCost} XP to play game`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error purchasing game:', error);
      return { success: false, message: 'Error processing purchase' };
    }
  }
}
