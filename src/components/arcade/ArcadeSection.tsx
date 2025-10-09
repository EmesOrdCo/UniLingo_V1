import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ArcadeGameCard from './ArcadeGameCard';
import ArcadeGameLauncher from './ArcadeGameLauncher';
import { ArcadeGame, ArcadeService } from '../../lib/arcadeService';
import { useAuth } from '../../contexts/AuthContext';

interface ArcadeSectionProps {
  onGamePlayed?: () => void;
}

export default function ArcadeSection({ onGamePlayed }: ArcadeSectionProps) {
  const { user } = useAuth();
  const [games, setGames] = useState<ArcadeGame[]>([]);
  const [highScores, setHighScores] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<ArcadeGame | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadHighScores();
    }
  }, [user?.id]);

  const loadGames = async () => {
    try {
      const fetchedGames = await ArcadeService.getActiveGames();
      setGames(fetchedGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHighScores = async () => {
    if (!user?.id) return;
    try {
      const scores = await ArcadeService.getUserHighScores(user.id);
      setHighScores(scores);
    } catch (error) {
      console.error('Error loading high scores:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadGames(), loadHighScores()]);
    setRefreshing(false);
  };

  const handleGamePress = (game: ArcadeGame) => {
    setSelectedGame(game);
    setShowGameModal(true);
  };

  const handleGameClose = () => {
    setShowGameModal(false);
    setSelectedGame(null);
    loadHighScores(); // Reload high scores after game ends
    if (onGamePlayed) {
      onGamePlayed();
    }
  };

  const categories = [
    { id: 'all', name: 'All Games', icon: 'grid-outline' },
    { id: 'puzzle', name: 'Puzzle', icon: 'extension-puzzle-outline' },
    { id: 'arcade', name: 'Arcade', icon: 'game-controller-outline' },
    { id: 'classic', name: 'Classic', icon: 'trophy-outline' },
    { id: 'action', name: 'Action', icon: 'flash-outline' },
  ];

  const filteredGames = selectedCategory === 'all'
    ? games
    : games.filter(game => game.category === selectedCategory);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading arcade games...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="game-controller" size={24} color="#6366F1" />
          <Text style={styles.headerTitle}>Arcade</Text>
        </View>
        <View style={styles.freeBadge}>
          <Text style={styles.freeText}>ALL FREE</Text>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={13}
              color={selectedCategory === category.id ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.categoryButtonTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Games List */}
      <ScrollView
        style={styles.gamesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366F1" />
        }
      >
        {filteredGames.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="game-controller-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Games Found</Text>
            <Text style={styles.emptyText}>
              {selectedCategory === 'all'
                ? 'No arcade games available at the moment.'
                : `No ${selectedCategory} games available.`}
            </Text>
          </View>
        ) : (
          <>
            {filteredGames.map((game) => (
              <ArcadeGameCard
                key={game.id}
                game={game}
                highScore={highScores.get(game.id)}
                onPress={() => handleGamePress(game)}
              />
            ))}

            {/* Stats Footer */}
            <View style={styles.statsFooter}>
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={20} color="#F59E0B" />
                <Text style={styles.statText}>
                  {highScores.size} High Score{highScores.size !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="game-controller" size={20} color="#6366F1" />
                <Text style={styles.statText}>
                  {filteredGames.length} Game{filteredGames.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Game Launcher */}
      <ArcadeGameLauncher
        visible={showGameModal}
        game={selectedGame}
        onClose={handleGameClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  freeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  freeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 40,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 6,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
    height: 28,
  },
  categoryButtonActive: {
    backgroundColor: '#6366F1',
  },
  categoryButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  gamesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
