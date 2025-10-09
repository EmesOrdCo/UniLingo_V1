import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line } from 'react-native-svg';

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

// Puzzle solver using backtracking
const solvePuzzle = (endpoints: Endpoint[], gridSize: number): { paths: Path[], solvable: boolean } => {
  const grid: (number | null)[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  const pairs: { [key: number]: Endpoint[] } = {};
  
  // Group endpoints by pairId
  endpoints.forEach(ep => {
    if (!pairs[ep.pairId]) pairs[ep.pairId] = [];
    pairs[ep.pairId].push(ep);
  });
  
  // Mark endpoints on grid
  endpoints.forEach(ep => {
    grid[ep.row][ep.col] = ep.pairId;
  });
  
  const pairIds = Object.keys(pairs).map(Number);
  const foundPaths: Path[] = [];
  
  // Check if position is valid
  const isValid = (row: number, col: number, pairId: number): boolean => {
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return false;
    if (grid[row][col] === null) return true;
    if (grid[row][col] === pairId) {
      // Check if it's the target endpoint
      const targetEndpoint = pairs[pairId].find(ep => 
        ep.row === row && ep.col === col && 
        !(ep.row === pairs[pairId][0].row && ep.col === pairs[pairId][0].col)
      );
      return !!targetEndpoint;
    }
    return false;
  };
  
  // Try to connect a pair using DFS
  const connectPair = (pairId: number, row: number, col: number, path: PathSegment[]): boolean => {
    const target = pairs[pairId][1];
    
    // Reached target
    if (row === target.row && col === target.col) {
      foundPaths.push({
        pairId,
        color: pairs[pairId][0].color,
        segments: [...path, { row, col }],
        isComplete: true,
      });
      return true;
    }
    
    // Try all 4 directions
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (isValid(newRow, newCol, pairId)) {
        const wasNull = grid[newRow][newCol] === null;
        if (wasNull) grid[newRow][newCol] = pairId;
        
        path.push({ row: newRow, col: newCol });
        
        if (connectPair(pairId, newRow, newCol, path)) {
          return true;
        }
        
        // Backtrack
        path.pop();
        if (wasNull) grid[newRow][newCol] = null;
      }
    }
    
    return false;
  };
  
  // Try to solve by connecting all pairs
  const solve = (pairIndex: number): boolean => {
    if (pairIndex >= pairIds.length) {
      // Check if all cells are filled
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (grid[r][c] === null) return false;
        }
      }
      return true;
    }
    
    const pairId = pairIds[pairIndex];
    const start = pairs[pairId][0];
    
    // Start from the first endpoint
    if (connectPair(pairId, start.row, start.col, [{ row: start.row, col: start.col }])) {
      if (solve(pairIndex + 1)) {
        return true;
      }
      // Backtrack - remove path
      const lastPath = foundPaths.pop();
      if (lastPath) {
        lastPath.segments.forEach(seg => {
          if (!(endpoints.some(ep => ep.row === seg.row && ep.col === seg.col))) {
            grid[seg.row][seg.col] = null;
          }
        });
      }
    }
    
    return false;
  };
  
  const solvable = solve(0);
  return { paths: foundPaths, solvable };
};

// Validate puzzle has a solution
const validatePuzzle = (endpoints: Endpoint[], gridSize: number): boolean => {
  const result = solvePuzzle(endpoints, gridSize);
  console.log(`🌊 Puzzle validation: ${result.solvable ? 'SOLVABLE' : 'UNSOLVABLE'}`);
  return result.solvable;
};

