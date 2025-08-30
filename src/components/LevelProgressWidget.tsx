import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { XPService, LevelInfo } from '../lib/xpService';
import { useAuth } from '../contexts/AuthContext';

interface LevelProgressWidgetProps {
  onRefresh?: () => void;
}

export default function LevelProgressWidget({ onRefresh }: LevelProgressWidgetProps) {
  const { user } = useAuth();
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLevelInfo = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('🔄 Loading level info for user:', user.id);
      const info = await XPService.getLevelInfo(user.id);
      console.log('📊 Level info loaded:', info);
      setLevelInfo(info);
    } catch (error) {
      console.error('❌ Error loading level info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!user?.id) return;
    
    try {
      setRefreshing(true);
      console.log('🔄 Manual refresh triggered for user:', user.id);
      
      // Force refresh by calling the parent's refresh function if available
      if (onRefresh) {
        onRefresh();
      }
      
      // Also refresh our own data
      await loadLevelInfo();
      
      console.log('✅ Level info refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing level info:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLevelInfo();
  }, [user?.id]);

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={20} color="#6366f1" />
          <Text style={styles.loadingText}>Loading level...</Text>
        </View>
      </View>
    );
  }

  if (!levelInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load level</Text>
        </View>
      </View>
    );
  }

  const levelColor = getLevelColor(levelInfo.currentLevel);
  const levelIcon = getLevelIcon(levelInfo.currentLevel);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name={levelIcon} size={24} color={levelColor} />
          <Text style={styles.title}>Level Progress</Text>
        </View>
                 <View style={styles.buttonContainer}>
           <TouchableOpacity 
             onPress={handleRefresh} 
             style={[styles.refreshButton, refreshing && styles.refreshButtonActive]}
             disabled={refreshing}
           >
             <Ionicons 
               name={refreshing ? "sync" : "refresh"} 
               size={20} 
               color={refreshing ? "#10b981" : "#6366f1"} 
             />
           </TouchableOpacity>
         </View>
      </View>

      <View style={styles.levelInfo}>
        <View style={styles.currentLevelContainer}>
          <Text style={styles.levelLabel}>Current Level</Text>
          <Text style={[styles.levelName, { color: levelColor }]}>
            {levelInfo.currentLevel}
          </Text>
        </View>

        <View style={styles.xpContainer}>
          <Text style={styles.xpLabel}>Experience Points</Text>
          <Text style={styles.xpValue}>{levelInfo.experiencePoints} XP</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress to Next Level</Text>
          <Text style={styles.progressPercentage}>{levelInfo.progressPercentage}%</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${levelInfo.progressPercentage}%`,
                backgroundColor: levelColor
              }
            ]} 
          />
        </View>
        
        <Text style={styles.nextLevelText}>
          {levelInfo.xpToNextLevel > 0 
            ? `${levelInfo.xpToNextLevel} XP to next level`
            : 'Max level reached! 🎉'
          }
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={16} color="#10b981" />
          <Text style={styles.statLabel}>Total XP</Text>
          <Text style={styles.statValue}>{levelInfo.experiencePoints}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="flag" size={16} color="#3b82f6" />
          <Text style={styles.statLabel}>Next Level</Text>
          <Text style={styles.statValue}>{levelInfo.nextLevelThreshold}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ef4444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 4,
  },
  refreshButtonActive: {
    opacity: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelInfo: {
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
});
