import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../lib/i18n';
import { supabase } from '../lib/supabase';

interface LevelSelectionScreenProps {
  route?: {
    params?: {
      onLevelSelected?: (level: string, subLevel: string | null) => void;
    };
  };
}

export default function LevelSelectionScreen({ route }: LevelSelectionScreenProps) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedCefrLevel, setSelectedCefrLevel] = useState<string>('A1');
  const [selectedSubLevel, setSelectedSubLevel] = useState<string | null>(null);
  const [availableSubLevels, setAvailableSubLevels] = useState<string[]>([]);

  const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  useEffect(() => {
    if (user?.id) {
      loadAvailableSubLevels();
    }
  }, [user?.id]);

  const loadAvailableSubLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_scripts')
        .select('cefr_sub_level')
        .not('cefr_sub_level', 'is', null);

      if (error) {
        console.error('Error loading available sub-levels:', error);
        return;
      }

      const subLevels = [...new Set(data?.map(item => item.cefr_sub_level) || [])]
        .sort((a, b) => {
          const aMain = a.split('.')[0];
          const bMain = b.split('.')[0];
          if (aMain !== bMain) {
            return aMain.localeCompare(bMain);
          }
          const aNum = parseInt(a.split('.')[1] || '0');
          const bNum = parseInt(b.split('.')[1] || '0');
          return aNum - bNum;
        });
      setAvailableSubLevels(subLevels);
    } catch (error) {
      console.error('Error loading available sub-levels:', error);
    }
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

  const handleLevelSelect = (level: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCefrLevel(level);
    setSelectedSubLevel(null); // Reset sub-level when main level changes
  };

  const handleSubLevelSelect = (subLevel: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSubLevel(subLevel);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Call the callback if provided
    if (route?.params?.onLevelSelected) {
      route.params.onLevelSelected(selectedCefrLevel, selectedSubLevel);
    }
    
    // Navigate back to dashboard
    navigation.goBack();
  };

  const getAvailableSubLevelsForCurrentLevel = () => {
    return availableSubLevels.filter(level => level.startsWith(selectedCefrLevel + '.'));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('levelSelection.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Level Preview - Moved to top */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>{t('levelSelection.selectedLevel')}</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewLevel}>
              {getCefrLevelTitle(selectedCefrLevel)} {selectedCefrLevel}
              {selectedSubLevel && ` • ${selectedSubLevel}`}
            </Text>
            <Text style={styles.previewDescription}>
              {getCefrLevelDescription(selectedCefrLevel)}
            </Text>
          </View>
        </View>

        {/* Main Level Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('levelSelection.mainLevel')}</Text>
          <Text style={styles.sectionDescription}>
            {t('levelSelection.mainLevelDescription')}
          </Text>
          
          <View style={styles.levelGrid}>
            {CEFR_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.levelCard,
                  selectedCefrLevel === level && styles.levelCardSelected
                ]}
                onPress={() => handleLevelSelect(level)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.levelCardTitle,
                  selectedCefrLevel === level && styles.levelCardTitleSelected
                ]}>
                  {level}
                </Text>
                <Text style={[
                  styles.levelCardSubtitle,
                  selectedCefrLevel === level && styles.levelCardSubtitleSelected
                ]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {getCefrLevelTitle(level)}
                </Text>
                {selectedCefrLevel === level && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sub-Level Selection */}
        {getAvailableSubLevelsForCurrentLevel().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('levelSelection.subLevel')}</Text>
            <Text style={styles.sectionDescription}>
              {t('levelSelection.subLevelDescription')}
            </Text>
            
            <View style={styles.subLevelContainer}>
              {/* All Sub-Levels Option */}
              <TouchableOpacity
                style={[
                  styles.subLevelCard,
                  !selectedSubLevel && styles.subLevelCardSelected
                ]}
                onPress={() => handleSubLevelSelect(null)}
                activeOpacity={0.7}
              >
                <View style={styles.subLevelContent}>
                  <Text style={[
                    styles.subLevelTitle,
                    !selectedSubLevel && styles.subLevelTitleSelected
                  ]}>
                    {t('levelSelection.allSubLevels')}
                  </Text>
                  <Text style={[
                    styles.subLevelDescription,
                    !selectedSubLevel && styles.subLevelDescriptionSelected
                  ]}>
                    {t('levelSelection.allSubLevelsDescription')}
                  </Text>
                </View>
                {!selectedSubLevel && (
                  <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
                )}
              </TouchableOpacity>

              {/* Individual Sub-Levels */}
              {getAvailableSubLevelsForCurrentLevel()
                .sort((a, b) => {
                  const aNum = parseInt(a.split('.')[1] || '0');
                  const bNum = parseInt(b.split('.')[1] || '0');
                  return aNum - bNum;
                })
                .map((subLevel) => (
                <TouchableOpacity
                  key={subLevel}
                  style={[
                    styles.subLevelCard,
                    selectedSubLevel === subLevel && styles.subLevelCardSelected
                  ]}
                  onPress={() => handleSubLevelSelect(subLevel)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subLevelContent}>
                    <Text style={[
                      styles.subLevelTitle,
                      selectedSubLevel === subLevel && styles.subLevelTitleSelected
                    ]}>
                      {subLevel}
                    </Text>
                    <Text style={[
                      styles.subLevelDescription,
                      selectedSubLevel === subLevel && styles.subLevelDescriptionSelected
                    ]}>
                      {t('levelSelection.subLevelDescription', { level: subLevel })}
                    </Text>
                  </View>
                  {selectedSubLevel === subLevel && (
                    <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>
            {t('levelSelection.confirm')}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  levelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
    maxWidth: '48%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
    shadowColor: '#6366f1',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  levelCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  levelCardTitleSelected: {
    color: '#6366f1',
  },
  levelCardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  levelCardSubtitleSelected: {
    color: '#6366f1',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  subLevelContainer: {
    gap: 12,
  },
  subLevelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subLevelCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  subLevelContent: {
    flex: 1,
  },
  subLevelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  subLevelTitleSelected: {
    color: '#6366f1',
  },
  subLevelDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  subLevelDescriptionSelected: {
    color: '#6366f1',
  },
  previewSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  previewLevel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 14,
    color: '#e0e7ff',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confirmButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
