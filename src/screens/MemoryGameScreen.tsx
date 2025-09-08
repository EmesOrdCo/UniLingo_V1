import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function MemoryGameScreen() {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const navigation = useNavigation();

  // Mock flashcards for the memory game
  const cards = [
    { id: 1, term: 'Myocardial Infarction', definition: 'Heart Attack', matched: false },
    { id: 2, term: 'Entropy', definition: 'Disorder Measure', matched: false },
    { id: 3, term: 'Wave Function', definition: 'Quantum State', matched: false },
    { id: 4, term: 'Photosynthesis', definition: 'Plant Energy', matched: false },
    { id: 5, term: 'Catalyst', definition: 'Reaction Speed', matched: false },
    { id: 6, term: 'Market Capitalization', definition: 'Company Value', matched: false },
  ];

  const handleCardPress = (cardId: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(cardId) || matchedPairs.includes(cardId)) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      // Check for match
      setTimeout(() => {
        if (newFlippedCards.length === 2) {
          setFlippedCards([]);
          // For demo purposes, always mark as matched
          setMatchedPairs([...matchedPairs, ...newFlippedCards]);
        }
      }, 1000);
    }
  };

  const isCardFlipped = (cardId: number) => {
    return flippedCards.includes(cardId) || matchedPairs.includes(cardId);
  };

  const getCardContent = (cardId: number) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return '';
    
    if (flippedCards.includes(cardId)) {
      return Math.random() > 0.5 ? card.term : card.definition;
    }
    return '?';
  };

  const resetGame = () => {
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory Game</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Moves</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pairs Found</Text>
            <Text style={styles.statValue}>{matchedPairs.length / 2}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Pairs</Text>
            <Text style={styles.statValue}>{cards.length}</Text>
          </View>
        </View>

        <View style={styles.gameGrid}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                isCardFlipped(card.id) && styles.cardFlipped,
                matchedPairs.includes(card.id) && styles.cardMatched
              ]}
              onPress={() => handleCardPress(card.id)}
              disabled={matchedPairs.includes(card.id)}
            >
              <Text style={[
                styles.cardText,
                isCardFlipped(card.id) && styles.cardTextFlipped
              ]}>
                {getCardContent(card.id)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
          <Ionicons name="refresh" size={20} color="#ffffff" />
          <Text style={styles.resetButtonText}>Reset Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
  },
  card: {
    width: 80,
    height: 80,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFlipped: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  cardMatched: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardTextFlipped: {
    color: '#6366f1',
    fontSize: 12,
  },
  resetButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
