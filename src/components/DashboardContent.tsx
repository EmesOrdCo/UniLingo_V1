import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedUnit } from '../contexts/SelectedUnitContext';
import { useRefresh } from '../contexts/RefreshContext';
import { GeneralVocabService } from '../lib/generalVocabService';
import { UnitDataService, UnitData } from '../lib/unitDataService';
import { supabase } from '../lib/supabase';
import SubjectBoxes from './SubjectBoxes';
import { SubjectData } from '../lib/subjectDataService';
import { CefrProgressService, CefrLevelProgress } from '../lib/cefrProgressService';
import { useTranslation } from '../lib/i18n';

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
  const [selectedCefrLevel, setSelectedCefrLevel] = useState<string>('A1');
  const [selectedSubLevel, setSelectedSubLevel] = useState<string | null>(null);
  const [cefrProgress, setCefrProgress] = useState<CefrLevelProgress | null>(null);
  const [loadingCefrProgress, setLoadingCefrProgress] = useState(false);
  const [availableSubLevels, setAvailableSubLevels] = useState<string[]>([]);
  const [cefrDropdownVisible, setCefrDropdownVisible] = useState(false);
  const { t } = useTranslation();

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
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

  // Load CEFR progress when component mounts or CEFR level changes
  useEffect(() => {
    if (user?.id) {
      loadCefrProgress(selectedCefrLevel);
      loadAvailableSubLevels();
    }
  }, [user?.id, selectedCefrLevel]);

  // Reload CEFR progress when refresh is triggered
  useEffect(() => {
    if (refreshTrigger && user?.id) {
      loadCefrProgress(selectedCefrLevel);
    }
  }, [refreshTrigger, user?.id, selectedCefrLevel]);

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
          unit_title: t('dashboard.fallback.foundation'),
          topic_groups: [t('dashboard.fallback.basicConcepts')],
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

  const loadAvailableSubLevels = async () => {
    try {
      // Get all available CEFR sub-levels from lesson_scripts table
      const { data, error } = await supabase
        .from('lesson_scripts')
        .select('cefr_sub_level')
        .not('cefr_sub_level', 'is', null);

      if (error) {
        console.error('Error loading available sub-levels:', error);
        return;
      }

      // Extract unique sub-levels and sort them properly
      const subLevels = [...new Set(data?.map(item => item.cefr_sub_level) || [])]
        .sort((a, b) => {
          // First sort by main level (A1, A2, B1, etc.)
          const aMain = a.split('.')[0];
          const bMain = b.split('.')[0];
          if (aMain !== bMain) {
            return aMain.localeCompare(bMain);
          }
          // Then sort by sub-level number (1, 2, ..., 10, 11, etc.)
          const aNum = parseInt(a.split('.')[1] || '0');
          const bNum = parseInt(b.split('.')[1] || '0');
          return aNum - bNum;
        });
      setAvailableSubLevels(subLevels);
      console.log('📊 Loaded available sub-levels (sorted):', subLevels);
    } catch (error) {
      console.error('Error loading available sub-levels:', error);
    }
  };

  const loadCefrProgress = async (cefrLevel: string) => {
    if (!user?.id) return;
    
    try {
      setLoadingCefrProgress(true);
      const progress = await CefrProgressService.getCefrLevelProgress(user.id, cefrLevel);
      console.log(`📊 CEFR Progress loaded for ${cefrLevel}:`, progress);
      
      // Ensure we always have a valid progress object
      if (progress) {
        setCefrProgress(progress);
      } else {
        // Set a default progress object if service returns null
        setCefrProgress({
          cefrLevel,
          completedUnits: 0,
          totalUnits: 5,
          progressPercentage: 0,
          status: 'not_started'
        });
      }
    } catch (error) {
      console.error('Error loading CEFR progress:', error);
      // Set fallback progress on error
      setCefrProgress({
        cefrLevel,
        completedUnits: 0,
        totalUnits: 5,
        progressPercentage: 0,
        status: 'not_started'
      });
    } finally {
      setLoadingCefrProgress(false);
    }
  };

  const handleLessonPress = async (unitCode: string, lessonTitle: string, topicGroup?: string) => {
    // Prevent multiple rapid taps
    if (isNavigating) {
      Alert.alert(t('dashboard.alerts.pleaseWait'), t('dashboard.alerts.lessonLoading'));
      return;
    }

    if (!user || !profile?.native_language) {
      Alert.alert(t('dashboard.alerts.error'), t('dashboard.alerts.completeProfile'));
      return;
    }

    setIsNavigating(true);

    try {
      // Use the provided topic group or default to first topic group of selected unit
      const selectedTopicGroup = topicGroup || selectedUnit?.topic_groups[0] || t('dashboard.fallback.basicConcepts');

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
          Alert.alert(t('dashboard.alerts.error'), t('dashboard.alerts.unknownLessonType'));
      }
    } catch (error) {
      console.error('❌ Error handling lesson press:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(t('dashboard.alerts.error'), `${t('dashboard.alerts.failedToStartLesson')} ${errorMessage}`);
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
            {isNavigating ? t('dashboard.buttons.loading') : t('dashboard.buttons.start')}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const getCefrLevelTitle = (level: string): string => {
    const titles: { [key: string]: string } = {
      'A1': t('dashboard.cefrLevels.A1'),
      'A2': t('dashboard.cefrLevels.A2'),
      'B1': t('dashboard.cefrLevels.B1'),
      'B2': t('dashboard.cefrLevels.B2'),
      'C1': t('dashboard.cefrLevels.C1'),
      'C2': t('dashboard.cefrLevels.C2'),
    };
    return titles[level] || t('dashboard.cefrLevels.default');
  };

  const getCefrLevelDescription = (level: string): string => {
    const descriptions: { [key: string]: string } = {
      'A1': t('dashboard.descriptions.A1'),
      'A2': t('dashboard.descriptions.A2'),
      'B1': t('dashboard.descriptions.B1'),
      'B2': t('dashboard.descriptions.B2'),
      'C1': t('dashboard.descriptions.C1'),
      'C2': t('dashboard.descriptions.C2'),
    };
    return descriptions[level] || t('dashboard.descriptions.default');
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Loading Overlay */}
      {isNavigating && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass" size={24} color="#6466E9" />
            <Text style={styles.loadingText}>{t('dashboard.loadingLesson')}</Text>
          </View>
        </View>
      )}

      {/* Course Overview Section and Course Units Section */}
      <>
        {/* Course Overview Section */}
          <View style={styles.courseOverview}>
            <View style={styles.courseOverviewHeader}>
              <View style={styles.courseTitleContainer}>
                <Text style={styles.courseTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {getCefrLevelTitle(selectedCefrLevel)} {selectedCefrLevel}
                  {selectedSubLevel && ` • ${selectedSubLevel}`}
                </Text>
              </View>
              
              {/* Integrated CEFR Level Selector */}
              <TouchableOpacity 
                style={styles.cefrSelectorButton}
                onPress={() => {
                  // Light haptic feedback for dropdown toggle
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCefrDropdownVisible(!cefrDropdownVisible);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cefrSelectorButtonText}>
                  {selectedCefrLevel}{selectedSubLevel ? ` • ${selectedSubLevel}` : ''}
                </Text>
                <Ionicons 
                  name={cefrDropdownVisible ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6366f1" 
                />
              </TouchableOpacity>
            </View>

            {/* Integrated CEFR Dropdown Menu */}
            {cefrDropdownVisible && (
              <View style={styles.cefrDropdownContainer}>
                {/* Main Level Selection */}
                <View style={styles.dropdownSection}>
                  <Text style={styles.dropdownSectionTitle}>{t('dashboard.filters.mainLevel')}</Text>
                  <ScrollView style={styles.dropdownMenu} nestedScrollEnabled horizontal showsHorizontalScrollIndicator={false}>
                    {CEFR_LEVELS.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.cefrDropdownItem,
                          selectedCefrLevel === level && styles.cefrDropdownItemSelected
                        ]}
                        onPress={() => {
                          // Light haptic feedback for level selection
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedCefrLevel(level);
                          setSelectedSubLevel(null); // Reset sub-level when main level changes
                        }}
                      >
                        <Text style={[
                          styles.cefrDropdownItemText,
                          selectedCefrLevel === level && styles.cefrDropdownItemTextSelected
                        ]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Sub-Level Selection */}
                {selectedCefrLevel && availableSubLevels.filter(level => level.startsWith(selectedCefrLevel + '.')).length > 0 && (
                  <View style={styles.dropdownSection}>
                    <Text style={styles.dropdownSectionTitle}>{t('dashboard.filters.subLevel')}</Text>
                    <ScrollView style={styles.dropdownMenu} nestedScrollEnabled horizontal showsHorizontalScrollIndicator={false}>
                      {/* All Sub-Levels Option */}
                      <TouchableOpacity
                        style={[
                          styles.cefrDropdownItem,
                          !selectedSubLevel && styles.cefrDropdownItemSelected
                        ]}
                        onPress={() => {
                          // Light haptic feedback for sub-level selection
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedSubLevel(null);
                          setCefrDropdownVisible(false);
                        }}
                      >
                        <Text style={[
                          styles.cefrDropdownItemText,
                          !selectedSubLevel && styles.cefrDropdownItemTextSelected
                        ]}>
                          {t('dashboard.filters.allSubLevels')}
                        </Text>
                      </TouchableOpacity>
                      
                      {/* Individual Sub-Levels */}
                      {availableSubLevels
                        .filter(level => level.startsWith(selectedCefrLevel + '.'))
                        .sort((a, b) => {
                          // Extract the numeric part after the dot (e.g., "1" from "A1.1")
                          const aNum = parseInt(a.split('.')[1] || '0');
                          const bNum = parseInt(b.split('.')[1] || '0');
                          return aNum - bNum;
                        })
                        .map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.cefrDropdownItem,
                            selectedSubLevel === level && styles.cefrDropdownItemSelected
                          ]}
                          onPress={() => {
                            // Light haptic feedback for sub-level selection
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedSubLevel(level);
                            setCefrDropdownVisible(false);
                          }}
                        >
                          <Text style={[
                            styles.cefrDropdownItemText,
                            selectedSubLevel === level && styles.cefrDropdownItemTextSelected
                          ]}>
                            {level}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
            
            <Text style={styles.courseDescription}>{getCefrLevelDescription(selectedCefrLevel)}</Text>
            
            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: cefrProgress && typeof cefrProgress.progressPercentage === 'number' 
                      ? `${Math.round(cefrProgress.progressPercentage)}%` 
                      : '0%' }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {cefrProgress && typeof cefrProgress.progressPercentage === 'number' 
                  ? `${Math.round(cefrProgress.progressPercentage)}%` 
                  : '0%'}
              </Text>
            </View>
          </View>

          {/* Subject Boxes Section */}
          <SubjectBoxes 
            maxSubjects={6}
            selectedCefrLevel={selectedCefrLevel}
            selectedSubLevel={selectedSubLevel}
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
    padding: 24,
    backgroundColor: '#e0e7ff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#6366f1',
    position: 'relative',
    overflow: 'visible',
  },
  courseOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  courseTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  courseLevel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  courseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 0,
    flex: 1,
  },
  courseDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#c7d2fe',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    minWidth: 45,
  },
  cefrSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  cefrSelectorButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  cefrDropdownContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 16,
    padding: 16,
  },
  dropdownSection: {
    marginBottom: 16,
  },
  dropdownSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  cefrDropdownMenu: {
    maxHeight: 60,
  },
  cefrDropdownItem: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  cefrDropdownItemSelected: {
    backgroundColor: '#f0f9ff',
    borderColor: '#6366f1',
  },
  cefrDropdownItemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  cefrDropdownItemTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
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