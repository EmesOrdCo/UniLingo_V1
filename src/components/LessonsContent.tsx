import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { LessonService, Lesson, LessonProgress } from '../lib/lessonService';

export default function LessonsContent() {
  const [lessons, setLessons] = useState<(Lesson & { vocab_count: number; progress?: LessonProgress })[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  
  const navigation = useNavigation();
  const { user } = useAuth();

  // Fetch user's lessons when component comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserLessons();
    }, [user])
  );

  const fetchUserLessons = async () => {
    if (!user) {
      setLoadingLessons(false);
      return;
    }

    try {
      setLoadingLessons(true);
      const userLessons = await LessonService.getUserLessonsWithProgress(user.id);
      setLessons(userLessons);
      console.log(`✅ Fetched ${userLessons.length} lessons for user`);
    } catch (error) {
      console.error('❌ Error fetching user lessons:', error);
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleCreateLesson = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create lessons.');
      return;
    }
    
    // Navigate to CreateLesson screen
    navigation.navigate('CreateLesson' as never);
  };

  const handleLessonPress = async (lesson: Lesson) => {
    // Navigate to lesson walkthrough
    (navigation as any).navigate('LessonWalkthrough', {
      lessonId: lesson.id,
      lessonTitle: lesson.title
    });
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    Alert.alert(
      'Delete Lesson',
      `Are you sure you want to delete "${lesson.title}"? This action cannot be undone and will remove all lesson data including vocabulary and progress.`,
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
              const success = await LessonService.deleteLesson(lesson.id, user!.id);
              if (success) {
                Alert.alert('Success', 'Lesson deleted successfully!');
                // Refresh the lessons list
                fetchUserLessons();
              } else {
                Alert.alert('Error', 'Failed to delete lesson. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting lesson:', error);
              Alert.alert('Error', 'Failed to delete lesson. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    fetchUserLessons();
  };

  // Helper function to calculate progress percentage
  const calculateProgressPercentage = (lesson: Lesson & { vocab_count: number; progress?: LessonProgress }): number => {
    if (!lesson.progress) return 0;
    
    // Calculate based on exercises completed vs total exercises
    // There are exactly 5 exercises per lesson: flashcards, flashcard-quiz, sentence-scramble, word-scramble, fill-in-blank
    const totalExercises = lesson.progress.total_exercises || 5;
    const completedExercises = lesson.progress.exercises_completed || 0;
    
    // Ensure percentage doesn't exceed 100%
    return Math.min(Math.round((completedExercises / totalExercises) * 100), 100);
  };

  // Helper function to get progress status text
  const getProgressStatusText = (lesson: Lesson & { vocab_count: number; progress?: LessonProgress }): string => {
    if (!lesson.progress) return 'Not started';
    
    if (lesson.progress.completed_at) {
      return 'Completed';
    }
    
    const percentage = calculateProgressPercentage(lesson);
    const completedExercises = lesson.progress.exercises_completed || 0;
    
    if (percentage === 0) {
      return 'Not started';
    } else if (percentage < 100) {
      return `${completedExercises}/5 exercises`;
    } else {
      return 'Completed';
    }
  };

  // Helper function to get subject-specific colors
  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'Mathematics': '#6366f1',
      'Science': '#10b981',
      'History': '#f59e0b',
      'Literature': '#ef4444',
      'Language': '#8b5cf6',
      'Art': '#ec4899',
      'Music': '#06b6d4',
      'Geography': '#84cc16',
      'default': '#6366f1'
    };
    return colors[subject] || colors.default;
  };
  if (loadingLessons) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your lessons...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with refresh button */}

      {lessons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Lessons Yet</Text>
          <Text style={styles.emptyText}>
            Upload a PDF to create your first lesson and start learning English terminology!
          </Text>
          
          {/* AI-Powered Lessons Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI-Powered Vocabulary Lessons</Text>
            <Text style={styles.cardDescription}>
              Upload your course notes and let AI create an interactive vocabulary lesson 
              with flashcards and games. Perfect for learning subject-specific English terminology.
            </Text>
          </View>

          {/* Create Your Lesson Section */}
          <View style={styles.card}>
            <View style={styles.lessonIconContainer}>
              <Ionicons name="document-text" size={64} color="#6366f1" />
            </View>
            <Text style={styles.cardTitle}>Create Your First Lesson</Text>
            <Text style={styles.cardDescription}>
              Upload PDF course notes to generate an interactive vocabulary lesson
            </Text>
            <TouchableOpacity 
              style={styles.mainCreateButton}
              onPress={handleCreateLesson}
            >
              <Ionicons name="cloud-upload" size={20} color="#ffffff" />
              <Text style={styles.createButtonText}>Choose PDF File</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.lessonsContainer}>
          {/* Lessons Header */}
          <View style={styles.lessonsHeader}>
            <Text style={styles.lessonsTitle}>{lessons.length} lessons created</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchUserLessons}
                disabled={loadingLessons}
              >
                <Ionicons 
                  name="refresh" 
                  size={16} 
                  color={loadingLessons ? "#94a3b8" : "#6366f1"} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addLessonButton}
                onPress={handleCreateLesson}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text style={styles.addLessonButtonText}>New Lesson</Text>
              </TouchableOpacity>
            </View>
          </View>

          {lessons.map((lesson, index) => (
            <TouchableOpacity
              key={lesson.id}
              style={styles.lessonCard}
              onPress={() => handleLessonPress(lesson)}
              activeOpacity={0.7}
            >
              {/* Delete Button - Top Right */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteLesson(lesson)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>

              {/* Lesson Header with Icon */}
              <View style={styles.lessonHeader}>
                <View style={styles.lessonIconContainer}>
                  <View style={[
                    styles.lessonIcon,
                    { backgroundColor: getSubjectColor(lesson.subject) }
                  ]}>
                    <Ionicons name="book-outline" size={20} color="#ffffff" />
                  </View>
                </View>
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle} numberOfLines={2}>
                    {lesson.title}
                  </Text>
                  <Text style={styles.lessonDate}>
                    Created {new Date(lesson.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              {/* Lesson Details - Single Line */}
              <View style={styles.lessonDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="library-outline" size={14} color="#6366f1" />
                  <Text style={styles.detailText}>{lesson.vocab_count} terms</Text>
                </View>
                <View style={styles.detailSeparator} />
                <View style={styles.detailItem}>
                  <Ionicons name="trending-up-outline" size={14} color="#6366f1" />
                  <Text style={styles.detailText}>{lesson.difficulty_level}</Text>
                </View>
                <View style={styles.detailSeparator} />
                <View style={styles.detailItem}>
                  <Ionicons name="document-text-outline" size={14} color="#6366f1" />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {lesson.source_pdf_name}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill, 
                    { width: `${calculateProgressPercentage(lesson)}%` }
                  ]} />
                </View>
                <Text style={styles.progressText}>{getProgressStatusText(lesson)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  mainCreateButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  lessonsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  lessonsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lessonsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  addLessonButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addLessonButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lessonIconContainer: {
    marginRight: 12,
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  lessonInfo: {
    flex: 1,
    marginRight: 48, // Space for delete button
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 24,
  },
  lessonDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  lessonDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  detailSeparator: {
    width: 1,
    height: 16,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginLeft: 4,
    flex: 1,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
  },
});
