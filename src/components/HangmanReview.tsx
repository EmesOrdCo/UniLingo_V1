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

interface HangmanReviewProps {
  visible: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  gameResults: {
    score: number;
    totalWords: number;
    correctWords: number;
    timeSpent: number;
    accuracy: number;
    words: Array<{
      word: string;
      hint: string;
      userAnswer: string;
      isCorrect: boolean;
      guessesUsed: number;
    }>;
  };
}

const HangmanReview: React.FC<HangmanReviewProps> = ({
  visible,
  onClose,
  onPlayAgain,
  gameResults,
}) => {
  const { score, totalWords, correctWords, timeSpent, accuracy, words } = gameResults;

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
    if (score >= 90) return 'Hangman Hero! 🎯';
    if (score >= 80) return 'Great guessing! 🎲';
    if (score >= 70) return 'Good job! 👍';
    if (score >= 60) return 'Not bad! 💪';
    return 'Keep practicing! 📚';
  };

  const getGuessesEfficiency = (guessesUsed: number) => {
    const maxGuesses = 6; // Hard-coded maximum guesses
    const efficiency = Math.round(((maxGuesses - guessesUsed) / maxGuesses) * 100);
    if (efficiency >= 70) return { color: '#10b981', text: 'Excellent' };
    if (efficiency >= 50) return { color: '#f59e0b', text: 'Good' };
    if (efficiency >= 30) return { color: '#ef4444', text: 'Fair' };
    return { color: '#dc2626', text: 'Poor' };
  };

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
          <Text style={styles.title}>Hangman Results</Text>
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
                <Text style={styles.statValue}>{correctWords}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
                <Text style={styles.statValue}>{totalWords - correctWords}</Text>
                <Text style={styles.statLabel}>Incorrect</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={24} color="#6366f1" />
                <Text style={styles.statValue}>{formatTime(timeSpent)}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trending-up" size={24} color="#8b5cf6" />
                <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
            </View>
          </View>

          {/* Word Review */}
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Word Review</Text>
            
            {words.map((word, index) => {
              const efficiency = getGuessesEfficiency(word.guessesUsed);
              return (
                <View key={index} style={styles.wordCard}>
                  <View style={styles.wordHeader}>
                    <Text style={styles.wordNumber}>Word {index + 1}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: word.isCorrect ? '#dcfce7' : '#fef2f2' }
                    ]}>
                      <Ionicons 
                        name={word.isCorrect ? 'checkmark' : 'close'} 
                        size={16} 
                        color={word.isCorrect ? '#16a34a' : '#dc2626'} 
                      />
                      <Text style={[
                        styles.statusText,
                        { color: word.isCorrect ? '#16a34a' : '#dc2626' }
                      ]}>
                        {word.isCorrect ? 'Correct' : 'Incorrect'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.wordContent}>
                    <View style={styles.hintSection}>
                      <Text style={styles.hintLabel}>Hint:</Text>
                      <Text style={styles.hintText}>{word.hint}</Text>
                    </View>
                    
                    <View style={styles.answerSection}>
                      <View style={styles.correctAnswer}>
                        <Text style={styles.answerLabel}>Correct Answer:</Text>
                        <Text style={styles.answerText}>{word.word}</Text>
                      </View>
                      {!word.isCorrect && (
                        <View style={styles.userAnswer}>
                          <Text style={styles.answerLabel}>Your Answer:</Text>
                          <Text style={styles.answerText}>{word.userAnswer}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.guessesSection}>
                      <Text style={styles.guessesLabel}>Guesses Used:</Text>
                      <View style={styles.guessesInfo}>
                        <Text style={styles.guessesText}>
                          {word.guessesUsed}/6
                        </Text>
                        <View style={[
                          styles.efficiencyBadge,
                          { backgroundColor: efficiency.color + '20' }
                        ]}>
                          <Text style={[styles.efficiencyText, { color: efficiency.color }]}>
                            {efficiency.text}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
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
  reviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  wordCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  wordContent: {
    marginTop: 8,
  },
  hintSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  hintLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  answerSection: {
    gap: 8,
    marginBottom: 12,
  },
  correctAnswer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  userAnswer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  guessesSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  guessesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  guessesInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guessesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  efficiencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  efficiencyText: {
    fontSize: 12,
    fontWeight: '600',
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
  closeButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HangmanReview;
