import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon, Circle, Line } from 'react-native-svg';

interface AsteroidsGameProps {
  gameData?: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const { width, height } = Dimensions.get('window');

// Game constants
const GAME_WIDTH = Math.min(width - 40, 380);
const GAME_HEIGHT = height - 300;
const SHIP_SIZE = 20;
const ROTATION_SPEED = 5;
const THRUST_POWER = 0.3;
const FRICTION = 0.98;
const MAX_SPEED = 8;
const BULLET_SPEED = 10;
const BULLET_LIFE = 60;
const MAX_BULLETS = 8;

type Ship = {
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
  isThrusting: boolean;
};

type Asteroid = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: 'large' | 'medium' | 'small';
  rotation: number;
  rotationSpeed: number;
  points: number;
};

type Bullet = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

type UFO = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: 'large' | 'small';
};

const AsteroidsGame: React.FC<AsteroidsGameProps> = ({ onClose, onGameComplete }) => {
  // Game state
  const [ship, setShip] = useState<Ship>({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    rotation: 0,
    vx: 0,
    vy: 0,
    isThrusting: false,
  });
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [ufos, setUfos] = useState<UFO[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isInvincible, setIsInvincible] = useState(false);

  // Refs
  const gameLoop = useRef<number | null>(null);
  const nextAsteroidId = useRef(0);
  const nextBulletId = useRef(0);
  const nextUfoId = useRef(0);
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const controlsRef = useRef({ left: false, right: false, thrust: false, shoot: false });
  const lastShotTime = useRef(0);

  // Animated values
  const bgFloat1 = useRef(new Animated.Value(0)).current;
  const bgFloat2 = useRef(new Animated.Value(0)).current;
  const bgFloat3 = useRef(new Animated.Value(0)).current;

  // Generate asteroid
  const generateAsteroid = useCallback((size: 'large' | 'medium' | 'small', x?: number, y?: number) => {
    const isInitial = x === undefined;
    let posX = x ?? Math.random() * GAME_WIDTH;
    let posY = y ?? Math.random() * GAME_HEIGHT;

    // If initial, spawn away from center
    if (isInitial) {
      const centerDistance = 150;
      while (
        Math.abs(posX - GAME_WIDTH / 2) < centerDistance &&
        Math.abs(posY - GAME_HEIGHT / 2) < centerDistance
      ) {
        posX = Math.random() * GAME_WIDTH;
        posY = Math.random() * GAME_HEIGHT;
      }
    }

    const speed = size === 'large' ? 1 : size === 'medium' ? 1.5 : 2;
    const angle = Math.random() * Math.PI * 2;

    return {
      id: nextAsteroidId.current++,
      x: posX,
      y: posY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 3,
      points: size === 'large' ? 6 : size === 'medium' ? 5 : 4,
    };
  }, []);

  // Initialize level
  const initializeLevel = useCallback((levelNum: number) => {
    const asteroidCount = 3 + levelNum;
    const newAsteroids: Asteroid[] = [];
    for (let i = 0; i < asteroidCount; i++) {
      newAsteroids.push(generateAsteroid('large'));
    }
    setAsteroids(newAsteroids);
    setBullets([]);
    setUfos([]);
    setShip({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      rotation: 0,
      vx: 0,
      vy: 0,
      isThrusting: false,
    });
    setIsInvincible(true);
    setTimeout(() => setIsInvincible(false), 3000);
  }, [generateAsteroid]);

  // Initialize game
  const initializeGame = useCallback(() => {
    initializeLevel(1);
    setGameStarted(false);
  }, [initializeLevel]);

  // Start game
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Wrap position around screen
  const wrapPosition = (x: number, y: number) => {
    let newX = x;
    let newY = y;
    if (x < -20) newX = GAME_WIDTH + 20;
    if (x > GAME_WIDTH + 20) newX = -20;
    if (y < -20) newY = GAME_HEIGHT + 20;
    if (y > GAME_HEIGHT + 20) newY = -20;
    return { x: newX, y: newY };
  };

  // Check collision
  const checkCollision = (
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number
  ) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
  };

  // Get asteroid radius
  const getAsteroidRadius = (size: 'large' | 'medium' | 'small') => {
    return size === 'large' ? 30 : size === 'medium' ? 20 : 10;
  };

  // Shoot bullet
  const shootBullet = useCallback(() => {
    const now = Date.now();
    if (now - lastShotTime.current < 200 || bullets.length >= MAX_BULLETS) return;
    
    lastShotTime.current = now;
    const angle = (ship.rotation - 90) * (Math.PI / 180);
    const bulletVx = Math.cos(angle) * BULLET_SPEED;
    const bulletVy = Math.sin(angle) * BULLET_SPEED;
    
    setBullets(prev => [
      ...prev,
      {
        id: nextBulletId.current++,
        x: ship.x,
        y: ship.y,
        vx: bulletVx + ship.vx,
        vy: bulletVy + ship.vy,
        life: BULLET_LIFE,
      },
    ]);
  }, [ship, bullets.length]);

  // Spawn UFO
  const spawnUFO = useCallback(() => {
    if (ufos.length > 0 || Math.random() > 0.005) return;
    
    const size = Math.random() < 0.7 ? 'large' : 'small';
    const side = Math.random() < 0.5 ? -30 : GAME_WIDTH + 30;
    const y = Math.random() * GAME_HEIGHT;
    
    setUfos(prev => [
      ...prev,
      {
        id: nextUfoId.current++,
        x: side,
        y,
        vx: side < 0 ? 2 : -2,
        vy: (Math.random() - 0.5) * 1,
        size,
      },
    ]);
  }, [ufos.length]);

  // Game loop
  const updateGame = useCallback(() => {
    if (!gameStarted || isPaused || gameOver) return;

    // Update ship
    setShip(prevShip => {
      let newShip = { ...prevShip };

      // Rotation
      if (controlsRef.current.left) {
        newShip.rotation -= ROTATION_SPEED;
      }
      if (controlsRef.current.right) {
        newShip.rotation += ROTATION_SPEED;
      }

      // Thrust
      if (controlsRef.current.thrust) {
        const angle = (newShip.rotation - 90) * (Math.PI / 180);
        newShip.vx += Math.cos(angle) * THRUST_POWER;
        newShip.vy += Math.sin(angle) * THRUST_POWER;
        newShip.isThrusting = true;
      } else {
        newShip.isThrusting = false;
      }

      // Apply friction
      newShip.vx *= FRICTION;
      newShip.vy *= FRICTION;

      // Limit speed
      const speed = Math.sqrt(newShip.vx * newShip.vx + newShip.vy * newShip.vy);
      if (speed > MAX_SPEED) {
        newShip.vx = (newShip.vx / speed) * MAX_SPEED;
        newShip.vy = (newShip.vy / speed) * MAX_SPEED;
      }

      // Update position
      newShip.x += newShip.vx;
      newShip.y += newShip.vy;

      // Wrap around screen
      const wrapped = wrapPosition(newShip.x, newShip.y);
      newShip.x = wrapped.x;
      newShip.y = wrapped.y;

      return newShip;
    });

    // Shooting
    if (controlsRef.current.shoot) {
      shootBullet();
    }

    // Update asteroids
    setAsteroids(prevAsteroids =>
      prevAsteroids.map(asteroid => {
        const newAsteroid = { ...asteroid };
        newAsteroid.x += newAsteroid.vx;
        newAsteroid.y += newAsteroid.vy;
        newAsteroid.rotation += newAsteroid.rotationSpeed;

        const wrapped = wrapPosition(newAsteroid.x, newAsteroid.y);
        newAsteroid.x = wrapped.x;
        newAsteroid.y = wrapped.y;

        return newAsteroid;
      })
    );

    // Update bullets
    setBullets(prevBullets =>
      prevBullets
        .map(bullet => {
          const newBullet = { ...bullet };
          newBullet.x += newBullet.vx;
          newBullet.y += newBullet.vy;
          newBullet.life -= 1;

          const wrapped = wrapPosition(newBullet.x, newBullet.y);
          newBullet.x = wrapped.x;
          newBullet.y = wrapped.y;

          return newBullet;
        })
        .filter(bullet => bullet.life > 0)
    );

    // Update UFOs
    setUfos(prevUfos =>
      prevUfos.map(ufo => {
        const newUfo = { ...ufo };
        newUfo.x += newUfo.vx;
        newUfo.y += newUfo.vy;
        return newUfo;
      }).filter(ufo => ufo.x > -50 && ufo.x < GAME_WIDTH + 50)
    );

    // Spawn UFOs
    spawnUFO();

    // Check bullet-asteroid collisions
    bullets.forEach(bullet => {
      asteroids.forEach(asteroid => {
        const radius = getAsteroidRadius(asteroid.size);
        if (checkCollision(bullet.x, bullet.y, 2, asteroid.x, asteroid.y, radius)) {
          // Remove bullet
          setBullets(prev => prev.filter(b => b.id !== bullet.id));

          // Break asteroid
          setAsteroids(prev => {
            const remaining = prev.filter(a => a.id !== asteroid.id);
            const newAsteroids: Asteroid[] = [];

            if (asteroid.size === 'large') {
              newAsteroids.push(generateAsteroid('medium', asteroid.x, asteroid.y));
              newAsteroids.push(generateAsteroid('medium', asteroid.x, asteroid.y));
              setScore(s => s + 20);
            } else if (asteroid.size === 'medium') {
              newAsteroids.push(generateAsteroid('small', asteroid.x, asteroid.y));
              newAsteroids.push(generateAsteroid('small', asteroid.x, asteroid.y));
              setScore(s => s + 50);
            } else {
              setScore(s => s + 100);
            }

            return [...remaining, ...newAsteroids];
          });
        }
      });
    });

    // Check bullet-UFO collisions
    bullets.forEach(bullet => {
      ufos.forEach(ufo => {
        const radius = ufo.size === 'large' ? 15 : 10;
        if (checkCollision(bullet.x, bullet.y, 2, ufo.x, ufo.y, radius)) {
          setBullets(prev => prev.filter(b => b.id !== bullet.id));
          setUfos(prev => prev.filter(u => u.id !== ufo.id));
          setScore(s => s + (ufo.size === 'large' ? 200 : 1000));
        }
      });
    });

    // Check ship-asteroid collisions
    if (!isInvincible) {
      asteroids.forEach(asteroid => {
        const radius = getAsteroidRadius(asteroid.size);
        if (checkCollision(ship.x, ship.y, 10, asteroid.x, asteroid.y, radius)) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
            } else {
              // Respawn
              setShip({
                x: GAME_WIDTH / 2,
                y: GAME_HEIGHT / 2,
                rotation: 0,
                vx: 0,
                vy: 0,
                isThrusting: false,
              });
              setIsInvincible(true);
              setTimeout(() => setIsInvincible(false), 3000);
            }
            return newLives;
          });
        }
      });

      // Check ship-UFO collisions
      ufos.forEach(ufo => {
        const radius = ufo.size === 'large' ? 15 : 10;
        if (checkCollision(ship.x, ship.y, 10, ufo.x, ufo.y, radius)) {
          setUfos(prev => prev.filter(u => u.id !== ufo.id));
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
            } else {
              setShip({
                x: GAME_WIDTH / 2,
                y: GAME_HEIGHT / 2,
                rotation: 0,
                vx: 0,
                vy: 0,
                isThrusting: false,
              });
              setIsInvincible(true);
              setTimeout(() => setIsInvincible(false), 3000);
            }
            return newLives;
          });
        }
      });
    }

    // Check if level complete
    if (asteroids.length === 0) {
      setLevel(prev => prev + 1);
      initializeLevel(level + 1);
    }
  }, [
    gameStarted,
    isPaused,
    gameOver,
    ship,
    asteroids,
    bullets,
    ufos,
    isInvincible,
    level,
    shootBullet,
    spawnUFO,
    generateAsteroid,
    initializeLevel,
  ]);

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
      console.log('🚀 Asteroids calling onGameComplete with score:', score);
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
    setTimeout(() => createFloatAnimation(bgFloat3, 3200).start(), 500);
  }, []);

  const handleRestart = () => {
    initializeGame();
    setScore(0);
    setLives(3);
    setLevel(1);
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
  const floatInterpolate3 = bgFloat3.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });

  // Get ship points for drawing
  const getShipPoints = () => {
    const angle = (ship.rotation - 90) * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return [
      { x: ship.x + cos * 15, y: ship.y + sin * 15 }, // Front
      { x: ship.x + Math.cos(angle + 2.5) * 10, y: ship.y + Math.sin(angle + 2.5) * 10 }, // Back right
      { x: ship.x, y: ship.y }, // Center (for thrust)
      { x: ship.x + Math.cos(angle - 2.5) * 10, y: ship.y + Math.sin(angle - 2.5) * 10 }, // Back left
    ];
  };

  // Get asteroid points for drawing
  const getAsteroidPoints = (asteroid: Asteroid) => {
    const radius = getAsteroidRadius(asteroid.size);
    const points: { x: number; y: number }[] = [];
    const numPoints = asteroid.points;

    for (let i = 0; i < numPoints; i++) {
      const angle = ((360 / numPoints) * i + asteroid.rotation) * (Math.PI / 180);
      const variance = 0.7 + Math.random() * 0.3;
      points.push({
        x: asteroid.x + Math.cos(angle) * radius * variance,
        y: asteroid.y + Math.sin(angle) * radius * variance,
      });
    }

    return points;
  };

  const shipPoints = getShipPoints();
  const shipPolygonPoints = `${shipPoints[0].x},${shipPoints[0].y} ${shipPoints[1].x},${shipPoints[1].y} ${shipPoints[2].x},${shipPoints[2].y} ${shipPoints[3].x},${shipPoints[3].y}`;

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
        <Text style={styles.title}>ASTEROIDS</Text>
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
              <Ionicons key={i} name="rocket" size={14} color="#10B981" />
            ))}
          </View>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>LEVEL</Text>
          <Text style={styles.scoreValue}>{level}</Text>
        </View>
      </View>

      {/* Game Area */}
      <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}>
        <Svg width={GAME_WIDTH} height={GAME_HEIGHT}>
          {/* Asteroids */}
          {asteroids.map(asteroid => {
            const points = getAsteroidPoints(asteroid);
            const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
            return (
              <Polygon
                key={asteroid.id}
                points={polygonPoints}
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2"
              />
            );
          })}

          {/* UFOs */}
          {ufos.map(ufo => {
            const r = ufo.size === 'large' ? 15 : 10;
            return (
              <React.Fragment key={ufo.id}>
                <Circle cx={ufo.x} cy={ufo.y} r={r} fill="none" stroke="#F59E0B" strokeWidth="2" />
                <Line x1={ufo.x - r} y1={ufo.y} x2={ufo.x + r} y2={ufo.y} stroke="#F59E0B" strokeWidth="2" />
              </React.Fragment>
            );
          })}

          {/* Bullets */}
          {bullets.map(bullet => (
            <Circle key={bullet.id} cx={bullet.x} cy={bullet.y} r="2" fill="#FFFFFF" />
          ))}

          {/* Ship */}
          {!gameOver && (
            <>
              <Polygon
                points={shipPolygonPoints}
                fill="none"
                stroke={isInvincible ? '#F59E0B' : '#10B981'}
                strokeWidth="2"
                opacity={isInvincible && Math.floor(Date.now() / 200) % 2 === 0 ? 0.3 : 1}
              />
              {/* Thrust flame */}
              {ship.isThrusting && (
                <Polygon
                  points={`${shipPoints[1].x},${shipPoints[1].y} ${shipPoints[2].x - Math.cos((ship.rotation - 90) * Math.PI / 180) * 12},${shipPoints[2].y - Math.sin((ship.rotation - 90) * Math.PI / 180) * 12} ${shipPoints[3].x},${shipPoints[3].y}`}
                  fill="#F59E0B"
                  stroke="#F59E0B"
                  strokeWidth="1"
                />
              )}
            </>
          )}
        </Svg>

        {/* Start Message */}
        {!gameStarted && !gameOver && (
          <View style={styles.startMessage}>
            <Text style={styles.startText}>Ready to launch!</Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Ionicons name="rocket" size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>START</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      {gameStarted && !gameOver && (
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPressIn={() => (controlsRef.current.left = true)}
              onPressOut={() => (controlsRef.current.left = false)}
            >
              <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.thrustButton]}
              onPressIn={() => (controlsRef.current.thrust = true)}
              onPressOut={() => (controlsRef.current.thrust = false)}
            >
              <Ionicons name="arrow-up" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPressIn={() => (controlsRef.current.right = true)}
              onPressOut={() => (controlsRef.current.right = false)}
            >
              <Ionicons name="arrow-forward" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.controlButton, styles.shootButton]}
            onPressIn={() => (controlsRef.current.shoot = true)}
            onPressOut={() => (controlsRef.current.shoot = false)}
          >
            <Ionicons name="radio-button-on" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Destroy asteroids and UFOs! Watch out - asteroids split into smaller pieces!
        </Text>
      </View>

      {/* Game Over Overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.gameOverCard}>
            <Ionicons name="skull" size={64} color="#EF4444" />
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Final Score: {score}</Text>
            <Text style={styles.statsText}>Level Reached: {level}</Text>
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
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
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
    backgroundColor: 'rgba(156, 163, 175, 0.05)',
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
    fontSize: 28,
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
    backgroundColor: '#10B981',
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 15,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    backgroundColor: '#334155',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#475569',
  },
  thrustButton: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  shootButton: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    color: '#10B981',
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

export default AsteroidsGame;

