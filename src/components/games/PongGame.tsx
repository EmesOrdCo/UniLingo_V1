import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PongGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onRestart?: () => Promise<boolean>;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = Math.min(width - 40, 400);
const GAME_HEIGHT = height - 280;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const STANDARD_BALL_SPEED = 4;
const INITIAL_BALL_SPEED = STANDARD_BALL_SPEED * 0.5; // Start at half speed (2)
const PADDLE_SPEED = 8;
const WIN_SCORE = 11;

type Ball = {
  x: number;
  y: number;
  dx: number;
  dy: number;
};

const PongGame: React.FC<PongGameProps> = ({ onClose, onGameComplete, onRestart }) => {
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
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);
  const [rallyCount, setRallyCount] = useState(0);

  // Refs
  const gameLoop = useRef<number | null>(null);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const playerPaddleYRef = useRef(playerPaddleY);
  const aiPaddleYRef = useRef(aiPaddleY);
  const ballRef = useRef(ball);
  const rallyCountRef = useRef(rallyCount);
  const playerScoreRef = useRef(playerScore);
  const lastPaddleY = useRef(playerPaddleY);
  const lastFrameTime = useRef(Date.now());

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;

  // Keep refs in sync with state for smooth game loop
  useEffect(() => {
    playerPaddleYRef.current = playerPaddleY;
  }, [playerPaddleY]);

  useEffect(() => {
    aiPaddleYRef.current = aiPaddleY;
  }, [aiPaddleY]);

  useEffect(() => {
    ballRef.current = ball;
  }, [ball]);

  useEffect(() => {
    rallyCountRef.current = rallyCount;
  }, [rallyCount]);

  useEffect(() => {
    playerScoreRef.current = playerScore;
  }, [playerScore]);

  // Countdown logic
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
      setGameStarted(true);
      setCountdown(3); // Reset for next time
    }
  }, [showCountdown, countdown]);

  // AI difficulty - increases with rally count
  const getAiSpeed = useCallback(() => {
    return Math.min(PADDLE_SPEED * 0.7 + rallyCount * 0.1, PADDLE_SPEED * 0.95);
  }, [rallyCount]);

  // Move AI paddle - using refs for smooth movement with skill scaling
  const moveAiPaddle = (deltaTime: number) => {
    const currentBall = ballRef.current;
    const currentAiPaddleY = aiPaddleYRef.current;
    const currentRallyCount = rallyCountRef.current;
    
    // AI skill increases with player score (starts very weak, gets stronger)
    // Score 0-2: 35% skill, Score 3-5: 45%, Score 6-8: 60%, Score 9+: 75%
    const currentPlayerScore = playerScoreRef.current;
    const baseSkill = 0.35 + (currentPlayerScore * 0.04); // +4% per point scored
    const maxSkill = Math.min(0.75, baseSkill);
    
    // Speed calculation with rally modifier
    const rallyBonus = Math.min(currentRallyCount * 0.05, 0.2); // Max +20% from rallies
    const aiSpeed = PADDLE_SPEED * maxSkill + (PADDLE_SPEED * rallyBonus);
    
    // Add reaction delay based on skill (lower skill = slower reaction)
    const reactionThreshold = 5 + (10 * (1 - maxSkill)); // Higher threshold when weak
    
    // Random chance to "miss" the ball (happens more when AI is weak)
    const missChance = (1 - maxSkill) * 0.2; // 20% miss chance at lowest skill, 5% at highest
    if (Math.random() < missChance && currentBall.dx < 0) {
      // Intentionally move wrong direction occasionally
      const ballCenterY = currentBall.y + BALL_SIZE / 2;
      const paddleCenterY = currentAiPaddleY + PADDLE_HEIGHT / 2;
      const diff = ballCenterY - paddleCenterY;
      
      if (Math.abs(diff) > reactionThreshold) {
        const move = -Math.sign(diff) * aiSpeed * deltaTime * 0.5; // Move wrong way slowly
        setAiPaddleY(prev => {
          const newY = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev + move));
          aiPaddleYRef.current = newY;
          return newY;
        });
        return;
      }
    }
    
    const ballCenterY = currentBall.y + BALL_SIZE / 2;
    const paddleCenterY = currentAiPaddleY + PADDLE_HEIGHT / 2;
    const diff = ballCenterY - paddleCenterY;

    if (Math.abs(diff) > reactionThreshold) {
      const move = Math.sign(diff) * aiSpeed * deltaTime;
      setAiPaddleY(prev => {
        const newY = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev + move));
        aiPaddleYRef.current = newY;
        return newY;
      });
    }
  };

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

  // Update ball position - using refs and delta time for smooth movement
  const updateBall = (deltaTime: number) => {
    setBall(prevBall => {
      let newBall = { ...prevBall };
      newBall.x += newBall.dx * deltaTime;
      newBall.y += newBall.dy * deltaTime;

      // Top and bottom walls
      if (newBall.y <= 0 || newBall.y >= GAME_HEIGHT - BALL_SIZE) {
        newBall.dy *= -1;
        newBall.y = newBall.y <= 0 ? 0 : GAME_HEIGHT - BALL_SIZE;
      }

      // Player paddle (right side) - use ref for current position
      const currentPlayerPaddleY = playerPaddleYRef.current;
      const playerPaddleX = GAME_WIDTH - PADDLE_WIDTH - 10;
      if (
        newBall.x + BALL_SIZE >= playerPaddleX &&
        newBall.x + BALL_SIZE <= playerPaddleX + PADDLE_WIDTH + 5 &&
        newBall.y + BALL_SIZE >= currentPlayerPaddleY &&
        newBall.y <= currentPlayerPaddleY + PADDLE_HEIGHT &&
        newBall.dx > 0
      ) {
        // Haptic feedback for paddle hit
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Calculate bounce angle based on where ball hits paddle
        const paddleCenter = currentPlayerPaddleY + PADDLE_HEIGHT / 2;
        const hitPos = (newBall.y + BALL_SIZE / 2 - paddleCenter) / (PADDLE_HEIGHT / 2);
        
        newBall.dx = -Math.abs(newBall.dx) * 1.02; // Speed up slightly and reverse (reduced from 1.05)
        newBall.dy = hitPos * Math.abs(newBall.dx) * 0.8;
        newBall.x = playerPaddleX - BALL_SIZE;
        
        setRallyCount(prev => {
          const newCount = prev + 1;
          rallyCountRef.current = newCount;
          return newCount;
        });
      }

      // AI paddle (left side) - use ref for current position
      const currentAiPaddleY = aiPaddleYRef.current;
      const aiPaddleX = 10;
      if (
        newBall.x <= aiPaddleX + PADDLE_WIDTH &&
        newBall.x >= aiPaddleX - 5 &&
        newBall.y + BALL_SIZE >= currentAiPaddleY &&
        newBall.y <= currentAiPaddleY + PADDLE_HEIGHT &&
        newBall.dx < 0
      ) {
        // Haptic feedback for paddle hit
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Calculate bounce angle
        const paddleCenter = currentAiPaddleY + PADDLE_HEIGHT / 2;
        const hitPos = (newBall.y + BALL_SIZE / 2 - paddleCenter) / (PADDLE_HEIGHT / 2);
        
        newBall.dx = Math.abs(newBall.dx) * 1.02; // Speed up slightly and reverse (reduced from 1.05)
        newBall.dy = hitPos * Math.abs(newBall.dx) * 0.8;
        newBall.x = aiPaddleX + PADDLE_WIDTH;
        
        setRallyCount(prev => {
          const newCount = prev + 1;
          rallyCountRef.current = newCount;
          return newCount;
        });
      }

      // Score points
      if (newBall.x <= -BALL_SIZE) {
        // Player scores - haptic success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        // AI scores - haptic error
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

      ballRef.current = newBall;
      return newBall;
    });
  };

  // Main game loop - NOT using useCallback for maximum performance
  const updateGameRef = useRef<() => void>();
  
  updateGameRef.current = () => {
    if (!gameStarted || isPaused || gameOver) return;
    
    // Calculate delta time for smooth movement
    const now = Date.now();
    const deltaTime = Math.min((now - lastFrameTime.current) / 16.67, 2);
    lastFrameTime.current = now;
    
    updateBall(deltaTime);
    moveAiPaddle(deltaTime);
  };

  // Game loop - using setInterval for smoother, more consistent timing
  useEffect(() => {
    if (gameStarted && !isPaused && !gameOver) {
      // Run at higher frequency (8ms = ~120fps) for ultra-smooth movement
      const interval = setInterval(() => {
        updateGameRef.current?.();
      }, 8);
      
      gameLoop.current = interval as any;
    }
    return () => {
      if (gameLoop.current) clearInterval(gameLoop.current as any);
    };
  }, [gameStarted, isPaused, gameOver]);

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

    setTimeout(() => createFloatAnimation(bgFloat1, 4000).start(), 100);
    setTimeout(() => createFloatAnimation(bgFloat2, 3500).start(), 300);
  }, []);

  // Player paddle pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPaddleY.current = playerPaddleYRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = lastPaddleY.current + gestureState.dy;
        const clampedY = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, newY));
        setPlayerPaddleY(clampedY);
        playerPaddleYRef.current = clampedY; // Update ref immediately for smooth tracking
      },
      onPanResponderRelease: () => {
        lastPaddleY.current = playerPaddleYRef.current;
      },
    })
  ).current;

  const handleRestart = async () => {
    // Check if we can afford to restart (charge XP)
    if (onRestart) {
      const canRestart = await onRestart();
      if (!canRestart) {
        return; // User doesn't have enough XP or restart failed
      }
    }

    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    setPlayerWon(false);
    setIsPaused(false);
    setGameStarted(false);
    setShowCountdown(false);
    setCountdown(3);
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

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.bgElement1, { transform: [{ translateY: floatInterpolate1 }] }]} />
        <Animated.View style={[styles.bgElement2, { transform: [{ translateY: floatInterpolate2 }] }]} />
        
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
      <View style={styles.scoreContainer}>
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
        
        {/* Rally Counter - absolutely positioned to not shift score */}
        {rallyCount > 5 && (
          <View style={styles.rallyBadgeSide}>
            <Text style={styles.rallyTextSide}>🔥</Text>
            <Text style={styles.rallyCountText}>{rallyCount}</Text>
          </View>
        )}
      </View>

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

        {/* Tap to Start Overlay */}
        {!gameStarted && !showCountdown && !gameOver && (
          <TouchableOpacity 
            style={styles.tapToStartOverlay}
            onPress={() => setShowCountdown(true)}
            activeOpacity={0.9}
          >
            <View style={styles.startMessage}>
              <Text style={styles.startText}>TAP TO START</Text>
              <Ionicons name="play-circle" size={48} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Countdown Overlay */}
        {showCountdown && countdown > 0 && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    position: 'relative',
    width: '100%',
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
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
  rallyBadgeSide: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  rallyTextSide: {
    fontSize: 24,
    lineHeight: 28,
  },
  rallyCountText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: -4,
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: '#3B82F6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
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
  tapToStartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startMessage: {
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  startText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
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

