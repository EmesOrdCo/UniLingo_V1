import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface TetrisGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onRestart?: () => Promise<boolean>;
}

const { width, height } = Dimensions.get('window');

// Game constants
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = Math.floor(Math.min(width - 40, (height - 380) / ROWS));
const INITIAL_DROP_SPEED = 1000; // milliseconds

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type Cell = { filled: boolean; color: string };
type Position = { row: number; col: number };

// Tetromino shapes (4 rotation states each)
const SHAPES: Record<TetrominoType, Position[][]> = {
  I: [
    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }],
    [{ row: 0, col: 2 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 3, col: 2 }],
    [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }],
    [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 3, col: 1 }],
  ],
  O: [
    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  ],
  T: [
    [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
    [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 1 }],
    [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 1 }],
    [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
  ],
  S: [
    [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
    [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
    [{ row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 1 }],
    [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
  ],
  Z: [
    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
    [{ row: 0, col: 2 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 1 }],
    [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
    [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 0 }],
  ],
  J: [
    [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
    [{ row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
    [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }],
    [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 0 }, { row: 2, col: 1 }],
  ],
  L: [
    [{ row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }],
    [{ row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }, { row: 2, col: 2 }],
    [{ row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 0 }],
    [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 }],
  ],
};

// Tetromino colors
const COLORS: Record<TetrominoType, string> = {
  I: '#00F0F0',
  O: '#F0F000',
  T: '#A000F0',
  S: '#00F000',
  Z: '#F00000',
  J: '#0000F0',
  L: '#F0A000',
};

const TetrisGame: React.FC<TetrisGameProps> = ({ onClose, onGameComplete, onRestart }) => {
  // Game state
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [currentPiece, setCurrentPiece] = useState<{
    type: TetrominoType;
    rotation: number;
    position: Position;
  } | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType>('T');
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dropSpeed, setDropSpeed] = useState(INITIAL_DROP_SPEED);

  // Refs
  const gameLoop = useRef<NodeJS.Timeout | null>(null);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgFloat3 = useRef(new Animated.Value(0)).current;
  const bgFloat4 = useRef(new Animated.Value(0)).current;

  // Initialize grid
  const initializeGrid = useCallback((): Cell[][] => {
    return Array(ROWS)
      .fill(null)
      .map(() =>
        Array(COLS)
          .fill(null)
          .map(() => ({ filled: false, color: '' }))
      );
  }, []);

  // Get random tetromino
  const getRandomTetromino = useCallback((): TetrominoType => {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    return types[Math.floor(Math.random() * types.length)];
  }, []);

  // Create new piece
  const createNewPiece = useCallback(
    (type: TetrominoType) => {
      return {
        type,
        rotation: 0,
        position: { row: 0, col: Math.floor(COLS / 2) - 1 },
      };
    },
    []
  );

  // Check collision
  const checkCollision = useCallback(
    (piece: typeof currentPiece, offset: Position = { row: 0, col: 0 }): boolean => {
      if (!piece) return true;

      const shape = SHAPES[piece.type][piece.rotation];
      for (const block of shape) {
        const newRow = piece.position.row + block.row + offset.row;
        const newCol = piece.position.col + block.col + offset.col;

        if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS) {
          return true;
        }

        if (newRow >= 0 && grid[newRow] && grid[newRow][newCol]?.filled) {
          return true;
        }
      }
      return false;
    },
    [grid]
  );

  // Lock piece to grid
  const lockPiece = useCallback(() => {
    if (!currentPiece) return;

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const shape = SHAPES[currentPiece.type][currentPiece.rotation];
    const color = COLORS[currentPiece.type];

    shape.forEach(block => {
      const row = currentPiece.position.row + block.row;
      const col = currentPiece.position.col + block.col;
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        newGrid[row][col] = { filled: true, color };
      }
    });

    setGrid(newGrid);

    // Check for completed lines
    const completedLines: number[] = [];
    newGrid.forEach((row, index) => {
      if (row.every(cell => cell.filled)) {
        completedLines.push(index);
      }
    });

    if (completedLines.length > 0) {
      // Haptic feedback for clearing lines
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Clear lines
      const clearedGrid = newGrid.filter((_, index) => !completedLines.includes(index));
      const emptyRows = Array(completedLines.length)
        .fill(null)
        .map(() =>
          Array(COLS)
            .fill(null)
            .map(() => ({ filled: false, color: '' }))
        );
      setGrid([...emptyRows, ...clearedGrid]);

      // Update score and lines
      const lineScore = [0, 100, 300, 500, 800][completedLines.length] * level;
      setScore(prev => prev + lineScore);
      setLines(prev => prev + completedLines.length);
    } else {
      // Light haptic for piece placement (no lines cleared)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Spawn next piece
    const newPiece = createNewPiece(nextPiece);
    if (checkCollision(newPiece)) {
      // Haptic feedback for game over
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGameOver(true);
    } else {
      setCurrentPiece(newPiece);
      setNextPiece(getRandomTetromino());
    }
  }, [currentPiece, grid, nextPiece, level, createNewPiece, getRandomTetromino, checkCollision]);

  // Move piece
  const movePiece = useCallback(
    (direction: 'LEFT' | 'RIGHT' | 'DOWN') => {
      if (!currentPiece || gameOver || isPaused) return;

      const offset =
        direction === 'LEFT'
          ? { row: 0, col: -1 }
          : direction === 'RIGHT'
          ? { row: 0, col: 1 }
          : { row: 1, col: 0 };

      if (!checkCollision(currentPiece, offset)) {
        setCurrentPiece({
          ...currentPiece,
          position: {
            row: currentPiece.position.row + offset.row,
            col: currentPiece.position.col + offset.col,
          },
        });
      } else if (direction === 'DOWN') {
        lockPiece();
      }
    },
    [currentPiece, gameOver, isPaused, checkCollision, lockPiece]
  );

  // Rotate piece
  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    const newRotation = (currentPiece.rotation + 1) % 4;
    const rotatedPiece = { ...currentPiece, rotation: newRotation };

    if (!checkCollision(rotatedPiece)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, gameOver, isPaused, checkCollision]);

  // Hard drop
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    let dropDistance = 0;
    while (!checkCollision(currentPiece, { row: dropDistance + 1, col: 0 })) {
      dropDistance++;
    }

    setCurrentPiece({
      ...currentPiece,
      position: {
        ...currentPiece.position,
        row: currentPiece.position.row + dropDistance,
      },
    });

    // Lock immediately after hard drop
    setTimeout(() => lockPiece(), 50);
  }, [currentPiece, gameOver, isPaused, checkCollision, lockPiece]);

  // Game loop
  useEffect(() => {
    if (!gameOver && !isPaused && currentPiece) {
      gameLoop.current = setTimeout(() => {
        movePiece('DOWN');
      }, dropSpeed);
    }
    return () => {
      if (gameLoop.current) clearTimeout(gameLoop.current);
    };
  }, [currentPiece, gameOver, isPaused, movePiece, dropSpeed]);

  // Level progression
  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      setDropSpeed(Math.max(100, INITIAL_DROP_SPEED - (newLevel - 1) * 100));
    }
  }, [lines, level]);

  // Initialize game
  useEffect(() => {
    const initialGrid = initializeGrid();
    setGrid(initialGrid);
    const firstPiece = getRandomTetromino();
    setCurrentPiece(createNewPiece(firstPiece));
    setNextPiece(getRandomTetromino());
  }, [initializeGrid, getRandomTetromino, createNewPiece]);

  // Handle game over
  useEffect(() => {
    if (gameOver && !completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      console.log('🎮 Tetris calling onGameComplete with score:', score);
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
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    setTimeout(() => createFloatAnimation(bgFloat1, 3500, 0).start(), 100);
    setTimeout(() => createFloatAnimation(bgFloat2, 4000, 0).start(), 300);
    setTimeout(() => createFloatAnimation(bgFloat3, 3200, 0).start(), 500);
    setTimeout(() => createFloatAnimation(bgFloat4, 3800, 0).start(), 700);
  }, []);

  // Gesture handler
  const handleGesture = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const { translationX, translationY } = nativeEvent;
      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);

      if (absX < 30 && absY < 30) return;

      if (absX > absY) {
        if (translationX > 0) {
          movePiece('RIGHT');
        } else {
          movePiece('LEFT');
        }
      } else if (translationY > 0) {
        movePiece('DOWN');
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

    setGrid(initializeGrid());
    setScore(0);
    setLines(0);
    setLevel(1);
    setDropSpeed(INITIAL_DROP_SPEED);
    setGameOver(false);
    setIsPaused(false);
    const firstPiece = getRandomTetromino();
    setCurrentPiece(createNewPiece(firstPiece));
    setNextPiece(getRandomTetromino());
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

  // Render grid with current piece
  const renderGrid = () => {
    const displayGrid = grid.map(row => row.map(cell => ({ ...cell })));

    // Add current piece to display
    if (currentPiece) {
      const shape = SHAPES[currentPiece.type][currentPiece.rotation];
      const color = COLORS[currentPiece.type];
      shape.forEach(block => {
        const row = currentPiece.position.row + block.row;
        const col = currentPiece.position.col + block.col;
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
          displayGrid[row][col] = { filled: true, color };
        }
      });
    }

    return displayGrid;
  };

  const displayGrid = renderGrid();

  // Background interpolations
  const floatInterpolate1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const floatInterpolate2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const floatInterpolate3 = bgFloat3.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });
  const floatInterpolate4 = bgFloat4.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.bgElement1, { transform: [{ translateY: floatInterpolate1 }] }]} />
        <Animated.View style={[styles.bgElement2, { transform: [{ translateY: floatInterpolate2 }] }]} />
        <Animated.View style={[styles.bgElement3, { transform: [{ translateY: floatInterpolate3 }] }]} />
        <Animated.View style={[styles.bgElement4, { transform: [{ translateY: floatInterpolate4 }] }]} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={28} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.title}>TETRIS</Text>
        <TouchableOpacity onPress={() => setIsPaused(!isPaused)} style={styles.pauseButton}>
          <Ionicons name={isPaused ? 'play-circle' : 'pause-circle'} size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Score Board */}
      <View style={styles.scoreBoard}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>LINES</Text>
          <Text style={styles.scoreValue}>{lines}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>LEVEL</Text>
          <Text style={styles.scoreValue}>{level}</Text>
        </View>
      </View>

      {/* Next Piece Preview */}
      <View style={styles.nextPieceContainer}>
        <Text style={styles.nextPieceLabel}>NEXT</Text>
        <View style={styles.nextPieceBox}>
          {SHAPES[nextPiece][0].map((block, index) => (
            <View
              key={index}
              style={[
                styles.nextPieceCell,
                {
                  top: block.row * 14 + 12,
                  left: block.col * 14 + 12,
                  backgroundColor: COLORS[nextPiece],
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Game Grid */}
      <PanGestureHandler onHandlerStateChange={handleGesture}>
        <View style={styles.gameArea}>
          <View
            style={[
              styles.grid,
              {
                width: COLS * CELL_SIZE,
                height: ROWS * CELL_SIZE,
              },
            ]}
          >
            {displayGrid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <View
                  key={`${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    {
                      top: rowIndex * CELL_SIZE,
                      left: colIndex * CELL_SIZE,
                      width: CELL_SIZE - 1,
                      height: CELL_SIZE - 1,
                      backgroundColor: cell.filled ? cell.color : '#1F2937',
                      borderColor: cell.filled ? '#000000' : '#374151',
                    },
                  ]}
                />
              ))
            )}
          </View>
        </View>
      </PanGestureHandler>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => movePiece('LEFT')}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rotateButton} onPress={rotatePiece}>
            <Ionicons name="reload" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => movePiece('RIGHT')}>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.downButton} onPress={() => movePiece('DOWN')}>
            <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.gameOverCard}>
            <Ionicons name="game-controller" size={64} color="#EF4444" />
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Score: {score}</Text>
            <Text style={styles.statsText}>Lines: {lines}</Text>
            <Text style={styles.statsText}>Level: {level}</Text>
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
            <TouchableOpacity style={styles.resumeButton} onPress={() => setIsPaused(false)}>
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
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
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    top: 50,
    left: 30,
  },
  bgElement2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
    top: 150,
    right: 40,
  },
  bgElement3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    bottom: 200,
    left: 50,
  },
  bgElement4: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(34, 197, 94, 0.07)',
    bottom: 100,
    right: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  pauseButton: {
    padding: 5,
  },
  scoreBoard: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 5,
  },
  scoreBox: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextPieceContainer: {
    alignItems: 'center',
    marginVertical: 5,
  },
  nextPieceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 5,
  },
  nextPieceBox: {
    width: 80,
    height: 80,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  nextPieceCell: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#000000',
  },
  gameArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  grid: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 4,
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.5,
  },
  controls: {
    paddingVertical: 5,
    paddingBottom: 10,
    alignItems: 'center',
    gap: 8,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotateButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#A855F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameOverCard: {
    backgroundColor: '#1E293B',
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
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 5,
  },
  statsText: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
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
    backgroundColor: '#1E293B',
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

export default TetrisGame;

