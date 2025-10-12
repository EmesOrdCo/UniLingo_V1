import { supabase } from './supabase';
import { logger } from './logger';

export interface GeneralLessonProgress {
  id: string;
  user_id: string;
  lesson_type: 'general';
  subject_name: string;
  cefr_level: string;
  exercises_completed: number;
  total_exercises: number;
  lessons_completed: number;
  total_lessons: number;
  completed_lessons: string[];
  status: 'not_started' | 'in_progress' | 'completed';
  total_score: number;
  max_possible_score: number;
  average_accuracy: number;
  total_time_spent_seconds: number;
  started_at: string;
  completed_at: string | null;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseCompletionData {
  exerciseName: string; // 'flashcards', 'flashcard-quiz', 'sentence-scramble', etc.
  score: number;
  maxScore: number;
  accuracy: number;
  timeSpentSeconds: number;
}

export class GeneralLessonProgressService {
  /**
   * Get progress for a specific general lesson (subject)
   */
  static async getSubjectProgress(
    userId: string,
    subjectName: string,
    cefrLevel: string
  ): Promise<GeneralLessonProgress | null> {
    try {
      const { data, error } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_type', 'general')
        .eq('subject_name', subjectName)
        .eq('cefr_level', cefrLevel)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No record found
        }
        logger.error('Error fetching general lesson progress:', error);
        return null;
      }

