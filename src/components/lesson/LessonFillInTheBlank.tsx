import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
}

export default function LessonFillInTheBlank({ vocabulary, onComplete, onClose, onProgressUpdate, initialQuestionIndex = 0 }: LessonFillInTheBlankProps) {
  const [questions, setQuestions] = useState<FillInTheBlankQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Generate questions from vocabulary
  React.useEffect(() => {
    const generatedQuestions: FillInTheBlankQuestion[] = vocabulary
      .filter(item => item && item.example_sentence_en && item.keywords && item.definition)
      .map(item => ({
        id: item.id,
        sentence: item.example_sentence_en,
        blankWord: item.keywords,
        hint: item.definition
      }))
      .slice(0, Math.min(10, vocabulary.length)); // Limit to 10 questions

    setQuestions(generatedQuestions);
  }, [vocabulary]);

  // Update progress when question index changes
  React.useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(currentQuestionIndex);
    }
  }, [currentQuestionIndex]); // Removed onProgressUpdate from dependencies to prevent infinite loops

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
    
    if (isAnswerCorrect) {
      setScore(score + 1);
    }
    
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setShowHint(false); // Reset hint visibility for next question
    } else {
      setGameComplete(true);
      onComplete(score);
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setShowHint(false); // Reset hint visibility for next question
    } else {
      setGameComplete(true);
      onComplete(score);
    }
  };

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => {
              console.log('Close button touched in LessonFillInTheBlank');
              onClose();
            }}
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
      </SafeAreaView>
    );
  }

  if (gameComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => {
              console.log('Close button touched in LessonFillInTheBlank');
              onClose();
            }}
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
                  ? "Perfect! You filled in every blank correctly! 🌟"
                  : score >= questions.length * 0.8
                  ? "Excellent! You're mastering vocabulary in context! 🎯"
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
          onPress={() => {
            console.log('Close button touched in LessonFillInTheBlank');
            onClose();
          }}
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
          {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1}</Text>
        
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

        {showResult && (
          <View style={styles.resultContainer}>
            <View style={[styles.resultIcon, { backgroundColor: isCorrect ? '#d1fae5' : '#fee2e2' }]}>
              <Ionicons 
                name={isCorrect ? 'checkmark' : 'close'} 
                size={24} 
                color={isCorrect ? '#10b981' : '#ef4444'} 
              />
            </View>
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
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  questionContainer: {
    flex: 1,
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
    padding: 24,
    marginBottom: 20,
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

