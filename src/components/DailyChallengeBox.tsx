import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedUnit } from '../contexts/SelectedUnitContext';
import { DailyChallengeService, DailyChallenge } from '../lib/dailyChallengeService';

interface DailyChallengeBoxProps {
  refreshTrigger?: number;
}

// Define all available challenges
const DAILY_CHALLENGES = [
  {
    id: 'flashcard_quiz',
    title: 'Flashcard Quiz',
    description: 'Test your vocabulary knowledge',
    icon: 'card' as const,
    color: '#8b5cf6',
    type: 'game'
  },
  {
    id: 'gravity_game',
    title: 'Gravity Defense',
    description: 'Destroy meteors with correct answers',
    icon: 'planet' as const,
    color: '#8b5cf6',
    type: 'game'
  },
  {
    id: 'hangman',
    title: 'Hangman Challenge',
    description: 'Guess the word letter by letter',
    icon: 'help-circle' as const,
    color: '#8b5cf6',
    type: 'game'
  },
  {
    id: 'memory_match',
    title: 'Memory Match',
    description: 'Match vocabulary pairs',
    icon: 'grid' as const,
    color: '#8b5cf6',
    type: 'game'
  },
  {
    id: 'sentence_scramble',
    title: 'Sentence Scramble',
    description: 'Unscramble the sentences',
    icon: 'shuffle' as const,
    color: '#8b5cf6',
    type: 'game'
  },
  {
    id: 'speed_challenge',
    title: 'Speed Challenge',
    description: 'Answer as fast as you can',
    icon: 'flash' as const,
    color: '#8b5cf6',
    type: 'game'
  },
  {
    id: 'type_what_you_hear',
    title: 'Type What You Hear',
    description: 'Listen and type the words',
    icon: 'headset' as const,
    color: '#8b5cf6',
    type: 'game'
  },
  {
    id: 'word_scramble',
    title: 'Word Scramble',
    description: 'Unscramble the vocabulary',
    icon: 'text' as const,
    color: '#8b5cf6',
    type: 'game'
  },
  {
    id: 'daily_vocab',
    title: 'Daily Vocabulary',
    description: 'Learn new words today',
    icon: 'book' as const,
    color: '#8b5cf6',
    type: 'vocab'
  }
];