      return {
        ...data,
        completed_lessons: data.completed_lessons || []
      };
    } catch (error) {
      logger.error('Error in getSubjectProgress:', error);
      return null;
    }
  }

  /**
   * Get all general lesson progress for a user
   */
  static async getAllSubjectProgress(userId: string): Promise<GeneralLessonProgress[]> {
    try {
      const { data, error } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_type', 'general')
        .order('last_accessed_at', { ascending: false });

      if (error) {
        logger.error('Error fetching all general lesson progress:', error);
        return [];
      }

      return data.map(lesson => ({
        ...lesson,
        completed_lessons: lesson.completed_lessons || []
      }));
    } catch (error) {
      logger.error('Error in getAllSubjectProgress:', error);
      return [];
    }
  }

  /**
   * Get progress for all subjects in a specific CEFR level
   */
  static async getSubjectProgressByCefrLevel(
    userId: string,
    cefrLevel: string
  ): Promise<GeneralLessonProgress[]> {
    try {
      const { data, error } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_type', 'general')
        .eq('cefr_level', cefrLevel)
        .order('last_accessed_at', { ascending: false });

      if (error) {
        logger.error('Error fetching general lesson progress by CEFR level:', error);
        return [];
      }

      return data.map(lesson => ({
        ...lesson,
        completed_lessons: lesson.completed_lessons || []
      }));
    } catch (error) {
      logger.error('Error in getSubjectProgressByCefrLevel:', error);
      return [];
    }
  }

  /**
   * Record exercise completion for a general lesson
   * This is called after each exercise (flashcards, quiz, etc.)
   */
  static async recordExerciseCompletion(
    userId: string,
    subjectName: string,
    cefrLevel: string,
    exerciseData: ExerciseCompletionData
  ): Promise<GeneralLessonProgress | null> {
    try {
      // Get existing progress
      const existing = await this.getSubjectProgress(userId, subjectName, cefrLevel);
      
      // Get completed exercises list
      const completedExercises = existing?.completed_lessons || [];
      
      // Only add if not already completed
      if (!completedExercises.includes(exerciseData.exerciseName)) {
        completedExercises.push(exerciseData.exerciseName);
      }
      
      const totalExercises = 5; // words, listen, speak, write, roleplay
      const exercisesCompleted = completedExercises.length;
      const newStatus = exercisesCompleted >= totalExercises ? 'completed' : 'in_progress';
      
      // Calculate cumulative scores
      const totalScore = (existing?.total_score || 0) + exerciseData.score;
      const maxPossibleScore = (existing?.max_possible_score || 0) + exerciseData.maxScore;
      const totalTimeSpent = (existing?.total_time_spent_seconds || 0) + exerciseData.timeSpentSeconds;
      const averageAccuracy = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      
      // Update or insert progress
      const { data, error: upsertError } = await supabase
        .from('unit_progress')
        .upsert({
          user_id: userId,
          lesson_type: 'general',
          subject_name: subjectName,
          cefr_level: cefrLevel,
          unit_code: `${cefrLevel}-${subjectName}`, // Unique identifier
          unit_title: subjectName,
          unit_number: 0, // Not applicable for general lessons
          exercises_completed: exercisesCompleted,
          total_exercises: totalExercises,
          lessons_completed: exercisesCompleted,
          total_lessons: totalExercises,
          completed_lessons: completedExercises,
          status: newStatus,
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          average_accuracy: averageAccuracy,
          total_time_spent_seconds: totalTimeSpent,
          started_at: existing?.started_at || new Date().toISOString(),
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,subject_name,cefr_level',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (upsertError) {
        logger.error('Error updating general lesson progress:', upsertError);
        return null;
      }

      // Record activity in user_activities table for streak tracking
      await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: 'general_lesson',
          activity_name: `${subjectName} - ${exerciseData.exerciseName}`,
          duration_seconds: exerciseData.timeSpentSeconds,
          score: exerciseData.score,
          max_score: exerciseData.maxScore,
          accuracy_percentage: exerciseData.accuracy,
          completed_at: new Date().toISOString()
        });

      logger.info(`✅ Exercise completion recorded: ${subjectName} (${cefrLevel}), ${exerciseData.exerciseName} (${exercisesCompleted}/${totalExercises})`);
      
      return {
        ...data,
        completed_lessons: data.completed_lessons || []
      };
    } catch (error) {
      logger.error('Error recording exercise completion:', error);
      return null;
    }
  }

  /**
   * Get completion statistics for general lessons
   */
  static async getCompletionStats(userId: string): Promise<{
    totalSubjects: number;
    completedSubjects: number;
    inProgressSubjects: number;
    totalScore: number;
    averageAccuracy: number;
    totalTimeSpent: number;
  }> {
    try {
      const allProgress = await this.getAllSubjectProgress(userId);
      
      const completed = allProgress.filter(p => p.status === 'completed');
      const inProgress = allProgress.filter(p => p.status === 'in_progress');
      
      const totalScore = allProgress.reduce((sum, p) => sum + (p.total_score || 0), 0);
      const totalMaxScore = allProgress.reduce((sum, p) => sum + (p.max_possible_score || 0), 0);
      const averageAccuracy = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
      const totalTimeSpent = allProgress.reduce((sum, p) => sum + (p.total_time_spent_seconds || 0), 0);
      
      return {
        totalSubjects: allProgress.length,
        completedSubjects: completed.length,
        inProgressSubjects: inProgress.length,
        totalScore,
        averageAccuracy,
        totalTimeSpent
      };
    } catch (error) {
      logger.error('Error getting completion stats:', error);
      return {
        totalSubjects: 0,
        completedSubjects: 0,
        inProgressSubjects: 0,
        totalScore: 0,
        averageAccuracy: 0,
        totalTimeSpent: 0
      };
    }
  }

  /**
   * Check if a subject is completed
   */
  static async isSubjectCompleted(
    userId: string,
    subjectName: string,
    cefrLevel: string
  ): Promise<boolean> {
    const progress = await this.getSubjectProgress(userId, subjectName, cefrLevel);
    return progress?.status === 'completed';
  }

  /**
   * Get completion percentage for a subject
   */
  static async getSubjectCompletionPercentage(
    userId: string,
    subjectName: string,
    cefrLevel: string
  ): Promise<number> {
    const progress = await this.getSubjectProgress(userId, subjectName, cefrLevel);
    if (!progress) return 0;
    
    return Math.round((progress.exercises_completed / progress.total_exercises) * 100);
  }

  /**
   * Delete general lesson progress (for testing/admin)
   */
  static async deleteSubjectProgress(
    userId: string,
    subjectName: string,
    cefrLevel: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('unit_progress')
        .delete()
        .eq('user_id', userId)
        .eq('lesson_type', 'general')
        .eq('subject_name', subjectName)
        .eq('cefr_level', cefrLevel);

      if (error) {
        logger.error('Error deleting general lesson progress:', error);
        return false;
      }

      logger.info(`🗑️ Deleted progress for ${subjectName} (${cefrLevel})`);
      return true;
    } catch (error) {
      logger.error('Error in deleteSubjectProgress:', error);
      return false;
    }
  }
}

