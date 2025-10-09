import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

interface BubbleShooterGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = Math.min(width - 40, 380);
const GAME_HEIGHT = height - 280;
const BUBBLE_RADIUS = 18;
const GRID_COLS = 10;
const BUBBLE_DIAMETER = (GAME_WIDTH / GRID_COLS);
const SHOOTER_Y = GAME_HEIGHT - 60;
const BUBBLE_SPEED = 8;
const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

type Bubble = {
  row: number;
  col: number;
  color: string;
  id: number;
};

type FlyingBubble = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
};

const BubbleShooterGame: React.FC<BubbleShooterGameProps> = ({ onClose, onGameComplete }) => {
  // Game state
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [currentBubble, setCurrentBubble] = useState<string>(COLORS[0]);
  const [nextBubble, setNextBubble] = useState<string>(COLORS[1]);
  const [flyingBubble, setFlyingBubble] = useState<FlyingBubble | null>(null);
  const [shooterAngle, setShooterAngle] = useState(90);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Refs
  const gameLoop = useRef<number | null>(null);
  const nextBubbleId = useRef(0);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;

  // Initialize game
  const initializeGame = useCallback(() => {
    const initialBubbles: Bubble[] = [];
    const rows = 5;
    
    for (let row = 0; row < rows; row++) {
      const cols = row % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
      for (let col = 0; col < cols; col++) {
        initialBubbles.push({
          row,
          col,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          id: nextBubbleId.current++,
        });
      }
    }
    
    setBubbles(initialBubbles);
    setCurrentBubble(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setNextBubble(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setFlyingBubble(null);
    setShooterAngle(90);
    setGameStarted(false);
  }, []);

  // Start game
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Get bubble position in pixels
  const getBubblePosition = (row: number, col: number) => {
    const offsetX = row % 2 === 0 ? 0 : BUBBLE_DIAMETER / 2;
    return {
      x: col * BUBBLE_DIAMETER + BUBBLE_DIAMETER / 2 + offsetX,
      y: row * BUBBLE_DIAMETER + BUBBLE_DIAMETER / 2 + 20,
    };
  };

  // Get grid position from pixel coordinates
  const getGridPosition = (x: number, y: number) => {
    const row = Math.floor((y - 20) / BUBBLE_DIAMETER);
    const offsetX = row % 2 === 0 ? 0 : BUBBLE_DIAMETER / 2;
    const col = Math.round((x - BUBBLE_DIAMETER / 2 - offsetX) / BUBBLE_DIAMETER);
    return { row, col };
  };

  // Check if position is valid
  const isValidPosition = (row: number, col: number) => {
    if (row < 0) return false;
    const maxCols = row % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
    return col >= 0 && col < maxCols;
  };

  // Get neighbors
  const getNeighbors = (row: number, col: number) => {
    const neighbors: { row: number; col: number }[] = [];
    const isEvenRow = row % 2 === 0;
    
    const offsets = isEvenRow
      ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
      : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
    
    offsets.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      if (isValidPosition(newRow, newCol)) {
        neighbors.push({ row: newRow, col: newCol });
      }
    });
    
    return neighbors;
  };

  // Find connected bubbles of same color
  const findConnectedBubbles = (row: number, col: number, color: string, bubbleGrid: Bubble[]) => {
    const connected: Set<string> = new Set();
    const toCheck = [{ row, col }];
    
    while (toCheck.length > 0) {
      const current = toCheck.pop()!;
      const key = `${current.row},${current.col}`;
      
      if (connected.has(key)) continue;
      
      const bubble = bubbleGrid.find(b => b.row === current.row && b.col === current.col);
      if (!bubble || bubble.color !== color) continue;
      
      connected.add(key);
      
      getNeighbors(current.row, current.col).forEach(neighbor => {
        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (!connected.has(neighborKey)) {
          toCheck.push(neighbor);
        }
      });
    }
    
    return Array.from(connected).map(key => {
      const [row, col] = key.split(',').map(Number);
      return bubbleGrid.find(b => b.row === row && b.col === col)!;
    });
  };

  // Find floating bubbles (not connected to top)
  const findFloatingBubbles = (bubbleGrid: Bubble[]) => {
    const connected: Set<string> = new Set();
    const toCheck: { row: number; col: number }[] = [];
    
    // Start from top row
    bubbleGrid.filter(b => b.row === 0).forEach(b => {
      toCheck.push({ row: b.row, col: b.col });
    });
    
    while (toCheck.length > 0) {
      const current = toCheck.pop()!;
      const key = `${current.row},${current.col}`;
      
      if (connected.has(key)) continue;
      connected.add(key);
      
      getNeighbors(current.row, current.col).forEach(neighbor => {
        const neighborKey = `${neighbor.row},${neighbor.col}`;
        if (!connected.has(neighborKey) && bubbleGrid.some(b => b.row === neighbor.row && b.col === neighbor.col)) {
          toCheck.push(neighbor);
        }
      });
    }
    
    return bubbleGrid.filter(b => !connected.has(`${b.row},${b.col}`));
  };

  // Shoot bubble
  const shootBubble = useCallback(() => {
    if (flyingBubble || !gameStarted) return;
    
    const angleRad = (shooterAngle * Math.PI) / 180;
    const shooterX = GAME_WIDTH / 2;
    
    setFlyingBubble({
      x: shooterX,
      y: SHOOTER_Y,
      vx: Math.cos(angleRad) * BUBBLE_SPEED,
      vy: -Math.sin(angleRad) * BUBBLE_SPEED,
      color: currentBubble,
    });
    
    setCurrentBubble(nextBubble);
    setNextBubble(COLORS[Math.floor(Math.random() * COLORS.length)]);
  }, [flyingBubble, gameStarted, shooterAngle, currentBubble, nextBubble]);

  // Pan responder for aiming
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !flyingBubble,
      onMoveShouldSetPanResponder: () => !flyingBubble,
      onPanResponderMove: (_, gestureState) => {
        const shooterX = GAME_WIDTH / 2;
        const dx = gestureState.moveX - shooterX;
        const dy = SHOOTER_Y - gestureState.moveY;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Clamp angle between 30 and 150 degrees
        angle = Math.max(30, Math.min(150, angle));
        setShooterAngle(angle);
      },
      onPanResponderRelease: () => {
        if (!gameStarted) setGameStarted(true);
        shootBubble();
      },
    })
  ).current;

  // Game loop
  const updateGame = useCallback(() => {
    if (!gameStarted || isPaused || gameOver) return;

    if (flyingBubble) {
      let newBubble = { ...flyingBubble };
      newBubble.x += newBubble.vx;
      newBubble.y += newBubble.vy;

      // Wall collision
      if (newBubble.x - BUBBLE_RADIUS <= 0 || newBubble.x + BUBBLE_RADIUS >= GAME_WIDTH) {
        newBubble.vx *= -1;
        newBubble.x = newBubble.x < BUBBLE_RADIUS ? BUBBLE_RADIUS : GAME_WIDTH - BUBBLE_RADIUS;
      }

      // Check collision with existing bubbles or top
      let collided = false;
      
      if (newBubble.y - BUBBLE_RADIUS <= 20) {
        collided = true;
      } else {
        for (const bubble of bubbles) {
          const pos = getBubblePosition(bubble.row, bubble.col);
          const dx = newBubble.x - pos.x;
          const dy = newBubble.y - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < BUBBLE_DIAMETER - 5) {
            collided = true;
            break;
          }
        }
      }

      if (collided) {
        // Find grid position to attach
        const gridPos = getGridPosition(newBubble.x, newBubble.y);
        
        // Find nearest valid position
        let bestRow = Math.max(0, gridPos.row);
        let bestCol = gridPos.col;
        let minDistance = Infinity;
        
        for (let r = Math.max(0, bestRow - 1); r <= bestRow + 1; r++) {
          const maxCols = r % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
          for (let c = 0; c < maxCols; c++) {
            if (!bubbles.some(b => b.row === r && b.col === c)) {
              const pos = getBubblePosition(r, c);
              const dist = Math.sqrt((pos.x - newBubble.x) ** 2 + (pos.y - newBubble.y) ** 2);
              if (dist < minDistance) {
                minDistance = dist;
                bestRow = r;
                bestCol = c;
              }
            }
          }
        }

        // Add new bubble to grid
        const newBubbleInGrid: Bubble = {
          row: bestRow,
          col: bestCol,
          color: newBubble.color,
          id: nextBubbleId.current++,
        };

        let updatedBubbles = [...bubbles, newBubbleInGrid];

        // Find matches
        const connected = findConnectedBubbles(bestRow, bestCol, newBubble.color, updatedBubbles);
        
        if (connected.length >= 3) {
          // Remove matched bubbles
          const connectedIds = new Set(connected.map(b => b.id));
          updatedBubbles = updatedBubbles.filter(b => !connectedIds.has(b.id));
          setScore(prev => prev + connected.length * 10);
          
          // Remove floating bubbles
          const floating = findFloatingBubbles(updatedBubbles);
          if (floating.length > 0) {
            const floatingIds = new Set(floating.map(b => b.id));
            updatedBubbles = updatedBubbles.filter(b => !floatingIds.has(b.id));
            setScore(prev => prev + floating.length * 20);
          }
        }

        setBubbles(updatedBubbles);
        setFlyingBubble(null);

        // Check win condition
        if (updatedBubbles.length === 0) {
          setScore(prev => prev + 1000);
          setTimeout(() => initializeGame(), 1000);
        }

        // Check game over (bubbles too low)
        const maxRow = Math.max(...updatedBubbles.map(b => b.row), -1);
        if (maxRow >= 12) {
          setGameOver(true);
        }
      } else {
        setFlyingBubble(newBubble);
      }
    }
  }, [gameStarted, isPaused, gameOver, flyingBubble, bubbles, shootBubble, initializeGame]);

  // Start game loop
  useEffect(() => {
    if (gameStarted && !isPaused && !gameOver) {
      gameLoop.current = requestAnimationFrame(function animate() {
        updateGame();
        gameLoop.current = requestAnimationFrame(animate);
      });
    }
    return () => {
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current);
    };
  }, [gameStarted, isPaused, gameOver, updateGame]);

  // Handle game over
  useEffect(() => {
    if (gameOver && !completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      console.log('🫧 Bubble Shooter calling onGameComplete with score:', score);
      setTimeout(() => {
        onGameComplete(score);
      }, 100);
    }
  }, [gameOver, score, onGameComplete]);

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
    initializeGame();
    setScore(0);
    setGameOver(false);
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

  const handleStart = () => {
    setGameStarted(true);
  };

  const floatInterpolate1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const floatInterpolate2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

  const shooterX = GAME_WIDTH / 2;
  const aimLength = 100;
  const aimAngleRad = (shooterAngle * Math.PI) / 180;
  const aimEndX = shooterX + Math.cos(aimAngleRad) * aimLength;
  const aimEndY = SHOOTER_Y - Math.sin(aimAngleRad) * aimLength;

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
        <Text style={styles.title}>BUBBLE SHOOTER</Text>
        <TouchableOpacity onPress={() => setIsPaused(!isPaused)} style={styles.pauseButton}>
          <Ionicons name={isPaused ? 'play-circle' : 'pause-circle'} size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Score */}
      <View style={styles.scoreBoard}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.nextBubbleBox}>
          <Text style={styles.scoreLabel}>NEXT</Text>
          <Svg width={40} height={40}>
            <Defs>
              <RadialGradient id={`gradient-next`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={nextBubble} stopOpacity="1" />
                <Stop offset="100%" stopColor={nextBubble} stopOpacity="0.6" />
              </RadialGradient>
            </Defs>
            <Circle cx={20} cy={20} r={16} fill={`url(#gradient-next)`} stroke="#FFFFFF" strokeWidth="2" />
          </Svg>
        </View>
      </View>

      {/* Game Area */}
      <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]} {...panResponder.panHandlers}>
        <Svg width={GAME_WIDTH} height={GAME_HEIGHT}>
          <Defs>
            {COLORS.map((color, i) => (
              <RadialGradient key={i} id={`gradient-${color}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={color} stopOpacity="1" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
              </RadialGradient>
            ))}
          </Defs>

          {/* Grid bubbles */}
          {bubbles.map(bubble => {
            const pos = getBubblePosition(bubble.row, bubble.col);
            return (
              <Circle
                key={bubble.id}
                cx={pos.x}
                cy={pos.y}
                r={BUBBLE_RADIUS}
                fill={`url(#gradient-${bubble.color})`}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            );
          })}

          {/* Flying bubble */}
          {flyingBubble && (
            <Circle
              cx={flyingBubble.x}
              cy={flyingBubble.y}
              r={BUBBLE_RADIUS}
              fill={`url(#gradient-${flyingBubble.color})`}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          )}

          {/* Aim line */}
          {!flyingBubble && gameStarted && (
            <Line
              x1={shooterX}
              y1={SHOOTER_Y}
              x2={aimEndX}
              y2={aimEndY}
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity={0.5}
            />
          )}

          {/* Shooter bubble */}
          {!flyingBubble && (
            <Circle
              cx={shooterX}
              cy={SHOOTER_Y}
              r={BUBBLE_RADIUS}
              fill={`url(#gradient-${currentBubble})`}
              stroke="#FFFFFF"
              strokeWidth="3"
            />
          )}
        </Svg>

        {/* Start Message */}
        {!gameStarted && !gameOver && (
          <View style={styles.startMessage}>
            <Text style={styles.startText}>Match 3+ bubbles!</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>START</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Drag to aim, release to shoot! Match 3+ bubbles to pop them.
        </Text>
      </View>

      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.gameOverCard}>
            <Ionicons name="sad" size={64} color="#EF4444" />
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Final Score: {score}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  pauseButton: {
    padding: 5,
  },
  scoreBoard: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  scoreBox: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#334155',
  },
  nextBubbleBox: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gameArea: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 10,
  },
  startMessage: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 15,
  },
  startText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
    gap: 10,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
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

export default BubbleShooterGame;

