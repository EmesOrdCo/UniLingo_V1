import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface SnakeGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onRestart?: () => Promise<boolean>;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = Math.floor(Math.min(width, height - 200) / GRID_SIZE);
const GAME_SPEED_INITIAL = 150; // milliseconds
const GAME_SPEED_MIN = 80; // fastest speed

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const SnakeGame: React.FC<SnakeGameProps> = ({ onClose, onGameComplete, onRestart }) => {
  // Game state
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(GAME_SPEED_INITIAL);

  // Refs
  const gameLoop = useRef<NodeJS.Timeout | null>(null);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  // Animated values for background
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgFloat3 = useRef(new Animated.Value(0)).current;
  const bgFloat4 = useRef(new Animated.Value(0)).current;
  const bgFloat5 = useRef(new Animated.Value(0)).current;

  // Generate random food position
  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)
    );
    return newFood;
  }, []);

  // Check collision
  const checkCollision = useCallback((head: Position, body: Position[]) => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    return body.some((segment) => segment.x === head.x && segment.y === head.y);
  }, []);

  // Game loop
  const moveSnake = useCallback(() => {
    if (isPaused || gameOver) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      let newHead: Position;

      // Update direction from queue
      const currentDirection = nextDirection;
      setDirection(currentDirection);

      // Calculate new head position
      switch (currentDirection) {
        case 'UP':
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case 'DOWN':
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case 'LEFT':
          newHead = { x: head.x - 1, y: head.y };
          break;
        case 'RIGHT':
          newHead = { x: head.x + 1, y: head.y };
          break;
      }

      // Check collision
      if (checkCollision(newHead, prevSnake)) {
        // Haptic feedback for collision/game over
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food is eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        // Haptic feedback for eating food
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScore((prev) => prev + 10);
        setFood(generateFood(newSnake));
        
        // Increase speed every 5 foods
        if ((score + 10) % 50 === 0 && gameSpeed > GAME_SPEED_MIN) {
          setGameSpeed((prev) => Math.max(prev - 10, GAME_SPEED_MIN));
        }
      } else {
        newSnake.pop(); // Remove tail if no food eaten
      }

      return newSnake;
    });
  }, [food, nextDirection, checkCollision, generateFood, isPaused, gameOver, score, gameSpeed]);

  // Start game loop
  useEffect(() => {
    if (!gameOver && !isPaused) {
      gameLoop.current = setInterval(moveSnake, gameSpeed);
    }
    return () => {
      if (gameLoop.current) clearInterval(gameLoop.current);
    };
  }, [moveSnake, gameOver, isPaused, gameSpeed]);

  // Handle game over
  useEffect(() => {
    if (gameOver && !completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      console.log('🐍 Snake calling onGameComplete with score:', score);
      setTimeout(() => {
        onGameComplete(score);
      }, 100);
    }
  }, [gameOver, score, onGameComplete]);

  // Background animations
  useEffect(() => {
    const createFloatAnimation = (animatedValue: Animated.Value, duration: number, delay: number = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration,
            delay: 0,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    setTimeout(() => createFloatAnimation(bgFloat1, 3000, 0).start(), 100);
    setTimeout(() => createFloatAnimation(bgFloat2, 3500, 0).start(), 300);
    setTimeout(() => createFloatAnimation(bgFloat3, 4000, 0).start(), 500);
    setTimeout(() => createFloatAnimation(bgFloat4, 3200, 0).start(), 700);
    setTimeout(() => createFloatAnimation(bgFloat5, 3800, 0).start(), 900);
  }, []);

  // Direction handlers
  const changeDirection = useCallback((newDirection: Direction) => {
    // Prevent 180-degree turns
    if (
      (direction === 'UP' && newDirection === 'DOWN') ||
      (direction === 'DOWN' && newDirection === 'UP') ||
      (direction === 'LEFT' && newDirection === 'RIGHT') ||
      (direction === 'RIGHT' && newDirection === 'LEFT')
    ) {
      return;
    }
    setNextDirection(newDirection);
  }, [direction]);

  // Swipe gesture handler
  const handleGesture = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const { translationX, translationY } = nativeEvent;
      
      if (Math.abs(translationX) > Math.abs(translationY)) {
        // Horizontal swipe
        if (translationX > 0) {
          changeDirection('RIGHT');
        } else {
          changeDirection('LEFT');
        }
      } else {
        // Vertical swipe
        if (translationY > 0) {
          changeDirection('DOWN');
        } else {
          changeDirection('UP');
        }
      }
    }
  };

  const handleRestart = async () => {
    // Check if we can afford to restart (charge XP)
    if (onRestart) {
      const canRestart = await onRestart();
      if (!canRestart) {
        return; // User doesn't have enough XP or restart failed
      }
    }

    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]);
    setFood(generateFood([{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]));
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setGameOver(false);
    setGameSpeed(GAME_SPEED_INITIAL);
    completionCalledRef.current = false;
    finalScoreRef.current = 0;
  };

  const handleClose = () => {
    if (!completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      onGameComplete(score);
    }
    onClose();
  };

  // Background floating elements
  const floatInterpolate1 = bgFloat1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });
  const floatInterpolate2 = bgFloat2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });
  const floatInterpolate3 = bgFloat3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });
  const floatInterpolate4 = bgFloat4.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const floatInterpolate5 = bgFloat5.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.bgElement1, { transform: [{ translateY: floatInterpolate1 }] }]} />
        <Animated.View style={[styles.bgElement2, { transform: [{ translateY: floatInterpolate2 }] }]} />
        <Animated.View style={[styles.bgElement3, { transform: [{ translateY: floatInterpolate3 }] }]} />
        <Animated.View style={[styles.bgElement4, { transform: [{ translateY: floatInterpolate4 }] }]} />
        <Animated.View style={[styles.bgElement5, { transform: [{ translateY: floatInterpolate5 }] }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={32} color="#EF4444" />
        </TouchableOpacity>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsPaused(!isPaused)}
          style={styles.pauseButton}
        >
          <Ionicons name={isPaused ? 'play-circle' : 'pause-circle'} size={32} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Game Area */}
      <PanGestureHandler onHandlerStateChange={handleGesture}>
        <View style={styles.gameArea}>
          <View
            style={[
              styles.grid,
              {
                width: GRID_SIZE * CELL_SIZE,
                height: GRID_SIZE * CELL_SIZE,
              },
            ]}
          >
            {/* Snake */}
            {snake.map((segment, index) => (
              <View
                key={index}
                style={[
                  styles.snakeSegment,
                  {
                    left: segment.x * CELL_SIZE,
                    top: segment.y * CELL_SIZE,
                    width: CELL_SIZE - 2,
                    height: CELL_SIZE - 2,
                    backgroundColor: index === 0 ? '#10B981' : '#34D399',
                    borderRadius: index === 0 ? CELL_SIZE / 2 : CELL_SIZE / 4,
                  },
                ]}
              >
                {index === 0 && (
                  <View style={styles.snakeEyes}>
                    <View style={styles.eye} />
                    <View style={styles.eye} />
                  </View>
                )}
              </View>
            ))}

            {/* Food */}
            <View
              style={[
                styles.food,
                {
                  left: food.x * CELL_SIZE,
                  top: food.y * CELL_SIZE,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                },
              ]}
            >
              <View style={styles.apple} />
            </View>
          </View>
        </View>
      </PanGestureHandler>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => changeDirection('UP')}
          >
            <Ionicons name="arrow-up" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => changeDirection('LEFT')}
          >
            <Ionicons name="arrow-back" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.controlSpacer} />
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => changeDirection('RIGHT')}
          >
            <Ionicons name="arrow-forward" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => changeDirection('DOWN')}
          >
            <Ionicons name="arrow-down" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.gameOverCard}>
            <Ionicons name="skull" size={64} color="#EF4444" />
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Final Score: {score}</Text>
            <Text style={styles.lengthText}>Snake Length: {snake.length}</Text>
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
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => setIsPaused(false)}
            >
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
    backgroundColor: '#1F2937',
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    top: 50,
    left: 30,
  },
  bgElement2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    top: 150,
    right: 40,
  },
  bgElement3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    bottom: 200,
    left: 50,
  },
  bgElement4: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(52, 211, 153, 0.09)',
    bottom: 100,
    right: 30,
  },
  bgElement5: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
    top: height / 2,
    right: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  closeButton: {
    padding: 5,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 32,
    color: '#10B981',
    fontWeight: '700',
  },
  pauseButton: {
    padding: 5,
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    backgroundColor: '#374151',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#10B981',
  },
  snakeSegment: {
    position: 'absolute',
  },
  snakeEyes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 3,
    paddingTop: 3,
  },
  eye: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#000000',
  },
  food: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apple: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
    backgroundColor: '#EF4444',
  },
  controls: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  controlSpacer: {
    width: 60,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverCard: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 5,
  },
  lengthText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 20,
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
  pausedCard: {
    backgroundColor: '#1F2937',
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

export default SnakeGame;

