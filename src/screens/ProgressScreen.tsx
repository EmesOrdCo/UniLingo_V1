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
import ConsistentHeader from '../components/ConsistentHeader';


export default function ProgressScreen() {


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ConsistentHeader 
        pageName="Progress"
      />
      
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

        {/* Learning Streaks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Streaks</Text>
          <Text style={styles.sectionSubtitle}>Keep up your momentum</Text>
          
          <View style={styles.streaksGrid}>
            <View style={styles.streakCard}>
              <View style={styles.streakIcon}>
                <Ionicons name="flame" size={24} color="#ef4444" />
              </View>
              <Text style={styles.streakNumber}>7</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
            
            <View style={styles.streakCard}>
              <View style={styles.streakIcon}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.streakNumber}>23</Text>
              <Text style={styles.streakLabel}>Total Days</Text>
            </View>
            
            <View style={styles.streakCard}>
              <View style={styles.streakIcon}>
                <Ionicons name="trending-up" size={24} color="#10b981" />
              </View>
              <Text style={styles.streakNumber}>12</Text>
              <Text style={styles.streakLabel}>Best Streak</Text>
            </View>
          </View>
        </View>

        {/* Recent Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <Text style={styles.sectionSubtitle}>Celebrate your milestones</Text>
          
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="star" size={20} color="#f59e0b" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>First Perfect Score</Text>
                <Text style={styles.achievementDesc}>Scored 100% on Medicine quiz</Text>
                <Text style={styles.achievementDate}>2 days ago</Text>
              </View>
            </View>
            
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="bookmark" size={20} color="#3b82f6" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Study Master</Text>
                <Text style={styles.achievementDesc}>Studied for 7 consecutive days</Text>
                <Text style={styles.achievementDate}>1 week ago</Text>
              </View>
            </View>
            
            <View style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>Subject Complete</Text>
                <Text style={styles.achievementDesc}>Finished Engineering course</Text>
                <Text style={styles.achievementDate}>2 weeks ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Study Calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Calendar</Text>
          <Text style={styles.sectionSubtitle}>Your learning activity this month</Text>
          
          <View style={styles.calendarGrid}>
            {Array.from({ length: 30 }, (_, i) => (
              <View key={i} style={[
                styles.calendarDay,
                i < 23 ? styles.studyDay : styles.noStudyDay
              ]}>
                <Text style={styles.calendarDayText}>{i + 1}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.studyDay]} />
              <Text style={styles.legendText}>Study Day</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.noStudyDay]} />
              <Text style={styles.legendText}>No Study</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Profile Modal */}
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summarySection: {
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
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
    fontSize: 32,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.3,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectDetails: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  subjectStatus: {
    fontSize: 12,
    color: '#64748b',
  },
  progressContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  streaksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakIcon: {
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  achievementsList: {
    gap: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 20,
  },
  calendarDay: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyDay: {
    backgroundColor: '#6366f1',
  },
  noStudyDay: {
    backgroundColor: '#f1f5f9',
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
});
