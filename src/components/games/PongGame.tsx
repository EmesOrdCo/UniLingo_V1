import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PongGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = Math.min(width - 40, 400);
const GAME_HEIGHT = height - 280;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const INITIAL_BALL_SPEED = 4;
const PADDLE_SPEED = 8;
const WIN_SCORE = 11;

type Ball = {
  x: number;
  y: number;
  dx: number;
  dy: number;
};

const PongGame: React.FC<PongGameProps> = ({ onClose, onGameComplete }) => {
  // Game state
  const [playerPaddleY, setPlayerPaddleY] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [aiPaddleY, setAiPaddleY] = useState(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const [ball, setBall] = useState<Ball>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    dx: INITIAL_BALL_SPEED,
    dy: INITIAL_BALL_SPEED,
  });
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerWon, setPlayerWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rallyCount, setRallyCount] = useState(0);

  // Refs
  const gameLoop = useRef<number | null>(null);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const lastPaddleY = useRef(playerPaddleY);

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const centerLine = useRef(new Animated.Value(0)).current;

  // AI difficulty - increases with rally count
  const getAiSpeed = useCallback(() => {
    return Math.min(PADDLE_SPEED * 0.7 + rallyCount * 0.1, PADDLE_SPEED * 0.95);
  }, [rallyCount]);

  // Move AI paddle
  const moveAiPaddle = useCallback(() => {
    const ballCenterY = ball.y + BALL_SIZE / 2;
    const paddleCenterY = aiPaddleY + PADDLE_HEIGHT / 2;
    const diff = ballCenterY - paddleCenterY;
    const aiSpeed = getAiSpeed();

    if (Math.abs(diff) > 5) {
      const move = Math.sign(diff) * aiSpeed;
      setAiPaddleY(prev => Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev + move)));
    }
  }, [ball.y, aiPaddleY, getAiSpeed]);

  // Reset ball
  const resetBall = useCallback((toRight: boolean) => {
    setBall({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      dx: toRight ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED,
      dy: (Math.random() - 0.5) * INITIAL_BALL_SPEED * 2,
    });
    setRallyCount(0);
  }, []);

  // Update ball position
  const updateBall = useCallback(() => {
    setBall(prevBall => {
      let newBall = { ...prevBall };
      newBall.x += newBall.dx;
      newBall.y += newBall.dy;

      // Top and bottom walls
      if (newBall.y <= 0 || newBall.y >= GAME_HEIGHT - BALL_SIZE) {
        newBall.dy *= -1;
        newBall.y = newBall.y <= 0 ? 0 : GAME_HEIGHT - BALL_SIZE;
      }

      // Player paddle (right side)
      const playerPaddleX = GAME_WIDTH - PADDLE_WIDTH - 10;
      if (
        newBall.x + BALL_SIZE >= playerPaddleX &&
        newBall.x + BALL_SIZE <= playerPaddleX + PADDLE_WIDTH + 5 &&
        newBall.y + BALL_SIZE >= playerPaddleY &&
        newBall.y <= playerPaddleY + PADDLE_HEIGHT &&
        newBall.dx > 0
      ) {
        // Calculate bounce angle based on where ball hits paddle
        const paddleCenter = playerPaddleY + PADDLE_HEIGHT / 2;
        const hitPos = (newBall.y + BALL_SIZE / 2 - paddleCenter) / (PADDLE_HEIGHT / 2);
        
        newBall.dx = -Math.abs(newBall.dx) * 1.05; // Speed up slightly and reverse
        newBall.dy = hitPos * Math.abs(newBall.dx) * 0.8;
        newBall.x = playerPaddleX - BALL_SIZE;
        
        setRallyCount(prev => prev + 1);
      }

      // AI paddle (left side)
      const aiPaddleX = 10;
      if (
        newBall.x <= aiPaddleX + PADDLE_WIDTH &&
        newBall.x >= aiPaddleX - 5 &&
        newBall.y + BALL_SIZE >= aiPaddleY &&
        newBall.y <= aiPaddleY + PADDLE_HEIGHT &&
        newBall.dx < 0
      ) {
        // Calculate bounce angle
        const paddleCenter = aiPaddleY + PADDLE_HEIGHT / 2;
        const hitPos = (newBall.y + BALL_SIZE / 2 - paddleCenter) / (PADDLE_HEIGHT / 2);
        
        newBall.dx = Math.abs(newBall.dx) * 1.05; // Speed up slightly and reverse
        newBall.dy = hitPos * Math.abs(newBall.dx) * 0.8;
        newBall.x = aiPaddleX + PADDLE_WIDTH;
        
        setRallyCount(prev => prev + 1);
      }

      // Score points
      if (newBall.x <= -BALL_SIZE) {
        // Player scores
        setPlayerScore(prev => {
          const newScore = prev + 1;
          if (newScore >= WIN_SCORE) {
            setGameOver(true);
            setPlayerWon(true);
          }
          return newScore;
        });
        resetBall(true);
        return prevBall;
      }

      if (newBall.x >= GAME_WIDTH + BALL_SIZE) {
        // AI scores
        setAiScore(prev => {
          const newScore = prev + 1;
          if (newScore >= WIN_SCORE) {
            setGameOver(true);
            setPlayerWon(false);
          }
          return newScore;
        });
        resetBall(false);
        return prevBall;
      }

      return newBall;
    });
  }, [playerPaddleY, aiPaddleY, resetBall]);

  // Main game loop
  const updateGame = useCallback(() => {
    if (isPaused || gameOver) return;
    
    updateBall();
    moveAiPaddle();
  }, [updateBall, moveAiPaddle, isPaused, gameOver]);

  // Game loop using requestAnimationFrame
  useEffect(() => {
    if (!isPaused && !gameOver) {
      const animate = () => {
        updateGame();
        gameLoop.current = requestAnimationFrame(animate);
      };
      gameLoop.current = requestAnimationFrame(animate);
    }
    return () => {
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current);
    };
  }, [updateGame, isPaused, gameOver]);

  // Handle game over
  useEffect(() => {
    if (gameOver && !completionCalledRef.current) {
      finalScoreRef.current = playerScore;
      completionCalledRef.current = true;
      console.log('🏓 Pong calling onGameComplete with score:', playerScore);
      setTimeout(() => {
        onGameComplete(playerScore);
      }, 100);
    }
  }, [gameOver, playerScore, onGameComplete]);

  // Background animations
  useEffect(() => {
    const createFloatAnimation = (animatedValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    const createPulseAnimation = (animatedValue: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    setTimeout(() => createFloatAnimation(bgFloat1, 4000).start(), 100);
    setTimeout(() => createFloatAnimation(bgFloat2, 3500).start(), 300);
    setTimeout(() => createPulseAnimation(centerLine).start(), 500);
  }, []);

  // Player paddle pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPaddleY.current = playerPaddleY;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = lastPaddleY.current + gestureState.dy;
        const clampedY = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, newY));
        setPlayerPaddleY(clampedY);
      },
      onPanResponderRelease: () => {
        lastPaddleY.current = playerPaddleY;
      },
    })
  ).current;

  const handleRestart = () => {
    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    setPlayerWon(false);
    setIsPaused(false);
    setRallyCount(0);
    resetBall(Math.random() > 0.5);
    setPlayerPaddleY(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    setAiPaddleY(GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    completionCalledRef.current = false;
    finalScoreRef.current = 0;
  };

  const handleClose = () => {
    if (!completionCalledRef.current) {
      finalScoreRef.current = playerScore;
      completionCalledRef.current = true;
      onGameComplete(playerScore);
    }
    onClose();
  };

  const floatInterpolate1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });
  const floatInterpolate2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const lineOpacity = centerLine.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.bgElement1, { transform: [{ translateY: floatInterpolate1 }] }]} />
        <Animated.View style={[styles.bgElement2, { transform: [{ translateY: floatInterpolate2 }] }]} />
        
        {/* Center dashed line */}
        <Animated.View style={[styles.centerLineContainer, { opacity: lineOpacity }]}>
          {[...Array(20)].map((_, i) => (
            <View key={i} style={styles.centerDash} />
          ))}
        </Animated.View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={28} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.title}>PONG</Text>
        <TouchableOpacity onPress={() => setIsPaused(!isPaused)} style={styles.pauseButton}>
          <Ionicons name={isPaused ? 'play-circle' : 'pause-circle'} size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Score Display */}
      <View style={styles.scoreDisplay}>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>AI</Text>
          <Text style={styles.scoreValue}>{aiScore}</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>YOU</Text>
          <Text style={styles.scoreValue}>{playerScore}</Text>
        </View>
      </View>

      {/* Rally Counter */}
      {rallyCount > 5 && (
        <View style={styles.rallyBadge}>
          <Text style={styles.rallyText}>Rally: {rallyCount}</Text>
        </View>
      )}

      {/* Game Area */}
      <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
        {/* AI Paddle (Left) */}
        <View
          style={[
            styles.paddle,
            styles.aiPaddle,
            {
              left: 10,
              top: aiPaddleY,
              width: PADDLE_WIDTH,
              height: PADDLE_HEIGHT,
            },
          ]}
        />

        {/* Player Paddle (Right) */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.paddle,
            styles.playerPaddle,
            {
              right: 10,
              top: playerPaddleY,
              width: PADDLE_WIDTH,
              height: PADDLE_HEIGHT,
            },
          ]}
        />

        {/* Ball */}
        <View
          style={[
            styles.ball,
            {
              left: ball.x,
              top: ball.y,
              width: BALL_SIZE,
              height: BALL_SIZE,
            },
          ]}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlLabel}>
          <Ionicons name="hand-left" size={20} color="#94A3B8" />
          <Text style={styles.controlText}>Drag right paddle or use buttons</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setPlayerPaddleY(prev => Math.max(0, prev - 40))}
          >
            <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setPlayerPaddleY(prev => Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev + 40))}
          >
            <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={[styles.resultCard, playerWon ? styles.winCard : styles.loseCard]}>
            <Ionicons 
              name={playerWon ? 'trophy' : 'sad'} 
              size={64} 
              color={playerWon ? '#F59E0B' : '#EF4444'} 
            />
            <Text style={styles.resultTitle}>
              {playerWon ? 'You Win!' : 'You Lose!'}
            </Text>
            <View style={styles.finalScoreDisplay}>
              <Text style={styles.finalScoreText}>YOU</Text>
              <Text style={styles.finalScoreValue}>{playerScore}</Text>
              <Text style={styles.finalScoreDivider}>-</Text>
              <Text style={styles.finalScoreValue}>{aiScore}</Text>
              <Text style={styles.finalScoreText}>AI</Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitButton} onPress={handleClose}>
                <Ionicons name="exit" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Pause Overlay */}
      {isPaused && !gameOver && (
        <View style={styles.overlay}>
          <View style={styles.pausedCard}>
            <Ionicons name="pause-circle" size={64} color="#3B82F6" />
            <Text style={styles.pausedTitle}>Paused</Text>
            <Text style={styles.pausedScore}>{aiScore} - {playerScore}</Text>
            <TouchableOpacity style={styles.resumeButton} onPress={() => setIsPaused(false)}>
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgElement1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    top: 100,
    left: 40,
  },
  bgElement2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    bottom: 150,
    right: 50,
  },
  centerLineContainer: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 4,
    marginLeft: -2,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  centerDash: {
    width: 4,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: 50,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  pauseButton: {
    padding: 5,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginVertical: 15,
  },
  scoreSection: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 5,
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreDivider: {
    width: 2,
    height: 60,
    backgroundColor: '#374151',
  },
  rallyBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  rallyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gameArea: {
    backgroundColor: '#000000',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  paddle: {
    position: 'absolute',
    borderRadius: 6,
  },
  aiPaddle: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  playerPaddle: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  ball: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  controlLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
  },
  winCard: {
    borderColor: '#F59E0B',
  },
  loseCard: {
    borderColor: '#EF4444',
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 20,
  },
  finalScoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 25,
  },
  finalScoreText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  finalScoreValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  finalScoreDivider: {
    fontSize: 32,
    color: '#374151',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pausedCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  pausedTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 10,
  },
  pausedScore: {
    fontSize: 20,
    color: '#94A3B8',
    marginBottom: 20,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
});

export default PongGame;

