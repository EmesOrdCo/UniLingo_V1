import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

// Create animated SVG components
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

type PoppingBubble = Bubble & {
  scale: Animated.Value;
  opacity: Animated.Value;
  translateY: Animated.Value;
  isFloating: boolean;
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
  const [poppingBubbles, setPoppingBubbles] = useState<PoppingBubble[]>([]); // Bubbles being animated
  const [currentBubble, setCurrentBubble] = useState<string>('#EF4444'); // Will be randomized on init
  const [nextBubble, setNextBubble] = useState<string>('#F59E0B'); // Will be randomized on init
  const [flyingBubble, setFlyingBubble] = useState<FlyingBubble | null>(null);
  const [shooterAngle, setShooterAngle] = useState(90);
  const shooterAngleRef = useRef(90); // Use ref for immediate access
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Refs
  const gameLoop = useRef<number | null>(null);
  const nextBubbleId = useRef(0);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const bubblesRef = useRef<Bubble[]>(bubbles); // Keep current bubbles for sync access
  const isAttaching = useRef(false); // Prevent duplicate attachment processing
  const currentBubbleRef = useRef<string>(currentBubble); // Keep current bubble color for sync access
  const nextBubbleRef = useRef<string>(nextBubble); // Keep next bubble color for sync access

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;

  // Keep refs in sync
  useEffect(() => {
    bubblesRef.current = bubbles;
  }, [bubbles]);

  useEffect(() => {
    currentBubbleRef.current = currentBubble;
  }, [currentBubble]);

  useEffect(() => {
    nextBubbleRef.current = nextBubble;
  }, [nextBubble]);

  // Initialize game
  const initializeGame = useCallback(() => {
    const initialBubbles: Bubble[] = [];
    const rows = 5;
    
    // Create bubbles with better color distribution
    for (let row = 0; row < rows; row++) {
      const cols = row % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
      for (let col = 0; col < cols; col++) {
        // Use a seeded approach for better variety
        const colorIndex = Math.floor(Math.random() * COLORS.length);
        initialBubbles.push({
          row,
          col,
          color: COLORS[colorIndex],
          id: nextBubbleId.current++,
        });
      }
    }
    
    setBubbles(initialBubbles);
    const newCurrentBubble = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newNextBubble = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    console.log('🫧 Initialize - Colors:', {
      allColors: COLORS,
      currentBubble: newCurrentBubble,
      nextBubble: newNextBubble,
      gridBubbleColors: initialBubbles.map(b => b.color)
    });
    
    setCurrentBubble(newCurrentBubble);
    setNextBubble(newNextBubble);
    currentBubbleRef.current = newCurrentBubble; // Keep ref in sync
    nextBubbleRef.current = newNextBubble; // Keep ref in sync
    setFlyingBubble(null);
    setShooterAngle(90);
    shooterAngleRef.current = 90;
    isAttaching.current = false; // Reset attachment flag
    // DON'T reset gameStarted here - causes issues
  }, []);

  // Start game
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Animate bubble popping
  const popBubbles = useCallback((bubblesToPop: Bubble[], isFloating: boolean = false) => {
    console.log(`🫧 Popping ${bubblesToPop.length} bubbles (floating: ${isFloating})`);
    
    // Create popping bubbles with animation values
    const newPoppingBubbles: PoppingBubble[] = bubblesToPop.map((bubble, index) => ({
      ...bubble,
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(0),
      isFloating,
    }));

    setPoppingBubbles(prev => [...prev, ...newPoppingBubbles]);

    // Animate each bubble with a slight stagger
    newPoppingBubbles.forEach((poppingBubble, index) => {
      const delay = index * 50; // 50ms delay between each pop
      
      setTimeout(() => {
        const animations = [
          Animated.sequence([
            // Quick scale up
            Animated.timing(poppingBubble.scale, {
              toValue: 1.3,
              duration: 100,
              useNativeDriver: false, // SVG doesn't support native driver
            }),
            // Scale down to nothing
            Animated.timing(poppingBubble.scale, {
              toValue: 0,
              duration: 150,
              useNativeDriver: false,
            }),
          ]),
          // Fade out
          Animated.timing(poppingBubble.opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
        ];

        // Floating bubbles fall as they pop
        if (isFloating) {
          animations.push(
            Animated.timing(poppingBubble.translateY, {
              toValue: 50, // Fall 50 pixels
              duration: 250,
              useNativeDriver: false,
            })
          );
        }

        Animated.parallel(animations).start(() => {
          // Remove from popping bubbles after animation
          setPoppingBubbles(current => 
            current.filter(b => b.id !== poppingBubble.id)
          );
        });
      }, delay);
    });
  }, []);

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
  const shootBubble = () => {
    console.log('🫧 Shoot bubble called', { 
      flyingBubble: !!flyingBubble, 
      shooterAngle: shooterAngleRef.current,
      currentBubble
    });
    
    if (flyingBubble) {
      console.log('🫧 Already have flying bubble, ignoring');
      return;
    }
    
    // Start game on first shot
    if (!gameStarted) {
      console.log('🫧 Starting game');
      setGameStarted(true);
    }
    
    // Use the ref for the most current angle
    const angleRad = (shooterAngleRef.current * Math.PI) / 180;
    const shooterX = GAME_WIDTH / 2;
    
    const vx = Math.cos(angleRad) * BUBBLE_SPEED;
    const vy = -Math.sin(angleRad) * BUBBLE_SPEED;
    
    console.log('🫧 Angle calculation:', {
      shooterAngle: shooterAngleRef.current,
      angleRad,
      vx,
      vy,
      BUBBLE_SPEED
    });
    
    // Use refs for colors to avoid stale closure
    const bubbleColor = currentBubbleRef.current;
    const nextColor = nextBubbleRef.current;
    const newNextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    const newFlyingBubble = {
      x: shooterX,
      y: SHOOTER_Y,
      vx: vx,
      vy: vy,
      color: bubbleColor,
    };
    
    console.log('🫧 Creating flying bubble', { 
      flyingColor: bubbleColor, 
      nextColor, 
      newNextColor 
    });
    
    setFlyingBubble(newFlyingBubble);
    setCurrentBubble(nextColor);
    setNextBubble(newNextColor);
  };

  // Pan responder for aiming
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !flyingBubble,
      onMoveShouldSetPanResponder: () => !flyingBubble,
      onPanResponderGrant: (evt) => {
        // Update angle immediately on touch
        const shooterX = GAME_WIDTH / 2;
        const touchX = evt.nativeEvent.locationX || GAME_WIDTH / 2;
        const touchY = evt.nativeEvent.locationY || GAME_HEIGHT / 2;
        
        const dx = touchX - shooterX;
        const dy = SHOOTER_Y - touchY;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        console.log('🫧 Touch start:', { touchX, touchY, shooterX, SHOOTER_Y, dx, dy, angle: angle.toFixed(1) });
        
        // Clamp angle between 30 and 150 degrees
        angle = Math.max(30, Math.min(150, angle));
        setShooterAngle(angle);
        shooterAngleRef.current = angle; // Update ref immediately
      },
      onPanResponderMove: (evt, gestureState) => {
        const shooterX = GAME_WIDTH / 2;
        
        // Use locationX/locationY from event for more accurate positioning
        const touchX = evt.nativeEvent.locationX;
        const touchY = evt.nativeEvent.locationY;
        
        const dx = touchX - shooterX;
        const dy = SHOOTER_Y - touchY;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        console.log('🫧 Pan move:', { touchX, touchY, dx, dy, angle: angle.toFixed(1) });
        
        // Clamp angle between 30 and 150 degrees
        angle = Math.max(30, Math.min(150, angle));
        setShooterAngle(angle);
        shooterAngleRef.current = angle; // Update ref immediately
      },
      onPanResponderRelease: () => {
        console.log('🫧 Pan released, shooting at angle:', shooterAngleRef.current);
        if (!gameStarted) setGameStarted(true);
        shootBubble();
      },
    })
  ).current;

  // Start game loop - ONCE when game starts
  useEffect(() => {
    if (!gameStarted || isPaused || gameOver) return;
    
    console.log('🫧 Starting game loop ONCE');
    let animationFrameId: number;
    
    const animate = () => {
      setFlyingBubble(prevFlyingBubble => {
        if (!prevFlyingBubble) {
          animationFrameId = requestAnimationFrame(animate);
          return null;
        }

        // Skip if already processing attachment
        if (isAttaching.current) {
          animationFrameId = requestAnimationFrame(animate);
          return null; // Clear the flying bubble
        }
        
        // Update position
        let newBubble = { ...prevFlyingBubble };
        newBubble.x += newBubble.vx;
        newBubble.y += newBubble.vy;

        // Wall collision
        if (newBubble.x - BUBBLE_RADIUS <= 0 || newBubble.x + BUBBLE_RADIUS >= GAME_WIDTH) {
          newBubble.vx *= -1;
          newBubble.x = newBubble.x < BUBBLE_RADIUS ? BUBBLE_RADIUS : GAME_WIDTH - BUBBLE_RADIUS;
        }

        // Check collision with ceiling
        let shouldAttach = false;
        if (newBubble.y - BUBBLE_RADIUS <= 20) {
          console.log('🫧 Hit ceiling - attaching');
          shouldAttach = true;
        }

        // Check collision with existing bubbles (use ref for sync access)
        if (!shouldAttach) {
          for (const bubble of bubblesRef.current) {
            const pos = getBubblePosition(bubble.row, bubble.col);
            const dx = newBubble.x - pos.x;
            const dy = newBubble.y - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < BUBBLE_DIAMETER - 5) {
              console.log('🫧 Hit bubble - attaching');
              shouldAttach = true;
              break;
            }
          }
        }

        // If collision detected, process attachment
        if (shouldAttach) {
          isAttaching.current = true;
          
          // Process attachment in next tick to avoid state conflicts
          setTimeout(() => {
            setBubbles(currentBubbles => {
              // Find grid position to attach
              const gridPos = getGridPosition(newBubble.x, newBubble.y);
              
              // Find nearest valid position
              let bestRow = Math.max(0, gridPos.row);
              let bestCol = gridPos.col;
              let minDistance = Infinity;
              
              for (let r = Math.max(0, bestRow - 1); r <= bestRow + 1; r++) {
                const maxCols = r % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
                for (let c = 0; c < maxCols; c++) {
                  if (!currentBubbles.some(b => b.row === r && b.col === c)) {
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

              let updatedBubbles = [...currentBubbles, newBubbleInGrid];

              // Find matches
              const connected = findConnectedBubbles(bestRow, bestCol, newBubble.color, updatedBubbles);
              
              if (connected.length >= 3) {
                // Trigger pop animation for matched bubbles
                popBubbles(connected, false);
                
                // Remove matched bubbles
                const connectedIds = new Set(connected.map(b => b.id));
                updatedBubbles = updatedBubbles.filter(b => !connectedIds.has(b.id));
                setScore(prev => prev + connected.length * 10);
                
                // Remove floating bubbles
                const floating = findFloatingBubbles(updatedBubbles);
                if (floating.length > 0) {
                  // Trigger pop animation for floating bubbles
                  popBubbles(floating, true);
                  
                  const floatingIds = new Set(floating.map(b => b.id));
                  updatedBubbles = updatedBubbles.filter(b => !floatingIds.has(b.id));
                  setScore(prev => prev + floating.length * 20);
                }
              }

              // Check win condition
              if (updatedBubbles.length === 0) {
                console.log('🫧 Level complete!');
                setScore(prev => prev + 1000);
                setTimeout(() => {
                  initializeGame();
                  setGameStarted(true);
                }, 1000);
              }

              // Check game over (bubbles too low)
              const maxRow = Math.max(...updatedBubbles.map(b => b.row), -1);
              if (maxRow >= 12) {
                setGameOver(true);
              }

              console.log('🫧 Attached! Bubbles:', updatedBubbles.length);
              
              // Reset attachment flag
              isAttaching.current = false;
              
              return updatedBubbles;
            });
          }, 0);

          // Clear flying bubble immediately
          animationFrameId = requestAnimationFrame(animate);
          return null;
        }

        // No collision - continue flying
        animationFrameId = requestAnimationFrame(animate);
        return newBubble;
      });
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      console.log('🫧 Cleaning up game loop');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameStarted, isPaused, gameOver]); // Removed function dependencies causing infinite restarts

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
    setGameStarted(false);
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

          {/* Popping bubbles with animation */}
          {poppingBubbles.map(bubble => {
            const pos = getBubblePosition(bubble.row, bubble.col);
            // Interpolate scale to radius
            const animatedRadius = bubble.scale.interpolate({
              inputRange: [0, 1, 1.3],
              outputRange: [0, BUBBLE_RADIUS, BUBBLE_RADIUS * 1.3],
            });
            
            // Animate Y position for floating bubbles
            const animatedY = bubble.translateY.interpolate({
              inputRange: [0, 50],
              outputRange: [pos.y, pos.y + 50],
            });
            
            return (
              <AnimatedCircle
                key={`pop-${bubble.id}`}
                cx={pos.x}
                cy={animatedY}
                r={animatedRadius}
                fill={`url(#gradient-${bubble.color})`}
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity={bubble.opacity}
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
          Drag on grid to aim and release to shoot!
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

