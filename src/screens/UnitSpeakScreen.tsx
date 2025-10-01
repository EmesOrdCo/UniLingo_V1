import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { GeneralVocabService, ProcessedVocabItem } from '../lib/generalVocabService';
import { XPService } from '../lib/xpService';
import PronunciationCheck from '../components/PronunciationCheck';
import { PronunciationResult } from '../lib/pronunciationService';

export default function UnitSpeakScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, profile } = useAuth();
  
  const { unitId, unitTitle, topicGroup, unitCode } = (route.params as any) || { 
    unitId: 1, 
    unitTitle: 'Basic Concepts', 
    topicGroup: 'Basic Concepts', 
    unitCode: 'A1.1' 
  };
  
  const [vocabulary, setVocabulary] = useState<ProcessedVocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordScores, setWordScores] = useState<{ [key: number]: number }>({});
  const [wordAttempts, setWordAttempts] = useState<{ [key: number]: number }>({});
  const [totalXP, setTotalXP] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      setLoading(true);
      console.log(`🎤 Loading vocabulary for Speak lesson: ${topicGroup}`);
      
      const vocab = await GeneralVocabService.getVocabByTopicGroup(
        topicGroup, 
        profile?.native_language || 'english'
      );
      
      console.log(`🎤 Loaded ${vocab.length} words for pronunciation practice`);
      
      if (vocab.length === 0) {
        Alert.alert(
          'No Vocabulary Available',
          `No vocabulary found for "${topicGroup}".`,
          [
            { text: 'Go Back', onPress: () => navigation.goBack() }
          ]
        );
        return;
      }
      
      setVocabulary(vocab);
    } catch (error) {
      console.error('❌ Error loading vocabulary:', error);
      Alert.alert(
        'Error',
        `Failed to load vocabulary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [
          { text: 'Go Back', onPress: () => navigation.goBack() },
          { text: 'Retry', onPress: loadVocabulary }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePronunciationComplete = async (result: PronunciationResult) => {
    if (!result.success || !result.assessment || !user) return;

    const currentWord = vocabulary[currentWordIndex];
    const score = result.assessment.pronunciationScore;
    const currentAttempts = wordAttempts[currentWordIndex] || 0;

    // Update score (keep highest score)
    const previousScore = wordScores[currentWordIndex] || 0;
    if (score > previousScore) {
      setWordScores(prev => ({ ...prev, [currentWordIndex]: score }));
    }

    // Update attempts
    const newAttempts = currentAttempts + 1;
    setWordAttempts(prev => ({ ...prev, [currentWordIndex]: newAttempts }));

    // Calculate XP based on score
    let earnedXP = 0;
    if (score >= 90) {
      earnedXP = 15; // Excellent
    } else if (score >= 75) {
      earnedXP = 10; // Good
    } else if (score >= 60) {
      earnedXP = 5; // Fair
    } else {
      earnedXP = 2; // Attempted
    }

    // Award XP
    try {
      const xpResult = await XPService.awardXP(
        user.id,
        'exercise', // activityType
        score, // score
        100, // maxScore (pronunciation is out of 100)
        score, // accuracyPercentage (same as score for pronunciation)
        'Pronunciation Practice', // activityName
        30 // durationSeconds (estimated)
      );
      
      if (xpResult) {
        setTotalXP(prev => prev + xpResult.totalXP);
        console.log(`✨ Awarded ${xpResult.totalXP} XP for pronunciation (score: ${score})`);
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    }

    // Check if should move to next word
    if (score >= 60 || newAttempts >= MAX_ATTEMPTS) {
      // Move to next word after a delay (so user can see feedback)
      setTimeout(() => {
        moveToNextWord();
      }, 2000);
    }
  };

  const moveToNextWord = () => {
    if (currentWordIndex < vocabulary.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // Lesson complete!
      completeLesson();
    }
  };

  const completeLesson = async () => {
    setIsCompleted(true);

    // Calculate final stats
    const totalWords = vocabulary.length;
    const averageScore = Object.values(wordScores).reduce((a, b) => a + b, 0) / totalWords;
    const bonusXP = Math.round(averageScore / 10); // Bonus based on average score

    if (user && bonusXP > 0) {
      try {
        const xpResult = await XPService.awardXP(
          user.id,
          'exercise', // activityType
          Math.round(averageScore), // score (average pronunciation score)
          100, // maxScore
          Math.round(averageScore), // accuracyPercentage
          'Speak Lesson Complete', // activityName
          totalWords * 30 // durationSeconds (estimated based on words completed)
        );
        
        if (xpResult) {
          setTotalXP(prev => prev + xpResult.totalXP);
          console.log(`🎉 Awarded ${xpResult.totalXP} XP for completing Speak lesson`);
        }
      } catch (error) {
        console.error('Error awarding bonus XP:', error);
      }
    }
  };

  const currentWord = vocabulary[currentWordIndex];
  const currentAttempts = wordAttempts[currentWordIndex] || 0;
  const currentScore = wordScores[currentWordIndex];
  const attemptsRemaining = MAX_ATTEMPTS - currentAttempts;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading pronunciation lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    const totalWords = vocabulary.length;
    const averageScore = Object.values(wordScores).reduce((a, b) => a + b, 0) / totalWords;
    const perfectWords = Object.values(wordScores).filter(score => score >= 90).length;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.completedContainer}>
          <View style={styles.completedHeader}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            <Text style={styles.completedTitle}>Lesson Complete! 🎉</Text>
            <Text style={styles.completedSubtitle}>{topicGroup}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalWords}</Text>
              <Text style={styles.statLabel}>Words Practiced</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(averageScore)}</Text>
              <Text style={styles.statLabel}>Average Score</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{perfectWords}</Text>
              <Text style={styles.statLabel}>Perfect Scores</Text>
            </View>
          </View>

          <View style={styles.xpCard}>
            <Ionicons name="star" size={32} color="#f59e0b" />
            <Text style={styles.xpText}>+{totalXP} XP Earned</Text>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Speak Practice</Text>
          <Text style={styles.headerSubtitle}>{topicGroup}</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="star" size={20} color="#f59e0b" />
          <Text style={styles.xpCounter}>{totalXP}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentWordIndex + 1) / vocabulary.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Word {currentWordIndex + 1} of {vocabulary.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Score */}
        {currentScore !== undefined && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Best Score:</Text>
            <Text style={styles.scoreValue}>{Math.round(currentScore)}/100</Text>
          </View>
        )}

        {/* Pronunciation Check Component */}
        {currentWord && (
          <PronunciationCheck
            word={currentWord.english_term}
            onComplete={handlePronunciationComplete}
            maxRecordingDuration={5000}
          />
        )}

        {/* Attempts Info */}
        <View style={styles.attemptsCard}>
          <Ionicons 
            name={attemptsRemaining > 1 ? 'refresh-circle' : 'alert-circle'} 
            size={20} 
            color={attemptsRemaining > 1 ? '#3b82f6' : '#f59e0b'} 
          />
          <Text style={styles.attemptsText}>
            {attemptsRemaining > 0 
              ? `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining` 
              : 'Moving to next word...'}
          </Text>
        </View>

        {/* Definition Card */}
        {currentWord && (
          <View style={styles.definitionCard}>
            <Text style={styles.definitionLabel}>Definition:</Text>
            <Text style={styles.definitionText}>{currentWord.definition}</Text>
            {currentWord.example_sentence && (
              <>
                <Text style={styles.exampleLabel}>Example:</Text>
                <Text style={styles.exampleText}>"{currentWord.example_sentence}"</Text>
              </>
            )}
          </View>
        )}

        {/* Skip Button */}
        {attemptsRemaining > 0 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={moveToNextWord}
          >
            <Text style={styles.skipButtonText}>Skip This Word</Text>
            <Ionicons name="arrow-forward" size={16} color="#64748b" />
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpCounter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  progressSection: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  attemptsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  attemptsText: {
    fontSize: 14,
    color: '#64748b',
  },
  definitionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  definitionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 24,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  // Completion Screen Styles
  completedContainer: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  xpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef3c7',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 32,
  },
  xpText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  doneButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 25,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
