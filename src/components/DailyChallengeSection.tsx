import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedUnit } from '../contexts/SelectedUnitContext';
import { DailyChallengeService, DailyChallenge } from '../lib/dailyChallengeService';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { useTranslation } from '../lib/i18n';

interface DailyChallengeSectionProps {
  refreshTrigger?: number;
}


export default function DailyChallengeSection({ refreshTrigger }: DailyChallengeSectionProps) {
  const { t } = useTranslation();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { selectedUnit } = useSelectedUnit();

  // Define all available challenges with translations
  const DAILY_CHALLENGES = [
    {
      id: 'flashcard_quiz',
      title: t('games.flashcardQuiz'),
      description: t('dailyChallenge.flashcardQuizDescription'),
      icon: 'card' as const,
      color: '#8b5cf6',
      type: 'game'
    },
    {
      id: 'gravity_game',
      title: t('games.gravityGame'),
      description: t('dailyChallenge.gravityGameDescription'),
      icon: 'planet' as const,
      color: '#8b5cf6',
      type: 'game'
    },
    {
      id: 'hangman',
      title: t('games.hangman'),
      description: t('dailyChallenge.hangmanDescription'),
      icon: 'help-circle' as const,
      color: '#8b5cf6',
      type: 'game'
    },
    {
      id: 'memory_match',
      title: t('games.memoryMatch'),
      description: t('dailyChallenge.memoryMatchDescription'),
      icon: 'grid' as const,
      color: '#8b5cf6',
      type: 'game'
    },
    {
      id: 'sentence_scramble',
      title: t('games.sentenceScramble'),
      description: t('dailyChallenge.sentenceScrambleDescription'),
      icon: 'shuffle' as const,
      color: '#8b5cf6',
      type: 'game'
    },
    {
      id: 'speed_challenge',
      title: t('games.speedChallenge'),
      description: t('dailyChallenge.speedChallengeDescription'),
      icon: 'flash' as const,
      color: '#8b5cf6',
      type: 'game'
    },
    {
      id: 'type_what_you_hear',
      title: t('games.typeWhatYouHear'),
      description: t('dailyChallenge.typeWhatYouHearDescription'),
      icon: 'headset' as const,
      color: '#8b5cf6',
      type: 'game'
    },
    {
      id: 'word_scramble',
      title: t('games.wordScramble'),
      description: t('dailyChallenge.wordScrambleDescription'),
      icon: 'text' as const,
      color: '#8b5cf6',
      type: 'game'
    },
    {
      id: 'daily_vocab',
      title: t('dailyChallenge.dailyVocabulary'),
      description: t('dailyChallenge.dailyVocabularyDescription'),
      icon: 'book' as const,
      color: '#8b5cf6',
      type: 'vocab'
    }
  ];

  // Load today's challenge
  useEffect(() => {
    if (user?.id) {
      loadTodaysChallenge();
    }
  }, [user?.id, refreshTrigger]);

  const loadTodaysChallenge = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      let todaysChallenge = await DailyChallengeService.getTodaysChallenge(user.id);
      
      if (!todaysChallenge) {
        todaysChallenge = await DailyChallengeService.createTodaysChallenge(user.id);
      }
      
      setChallenge(todaysChallenge);
      setIsCompleted(todaysChallenge.completed || false);
    } catch (error) {
      console.error('Error loading daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGameIcon = (gameType: string) => {
    const challenge = DAILY_CHALLENGES.find(c => c.id === gameType);
    return challenge?.icon || 'game-controller';
  };

  const handleChallengePress = async () => {
    if (!challenge || isCompleted || isLaunching) return;

    // Check if user has flashcards
    try {
      const flashcards = await UserFlashcardService.getUserFlashcards();
      
      if (flashcards.length === 0) {
        Alert.alert(
          t('games.noFlashcardsModal.title'),
          t('games.noFlashcardsModal.message'),
          [
            {
              text: t('games.noFlashcardsModal.goToFlashcards'),
              onPress: () => navigation.navigate('Flashcards' as never)
            },
            {
              text: t('games.noFlashcardsModal.ok'),
              style: 'cancel'
            }
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Error checking flashcards:', error);
      Alert.alert(
        'Error',
        'Unable to check flashcards. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLaunching(true);

    try {
      // Navigate to games screen with the challenge game
      navigation.navigate('Games' as never, {
        launchGame: challenge.game_type,
        fromChallenge: true
      } as never);
    } catch (error) {
      console.error('Error launching challenge:', error);
      Alert.alert(
        'Error',
        'Unable to launch the challenge. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLaunching(false);
    }
  };

  // Don't render anything if loading or no challenge
  if (loading || !challenge) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Title - matches GameStatsSection aesthetic */}
      <View style={styles.sectionTitleContainer}>
        <Ionicons name="trophy" size={24} color="#6366f1" />
        <Text style={styles.standardSectionTitle}>{t('games.dailyChallenge')}</Text>
      </View>

      {/* Challenge Card */}
      <TouchableOpacity 
        style={[styles.challengeCard, { borderLeftColor: '#6366f1' }]}
        onPress={handleChallengePress}
        disabled={isCompleted || isLaunching}
      >
        <View style={styles.challengeContent}>
          <View style={styles.challengeLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#6366f1' }]}>
              <Ionicons 
                name={getGameIcon(challenge.game_type)} 
                size={24} 
                color="#ffffff" 
              />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>
                {(() => {
                  // Handle both old English names and new IDs
                  const challengeData = DAILY_CHALLENGES.find(c => c.id === challenge.game_type);
                  if (challengeData) {
                    return challengeData.title;
                  }
                  // Fallback: try to find by old English name
                  const oldNameMap: { [key: string]: string } = {
                    'Listen & Type': t('games.typeWhatYouHear'),
                    'Flashcard Quiz': t('games.flashcardQuiz'),
                    'Memory Match': t('games.memoryMatch'),
                    'Word Scramble': t('games.wordScramble'),
                    'Hangman': t('games.hangman'),
                    'Speed Challenge': t('games.speedChallenge'),
                    'Planet Defense': t('games.gravityGame'),
                    'Sentence Scramble': t('games.sentenceScramble'),
                  };
                  return oldNameMap[challenge.game_type] || challenge.game_type;
                })()}
              </Text>
              <Text style={styles.challengeDescription}>
                {isCompleted 
                  ? `${t('dailyChallenge.completed')} +${challenge.xp_reward} ${t('dailyChallenge.xpEarned')}`
                  : t('games.completeToEarn')
                }
              </Text>
            </View>
          </View>
          
          <View style={styles.challengeRight}>
            {isCompleted ? (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.completedText}>Done!</Text>
              </View>
            ) : (
              <View style={styles.playButton}>
                <Ionicons 
                  name={isLaunching ? "hourglass" : "play"} 
                  size={16} 
                  color="#6366f1" 
                />
              </View>
            )}
          </View>
        </View>

        {/* Progress indicator */}
        {!isCompleted && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { backgroundColor: '#8b5cf6', width: '0%' }]} />
            </View>
            <Text style={styles.progressText}>
              {isLaunching ? 'Launching challenge...' : t('games.startTodaysChallenge')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  standardSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  challengeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  challengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  challengeRight: {
    alignItems: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});