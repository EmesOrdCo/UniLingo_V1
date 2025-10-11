import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface PacManGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
  onRestart?: () => Promise<boolean>;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GRID_SIZE = 19;
const CELL_SIZE = Math.floor(Math.min(width - 40, height - 350) / GRID_SIZE); // Increased from 380
const MOVE_SPEED = 200; // Slower for better control
const GHOST_SPEED_NORMAL = 250; // Slower ghosts
const GHOST_SPEED_SCARED = 350; // Much slower when scared
const POWER_PELLET_DURATION = 8000;

type Position = { row: number; col: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null;
type CellType = 'wall' | 'pellet' | 'power' | 'empty';
type GhostState = 'chase' | 'scared' | 'eaten';

type Ghost = {
  id: number;
  name: string;
  color: string;
  position: Position;
  direction: Direction;
  state: GhostState;
  targetCorner: Position;
};

// Simplified maze (1=wall, 0=pellet, 2=power pellet, 3=empty)
const createMaze = (): number[][] => {
  const maze: number[][] = [];
  
  // Create a simple symmetric maze
  for (let row = 0; row < GRID_SIZE; row++) {
    maze[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      // Borders
      if (row === 0 || row === GRID_SIZE - 1 || col === 0 || col === GRID_SIZE - 1) {
        maze[row][col] = 1;
      }
      // Ghost house in center
      else if (
        (row >= 8 && row <= 11 && col >= 8 && col <= 10) ||
        (row === 8 && col === 9)
      ) {
        maze[row][col] = 3;
      }
      // Power pellets in corners
      else if (
        (row === 2 && col === 2) ||
        (row === 2 && col === GRID_SIZE - 3) ||
        (row === GRID_SIZE - 3 && col === 2) ||
        (row === GRID_SIZE - 3 && col === GRID_SIZE - 3)
      ) {
        maze[row][col] = 2;
      }
      // Walls pattern (create simple corridors)
      else if (
        (row === 3 && col >= 5 && col <= 13) ||
        (row === 15 && col >= 5 && col <= 13) ||
        (col === 5 && row >= 3 && row <= 6) ||
        (col === 13 && row >= 3 && row <= 6) ||
        (col === 5 && row >= 12 && row <= 15) ||
        (col === 13 && row >= 12 && row <= 15) ||
        (row === 9 && (col <= 6 || col >= 12))
      ) {
        maze[row][col] = 1;
      }
      // Regular pellets
      else {
        maze[row][col] = 0;
      }
    }
  }
  
  return maze;
};

const PacManGame: React.FC<PacManGameProps> = ({ onClose, onGameComplete, onRestart }) => {
  // Game state
  const [maze, setMaze] = useState<number[][]>(createMaze());
  const [pacman, setPacman] = useState<Position>({ row: 14, col: 9 });
  const [pacmanDirection, setPacmanDirection] = useState<Direction>(null);
  const [nextDirection, setNextDirection] = useState<Direction>(null);
  const [ghosts, setGhosts] = useState<Ghost[]>([
    { id: 0, name: 'Blinky', color: '#FF0000', position: { row: 9, col: 8 }, direction: 'UP', state: 'chase', targetCorner: { row: 2, col: GRID_SIZE - 3 } },
    { id: 1, name: 'Pinky', color: '#FFB8FF', position: { row: 9, col: 9 }, direction: 'DOWN', state: 'chase', targetCorner: { row: 2, col: 2 } },
    { id: 2, name: 'Inky', color: '#00FFFF', position: { row: 9, col: 10 }, direction: 'UP', state: 'chase', targetCorner: { row: GRID_SIZE - 3, col: GRID_SIZE - 3 } },
    { id: 3, name: 'Clyde', color: '#FFB852', position: { row: 10, col: 9 }, direction: 'LEFT', state: 'chase', targetCorner: { row: GRID_SIZE - 3, col: 2 } },
  ]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [powerMode, setPowerMode] = useState(false);

  // Refs
  const pacmanMoveInterval = useRef<NodeJS.Timeout | null>(null);
  const ghostMoveInterval = useRef<NodeJS.Timeout | null>(null);
  const powerModeTimeout = useRef<NodeJS.Timeout | null>(null);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const lastPacmanMove = useRef(Date.now());
  const lastGhostMove = useRef(Date.now());
  const pacmanRef = useRef(pacman);
  const ghostsRef = useRef(ghosts);
  const mazeRef = useRef(maze);
  const powerModeRef = useRef(powerMode);

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;

  // Keep refs in sync
  useEffect(() => {
    pacmanRef.current = pacman;
  }, [pacman]);

  useEffect(() => {
    ghostsRef.current = ghosts;
  }, [ghosts]);

  useEffect(() => {
    mazeRef.current = maze;
  }, [maze]);

  useEffect(() => {
    powerModeRef.current = powerMode;
  }, [powerMode]);

  // Check if move is valid
  const isValidMove = useCallback((pos: Position): boolean => {
    if (pos.row < 0 || pos.row >= GRID_SIZE || pos.col < 0 || pos.col >= GRID_SIZE) {
      return false;
    }
    return maze[pos.row][pos.col] !== 1; // Not a wall
  }, [maze]);

  // Get next position based on direction
  const getNextPosition = (pos: Position, dir: Direction): Position => {
    if (!dir) return pos;
    switch (dir) {
      case 'UP':
        return { row: pos.row - 1, col: pos.col };
      case 'DOWN':
        return { row: pos.row + 1, col: pos.col };
      case 'LEFT':
        return { row: pos.row, col: pos.col - 1 };
      case 'RIGHT':
        return { row: pos.row, col: pos.col + 1 };
      default:
        return pos;
    }
  };

  // Handle swipe gesture
  const handleSwipe = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { velocityX, velocityY } = event.nativeEvent;
      
      // Determine swipe direction based on velocity
      if (Math.abs(velocityX) > Math.abs(velocityY)) {
        // Horizontal swipe
        setNextDirection(velocityX > 0 ? 'RIGHT' : 'LEFT');
      } else {
        // Vertical swipe
        setNextDirection(velocityY > 0 ? 'DOWN' : 'UP');
      }
      
      // Start game on first swipe
      if (!gameStarted) {
        setGameStarted(true);
      }
    }
  };

  // Move Pac-Man
  const movePacMan = useCallback(() => {
    if (!gameStarted || gameOver || won || isPaused) return;

    setPacman(prevPos => {
      // Try to change direction if nextDirection is set
      let currentDir = pacmanDirection;
      if (nextDirection && nextDirection !== pacmanDirection) {
        const nextPos = getNextPosition(prevPos, nextDirection);
        if (isValidMove(nextPos)) {
          currentDir = nextDirection;
          setPacmanDirection(nextDirection);
          setNextDirection(null);
        }
      }

      if (!currentDir) return prevPos;

      const newPos = getNextPosition(prevPos, currentDir);
      if (isValidMove(newPos)) {
        // Collect pellet or power pellet
        if (maze[newPos.row][newPos.col] === 0) {
          // Haptic feedback for eating pellet
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setScore(prev => prev + 10);
          const newMaze = maze.map(r => [...r]);
          newMaze[newPos.row][newPos.col] = 3;
          setMaze(newMaze);
        } else if (maze[newPos.row][newPos.col] === 2) {
          // Haptic feedback for eating power pellet
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScore(prev => prev + 50);
          const newMaze = maze.map(r => [...r]);
          newMaze[newPos.row][newPos.col] = 3;
          setMaze(newMaze);
          setPowerMode(true);
          setGhosts(prev => prev.map(g => ({ ...g, state: 'scared' })));
          
          // Clear existing timeout
          if (powerModeTimeout.current) clearTimeout(powerModeTimeout.current);
          
          // Set new timeout
          powerModeTimeout.current = setTimeout(() => {
            setPowerMode(false);
            setGhosts(prev => prev.map(g => g.state === 'scared' ? { ...g, state: 'chase' } : g));
          }, POWER_PELLET_DURATION);
        }

        // Check win condition
        const hasMorePellets = maze.some(row => row.some(cell => cell === 0 || cell === 2));
        if (!hasMorePellets) {
          setWon(true);
        }

        return newPos;
      }

      return prevPos;
    });
  }, [pacmanDirection, nextDirection, maze, isValidMove, gameOver, won, isPaused]);

  // Improved ghost AI - different behavior per ghost like classic Pac-Man
  const moveGhosts = useCallback(() => {
    if (!gameStarted || gameOver || won || isPaused) return;

    setGhosts(prevGhosts =>
      prevGhosts.map(ghost => {
        if (ghost.state === 'eaten') return ghost;

        // Determine target based on ghost personality and state
        let target: Position;
        if (ghost.state === 'scared') {
          target = ghost.targetCorner; // Run to corner
        } else {
          switch (ghost.name) {
            case 'Blinky': // Red - aggressive chaser
              target = pacman;
              break;
            case 'Pinky': // Pink - tries to ambush (targets ahead of Pac-Man)
              target = pacman; // Simplified - just chase
              break;
            case 'Inky': // Cyan - random/erratic
              // 50% chance to chase, 50% to wander
              target = Math.random() > 0.5 ? pacman : { row: Math.floor(Math.random() * GRID_SIZE), col: Math.floor(Math.random() * GRID_SIZE) };
              break;
            case 'Clyde': // Orange - coward (chases when far, retreats when close)
              const distance = Math.abs(ghost.position.row - pacman.row) + Math.abs(ghost.position.col - pacman.col);
              target = distance > 8 ? pacman : ghost.targetCorner;
              break;
            default:
              target = pacman;
          }
        }

        const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        
        // Calculate distance for each direction
        const moves = directions
          .map(dir => {
            const nextPos = getNextPosition(ghost.position, dir);
            if (!isValidMove(nextPos)) return null;
            
            // Don't reverse direction unless stuck
            const isReverse =
              (dir === 'UP' && ghost.direction === 'DOWN') ||
              (dir === 'DOWN' && ghost.direction === 'UP') ||
              (dir === 'LEFT' && ghost.direction === 'RIGHT') ||
              (dir === 'RIGHT' && ghost.direction === 'LEFT');
            
            const distance = Math.abs(nextPos.row - target.row) + Math.abs(nextPos.col - target.col);
            
            return { dir, pos: nextPos, distance, isReverse };
          })
          .filter(Boolean);

        if (moves.length === 0) return ghost;

        // Sort by distance and preference for non-reverse
        moves.sort((a, b) => {
          if (ghost.state === 'scared') {
            return b!.distance - a!.distance; // Go away from Pac-Man
          }
          // Strongly prefer non-reverse moves
          if (a!.isReverse !== b!.isReverse) {
            return a!.isReverse ? 1 : -1;
          }
          return a!.distance - b!.distance; // Go toward target
        });

        const bestMove = moves[0]!;
        
        return {
          ...ghost,
          position: bestMove.pos,
          direction: bestMove.dir,
        };
      })
    );
  }, [gameStarted, pacman, maze, isValidMove, gameOver, won, isPaused]);

  // Check ghost collisions
  const checkGhostCollisions = useCallback(() => {
    if (gameOver || won) return;

    ghosts.forEach(ghost => {
      if (ghost.position.row === pacman.row && ghost.position.col === pacman.col) {
        if (ghost.state === 'scared') {
          // Eat ghost - haptic success
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScore(prev => prev + 200);
          setGhosts(prev =>
            prev.map(g =>
              g.id === ghost.id
                ? { ...g, state: 'eaten', position: { row: 9, col: 9 } }
                : g
            )
          );
          // Respawn ghost after delay
          setTimeout(() => {
            setGhosts(prev =>
              prev.map(g => (g.id === ghost.id ? { ...g, state: 'chase' } : g))
            );
          }, 3000);
        } else if (ghost.state === 'chase') {
          // Pac-Man dies - haptic error
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
            } else {
              // Reset positions
              setPacman({ row: 14, col: 9 });
              setPacmanDirection(null);
              setNextDirection(null);
              setGhosts(prevGhosts =>
                prevGhosts.map((g, i) => ({
                  ...g,
                  position: { row: 9, col: 8 + i },
                  direction: i % 2 === 0 ? 'UP' : 'DOWN',
                  state: 'chase',
                }))
              );
            }
            return newLives;
          });
        }
      }
    });
  }, [ghosts, pacman, gameOver, won]);

  // Unified smooth game loop
  const gameLoopRef = useRef<() => void>();
  
  gameLoopRef.current = () => {
    if (!gameStarted || gameOver || won || isPaused) return;
    
    const now = Date.now();
    
    // Move Pac-Man at his speed
    if (now - lastPacmanMove.current >= MOVE_SPEED) {
      lastPacmanMove.current = now;
      movePacMan();
    }
    
    // Move ghosts at their speed
    const ghostSpeed = powerModeRef.current ? GHOST_SPEED_SCARED : GHOST_SPEED_NORMAL;
    if (now - lastGhostMove.current >= ghostSpeed) {
      lastGhostMove.current = now;
      moveGhosts();
      checkGhostCollisions();
    }
  };

  // Game loop - runs every 50ms for smooth but not too fast updates
  useEffect(() => {
    if (gameStarted && !gameOver && !won && !isPaused) {
      const interval = setInterval(() => {
        gameLoopRef.current?.();
      }, 50); // Run at 20fps - smooth but controlled
      
      return () => clearInterval(interval);
    }
  }, [gameStarted, gameOver, won, isPaused]);

  // Handle game over
  useEffect(() => {
    if ((gameOver || won) && !completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      console.log('👻 Pac-Man calling onGameComplete with score:', score);
      setTimeout(() => {
        onGameComplete(score);
      }, 100);
    }
  }, [gameOver, won, score, onGameComplete]);

  // Cleanup power mode timeout
  useEffect(() => {
    return () => {
      if (powerModeTimeout.current) clearTimeout(powerModeTimeout.current);
    };
  }, []);

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

  const handleDirectionChange = (dir: Direction) => {
    setNextDirection(dir);
    if (!pacmanDirection) {
      setPacmanDirection(dir);
    }
    // Start game on first direction input
    if (!gameStarted) {
      setGameStarted(true);
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

    setMaze(createMaze());
    setPacman({ row: 14, col: 9 });
    setPacmanDirection(null);
    setNextDirection(null);
    setGhosts([
      { id: 0, name: 'Blinky', color: '#FF0000', position: { row: 9, col: 8 }, direction: 'UP', state: 'chase', targetCorner: { row: 2, col: GRID_SIZE - 3 } },
      { id: 1, name: 'Pinky', color: '#FFB8FF', position: { row: 9, col: 9 }, direction: 'DOWN', state: 'chase', targetCorner: { row: 2, col: 2 } },
      { id: 2, name: 'Inky', color: '#00FFFF', position: { row: 9, col: 10 }, direction: 'UP', state: 'chase', targetCorner: { row: GRID_SIZE - 3, col: GRID_SIZE - 3 } },
      { id: 3, name: 'Clyde', color: '#FFB852', position: { row: 10, col: 9 }, direction: 'LEFT', state: 'chase', targetCorner: { row: GRID_SIZE - 3, col: 2 } },
    ]);
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setWon(false);
    setGameStarted(false);
    setPowerMode(false);
    completionCalledRef.current = false;
    finalScoreRef.current = 0;
  };

  const handleNextLevel = () => {
    setLevel(prev => prev + 1);
    setMaze(createMaze());
    setPacman({ row: 14, col: 9 });
    setPacmanDirection(null);
    setNextDirection(null);
    setGhosts(prevGhosts =>
      prevGhosts.map((g, i) => ({
        ...g,
        position: { row: 9, col: 8 + i },
        direction: i % 2 === 0 ? 'UP' : 'DOWN',
        state: 'chase',
      }))
    );
    setWon(false);
    setPowerMode(false);
  };

  const handleClose = () => {
    if (!completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      onGameComplete(score);
    }
    onClose();
  };

  const floatInterpolate1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });
  const floatInterpolate2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        <Text style={styles.title}>PAC-MAN</Text>
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
          <Text style={styles.scoreLabel}>LIVES</Text>
          <View style={styles.livesContainer}>
            {[...Array(lives)].map((_, i) => (
              <View key={i} style={styles.pacmanLife} />
            ))}
          </View>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>LEVEL</Text>
          <Text style={styles.scoreValue}>{level}</Text>
        </View>
      </View>

      {/* Power Mode Indicator */}
      {powerMode && (
        <View style={styles.powerBadge}>
          <Text style={styles.powerText}>POWER MODE!</Text>
        </View>
      )}

      {/* Game Grid */}
      <PanGestureHandler onHandlerStateChange={handleSwipe} minDist={20}>
      <View style={[styles.gameArea, { width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }]}>
        {/* Maze */}
        {maze.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <View
              key={`${rowIndex}-${colIndex}`}
              style={[
                styles.cell,
                {
                  top: rowIndex * CELL_SIZE,
                  left: colIndex * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: cell === 1 ? '#0000FF' : '#000000',
                },
              ]}
            >
              {cell === 0 && <View style={styles.pellet} />}
              {cell === 2 && <View style={styles.powerPellet} />}
            </View>
          ))
        )}

        {/* Pac-Man */}
        <View
          style={[
            styles.pacman,
            {
              top: pacman.row * CELL_SIZE,
              left: pacman.col * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              transform: [
                { 
                  rotate: pacmanDirection === 'RIGHT' ? '0deg' : 
                          pacmanDirection === 'DOWN' ? '90deg' : 
                          pacmanDirection === 'LEFT' ? '180deg' : 
                          '270deg' 
                }
              ]
            },
          ]}
        >
          {/* Pac-Man body - circular with mouth wedge */}
          <View style={styles.pacmanBody}>
            {/* Top lip of mouth */}
            <View style={styles.pacmanMouthTop} />
            {/* Bottom lip of mouth */}
            <View style={styles.pacmanMouthBottom} />
          </View>
          {/* Pac-Man eye */}
          <View style={styles.pacmanEye} />
        </View>

        {/* Ghosts */}
        {ghosts.map(ghost => (
          <View
            key={ghost.id}
            style={[
              styles.ghost,
              {
                top: ghost.position.row * CELL_SIZE,
                left: ghost.position.col * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              },
            ]}
          >
            <View style={[
              styles.ghostBody,
              { backgroundColor: ghost.state === 'scared' ? '#2563EB' : ghost.state === 'eaten' ? '#1F2937' : ghost.color }
            ]}>
              {ghost.state === 'scared' ? (
                <View style={styles.scaredGhostFace}>
                  <View style={styles.scaredMouth} />
                </View>
              ) : ghost.state !== 'eaten' && (
                <View style={styles.ghostFace}>
                  {/* Left eye */}
                  <View style={styles.ghostEyeContainer}>
                    <View style={styles.ghostEyeWhite}>
                      <View style={styles.ghostEyePupil} />
                    </View>
                  </View>
                  {/* Right eye */}
                  <View style={styles.ghostEyeContainer}>
                    <View style={styles.ghostEyeWhite}>
                      <View style={styles.ghostEyePupil} />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
        
        {/* Tap/Swipe to Start Overlay */}
        {!gameStarted && !gameOver && !won && (
          <View style={styles.tapToStartOverlay}>
            <View style={styles.startMessage}>
              <Text style={styles.startText}>SWIPE TO START</Text>
              <Ionicons name="hand-left" size={48} color="#FFFF00" />
              <Text style={styles.startSubtext}>Swipe to move Pac-Man</Text>
            </View>
          </View>
        )}
      </View>
      </PanGestureHandler>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => handleDirectionChange('UP')}>
            <Ionicons name="arrow-up" size={24} color="#FFFF00" />
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => handleDirectionChange('LEFT')}>
            <Ionicons name="arrow-back" size={24} color="#FFFF00" />
          </TouchableOpacity>
          <View style={styles.controlSpacer} />
          <TouchableOpacity style={styles.controlButton} onPress={() => handleDirectionChange('RIGHT')}>
            <Ionicons name="arrow-forward" size={24} color="#FFFF00" />
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => handleDirectionChange('DOWN')}>
            <Ionicons name="arrow-down" size={24} color="#FFFF00" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Win Overlay */}
      {won && (
        <View style={styles.overlay}>
          <View style={styles.winCard}>
            <Ionicons name="trophy" size={64} color="#FFFF00" />
            <Text style={styles.winTitle}>Level Complete!</Text>
            <Text style={styles.winScore}>Score: {score}</Text>
            <Text style={styles.winLevel}>Level {level}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.nextLevelButton} onPress={handleNextLevel}>
                <Ionicons name="play-forward" size={20} color="#000000" />
                <Text style={styles.nextLevelText}>Next Level</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitButton} onPress={handleClose}>
                <Ionicons name="exit" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.gameOverCard}>
            <Ionicons name="skull" size={64} color="#EF4444" />
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Final Score: {score}</Text>
            <Text style={styles.statsText}>Level: {level}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                <Ionicons name="refresh" size={20} color="#000000" />
                <Text style={styles.restartText}>Play Again</Text>
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
      {isPaused && !gameOver && !won && (
        <View style={styles.overlay}>
          <View style={styles.pausedCard}>
            <Ionicons name="pause-circle" size={64} color="#FFFF00" />
            <Text style={styles.pausedTitle}>Paused</Text>
            <TouchableOpacity style={styles.resumeButton} onPress={() => setIsPaused(false)}>
              <Ionicons name="play" size={20} color="#000000" />
              <Text style={styles.resumeText}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
    </GestureHandlerRootView>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 0, 0.03)',
    top: 80,
    left: 40,
  },
  bgElement2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 0, 0, 0.02)',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFF00',
    letterSpacing: 2,
  },
  pauseButton: {
    padding: 5,
  },
  scoreBoard: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  scoreBox: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#FFFF00',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFF00',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  pacmanLife: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFF00',
  },
  powerBadge: {
    backgroundColor: '#FFFF00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 5,
  },
  powerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  gameArea: {
    backgroundColor: '#000000',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#0000FF',
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 10,
  },
  cell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pellet: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFB8FF',
  },
  powerPellet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFF00',
  },
  pacman: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pacmanBody: {
    width: '90%',
    height: '90%',
    borderRadius: 1000,
    backgroundColor: '#FFFF00',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#FFFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  pacmanMouthTop: {
    position: 'absolute',
    right: -5,
    top: '30%',
    width: '50%',
    height: '20%',
    backgroundColor: '#000000',
    transform: [{ rotate: '-25deg' }],
  },
  pacmanMouthBottom: {
    position: 'absolute',
    right: -5,
    bottom: '30%',
    width: '50%',
    height: '20%',
    backgroundColor: '#000000',
    transform: [{ rotate: '25deg' }],
  },
  pacmanEye: {
    position: 'absolute',
    width: CELL_SIZE * 0.12,
    height: CELL_SIZE * 0.12,
    borderRadius: 100,
    backgroundColor: '#000000',
    top: '28%',
    right: '38%',
  },
  ghost: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 5,
  },
  ghostBody: {
    width: '88%',
    height: '88%',
    borderTopLeftRadius: 1000,
    borderTopRightRadius: 1000,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '18%',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ghostFace: {
    flexDirection: 'row',
    gap: CELL_SIZE * 0.15,
    alignItems: 'center',
  },
  ghostEyeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostEyeWhite: {
    width: CELL_SIZE * 0.22,
    height: CELL_SIZE * 0.28,
    borderRadius: CELL_SIZE * 0.11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostEyePupil: {
    width: CELL_SIZE * 0.11,
    height: CELL_SIZE * 0.11,
    borderRadius: 100,
    backgroundColor: '#000000',
  },
  scaredGhostFace: {
    alignItems: 'center',
    gap: 2,
  },
  scaredMouth: {
    width: CELL_SIZE * 0.4,
    height: CELL_SIZE * 0.15,
    borderRadius: CELL_SIZE * 0.075,
    backgroundColor: '#FFFFFF',
  },
  scaredFace: {
    fontSize: 14,
    marginTop: -2,
  },
  controls: {
    paddingVertical: 10,
    alignItems: 'center',
    gap: 5,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFF00',
  },
  controlSpacer: {
    width: 55,
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
    zIndex: 100,
  },
  winCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFF00',
  },
  winTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFF00',
    marginTop: 15,
    marginBottom: 10,
  },
  winScore: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  winLevel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 20,
  },
  gameOverCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
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
    color: '#FFFF00',
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
    marginTop: 10,
  },
  nextLevelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFF00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  nextLevelText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFF00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  restartText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
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
    borderWidth: 3,
    borderColor: '#FFFF00',
  },
  pausedTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFF00',
    marginTop: 15,
    marginBottom: 20,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFF00',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  resumeText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  tapToStartOverlay: {
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
  startMessage: {
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(0, 0, 255, 0.8)',
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFF00',
  },
  startText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFF00',
    letterSpacing: 1,
  },
  startSubtext: {
    fontSize: 14,
    color: '#FFFF00',
    opacity: 0.9,
  },
});

export default PacManGame;

