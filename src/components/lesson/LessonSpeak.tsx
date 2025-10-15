import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PronunciationCheck from '../PronunciationCheck';
import LeaveConfirmationModal from './LeaveConfirmationModal';

interface LessonSpeakProps {
  vocabulary: any[];
  onComplete: (score: number) => void;
  onClose: () => void;
  onProgressUpdate?: (questionIndex: number) => void;
  initialQuestionIndex?: number;
}

export default function LessonSpeak({ 
  vocabulary, 
  onComplete, 
  onClose, 
  onProgressUpdate, 
  initialQuestionIndex = 0 
}: LessonSpeakProps) {
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [scores, setScores] = useState<number[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [currentWordPassed, setCurrentWordPassed] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(currentIndex);
    }
  }, [currentIndex]);

  const handleClose = () => {
    setShowLeaveModal(true);
  };

  const currentVocab = vocabulary[currentIndex];
  const currentWord = currentVocab?.keywords || currentVocab?.english_term || currentVocab?.term || '';
  const currentSentence = currentVocab?.example_sentence_target || currentVocab?.example;
  
  console.log('🎤 Current vocab for speaking:', currentVocab);
  console.log('🎤 Word to pronounce:', currentWord);
  console.log('🎤 Example sentence:', currentSentence);

  const handlePronunciationResult = (result: any) => {
    const pronunciationScore = result.assessment?.pronunciationScore || 0;
    // Convert to binary scoring: 60+ = 1 point, <60 = 0 points
    const binaryScore = pronunciationScore >= 60 ? 1 : 0;
    
    console.log('🎤 Pronunciation result:', {
      word: currentWord,
      pronunciationScore: pronunciationScore,
      binaryScore: binaryScore,
      recognizedText: result.assessment?.recognizedText,
      accuracyScore: result.assessment?.accuracyScore
    });
    
    // Haptic feedback based on pronunciation result
    if (binaryScore === 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    setScores(prev => [...prev, binaryScore]);
    setTotalScore(prev => prev + binaryScore);
    setCurrentWordPassed(true);
  };

  const moveToNextWord = () => {
    // Light haptic for moving to next question
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentWordPassed(false);
    } else {
      // Exercise complete - use total binary score (0 to vocabulary.length)
      const exerciseScore = totalScore; // Already binary: 0, 1, 2, 3, etc.
      setGameComplete(true);
      // Don't auto-navigate, let user choose Retry or Continue
    }
  };

  const handleRetry = () => {
    // Reset all state to restart the exercise
    setCurrentIndex(0);
    setScores([]);
    setTotalScore(0);
    setCurrentWordPassed(false);
    setGameComplete(false);
  };

  const handleContinue = () => {
    onComplete(totalScore);
    onClose();
  };

  if (gameComplete) {
    const passedWords = scores.filter(s => s === 1).length; // Count words with binary score of 1
    const totalWords = scores.length;
    const accuracyPercentage = Math.round((passedWords / totalWords) * 100);
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Speak Exercise Complete!</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.completionScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.completionContainer}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            </View>
            
            <Text style={styles.completionTitle}>🎉 Outstanding Work!</Text>
            <Text style={styles.completionSubtitle}>
              Great job practicing your pronunciation
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{passedWords}</Text>
                <Text style={styles.statLabel}>Passed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalWords}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{accuracyPercentage}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>

            {/* Performance Message */}
            <View style={styles.performanceContainer}>
              <Text style={styles.performanceText}>
                {passedWords === totalWords
                  ? "Perfect! You pronounced every word correctly! 🌟"
                  : passedWords >= totalWords * 0.8
                  ? "Excellent! You're mastering pronunciation! 🎯"
                  : passedWords >= totalWords * 0.6
                  ? "Great job! Keep practicing to improve! 💪"
                  : "Nice try! Practice makes perfect! 🚀"
                }
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Ionicons name="refresh" size={20} color="#6366f1" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Leave Confirmation Modal */}
        <LeaveConfirmationModal
          visible={showLeaveModal}
          onLeave={onClose}
          onCancel={() => setShowLeaveModal(false)}
        />
      </SafeAreaView>
    );
  }

  if (!currentVocab) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading exercise...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Speak Exercise</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Word {currentIndex + 1} of {vocabulary.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentIndex + 1) / vocabulary.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.scoreText}>Score: {totalScore}/{vocabulary.length}</Text>
        </View>

        {/* Pronunciation Assessment */}
        <View style={styles.pronunciationContainer}>
          <PronunciationCheck
            key={`pronunciation-${currentIndex}`}
            word={currentWord}
            onResult={handlePronunciationResult}
            disabled={currentWordPassed}
            maxRecordingDuration={5000}
          />
        </View>

        {/* Next Button */}
        {currentWordPassed && (
          <View style={styles.nextButtonContainer}>
            <TouchableOpacity style={styles.nextButton} onPress={moveToNextWord}>
              <Text style={styles.nextButtonText}>
                {currentIndex < vocabulary.length - 1 ? 'Next Word' : 'Complete Exercise'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Leave Confirmation Modal */}
      <LeaveConfirmationModal
        visible={showLeaveModal}
        onLeave={onClose}
        onCancel={() => setShowLeaveModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  pronunciationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nextButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nextButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completionIcon: {
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  completionScrollView: {
    flex: 1,
  },
  performanceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  performanceText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

