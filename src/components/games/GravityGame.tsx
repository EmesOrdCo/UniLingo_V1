import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GravityGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const { width, height } = Dimensions.get('window');

const GravityGame: React.FC<GravityGameProps> = ({ gameData, onClose, onGameComplete }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Use ref to capture final score and prevent multiple calls
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  useEffect(() => {
    if ((gameComplete || gameOver) && !completionCalledRef.current) {
      console.log('🪐 Gravity Game calling onGameComplete with:', {
        score: finalScoreRef.current
      });
      completionCalledRef.current = true;
      onGameComplete(finalScoreRef.current);
    }
  }, [gameComplete, gameOver]); // Only depend on gameComplete and gameOver to avoid multiple calls

  const handleCorrectAnswer = () => {
    setScore(score + 1);
    if (currentQuestionIndex < gameData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Capture final score before completing game
      finalScoreRef.current = score + 1; // +1 because we just scored
      setGameComplete(true);
    }
  };

  const handleWrongAnswer = () => {
    const newLives = lives - 1;
    setLives(newLives);
    
    if (newLives <= 0) {
      // Capture final score before game over
      finalScoreRef.current = score;
      setGameOver(true);
    } else if (currentQuestionIndex < gameData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Capture final score before completing game
      finalScoreRef.current = score;
      setGameComplete(true);
    }
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameComplete(false);
    setCurrentQuestionIndex(0);
    finalScoreRef.current = 0; // Reset the ref as well
    completionCalledRef.current = false; // Reset completion called flag
  };

  const handleReturnToMenu = () => {
    onGameComplete(score);
  };

  if (gameComplete) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>🎉 Gravity Game Complete!</Text>
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
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
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

  if (gameOver) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>💥 Gravity Game Over!</Text>
          <Text style={styles.completionSubtitle}>Better luck next time!</Text>
          
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
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
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
          <Text style={styles.livesText}>Lives: {lives}</Text>
        </View>
        <Text style={styles.questionCounter}>
          {currentQuestionIndex + 1} of {gameData.questions.length}
        </Text>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Planet */}
        <View style={styles.planet}>
          <Ionicons name="planet" size={80} color="#3b82f6" />
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {currentQuestion.question || 'Defend the planet!'}
          </Text>
        </View>

        {/* Answer Options */}
        <View style={styles.answersContainer}>
          {currentQuestion.options?.map((option: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.answerButton}
              onPress={() => {
                if (option === currentQuestion.correctAnswer) {
                  handleCorrectAnswer();
                } else {
                  handleWrongAnswer();
                }
              }}
            >
              <Text style={styles.answerButtonText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  livesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  questionCounter: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  planet: {
    marginBottom: 40,
  },
  questionContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    borderRadius: 16,
    marginBottom: 40,
    maxWidth: width - 80,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 26,
  },
  answersContainer: {
    width: '100%',
    gap: 16,
  },
  answerButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
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
    backgroundColor: '#3b82f6',
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

export default GravityGame;
