import React, { useState, useEffect } from 'react';
import { logger } from '../lib/logger';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyGoalsService, DailyGoalProgress } from '../lib/dailyGoalsService';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../lib/i18n';

const { width } = Dimensions.get('window');

interface DailyGoalsWidgetProps {
  onGoalCompleted?: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

export default function DailyGoalsWidget({ onGoalCompleted, refreshTrigger }: DailyGoalsWidgetProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [goalProgress, setGoalProgress] = useState<DailyGoalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadGoalProgress();
    }
  }, [user?.id]);

  // Watch for refresh trigger
  useEffect(() => {
    if (refreshTrigger && user?.id) {
      loadGoalProgress();
    }
  }, [refreshTrigger, user?.id]);

  const loadGoalProgress = async () => {
    try {
      setLoading(true);
      const progress = await DailyGoalsService.getTodayGoalProgress(user!.id);
      setGoalProgress(progress);
      
      // Debug logging
      if (progress) {
        logger.debug('Daily Goals Progress:', {
          overall_progress: progress.overall_progress,
          goals_completed: Object.values(progress).filter(goal => goal.completed).length
        });
      }
      
      // Check if all goals are completed and trigger callback
      if (progress && progress.overall_progress === 100 && onGoalCompleted) {
        onGoalCompleted();
      }
    } catch (error) {
      console.error('Error loading goal progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshGoals = async () => {
    setRefreshing(true);
    await loadGoalProgress();
    setRefreshing(false);
  };

  const createTestGoals = async () => {
    try {
      if (!user?.id) return;
      
      console.log('🧪 Creating test daily goals...');
      
      // Create goals for today
      const createdGoals = await DailyGoalsService.createDailyGoals(user.id);
      
      if (createdGoals.length > 0) {
        console.log('✅ Test goals created successfully:', createdGoals);
        
        // Refresh the display
        await loadGoalProgress();
        
        // Show success feedback
        alert(`Created ${createdGoals.length} daily goals for testing!\n\nGoals created:\n${createdGoals.map(g => `• ${g.goal_type}: ${g.target_value} ${getGoalUnit(g.goal_type)}`).join('\n')}`);
      } else {
        console.log('⚠️ No test goals were created');
        alert('No test goals were created. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Error creating test goals:', error);
      alert('Failed to create test goals. Check console for details.');
    }
  };

  const createAdvancedTestGoals = async () => {
    try {
      if (!user?.id) return;
      
      console.log('🧪 Creating advanced test goals...');
      
      // Create goals for different dates to test various scenarios
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Create goals for today
      const todayGoals = await DailyGoalsService.createDailyGoals(user.id, today);
      
      // Create goals for yesterday (to test historical data)
      const yesterdayGoals = await DailyGoalsService.createDailyGoals(user.id, yesterday);
      
      const totalGoals = todayGoals.length + yesterdayGoals.length;
      
      if (totalGoals > 0) {
        console.log('✅ Advanced test goals created successfully:', { todayGoals, yesterdayGoals });
        
        // Refresh the display
        await loadGoalProgress();
        
        // Show success feedback
        alert(`Created ${totalGoals} test goals!\n\nToday: ${todayGoals.length} goals\nYesterday: ${yesterdayGoals.length} goals\n\nCheck the dashboard for progress tracking!`);
      } else {
        console.log('⚠️ No advanced test goals were created');
        alert('No advanced test goals were created. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Error creating advanced test goals:', error);
      alert('Failed to create advanced test goals. Check console for details.');
    }
  };

  const clearCurrentGoals = async () => {
    try {
      if (!user?.id) return;
      
      console.log('🧪 Clearing current goals display...');
      
      // Just clear the local state to reset the display
      setGoalProgress(null);
      
      console.log('✅ Current goals cleared from display');
      alert('Goals cleared from display! Use "Create Goals" to generate new ones.');
      
    } catch (error) {
      console.error('❌ Error clearing goals:', error);
      alert('Failed to clear goals. Check console for details.');
    }
  };

  const testSingleGoalUpdate = async () => {
    try {
      if (!user?.id || !goalProgress) return;
      
      console.log('🧪 Testing single goal update...');
      
      // Test updating just the games played goal
      const success = await DailyGoalsService.updateGoalProgress(user.id, 'games_played', 1);
      
      if (success) {
        console.log('✅ Single goal update successful');
        
        // Refresh the display
        await loadGoalProgress();
        
        alert('Test goal update successful! Games played goal should now show +1 progress.');
      } else {
        console.log('⚠️ Single goal update failed');
        alert('Test goal update failed. Check console for details.');
      }
      
    } catch (error) {
      console.error('❌ Error testing goal update:', error);
      alert('Failed to test goal update. Check console for details.');
    }
  };



  const testPartialProgress = async () => {
    try {
      if (!user?.id || !goalProgress) return;
      
      console.log('🧪 Testing partial progress calculation...');
      
      // Test partial progress for each goal type
      const updates = [
        { type: 'games_played' as const, progress: 1, description: '1/2 games (50% of goal)' },
        { type: 'lessons_completed' as const, progress: 0, description: '0/1 lessons (0% of goal)' },
        { type: 'flashcards_reviewed' as const, progress: 3, description: '3/10 cards (30% of goal)' },
        { type: 'study_time' as const, progress: 5, description: '5/15 minutes (33% of goal)' },
      ];
      
      let successCount = 0;
      
      for (const update of updates) {
        try {
          const success = await DailyGoalsService.updateGoalProgress(user.id, update.type, update.progress);
          if (success) successCount++;
        } catch (error) {
          console.error(`Error updating ${update.type}:`, error);
        }
      }
      
      console.log(`✅ Tested ${successCount}/${updates.length} partial progress updates`);
      
      // Refresh the display
      await loadGoalProgress();
      
      alert(`Tested partial progress!\n\nThis simulates:\n• ${updates[0].description} = 12.5% weight\n• ${updates[1].description} = 0% weight\n• ${updates[2].description} = 7.5% weight\n• ${updates[3].description} = 8.25% weight\n\nExpected total: ~28% (weighted average)\n\nCheck the percentage!`);
      
    } catch (error) {
      console.error('❌ Error testing partial progress:', error);
      alert('Failed to test partial progress. Check console for details.');
    }
  };


  const getGoalIcon = (goalType: string) => {
    switch (goalType) {
      case 'study_time':
        return 'time-outline';
      case 'lessons_completed':
        return 'book-outline';
      case 'flashcards_reviewed':
        return 'card-outline';
      case 'games_played':
        return 'game-controller-outline';
      default:
        return 'checkmark-circle-outline';
    }
  };

  const getGoalLabel = (goalType: string) => {
    switch (goalType) {
      case 'study_time':
        return t('progress.studyTime');
      case 'lessons_completed':
        return t('progress.lessons');
      case 'flashcards_reviewed':
        return t('progress.flashcards');
      case 'games_played':
        return t('progress.games');
      default:
        return goalType;
    }
  };

  const getGoalUnit = (goalType: string) => {
    switch (goalType) {
      case 'study_time':
        return t('progress.min');
      case 'lessons_completed':
        return t('progress.lessonsUnit');
      case 'flashcards_reviewed':
        return t('progress.cardsUnit');
      case 'games_played':
        return t('progress.gamesUnit');
      default:
        return '';
    }
  };

  const renderGoalItem = (goalType: keyof Omit<DailyGoalProgress, 'overall_progress'>, data: { target: number; current: number; completed: boolean }) => {
    const progress = Math.min((data.current / data.target) * 100, 100);
    const isCompleted = data.completed;

    return (
      <View key={goalType} style={styles.goalItem}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <Ionicons 
              name={getGoalIcon(goalType)} 
              size={20} 
              color={isCompleted ? '#10b981' : '#6b7280'} 
            />
            <Text style={[styles.goalLabel, isCompleted && styles.goalLabelCompleted]}>
              {getGoalLabel(goalType)}
            </Text>
          </View>
          <View style={styles.goalStatus}>
            {isCompleted ? (
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            ) : (
              <Text style={styles.goalProgress}>
                {data.current}/{data.target} {getGoalUnit(goalType)}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Goals</Text>
          <ActivityIndicator size="small" color="#6366f1" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </View>
    );
  }

  if (!goalProgress) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('progress.dailyGoals')}</Text>
          <TouchableOpacity onPress={refreshGoals} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>Failed to load daily goals</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('progress.dailyGoals')}</Text>
          <View style={styles.overallProgress}>
            <Text style={styles.overallProgressText}>
              {goalProgress.overall_progress}%
            </Text>
            <Text style={styles.overallProgressLabel}>{t('progress.complete')}</Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            onPress={refreshGoals}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color="#6366f1" 
              style={refreshing ? styles.refreshing : undefined}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.goalsContainer}>
        {renderGoalItem('study_time', goalProgress.study_time)}
        {renderGoalItem('lessons_completed', goalProgress.lessons_completed)}
        {renderGoalItem('flashcards_reviewed', goalProgress.flashcards_reviewed)}
        {renderGoalItem('games_played', goalProgress.games_played)}
      </View>

      {goalProgress.overall_progress >= 100 && (
        <View style={styles.completionCelebration}>
          <Ionicons name="trophy" size={24} color="#f59e0b" />
          <Text style={styles.completionText}>{t('progress.dailyGoalsCompleted')}</Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginVertical: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  overallProgress: {
    alignItems: 'flex-start',
  },
  overallProgressText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366f1',
  },
  overallProgressLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },


  refreshing: {
    transform: [{ rotate: '180deg' }],
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: '#ef4444',
    fontSize: 16,
    padding: 20,
  },
  goalsContainer: {
    gap: 16,
  },
  goalItem: {
    gap: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  goalLabelCompleted: {
    color: '#10b981',
  },
  goalStatus: {
    alignItems: 'flex-end',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 5,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  completionCelebration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  completionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
});
