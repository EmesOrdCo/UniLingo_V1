import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SpeedChallengeGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (score: number, time: number, totalAnswered?: number) => void;
  onPlayAgain: () => void;
  timeLimit?: number; // Add time limit prop
}

const SpeedChallengeGame: React.FC<SpeedChallengeGameProps> = ({ gameData, onClose, onGameComplete, onPlayAgain, timeLimit = 60 }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0); // Track total questions answered
  const gameStartTimeRef = useRef<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Use refs to capture final values when game completes
  const finalScoreRef = useRef<number>(0);
  const finalElapsedTimeRef = useRef<number>(0);
  const finalTotalAnsweredRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  useEffect(() => {
    gameStartTimeRef.current = Date.now();
    setElapsedTime(0); // Reset elapsed time when game starts
    
    // Set up timer to update elapsed time and check for game end
    const timer = setInterval(() => {
      const currentElapsedTime = Math.round((Date.now() - gameStartTimeRef.current) / 1000);
      setElapsedTime(currentElapsedTime);
      
      if (currentElapsedTime >= timeLimit) {
        // Capture final values when game completes
        console.log('⏰ Speed Challenge timer expired, capturing final values:', {
          score,
          currentElapsedTime,
          totalAnswered
        });
        finalScoreRef.current = score;
        finalElapsedTimeRef.current = currentElapsedTime;
        finalTotalAnsweredRef.current = totalAnswered;
        setGameComplete(true);
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLimit]);

  // Removed automatic completion call - now handled by user action buttons

  // Handle game completion - removed automatic call, now handled by user action

  const handleAnswerSubmit = () => {
    if (!userAnswer.trim()) return;
    
    const currentQuestion = gameData.questions[currentQuestionIndex];
    const correct = currentQuestion.correctAnswer.toLowerCase().trim();
    const userInput = userAnswer.toLowerCase().trim();
    
    const correctAnswer = userInput === correct;
    setIsCorrect(correctAnswer);
    
    if (correctAnswer) {
      setScore(score + 1);
    }
    
    setTotalAnswered(totalAnswered + 1); // Increment total answered
    setShowResult(true);
    
    setTimeout(() => {
      // For speed challenge, we cycle through questions indefinitely
      // Move to next question (cycling back to 0 if we reach the end)
      const nextIndex = (currentQuestionIndex + 1) % gameData.questions.length;
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer('');
      setShowResult(false);
    }, 1500);
  };

  const skipQuestion = () => {
    // For speed challenge, we cycle through questions indefinitely
    const nextIndex = (currentQuestionIndex + 1) % gameData.questions.length;
    setCurrentQuestionIndex(nextIndex);
    setUserAnswer('');
    setShowResult(false);
    setTotalAnswered(totalAnswered + 1); // Increment total answered for skip
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setUserAnswer('');
    setShowResult(false);
    setGameComplete(false);
    setTotalAnswered(0); // Reset total answered
    gameStartTimeRef.current = Date.now();
    setElapsedTime(0);
    
    // Reset refs
    finalScoreRef.current = 0;
    finalElapsedTimeRef.current = 0;
    finalTotalAnsweredRef.current = 0;
  };

  const handlePlayAgain = () => {
    // Call onGameComplete before closing to log results
    if (!completionCalledRef.current) {
      console.log('🎯 SpeedChallenge calling onGameComplete with score:', finalScoreRef.current, 'time:', finalElapsedTimeRef.current, 'totalAnswered:', finalTotalAnsweredRef.current);
      completionCalledRef.current = true;
      onGameComplete(finalScoreRef.current, finalElapsedTimeRef.current, finalTotalAnsweredRef.current);
    }
    onPlayAgain();
  };

  const handleReturnToMenu = () => {
    // Call onGameComplete before closing to log results
    if (!completionCalledRef.current) {
      console.log('🎯 SpeedChallenge calling onGameComplete with score:', finalScoreRef.current, 'time:', finalElapsedTimeRef.current, 'totalAnswered:', finalTotalAnsweredRef.current);
      completionCalledRef.current = true;
      onGameComplete(finalScoreRef.current, finalElapsedTimeRef.current, finalTotalAnsweredRef.current);
    }
    onClose();
  };

  if (gameComplete) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>🎉 Speed Challenge Complete!</Text>
          <Text style={styles.completionSubtitle}>Great job!</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{elapsedTime}s</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Speed</Text>
              <Text style={styles.statValue}>
                {elapsedTime > 0 ? Math.round((score / elapsedTime) * 60) : 0} q/min
              </Text>
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
      {/* Game Header */}
      <View style={styles.gameHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.timeText}>Time: {elapsedTime}s / {timeLimit}s</Text>
        </View>
        <Text style={styles.questionCounter}>
          Question {currentQuestionIndex + 1}
        </Text>
      </View>

      {/* Progress Bar - Show time progress instead of question progress */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${Math.min((elapsedTime / timeLimit) * 100, 100)}%` }
          ]} 
        />
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {currentQuestion.question || 'Answer quickly:'}
        </Text>
      </View>

      {/* Answer Input */}
      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>Your Answer:</Text>
        <TextInput
          style={styles.answerInput}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Type your answer..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!showResult}
          onSubmitEditing={handleAnswerSubmit}
          returnKeyType="done"
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
          onPress={handleAnswerSubmit}
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
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6466E9',
  },
  questionCounter: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6466E9',
    borderRadius: 3,
  },
  questionContainer: {
    margin: 20,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 28,
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
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
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
    gap: 32,
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6466E9',
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

export default SpeedChallengeGame;
