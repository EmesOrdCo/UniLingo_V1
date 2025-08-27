import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Speech from 'expo-speech';

const { width } = Dimensions.get('window');

interface LessonReviewRouteParams {
  lessonTitle: string;
  lessonSubject: string;
  vocabulary: Array<{
    id: string;
    term: string;
    definition: string;
    example?: string;
    pronunciation?: string;
  }>;
  finalScore: number;
  maxPossibleScore: number;
}

export default function LessonReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { lessonTitle, lessonSubject, vocabulary, finalScore, maxPossibleScore } = route.params as LessonReviewRouteParams;
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());

  const currentCard = vocabulary[currentCardIndex];
  const progressPercentage = ((currentCardIndex + 1) / vocabulary.length) * 100;

  useEffect(() => {
    // Mark current card as reviewed
    if (currentCard) {
      setReviewedCards(prev => new Set(prev).add(currentCard.id));
    }
  }, [currentCardIndex, currentCard]);

  const handleNextCard = () => {
    if (currentCardIndex < vocabulary.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      // All cards reviewed
      Alert.alert(
        'Review Complete! 🎓',
        'Great job! You\'ve reviewed all the vocabulary from this lesson.',
        [
          {
            text: 'Back to Lessons',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const speakText = async (text: string, language: string = 'en') => {
    if (isAudioPlaying) {
      Speech.stop();
      setIsAudioPlaying(false);
      return;
    }

    try {
      setIsAudioPlaying(true);
      await Speech.speak(text, {
        language: language,
        rate: 0.8,
        pitch: 1.0,
      });
      setIsAudioPlaying(false);
    } catch (error) {
      console.error('Speech error:', error);
      setIsAudioPlaying(false);
    }
  };

  const getScoreMessage = () => {
    const percentage = Math.round((finalScore / maxPossibleScore) * 100);
    if (percentage >= 90) return '🏆 Excellent! You\'re a master of this topic!';
    if (percentage >= 80) return '🌟 Great job! You have a solid understanding!';
    if (percentage >= 70) return '👍 Good work! Keep practicing to improve!';
    if (percentage >= 60) return '💪 Not bad! Review the material to strengthen your knowledge!';
    return '📚 Keep studying! Review the vocabulary to improve your score!';
  };

  if (!currentCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No vocabulary found for review</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Lesson Review</Text>
          <Text style={styles.headerSubtitle}>{lessonTitle}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Score Summary */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreTitle}>Lesson Results</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scorePercentage}>
            {Math.round((finalScore / maxPossibleScore) * 100)}%
          </Text>
        </View>
        <Text style={styles.scoreText}>
          {finalScore} / {maxPossibleScore} points
        </Text>
        <Text style={styles.scoreMessage}>{getScoreMessage()}</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Vocabulary {currentCardIndex + 1} of {vocabulary.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Review Card */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSubject}>{lessonSubject}</Text>
            <View style={styles.cardActions}>
              {currentCard.pronunciation && (
                <TouchableOpacity 
                  style={styles.audioButton}
                  onPress={() => speakText(currentCard.term)}
                >
                  <Ionicons 
                    name={isAudioPlaying ? "volume-high" : "volume-high-outline"} 
                    size={20} 
                    color={isAudioPlaying ? "#6366f1" : "#64748b"} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.questionSection}>
            <Text style={styles.questionLabel}>Term:</Text>
            <Text style={styles.questionText}>{currentCard.term}</Text>
          </View>

          <TouchableOpacity 
            style={styles.answerButton} 
            onPress={toggleAnswer}
          >
            <Text style={styles.answerButtonText}>
              {showAnswer ? 'Hide Definition' : 'Show Definition'}
            </Text>
          </TouchableOpacity>

          {showAnswer && (
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Definition:</Text>
              <Text style={styles.answerText}>{currentCard.definition}</Text>
              {currentCard.example && (
                <>
                  <Text style={styles.exampleLabel}>Example:</Text>
                  <Text style={styles.exampleText}>{currentCard.example}</Text>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[styles.navButton, currentCardIndex === 0 && styles.navButtonDisabled]} 
          onPress={handlePreviousCard}
          disabled={currentCardIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentCardIndex === 0 ? "#9ca3af" : "#1e293b"} />
          <Text style={[styles.navButtonText, currentCardIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton} 
          onPress={handleNextCard}
        >
          <Text style={styles.navButtonText}>
            {currentCardIndex === vocabulary.length - 1 ? 'Finish' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#1e293b" />
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
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scorePercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioButton: {
    padding: 8,
    borderRadius: 8,
  },
  questionSection: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 32,
  },
  answerButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  answerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  answerSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 18,
    color: '#1e293b',
    lineHeight: 26,
    marginBottom: 16,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 16,
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    minWidth: 120,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#f1f5f9',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginHorizontal: 8,
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});
