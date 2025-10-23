import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../lib/i18n';

interface HangmanGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onPlayAgain: () => void;
}

const HangmanGame: React.FC<HangmanGameProps> = ({ gameData, onClose, onGameComplete, onPlayAgain }) => {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [currentWord, setCurrentWord] = useState('');

  const maxWrongGuesses = 6;

  // Use ref to capture final score and prevent multiple calls
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  // Removed automatic completion call - now handled by user action buttons

  useEffect(() => {
    if (gameData.questions && gameData.questions.length > 0) {
      initializeNewWord();
    }
  }, [currentQuestionIndex, gameData.questions]);

  const initializeNewWord = () => {
    const currentQuestion = gameData.questions[currentQuestionIndex];
    if (currentQuestion && currentQuestion.correctAnswer) {
      // Use a small delay to prevent abrupt layout changes
      setTimeout(() => {
        setCurrentWord(currentQuestion.correctAnswer.toLowerCase());
        setGuessedLetters([]);
        setWrongGuesses(0);
      }, 300); // Increased to 300ms to be longer than GamesScreen's 200ms debounce // Small delay to allow current state to settle
    }
  };

  const handleLetterGuess = (letter: string) => {
    if (guessedLetters.includes(letter)) return;

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    if (!currentWord.includes(letter)) {
      // Incorrect letter - haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      const newWrongGuesses = wrongGuesses + 1;
      setWrongGuesses(newWrongGuesses);

      if (newWrongGuesses >= maxWrongGuesses) {
        // Game over - word not guessed
        setTimeout(() => {
          // Light haptic for moving to next question
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          
          if (currentQuestionIndex < gameData.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else {
            // Capture final score before completing game
            finalScoreRef.current = score;
            setGameComplete(true);
          }
        }, 2000);
      }
    } else {
      // Correct letter - haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Check if word is completely guessed
      const isWordComplete = currentWord.split('').every(char => 
        newGuessedLetters.includes(char)
      );

      if (isWordComplete) {
        setScore(score + 1);
        setTimeout(() => {
          // Light haptic for moving to next question
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          
          if (currentQuestionIndex < gameData.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else {
            // Capture final score before completing game
            finalScoreRef.current = score + 1; // +1 because we just scored
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
    finalScoreRef.current = 0; // Reset the ref as well
    completionCalledRef.current = false; // Reset completion called flag
  };

  const handlePlayAgain = () => {
    // Call onGameComplete before closing to log results
    if (!completionCalledRef.current) {
      console.log('🎯 Hangman calling onGameComplete with score:', finalScoreRef.current);
      completionCalledRef.current = true;
      onGameComplete(finalScoreRef.current);
      
      // Add delay to allow completion processing to finish
      setTimeout(() => {
        onPlayAgain();
      }, 300); // Increased to 300ms to be longer than GamesScreen's 200ms debounce
    } else {
      onPlayAgain();
    }
  };

  const handleReturnToMenu = () => {
    // Call onGameComplete before closing to log results
    if (!completionCalledRef.current) {
      console.log('🎯 Hangman calling onGameComplete with score:', finalScoreRef.current);
      completionCalledRef.current = true;
      onGameComplete(finalScoreRef.current);
      
      // Add delay to allow completion processing to finish
      setTimeout(() => {
        onClose();
      }, 300); // Increased to 300ms to be longer than GamesScreen's 200ms debounce
    } else {
      onClose();
    }
  };

  if (gameComplete) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>{t('gameCompletion.title.hangman')}</Text>
          <Text style={styles.completionSubtitle}>{t('gameCompletion.subtitle.greatJob')}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('gameCompletion.stats.score')}</Text>
              <Text style={styles.statValue}>{score}/{gameData.questions.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('gameCompletion.stats.percentage')}</Text>
              <Text style={styles.statValue}>{Math.round((score / gameData.questions.length) * 100)}%</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={handlePlayAgain}>
              <Text style={styles.resetButtonText}>{t('gameCompletion.buttons.playAgain')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.exitButton} onPress={handleReturnToMenu}>
              <Text style={styles.exitButtonText}>{t('gameCompletion.buttons.returnToMenu')}</Text>
            </TouchableOpacity>
          </View>
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
        <View style={styles.chalkboardFrame}>
          <View style={styles.chalkboard}>
            {/* Chalk dust particles */}
            <View style={styles.chalkDust1} />
            <View style={styles.chalkDust2} />
            <View style={styles.chalkDust3} />
            <View style={styles.chalkDust4} />
            <View style={styles.chalkDust5} />
            <View style={styles.chalkDust6} />
            <View style={styles.chalkDust7} />
            <View style={styles.chalkDust8} />
            
            {/* Chalk smudges */}
            <View style={styles.chalkSmudge1} />
            <View style={styles.chalkSmudge2} />
            <View style={styles.chalkSmudge3} />
            
            {/* Decorative background elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />
            
            {/* SVG Hangman Drawing */}
            <Svg height="240" width="320" style={styles.hangmanSvg}>
              {/* Base - hand-drawn chalk line with texture */}
              <Path
                d="M 50 200 Q 60 195 70 200 T 90 200 Q 100 195 110 200 T 130 200 Q 140 195 150 200 T 170 200 Q 180 195 190 200 T 210 200 Q 220 195 230 200 T 250 200"
                stroke="#ffffff"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
                strokeDasharray="8 2 3 1 2 1 4 2"
                strokeDashoffset="0"
              />
              
              {/* Pole - slightly wobbly vertical line with chalk texture */}
              <Path
                d="M 150 200 Q 152 180 150 160 Q 148 140 150 120 Q 152 100 150 80 Q 148 60 150 40 Q 152 20 150 0"
                stroke="#ffffff"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
                strokeDasharray="12 3 2 1 3 2 1 2"
                strokeDashoffset="5"
              />
              
              {/* Top beam - slightly curved horizontal line with texture */}
              <Path
                d="M 150 0 Q 170 -2 190 0 Q 210 2 230 0 Q 250 -2 270 0"
                stroke="#ffffff"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
                strokeDasharray="10 2 1 1 2 1 3 2"
                strokeDashoffset="3"
              />
              
              {/* Rope - shorter vertical line with chalk texture */}
              <Path
                d="M 270 0 Q 272 15 270 30"
                stroke="#ffffff"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
                strokeDasharray="6 1 2 1 1 1 3 1"
                strokeDashoffset="2"
              />
              
              {/* Head - hand-drawn circle with chalk texture */}
              {getHangmanStage().includes('head') && (
                <Path
                  d="M 270 50 Q 290 50 290 70 Q 290 90 270 90 Q 250 90 250 70 Q 250 50 270 50"
                  stroke="#ffffff"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                  strokeDasharray="15 3 2 1 2 1 1 2"
                  strokeDashoffset="7"
                />
              )}
              
              {/* Body - slightly wobbly vertical line with chalk texture */}
              {getHangmanStage().includes('body') && (
                <Path
                  d="M 270 90 Q 272 110 270 130 Q 268 150 270 170"
                  stroke="#ffffff"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                  strokeDasharray="8 2 1 1 2 1 3 2"
                  strokeDashoffset="4"
                />
              )}
              
              {/* Left Arm with chalk texture */}
              {getHangmanStage().includes('leftArm') && (
                <Path
                  d="M 270 110 Q 250 120 230 130"
                  stroke="#ffffff"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                  strokeDasharray="7 2 1 1 1 1 2 1"
                  strokeDashoffset="3"
                />
              )}
              
              {/* Right Arm with chalk texture */}
              {getHangmanStage().includes('rightArm') && (
                <Path
                  d="M 270 110 Q 290 120 310 130"
                  stroke="#ffffff"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                  strokeDasharray="6 1 2 1 1 1 3 1"
                  strokeDashoffset="2"
                />
              )}
              
              {/* Left Leg with chalk texture */}
              {getHangmanStage().includes('leftLeg') && (
                <Path
                  d="M 270 170 Q 250 180 230 185"
                  stroke="#ffffff"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                  strokeDasharray="8 2 1 1 2 1 2 1"
                  strokeDashoffset="4"
                />
              )}
              
              {/* Right Leg with chalk texture */}
              {getHangmanStage().includes('rightLeg') && (
                <Path
                  d="M 270 170 Q 290 180 310 185"
                  stroke="#ffffff"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                  strokeDasharray="7 1 2 1 1 1 3 1"
                  strokeDashoffset="3"
                />
              )}
            </Svg>
          </View>
        </View>
      </View>

      {/* Word Display */}
      <View style={styles.wordContainer}>
        <Text style={styles.wordLabel}>{t('hangman.word')}</Text>
        <Text style={styles.wordDisplay}>{getDisplayWord()}</Text>
      </View>


      {/* Game Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {t('gameCompletion.stats.wrongGuesses')}: {wrongGuesses}/{maxWrongGuesses}
        </Text>
        <Text style={styles.scoreText}>{t('gameCompletion.stats.score')}: {score}</Text>
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
    minHeight: 80, // Fixed height to prevent layout shifts
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
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  chalkboardFrame: {
    backgroundColor: '#8b4513',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#654321',
  },
  chalkboard: {
    width: 320,
    height: 240,
    position: 'relative',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    borderColor: '#2d2d2d',
    // Chalkboard texture effect
    borderStyle: 'solid',
  },
  chalkDust1: {
    position: 'absolute',
    top: 30,
    left: 20,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  chalkDust2: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  chalkDust3: {
    position: 'absolute',
    bottom: 40,
    left: 30,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  chalkDust4: {
    position: 'absolute',
    top: 100,
    left: 50,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  chalkDust5: {
    position: 'absolute',
    bottom: 80,
    right: 40,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  chalkDust6: {
    position: 'absolute',
    top: 120,
    left: 80,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  chalkDust7: {
    position: 'absolute',
    bottom: 120,
    right: 80,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  chalkDust8: {
    position: 'absolute',
    top: 150,
    left: 120,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  chalkSmudge1: {
    position: 'absolute',
    top: 50,
    left: 60,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ rotate: '15deg' }],
  },
  chalkSmudge2: {
    position: 'absolute',
    bottom: 100,
    right: 60,
    width: 15,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '-20deg' }],
  },
  chalkSmudge3: {
    position: 'absolute',
    top: 180,
    left: 80,
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transform: [{ rotate: '45deg' }],
  },
  hangmanSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 50,
    left: 50,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 80,
    right: 50,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 60,
    left: 60,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
    paddingHorizontal: 16,
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
    textAlign: 'center',
    minWidth: '100%',
    paddingHorizontal: 8,
    minHeight: 50, // Fixed height to prevent layout shifts
    lineHeight: 50, // Consistent line height
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
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 100, // Fixed height to prevent layout shifts
    justifyContent: 'center', // Center content vertically
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
    paddingHorizontal: 24,
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
    paddingHorizontal: 24,
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

export default HangmanGame;
