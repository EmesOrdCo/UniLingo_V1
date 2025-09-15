import { supabase } from './supabase'
import { Flashcard } from '../types'

export interface UserFlashcard extends Flashcard {
  user_id: string
  pronunciation?: string
  example?: string
  native_language: string
  show_native_language?: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserFlashcardData {
  user_id: string
  subject: string
  topic: string
  front: string
  back: string
  difficulty: 'beginner' | 'intermediate' | 'expert'
  tags: string[]
  pronunciation?: string
  example?: string
  native_language: string
  show_native_language?: boolean
}

export interface UserFlashcardFilters {
  subject?: string
  topic?: string
  difficulty?: string
  search?: string
}

export class UserFlashcardService {
  // Get all flashcards for the current user
  static async getUserFlashcards(filters: UserFlashcardFilters = {}): Promise<UserFlashcard[]> {
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      console.log('🔍 getUserFlashcards - user.id:', user.id, 'type:', typeof user.id);
      
      // Ensure user.id is a string
      if (typeof user.id !== 'string') {
        console.error('❌ Invalid user.id type:', typeof user.id, 'value:', user.id);
        throw new Error('user.id must be a string');
      }

      let query = supabase
        .from('user_flashcards')
        .select('*')
        .eq('user_id', user.id) // Filter by authenticated user
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.subject) {
        query = query.eq('subject', filters.subject)
      }
      if (filters.topic) {
        query = query.eq('topic', filters.topic)
      }
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }
      if (filters.search) {
        query = query.or(`front.ilike.%${filters.search}%,back.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching user flashcards:', error)
      throw error
    }
  }

  // Get a single flashcard by ID
  static async getUserFlashcard(id: string): Promise<UserFlashcard | null> {
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // Ensure the flashcard belongs to the authenticated user
        .single()

      if (error) throw error

      return data
    } catch (error: any) {
      console.error('Error fetching user flashcard:', error)
      throw error
    }
  }

  // Create a new flashcard
  static async createUserFlashcard(flashcardData: CreateUserFlashcardData): Promise<UserFlashcard> {
    try {
      // Ensure user_id is always set from the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Always use the authenticated user's ID, overriding any passed user_id
      // Remove show_native_language field if it exists since the column doesn't exist in the database
      const { show_native_language, ...flashcardDataWithoutShowNative } = flashcardData;
      const flashcardWithUserId = {
        ...flashcardDataWithoutShowNative,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .insert([flashcardWithUserId])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error: any) {
      console.error('Error creating user flashcard:', error)
      throw error
    }
  }

  // Update an existing flashcard
  static async updateUserFlashcard(id: string, updates: Partial<CreateUserFlashcardData>): Promise<UserFlashcard> {
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure the flashcard belongs to the authenticated user
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error: any) {
      console.error('Error updating user flashcard:', error)
      throw error
    }
  }

  // Delete a flashcard
  static async deleteUserFlashcard(id: string): Promise<void> {
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('user_flashcards')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Ensure the flashcard belongs to the authenticated user

      if (error) throw error
    } catch (error: any) {
      console.error('Error deleting user flashcard:', error)
      throw error
    }
  }

  // Get unique subjects from user flashcards
  static async getUserFlashcardSubjects(): Promise<string[]> {
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .select('subject')
        .eq('user_id', user.id) // Only get subjects from the authenticated user's flashcards
        .not('subject', 'is', null)

      if (error) throw error

      const subjects = Array.from(new Set(data?.map(item => item.subject) || []))
      return subjects.sort()
    } catch (error: any) {
      console.error('Error fetching user flashcard subjects:', error)
      throw error
    }
  }

  // Get topics for a specific user from user flashcards
  static async getUserFlashcardTopicsByUserId(userId: string): Promise<string[]> {
    try {
      console.log('🔍 Fetching topics for user:', userId, 'type:', typeof userId);
      
      // Ensure userId is a string
      if (typeof userId !== 'string') {
        console.error('❌ Invalid userId type:', typeof userId, 'value:', userId);
        throw new Error('userId must be a string');
      }
      
      const { data, error } = await supabase
        .from('user_flashcards')
        .select('topic')
        .eq('user_id', userId)
        .not('topic', 'is', null)

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('📊 Raw topics data:', data);
      const topics = Array.from(new Set(data?.map(item => item.topic) || []))
      console.log('✅ Processed topics:', topics);
      return topics.sort()
    } catch (error: any) {
      console.error('❌ Error fetching user flashcard topics by user ID:', error)
      throw error
    }
  }

  // Get topics for a specific subject from user flashcards
  static async getUserFlashcardTopics(subject: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_flashcards')
        .select('topic')
        .eq('subject', subject)
        .not('topic', 'is', null)

      if (error) throw error

      const topics = Array.from(new Set(data?.map(item => item.topic) || []))
      return topics.sort()
    } catch (error: any) {
      console.error('Error fetching user flashcard topics:', error)
      throw error
    }
  }

  // Get statistics for user flashcards
  static async getUserFlashcardStats(): Promise<{
    totalCards: number
    subjects: number
    topics: number
    byDifficulty: { [key: string]: number }
  }> {
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('user_id', user.id) // Only get stats from the authenticated user's flashcards

      if (error) throw error

      const cards = data || []
      const subjects = new Set((cards || []).map(card => card.subject))
      const topics = new Set((cards || []).map(card => card.topic))
      
      const byDifficulty = cards.reduce((acc, card) => {
        acc[card.difficulty] = (acc[card.difficulty] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      return {
        totalCards: cards.length,
        subjects: subjects.size,
        topics: topics.size,
        byDifficulty
      }
    } catch (error: any) {
      console.error('Error fetching user flashcard stats:', error)
      throw error
    }
  }

  // Get predefined tags
  static getPredefinedTags(): string[] {
    return [
      'Medical Term',
      'Technical',
      'Academic',
      'Business',
      'Scientific',
      'Common',
      'Advanced',
      'Basic',
      'Professional',
      'Everyday',
      'Formal',
      'Informal',
      'Slang',
      'Idiom',
      'Phrase'
    ]
  }

  // Get native language options
  static getNativeLanguageOptions(): string[] {
    return [
      'Chinese (Mandarin)',
      'Chinese (Cantonese)',
      'Spanish',
      'French',
      'German',
      'Japanese',
      'Korean',
      'Arabic',
      'Russian',
      'Portuguese',
      'Italian',
      'Dutch',
      'Swedish',
      'Norwegian',
      'Danish',
      'Finnish',
      'Polish',
      'Turkish',
      'Hindi',
      'Thai',
      'Vietnamese',
      'Other'
    ]
  }
}