export default function DailyChallengeBox({ refreshTrigger }: DailyChallengeBoxProps) {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { selectedUnit } = useSelectedUnit();

  // Load today's challenge
  useEffect(() => {
    if (user?.id) {
      loadTodaysChallenge();
    }
  }, [user?.id, refreshTrigger]);

  const loadTodaysChallenge = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🎯 Loading today\'s daily challenge...');
      
      // Get today's challenge
      let todaysChallenge = await DailyChallengeService.getTodaysChallenge(user.id);
      
      // Create challenge if it doesn't exist
      if (!todaysChallenge) {
        console.log('🎯 No challenge found, creating new one...');
        todaysChallenge = await DailyChallengeService.createTodaysChallenge(user.id);
      }
      
      if (todaysChallenge) {
        console.log('🎯 Daily Challenge loaded:', {
          gameType: todaysChallenge.game_type,
          completed: todaysChallenge.completed,
          xpReward: todaysChallenge.xp_reward
        });
        
        setChallenge(todaysChallenge);
        setIsCompleted(todaysChallenge.completed);
      } else {
        console.error('❌ Failed to load or create daily challenge');
        setChallenge(null);
        setIsCompleted(false);
      }
    } catch (error) {
      console.error('❌ Error loading daily challenge:', error);
      setChallenge(null);
      setIsCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChallengePress = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first.');
      return;
    }

    if (!challenge) {
      Alert.alert('Error', 'No challenge available today.');
      return;
    }

    if (isCompleted) {
      Alert.alert('Challenge Complete!', 'You\'ve already completed today\'s challenge. Come back tomorrow for a new one!');
      return;
    }

    setIsLaunching(true);

    try {
      // Navigate to Games screen with launchGame parameter to directly start the game
      const gameMapping: { [key: string]: string } = {
        'Flashcard Quiz': 'Flashcard Quiz',
        'Memory Match': 'Memory Match',
        'Word Scramble': 'Word Scramble',
        'Hangman': 'Hangman',
        'Speed Challenge': 'Speed Challenge',
        'Planet Defense': 'Planet Defense',
        'Listen & Type': 'Listen & Type',
        'Sentence Scramble': 'Sentence Scramble'
      };

      if (challenge.game_type === 'Daily Vocabulary') {
        // For daily vocab, navigate to vocabulary section
        if (selectedUnit) {
          (navigation as any).navigate('UnitWords', {
            unitId: parseInt(selectedUnit.unit_code.split('.')[1]),
            unitTitle: selectedUnit.unit_title,
            topicGroup: selectedUnit.topic_groups[0],
            unitCode: selectedUnit.unit_code,
            isDailyChallenge: true
          });
        } else {
          (navigation as any).navigate('Flashcards');
        }
      } else {
        // For games, navigate to Games screen with launch parameter
        const gameName = gameMapping[challenge.game_type];
        if (gameName) {
          const gameOptions = getDefaultGameOptions(challenge.game_type);
          console.log('🎯 Daily Challenge - Launching game:', gameName, 'with options:', gameOptions);
          
          (navigation as any).navigate('Games', {
            launchGame: gameName,
            isDailyChallenge: true,
            challengeId: challenge.challenge_date, // Pass challenge ID for completion tracking
            gameOptions: gameOptions
          });
        } else {
          Alert.alert('Coming Soon', 'This challenge will be available soon!');
        }
      }
    } catch (error) {
      console.error('Error launching daily challenge:', error);
      Alert.alert('Error', 'Failed to launch daily challenge. Please try again.');
    } finally {
      // Reset launching state after a delay to show feedback
      setTimeout(() => setIsLaunching(false), 2000);
    }
  };

  // Get default game options for instant play
  const getDefaultGameOptions = (gameType: string) => {
    switch (gameType) {
      case 'Flashcard Quiz':
        return {
          questionCount: 10,
          languageMode: 'mixed',
          selectedTopic: 'All Topics',
          difficulty: 'all'
        };
      case 'Planet Defense':
        return {
          difficulty: 'all',
          gravitySpeed: 1.0,
          selectedTopic: 'All Topics'
        };
      case 'Hangman':
        return {
          wordCount: 10,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      case 'Memory Match':
        return {
          pairCount: 6,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      case 'Sentence Scramble':
        return {
          sentenceCount: 10,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      case 'Speed Challenge':
        return {
          questionCount: 15,
          timeLimit: 60,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      case 'Listen & Type':
        return {
          wordCount: 10,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      case 'Word Scramble':
        return {
          wordCount: 10,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      default:
        return {};
    }
  };

  // Get icon for game type
  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'Flashcard Quiz': return 'help-circle';
      case 'Memory Match': return 'grid';
      case 'Word Scramble': return 'text';
      case 'Hangman': return 'game-controller';
      case 'Speed Challenge': return 'timer';
      case 'Planet Defense': return 'planet';
      case 'Listen & Type': return 'headset';
      case 'Sentence Scramble': return 'shuffle';
      case 'Daily Vocabulary': return 'book';
      default: return 'trophy';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={20} color="#8b5cf6" />
          <Text style={styles.headerTitle}>Daily Challenge</Text>
        </View>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.completedText}>Done!</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading today's challenge...</Text>
        </View>
      ) : !challenge ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No challenge available today</Text>
        </View>
      ) : (
        <>
          {/* Challenge Card */}
          <TouchableOpacity 
            style={[styles.challengeCard, { borderLeftColor: '#8b5cf6' }]}
            onPress={handleChallengePress}
            disabled={isCompleted || isLaunching}
          >
            <View style={styles.challengeContent}>
              <View style={styles.challengeLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#8b5cf6' }]}>
                  <Ionicons 
                    name={getGameIcon(challenge.game_type)} 
                    size={24} 
                    color="#ffffff" 
                  />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>{challenge.game_type}</Text>
                  <Text style={styles.challengeDescription}>
                    {isCompleted 
                      ? `Completed! +${challenge.xp_reward} XP earned`
                      : `Complete to earn ${challenge.xp_reward} bonus XP`
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
                      color="#8b5cf6" 
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
                  {isLaunching ? 'Launching challenge...' : "Start today's challenge"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  challengeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 8,
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
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8b5cf6',
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
});
