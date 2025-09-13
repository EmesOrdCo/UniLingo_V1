import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DailyChallengeSection from './DailyChallengeSection';
import { useAuth } from '../contexts/AuthContext';
import { GeneralVocabService } from '../lib/generalVocabService';

interface DashboardContentProps {
  progressData: any;
  loadingProgress: boolean;
}

export default function DashboardContent({ progressData, loadingProgress }: DashboardContentProps) {
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  
  const units = [
    { 
      id: 1, 
      title: 'Basic Actions',
      lessons: [
        { id: 1, title: 'Words', status: 'active' },
        { id: 2, title: 'Listen', status: 'active' },
        { id: 3, title: 'Write', status: 'active' },
        { id: 4, title: 'Speak', status: 'locked' },
        { id: 5, title: 'Roleplay', status: 'locked' },
      ]
    },
    { 
      id: 2, 
      title: 'add unit name here',
      lessons: [
        { id: 1, title: 'Words', status: 'locked' },
        { id: 2, title: 'Listen', status: 'locked' },
        { id: 3, title: 'Write', status: 'locked' },
        { id: 4, title: 'Speak', status: 'locked' },
        { id: 5, title: 'Roleplay', status: 'locked' },
      ]
    },
    { 
      id: 3, 
      title: 'add unit name here',
      lessons: [
        { id: 1, title: 'Words', status: 'locked' },
        { id: 2, title: 'Listen', status: 'locked' },
        { id: 3, title: 'Write', status: 'locked' },
        { id: 4, title: 'Speak', status: 'locked' },
        { id: 5, title: 'Roleplay', status: 'locked' },
      ]
    },
    { 
      id: 4, 
      title: 'add unit name here',
      lessons: [
        { id: 1, title: 'Words', status: 'locked' },
        { id: 2, title: 'Listen', status: 'locked' },
        { id: 3, title: 'Write', status: 'locked' },
        { id: 4, title: 'Speak', status: 'locked' },
        { id: 5, title: 'Roleplay', status: 'locked' },
      ]
    },
    { 
      id: 5, 
      title: 'add unit name here',
      lessons: [
        { id: 1, title: 'Words', status: 'locked' },
        { id: 2, title: 'Listen', status: 'locked' },
        { id: 3, title: 'Write', status: 'locked' },
        { id: 4, title: 'Speak', status: 'locked' },
        { id: 5, title: 'Roleplay', status: 'locked' },
      ]
    },
    { 
      id: 6, 
      title: 'add unit name here',
      lessons: [
        { id: 1, title: 'Words', status: 'locked' },
        { id: 2, title: 'Listen', status: 'locked' },
        { id: 3, title: 'Write', status: 'locked' },
        { id: 4, title: 'Speak', status: 'locked' },
        { id: 5, title: 'Roleplay', status: 'locked' },
      ]
    },
    { 
      id: 7, 
      title: 'add unit name here',
      lessons: [
        { id: 1, title: 'Words', status: 'locked' },
        { id: 2, title: 'Listen', status: 'locked' },
        { id: 3, title: 'Write', status: 'locked' },
        { id: 4, title: 'Speak', status: 'locked' },
        { id: 5, title: 'Roleplay', status: 'locked' },
      ]
    },
    { 
      id: 8, 
      title: 'add unit name here',
      lessons: [
        { id: 1, title: 'Words', status: 'locked' },
        { id: 2, title: 'Listen', status: 'locked' },
        { id: 3, title: 'Write', status: 'locked' },
        { id: 4, title: 'Speak', status: 'locked' },
        { id: 5, title: 'Roleplay', status: 'locked' },
      ]
    },
    { 
      id: 9, 
      title: 'add unit name here',
      lessons: [
        { id: 1, title: 'Words', status: 'locked' },
        { id: 2, title: 'Listen', status: 'locked' },
        { id: 3, title: 'Write', status: 'locked' },
        { id: 4, title: 'Speak', status: 'locked' },
        { id: 5, title: 'Roleplay', status: 'locked' },
      ]
    },
    { 
      id: 10, 
      title: 'add unit name here',
      lessons: [
        { id: 1, title: 'Words', status: 'locked' },
        { id: 2, title: 'Listen', status: 'locked' },
        { id: 3, title: 'Write', status: 'locked' },
        { id: 4, title: 'Speak', status: 'locked' },
        { id: 5, title: 'Roleplay', status: 'locked' },
      ]
    },
  ];

  const handleUnitPress = (unitId: number) => {
    setExpandedUnit(expandedUnit === unitId ? null : unitId);
  };

  const handleLessonPress = async (unitId: number, lessonTitle: string) => {
    // Prevent multiple rapid taps
    if (isNavigating) {
      Alert.alert('Please wait', 'Lesson is already loading...');
      return;
    }

    if (!user || !profile?.native_language) {
      Alert.alert('Error', 'Please complete your profile setup first.');
      return;
    }

    setIsNavigating(true);

    try {
      // Navigate immediately - don't block on vocabulary check
      // The Unit screens will handle their own vocabulary loading with proper error handling
      switch (lessonTitle) {
        case 'Words':
          navigation.navigate('UnitWords' as never, {
            unitId: unitId,
            unitTitle: unitId === 1 ? 'Basic Concepts' : `Unit ${unitId}`,
            topicGroup: unitId === 1 ? 'Basic Concepts' : 'general'
          });
          break;
          
        case 'Listen':
          navigation.navigate('UnitListen' as never, {
            unitId: unitId,
            unitTitle: unitId === 1 ? 'Basic Concepts' : `Unit ${unitId}`,
            topicGroup: unitId === 1 ? 'Basic Concepts' : 'general'
          });
          break;
          
        case 'Write':
          navigation.navigate('UnitWrite' as never, {
            unitId: unitId,
            unitTitle: unitId === 1 ? 'Basic Concepts' : `Unit ${unitId}`,
            topicGroup: unitId === 1 ? 'Basic Concepts' : 'general'
          });
          break;
          
        case 'Speak':
        case 'Roleplay':
          Alert.alert('Coming Soon', `${lessonTitle} functionality will be available soon!`);
          break;
          
        default:
          Alert.alert('Error', 'Unknown lesson type. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error handling lesson press:', error);
      Alert.alert('Error', `Failed to start lesson: ${error.message || 'Unknown error'}`);
    } finally {
      // Reset navigation state after a longer delay to ensure screen has loaded
      setTimeout(() => {
        setIsNavigating(false);
      }, 2000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color="#6b7280" />;
      case 'active':
        return null; // Will show Start button instead
      case 'locked':
        return <Ionicons name="lock-closed" size={24} color="#6b7280" />;
      default:
        return null;
    }
  };

  const getLessonIcon = (title: string) => {
    switch (title) {
      case 'Words':
        return <Ionicons name="book" size={20} color="#6466E9" />;
      case 'Listen':
        return <Ionicons name="headset" size={20} color="#6466E9" />;
      case 'Write':
        return <Ionicons name="create" size={20} color="#6466E9" />;
      case 'Speak':
        return <Ionicons name="mic" size={20} color="#6466E9" />;
      case 'Roleplay':
        return <Ionicons name="people" size={20} color="#6466E9" />;
      default:
        return <Ionicons name="book" size={20} color="#6466E9" />;
    }
  };

  const getStatusButton = (status: string, unitId: number, lessonTitle: string) => {
    if (status === 'active') {
      return (
        <TouchableOpacity 
          style={[styles.startButton, isNavigating && styles.startButtonDisabled]}
          disabled={isNavigating}
          onPress={() => handleLessonPress(unitId, lessonTitle)}
        >
          <Ionicons 
            name={isNavigating ? "hourglass" : "play"} 
            size={16} 
            color="#ffffff" 
          />
          <Text style={styles.startButtonText}>
            {isNavigating ? 'Loading...' : 'Start'}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Loading Overlay */}
      {isNavigating && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass" size={24} color="#6466E9" />
            <Text style={styles.loadingText}>Loading lesson...</Text>
          </View>
        </View>
      )}

      {/* Daily Challenge */}
      <View style={styles.dailyChallengeContainer}>
        <DailyChallengeSection onPlay={(gameType) => {
          // Navigate to games screen when a daily challenge is played
          console.log('Daily challenge played:', gameType);
        }} />
      </View>

      {/* Course Overview Section */}
      <View style={styles.courseOverview}>
        <Text style={styles.courseLevel}>A1.1</Text>
        <View style={styles.courseTitleRow}>
          <Text style={styles.courseTitle}>Beginner I (A1.1)</Text>
          <TouchableOpacity 
            style={styles.changeButton}
            onPress={() => navigation.navigate('Courses' as never)}
          >
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.courseDescription}>
          Learn how to introduce yourself and answer simple questions about your basic needs.
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>2%</Text>
        </View>
      </View>

      {/* Course Units Section */}
      <View style={styles.unitsSection}>
        {units.map((unit) => (
          <View key={unit.id} style={styles.unitContainer}>
            <TouchableOpacity 
              style={[
                styles.unitCard,
                expandedUnit === unit.id && styles.unitCardExpanded
              ]}
              onPress={() => handleUnitPress(unit.id)}
            >
              <View style={styles.unitHeader}>
                <Text style={styles.unitNumber}>Unit {unit.id}</Text>
                <View style={styles.unitProgressBar}>
                  <View style={[styles.unitProgressFill, { width: unit.id === 1 ? '25%' : '0%' }]} />
                </View>
              </View>
              
              <Text style={styles.unitTitle}>{unit.title}</Text>
              
              <View style={styles.unitFooter}>
                <Ionicons name="download-outline" size={20} color="#6b7280" />
                <Ionicons 
                  name={expandedUnit === unit.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </View>
            </TouchableOpacity>

            {/* Expanded Lessons */}
            {expandedUnit === unit.id && unit.lessons.length > 0 && (
              <View style={styles.lessonsContainer}>
                {unit.lessons.map((lesson) => (
                  <TouchableOpacity 
                    key={lesson.id} 
                    style={[
                      styles.lessonCard,
                      isNavigating && styles.lessonCardDisabled
                    ]}
                    onPress={() => handleLessonPress(unit.id, lesson.title)}
                    activeOpacity={0.7}
                    disabled={isNavigating}
                  >
                    <View style={styles.lessonContent}>
                      <View style={styles.lessonTitleRow}>
                        {getLessonIcon(lesson.title)}
                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      </View>
                      
                      {lesson.status === 'active' && lesson.image && (
                        <View style={styles.lessonImageContainer}>
                          <Image 
                            source={{ uri: lesson.image }} 
                            style={styles.lessonImage}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.lessonActions}>
                      {getStatusButton(lesson.status, unit.id, lesson.title)}
                      {getStatusIcon(lesson.status)}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Unlock Courses Button */}
      <TouchableOpacity style={styles.unlockButton}>
        <Ionicons name="lock-closed" size={20} color="#ffffff" />
        <Text style={styles.unlockButtonText}>Unlock all Spanish courses</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  dailyChallengeContainer: {
    paddingHorizontal: 20,
  },
  courseOverview: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  courseLevel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  courseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  courseDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    width: '2%',
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 6,
    marginLeft: 12,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  unitsSection: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  unitContainer: {
    marginBottom: 12,
  },
  unitCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unitCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 12,
  },
  unitProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  unitProgressFill: {
    width: '0%',
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 2,
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  unitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonsContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  lessonCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonCardDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.6,
  },
  lessonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  lessonImageContainer: {
    marginLeft: 12,
  },
  lessonImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#6466E9',
  },
  lessonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  startButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  unlockButton: {
    margin: 20,
    backgroundColor: '#6466E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});