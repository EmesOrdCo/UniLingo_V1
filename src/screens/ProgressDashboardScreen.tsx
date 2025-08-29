import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { HolisticProgressService, ProgressInsights } from '../lib/holisticProgressService';

const { width } = Dimensions.get('window');

export default function ProgressDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState<ProgressInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    }
  }, [user]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      let data = await HolisticProgressService.getProgressInsights(user!.id);
      
      // If no data exists, initialize user progress
      if (!data) {
        console.log('No progress data found, initializing user progress...');
        try {
          await HolisticProgressService.initializeUserProgress(user!.id);
          data = await HolisticProgressService.getProgressInsights(user!.id);
        } catch (initError) {
          console.error('Error initializing user progress:', initError);
          // Continue with empty data if initialization fails
        }
      }
      
      // Ensure we always have some data structure
      setProgressData(data || {
        currentStreak: 0,
        longestStreak: 0,
        todayProgress: null,
        weeklyProgress: [],
        monthlyProgress: [],
        recentActivities: [],
        upcomingGoals: [],
        achievements: [],
        levelProgress: {
          currentLevel: 'Beginner',
          experiencePoints: 0,
          nextLevelThreshold: 100,
          progressPercentage: 0,
        },
      });
    } catch (error) {
      console.error('Error loading progress data:', error);
      setError('Failed to load progress data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgressData();
    setRefreshing(false);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 20) return '🔥🔥';
    if (streak >= 10) return '🔥';
    if (streak >= 5) return '⚡';
    if (streak >= 3) return '💪';
    return '🌟';
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return '#10b981';
      case 'elementary': return '#3b82f6';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      case 'expert': return '#8b5cf6';
      case 'master': return '#f97316';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Dashboard</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={24} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadProgressData} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Streak Section */}
        <View style={styles.streakSection}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={32} color="#ef4444" />
            <Text style={styles.streakTitle}>Study Streak</Text>
          </View>
          <View style={styles.streakContent}>
            <View style={styles.streakMain}>
              <Text style={styles.streakNumber}>{progressData?.currentStreak || 0}</Text>
              <Text style={styles.streakLabel}>days</Text>
              <Text style={styles.streakEmoji}>{getStreakEmoji(progressData?.currentStreak || 0)}</Text>
            </View>
            <View style={styles.streakStats}>
              <Text style={styles.streakStat}>Longest: {progressData?.longestStreak || 0} days</Text>
              <Text style={styles.streakStat}>Keep it up!</Text>
            </View>
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Ionicons name="trophy" size={24} color={getLevelColor(progressData?.levelProgress.currentLevel || 'Beginner')} />
            <Text style={styles.levelTitle}>Level Progress</Text>
          </View>
          <View style={styles.levelContent}>
            <View style={styles.levelInfo}>
              <Text style={[styles.currentLevel, { color: getLevelColor(progressData?.levelProgress.currentLevel || 'Beginner') }]}>
                {progressData?.levelProgress.currentLevel || 'Beginner'}
              </Text>
              <Text style={styles.experiencePoints}>
                {progressData?.levelProgress.experiencePoints || 0} XP
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progressData?.levelProgress.progressPercentage || 0}%`,
                    backgroundColor: getLevelColor(progressData?.levelProgress.currentLevel || 'Beginner')
                  }
                ]} 
              />
            </View>
            <Text style={styles.nextLevel}>
              Next: {progressData?.levelProgress.nextLevelThreshold || 100} XP
            </Text>
          </View>
        </View>

        {/* Today's Goals */}
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>🎯 Today's Goals</Text>
          <View style={styles.goalsGrid}>
            {progressData?.upcomingGoals.map((goal, index) => (
              <View key={index} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Ionicons 
                    name={
                      goal.goal_type === 'study_time' ? 'time' :
                      goal.goal_type === 'lessons_completed' ? 'book' :
                      goal.goal_type === 'flashcards_reviewed' ? 'card' : 'game-controller'
                    } 
                    size={20} 
                    color={goal.completed ? '#10b981' : '#6b7280'} 
                  />
                  <Text style={styles.goalType}>
                    {goal.goal_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
                <View style={styles.goalProgress}>
                  <Text style={styles.goalCurrent}>{goal.current_value}</Text>
                  <Text style={styles.goalSeparator}>/</Text>
                  <Text style={styles.goalTarget}>{goal.target_value}</Text>
                </View>
                <View style={styles.goalBar}>
                  <View 
                    style={[
                      styles.goalFill, 
                      { 
                        width: `${Math.min(100, (goal.current_value / goal.target_value) * 100)}%`,
                        backgroundColor: goal.completed ? '#10b981' : '#6366f1'
                      }
                    ]} 
                  />
                </View>
                {goal.completed && (
                  <View style={styles.goalCompleted}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>📚 Recent Activities</Text>
          <View style={styles.activitiesList}>
            {progressData?.recentActivities.map((activity, index) => (
              <View key={index} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={
                      activity.activity_type === 'lesson' ? 'book' :
                      activity.activity_type === 'flashcard' ? 'card' :
                      activity.activity_type === 'game' ? 'game-controller' : 'fitness'
                    } 
                    size={20} 
                    color="#6366f1" 
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{activity.activity_name || 'Activity'}</Text>
                  <Text style={styles.activityDetails}>
                    {activity.score}/{activity.max_score} • {Math.round(activity.accuracy_percentage)}% accuracy
                  </Text>
                  <Text style={styles.activityTime}>{formatDate(activity.completed_at.toString())}</Text>
                </View>
                <View style={styles.activityScore}>
                  <Text style={styles.scoreText}>{activity.score}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        {progressData?.achievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>🏆 Recent Achievements</Text>
            <View style={styles.achievementsList}>
              {progressData.achievements.slice(0, 3).map((achievement, index) => (
                <View key={index} style={styles.achievementCard}>
                  <View style={styles.achievementIcon}>
                    <Ionicons 
                      name={
                        achievement.achievement_type === 'streak' ? 'flame' :
                        achievement.achievement_type === 'accuracy' ? 'target' :
                        achievement.achievement_type === 'time' ? 'time' : 'star'
                      } 
                      size={24} 
                      color="#f59e0b" 
                    />
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementName}>{achievement.achievement_name}</Text>
                    <Text style={styles.achievementDescription}>{achievement.achievement_description}</Text>
                    <Text style={styles.achievementDate}>
                      {formatDate(achievement.earned_at.toString())}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Weekly Progress Chart */}
        {progressData?.weeklyProgress.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>📊 Weekly Progress</Text>
            <View style={styles.chartContainer}>
              {progressData.weeklyProgress.map((day, index) => (
                <View key={index} style={styles.chartBar}>
                  <View 
                    style={[
                      styles.chartBarFill, 
                      { 
                        height: `${Math.max(10, (day.lessons_completed / 4) * 100)}%`,
                        backgroundColor: day.lessons_completed > 0 ? '#6366f1' : '#e5e7eb'
                      }
                    ]} 
                  />
                  <Text style={styles.chartLabel}>{formatDate(day.summary_date.toString())}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('NewLessonViewer' as never)}>
              <Ionicons name="book" size={24} color="#6366f1" />
              <Text style={styles.actionText}>Start Lesson</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Study' as never)}>
              <Ionicons name="card" size={24} color="#10b981" />
              <Text style={styles.actionText}>Review Cards</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Games' as never)}>
              <Ionicons name="game-controller" size={24} color="#f59e0b" />
              <Text style={styles.actionText}>Play Games</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Subjects' as never)}>
              <Ionicons name="library" size={24} color="#ef4444" />
              <Text style={styles.actionText}>Browse Subjects</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  streakSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
  },
  streakContent: {
    alignItems: 'center',
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ef4444',
    marginRight: 8,
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 12,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakStats: {
    alignItems: 'center',
  },
  streakStat: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  levelSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 12,
  },
  levelContent: {
    alignItems: 'center',
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentLevel: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 12,
  },
  experiencePoints: {
    fontSize: 16,
    color: '#6b7280',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextLevel: {
    fontSize: 14,
    color: '#6b7280',
  },
  goalsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCard: {
    width: (width - 80) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 8,
    textAlign: 'center',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalCurrent: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  goalSeparator: {
    fontSize: 16,
    color: '#6b7280',
    marginHorizontal: 4,
  },
  goalTarget: {
    fontSize: 16,
    color: '#6b7280',
  },
  goalBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  goalFill: {
    height: '100%',
    borderRadius: 2,
  },
  goalCompleted: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  activitiesSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityScore: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  achievementsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#a16207',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    color: '#92400e',
  },
  chartSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    paddingTop: 20,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarFill: {
    width: 20,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  actionsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 80) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    margin: 16,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});
