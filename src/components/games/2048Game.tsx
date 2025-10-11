import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface Game2048Props {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onRestart?: () => Promise<boolean>;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GRID_SIZE = 4;
const CELL_SIZE = Math.floor(Math.min(width - 40, height - 400) / GRID_SIZE);
const CELL_MARGIN = 4;

type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
};

const Game2048: React.FC<Game2048Props> = ({ onClose, onGameComplete, onRestart }) => {
  // Game state
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [continueAfterWin, setContinueAfterWin] = useState(false);

  // Refs
  const nextTileId = useRef(0);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  // Animated values for background
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgFloat3 = useRef(new Animated.Value(0)).current;
  const bgFloat4 = useRef(new Animated.Value(0)).current;

  // Initialize game
  const initializeGame = useCallback(() => {
    const newTiles: Tile[] = [];
    
    // Add two starting tiles
    const positions = getRandomEmptyPositions([], 2);
    positions.forEach((pos) => {
      newTiles.push({
        id: nextTileId.current++,
        value: Math.random() < 0.9 ? 2 : 4,
        row: pos.row,
        col: pos.col,
        isNew: true,
      });
    });

    setTiles(newTiles);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setContinueAfterWin(false);
    completionCalledRef.current = false;
    finalScoreRef.current = 0;
  }, []);

  // Get random empty positions
  const getRandomEmptyPositions = (currentTiles: Tile[], count: number): { row: number; col: number }[] => {
    const occupiedPositions = new Set(currentTiles.map(t => `${t.row}-${t.col}`));
    const emptyPositions: { row: number; col: number }[] = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!occupiedPositions.has(`${row}-${col}`)) {
          emptyPositions.push({ row, col });
        }
      }
    }

    // Shuffle and return requested count
    const shuffled = emptyPositions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  // Add new tile
  const addNewTile = (currentTiles: Tile[]): Tile[] => {
    const positions = getRandomEmptyPositions(currentTiles, 1);
    if (positions.length === 0) return currentTiles;

    const newTile: Tile = {
      id: nextTileId.current++,
      value: Math.random() < 0.9 ? 2 : 4,
      row: positions[0].row,
      col: positions[0].col,
      isNew: true,
    };

    return [...currentTiles, newTile];
  };

  // Move tiles in a direction
  const moveTiles = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver || (won && !continueAfterWin)) return;

    let moved = false;
    let scoreGain = 0;
    const newTiles: Tile[] = [];
    const merged = new Set<string>();

    // Create a 2D array representation
    const grid: (Tile | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    tiles.forEach(tile => {
      grid[tile.row][tile.col] = { ...tile, isNew: false, isMerged: false };
    });

    // Define traversal order based on direction
    const getTraversal = (dir: typeof direction) => {
      const rows = [...Array(GRID_SIZE).keys()];
      const cols = [...Array(GRID_SIZE).keys()];

      if (dir === 'DOWN') rows.reverse();
      if (dir === 'RIGHT') cols.reverse();

      return { rows, cols };
    };

    const traversal = getTraversal(direction);

    // Helper to get next position
    const getVector = (dir: typeof direction) => {
      const vectors = {
        UP: { row: -1, col: 0 },
        DOWN: { row: 1, col: 0 },
        LEFT: { row: 0, col: -1 },
        RIGHT: { row: 0, col: 1 },
      };
      return vectors[dir];
    };

    const vector = getVector(direction);

    // Move each tile
    traversal.rows.forEach(row => {
      traversal.cols.forEach(col => {
        const tile = grid[row][col];
        if (!tile) return;

        let currentRow = row;
        let currentCol = col;
        let nextRow = currentRow + vector.row;
        let nextCol = currentCol + vector.col;

        // Find farthest empty position
        while (
          nextRow >= 0 &&
          nextRow < GRID_SIZE &&
          nextCol >= 0 &&
          nextCol < GRID_SIZE &&
          !grid[nextRow][nextCol]
        ) {
          currentRow = nextRow;
          currentCol = nextCol;
          nextRow = currentRow + vector.row;
          nextCol = currentCol + vector.col;
        }

        // Check if can merge with next tile
        if (
          nextRow >= 0 &&
          nextRow < GRID_SIZE &&
          nextCol >= 0 &&
          nextCol < GRID_SIZE &&
          grid[nextRow][nextCol] &&
          grid[nextRow][nextCol]!.value === tile.value &&
          !merged.has(`${nextRow}-${nextCol}`)
        ) {
          // Merge tiles
          currentRow = nextRow;
          currentCol = nextCol;
          tile.value *= 2;
          tile.isMerged = true;
          scoreGain += tile.value;
          merged.add(`${currentRow}-${currentCol}`);
          grid[row][col] = null;
          grid[currentRow][currentCol] = null; // Remove old tile at merge position
          moved = true;
        } else if (currentRow !== row || currentCol !== col) {
          // Just move tile
          grid[row][col] = null;
          moved = true;
        }

        tile.row = currentRow;
        tile.col = currentCol;
        grid[currentRow][currentCol] = tile;
      });
    });

    // Collect all tiles from grid
    grid.forEach(row => {
      row.forEach(tile => {
        if (tile) newTiles.push(tile);
      });
    });

    if (moved) {
      // Haptic feedback for tile movement
      if (scoreGain > 0) {
        // Tiles merged - success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Just moved - light haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setScore(prev => prev + scoreGain);
      const tilesWithNew = addNewTile(newTiles);
      setTiles(tilesWithNew);

      // Check for 2048 tile
      if (!won && tilesWithNew.some(t => t.value === 2048)) {
        setWon(true);
        // Haptic feedback for winning!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Check for game over
      setTimeout(() => {
        if (!canMove(tilesWithNew)) {
          // Haptic feedback for game over
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setGameOver(true);
        }
      }, 300);
    }
  }, [tiles, gameOver, won, continueAfterWin]);

  // Check if any moves are possible
  const canMove = (currentTiles: Tile[]): boolean => {
    // Check if any empty cells
    if (currentTiles.length < GRID_SIZE * GRID_SIZE) return true;

    // Check if any adjacent tiles can merge
    const grid: (number | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    currentTiles.forEach(tile => {
      grid[tile.row][tile.col] = tile.value;
    });

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const value = grid[row][col];
        if (!value) continue;

        // Check right
        if (col < GRID_SIZE - 1 && grid[row][col + 1] === value) return true;
        // Check down
        if (row < GRID_SIZE - 1 && grid[row + 1][col] === value) return true;
      }
    }

    return false;
  };

  // Handle game over
  useEffect(() => {
    if (gameOver && !completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      console.log('🎮 2048 calling onGameComplete with score:', score);
      
      // Update best score
      if (score > bestScore) {
        setBestScore(score);
      }
      
      setTimeout(() => {
        onGameComplete(score);
      }, 100);
    }
  }, [gameOver, score, onGameComplete, bestScore]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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

      if (absX < 30 && absY < 30) return; // Too small, ignore

      if (absX > absY) {
        // Horizontal swipe
        if (translationX > 0) {
          moveTiles('RIGHT');
        } else {
          moveTiles('LEFT');
        }
      } else {
        // Vertical swipe
        if (translationY > 0) {
          moveTiles('DOWN');
        } else {
          moveTiles('UP');
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

    initializeGame();
  };

  const handleClose = () => {
    if (!completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      onGameComplete(score);
    }
    onClose();
  };

  const handleContinue = () => {
    setContinueAfterWin(true);
  };

  // Get tile color
  const getTileColor = (value: number): string => {
    const colors: { [key: number]: string } = {
      2: '#EEE4DA',
      4: '#EDE0C8',
      8: '#F2B179',
      16: '#F59563',
      32: '#F67C5F',
      64: '#F65E3B',
      128: '#EDCF72',
      256: '#EDCC61',
      512: '#EDC850',
      1024: '#EDC53F',
      2048: '#EDC22E',
      4096: '#3C3A32',
    };
    return colors[value] || '#3C3A32';
  };

  // Get text color
  const getTextColor = (value: number): string => {
    return value <= 4 ? '#776E65' : '#F9F6F2';
  };

  // Background interpolations
  const floatInterpolate1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const floatInterpolate2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const floatInterpolate3 = bgFloat3.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });
  const floatInterpolate4 = bgFloat4.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.bgElement1, { transform: [{ translateY: floatInterpolate1 }] }]} />
        <Animated.View style={[styles.bgElement2, { transform: [{ translateY: floatInterpolate2 }] }]} />
        <Animated.View style={[styles.bgElement3, { transform: [{ translateY: floatInterpolate3 }] }]} />
        <Animated.View style={[styles.bgElement4, { transform: [{ translateY: floatInterpolate4 }] }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={32} color="#EF4444" />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>2048</Text>
        </View>

        <TouchableOpacity onPress={handleRestart} style={styles.restartButton}>
          <Ionicons name="refresh-circle" size={32} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Score Board */}
      <View style={styles.scoreBoard}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>BEST</Text>
          <Text style={styles.scoreValue}>{bestScore}</Text>
        </View>
      </View>

      {/* Game Area */}
      <PanGestureHandler onHandlerStateChange={handleGesture}>
        <View style={styles.gameArea}>
          <View
            style={[
              styles.grid,
              {
                width: GRID_SIZE * (CELL_SIZE + CELL_MARGIN) + CELL_MARGIN,
                height: GRID_SIZE * (CELL_SIZE + CELL_MARGIN) + CELL_MARGIN,
              },
            ]}
          >
            {/* Grid cells (background) */}
            {[...Array(GRID_SIZE * GRID_SIZE)].map((_, index) => {
              const row = Math.floor(index / GRID_SIZE);
              const col = index % GRID_SIZE;
              return (
                <View
                  key={`cell-${index}`}
                  style={[
                    styles.gridCell,
                    {
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      top: row * (CELL_SIZE + CELL_MARGIN) + CELL_MARGIN,
                      left: col * (CELL_SIZE + CELL_MARGIN) + CELL_MARGIN,
                    },
                  ]}
                />
              );
            })}

            {/* Tiles */}
            {tiles.map((tile) => (
              <Animated.View
                key={tile.id}
                style={[
                  styles.tile,
                  {
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    top: tile.row * (CELL_SIZE + CELL_MARGIN) + CELL_MARGIN,
                    left: tile.col * (CELL_SIZE + CELL_MARGIN) + CELL_MARGIN,
                    backgroundColor: getTileColor(tile.value),
                    transform: [{ scale: tile.isNew ? 0 : 1 }],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tileText,
                    {
                      color: getTextColor(tile.value),
                      fontSize: tile.value >= 1000 ? 28 : tile.value >= 100 ? 36 : 44,
                    },
                  ]}
                >
                  {tile.value}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </PanGestureHandler>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Swipe to move tiles. When two tiles with the same number touch, they merge!
        </Text>
      </View>

      {/* Win Overlay */}
      {won && !continueAfterWin && (
        <View style={styles.overlay}>
          <View style={styles.winCard}>
            <Ionicons name="trophy" size={64} color="#EDC22E" />
            <Text style={styles.winTitle}>You Win!</Text>
            <Text style={styles.winScore}>Score: {score}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Keep Going</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.newGameButton} onPress={handleRestart}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>New Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.gameOverCard}>
            <Ionicons name="close-circle" size={64} color="#EF4444" />
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Final Score: {score}</Text>
            {score > bestScore && <Text style={styles.newBestText}>New Best!</Text>}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.tryAgainButton} onPress={handleRestart}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Try Again</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8EF',
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
    backgroundColor: 'rgba(238, 228, 218, 0.3)',
    top: 50,
    left: 30,
  },
  bgElement2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(237, 224, 200, 0.25)',
    top: 150,
    right: 40,
  },
  bgElement3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(242, 177, 121, 0.2)',
    bottom: 200,
    left: 50,
  },
  bgElement4: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(237, 194, 46, 0.18)',
    bottom: 100,
    right: 30,
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
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#776E65',
  },
  restartButton: {
    padding: 5,
  },
  scoreBoard: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 15,
  },
  scoreBox: {
    backgroundColor: '#BBADA0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EEE4DA',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    backgroundColor: '#BBADA0',
    borderRadius: 8,
    position: 'relative',
  },
  gridCell: {
    position: 'absolute',
    backgroundColor: '#CDC1B4',
    borderRadius: 4,
  },
  tile: {
    position: 'absolute',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontWeight: '700',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#776E65',
    textAlign: 'center',
    lineHeight: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(238, 228, 218, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EDC22E',
  },
  winTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#776E65',
    marginTop: 15,
    marginBottom: 10,
  },
  winScore: {
    fontSize: 20,
    color: '#776E65',
    marginBottom: 20,
  },
  gameOverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#776E65',
    marginTop: 15,
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 20,
    color: '#776E65',
    marginBottom: 10,
  },
  newBestText: {
    fontSize: 16,
    color: '#EDC22E',
    fontWeight: '600',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8F7A66',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8F7A66',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Game2048;

