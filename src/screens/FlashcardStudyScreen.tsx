import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { useAuth } from '../contexts/AuthContext';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { ProgressTrackingService } from '../lib/progressTrackingService';
import { XPService } from '../lib/xpService';

const { width } = Dimensions.get('window');

interface FlashcardStudyScreenProps {
  route: {
    params: {
      flashcards: any[];
      topic?: string;
      difficulty?: string;
    };
  };
}

export default function FlashcardStudyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, profile } = useAuth();
  
  const { flashcards: initialFlashcards, topic, difficulty } = route.params || { flashcards: [] };
  
  const [studySession, setStudySession] = useState<{
    isActive: boolean;
    isComplete: boolean;
    flashcards: any[];
    currentIndex: number;
    showAnswer: boolean;
    answers: Array<'correct' | 'incorrect'>;
    showNativeLanguage: boolean;
    startTime: Date | null;
  }>({
    isActive: true,
    isComplete: false,
    flashcards: initialFlashcards,
    currentIndex: 0,
    showAnswer: false,
    answers: [],
    showNativeLanguage: false,
    startTime: new Date()
  });
  
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all');

  // Handle flashcard answer selection
  const handleAnswer = async (answer: 'correct' | 'incorrect') => {
    const newAnswers = [...studySession.answers];
    newAnswers[studySession.currentIndex] = answer;
    
    // Track individual flashcard progress
    if (user) {
      const currentFlashcard = studySession.flashcards[studySession.currentIndex];
      try {
        await ProgressTrackingService.updateFlashcardProgress({
          flashcardId: currentFlashcard.id,
          isCorrect: answer === 'correct',
          responseTime: 5, // Average 5 seconds per card
        });
        console.log(`✅ Tracked individual flashcard progress: ${answer}`);
      } catch (error) {
        console.error('❌ Error tracking individual flashcard progress:', error);
      }
    }
    
    if (studySession.currentIndex < studySession.flashcards.length - 1) {
      // Move to next card
      setStudySession(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        showAnswer: false,
        answers: newAnswers
      }));
    } else {
      // Session complete
      await completeStudySession(newAnswers);
    }
  };

  // Complete study session
  const completeStudySession = async (answers: Array<'correct' | 'incorrect'>) => {
    setStudySession(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      answers
    }));
    
    // Calculate study time and update progress tracking
    if (studySession.startTime && user) {
      const endTime = new Date();
      const timeSpentSeconds = Math.floor((endTime.getTime() - studySession.startTime.getTime()) / 1000);
      const timeSpentMinutes = Math.floor(timeSpentSeconds / 60);
      
      console.log(`📚 Study session completed: ${timeSpentMinutes} minutes (${timeSpentSeconds} seconds)`);
      
      try {
        // Calculate session statistics
        const correct = answers.filter(a => a === 'correct' || a === 'easy').length;
        const total = answers.length;
        const accuracyPercentage = Math.round((correct / total) * 100);
        const score = Math.round((correct / total) * 100);

        // Record flashcard review activity
        await ProgressTrackingService.recordFlashcardActivity({
          activityType: 'flashcard_review',
          activityName: `Flashcard Review - ${topic || 'All Topics'}`,
          durationSeconds: timeSpentSeconds,
          score: score,
          maxScore: 100,
          accuracyPercentage: accuracyPercentage,
          flashcardsReviewed: total,
        });

        console.log('✅ Flashcard review activity tracked successfully');

        // Award XP for completing flashcard review
        try {
          const xpResult = await XPService.awardXP(
            user.id,
            'flashcard',
            score,
            100,
            accuracyPercentage,
            `Flashcard Review - ${topic || 'All Topics'}`,
            timeSpentSeconds
          );
          
          if (xpResult) {
            console.log('🎯 XP awarded for flashcard review:', xpResult.totalXP, 'XP');
          }
        } catch (xpError) {
          console.error('❌ Error awarding XP for flashcard review:', xpError);
        }
      } catch (error) {
        console.error('❌ Error tracking flashcard review activity:', error);
      }
    }
  };

  // Toggle language display
  const toggleLanguage = () => {
    setStudySession(prev => ({
      ...prev,
      showNativeLanguage: !prev.showNativeLanguage
    }));
  };

  // Play audio pronunciation
  const playPronunciation = async (text: string) => {
    console.log('🔊 Playing pronunciation for:', text);
    console.log('🌐 Platform:', Platform.OS);
    
    // Stop any currently playing audio first
    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        console.log('🛑 Stopped web speech synthesis');
      }
    } else {
      Speech.stop();
      console.log('🛑 Stopped mobile speech');
    }
    
    setIsAudioPlaying(true);
    console.log('🎵 Set audio playing to true');
    
    if (Platform.OS === 'web') {
      // Use Web Speech API for web
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        
        utterance.onend = () => {
          console.log('✅ Web speech ended');
          setIsAudioPlaying(false);
        };
        utterance.onerror = (event) => {
          console.error('❌ Web speech error:', event);
          setIsAudioPlaying(false);
        };
        
        speechSynthesis.speak(utterance);
        console.log('🎤 Started web speech synthesis');
      } else {
        console.log('❌ Web speech synthesis not available');
        setIsAudioPlaying(false);
      }
    } else {
      // Use expo-speech for mobile
      try {
        console.log('🎤 Starting mobile speech with text:', text);
        
        Speech.speak(text, {
          language: 'en-US',
          rate: 0.7, // Slightly slower for clarity
          pitch: 1.0,
          volume: 1.0,
          onDone: () => {
            console.log('✅ Mobile speech done');
            setIsAudioPlaying(false);
          },
          onError: (error) => {
            console.error('❌ Mobile speech error:', error);
            setIsAudioPlaying(false);
          },
          onStopped: () => {
            console.log('🛑 Mobile speech stopped');
            setIsAudioPlaying(false);
          },
        });
        console.log('🎤 Started mobile speech');
      } catch (error) {
        console.error('❌ Error starting mobile speech:', error);
        Alert.alert('Audio Error', 'Failed to play pronunciation audio.');
        setIsAudioPlaying(false);
      }
    }
  };

  // Show study session if active
  if (studySession.isActive) {
    const currentCard = studySession.flashcards[studySession.currentIndex];
    const progress = ((studySession.currentIndex + 1) / studySession.flashcards.length) * 100;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.studyHeader}>
          <View style={styles.studyHeaderTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#6366f1" />
            </TouchableOpacity>
            <Text style={styles.studyTitle}>Study Session</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {studySession.currentIndex + 1} / {studySession.flashcards.length}
              </Text>
              <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
                <Ionicons name="language" size={20} color="#6366f1" />
                <Text style={styles.languageToggleText}>
                  {studySession.showNativeLanguage 
                    ? profile?.native_language || 'Native'
                    : 'EN'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
        
        <View style={styles.studyContent}>
          <View style={styles.flashcard}>
            <View style={styles.flashcardContent}>
              <Text style={styles.flashcardText}>
                {studySession.showAnswer 
                  ? (studySession.showNativeLanguage ? currentCard.front : currentCard.back)
                  : (studySession.showNativeLanguage ? currentCard.back : currentCard.front)
                }
              </Text>
              {currentCard.pronunciation && (
                <View style={styles.pronunciationContainer}>
                  <Text style={styles.pronunciation}>{currentCard.pronunciation}</Text>
                  <TouchableOpacity 
                    style={[styles.audioButton, isAudioPlaying && styles.audioButtonPlaying]} 
                    onPress={() => playPronunciation(currentCard.front)}
                  >
                    <Ionicons 
                      name="volume-high" 
                      size={20} 
                      color={isAudioPlaying ? "#64748b" : "#6366f1"} 
                    />
                  </TouchableOpacity>
                </View>
              )}
              {currentCard.example && studySession.showAnswer && (
                <Text style={styles.example}>Example: {currentCard.example}</Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.flipButton}
              onPress={() => setStudySession(prev => ({ ...prev, showAnswer: !prev.showAnswer }))}
            >
              <Ionicons 
                name={studySession.showAnswer ? "eye-off" : "eye"} 
                size={24} 
                color="#6366f1" 
              />
              <Text style={styles.flipButtonText}>
                {studySession.showAnswer ? 'Show Question' : 'Show Answer'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {studySession.showAnswer && (
            <View style={styles.answerButtons}>
              <TouchableOpacity 
                style={[styles.answerButton, styles.correctButton]}
                onPress={() => handleAnswer('correct')}
              >
                <Ionicons name="checkmark" size={24} color="#10b981" />
                <Text style={[styles.answerButtonText, styles.correctButtonText]}>Correct</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.answerButton, styles.incorrectButton]}
                onPress={() => handleAnswer('incorrect')}
              >
                <Ionicons name="close" size={24} color="#ef4444" />
                <Text style={[styles.answerButtonText, styles.incorrectButtonText]}>Incorrect</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Show review session if complete
  if (studySession.isComplete) {
    const correct = studySession.answers.filter(a => a === 'correct' || a === 'easy').length;
    const total = studySession.answers.length;
    const percentage = Math.round((correct / total) * 100);
    
    // Filter flashcards based on performance
    const filteredFlashcards = studySession.flashcards.filter((card, index) => {
      const answer = studySession.answers[index];
      const isCorrect = answer === 'correct' || answer === 'easy';
      
      if (filterType === 'all') return true;
      if (filterType === 'correct') return isCorrect;
      if (filterType === 'incorrect') return !isCorrect;
      return true;
    });
    
    const filteredCount = filteredFlashcards.length;
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>Session Complete!</Text>
          <Text style={styles.reviewSubtitle}>Review your performance</Text>
          
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scorePercentage}>{percentage}%</Text>
              <Text style={styles.scoreText}>{correct}/{total} correct</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark" size={24} color="#10b981" />
              <Text style={styles.reviewStatNumber}>{studySession.answers.filter(a => a === 'correct').length}</Text>
              <Text style={styles.reviewStatLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="close" size={24} color="#ef4444" />
              <Text style={styles.reviewStatNumber}>{studySession.answers.filter(a => a === 'incorrect').length}</Text>
              <Text style={styles.reviewStatLabel}>Incorrect</Text>
            </View>
          </View>
        </View>
        
        {/* Filter Controls */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filter Cards:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'all' && styles.activeFilterButton]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterButtonText, filterType === 'all' && styles.activeFilterButtonText]}>
                All ({total})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'correct' && styles.activeFilterButton]}
              onPress={() => setFilterType('correct')}
            >
              <Text style={[styles.filterButtonText, filterType === 'correct' && styles.activeFilterButtonText]}>
                Correct ({correct})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, filterType === 'incorrect' && styles.activeFilterButton]}
              onPress={() => setFilterType('incorrect')}
            >
              <Text style={[styles.filterButtonText, filterType === 'incorrect' && styles.activeFilterButtonText]}>
                Incorrect ({total - correct})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.reviewContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.reviewSectionTitle}>
            {filterType === 'all' ? 'All Cards' : 
             filterType === 'correct' ? 'Correct Answers' : 'Incorrect Answers'} 
            ({filteredCount})
          </Text>
          
          {filteredFlashcards.map((card, index) => {
            const originalIndex = studySession.flashcards.indexOf(card);
            const answer = studySession.answers[originalIndex];
            const isCorrect = answer === 'correct' || answer === 'easy';
            
            return (
              <View key={originalIndex} style={[styles.reviewCard, isCorrect ? styles.correctReviewCard : styles.incorrectReviewCard]}>
                <View style={styles.reviewCardHeader}>
                  <Text style={styles.reviewCardNumber}>Card {originalIndex + 1}</Text>
                  <View style={[styles.answerBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
                    <Ionicons 
                      name={isCorrect ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={isCorrect ? "#10b981" : "#ef4444"} 
                    />
                    <Text style={[styles.answerBadgeText, isCorrect ? styles.correctBadgeText : styles.incorrectBadgeText]}>
                      {answer}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.reviewCardContent}>
                  <View style={styles.reviewCardSide}>
                    <Text style={styles.reviewCardLabel}>
                      {studySession.showNativeLanguage 
                        ? profile?.native_language || 'Native'
                        : 'English'
                      }:
                    </Text>
                    <Text style={styles.reviewCardText}>
                      {studySession.showNativeLanguage ? card.back : card.front}
                    </Text>
                  </View>
                  
                  <View style={styles.reviewCardSide}>
                    <Text style={styles.reviewCardLabel}>
                      {studySession.showNativeLanguage 
                        ? 'English'
                        : profile?.native_language || 'Native'
                      }:
                    </Text>
                    <Text style={styles.reviewCardText}>
                      {studySession.showNativeLanguage ? card.front : card.back}
                    </Text>
                  </View>
                 
                  {card.pronunciation && (
                    <View style={styles.reviewPronunciation}>
                      <Text style={styles.reviewCardLabel}>Pronunciation:</Text>
                      <Text style={styles.reviewCardText}>{card.pronunciation}</Text>
                      <TouchableOpacity 
                        style={styles.reviewAudioButton} 
                        onPress={() => playPronunciation(card.front)}
                      >
                        <Ionicons name="volume-high" size={16} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {card.example && (
                    <View style={styles.reviewExample}>
                      <Text style={styles.reviewCardLabel}>Example:</Text>
                      <Text style={styles.reviewCardText}>{card.example}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
        
        <View style={styles.reviewActions}>
          <TouchableOpacity 
            style={styles.repeatAllButton}
            onPress={() => {
              // Start a new session with all cards
              setStudySession({
                isActive: true,
                isComplete: false,
                flashcards: studySession.flashcards.sort(() => Math.random() - 0.5), // Shuffle all cards
                currentIndex: 0,
                showAnswer: false,
                answers: [],
                showNativeLanguage: studySession.showNativeLanguage,
                startTime: new Date()
              });
            }}
          >
            <Ionicons name="refresh" size={24} color="#ffffff" />
            <Text style={styles.repeatAllButtonText}>Repeat All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.repeatIncorrectButton}
            onPress={() => {
              // Start a new session with only incorrect cards
              const incorrectCards = studySession.flashcards.filter((card, index) => {
                const answer = studySession.answers[index];
                return answer === 'incorrect' || answer === 'hard';
              });
              
              if (incorrectCards.length === 0) {
                Alert.alert('No Cards to Repeat', 'Great job! You got all cards correct.');
                return;
              }
              
              setStudySession({
                isActive: true,
                isComplete: false,
                flashcards: incorrectCards.sort(() => Math.random() - 0.5), // Shuffle incorrect cards
                currentIndex: 0,
                showAnswer: false,
                answers: [],
                showNativeLanguage: studySession.showNativeLanguage,
                startTime: new Date()
              });
            }}
          >
            <Ionicons name="close-circle" size={24} color="#ffffff" />
            <Text style={styles.repeatIncorrectButtonText}>Repeat Incorrect</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backToSetupButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
            <Text style={styles.backToSetupButtonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback - should not reach here
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No flashcards available</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
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
  // Flashcard Study Session Styles
  studyHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  studyHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  studyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  languageToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  studyContent: {
    flex: 1,
    padding: 20,
  },
  flashcard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  flashcardContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  flashcardText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 16,
  },
  pronunciationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pronunciation: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  audioButton: {
    padding: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  audioButtonPlaying: {
    backgroundColor: '#e2e8f0',
  },
  example: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
  },
  flipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  answerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  correctButton: {
    backgroundColor: '#dcfce7',
  },
  incorrectButton: {
    backgroundColor: '#fef2f2',
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  correctButtonText: {
    color: '#10b981',
  },
  incorrectButtonText: {
    color: '#ef4444',
  },
  // Flashcard Review Session Styles
  reviewHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  reviewSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  scoreContainer: {
    marginBottom: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#6366f1',
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
  },
  scoreText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  reviewStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  reviewStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  activeFilterButton: {
    backgroundColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  reviewContent: {
    flex: 1,
    padding: 20,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  correctReviewCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  incorrectReviewCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewCardNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  correctBadge: {
    backgroundColor: '#dcfce7',
  },
  incorrectBadge: {
    backgroundColor: '#fef2f2',
  },
  answerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  correctBadgeText: {
    color: '#10b981',
  },
  incorrectBadgeText: {
    color: '#ef4444',
  },
  reviewCardContent: {
    gap: 12,
  },
  reviewCardSide: {
    gap: 4,
  },
  reviewCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  reviewCardText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  reviewPronunciation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  reviewAudioButton: {
    padding: 4,
    backgroundColor: '#f0f4ff',
    borderRadius: 4,
  },
  reviewExample: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 4,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  repeatAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  repeatAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  repeatIncorrectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#ef4444',
    borderRadius: 12,
  },
  repeatIncorrectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  backToSetupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#6b7280',
    borderRadius: 12,
  },
  backToSetupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
});