// Generate a valid puzzle by creating complete solution first
const generatePuzzle = (gridSize: number, numPairs: number): Endpoint[] => {
  const totalCells = gridSize * gridSize;
  const grid: (number | null)[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  const endpoints: Endpoint[] = [];
  const paths: [number, number][][] = [];
  
  // Helper to get available neighbors
  const getNeighbors = (row: number, col: number): [number, number][] => {
    const neighbors: [number, number][] = [];
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    // Shuffle directions for randomness
    const shuffled = dirs.sort(() => Math.random() - 0.5);
    for (const [dr, dc] of shuffled) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize && grid[newRow][newCol] === null) {
        neighbors.push([newRow, newCol]);
      }
    }
    return neighbors;
  };
  
  // Calculate target cells per path (must fill ALL cells)
  const cellsPerPath = Math.floor(totalCells / numPairs);
  const extraCells = totalCells % numPairs;
  
  // Generate each path to fill specific number of cells
  for (let pairId = 0; pairId < numPairs; pairId++) {
    const targetLength = cellsPerPath + (pairId < extraCells ? 1 : 0);
    let success = false;
    
    for (let attempt = 0; attempt < 50 && !success; attempt++) {
      // Find empty starting position
      const emptyCells: [number, number][] = [];
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (grid[r][c] === null) emptyCells.push([r, c]);
        }
      }
      
      if (emptyCells.length < targetLength) break;
      
      // Pick random start
      const [startRow, startCol] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      
      // Build path using random walk
      const path: [number, number][] = [[startRow, startCol]];
      grid[startRow][startCol] = pairId;
      
      let current: [number, number] = [startRow, startCol];
      
      // Random walk until we hit target length
      while (path.length < targetLength) {
        const neighbors = getNeighbors(current[0], current[1]);
        if (neighbors.length === 0) break; // Stuck
        
        const next = neighbors[0]; // Take first (already shuffled)
        grid[next[0]][next[1]] = pairId;
        path.push(next);
        current = next;
      }
      
      if (path.length === targetLength) {
        // Success!
        const color = COLORS[pairId % COLORS.length];
        endpoints.push({ row: path[0][0], col: path[0][1], color, pairId });
        endpoints.push({ row: path[path.length - 1][0], col: path[path.length - 1][1], color, pairId });
        paths.push(path);
        success = true;
      } else {
        // Failed - backtrack
        path.forEach(([r, c]) => {
          grid[r][c] = null;
        });
      }
    }
    
    if (!success) {
      // Failed to generate this path - clear all and return empty
      return [];
    }
  }
  
  // Verify all cells are filled
  let filledCells = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] !== null) filledCells++;
    }
  }
  
  if (filledCells !== totalCells) {
    console.warn(`🌊 Puzzle generation incomplete: ${filledCells}/${totalCells} cells filled`);
    return [];
  }
  
  return endpoints;
};

// Generate validated puzzles that fill entire grid
const generateValidPuzzles = (): Endpoint[][] => {
  const puzzles: Endpoint[][] = [];
  const difficulties = [5, 6, 7]; // pairs per level (25 cells ÷ 5 = 5 cells/path)
  
  console.log('🌊 Generating puzzles that fill ALL 25 cells...');
  
  for (let levelIdx = 0; levelIdx < difficulties.length; levelIdx++) {
    const pairCount = difficulties[levelIdx];
    let found = false;
    
    for (let attempt = 0; attempt < 200 && !found; attempt++) {
      const puzzle = generatePuzzle(GRID_SIZE, pairCount);
      
      // Check if generation succeeded (returns empty array on failure)
      if (puzzle.length === pairCount * 2) {
        // Double-check with validator
        if (validatePuzzle(puzzle, GRID_SIZE)) {
          puzzles.push(puzzle);
          console.log(`✅ Level ${levelIdx + 1}: ${pairCount} pairs, all 25 cells filled, SOLVABLE`);
          found = true;
        }
      }
    }
    
    if (!found) {
      console.error(`❌ Level ${levelIdx + 1}: Failed after 200 attempts`);
    }
  }
  
  return puzzles;
};

