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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#10B981'; // Green
      case 'medium':
        return '#F59E0B'; // Orange
      case 'hard':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
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
          {game.xp_cost === 0 && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>FREE</Text>
            </View>
          )}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {game.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.tags}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(game.difficulty) + '20' }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(game.difficulty) }]}>
                {game.difficulty.toUpperCase()}
              </Text>
            </View>
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

      {/* Play Button */}
      <View style={styles.playButton}>
        <Ionicons name="play" size={24} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  freeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  freeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  highScoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
