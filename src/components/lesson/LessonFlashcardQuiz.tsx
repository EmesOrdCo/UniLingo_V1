import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LeaveConfirmationModal from './LeaveConfirmationModal';

interface LessonFlashcardQuizProps {
  vocabulary: any[];
  onComplete: (score: number) => void;
  onClose: () => void;
  onProgressUpdate?: (questionIndex: number) => void;
  initialQuestionIndex?: number;
}

interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
  type: 'translation';
}

export default function LessonFlashcardQuiz({ vocabulary, onComplete, onClose, onProgressUpdate, initialQuestionIndex = 0 }: LessonFlashcardQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestionIndex);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, [vocabulary]);

  // Update progress when question index changes
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(currentQuestion);
    }
  }, [currentQuestion]); // Removed onProgressUpdate from dependencies to prevent infinite loops

  const generateQuestions = () => {
    const quizQuestions: QuizQuestion[] = [];
    
    vocabulary.forEach((vocab) => {
      // Safety check to ensure vocab exists and has required properties
      if (!vocab || !vocab.keywords || !vocab.native_translation) {
        console.warn('Skipping invalid vocabulary item:', vocab);
        return;
      }
      
      // Create translation question only
      const translationOptions = [vocab.native_translation];
      const otherTranslations = vocabulary
        .filter(v => v.id !== vocab.id && v.native_translation)
        .map(v => v.native_translation)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      translationOptions.push(...otherTranslations);
      const shuffledTranslationOptions = translationOptions.sort(() => Math.random() - 0.5);
      
      quizQuestions.push({
        question: `What is the translation of "${vocab.keywords}"?`,
        correctAnswer: vocab.native_translation,
        options: shuffledTranslationOptions,
        type: 'translation'
      });
    });

    // Shuffle all questions
    const shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
  };

  const handleAnswerSelect = (answer: string) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestion] = answer;
    setUserAnswers(newUserAnswers);
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === questions[currentQuestion].correctAnswer;
    
    // Haptic feedback based on answer
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    setTimeout(() => {
      if (isCorrect) {
        setScore(score + 1);
      }
      
      // Light haptic for moving to next question
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setShowReview(true);
      }
    }, 1500);
  };

  const handleClose = () => {
    setShowLeaveModal(true);
  };

  const handleReviewComplete = () => {
    onComplete(score);
    onClose();
  };

  const handleRetry = () => {
    // Reset quiz state
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowReview(false);
    setUserAnswers([]);
    setReviewFilter('all');
    // Regenerate questions for variety
    generateQuestions();
  };

  const getFilteredQuestions = () => {
    switch (reviewFilter) {
      case 'correct':
        return questions.filter((_, index) => userAnswers[index] === questions[index].correctAnswer);
      case 'incorrect':
        return questions.filter((_, index) => userAnswers[index] !== questions[index].correctAnswer);
      default:
        return questions;
    }
  };

  // Review Screen
  if (showReview) {
    const finalScore = score; // score already includes all correct answers
    const filteredQuestions = getFilteredQuestions();

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
          <Text style={styles.headerTitle}>Quiz Complete!</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.reviewContent} showsVerticalScrollIndicator={false}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>🎉 Quiz Results</Text>
            <Text style={styles.reviewSubtitle}>
              {finalScore} out of {questions.length} correct
            </Text>
            
            <View style={styles.scoreCircle}>
              <Text style={styles.scorePercentage}>
                {Math.round((finalScore / questions.length) * 100)}%
              </Text>
            </View>
          </View>

          <View style={styles.reviewFilter}>
            <TouchableOpacity 
              style={[styles.filterButton, reviewFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setReviewFilter('all')}
            >
              <Text style={[styles.filterButtonText, reviewFilter === 'all' && styles.filterButtonTextActive]}>
                All ({questions.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, reviewFilter === 'correct' && styles.filterButtonActive]}
              onPress={() => setReviewFilter('correct')}
            >
              <Text style={[styles.filterButtonText, reviewFilter === 'correct' && styles.filterButtonTextActive]}>
                Correct ({questions.filter((_, index) => userAnswers[index] === questions[index].correctAnswer).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, reviewFilter === 'incorrect' && styles.filterButtonActive]}
              onPress={() => setReviewFilter('incorrect')}
            >
              <Text style={[styles.filterButtonText, reviewFilter === 'incorrect' && styles.filterButtonTextActive]}>
                Incorrect ({questions.filter((_, index) => userAnswers[index] !== questions[index].correctAnswer).length})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewQuestions}>
            {filteredQuestions.map((question, index) => {
              const originalIndex = questions.indexOf(question);
              const userAnswer = userAnswers[originalIndex];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <View key={index} style={[styles.reviewQuestion, isCorrect ? styles.correctQuestion : styles.incorrectQuestion]}>
                  <View style={styles.reviewQuestionHeader}>
                    <Text style={styles.reviewQuestionText}>{question.question}</Text>
                    <Ionicons 
                      name={isCorrect ? "checkmark-circle" : "close-circle"} 
                      size={24} 
                      color={isCorrect ? "#10b981" : "#ef4444"} 
                    />
                  </View>
                  
                  <View style={styles.reviewAnswers}>
                    <Text style={styles.reviewAnswerLabel}>Your answer:</Text>
                    <Text style={[styles.reviewAnswer, !isCorrect && styles.incorrectAnswer]}>
                      {userAnswer}
                    </Text>
                    
                    {!isCorrect && (
                      <>
                        <Text style={styles.reviewAnswerLabel}>Correct answer:</Text>
                        <Text style={[styles.reviewAnswer, styles.correctAnswer]}>
                          {question.correctAnswer}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={20} color="#6366f1" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.continueButton} onPress={handleReviewComplete}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
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

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Flashcard Quiz</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading quiz...</Text>
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

  const question = questions[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flashcard Quiz</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.question}</Text>
          
          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === option && styles.selectedOption,
                  showResult && option === question.correctAnswer && styles.correctOption,
                  showResult && selectedAnswer === option && option !== question.correctAnswer && styles.incorrectOption
                ]}
                onPress={() => !showResult && handleAnswerSelect(option)}
                disabled={showResult}
              >
                <Text style={[
                  styles.optionText,
                  selectedAnswer === option && styles.selectedOptionText,
                  showResult && option === question.correctAnswer && styles.correctOptionText,
                  showResult && selectedAnswer === option && option !== question.correctAnswer && styles.incorrectOptionText
                ]}>
                  {option}
                </Text>
                {showResult && option === question.correctAnswer && (
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                )}
                {showResult && selectedAnswer === option && option !== question.correctAnswer && (
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {showResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>
                {selectedAnswer === question.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
              </Text>
              <Text style={styles.correctAnswerText}>
                Correct answer: {question.correctAnswer}
              </Text>
            </View>
          )}
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
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  questionContainer: {
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
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
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  reviewContent: {
    flex: 1,
  },
  reviewHeader: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  reviewSubtitle: {
    fontSize: 18,
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
  },
  scorePercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  reviewFilter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f1f5f9',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  reviewQuestions: {
    padding: 20,
  },
  reviewQuestion: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  correctQuestion: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  incorrectQuestion: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  reviewQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  reviewAnswers: {
    gap: 8,
  },
  reviewAnswerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  reviewAnswer: {
    fontSize: 16,
    color: '#1e293b',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  correctAnswer: {
    backgroundColor: '#f0fdf4',
    color: '#10b981',
  },
  incorrectAnswer: {
    backgroundColor: '#fef2f2',
    color: '#ef4444',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
