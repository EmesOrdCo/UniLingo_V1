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
      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
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
                size={16}
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
      </View>

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
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trophy" size={24} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.statValue}>{highScores.size}</Text>
                  <Text style={styles.statLabel}>High Score{highScores.size !== 1 ? 's' : ''}</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="game-controller" size={24} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.statValue}>{filteredGames.length}</Text>
                  <Text style={styles.statLabel}>Game{filteredGames.length !== 1 ? 's' : ''}</Text>
                </View>
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
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  gamesList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 28,
    marginTop: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
});
