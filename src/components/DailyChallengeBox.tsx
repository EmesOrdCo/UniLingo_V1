import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedUnit } from '../contexts/SelectedUnitContext';

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
    color: '#6366f1',
    type: 'game'
  },
  {
    id: 'gravity_game',
    title: 'Gravity Defense',
    description: 'Destroy meteors with correct answers',
    icon: 'planet' as const,
    color: '#4f46e5',
    type: 'game'
  },
  {
    id: 'hangman',
    title: 'Hangman Challenge',
    description: 'Guess the word letter by letter',
    icon: 'help-circle' as const,
    color: '#5b21b6',
    type: 'game'
  },
  {
    id: 'memory_match',
    title: 'Memory Match',
    description: 'Match vocabulary pairs',
    icon: 'grid' as const,
    color: '#7c3aed',
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
    color: '#6366f1',
    type: 'game'
  },
  {
    id: 'type_what_you_hear',
    title: 'Type What You Hear',
    description: 'Listen and type the words',
    icon: 'headset' as const,
    color: '#4338ca',
    type: 'game'
  },
  {
    id: 'word_scramble',
    title: 'Word Scramble',
    description: 'Unscramble the vocabulary',
    icon: 'text' as const,
    color: '#6366f1',
    type: 'game'
  },
  {
    id: 'daily_vocab',
    title: 'Daily Vocabulary',
    description: 'Learn new words today',
    icon: 'book' as const,
    color: '#6366f1',
    type: 'vocab'
  }
];

export default function DailyChallengeBox({ refreshTrigger }: DailyChallengeBoxProps) {
  const [todaysChallenge, setTodaysChallenge] = useState(DAILY_CHALLENGES[0]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { selectedUnit } = useSelectedUnit();

  // Calculate today's challenge based on current date
  useEffect(() => {
    const today = new Date();
    // Use a more reliable method to calculate day of year
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Ensure we get a different challenge each day
    const challengeIndex = dayOfYear % DAILY_CHALLENGES.length;
    const selectedChallenge = DAILY_CHALLENGES[challengeIndex];
    
    console.log(`🎯 Daily Challenge: Day ${dayOfYear} -> Challenge ${challengeIndex} (${selectedChallenge.title})`);
    setTodaysChallenge(selectedChallenge);
    
    // Check if challenge is completed (could be implemented with AsyncStorage or backend)
    // For now, we'll just simulate it based on a simple check
    const completionKey = `daily_challenge_${today.toDateString()}_${selectedChallenge.id}`;
    // You could use AsyncStorage here: AsyncStorage.getItem(completionKey)
    setIsCompleted(false);
  }, [refreshTrigger]);

  const handleChallengePress = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first.');
      return;
    }

    setIsLaunching(true);

    try {
      // Navigate to Games screen with launchGame parameter to directly start the game
      const gameMapping = {
        'flashcard_quiz': 'Flashcard Quiz',
        'gravity_game': 'Planet Defense',
        'hangman': 'Hangman',
        'memory_match': 'Memory Match',
        'sentence_scramble': 'Sentence Scramble',
        'speed_challenge': 'Speed Challenge',
        'type_what_you_hear': 'Listen & Type',
        'word_scramble': 'Word Scramble'
      };

      if (todaysChallenge.id === 'daily_vocab') {
        // For daily vocab, navigate to vocabulary section
        if (selectedUnit) {
          navigation.navigate('UnitWords' as never, {
            unitId: parseInt(selectedUnit.unit_code.split('.')[1]),
            unitTitle: selectedUnit.unit_title,
            topicGroup: selectedUnit.topic_groups[0],
            unitCode: selectedUnit.unit_code,
            isDailyChallenge: true
          });
        } else {
          navigation.navigate('Flashcards' as never);
        }
      } else {
        // For games, navigate to Games screen with launch parameter
        const gameName = gameMapping[todaysChallenge.id];
        if (gameName) {
          navigation.navigate('Games' as never, {
            launchGame: gameName,
            isDailyChallenge: true,
            // Pass default game options for instant play
            gameOptions: getDefaultGameOptions(todaysChallenge.id)
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
  const getDefaultGameOptions = (gameId: string) => {
    switch (gameId) {
      case 'flashcard_quiz':
        return {
          questionCount: 10,
          languageMode: 'english',
          selectedTopic: 'All Topics',
          difficulty: 'all'
        };
      case 'gravity_game':
        return {
          difficulty: 'all',
          gravitySpeed: 1.0,
          selectedTopic: 'All Topics'
        };
      case 'hangman':
        return {
          wordCount: 10,
          difficulty: 'all',
          maxGuesses: 6,
          selectedTopic: 'All Topics'
        };
      case 'memory_match':
        return {
          pairCount: 6,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      case 'sentence_scramble':
        return {
          sentenceCount: 10,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      case 'speed_challenge':
        return {
          questionCount: 15,
          timeLimit: 60,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      case 'type_what_you_hear':
        return {
          wordCount: 10,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      case 'word_scramble':
        return {
          wordCount: 10,
          difficulty: 'all',
          selectedTopic: 'All Topics'
        };
      default:
        return {};
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={20} color="#6366f1" />
          <Text style={styles.headerTitle}>Daily Challenge</Text>
        </View>
      </View>

      {/* Challenge Card */}
      <TouchableOpacity 
        style={[styles.challengeCard, { borderLeftColor: todaysChallenge.color }]}
        onPress={handleChallengePress}
        disabled={isCompleted || isLaunching}
      >
        <View style={styles.challengeContent}>
          <View style={styles.challengeLeft}>
            <View style={[styles.iconContainer, { backgroundColor: todaysChallenge.color }]}>
              <Ionicons 
                name={todaysChallenge.icon} 
                size={24} 
                color="#ffffff" 
              />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>{todaysChallenge.title}</Text>
              <Text style={styles.challengeDescription}>{todaysChallenge.description}</Text>
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
              <View style={[styles.progressFill, { backgroundColor: todaysChallenge.color, width: '0%' }]} />
            </View>
            <Text style={styles.progressText}>
              {isLaunching ? 'Launching challenge...' : "Start today's challenge"}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Daily rotation info */}
      <Text style={styles.rotationInfo}>
        🔄 Challenge changes daily • {todaysChallenge.type === 'game' ? 'Game' : 'Vocabulary'} focus today
      </Text>
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
    backgroundColor: '#eef2ff',
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
  rotationInfo: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