const PUZZLES = generateValidPuzzles();
console.log(`🌊 Loaded ${PUZZLES.length} validated puzzles`);

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
    
    // Puzzles are already validated during generation
    console.log(`🌊 Loading level ${levelIndex + 1} (pre-validated)`);
    
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

  // Generate pipe path for a series of segments
  const generatePipePath = useCallback((segments: PathSegment[], color: string) => {
    if (segments.length < 2) return null;
    
    const paths: JSX.Element[] = [];
    
    // Draw line segments between consecutive cells
    for (let i = 0; i < segments.length - 1; i++) {
      const from = segments[i];
      const to = segments[i + 1];
      
      const fromX = from.col * CELL_SIZE + CELL_SIZE / 2;
      const fromY = from.row * CELL_SIZE + CELL_SIZE / 2;
      const toX = to.col * CELL_SIZE + CELL_SIZE / 2;
      const toY = to.row * CELL_SIZE + CELL_SIZE / 2;
      
      paths.push(
        <Line
          key={`${from.row}-${from.col}-${to.row}-${to.col}`}
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke={color}
          strokeWidth={CELL_SIZE * 0.6}
          strokeLinecap="round"
        />
      );
    }
    
    return paths;
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
    
    console.log('🌊 handleCellTouch:', { row, col, content: content?.type, currentDrawing: !!currentDrawingPath });

    // If currently drawing a path
    if (currentDrawingPath) {
      const lastSegment = currentDrawingPath.segments[currentDrawingPath.segments.length - 1];
      
      // Check if trying to go back
      if (currentDrawingPath.segments.length > 1) {
        const prevSegment = currentDrawingPath.segments[currentDrawingPath.segments.length - 2];
        if (prevSegment.row === row && prevSegment.col === col) {
          // Remove last segment (undo)
          console.log('🌊 Going back, removing last segment');
          setCurrentDrawingPath({
            ...currentDrawingPath,
            segments: currentDrawingPath.segments.slice(0, -1),
          });
          return;
        }
      }

      // Check if move is valid (adjacent)
      if (!isValidMove(lastSegment.row, lastSegment.col, row, col)) {
        console.log('🌊 Invalid move - not adjacent');
        return;
      }

      // Check if cell is already in current path (trying to cross itself)
      if (currentDrawingPath.segments.some(s => s.row === row && s.col === col)) {
        console.log('🌊 Cell already in path');
        return;
      }

      // Check if cell is occupied by another path
      const occupiedByOther = paths.some(p => 
        p.pairId !== currentDrawingPath.pairId && 
        p.segments.some(s => s.row === row && s.col === col)
      );
      if (occupiedByOther) {
        console.log('🌊 Cell occupied by another path');
        return;
      }

      // Check if reached the TARGET endpoint (matching pair)
      if (content?.type === 'endpoint' && content.pairId === currentDrawingPath.pairId) {
        // Make sure it's NOT the starting endpoint
        const isStartPoint = content.row === currentDrawingPath.segments[0].row && 
                            content.col === currentDrawingPath.segments[0].col;
        
        if (!isStartPoint) {
          console.log('🌊 Reached target endpoint! Completing path');
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
            const pairCount = endpoints.length / 2;
            const allComplete = allPaths.length === pairCount && allPaths.every(p => p.isComplete);
            
            if (allComplete) {
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
          return;
        } else {
          console.log('🌊 Touched starting endpoint, ignoring');
          return;
        }
      }

      // Check if touched a DIFFERENT endpoint (not our pair)
      if (content?.type === 'endpoint' && content.pairId !== currentDrawingPath.pairId) {
        console.log('🌊 Touched different endpoint, blocking');
        return;
      }

      // Continue path to empty cell
      console.log('🌊 Continuing path');
      setCurrentDrawingPath({
        ...currentDrawingPath,
        segments: [...currentDrawingPath.segments, { row, col }],
      });
      return;
    }

    // Not currently drawing - ONLY start new path from endpoint
    if (content?.type === 'endpoint') {
      console.log('🌊 Starting path from endpoint:', { pairId: content.pairId, color: content.color });
      // Clear any existing path for this pair
      setPaths(prev => prev.filter(p => p.pairId !== content.pairId));
      
      setCurrentDrawingPath({
        pairId: content.pairId,
        color: content.color,
        segments: [{ row, col }],
      });
      return;
    }
    
    // If not drawing and not touching an endpoint, do nothing
    console.log('🌊 Not an endpoint, ignoring touch');
  }, [gameStarted, currentDrawingPath, paths, endpoints, getCellContent, isValidMove, moves]);

  // Track last touched cell to avoid duplicate calls
  const lastTouchedCell = useRef<{ row: number; col: number } | null>(null);
  const handleCellTouchRef = useRef(handleCellTouch);
  
  // Keep ref updated
  useEffect(() => {
    handleCellTouchRef.current = handleCellTouch;
  }, [handleCellTouch]);

  // Pan responder for drawing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const col = Math.floor(locationX / CELL_SIZE);
        const row = Math.floor(locationY / CELL_SIZE);
        
        console.log('🌊 Touch start:', { locationX, locationY, row, col, CELL_SIZE });
        
        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
          lastTouchedCell.current = { row, col };
          handleCellTouchRef.current(row, col);
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const col = Math.floor(locationX / CELL_SIZE);
        const row = Math.floor(locationY / CELL_SIZE);
        
        // Only trigger if moved to a different cell AND we're currently drawing
        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
          if (!lastTouchedCell.current || 
              lastTouchedCell.current.row !== row || 
              lastTouchedCell.current.col !== col) {
            console.log('🌊 Touch move to new cell:', { row, col });
            lastTouchedCell.current = { row, col };
            handleCellTouchRef.current(row, col);
          }
        }
      },
      onPanResponderRelease: () => {
        console.log('🌊 Touch release');
        lastTouchedCell.current = null;
        
        // Access current state via a callback
        setCurrentDrawingPath(currentPath => {
          console.log('🌊 Release with path:', currentPath?.segments.length);
          // Only save incomplete paths if they have at least 2 segments
          if (currentPath && currentPath.segments.length > 1) {
            setPaths(prev => [...prev, {
              ...currentPath,
              isComplete: false,
            }]);
            return null;
          } else if (currentPath) {
            // Single segment path - just clear it
            return null;
          }
          return currentPath;
        });
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
      // Completed all levels - generate a random one
      console.log('🌊 Generating random puzzle...');
      const newPuzzle = generatePuzzle(GRID_SIZE, 4);
      if (newPuzzle.length > 0 && validatePuzzle(newPuzzle, GRID_SIZE)) {
        console.log('🌊 Random puzzle generated and validated!');
        setEndpoints(newPuzzle);
        setPaths([]);
        setCurrentDrawingPath(null);
        setGameStarted(false);
        setMoves(0);
        setGameWon(false);
        completionCalledRef.current = false;
      } else {
        // Fallback to level 0
        setLevel(0);
        setGameWon(false);
        completionCalledRef.current = false;
      }
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
          {/* Grid cells - just borders */}
          {Array.from({ length: GRID_SIZE }).map((_, row) => (
            <View key={row} style={styles.row}>
              {Array.from({ length: GRID_SIZE }).map((_, col) => (
                <View
                  key={col}
                  style={[
                    styles.cell,
                    { width: CELL_SIZE, height: CELL_SIZE },
                  ]}
                />
              ))}
            </View>
          ))}
          
          {/* SVG overlay for pipes and endpoints */}
          <Svg 
            width={CELL_SIZE * GRID_SIZE} 
            height={CELL_SIZE * GRID_SIZE}
            style={styles.svgOverlay}
          >
            {/* Draw completed paths as pipes */}
            {paths.map(path => generatePipePath(path.segments, path.color))}
            
            {/* Draw current drawing path */}
            {currentDrawingPath && generatePipePath(currentDrawingPath.segments, currentDrawingPath.color)}
            
            {/* Draw endpoints on top */}
            {endpoints.map((endpoint, idx) => (
              <Circle
                key={idx}
                cx={endpoint.col * CELL_SIZE + CELL_SIZE / 2}
                cy={endpoint.row * CELL_SIZE + CELL_SIZE / 2}
                r={CELL_SIZE * 0.35}
                fill={endpoint.color}
                stroke="#FFFFFF"
                strokeWidth={3}
              />
            ))}
          </Svg>
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
    position: 'relative',
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
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
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

