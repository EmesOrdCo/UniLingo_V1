import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GameStats {
  today: number;
  total: number;
  accuracyPct: number;
  totalMinutes: number;
  level: number;
  xp: number;
  nextLevelXp: number;
}

interface GameStatsSectionProps {
  stats: GameStats;
}

const GameStatsSection: React.FC<GameStatsSectionProps> = ({ stats }) => {
  const percentage = Math.min(100, Math.round((stats.xp / Math.max(1, stats.nextLevelXp)) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.statsTitleContainer}>
        <Ionicons name="game-controller" size={20} color="#6466E9" style={styles.statsIcon} />
        <Text style={styles.statsTitleText}>Your Game Stats</Text>
      </View>
      
      <View style={styles.statsCard}>
        <View style={styles.levelXpContainer}>
          <View>
            <Text style={styles.levelText}>Level {stats.level}</Text>
            <Text style={styles.xpText}>{stats.xp} XP</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpBarFill, { width: `${percentage}%` }]} />
            <View style={styles.xpBarGlow} />
          </View>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="game-controller" size={16} color="#6466E9" />
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <Text style={styles.statValue}>{stats.today}</Text>
          </View>
          
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="trophy" size={16} color="#6466E9" />
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="flash" size={16} color="#6466E9" />
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <Text style={styles.statValue}>{stats.accuracyPct}%</Text>
          </View>
          
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="time" size={16} color="#6466E9" />
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <Text style={styles.statValue}>{stats.totalMinutes}m</Text>
          </View>
        </View>
        
        <View style={styles.statsFooter}>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllButtonText}>View All</Text>
            <Ionicons name="arrow-forward" size={14} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  statsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsIcon: {
    marginRight: 8,
  },
  statsTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statsCard: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  levelXpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  xpText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  xpBar: {
    position: 'relative',
    height: 12,
    width: 160,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#6466E9',
  },
  xpBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsGrid: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  statsFooter: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
});

export default GameStatsSection;
