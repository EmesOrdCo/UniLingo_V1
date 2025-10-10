import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SpaceInvadersGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = Math.min(width - 40, 400);
const GAME_HEIGHT = height - 280;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 24;
const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 12;
const ENEMY_SIZE = 24;
const ENEMY_ROWS = 5;
const ENEMY_COLS = 11;
const ENEMY_SPACING_X = 32;
const ENEMY_SPACING_Y = 32;

type Position = { x: number; y: number };
type Enemy = { id: number; row: number; col: number; type: number; alive: boolean };
type Bullet = { id: number; x: number; y: number; friendly: boolean };

const SpaceInvadersGame: React.FC<SpaceInvadersGameProps> = ({ onClose, onGameComplete }) => {
  // Game state
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemyDirection, setEnemyDirection] = useState(1);
  const [enemyOffsetX, setEnemyOffsetX] = useState(0);
  const [enemyOffsetY, setEnemyOffsetY] = useState(50);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(true); // Start immediately without ready screen

  // Refs
  const gameLoop = useRef<number | null>(null);
  const nextBulletId = useRef(0);
  const lastEnemyMoveTime = useRef(Date.now());
  const lastEnemyShootTime = useRef(Date.now());
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const lastPlayerX = useRef(playerX);

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgFloat3 = useRef(new Animated.Value(0)).current;
  const starTwinkle = useRef(new Animated.Value(0)).current;

  // Get enemy speed (faster as enemies decrease and wave increases)
  const getEnemySpeed = useCallback(() => {
    const aliveCount = enemies.filter(e => e.alive).length;
    const baseSpeed = 1000 - wave * 50;
    const speedMultiplier = 1 - (aliveCount / (ENEMY_ROWS * ENEMY_COLS)) * 0.5;
    return Math.max(200, baseSpeed * speedMultiplier);
  }, [enemies, wave]);

  // Initialize enemies
  const initializeEnemies = useCallback(() => {
    const newEnemies: Enemy[] = [];
    let id = 0;
    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMY_COLS; col++) {
        newEnemies.push({
          id: id++,
          row,
          col,
          type: row < 1 ? 3 : row < 3 ? 2 : 1, // Top row worth more
          alive: true,
        });
      }
    }
    return newEnemies;
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    setEnemies(initializeEnemies());
    setBullets([]);
    setEnemyOffsetX(0);
    setEnemyOffsetY(50);
    setEnemyDirection(1);
    setPlayerX(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  }, [initializeEnemies]);

  // Start game
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Player pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPlayerX.current = playerX;
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = lastPlayerX.current + gestureState.dx;
        const clampedX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, newX));
        setPlayerX(clampedX);
      },
      onPanResponderRelease: () => {
        lastPlayerX.current = playerX;
      },
    })
  ).current;

  // Shoot player bullet
  const shoot = useCallback(() => {
    if (gameOver || won || isPaused) return;
    
    setBullets(prev => {
      // Limit to 3 bullets on screen
      const playerBullets = prev.filter(b => b.friendly);
      if (playerBullets.length >= 3) return prev;

      // Player is at bottom: 20, so calculate top position
      const playerTopY = GAME_HEIGHT - 20 - PLAYER_HEIGHT;
      const newBullet: Bullet = {
        id: nextBulletId.current++,
        x: playerX + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
        y: playerTopY, // Start at top of player ship
        friendly: true,
      };
      return [...prev, newBullet];
    });
  }, [playerX, gameOver, won, isPaused]);

  // Move bullets
  const moveBullets = useCallback(() => {
    setBullets(prev => {
      return prev
        .map(bullet => ({
          ...bullet,
          y: bullet.friendly ? bullet.y - 8 : bullet.y + 6,
        }))
        .filter(bullet => bullet.y > -20 && bullet.y < GAME_HEIGHT + 20);
    });
  }, []);

  // Move enemies
  const moveEnemies = useCallback(() => {
    const now = Date.now();
    const speed = getEnemySpeed();
    
    if (now - lastEnemyMoveTime.current < speed) return;
    lastEnemyMoveTime.current = now;

    setEnemyOffsetX(prev => {
      const newOffset = prev + enemyDirection * 8;
      const rightmostAlive = Math.max(...enemies.filter(e => e.alive).map(e => e.col));
      const leftmostAlive = Math.min(...enemies.filter(e => e.alive).map(e => e.col));

      // Check if need to reverse and move down
      if (
        (newOffset + rightmostAlive * ENEMY_SPACING_X + ENEMY_SIZE >= GAME_WIDTH && enemyDirection > 0) ||
        (newOffset + leftmostAlive * ENEMY_SPACING_X <= 0 && enemyDirection < 0)
      ) {
        setEnemyDirection(d => -d);
        setEnemyOffsetY(y => y + 16);
        return prev;
      }

      return newOffset;
    });
  }, [enemyDirection, enemies, getEnemySpeed]);

  // Enemy shoots
  const enemyShoot = useCallback(() => {
    if (gameOver || won || isPaused) return;
    
    const now = Date.now();
    if (now - lastEnemyShootTime.current < 1000) return;
    
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) return;

    // Random enemy shoots
    const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    const enemyX = enemyOffsetX + shooter.col * ENEMY_SPACING_X;
    const enemyY = enemyOffsetY + shooter.row * ENEMY_SPACING_Y;

    const newBullet: Bullet = {
      id: nextBulletId.current++,
      x: enemyX + ENEMY_SIZE / 2 - BULLET_WIDTH / 2,
      y: enemyY + ENEMY_SIZE,
      friendly: false,
    };

    setBullets(prev => [...prev, newBullet]);
    lastEnemyShootTime.current = now;
  }, [enemies, enemyOffsetX, enemyOffsetY, gameOver, won, isPaused]);

  // Check collisions - using refs to avoid nested setState issues
  const checkCollisions = useCallback(() => {
    setEnemies(prevEnemies => {
      setBullets(prevBullets => {
        const bulletsToRemove: number[] = [];
        const enemiesToKill: number[] = [];
        let scoreGain = 0;

        // For each bullet, find the first enemy it hits
        for (const bullet of prevBullets) {
          if (!bullet.friendly) continue;
          
          // Skip if this bullet already hit something
          if (bulletsToRemove.includes(bullet.id)) continue;

          // Check against all enemies
          for (const enemy of prevEnemies) {
            if (!enemy.alive) continue;
            
            // Skip if this enemy already killed
            if (enemiesToKill.includes(enemy.id)) continue;

            const enemyX = enemyOffsetX + enemy.col * ENEMY_SPACING_X;
            const enemyY = enemyOffsetY + enemy.row * ENEMY_SPACING_Y;

            // Collision detection
            const bulletRight = bullet.x + BULLET_WIDTH;
            const bulletLeft = bullet.x;
            const bulletTop = bullet.y;
            const bulletBottom = bullet.y + BULLET_HEIGHT;

            const enemyRight = enemyX + ENEMY_SIZE;
            const enemyLeft = enemyX;
            const enemyTop = enemyY;
            const enemyBottom = enemyY + ENEMY_SIZE;

            // Check if bullet and enemy overlap
            if (
              bulletRight >= enemyLeft &&
              bulletLeft <= enemyRight &&
              bulletTop <= enemyBottom &&
              bulletBottom >= enemyTop
            ) {
              // HIT! Mark both for removal
              bulletsToRemove.push(bullet.id);
              enemiesToKill.push(enemy.id);
              scoreGain += enemy.type * 10 * wave;
              break; // STOP - this bullet hit one enemy, don't check more
            }
          }
        }

        // Update score
        if (scoreGain > 0) {
          setScore(prev => prev + scoreGain);
        }

        // Update enemies - mark hit ones as dead
        const newEnemies = prevEnemies.map(enemy => {
          if (enemiesToKill.includes(enemy.id)) {
            return { ...enemy, alive: false };
          }
          return enemy;
        });

        // Check win/lose conditions
        if (newEnemies.every(e => !e.alive)) {
          setWon(true);
        }

        const lowestAliveEnemy = newEnemies
          .filter(e => e.alive)
          .reduce((lowest, e) => Math.max(lowest, e.row), 0);
        
        if (enemyOffsetY + lowestAliveEnemy * ENEMY_SPACING_Y + ENEMY_SIZE >= GAME_HEIGHT - 60) {
          setGameOver(true);
        }

        // Update enemies state
        setEnemies(newEnemies);

        // Remove bullets that hit enemies
        let newBullets = prevBullets.filter(b => !bulletsToRemove.includes(b.id));

        // Check enemy bullets vs player
        newBullets = newBullets.filter(bullet => {
          if (!bullet.friendly) {
            const playerY = GAME_HEIGHT - 20 - PLAYER_HEIGHT;
            if (
              bullet.x + BULLET_WIDTH >= playerX &&
              bullet.x <= playerX + PLAYER_WIDTH &&
              bullet.y + BULLET_HEIGHT >= playerY &&
              bullet.y <= playerY + PLAYER_HEIGHT
            ) {
              setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                  setGameOver(true);
                }
                return newLives;
              });
              return false;
            }
          }
          return true;
        });

        return newBullets;
      });

      return prevEnemies; // Return enemies unchanged here since we update them inside
    });
  }, [playerX, enemyOffsetX, enemyOffsetY, wave]);

  // Main game loop
  const updateGame = useCallback(() => {
    if (isPaused || gameOver || won) return;

    moveBullets();
    moveEnemies();
    enemyShoot();
    checkCollisions();
  }, [moveBullets, moveEnemies, enemyShoot, checkCollisions, isPaused, gameOver, won]);

  // Game loop using requestAnimationFrame
  useEffect(() => {
    if (!isPaused && !gameOver && !won) {
      const animate = () => {
        updateGame();
        gameLoop.current = requestAnimationFrame(animate);
      };
      gameLoop.current = requestAnimationFrame(animate);
    }
    return () => {
      if (gameLoop.current) cancelAnimationFrame(gameLoop.current);
    };
  }, [updateGame, isPaused, gameOver, won]);

  // Handle game over
  useEffect(() => {
    if ((gameOver || won) && !completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      console.log('👾 Space Invaders calling onGameComplete with score:', score);
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

    const createTwinkleAnimation = (animatedValue: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    setTimeout(() => createFloatAnimation(bgFloat1, 4000).start(), 100);
    setTimeout(() => createFloatAnimation(bgFloat2, 3500).start(), 300);
    setTimeout(() => createFloatAnimation(bgFloat3, 4500).start(), 500);
    setTimeout(() => createTwinkleAnimation(starTwinkle).start(), 200);
  }, []);

  const handleRestart = () => {
    initializeGame();
    setScore(0);
    setLives(3);
    setWave(1);
    setGameOver(false);
    setWon(false);
    setGameStarted(true); // Start immediately
    completionCalledRef.current = false;
    finalScoreRef.current = 0;
  };

  const handleNextWave = () => {
    setWave(prev => prev + 1);
    initializeGame();
    setWon(false);
    setGameStarted(true); // Start immediately
  };

  const handleClose = () => {
    if (!completionCalledRef.current) {
      finalScoreRef.current = score;
      completionCalledRef.current = true;
      onGameComplete(score);
    }
    onClose();
  };

  // Get enemy color by type
  const getEnemyColor = (type: number): string => {
    return type === 3 ? '#EF4444' : type === 2 ? '#F59E0B' : '#10B981';
  };

  // Get enemy icon by type
  const getEnemyIcon = (type: number): string => {
    return type === 3 ? 'bug' : type === 2 ? 'alien' : 'flask';
  };

  // Background interpolations
  const floatInterpolate1 = bgFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });
  const floatInterpolate2 = bgFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const floatInterpolate3 = bgFloat3.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const twinkleOpacity = starTwinkle.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <View style={styles.container}>
      {/* Animated Background - Space theme */}
      <View style={styles.backgroundContainer}>
        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.star,
              {
                left: (i * 47) % GAME_WIDTH,
                top: (i * 73) % GAME_HEIGHT,
                opacity: twinkleOpacity,
              },
            ]}
          />
        ))}
        <Animated.View style={[styles.bgElement1, { transform: [{ translateY: floatInterpolate1 }] }]} />
        <Animated.View style={[styles.bgElement2, { transform: [{ translateY: floatInterpolate2 }] }]} />
        <Animated.View style={[styles.bgElement3, { transform: [{ translateY: floatInterpolate3 }] }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close-circle" size={28} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.title}>SPACE INVADERS</Text>
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
              <Ionicons key={i} name="rocket" size={14} color="#00F0F0" />
            ))}
          </View>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>WAVE</Text>
          <Text style={styles.scoreValue}>{wave}</Text>
        </View>
      </View>

      {/* Game Area */}
      <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
        {/* Enemies */}
        {enemies.map(enemy => {
          if (!enemy.alive) return null;
          
          return (
            <View
              key={enemy.id}
              style={[
                styles.enemy,
                {
                  left: enemyOffsetX + enemy.col * ENEMY_SPACING_X,
                  top: enemyOffsetY + enemy.row * ENEMY_SPACING_Y,
                  width: ENEMY_SIZE,
                  height: ENEMY_SIZE,
                },
              ]}
            >
              <Ionicons 
                name={getEnemyIcon(enemy.type) as any} 
                size={ENEMY_SIZE} 
                color={getEnemyColor(enemy.type)} 
              />
            </View>
          );
        })}

        {/* Bullets */}
        {bullets.map(bullet => (
          <View
            key={bullet.id}
            style={[
              styles.bullet,
              {
                left: bullet.x,
                top: bullet.y,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
                backgroundColor: bullet.friendly ? '#00F0F0' : '#EF4444',
              },
            ]}
          />
        ))}

        {/* Player Ship */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.player,
            {
              left: playerX,
              bottom: 20,
              width: PLAYER_WIDTH,
              height: PLAYER_HEIGHT,
            },
          ]}
        >
          <Ionicons name="rocket-sharp" size={30} color="#00F0F0" style={styles.playerIcon} />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.moveButton}
          onPress={() => setPlayerX(prev => Math.max(0, prev - 30))}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shootButton} onPress={shoot}>
          <Ionicons name="radio-button-on" size={28} color="#FFFFFF" />
          <Text style={styles.shootText}>FIRE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.moveButton}
          onPress={() => setPlayerX(prev => Math.min(GAME_WIDTH - PLAYER_WIDTH, prev + 30))}
        >
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Win Overlay */}
      {won && (
        <View style={styles.overlay}>
          <View style={styles.winCard}>
            <Ionicons name="trophy" size={64} color="#F59E0B" />
            <Text style={styles.winTitle}>Wave Cleared!</Text>
            <Text style={styles.winScore}>Score: {score}</Text>
            <Text style={styles.winWave}>Wave {wave} Complete</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.nextWaveButton} onPress={handleNextWave}>
                <Ionicons name="play-forward" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Next Wave</Text>
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
            <Text style={styles.statsText}>Wave: {wave}</Text>
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
      {isPaused && !gameOver && !won && gameStarted && (
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
    backgroundColor: '#000000',
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  bgElement1: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 240, 240, 0.03)',
    top: 100,
    left: 40,
  },
  bgElement2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
    top: 200,
    right: 50,
  },
  bgElement3: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(16, 185, 129, 0.025)',
    bottom: 150,
    left: 60,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#00F0F0',
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
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#00F0F0',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00F0F0',
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
    backgroundColor: '#000000',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00F0F0',
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 10,
  },
  enemy: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bullet: {
    position: 'absolute',
    borderRadius: 2,
    shadowColor: '#00F0F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  player: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerIcon: {
    transform: [{ rotate: '-90deg' }],
    shadowColor: '#00F0F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 10,
  },
  moveButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00F0F0',
  },
  shootButton: {
    width: 100,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    gap: 5,
  },
  shootText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
  },
  winCard: {
    backgroundColor: '#1A1A1A',
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
    color: '#00F0F0',
    marginBottom: 5,
  },
  winWave: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 20,
  },
  gameOverCard: {
    backgroundColor: '#1A1A1A',
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
    color: '#00F0F0',
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
  nextWaveButton: {
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
    backgroundColor: '#1A1A1A',
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

export default SpaceInvadersGame;

