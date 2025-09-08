import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FlashcardQuizGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onPlayAgain: () => void;
  userProfile: any;
}

const FlashcardQuizGame: React.FC<FlashcardQuizGameProps> = ({ 
  gameData, 
  onClose, 
  onGameComplete, 
  onPlayAgain,
  userProfile 
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  
  // Get language mode from gameData
  const languageMode = gameData.languageMode || 'question';
  
  const question = gameData.questions[currentQuestion];
  
  const handleAnswerSelect = (answer: string) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestion] = answer;
    setUserAnswers(newUserAnswers);
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    // Don't update score immediately to prevent percentage flashing
    const isCorrect = answer === question.correctAnswer;
    
    setTimeout(() => {
      // Update score after showing result
      if (isCorrect) {
        setScore(score + 1);
      }
      
      if (currentQuestion < gameData.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setShowReview(true);
      }
    }, 1500);
  };
  
  const handlePlayAgain = () => {
    // Close game and return to setup screen
    onPlayAgain();
  };

  const handleReturnToMenu = () => {
    onClose();
  };
  
  // Review Screen
  if (showReview) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>🎉 Flashcard Quiz Complete!</Text>
          <Text style={styles.completionSubtitle}>Great job!</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{score}/{gameData.questions.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Percentage</Text>
              <Text style={styles.statValue}>{Math.round((score / gameData.questions.length) * 100)}%</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={handlePlayAgain}>
              <Text style={styles.resetButtonText}>Play Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.exitButton} onPress={handleReturnToMenu}>
              <Text style={styles.exitButtonText}>Return to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  
  // Main Game Screen
  return (
    <View style={styles.gameContainer}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / gameData.questions.length) * 100}%` }]} />
      </View>
      
      {/* Question Counter */}
      <View style={styles.questionCounter}>
        <Text style={styles.questionCounterText}>
          {currentQuestion + 1} of {gameData.questions.length}
        </Text>
      </View>
      
      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {languageMode === 'question' ? question.question : question.correctAnswer}
        </Text>
      </View>
      
      {/* Answer Options */}
      <View style={styles.answersContainer}>
        {question.options.map((option: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerButton,
              selectedAnswer === option && styles.answerButtonSelected,
              showResult && option === question.correctAnswer && styles.answerButtonCorrect,
              showResult && selectedAnswer === option && option !== question.correctAnswer && styles.answerButtonIncorrect
            ]}
            onPress={() => !showResult && handleAnswerSelect(option)}
            disabled={showResult}
          >
            <Text style={[
              styles.answerButtonText,
              selectedAnswer === option && styles.answerButtonTextSelected,
              showResult && option === question.correctAnswer && styles.answerButtonTextCorrect,
              showResult && selectedAnswer === option && option !== question.correctAnswer && styles.answerButtonTextIncorrect
            ]}>
              {option}
            </Text>
            
            {showResult && option === question.correctAnswer && (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" style={styles.resultIcon} />
            )}
            
            {showResult && selectedAnswer === option && option !== question.correctAnswer && (
              <Ionicons name="close-circle" size={24} color="#ef4444" style={styles.resultIcon} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Result Message */}
      {showResult && (
        <View style={styles.resultMessage}>
          <Text style={[
            styles.resultText,
            selectedAnswer === question.correctAnswer ? styles.resultTextCorrect : styles.resultTextIncorrect
          ]}>
            {selectedAnswer === question.correctAnswer ? 'Correct! 🎉' : 'Incorrect! 😔'}
          </Text>
          <Text style={styles.resultSubtext}>
            {selectedAnswer === question.correctAnswer 
              ? 'Great job!' 
              : `The correct answer is: ${question.correctAnswer}`
            }
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 2,
  },
  questionCounter: {
    alignItems: 'center',
    marginTop: 16,
  },
  questionCounterText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  questionContainer: {
    marginHorizontal: 20,
    marginTop: 32,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 26,
  },
  answersContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  answerButton: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  answerButtonSelected: {
    borderColor: '#6466E9',
    backgroundColor: '#f0f4ff',
  },
  answerButtonCorrect: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  answerButtonIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  answerButtonTextSelected: {
    color: '#6466E9',
    fontWeight: '600',
  },
  answerButtonTextCorrect: {
    color: '#10b981',
    fontWeight: '600',
  },
  answerButtonTextIncorrect: {
    color: '#ef4444',
    fontWeight: '600',
  },
  resultIcon: {
    marginLeft: 12,
  },
  resultMessage: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  resultTextCorrect: {
    color: '#10b981',
  },
  resultTextIncorrect: {
    color: '#ef4444',
  },
  resultSubtext: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  // Review styles
  reviewHeader: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  reviewSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreSummary: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6466E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scorePercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  scoreText: {
    fontSize: 16,
    color: '#64748b',
  },
  reviewFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#6466E9',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  reviewContent: {
    flex: 1,
    padding: 20,
  },
  reviewQuestion: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  resultIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCorrect: {
    backgroundColor: '#10b981',
  },
  resultIncorrect: {
    backgroundColor: '#ef4444',
  },
  answerSection: {
    marginTop: 12,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userAnswer: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    padding: 8,
    borderRadius: 6,
  },
  userAnswerCorrect: {
    color: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  userAnswerIncorrect: {
    color: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  correctAnswer: {
    fontSize: 16,
    fontWeight: '500',
    color: '#10b981',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0fdf4',
  },
  reviewFooter: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6466E9',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6466E9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  exitButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
});

export default FlashcardQuizGame;
