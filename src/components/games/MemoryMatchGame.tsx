import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface MemoryMatchGameProps {
  gameData: any;
  onClose: () => void;
  onGameComplete: (moves: number, time: number) => void;
  onPlayAgain: () => void;
}

const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ gameData, onClose, onGameComplete, onPlayAgain }) => {
  const [cards, setCards] = useState<any[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Use ref to prevent multiple completion calls
  const completionCalledRef = useRef<boolean>(false);

  // Animated values for floating background elements
  const animatedValue1 = useRef(new Animated.Value(0)).current;
  const animatedValue2 = useRef(new Animated.Value(0)).current;
  const animatedValue3 = useRef(new Animated.Value(0)).current;
  const animatedValue4 = useRef(new Animated.Value(0)).current;
  const animatedValue5 = useRef(new Animated.Value(0)).current;
  const animatedValue6 = useRef(new Animated.Value(0)).current;
  const animatedValue7 = useRef(new Animated.Value(0)).current;
  const animatedValue8 = useRef(new Animated.Value(0)).current;
  const animatedValue9 = useRef(new Animated.Value(0)).current;
  const animatedValue10 = useRef(new Animated.Value(0)).current;
  const animatedValue11 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeGame();
    startBackgroundAnimations();
  }, []);

  const startBackgroundAnimations = () => {
    // Create floating animations for different elements
    const createFloatingAnimation = (animatedValue: Animated.Value, duration: number, delay: number = 0) => {
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
        { iterations: -1 } // Infinite loop
      );
    };

    // Start all animations with different timings
    setTimeout(() => {
      createFloatingAnimation(animatedValue1, 3000, 0).start();
    }, 100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue2, 4000, 0).start();
    }, 600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue3, 3500, 0).start();
    }, 1100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue4, 4500, 0).start();
    }, 1600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue5, 3200, 0).start();
    }, 2100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue6, 3800, 0).start();
    }, 2600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue7, 3200, 0).start();
    }, 3100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue8, 4100, 0).start();
    }, 3600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue9, 3600, 0).start();
    }, 4100);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue10, 2900, 0).start();
    }, 4600);
    
    setTimeout(() => {
      createFloatingAnimation(animatedValue11, 4300, 0).start();
    }, 5100);
  };

  // Removed automatic completion call - now handled by user action buttons

  const initializeGame = () => {
    const gameCards = gameData.questions || [];
    const cardsWithIds = gameCards.map((card: any, index: number) => ({
      ...card,
      id: index,
      isFlipped: false,
      isMatched: false,
    }));
    
    // Shuffle cards
    const shuffledCards = cardsWithIds.sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setGameStartTime(Date.now());
  };

  const handleCardPress = (cardId: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(cardId) || matchedPairs.includes(cardId)) {
      return;
    }

    // Light haptic for card flip
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      checkForMatch(newFlippedCards);
    }
  };

  const checkForMatch = (flippedCardIds: number[]) => {
    const [firstId, secondId] = flippedCardIds;
    const firstCard = cards.find(card => card.id === firstId);
    const secondCard = cards.find(card => card.id === secondId);

    if (firstCard && secondCard && firstCard.originalCardId === secondCard.originalCardId) {
      // Match found - haptic success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Match found - cards belong to the same original flashcard
      setMatchedPairs([...matchedPairs, firstId, secondId]);
      setFlippedCards([]);
      
      // Check if game is complete
      if (matchedPairs.length + 2 === cards.length) {
        setIsGameComplete(true);
      }
    } else {
      // No match - haptic error feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // No match, flip cards back after delay
      setTimeout(() => {
        setFlippedCards([]);
      }, 1000);
    }
  };

  const resetGame = () => {
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setIsGameComplete(false);
    initializeGame();
  };

  const handlePlayAgain = () => {
    // Call onGameComplete before closing to log results
    if (!completionCalledRef.current) {
      const timeSpent = Math.round((Date.now() - gameStartTime) / 1000);
      console.log('🎯 MemoryMatch calling onGameComplete with moves:', moves, 'time:', timeSpent);
      completionCalledRef.current = true;
      onGameComplete(moves, timeSpent);
    }
    onPlayAgain();
  };

  const handleReturnToMenu = () => {
    // Call onGameComplete before closing to log results
    if (!completionCalledRef.current) {
      const timeSpent = Math.round((Date.now() - gameStartTime) / 1000);
      console.log('🎯 MemoryMatch calling onGameComplete with moves:', moves, 'time:', timeSpent);
      completionCalledRef.current = true;
      onGameComplete(moves, timeSpent);
    }
    onClose();
  };

  if (isGameComplete) {
    const gameTime = Math.round((Date.now() - gameStartTime) / 1000);
    return (
      <View style={styles.gameContainer}>
        <View style={styles.completionContainer}>
          <View style={styles.completionIcon}>
            <Ionicons name="trophy" size={48} color="#f59e0b" />
          </View>
          <Text style={styles.completionTitle}>Memory Match Complete!</Text>
          <Text style={styles.completionSubtitle}>Excellent work! You've matched all pairs.</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="refresh" size={20} color="#6366f1" />
              </View>
              <Text style={styles.statValue}>{moves}</Text>
              <Text style={styles.statLabel}>Moves</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="time" size={20} color="#059669" />
              </View>
              <Text style={styles.statValue}>{gameTime}s</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.playAgainButton} onPress={handlePlayAgain}>
              <Ionicons name="refresh" size={20} color="#ffffff" />
              <Text style={styles.playAgainButtonText}>Play Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.exitButton} onPress={handleReturnToMenu}>
              <Ionicons name="home" size={20} color="#64748b" />
              <Text style={styles.exitButtonText}>Return to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      {/* Stunning Background Pattern */}
      <View style={styles.backgroundPattern}>
        {/* Large decorative circles */}
        <Animated.View style={[
          styles.decorativeCircle1,
          {
            transform: [
              {
                translateY: animatedValue1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              },
              {
                translateX: animatedValue1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.decorativeCircle2,
          {
            transform: [
              {
                translateY: animatedValue2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 25],
                }),
              },
              {
                translateX: animatedValue2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -12],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.decorativeCircle3,
          {
            transform: [
              {
                translateY: animatedValue3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
              {
                translateX: animatedValue3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.decorativeCircle4,
          {
            transform: [
              {
                translateY: animatedValue4.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 28],
                }),
              },
              {
                translateX: animatedValue4.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -18],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.decorativeCircle5,
          {
            transform: [
              {
                translateY: animatedValue5.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15],
                }),
              },
              {
                translateX: animatedValue5.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 8],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.decorativeCircle6,
          {
            transform: [
              {
                translateY: animatedValue6.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                }),
              },
              {
                translateX: animatedValue6.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]} />
        
        {/* Geometric patterns */}
        <Animated.View style={[
          styles.geometricPattern1,
          {
            transform: [
              {
                translateY: animatedValue7.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -12],
                }),
              },
              {
                translateX: animatedValue7.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 8],
                }),
              },
              {
                rotate: animatedValue7.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.geometricPattern2,
          {
            transform: [
              {
                translateY: animatedValue8.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 15],
                }),
              },
              {
                translateX: animatedValue8.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.geometricPattern3,
          {
            transform: [
              {
                translateY: animatedValue9.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -18],
                }),
              },
              {
                translateX: animatedValue9.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.geometricPattern4,
          {
            transform: [
              {
                translateY: animatedValue10.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
              {
                translateX: animatedValue10.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -6],
                }),
              },
              {
                rotate: animatedValue10.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.geometricPattern5,
          {
            transform: [
              {
                translateY: animatedValue11.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -14],
                }),
              },
              {
                translateX: animatedValue11.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 9],
                }),
              },
            ],
          },
        ]} />
        
        {/* Triangle patterns */}
        <Animated.View style={[
          styles.trianglePattern1,
          {
            transform: [
              {
                translateY: animatedValue7.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 16],
                }),
              },
              {
                translateX: animatedValue7.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.trianglePattern2,
          {
            transform: [
              {
                translateY: animatedValue8.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -12],
                }),
              },
              {
                translateX: animatedValue8.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 7],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.trianglePattern3,
          {
            transform: [
              {
                translateY: animatedValue9.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 14],
                }),
              },
              {
                translateX: animatedValue9.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -9],
                }),
              },
            ],
          },
        ]} />
        
        {/* Additional stunning elements */}
        <Animated.View style={[
          styles.floatingDiamond1,
          {
            transform: [
              {
                translateY: animatedValue1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -22],
                }),
              },
              {
                translateX: animatedValue1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 14],
                }),
              },
              {
                rotate: animatedValue1.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '720deg'],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.floatingDiamond2,
          {
            transform: [
              {
                translateY: animatedValue2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 19],
                }),
              },
              {
                translateX: animatedValue2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -11],
                }),
              },
              {
                rotate: animatedValue2.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-360deg'],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.floatingStar1,
          {
            transform: [
              {
                translateY: animatedValue3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -16],
                }),
              },
              {
                translateX: animatedValue3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 13],
                }),
              },
            ],
          },
        ]} />
        <Animated.View style={[
          styles.floatingStar2,
          {
            transform: [
              {
                translateY: animatedValue4.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 21],
                }),
              },
              {
                translateX: animatedValue4.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -15],
                }),
              },
            ],
          },
        ]} />
        
        {/* Subtle grid pattern */}
        <View style={styles.gridPattern} />
      </View>
      
      {/* Floating Stats */}
      <View style={styles.floatingStatsContainer}>
        <View style={styles.statBox}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="refresh" size={16} color="#6366f1" />
          </View>
            <Text style={styles.movesText}>{moves}</Text>
            <Text style={styles.statLabel}>Moves</Text>
          </View>
        <View style={styles.statBox}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
          </View>
            <Text style={styles.pairsText}>{matchedPairs.length / 2}/{cards.length / 2}</Text>
            <Text style={styles.statLabel}>Pairs</Text>
        </View>
      </View>

      {/* Game Grid */}
      {cards.length === 8 ? (
        <View style={styles.gameGrid8Cards}>
          <View style={styles.row8Cards}>
            {cards.slice(0, 2).map((card) => {
              const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.card,
                    styles.card8Cards,
                    isFlipped && styles.cardFlipped,
                    isMatched && styles.cardMatched,
                  ]}
                  onPress={() => handleCardPress(card.id)}
                  disabled={isMatched}
                >
                  {isFlipped ? (
                    <View style={styles.cardContent}>
                      <Text style={styles.cardText}>{card.question}</Text>
                      {isMatched && (
                        <View style={styles.matchIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.cardBack}>
                      <Ionicons name="help-circle" size={32} color="#6366f1" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.row8Cards}>
            {cards.slice(2, 4).map((card) => {
              const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.card,
                    styles.card8Cards,
                    isFlipped && styles.cardFlipped,
                    isMatched && styles.cardMatched,
                  ]}
                  onPress={() => handleCardPress(card.id)}
                  disabled={isMatched}
                >
                  {isFlipped ? (
                    <View style={styles.cardContent}>
                      <Text style={styles.cardText}>{card.question}</Text>
                      {isMatched && (
                        <View style={styles.matchIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.cardBack}>
                      <Ionicons name="help-circle" size={32} color="#6366f1" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.row8Cards}>
            {cards.slice(4, 6).map((card) => {
              const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.card,
                    styles.card8Cards,
                    isFlipped && styles.cardFlipped,
                    isMatched && styles.cardMatched,
                  ]}
                  onPress={() => handleCardPress(card.id)}
                  disabled={isMatched}
                >
                  {isFlipped ? (
                    <View style={styles.cardContent}>
                      <Text style={styles.cardText}>{card.question}</Text>
                      {isMatched && (
                        <View style={styles.matchIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.cardBack}>
                      <Ionicons name="help-circle" size={32} color="#6366f1" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.row8Cards}>
            {cards.slice(6, 8).map((card) => {
              const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.card,
                    styles.card8Cards,
                    isFlipped && styles.cardFlipped,
                    isMatched && styles.cardMatched,
                  ]}
                  onPress={() => handleCardPress(card.id)}
                  disabled={isMatched}
                >
                  {isFlipped ? (
                    <View style={styles.cardContent}>
                      <Text style={styles.cardText}>{card.question}</Text>
                      {isMatched && (
                        <View style={styles.matchIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.cardBack}>
                      <Ionicons name="help-circle" size={32} color="#6366f1" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : cards.length === 12 ? (
        <View style={styles.gameGrid12Cards}>
          <View style={styles.row12Cards}>
            {cards.slice(0, 3).map((card) => {
              const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.card,
                    styles.card12Cards,
                    isFlipped && styles.cardFlipped,
                    isMatched && styles.cardMatched,
                  ]}
                  onPress={() => handleCardPress(card.id)}
                  disabled={isMatched}
                >
                  {isFlipped ? (
                    <View style={styles.cardContent}>
                      <Text style={styles.cardText}>{card.question}</Text>
                      {isMatched && (
                        <View style={styles.matchIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.cardBack}>
                      <Ionicons name="help-circle" size={32} color="#6366f1" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.row12Cards}>
            {cards.slice(3, 6).map((card) => {
              const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.card,
                    styles.card12Cards,
                    isFlipped && styles.cardFlipped,
                    isMatched && styles.cardMatched,
                  ]}
                  onPress={() => handleCardPress(card.id)}
                  disabled={isMatched}
                >
                  {isFlipped ? (
                    <View style={styles.cardContent}>
                      <Text style={styles.cardText}>{card.question}</Text>
                      {isMatched && (
                        <View style={styles.matchIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.cardBack}>
                      <Ionicons name="help-circle" size={32} color="#6366f1" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.row12Cards}>
            {cards.slice(6, 9).map((card) => {
              const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.card,
                    styles.card12Cards,
                    isFlipped && styles.cardFlipped,
                    isMatched && styles.cardMatched,
                  ]}
                  onPress={() => handleCardPress(card.id)}
                  disabled={isMatched}
                >
                  {isFlipped ? (
                    <View style={styles.cardContent}>
                      <Text style={styles.cardText}>{card.question}</Text>
                      {isMatched && (
                        <View style={styles.matchIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.cardBack}>
                      <Ionicons name="help-circle" size={32} color="#6366f1" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.row12Cards}>
            {cards.slice(9, 12).map((card) => {
              const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.card,
                    styles.card12Cards,
                    isFlipped && styles.cardFlipped,
                    isMatched && styles.cardMatched,
                  ]}
                  onPress={() => handleCardPress(card.id)}
                  disabled={isMatched}
                >
                  {isFlipped ? (
                    <View style={styles.cardContent}>
                      <Text style={styles.cardText}>{card.question}</Text>
                      {isMatched && (
                        <View style={styles.matchIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.cardBack}>
                      <Ionicons name="help-circle" size={32} color="#6366f1" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={[
          styles.gameGrid,
          cards.length === 16 && styles.gameGrid16Cards,
          cards.length === 20 && styles.gameGrid20Cards,
        ]}>
        {cards.map((card) => {
          const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.id);
          const isMatched = matchedPairs.includes(card.id);
          
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                cards.length === 12 && styles.card12Cards,
                cards.length === 16 && styles.card16Cards,
                cards.length === 20 && styles.card20Cards,
                isFlipped && styles.cardFlipped,
                isMatched && styles.cardMatched,
              ]}
              onPress={() => handleCardPress(card.id)}
              disabled={isMatched}
            >
              {isFlipped ? (
                <View style={styles.cardContent}>
                  <Text style={styles.cardText}>{card.question}</Text>
                  {isMatched && (
                    <View style={styles.matchIndicator}>
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.cardBack}>
                  <Ionicons name="help-circle" size={32} color="#6366f1" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: '#e0e7ff',
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  // Large decorative circles for visual interest
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 0,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 0,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: '30%',
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 0,
  },
  decorativeCircle4: {
    position: 'absolute',
    bottom: '20%',
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 0,
  },
  decorativeCircle5: {
    position: 'absolute',
    top: '10%',
    left: '20%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 0,
  },
  decorativeCircle6: {
    position: 'absolute',
    bottom: '40%',
    right: '20%',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 0,
  },
  // Geometric patterns
  geometricPattern1: {
    position: 'absolute',
    top: '15%',
    right: '10%',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '45deg' }],
    borderRadius: 8,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 0,
  },
  geometricPattern2: {
    position: 'absolute',
    bottom: '25%',
    left: '15%',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 0,
  },
  geometricPattern3: {
    position: 'absolute',
    top: '60%',
    left: '5%',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 0,
  },
  geometricPattern4: {
    position: 'absolute',
    top: '45%',
    right: '5%',
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transform: [{ rotate: '30deg' }],
    borderRadius: 6,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 0,
  },
  geometricPattern5: {
    position: 'absolute',
    bottom: '15%',
    left: '25%',
    width: 70,
    height: 70,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 0,
  },
  // Triangle patterns
  trianglePattern1: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 25,
    borderRightWidth: 25,
    borderBottomWidth: 45,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(99, 102, 241, 0.12)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 0,
  },
  trianglePattern2: {
    position: 'absolute',
    bottom: '30%',
    right: '15%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ rotate: '180deg' }],
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 0,
  },
  trianglePattern3: {
    position: 'absolute',
    top: '70%',
    right: '25%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
    transform: [{ rotate: '60deg' }],
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 0,
  },
  // Additional stunning floating elements
  floatingDiamond1: {
    position: 'absolute',
    top: '35%',
    right: '30%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(99, 102, 241, 0.15)',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 0,
  },
  floatingDiamond2: {
    position: 'absolute',
    bottom: '35%',
    left: '30%',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 0,
  },
  floatingStar1: {
    position: 'absolute',
    top: '55%',
    left: '40%',
    width: 30,
    height: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderRadius: 15,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 0,
  },
  floatingStar2: {
    position: 'absolute',
    bottom: '45%',
    right: '40%',
    width: 25,
    height: 25,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderRadius: 12.5,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 0,
  },
  // Subtle grid pattern
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    // Create a subtle grid effect using border
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.03)',
    // Add some subtle dots pattern
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 0,
  },
  // Floating stats boxes
  floatingStatsContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 100,
    height: 40,
  },
  statIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  movesText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(99, 102, 241, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pairsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(5, 150, 105, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gameGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 80,
  },
  card: {
    width: 75,
    height: 75,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardFlipped: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
    shadowColor: '#6366f1',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    transform: [{ scale: 1.05 }],
    elevation: 8,
  },
  cardMatched: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
    shadowColor: '#059669',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 7,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    position: 'relative',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  cardBack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  completionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 48,
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  playAgainButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  playAgainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  exitButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  // Specific styles for different card counts
  gameGrid8Cards: {
    flex: 1,
    width: 252,
    alignSelf: 'center',
    padding: 16,
    paddingTop: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row8Cards: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  card8Cards: {
    width: 120,
    height: 120,
    borderRadius: 20,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    shadowRadius: 12,
    shadowOpacity: 0.2,
    elevation: 6,
    flexBasis: 120,
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 120,
    maxWidth: 120,
  },
  gameGrid12Cards: {
    flex: 1,
    width: 320,
    alignSelf: 'center',
    padding: 16,
    paddingTop: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row12Cards: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  card12Cards: {
    width: 90,
    height: 90,
    borderRadius: 18,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    shadowRadius: 10,
    shadowOpacity: 0.18,
    elevation: 5,
    flexBasis: 90,
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 90,
    maxWidth: 90,
  },
  gameGrid16Cards: {
    width: 400,
    alignSelf: 'center',
    gap: 8,
  },
  card16Cards: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    shadowRadius: 8,
    shadowOpacity: 0.15,
    elevation: 4,
  },
  gameGrid20Cards: {
    width: 400,
    alignSelf: 'center',
    gap: 6,
  },
  card20Cards: {
    width: 70,
    height: 70,
    borderRadius: 14,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    shadowRadius: 6,
    shadowOpacity: 0.12,
    elevation: 3,
  },
});

export default MemoryMatchGame;
