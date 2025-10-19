import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../lib/i18n';

interface FlappyBirdGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onRestart?: () => Promise<boolean>;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = Math.min(width - 40, 400);
const GAME_HEIGHT = height - 280;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 50;
const PIPE_GAP = 160; // Increased from 140 for more forgiveness
const GRAVITY = 0.5; // Reduced from 0.6 for gentler falling
const FLAP_STRENGTH = -7.5; // Reduced from -10 for less violent flap
const PIPE_SPEED = 2.5; // Reduced from 3 for more reaction time

type Pipe = {
  id: number;
  x: number;
  topHeight: number;
  passed: boolean;
};

const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ onClose, onGameComplete, onRestart }) => {
  const { t } = useTranslation();
  
  // Game state
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [groundOffset, setGroundOffset] = useState(0); // Synced with pipes

  // Refs
  const gameLoop = useRef<number | null>(null);
  const nextPipeId = useRef(0);
  const lastPipeSpawn = useRef(0);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  // Animated values
  const birdRotation = useRef(new Animated.Value(0)).current;
  const bgScroll = useRef(new Animated.Value(0)).current;
  const wingFlap = useRef(new Animated.Value(0)).current;
  const cloudScroll1 = useRef(new Animated.Value(0)).current;
  const cloudScroll2 = useRef(new Animated.Value(0)).current;
  const cloudScroll3 = useRef(new Animated.Value(0)).current;
  const cloudScroll4 = useRef(new Animated.Value(0)).current;
  const cloudScroll5 = useRef(new Animated.Value(0)).current;
  const groundScroll = useRef(new Animated.Value(0)).current;

  // Bird flap
  const flap = useCallback(() => {
    if (gameOver) return;
    
    // Haptic feedback for flapping
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!gameStarted) {
      setGameStarted(true);
    }

    setBirdVelocity(FLAP_STRENGTH);
    
    // Set bird rotation immediately on flap
    birdRotation.setValue(-20); // Immediate upward tilt (reduced from -30)
    
    // Animate wing flap
    Animated.sequence([
      Animated.timing(wingFlap, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(wingFlap, {
        toValue: 0,
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
        // Haptic feedback for collision/game over
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setGameOver(true);
        return prev;
      }
      
      return newY;
    });

    setBirdVelocity(prev => {
      const newVelocity = prev + GRAVITY;
      
      // Update rotation based on velocity - visible but not too dramatic
      // When falling (positive velocity), rotate downward
      let rotation;
      if (newVelocity < -1) {
        // Rising fast - upward tilt
        rotation = Math.max(newVelocity * 2.5, -20);
      } else if (newVelocity < 0) {
        // Rising slowly - gentle upward tilt
        rotation = Math.max(newVelocity * 2, -15);
      } else if (newVelocity < 3) {
        // Falling slowly - start tilting down
        rotation = Math.min(newVelocity * 4, 25);
      } else {
        // Falling fast - nose-dive
        rotation = Math.min(newVelocity * 5, 60);
      }
      
      // Use setValue for immediate rotation (no animation delay)
      birdRotation.setValue(rotation);
      
      return newVelocity;
    });
  }, [gameStarted, gameOver, birdVelocity, birdRotation]);

  // Update pipes
  const updatePipes = useCallback(() => {
    if (!gameStarted || gameOver) return;

    // Spawn new pipe
    const now = Date.now();
    if (now - lastPipeSpawn.current > 2200) { // Increased from 2000 for more time between pipes
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

    // Move pipes and ground together
    setPipes(prev => {
      return prev
        .map(pipe => ({
          ...pipe,
          x: pipe.x - PIPE_SPEED,
        }))
        .filter(pipe => pipe.x > -PIPE_WIDTH);
    });
    
    // Update ground offset to match pipe movement
    setGroundOffset(prev => {
      const newOffset = prev - PIPE_SPEED;
      // Loop back when scrolled 300 pixels (longer pattern)
      return newOffset <= -300 ? newOffset + 300 : newOffset;
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
          // Haptic feedback for pipe collision
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setGameOver(true);
        }
      }

      // Check if passed pipe
      if (!pipe.passed && pipeRight < birdLeft) {
        pipe.passed = true;
        // Haptic feedback for passing through pipe (scoring)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  // Cloud scroll animations - each at different speeds for parallax effect
  useEffect(() => {
    const createCloudAnimation = (animValue: Animated.Value, duration: number, startDelay: number = 0) => {
      // Start clouds offscreen to the right
      animValue.setValue(width);
      
      return Animated.loop(
        Animated.sequence([
          Animated.delay(startDelay),
          Animated.timing(animValue, {
            toValue: -200, // Scroll left until offscreen
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: width, // Jump back to right side
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start each cloud animation with different speeds and delays
    createCloudAnimation(cloudScroll1, 25000, 0).start();
    createCloudAnimation(cloudScroll2, 30000, 5000).start();
    createCloudAnimation(cloudScroll3, 20000, 2000).start();
    createCloudAnimation(cloudScroll4, 28000, 8000).start();
    createCloudAnimation(cloudScroll5, 18000, 3000).start();
  }, [cloudScroll1, cloudScroll2, cloudScroll3, cloudScroll4, cloudScroll5]);

  // Ground scroll is now synced directly with pipe movement in updatePipes

  const handleRestart = async () => {
    // Check if we can afford to restart (charge XP)
    if (onRestart) {
      const canRestart = await onRestart();
      if (!canRestart) {
        return; // User doesn't have enough XP or restart failed
      }
    }

    setBirdY(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    setGroundOffset(0);
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
    inputRange: [-20, 0, 60],
    outputRange: ['-20deg', '0deg', '60deg'], // Balanced rotation range
  });
  
  const wingRotation = wingFlap.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-30deg'],
  });

  return (
    <TouchableWithoutFeedback onPress={flap}>
      <View style={styles.container}>
        {/* Sky Background */}
        <View style={styles.skyBackground}>
          {/* Sun */}
          <View style={styles.sun}>
            <View style={styles.sunGlow} />
          </View>
          
          {/* Clouds with more detail - Animated */}
          <Animated.View
            style={[
              styles.cloud1,
              { transform: [{ translateX: cloudScroll1 }] },
            ]}
          >
            <View style={[styles.cloudPart, styles.cloudPart1]} />
            <View style={[styles.cloudPart, styles.cloudPart2]} />
            <View style={[styles.cloudPart, styles.cloudPart3]} />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.cloud2,
              { transform: [{ translateX: cloudScroll2 }] },
            ]}
          >
            <View style={[styles.cloudPart, styles.cloudPart1]} />
            <View style={[styles.cloudPart, styles.cloudPart2]} />
            <View style={[styles.cloudPart, styles.cloudPart3]} />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.cloud3,
              { transform: [{ translateX: cloudScroll3 }] },
            ]}
          >
            <View style={[styles.cloudPart, styles.cloudPart1]} />
            <View style={[styles.cloudPart, styles.cloudPart2]} />
            <View style={[styles.cloudPart, styles.cloudPart3]} />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.cloud4,
              { transform: [{ translateX: cloudScroll4 }] },
            ]}
          >
            <View style={[styles.cloudPart, styles.cloudPart1]} />
            <View style={[styles.cloudPart, styles.cloudPart2]} />
            <View style={[styles.cloudPart, styles.cloudPart3]} />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.cloud5,
              { transform: [{ translateX: cloudScroll5 }] },
            ]}
          >
            <View style={[styles.cloudPart, styles.cloudPart1]} />
            <View style={[styles.cloudPart, styles.cloudPart2]} />
            <View style={[styles.cloudPart, styles.cloudPart3]} />
          </Animated.View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={28} color="#EF4444" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('arcade.flappyBird.title')}</Text>
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
                  styles.pipeContainer,
                  {
                    left: pipe.x,
                    top: 0,
                    height: pipe.topHeight,
                  },
                ]}
              >
                <View style={styles.pipeBody} />
                <View style={[styles.pipeCap, styles.pipeCapBottom]} />
              </View>
              {/* Bottom Pipe */}
              <View
                style={[
                  styles.pipeContainer,
                  {
                    left: pipe.x,
                    top: pipe.topHeight + PIPE_GAP,
                    height: GAME_HEIGHT - pipe.topHeight - PIPE_GAP,
                  },
                ]}
              >
                <View style={[styles.pipeCap, styles.pipeCapTop]} />
                <View style={styles.pipeBody} />
              </View>
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
            {/* Bird Body - main circle */}
            <View style={styles.birdBody}>
              {/* Body highlight for 3D effect */}
              <View style={styles.birdHighlight} />
            </View>
            {/* Beak */}
            <View style={styles.birdBeak} />
            {/* Wing - Animated */}
            <Animated.View 
              style={[
                styles.birdWing,
                { transform: [{ rotate: wingRotation }] }
              ]} 
            />
            {/* Eye white */}
            <View style={styles.birdEyeWhite}>
              {/* Eye pupil */}
              <View style={styles.birdEyePupil} />
            </View>
            {/* Tail feathers */}
            <View style={styles.birdTail} />
          </Animated.View>

          {/* Start Message */}
          {!gameStarted && !gameOver && (
            <View style={styles.startMessage}>
              <Text style={styles.startText}>{t('arcade.flappyBird.tapToFlap')}</Text>
              <Ionicons name="hand-left" size={32} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Ground */}
        <View style={styles.ground}>
          {/* Grass top layer with varying heights - Synced with pipes */}
          <View 
            style={[
              styles.grassTopLayer,
              { transform: [{ translateX: groundOffset }] }
            ]}
          >
            {/* Create repeating grass pattern - optimized with fewer blades */}
            {[...Array(90)].map((_, i) => {
              const bladeSpacing = 13.33; // Wider spacing = fewer blades
              const patternLength = 300;
              const xPosition = i * bladeSpacing;
              const positionInPattern = xPosition % patternLength;
              
              // More complex wave pattern for variety
              const height = 12 + 
                Math.sin(positionInPattern * 0.1) * 2.5 + 
                Math.sin(positionInPattern * 0.03) * 1.5;
              
              return (
                <View 
                  key={i} 
                  style={[
                    styles.grassBlade, 
                    { 
                      left: xPosition,
                      height: height,
                      backgroundColor: (positionInPattern / 5) % 3 === 0 ? '#7CB342' : (positionInPattern / 5) % 3 === 1 ? '#8BC34A' : '#689F38',
                    }
                  ]} 
                />
              );
            })}
          </View>
          
          {/* Dirt base with texture - Synced with pipes */}
          <View 
            style={[
              styles.dirtBase,
              { transform: [{ translateX: groundOffset }] }
            ]}
          >
            {/* Create repeating dirt pattern every 300px - OPTIMIZED */}
            {[...Array(4)].flatMap((_, section) => 
              [...Array(12)].map((__, spotIndex) => {
                const patternLength = 300;
                const xInPattern = spotIndex * 25; // Spread across 300px
                const x = section * patternLength + xInPattern;
                
                // Multiple pseudo-random generators for more variation
                const seed = Math.floor(xInPattern);
                const rand1 = ((seed * 9301 + 49297) % 233280) / 233280;
                const rand2 = ((seed * 1103 + 377) % 233280) / 233280;
                const rand3 = ((seed * 2207 + 1511) % 233280) / 233280;
                const rand4 = ((seed * 5471 + 2819) % 233280) / 233280;
                
                return (
                  <View 
                    key={`dirt-${section}-${spotIndex}`} 
                    style={[
                      styles.dirtSpot, 
                      { 
                        left: x + (rand1 - 0.5) * 20, // More spread
                        top: 5 + rand2 * 35,
                        width: 4 + Math.floor(rand3 * 5), // Larger variation
                        height: 4 + Math.floor(rand3 * 5),
                        opacity: 0.25 + (rand4 * 0.4),
                      }
                    ]} 
                  />
                );
              })
            )}
            
            {/* Create repeating rock pattern every 300px - OPTIMIZED */}
            {[...Array(4)].flatMap((_, section) => 
              [...Array(5)].map((__, rockIndex) => {
                const patternLength = 300;
                const xInPattern = rockIndex * 60; // Wide spread across 300px
                const x = section * patternLength + xInPattern;
                
                // Use multiple seeds for more varied distribution
                const seed = Math.floor(xInPattern);
                const rand1 = ((seed * 7919 + 3331) % 233280) / 233280;
                const rand2 = ((seed * 4421 + 1987) % 233280) / 233280;
                const rand3 = ((seed * 6329 + 4157) % 233280) / 233280;
                
                return (
                  <View 
                    key={`rock-${section}-${rockIndex}`} 
                    style={[
                      styles.rock, 
                      { 
                        left: x + (rand1 - 0.5) * 30, // Much more horizontal spread
                        top: 10 + rand2 * 25,
                        width: 6 + Math.floor(rand3 * 5), // Variable size
                        height: 5 + Math.floor(rand3 * 4),
                      }
                    ]} 
                  />
                );
              })
            )}
          </View>
          
          {/* Bottom border for definition */}
          <View style={styles.groundBorder} />
        </View>

        {/* Instructions */}
        {!gameStarted && (
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>{t('arcade.flappyBird.tapToFly')}</Text>
          </View>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <View style={styles.overlay}>
            <View style={styles.gameOverCard}>
              <Ionicons name="sad" size={64} color="#EF4444" />
              <Text style={styles.gameOverTitle}>{t('arcade.flappyBird.gameOver')}</Text>
              <View style={styles.scoreCard}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreRowLabel}>{t('arcade.flappyBird.score')}</Text>
                  <Text style={styles.scoreRowValue}>{score}</Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreRowLabel}>{t('arcade.flappyBird.best')}</Text>
                  <Text style={styles.scoreRowValue}>{bestScore}</Text>
                </View>
              </View>
              {score > bestScore && (
                <View style={styles.newBestBadge}>
                  <Ionicons name="trophy" size={16} color="#F59E0B" />
                  <Text style={styles.newBestText}>{t('arcade.flappyBird.newBest')}</Text>
                </View>
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>{t('arcade.flappyBird.playAgain')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exitButton} onPress={handleClose}>
                  <Ionicons name="exit" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>{t('arcade.flappyBird.exit')}</Text>
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
    backgroundColor: '#87CEEB',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#87CEEB',
  },
  sun: {
    position: 'absolute',
    top: 80,
    right: 40,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 5,
  },
  sunGlow: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    transform: [{ scale: 1.4 }],
  },
  cloudGroup: {
    position: 'absolute',
    width: 80,
    height: 35,
  },
  cloud1: {
    position: 'absolute',
    width: 80,
    height: 35,
    left: 0, // Start at 0, animation will move from right
    top: 80,
  },
  cloud2: {
    position: 'absolute',
    width: 80,
    height: 35,
    left: 0,
    top: 120,
  },
  cloud3: {
    position: 'absolute',
    width: 80,
    height: 35,
    left: 0,
    top: 150,
  },
  cloud4: {
    position: 'absolute',
    width: 80,
    height: 35,
    left: 0,
    top: 90,
  },
  cloud5: {
    position: 'absolute',
    width: 80,
    height: 35,
    left: 0,
    top: 60,
  },
  cloudPart: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cloudPart1: {
    width: 40,
    height: 25,
    left: 0,
    top: 8,
  },
  cloudPart2: {
    width: 35,
    height: 30,
    left: 25,
    top: 0,
  },
  cloudPart3: {
    width: 30,
    height: 22,
    left: 50,
    top: 10,
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
    backgroundColor: '#FFD54F',
    borderWidth: 3,
    borderColor: '#F57C00',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  birdHighlight: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    top: 5,
    left: 7,
  },
  birdBeak: {
    position: 'absolute',
    width: 8,
    height: 6,
    backgroundColor: '#FF6F00',
    borderRadius: 2,
    top: 13,
    left: 26,
    borderWidth: 1,
    borderColor: '#E65100',
  },
  birdWing: {
    position: 'absolute',
    width: 14,
    height: 10,
    backgroundColor: '#FFA726',
    borderRadius: 6,
    top: 15,
    right: 4,
    borderWidth: 2,
    borderColor: '#F57C00',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  birdEyeWhite: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    top: 8,
    left: 18,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  birdEyePupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
  },
  birdTail: {
    position: 'absolute',
    width: 8,
    height: 12,
    backgroundColor: '#FFB74D',
    borderRadius: 4,
    top: 12,
    left: -2,
    borderWidth: 2,
    borderColor: '#F57C00',
    transform: [{ rotate: '45deg' }],
  },
  pipeContainer: {
    position: 'absolute',
    width: PIPE_WIDTH,
  },
  pipeBody: {
    flex: 1,
    backgroundColor: '#66BB6A',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderLeftColor: '#81C784',
    borderRightColor: '#43A047',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pipeCap: {
    width: PIPE_WIDTH + 8,
    height: 24,
    backgroundColor: '#66BB6A',
    borderWidth: 4,
    borderColor: '#43A047',
    borderRadius: 4,
    marginLeft: -4,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  pipeCapTop: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  pipeCapBottom: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  ground: {
    width: '100%',
    height: 70,
    backgroundColor: '#8B6F47',
    borderTopWidth: 0,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  grassTopLayer: {
    position: 'absolute',
    top: 0,
    width: 1200, // 4 x 300px pattern sections
    height: 18,
    backgroundColor: '#558B2F',
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#33691E',
  },
  grassBlade: {
    position: 'absolute',
    width: 3,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    bottom: 0,
  },
  dirtBase: {
    position: 'absolute',
    top: 18,
    width: 1200, // 4 x 300px pattern sections
    height: 52,
    backgroundColor: '#6D4C41',
  },
  dirtSpot: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#5D4037',
  },
  rock: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: '#78909C',
    borderWidth: 1,
    borderColor: '#546E7A',
  },
  groundBorder: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    backgroundColor: '#3E2723',
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

