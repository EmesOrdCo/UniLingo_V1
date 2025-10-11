import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SubjectDataService, SubjectData } from '../lib/subjectDataService';

interface SubjectBoxProps {
  subject: SubjectData;
  onPress: (subject: SubjectData) => void;
  isExpanded?: boolean;
}

const SubjectBox: React.FC<SubjectBoxProps> = ({ subject, onPress, isExpanded = false }) => {
  const getSubjectIcon = (subjectName: string) => {
    const name = subjectName.toLowerCase();
    if (name.includes('medicine') || name.includes('medical')) return 'medical';
    if (name.includes('engineering')) return 'construct';
    if (name.includes('physics')) return 'flash';
    if (name.includes('biology')) return 'leaf';
    if (name.includes('chemistry')) return 'flask';
    if (name.includes('math')) return 'calculator';
    if (name.includes('computer') || name.includes('software')) return 'laptop';
    if (name.includes('psychology')) return 'brain';
    if (name.includes('economics') || name.includes('business')) return 'trending-up';
    if (name.includes('law') || name.includes('legal')) return 'scale';
    return 'book';
  };

  const getSubjectColor = (subjectName: string) => {
    const name = subjectName.toLowerCase();
    if (name.includes('medicine')) return '#ef4444';
    if (name.includes('engineering')) return '#3b82f6';
    if (name.includes('physics')) return '#8b5cf6';
    if (name.includes('biology')) return '#10b981';
    if (name.includes('chemistry')) return '#f59e0b';
    if (name.includes('math')) return '#6366f1';
    if (name.includes('computer')) return '#06b6d4';
    if (name.includes('psychology')) return '#ec4899';
    if (name.includes('economics')) return '#84cc16';
    if (name.includes('law')) return '#64748b';
    return '#6b7280';
  };

  const iconName = getSubjectIcon(subject.name);
  const color = getSubjectColor(subject.name);

  return (
    <TouchableOpacity 
      style={[styles.subjectBox, { borderLeftColor: color }]}
      onPress={() => onPress(subject)}
      activeOpacity={0.7}
    >
      <View style={styles.subjectHeader}>
        <View style={styles.subjectIconContainer}>
          <Ionicons name={iconName as any} size={24} color={color} />
        </View>
        <View style={styles.subjectInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.subjectTitle}>{String(subject.name || 'Unknown Subject')}</Text>
            {(() => {
              const cefrLevel = subject.cefrLevel;
              if (cefrLevel && String(cefrLevel).trim().length > 0) {
                return (
                  <View style={styles.cefrBadge}>
                    <Text style={styles.cefrBadgeText}>{String(cefrLevel)}</Text>
                  </View>
                );
              }
              return null;
            })()}
          </View>
          <Text style={styles.subjectSubtitle}>
            {String(subject.wordCount || 0)} words • {subject.hasLessons ? 'Has lessons' : 'Vocabulary only'}
          </Text>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#9ca3af" 
        />
      </View>
      
      {(() => {
        const wordCount = Number(subject.wordCount) || 0;
        if (wordCount > 0) {
          return (
            <View style={styles.subjectStats}>
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={16} color="#6b7280" />
                <Text style={styles.statText}>{String(wordCount)} words</Text>
              </View>
              {subject.hasLessons && (
                <View style={styles.statItem}>
                  <Ionicons name="play-circle-outline" size={16} color="#6b7280" />
                  <Text style={styles.statText}>Lessons available</Text>
                </View>
              )}
            </View>
          );
        }
        return null;
      })()}
    </TouchableOpacity>
  );
};

interface SubjectBoxesProps {
  onSubjectSelect?: (subject: SubjectData) => void;
  maxSubjects?: number;
  onCefrLevelChange?: (level: string) => void;
}

