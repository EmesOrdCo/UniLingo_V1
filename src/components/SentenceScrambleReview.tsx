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

interface SentenceScrambleReviewProps {
  visible: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  gameResults: {
    score: number;
    totalSentences: number;
    correctSentences: number;
    timeSpent: number;
    accuracy: number;
    sentences: Array<{
      scrambled: string[];
      correct: string;
      userAnswer: string;
      isCorrect: boolean;
      attempts: number;
    }>;
  };
}

const SentenceScrambleReview: React.FC<SentenceScrambleReviewProps> = ({
  visible,
  onClose,
  onPlayAgain,
  gameResults,
}) => {
  const { score, totalSentences, correctSentences, timeSpent, accuracy, sentences } = gameResults;

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
    if (score >= 90) return 'Sentence Master! 📝';
    if (score >= 80) return 'Great sentence building! 🎯';
    if (score >= 70) return 'Good job! 👍';
    if (score >= 60) return 'Not bad! 💪';
    return 'Keep practicing! 📚';
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
          <Text style={styles.title}>Sentence Scramble Results</Text>
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
                <Text style={styles.statValue}>{correctSentences}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
                <Text style={styles.statValue}>{totalSentences - correctSentences}</Text>
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

          {/* Sentence Review */}
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Sentence Review</Text>
            
            {sentences.map((sentence, index) => (
              <View key={index} style={styles.sentenceCard}>
                <View style={styles.sentenceHeader}>
                  <Text style={styles.sentenceNumber}>Sentence {index + 1}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: sentence.isCorrect ? '#dcfce7' : '#fef2f2' }
                  ]}>
                    <Ionicons 
                      name={sentence.isCorrect ? 'checkmark' : 'close'} 
                      size={16} 
                      color={sentence.isCorrect ? '#16a34a' : '#dc2626'} 
                    />
                    <Text style={[
                      styles.statusText,
                      { color: sentence.isCorrect ? '#16a34a' : '#dc2626' }
                    ]}>
                      {sentence.isCorrect ? 'Correct' : 'Incorrect'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.sentenceContent}>
                  <View style={styles.scrambledSection}>
                    <Text style={styles.scrambledLabel}>Scrambled Words:</Text>
                    <View style={styles.scrambledWords}>
                      {sentence.scrambled.map((word, wordIndex) => (
                        <View key={wordIndex} style={styles.scrambledWord}>
                          <Text style={styles.scrambledWordText}>{word}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.answerSection}>
                    <View style={styles.correctAnswer}>
                      <Text style={styles.answerLabel}>Correct Answer:</Text>
                      <Text style={styles.answerText}>{sentence.correct}</Text>
                    </View>
                    {!sentence.isCorrect && (
                      <View style={styles.userAnswer}>
                        <Text style={styles.answerLabel}>Your Answer:</Text>
                        <Text style={styles.answerText}>{sentence.userAnswer}</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.attemptsText}>
                    {sentence.attempts} attempt{sentence.attempts !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            ))}
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
  sentenceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sentenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sentenceNumber: {
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
  sentenceContent: {
    marginTop: 8,
  },
  scrambledSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  scrambledLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  scrambledWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scrambledWord: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scrambledWordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  answerSection: {
    gap: 8,
    marginBottom: 8,
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

export default SentenceScrambleReview;
