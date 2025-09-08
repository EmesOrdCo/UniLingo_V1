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

export interface FlashcardQuizSetupOptions {
  questionCount: number;
  languageMode: 'native-to-target' | 'target-to-native' | 'mixed';
  selectedTopic: string;
  difficulty: 'beginner' | 'intermediate' | 'expert' | 'all';
}

interface FlashcardQuizSetupProps {
  visible: boolean;
  onClose: () => void;
  onStartGame: (options: FlashcardQuizSetupOptions) => void;
  availableCards: number;
}

const FlashcardQuizSetup: React.FC<FlashcardQuizSetupProps> = ({
  visible,
  onClose,
  onStartGame,
  availableCards,
}) => {
  const { user, profile } = useAuth();
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [languageMode, setLanguageMode] = useState<'native-to-target' | 'target-to-native' | 'mixed'>('mixed');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'expert' | 'all'>('all');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicCardCounts, setTopicCardCounts] = useState<{ [topic: string]: number }>({});
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [filteredCardCount, setFilteredCardCount] = useState<number>(0);

  // Get user's languages
  const nativeLanguage = profile?.native_language || 'English';
  const targetLanguage = profile?.target_language || 'Spanish';

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
      if (selectedTopic && selectedTopic !== '') {
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
        const topicCards = await UserFlashcardService.getUserFlashcards({ topic });
        counts[topic] = topicCards.length;
        console.log(`📊 Topic "${topic}": ${topicCards.length} cards`);
      }
      setTopicCardCounts(counts);
      console.log('✅ Topic loading complete');
      
      // Initialize filtered card count
      setFilteredCardCount(availableCards);
    } catch (error) {
      console.error('❌ Error loading topics:', error);
      setFilteredCardCount(availableCards); // Fallback
    } finally {
      setLoadingTopics(false);
    }
  };

  // Get available cards count based on selected topic and difficulty
  const getAvailableCardsCount = () => {
    return filteredCardCount;
  };

  const currentAvailableCards = getAvailableCardsCount();

  const questionCountOptions = [
    { value: 5, label: '5 Questions' },
    { value: 10, label: '10 Questions' },
    { value: 15, label: '15 Questions' },
    { value: 20, label: '20 Questions' },
  ];

  const languageModeOptions = [
    {
      value: 'native-to-target' as const,
      label: `${nativeLanguage} → ${targetLanguage}`,
    },
    {
      value: 'target-to-native' as const,
      label: `${targetLanguage} → ${nativeLanguage}`,
    },
    {
      value: 'mixed' as const,
      label: 'Mixed Mode',
    },
  ];

  const handleStartGame = () => {
    if (currentAvailableCards === 0) {
      Alert.alert(
        'No Cards Available',
        'You need to create flashcards first. Go to the Upload page to create flashcards from PDFs.'
      );
      return;
    }

    if (questionCount > currentAvailableCards) {
      const topicText = selectedTopic ? ` in the "${selectedTopic}" topic` : '';
      Alert.alert('Not Enough Cards', `You need at least ${questionCount} cards for this quiz. You currently have ${currentAvailableCards} cards${topicText}.`);
      return;
    }

    const options: FlashcardQuizSetupOptions = {
      questionCount,
      languageMode,
      selectedTopic: selectedTopic || 'All Topics',
      difficulty: selectedDifficulty,
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
          <Text style={styles.title}>Flashcard Quiz Setup</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.contentTouchable}
            activeOpacity={1}
            onPress={() => {
              setShowTopicDropdown(false);
              setShowDifficultyDropdown(false);
            }}
          >
          {/* Available Cards Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#6366f1" />
              <Text style={styles.infoText}>
                Available Cards: {currentAvailableCards}
                {selectedTopic && selectedTopic !== '' ? ` (${selectedTopic} topic)` : ' (All topics)'}
                {selectedDifficulty && selectedDifficulty !== 'all' ? `, ${selectedDifficulty} difficulty` : ''}
              </Text>
            </View>
          </View>

          {/* Topic Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topic *</Text>
            
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  if (loadingTopics) {
                    Alert.alert('Loading', 'Please wait while topics are loading...');
                    return;
                  }
                  
                  if (topics.length === 0) {
                    Alert.alert(
                      'No Topics Available',
                      'You need to create flashcards first. Go to the Upload page to create flashcards from PDFs.',
                      [
                        { text: 'OK', onPress: () => {} }
                      ]
                    );
                    return;
                  }
                  
                  setShowTopicDropdown(!showTopicDropdown);
                }}
              >
                <Text style={[
                  styles.dropdownText,
                  !selectedTopic && styles.dropdownPlaceholder
                ]}>
                  {selectedTopic 
                    ? `${selectedTopic} (${topicCardCounts[selectedTopic] || 0} cards)`
                    : `All Topics (${availableCards} cards)`
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
                        All Topics ({availableCards} cards)
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
                          {topic} ({topicCardCounts[topic] || 0} cards)
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
            <Text style={styles.sectionTitle}>Difficulty</Text>
            
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {selectedDifficulty === 'all' 
                    ? 'All Difficulty' 
                    : selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)
                  }
                </Text>
                <Ionicons 
                  name={showDifficultyDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {/* Difficulty Options */}
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
                        All Difficulty
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Individual Difficulty Options */}
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

          {/* Question Count Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Questions</Text>
            
            <View style={styles.optionsGrid}>
              {questionCountOptions.map((option) => {
                const isDisabled = option.value > currentAvailableCards;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      questionCount === option.value && styles.optionCardSelected,
                      isDisabled && styles.optionCardDisabled,
                    ]}
                    onPress={() => !isDisabled && setQuestionCount(option.value)}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.optionLabel,
                      questionCount === option.value && styles.optionLabelSelected,
                      isDisabled && styles.optionLabelDisabled,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Language Mode Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Language Mode</Text>
            
            <View style={styles.optionsGrid}>
              {languageModeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    languageMode === option.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setLanguageMode(option.value)}
                >
                  <Text style={[
                    styles.optionLabel,
                    languageMode === option.value && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Quiz</Text>
            <Ionicons name="play" size={20} color="white" />
          </TouchableOpacity>
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
  contentTouchable: {
    flex: 1,
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
  dropdownContainer: {
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 200,
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
  optionCardDisabled: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    opacity: 0.5,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  optionLabelDisabled: {
    color: '#94a3b8',
  },
  loadingCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
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
});

export default FlashcardQuizSetup;
