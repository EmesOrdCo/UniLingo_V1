import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../lib/i18n';
import { useAuth } from '../../contexts/AuthContext';
import { VocabularyInterpretationService, InterpretedVocabulary } from '../../lib/vocabularyInterpretationService';

interface LessonSentenceScrambleProps {
  vocabulary: any[];
  onComplete: (score: number) => void;
  onClose: () => void;
  onProgressUpdate?: (questionIndex: number) => void;
  initialQuestionIndex?: number;
}

interface ScrambleQuestion {
  sentence: string;
  scrambledWords: string[];
  correctAnswer: string;
}

export default function LessonSentenceScramble({ vocabulary, onComplete, onClose, onProgressUpdate, initialQuestionIndex = 0 }: LessonSentenceScrambleProps) {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<ScrambleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const { profile } = useAuth();

  // Get user's language pair
  const languagePair = {
    native: profile?.native_language || 'en-GB',
    target: profile?.target_language || 'en-GB'
  };

  // Interpret vocabulary based on language pair
  const interpretedVocabulary = VocabularyInterpretationService.interpretVocabularyList(vocabulary, languagePair);
  const languageDirection = VocabularyInterpretationService.getLanguageDirection(languagePair);

  useEffect(() => {
    generateQuestions();
  }, [interpretedVocabulary]);

  // Update progress when question index changes
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(currentQuestionIndex);
    }
  }, [currentQuestionIndex]); // Removed onProgressUpdate from dependencies to prevent infinite loops

  useEffect(() => {
    if (questions.length > 0) {
      generateScrambledSentence();
    }
  }, [currentQuestionIndex, questions]);

  const generateQuestions = () => {
    const scrambleQuestions: ScrambleQuestion[] = [];
    
    interpretedVocabulary.forEach((vocab) => {
      // Use the front example (target language example)
      const exampleSentence = vocab.frontExample;
      if (exampleSentence) {
        scrambleQuestions.push({
          sentence: exampleSentence,
          scrambledWords: exampleSentence.split(' '),
          correctAnswer: exampleSentence
        });
      }
    });

    // Shuffle questions
    const shuffledQuestions = scrambleQuestions.sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
  };

  const generateScrambledSentence = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      const words = currentQuestion.correctAnswer.split(' ');
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      setScrambledWords(shuffledWords);
      setSelectedWords([]);
      setShowResult(false);
    }
  };

  const selectWord = (word: string, index: number) => {
    if (selectedWords.includes(word)) return;
    
    const newSelectedWords = [...selectedWords, word];
    setSelectedWords(newSelectedWords);
    
    // Remove the word from scrambled words
    const newScrambledWords = scrambledWords.filter((_, i) => i !== index);
    setScrambledWords(newScrambledWords);
  };

  const deselectWord = (word: string, index: number) => {
    const newSelectedWords = selectedWords.filter((_, i) => i !== index);
    setSelectedWords(newSelectedWords);
    
    // Add the word back to scrambled words
    setScrambledWords([...scrambledWords, word]);
  };

  const checkAnswer = () => {
    const userSentence = selectedWords.join(' ');
    const correctSentence = questions[currentQuestionIndex].correctAnswer;
    
    const correctAnswer = userSentence === correctSentence;
    setIsCorrect(correctAnswer);
    
    // Haptic feedback based on answer
    if (correctAnswer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(score + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      // Light haptic for moving to next question
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setGameComplete(true);
      }
    }, 2000);
  };

  const skipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setGameComplete(true);
    }
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedWords([]);
    setShowResult(false);
    setGameComplete(false);
  };

  if (gameComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('lessons.exercises.sentenceScramble')} {t('lessons.exercises.completed')}!</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.completionScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.completionContainer}>
            {/* Trophy Icon */}
            <View style={styles.trophyContainer}>
              <Ionicons name="trophy" size={80} color="#f59e0b" />
            </View>
            
            {/* Completion Title */}
            <Text style={styles.completionTitle}>🎉 Excellent Work!</Text>
            <Text style={styles.completionSubtitle}>{t('lessons.exercises.sentenceScramble')} {t('lessons.exercises.completed')}</Text>
            
            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="document-text" size={24} color="#6366f1" />
                </View>
                <Text style={styles.statValue}>{questions.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trending-up" size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.statValue}>{Math.round((score / questions.length) * 100)}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>
            
            {/* Performance Message */}
            <View style={styles.performanceContainer}>
              <Text style={styles.performanceText}>
                {score === questions.length 
                  ? "Perfect! You unscrambled every sentence correctly! 🌟"
                  : score >= questions.length * 0.8
                  ? "Great job! You're getting the hang of sentence structure! 👍"
                  : score >= questions.length * 0.6
                  ? "Good work! Keep practicing to improve your skills! 💪"
                  : "Nice try! Practice makes perfect! 🎯"
                }
              </Text>
            </View>
            
            {/* Continue Button */}
            <TouchableOpacity style={styles.completeButton} onPress={() => onComplete(score)}>
              <View style={styles.completeButtonContent}>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                <Text style={styles.completeButtonText}>{t('lessons.common.continue')} {t('lessons.common.to')} {t('lessons.common.next')} {t('lessons.exercise')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('lessons.exercises.sentenceScramble')}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No example sentences available for this lesson.</Text>
          <TouchableOpacity style={styles.skipButton} onPress={() => onComplete(0)}>
            <Text style={styles.skipButtonText}>{t('lessons.common.skip')} {t('lessons.common.to')} {t('lessons.common.next')} {t('lessons.exercise')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => {
            console.log('Close button touched in LessonSentenceScramble');
            onClose();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('lessons.exercises.sentenceScramble')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {t('lessons.common.question')} {currentQuestionIndex + 1} {t('lessons.common.of')} {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <Text style={styles.instructionText}>
            {t('lessons.sentenceScramble.instructions')}
          </Text>

          {/* Selected Words */}
          <View style={styles.selectedWordsContainer}>
            <Text style={styles.selectedWordsLabel}>{t('lessons.sentenceScramble.yourSentence')}</Text>
            <View style={styles.selectedWords}>
              {selectedWords.map((word, index) => (
                <TouchableOpacity
                  key={`selected-${index}`}
                  style={styles.selectedWord}
                  onPress={() => deselectWord(word, index)}
                >
                  <Text style={styles.selectedWordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Scrambled Words */}
          <View style={styles.scrambledWordsContainer}>
            <Text style={styles.scrambledWordsLabel}>{t('lessons.sentenceScramble.availableWords')}</Text>
            <View style={styles.scrambledWords}>
              {scrambledWords.map((word, index) => (
                <TouchableOpacity
                  key={`scrambled-${index}`}
                  style={styles.scrambledWord}
                  onPress={() => selectWord(word, index)}
                >
                  <Text style={styles.scrambledWordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.checkButton} onPress={checkAnswer}>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
              <Text style={styles.checkButtonText}>{t('lessons.common.check')} {t('lessons.common.answer')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={skipQuestion}>
              <Ionicons name="arrow-forward" size={20} color="#6366f1" />
              <Text style={styles.skipButtonText}>{t('lessons.common.skip')}</Text>
            </TouchableOpacity>
          </View>

          {/* Result Display */}
          {showResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>
                {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </Text>
              <Text style={styles.correctAnswerText}>
                Correct sentence: {currentQuestion.correctAnswer}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  questionContainer: {
    padding: 20,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  selectedWordsContainer: {
    marginBottom: 24,
  },
  selectedWordsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  selectedWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 50,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  selectedWord: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedWordText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrambledWordsContainer: {
    marginBottom: 24,
  },
  scrambledWordsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  scrambledWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scrambledWord: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scrambledWordText: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  checkButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skipButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultContainer: {
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
  completeButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
});
