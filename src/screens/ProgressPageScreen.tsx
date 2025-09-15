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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useRefresh } from '../contexts/RefreshContext';
import { HolisticProgressService, ProgressInsights } from '../lib/holisticProgressService';
import OptimizedProgressService from '../lib/optimizedProgressService';
import StudyCalendar from '../components/StudyCalendar';
import ConsistentHeader from '../components/ConsistentHeader';
import StreakDetailsModal from '../components/StreakDetailsModal';
import { LessonService } from '../lib/lessonService';

const { width } = Dimensions.get('window');

export default function ProgressPageScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { refreshTrigger } = useRefresh();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState<ProgressInsights | null>(null);
  const [studyDates, setStudyDates] = useState<string[]>([]);
  const [lessonsCount, setLessonsCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    }
  }, [user]);

  // Add refresh trigger to reload data when activities are completed
  useEffect(() => {
    if (user?.id && refreshTrigger) {
      loadProgressData(true); // Force refresh when activities are completed
    }
  }, [refreshTrigger, user]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadProgressData();
      }
    }, [user?.id])
  );

  const loadProgressData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('🚀 Loading progress data...', forceRefresh ? '(force refresh)' : '(cache-first)');
      
      // Clear cache for debugging (temporary)
      if (forceRefresh) {
        await OptimizedProgressService.clearUserCache(user!.id);
      }
      
      // Use optimized service with caching
      let data = await OptimizedProgressService.getProgressInsights(user!.id, forceRefresh);
      
      // If no data exists, initialize user progress
      if (!data) {
        console.log('No progress data found, initializing user progress...');
        try {
          await HolisticProgressService.initializeUserProgress(user!.id);
          data = await OptimizedProgressService.getProgressInsights(user!.id, true);
        } catch (initError) {
          console.error('Error initializing user progress:', initError);
          // Continue with empty data if initialization fails
        }
      }
      
      // Load study dates for calendar (also cached)
      const dates = await OptimizedProgressService.getStudyDates(user!.id);
      setStudyDates(dates);
      
      // Load lessons count (same logic as YourLessonsScreen)
      const userLessons = await LessonService.getUserLessonsWithProgress(user!.id);
      setLessonsCount(userLessons.length);
      
      // Ensure we always have some data structure
      const finalData = data || {
        currentStreak: 0,
        longestStreak: 0,
        todayProgress: null,
        weeklyProgress: [],
        monthlyProgress: [],
        recentActivities: [],
        achievements: [],
        levelProgress: {
          currentLevel: 'Beginner',
          experiencePoints: 0,
          nextLevelThreshold: 100,
          progressPercentage: 0,
        },
        flashcardStats: {
          totalCards: 0,
          masteredCards: 0,
          dayStreak: 0,
          averageAccuracy: 0,
          bestTopic: 'None',
          weakestTopic: 'None',
        },
      };
      
      console.log('📊 ProgressPage - Final streak data:', { 
        currentStreak: finalData.currentStreak,
        longestStreak: finalData.longestStreak,
        forceRefresh,
        userId: user!.id
      });
      
      setProgressData(finalData);
      
      console.log('✅ Progress data loaded successfully');
    } catch (error) {
      console.error('Error loading progress data:', error);
      setError('Failed to load progress data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgressData(true); // Force refresh when user pulls to refresh
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


  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return '#10b981';
      case 'elementary': return '#3b82f6';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      case 'expert': return '#8b5cf6';
      case 'master': return '#6466E9';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.streakBadge}
            onPress={() => setShowStreakModal(true)}
          >
            <Ionicons name="flame" size={16} color="#f59e0b" />
            <Text style={styles.streakText}>{progressData?.currentStreak || 0}</Text>
          </TouchableOpacity>
          <View style={styles.profilePicture}>
            <Ionicons name="person" size={24} color="#6366f1" />
          </View>
        </View>
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

        {/* Level Progress */}
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Ionicons name="trophy" size={24} color={getLevelColor(progressData?.levelProgress.currentLevel || 'Beginner')} />
            <Text style={styles.levelTitle}>Level Progress</Text>
          </View>
          <View style={styles.levelCard}>
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
        </View>

        {/* Your Courses Section */}
        <View style={styles.coursesSection}>
          <View style={styles.coursesHeader}>
            <Text style={styles.coursesTitle}>Your courses</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.courseCard}>
            <View style={styles.courseInfo}>
              <Text style={styles.courseLevel}>A1.1</Text>
              <Text style={styles.courseName}>Newcomer I (A1.1)</Text>
            </View>
            <View style={styles.courseBadge}>
              <Text style={styles.courseBadgeText}>A1</Text>
            </View>
            <View style={styles.courseProgress}>
              <View style={styles.courseProgressBar}>
                <View style={[
                  styles.courseProgressFill, 
                  { width: `${Math.min(100, (progressData?.levelProgress.progressPercentage || 0))}%` }
                ]} />
              </View>
              <Text style={styles.courseProgressText}>
                {Math.min(100, (progressData?.levelProgress.progressPercentage || 0))}%
              </Text>
            </View>
          </View>
        </View>

        {/* Learning Stats Section */}
        <View style={styles.learningStatsSection}>
          <View style={styles.learningStatsHeader}>
            <Ionicons name="trending-up" size={20} color="#6366f1" />
            <Text style={styles.learningStatsTitle}>Learning stats</Text>
          </View>
          <View style={styles.learningStatsGrid}>
            <View style={styles.learningStatCard}>
              <Text style={styles.learningStatNumber}>
                {progressData?.recentActivities?.filter(activity => 
                  activity.activity_type === 'lesson' && activity.completed_at
                ).length || 0}
              </Text>
              <Text style={styles.learningStatLabel}>Complete lessons</Text>
            </View>
            <View style={styles.learningStatCard}>
              <Text style={styles.learningStatNumber}>
                {lessonsCount}
              </Text>
              <Text style={styles.learningStatLabel}>Lessons made</Text>
            </View>
            <View style={styles.learningStatCard}>
              <Text style={styles.learningStatNumber}>
                {progressData?.flashcardStats?.masteredCards || 0}
              </Text>
              <Text style={styles.learningStatLabel}>Complete flashcards</Text>
            </View>
            <View style={styles.learningStatCard}>
              <Text style={styles.learningStatNumber}>
                {(() => {
                  const totalMinutes = progressData?.recentActivities?.reduce((total, activity) => {
                    return total + Math.round(activity.duration_seconds / 60);
                  }, 0) || 0;
                  return totalMinutes < 60 ? `${totalMinutes} min` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
                })()}
              </Text>
              <Text style={styles.learningStatLabel}>Learning time</Text>
            </View>
          </View>
        </View>

        {/* Your Vocabulary Section - Hidden for now, keeping code for future use */}
        {false && (
          <View style={styles.vocabularySection}>
            <View style={styles.vocabularyHeader}>
              <Ionicons name="chatbubble" size={20} color="#6366f1" />
              <Text style={styles.vocabularyTitle}>Your vocabulary</Text>
            </View>
            <View style={styles.vocabularyCard}>
              <View style={styles.vocabularyCardHeader}>
                <Text style={styles.vocabularyTimeframe}>Last 14 days</Text>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
              <Text style={styles.vocabularyNumber}>
                {progressData?.flashcardStats?.totalCards || 0} new items
              </Text>
              <View style={styles.vocabularyChart}>
                <View style={styles.chartContainer}>
                  <View style={styles.chartBars}>
                    {Array.from({ length: 14 }, (_, i) => (
                      <View 
                        key={i} 
                        style={[
                          styles.chartBar, 
                          i === 7 ? styles.chartBarActive : styles.chartBarInactive,
                          { height: i === 7 ? 60 : 8 }
                        ]} 
                      />
                    ))}
                  </View>
                  <View style={styles.chartYAxis}>
                    <Text style={styles.chartYLabel}>4</Text>
                    <Text style={styles.chartYLabel}>3</Text>
                    <Text style={styles.chartYLabel}>2</Text>
                    <Text style={styles.chartYLabel}>1</Text>
                    <Text style={styles.chartYLabel}>0</Text>
                  </View>
                </View>
                <View style={styles.chartXAxis}>
                  <Text style={styles.chartXLabel}>1 Sep</Text>
                  <Text style={styles.chartXLabel}>8 S...</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Study Calendar */}
        <View style={styles.calendarSection}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="calendar" size={24} color="#06b6d4" />
            </View>
            <Text style={styles.sectionTitle}>Study Calendar</Text>
          </View>
          <View style={styles.calendarWrapper}>
            <StudyCalendar studyDates={studyDates} />
          </View>
        </View>


        {/* Achievements */}
        {progressData?.achievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.sectionTitle}>Recent Achievements</Text>
            </View>
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
                      {formatDate(achievement.earned_at?.toString() || new Date().toISOString())}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Flashcards Progress */}
        <View style={styles.flashcardsProgressSection}>
          <View style={styles.flashcardsProgressHeader}>
            <Ionicons name="library" size={20} color="#6366f1" />
            <Text style={styles.flashcardsProgressTitle}>Flashcard Progress</Text>
          </View>
          <View style={styles.flashcardsGrid}>
            <View style={styles.flashcardStatCard}>
              <View style={[styles.flashcardStatIcon, styles.totalCardsIcon]}>
                <Ionicons name="library-outline" size={28} color="#ffffff" />
              </View>
              <Text style={styles.flashcardStatNumber}>{progressData?.flashcardStats?.totalCards || 0}</Text>
              <Text style={styles.flashcardStatLabel}>Total Cards</Text>
            </View>
            <View style={styles.flashcardStatCard}>
              <View style={[styles.flashcardStatIcon, styles.masteredCardsIcon]}>
                <Ionicons name="star" size={28} color="#ffffff" />
              </View>
              <Text style={styles.flashcardStatNumber}>{progressData?.flashcardStats?.masteredCards || 0}</Text>
              <Text style={styles.flashcardStatLabel}>Mastered</Text>
            </View>
            <View style={styles.flashcardStatCard}>
              <View style={[styles.flashcardStatIcon, styles.accuracyIcon]}>
                <Ionicons name="target" size={28} color="#ffffff" />
              </View>
              <Text style={styles.flashcardStatNumber}>{progressData?.flashcardStats?.averageAccuracy || 0}%</Text>
              <Text style={styles.flashcardStatLabel}>Accuracy</Text>
            </View>
            <View style={styles.flashcardStatCard}>
              <View style={[styles.flashcardStatIcon, styles.streakIcon]}>
                <Ionicons name="flame" size={28} color="#ffffff" />
              </View>
              <Text style={styles.flashcardStatNumber}>{progressData?.flashcardStats?.dayStreak || 0}</Text>
              <Text style={styles.flashcardStatLabel}>Streak</Text>
            </View>
            <View style={styles.flashcardStatCard}>
              <View style={[styles.flashcardStatIcon, styles.bestTopicIcon]}>
                <Ionicons name="medal" size={28} color="#ffffff" />
              </View>
              <Text style={styles.flashcardStatNumber}>{progressData?.flashcardStats?.bestTopic || 'None'}</Text>
              <Text style={styles.flashcardStatLabel}>Best Topic</Text>
            </View>
            <View style={styles.flashcardStatCard}>
              <View style={[styles.flashcardStatIcon, styles.needsWorkIcon]}>
                <Ionicons name="bulb-outline" size={28} color="#ffffff" />
              </View>
              <Text style={styles.flashcardStatNumber}>{progressData?.flashcardStats?.weakestTopic || 'None'}</Text>
              <Text style={styles.flashcardStatLabel}>Needs Work</Text>
            </View>
          </View>
        </View>




        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Streak Details Modal */}
      <StreakDetailsModal 
        visible={showStreakModal}
        onClose={() => setShowStreakModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    // Add subtle shadow and press effect to indicate it's clickable
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coursesSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  coursesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  coursesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  courseInfo: {
    marginBottom: 16,
  },
  courseLevel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  courseBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  courseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courseProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  courseProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  vocabularySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  vocabularyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vocabularyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  vocabularyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vocabularyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vocabularyTimeframe: {
    fontSize: 14,
    color: '#6b7280',
  },
  vocabularyNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  vocabularyChart: {
    marginTop: 8,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    height: 60,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  chartBar: {
    width: 8,
    borderRadius: 4,
    marginHorizontal: 1,
  },
  chartBarActive: {
    backgroundColor: '#10b981',
  },
  chartBarInactive: {
    backgroundColor: '#e2e8f0',
  },
  chartYAxis: {
    width: 20,
    height: 60,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartYLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  chartXLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  learningStatsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  flashcardsProgressSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  learningStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flashcardsProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  learningStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  flashcardsProgressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  learningStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  learningStatCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  learningStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  learningStatLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  calendarSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarWrapper: {
    marginTop: 16,
  },
  levelSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
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


  // Flashcards section styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  flashcardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  flashcardStatCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  flashcardStatIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  // Individual icon styles with gradients
  totalCardsIcon: {
    backgroundColor: '#6366f1',
    backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  masteredCardsIcon: {
    backgroundColor: '#10b981',
    backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  accuracyIcon: {
    backgroundColor: '#06b6d4',
    backgroundImage: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  },
  streakIcon: {
    backgroundColor: '#f59e0b',
    backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  },
  bestTopicIcon: {
    backgroundColor: '#8b5cf6',
    backgroundImage: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  },
  needsWorkIcon: {
    backgroundColor: '#f97316',
    backgroundImage: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  },
  flashcardStatNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  flashcardStatLabel: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
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




