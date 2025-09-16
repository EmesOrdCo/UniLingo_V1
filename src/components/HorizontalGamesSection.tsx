import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.4; // 40% of screen width for each card
const CARD_SPACING = 16;

interface Game {
  id: string;
  title: string;
  tag: string;
  cards: number;
  progress: number;
  icon: string;
  onPlay: () => void;
}

interface HorizontalGamesSectionProps {
  games: Game[];
}

const HorizontalGamesSection: React.FC<HorizontalGamesSectionProps> = ({ games }) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionTitleContainer}>
        <Ionicons name="grid" size={24} color="#6366f1" />
        <Text style={styles.standardSectionTitle}>All Games</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
      >
        {games.map((game, index) => (
          <View 
            key={game.id} 
            style={[
              styles.gameCard,
              index === 0 && styles.firstCard,
              index === games.length - 1 && styles.lastCard
            ]}
          >
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
              <Text style={styles.gameCards}>{game.cards} cards available</Text>
            </View>

            {/* Play Button */}
            <TouchableOpacity style={styles.playButton} onPress={game.onPlay}>
              <Text style={styles.playButtonText}>Play Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
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
  scrollContent: {
    paddingHorizontal: 16,
  },
  gameCard: {
    width: CARD_WIDTH,
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 12,
    marginRight: CARD_SPACING,
    position: 'relative',
    minHeight: 160,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: 16, // Extra margin for last card
  },
  gameIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
    alignSelf: 'center',
  },
  gameInfo: {
    flex: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 16,
    textAlign: 'center',
  },
  gameTag: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  gameTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gameCards: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: '#6466E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#6466E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HorizontalGamesSection;
