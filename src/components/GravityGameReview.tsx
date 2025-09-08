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

interface GravityGameReviewProps {
  visible: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  gameResults: {
    score: number;
    totalWords: number;
    correctWords: number;
    timeSpent: number;
    accuracy: number;
    gravitySpeed: number;
    words: Array<{
      word: string;
      correctAnswer: string;
      userAnswer: string;
      isCorrect: boolean;
      attempts: number;
      timeToAnswer: number;
    }>;
  };
}

const GravityGameReview: React.FC<GravityGameReviewProps> = ({
  visible,
  onClose,
  onPlayAgain,
  gameResults,
}) => {
  const { score, totalWords, correctWords, timeSpent, accuracy, gravitySpeed, words } = gameResults;

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
    if (score >= 90) return 'Planet Defender! 🛡️';
    if (score >= 80) return 'Great defense! 🎯';
    if (score >= 70) return 'Good job! 👍';
    if (score >= 60) return 'Not bad! 💪';
    return 'Keep practicing! 📚';
  };

  const getGravityLevel = (speed: number) => {
    if (speed <= 0.8) return { color: '#10b981', text: 'Easy' };
    if (speed <= 1.0) return { color: '#f59e0b', text: 'Normal' };
    if (speed <= 1.2) return { color: '#ef4444', text: 'Hard' };
    return { color: '#dc2626', text: 'Very Hard' };
  };

  const gravityLevel = getGravityLevel(gravitySpeed);
  const averageTimePerWord = words.length > 0 ? words.reduce((sum, word) => sum + word.timeToAnswer, 0) / words.length : 0;

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
          <Text style={styles.title}>Planet Defense Results</Text>
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
                <Text style={styles.statLabel}>Defended</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
                <Text style={styles.statValue}>{totalWords - correctWords}</Text>
                <Text style={styles.statLabel}>Missed</Text>
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

            <View style={styles.gameSettingsCard}>
              <View style={styles.gameSettingsHeader}>
                <Ionicons name="settings" size={20} color="#6366f1" />
                <Text style={styles.gameSettingsTitle}>Game Settings</Text>
              </View>
              <View style={styles.gameSettingsContent}>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Gravity Speed:</Text>
                  <View style={[
                    styles.settingValue,
                    { backgroundColor: gravityLevel.color + '20' }
                  ]}>
                    <Text style={[styles.settingValueText, { color: gravityLevel.color }]}>
                      {gravityLevel.text} ({gravitySpeed}x)
                    </Text>
                  </View>
                </View>
                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Avg Response Time:</Text>
                  <Text style={styles.settingValueText}>
                    {averageTimePerWord.toFixed(1)}s per word
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Word Review */}
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Defense Review</Text>
            
            {words.map((word, index) => (
              <View key={index} style={styles.wordCard}>
                <View style={styles.wordHeader}>
                  <Text style={styles.wordNumber}>Word {index + 1}</Text>
                  <View style={styles.wordStats}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: word.isCorrect ? '#dcfce7' : '#fef2f2' }
                    ]}>
                      <Ionicons 
                        name={word.isCorrect ? 'checkmark' : 'close'} 
                        size={14} 
                        color={word.isCorrect ? '#16a34a' : '#dc2626'} 
                      />
                    </View>
                    <Text style={styles.timeText}>
                      {word.timeToAnswer.toFixed(1)}s
                    </Text>
                  </View>
                </View>
                
                <View style={styles.wordContent}>
                  <View style={styles.questionSection}>
                    <Text style={styles.questionLabel}>Word to Defend:</Text>
                    <Text style={styles.questionText}>{word.word}</Text>
                  </View>
                  
                  <View style={styles.answerSection}>
                    <View style={styles.correctAnswer}>
                      <Text style={styles.answerLabel}>Correct Answer:</Text>
                      <Text style={styles.answerText}>{word.correctAnswer}</Text>
                    </View>
                    {!word.isCorrect && (
                      <View style={styles.userAnswer}>
                        <Text style={styles.answerLabel}>Your Answer:</Text>
                        <Text style={styles.answerText}>{word.userAnswer}</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.attemptsText}>
                    {word.attempts} attempt{word.attempts !== 1 ? 's' : ''}
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
  gameSettingsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  gameSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameSettingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  gameSettingsContent: {
    gap: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  settingValue: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  settingValueText: {
    fontSize: 14,
    fontWeight: '600',
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
  wordStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  wordContent: {
    marginTop: 8,
  },
  questionSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 16,
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

export default GravityGameReview;
