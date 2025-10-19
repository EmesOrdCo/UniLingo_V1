import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../lib/i18n';

interface Game {
  id: string;
  title: string;
  tag: string;
  cards: number;
  progress: number;
  icon: string;
  onPlay: () => void;
}

interface AllGamesSectionProps {
  games: Game[];
}

const AllGamesSection: React.FC<AllGamesSectionProps> = ({ games }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('games.allGames')}</Text>
      <View style={styles.gamesGrid}>
        {games.map((game) => (
          <View key={game.id} style={styles.gameCard}>

            {/* Game Icon */}
            <View style={styles.gameIconContainer}>
              <Ionicons name={game.icon as any} size={24} color="#6466E9" />
            </View>

            {/* Game Info */}
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle} numberOfLines={2}>
                {game.title}
              </Text>
              <View style={styles.gameTag}>
                <Text style={styles.gameTagText}>{game.tag}</Text>
              </View>
              <Text style={styles.gameCards}>{game.cards} {t('games.cardsAvailable')}</Text>
            </View>

            {/* Play Button */}
            <TouchableOpacity style={styles.playButton} onPress={game.onPlay}>
              <Text style={styles.playButtonText}>{t('games.playNow')}</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gameCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    minHeight: 160,
  },
  gameIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  gameInfo: {
    flex: 1,
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 18,
  },
  gameTag: {
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  gameTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  gameCards: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  playButton: {
    backgroundColor: '#6466E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default AllGamesSection;
