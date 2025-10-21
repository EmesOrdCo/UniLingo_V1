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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SubjectDataService, SubjectData } from '../lib/subjectDataService';
import { GeneralLessonProgressService, GeneralLessonProgress } from '../lib/generalLessonProgressService';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation, useI18n } from '../lib/i18n';

interface SubjectBoxProps {
  subject: SubjectData;
  onPress: (subject: SubjectData) => void;
  isExpanded?: boolean;
  progress?: GeneralLessonProgress | null;
}

const SubjectBox: React.FC<SubjectBoxProps> = ({ subject, onPress, isExpanded = false, progress }) => {
  const { t } = useTranslation();
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
  const originalColor = getSubjectColor(subject.name);
  
  // Determine if all 5 exercises are completed
  const isCompleted = progress?.status === 'completed' && progress.exercises_completed >= 5;
  
  // Always use purple for border, green icon if completed, gray if not
  const color = '#6366f1'; // Always purple border
  const iconColor = isCompleted ? '#10b981' : '#9ca3af';

  return (
    <TouchableOpacity 
      style={[
        styles.subjectBox, 
        { borderLeftColor: color },
        isExpanded && styles.subjectBoxExpanded
      ]}
      onPress={() => onPress(subject)}
      activeOpacity={0.7}
    >
      <View style={styles.subjectContent}>
        <View style={styles.subjectMainInfo}>
          <Text style={styles.unitNumber}>{t('subjectBoxes.unitNumber')}</Text>
          <Text style={styles.subjectTitle}>{String(subject.name || 'Unknown Subject')}</Text>
          <View style={styles.subjectMetaRow}>
            <Text style={styles.subjectMeta}>
              {String(subject.cefrLevel || 'A1.1')} • {t('subjectBoxes.topicGroup')}
            </Text>
            <TouchableOpacity style={styles.downloadIcon}>
              <Ionicons name="download-outline" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.expandIcon}>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#9ca3af" 
          />
        </View>
      </View>
      
      {(() => {
        const cefrLevel = subject.cefrLevel;
        if (cefrLevel && String(cefrLevel).trim().length > 0) {
          return null; // CEFR badge now shown inline
        }
        return null;
      })()}
    </TouchableOpacity>
  );
};

interface SubjectBoxesProps {
  onSubjectSelect?: (subject: SubjectData) => void;
  maxSubjects?: number;
  selectedCefrLevel?: string;
  onCefrLevelChange?: (level: string) => void;
}

