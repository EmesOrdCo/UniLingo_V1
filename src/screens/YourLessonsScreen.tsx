import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useRefresh } from '../contexts/RefreshContext';
import { LessonService, Lesson, LessonProgress } from '../lib/lessonService';
import { supabase } from '../lib/supabase';

export default function YourLessonsScreen() {
  const [lessons, setLessons] = useState<(Lesson & { vocab_count: number; progress?: LessonProgress })[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigation = useNavigation();
  const { user } = useAuth();
  const { refreshTrigger } = useRefresh();

  // Fetch user's lessons when component comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserLessons();
    }, [user])
  );

  // Add refresh trigger to reload data when lessons are created
  useEffect(() => {
    if (user?.id && refreshTrigger) {
      console.log('🔄 Refresh trigger detected, reloading lessons...');
      fetchUserLessons();
    }
  }, [refreshTrigger, user]);

  const fetchUserLessons = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userLessons = await LessonService.getUserLessonsWithProgress(user.id);
      setLessons(userLessons);
      console.log(`✅ Fetched ${userLessons.length} lessons for user`);
    } catch (error) {
      console.error('❌ Error fetching user lessons:', error);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonPress = (lesson: Lesson) => {
    // Navigate to lesson walkthrough
    (navigation as any).navigate('LessonWalkthrough', { 
      lessonId: lesson.id, 
      lessonTitle: lesson?.title || 'Unknown' 
    });
  };

  const handleCreateLesson = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create lessons.');
      return;
    }
    
    // Navigate to CreateLesson screen
    navigation.navigate('CreateLesson' as never);
  };

  const deleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!user) return;
    
    Alert.alert(
      'Delete Lesson',
      `Are you sure you want to delete "${lessonTitle}"? This will permanently remove the lesson and all associated data. This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete lesson progress first
              const { error: lessonProgressError } = await supabase
                .from('lesson_progress')
                .delete()
                .eq('lesson_id', lessonId);

              if (lessonProgressError) {
                console.error('Error deleting lesson progress:', lessonProgressError);
                throw lessonProgressError;
              }

              // Delete lesson vocabulary
              const { error: lessonVocabError } = await supabase
                .from('lesson_vocabulary')
                .delete()
                .eq('lesson_id', lessonId);

              if (lessonVocabError) {
                console.error('Error deleting lesson vocabulary:', lessonVocabError);
                throw lessonVocabError;
              }

              // Delete the lesson itself
              const { error: lessonError } = await supabase
                .from('esp_lessons')
                .delete()
                .eq('id', lessonId)
                .eq('user_id', user.id); // Ensure user can only delete their own lessons

              if (lessonError) {
                console.error('Error deleting lesson:', lessonError);
                throw lessonError;
              }

              // Remove from local state
              setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
              
              Alert.alert('Success', 'Lesson deleted successfully');
            } catch (error) {
              console.error('Error deleting lesson:', error);
              Alert.alert('Error', 'Failed to delete lesson. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressColor = (progress?: LessonProgress) => {
    if (!progress) return '#e5e7eb';
    const percentage = ((progress as any).words_learned / (progress as any).total_words) * 100;
    if (percentage === 0) return '#e5e7eb';
    if (percentage < 50) return '#f59e0b';
    if (percentage < 100) return '#3b82f6';
    return '#10b981';
  };

  const getProgressPercentage = (progress?: LessonProgress) => {
    if (!progress) return 0;
    
    // Calculate progress based on completion status and score
    if (progress.completed_at) {
      // Lesson is completed - 100% progress
      return 100;
    } else if (progress.started_at) {
      // Lesson is started but not completed - calculate based on score
      const scorePercentage = progress.max_possible_score > 0 
        ? Math.round((progress.total_score / progress.max_possible_score) * 100)
        : 0;
      return Math.min(scorePercentage, 99); // Cap at 99% until completed
    }
    
    return 0; // Not started
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Lessons</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading your lessons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Lessons</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create Lesson Button */}
        <TouchableOpacity style={[styles.createLessonButton, styles.createLessonButtonWithMargin]} onPress={handleCreateLesson}>
          <View style={styles.createLessonContent}>
            <View style={styles.createLessonIcon}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </View>
            <Text style={styles.createLessonText}>Create New Lesson</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ffffff" />
        </TouchableOpacity>

        {/* Lessons List */}
        {lessons.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="book-outline" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyStateTitle}>No lessons yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Create an AI lesson by uploading a PDF or document to get started with personalized learning.
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateLesson}>
              <Text style={styles.emptyStateButtonText}>Create an AI Lesson</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.lessonsList}>
            {lessons.map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={styles.lessonCard}
                onPress={() => handleLessonPress(lesson)}
              >
                <View style={styles.lessonHeader}>
                  <View style={styles.lessonTitleContainer}>
                    <Text style={styles.lessonTitle} numberOfLines={2}>
                      {lesson?.title || 'Unknown'}
                    </Text>
                    <Text style={styles.lessonSubject}>{lesson.subject}</Text>
                  </View>
                  <View style={styles.lessonActions}>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteLesson(lesson.id, lesson?.title || 'Unknown')}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                    <View style={styles.lessonIcon}>
                      <Ionicons name="book" size={20} color="#6366f1" />
                    </View>
                  </View>
                </View>

                <View style={styles.lessonDetails}>
                  <View style={styles.lessonDetailItem}>
                    <Ionicons name="document-text" size={16} color="#6b7280" />
                    <Text style={styles.lessonDetailText}>
                      {lesson.vocab_count} words
                    </Text>
                  </View>
                  <View style={styles.lessonDetailItem}>
                    <Ionicons name="calendar" size={16} color="#6b7280" />
                    <Text style={styles.lessonDetailText}>
                      {formatDate(lesson.created_at)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                {lesson.progress && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressPercentage}>
                        {getProgressPercentage(lesson.progress)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${getProgressPercentage(lesson.progress)}%`,
                            backgroundColor: getProgressColor(lesson.progress),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {lesson.progress.completed_at 
                        ? 'Completed' 
                        : lesson.progress.started_at 
                          ? `${lesson.progress.total_score}/${lesson.progress.max_possible_score} points`
                          : 'Start'
                      }
                    </Text>
                  </View>
                )}

                <View style={styles.lessonFooter}>
                  <View style={styles.lessonStatus}>
                    {lesson.progress && lesson.progress.started_at ? (
                      <View style={styles.statusBadge}>
                        <Ionicons name="play-circle" size={16} color="#6366f1" />
                        <Text style={styles.statusText}>Continue</Text>
                      </View>
                    ) : (
                      <View style={styles.statusBadge}>
                        <Ionicons name="play-circle" size={16} color="#6366f1" />
                        <Text style={styles.statusText}>Start</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  headerSpacer: {
    width: 40, // Same width as back button to center the title
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  headerSection: {
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  createLessonButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  createLessonButtonWithMargin: {
    marginTop: 20,
  },
  createLessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createLessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createLessonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  lessonsList: {
    paddingBottom: 24,
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lessonTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  lessonSubject: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  lessonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  lessonDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  lessonDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonStatus: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
