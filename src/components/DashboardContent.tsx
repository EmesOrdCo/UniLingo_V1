import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedUnit } from '../contexts/SelectedUnitContext';
import { useRefresh } from '../contexts/RefreshContext';
import { GeneralVocabService } from '../lib/generalVocabService';
import { UnitDataService, UnitData } from '../lib/unitDataService';
import SubjectBoxes from './SubjectBoxes';
import { SubjectData } from '../lib/subjectDataService';

interface DashboardContentProps {
  progressData: any;
  loadingProgress: boolean;
}

export default function DashboardContent({ progressData, loadingProgress }: DashboardContentProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const { selectedUnit, setSelectedUnit } = useSelectedUnit();
  const { refreshTrigger } = useRefresh();
  
  console.log('📊 DashboardContent - selectedUnit from context:', selectedUnit);
  
  // Load default unit for the course overview section
  useEffect(() => {
    if (!selectedUnit) {
      console.log('📊 Loading default unit for course overview');
      loadDefaultUnit();
    } else {
      console.log('📊 Using selectedUnit from context:', selectedUnit);
    }
  }, [selectedUnit]);

  const loadDefaultUnit = async () => {
    try {
      // Load default A1.1 unit for the course overview section only
      console.log('📊 Loading Unit 1 (A1.1) for course overview');
      const unitData = await UnitDataService.getUnitDataByCode('A1.1');
      
      let defaultUnit = null;
      
      if (unitData.topic_groups.length > 0) {
        defaultUnit = {
          unit_code: 'A1.1',
          unit_title: UnitDataService.getUnitTitle('A1.1'),
          topic_groups: unitData.topic_groups,
          total_words: unitData.total_words,
          total_lessons: 5,
          lessons_completed: 0,
          status: 'not_started' as const
        };
        console.log('✅ Created Unit 1 for course overview');
      } else {
        // Fallback: create a basic Unit 1 structure
        defaultUnit = {
          unit_code: 'A1.1',
          unit_title: 'Foundation',
          topic_groups: ['Basic Concepts'],
          total_words: 0,
          total_lessons: 5,
          lessons_completed: 0,
          status: 'not_started' as const
        };
        console.log('⚠️ Using fallback Unit 1 structure');
      }
      
      setSelectedUnit(defaultUnit);
    } catch (error) {
      console.error('Error loading Unit 1:', error);
    }
  };

  const handleLessonPress = async (unitCode: string, lessonTitle: string, topicGroup?: string) => {
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
      // Use the provided topic group or default to first topic group of selected unit
      const selectedTopicGroup = topicGroup || selectedUnit?.topic_groups[0] || 'Basic Concepts';

      // Navigate immediately - don't block on vocabulary check
      // The Unit screens will handle their own vocabulary loading with proper error handling
      switch (lessonTitle) {
        case 'Words':
          (navigation as any).navigate('UnitWords', {
            unitId: parseInt(unitCode.split('.')[1]),
            unitTitle: selectedUnit?.unit_title || unitCode,
            topicGroup: selectedTopicGroup,
            unitCode: unitCode
          });
          break;
          
        case 'Listen':
          (navigation as any).navigate('UnitListen', {
            unitId: parseInt(unitCode.split('.')[1]),
            unitTitle: selectedUnit?.unit_title || unitCode,
            topicGroup: selectedTopicGroup,
            unitCode: unitCode
          });
          break;
          
        case 'Write':
          (navigation as any).navigate('UnitWrite', {
            unitId: parseInt(unitCode.split('.')[1]),
            unitTitle: selectedUnit?.unit_title || unitCode,
            topicGroup: selectedTopicGroup,
            unitCode: unitCode
          });
          break;
          
        case 'Speak':
          (navigation as any).navigate('UnitSpeak', {
            unitId: parseInt(unitCode.split('.')[1]),
            unitTitle: selectedUnit?.unit_title || unitCode,
            topicGroup: selectedTopicGroup,
            unitCode: unitCode
          });
          break;
          
        case 'Roleplay':
          (navigation as any).navigate('UnitRoleplay', {
            unitId: parseInt(unitCode.split('.')[1]),
            unitTitle: selectedUnit?.unit_title || unitCode,
            topicGroup: selectedTopicGroup,
            unitCode: unitCode
          });
          break;
          
        default:
          Alert.alert('Error', 'Unknown lesson type. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error handling lesson press:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to start lesson: ${errorMessage}`);
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

  const getStatusButton = (status: string, unitId: string | number, lessonTitle: string, topicGroup?: string) => {
    if (status === 'active') {
      return (
        <TouchableOpacity 
          style={[styles.startButton, isNavigating && styles.startButtonDisabled]}
          disabled={isNavigating}
          onPress={() => handleLessonPress(unitId.toString(), lessonTitle, topicGroup)}
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

      {/* Course Overview Section and Course Units Section */}
      <>
        {/* Course Overview Section */}
          <View style={styles.courseOverview}>
            <Text style={styles.courseLevel}>{selectedUnit?.unit_code || 'A1.1'}</Text>
            <View style={styles.courseTitleRow}>
              <Text style={styles.courseTitle}>Saying Hello</Text>
            </View>
            <Text style={styles.courseDescription}>
              Learn essential greetings and polite expressions: hi, hello, good morning, good afternoon, good evening, goodbye, please.
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
              <Text style={styles.progressText}>2%</Text>
            </View>
          </View>

          {/* Subject Boxes Section */}
          <SubjectBoxes 
            maxSubjects={6}
          />
      </>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  courseOverview: {
    padding: 28,
    backgroundColor: '#f0f4ff',
    margin: 16,
    borderRadius: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  courseLevel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
    fontWeight: '700',
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    height: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressFill: {
    width: '2%',
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    marginLeft: 12,
    backgroundColor: '#f8fafc',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
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
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
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
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unitProgressFill: {
    width: '0%',
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  unitSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  lessonCard: {
    backgroundColor: '#f8fafc',
    padding: 18,
    marginBottom: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  lessonCardDisabled: {
    backgroundColor: '#e5e7eb',
    opacity: 0.6,
  },
  lessonContent: {
    flex: 1,
    justifyContent: 'center',
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
    justifyContent: 'flex-end',
    gap: 12,
  },
  startButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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