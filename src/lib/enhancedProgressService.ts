import { supabase } from './supabase';

// ============================================================================
// ENHANCED PROGRESS TRACKING SERVICE
// This service provides comprehensive progress analytics and insights
// ============================================================================

export interface ExercisePerformance {
  id: string;
  progress_id: string;
  exercise_index: number;
  exercise_type: string;
  score: number;
  max_score: number;
  time_spent_seconds: number;
  attempts: number;
  first_attempt_correct: boolean;
  hints_used: number;
  user_feedback?: string;
  created_at: string;
}

export interface VocabularyProgress {
  id: string;
  progress_id: string;
  vocabulary_term_id: string;
  correct_attempts: number;
  incorrect_attempts: number;
  first_seen_at: string;
  last_practiced_at: string;
  retention_score: number;
  created_at: string;
  updated_at: string;
}

export interface LearningSession {
  id: string;
  progress_id: string;
  session_start: string;
  session_end?: string;
  session_duration_seconds?: number;
  exercises_completed: number;
  breaks_taken: number;
  focus_score: number;
  device_type: 'mobile' | 'tablet' | 'desktop';
  time_of_day?: number;
  study_conditions?: string;
  mood_rating: number;
  created_at: string;
}

export interface SkillMetrics {
  id: string;
  user_id: string;
  skill_type: 'reading' | 'writing' | 'listening' | 'speaking' | 'vocabulary' | 'grammar' | 'comprehension';
  subject_area: string;
  proficiency_level: number;
  total_practice_time: number;
  lessons_completed: number;
  average_score: number;
  improvement_rate: number;
  last_updated: string;
  created_at: string;
}

export interface EnhancedProgressInsights {
  strengths: string[];
  weaknesses: string[];
  recommendedFocus: string[];
  optimalStudyTime: string;
  learningStyle: string;
  nextSteps: string[];
  performanceTrend: 'improving' | 'declining' | 'stable';
  estimatedProficiency: number;
}

