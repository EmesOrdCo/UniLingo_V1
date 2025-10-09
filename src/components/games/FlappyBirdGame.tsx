import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FlappyBirdGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = Math.min(width - 40, 400);
const GAME_HEIGHT = height - 280;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 50;
const PIPE_GAP = 140;
const GRAVITY = 0.6;
const FLAP_STRENGTH = -10;
const PIPE_SPEED = 3;

type Pipe = {
  id: number;
  x: number;
  topHeight: number;
  passed: boolean;
};

const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ onClose, onGameComplete }) => {
  // Game state
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Refs
  const gameLoop = useRef<number | null>(null);
  const nextPipeId = useRef(0);
  const lastPipeSpawn = useRef(0);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  // Animated values
  const birdRotation = useRef(new Animated.Value(0)).current;
  const bgScroll = useRef(new Animated.Value(0)).current;

  // Bird flap
  const flap = useCallback(() => {
    if (gameOver) return;
    
    if (!gameStarted) {
      setGameStarted(true);
    }

    setBirdVelocity(FLAP_STRENGTH);
    
    // Animate bird rotation
    Animated.sequence([
      Animated.timing(birdRotation, {
        toValue: -20,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [gameOver, gameStarted, birdRotation]);

  // Update bird position
  const updateBird = useCallback(() => {
    if (!gameStarted || gameOver) return;

    setBirdY(prev => {
      const newY = prev + birdVelocity;
      
      // Check bounds
      if (newY <= 0 || newY >= GAME_HEIGHT - BIRD_SIZE) {
        setGameOver(true);
        return prev;
      }
      
      return newY;
    });

    setBirdVelocity(prev => {
      const newVelocity = prev + GRAVITY;
      
      // Update rotation based on velocity
      const rotation = Math.min(Math.max(newVelocity * 3, -20), 90);
      Animated.timing(birdRotation, {
        toValue: rotation,
        duration: 50,
        useNativeDriver: true,
      }).start();
      
      return newVelocity;
    });
  }, [gameStarted, gameOver, birdVelocity, birdRotation]);

  // Update pipes
  const updatePipes = useCallback(() => {
    if (!gameStarted || gameOver) return;

    // Spawn new pipe
    const now = Date.now();
    if (now - lastPipeSpawn.current > 2000) {
      const minHeight = 50;
      const maxHeight = GAME_HEIGHT - PIPE_GAP - 100;
      const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
      
      setPipes(prev => [
        ...prev,
        {
          id: nextPipeId.current++,
          x: GAME_WIDTH,
          topHeight,
          passed: false,
        },
      ]);
      
      lastPipeSpawn.current = now;
    }

    // Move pipes
    setPipes(prev => {
      return prev
        .map(pipe => ({
          ...pipe,
          x: pipe.x - PIPE_SPEED,
        }))
        .filter(pipe => pipe.x > -PIPE_WIDTH);
    });
  }, [gameStarted, gameOver]);

  // Check collisions
  const checkCollisions = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const birdLeft = GAME_WIDTH / 3;
    const birdRight = birdLeft + BIRD_SIZE;
    const birdTop = birdY;
    const birdBottom = birdY + BIRD_SIZE;

    pipes.forEach(pipe => {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;

      // Check if bird is at same x position as pipe
      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        // Check if bird hits top or bottom pipe
        if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
          setGameOver(true);
        }
      }

      // Check if passed pipe
      if (!pipe.passed && pipeRight < birdLeft) {
        pipe.passed = true;
        setScore(prev => prev + 1);
      }
    });
  }, [pipes, birdY, gameStarted, gameOver]);

  // Main game loop
  const updateGame = useCallback(() => {
    updateBird();
    updatePipes();
    checkCollisions();
  }, [updateBird, updatePipes, checkCollisions]);

  // Game loop using requestAnimationFrame
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const animate = () => {
        updateGame();
        gameLoop.current = requestAnimationFrame(animate);
      };
      gameLoop.current = requestAnimationFrame(animate);
    }
    return () => {
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current);
    };
  }, [updateGame, gameStarted, gameOver]);

  // Handle game over
  useEffect(() => {
    if (gameOver && !completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      
      if (score > bestScore) {
        setBestScore(score);
      }
      
      console.log('🐦 Flappy Bird calling onGameComplete with score:', score);
      setTimeout(() => {
        onGameComplete(score);
      }, 100);
    }
  }, [gameOver, score, bestScore, onGameComplete]);

  // Background scroll animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(bgScroll, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [bgScroll]);

  const handleRestart = () => {
    setBirdY(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    lastPipeSpawn.current = 0;
    completionCalledRef.current = false;
    finalScoreRef.current = 0;
    birdRotation.setValue(0);
  };

  const handleClose = () => {
    if (!completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      onGameComplete(score);
    }
    onClose();
  };

  const birdLeft = GAME_WIDTH / 3;
  const rotationInterpolate = birdRotation.interpolate({
    inputRange: [-20, 90],
    outputRange: ['-20deg', '90deg'],
  });

  return (
    <TouchableWithoutFeedback onPress={flap}>
      <View style={styles.container}>
        {/* Sky Background */}
        <View style={styles.skyBackground}>
          {/* Clouds */}
          {[...Array(5)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.cloud,
                {
                  left: (i * 120) % GAME_WIDTH,
                  top: 60 + (i * 40) % 100,
                },
              ]}
            />
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={28} color="#EF4444" />
          </TouchableOpacity>
          <Text style={styles.title}>FLAPPY BIRD</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Score Display */}
        <View style={styles.scoreDisplay}>
          <Text style={styles.currentScore}>{score}</Text>
        </View>

        {/* Game Area */}
        <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
          {/* Pipes */}
          {pipes.map(pipe => (
            <View key={pipe.id}>
              {/* Top Pipe */}
              <View
                style={[
                  styles.pipe,
                  styles.pipeTop,
                  {
                    left: pipe.x,
                    height: pipe.topHeight,
                    width: PIPE_WIDTH,
                  },
                ]}
              />
              {/* Bottom Pipe */}
              <View
                style={[
                  styles.pipe,
                  styles.pipeBottom,
                  {
                    left: pipe.x,
                    top: pipe.topHeight + PIPE_GAP,
                    height: GAME_HEIGHT - pipe.topHeight - PIPE_GAP,
                    width: PIPE_WIDTH,
                  },
                ]}
              />
            </View>
          ))}

          {/* Bird */}
          <Animated.View
            style={[
              styles.bird,
              {
                left: birdLeft,
                top: birdY,
                transform: [{ rotate: rotationInterpolate }],
              },
            ]}
          >
            <View style={styles.birdBody} />
            <View style={styles.birdWing} />
            <View style={styles.birdEye} />
          </Animated.View>

          {/* Start Message */}
          {!gameStarted && !gameOver && (
            <View style={styles.startMessage}>
              <Text style={styles.startText}>Tap to Flap!</Text>
              <Ionicons name="hand-left" size={32} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Ground */}
        <View style={styles.ground}>
          <Text style={styles.groundText}>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
        </View>

        {/* Instructions */}
        {!gameStarted && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>Tap anywhere to make the bird fly!</Text>
          </View>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <View style={styles.overlay}>
            <View style={styles.gameOverCard}>
              <Ionicons name="sad" size={64} color="#EF4444" />
              <Text style={styles.gameOverTitle}>Game Over!</Text>
              <View style={styles.scoreCard}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreRowLabel}>Score</Text>
                  <Text style={styles.scoreRowValue}>{score}</Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreRowLabel}>Best</Text>
                  <Text style={styles.scoreRowValue}>{bestScore}</Text>
                </View>
              </View>
              {score > bestScore && (
                <View style={styles.newBestBadge}>
                  <Ionicons name="trophy" size={16} color="#F59E0B" />
                  <Text style={styles.newBestText}>New Best!</Text>
                </View>
              )}
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
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4EC0CA',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#4EC0CA',
  },
  cloud: {
    position: 'absolute',
    width: 60,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    opacity: 0.6,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  headerSpacer: {
    width: 38,
  },
  scoreDisplay: {
    alignItems: 'center',
    marginVertical: 10,
  },
  currentScore: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  gameArea: {
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 10,
  },
  bird: {
    position: 'absolute',
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    zIndex: 10,
  },
  birdBody: {
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    borderRadius: BIRD_SIZE / 2,
    backgroundColor: '#FFEB3B',
    borderWidth: 2,
    borderColor: '#F57C00',
  },
  birdWing: {
    position: 'absolute',
    width: 12,
    height: 8,
    backgroundColor: '#FFA726',
    borderRadius: 4,
    top: 14,
    right: 2,
  },
  birdEye: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
    top: 8,
    left: 18,
  },
  pipe: {
    position: 'absolute',
    backgroundColor: '#8BC34A',
    borderWidth: 3,
    borderColor: '#689F38',
    borderRadius: 4,
  },
  pipeTop: {
    top: 0,
  },
  pipeBottom: {
  },
  ground: {
    width: '100%',
    backgroundColor: '#DEB887',
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: '#8B4513',
  },
  groundText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '700',
  },
  startMessage: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
  },
  startText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  gameOverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 15,
    marginBottom: 20,
  },
  scoreCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    width: 200,
    marginBottom: 15,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreRowLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  scoreRowValue: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '700',
  },
  scoreDivider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 8,
  },
  newBestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 15,
  },
  newBestText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
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
});

export default FlappyBirdGame;

