import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TextInput, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Polygon, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '../../lib/i18n';

interface GravityGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const { width, height } = Dimensions.get('window');

const GravityGame: React.FC<GravityGameProps> = ({ gameData, onClose, onGameComplete }) => {
  const { t } = useTranslation();
  
  // Function to calculate dynamic font size based on word length
  const getDynamicMeteorFontSize = (word: string) => {
    const wordLength = word.length;
    const baseFontSize = 12;

    if (wordLength <= 6) {
      return baseFontSize; // 12px for short words
    } else if (wordLength <= 8) {
      return 10; // 10px for medium words
    } else if (wordLength <= 10) {
      return 9; // 9px for longer words
    } else if (wordLength <= 12) {
      return 8; // 8px for very long words
    } else {
      return 7; // 7px for extremely long words (minimum readable size)
    }
  };
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5); // More lives for better gameplay
  const [gameOver, setGameOver] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [meteors, setMeteors] = useState<any[]>([]);
  const [currentWave, setCurrentWave] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(7000); // Even slower initial meteor spawn interval
  const [meteorSpeed, setMeteorSpeed] = useState(1); // Slower initial meteor fall speed

  // Use ref to capture final score and prevent multiple calls
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const meteorSpawnInterval = useRef<NodeJS.Timeout | null>(null);
  const meteorMoveInterval = useRef<NodeJS.Timeout | null>(null);
  const gameStartTime = useRef<number>(Date.now());
  

  // Animated values for background elements
  const starTwinkle1 = useRef(new Animated.Value(0)).current;
  const starTwinkle2 = useRef(new Animated.Value(0)).current;
  const starTwinkle3 = useRef(new Animated.Value(0)).current;
  const starTwinkle4 = useRef(new Animated.Value(0)).current;
  const starTwinkle5 = useRef(new Animated.Value(0)).current;
  const starTwinkle6 = useRef(new Animated.Value(0)).current;
  const starTwinkle7 = useRef(new Animated.Value(0)).current;
  const starTwinkle8 = useRef(new Animated.Value(0)).current;
  const starTwinkle9 = useRef(new Animated.Value(0)).current;
  const starTwinkle10 = useRef(new Animated.Value(0)).current;
  
  const planetRotate1 = useRef(new Animated.Value(0)).current;
  const planetRotate2 = useRef(new Animated.Value(0)).current;
  const planetRotate3 = useRef(new Animated.Value(0)).current;
  
  const rocketFloat1 = useRef(new Animated.Value(0)).current;
  const rocketFloat2 = useRef(new Animated.Value(0)).current;
  const rocketFloat3 = useRef(new Animated.Value(0)).current;
  
  const moonOrbit1 = useRef(new Animated.Value(0)).current;
  const moonOrbit2 = useRef(new Animated.Value(0)).current;
  
  const nebulaPulse1 = useRef(new Animated.Value(0)).current;
  const nebulaPulse2 = useRef(new Animated.Value(0)).current;
  const nebulaPulse3 = useRef(new Animated.Value(0)).current;

  // Game completion effect
  useEffect(() => {
    if ((gameComplete || gameOver) && !completionCalledRef.current) {
      console.log('🪐 Planet Defence calling onGameComplete with:', {
        score: finalScoreRef.current
      });
      completionCalledRef.current = true;
      onGameComplete(finalScoreRef.current);
    }
  }, [gameComplete, gameOver]);

  // Start game when component mounts
  useEffect(() => {
    startGame();
    // startBackgroundAnimations(); // Temporarily disabled to test layout stability
    return () => {
      if (meteorSpawnInterval.current) clearInterval(meteorSpawnInterval.current);
      if (meteorMoveInterval.current) clearInterval(meteorMoveInterval.current);
    };
  }, []);

  const startBackgroundAnimations = () => {
    // Star twinkling animations
    const createTwinkleAnimation = (animatedValue: Animated.Value, duration: number, delay: number = 0) => {
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
            delay: 0,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    // Planet rotation animations
    const createRotationAnimation = (animatedValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      );
    };

    // Rocket floating animations
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
            delay: 0,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    // Moon orbit animations
    const createOrbitAnimation = (animatedValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      );
    };

    // Nebula pulse animations
    const createPulseAnimation = (animatedValue: Animated.Value, duration: number, delay: number = 0) => {
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
            delay: 0,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    // Start all animations
    setTimeout(() => { createTwinkleAnimation(starTwinkle1, 2000, 0).start(); }, 100);
    setTimeout(() => { createTwinkleAnimation(starTwinkle2, 2500, 0).start(); }, 300);
    setTimeout(() => { createTwinkleAnimation(starTwinkle3, 1800, 0).start(); }, 500);
    setTimeout(() => { createTwinkleAnimation(starTwinkle4, 2200, 0).start(); }, 700);
    setTimeout(() => { createTwinkleAnimation(starTwinkle5, 3000, 0).start(); }, 900);
    setTimeout(() => { createTwinkleAnimation(starTwinkle6, 1600, 0).start(); }, 1100);
    setTimeout(() => { createTwinkleAnimation(starTwinkle7, 2800, 0).start(); }, 1300);
    setTimeout(() => { createTwinkleAnimation(starTwinkle8, 1900, 0).start(); }, 1500);
    setTimeout(() => { createTwinkleAnimation(starTwinkle9, 2400, 0).start(); }, 1700);
    setTimeout(() => { createTwinkleAnimation(starTwinkle10, 2100, 0).start(); }, 1900);

    setTimeout(() => { createRotationAnimation(planetRotate1, 15000).start(); }, 200);
    setTimeout(() => { createRotationAnimation(planetRotate2, 20000).start(); }, 400);
    setTimeout(() => { createRotationAnimation(planetRotate3, 12000).start(); }, 600);

    setTimeout(() => { createFloatAnimation(rocketFloat1, 4000, 0).start(); }, 800);
    setTimeout(() => { createFloatAnimation(rocketFloat2, 3500, 0).start(); }, 1000);
    setTimeout(() => { createFloatAnimation(rocketFloat3, 4500, 0).start(); }, 1200);

    setTimeout(() => { createOrbitAnimation(moonOrbit1, 25000).start(); }, 1400);
    setTimeout(() => { createOrbitAnimation(moonOrbit2, 30000).start(); }, 1600);

    setTimeout(() => { createPulseAnimation(nebulaPulse1, 6000, 0).start(); }, 1800);
    setTimeout(() => { createPulseAnimation(nebulaPulse2, 5000, 0).start(); }, 2000);
    setTimeout(() => { createPulseAnimation(nebulaPulse3, 7000, 0).start(); }, 2200);
  };

  const startGame = () => {
    gameStartTime.current = Date.now();
    
    // Spawn meteors periodically
    meteorSpawnInterval.current = setInterval(() => {
      spawnMeteor();
    }, gameSpeed);

    // Move meteors down
    meteorMoveInterval.current = setInterval(() => {
      moveMeteors();
    }, 50); // Update every 50ms for smooth movement
  };

  const spawnMeteor = () => {
    if (gameData.questions && gameData.questions.length > 0) {
      const randomQuestion = gameData.questions[Math.floor(Math.random() * gameData.questions.length)];
      const newMeteor = {
        id: Date.now() + Math.random(),
        question: randomQuestion.question,
        correctAnswer: randomQuestion.correctAnswer,
        x: Math.random() * (width - 200) + 100, // Random x position with more margin (100px on each side)
        y: -50, // Start above screen
        speed: randomQuestion.fallSpeed || meteorSpeed, // Use fallSpeed from gameData, fallback to meteorSpeed
        destroyed: false
      };
      
      setMeteors(prev => [...prev, newMeteor]);
    }
  };

  const moveMeteors = () => {
    setMeteors(prev => {
      const updatedMeteors = prev.map(meteor => {
        // Hard-coded: Prevent meteors from going too far down
        const newY = meteor.y + meteor.speed;
        const maxY = height - 160; // More reasonable collision zone - meteors can fall closer to input area
        
        return {
          ...meteor,
          y: Math.min(newY, maxY) // Hard-coded: Cap the Y position
        };
      });

      // Hard-coded: Check for meteors that hit the planet (adjusted for fixed layout)
      const hitMeteors = updatedMeteors.filter(meteor => meteor.y >= height - 160 && !meteor.destroyed);
      
      if (hitMeteors.length > 0) {
        // Haptic feedback for losing lives
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Fix: Use functional state update to get current lives value
        setLives(currentLives => {
          const newLives = currentLives - hitMeteors.length;
          
          if (newLives <= 0) {
            finalScoreRef.current = score;
            setGameOver(true);
            if (meteorSpawnInterval.current) clearInterval(meteorSpawnInterval.current);
            if (meteorMoveInterval.current) clearInterval(meteorMoveInterval.current);
          }
          
          return newLives;
        });
      }

      // Hard-coded: Remove meteors that reach the collision zone or are destroyed
      return updatedMeteors.filter(meteor => meteor.y < height - 160 && !meteor.destroyed);
    });
  };

  const handleInputSubmit = () => {
    if (!userInput.trim()) return;

    const input = userInput.toLowerCase().trim();
    let meteorDestroyed = false;

    setMeteors(prev => {
      return prev.map(meteor => {
        if (!meteor.destroyed && meteor.correctAnswer.toLowerCase().trim() === input) {
          meteorDestroyed = true;
          
          // Haptic feedback for destroying meteor
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScore(score + 1);
          
          // Increase difficulty every 8 meteors destroyed (less frequent)
          if ((score + 1) % 8 === 0) {
            setCurrentWave(prev => prev + 1);
            setGameSpeed(prev => Math.max(2000, prev - 300)); // Less aggressive speed increase
            // Note: Individual meteor speeds are now controlled by gameData.fallSpeed
            // Wave progression only affects spawn rate, not individual meteor speed
          }
          
          return { ...meteor, destroyed: true };
        }
        return meteor;
      });
    });

    setUserInput('');
  };

  const destroyMeteor = (meteorId: number) => {
    setMeteors(prev => prev.map(meteor => 
      meteor.id === meteorId ? { ...meteor, destroyed: true } : meteor
    ));
  };

  const resetGame = () => {
    setScore(0);
    setLives(5); // Reset to more lives
    setGameOver(false);
    setGameComplete(false);
    setUserInput('');
    setMeteors([]);
    setCurrentWave(1);
    setGameSpeed(7000);
    setMeteorSpeed(1);
    finalScoreRef.current = 0;
    completionCalledRef.current = false;
    
    // Clear intervals
    if (meteorSpawnInterval.current) clearInterval(meteorSpawnInterval.current);
    if (meteorMoveInterval.current) clearInterval(meteorMoveInterval.current);
    
    // Restart game
    startGame();
  };

  const handleReturnToMenu = () => {
    onGameComplete(score);
  };

  // Memoize meteor rendering to prevent layout shifts
  const renderedMeteors = useMemo(() => {
    return meteors.map((meteor, index) => (
      <View
        key={`meteor-${meteor.id}-${index}`}
        style={[
          styles.meteor,
          {
            left: meteor.x,
            top: meteor.y,
            opacity: meteor.destroyed ? 0 : 1,
          }
        ]}
      >
        <Ionicons name="planet" size={30} color="#ef4444" />
        <Text style={[styles.meteorText, { fontSize: getDynamicMeteorFontSize(meteor.question) }]}>{meteor.question}</Text>
      </View>
    ));
  }, [meteors]);

  if (gameComplete) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>{t('gameCompletion.title.gravityGame')}</Text>
          <Text style={styles.completionSubtitle}>{t('gameCompletion.subtitle.defendingPlanet')}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('gameCompletion.stats.meteorsDestroyed')}</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('gameCompletion.stats.waveReached')}</Text>
              <Text style={styles.statValue}>{currentWave}</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Text style={styles.resetButtonText}>{t('gameCompletion.buttons.playAgain')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.exitButton} onPress={handleReturnToMenu}>
              <Text style={styles.exitButtonText}>{t('gameCompletion.buttons.returnToMenu')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.gameContainer}>
        {/* Clean Background */}
        <View style={styles.gameOverBackground} />
        
        {/* Simple Game Over Content */}
        <View style={styles.gameOverContainer}>
          {/* Header */}
          <View style={styles.gameOverHeader}>
            <Text style={styles.gameOverTitle}>Game Over</Text>
            <Text style={styles.gameOverSubtitle}>The meteors reached the planet</Text>
          </View>

          {/* Stats */}
          <View style={styles.gameOverStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('gameCompletion.stats.meteorsDestroyed')}</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('gameCompletion.stats.waveReached')}</Text>
              <Text style={styles.statValue}>{currentWave}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.gameOverActions}>
            <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
              <Text style={styles.playAgainButtonText}>{t('gameCompletion.buttons.playAgain')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.returnButton} onPress={handleReturnToMenu}>
              <Text style={styles.returnButtonText}>{t('gameCompletion.buttons.returnToMenu')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.gameContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 150}
    >
      {/* Fixed Layout Container - Prevents any layout shifts */}
      <View style={styles.fixedLayoutContainer}>
        {/* Stunning Space Background */}
        <View style={styles.spaceBackground}>
        {/* Animated Stars */}
        <Animated.View style={[
          styles.star1,
          {
            opacity: starTwinkle1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: starTwinkle1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.star2,
          {
            opacity: starTwinkle2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 1],
            }),
            transform: [
              {
                scale: starTwinkle2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1.3],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.star3,
          {
            opacity: starTwinkle3.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.9],
            }),
            transform: [
              {
                scale: starTwinkle3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1.1],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.star4,
          {
            opacity: starTwinkle4.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
            transform: [
              {
                scale: starTwinkle4.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1.4],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.star5,
          {
            opacity: starTwinkle5.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: starTwinkle5.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.star6,
          {
            opacity: starTwinkle6.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 1],
            }),
            transform: [
              {
                scale: starTwinkle6.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1.3],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.star7,
          {
            opacity: starTwinkle7.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.9],
            }),
            transform: [
              {
                scale: starTwinkle7.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1.1],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.star8,
          {
            opacity: starTwinkle8.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
            transform: [
              {
                scale: starTwinkle8.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1.4],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.star9,
          {
            opacity: starTwinkle9.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: starTwinkle9.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.star10,
          {
            opacity: starTwinkle10.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 1],
            }),
            transform: [
              {
                scale: starTwinkle10.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1.3],
                }),
              },
            ],
          },
        ]} />

        {/* Animated Planets - Subtle filled */}
        <Animated.View style={[
          styles.planet1,
          {
            transform: [
              {
                rotate: planetRotate1.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}>
          <Svg width="40" height="40" style={styles.planetSvg}>
            <Circle cx="20" cy="20" r="18" fill="rgba(180, 140, 140, 0.15)" stroke="rgba(160, 120, 120, 0.2)" strokeWidth="0.5" />
            <Path d="M 8 15 Q 20 12 32 15 Q 20 18 8 15" fill="rgba(160, 120, 120, 0.1)" stroke="rgba(150, 110, 110, 0.15)" strokeWidth="0.3" />
            <Path d="M 12 22 Q 20 20 28 22 Q 20 24 12 22" fill="rgba(160, 120, 120, 0.08)" stroke="rgba(150, 110, 110, 0.12)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        <Animated.View style={[
          styles.planet2,
          {
            transform: [
              {
                rotate: planetRotate2.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}>
          <Svg width="50" height="50" style={styles.planetSvg}>
            <Circle cx="25" cy="25" r="22" fill="rgba(140, 160, 160, 0.12)" stroke="rgba(120, 140, 140, 0.18)" strokeWidth="0.5" />
            <Path d="M 8 20 Q 25 15 42 20 Q 25 25 8 20" fill="rgba(120, 140, 140, 0.08)" stroke="rgba(110, 130, 130, 0.12)" strokeWidth="0.3" />
            <Path d="M 12 30 Q 25 25 38 30 Q 25 35 12 30" fill="rgba(120, 140, 140, 0.06)" stroke="rgba(110, 130, 130, 0.1)" strokeWidth="0.3" />
            <Path d="M 15 12 Q 25 10 35 12 Q 25 14 15 12" fill="rgba(120, 140, 140, 0.07)" stroke="rgba(110, 130, 130, 0.11)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        <Animated.View style={[
          styles.planet3,
          {
            transform: [
              {
                rotate: planetRotate3.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}>
          <Svg width="35" height="35" style={styles.planetSvg}>
            <Circle cx="17.5" cy="17.5" r="15" fill="rgba(170, 160, 140, 0.1)" stroke="rgba(150, 140, 120, 0.15)" strokeWidth="0.5" />
            <Path d="M 7 12 Q 17.5 10 28 12 Q 17.5 14 7 12" fill="rgba(150, 140, 120, 0.06)" stroke="rgba(140, 130, 110, 0.1)" strokeWidth="0.3" />
            <Path d="M 10 20 Q 17.5 18 25 20 Q 17.5 22 10 20" fill="rgba(150, 140, 120, 0.05)" stroke="rgba(140, 130, 110, 0.08)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        {/* Animated Rockets - Subtle filled */}
        <Animated.View style={[
          styles.rocket1,
          {
            transform: [
              {
                translateY: rocketFloat1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
              {
                translateX: rocketFloat1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
            ],
          },
        ]}>
          <Svg width="25" height="35" style={styles.rocketSvg}>
            <Path d="M 12.5 3 L 8 30 L 17 30 Z" fill="rgba(160, 160, 160, 0.12)" stroke="rgba(140, 140, 140, 0.15)" strokeWidth="0.5" />
            <Path d="M 12.5 3 L 6 25 L 8 30 L 17 30 L 19 25 Z" fill="rgba(140, 140, 140, 0.08)" stroke="rgba(120, 120, 120, 0.12)" strokeWidth="0.3" />
            <Circle cx="12.5" cy="8" r="2" fill="rgba(150, 120, 120, 0.1)" stroke="rgba(130, 100, 100, 0.15)" strokeWidth="0.3" />
            <Path d="M 8 30 L 6 32 L 8 32 Z" fill="rgba(140, 100, 100, 0.08)" stroke="rgba(120, 80, 80, 0.12)" strokeWidth="0.3" />
            <Path d="M 17 30 L 19 32 L 17 32 Z" fill="rgba(140, 100, 100, 0.08)" stroke="rgba(120, 80, 80, 0.12)" strokeWidth="0.3" />
            <Path d="M 12.5 30 L 12.5 35 L 11 33 L 14 33 Z" fill="rgba(140, 100, 100, 0.08)" stroke="rgba(120, 80, 80, 0.12)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        <Animated.View style={[
          styles.rocket2,
          {
            transform: [
              {
                translateY: rocketFloat2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15],
                }),
              },
              {
                translateX: rocketFloat2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
            ],
          },
        ]}>
          <Svg width="22" height="32" style={styles.rocketSvg}>
            <Path d="M 11 3 L 7 28 L 15 28 Z" fill="rgba(140, 160, 180, 0.1)" stroke="rgba(120, 140, 160, 0.15)" strokeWidth="0.5" />
            <Path d="M 11 3 L 5 23 L 7 28 L 15 28 L 17 23 Z" fill="rgba(120, 140, 160, 0.07)" stroke="rgba(100, 120, 140, 0.12)" strokeWidth="0.3" />
            <Circle cx="11" cy="7" r="1.5" fill="rgba(100, 130, 150, 0.08)" stroke="rgba(80, 110, 130, 0.15)" strokeWidth="0.3" />
            <Path d="M 7 28 L 5 30 L 7 30 Z" fill="rgba(100, 120, 140, 0.06)" stroke="rgba(80, 100, 120, 0.12)" strokeWidth="0.3" />
            <Path d="M 15 28 L 17 30 L 15 30 Z" fill="rgba(100, 120, 140, 0.06)" stroke="rgba(80, 100, 120, 0.12)" strokeWidth="0.3" />
            <Path d="M 11 28 L 11 32 L 9 30 L 13 30 Z" fill="rgba(100, 120, 140, 0.06)" stroke="rgba(80, 100, 120, 0.12)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        <Animated.View style={[
          styles.rocket3,
          {
            transform: [
              {
                translateY: rocketFloat3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -25],
                }),
              },
              {
                translateX: rocketFloat3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              },
            ],
          },
        ]}>
          <Svg width="28" height="38" style={styles.rocketSvg}>
            <Path d="M 14 3 L 9 32 L 19 32 Z" fill="rgba(160, 140, 160, 0.1)" stroke="rgba(140, 120, 140, 0.15)" strokeWidth="0.5" />
            <Path d="M 14 3 L 7 27 L 9 32 L 19 32 L 21 27 Z" fill="rgba(140, 120, 140, 0.07)" stroke="rgba(120, 100, 120, 0.12)" strokeWidth="0.3" />
            <Circle cx="14" cy="9" r="2.5" fill="rgba(130, 110, 130, 0.08)" stroke="rgba(110, 90, 110, 0.15)" strokeWidth="0.3" />
            <Path d="M 9 32 L 6 34 L 9 34 Z" fill="rgba(120, 100, 120, 0.06)" stroke="rgba(100, 80, 100, 0.12)" strokeWidth="0.3" />
            <Path d="M 19 32 L 22 34 L 19 34 Z" fill="rgba(120, 100, 120, 0.06)" stroke="rgba(100, 80, 100, 0.12)" strokeWidth="0.3" />
            <Path d="M 14 32 L 14 38 L 12 36 L 16 36 Z" fill="rgba(120, 100, 120, 0.06)" stroke="rgba(100, 80, 100, 0.12)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        {/* Animated Moons - Subtle filled */}
        <Animated.View style={[
          styles.moon1,
          {
            transform: [
              {
                rotate: moonOrbit1.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}>
          <Svg width="20" height="20" style={styles.moonSvg}>
            <Circle cx="10" cy="10" r="8" fill="rgba(180, 180, 180, 0.1)" stroke="rgba(160, 160, 160, 0.15)" strokeWidth="0.5" />
            <Path d="M 4 10 Q 10 6 16 10 Q 10 14 4 10" fill="rgba(160, 160, 160, 0.08)" stroke="rgba(140, 140, 140, 0.12)" strokeWidth="0.3" />
            <Circle cx="8" cy="8" r="1" fill="rgba(140, 140, 140, 0.06)" stroke="rgba(120, 120, 120, 0.08)" strokeWidth="0.3" />
            <Circle cx="12" cy="12" r="0.8" fill="rgba(140, 140, 140, 0.05)" stroke="rgba(120, 120, 120, 0.08)" strokeWidth="0.3" />
            <Circle cx="10" cy="13" r="0.5" fill="rgba(140, 140, 140, 0.04)" stroke="rgba(120, 120, 120, 0.06)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        <Animated.View style={[
          styles.moon2,
          {
            transform: [
              {
                rotate: moonOrbit2.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}>
          <Svg width="18" height="18" style={styles.moonSvg}>
            <Circle cx="9" cy="9" r="7" fill="rgba(170, 170, 170, 0.08)" stroke="rgba(150, 150, 150, 0.12)" strokeWidth="0.5" />
            <Path d="M 3 9 Q 9 5 15 9 Q 9 13 3 9" fill="rgba(150, 150, 150, 0.06)" stroke="rgba(130, 130, 130, 0.08)" strokeWidth="0.3" />
            <Circle cx="7" cy="7" r="0.8" fill="rgba(130, 130, 130, 0.05)" stroke="rgba(110, 110, 110, 0.06)" strokeWidth="0.3" />
            <Circle cx="11" cy="11" r="0.6" fill="rgba(130, 130, 130, 0.04)" stroke="rgba(110, 110, 110, 0.06)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        {/* Animated Nebulae - Very subtle filled */}
        <Animated.View style={[
          styles.nebula1,
          {
            opacity: nebulaPulse1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.05, 0.1],
            }),
            transform: [
              {
                scale: nebulaPulse1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1.1],
                }),
              },
            ],
          },
        ]}>
          <Svg width="120" height="90" style={styles.nebulaSvg}>
            <Path d="M 30 30 Q 60 15 90 30 Q 70 50 40 60 Q 20 50 30 30" fill="rgba(160, 140, 150, 0.06)" stroke="rgba(140, 120, 130, 0.08)" strokeWidth="0.5" />
            <Path d="M 50 40 Q 80 25 110 40 Q 90 60 60 70 Q 40 60 50 40" fill="rgba(160, 140, 150, 0.04)" stroke="rgba(140, 120, 130, 0.06)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        <Animated.View style={[
          styles.nebula2,
          {
            opacity: nebulaPulse2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.06, 0.12],
            }),
            transform: [
              {
                scale: nebulaPulse2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1.05],
                }),
              },
            ],
          },
        ]}>
          <Svg width="100" height="70" style={styles.nebulaSvg}>
            <Path d="M 25 25 Q 50 12 75 25 Q 60 40 35 50 Q 15 40 25 25" fill="rgba(140, 160, 160, 0.05)" stroke="rgba(120, 140, 140, 0.08)" strokeWidth="0.5" />
            <Path d="M 40 30 Q 65 17 90 30 Q 75 45 50 55 Q 30 45 40 30" fill="rgba(140, 160, 160, 0.03)" stroke="rgba(120, 140, 140, 0.06)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        <Animated.View style={[
          styles.nebula3,
          {
            opacity: nebulaPulse3.interpolate({
              inputRange: [0, 1],
              outputRange: [0.04, 0.08],
            }),
            transform: [
              {
                scale: nebulaPulse3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1.15],
                }),
              },
            ],
          },
        ]}>
          <Svg width="90" height="60" style={styles.nebulaSvg}>
            <Path d="M 20 20 Q 45 8 70 20 Q 55 35 30 45 Q 10 35 20 20" fill="rgba(150, 140, 120, 0.05)" stroke="rgba(130, 120, 100, 0.08)" strokeWidth="0.5" />
            <Path d="M 35 25 Q 60 12 85 25 Q 70 40 45 50 Q 25 40 35 25" fill="rgba(150, 140, 120, 0.03)" stroke="rgba(130, 120, 100, 0.06)" strokeWidth="0.3" />
          </Svg>
        </Animated.View>

        {/* Additional Static Stars */}
        <View style={styles.staticStar1} />
        <View style={styles.staticStar2} />
        <View style={styles.staticStar3} />
        <View style={styles.staticStar4} />
        <View style={styles.staticStar5} />
        <View style={styles.staticStar6} />
        <View style={styles.staticStar7} />
        <View style={styles.staticStar8} />
        <View style={styles.staticStar9} />
        <View style={styles.staticStar10} />
        <View style={styles.staticStar11} />
        <View style={styles.staticStar12} />
        <View style={styles.staticStar13} />
        <View style={styles.staticStar14} />
        <View style={styles.staticStar15} />
        <View style={styles.staticStar16} />
        <View style={styles.staticStar17} />
        <View style={styles.staticStar18} />
        <View style={styles.staticStar19} />
        <View style={styles.staticStar20} />
      </View>

      {/* Game Header */}
      <View style={styles.gameHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.scoreText}>{t('gravityGame.meteorsDestroyed', { count: score })}</Text>
          <Text style={styles.livesText}>{t('gravityGame.lives', { count: lives })}</Text>
          <Text style={styles.waveText}>{t('gravityGame.wave', { count: currentWave })}</Text>
        </View>
      </View>


      {/* Game Area - Empty container for layout stability */}
      <View style={styles.gameArea}>
          </View>

      {/* Meteors - Rendered at root level to prevent layout shifts */}
      {renderedMeteors}

      {/* Input Area - Completely separate from game area */}
      <View style={styles.inputArea}>
        <Text style={styles.instructionText}>
          {t('gravityGame.instruction')}
        </Text>
        <TextInput
          style={styles.textInput}
          value={userInput}
          onChangeText={setUserInput}
          onSubmitEditing={handleInputSubmit}
          placeholder={t('gameUI.placeholders.typeAnswer')}
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
      </View>
    </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a', // Deeper space background
  },
  fixedLayoutContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  spaceBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  // Animated Stars - Subtle and muted
  star1: {
    position: 'absolute',
    top: 80,
    left: 50,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(180, 180, 180, 0.4)',
  },
  star2: {
    position: 'absolute',
    top: 120,
    left: width - 80,
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: 'rgba(150, 180, 200, 0.25)',
    borderWidth: 0.5,
    borderColor: 'rgba(130, 160, 190, 0.3)',
  },
  star3: {
    position: 'absolute',
    top: 200,
    left: 30,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: 'rgba(200, 190, 150, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(180, 170, 130, 0.3)',
  },
  star4: {
    position: 'absolute',
    top: 150,
    left: width - 120,
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: 'rgba(180, 150, 160, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(160, 130, 140, 0.25)',
  },
  star5: {
    position: 'absolute',
    top: 300,
    left: 80,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(160, 180, 160, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(140, 160, 140, 0.25)',
  },
  star6: {
    position: 'absolute',
    top: 250,
    left: width - 60,
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: 'rgba(190, 170, 140, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(170, 150, 120, 0.25)',
  },
  star7: {
    position: 'absolute',
    top: 400,
    left: 20,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(200, 200, 200, 0.25)',
    borderWidth: 0.5,
    borderColor: 'rgba(180, 180, 180, 0.3)',
  },
  star8: {
    position: 'absolute',
    top: 350,
    left: width - 100,
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: 'rgba(170, 160, 180, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(150, 140, 160, 0.25)',
  },
  star9: {
    position: 'absolute',
    top: 500,
    left: 60,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(190, 185, 160, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(170, 165, 140, 0.25)',
  },
  star10: {
    position: 'absolute',
    top: 450,
    left: width - 40,
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: 'rgba(180, 160, 170, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(160, 140, 150, 0.25)',
  },
  // Planets
  planet1: {
    position: 'absolute',
    top: 100,
    left: width - 100,
    zIndex: 2,
  },
  planet2: {
    position: 'absolute',
    top: 300,
    left: 20,
    zIndex: 2,
  },
  planet3: {
    position: 'absolute',
    top: 500,
    left: width - 80,
    zIndex: 2,
  },
  planetSvg: {
    // Removed shadows for subtle outline approach
  },
  // Rockets
  rocket1: {
    position: 'absolute',
    top: 180,
    left: 100,
    zIndex: 3,
  },
  rocket2: {
    position: 'absolute',
    top: 380,
    left: width - 150,
    zIndex: 3,
  },
  rocket3: {
    position: 'absolute',
    top: 550,
    left: 40,
    zIndex: 3,
  },
  rocketSvg: {
    // Removed shadows for subtle outline approach
  },
  // Moons
  moon1: {
    position: 'absolute',
    top: 220,
    left: width - 60,
    zIndex: 2,
  },
  moon2: {
    position: 'absolute',
    top: 420,
    left: 80,
    zIndex: 2,
  },
  moonSvg: {
    // Removed shadows for subtle outline approach
  },
  // Nebulae
  nebula1: {
    position: 'absolute',
    top: 50,
    left: -50,
    zIndex: 1,
  },
  nebula2: {
    position: 'absolute',
    top: 200,
    left: width - 100,
    zIndex: 1,
  },
  nebula3: {
    position: 'absolute',
    top: 400,
    left: -30,
    zIndex: 1,
  },
  nebulaSvg: {
    // Removed shadows for subtle outline approach
  },
  // Static Stars - Very subtle
  staticStar1: {
    position: 'absolute',
    top: 60,
    left: 120,
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: 'rgba(180, 180, 180, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(160, 160, 160, 0.2)',
  },
  staticStar2: {
    position: 'absolute',
    top: 140,
    left: 200,
    width: 0.5,
    height: 0.5,
    borderRadius: 0.25,
    backgroundColor: 'rgba(150, 170, 190, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(130, 150, 170, 0.15)',
  },
  staticStar3: {
    position: 'absolute',
    top: 280,
    left: 150,
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: 'rgba(170, 160, 140, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(150, 140, 120, 0.15)',
  },
  staticStar4: {
    position: 'absolute',
    top: 160,
    left: 300,
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: 'rgba(160, 130, 140, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(140, 110, 120, 0.15)',
  },
  staticStar5: {
    position: 'absolute',
    top: 320,
    left: 250,
    width: 0.5,
    height: 0.5,
    borderRadius: 0.25,
    backgroundColor: 'rgba(140, 160, 140, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(120, 140, 120, 0.15)',
  },
  staticStar6: {
    position: 'absolute',
    top: 480,
    left: 180,
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: 'rgba(160, 140, 120, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(140, 120, 100, 0.15)',
  },
  staticStar7: {
    position: 'absolute',
    top: 90,
    left: 350,
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: 'rgba(180, 180, 180, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(160, 160, 160, 0.18)',
  },
  staticStar8: {
    position: 'absolute',
    top: 240,
    left: 320,
    width: 0.5,
    height: 0.5,
    borderRadius: 0.25,
    backgroundColor: 'rgba(150, 130, 150, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(130, 110, 130, 0.15)',
  },
  staticStar9: {
    position: 'absolute',
    top: 380,
    left: 280,
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: 'rgba(160, 155, 140, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(140, 135, 120, 0.15)',
  },
  staticStar10: {
    position: 'absolute',
    top: 520,
    left: 220,
    width: 0.5,
    height: 0.5,
    borderRadius: 0.25,
    backgroundColor: 'rgba(150, 130, 140, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(130, 110, 120, 0.15)',
  },
  staticStar11: {
    position: 'absolute',
    top: 70,
    left: 400,
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: 'rgba(180, 180, 180, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(160, 160, 160, 0.18)',
  },
  staticStar12: {
    position: 'absolute',
    top: 190,
    left: 450,
    width: 0.5,
    height: 0.5,
    borderRadius: 0.25,
    backgroundColor: 'rgba(150, 170, 190, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(130, 150, 170, 0.15)',
  },
  staticStar13: {
    position: 'absolute',
    top: 330,
    left: 420,
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: 'rgba(170, 160, 140, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(150, 140, 120, 0.15)',
  },
  staticStar14: {
    position: 'absolute',
    top: 470,
    left: 380,
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: 'rgba(160, 130, 140, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(140, 110, 120, 0.15)',
  },
  staticStar15: {
    position: 'absolute',
    top: 110,
    left: 500,
    width: 0.5,
    height: 0.5,
    borderRadius: 0.25,
    backgroundColor: 'rgba(140, 160, 140, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(120, 140, 120, 0.15)',
  },
  staticStar16: {
    position: 'absolute',
    top: 260,
    left: 480,
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: 'rgba(160, 140, 120, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(140, 120, 100, 0.15)',
  },
  staticStar17: {
    position: 'absolute',
    top: 400,
    left: 460,
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: 'rgba(180, 180, 180, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(160, 160, 160, 0.18)',
  },
  staticStar18: {
    position: 'absolute',
    top: 540,
    left: 440,
    width: 0.5,
    height: 0.5,
    borderRadius: 0.25,
    backgroundColor: 'rgba(150, 130, 150, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(130, 110, 130, 0.15)',
  },
  staticStar19: {
    position: 'absolute',
    top: 130,
    left: 520,
    width: 1,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: 'rgba(160, 155, 140, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(140, 135, 120, 0.15)',
  },
  staticStar20: {
    position: 'absolute',
    top: 290,
    left: 540,
    width: 0.5,
    height: 0.5,
    borderRadius: 0.25,
    backgroundColor: 'rgba(150, 130, 140, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(130, 110, 120, 0.15)',
  },
  gameHeader: {
    backgroundColor: 'rgba(10,10,10,0.95)',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    zIndex: 20,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    minWidth: 120,
    textAlign: 'left',
  },
  livesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    minWidth: 60,
    textAlign: 'center',
  },
  waveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    minWidth: 60,
    textAlign: 'right',
  },
  gameArea: {
    flex: 1,
    overflow: 'hidden', // Hard-coded: Clip any content that goes beyond bounds
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  meteor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80, // Increased to accommodate text labels
    zIndex: 15,
    pointerEvents: 'none', // Prevent meteors from blocking touch events
  },
  meteorText: {
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    flexWrap: 'nowrap',
  },
  inputArea: {
    backgroundColor: 'rgba(10,10,10,0.95)',
    padding: 25,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    minHeight: 160,
    zIndex: 30, // Higher than meteors to ensure touch events work
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    color: '#ffffff',
    width: '100%',
    textAlign: 'center',
    zIndex: 35, // Highest z-index to ensure touch events work
  },
  // Game Over Screen Styles - Clean and Professional
  gameOverBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  gameOverHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameOverSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  gameOverStats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 50,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  gameOverActions: {
    width: '100%',
    gap: 16,
  },
  playAgainButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAgainButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  returnButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  returnButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94a3b8',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6466E9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  exitButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
});

export default GravityGame;