export class EnhancedProgressService {
  /**
   * Track detailed exercise performance
   */
  static async trackExercisePerformance(
    progressId: string,
    exerciseData: Omit<ExercisePerformance, 'id' | 'created_at'>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('exercise_performance')
        .insert([exerciseData]);

      if (error) throw error;
      console.log('✅ Exercise performance tracked successfully');
    } catch (error) {
      console.error('Error tracking exercise performance:', error);
      throw error;
    }
  }

  /**
   * Track vocabulary progress and mastery
   */
  static async trackVocabularyProgress(
    progressId: string,
    vocabularyData: Omit<VocabularyProgress, 'id' | 'created_at' | 'updated_at'>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('vocabulary_progress')
        .insert([{
          ...vocabularyData,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      console.log('✅ Vocabulary progress tracked successfully');
    } catch (error) {
      console.error('Error tracking vocabulary progress:', error);
      throw error;
    }
  }

  /**
   * Track learning session context
   */
  static async trackLearningSession(
    progressId: string,
    sessionData: Omit<LearningSession, 'id' | 'created_at'>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('learning_sessions')
        .insert([sessionData]);

      if (error) throw error;
      console.log('✅ Learning session tracked successfully');
    } catch (error) {
      console.error('Error tracking learning session:', error);
      throw error;
    }
  }

  /**
   * Update or create skill metrics
   */
  static async updateSkillMetrics(
    userId: string,
    skillType: string,
    subjectArea: string,
    metricsData: Partial<SkillMetrics>
  ): Promise<void> {
    try {
      // Check if skill metric exists
      const { data: existing } = await supabase
        .from('skill_metrics')
        .select('id')
        .eq('user_id', userId)
        .eq('skill_type', skillType)
        .eq('subject_area', subjectArea)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('skill_metrics')
          .update({
            ...metricsData,
            last_updated: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('skill_metrics')
          .insert([{
            user_id: userId,
            skill_type: skillType,
            subject_area: subjectArea,
            proficiency_level: 1,
            total_practice_time: 0,
            lessons_completed: 0,
            average_score: 0,
            improvement_rate: 0,
            ...metricsData
          }]);

        if (error) throw error;
      }

      console.log('✅ Skill metrics updated successfully');
    } catch (error) {
      console.error('Error updating skill metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate vocabulary mastery level based on performance
   */
  static calculateMasteryLevel(correctAttempts: number, incorrectAttempts: number): number {
    const totalAttempts = correctAttempts + incorrectAttempts;
    if (totalAttempts === 0) return 0;
    
    const accuracy = correctAttempts / totalAttempts;
    
    if (accuracy >= 0.9 && totalAttempts >= 5) return 5;      // Mastered
    if (accuracy >= 0.8 && totalAttempts >= 4) return 4;      // Proficient
    if (accuracy >= 0.7 && totalAttempts >= 3) return 3;      // Good
    if (accuracy >= 0.6 && totalAttempts >= 2) return 2;      // Fair
    if (accuracy >= 0.5) return 1;                            // Basic
    return 0;                                                   // Not learned
  }

  /**
   * Calculate retention score based on time and accuracy
   */
  static calculateRetentionScore(
    firstSeen: Date,
    lastPracticed: Date,
    correctAttempts: number,
    incorrectAttempts: number
  ): number {
    const daysSinceFirstSeen = (Date.now() - firstSeen.getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceLastPractice = (Date.now() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24);
    
    const totalAttempts = correctAttempts + incorrectAttempts;
    if (totalAttempts === 0) return 0;
    
    const accuracy = correctAttempts / totalAttempts;
    
    // Base score from accuracy
    let score = accuracy * 100;
    
    // Penalty for time since last practice (forgetting curve)
    if (daysSinceLastPractice > 1) {
      const forgettingPenalty = Math.min(30, daysSinceLastPractice * 2);
      score -= forgettingPenalty;
    }
    
    // Bonus for consistent practice
    if (totalAttempts >= 5) {
      score += Math.min(20, (totalAttempts - 5) * 2);
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get comprehensive enhanced progress insights
   */
  static async getEnhancedProgressInsights(userId: string): Promise<EnhancedProgressInsights> {
    try {
      // Get recent progress data
      const { data: recentProgress } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get skill metrics
      const { data: skillMetrics } = await supabase
        .from('skill_metrics')
        .select('*')
        .eq('user_id', userId);

      // Get learning sessions
      const { data: learningSessions } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      const insights: EnhancedProgressInsights = {
        strengths: [],
        weaknesses: [],
        recommendedFocus: [],
        optimalStudyTime: 'unknown',
        learningStyle: 'unknown',
        nextSteps: [],
        performanceTrend: 'stable',
        estimatedProficiency: 0
      };

      if (recentProgress && recentProgress.length > 0) {
        // Analyze performance trend
        if (recentProgress.length >= 2) {
          const recentAvg = recentProgress[0].total_score / recentProgress[0].max_possible_score;
          const previousAvg = recentProgress[1].total_score / recentProgress[1].max_possible_score;
          
          if (recentAvg > previousAvg + 0.1) insights.performanceTrend = 'improving';
          else if (recentAvg < previousAvg - 0.1) insights.performanceTrend = 'declining';
          else insights.performanceTrend = 'stable';
        }

        // Identify strengths
        if (recentProgress[0].exercises_completed > 0) {
          insights.strengths.push('Consistent lesson completion');
        }
        
        if (recentProgress[0].total_score / recentProgress[0].max_possible_score >= 0.8) {
          insights.strengths.push('High accuracy achieved');
        }

        if (recentProgress[0].time_spent_seconds < 600) {
          insights.strengths.push('Efficient learning pace');
        }
        
        if (recentProgress[0].total_score / recentProgress[0].max_possible_score < 0.7) {
          insights.weaknesses.push('Need to improve accuracy');
          insights.recommendedFocus.push('Review difficult concepts');
        }

        // Calculate estimated proficiency
        const avgScore = recentProgress.reduce((sum, p) => sum + (p.total_score / p.max_possible_score), 0) / recentProgress.length;
        insights.estimatedProficiency = Math.round(avgScore * 10);
      }

      if (skillMetrics && skillMetrics.length > 0) {
        // Find areas needing improvement
        const lowProficiencySkills = skillMetrics.filter(s => s.proficiency_level <= 3);
        if (lowProficiencySkills.length > 0) {
          insights.weaknesses.push(`Low proficiency in ${lowProficiencySkills.map(s => s.skill_type).join(', ')}`);
          insights.recommendedFocus.push(`Focus on ${lowProficiencySkills[0].skill_type} skills`);
        }

        // Find strengths
        const highProficiencySkills = skillMetrics.filter(s => s.proficiency_level >= 7);
        if (highProficiencySkills.length > 0) {
          insights.strengths.push(`Strong ${highProficiencySkills.map(s => s.skill_type).join(', ')} skills`);
        }
      }

      if (learningSessions && learningSessions.length > 0) {
        // Analyze optimal study time
        const timeSlots = learningSessions.map(s => s.time_of_day).filter(t => t !== null);
        if (timeSlots.length > 0) {
          const morningSessions = timeSlots.filter(t => t >= 6 && t <= 11).length;
          const afternoonSessions = timeSlots.filter(t => t >= 12 && t <= 17).length;
          const eveningSessions = timeSlots.filter(t => t >= 18 && t <= 23).length;

          if (morningSessions > afternoonSessions && morningSessions > eveningSessions) {
            insights.optimalStudyTime = 'morning';
          } else if (afternoonSessions > morningSessions && afternoonSessions > eveningSessions) {
            insights.optimalStudyTime = 'afternoon';
          } else if (eveningSessions > 0) {
            insights.optimalStudyTime = 'evening';
          }
        }

        // Analyze learning style
        const focusScores = learningSessions.map(s => s.focus_score).filter(s => s > 0);
        if (focusScores.length > 0) {
          const avgFocus = focusScores.reduce((sum, score) => sum + score, 0) / focusScores.length;
          if (avgFocus >= 8) insights.learningStyle = 'high-focus';
          else if (avgFocus >= 6) insights.learningStyle = 'moderate-focus';
          else insights.learningStyle = 'distracted';
        }
      }

      // Generate next steps
      if (insights.weaknesses.length > 0) {
        insights.nextSteps.push('Review previous lessons to strengthen weak areas');
      }
      if (insights.performanceTrend === 'declining') {
        insights.nextSteps.push('Take a short break and return with fresh focus');
      }
      insights.nextSteps.push('Continue with next lesson to build momentum');

      return insights;
    } catch (error) {
      console.error('Error getting enhanced progress insights:', error);
      // Return default insights on error
      return {
        strengths: ['Consistent learning'],
        weaknesses: ['Continue practicing'],
        recommendedFocus: ['Focus on current lessons'],
        optimalStudyTime: 'unknown',
        learningStyle: 'unknown',
        nextSteps: ['Continue with current lesson'],
        performanceTrend: 'stable',
        estimatedProficiency: 5
      };
    }
  }

  /**
   * Get vocabulary retention analysis with real data
   */
  static async getVocabularyRetention(userId: string, lessonId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('vocabulary_progress')
        .select(`
          *,
          lesson_progress!inner(user_id),
          lesson_vocabulary!inner(english_term, definition, native_translation, example_sentence_en)
        `)
        .eq('lesson_progress.user_id', userId)
        .eq('lesson_progress.lesson_id', lessonId);

      if (error) throw error;
      
      // If no vocabulary progress exists, create basic structure from lesson vocabulary
      if (!data || data.length === 0) {
        const { data: lessonVocab } = await supabase
          .from('lesson_vocabulary')
          .select('*')
          .eq('lesson_id', lessonId);

        if (lessonVocab) {
          return lessonVocab.map(vocab => ({
            id: vocab.id,
            english_term: vocab.english_term,
            definition: vocab.definition,
            native_translation: vocab.native_translation,
            example_sentence_en: vocab.example_sentence_en,
            retention_score: 0,
            correct_attempts: 0,
            incorrect_attempts: 0
          }));
        }
      }

      return data || [];
    } catch (error) {
      console.error('Error getting vocabulary retention:', error);
      return [];
    }
  }

  /**
   * Get exercise performance breakdown with real data
   */
  static async getExercisePerformanceBreakdown(progressId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_performance')
        .select('*')
        .eq('progress_id', progressId)
        .order('exercise_index');

      if (error) throw error;
      
      // If no exercise performance exists, return empty array
      // (Exercise structure is now handled by hardcoded exercise types in frontend)

      return data || [];
    } catch (error) {
      console.error('Error getting exercise performance breakdown:', error);
      return [];
    }
  }
}
