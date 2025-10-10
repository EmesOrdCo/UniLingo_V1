import React, { useState, useEffect } from 'react';
import { logger } from '../lib/logger';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { XPService, LevelInfo } from '../lib/xpService';
import { useAuth } from '../contexts/AuthContext';

interface LevelProgressWidgetProps {
  onRefresh?: () => void;
}

export default function LevelProgressWidget({ onRefresh }: LevelProgressWidgetProps) {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [availableXP, setAvailableXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showXPInfoModal, setShowXPInfoModal] = useState(false);

  const loadLevelInfo = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      logger.debug('Loading level info for user:', user.id);
      const [info, xp] = await Promise.all([
        XPService.getLevelInfo(user.id),
        XPService.getAvailableXP(user.id)
      ]);
      logger.debug('Level info loaded:', info);
      setLevelInfo(info);
      setAvailableXP(xp);
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
      logger.debug('Manual refresh triggered for user:', user.id);
      
      // Force refresh by calling the parent's refresh function if available
      if (onRefresh) {
        onRefresh();
      }
      
      // Also refresh our own data
      await loadLevelInfo();
      
      logger.debug('Level info refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing level info:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleNavigateToProgress = () => {
    navigation.navigate('ProgressDashboard' as never);
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
      case 'master': return '#8b5cf6';
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
          <Ionicons name="hourglass-outline" size={20} color="#8b5cf6" />
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
              color={refreshing ? "#10b981" : "#8b5cf6"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleNavigateToProgress} 
            style={styles.navigateButton}
          >
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color="#8b5cf6" 
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
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>Total Earned</Text>
            <Text style={styles.xpValue}>{levelInfo.experiencePoints.toLocaleString()}</Text>
          </View>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>Available</Text>
            <View style={styles.availableXPContainer}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.availableXPValue}>{availableXP.toLocaleString()}</Text>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => setShowXPInfoModal(true)}
              >
                <Ionicons name="information-circle-outline" size={16} color="#8b5cf6" />
              </TouchableOpacity>
            </View>
          </View>
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

      {/* XP Information Modal */}
      <Modal
        visible={showXPInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowXPInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>XP System Explained</Text>
              <TouchableOpacity 
                onPress={() => setShowXPInfoModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.explanationItem}>
                <View style={styles.explanationHeader}>
                  <Ionicons name="trending-up" size={20} color="#10b981" />
                  <Text style={styles.explanationTitle}>Total Earned XP</Text>
                </View>
                <Text style={styles.explanationText}>
                  This is your lifetime XP - all the experience points you've earned from lessons, games, flashcards, and exercises since you started using UniLingo.
                </Text>
              </View>

              <View style={styles.explanationItem}>
                <View style={styles.explanationHeader}>
                  <Ionicons name="star" size={20} color="#F59E0B" />
                  <Text style={styles.explanationTitle}>Available XP</Text>
                </View>
                <Text style={styles.explanationText}>
                  This is your current "currency" - XP that you can spend on arcade games, power-ups, or special features. Available XP is earned from completing activities and can be used immediately.
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.summaryText}>
                💡 <Text style={styles.summaryBold}>Quick tip:</Text> Complete lessons and games to earn both Total XP (for leveling up) and Available XP (for spending on fun features)!
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  navigateButton: {
    padding: 4,
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
    gap: 6,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  xpValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  availableXPContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  availableXPValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  infoButton: {
    padding: 2,
    marginLeft: 4,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  explanationItem: {
    marginBottom: 20,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  summaryBold: {
    fontWeight: '600',
    color: '#1e293b',
  },
});
