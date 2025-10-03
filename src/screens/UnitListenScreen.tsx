import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import * as Speech from 'expo-speech';

// Hardcoded vocabulary for "Saying Hello"
const VOCABULARY = [
  { french: 'salut', english: 'hi' },
  { french: 'bonjour', english: 'hello' },
  { french: 'bon après-midi', english: 'good afternoon' },
  { french: 'bonsoir', english: 'good evening' },
];

// Hardcoded sentences using the vocabulary
const SENTENCES = [
  { french: 'Bonjour, comment allez-vous?', english: 'Hello, how are you?' },
  { french: 'Bonsoir, ça va bien?', english: 'Good evening, are you well?' },
  { french: 'Salut, ça va?', english: 'Hi, how are you?' },
];

export default function UnitListenScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { unitTitle } = (route.params as any) || { unitTitle: 'Saying Hello' };
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  // Generate 14 questions: 7 multiple choice (4 words + 3 sentences), 7 sentence scramble
  const generateQuestions = () => {
    const questions = [];
    
    // First 4: Words - multiple choice
    for (let i = 0; i < VOCABULARY.length; i++) {
      const correctAnswer = VOCABULARY[i].french;
      const wrongAnswers = VOCABULARY
        .filter((_, idx) => idx !== i)
        .map(v => v.french)
        .sort(() => Math.random() - 0.5)
        .slice(0, 1);
      
      questions.push({
        type: 'word-choice' as const,
        audio: VOCABULARY[i].french,
        correctAnswer,
        options: [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5),
        translation: VOCABULARY[i].english,
      });
    }
    
    // Next 3: Sentences - multiple choice
    for (let i = 0; i < SENTENCES.length; i++) {
      const correctAnswer = SENTENCES[i].french;
      const wrongAnswers = SENTENCES
        .filter((_, idx) => idx !== i)
        .map(v => v.french)
        .sort(() => Math.random() - 0.5)
        .slice(0, 1);
      
      questions.push({
        type: 'sentence-choice' as const,
        audio: SENTENCES[i].french,
        correctAnswer,
        options: [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5),
        translation: SENTENCES[i].english,
      });
    }
    
    // Last 7: Sentence scramble
    const scrambleSentences = [...SENTENCES, ...SENTENCES, ...SENTENCES].slice(0, 7);
    for (let i = 0; i < scrambleSentences.length; i++) {
      const words = scrambleSentences[i].french.split(' ');
      const scrambled = [...words].sort(() => Math.random() - 0.5);
      
      questions.push({
        type: 'scramble' as const,
        audio: scrambleSentences[i].french,
        correctAnswer: scrambleSentences[i].french,
        words: words,
        scrambled: scrambled,
        translation: scrambleSentences[i].english,
      });
    }
    
    return questions;
  };

  const [questions] = useState(generateQuestions());
  const question = questions[currentQuestion];
  const totalQuestions = questions.length;

  const playAudio = async (speed: number = 1.0) => {
    if (isPlaying) return;
    
    try {
      setIsPlaying(true);
      await Speech.speak(question.audio, {
        language: 'fr-FR',
        rate: speed,
      });
      setTimeout(() => setIsPlaying(false), 2000);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult || question.type === 'scramble') return;
    setSelectedAnswer(answer);
  };

  const handleWordPress = (word: string, fromAnswer: boolean) => {
    if (showResult) return;
    
    if (fromAnswer) {
      // Move word back to available
      setUserAnswer(userAnswer.filter(w => w !== word));
      setAvailableWords([...availableWords, word]);
    } else {
      // Move word to answer
      setUserAnswer([...userAnswer, word]);
      setAvailableWords(availableWords.filter(w => w !== word));
    }
  };

  const initializeScramble = () => {
    if (question.type === 'scramble') {
      setAvailableWords(question.scrambled);
      setUserAnswer([]);
    }
  };

  React.useEffect(() => {
    if (question.type === 'scramble') {
      initializeScramble();
    }
  }, [currentQuestion]);

  const handleCheck = () => {
    if (question.type === 'scramble') {
      if (userAnswer.length === 0) return;
      const userSentence = userAnswer.join(' ');
      const correct = userSentence === question.correctAnswer;
      setIsCorrect(correct);
      setShowResult(true);
      
      if (correct) {
        setScore(score + 1);
        setTimeout(() => {
          handleNext();
        }, 1000);
      }
    } else {
      if (!selectedAnswer) return;
      
      const correct = selectedAnswer === question.correctAnswer;
      setIsCorrect(correct);
      setShowResult(true);
      
      if (correct) {
        setScore(score + 1);
        setTimeout(() => {
          handleNext();
        }, 1000);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      setUserAnswer([]);
      setAvailableWords([]);
    } else {
      setCompleted(true);
    }
  };

  const handleRetry = () => {
    if (question.type === 'scramble') {
      initializeScramble();
    } else {
      setSelectedAnswer(null);
    }
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleContinue = () => {
    navigation.goBack();
  };

  const handleBackPress = () => {
    if (completed) {
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

  if (completed) {
    const accuracyPercentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <SafeAreaView style={styles.completionContainer}>
        <View style={styles.completionContent}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>Listening Complete!</Text>
          <Text style={styles.completionSubtitle}>Great listening practice!</Text>
          
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
                setUserAnswer([]);
                setAvailableWords([]);
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
        {/* Question Text */}
        {question.type === 'word-choice' && (
          <Text style={styles.questionText}>Tap the correct answer</Text>
        )}
        {question.type === 'sentence-choice' && (
          <Text style={styles.questionText}>Tap the correct answer</Text>
        )}
        {question.type === 'scramble' && (
          <Text style={styles.questionText}>Tap what you hear</Text>
        )}

        {/* Audio Play Button */}
        <View style={styles.audioSection}>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => playAudio(1.0)}
          >
            <Ionicons name="play" size={48} color="#6366f1" />
          </TouchableOpacity>
          {question.type !== 'scramble' && (
            <Text style={styles.translationText}>{question.translation}</Text>
          )}
        </View>

        {/* Multiple Choice Options */}
        {(question.type === 'word-choice' || question.type === 'sentence-choice') && (
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

        {/* Sentence Scramble */}
        {question.type === 'scramble' && (
          <View style={styles.scrambleContainer}>
            {/* User Answer Area */}
            <View style={styles.answerArea}>
              {userAnswer.map((word, index) => (
                <TouchableOpacity
                  key={`answer-${index}`}
                  style={styles.wordChip}
                  onPress={() => handleWordPress(word, true)}
                  disabled={showResult}
                >
                  <Text style={styles.wordChipText}>{word}</Text>
                </TouchableOpacity>
              ))}
              {userAnswer.length === 0 && (
                <Text style={styles.placeholderText}>Tap the words below</Text>
              )}
            </View>

            {/* Available Words */}
            <View style={styles.wordsContainer}>
              {availableWords.map((word, index) => (
                <TouchableOpacity
                  key={`available-${index}`}
                  style={styles.wordChip}
                  onPress={() => handleWordPress(word, false)}
                  disabled={showResult}
                >
                  <Text style={styles.wordChipText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
              {isCorrect ? 'Great job!' : `The correct answer is: ${question.correctAnswer}`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        {!showResult || !isCorrect ? (
          <>
            <TouchableOpacity 
              style={styles.speedButton}
              onPress={() => playAudio(1.0)}
            >
              <Ionicons name="volume-high" size={24} color="#6366f1" />
            </TouchableOpacity>

            {!showResult ? (
              <TouchableOpacity
                style={[
                  styles.checkButton,
                  ((question.type === 'scramble' && userAnswer.length === 0) || 
                   (question.type !== 'scramble' && !selectedAnswer)) && styles.checkButtonDisabled
                ]}
                onPress={handleCheck}
                disabled={(question.type === 'scramble' && userAnswer.length === 0) || 
                         (question.type !== 'scramble' && !selectedAnswer)}
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

            <TouchableOpacity 
              style={styles.speedButton}
              onPress={() => playAudio(0.75)}
            >
              <Text style={styles.speedButtonText}>0.75×</Text>
            </TouchableOpacity>
          </>
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
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 32,
  },
  audioSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  playButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#6366f1',
    marginBottom: 16,
  },
  translationText: {
    fontSize: 16,
    color: '#6b7280',
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
    flex: 1,
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
  scrambleContainer: {
    gap: 24,
  },
  answerArea: {
    minHeight: 80,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  wordChip: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  wordChipText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  speedButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  checkButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  incorrectActions: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
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
