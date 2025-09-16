import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [userInput, setUserInput] = useState('');
  const [meteors, setMeteors] = useState<any[]>([]);
  const [currentWave, setCurrentWave] = useState(1);
  const [gameSpeed, setGameSpeed] = useState(3000); // Initial meteor spawn interval
  const [meteorSpeed, setMeteorSpeed] = useState(2); // Initial meteor fall speed

  // Use ref to capture final score and prevent multiple calls
  const finalScoreRef = useRef<number>(0);
  const completionCalledRef = useRef<boolean>(false);
  const meteorSpawnInterval = useRef<NodeJS.Timeout | null>(null);
  const meteorMoveInterval = useRef<NodeJS.Timeout | null>(null);
  const gameStartTime = useRef<number>(Date.now());

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
    return () => {
      if (meteorSpawnInterval.current) clearInterval(meteorSpawnInterval.current);
      if (meteorMoveInterval.current) clearInterval(meteorMoveInterval.current);
    };
  }, []);

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
        x: Math.random() * (width - 100) + 50, // Random x position
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
        const maxY = height - 250; // Hard-coded maximum Y position
        
        return {
          ...meteor,
          y: Math.min(newY, maxY) // Hard-coded: Cap the Y position
        };
      });

      // Hard-coded: Check for meteors that hit the planet (much earlier collision)
      const hitMeteors = updatedMeteors.filter(meteor => meteor.y >= height - 250 && !meteor.destroyed);
      
      if (hitMeteors.length > 0) {
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
      return updatedMeteors.filter(meteor => meteor.y < height - 250 && !meteor.destroyed);
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
          setScore(score + 1);
          
          // Increase difficulty every 5 meteors destroyed
          if ((score + 1) % 5 === 0) {
            setCurrentWave(prev => prev + 1);
            setGameSpeed(prev => Math.max(1000, prev - 200)); // Faster spawning
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
    setLives(3);
    setGameOver(false);
    setGameComplete(false);
    setUserInput('');
    setMeteors([]);
    setCurrentWave(1);
    setGameSpeed(3000);
    setMeteorSpeed(2);
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

  if (gameComplete) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>🎉 Planet Defence Complete!</Text>
          <Text style={styles.completionSubtitle}>Great job defending the planet!</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Meteors Destroyed</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Wave Reached</Text>
              <Text style={styles.statValue}>{currentWave}</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Text style={styles.resetButtonText}>Play Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.exitButton} onPress={handleReturnToMenu}>
              <Text style={styles.exitButtonText}>Return to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>💥 Planet Destroyed!</Text>
          <Text style={styles.completionSubtitle}>The meteors got through!</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Meteors Destroyed</Text>
              <Text style={styles.statValue}>{score}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Wave Reached</Text>
              <Text style={styles.statValue}>{currentWave}</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Text style={styles.resetButtonText}>Play Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.exitButton} onPress={handleReturnToMenu}>
              <Text style={styles.exitButtonText}>Return to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      {/* Game Header */}
      <View style={styles.gameHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.scoreText}>Meteors Destroyed: {score}</Text>
          <Text style={styles.livesText}>Lives: {lives}</Text>
          <Text style={styles.waveText}>Wave: {currentWave}</Text>
        </View>
      </View>

      {/* Game Area - Only for meteors and planet */}
      <View style={styles.gameArea}>
        {/* Meteors */}
        {meteors.map((meteor) => (
          <View
            key={meteor.id}
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
            <Text style={styles.meteorText}>{meteor.question}</Text>
          </View>
        ))}

        {/* Planet at bottom */}
        <View style={styles.planet}>
          <Ionicons name="planet" size={100} color="#3b82f6" />
          <Text style={styles.planetText}>EARTH</Text>
        </View>
      </View>

      {/* Input Area - Completely separate from game area */}
      <View style={styles.inputArea}>
        <Text style={styles.instructionText}>
          Type the correct answer to destroy meteors!
        </Text>
        <TextInput
          style={styles.textInput}
          value={userInput}
          onChangeText={setUserInput}
          onSubmitEditing={handleInputSubmit}
          placeholder="Type your answer..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleInputSubmit}>
          <Text style={styles.submitButtonText}>DESTROY!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gameHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  waveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    paddingTop: 80, // Space for fixed header
    overflow: 'hidden', // Hard-coded: Clip any content that goes beyond bounds
  },
  meteor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80, // Increased to accommodate text labels
  },
  meteorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  planet: {
    position: 'absolute',
    top: '50%', // Center vertically
    left: width / 2 - 50, // Center horizontally
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -50 }], // Adjust for perfect centering
  },
  planetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
    marginTop: 4,
  },
  inputArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(15,23,42,0.95)',
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
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
    marginBottom: 15,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
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
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6466E9',
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
});

export default GravityGame;
