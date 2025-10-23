import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../lib/i18n';

export interface GravityGameSetupOptions {
  difficulty: 'beginner' | 'intermediate' | 'expert' | 'all';
  gravitySpeed: number;
  selectedTopic: string;
}

interface GravityGameSetupProps {
  visible: boolean;
  onClose: () => void;
  onStartGame: (options: GravityGameSetupOptions) => void;
  availableCards: number;
}

const GravityGameSetup: React.FC<GravityGameSetupProps> = ({
  visible,
  onClose,
  onStartGame,
  availableCards,
}) => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'expert' | 'all'>('all');
  const [gravitySpeed, setGravitySpeed] = useState<number>(1.0);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicCardCounts, setTopicCardCounts] = useState<{ [topic: string]: number }>({});
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [filteredCardCount, setFilteredCardCount] = useState<number>(0);

  // Load topics when component mounts
  useEffect(() => {
    if (visible && user?.id) {
      loadTopics();
    }
  }, [visible, user?.id]);

  // Update filtered card count when topic or difficulty changes
  const updateFilteredCardCount = async () => {
    if (!user?.id) return;
    
    try {
      const filters: any = {};
      
      // Add topic filter if specific topic is selected
      if (selectedTopic && selectedTopic !== '' && selectedTopic !== 'All Topics') {
        filters.topic = selectedTopic;
      }
      
      // Add difficulty filter if specific difficulty is selected
      if (selectedDifficulty && selectedDifficulty !== 'all') {
        filters.difficulty = selectedDifficulty;
      }
      
      console.log('🔍 Updating filtered card count with filters:', filters);
      const filteredCards = await UserFlashcardService.getUserFlashcards(filters);
      console.log(`📊 Filtered cards count: ${filteredCards.length}`);
      setFilteredCardCount(filteredCards.length);
    } catch (error) {
      console.error('❌ Error updating filtered card count:', error);
      setFilteredCardCount(availableCards); // Fallback to total available cards
    }
  };

  // Update card count when topic or difficulty changes
  useEffect(() => {
    updateFilteredCardCount();
  }, [selectedTopic, selectedDifficulty, user?.id]);

  const loadTopics = async () => {
    if (!user?.id) return;
    
    console.log('🔄 Loading topics for user:', user.id);
    setLoadingTopics(true);
    try {
      const topicsData = await UserFlashcardService.getUserFlashcardTopicsByUserId(user.id);
      console.log('📚 Topics loaded:', topicsData);
      setTopics(topicsData);
      
      // Get card counts for each topic
      const counts: { [topic: string]: number } = {};
      for (const topic of topicsData) {
        const cards = await UserFlashcardService.getUserFlashcards({ topic });
        counts[topic] = cards.length;
      }
      setTopicCardCounts(counts);
      
      // Initialize filtered card count
      setFilteredCardCount(availableCards);
    } catch (error) {
      console.error('❌ Error loading topics:', error);
    } finally {
      setLoadingTopics(false);
    }
  };

  const getAvailableCardsCount = () => {
    return filteredCardCount;
  };


  const gravitySpeedOptions = [
    { value: 0.8, label: `${t('gameSetup.options.slow')} (0.8x)` },
    { value: 1.0, label: `${t('gameSetup.options.normal')} (1.0x)` },
    { value: 1.2, label: `${t('gameSetup.options.fast')} (1.2x)` },
    { value: 1.5, label: `${t('gameSetup.options.veryFast')} (1.5x)` },
  ];

  const handleStartGame = () => {
    const currentAvailableCards = getAvailableCardsCount();
    
    if (currentAvailableCards === 0) {
      Alert.alert(t('gameSetup.alerts.noCardsAvailable'), t('gameSetup.alerts.selectDifferentTopic'));
      return;
    }

    const options: GravityGameSetupOptions = {
      difficulty: selectedDifficulty,
      gravitySpeed,
      selectedTopic: selectedTopic || t('gameSetup.dropdown.allTopics'),
    };

    onStartGame(options);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('gameSetup.title.gravityGame')}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Available Cards Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#6366f1" />
              <Text style={styles.infoText}>
                {t('gameSetup.info.availableCards')} {getAvailableCardsCount()}
                {selectedTopic && selectedTopic !== '' ? ` (${selectedTopic} ${t('gameSetup.info.topic')})` : ` ${t('gameSetup.info.allTopics')}`}
                {selectedDifficulty && selectedDifficulty !== 'all' ? `, ${selectedDifficulty} ${t('gameSetup.info.difficulty')}` : ''}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="planet" size={20} color="#6366f1" />
              <Text style={styles.infoText}>
                {t('gameSetup.info.gravitySpeed', { speed: gravitySpeed })}
              </Text>
            </View>
          </View>

          {/* Topic Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('gameSetup.sections.topic')} *</Text>
            
            <View style={styles.topicDropdownContainer}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  if (loadingTopics) {
                    Alert.alert(t('gameSetup.dropdown.loading'), t('gameSetup.dropdown.pleaseWait'));
                    return;
                  }
                  
                  if (topics.length === 0) {
                    Alert.alert(
                      t('gameSetup.alerts.noTopicsAvailable'),
                      t('gameSetup.alerts.createFlashcardsFirst'),
                      [
                        { text: t('common.ok'), onPress: () => {} }
                      ]
                    );
                    return;
                  }
                  
                  // Close difficulty dropdown if open
                  setShowDifficultyDropdown(false);
                  setShowTopicDropdown(!showTopicDropdown);
                }}
              >
                <Text style={[
                  styles.dropdownText,
                  !selectedTopic && styles.dropdownPlaceholder
                ]}>
                  {selectedTopic 
                    ? `${selectedTopic} (${topicCardCounts[selectedTopic] || 0} ${t('gameSetup.info.cards')})`
                    : `${t('gameSetup.dropdown.allTopics')} (${availableCards} ${t('gameSetup.info.cards')})`
                  }
                </Text>
                <Ionicons 
                  name={showTopicDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {/* Dropdown Options */}
              {showTopicDropdown && (
                <View style={styles.dropdownOptions}>
                  <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                    {/* All Topics Option */}
                    <TouchableOpacity
                      style={[
                        styles.dropdownOption,
                        !selectedTopic && styles.dropdownOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedTopic('');
                        setShowTopicDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        !selectedTopic && styles.dropdownOptionTextSelected
                      ]}>
                        {t('gameSetup.dropdown.allTopics')} ({availableCards} {t('gameSetup.info.cards')})
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Individual Topics */}
                    {topics.map((topic) => (
                      <TouchableOpacity
                        key={topic}
                        style={[
                          styles.dropdownOption,
                          selectedTopic === topic && styles.dropdownOptionSelected
                        ]}
                        onPress={() => {
                          setSelectedTopic(topic);
                          setShowTopicDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownOptionText,
                          selectedTopic === topic && styles.dropdownOptionTextSelected
                        ]}>
                          {topic} ({topicCardCounts[topic] || 0} {t('gameSetup.info.cards')})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Difficulty Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('gameSetup.sections.difficulty')} *</Text>
            
            <View style={styles.difficultyDropdownContainer}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  // Close topic dropdown if open
                  setShowTopicDropdown(false);
                  setShowDifficultyDropdown(!showDifficultyDropdown);
                }}
              >
                <Text style={[
                  styles.dropdownText,
                  selectedDifficulty === 'all' && styles.dropdownPlaceholder
                ]}>
                  {selectedDifficulty === 'all' 
                    ? t('gameSetup.dropdown.allDifficulty')
                    : selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)
                  }
                </Text>
                <Ionicons 
                  name={showDifficultyDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {/* Dropdown Options */}
              {showDifficultyDropdown && (
                <View style={styles.dropdownOptions}>
                  <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                    {/* All Difficulty Option */}
                    <TouchableOpacity
                      style={[
                        styles.dropdownOption,
                        selectedDifficulty === 'all' && styles.dropdownOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedDifficulty('all');
                        setShowDifficultyDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        selectedDifficulty === 'all' && styles.dropdownOptionTextSelected
                      ]}>
                        {t('gameSetup.dropdown.allDifficulty')}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Individual Difficulties */}
                    {['beginner', 'intermediate', 'expert'].map((difficulty) => (
                      <TouchableOpacity
                        key={difficulty}
                        style={[
                          styles.dropdownOption,
                          selectedDifficulty === difficulty && styles.dropdownOptionSelected
                        ]}
                        onPress={() => {
                          setSelectedDifficulty(difficulty as 'beginner' | 'intermediate' | 'expert');
                          setShowDifficultyDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownOptionText,
                          selectedDifficulty === difficulty && styles.dropdownOptionTextSelected
                        ]}>
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Gravity Speed Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('gameSetup.sections.gravitySpeed')}</Text>
            
            <View style={styles.optionsGrid}>
              {gravitySpeedOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    gravitySpeed === option.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setGravitySpeed(option.value)}
                >
                  <Text style={[
                    styles.optionLabel,
                    gravitySpeed === option.value && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>{t('gameSetup.buttons.startPlanetDefense')}</Text>
            <Ionicons name="play" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  optionLabelSelected: {
    color: '#6366f1',
  },
  optionDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  optionDescriptionSelected: {
    color: '#6366f1',
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  startButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  // Dropdown styles
  topicDropdownContainer: {
    position: 'relative',
    zIndex: 1002, // Higher z-index for topic dropdown
  },
  difficultyDropdownContainer: {
    position: 'relative',
    zIndex: 1001, // Lower z-index for difficulty dropdown
  },
  dropdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1003, // High z-index for dropdown options
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownOptionSelected: {
    backgroundColor: '#f0f4ff',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  dropdownOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  // Disabled state styles
  optionCardDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  optionLabelDisabled: {
    color: '#9ca3af',
  },
});

export default GravityGameSetup;
