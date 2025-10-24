import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../contexts/AuthContext';
import { VocabularyInterpretationService, InterpretedVocabulary } from '../../lib/vocabularyInterpretationService';
import LeaveConfirmationModal from './LeaveConfirmationModal';
import AnimatedAvatar from '../avatar/AnimatedAvatar';
import { useAvatarAnimation } from '../../hooks/useAvatarAnimation';

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
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestionIndex);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { profile } = useAuth();
  const { currentAnimation, triggerCelebration, triggerDisappointed } = useAvatarAnimation();

  // Get user's language pair - memoized to prevent unnecessary re-renders
  const languagePair = useMemo(() => ({
    native: profile?.native_language || 'en-GB',
    target: profile?.target_language || 'en-GB'
  }), [profile?.native_language, profile?.target_language]);

  // Interpret vocabulary based on language pair - memoized to prevent unnecessary re-renders
  const interpretedVocabulary = useMemo(() => 
    VocabularyInterpretationService.interpretVocabularyList(vocabulary, languagePair),
    [vocabulary, languagePair]
  );
  const languageDirection = VocabularyInterpretationService.getLanguageDirection(languagePair);

  useEffect(() => {
    try {
      generateQuestions();
    } catch (error) {
      console.error('Error generating questions:', error);
    }
    return () => {
      // Cleanup function for vocabulary changes
    };
  }, [generateQuestions]); // Use memoized function as dependency

  // Sync internal state with initialQuestionIndex prop changes
  useEffect(() => {
    setCurrentQuestion(initialQuestionIndex);
  }, [initialQuestionIndex]);

  // Helper function to get translated language name - memoized to prevent infinite loops
  const getTranslatedLanguageName = useCallback((languageCode: string): string => {
    const languageMap: { [key: string]: string } = {
      'English': 'languages.english',
      'Spanish': 'languages.spanish', 
      'German': 'languages.german',
      'Italian': 'languages.italian',
      'French': 'languages.french',
      'Portuguese': 'languages.portuguese',
      'Swedish': 'languages.swedish',
      'Turkish': 'languages.turkish'
    };
    
    const translationKey = languageMap[languageCode];
    return translationKey ? t(translationKey) : languageCode;
  }, [t]);

  const generateQuestions = useCallback(() => {
    const quizQuestions: QuizQuestion[] = [];
    
    interpretedVocabulary.forEach((vocab) => {
      // Safety check to ensure vocab exists and has required properties
      if (!vocab || !vocab.frontTerm || !vocab.backTerm) {
        console.warn('Skipping invalid vocabulary item:', vocab);
        return;
      }
      
      // Create translation question only
      const translationOptions = [vocab.backTerm];
      const usedAnswers = new Set([vocab.backTerm]);
      
      // Get all possible wrong answers (excluding current item)
      const possibleWrongAnswers = interpretedVocabulary
        .filter(v => v !== vocab && v.backTerm)
        .map(v => v.backTerm)
        .sort(() => Math.random() - 0.5);
      
      // Add unique wrong answers until we have 3
      for (const answer of possibleWrongAnswers) {
        if (translationOptions.length >= 4) break;
        if (!usedAnswers.has(answer)) {
          translationOptions.push(answer);
          usedAnswers.add(answer);
        }
      }
      
      // If we still don't have enough unique answers, add generic ones
      const genericAnswers = ['Not sure', 'Maybe', 'Possibly'];
      for (const generic of genericAnswers) {
        if (translationOptions.length >= 4) break;
        if (!usedAnswers.has(generic)) {
          translationOptions.push(generic);
          usedAnswers.add(generic);
        }
      }
      
      const shuffledTranslationOptions = translationOptions.sort(() => Math.random() - 0.5);
      
      quizQuestions.push({
        question: t('lessonQuiz.whatIsTranslation', { 
          targetLanguage: getTranslatedLanguageName(languageDirection.targetLanguageName).toLowerCase(),
          term: vocab.frontTerm 
        }),
        correctAnswer: vocab.backTerm,
        options: shuffledTranslationOptions,
        type: 'translation'
      });
    });

    // Shuffle all questions
    const shuffledQuestions = quizQuestions.sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
  }, [interpretedVocabulary, getTranslatedLanguageName, t]);

  const handleAnswerSelect = (answer: string) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestion] = answer;
    setUserAnswers(newUserAnswers);
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === questions[currentQuestion].correctAnswer;
    
    // Trigger avatar animation based on answer
    if (isCorrect) {
      triggerCelebration();
    } else {
      triggerDisappointed();
    }
    
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
        const newIndex = currentQuestion + 1;
        setCurrentQuestion(newIndex);
        if (onProgressUpdate) {
          onProgressUpdate(newIndex);
        }
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
    if (onProgressUpdate) {
      onProgressUpdate(0);
    }
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
          <Text style={styles.headerTitle}>{t('lessonQuiz.complete')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.reviewContent} showsVerticalScrollIndicator={false}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>🎉 {t('lessonQuiz.results')}</Text>
            <Text style={styles.reviewSubtitle}>
              {t('lessonQuiz.scoreOutOf', { correct: finalScore, total: questions.length })}
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
                {t('lessons.flashcardQuiz.all')} ({questions.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, reviewFilter === 'correct' && styles.filterButtonActive]}
              onPress={() => setReviewFilter('correct')}
            >
              <Text style={[styles.filterButtonText, reviewFilter === 'correct' && styles.filterButtonTextActive]}>
                {t('lessons.common.correct')} ({questions.filter((_, index) => userAnswers[index] === questions[index].correctAnswer).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, reviewFilter === 'incorrect' && styles.filterButtonActive]}
              onPress={() => setReviewFilter('incorrect')}
            >
              <Text style={[styles.filterButtonText, reviewFilter === 'incorrect' && styles.filterButtonTextActive]}>
                {t('lessons.common.incorrect')} ({questions.filter((_, index) => userAnswers[index] !== questions[index].correctAnswer).length})
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
                    <Text style={styles.reviewAnswerLabel}>{t('lessonQuiz.yourAnswer')}</Text>
                    <Text style={[styles.reviewAnswer, !isCorrect && styles.incorrectAnswer]}>
                      {userAnswer}
                    </Text>
                    
                    {!isCorrect && (
                      <>
                        <Text style={styles.reviewAnswerLabel}>{t('lessonQuiz.correctAnswer')}</Text>
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
              <Text style={styles.retryButtonText}>{t('lessons.common.retry')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.continueButton} onPress={handleReviewComplete}>
              <Text style={styles.continueButtonText}>{t('lessons.common.continue')}</Text>
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
          <Text style={styles.headerTitle}>{t('lessons.exercises.flashcardQuiz')}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('lessons.flashcardQuiz.loading')}</Text>
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
        <Text style={styles.headerTitle}>{t('lessons.exercises.flashcardQuiz')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {t('lessons.common.question')} {currentQuestion + 1} {t('lessons.common.of')} {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <View style={styles.questionHeader}>
            <AnimatedAvatar size={80} style={styles.questionAvatar} animationType={currentAnimation} showCircle={false} />
            <Text style={styles.questionText}>{question.question}</Text>
          </View>
          
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
                {t('lessonQuiz.correctAnswer')} {question.correctAnswer}
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
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  questionAvatar: {
    marginRight: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 28,
    flex: 1,
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
