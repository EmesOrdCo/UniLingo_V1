import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LeaveConfirmationModal from './LeaveConfirmationModal';

interface LessonFillInTheBlankProps {
  vocabulary: any[];
  onComplete: (score: number) => void;
  onClose: () => void;
  onProgressUpdate?: (questionIndex: number) => void;
  initialQuestionIndex?: number;
}

interface FillInTheBlankQuestion {
  id: string;
  sentence: string;
  blankWord: string;
  hint: string;
  options?: string[]; // Multiple choice options for round 1
}

export default function LessonFillInTheBlank({ vocabulary, onComplete, onClose, onProgressUpdate, initialQuestionIndex = 0 }: LessonFillInTheBlankProps) {
  const [questions, setQuestions] = useState<FillInTheBlankQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1); // Track round: 1 = multiple choice, 2 = typing
  const [round1Score, setRound1Score] = useState(0);
  const [round2Score, setRound2Score] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Generate questions from vocabulary
  React.useEffect(() => {
    const generatedQuestions: FillInTheBlankQuestion[] = vocabulary
      .filter(item => item && item.example_sentence_en && item.keywords)
      .map((item, index, array) => {
        // Generate 3 wrong options from other vocabulary items
        const wrongOptions = array
          .filter(v => v.id !== item.id && v.keywords)
          .map(v => v.keywords)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        // Combine with correct answer and shuffle
        const options = [item.keywords, ...wrongOptions].sort(() => Math.random() - 0.5);
        
        return {
          id: item.id,
          sentence: item.example_sentence_en,
          blankWord: item.keywords,
          hint: item.definition || `Translation: ${item.native_translation || 'N/A'}`,
          options: options
        };
      })
      .slice(0, Math.min(10, vocabulary.length)); // Limit to 10 questions

    setQuestions(generatedQuestions);
  }, [vocabulary]);

  // Update progress when question index changes
  React.useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(currentQuestionIndex);
    }
  }, [currentQuestionIndex]); // Removed onProgressUpdate from dependencies to prevent infinite loops

  const handleClose = () => {
    setShowLeaveModal(true);
  };

  const handleOptionSelect = (option: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswer = currentQuestion?.blankWord || '';
    const isAnswerCorrect = option === correctAnswer;
    
    setSelectedOption(option);
    setIsCorrect(isAnswerCorrect);
    
    // Haptic feedback based on answer
    if (isAnswerCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (currentRound === 1) {
        setRound1Score(round1Score + 1);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    setShowResult(true);
  };

  const handleCheckAnswer = () => {
    if (!userAnswer.trim()) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswer = currentQuestion?.blankWord?.toLowerCase().trim() || '';
    const userAnswerLower = userAnswer.toLowerCase().trim();
    
    // More flexible matching - check if the answer contains the correct word or vice versa
    const isAnswerCorrect = userAnswerLower === correctAnswer || 
                           userAnswerLower.includes(correctAnswer) || 
                           correctAnswer.includes(userAnswerLower);
    
    setIsCorrect(isAnswerCorrect);
    
    // Haptic feedback based on answer
    if (isAnswerCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRound2Score(round2Score + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    // Light haptic for moving to next question
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question in current round
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setSelectedOption(null);
      setShowResult(false);
      setShowHint(false);
    } else {
      // End of round
      if (currentRound === 1) {
        // Start round 2
        setCurrentRound(2);
        setCurrentQuestionIndex(0);
        setUserAnswer('');
        setSelectedOption(null);
        setShowResult(false);
        setShowHint(false);
      } else {
        // Both rounds complete
        const totalScore = round1Score + round2Score;
        setScore(totalScore);
        setGameComplete(true);
        // Don't auto-navigate, let user choose Retry or Continue
      }
    }
  };

  const handleRetry = () => {
    // Reset all state to restart the exercise
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setSelectedOption(null);
    setCurrentRound(1);
    setRound1Score(0);
    setRound2Score(0);
    setScore(0);
    setShowResult(false);
    setIsCorrect(false);
    setGameComplete(false);
    setShowHint(false);
    
    // Regenerate questions with new shuffled options
    const generatedQuestions: FillInTheBlankQuestion[] = vocabulary
      .filter(item => item && item.example_sentence_en && item.keywords)
      .map((item, index, array) => {
        const wrongOptions = array
          .filter(v => v.id !== item.id && v.keywords)
          .map(v => v.keywords)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        const options = [item.keywords, ...wrongOptions].sort(() => Math.random() - 0.5);
        
        return {
          id: item.id,
          sentence: item.example_sentence_en,
          blankWord: item.keywords,
          hint: item.definition || `Translation: ${item.native_translation || 'N/A'}`,
          options: options
        };
      })
      .slice(0, Math.min(10, vocabulary.length));

    setQuestions(generatedQuestions);
  };

  const handleContinue = () => {
    const totalScore = round1Score + round2Score;
    onComplete(totalScore);
    onClose();
  };

  const handleSkip = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setSelectedOption(null);
      setShowResult(false);
      setShowHint(false);
    } else {
      // End of round
      if (currentRound === 1) {
        // Start round 2
        setCurrentRound(2);
        setCurrentQuestionIndex(0);
        setUserAnswer('');
        setSelectedOption(null);
        setShowResult(false);
        setShowHint(false);
      } else {
        // Both rounds complete
        const totalScore = round1Score + round2Score;
        setScore(totalScore);
        setGameComplete(true);
        // Don't auto-navigate, let user choose Retry or Continue
      }
    }
  };

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fill in the Blank</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.noQuestionsContainer}>
          <Text style={styles.noQuestionsText}>No questions available</Text>
          <Text style={styles.noQuestionsSubtext}>
            This lesson doesn't have enough example sentences to create fill-in-the-blank questions.
          </Text>
        </View>

        {/* Leave Confirmation Modal */}
        <LeaveConfirmationModal
          visible={showLeaveModal}
          onLeave={onClose}
          onCancel={() => setShowLeaveModal(false)}
        />
      </SafeAreaView>
    );
  }

  if (gameComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fill in the Blank Complete!</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.completionScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.completionContainer}>
            {/* Trophy Icon */}
            <View style={styles.trophyContainer}>
              <Ionicons name="trophy" size={80} color="#f59e0b" />
            </View>
            
            {/* Completion Title */}
            <Text style={styles.completionTitle}>🎉 Outstanding Work!</Text>
            <Text style={styles.completionSubtitle}>Fill in the Blank Complete</Text>
            
            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Total Correct</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="document-text" size={24} color="#6366f1" />
                </View>
                <Text style={styles.statValue}>{questions.length * 2}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trending-up" size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.statValue}>{Math.round((score / (questions.length * 2)) * 100)}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>
            
            {/* Round Breakdown */}
            <View style={styles.roundBreakdown}>
              <Text style={styles.roundBreakdownTitle}>Round Breakdown:</Text>
              <View style={styles.roundStats}>
                <View style={styles.roundStat}>
                  <Text style={styles.roundStatLabel}>Round 1 (Multiple Choice)</Text>
                  <Text style={styles.roundStatValue}>{round1Score} / {questions.length}</Text>
                </View>
                <View style={styles.roundStat}>
                  <Text style={styles.roundStatLabel}>Round 2 (Type Answer)</Text>
                  <Text style={styles.roundStatValue}>{round2Score} / {questions.length}</Text>
                </View>
              </View>
            </View>
            
            {/* Performance Message */}
            <View style={styles.performanceContainer}>
              <Text style={styles.performanceText}>
                {score === questions.length * 2
                  ? "Perfect! You aced both rounds! 🌟"
                  : score >= questions.length * 2 * 0.8
                  ? "Excellent! You're mastering vocabulary in context! 🎯"
                  : score >= questions.length * 2 * 0.6
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

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Function to create sentence with blank
  const createSentenceWithBlank = (sentence: string, blankWord: string): string => {
    // Create a regex that matches the word as a whole word (case insensitive)
    const regex = new RegExp(`\\b${blankWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    return sentence.replace(regex, '_____');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fill in the Blank</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Round {currentRound} - {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.questionContainer}>
          <View style={styles.sentenceContainer}>
          <Text style={styles.sentenceText}>
            {createSentenceWithBlank(currentQuestion?.sentence || '', currentQuestion?.blankWord || '')}
          </Text>
        </View>

        <View style={styles.hintToggleContainer}>
          <TouchableOpacity 
            style={styles.hintToggleButton} 
            onPress={() => setShowHint(!showHint)}
          >
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.hintToggleText}>
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Text>
          </TouchableOpacity>
        </View>

        {showHint && (
          <View style={styles.hintContainer}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={styles.hintText}>Hint: {currentQuestion?.hint || 'No hint available'}</Text>
          </View>
        )}

        {currentRound === 1 ? (
          /* Round 1: Multiple Choice */
          <View style={styles.optionsContainer}>
            {currentQuestion?.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedOption === option && styles.selectedOption,
                  showResult && option === currentQuestion.blankWord && styles.correctOption,
                  showResult && selectedOption === option && option !== currentQuestion.blankWord && styles.incorrectOption
                ]}
                onPress={() => !showResult && handleOptionSelect(option)}
                disabled={showResult}
              >
                <Text style={[
                  styles.optionText,
                  selectedOption === option && styles.selectedOptionText,
                  showResult && option === currentQuestion.blankWord && styles.correctOptionText,
                  showResult && selectedOption === option && option !== currentQuestion.blankWord && styles.incorrectOptionText
                ]}>
                  {option}
                </Text>
                {showResult && option === currentQuestion.blankWord && (
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                )}
                {showResult && selectedOption === option && option !== currentQuestion.blankWord && (
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Round 2: Type Answer */
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Type your answer here..."
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!showResult}
            />
          </View>
        )}

        {showResult && (
          <View style={styles.resultContainer}>
            <Text style={[styles.resultText, { color: isCorrect ? '#10b981' : '#ef4444' }]}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </Text>
            {!isCorrect && (
              <Text style={styles.correctAnswer}>
                The correct answer is: {currentQuestion?.blankWord || 'Unknown'}
              </Text>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          {!showResult ? (
            currentRound === 1 ? null : (
              <>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.checkButton, { opacity: userAnswer.trim() ? 1 : 0.5 }]} 
                  onPress={handleCheckAnswer}
                  disabled={!userAnswer.trim()}
                >
                  <Text style={styles.checkButtonText}>Check</Text>
                </TouchableOpacity>
              </>
            )
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : currentRound === 1 ? 'Start Round 2' : 'Finish'}
              </Text>
            </TouchableOpacity>
          )}
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
    paddingVertical: 20,
    paddingTop: 32,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  placeholder: {
    width: 48,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  questionContainer: {
    padding: 20,
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  sentenceContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sentenceText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1e293b',
    textAlign: 'center',
  },
  hintToggleContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  hintToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hintToggleText: {
    fontSize: 16,
    color: '#f59e0b',
    marginLeft: 8,
    fontWeight: '600',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  hintText: {
    fontSize: 16,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#6366f1',
    backgroundColor: '#f8fafc',
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  incorrectOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  selectedOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#10b981',
    fontWeight: '600',
  },
  incorrectOptionText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  correctAnswer: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  checkButton: {
    flex: 2,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noQuestionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noQuestionsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  noQuestionsSubtext: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionScrollView: {
    flex: 1,
  },
  trophyContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  completionSubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  roundBreakdown: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roundBreakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  roundStats: {
    gap: 12,
  },
  roundStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  roundStatLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  roundStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  performanceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  performanceText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
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

