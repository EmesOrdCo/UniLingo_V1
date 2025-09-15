import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { DailyChallengeService, DailyChallenge } from '../lib/dailyChallengeService';
import { UserFlashcardService } from '../lib/userFlashcardService';

interface DailyChallengeSectionProps {
  onPlay: (gameType: string) => void;
}

const DailyChallengeSection: React.FC<DailyChallengeSectionProps> = ({ onPlay }) => {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    loadTodaysChallenge();
  }, [user]);

  const loadTodaysChallenge = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let todaysChallenge = await DailyChallengeService.getTodaysChallenge(user.id);
      
      // Create challenge if it doesn't exist
      if (!todaysChallenge) {
        todaysChallenge = await DailyChallengeService.createTodaysChallenge(user.id);
      }
      
      setChallenge(todaysChallenge);
    } catch (error) {
      console.error('Error loading daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async () => {
    if (challenge && !challenge.completed) {
      // Check if user has flashcards
      try {
        const flashcards = await UserFlashcardService.getUserFlashcards(user!.id);
        if (flashcards.length === 0) {
          Alert.alert(
            'No Flashcards Available',
            'Games require flashcards to work. Please create some flashcards first by going to the Flashcards section and adding vocabulary words.',
            [
              {
                text: 'Go to Flashcards',
                onPress: () => navigation.navigate('Flashcards' as never)
              },
              {
                text: 'OK',
                style: 'cancel'
              }
            ]
          );
          return;
        }
      } catch (error) {
        console.error('Error checking flashcards:', error);
        Alert.alert(
          'Error',
          'Unable to check flashcards. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      onPlay(challenge.game_type);
    }
  };

  // Don't show if loading
  if (loading || !challenge) {
    return null;
  }

  // Show completion state if completed
  if (challenge.completed) {
    return (
      <View style={styles.container}>
        <View style={styles.heroCarousel}>
          <View style={styles.completedBackgroundGradient}>
            <View style={styles.content}>
              <View style={styles.textContent}>
                <Text style={styles.subtitle}>+{challenge.xp_reward} XP earned!</Text>
                <Text style={styles.title}>✅ Daily Challenge Complete</Text>
                <Text style={styles.gameType}>{challenge.game_type}</Text>
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              </View>
              <View style={styles.iconContainer}>
                <Ionicons name="trophy" size={36} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCarousel}>
        <View style={styles.backgroundGradient}>
          <View style={styles.content}>
            <View style={styles.textContent}>
              <Text style={styles.title}>Daily game challenge</Text>
              <Text style={styles.description}>Play today's featured game to earn bonus XP!</Text>
              <TouchableOpacity style={styles.ctaButton} onPress={handlePlay}>
                <Text style={styles.ctaButtonText}>Play now</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.iconContainer}>
              <Ionicons name="flame" size={36} color="#6466E9" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
  },
  heroCarousel: {
    height: 180,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 35,
    elevation: 10,
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#E0E7FF',
    backgroundImage: 'radial-gradient(120% 100% at -10% -20%, #F0F4FF 0%, #E0E7FF 40%, #C7D2FE 70%)',
  },
  completedBackgroundGradient: {
    flex: 1,
    backgroundColor: '#10b981',
    backgroundImage: 'radial-gradient(120% 100% at -10% -20%, #34d399 0%, #10b981 40%, #059669 70%)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  textContent: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#6466E9',
    paddingHorizontal: 80,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  iconContainer: {
    paddingRight: 8,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default DailyChallengeSection;
