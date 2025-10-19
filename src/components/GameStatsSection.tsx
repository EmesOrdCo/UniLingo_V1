import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../lib/i18n';

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
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.sectionTitleContainer}>
        <Ionicons name="game-controller" size={24} color="#6366f1" />
        <Text style={styles.standardSectionTitle}>{t('games.yourGameStats')}</Text>
      </View>
      
      <View style={styles.statsGrid}>
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="game-controller" size={16} color="#6466E9" />
              <Text style={styles.statLabel} numberOfLines={1}>{t('games.today')}</Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{stats.today}</Text>
          </View>
          
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="trophy" size={16} color="#6466E9" />
              <Text style={styles.statLabel} numberOfLines={1}>{t('games.total')}</Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{stats.total}</Text>
          </View>
          
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="flash" size={16} color="#6466E9" />
              <Text style={styles.statLabel} numberOfLines={1}>{t('games.acc')}</Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{stats.accuracyPct}%</Text>
          </View>
          
          <View style={styles.stat}>
            <View style={styles.statHeader}>
              <Ionicons name="time" size={16} color="#6466E9" />
              <Text style={styles.statLabel} numberOfLines={1}>{t('games.time')}</Text>
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
    marginTop: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  standardSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
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
