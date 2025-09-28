import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  const loadProgressData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('🚀 Loading progress data...', forceRefresh ? '(force refresh)' : '(cache-first)');
      
      // Clear cache for debugging (temporary)
      if (forceRefresh) {
        await OptimizedProgressService.clearUserCache(user!.id);
      }
      
      // Parallelize data loading for faster performance
      const [data, dates, userLessons] = await Promise.allSettled([
        forceRefresh 
          ? OptimizedProgressService.getProgressInsights(user!.id, true)
          : OptimizedProgressService.getProgressInsightsFast(user!.id),
        OptimizedProgressService.getStudyDates(user!.id),
        LessonService.getUserLessonsWithProgress(user!.id)
      ]);
      
      // Handle progress insights
      let progressInsights = null;
      if (data.status === 'fulfilled') {
        progressInsights = data.value;
      } else {
        console.error('Error loading progress insights:', data.reason);
      }
      
      // If no data exists, initialize user progress
      if (!progressInsights) {
        console.log('No progress data found, initializing user progress...');
        try {
          await HolisticProgressService.initializeUserProgress(user!.id);
          progressInsights = await OptimizedProgressService.getProgressInsights(user!.id, true);
        } catch (initError) {
          console.error('Error initializing user progress:', initError);
          // Continue with empty data if initialization fails
        }
      }
      
      // Handle study dates
      if (dates.status === 'fulfilled') {
        setStudyDates(dates.value);
      } else {
        console.error('Error loading study dates:', dates.reason);
        setStudyDates([]);
      }
      
      // Handle lessons count
      if (userLessons.status === 'fulfilled') {
        setLessonsCount(userLessons.value.length);
      } else {
        console.error('Error loading lessons:', userLessons.reason);
        setLessonsCount(0);
      }
      
      // Ensure we always have some data structure
      const finalData = progressInsights || {
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
        upcomingGoals: [],
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
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProgressData(true); // Force refresh when user pulls to refresh
    setRefreshing(false);
  }, [loadProgressData]);

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
      default: return '#64748b';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'star-outline';
      case 'elementary': return 'star';
      case 'intermediate': return 'star-half';
      case 'advanced': return 'trophy-outline';
      case 'expert': return 'trophy';
      case 'master': return 'diamond-outline';
      default: return 'star-outline';
    }
  };

  // Skeleton loading component
  const SkeletonCard = ({ width = 100, height = 80 }: { width?: number, height?: number }) => (
    <View style={[styles.skeletonCard, { width, height }]}>
      <View style={styles.skeletonShimmer} />
    </View>
  );

  if (loading && !progressData) {
    return (
      <SafeAreaView style={styles.container}>
        <ConsistentHeader pageName="Progress" />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.skeletonContainer}>
            {/* Streak cards skeleton */}
            <View style={styles.streakRow}>
              <SkeletonCard width={48} height={100} />
              <SkeletonCard width={48} height={100} />
            </View>
            
            {/* Today's progress skeleton */}
            <SkeletonCard height={120} />
            
            {/* Level progress skeleton */}
            <SkeletonCard height={100} />
            
            {/* Flashcard stats skeleton */}
            <SkeletonCard height={140} />
            
            {/* Calendar skeleton */}
            <SkeletonCard height={200} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Consistent Header with Profile Avatar */}
      <ConsistentHeader 
        pageName="Progress"
        streakCount={progressData?.currentStreak || 0}
      />

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={24} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadProgressData()} style={styles.retryButton}>
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
          <View style={styles.sectionTitleContainer}>
            <Ionicons name={getLevelIcon(progressData?.levelProgress.currentLevel || 'Beginner')} size={24} color={getLevelColor(progressData?.levelProgress.currentLevel || 'Beginner')} />
            <Text style={styles.sectionTitle}>Level Progress</Text>
          </View>
          
          <View style={styles.levelCard}>
            <View style={styles.levelInfoContainer}>
              <View style={styles.currentLevelContainer}>
                <Text style={styles.levelLabel}>Current Level</Text>
                <Text style={[styles.levelName, { color: getLevelColor(progressData?.levelProgress.currentLevel || 'Beginner') }]}>
                  {progressData?.levelProgress.currentLevel || 'Beginner'}
                </Text>
              </View>

              <View style={styles.xpContainer}>
                <Text style={styles.xpLabel}>Experience Points</Text>
                <Text style={styles.xpValue}>{progressData?.levelProgress.experiencePoints || 0} XP</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress to Next Level</Text>
                <Text style={styles.progressPercentage}>{progressData?.levelProgress.progressPercentage || 0}%</Text>
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
              
              <Text style={styles.nextLevelText}>
                {(progressData?.levelProgress.nextLevelThreshold || 100) - (progressData?.levelProgress.experiencePoints || 0)} XP to next level
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="trending-up" size={16} color="#10b981" />
                <Text style={styles.statLabel}>Total XP</Text>
                <Text style={styles.statValue}>{progressData?.levelProgress.experiencePoints || 0}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="flag" size={16} color="#3b82f6" />
                <Text style={styles.statLabel}>Next Level</Text>
                <Text style={styles.statValue}>{progressData?.levelProgress.nextLevelThreshold || 100}</Text>
              </View>
            </View>
          </View>
        </View>


        {/* Your Vocabulary Section - Hidden for now, keeping code for future use */}
        {false && (
          <View style={styles.vocabularySection}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="chatbubble" size={24} color="#6366f1" />
              <Text style={styles.sectionTitle}>Your Vocabulary</Text>
            </View>
            <View style={styles.vocabularyCard}>
              <View style={styles.vocabularyCardHeader}>
                <Text style={styles.vocabularyTimeframe}>Last 14 days</Text>
                <Ionicons name="chevron-forward" size={20} color="#64748b" />
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
            <Ionicons name="calendar" size={24} color="#6366f1" />
            <Text style={styles.sectionTitle}>Study Calendar</Text>
          </View>
          <View style={styles.calendarWrapper}>
            <StudyCalendar studyDates={studyDates} />
          </View>
        </View>


        {/* Achievements */}
        {progressData?.achievements && progressData.achievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="trophy" size={24} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Recent Achievements</Text>
            </View>
            <View style={styles.achievementsList}>
              {progressData?.achievements?.slice(0, 3).map((achievement, index) => (
                <View key={index} style={styles.achievementCard}>
                  <View style={styles.achievementIcon}>
                    <Ionicons 
                      name={
                        achievement.achievement_type === 'streak' ? 'flame' :
                        achievement.achievement_type === 'accuracy' ? 'star' :
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
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="library" size={24} color="#6366f1" />
            <Text style={styles.sectionTitle}>Flashcard Progress</Text>
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
                <Ionicons name="star" size={28} color="#ffffff" />
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
    color: '#64748b',
  },
  content: {
    flex: 1,
  },
  vocabularySection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    color: '#64748b',
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
    color: '#64748b',
    textAlign: 'right',
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  chartXLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  calendarSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  calendarWrapper: {
    // marginTop removed - now handled by sectionTitleContainer marginBottom
  },
  flashcardsProgressSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  levelSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  levelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  currentLevelContainer: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  levelName: {
    fontSize: 24,
    fontWeight: '700',
  },
  xpContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  xpLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  xpValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextLevelText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
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
    marginBottom: 16,
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
  },
  masteredCardsIcon: {
    backgroundColor: '#8b5cf6',
  },
  accuracyIcon: {
    backgroundColor: '#6466E9',
  },
  streakIcon: {
    backgroundColor: '#06b6d4',
  },
  bestTopicIcon: {
    backgroundColor: '#8b5cf6',
  },
  needsWorkIcon: {
    backgroundColor: '#6466E9',
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
  
  // Skeleton loading styles
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  skeletonShimmer: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    opacity: 0.7,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
});