export default function SubjectBoxes({ onSubjectSelect, maxSubjects = 6, onCefrLevelChange }: SubjectBoxesProps) {
  const navigation = useNavigation();
  const [allSubjects, setAllSubjects] = useState<SubjectData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCefrLevel, setSelectedCefrLevel] = useState<string>('A1');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  const LESSONS = [
    { id: 'Words', title: 'Words', icon: 'book', color: '#6466E9' },
    { id: 'Listen', title: 'Listen', icon: 'headset', color: '#6466E9' },
    { id: 'Speak', title: 'Speak', icon: 'mic', color: '#6466E9' },
    { id: 'Write', title: 'Write', icon: 'create', color: '#6466E9' },
    { id: 'Roleplay', title: 'Roleplay', icon: 'people', color: '#6466E9' },
  ];

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    filterSubjectsByLevel();
  }, [selectedCefrLevel, allSubjects]);

  useEffect(() => {
    // Notify parent component when CEFR level changes
    if (onCefrLevelChange) {
      onCefrLevelChange(selectedCefrLevel);
    }
  }, [selectedCefrLevel]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const subjectsWithMetadata = await SubjectDataService.getSubjectsWithAccurateCounts();
      
      console.log('🔍 Raw subjects data:', subjectsWithMetadata.slice(0, 3));
      
      // Filter out empty subjects and sort by word count
      const filteredSubjects = subjectsWithMetadata
        .filter(subject => {
          // Comprehensive safety check
          if (!subject || typeof subject !== 'object') {
            console.warn('⚠️ Skipping invalid subject object:', subject);
            return false;
          }
          if (!subject.name || typeof subject.name !== 'string' || subject.name.trim().length === 0) {
            console.warn('⚠️ Skipping subject with invalid name:', subject);
            return false;
          }
          return true;
        });
      
      setAllSubjects(filteredSubjects);
      console.log(`✅ Loaded ${filteredSubjects.length} subjects for subject boxes`);
    } catch (error) {
      console.error('❌ Error loading subjects for subject boxes:', error);
      // Fallback to some basic subjects
      const fallbackSubjects = [
        { name: 'Medicine', wordCount: 0, hasLessons: false },
        { name: 'Engineering', wordCount: 0, hasLessons: false },
        { name: 'Physics', wordCount: 0, hasLessons: false },
        { name: 'Biology', wordCount: 0, hasLessons: false },
        { name: 'Chemistry', wordCount: 0, hasLessons: false },
        { name: 'Mathematics', wordCount: 0, hasLessons: false },
      ];
      setAllSubjects(fallbackSubjects);
      setSubjects(fallbackSubjects);
    } finally {
      setLoading(false);
    }
  };

  const filterSubjectsByLevel = () => {
    // Filter by CEFR level and show all matching subjects (no limit)
    const filtered = allSubjects
      .filter(subject => {
        // Safety check for subject existence and required fields
        if (!subject || !subject.name) {
          console.warn('⚠️ Skipping invalid subject:', subject);
          return false;
        }
        return subject.cefrLevel === selectedCefrLevel;
      })
      .sort((a, b) => (Number(b.wordCount) || 0) - (Number(a.wordCount) || 0));
    setSubjects(filtered);
    console.log(`🔍 Filtered to ${filtered.length} subjects at ${selectedCefrLevel} level`);
  };

  const handleSubjectPress = (subject: SubjectData) => {
    console.log('📚 Subject pressed:', subject.name);
    
    if (onSubjectSelect) {
      onSubjectSelect(subject);
    } else {
      // Toggle expansion (like original system)
      setExpandedSubject(expandedSubject === subject.name ? null : subject.name);
    }
  };

  const handleLessonPress = (subject: SubjectData, lessonTitle: string) => {
    console.log(`🎯 Selected ${lessonTitle} for ${subject.name}`);
    
    // Navigate to the appropriate Unit screen based on lesson type
    const navigationParams = {
      unitId: 1,
      unitTitle: subject.name,
      subjectName: subject.name, // Pass subject name for database lookup
      cefrLevel: subject.cefrLevel || 'A1', // Pass CEFR level for lesson scripts
      topicGroup: 'General',
      unitCode: 'A1.1',
    };

    switch (lessonTitle) {
      case 'Words':
        (navigation as any).navigate('UnitWords', navigationParams);
        break;
      case 'Listen':
        (navigation as any).navigate('UnitListen', navigationParams);
        break;
      case 'Speak':
        (navigation as any).navigate('UnitSpeak', navigationParams);
        break;
      case 'Write':
        (navigation as any).navigate('UnitWrite', navigationParams);
        break;
      case 'Roleplay':
        (navigation as any).navigate('UnitRoleplay', navigationParams);
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading subjects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Available Subjects</Text>
          <Text style={styles.headerSubtitle}>Choose a subject to start learning</Text>
        </View>
        
        {/* CEFR Level Dropdown */}
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setDropdownVisible(!dropdownVisible)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownButtonText}>{selectedCefrLevel}</Text>
          <Ionicons 
            name={dropdownVisible ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#6366f1" 
          />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {dropdownVisible ? (
        <View style={styles.dropdownMenu}>
          <ScrollView style={styles.dropdownScroll}>
            {CEFR_LEVELS.filter(level => level && String(level).trim()).map((level) => (
              <TouchableOpacity
                key={String(level)}
                style={[
                  styles.dropdownItem,
                  selectedCefrLevel === level ? styles.dropdownItemSelected : null
                ]}
                onPress={() => {
                  setSelectedCefrLevel(String(level));
                  setDropdownVisible(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedCefrLevel === level ? styles.dropdownItemTextSelected : null
                ]}>
                  Level {String(level)}
                </Text>
                {selectedCefrLevel === level ? (
                  <Ionicons name="checkmark" size={20} color="#6366f1" />
                ) : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      
      <View style={styles.subjectsGrid}>
        {subjects.filter(subject => subject && subject.name).map((subject, index) => (
          <View key={`${String(subject.name)}-${index}`} style={styles.subjectContainer}>
            <SubjectBox
              subject={subject}
              onPress={handleSubjectPress}
              isExpanded={expandedSubject === subject.name}
            />
            
            {/* Expanded Lessons (like original system) */}
            {expandedSubject === subject.name && (
              <View style={styles.lessonsContainer}>
                {LESSONS.map((lesson) => (
                  <TouchableOpacity
                    key={lesson.id}
                    style={styles.lessonCard}
                    onPress={() => handleLessonPress(subject, lesson.title)}
                  >
                    <View style={styles.lessonContent}>
                      <Ionicons name={lesson.icon as any} size={20} color={lesson.color} />
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    </View>
                    <View style={styles.lessonActions}>
                      <TouchableOpacity 
                        style={styles.startButton}
                        onPress={() => handleLessonPress(subject, lesson.title)}
                      >
                        <Ionicons name="play" size={16} color="#ffffff" />
                        <Text style={styles.startButtonText}>Start</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
      
      {subjects.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateText}>
            No subjects at {String(selectedCefrLevel)} level
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Try selecting a different CEFR level
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 100,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 8,
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 250,
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  subjectsGrid: {
    padding: 20,
  },
  subjectBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  cefrBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cefrBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subjectSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  subjectStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Original Expandable System Styles
  subjectContainer: {
    marginBottom: 12,
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
  lessonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
