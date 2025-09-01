import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Game {
  id: string;
  title: string;
  tag: string;
  cards: number;
  progress: number;
  icon: string;
  isFavorite: boolean;
  onPlay: () => void;
}

interface FavouritesSectionProps {
  favorites: Game[];
  onToggleFavorite: (id: string) => void;
}

const FavouritesSection: React.FC<FavouritesSectionProps> = ({ favorites, onToggleFavorite }) => {
  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Favourites</Text>
        <View style={styles.emptyFavorite}>
          <View style={styles.emptyFavoriteIcon}>
            <Ionicons name="heart" size={20} color="#94a3b8" />
          </View>
          <Text style={styles.emptyFavoriteTitle}>No favourites yet</Text>
          <Text style={styles.emptyFavoriteText}>Tap the heart on any game to add it here.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Favourites</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.favoritesContainer}
      >
        {favorites.map((game) => (
          <View key={game.id} style={styles.favoriteCard}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => onToggleFavorite(game.id)}
            >
              <Ionicons 
                name="heart" 
                size={16} 
                color="#dc2626" 
              />
            </TouchableOpacity>

            <View style={styles.gameCardContent}>
              <View style={styles.gameCardInfo}>
                <Text style={styles.gameCardTitle}>{game.title}</Text>
                <View style={styles.gameCardTag}>
                  <Text style={styles.gameCardTagText}>{game.tag}</Text>
                </View>
                <Text style={styles.gameCardCards}>{game.cards} cards</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.playButton} onPress={game.onPlay}>
              <Text style={styles.playButtonText}>Play</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  favoritesContainer: {
    gap: 12,
  },
  favoriteCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 220,
    height: 180,
  },
  favoriteButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 10,
  },
  gameCardContent: {
    alignItems: 'flex-start',
    marginBottom: 50,
    height: '100%',
    justifyContent: 'space-between',
  },
  gameCardInfo: {
    alignItems: 'center',
    width: '100%',
  },
  gameCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  gameCardTag: {
    marginBottom: 4,
    alignSelf: 'center',
  },
  gameCardTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gameCardCards: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  playButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6466E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyFavorite: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyFavoriteIcon: {
    marginBottom: 8,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFavoriteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  emptyFavoriteText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 224,
  },
});

export default FavouritesSection;
