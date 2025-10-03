import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

// Hardcoded vocabulary for "Saying Hello"
const VOCABULARY = [
  { english: 'hi', french: 'salut' },
  { english: 'hello', french: 'bonjour' },
  { english: 'good morning', french: 'bonjour' },
  { english: 'good afternoon', french: 'bon après-midi' },
  { english: 'good evening', french: 'bonsoir' },
  { english: 'goodbye', french: 'au revoir' },
  { english: 'please', french: "s'il vous plaît" },
];

export default function UnitWordsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { unitTitle } = (route.params as any) || { unitTitle: 'Saying Hello' };
  
  const [showIntro, setShowIntro] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Generate 14 questions: 7 English→French, 7 French→English
  const generateQuestions = () => {
    const questions = [];
    
    // First 7: English → French
    for (let i = 0; i < VOCABULARY.length; i++) {
      const correctAnswer = VOCABULARY[i].french;
      const wrongAnswers = VOCABULARY
        .filter((_, idx) => idx !== i)
        .map(v => v.french)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      questions.push({
        question: VOCABULARY[i].english,
        correctAnswer,
        options: [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5),
        type: 'en-to-fr' as const,
      });
    }
    
    // Second 7: French → English
    for (let i = 0; i < VOCABULARY.length; i++) {
      const correctAnswer = VOCABULARY[i].english;
      const wrongAnswers = VOCABULARY
        .filter((_, idx) => idx !== i)
        .map(v => v.english)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      questions.push({
        question: VOCABULARY[i].french,
        correctAnswer,
        options: [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5),
        type: 'fr-to-en' as const,
      });
    }
    
    return questions;
  };

  const [questions] = useState(generateQuestions());
  const question = questions[currentQuestion];
  const totalQuestions = questions.length;

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleCheck = () => {
    if (!selectedAnswer) return;
    
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(score + 1);
      
      // Auto-advance after 1 second if correct
      setTimeout(() => {
        handleNext();
      }, 1000);
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      setCompleted(true);
    }
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleContinue = () => {
    navigation.goBack();
  };

  const handlePlayAgain = () => {
    setShowIntro(true);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setScore(0);
    setCompleted(false);
  };

  const handleStartLesson = () => {
    setShowIntro(false);
  };

  const handleBackPress = () => {
    if (showIntro || completed) {
      navigation.goBack();
    } else {
      setShowExitModal(true);
    }
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    navigation.goBack();
  };

  const handleCancelExit = () => {
    setShowExitModal(false);
  };

  if (showIntro) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saying Hello - Words</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.introContainer}>
          <Text style={styles.introTitle}>Words you'll learn</Text>
          
          <View style={styles.wordsList}>
            {VOCABULARY.map((word, index) => (
              <View key={index} style={styles.wordCard}>
                <View style={styles.wordTextContainer}>
                  <Text style={styles.wordEnglish}>{word.french}</Text>
                  <Text style={styles.wordFrench}>{word.english}</Text>
                </View>
                <TouchableOpacity style={styles.audioButton}>
                  <Ionicons name="volume-high" size={24} color="#6366f1" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.introButtonContainer}>
          <TouchableOpacity style={styles.startLessonButton} onPress={handleStartLesson}>
            <Text style={styles.startLessonButtonText}>Start Lesson</Text>
            <Ionicons name="play" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (completed) {
    const accuracyPercentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <SafeAreaView style={styles.completionContainer}>
        <View style={styles.completionContent}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>Word Intro Complete!</Text>
          <Text style={styles.completionSubtitle}>Great job learning new words!</Text>
          
          <View style={styles.completionStats}>
            <View style={styles.completionStatCard}>
              <Text style={styles.completionStatValue}>{score}/{totalQuestions}</Text>
              <Text style={styles.completionStatLabel}>Correct</Text>
            </View>
            <View style={styles.completionStatCard}>
              <Text style={styles.completionStatValue}>{accuracyPercentage}%</Text>
              <Text style={styles.completionStatLabel}>Accuracy</Text>
            </View>
          </View>
          
          <View style={styles.completionButtons}>
            <TouchableOpacity 
              style={styles.completionRetryButton} 
              onPress={() => {
                setCurrentQuestion(0);
                setScore(0);
                setCompleted(false);
                setSelectedAnswer(null);
                setShowResult(false);
              }}
            >
              <Text style={styles.completionRetryButtonText}>Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.completionContinueButton} onPress={handleContinue}>
              <Text style={styles.completionContinueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saying Hello</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelExit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure you want to leave?</Text>
            <Text style={styles.modalSubtitle}>
              Your progress won't be saved for this lesson, and you'll have to start again when you return.
            </Text>
            
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirmExit}>
              <Text style={styles.modalConfirmButtonText}>Yes, I want to leave</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalCancelButton} onPress={handleCancelExit}>
              <Text style={styles.modalCancelButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Progress Bar with Segments */}
      <View style={styles.progressContainer}>
        <View style={styles.progressSegments}>
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressSegment,
                idx < currentQuestion && styles.progressSegmentCompleted,
                idx === currentQuestion && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.questionLabel}>
            {question.type === 'en-to-fr' ? 'Translate this' : 'Which of these is'}
          </Text>
          <Text style={styles.questionText}>
            {question.type === 'en-to-fr' ? question.question : `" ${question.question} " ?`}
          </Text>
        </View>

        {/* Answer Options */}
        {question.type === 'en-to-fr' ? (
          // 2x2 Grid with images for English → French (first 7 questions)
          <View style={styles.optionsGrid}>
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option === question.correctAnswer;
              const showCorrect = showResult && isCorrectAnswer;
              const showIncorrect = showResult && isSelected && !isCorrect;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionCard,
                    isSelected && !showResult && styles.optionCardSelected,
                    showCorrect && styles.optionCardCorrect,
                    showIncorrect && styles.optionCardIncorrect,
                  ]}
                  onPress={() => handleAnswerSelect(option)}
                  disabled={showResult}
                >
                  <View style={styles.optionImagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#9ca3af" />
                  </View>
                  <Text
                    style={[
                      styles.optionCardText,
                      isSelected && !showResult && styles.optionTextSelected,
                      showCorrect && styles.optionTextCorrect,
                      showIncorrect && styles.optionTextIncorrect,
                    ]}
                  >
                    {option}
                  </Text>
                  {showCorrect && (
                    <View style={styles.resultIconBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    </View>
                  )}
                  {showIncorrect && (
                    <View style={styles.resultIconBadge}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          // List view for French → English (second 7 questions)
          <View style={styles.optionsContainer}>
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === question.correctAnswer;
                const showCorrect = showResult && isCorrectAnswer;
                const showIncorrect = showResult && isSelected && !isCorrect;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      isSelected && !showResult && styles.optionButtonSelected,
                      showCorrect && styles.optionButtonCorrect,
                      showIncorrect && styles.optionButtonIncorrect,
                    ]}
                    onPress={() => handleAnswerSelect(option)}
                    disabled={showResult}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && !showResult && styles.optionTextSelected,
                        showCorrect && styles.optionTextCorrect,
                        showIncorrect && styles.optionTextIncorrect,
                      ]}
                    >
                      {option}
                    </Text>
                    {showCorrect && (
                      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    )}
                    {showIncorrect && (
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
        )}

        {/* Result Message */}
        {showResult && (
          <View style={styles.resultMessage}>
            <Text style={[
              styles.resultTitle,
              isCorrect ? styles.resultTitleCorrect : styles.resultTitleIncorrect
            ]}>
              {isCorrect ? 'Correct! 🎉' : 'Incorrect! 😔'}
            </Text>
            
            <Text style={styles.resultSubtitle}>
              {isCorrect ? 'Great job!' : 'Better luck next time'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        {!showResult ? (
          <TouchableOpacity
            style={[styles.checkButton, !selectedAnswer && styles.checkButtonDisabled]}
            onPress={handleCheck}
            disabled={!selectedAnswer}
          >
            <Text style={styles.checkButtonText}>Check</Text>
          </TouchableOpacity>
        ) : !isCorrect ? (
          <View style={styles.incorrectActions}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
              <Ionicons name="arrow-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        ) : null}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
  },
  progressSegments: {
    flexDirection: 'row',
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressSegmentCompleted: {
    backgroundColor: '#6366f1',
  },
  progressSegmentActive: {
    backgroundColor: '#6366f1',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  questionSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  questionLabel: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionButtonSelected: {
    borderColor: '#6466E9',
    backgroundColor: '#f0f4ff',
  },
  optionButtonCorrect: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  optionButtonIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#6466E9',
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: '#10b981',
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: '#ef4444',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#6466E9',
    backgroundColor: '#f0f4ff',
  },
  optionCardCorrect: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  optionCardIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionImagePlaceholder: {
    width: '100%',
    aspectRatio: 1.3,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionImagePlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  optionCardText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  resultIconBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  resultMessage: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultTitleCorrect: {
    color: '#10b981',
  },
  resultTitleIncorrect: {
    color: '#ef4444',
  },
  resultSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomActions: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  checkButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
  },
  checkButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.5,
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  incorrectActions: {
    flexDirection: 'row',
    gap: 12,
    width: '90%',
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  completionContainer: {
    flex: 1,
    backgroundColor: '#7c6ee0',
  },
  completionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completionEmoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  completionSubtitle: {
    fontSize: 18,
    color: '#e0e7ff',
    textAlign: 'center',
    marginBottom: 48,
  },
  completionStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 48,
  },
  completionStatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  completionStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  completionStatLabel: {
    fontSize: 14,
    color: '#e0e7ff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completionButtons: {
    width: '100%',
    gap: 12,
  },
  completionRetryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completionRetryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7c6ee0',
  },
  completionContinueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completionContinueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  introContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 24,
  },
  wordsList: {
    gap: 12,
  },
  wordCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordTextContainer: {
    flex: 1,
  },
  wordEnglish: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  wordFrench: {
    fontSize: 16,
    color: '#6b7280',
  },
  introButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  startLessonButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    width: '90%',
    gap: 8,
  },
  startLessonButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  modalConfirmButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalConfirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  modalCancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
});
