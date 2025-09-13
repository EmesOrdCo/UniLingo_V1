import { supabase } from './supabase';
import { logger } from './logger';

export interface UnitProgress {
  id: string;
  user_id: string;
  cefr_level: string;        // 'A1', 'A2', 'B1', etc.
  unit_number: number;       // 1, 2, 3, etc.
  unit_code: string;         // 'A1.1', 'A2.3', etc.
  unit_title: string;
  lessons_completed: number;
  total_lessons: number;
  completed_lessons: string[]; // ['words', 'listen', 'write']
  status: 'not_started' | 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export class SimpleUnitProgressService {
  /**
   * Get unit progress for a user
   */
  static async getUnitProgress(userId: string, cefrLevel: string, unitNumber: number): Promise<UnitProgress | null> {
    try {
      const { data, error } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('cefr_level', cefrLevel)
        .eq('unit_number', unitNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No record found
        }
        logger.error('Error fetching unit progress:', error);
        return null;
      }

      return {
        ...data,
        completed_lessons: data.completed_lessons || []
      };
    } catch (error) {
      logger.error('Error in getUnitProgress:', error);
      return null;
    }
  }

  /**
   * Get all unit progress for a user
   */
  static async getAllUnitProgress(userId: string): Promise<UnitProgress[]> {
    try {
      const { data, error } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('user_id', userId)
        .order('cefr_level', { ascending: true })
        .order('unit_number', { ascending: true });

      if (error) {
        logger.error('Error fetching all unit progress:', error);
        return [];
      }

      return data.map(unit => ({
        ...unit,
        completed_lessons: unit.completed_lessons || []
      }));
    } catch (error) {
      logger.error('Error in getAllUnitProgress:', error);
      return [];
    }
  }

  /**
   * Record lesson completion for a specific lesson type
   */
  static async recordLessonCompletion(userId: string, cefrLevel: string, unitNumber: number, lessonType: string): Promise<UnitProgress | null> {
    try {
      // Get current progress
      const { data: existing, error: fetchError } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('cefr_level', cefrLevel)
        .eq('unit_number', unitNumber)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        logger.error('Error fetching current progress:', fetchError);
        return null;
      }

      const completedLessons = existing?.completed_lessons || [];
      
      // Only add if not already completed
      if (!completedLessons.includes(lessonType)) {
        completedLessons.push(lessonType);
        
        const totalLessons = existing?.total_lessons || 5;
        const newStatus = completedLessons.length >= totalLessons ? 'completed' : 'in_progress';
        
        // Update or insert progress
        const { data, error: upsertError } = await supabase
          .from('unit_progress')
          .upsert({
            user_id: userId,
            cefr_level: cefrLevel,
            unit_number: unitNumber,
            unit_code: `${cefrLevel}.${unitNumber}`,
            unit_title: cefrLevel === 'A1' && unitNumber === 1 ? 'Basic Concepts' : `${cefrLevel}.${unitNumber}`,
            lessons_completed: completedLessons.length,
            total_lessons: totalLessons,
            completed_lessons: completedLessons,
            status: newStatus,
            started_at: existing?.started_at || new Date().toISOString(),
            completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
            last_accessed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (upsertError) {
          logger.error('Error updating unit progress:', upsertError);
          return null;
        }

        // Record activity in existing user_activities table
        await supabase
          .from('user_activities')
          .insert({
            user_id: userId,
            activity_type: 'unit_exercise',
            activity_name: `${lessonType} lesson`,
            score: 10,
            max_score: 10,
            accuracy_percentage: 100,
            completed_at: new Date().toISOString()
          });

        logger.info(`Lesson completion recorded: ${cefrLevel}.${unitNumber}, ${lessonType} (${completedLessons.length}/${totalLessons})`);
        
        return {
          ...data,
          completed_lessons: data.completed_lessons || []
        };
      }

      // Return existing progress if lesson already completed
      return existing ? {
        ...existing,
        completed_lessons: existing.completed_lessons || []
      } : null;
    } catch (error) {
      logger.error('Error recording lesson completion:', error);
      return null;
    }
  }

  /**
   * Initialize unit progress for a new user
   */
  static async initializeUserProgress(userId: string, cefrLevel: string = 'A1', unitNumber: number = 1, totalLessons: number = 5): Promise<UnitProgress | null> {
    try {
      const { data, error } = await supabase
        .from('unit_progress')
        .upsert({
          user_id: userId,
          cefr_level: cefrLevel,
          unit_number: unitNumber,
          unit_code: `${cefrLevel}.${unitNumber}`,
          unit_title: cefrLevel === 'A1' && unitNumber === 1 ? 'Basic Concepts' : `${cefrLevel}.${unitNumber}`,
          lessons_completed: 0,
          total_lessons: totalLessons,
          completed_lessons: [],
          status: 'not_started'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error initializing unit progress:', error);
        return null;
      }

      logger.info(`Unit progress initialized for user: ${userId}, ${cefrLevel}.${unitNumber}`);
      
      return {
        ...data,
        completed_lessons: data.completed_lessons || []
      };
    } catch (error) {
      logger.error('Error initializing user progress:', error);
      return null;
    }
  }

  /**
   * Get progress percentage for a unit
   */
  static calculateProgressPercentage(lessonsCompleted: number, totalLessons: number): number {
    return Math.round((lessonsCompleted / totalLessons) * 100);
  }

  /**
   * Check if a specific lesson is completed
   */
  static isLessonCompleted(completedLessons: string[], lessonType: string): boolean {
    return completedLessons.includes(lessonType);
  }
}