import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HangmanGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const HangmanGame: React.FC<HangmanGameProps> = ({ gameData, onClose, onGameComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [currentWord, setCurrentWord] = useState('');

  const maxWrongGuesses = 6;

  useEffect(() => {
    if (gameData.questions && gameData.questions.length > 0) {
      initializeNewWord();
    }
  }, [currentQuestionIndex, gameData.questions]);

  const initializeNewWord = () => {
    const currentQuestion = gameData.questions[currentQuestionIndex];
    if (currentQuestion && currentQuestion.correctAnswer) {
      setCurrentWord(currentQuestion.correctAnswer.toLowerCase());
      setGuessedLetters([]);
      setWrongGuesses(0);
    }
  };

  const handleLetterGuess = (letter: string) => {
    if (guessedLetters.includes(letter)) return;

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    if (!currentWord.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);

      if (newWrongGuesses >= maxWrongGuesses) {
        // Game over - word not guessed
        setTimeout(() => {
          if (currentQuestionIndex < gameData.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else {
            setGameComplete(true);
          }
        }, 2000);
      }
    } else {
      // Check if word is completely guessed
      const isWordComplete = currentWord.split('').every(char => 
        newGuessedLetters.includes(char)
      );

      if (isWordComplete) {
        setScore(score + 1);
        setTimeout(() => {
          if (currentQuestionIndex < gameData.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else {
            setGameComplete(true);
          }
        }, 1500);
      }
    }
  };

  const getDisplayWord = () => {
    return currentWord.split('').map(letter => 
      guessedLetters.includes(letter) ? letter : '_'
    ).join(' ');
  };

  const getHangmanStage = () => {
    const stages = [
      'head',
      'body', 
      'leftArm',
      'rightArm',
      'leftLeg',
      'rightLeg'
    ];
    return stages.slice(0, wrongGuesses);
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameComplete(false);
  };

  if (gameComplete) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>🎉 Hangman Complete!</Text>
          <Text style={styles.completionSubtitle}>Your Results: {score}/{gameData.questions.length}</Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>
              {Math.round((score / gameData.questions.length) * 100)}%
            </Text>
          </View>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentQuestion = gameData.questions[currentQuestionIndex];
  const isGameOver = wrongGuesses >= maxWrongGuesses;
  const isWordGuessed = currentWord.split('').every(char => guessedLetters.includes(char));

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

      {/* Hangman Drawing */}
      <View style={styles.hangmanContainer}>
        <View style={styles.hangman}>
          {/* Base */}
          <View style={styles.hangmanBase} />
          
          {/* Vertical pole */}
          <View style={styles.hangmanPole} />
          
          {/* Top bar */}
          <View style={styles.hangmanTop} />
          
          {/* Rope */}
          <View style={styles.hangmanRope} />
          
          {/* Head */}
          {getHangmanStage().includes('head') && (
            <View style={styles.hangmanHead} />
          )}
          
          {/* Body */}
          {getHangmanStage().includes('body') && (
            <View style={styles.hangmanBody} />
          )}
          
          {/* Arms */}
          {getHangmanStage().includes('leftArm') && (
            <View style={styles.hangmanLeftArm} />
          )}
          {getHangmanStage().includes('rightArm') && (
            <View style={styles.hangmanRightArm} />
          )}
          
          {/* Legs */}
          {getHangmanStage().includes('leftLeg') && (
            <View style={styles.hangmanLeftLeg} />
          )}
          {getHangmanStage().includes('rightLeg') && (
            <View style={styles.hangmanRightLeg} />
          )}
        </View>
      </View>

      {/* Word Display */}
      <View style={styles.wordContainer}>
        <Text style={styles.wordLabel}>Word:</Text>
        <Text style={styles.wordDisplay}>{getDisplayWord()}</Text>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {currentQuestion.question || 'Guess the word:'}
        </Text>
      </View>

      {/* Game Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Wrong guesses: {wrongGuesses}/{maxWrongGuesses}
        </Text>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      {/* Letter Grid */}
      <View style={styles.letterGrid}>
        {Array.from('abcdefghijklmnopqrstuvwxyz').map(letter => (
          <TouchableOpacity
            key={letter}
            style={[
              styles.letterButton,
              guessedLetters.includes(letter) && styles.letterButtonGuessed,
              guessedLetters.includes(letter) && !currentWord.includes(letter) && styles.letterButtonWrong,
              guessedLetters.includes(letter) && currentWord.includes(letter) && styles.letterButtonCorrect,
            ]}
            onPress={() => handleLetterGuess(letter)}
            disabled={guessedLetters.includes(letter) || isGameOver || isWordGuessed}
          >
            <Text style={[
              styles.letterButtonText,
              guessedLetters.includes(letter) && styles.letterButtonTextGuessed,
            ]}>
              {letter.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Game Result Message */}
      {(isGameOver || isWordGuessed) && (
        <View style={styles.resultContainer}>
          <Text style={[
            styles.resultText,
            isWordGuessed ? styles.resultTextCorrect : styles.resultTextIncorrect
          ]}>
            {isWordGuessed ? '🎉 Correct!' : '💀 Game Over!'}
          </Text>
          <Text style={styles.correctAnswerText}>
            The word was: {currentWord.toUpperCase()}
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
  hangmanContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  hangman: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  hangmanBase: {
    position: 'absolute',
    bottom: 0,
    left: 50,
    right: 50,
    height: 10,
    backgroundColor: '#8b5cf6',
    borderRadius: 5,
  },
  hangmanPole: {
    position: 'absolute',
    bottom: 10,
    left: 95,
    width: 10,
    height: 150,
    backgroundColor: '#8b5cf6',
  },
  hangmanTop: {
    position: 'absolute',
    top: 0,
    left: 95,
    width: 100,
    height: 10,
    backgroundColor: '#8b5cf6',
  },
  hangmanRope: {
    position: 'absolute',
    top: 10,
    left: 145,
    width: 2,
    height: 30,
    backgroundColor: '#8b5cf6',
  },
  hangmanHead: {
    position: 'absolute',
    top: 40,
    left: 135,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  hangmanBody: {
    position: 'absolute',
    top: 60,
    left: 140,
    width: 10,
    height: 40,
    backgroundColor: '#8b5cf6',
  },
  hangmanLeftArm: {
    position: 'absolute',
    top: 70,
    left: 130,
    width: 20,
    height: 4,
    backgroundColor: '#8b5cf6',
    transform: [{ rotate: '45deg' }],
  },
  hangmanRightArm: {
    position: 'absolute',
    top: 70,
    left: 150,
    width: 20,
    height: 4,
    backgroundColor: '#8b5cf6',
    transform: [{ rotate: '-45deg' }],
  },
  hangmanLeftLeg: {
    position: 'absolute',
    top: 100,
    left: 135,
    width: 4,
    height: 20,
    backgroundColor: '#8b5cf6',
    transform: [{ rotate: '45deg' }],
  },
  hangmanRightLeg: {
    position: 'absolute',
    top: 100,
    left: 151,
    width: 4,
    height: 20,
    backgroundColor: '#8b5cf6',
    transform: [{ rotate: '-45deg' }],
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wordLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  wordDisplay: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 4,
  },
  questionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  scoreText: {
    fontSize: 14,
    color: '#6466E9',
    fontWeight: '600',
  },
  letterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  letterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  letterButtonGuessed: {
    borderColor: '#94a3b8',
  },
  letterButtonCorrect: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  letterButtonWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  letterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  letterButtonTextGuessed: {
    color: '#94a3b8',
  },
  resultContainer: {
    marginHorizontal: 20,
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
  resetButton: {
    backgroundColor: '#6466E9',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default HangmanGame;
