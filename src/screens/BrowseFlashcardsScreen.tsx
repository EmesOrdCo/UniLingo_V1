import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { useAuth } from '../contexts/AuthContext';
import { useRefresh } from '../contexts/RefreshContext';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { supabase } from '../lib/supabase';
import { VoiceService } from '../lib/voiceService';
import { AWSPollyService } from '../lib/awsPollyService';

interface BrowseFlashcardsScreenProps {
  route: {
    params: {
      topic?: string;
      difficulty?: string;
    };
  };
}

export default function BrowseFlashcardsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, profile } = useAuth();
  const { refreshTrigger } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);
  
  const { topic, difficulty } = (route.params as any) || {};
  
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(topic || null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(difficulty || null);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [filteredCardCount, setFilteredCardCount] = useState<number>(0);
  const [topicFilteredCounts, setTopicFilteredCounts] = useState<{[key: string]: number}>({});
  const [realTopics, setRealTopics] = useState<any[]>([]);

  // Available difficulties (these are standard)
  const availableDifficulties = [
    { id: 'all', name: 'All Difficulties', color: '#6366f1', description: 'Mix of all levels' },
    { id: 'beginner', name: 'Beginner', color: '#10b981', description: 'Basic concepts' },
    { id: 'intermediate', name: 'Intermediate', color: '#f59e0b', description: 'Core principles' },
    { id: 'expert', name: 'Expert', color: '#ef4444', description: 'Complex topics' },
  ];

  // Load flashcards on component mount
  useEffect(() => {
    loadFlashcards();
  }, [selectedTopic, selectedDifficulty]);

  // Refresh data when refreshTrigger changes (from global refresh context)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadFlashcards();
    }
  }, [refreshTrigger]);

  // Pull-to-refresh callback
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFlashcards();
    } finally {
      setRefreshing(false);
    }
  }, [selectedTopic, selectedDifficulty]);

  // Load browse flashcards
  const loadFlashcards = async () => {
    if (!user || !profile?.subjects || profile.subjects.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const userSubject = profile.subjects[0];
      const userFlashcards = await UserFlashcardService.getUserFlashcards({
        subject: userSubject
      });

      // Generate real topics from actual flashcards
      const topicMap = new Map<string, number>();
      userFlashcards.forEach(card => {
        if (card.topic) {
          const topicName = card.topic;
          topicMap.set(topicName, (topicMap.get(topicName) || 0) + 1);
        }
      });

      // Create real topics array with colors
      const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6', '#6366f1', '#ef4444'];
      const realTopicsArray = Array.from(topicMap.entries()).map(([topicName, count], index) => ({
        id: topicName.toLowerCase().replace(/\s+/g, '-'),
        name: topicName,
        color: colors[index % colors.length],
        description: `${count} cards`,
        count: count
      }));

      // Add "All Topics" option at the beginning
      const allTopicsOption = {
        id: 'all',
        name: 'All Topics',
        color: '#6366f1',
        description: `Browse all ${userFlashcards.length} flashcards`,
        count: userFlashcards.length
      };

      setRealTopics([allTopicsOption, ...realTopicsArray]);

      // Filter flashcards based on selected topic and difficulty
      let filteredFlashcards = userFlashcards;

      if (selectedTopic && selectedTopic !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(card => 
          card.topic?.toLowerCase().replace(/\s+/g, '-') === selectedTopic.toLowerCase()
        );
      }

      if (selectedDifficulty && selectedDifficulty !== 'all') {
        filteredFlashcards = filteredFlashcards.filter(card => 
          card.difficulty === selectedDifficulty
        );
      }

      setFlashcards(filteredFlashcards);
      setFilteredCardCount(filteredFlashcards.length);

      // Calculate topic counts for the current difficulty filter
      const topicCounts: {[key: string]: number} = {};
      realTopicsArray.forEach(topic => {
        let topicCards = userFlashcards.filter(card => 
          card.topic?.toLowerCase().replace(/\s+/g, '-') === topic.id.toLowerCase()
        );
        
        if (selectedDifficulty && selectedDifficulty !== 'all') {
          topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
        }
        
        topicCounts[topic.id] = topicCards.length;
      });
      setTopicFilteredCounts(topicCounts);

    } catch (error) {
      console.error('❌ Error loading flashcards:', error);
      Alert.alert('Error', 'Failed to load flashcards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Play audio pronunciation using AWS Polly
  const playPronunciation = async (text: string) => {
    console.log('🔊 Playing pronunciation for:', text);
    
    if (isAudioPlaying) {
      console.log('🔊 Already playing audio, skipping');
      return;
    }
    
    setIsAudioPlaying(true);
    console.log('🎵 Set audio playing to true');
    
    try {
      // Get user's language for voice selection
      const userLanguage = profile?.target_language || 'en-US';
      const voiceId = AWSPollyService.getVoiceForLanguage(userLanguage);
      
      console.log('🎤 Using AWS Polly with voice:', voiceId, 'for language:', userLanguage);
      
      await AWSPollyService.playSpeech(text, {
        voiceId,
        languageCode: userLanguage,
        engine: 'standard', // Use standard engine for cost efficiency
        rate: 0.9, // Slightly slower for clarity
        pitch: 1.0,
        volume: 1.0
      });
      
      console.log('✅ AWS Polly speech completed');
      setIsAudioPlaying(false);
      
    } catch (error) {
      console.error('❌ AWS Polly speech error:', error);
      Alert.alert('Audio Error', 'Failed to play pronunciation audio. Please check your internet connection.');
      setIsAudioPlaying(false);
    }
  };

  const deleteFlashcard = async (cardId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Delete Flashcard',
      'Are you sure you want to delete this flashcard? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from user_flashcards table (this is the only table that exists)
              const { error: userFlashcardError } = await supabase
                .from('user_flashcards')
                .delete()
                .eq('id', cardId);

              if (userFlashcardError) {
                throw userFlashcardError;
              }

              // Remove from local state
              setFlashcards(prev => prev.filter(card => card.id !== cardId));
              
              Alert.alert('Success', 'Flashcard deleted successfully');
            } catch (error) {
              console.error('Error deleting flashcard:', error);
              Alert.alert('Error', 'Failed to delete flashcard');
            }
          },
        },
      ]
    );
  };

  // Start study session with filtered cards
  const startStudySession = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards', 'No flashcards match your current filters.');
      return;
    }

    // Navigate to FlashcardStudyScreen with filtered flashcards
    navigation.navigate('FlashcardStudy', {
      flashcards: flashcards.sort(() => Math.random() - 0.5), // Shuffle cards
      topic: selectedTopic === 'all' ? 'All Topics' : realTopics.find(t => t.id === selectedTopic)?.name || 'All Topics',
      difficulty: selectedDifficulty === 'all' ? 'All Difficulties' : availableDifficulties.find(d => d.id === selectedDifficulty)?.name || 'All Difficulties'
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse Flashcards</Text>
        <View style={styles.headerRight}>
          <Text style={styles.cardCount}>{filteredCardCount} cards</Text>
        </View>
      </View>

      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {/* Topic Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Topic:</Text>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowTopicDropdown(!showTopicDropdown)}
            >
              <Text style={styles.filterButtonText}>
                {selectedTopic ? realTopics.find(t => t.id === selectedTopic)?.name : 'All Topics'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6b7280" />
            </TouchableOpacity>
            
            {showTopicDropdown && (
              <View style={styles.dropdown}>
                <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                  {realTopics.map((topic) => (
                    <TouchableOpacity
                      key={topic.id}
                      style={[
                        styles.dropdownItem,
                        selectedTopic === topic.id && styles.selectedDropdownItem
                      ]}
                      onPress={() => {
                        setSelectedTopic(topic.id);
                        setShowTopicDropdown(false);
                      }}
                    >
                      <View style={styles.dropdownItemContent}>
                        <View style={[styles.topicColor, { backgroundColor: topic.color }]} />
                        <View style={styles.dropdownItemText}>
                          <Text style={[
                            styles.dropdownItemTitle,
                            selectedTopic === topic.id && styles.selectedDropdownItemTitle
                          ]}>
                            {topic.name}
                          </Text>
                          <Text style={styles.dropdownItemDescription}>
                            {topic.description}
                          </Text>
                          {topic.id !== 'all' && (
                            <Text style={styles.dropdownItemCount}>
                              {topicFilteredCounts[topic.id] || 0} cards
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Difficulty Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Difficulty:</Text>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
            >
              <Text style={styles.filterButtonText}>
                {selectedDifficulty ? availableDifficulties.find(d => d.id === selectedDifficulty)?.name : 'All Difficulties'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6b7280" />
            </TouchableOpacity>
            
            {showDifficultyDropdown && (
              <View style={styles.dropdown}>
                <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                  {availableDifficulties.map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty.id}
                      style={[
                        styles.dropdownItem,
                        selectedDifficulty === difficulty.id && styles.selectedDropdownItem
                      ]}
                      onPress={() => {
                        setSelectedDifficulty(difficulty.id);
                        setShowDifficultyDropdown(false);
                      }}
                    >
                      <View style={styles.dropdownItemContent}>
                        <View style={[styles.difficultyColor, { backgroundColor: difficulty.color }]} />
                        <View style={styles.dropdownItemText}>
                          <Text style={[
                            styles.dropdownItemTitle,
                            selectedDifficulty === difficulty.id && styles.selectedDropdownItemTitle
                          ]}>
                            {difficulty.name}
                          </Text>
                          <Text style={styles.dropdownItemDescription}>
                            {difficulty.description}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Study Button */}
      {filteredCardCount > 0 && (
        <View style={styles.studyButtonContainer}>
          <TouchableOpacity 
            style={styles.studyButton}
            onPress={startStudySession}
          >
            <Ionicons name="play" size={24} color="#ffffff" />
            <Text style={styles.studyButtonText}>
              Study {filteredCardCount} Cards
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Flashcards List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading flashcards...</Text>
          </View>
        ) : flashcards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Flashcards Found</Text>
            <Text style={styles.emptyDescription}>
              {selectedTopic !== 'all' || selectedDifficulty !== 'all' 
                ? 'Try adjusting your filters to see more cards.'
                : 'Create some flashcards first or upload notes to generate them with AI.'
              }
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {selectedTopic === 'all' ? 'All Topics' : realTopics.find(t => t.id === selectedTopic)?.name} 
              {selectedDifficulty !== 'all' && ` • ${availableDifficulties.find(d => d.id === selectedDifficulty)?.name}`}
            </Text>
            
            {flashcards.map((card, index) => (
              <View key={card.id || index} style={styles.flashcardCard}>
                <View style={styles.flashcardHeader}>
                  <View style={styles.flashcardMeta}>
                    <Text style={styles.flashcardTopic}>{card.topic || 'General'}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteFlashcard(card.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                
                {/* Move difficulty badge below the header */}
                <View style={styles.difficultyContainer}>
                  <View style={[styles.difficultyBadge, { backgroundColor: availableDifficulties.find(d => d.id === card.difficulty)?.color || '#6b7280' }]}>
                    <Text style={styles.difficultyBadgeText}>
                      {availableDifficulties.find(d => d.id === card.difficulty)?.name || 'Unknown'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.flashcardContent}>
                  <View style={styles.flashcardSide}>
                    <Text style={styles.flashcardLabel}>
                      {profile?.native_language || 'Native'}:
                    </Text>
                    <Text style={styles.flashcardText}>{card.back}</Text>
                  </View>
                  
                  <View style={styles.flashcardSide}>
                    <Text style={styles.flashcardLabel}>English:</Text>
                    <Text style={styles.flashcardText}>{card.front}</Text>
                  </View>
                  
                  {card.pronunciation && (
                    <View style={styles.pronunciationContainer}>
                      <Text style={styles.flashcardLabel}>Pronunciation:</Text>
                      <View style={styles.pronunciationContent}>
                        <Text style={[styles.flashcardText, { flex: 1 }]}>{card.pronunciation}</Text>
                        <TouchableOpacity 
                          style={styles.audioButton} 
                          onPress={() => playPronunciation(card.front)}
                        >
                          <Ionicons name="volume-high" size={16} color="#6366f1" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  
                  {card.example && (
                    <View style={styles.exampleContainer}>
                      <Text style={styles.flashcardLabel}>Example:</Text>
                      <Text style={styles.flashcardText}>{card.example}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  cardCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 16,
  },
  filterGroup: {
    flex: 1,
    position: 'relative',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedDropdownItem: {
    backgroundColor: '#f0f4ff',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topicColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  difficultyColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dropdownItemText: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  selectedDropdownItemTitle: {
    color: '#6366f1',
    fontWeight: '600',
  },
  dropdownItemDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  dropdownItemCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  studyButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  studyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  flashcardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  flashcardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flashcardMeta: {
    flex: 1,
    marginRight: 12, // Add margin to prevent overlap
  },
  difficultyContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  flashcardTopic: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  flashcardContent: {
    gap: 12,
  },
  flashcardSide: {
    gap: 4,
  },
  flashcardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  flashcardText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  pronunciationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  pronunciationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  audioButton: {
    padding: 4,
    backgroundColor: '#f0f4ff',
    borderRadius: 4,
  },
  exampleContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 4,
  },
});
