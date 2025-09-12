import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface RecentActivity {
  id: string;
  type: 'lesson' | 'flashcard' | 'game' | 'study';
  title: string;
  description: string;
  timestamp: string;
  score?: number;
  timeSpent?: number;
}

export default function RecentActivitiesWidget() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Single useEffect to handle all refresh scenarios
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Initial load or user change - loading activities');
      loadRecentActivities();
    }
  }, [user?.id]);

  // Refresh activities when component comes into focus
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      if (user?.id) {
        console.log('🔄 Screen focused - refreshing activities');
        loadRecentActivities();
      }
    });

    return unsubscribe;
  }, [navigation, user?.id]);

  const loadRecentActivities = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) return;

      console.log(`🔄 Loading recent activities for user: ${user.id}`);
      const activities: RecentActivity[] = [];

      // Get ALL activities from user_activities table (unified approach)
      try {
        console.log('🔍 Querying user_activities for all activities...');
        const { data: allActivities, error: activitiesError } = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(15); // Get more to ensure we have the most recent

        console.log('🔍 Raw all activities data:', allActivities);
        console.log('🔍 Activities error:', activitiesError);

        if (!activitiesError && allActivities) {
          console.log('🔍 Processing activities:', allActivities.length);
          
          // First, remove duplicates from the database results
          const uniqueDbActivities = allActivities.filter((activity, index, self) => 
            index === self.findIndex(a => a.id === activity.id)
          );
          console.log('🔍 After DB deduplication:', uniqueDbActivities.length, 'activities');
          
          // Process each activity based on its type
          const processedIds = new Set();
          uniqueDbActivities.forEach((activity, index) => {
            if (processedIds.has(activity.id)) {
              console.log(`⚠️ Activity ${activity.id} already processed, skipping...`);
              return;
            }
            processedIds.add(activity.id);
            
            console.log(`🔍 Processing activity ${index + 1}:`, {
              id: activity.id,
              type: activity.activity_type,
              name: activity.activity_name,
              score: activity.score,
              accuracy: activity.accuracy_percentage,
              duration: activity.duration_seconds,
              completed: activity.completed_at
            });
            
            switch (activity.activity_type) {
              case 'lesson':
                activities.push({
                  id: activity.id,
                  type: 'lesson',
                  title: activity.activity_name || 'Lesson',
                  description: `Completed with ${activity.accuracy_percentage || 0}% accuracy`,
                  timestamp: activity.completed_at,
                  score: activity.accuracy_percentage,
                  timeSpent: activity.duration_seconds ? Math.floor(activity.duration_seconds / 60) : undefined
                });
                console.log('✅ Added lesson activity');
                break;
              
              case 'flashcard':
              case 'flashcard_review':
                activities.push({
                  id: activity.id,
                  type: 'flashcard',
                  title: 'Flashcard Review',
                  description: `Completed flashcard session with ${activity.accuracy_percentage || 0}% accuracy`,
                  timestamp: activity.completed_at,
                  score: activity.accuracy_percentage,
                  timeSpent: activity.duration_seconds ? Math.floor(activity.duration_seconds / 60) : undefined
                });
                console.log('✅ Added flashcard activity');
                break;
              
              case 'game':
                activities.push({
                  id: activity.id,
                  type: 'game',
                  title: activity.activity_name || 'Learning Game',
                  description: `Completed ${activity.activity_name || 'learning game'}`,
                  timestamp: activity.completed_at,
                  score: activity.accuracy_percentage,
                  timeSpent: activity.duration_seconds ? Math.floor(activity.duration_seconds / 60) : undefined
                });
                console.log('✅ Added game activity');
                break;
              
              default:
                console.log('⚠️ Unknown activity type:', activity.activity_type);
                break;
            }
          });
        } else if (activitiesError) {
          console.error('❌ Activities error:', activitiesError);
        }
      } catch (error) {
        console.error('Error loading activities:', error);
      }

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      console.log('📊 After sorting, activities count:', activities.length);

      // Remove duplicates based on ID and take only the 5 most recent activities
      const uniqueActivities = activities.filter((activity, index, self) => 
        index === self.findIndex(a => a.id === activity.id)
      );
      console.log('📊 After deduplication, activities count:', uniqueActivities.length);

      const finalActivities = uniqueActivities.slice(0, 3);
      console.log('📊 Final activities to display:', finalActivities.length, 'activities');
      
      if (finalActivities.length > 0) {
        finalActivities.forEach((activity, index) => {
          console.log(`📊 Activity ${index + 1}:`, {
            id: activity.id,
            type: activity.type,
            title: activity.title,
            score: activity.score,
            timeSpent: activity.timeSpent,
            timestamp: activity.timestamp
          });
        });
      }
      
      setActivities(finalActivities);

    } catch (error) {
      console.error('Error loading recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshActivities = async () => {
    setRefreshing(true);
    await loadRecentActivities();
    setRefreshing(false);
  };

  const getActivityIcon = (type: string, activityName?: string) => {
    switch (type) {
      case 'lesson':
        return 'school';
      case 'flashcard':
        return 'card';
      case 'game':
        // Use specific game icons based on activity name
        if (activityName) {
          switch (activityName) {
            case 'Quiz Game':
              return 'help-circle';
            case 'Memory Match':
              return 'grid';
            case 'Word Scramble':
              return 'text';
            case 'Hangman':
              return 'game-controller';
            case 'Speed Challenge':
              return 'timer';
            case 'Sentence Scramble':
              return 'document-text';
            case 'Planet Defense':
              return 'planet';
            case 'Type What You Hear':
              return 'ear';
            case 'Gravity Game':
              return 'planet';
            default:
              return 'game-controller';
          }
        }
        return 'game-controller';
      case 'study':
        return 'book';
      default:
        return 'checkmark-circle';
    }
  };

  const getActivityColor = (type: string, activityName?: string) => {
    switch (type) {
      case 'lesson':
        return '#3b82f6';
      case 'flashcard':
        return '#10b981';
      case 'game':
        // Use specific game colors based on activity name
        if (activityName) {
          switch (activityName) {
            case 'Quiz Game':
              return '#6366f1';
            case 'Memory Match':
              return '#10b981';
            case 'Word Scramble':
              return '#16a34a';
            case 'Hangman':
              return '#8b5cf6';
            case 'Speed Challenge':
              return '#dc2626';
            case 'Sentence Scramble':
              return '#ec4899';
            case 'Planet Defense':
              return '#3b82f6';
            case 'Type What You Hear':
              return '#8b5cf6';
            case 'Gravity Game':
              return '#3b82f6';
            default:
              return '#f59e0b';
          }
        }
        return '#f59e0b';
      case 'study':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getGameIconBackground = (activityName?: string) => {
    if (activityName) {
      switch (activityName) {
        case 'Quiz Game':
          return '#f0f4ff';
        case 'Memory Match':
          return '#f0fdf4';
        case 'Word Scramble':
          return '#f0fdf4';
        case 'Hangman':
          return '#f8fafc';
        case 'Speed Challenge':
          return '#fef2f2';
        case 'Sentence Scramble':
          return '#fdf2f8';
        case 'Planet Defense':
          return '#dbeafe';
        case 'Type What You Hear':
          return '#f3e8ff';
        case 'Gravity Game':
          return '#dbeafe';
        default:
          return '#ffffff';
      }
    }
    return '#ffffff';
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityTime.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading recent activities...</Text>
        </View>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Recent Activities</Text>
          <Text style={styles.emptyText}>Start learning to see your recent activities here!</Text>
          <TouchableOpacity onPress={refreshActivities} style={styles.refreshButton}>
            <Ionicons name="refresh" size={16} color="#6366f1" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activities</Text>
        <TouchableOpacity onPress={refreshActivities} style={styles.refreshButton}>
          <Ionicons 
            name="refresh" 
            size={20} 
            color="#6366f1" 
            style={refreshing ? styles.refreshing : undefined}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.activitiesContainer}>
        {activities.map((activity, index) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={[
              styles.activityIconContainer,
              activity.type === 'game' && { backgroundColor: getGameIconBackground(activity.title) }
            ]}>
              <Ionicons 
                name={getActivityIcon(activity.type, activity.title) as any} 
                size={20} 
                color={getActivityColor(activity.type, activity.title)} 
              />
            </View>
            
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {activity.title}
              </Text>
              <Text style={styles.activityDescription} numberOfLines={2}>
                {activity.description}
              </Text>
              <Text style={styles.activityTime}>
                {formatTimestamp(activity.timestamp)}
              </Text>
            </View>

            <View style={styles.activityStats}>
              {activity.score !== undefined && (
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>{activity.score}%</Text>
                </View>
              )}
              {activity.timeSpent !== undefined && (
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{activity.timeSpent}m</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {activities.length > 0 && (
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>View All Activities</Text>
          <Ionicons name="chevron-forward" size={16} color="#6366f1" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    gap: 6,
  },
  refreshing: {
    transform: [{ rotate: '180deg' }],
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  activitiesContainer: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  activityStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  scoreContainer: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  timeContainer: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 4,
  },
});
