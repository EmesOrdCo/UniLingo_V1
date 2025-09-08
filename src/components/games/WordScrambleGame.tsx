import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WordScrambleGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onPlayAgain: () => void;
}

const WordScrambleGame: React.FC<WordScrambleGameProps> = ({ gameData, onClose, onGameComplete, onPlayAgain }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scrambledWord, setScrambledWord] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  // Use ref to capture final score and prevent multiple calls
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  useEffect(() => {
    if (gameData.questions && gameData.questions.length > 0) {
      generateScrambledWord();
    }
  }, [currentQuestionIndex, gameData.questions]);

  const generateScrambledWord = () => {
    const currentQuestion = gameData.questions[currentQuestionIndex];
    if (currentQuestion && currentQuestion.correctAnswer) {
      const word = currentQuestion.correctAnswer;
      const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
      setScrambledWord(scrambled);
      setUserAnswer('');
      setShowResult(false);
    }
  };

  const checkAnswer = () => {
    const currentQuestion = gameData.questions[currentQuestionIndex];
    const correct = currentQuestion.correctAnswer.toLowerCase().trim();
    const userInput = userAnswer.toLowerCase().trim();
    
    const correctAnswer = userInput === correct;
    setIsCorrect(correctAnswer);
    
    if (correctAnswer) {
      setScore(score + 1);
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      if (currentQuestionIndex < gameData.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Capture final score before completing game
        finalScoreRef.current = score + (correctAnswer ? 1 : 0);
        setGameComplete(true);
      }
    }, 2000);
  };

  const skipQuestion = () => {
    if (currentQuestionIndex < gameData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Capture final score before completing game
      finalScoreRef.current = score;
      setGameComplete(true);
    }
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setUserAnswer('');
    setShowResult(false);
    setGameComplete(false);
    finalScoreRef.current = 0; // Reset the ref as well
    completionCalledRef.current = false; // Reset completion called flag
  };

  const handlePlayAgain = () => {
    onPlayAgain();
  };

  const handleReturnToMenu = () => {
    onClose();
  };

  // Handle game completion - removed automatic call, now handled by user action

  if (gameComplete) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>🎉 Word Scramble Complete!</Text>
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

  const currentQuestion = gameData.questions[currentQuestionIndex];

  return (
    <View style={styles.gameContainer}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / gameData.questions.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1} of {gameData.questions.length}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {currentQuestion.question || 'Unscramble the word:'}
        </Text>
      </View>

      {/* Scrambled Word */}
      <View style={styles.scrambledContainer}>
        <Text style={styles.scrambledLabel}>Scrambled Word:</Text>
        <Text style={styles.scrambledWord}>{scrambledWord}</Text>
      </View>

      {/* Answer Input */}
      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>Your Answer:</Text>
        <TextInput
          style={styles.answerInput}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Type the unscrambled word..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!showResult}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.skipButton]} 
          onPress={skipQuestion}
          disabled={showResult}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.submitButton]} 
          onPress={checkAnswer}
          disabled={!userAnswer.trim() || showResult}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Result Message */}
      {showResult && (
        <View style={styles.resultContainer}>
          <View style={[
            styles.resultIcon,
            isCorrect ? styles.resultIconCorrect : styles.resultIconIncorrect
          ]}>
            <Ionicons 
              name={isCorrect ? "checkmark" : "close"} 
              size={32} 
              color="#ffffff" 
            />
          </View>
          
          <Text style={[
            styles.resultText,
            isCorrect ? styles.resultTextCorrect : styles.resultTextIncorrect
          ]}>
            {isCorrect ? 'Correct! 🎉' : 'Incorrect! 😔'}
          </Text>
          
          <Text style={styles.correctAnswerText}>
            The correct answer is: {currentQuestion.correctAnswer}
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
  progressHeader: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  questionContainer: {
    margin: 20,
    padding: 20,
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
  scrambledContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  scrambledLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '500',
  },
  scrambledWord: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6466E9',
    letterSpacing: 2,
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6466E9',
  },
  answerContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  answerLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '500',
  },
  answerInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1e293b',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'center',
  },
  actionButton: {
    flex: 0.6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#6466E9',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  resultContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultIconCorrect: {
    backgroundColor: '#10b981',
  },
  resultIconIncorrect: {
    backgroundColor: '#ef4444',
  },
  resultText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  resultTextCorrect: {
    color: '#10b981',
  },
  resultTextIncorrect: {
    color: '#ef4444',
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
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6466E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
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

export default WordScrambleGame;
