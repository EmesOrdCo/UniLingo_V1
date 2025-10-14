import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PronunciationCheck from '../PronunciationCheck';
import { PronunciationResult } from '../../lib/pronunciationService';
import LeaveConfirmationModal from './LeaveConfirmationModal';

const { width } = Dimensions.get('window');

interface LessonConversationProps {
  vocabulary: any[];
  conversationData: {
    conversation: Array<{
      speaker: string;
      message: string;
    }>;
  } | null;
  onComplete: (score: number) => void;
  onClose: () => void;
}

interface RoleplayExercise {
  type: 'speak';
  keyword: string;
  sentence: string;
  vocabulary: any;
}

interface ExerciseState {
  isActive: boolean;
  exercise: RoleplayExercise | null;
  isCompleted: boolean;
  score: number;
}

export default function LessonConversation({
  vocabulary,
  conversationData,
  onComplete,
  onClose,
}: LessonConversationProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  const [conversationHistory, setConversationHistory] = useState<
    Array<{
      type: 'app' | 'user';
      french: string;
      english: string;
    }>
  >([]);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  const [lastResult, setLastResult] = useState<PronunciationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exerciseState, setExerciseState] = useState<ExerciseState>({
    isActive: false,
    exercise: null,
    isCompleted: false,
    score: 0,
  });
  const [exerciseCreatedForMessage, setExerciseCreatedForMessage] = useState<number>(-1);

  // Initialize with first Assistant message
  useEffect(() => {
    if (conversationData && conversationData.conversation && conversationData.conversation.length > 0) {
      const firstAssistantMsg = conversationData.conversation.find((msg) => msg.speaker === 'Assistant' || msg.speaker === 'Person A');
      if (firstAssistantMsg) {
        setConversationHistory([
          {
            type: 'app',
            french: firstAssistantMsg.message,
            english: firstAssistantMsg.message,
          },
        ]);
      }
    }
  }, [conversationData]);

  // Auto-scroll to bottom when conversation history updates
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversationHistory, exerciseState.isActive]);

  const getCurrentExchange = () => {
    if (!conversationData || !conversationData.conversation) {
      return null;
    }

    const userMessages = conversationData.conversation.filter((msg) => msg.speaker === 'User');
    const assistantMessages = conversationData.conversation.filter(
      (msg) => msg.speaker === 'Assistant' || msg.speaker === 'Person A'
    );

    if (currentExchangeIndex < userMessages.length) {
      const userMsg = userMessages[currentExchangeIndex];
      const assistantMsg = assistantMessages[currentExchangeIndex] || assistantMessages[0];

      return {
        appMessage: {
          french: assistantMsg.message,
          english: assistantMsg.message,
        },
        userMessage: {
          french: userMsg.message,
          english: userMsg.message,
        },
      };
    }

    return null;
  };

  const createSpeakExerciseForCurrentMessage = () => {
    const currentExchange = getCurrentExchange();
    if (!currentExchange) return;

    const userMessage = currentExchange.userMessage.french;
    const words = userMessage.split(/\s+/);
    const targetWord = words[Math.floor(Math.random() * words.length)];

    const matchingVocab =
      vocabulary.find(
        (v) =>
          v.keywords?.toLowerCase().includes(targetWord.toLowerCase()) ||
          v.english_term?.toLowerCase().includes(targetWord.toLowerCase())
      ) || vocabulary[Math.floor(Math.random() * vocabulary.length)];

    const exerciseWord = matchingVocab?.keywords || matchingVocab?.english_term || targetWord;

    const exercise: RoleplayExercise = {
      type: 'speak',
      keyword: exerciseWord,
      sentence: userMessage,
      vocabulary: matchingVocab,
    };

    setExerciseState({
      isActive: true,
      exercise: exercise,
      isCompleted: false,
      score: 0,
    });
    setExerciseCreatedForMessage(currentExchangeIndex);
    setShowResult(false);
    setIsCorrect(false);
    setAttemptKey((prev) => prev + 1);
  };

  const handlePronunciationResult = (result: PronunciationResult) => {
    setLastResult(result);
    const pronunciationScore = result.assessment?.pronunciationScore || 0;
    const passed = pronunciationScore >= 60;

    setIsCorrect(passed);
    setShowResult(true);

    if (passed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore((prev) => prev + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleContinueAfterExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentExchange = getCurrentExchange();
    if (!currentExchange) return;

    setConversationHistory((prev) => [
      ...prev,
      {
        type: 'user',
        french: currentExchange.userMessage.french,
        english: currentExchange.userMessage.english,
      },
    ]);

    setExerciseState({
      isActive: false,
      exercise: null,
      isCompleted: true,
      score: exerciseState.score,
    });

    setTimeout(() => {
      const nextExchange = currentExchangeIndex + 1;
      const totalExchanges = conversationData?.conversation.filter((msg) => msg.speaker === 'User').length || 0;

      if (nextExchange < totalExchanges) {
        setCurrentExchangeIndex(nextExchange);
        setShowResult(false);
        setIsCorrect(false);

        const nextAssistantMsg = conversationData?.conversation.filter(
          (msg) => msg.speaker === 'Assistant' || msg.speaker === 'Person A'
        )[nextExchange];

        if (nextAssistantMsg) {
          setConversationHistory((prev) => [
            ...prev,
            {
              type: 'app',
              french: nextAssistantMsg.message,
              english: nextAssistantMsg.message,
            },
          ]);
        }
      } else {
        setCompleted(true);
      }
    }, 500);
  };

  const handleRetry = () => {
    setConversationHistory([]);
    setCurrentExchangeIndex(0);
    setShowResult(false);
    setIsCorrect(false);
    setScore(0);
    setCompleted(false);
    setExerciseState({
      isActive: false,
      exercise: null,
      isCompleted: false,
      score: 0,
    });
    setExerciseCreatedForMessage(-1);

    if (conversationData && conversationData.conversation && conversationData.conversation.length > 0) {
      const firstAssistantMsg = conversationData.conversation.find((msg) => msg.speaker === 'Assistant' || msg.speaker === 'Person A');
      if (firstAssistantMsg) {
        setConversationHistory([
          {
            type: 'app',
            french: firstAssistantMsg.message,
            english: firstAssistantMsg.message,
          },
        ]);
      }
    }
  };

  const handleContinue = () => {
    onComplete(score);
    onClose();
  };

  const handleClose = () => {
    setShowLeaveModal(true);
  };

  const totalExchanges = conversationData?.conversation.filter((msg) => msg.speaker === 'User').length || 0;

  // Show exercises when applicable
  const showExercise =
    !exerciseState.isActive &&
    !completed &&
    exerciseCreatedForMessage !== currentExchangeIndex &&
    conversationHistory.length > 0 &&
    currentExchangeIndex < totalExchanges;

  if (!conversationData || conversationData.conversation.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (completed) {
    const accuracyPercentage = totalExchanges > 0 ? Math.round((score / totalExchanges) * 100) : 0;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversation Complete!</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.completionScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.completionContainer}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            </View>

            <Text style={styles.completionTitle}>🎉 Outstanding Work!</Text>
            <Text style={styles.completionSubtitle}>Great job practicing your conversation skills</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Passed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalExchanges}</Text>
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
                {score === totalExchanges
                  ? "Perfect! You nailed every exchange! 🌟"
                  : score >= totalExchanges * 0.8
                  ? "Excellent! You're mastering conversations! 🎯"
                  : score >= totalExchanges * 0.6
                  ? "Great job! Keep practicing to improve! 💪"
                  : "Nice try! Practice makes perfect! 🚀"}
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
        <LeaveConfirmationModal visible={showLeaveModal} onLeave={onClose} onCancel={() => setShowLeaveModal(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversation</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Exchange {currentExchangeIndex + 1} of {totalExchanges}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentExchangeIndex + 1) / totalExchanges) * 100}%` }]} />
        </View>
        <Text style={styles.scoreText}>
          Score: {score}/{totalExchanges}
        </Text>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.conversationContainer}>
          {conversationHistory.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                message.type === 'app' ? styles.appMessageBubble : styles.userMessageBubble,
              ]}
            >
              <Text style={[styles.messageText, message.type === 'app' ? styles.appMessageText : styles.userMessageText]}>
                {message.french}
              </Text>
            </View>
          ))}

          {/* Show exercise after conversation history */}
          {showExercise && (
            <View style={styles.exercisePrompt}>
              <TouchableOpacity style={styles.startExerciseButton} onPress={createSpeakExerciseForCurrentMessage}>
                <Ionicons name="mic" size={24} color="#ffffff" />
                <Text style={styles.startExerciseText}>Pronounce to Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pronunciation Exercise */}
          {exerciseState.isActive && exerciseState.exercise && (
            <View style={styles.exerciseContainer}>
              <View style={styles.exerciseHeader}>
                <Ionicons name="mic" size={24} color="#6366f1" />
                <Text style={styles.exerciseTitle}>Pronounce this word:</Text>
              </View>

              <View style={styles.wordCard}>
                <Text style={styles.wordText}>{exerciseState.exercise.keyword}</Text>
                <Text style={styles.sentenceText}>{exerciseState.exercise.sentence}</Text>
              </View>

              <PronunciationCheck
                key={`pronunciation-${attemptKey}`}
                word={exerciseState.exercise.keyword}
                onResult={handlePronunciationResult}
                disabled={showResult}
                maxRecordingDuration={5000}
              />

              {showResult && lastResult && (
                <View style={styles.resultCard}>
                  <View style={[styles.resultHeader, isCorrect ? styles.correctResult : styles.incorrectResult]}>
                    <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={32} color={isCorrect ? '#10b981' : '#ef4444'} />
                    <Text style={[styles.resultTitle, isCorrect ? styles.correctText : styles.incorrectText]}>
                      {isCorrect ? 'Great pronunciation!' : 'Try again!'}
                    </Text>
                  </View>

                  <View style={styles.scoreDetails}>
                    <View style={styles.scoreRow}>
                      <Text style={styles.scoreLabel}>Pronunciation Score:</Text>
                      <Text style={styles.scoreValue}>{lastResult.assessment?.pronunciationScore || 0}%</Text>
                    </View>
                    <View style={styles.scoreRow}>
                      <Text style={styles.scoreLabel}>Accuracy:</Text>
                      <Text style={styles.scoreValue}>{lastResult.assessment?.accuracyScore || 0}%</Text>
                    </View>
                  </View>

                  {isCorrect ? (
                    <TouchableOpacity style={styles.continueExerciseButton} onPress={handleContinueAfterExercise}>
                      <Text style={styles.continueExerciseText}>Continue</Text>
                      <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.retryExerciseButton}
                      onPress={() => {
                        setShowResult(false);
                        setAttemptKey((prev) => prev + 1);
                      }}
                    >
                      <Ionicons name="refresh" size={20} color="#6366f1" />
                      <Text style={styles.retryExerciseText}>Try Again</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Leave Confirmation Modal */}
      <LeaveConfirmationModal visible={showLeaveModal} onLeave={onClose} onCancel={() => setShowLeaveModal(false)} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 44,
  },
  progressContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    marginBottom: 8,
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
  conversationContainer: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  appMessageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  appMessageText: {
    color: '#1f2937',
  },
  userMessageText: {
    color: '#ffffff',
  },
  exercisePrompt: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  startExerciseButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  startExerciseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  wordCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  wordText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 8,
  },
  sentenceText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultCard: {
    marginTop: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  correctResult: {
    backgroundColor: '#d1fae5',
  },
  incorrectResult: {
    backgroundColor: '#fee2e2',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  correctText: {
    color: '#10b981',
  },
  incorrectText: {
    color: '#ef4444',
  },
  scoreDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  continueExerciseButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  continueExerciseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryExerciseButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryExerciseText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  completionScrollView: {
    flex: 1,
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
    width: '100%',
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

