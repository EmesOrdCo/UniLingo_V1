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

export interface MemoryMatchSetupOptions {
  cardCount: number;
  difficulty: 'beginner' | 'intermediate' | 'expert' | 'all';
  selectedTopic: string;
}

interface MemoryMatchSetupProps {
  visible: boolean;
  onClose: () => void;
  onStartGame: (options: MemoryMatchSetupOptions) => void;
  availableCards: number;
}

const MemoryMatchSetup: React.FC<MemoryMatchSetupProps> = ({
  visible,
  onClose,
  onStartGame,
  availableCards,
}) => {
  const { user, profile } = useAuth();
  const [cardCount, setCardCount] = useState<number>(12);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'expert' | 'all'>('all');
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

  // Reset card count if it exceeds available cards after filtered count updates
  useEffect(() => {
    if (filteredCardCount > 0 && (cardCount / 2) > filteredCardCount) {
      // Find the largest valid option based on pairs
      const validOptions = [8, 12, 16, 20].filter(count => (count / 2) <= filteredCardCount);
      if (validOptions.length > 0) {
        setCardCount(Math.max(...validOptions));
      }
    }
  }, [filteredCardCount]);

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

  const cardCountOptions = [
    { value: 8, label: '8 Cards (4 pairs)' },
    { value: 12, label: '12 Cards (6 pairs)' },
    { value: 16, label: '16 Cards (8 pairs)' },
    { value: 20, label: '20 Cards (10 pairs)' },
  ].filter(option => (option.value / 2) <= getAvailableCardsCount());

  const handleStartGame = () => {
    const currentAvailableCards = getAvailableCardsCount();
    const requiredPairs = cardCount / 2;
    
    if (requiredPairs > currentAvailableCards) {
      Alert.alert('Not Enough Cards', `You need at least ${requiredPairs} cards for this game. You currently have ${currentAvailableCards} cards.`);
      return;
    }

    const options: MemoryMatchSetupOptions = {
      cardCount,
      difficulty: selectedDifficulty,
      selectedTopic: selectedTopic || 'All Topics',
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
          <Text style={styles.title}>Memory Match Setup</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Available Cards Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color="#6366f1" />
              <Text style={styles.infoText}>
                Available Cards: {getAvailableCardsCount()}
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
            <Text style={styles.sectionTitle}>Difficulty Level *</Text>
            
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
              >
                <Text style={[
                  styles.dropdownText,
                  selectedDifficulty === 'all' && styles.dropdownPlaceholder
                ]}>
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
                        All Difficulty
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Cards</Text>
            
            <View style={styles.optionsGrid}>
              {cardCountOptions.map((option) => {
                const isDisabled = (option.value / 2) > getAvailableCardsCount();
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      cardCount === option.value && styles.optionCardSelected,
                      isDisabled && styles.optionCardDisabled,
                    ]}
                    onPress={() => {
                      if (!isDisabled) {
                        setCardCount(option.value);
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.optionLabel,
                      cardCount === option.value && styles.optionLabelSelected,
                      isDisabled && styles.optionLabelDisabled,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Text style={styles.startButtonText}>Start Memory Match</Text>
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
  optionLabelDisabled: {
    color: '#9ca3af',
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
});

export default MemoryMatchSetup;
