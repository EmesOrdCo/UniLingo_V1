import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GameStats {
  today: number;
  total: number;
  accuracyPct: number;
  totalMinutes: number;
}

interface GameStatsSectionProps {
  stats: GameStats;
}

const GameStatsSection: React.FC<GameStatsSectionProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      <View style={styles.statsTitleContainer}>
        <Ionicons name="game-controller" size={20} color="#6466E9" style={styles.statsIcon} />
        <Text style={styles.statsTitleText}>Your Game Stats</Text>
      </View>
      
      <View style={styles.statsGrid}>
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="game-controller" size={16} color="#6466E9" />
              <Text style={styles.statLabel} numberOfLines={1}>Today</Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{stats.today}</Text>
          </View>
          
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="trophy" size={16} color="#6466E9" />
              <Text style={styles.statLabel} numberOfLines={1}>Total</Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{stats.total}</Text>
          </View>
          
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="flash" size={16} color="#6466E9" />
              <Text style={styles.statLabel} numberOfLines={1}>Acc</Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{stats.accuracyPct}%</Text>
          </View>
          
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="time" size={16} color="#6466E9" />
              <Text style={styles.statLabel} numberOfLines={1}>Time</Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{stats.totalMinutes}m</Text>
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
});

export default GameStatsSection;
