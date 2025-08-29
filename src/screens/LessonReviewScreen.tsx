import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LessonService } from '../lib/lessonService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface RouteParams {
  lessonId: string;
  progressId: string;
  totalScore: number;
  maxPossibleScore: number;
  exercisesCompleted: number;
  totalExercises: number;
  timeSpentSeconds: number;
}





export default function LessonReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const params = route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);



  useEffect(() => {
    loadLessonReview();
  }, []);

  const loadLessonReview = async () => {
    try {
      setLoading(true);
      
      // Load lesson details
      const lessonData = await LessonService.getLesson(params.lessonId);
      setLesson(lessonData);

      // Load progress data from lesson_progress table
      const { data: progressData, error: progressError } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('id', params.progressId)
        .single();

      if (progressError) {
        console.error('Error loading progress:', progressError);
      } else {
        setProgress(progressData);
      }





    } catch (error) {
      console.error('Error loading lesson review:', error);
      Alert.alert('Error', 'Failed to load lesson review data');
    } finally {
      setLoading(false);
    }
  };



  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'needs_improvement': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'star';
      case 'good': return 'thumbs-up';
      case 'fair': return 'checkmark-circle';
      case 'needs_improvement': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Analyzing your lesson results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesson Review</Text>

      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Lesson Info */}
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{lesson?.title || 'Lesson Review'}</Text>
          <Text style={styles.lessonSubtitle}>{lesson?.description || 'Review your performance'}</Text>
        </View>

        {/* Performance Summary */}
        <View style={styles.performanceSummary}>
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Ionicons 
                name={getPerformanceIcon(params.totalScore >= params.maxPossibleScore * 0.8 ? 'excellent' : params.totalScore >= params.maxPossibleScore * 0.6 ? 'good' : 'fair')} 
                size={32} 
                color={getPerformanceColor(params.totalScore >= params.maxPossibleScore * 0.8 ? 'excellent' : params.totalScore >= params.maxPossibleScore * 0.6 ? 'good' : 'fair')} 
              />
              <Text style={styles.performanceText}>
                {params.totalScore >= params.maxPossibleScore * 0.8 ? 'EXCELLENT' : params.totalScore >= params.maxPossibleScore * 0.6 ? 'GOOD' : 'FAIR'}
              </Text>
            </View>
            <Text style={styles.scoreText}>
              {params.totalScore}/{params.maxPossibleScore}
            </Text>
            <Text style={styles.percentageText}>
              Correct Answers
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.statValue}>{params.exercisesCompleted}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#f59e0b" />
              <Text style={styles.statValue}>{formatTime(params.timeSpentSeconds)}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="speedometer" size={24} color="#6366f1" />
              <Text style={styles.statValue}>
                {Math.round((params.exercisesCompleted / params.timeSpentSeconds) * 60 * 10) / 10}
              </Text>
              <Text style={styles.statLabel}>Exercises/min</Text>
            </View>
          </View>
        </View>

        {/* Rich Progress Data from Database */}
        {progress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Detailed Progress Analysis</Text>
            
            {/* Learning Objectives */}
            {progress.learning_objectives_completed !== undefined && (
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>Learning Objectives</Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Completed:</Text>
                  <Text style={styles.progressValue}>{progress.learning_objectives_completed}/{progress.total_learning_objectives || 'N/A'}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress.total_learning_objectives ? (progress.learning_objectives_completed / progress.total_learning_objectives) * 100 : 0}%` }]} />
                </View>
              </View>
            )}

            {/* User Feedback Metrics */}
            <View style={styles.metricsGrid}>
              {progress.confidence_rating !== undefined && (
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Confidence</Text>
                  <Text style={styles.metricValue}>{progress.confidence_rating}/10</Text>
                  <View style={styles.ratingBar}>
                    <View style={[styles.ratingFill, { width: `${(progress.confidence_rating / 10) * 100}%` }]} />
                  </View>
                </View>
              )}

              {progress.difficulty_perceived !== undefined && (
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Difficulty</Text>
                  <Text style={styles.metricValue}>{progress.difficulty_perceived}/10</Text>
                  <View style={styles.ratingBar}>
                    <View style={[styles.ratingFill, { width: `${(progress.difficulty_perceived / 10) * 100}%` }]} />
                  </View>
                </View>
              )}

              {progress.engagement_score !== undefined && (
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Engagement</Text>
                  <Text style={styles.metricValue}>{progress.engagement_score}/10</Text>
                  <View style={styles.ratingBar}>
                    <View style={[styles.ratingFill, { width: `${(progress.engagement_score / 10) * 100}%` }]} />
                  </View>
                </View>
              )}
            </View>

            {/* Study Environment & Mood */}
            {(progress.study_environment || progress.energy_level !== undefined || progress.stress_level !== undefined) && (
              <View style={styles.environmentCard}>
                <Text style={styles.progressTitle}>Study Environment</Text>
                {progress.study_environment && (
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Environment:</Text>
                    <Text style={styles.progressValue}>{progress.study_environment}</Text>
                  </View>
                )}
                {progress.energy_level !== undefined && (
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Energy Level:</Text>
                    <Text style={styles.progressValue}>{progress.energy_level}/10</Text>
                  </View>
                )}
                {progress.stress_level !== undefined && (
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Stress Level:</Text>
                    <Text style={styles.progressValue}>{progress.stress_level}/10</Text>
                  </View>
                )}
              </View>
            )}

            {/* Notes */}
            {progress.notes && (
              <View style={styles.notesCard}>
                <Text style={styles.progressTitle}>Your Notes</Text>
                <Text style={styles.notesText}>{progress.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Basic Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Performance Metrics</Text>
          <View style={styles.skillGrid}>
            <View style={styles.skillCard}>
              <Text style={styles.skillName}>Exercise Completion</Text>
              <View style={styles.skillProgress}>
                <View style={[styles.progressBar, { width: `${(params.exercisesCompleted / 4) * 100}%`, backgroundColor: '#6366f1' }]} />
              </View>
              <Text style={styles.skillScore}>{params.exercisesCompleted}/4</Text>
            </View>
            
            <View style={styles.skillCard}>
              <Text style={styles.skillName}>Accuracy Rate</Text>
              <View style={styles.skillProgress}>
                <View style={[styles.progressBar, { width: `${(params.totalScore / params.maxPossibleScore) * 100}%`, backgroundColor: '#10b981' }]} />
              </View>
              <Text style={styles.skillScore}>{Math.round((params.totalScore / params.maxPossibleScore) * 100)}%</Text>
            </View>
            
            <View style={styles.skillCard}>
              <Text style={styles.skillName}>Time Efficiency</Text>
              <View style={styles.skillProgress}>
                <View style={[styles.progressBar, { width: `${Math.min(100, Math.max(0, (params.exercisesCompleted / params.timeSpentSeconds) * 60 * 2))}%`, backgroundColor: '#f59e0b' }]} />
              </View>
              <Text style={styles.skillScore}>{Math.round((params.exercisesCompleted / params.timeSpentSeconds) * 60 * 10) / 10}/min</Text>
            </View>
          </View>
        </View>

        {/* Real Performance Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 Performance Analysis</Text>
          
          <View style={styles.insightGroup}>
            <Text style={styles.insightTitle}>✅ What You Did Well</Text>
            <View style={styles.strengthItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.insightText}>Completed {params.exercisesCompleted} out of 4 exercises</Text>
            </View>
            {params.totalScore > 0 && (
              <View style={styles.strengthItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.insightText}>Scored {params.totalScore} correct answers</Text>
            </View>
            )}
            {params.timeSpentSeconds < 600 && (
              <View style={styles.strengthItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.insightText}>Completed lesson in {formatTime(params.timeSpentSeconds)}</Text>
              </View>
            )}
          </View>

          {params.totalScore < params.maxPossibleScore && (
            <View style={styles.insightGroup}>
              <Text style={styles.insightTitle}>🎯 Areas for Improvement</Text>
              <View style={styles.weaknessItem}>
                <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                <Text style={styles.insightText}>Accuracy: {Math.round((params.totalScore / params.maxPossibleScore) * 100)}%</Text>
              </View>
              {params.exercisesCompleted < 4 && (
                <View style={styles.weaknessItem}>
                  <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                  <Text style={styles.insightText}>Completed {params.exercisesCompleted}/4 exercises</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Exercise Structure from Database */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Exercise Structure</Text>
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseNumber}>Lesson Exercises</Text>
              <Text style={styles.exerciseType}>Available Types</Text>
            </View>
            <View style={styles.exerciseStats}>
              <View style={styles.exerciseStat}>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={styles.statValue}>{lesson?.exercises?.length || 'N/A'}</Text>
              </View>
              <View style={styles.exerciseStat}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>{params.exercisesCompleted}/{lesson?.exercises?.length || 4}</Text>
              </View>
              <View style={styles.exerciseStat}>
                <Text style={styles.statLabel}>Points Available</Text>
                <Text style={styles.statValue}>{lesson?.exercises?.reduce((sum: number, ex: any) => sum + (ex.points || 1), 0) || 'N/A'}</Text>
              </View>
              <View style={styles.exerciseStat}>
                <Text style={styles.statLabel}>Your Score</Text>
                <Text style={styles.statValue}>{params.totalScore}/{params.maxPossibleScore}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vocabulary Data from Database */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Vocabulary Content</Text>
          <View style={styles.vocabularyCard}>
            <View style={styles.vocabularyHeader}>
              <Text style={styles.vocabularyTerm}>Lesson Vocabulary</Text>
              <View style={styles.masteryBadge}>
                <Text style={styles.masteryText}>Available</Text>
              </View>
            </View>
            <Text style={styles.vocabularyDefinition}>
              This lesson contains vocabulary terms with varying difficulty levels
            </Text>
            <View style={styles.vocabularyStats}>
              <Text style={styles.vocabStat}>Total Terms: {lesson?.vocabulary?.length || 'N/A'}</Text>
              <Text style={styles.vocabStat}>Difficulty Range: 1-5</Text>
              <Text style={styles.vocabStat}>Subject: {lesson?.subject || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Real Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Next Steps</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Continue with next lesson to build momentum</Text>
          </View>
          {params.totalScore < params.maxPossibleScore && (
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Review difficult concepts to improve accuracy</Text>
            </View>
          )}
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{params.totalScore < params.maxPossibleScore ? '3' : '2'}</Text>
            </View>
            <Text style={styles.stepText}>Practice regularly to maintain progress</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Dashboard' as never)}
          >
            <Ionicons name="home" size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Subjects' as never)}
          >
            <Ionicons name="book" size={20} color="#6366f1" />
            <Text style={styles.secondaryButtonText}>Continue Learning</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  analyticsButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  lessonInfo: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  lessonSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  performanceSummary: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  scoreCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6366f1',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skillCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  skillProgress: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  skillScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  insightGroup: {
    marginBottom: 20,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  exerciseCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  exerciseType: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseStat: {
    alignItems: 'center',
  },
  firstAttemptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  firstAttemptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 4,
  },
  vocabularyCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  vocabularyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vocabularyTerm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  masteryBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  masteryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  vocabularyDefinition: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  vocabularyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vocabStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#3730a3',
    marginLeft: 12,
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  actionButtons: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  secondaryButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  bottomSpacing: {
    height: 40,
  },
  // New styles for progress data
  progressCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  environmentCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notesCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
