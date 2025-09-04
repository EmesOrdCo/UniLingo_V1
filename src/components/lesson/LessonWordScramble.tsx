import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LessonWordScrambleProps {
  vocabulary: any[];
  onComplete: (score: number) => void;
  onClose: () => void;
}

interface WordScrambleQuestion {
  word: string;
  scrambledWord: string;
  hint: string;
}

export default function LessonWordScramble({ vocabulary, onComplete, onClose }: LessonWordScrambleProps) {
  const [questions, setQuestions] = useState<WordScrambleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scrambledWord, setScrambledWord] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, [vocabulary]);

  useEffect(() => {
    if (questions.length > 0) {
      generateScrambledWord();
    }
  }, [currentQuestionIndex, questions]);

  const generateQuestions = () => {
    const scrambleQuestions: WordScrambleQuestion[] = [];
    
    vocabulary.forEach((vocab) => {
      const word = vocab.keywords;
      const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
      
      scrambleQuestions.push({
        word: word,
        scrambledWord: scrambled,
        hint: vocab.definition
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
    
    if (correctAnswer) {
      setScore(score + 1);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Word Scramble Complete!</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.completionContainer}>
          <Ionicons name="grid" size={80} color="#6366f1" />
          <Text style={styles.completionTitle}>🎉 Word Scramble Complete!</Text>
          <Text style={styles.completionSubtitle}>
            Your Results: {score}/{questions.length}
          </Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>
              {Math.round((score / questions.length) * 100)}%
            </Text>
          </View>
          
          <TouchableOpacity style={styles.completeButton} onPress={() => onComplete(score)}>
            <Text style={styles.completeButtonText}>Complete Lesson</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6366f1" />
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
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#6366f1" />
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
            <Text style={styles.hintText}>{currentQuestion.hint}</Text>
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
    </View>
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
    fontWeight: '600',
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
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scorePercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  completeButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
