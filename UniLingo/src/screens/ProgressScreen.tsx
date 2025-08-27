import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Progress Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>This Week</Text>
              <Ionicons name="calendar" size={20} color="#6366f1" />
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryNumber}>127</Text>
                <Text style={styles.summaryLabel}>Cards Studied</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryNumber}>89%</Text>
                <Text style={styles.summaryLabel}>Accuracy</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryNumber}>45</Text>
                <Text style={styles.summaryLabel}>Minutes</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subject Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Progress</Text>
          <Text style={styles.sectionSubtitle}>Your learning across different topics</Text>
          
          <View style={styles.subjectsList}>
            <View style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <View style={[styles.subjectIcon, { backgroundColor: '#ef4444' }]}>
                  <Ionicons name="medical" size={20} color="#ffffff" />
                </View>
                <View style={styles.subjectDetails}>
                  <Text style={styles.subjectName}>Medicine</Text>
                  <Text style={styles.subjectStatus}>In Progress</Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '75%' }]} />
                </View>
                <Text style={styles.progressText}>75%</Text>
              </View>
            </View>
            
            <View style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <View style={[styles.subjectIcon, { backgroundColor: '#3b82f6' }]}>
                  <Ionicons name="construct" size={20} color="#ffffff" />
                </View>
                <View style={styles.subjectDetails}>
                  <Text style={styles.subjectName}>Engineering</Text>
                  <Text style={styles.subjectStatus}>Completed</Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '100%' }]} />
                </View>
                <Text style={styles.progressText}>100%</Text>
              </View>
            </View>
            
            <View style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <View style={[styles.subjectIcon, { backgroundColor: '#8b5cf6' }]}>
                  <Ionicons name="flash" size={20} color="#ffffff" />
                </View>
                <View style={styles.subjectDetails}>
                  <Text style={styles.subjectName}>Physics</Text>
                  <Text style={styles.subjectStatus}>Not Started</Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '0%' }]} />
                </View>
                <Text style={styles.progressText}>0%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Learning Streak */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Streak</Text>
          <Text style={styles.sectionSubtitle}>Keep the momentum going!</Text>
          
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <Ionicons name="flame" size={32} color="#f59e0b" />
              <Text style={styles.streakNumber}>7</Text>
              <Text style={styles.streakLabel}>Days</Text>
            </View>
            <Text style={styles.streakDescription}>
              You're on fire! Keep studying daily to maintain your streak.
            </Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.sectionSubtitle}>Your latest learning sessions</Text>
          
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="book" size={20} color="#10b981" />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Studied Medical Terms</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
              <Text style={styles.activityScore}>85%</Text>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="document-text" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Flashcard Review</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
              <Text style={styles.activityScore}>92%</Text>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="game-controller" size={20} color="#f59e0b" />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Memory Game</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
              <Text style={styles.activityScore}>78%</Text>
            </View>
          </View>
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Goals</Text>
          <Text style={styles.sectionSubtitle}>Set targets to stay motivated</Text>
          
          <View style={styles.goalsList}>
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>Daily Study Time</Text>
                <Text style={styles.goalProgress}>30/60 min</Text>
              </View>
              <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: '50%' }]} />
              </View>
            </View>
            
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>Weekly Cards</Text>
                <Text style={styles.goalProgress}>45/100 cards</Text>
              </View>
              <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: '45%' }]} />
              </View>
            </View>
            
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>Accuracy Target</Text>
                <Text style={styles.goalProgress}>89/90%</Text>
              </View>
              <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: '98%' }]} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summarySection: {
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginRight: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  subjectsList: {
    gap: 16,
  },
  subjectRow: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subjectDetails: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  subjectStatus: {
    fontSize: 14,
    color: '#64748b',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: 80,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  streakCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginHorizontal: 8,
  },
  streakLabel: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '600',
  },
  streakDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#64748b',
  },
  activityScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  goalsList: {
    gap: 16,
  },
  goalItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  goalProgress: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
});
