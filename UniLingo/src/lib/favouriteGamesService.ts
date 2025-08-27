import { supabase } from './supabase';

export interface FavouriteGame {
  id: string;
  user_id: string;
  game_name: string;
  game_category: string;
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
}

export class FavouriteGamesService {
  static async getUserFavouriteGames(userId: string) {
    try {
      const { data, error } = await supabase
        .from('favourite_games')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favourite', true);

      if (error) {
        console.error('Error fetching favourite games:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getUserFavouriteGames:', error);
      return { data: null, error };
    }
  }

  static async getAllGamesWithFavouriteStatus(userId: string) {
    try {
      // Get all possible games with their favourite status
      const allGames = [
        { name: 'Flashcard Quiz', category: 'vocabulary' },
        { name: 'Memory Match', category: 'vocabulary' },
        { name: 'Word Scramble', category: 'vocabulary' },
        { name: 'Hangman', category: 'vocabulary' },
        { name: 'Speed Challenge', category: 'vocabulary' },
        { name: 'Sentence Scramble', category: 'grammar' },
        { name: 'Planet Defense', category: 'vocabulary' },
        { name: 'Type What You Hear', category: 'listening' },
      ];

      // Get user's favourite games
      const { data: favouriteGames, error } = await supabase
        .from('favourite_games')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching favourite games status:', error);
        return { data: null, error };
      }

      // Create a map of favourite games
      const favouriteMap = new Map();
      favouriteGames?.forEach((game: FavouriteGame) => {
        favouriteMap.set(`${game.game_name}-${game.game_category}`, game.is_favourite);
      });

      // Combine all games with their favourite status
      const gamesWithStatus = allGames.map(game => ({
        ...game,
        is_favourite: favouriteMap.get(`${game.name}-${game.category}`) || false,
      }));

      return { data: gamesWithStatus, error: null };
    } catch (error) {
      console.error('Error in getAllGamesWithFavouriteStatus:', error);
      return { data: null, error };
    }
  }

  static async toggleFavourite(userId: string, gameName: string, gameCategory: string) {
    try {
      // First, check if the game already exists in the database
      const { data: existingGame, error: fetchError } = await supabase
        .from('favourite_games')
        .select('*')
        .eq('user_id', userId)
        .eq('game_name', gameName)
        .eq('game_category', gameCategory)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing game:', fetchError);
        return { data: null, error: fetchError };
      }

      if (existingGame) {
        // Game exists, toggle the favourite status
        const newFavouriteStatus = !existingGame.is_favourite;
        const { data, error } = await supabase
          .from('favourite_games')
          .update({ 
            is_favourite: newFavouriteStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingGame.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating favourite game:', error);
          return { data: null, error };
        }

        return { data, error: null };
      } else {
        // Game doesn't exist, create a new entry
        const { data, error } = await supabase
          .from('favourite_games')
          .insert([{
            user_id: userId,
            game_name: gameName,
            game_category: gameCategory,
            is_favourite: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating favourite game:', error);
          return { data: null, error };
        }

        return { data, error: null };
      }
    } catch (error) {
      console.error('Error in toggleFavourite:', error);
      return { data: null, error };
    }
  }

  static async addToFavourites(userId: string, gameName: string, gameCategory: string) {
    try {
      const { data, error } = await supabase
        .from('favourite_games')
        .insert([{
          user_id: userId,
          game_name: gameName,
          game_category: gameCategory,
          is_favourite: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding game to favourites:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in addToFavourites:', error);
      return { data: null, error };
    }
  }

  static async removeFromFavourites(userId: string, gameName: string, gameCategory: string) {
    try {
      const { error } = await supabase
        .from('favourite_games')
        .delete()
        .eq('user_id', userId)
        .eq('game_name', gameName)
        .eq('game_category', gameCategory);

      if (error) {
        console.error('Error removing game from favourites:', error);
        return { data: null, error };
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      console.error('Error in removeFromFavourites:', error);
      return { data: null, error };
    }
  }

  static async getFavouriteGamesByCategory(userId: string, category: string) {
    try {
      const { data, error } = await supabase
        .from('favourite_games')
        .select('*')
        .eq('user_id', userId)
        .eq('game_category', category)
        .eq('is_favourite', true);

      if (error) {
        console.error('Error fetching favourite games by category:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getFavouriteGamesByCategory:', error);
      return { data: null, error };
    }
  }

  static async getMostFavouriteGames(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('favourite_games')
        .select('game_name, game_category, count')
        .eq('is_favourite', true)
        .select('game_name, game_category')
        .limit(limit);

      if (error) {
        console.error('Error fetching most favourite games:', error);
        return { data: null, error };
      }

      // Count occurrences of each game
      const gameCounts = new Map();
      data?.forEach((game: any) => {
        const key = `${game.game_name}-${game.game_category}`;
        gameCounts.set(key, (gameCounts.get(key) || 0) + 1);
      });

      // Convert to array and sort by count
      const sortedGames = Array.from(gameCounts.entries())
        .map(([key, count]) => {
          const [name, category] = key.split('-');
          return { name, category, count };
        })
        .sort((a, b) => (b.count as number) - (a.count as number))
        .slice(0, limit);

      return { data: sortedGames, error: null };
    } catch (error) {
      console.error('Error in getMostFavouriteGames:', error);
      return { data: null, error };
    }
  }
}
