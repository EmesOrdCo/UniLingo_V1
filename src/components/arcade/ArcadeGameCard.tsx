import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArcadeGame } from '../../lib/arcadeService';

interface ArcadeGameCardProps {
  game: ArcadeGame;
  highScore?: number;
  onPress: () => void;
}

export default function ArcadeGameCard({ game, highScore, onPress }: ArcadeGameCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'puzzle':
        return 'extension-puzzle-outline';
      case 'arcade':
        return 'game-controller-outline';
      case 'classic':
        return 'trophy-outline';
      case 'action':
        return 'flash-outline';
      default:
        return 'game-controller-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'puzzle':
        return '#8B5CF6'; // Purple
      case 'arcade':
        return '#3B82F6'; // Blue
      case 'classic':
        return '#F59E0B'; // Orange
      case 'action':
        return '#EF4444'; // Red
      default:
        return '#6366F1'; // Indigo
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: getCategoryColor(game.category) }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon Section */}
      <View style={[styles.iconContainer, { backgroundColor: getCategoryColor(game.category) + '20' }]}>
        <Ionicons
          name={getCategoryIcon(game.category) as any}
          size={32}
          color={getCategoryColor(game.category)}
        />
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.gameName} numberOfLines={1}>
            {game.name}
          </Text>
          {game.xp_cost === 0 ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>FREE</Text>
            </View>
          ) : (
            <View style={styles.costBadge}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.costText}>{game.xp_cost}</Text>
            </View>
          )}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {game.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.tags}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{game.category}</Text>
            </View>
          </View>

          {highScore !== undefined && highScore > 0 && (
            <View style={styles.highScoreContainer}>
              <Ionicons name="trophy" size={14} color="#F59E0B" />
              <Text style={styles.highScoreText}>{highScore.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    borderLeftWidth: 5,
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  gameName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#F1F5F9',
    flex: 1,
    letterSpacing: -0.3,
  },
  freeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  freeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  costText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 10,
    lineHeight: 20,
    minHeight: 40,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  highScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
});
