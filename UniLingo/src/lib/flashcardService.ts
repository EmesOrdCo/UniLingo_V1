import { supabase } from './supabase'

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

  // Get all flashcards (for general use)
  static async getAllFlashcards(): Promise<FlashcardWithProgress[]> {
    try {
      console.log('📚 Fetching all flashcards')
      
      const { data: flashcards, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching all flashcards:', error)
        throw error
      }

      console.log('✅ Fetched all flashcards:', flashcards?.length || 0)
      return flashcards || []
    } catch (error) {
      console.error('❌ Error in getAllFlashcards:', error)
      throw error
    }
  }

  // Get flashcards by subject
  static async getFlashcardsBySubject(subject: string): Promise<FlashcardWithProgress[]> {
    try {
      console.log('📚 Fetching flashcards by subject:', subject)
      
      const { data: flashcards, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('subject', subject)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching flashcards by subject:', error)
        throw error
      }

      console.log('✅ Fetched flashcards by subject:', flashcards?.length || 0)
      return flashcards || []
    } catch (error) {
      console.error('❌ Error in getFlashcardsBySubject:', error)
      throw error
    }
  }

  // Get flashcards by topic
  static async getFlashcardsByTopic(topic: string): Promise<FlashcardWithProgress[]> {
    try {
      console.log('📚 Fetching flashcards by topic:', topic)
      
      const { data: flashcards, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('topic', topic)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching flashcards by topic:', error)
        throw error
      }

      console.log('✅ Fetched flashcards by topic:', flashcards?.length || 0)
      return flashcards || []
    } catch (error) {
      console.error('❌ Error in getFlashcardsByTopic:', error)
      throw error
    }
  }

  // Get flashcards by difficulty
  static async getFlashcardsByDifficulty(difficulty: string): Promise<FlashcardWithProgress[]> {
    try {
      console.log('📚 Fetching flashcards by difficulty:', difficulty)
      
      const { data: flashcards, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('difficulty', difficulty)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching flashcards by difficulty:', error)
        throw error
      }

      console.log('✅ Fetched flashcards by difficulty:', flashcards?.length || 0)
      return flashcards || []
    } catch (error) {
      console.error('❌ Error in getFlashcardsByDifficulty:', error)
      throw error
    }
  }

  // Search flashcards
  static async searchFlashcards(searchTerm: string): Promise<FlashcardWithProgress[]> {
    try {
      console.log('🔍 Searching flashcards for:', searchTerm)
      
      const { data: flashcards, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .or(`front.ilike.%${searchTerm}%,back.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error searching flashcards:', error)
        throw error
      }

      console.log('✅ Search results:', flashcards?.length || 0)
      return flashcards || []
    } catch (error) {
      console.error('❌ Error in searchFlashcards:', error)
      throw error
    }
  }

  // Update flashcard
  static async updateFlashcard(id: string, updates: Partial<CreateFlashcardData>): Promise<FlashcardWithProgress> {
    try {
      console.log('📝 Updating flashcard:', id, updates)
      
      const { data: flashcard, error } = await supabase
        .from('user_flashcards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating flashcard:', error)
        throw error
      }

      console.log('✅ Flashcard updated successfully:', flashcard)
      return flashcard
    } catch (error) {
      console.error('❌ Error in updateFlashcard:', error)
      throw error
    }
  }

  // Delete flashcard
  static async deleteFlashcard(id: string): Promise<void> {
    try {
      console.log('🗑️ Deleting flashcard:', id)
      
      const { error } = await supabase
        .from('user_flashcards')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ Error deleting flashcard:', error)
        throw error
      }

      console.log('✅ Flashcard deleted successfully')
    } catch (error) {
      console.error('❌ Error in deleteFlashcard:', error)
      throw error
    }
  }

  // Get flashcard statistics
  static async getFlashcardStats(): Promise<{
    total: number
    byDifficulty: { [key: string]: number }
    bySubject: { [key: string]: number }
    byTopic: { [key: string]: number }
  }> {
    try {
      console.log('📊 Getting flashcard statistics')
      
      const { data: flashcards, error } = await supabase
        .from('user_flashcards')
        .select('*')

      if (error) {
        console.error('❌ Error fetching flashcards for stats:', error)
        throw error
      }

      const allFlashcards = flashcards || []
      
      const stats = {
        total: allFlashcards.length,
        byDifficulty: {} as { [key: string]: number },
        bySubject: {} as { [key: string]: number },
        byTopic: {} as { [key: string]: number }
      }

      allFlashcards.forEach(card => {
        // Count by difficulty
        stats.byDifficulty[card.difficulty] = (stats.byDifficulty[card.difficulty] || 0) + 1
        
        // Count by subject
        stats.bySubject[card.subject] = (stats.bySubject[card.subject] || 0) + 1
        
        // Count by topic
        stats.byTopic[card.topic] = (stats.byTopic[card.topic] || 0) + 1
      })

      console.log('✅ Flashcard statistics:', stats)
      return stats
    } catch (error) {
      console.error('❌ Error in getFlashcardStats:', error)
      throw error
    }
  }
}










