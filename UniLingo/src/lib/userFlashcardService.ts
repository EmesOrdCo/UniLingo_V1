import { supabase } from './supabase'
import { Flashcard } from '../types'

export interface UserFlashcard extends Flashcard {
  user_id: string
  pronunciation?: string
  example?: string
  native_language: string
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
      let query = supabase
        .from('user_flashcards')
        .select('*')
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

      // Override user_id with the authenticated user's ID for security
      const secureFlashcardData = {
        ...flashcardData,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .insert([secureFlashcardData])
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

  // Get flashcards by topic
  static async getFlashcardsByTopic(topic: string): Promise<UserFlashcard[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic', topic)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching flashcards by topic:', error)
      throw error
    }
  }

  // Get flashcards by subject
  static async getFlashcardsBySubject(subject: string): Promise<UserFlashcard[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject', subject)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching flashcards by subject:', error)
      throw error
    }
  }

  // Get flashcards by difficulty
  static async getFlashcardsByDifficulty(difficulty: string): Promise<UserFlashcard[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('user_id', user.id)
        .eq('difficulty', difficulty)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching flashcards by difficulty:', error)
      throw error
    }
  }

  // Search flashcards
  static async searchFlashcards(searchTerm: string): Promise<UserFlashcard[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('user_id', user.id)
        .or(`front.ilike.%${searchTerm}%,back.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error searching flashcards:', error)
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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_flashcards')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      const flashcards = data || []
      
      const stats = {
        total: flashcards.length,
        byDifficulty: {} as { [key: string]: number },
        bySubject: {} as { [key: string]: number },
        byTopic: {} as { [key: string]: number }
      }

      flashcards.forEach(card => {
        // Count by difficulty
        stats.byDifficulty[card.difficulty] = (stats.byDifficulty[card.difficulty] || 0) + 1
        
        // Count by subject
        stats.bySubject[card.subject] = (stats.bySubject[card.subject] || 0) + 1
        
        // Count by topic
        stats.byTopic[card.topic] = (stats.byTopic[card.topic] || 0) + 1
      })

      return stats
    } catch (error: any) {
      console.error('Error getting flashcard stats:', error)
      throw error
    }
  }
}










