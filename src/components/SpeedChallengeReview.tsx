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

interface SpeedChallengeReviewProps {
  visible: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  gameResults: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    timeLimit: number;
    accuracy: number;
    averageTimePerQuestion: number;
    questions: Array<{
      question: string;
      correctAnswer: string;
      userAnswer: string;
      isCorrect: boolean;
      timeSpent: number;
    }>;
  };
}

const SpeedChallengeReview: React.FC<SpeedChallengeReviewProps> = ({
  visible,
  onClose,
  onPlayAgain,
  gameResults,
}) => {
  const { score, totalQuestions, correctAnswers, timeSpent, timeLimit, accuracy, averageTimePerQuestion, questions } = gameResults;

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
    if (score >= 90) return 'Speed Demon! ⚡';
    if (score >= 80) return 'Lightning Fast! ⚡';
    if (score >= 70) return 'Good speed! 🏃';
    if (score >= 60) return 'Not bad! 💪';
    return 'Keep practicing! 📚';
  };

  const getTimeEfficiency = () => {
    const efficiency = Math.round(((timeLimit - timeSpent) / timeLimit) * 100);
    if (efficiency >= 50) return { color: '#10b981', text: 'Excellent' };
    if (efficiency >= 25) return { color: '#f59e0b', text: 'Good' };
    if (efficiency >= 0) return { color: '#ef4444', text: 'Fair' };
    return { color: '#dc2626', text: 'Over Time' };
  };

  const timeEfficiency = getTimeEfficiency();

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
          <Text style={styles.title}>Speed Challenge Results</Text>
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
                <Text style={styles.statValue}>{correctAnswers}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
                <Text style={styles.statValue}>{totalQuestions - correctAnswers}</Text>
                <Text style={styles.statLabel}>Incorrect</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={24} color="#6366f1" />
                <Text style={styles.statValue}>{formatTime(timeSpent)}</Text>
                <Text style={styles.statLabel}>Time Used</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="hourglass" size={24} color="#8b5cf6" />
                <Text style={styles.statValue}>{formatTime(timeLimit)}</Text>
                <Text style={styles.statLabel}>Time Limit</Text>
              </View>
            </View>

            <View style={styles.efficiencyCard}>
              <View style={styles.efficiencyHeader}>
                <Ionicons name="speedometer" size={20} color={timeEfficiency.color} />
                <Text style={styles.efficiencyTitle}>Time Efficiency</Text>
              </View>
              <Text style={[styles.efficiencyValue, { color: timeEfficiency.color }]}>
                {timeEfficiency.text}
              </Text>
              <Text style={styles.efficiencyDescription}>
                Average: {averageTimePerQuestion.toFixed(1)}s per question
              </Text>
            </View>
          </View>

          {/* Question Review */}
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Question Review</Text>
            
            {questions.map((question, index) => (
              <View key={index} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Q{index + 1}</Text>
                  <View style={styles.questionStats}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: question.isCorrect ? '#dcfce7' : '#fef2f2' }
                    ]}>
                      <Ionicons 
                        name={question.isCorrect ? 'checkmark' : 'close'} 
                        size={14} 
                        color={question.isCorrect ? '#16a34a' : '#dc2626'} 
                      />
                    </View>
                    <Text style={styles.timeText}>
                      {question.timeSpent.toFixed(1)}s
                    </Text>
                  </View>
                </View>
                
                <View style={styles.questionContent}>
                  <Text style={styles.questionText}>{question.question}</Text>
                  <View style={styles.answerSection}>
                    <View style={styles.correctAnswer}>
                      <Text style={styles.answerLabel}>Correct Answer:</Text>
                      <Text style={styles.answerText}>{question.correctAnswer}</Text>
                    </View>
                    {!question.isCorrect && (
                      <View style={styles.userAnswer}>
                        <Text style={styles.answerLabel}>Your Answer:</Text>
                        <Text style={styles.answerText}>{question.userAnswer}</Text>
                      </View>
                    )}
                  </View>
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
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  questionStats: {
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
  questionContent: {
    marginTop: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 12,
  },
  answerSection: {
    gap: 8,
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

export default SpeedChallengeReview;
