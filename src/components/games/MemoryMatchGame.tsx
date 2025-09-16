import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  useEffect(() => {
    initializeGame();
  }, []);

  // Auto-call onGameComplete when game finishes
  useEffect(() => {
    if (isGameComplete && !completionCalledRef.current) {
      const timeSpent = Math.round((Date.now() - gameStartTime) / 1000);
      const matchedPairsCount = matchedPairs.length / 2; // Each pair has 2 cards
      console.log('🎯 MemoryMatch calling onGameComplete with moves:', moves, 'time:', timeSpent);
      completionCalledRef.current = true;
      onGameComplete(moves, timeSpent);
    }
  }, [isGameComplete, moves, gameStartTime, matchedPairs.length, onGameComplete]);

  const initializeGame = () => {
    const gameCards = gameData.questions || [];
    const cardsWithIds = gameCards.map((card, index) => ({
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
      // Match found - cards belong to the same original flashcard
      setMatchedPairs([...matchedPairs, firstId, secondId]);
      setFlippedCards([]);
      
      // Check if game is complete
      if (matchedPairs.length + 2 === cards.length) {
        setIsGameComplete(true);
      }
    } else {
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
    onPlayAgain();
  };

  const handleReturnToMenu = () => {
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
      {/* Game Header */}
      <View style={styles.gameHeader}>
        <View style={styles.headerInfo}>
          <View style={styles.statContainer}>
            <Ionicons name="refresh" size={18} color="#6366f1" />
            <Text style={styles.movesText}>{moves}</Text>
            <Text style={styles.statLabel}>Moves</Text>
          </View>
          <View style={styles.statContainer}>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <Text style={styles.pairsText}>{matchedPairs.length / 2}/{cards.length / 2}</Text>
            <Text style={styles.statLabel}>Pairs</Text>
          </View>
        </View>
      </View>

      {/* Game Grid */}
      <View style={styles.gameGrid}>
        {cards.map((card) => {
          const isFlipped = flippedCards.includes(card.id) || matchedPairs.includes(card.id);
          const isMatched = matchedPairs.includes(card.id);
          
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
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
                  <Ionicons name="help-circle" size={28} color="#6366f1" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 24,
  },
  statContainer: {
    alignItems: 'center',
    gap: 4,
  },
  movesText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
  },
  pairsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  gameGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 24,
  },
  card: {
    width: 85,
    height: 85,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardFlipped: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
    shadowColor: '#6366f1',
    shadowOpacity: 0.15,
    transform: [{ scale: 1.02 }],
  },
  cardMatched: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
    shadowColor: '#059669',
    shadowOpacity: 0.15,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    position: 'relative',
  },
  cardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 16,
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
});

export default MemoryMatchGame;
