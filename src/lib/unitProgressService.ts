import { supabase } from './supabase';
import { logger } from './logger';

export interface UnitProgressData {
  unitId: number;
  unitTitle: string;
  topicGroup: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
  totalScore: number;
  maxPossibleScore: number;
  averageAccuracy: number;
  totalTimeSpentSeconds: number;
  lastAccessedAt: string;
}

export interface LessonProgressData {
  unitId: number;
  lessonType: 'words' | 'listen' | 'write' | 'speak' | 'roleplay';
  lessonTitle: string;
  totalExercises: number;
  completedExercises: number;
  totalScore: number;
  maxPossibleScore: number;
  averageAccuracy: number;
  timeSpentSeconds: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
  lastAccessedAt: string;
}

export class UnitProgressService {
  /**
   * Get unit progress for a user
   */
  static async getUnitProgress(userId: string, unitId: number): Promise<UnitProgressData | null> {
    try {
      const { data, error } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('unit_id', unitId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, return null
          return null;
        }
        logger.error('Error fetching unit progress:', error);
        throw error;
      }

      return {
        unitId: data.unit_id,
        unitTitle: data.unit_title,
        topicGroup: data.topic_group,
        totalLessons: data.total_lessons,
        completedLessons: data.completed_lessons,
        progressPercentage: data.total_lessons > 0 ? 
          Math.round((data.completed_lessons / data.total_lessons) * 100) : 0,
        status: data.status,
        totalScore: data.total_score,
        maxPossibleScore: data.max_possible_score,
        averageAccuracy: data.average_accuracy,
        totalTimeSpentSeconds: data.total_time_spent_seconds,
        lastAccessedAt: data.last_accessed_at
      };
    } catch (error) {
      logger.error('Error in getUnitProgress:', error);
      throw error;
    }
  }

  /**
   * Get all unit progress for a user
   */
  static async getAllUnitProgress(userId: string): Promise<UnitProgressData[]> {
    try {
      const { data, error } = await supabase
        .from('unit_progress')
        .select('*')
        .eq('user_id', userId)
        .order('unit_id', { ascending: true });

      if (error) {
        logger.error('Error fetching all unit progress:', error);
        throw error;
      }

      return data.map(unit => ({
        unitId: unit.unit_id,
        unitTitle: unit.unit_title,
        topicGroup: unit.topic_group,
        totalLessons: unit.total_lessons,
        completedLessons: unit.completed_lessons,
        progressPercentage: unit.total_lessons > 0 ? 
          Math.round((unit.completed_lessons / unit.total_lessons) * 100) : 0,
        status: unit.status,
        totalScore: unit.total_score,
        maxPossibleScore: unit.max_possible_score,
        averageAccuracy: unit.average_accuracy,
        totalTimeSpentSeconds: unit.total_time_spent_seconds,
        lastAccessedAt: unit.last_accessed_at
      }));
    } catch (error) {
      logger.error('Error in getAllUnitProgress:', error);
      throw error;
    }
  }

  /**
   * Record lesson completion
   */
  static async recordLessonCompletion(
    userId: string,
    unitId: number,
    lessonType: 'words' | 'listen' | 'write' | 'speak' | 'roleplay',
    lessonData: {
      score: number;
      maxScore: number;
      accuracy: number;
      timeSpentSeconds: number;
      exercisesCompleted: number;
      totalExercises: number;
    }
  ): Promise<void> {
    try {
      // Update lesson progress
      const { error: lessonError } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: userId,
          unit_id: unitId,
          lesson_type: lessonType,
          lesson_title: lessonType.charAt(0).toUpperCase() + lessonType.slice(1),
          total_exercises: lessonData.totalExercises,
          completed_exercises: lessonData.exercisesCompleted,
          total_score: lessonData.score,
          max_possible_score: lessonData.maxScore,
          average_accuracy: lessonData.accuracy,
          time_spent_seconds: lessonData.timeSpentSeconds,
          status: lessonData.exercisesCompleted >= lessonData.totalExercises ? 'completed' : 'in_progress',
          completed_at: lessonData.exercisesCompleted >= lessonData.totalExercises ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString()
        });

      if (lessonError) {
        logger.error('Error updating lesson progress:', lessonError);
        throw lessonError;
      }

      // Update unit progress
      await this.updateUnitProgress(userId, unitId);

      // Record activity in existing user_activities table
      await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: 'unit_exercise',
          activity_name: `${lessonType} lesson`,
          duration_seconds: lessonData.timeSpentSeconds,
          score: lessonData.score,
          max_score: lessonData.maxScore,
          accuracy_percentage: lessonData.accuracy,
          completed_at: new Date().toISOString()
        });

      logger.info(`Lesson completion recorded: Unit ${unitId}, ${lessonType}`);
    } catch (error) {
      logger.error('Error recording lesson completion:', error);
      throw error;
    }
  }

  /**
   * Update unit progress based on lesson completions
   */
  private static async updateUnitProgress(userId: string, unitId: number): Promise<void> {
    try {
      // Get lesson progress for this unit
      const { data: lessons, error: lessonsError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('unit_id', unitId);

      if (lessonsError) {
        logger.error('Error fetching lesson progress:', lessonsError);
        throw lessonsError;
      }

      // Calculate totals
      const totalLessons = lessons.length;
      const completedLessons = lessons.filter(l => l.status === 'completed').length;
      const totalExercises = lessons.reduce((sum, l) => sum + l.total_exercises, 0);
      const completedExercises = lessons.reduce((sum, l) => sum + l.completed_exercises, 0);
      const totalScore = lessons.reduce((sum, l) => sum + l.total_score, 0);
      const maxPossibleScore = lessons.reduce((sum, l) => sum + l.max_possible_score, 0);
      const totalTimeSpent = lessons.reduce((sum, l) => sum + l.time_spent_seconds, 0);
      const averageAccuracy = lessons.length > 0 ? 
        lessons.reduce((sum, l) => sum + l.average_accuracy, 0) / lessons.length : 0;

      // Determine unit status
      let status: 'not_started' | 'in_progress' | 'completed' | 'locked' = 'not_started';
      if (completedLessons > 0) {
        status = completedLessons >= totalLessons ? 'completed' : 'in_progress';
      }

      // Update unit progress
      const { error: unitError } = await supabase
        .from('unit_progress')
        .upsert({
          user_id: userId,
          unit_id: unitId,
          unit_title: unitId === 1 ? 'Basic Concepts' : `Unit ${unitId}`,
          topic_group: unitId === 1 ? 'Basic Concepts' : 'general',
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          total_exercises: totalExercises,
          completed_exercises: completedExercises,
          total_score: totalScore,
          max_possible_score: maxPossibleScore,
          average_accuracy: averageAccuracy,
          total_time_spent_seconds: totalTimeSpent,
          status: status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString()
        });

      if (unitError) {
        logger.error('Error updating unit progress:', unitError);
        throw unitError;
      }

      logger.info(`Unit progress updated: Unit ${unitId}, ${completedLessons}/${totalLessons} lessons completed`);
    } catch (error) {
      logger.error('Error in updateUnitProgress:', error);
      throw error;
    }
  }

  /**
   * Initialize unit progress for a new user
   */
  static async initializeUserProgress(userId: string): Promise<void> {
    try {
      // Initialize Unit 1 progress
      const { error: unitError } = await supabase
        .from('unit_progress')
        .upsert({
          user_id: userId,
          unit_id: 1,
          unit_title: 'Basic Concepts',
          topic_group: 'Basic Concepts',
          status: 'not_started'
        });

      if (unitError) {
        logger.error('Error initializing unit progress:', unitError);
        throw unitError;
      }

      // Initialize Unit 1 lesson progress
      const lessons = [
        { type: 'words', title: 'Words' },
        { type: 'listen', title: 'Listen' },
        { type: 'write', title: 'Write' },
        { type: 'speak', title: 'Speak' },
        { type: 'roleplay', title: 'Roleplay' }
      ];

      for (const lesson of lessons) {
        const { error: lessonError } = await supabase
          .from('lesson_progress')
          .upsert({
            user_id: userId,
            unit_id: 1,
            lesson_type: lesson.type,
            lesson_title: lesson.title,
            status: ['words', 'listen', 'write'].includes(lesson.type) ? 'active' : 'locked'
          });

        if (lessonError) {
          logger.error(`Error initializing lesson progress for ${lesson.type}:`, lessonError);
          throw lessonError;
        }
      }

      logger.info(`Progress initialized for user: ${userId}`);
    } catch (error) {
      logger.error('Error initializing user progress:', error);
      throw error;
    }
  }

  /**
   * Get lesson progress for a specific unit
   */
  static async getLessonProgress(userId: string, unitId: number): Promise<LessonProgressData[]> {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('unit_id', unitId)
        .order('lesson_type', { ascending: true });

      if (error) {
        logger.error('Error fetching lesson progress:', error);
        throw error;
      }

      return data.map(lesson => ({
        unitId: lesson.unit_id,
        lessonType: lesson.lesson_type,
        lessonTitle: lesson.lesson_title,
        totalExercises: lesson.total_exercises,
        completedExercises: lesson.completed_exercises,
        totalScore: lesson.total_score,
        maxPossibleScore: lesson.max_possible_score,
        averageAccuracy: lesson.average_accuracy,
        timeSpentSeconds: lesson.time_spent_seconds,
        status: lesson.status,
        lastAccessedAt: lesson.last_accessed_at
      }));
    } catch (error) {
      logger.error('Error in getLessonProgress:', error);
      throw error;
    }
  }
}