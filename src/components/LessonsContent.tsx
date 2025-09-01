import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

export default function LessonsContent() {
  const [selectedSubject, setSelectedSubject] = useState('Medicine');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigation = useNavigation();
  const { user, profile } = useAuth();

  // Sample subjects - in a real app, these would come from the user's profile
  const subjects = ['Medicine', 'Engineering', 'Law', 'Business', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];

  const handleCreateLesson = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create lessons.');
      return;
    }
    
    // Navigate to CreateLesson screen
    navigation.navigate('CreateLesson' as never);
  };

  const handleLessonPress = (lesson: any) => {
    // Navigate to lesson viewer
    navigation.navigate('NewLessonViewer' as never, { lessonId: lesson.id } as never);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {lessons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Lessons Yet</Text>
          <Text style={styles.emptyText}>
            Upload a PDF to create your first lesson and start learning English terminology!
          </Text>
          
          {/* AI-Powered English Lessons Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI-Powered English Lessons</Text>
            <Text style={styles.cardDescription}>
              Upload your course notes and let AI create an interactive, Duolingo-style lesson that teaches English terminology from your subject. Perfect for non-native speakers learning subject-specific English vocabulary.
            </Text>
          </View>

          {/* Select Subject/Topic Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Subject/Topic</Text>
            <TouchableOpacity 
              style={styles.subjectSelector}
              onPress={() => setShowSubjectPicker(!showSubjectPicker)}
            >
              <View style={styles.subjectContent}>
                <Ionicons name="school" size={20} color="#6366f1" />
                <Text style={styles.subjectText}>{selectedSubject}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
            
            {showSubjectPicker && (
              <View style={styles.subjectOptions}>
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectOption,
                      selectedSubject === subject && styles.selectedSubjectOption
                    ]}
                    onPress={() => {
                      setSelectedSubject(subject);
                      setShowSubjectPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.subjectOptionText,
                      selectedSubject === subject && styles.selectedSubjectOptionText
                    ]}>
                      {subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Create Your Lesson Section */}
          <View style={styles.card}>
            <View style={styles.lessonIconContainer}>
              <Ionicons name="school" size={64} color="#6366f1" />
            </View>
            <Text style={styles.cardTitle}>Create Your Lesson</Text>
            <Text style={styles.cardDescription}>
              Upload PDF course notes to generate an interactive English lesson
            </Text>
            <TouchableOpacity 
              style={[
                styles.mainCreateButton,
                isProcessing && { opacity: 0.6 }
              ]} 
              onPress={handleCreateLesson}
              disabled={isProcessing}
            >
              <Ionicons name="document" size={20} color="#ffffff" />
              <Text style={styles.createButtonText}>
                {isProcessing ? 'Processing...' : 'Choose PDF File'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.lessonsContainer}>
          {lessons.map((lesson: any) => (
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
                </View>
                <View style={styles.lessonStatus}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
              </View>
              
              {/* Lesson Progress */}
              <View style={styles.lessonProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${lesson.progress || 0}%` }]} />
                </View>
                <Text style={styles.progressText}>{lesson.progress || 0}% Complete</Text>
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
  subjectSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  subjectOptions: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  subjectOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectedSubjectOption: {
    backgroundColor: '#f0f9ff',
  },
  subjectOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedSubjectOptionText: {
    color: '#0369a1',
    fontWeight: '500',
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
  lessonStatus: {
    marginTop: 2,
  },
  lessonProgress: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});
