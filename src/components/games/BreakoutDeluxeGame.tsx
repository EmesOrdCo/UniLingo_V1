import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BreakoutDeluxeGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = Math.min(width - 40, 380);
const GAME_HEIGHT = height - 300;
const INITIAL_PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 12;
const BRICK_ROWS = 7;
const BRICK_COLS = 10;
const BRICK_WIDTH = GAME_WIDTH / BRICK_COLS - 4;
const BRICK_HEIGHT = 20;
const BALL_SPEED = 4;
const POWER_UP_SIZE = 20;
const POWER_UP_FALL_SPEED = 2;

type PowerUpType = 'multiball' | 'expandpaddle' | 'laser' | 'slowball' | 'life';

type Brick = {
  id: number;
  row: number;
  col: number;
  hits: number;
  maxHits: number;
  color: string;
  type: 'normal' | 'strong' | 'metal';
  hasPowerUp?: PowerUpType;
};

type Ball = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
};

type PowerUp = {
  id: number;
  type: PowerUpType;
  x: number;
  y: number;
  icon: string;
  color: string;
};

type Laser = {
  id: number;
  x: number;
  y: number;
};

const BreakoutDeluxeGame: React.FC<BreakoutDeluxeGameProps> = ({ onClose, onGameComplete }) => {
  // Game state
  const [paddleX, setPaddleX] = useState((GAME_WIDTH - INITIAL_PADDLE_WIDTH) / 2);
  const [paddleWidth, setPaddleWidth] = useState(INITIAL_PADDLE_WIDTH);
  const [balls, setBalls] = useState<Ball[]>([{
    id: 0,
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 100,
    dx: BALL_SPEED,
    dy: -BALL_SPEED,
  }]);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [lasers, setLasers] = useState<Laser[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [hasLaser, setHasLaser] = useState(false);

  // Refs
  const gameLoop = useRef<number | null>(null);
  const nextBallId = useRef(1);
  const nextPowerUpId = useRef(0);
  const nextLaserId = useRef(0);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const paddleXRef = useRef(paddleX);
  const paddleWidthRef = useRef(paddleWidth);
  const lastPaddleX = useRef(paddleX);
  const ballsRef = useRef(balls);
  const bricksRef = useRef(bricks);
  const powerUpsRef = useRef(powerUps);
  const lasersRef = useRef(lasers);
  const levelRef = useRef(level);

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgFloat3 = useRef(new Animated.Value(0)).current;

  // Get power-up properties
  const getPowerUpProps = (type: PowerUpType) => {
    switch (type) {
      case 'multiball':
        return { icon: 'apps', color: '#3B82F6' };
      case 'expandpaddle':
        return { icon: 'resize', color: '#10B981' };
      case 'laser':
        return { icon: 'flash', color: '#F59E0B' };
      case 'slowball':
        return { icon: 'hourglass', color: '#8B5CF6' };
      case 'life':
        return { icon: 'heart', color: '#EF4444' };
      default:
        return { icon: 'star', color: '#FFFFFF' };
    }
  };

  // Brick colors and types by row
  const getBrickProps = (row: number) => {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1'];
    const color = colors[row % colors.length];
    
    // Top rows are very strong (4 hits), middle are strong (3 hits), bottom are normal (1-2 hits)
    const type: 'normal' | 'strong' | 'metal' = 
      row === 0 ? 'strong' : 
      row <= 2 ? 'strong' : 
      'normal';
    
    const maxHits = row === 0 ? 4 : type === 'strong' ? 3 : row === BRICK_ROWS - 1 ? 1 : 2;
    
    return { color, type, maxHits };
  };

  // Initialize bricks with power-ups
  const initializeBricks = useCallback(() => {
    const newBricks: Brick[] = [];
    let id = 0;
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const props = getBrickProps(row);
        const hasPowerUp = Math.random() < 0.15; // 15% chance
        const powerUpTypes: PowerUpType[] = ['multiball', 'expandpaddle', 'laser', 'slowball', 'life'];
        const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        newBricks.push({
          id: id++,
          row,
          col,
          hits: 0,
          ...props,
          hasPowerUp: hasPowerUp ? randomPowerUp : undefined,
        });
      }
    }
    return newBricks;
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    setBricks(initializeBricks());
    setPaddleX((GAME_WIDTH - INITIAL_PADDLE_WIDTH) / 2);
    setPaddleWidth(INITIAL_PADDLE_WIDTH);
    setBalls([{
      id: 0,
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 100,
      dx: BALL_SPEED,
      dy: -BALL_SPEED,
    }]);
    setPowerUps([]);
    setLasers([]);
    setGameStarted(false);
    setHasLaser(false);
    nextBallId.current = 1;
  }, [initializeBricks]);

  // Start game
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Keep refs in sync with state for smooth game loop
  useEffect(() => {
    paddleXRef.current = paddleX;
  }, [paddleX]);

  useEffect(() => {
    paddleWidthRef.current = paddleWidth;
  }, [paddleWidth]);

  useEffect(() => {
    ballsRef.current = balls;
  }, [balls]);

  useEffect(() => {
    bricksRef.current = bricks;
  }, [bricks]);

  useEffect(() => {
    powerUpsRef.current = powerUps;
  }, [powerUps]);

  useEffect(() => {
    lasersRef.current = lasers;
  }, [lasers]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPaddleX.current = paddleXRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = lastPaddleX.current + gestureState.dx;
        const clampedX = Math.max(0, Math.min(GAME_WIDTH - paddleWidth, newX));
        setPaddleX(clampedX);
        paddleXRef.current = clampedX; // Update ref immediately for smooth tracking
      },
      onPanResponderRelease: () => {
        lastPaddleX.current = paddleXRef.current;
        if (!gameStarted) {
          setGameStarted(true);
        }
      },
    })
  ).current;

  // Shoot laser
  const shootLaser = useCallback(() => {
    if (!hasLaser || !gameStarted) return;
    
    setLasers(prev => [
      ...prev,
      { id: nextLaserId.current++, x: paddleX + paddleWidth / 2 - 2, y: GAME_HEIGHT - PADDLE_HEIGHT - 30 },
    ]);
  }, [hasLaser, paddleX, paddleWidth, gameStarted]);

  // Apply power-up
  const applyPowerUp = useCallback((type: PowerUpType) => {
    switch (type) {
      case 'multiball':
        // Add 2 more balls
        setBalls(prev => [
          ...prev,
          {
            id: nextBallId.current++,
            x: prev[0].x,
            y: prev[0].y,
            dx: BALL_SPEED * 0.8,
            dy: -BALL_SPEED,
          },
          {
            id: nextBallId.current++,
            x: prev[0].x,
            y: prev[0].y,
            dx: -BALL_SPEED * 0.8,
            dy: -BALL_SPEED,
          },
        ]);
        break;
      case 'expandpaddle':
        setPaddleWidth(Math.min(INITIAL_PADDLE_WIDTH * 1.5, GAME_WIDTH * 0.4));
        setTimeout(() => setPaddleWidth(INITIAL_PADDLE_WIDTH), 10000);
        break;
      case 'laser':
        setHasLaser(true);
        setTimeout(() => setHasLaser(false), 10000);
        break;
      case 'slowball':
        setBalls(prev => prev.map(b => ({
          ...b,
          dx: b.dx * 0.6,
          dy: b.dy * 0.6,
        })));
        setTimeout(() => {
          setBalls(prev => prev.map(b => ({
            ...b,
            dx: b.dx / 0.6,
            dy: b.dy / 0.6,
          })));
        }, 8000);
        break;
      case 'life':
        setLives(prev => prev + 1);
        break;
    }
  }, [paddleWidth]);

  // Game loop
  const updateGame = useCallback(() => {
    if (!gameStarted || isPaused || gameOver || won) return;

    // Update balls
    setBalls(prevBalls => {
      return prevBalls.map(ball => {
        let newBall = { ...ball };
        newBall.x += newBall.dx;
        newBall.y += newBall.dy;

        // Wall collisions
        if (newBall.x <= 0 || newBall.x >= GAME_WIDTH - BALL_SIZE) {
          newBall.dx *= -1;
          newBall.x = newBall.x <= 0 ? 0 : GAME_WIDTH - BALL_SIZE;
        }

        // Top wall
        if (newBall.y <= 0) {
          newBall.dy *= -1;
          newBall.y = 0;
        }

        // Paddle collision - use refs for current position
        const currentPaddleX = paddleXRef.current;
        const currentPaddleWidth = paddleWidthRef.current;
        if (
          newBall.y + BALL_SIZE >= GAME_HEIGHT - PADDLE_HEIGHT - 20 &&
          newBall.y + BALL_SIZE <= GAME_HEIGHT - PADDLE_HEIGHT - 10 &&
          newBall.x + BALL_SIZE >= currentPaddleX &&
          newBall.x <= currentPaddleX + currentPaddleWidth
        ) {
          newBall.dy = -Math.abs(newBall.dy);
          const paddleCenter = currentPaddleX + currentPaddleWidth / 2;
          const hitPos = (newBall.x + BALL_SIZE / 2 - paddleCenter) / (currentPaddleWidth / 2);
          newBall.dx = hitPos * BALL_SPEED * 1.5;
        }

        return newBall;
      }).filter(ball => ball.y < GAME_HEIGHT + 50); // Remove balls that fell
    });

    // Check if all balls lost - use ref for current state
    const currentBalls = ballsRef.current;
    if (currentBalls.length === 0 || currentBalls.every(b => b.y >= GAME_HEIGHT)) {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameOver(true);
        } else {
          setBalls([{
            id: nextBallId.current++,
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT - 100,
            dx: BALL_SPEED,
            dy: -BALL_SPEED,
          }]);
          setGameStarted(false);
        }
        return newLives;
      });
    }

    // Update power-ups
    setPowerUps(prev => {
      const updated = prev.map(p => ({ ...p, y: p.y + POWER_UP_FALL_SPEED }));
      
      // Check collection - use refs for current paddle position
      const currentPaddleX = paddleXRef.current;
      const currentPaddleWidth = paddleWidthRef.current;
      const collected: PowerUpType[] = [];
      const remaining = updated.filter(p => {
        if (
          p.y + POWER_UP_SIZE >= GAME_HEIGHT - PADDLE_HEIGHT - 20 &&
          p.y <= GAME_HEIGHT - PADDLE_HEIGHT + 20 &&
          p.x + POWER_UP_SIZE >= currentPaddleX &&
          p.x <= currentPaddleX + currentPaddleWidth
        ) {
          collected.push(p.type);
          return false;
        }
        return p.y < GAME_HEIGHT + 20;
      });
      
      collected.forEach(type => applyPowerUp(type));
      return remaining;
    });

    // Update lasers
    setLasers(prev => prev.map(l => ({ ...l, y: l.y - 8 })).filter(l => l.y > -20));

    // Laser collisions with bricks
    const currentLasers = lasersRef.current;
    const currentLevel = levelRef.current;
    setBricks(prevBricks => {
      let newBricks = [...prevBricks];
      
      currentLasers.forEach(laser => {
        newBricks = newBricks.map(brick => {
          if (brick.hits >= brick.maxHits) return brick;
          
          const brickX = brick.col * (BRICK_WIDTH + 4) + 2;
          const brickY = brick.row * (BRICK_HEIGHT + 4) + 50;
          
          if (
            laser.x >= brickX &&
            laser.x <= brickX + BRICK_WIDTH &&
            laser.y >= brickY &&
            laser.y <= brickY + BRICK_HEIGHT
          ) {
            const newBrick = { ...brick, hits: brick.hits + 1 };
            if (newBrick.hits >= newBrick.maxHits) {
              setScore(prev => prev + (brick.row + 1) * 15 * currentLevel);
              
              // Drop power-up
              if (brick.hasPowerUp) {
                const props = getPowerUpProps(brick.hasPowerUp);
                setPowerUps(prevPowerUps => [
                  ...prevPowerUps,
                  {
                    id: nextPowerUpId.current++,
                    type: brick.hasPowerUp!,
                    x: brickX + BRICK_WIDTH / 2 - POWER_UP_SIZE / 2,
                    y: brickY,
                    ...props,
                  },
                ]);
              }
            }
            return newBrick;
          }
          return brick;
        });
      });
      
      return newBricks;
    });

    // Ball collisions with bricks
    currentBalls.forEach(ball => {
      setBricks(prevBricks => {
        let brickHit = false;
        const newBricks = prevBricks.map(brick => {
          if (brick.hits >= brick.maxHits) return brick;

          const brickX = brick.col * (BRICK_WIDTH + 4) + 2;
          const brickY = brick.row * (BRICK_HEIGHT + 4) + 50;

          if (
            ball.x + BALL_SIZE >= brickX &&
            ball.x <= brickX + BRICK_WIDTH &&
            ball.y + BALL_SIZE >= brickY &&
            ball.y <= brickY + BRICK_HEIGHT
          ) {
            if (!brickHit) {
              setBalls(prevBalls => prevBalls.map(b =>
                b.id === ball.id ? { ...b, dy: b.dy * -1 } : b
              ));
              brickHit = true;
            }

            const newBrick = { ...brick, hits: brick.hits + 1 };
            if (newBrick.hits >= newBrick.maxHits) {
              setScore(prev => prev + (brick.row + 1) * 10 * currentLevel);
              
              // Drop power-up
              if (brick.hasPowerUp) {
                const props = getPowerUpProps(brick.hasPowerUp);
                setPowerUps(prevPowerUps => [
                  ...prevPowerUps,
                  {
                    id: nextPowerUpId.current++,
                    type: brick.hasPowerUp!,
                    x: brickX + BRICK_WIDTH / 2 - POWER_UP_SIZE / 2,
                    y: brickY,
                    ...props,
                  },
                ]);
              }
            }
            return newBrick;
          }

          return brick;
        });

        // Check if all bricks destroyed
        if (newBricks.every(b => b.hits >= b.maxHits)) {
          setWon(true);
        }

        return newBricks;
      });
    });
  }, [gameStarted, isPaused, gameOver, won, applyPowerUp]);

  // Start game loop
  useEffect(() => {
    if (gameStarted && !isPaused && !gameOver && !won) {
      gameLoop.current = requestAnimationFrame(function animate() {
        updateGame();
        gameLoop.current = requestAnimationFrame(animate);
      });
    }
    return () => {
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current);
    };
  }, [gameStarted, isPaused, gameOver, won, updateGame]);

  // Handle game over
  useEffect(() => {
    if ((gameOver || won) && !completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      console.log('🧱 Breakout Deluxe calling onGameComplete with score:', score);
      setTimeout(() => {
        onGameComplete(score);
      }, 100);
    }
  }, [gameOver, won, score, onGameComplete]);

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
    setTimeout(() => createFloatAnimation(bgFloat3, 3200).start(), 500);
  }, []);

  const handleRestart = () => {
    initializeGame();
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setWon(false);
    completionCalledRef.current = false;
    finalScoreRef.current = 0;
  };

  const handleNextLevel = () => {
    setLevel(prev => prev + 1);
    setBricks(initializeBricks());
    setBalls([{
      id: nextBallId.current++,
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 100,
      dx: BALL_SPEED * (1 + level * 0.1),
      dy: -BALL_SPEED * (1 + level * 0.1),
    }]);
    setPowerUps([]);
    setLasers([]);
    setPaddleWidth(INITIAL_PADDLE_WIDTH);
    setGameStarted(false);
    setWon(false);
    setHasLaser(false);
  };

  const handleClose = () => {
    if (!completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      onGameComplete(score);
    }
    onClose();
  };

  const floatInterpolate1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  const floatInterpolate2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const floatInterpolate3 = bgFloat3.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <Animated.View style={[styles.bgElement1, { transform: [{ translateY: floatInterpolate1 }] }]} />
        <Animated.View style={[styles.bgElement2, { transform: [{ translateY: floatInterpolate2 }] }]} />
        <Animated.View style={[styles.bgElement3, { transform: [{ translateY: floatInterpolate3 }] }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={28} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.title}>BREAKOUT DELUXE</Text>
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
              <Ionicons key={i} name="heart" size={14} color="#EF4444" />
            ))}
          </View>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>LEVEL</Text>
          <Text style={styles.scoreValue}>{level}</Text>
        </View>
        {hasLaser && (
          <View style={[styles.scoreBox, styles.laserBadge]}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
          </View>
        )}
      </View>

      {/* Game Area */}
      <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
        {/* Bricks */}
        {bricks.map(brick => {
          if (brick.hits >= brick.maxHits) return null;
          
          const opacity = 1 - (brick.hits / brick.maxHits) * 0.4;
          const brickX = brick.col * (BRICK_WIDTH + 4) + 2;
          const brickY = brick.row * (BRICK_HEIGHT + 4) + 50;
          
          return (
            <View
              key={brick.id}
              style={[
                styles.brick,
                {
                  left: brickX,
                  top: brickY,
                  width: BRICK_WIDTH,
                  height: BRICK_HEIGHT,
                  backgroundColor: brick.color,
                  opacity: opacity,
                  borderWidth: brick.maxHits >= 4 ? 2 : 1, // Thicker border for very strong bricks
                  borderColor: brick.maxHits >= 4 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
                },
              ]}
            >
              {brick.hasPowerUp && (
                <View style={styles.powerUpIndicator} />
              )}
            </View>
          );
        })}

        {/* Power-ups */}
        {powerUps.map(powerUp => (
          <View
            key={powerUp.id}
            style={[
              styles.powerUpDrop,
              {
                left: powerUp.x,
                top: powerUp.y,
                backgroundColor: powerUp.color,
              },
            ]}
          >
            <Ionicons name={powerUp.icon as any} size={14} color="#FFFFFF" />
          </View>
        ))}

        {/* Lasers */}
        {lasers.map(laser => (
          <View
            key={laser.id}
            style={[
              styles.laser,
              {
                left: laser.x,
                top: laser.y,
              },
            ]}
          />
        ))}

        {/* Balls */}
        {balls.map(ball => (
          <View
            key={ball.id}
            style={[
              styles.ball,
              {
                left: ball.x,
                top: ball.y,
                width: BALL_SIZE,
                height: BALL_SIZE,
              },
            ]}
          />
        ))}

        {/* Paddle */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.paddle,
            {
              left: paddleX,
              bottom: 20,
              width: paddleWidth,
              height: PADDLE_HEIGHT,
              backgroundColor: hasLaser ? '#F59E0B' : '#3B82F6',
            },
          ]}
        />

        {/* Start Message */}
        {!gameStarted && !gameOver && !won && (
          <View style={styles.startMessage}>
            <Text style={styles.startText}>Drag paddle to start!</Text>
            <Ionicons name="hand-left" size={32} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Laser Shoot Button */}
      {hasLaser && gameStarted && (
        <TouchableOpacity style={styles.laserButton} onPress={shootLaser}>
          <Ionicons name="flash" size={24} color="#FFFFFF" />
          <Text style={styles.laserButtonText}>FIRE</Text>
        </TouchableOpacity>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Collect power-ups for special abilities! Top row bricks need 4 hits!
        </Text>
      </View>

      {/* Win Overlay */}
      {won && (
        <View style={styles.overlay}>
          <View style={styles.winCard}>
            <Ionicons name="trophy" size={64} color="#F59E0B" />
            <Text style={styles.winTitle}>Level Complete!</Text>
            <Text style={styles.winScore}>Score: {score}</Text>
            <Text style={styles.winLevel}>Level {level}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.nextLevelButton} onPress={handleNextLevel}>
                <Ionicons name="play-forward" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Next Level</Text>
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
            <Ionicons name="close-circle" size={64} color="#EF4444" />
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Final Score: {score}</Text>
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
      {isPaused && !gameOver && !won && (
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
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    top: 50,
    left: 30,
  },
  bgElement2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    top: 150,
    right: 40,
  },
  bgElement3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.07)',
    bottom: 150,
    left: 50,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
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
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#334155',
  },
  laserBadge: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
    minWidth: 40,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 3,
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
  brick: {
    position: 'absolute',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerUpIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 2,
    right: 2,
  },
  powerUpDrop: {
    position: 'absolute',
    width: POWER_UP_SIZE,
    height: POWER_UP_SIZE,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  laser: {
    position: 'absolute',
    width: 4,
    height: 15,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  ball: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  paddle: {
    position: 'absolute',
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  startMessage: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
  },
  startText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  laserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  laserButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 11,
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
  winLevel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 20,
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
    marginTop: 10,
  },
  nextLevelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
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

export default BreakoutDeluxeGame;

