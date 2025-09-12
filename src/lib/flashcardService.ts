import { supabase } from './supabase'
import { DailyGoalsService } from './dailyGoalsService'

export interface CreateFlashcardData {
  front: string
  back: string
  subject: string
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'expert'
  userId: string
  example?: string
  pronunciation?: string
  tags?: string[]
  native_language: string
}

export interface StudySessionData {
  flashcardId: string
  userId: string
  result: 'correct' | 'incorrect' | 'easy' | 'hard'
  timeSpent: number
  direction: 'frontToBack' | 'backToFront'
}

export interface FlashcardWithProgress {
  id: string
  front: string
  back: string
  subject: string
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'expert'
  example?: string
  pronunciation?: string
  tags?: string[]
  native_language: string
  created_at: string
  updated_at: string
  // Progress fields (if you want to add them later)
  review_count?: number
  mastery?: number
  last_reviewed?: string
  next_review?: string
}

export class FlashcardService {
  // Create a new flashcard
  static async createFlashcard(data: CreateFlashcardData): Promise<FlashcardWithProgress> {
    try {
      console.log('📝 Creating flashcard:', data)
      
      const { data: flashcard, error } = await supabase
        .from('user_flashcards')
        .insert([{
          user_id: data.userId,
          front: data.front,
          back: data.back,
          subject: data.subject,
          topic: data.topic,
          difficulty: data.difficulty,
          example: data.example || '',
          pronunciation: data.pronunciation || '',
          tags: data.tags || [],
          native_language: data.native_language,
        }])
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating flashcard:', error)
        throw error
      }

      console.log('✅ Flashcard created successfully:', flashcard)
      return flashcard
    } catch (error) {
      console.error('❌ Error in createFlashcard:', error)
      throw error
    }
  }

  // Get user's flashcards
  static async getUserFlashcards(userId: string): Promise<FlashcardWithProgress[]> {
    try {
      console.log('📚 Fetching flashcards for user:', userId)
      
      const { data: flashcards, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching user flashcards:', error)
        throw error
      }

      console.log('✅ Fetched flashcards:', flashcards?.length || 0)
      return flashcards || []
    } catch (error) {
      console.error('❌ Error in getUserFlashcards:', error)
      throw error
    }
  }

  // Get all flashcards from the database (for public access)
  // REMOVED: General flashcards table no longer exists - only user-specific flashcards
  static async getAllFlashcards(): Promise<FlashcardWithProgress[]> {
    console.log('📚 getAllFlashcards called but general flashcards table has been removed')
    return []
  }

  // REMOVED: General flashcards table no longer exists - only user-specific flashcards
  static async getFlashcardsBySubject(subject: string): Promise<FlashcardWithProgress[]> {
    console.log('📚 getFlashcardsBySubject called but general flashcards table has been removed')
    return []
  }

  // REMOVED: General flashcards table no longer exists - only user-specific flashcards
  static async getGeneralFlashcardsBySubjectAndDifficulty(subject: string, difficulty?: string): Promise<FlashcardWithProgress[]> {
    console.log('📚 getGeneralFlashcardsBySubjectAndDifficulty called but general flashcards table has been removed')
    return []
  }

  // Update a flashcard
  static async updateFlashcard(flashcardId: string, updates: Partial<CreateFlashcardData>): Promise<FlashcardWithProgress> {
    try {
      const { data: flashcard, error } = await supabase
        .from('user_flashcards')
        .update(updates)
        .eq('id', flashcardId)
        .select()
        .single()

      if (error) throw error
      return flashcard
    } catch (error) {
      console.error('❌ Error in updateFlashcard:', error)
      throw error
    }
  }

  // Delete a flashcard
  static async deleteFlashcard(flashcardId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_flashcards')
        .delete()
        .eq('id', flashcardId)

      if (error) throw error
    } catch (error) {
      console.error('❌ Error in deleteFlashcard:', error)
      throw error
    }
  }

  // Get study statistics
  static async getStudyStats(userId: string): Promise<{
    totalCards: number
    subjects: number
    topics: number
    beginnerCards: number
    intermediateCards: number
    expertCards: number
  }> {
    try {
      const { data: flashcards, error } = await supabase
        .from('user_flashcards')
        .select('subject, topic, difficulty')
        .eq('user_id', userId)

      if (error) throw error

      const totalCards = flashcards?.length || 0
      const subjects = new Set(flashcards?.map(card => card.subject) || []).size
      const topics = new Set(flashcards?.map(card => card.topic) || []).size
      const beginnerCards = flashcards?.filter(card => card.difficulty === 'beginner').length || 0
      const intermediateCards = flashcards?.filter(card => card.difficulty === 'intermediate').length || 0
      const expertCards = flashcards?.filter(card => card.difficulty === 'expert').length || 0

      return {
        totalCards,
        subjects,
        topics,
        beginnerCards,
        intermediateCards,
        expertCards,
      }
    } catch (error) {
      console.error('❌ Error in getStudyStats:', error)
      throw error
    }
  }

  // Search flashcards
  static async searchFlashcards(userId: string, query: string): Promise<FlashcardWithProgress[]> {
    try {
      const { data: flashcards, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('user_id', userId)
        .or(`front.ilike.%${query}%,back.ilike.%${query}%,subject.ilike.%${query}%,topic.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return flashcards || []
    } catch (error) {
      console.error('❌ Error in searchFlashcards:', error)
      throw error
    }
  }

  // Track flashcard review and update daily goals
  static async trackFlashcardReview(
    flashcardId: string, 
    userId: string, 
    result: 'correct' | 'incorrect' | 'easy' | 'hard',
    timeSpent: number = 0
  ): Promise<void> {
    try {
      console.log('🎯 Starting trackFlashcardReview:', { flashcardId, userId, result, timeSpent });

      // Update or create flashcard progress record
      const { data: existingProgress } = await supabase
        .from('user_flashcard_progress')
        .select('id, correct_attempts, incorrect_attempts')
        .eq('user_id', userId)
        .eq('flashcard_id', flashcardId)
        .maybeSingle();

      if (existingProgress) {
        // Update existing progress
        const isCorrect = result === 'correct' || result === 'easy';
        const updateData = {
          correct_attempts: existingProgress.correct_attempts + (isCorrect ? 1 : 0),
          incorrect_attempts: existingProgress.incorrect_attempts + (isCorrect ? 0 : 1),
          last_reviewed: new Date().toISOString(),
        };
        
        const { error } = await supabase
          .from('user_flashcard_progress')
          .update(updateData)
          .eq('id', existingProgress.id);
        
        if (error) throw error;
      } else {
        // Create new progress record
        const isCorrect = result === 'correct' || result === 'easy';
        const { error } = await supabase
          .from('user_flashcard_progress')
          .insert({
            user_id: userId,
            flashcard_id: flashcardId,
            correct_attempts: isCorrect ? 1 : 0,
            incorrect_attempts: isCorrect ? 0 : 1,
            last_reviewed: new Date().toISOString(),
          });
        
        if (error) throw error;
      }
      
      console.log('✅ Flashcard progress updated with result:', result);

      // Note: XP is now awarded at the session level, not per individual flashcard
      // to avoid cluttering recent activities with individual card entries

      // Update daily goals
      try {
        await DailyGoalsService.updateGoalProgress(userId, 'flashcards_reviewed', 1);
        
        if (timeSpent > 0) {
          const timeInMinutes = Math.floor(timeSpent / 60);
          if (timeInMinutes > 0) {
            await DailyGoalsService.updateGoalProgress(userId, 'study_time', timeInMinutes);
          }
        }
        
        console.log('✅ Daily goals updated for flashcard review');
      } catch (error) {
        console.error('❌ Failed to update daily goals:', error);
      }

      console.log('✅ Flashcard review tracked successfully');
    } catch (error) {
      console.error('❌ Error in trackFlashcardReview:', error);
    }
  }
}
