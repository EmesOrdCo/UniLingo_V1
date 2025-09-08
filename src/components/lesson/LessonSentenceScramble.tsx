import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
  const [questions, setQuestions] = useState<ScrambleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
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
  }, [currentQuestionIndex, onProgressUpdate]);

  useEffect(() => {
    if (questions.length > 0) {
      generateScrambledSentence();
    }
  }, [currentQuestionIndex, questions]);

  const generateQuestions = () => {
    const scrambleQuestions: ScrambleQuestion[] = [];
    
    vocabulary.forEach((vocab) => {
      if (vocab.example_sentence_en) {
        scrambleQuestions.push({
          sentence: vocab.example_sentence_en,
          scrambledWords: vocab.example_sentence_en.split(' '),
          correctAnswer: vocab.example_sentence_en
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
    setSelectedWords([]);
    setShowResult(false);
    setGameComplete(false);
  };

  if (gameComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sentence Scramble Complete!</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.completionContainer}>
          <Ionicons name="text" size={80} color="#6366f1" />
          <Text style={styles.completionTitle}>🎉 Sentence Scramble Complete!</Text>
          <Text style={styles.completionSubtitle}>
            Your Results: {score}/{questions.length}
          </Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>
              {Math.round((score / questions.length) * 100)}%
            </Text>
          </View>
          
          <TouchableOpacity style={styles.completeButton} onPress={() => onComplete(score)}>
            <Text style={styles.completeButtonText}>Continue to Next Exercise</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sentence Scramble</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No example sentences available for this lesson.</Text>
          <TouchableOpacity style={styles.skipButton} onPress={() => onComplete(0)}>
            <Text style={styles.skipButtonText}>Skip to Next Exercise</Text>
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
        <Text style={styles.headerTitle}>Sentence Scramble</Text>
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
            Unscramble the words to form the correct sentence:
          </Text>

          {/* Selected Words */}
          <View style={styles.selectedWordsContainer}>
            <Text style={styles.selectedWordsLabel}>Your sentence:</Text>
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
            <Text style={styles.scrambledWordsLabel}>Available words:</Text>
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
