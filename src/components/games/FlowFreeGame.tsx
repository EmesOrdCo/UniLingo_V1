import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FlowFreeGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GRID_SIZE = 5;
const CELL_SIZE = Math.min((width - 80) / GRID_SIZE, 70);

type Endpoint = {
  row: number;
  col: number;
  color: string;
  pairId: number;
};

type PathSegment = {
  row: number;
  col: number;
};

type Path = {
  pairId: number;
  color: string;
  segments: PathSegment[];
  isComplete: boolean;
};

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

// Predefined puzzles
const PUZZLES = [
  // Level 1 - Easy 5x5
  [
    { row: 0, col: 0, color: '#EF4444', pairId: 0 },
    { row: 0, col: 4, color: '#EF4444', pairId: 0 },
    { row: 1, col: 1, color: '#3B82F6', pairId: 1 },
    { row: 3, col: 3, color: '#3B82F6', pairId: 1 },
    { row: 2, col: 0, color: '#10B981', pairId: 2 },
    { row: 4, col: 2, color: '#10B981', pairId: 2 },
    { row: 2, col: 4, color: '#F59E0B', pairId: 3 },
    { row: 4, col: 4, color: '#F59E0B', pairId: 3 },
  ],
  // Level 2
  [
    { row: 0, col: 1, color: '#EF4444', pairId: 0 },
    { row: 2, col: 3, color: '#EF4444', pairId: 0 },
    { row: 0, col: 3, color: '#3B82F6', pairId: 1 },
    { row: 4, col: 1, color: '#3B82F6', pairId: 1 },
    { row: 1, col: 0, color: '#10B981', pairId: 2 },
    { row: 3, col: 4, color: '#10B981', pairId: 2 },
    { row: 2, col: 1, color: '#F59E0B', pairId: 3 },
    { row: 4, col: 3, color: '#F59E0B', pairId: 3 },
    { row: 3, col: 0, color: '#8B5CF6', pairId: 4 },
    { row: 1, col: 4, color: '#8B5CF6', pairId: 4 },
  ],
  // Level 3
  [
    { row: 0, col: 0, color: '#EF4444', pairId: 0 },
    { row: 4, col: 4, color: '#EF4444', pairId: 0 },
    { row: 0, col: 2, color: '#3B82F6', pairId: 1 },
    { row: 2, col: 4, color: '#3B82F6', pairId: 1 },
    { row: 0, col: 4, color: '#10B981', pairId: 2 },
    { row: 4, col: 0, color: '#10B981', pairId: 2 },
    { row: 1, col: 1, color: '#F59E0B', pairId: 3 },
    { row: 3, col: 3, color: '#F59E0B', pairId: 3 },
    { row: 2, col: 0, color: '#8B5CF6', pairId: 4 },
    { row: 2, col: 2, color: '#8B5CF6', pairId: 4 },
    { row: 3, col: 1, color: '#EC4899', pairId: 5 },
    { row: 4, col: 2, color: '#EC4899', pairId: 5 },
  ],
];

