import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { LessonService, Lesson } from '../lib/lessonService';

export default function LessonsContent() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  
  const navigation = useNavigation();
  const { user } = useAuth();

  // Fetch user's lessons on component mount
  useEffect(() => {
    fetchUserLessons();
  }, []);

  const fetchUserLessons = async () => {
    if (!user) {
      setLoadingLessons(false);
      return;
    }

    try {
      setLoadingLessons(true);
      const userLessons = await LessonService.getUserLessons(user.id);
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
    navigation.navigate('LessonWalkthrough' as never, {
      lessonId: lesson.id,
      lessonTitle: lesson.title
    } as never);
  };

  const handleRefresh = () => {
    fetchUserLessons();
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Lessons</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

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
            <Text style={styles.lessonsTitle}>Your Lessons ({lessons.length})</Text>
            <TouchableOpacity 
              style={styles.addLessonButton}
              onPress={handleCreateLesson}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.addLessonButtonText}>New Lesson</Text>
            </TouchableOpacity>
          </View>

          {lessons.map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={styles.lessonCard}
              onPress={() => handleLessonPress(lesson)}
            >
              {/* Lesson Header */}
              <View style={styles.lessonHeader}>
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle} numberOfLines={2}>
                    {lesson.title}
                  </Text>
                  <Text style={styles.lessonSubject}>{lesson.subject}</Text>
                  <Text style={styles.lessonDate}>
                    Created {new Date(lesson.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.lessonStatus}>
                  <View style={[
                    styles.statusBadge,
                    lesson.status === 'ready' ? styles.statusReady : styles.statusDraft
                  ]}>
                    <Text style={styles.statusText}>
                      {lesson.status === 'ready' ? 'Ready' : 'Draft'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Lesson Details */}
              <View style={styles.lessonDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{lesson.estimated_duration} min</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="school-outline" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{lesson.difficulty_level}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="document-outline" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{lesson.source_pdf_name}</Text>
                </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  refreshButton: {
    padding: 8,
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
  lessonIconContainer: {
    alignItems: 'center',
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
    padding: 20,
  },
  lessonsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lessonInfo: {
    flex: 1,
    marginRight: 16,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  lessonSubject: {
    fontSize: 14,
    color: '#64748b',
  },
  lessonDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  lessonStatus: {
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusReady: {
    backgroundColor: '#dcfce7',
  },
  statusDraft: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  lessonDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
  },
});