export default function SubjectBoxes({ onSubjectSelect, maxSubjects = 6, selectedCefrLevel = 'A1', onCefrLevelChange }: SubjectBoxesProps) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [allSubjects, setAllSubjects] = useState<SubjectData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [subjectProgress, setSubjectProgress] = useState<Map<string, GeneralLessonProgress>>(new Map());
  const { t } = useTranslation();
  const { currentLanguage } = useI18n();
  
  const LESSONS = [
    { id: 'Words', title: t('subjectBoxes.lessonTypes.words'), icon: 'book', color: '#6466E9' },
    { id: 'Listen', title: t('subjectBoxes.lessonTypes.listen'), icon: 'headset', color: '#6466E9' },
    { id: 'Speak', title: t('subjectBoxes.lessonTypes.speak'), icon: 'mic', color: '#6466E9' },
    { id: 'Write', title: t('subjectBoxes.lessonTypes.write'), icon: 'create', color: '#6466E9' },
    { id: 'Roleplay', title: t('subjectBoxes.lessonTypes.roleplay'), icon: 'people', color: '#6466E9' },
  ];

  useEffect(() => {
    // Load subjects whenever CEFR level or language changes
    loadSubjects();
  }, [selectedCefrLevel, currentLanguage]);

  // Load progress data when component focuses
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadProgress();
      }
    }, [user, selectedCefrLevel])
  );

  const loadProgress = async () => {
    if (!user) return;

    try {
      const progressList = await GeneralLessonProgressService.getSubjectProgressByCefrLevel(
        user.id,
        selectedCefrLevel
      );
      
      // Create a map for quick lookup
      const progressMap = new Map<string, GeneralLessonProgress>();
      progressList.forEach(p => {
        const key = `${p.subject_name}|${p.cefr_level}`;
        progressMap.set(key, p);
      });
      
      setSubjectProgress(progressMap);
    } catch (error) {
      console.error('Error loading subject progress:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      
      // OPTIMIZATION: Only load the currently selected CEFR level for fast initial display
      console.log(`🚀 Fast loading: Fetching only ${selectedCefrLevel} subjects in ${currentLanguage}...`);
      const subjectsWithMetadata = await SubjectDataService.getSubjectsForCefrLevel(selectedCefrLevel, currentLanguage);
      
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
      console.log(`✅ Loaded ${filteredSubjects.length} subjects for ${selectedCefrLevel}`);
    } catch (error) {
      console.error('❌ Error loading subjects for subject boxes:', error);
      // Fallback to some basic subjects
      const fallbackSubjects = [
        { name: t('subjects.medicine'), wordCount: 0, hasLessons: false, cefrLevel: selectedCefrLevel },
        { name: t('subjects.engineering'), wordCount: 0, hasLessons: false, cefrLevel: selectedCefrLevel },
        { name: t('subjects.physics'), wordCount: 0, hasLessons: false, cefrLevel: selectedCefrLevel },
        { name: t('subjects.biology'), wordCount: 0, hasLessons: false, cefrLevel: selectedCefrLevel },
        { name: t('subjects.chemistry'), wordCount: 0, hasLessons: false, cefrLevel: selectedCefrLevel },
        { name: t('subjects.mathematics'), wordCount: 0, hasLessons: false, cefrLevel: selectedCefrLevel },
      ];
      setAllSubjects(fallbackSubjects);
      setSubjects(fallbackSubjects);
    } finally {
      setLoading(false);
    }
  };

  // Automatically set subjects when allSubjects changes (no filtering needed since we load by CEFR level)
  useEffect(() => {
    setSubjects(allSubjects);
  }, [allSubjects]);

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
    // Use English name for database operations, but display translated name
    const navigationParams = {
      unitId: 1,
      unitTitle: subject.name, // Display name (translated)
      subjectName: subject.englishName || subject.name, // Use English name for database lookup
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
        <Text style={styles.loadingText}>{t('subjectBoxes.loadingSubjects')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.subjectsGrid}>
        {subjects.filter(subject => subject && subject.name).map((subject, index) => {
          const progressKey = `${subject.name}|${subject.cefrLevel}`;
          const progress = subjectProgress.get(progressKey);
          
          return (
            <View key={`${String(subject.name)}-${index}`} style={styles.subjectContainer}>
              <SubjectBox
                subject={subject}
                onPress={handleSubjectPress}
                isExpanded={expandedSubject === subject.name}
                progress={progress}
              />
            
            {/* Expanded Lessons (like original system) */}
            {expandedSubject === subject.name && (
              <View style={styles.lessonsContainer}>
                {LESSONS.map((lesson, index) => (
                  <TouchableOpacity
                    key={lesson.id}
                    style={[
                      styles.lessonCard,
                      index === LESSONS.length - 1 && { marginBottom: 0 }
                    ]}
                    onPress={() => handleLessonPress(subject, lesson.id)}
                  >
                    <View style={styles.lessonContent}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    </View>
                    <View style={styles.lessonActions}>
                      <TouchableOpacity 
                        style={styles.startButton}
                        onPress={() => handleLessonPress(subject, lesson.id)}
                      >
                        <Ionicons name="play" size={18} color="#ffffff" />
                        <Text style={styles.startButtonText}>{t('subjectBoxes.buttons.start')}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
        })}
      </View>
      
      {subjects.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateText}>
            {t('subjectBoxes.emptyState.noSubjects')} {String(selectedCefrLevel)} {t('subjectBoxes.emptyState.level')}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            {t('subjectBoxes.emptyState.tryDifferentLevel')}
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
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectBoxExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  subjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectMainInfo: {
    flex: 1,
  },
  unitNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 4,
  },
  subjectMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectMeta: {
    fontSize: 14,
    color: '#9ca3af',
  },
  downloadIcon: {
    padding: 2,
  },
  expandIcon: {
    marginLeft: 12,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
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
    marginBottom: 16,
  },
  lessonsContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lessonCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  lessonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#000000',
  },
  lessonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  startButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  completedBadge: {
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
