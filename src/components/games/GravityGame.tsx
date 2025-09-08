import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Meteor {
  id: string;
  text: string;
  correctAnswer: string;
  fallSpeed: number;
  x: number;
  y: number;
  destroyed: boolean;
  hitPlanet: boolean;
}

interface GravityGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (score: number) => void;
}

const { width, height } = Dimensions.get('window');

const GravityGame: React.FC<GravityGameProps> = ({ gameData, onClose, onGameComplete }) => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [currentMeteorIndex, setCurrentMeteorIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameTime, setGameTime] = useState(0);

  // Use ref to capture final score and prevent multiple calls
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const meteorSpawnRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimeRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const planetScale = useRef(new Animated.Value(1)).current;
  const planetShake = useRef(new Animated.Value(0)).current;

  // Game settings
  const gravitySpeed = gameData.setupOptions?.gravitySpeed || 1.0;
  const difficulty = gameData.setupOptions?.difficulty || 'medium';
  const meteorCount = gameData.setupOptions?.meteorCount || 30;

  useEffect(() => {
    if ((gameComplete || gameOver) && !completionCalledRef.current) {
      console.log('🪐 Planet Defense calling onGameComplete with:', {
        score: finalScoreRef.current,
        meteorsDestroyed: score
      });
      completionCalledRef.current = true;
      onGameComplete(finalScoreRef.current);
    }
  }, [gameComplete, gameOver]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver && !gameComplete) {
      gameLoopRef.current = setInterval(() => {
        updateMeteors();
      }, 16); // ~60 FPS

      gameTimeRef.current = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (gameTimeRef.current) clearInterval(gameTimeRef.current);
    };
  }, [gameStarted, gameOver, gameComplete]);

  // Meteor spawning
  useEffect(() => {
    if (gameStarted && currentMeteorIndex < meteorCount && !gameOver && !gameComplete) {
      const meteorData = gameData.questions[currentMeteorIndex];
      const spawnDelay = meteorData.spawnDelay || (2000 + Math.random() * 2000);

      meteorSpawnRef.current = setTimeout(() => {
        spawnMeteor(meteorData);
        setCurrentMeteorIndex(prev => prev + 1);
      }, spawnDelay);
    }

    return () => {
      if (meteorSpawnRef.current) clearTimeout(meteorSpawnRef.current);
    };
  }, [gameStarted, currentMeteorIndex, meteorCount, gameOver, gameComplete]);

  // Check for game completion
  useEffect(() => {
    if (currentMeteorIndex >= meteorCount && meteors.length === 0 && !gameComplete && !gameOver) {
      finalScoreRef.current = score;
      setGameComplete(true);
    }
  }, [currentMeteorIndex, meteorCount, meteors.length, gameComplete, gameOver, score]);

  const spawnMeteor = (meteorData: any) => {
    const newMeteor: Meteor = {
      id: meteorData.meteorId || Math.random().toString(36).substr(2, 9),
      text: meteorData.question,
      correctAnswer: meteorData.correctAnswer,
      fallSpeed: meteorData.fallSpeed || 3,
      x: Math.random() * (width - 100) + 50, // Random x position
      y: -50, // Start above screen
      destroyed: false,
      hitPlanet: false,
    };

    setMeteors(prev => [...prev, newMeteor]);
  };

  const updateMeteors = () => {
    setMeteors(prev => {
      const updatedMeteors = prev.map(meteor => {
        if (meteor.destroyed || meteor.hitPlanet) return meteor;

        const newY = meteor.y + meteor.fallSpeed;
        
        // Check if meteor hit the planet (bottom of screen)
        if (newY > height - 200) {
          // Meteor hit planet
          animatePlanetHit();
          setLives(prevLives => {
            const newLives = prevLives - 1;
            if (newLives <= 0) {
              finalScoreRef.current = score;
              setTimeout(() => setGameOver(true), 500);
            }
            return newLives;
          });
          
          return { ...meteor, y: newY, hitPlanet: true };
        }

        return { ...meteor, y: newY };
      });

      // Remove meteors that are off screen or destroyed
      return updatedMeteors.filter(meteor => 
        meteor.y < height + 100 && !meteor.destroyed && !meteor.hitPlanet
      );
    });
  };

  const animatePlanetHit = () => {
    Animated.sequence([
      Animated.timing(planetShake, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(planetShake, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(planetShake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animatePlanetDefense = () => {
    Animated.sequence([
      Animated.timing(planetScale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(planetScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleInputSubmit = () => {
    if (!userInput.trim()) return;

    const input = userInput.trim().toLowerCase();
    let meteorDestroyed = false;

    setMeteors(prev => {
      const updatedMeteors = prev.map(meteor => {
        if (meteor.destroyed || meteor.hitPlanet) return meteor;

        const correctAnswer = meteor.correctAnswer.toLowerCase();
        if (input === correctAnswer) {
          meteorDestroyed = true;
          setScore(prevScore => prevScore + 1);
          animatePlanetDefense();
          return { ...meteor, destroyed: true };
        }
        return meteor;
      });

      return updatedMeteors;
    });

    setUserInput('');
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameComplete(false);
    setMeteors([]);
    setCurrentMeteorIndex(0);
    setUserInput('');
    setGameStarted(false);
    setGameTime(0);
    finalScoreRef.current = 0;
    completionCalledRef.current = false;
    
    // Clear any pending timers
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (meteorSpawnRef.current) clearTimeout(meteorSpawnRef.current);
    if (gameTimeRef.current) clearInterval(gameTimeRef.current);
  };

  if (gameComplete) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>🎉 Planet Defense Complete!</Text>
          <Text style={styles.completionSubtitle}>Meteors Destroyed: {score}/{meteorCount}</Text>
          <Text style={styles.completionSubtitle}>Accuracy: {Math.round((score / meteorCount) * 100)}%</Text>
          <Text style={styles.completionSubtitle}>Time: {gameTime}s</Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>
              {Math.round((score / meteorCount) * 100)}%
            </Text>
          </View>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Defend Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>💥 Planet Destroyed!</Text>
          <Text style={styles.completionSubtitle}>Meteors Destroyed: {score}/{meteorCount}</Text>
          <Text style={styles.completionSubtitle}>Final Accuracy: {Math.round((score / meteorCount) * 100)}%</Text>
          <Text style={styles.completionSubtitle}>Survived: {gameTime}s</Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>
              {Math.round((score / meteorCount) * 100)}%
            </Text>
          </View>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!gameStarted) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.startContainer}>
          <Text style={styles.startTitle}>🪐 Planet Defense</Text>
          <Text style={styles.startSubtitle}>Type the correct answers to destroy meteors!</Text>
          <Text style={styles.startInfo}>
            • Meteors will fall from the sky{'\n'}
            • Type the matching answer to destroy them{'\n'}
            • Protect your planet from impact!
          </Text>
          
          <View style={styles.gameStats}>
            <Text style={styles.statText}>Difficulty: {difficulty}</Text>
            <Text style={styles.statText}>Gravity Speed: {gravitySpeed}x</Text>
            <Text style={styles.statText}>Meteors: {meteorCount}</Text>
          </View>
          
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>Start Defense</Text>
            <Ionicons name="play" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.gameContainer} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Game Header */}
      <View style={styles.gameHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.scoreText}>Destroyed: {score}</Text>
          <Text style={styles.livesText}>Lives: {lives}</Text>
          <Text style={styles.timeText}>Time: {gameTime}s</Text>
        </View>
        <Text style={styles.meteorCounter}>
          Wave {currentMeteorIndex + 1} of {meteorCount}
        </Text>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Space Background */}
        <View style={styles.spaceBackground}>
          <View style={styles.star} />
          <View style={[styles.star, styles.star2]} />
          <View style={[styles.star, styles.star3]} />
        </View>

        {/* Meteors */}
        {meteors.map((meteor) => (
          <Animated.View
            key={meteor.id}
            style={[
              styles.meteor,
              {
                left: meteor.x,
                top: meteor.y,
                opacity: meteor.destroyed ? 0 : 1,
                transform: meteor.destroyed ? [{ scale: 0 }] : [{ scale: 1 }],
              },
            ]}
          >
            <View style={styles.meteorBody}>
              <Text style={styles.meteorText}>{meteor.text}</Text>
            </View>
          </Animated.View>
        ))}

        {/* Planet with Animation */}
        <Animated.View 
          style={[
            styles.planet, 
            { 
              transform: [
                { scale: planetScale },
                { translateX: planetShake }
              ] 
            }
          ]}
        >
          <Ionicons name="planet" size={80} color="#3b82f6" />
        </Animated.View>
      </View>

      {/* Input Area */}
      <View style={styles.inputArea}>
        <Text style={styles.inputLabel}>Type the answer:</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={userInput}
            onChangeText={setUserInput}
            onSubmitEditing={handleInputSubmit}
            placeholder="Enter answer..."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleInputSubmit}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  livesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fbbf24',
  },
  meteorCounter: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  spaceBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    top: '20%',
    left: '20%',
  },
  star2: {
    top: '60%',
    left: '80%',
  },
  star3: {
    top: '40%',
    left: '60%',
  },
  meteor: {
    position: 'absolute',
    zIndex: 2,
  },
  meteorBody: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dc2626',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  meteorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  planet: {
    position: 'absolute',
    bottom: 50,
    left: width / 2 - 40,
    zIndex: 3,
  },
  inputArea: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 12,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  startTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  startSubtitle: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  startInfo: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  gameStats: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
  },
  statText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
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
  resetButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default GravityGame;