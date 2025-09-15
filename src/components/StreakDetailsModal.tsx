import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { HolisticProgressService } from '../lib/holisticProgressService';

interface StreakDetailsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface StreakInfo {
  daily_study?: { current_streak: number; longest_streak: number };
}

export default function StreakDetailsModal({ visible, onClose }: StreakDetailsModalProps) {
  const { user } = useAuth();
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && user?.id) {
      loadStreakInfo();
    }
  }, [visible, user?.id]);

  const loadStreakInfo = async () => {
    try {
      setLoading(true);
      const dailyStreak = await HolisticProgressService.getCurrentStreak(user!.id, 'daily_study');

      setStreakInfo({
        daily_study: dailyStreak || { current_streak: 0, longest_streak: 0 },
      });
    } catch (error) {
      console.error('Error loading streak info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 21) return '🔥🔥';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '💪';
    if (streak >= 1) return '🌟';
    return '🌱';
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return 'Unstoppable! You\'re a learning machine!';
    if (streak >= 21) return 'Incredible dedication! You\'re building amazing habits!';
    if (streak >= 14) return 'Fantastic! You\'re on fire!';
    if (streak >= 7) return 'Great job! You\'re building momentum!';
    if (streak >= 3) return 'Good start! Keep going!';
    if (streak >= 1) return 'You\'re getting started!';
    return 'Ready to begin your learning journey!';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔥 Streak Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading streak information...</Text>
              </View>
            ) : (
              <>
                {/* Daily Study Streak */}
                <View style={styles.streakCard}>
                  <View style={styles.streakHeader}>
                    <Ionicons name="calendar" size={24} color="#6366f1" />
                    <Text style={styles.streakTitle}>Daily Study Streak</Text>
                  </View>
                  <View style={styles.streakStats}>
                    <View style={styles.streakStat}>
                      <Text style={styles.streakNumber}>
                        {streakInfo.daily_study?.current_streak || 0}
                      </Text>
                      <Text style={styles.streakLabel}>Current</Text>
                    </View>
                    <View style={styles.streakStat}>
                      <Text style={styles.streakNumber}>
                        {streakInfo.daily_study?.longest_streak || 0}
                      </Text>
                      <Text style={styles.streakLabel}>Best</Text>
                    </View>
                  </View>
                  <Text style={styles.streakMessage}>
                    {getStreakEmoji(streakInfo.daily_study?.current_streak || 0)} {' '}
                    {getStreakMessage(streakInfo.daily_study?.current_streak || 0)}
                  </Text>
                </View>


              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  streakCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  streakStat: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  streakMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
  },
});
