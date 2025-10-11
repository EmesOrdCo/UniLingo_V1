import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface LessonWordScrambleProps {
  vocabulary: any[];
  onComplete: (score: number) => void;
  onClose: () => void;
  onProgressUpdate?: (questionIndex: number) => void;
  initialQuestionIndex?: number;
}

interface WordScrambleQuestion {
  word: string;
  scrambledWord: string;
  hint: string;
}

export default function LessonWordScramble({ vocabulary, onComplete, onClose, onProgressUpdate, initialQuestionIndex = 0 }: LessonWordScrambleProps) {
  const [questions, setQuestions] = useState<WordScrambleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [scrambledWord, setScrambledWord] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, [vocabulary]);

  // Update progress when question index changes
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(currentQuestionIndex);
    }
  }, [currentQuestionIndex]); // Removed onProgressUpdate from dependencies to prevent infinite loops

  useEffect(() => {
    if (questions.length > 0) {
      generateScrambledWord();
    }
  }, [currentQuestionIndex, questions]);

  const generateQuestions = () => {
    const scrambleQuestions: WordScrambleQuestion[] = [];
    
    vocabulary.forEach((vocab) => {
      // Safety check to ensure vocab exists and has required properties
      if (!vocab || !vocab.keywords) {
        console.warn('Skipping invalid vocabulary item:', vocab);
        return;
      }
      
      const word = vocab.keywords;
      const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
      
      scrambleQuestions.push({
        word: word,
        scrambledWord: scrambled,
        hint: vocab.definition || `Translation: ${vocab.native_translation || 'N/A'}`
      });
    });

    // Shuffle questions
    const shuffledQuestions = scrambleQuestions.sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
  };

  const generateScrambledWord = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      const word = currentQuestion.word;
      const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
      setScrambledWord(scrambled);
      setUserAnswer('');
      setShowResult(false);
    }
  };

  const checkAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const correct = currentQuestion.word.toLowerCase().trim();
    const userInput = userAnswer.toLowerCase().trim();
    
    const correctAnswer = userInput === correct;
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
    setUserAnswer('');
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
          <Text style={styles.headerTitle}>Word Scramble Complete!</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.completionScrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.completionContainer}>
            {/* Trophy Icon */}
            <View style={styles.trophyContainer}>
              <Ionicons name="trophy" size={80} color="#f59e0b" />
            </View>
            
            {/* Completion Title */}
            <Text style={styles.completionTitle}>🎉 Fantastic Work!</Text>
            <Text style={styles.completionSubtitle}>Word Scramble Complete</Text>
            
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
                  <Ionicons name="grid" size={24} color="#6366f1" />
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
                  ? "Perfect! You unscrambled every word correctly! 🌟"
                  : score >= questions.length * 0.8
                  ? "Excellent! You're mastering word patterns! 🎯"
                  : score >= questions.length * 0.6
                  ? "Great job! Keep practicing to improve! 💪"
                  : "Nice try! Practice makes perfect! 🚀"
                }
              </Text>
            </View>
            
            {/* Continue Button */}
            <TouchableOpacity style={styles.completeButton} onPress={() => onComplete(score)}>
              <View style={styles.completeButtonContent}>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                <Text style={styles.completeButtonText}>Continue to Next Exercise</Text>
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
          <Text style={styles.headerTitle}>Word Scramble</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No vocabulary available for this lesson.</Text>
          <TouchableOpacity style={styles.skipButton} onPress={() => onComplete(0)}>
            <Text style={styles.skipButtonText}>Complete Lesson</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Safety check
  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Word Scramble</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => {
            console.log('Close button touched in LessonWordScramble');
            onClose();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Word Scramble</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <Text style={styles.instructionText}>
            Unscramble the word below:
          </Text>

          {/* Scrambled Word Display */}
          <View style={styles.scrambledWordContainer}>
            <Text style={styles.scrambledWordLabel}>Scrambled word:</Text>
            <Text style={styles.scrambledWordText}>{scrambledWord}</Text>
          </View>

          {/* Hint */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintLabel}>Hint:</Text>
            <Text style={styles.hintText}>{currentQuestion?.hint || 'No hint available'}</Text>
          </View>

          {/* Answer Input */}
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>Your answer:</Text>
            <TextInput
              style={styles.answerInput}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Type the unscrambled word..."
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!showResult}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.checkButton, !userAnswer.trim() && styles.checkButtonDisabled]} 
              onPress={checkAnswer}
              disabled={!userAnswer.trim() || showResult}
            >
              <Ionicons name="checkmark" size={20} color="#ffffff" />
              <Text style={styles.checkButtonText}>Check Answer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={skipQuestion}>
              <Ionicons name="arrow-forward" size={20} color="#6366f1" />
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Result Display */}
          {showResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>
                {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </Text>
              <Text style={styles.correctAnswerText}>
                Correct answer: {currentQuestion.word}
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  scrambledWordContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  scrambledWordLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  scrambledWordText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366f1',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  hintContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  hintLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
  },
  answerContainer: {
    marginBottom: 24,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  answerInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    textAlign: 'center',
    textTransform: 'lowercase',
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
  checkButtonDisabled: {
    backgroundColor: '#cbd5e1',
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
});
