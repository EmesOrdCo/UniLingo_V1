import React, { useState, useEffect } from 'react';
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
          <Text style={styles.completionTitle}>🎉 Memory Match Complete!</Text>
          <Text style={styles.completionSubtitle}>Great job!</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Moves</Text>
              <Text style={styles.statValue}>{moves}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{gameTime}s</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={handlePlayAgain}>
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
          <Text style={styles.movesText}>Moves: {moves}</Text>
          <Text style={styles.pairsText}>Pairs: {matchedPairs.length / 2}/{cards.length / 2}</Text>
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
                </View>
              ) : (
                <View style={styles.cardBack}>
                  <Ionicons name="help-circle" size={32} color="#94a3b8" />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 20,
  },
  movesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  pairsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6466E9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  gameGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 80,
    height: 80,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardFlipped: {
    borderColor: '#6466E9',
    backgroundColor: '#f0f4ff',
  },
  cardMatched: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  cardBack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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

export default MemoryMatchGame;
