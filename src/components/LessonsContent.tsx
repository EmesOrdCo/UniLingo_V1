import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Animated } from 'react-native';
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

  const handleLessonPress = (lesson: Lesson) => {
    // Navigate to lesson walkthrough
    (navigation as any).navigate('LessonWalkthrough', { 
      lessonId: lesson.id, 
      lessonTitle: lesson.title 
    });
  };

  const handleYourLessonsPress = () => {
    // Navigate to Your Lessons screen
    navigation.navigate('YourLessons' as never);
  };

  const handleActivityPress = (activityName: string) => {
    Alert.alert('Coming Soon', `${activityName} feature is coming soon!`);
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
      {/* Create Your First Lesson Card */}
      <View style={styles.createLessonCard}>
        <Text style={styles.createLessonTitle}>Create an AI Lesson</Text>
        <Text style={styles.createLessonDescription}>
          Upload PDF course notes to generate an interactive vocabulary lesson.
        </Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleCreateLesson}>
          <Ionicons name="cloud-upload-outline" size={24} color="#ffffff" />
          <Text style={styles.uploadButtonText}>Create Lesson</Text>
        </TouchableOpacity>
      </View>

      {/* Your Lessons Card */}
      <TouchableOpacity style={styles.yourLessonsCard} onPress={handleYourLessonsPress}>
        <View style={styles.yourLessonsLeft}>
          <View style={styles.yourLessonsIcon}>
            <Ionicons name="book-outline" size={20} color="#8b5cf6" />
          </View>
          <View style={styles.yourLessonsText}>
            <Text style={styles.yourLessonsTitle}>Your Lessons</Text>
            <Text style={styles.yourLessonsSubtitle}>
              {lessons.length === 0 ? 'No lessons yet.' : `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''} created`}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </TouchableOpacity>

      {/* Speak Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="chatbubble-outline" size={20} color="#8b5cf6" />
          <Text style={styles.sectionTitle}>Speak</Text>
          <View style={[styles.comingSoonIndicator, styles.speakBadge]}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.activityCard} 
          onPress={() => handleActivityPress('AI Conversation Partner')}
        >
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>AI Conversation Partner</Text>
            <Text style={styles.activityDescription}>Practise in your own words</Text>
          </View>
          <View style={styles.activityIcon}>
            <Ionicons name="sparkles" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Listen Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="headset-outline" size={20} color="#8b5cf6" />
          <Text style={styles.sectionTitle}>Listen</Text>
          <View style={[styles.comingSoonIndicator, styles.listenBadge]}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.activityCard} 
          onPress={() => handleActivityPress('Audio Recap')}
        >
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Audio Recap</Text>
            <Text style={styles.activityDescription}>Do guided audio lessons, hands free</Text>
          </View>
          <View style={[styles.activityIcon, { backgroundColor: '#6466E9' }]}>
            <Ionicons name="headset" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.activityCard} 
          onPress={() => handleActivityPress('Podcasts')}
        >
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Podcasts</Text>
            <Text style={styles.activityDescription}>Learn something new on the move</Text>
          </View>
          <View style={styles.activityIcon}>
            <Ionicons name="radio" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Write Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#8b5cf6" />
          <Text style={styles.sectionTitle}>Write</Text>
          <View style={[styles.comingSoonIndicator, styles.writeBadge]}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.activityCard} 
          onPress={() => handleActivityPress('Guided Text Message Conversations')}
        >
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Guided Text Message Conversations</Text>
            <Text style={styles.activityDescription}>Practice writing through guided text conversations</Text>
          </View>
          <View style={[styles.activityIcon, { backgroundColor: '#06b6d4' }]}>
            <Ionicons name="chatbubble" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: '#64748b',
  },
  createLessonCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  createLessonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  createLessonDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 22,
  },
  uploadButton: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  yourLessonsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  yourLessonsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  yourLessonsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  yourLessonsText: {
    flex: 1,
  },
  yourLessonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  yourLessonsSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  comingSoonIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  speakBadge: {
    backgroundColor: '#8b5cf6', // Matches Speak icon color
    shadowColor: '#8b5cf6',
  },
  listenBadge: {
    backgroundColor: '#6466E9', // Matches Listen activity icon color
    shadowColor: '#6466E9',
  },
  writeBadge: {
    backgroundColor: '#06b6d4', // Matches Write activity icon color
    shadowColor: '#06b6d4',
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 14,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  activityContent: {
    flex: 1,
    marginRight: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});