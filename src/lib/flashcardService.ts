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

  // Get all flashcards from the database (for public access)
  static async getAllFlashcards(): Promise<FlashcardWithProgress[]> {
    try {
      console.log('📚 Fetching all flashcards from general flashcards table')
      
      const { data: flashcards, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching general flashcards:', error)
        throw error
      }

      console.log('✅ Fetched general flashcards:', flashcards?.length || 0)
      return flashcards || []
    } catch (error) {
      console.error('❌ Error in getAllFlashcards:', error)
      throw error
    }
  }

  // Get flashcards by subject from general flashcards table
  static async getFlashcardsBySubject(subject: string): Promise<FlashcardWithProgress[]> {
    try {
      const { data: flashcards, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('subject', subject)
        .order('topic', { ascending: true })

      if (error) throw error
      return flashcards || []
    } catch (error) {
      console.error('❌ Error in getFlashcardsBySubject:', error)
      throw error
    }
  }

  // Get general flashcards by subject and difficulty
  static async getGeneralFlashcardsBySubjectAndDifficulty(subject: string, difficulty?: string): Promise<FlashcardWithProgress[]> {
    try {
      let query = supabase
        .from('flashcards')
        .select('*')
        .eq('subject', subject)
        .order('difficulty', { ascending: true })

      if (difficulty && difficulty !== 'all') {
        query = query.eq('difficulty', difficulty)
      }

      const { data: flashcards, error } = await query

      if (error) throw error
      return flashcards || []
    } catch (error) {
      console.error('❌ Error in getGeneralFlashcardsBySubjectAndDifficulty:', error)
      throw error
    }
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
}
