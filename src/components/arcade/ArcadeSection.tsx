import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ArcadeGameCard from './ArcadeGameCard';
import ArcadeGameLauncher from './ArcadeGameLauncher';
import { ArcadeGame, ArcadeService } from '../../lib/arcadeService';
import { XPService } from '../../lib/xpService';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../lib/i18n';

interface ArcadeSectionProps {
  onGamePlayed?: () => void;
}

export default function ArcadeSection({ onGamePlayed }: ArcadeSectionProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [games, setGames] = useState<ArcadeGame[]>([]);
  const [highScores, setHighScores] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<ArcadeGame | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableXP, setAvailableXP] = useState(0);
  const [showXPInfoModal, setShowXPInfoModal] = useState(false);

  useEffect(() => {
    // Load all data together to ensure loading screen shows until everything is ready
    loadAllData();
  }, [user?.id]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      // Load games first
      await loadGames();
      // Then load user-specific data if user is logged in
      if (user?.id) {
        await Promise.all([
          loadHighScores(),
          loadAvailableXP()
        ]);
      }
    } catch (error) {
      console.error('Error loading arcade data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableXP = async () => {
    if (!user?.id) return;
    try {
      const xp = await XPService.getAvailableXP(user.id);
      setAvailableXP(xp);
    } catch (error) {
      console.error('Error loading available XP:', error);
    }
  };

  const loadGames = async () => {
    try {
      const fetchedGames = await ArcadeService.getActiveGames();
      setGames(fetchedGames);
    } catch (error) {
      console.error('Error loading games:', error);
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
    await Promise.all([loadGames(), loadHighScores(), loadAvailableXP()]);
    setRefreshing(false);
  };

  const handleGamePress = async (game: ArcadeGame) => {
    if (!user?.id) return;

    // Check if user can play (has enough XP for paid games)
    if (game.xp_cost > 0) {
      const playCheck = await ArcadeService.canPlayGame(user.id, game.id);
      
      if (!playCheck.canPlay) {
        alert(playCheck.message || t('arcade.error.cannotPlay'));
        return;
      }

      // Purchase the game (spend XP)
      const purchase = await ArcadeService.purchaseGame(user.id, game.id);
      if (!purchase.success) {
        alert(purchase.message || t('arcade.error.purchaseFailed'));
        return;
      }

      // Reload available XP after purchase
      await loadAvailableXP();
    }

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
    { id: 'all', name: t('arcade.categories.all'), icon: 'grid-outline' },
    { id: 'puzzle', name: t('arcade.categories.puzzle'), icon: 'extension-puzzle-outline' },
    { id: 'arcade', name: t('arcade.categories.arcade'), icon: 'game-controller-outline' },
    { id: 'classic', name: t('arcade.categories.classic'), icon: 'trophy-outline' },
    { id: 'action', name: t('arcade.categories.action'), icon: 'flash-outline' },
  ];

  const filteredGames = selectedCategory === 'all'
    ? games
    : games.filter(game => game.category === selectedCategory);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>{t('arcade.loadingGames')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Available XP Banner */}
      <View style={styles.xpBanner}>
        <View style={styles.xpBannerContent}>
          <Ionicons name="star" size={24} color="#F59E0B" />
          <View style={styles.xpTextContainer}>
            <Text style={styles.xpLabel}>{t('arcade.availableXP')}</Text>
            <Text style={styles.xpAmount}>{availableXP.toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.xpInfoButton}
            onPress={() => setShowXPInfoModal(true)}
          >
            <Ionicons name="information-circle-outline" size={20} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
        <Text style={styles.xpSubtext}>{t('arcade.spendXPToUnlock')}</Text>
      </View>

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
        contentContainerStyle={styles.gamesListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F59E0B" />
        }
      >
        {filteredGames.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="game-controller-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>{t('arcade.noGamesFound')}</Text>
            <Text style={styles.emptyText}>
              {selectedCategory === 'all'
                ? t('arcade.noGamesAvailable')
                : t('arcade.noCategoryGames', { category: selectedCategory })}
            </Text>
          </View>
        ) : (
          <>
            {filteredGames.map((game, index) => (
              <View 
                key={game.id}
                style={[
                  index === 0 && { marginTop: 16 },
                  index === filteredGames.length - 1 && { marginBottom: 40 }
                ]}
              >
                <ArcadeGameCard
                  game={game}
                  highScore={highScores.get(game.id)}
                  onPress={() => handleGamePress(game)}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Game Launcher */}
      <ArcadeGameLauncher
        visible={showGameModal}
        game={selectedGame}
        onClose={handleGameClose}
      />

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
              <Text style={styles.modalTitle}>{t('arcade.xpModal.title')}</Text>
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
                  <Text style={styles.explanationTitle}>{t('arcade.xpModal.totalEarnedTitle')}</Text>
                </View>
                <Text style={styles.explanationText}>
                  {t('arcade.xpModal.totalEarnedDescription')}
                </Text>
              </View>

              <View style={styles.explanationItem}>
                <View style={styles.explanationHeader}>
                  <Ionicons name="star" size={20} color="#F59E0B" />
                  <Text style={styles.explanationTitle}>{t('arcade.xpModal.availableTitle')}</Text>
                </View>
                <Text style={styles.explanationText}>
                  {t('arcade.xpModal.availableDescription')}
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.summaryText}>
                {t('arcade.xpModal.tip')} <Text style={styles.summaryBold}>{t('arcade.xpModal.tipText')}</Text>
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
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  xpBanner: {
    backgroundColor: '#1E293B',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#F59E0B',
  },
  xpBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  xpTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xpInfoButton: {
    padding: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  xpLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  xpAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: -0.5,
  },
  xpSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 36,
  },
  categoryContainer: {
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#475569',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  categoryButtonTextActive: {
    color: '#1E293B',
  },
  gamesList: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gamesListContent: {
    paddingHorizontal: 20,
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
    color: '#F1F5F9',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
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
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F1F5F9',
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
    color: '#F1F5F9',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  summaryText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  summaryBold: {
    fontWeight: '600',
    color: '#F1F5F9',
  },
});
