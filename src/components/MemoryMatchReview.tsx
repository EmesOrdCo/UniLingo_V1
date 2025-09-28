import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MemoryMatchReviewProps {
  visible: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  gameResults: {
    score: number;
    totalPairs: number;
    matchedPairs: number;
    timeSpent: number;
    moves: number;
    accuracy: number;
    cards: Array<{
      front: string;
      back: string;
      matched: boolean;
      attempts: number;
    }>;
  };
}

const MemoryMatchReview: React.FC<MemoryMatchReviewProps> = ({
  visible,
  onClose,
  onPlayAgain,
  gameResults,
}) => {
  const { score, totalPairs, matchedPairs, timeSpent, moves, accuracy, cards } = gameResults;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Memory Master! 🧠';
    if (score >= 80) return 'Great memory! 🎯';
    if (score >= 70) return 'Good job! 👍';
    if (score >= 60) return 'Not bad! 💪';
    return 'Keep practicing! 🧩';
  };

  const efficiency = moves > 0 ? Math.round((matchedPairs / moves) * 100) : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.title}>Memory Match Results</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Score Summary */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Text style={[styles.scoreNumber, { color: getScoreColor(score) }]}>
                {score}%
              </Text>
              <Text style={styles.scoreMessage}>
                {getScoreMessage(score)}
              </Text>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.statValue}>{matchedPairs}</Text>
                <Text style={styles.statLabel}>Pairs Matched</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
                <Text style={styles.statValue}>{totalPairs - matchedPairs}</Text>
                <Text style={styles.statLabel}>Pairs Missed</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={24} color="#6366f1" />
                <Text style={styles.statValue}>{formatTime(timeSpent)}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="repeat" size={24} color="#8b5cf6" />
                <Text style={styles.statValue}>{moves}</Text>
                <Text style={styles.statLabel}>Total Moves</Text>
              </View>
            </View>

            <View style={styles.efficiencyCard}>
              <View style={styles.efficiencyHeader}>
                <Ionicons name="trending-up" size={20} color="#10b981" />
                <Text style={styles.efficiencyTitle}>Efficiency</Text>
              </View>
              <Text style={styles.efficiencyValue}>{efficiency}%</Text>
              <Text style={styles.efficiencyDescription}>
                {matchedPairs} pairs matched in {moves} moves
              </Text>
            </View>
          </View>

          {/* Card Review */}
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Card Review</Text>
            
            <View style={styles.cardsGrid}>
              {cards.map((card, index) => (
                <View key={index} style={[
                  styles.cardItem,
                  { backgroundColor: card.matched ? '#f0fdf4' : '#fef2f2' }
                ]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardNumber}>Card {index + 1}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: card.matched ? '#dcfce7' : '#fef2f2' }
                    ]}>
                      <Ionicons 
                        name={card.matched ? 'checkmark' : 'close'} 
                        size={14} 
                        color={card.matched ? '#16a34a' : '#dc2626'} 
                      />
                    </View>
                  </View>
                  
                  <View style={styles.cardContent}>
                    <Text style={styles.cardFront}>{card.front}</Text>
                    <Text style={styles.cardBack}>{card.back}</Text>
                  </View>
                  
                  <Text style={styles.attemptsText}>
                    {card.attempts} attempt{card.attempts !== 1 ? 's' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.playAgainButton} onPress={onPlayAgain}>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  efficiencyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  efficiencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  efficiencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  efficiencyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  efficiencyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  reviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardContent: {
    marginBottom: 8,
  },
  cardFront: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardBack: {
    fontSize: 14,
    color: '#64748b',
  },
  attemptsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  playAgainButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MemoryMatchReview;