const FlowFreeGame: React.FC<FlowFreeGameProps> = ({ onClose, onGameComplete }) => {
  // Game state
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentDrawingPath, setCurrentDrawingPath] = useState<{ pairId: number; color: string; segments: PathSegment[] } | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [moves, setMoves] = useState(0);

  // Refs
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;

  // Initialize level
  const initializeLevel = useCallback((levelIndex: number) => {
    const puzzle = PUZZLES[levelIndex];
    setEndpoints(puzzle);
    setPaths([]);
    setCurrentDrawingPath(null);
    setGameStarted(false);
    setMoves(0);
  }, []);

  // Start game
  useEffect(() => {
    initializeLevel(level);
  }, [level, initializeLevel]);

  // Get cell content
  const getCellContent = useCallback((row: number, col: number) => {
    // Check if it's an endpoint
    const endpoint = endpoints.find(e => e.row === row && e.col === col);
    if (endpoint) return { type: 'endpoint', ...endpoint };

    // Check if it's part of current drawing path
    if (currentDrawingPath) {
      const segment = currentDrawingPath.segments.find(s => s.row === row && s.col === col);
      if (segment) return { type: 'drawing', color: currentDrawingPath.color, pairId: currentDrawingPath.pairId };
    }

    // Check if it's part of a completed path
    for (const path of paths) {
      const segment = path.segments.find(s => s.row === row && s.col === col);
      if (segment) return { type: 'path', color: path.color, pairId: path.pairId };
    }

    return null;
  }, [endpoints, paths, currentDrawingPath]);

  // Check if move is valid
  const isValidMove = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    // Must be adjacent (not diagonal)
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) return false;

    // Must be within grid
    if (toRow < 0 || toRow >= GRID_SIZE || toCol < 0 || toCol >= GRID_SIZE) return false;

    return true;
  }, []);

  // Check if puzzle is complete
  const checkWin = useCallback(() => {
    // All paths must be complete
    if (paths.length === 0) return false;
    
    const pairCount = endpoints.length / 2;
    if (paths.length !== pairCount) return false;
    if (!paths.every(p => p.isComplete)) return false;

    // All cells must be filled
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const content = getCellContent(row, col);
        if (!content) return false;
      }
    }

    return true;
  }, [paths, endpoints, getCellContent]);

  // Handle path drawing
  const handleCellTouch = useCallback((row: number, col: number) => {
    if (!gameStarted) setGameStarted(true);

    const content = getCellContent(row, col);

    // Start new path from endpoint
    if (content?.type === 'endpoint') {
      // Clear any existing path for this pair
      setPaths(prev => prev.filter(p => p.pairId !== content.pairId));
      
      setCurrentDrawingPath({
        pairId: content.pairId,
        color: content.color,
        segments: [{ row, col }],
      });
      return;
    }

    // Continue drawing current path
    if (currentDrawingPath) {
      const lastSegment = currentDrawingPath.segments[currentDrawingPath.segments.length - 1];
      
      // Check if trying to go back
      if (currentDrawingPath.segments.length > 1) {
        const prevSegment = currentDrawingPath.segments[currentDrawingPath.segments.length - 2];
        if (prevSegment.row === row && prevSegment.col === col) {
          // Remove last segment (undo)
          setCurrentDrawingPath({
            ...currentDrawingPath,
            segments: currentDrawingPath.segments.slice(0, -1),
          });
          return;
        }
      }

      // Check if move is valid
      if (!isValidMove(lastSegment.row, lastSegment.col, row, col)) return;

      // Check if cell is already in current path (trying to cross itself)
      if (currentDrawingPath.segments.some(s => s.row === row && s.col === col)) return;

      // Check if cell is occupied by another path
      const occupiedByOther = paths.some(p => 
        p.pairId !== currentDrawingPath.pairId && 
        p.segments.some(s => s.row === row && s.col === col)
      );
      if (occupiedByOther) return;

      // Check if reached the other endpoint
      const targetEndpoint = endpoints.find(e => 
        e.pairId === currentDrawingPath.pairId && 
        e.row === row && 
        e.col === col &&
        !(e.row === currentDrawingPath.segments[0].row && e.col === currentDrawingPath.segments[0].col)
      );

      if (targetEndpoint) {
        // Complete the path
        const completedPath: Path = {
          pairId: currentDrawingPath.pairId,
          color: currentDrawingPath.color,
          segments: [...currentDrawingPath.segments, { row, col }],
          isComplete: true,
        };
        setPaths(prev => [...prev, completedPath]);
        setCurrentDrawingPath(null);
        setMoves(m => m + 1);
        setScore(s => s + 50);

        // Check win after a brief delay
        setTimeout(() => {
          const allPaths = [...paths, completedPath];
          // Manually check win with updated paths
          const pairCount = endpoints.length / 2;
          const allComplete = allPaths.length === pairCount && allPaths.every(p => p.isComplete);
          
          if (allComplete) {
            // Check all cells filled
            let allFilled = true;
            for (let r = 0; r < GRID_SIZE; r++) {
              for (let c = 0; c < GRID_SIZE; c++) {
                const isEndpoint = endpoints.some(e => e.row === r && e.col === c);
                const inPath = allPaths.some(p => p.segments.some(s => s.row === r && s.col === c));
                if (!isEndpoint && !inPath) {
                  allFilled = false;
                  break;
                }
              }
              if (!allFilled) break;
            }

            if (allFilled) {
              const moveBonus = Math.max(0, 500 - moves * 10);
              setScore(s => s + moveBonus + 1000);
              setGameWon(true);
            }
          }
        }, 100);
      } else {
        // Continue path
        setCurrentDrawingPath({
          ...currentDrawingPath,
          segments: [...currentDrawingPath.segments, { row, col }],
        });
      }
    }
  }, [gameStarted, currentDrawingPath, paths, endpoints, getCellContent, isValidMove, moves]);

  // Pan responder for drawing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const col = Math.floor(locationX / CELL_SIZE);
        const row = Math.floor(locationY / CELL_SIZE);
        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
          handleCellTouch(row, col);
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const col = Math.floor(locationX / CELL_SIZE);
        const row = Math.floor(locationY / CELL_SIZE);
        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
          handleCellTouch(row, col);
        }
      },
      onPanResponderRelease: () => {
        // If path wasn't completed, save it as incomplete
        if (currentDrawingPath && currentDrawingPath.segments.length > 1) {
          setPaths(prev => [...prev, {
            ...currentDrawingPath,
            isComplete: false,
          }]);
          setCurrentDrawingPath(null);
        } else if (currentDrawingPath) {
          setCurrentDrawingPath(null);
        }
      },
    })
  ).current;

  // Clear all paths
  const clearAll = useCallback(() => {
    setPaths([]);
    setCurrentDrawingPath(null);
    setMoves(0);
  }, []);

  // Handle game over
  useEffect(() => {
    if ((gameOver || gameWon) && !completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      console.log('🌊 Flow Free calling onGameComplete with score:', score);
      setTimeout(() => {
        onGameComplete(score);
      }, 100);
    }
  }, [gameOver, gameWon, score, onGameComplete]);

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

    setTimeout(() => createFloatAnimation(bgFloat1, 3500).start(), 100);
    setTimeout(() => createFloatAnimation(bgFloat2, 4000).start(), 300);
  }, []);

  const handleRestart = () => {
    initializeLevel(level);
    setScore(0);
    setGameWon(false);
    setGameOver(false);
    completionCalledRef.current = false;
    finalScoreRef.current = 0;
  };

  const handleNextLevel = () => {
    if (level < PUZZLES.length - 1) {
      setLevel(level + 1);
      setGameWon(false);
      completionCalledRef.current = false;
    } else {
      // Completed all levels
      setLevel(0);
      setGameWon(false);
      completionCalledRef.current = false;
    }
  };

  const handleClose = () => {
    if (!completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      onGameComplete(score);
    }
    onClose();
  };

  const handleStart = () => {
    setGameStarted(true);
  };

  const floatInterpolate1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const floatInterpolate2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

  const completionPercentage = ((paths.filter(p => p.isComplete).length / (endpoints.length / 2)) * 100).toFixed(0);

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
        <Text style={styles.title}>FLOW FREE</Text>
        <TouchableOpacity onPress={() => setIsPaused(!isPaused)} style={styles.pauseButton}>
          <Ionicons name={isPaused ? 'play-circle' : 'pause-circle'} size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>LEVEL</Text>
          <Text style={styles.statValue}>{level + 1}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>COMPLETE</Text>
          <Text style={styles.statValue}>{completionPercentage}%</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gameContainer}>
        <View 
          style={[styles.grid, { width: CELL_SIZE * GRID_SIZE, height: CELL_SIZE * GRID_SIZE }]}
          {...panResponder.panHandlers}
        >
          {Array.from({ length: GRID_SIZE }).map((_, row) => (
            <View key={row} style={styles.row}>
              {Array.from({ length: GRID_SIZE }).map((_, col) => {
                const content = getCellContent(row, col);
                const isEndpoint = content?.type === 'endpoint';
                
                return (
                  <View
                    key={col}
                    style={[
                      styles.cell,
                      { width: CELL_SIZE, height: CELL_SIZE },
                      content && !isEndpoint && { backgroundColor: content.color },
                    ]}
                  >
                    {isEndpoint && (
                      <View style={[styles.endpoint, { backgroundColor: content.color }]} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {!gameStarted && !gameOver && !gameWon && (
          <View style={styles.startOverlay}>
            <Text style={styles.startText}>Connect matching colors!</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>START</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      {gameStarted && !gameOver && !gameWon && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={clearAll}>
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Drag to connect matching colors. Fill all cells to win!
        </Text>
      </View>

      {/* Win Overlay */}
      {gameWon && (
        <View style={styles.overlay}>
          <View style={styles.winCard}>
            <Ionicons name="trophy" size={64} color="#F59E0B" />
            <Text style={styles.winTitle}>Level Complete!</Text>
            <Text style={styles.winScore}>Score: {score}</Text>
            <Text style={styles.winMoves}>Moves: {moves}</Text>
            <View style={styles.buttonRow}>
              {level < PUZZLES.length - 1 ? (
                <TouchableOpacity style={styles.nextButton} onPress={handleNextLevel}>
                  <Ionicons name="play-forward" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Next Level</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.nextButton} onPress={handleNextLevel}>
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Play Again</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.exitButton} onPress={handleClose}>
                <Ionicons name="exit" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Pause Overlay */}
      {isPaused && !gameOver && !gameWon && (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(236, 72, 153, 0.07)',
    bottom: 150,
    right: 40,
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
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  pauseButton: {
    padding: 5,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 80,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gameContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endpoint: {
    width: '60%',
    height: '60%',
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  startOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    gap: 15,
  },
  startText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 10,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  controls: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructions: {
    marginTop: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
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
  winCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  winTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 10,
  },
  winScore: {
    fontSize: 20,
    color: '#3B82F6',
    marginBottom: 5,
  },
  winMoves: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nextButton: {
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

export default FlowFreeGame;

