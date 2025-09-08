import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { DailyChallengeService, DailyChallenge } from '../lib/dailyChallengeService';

interface DailyChallengeSectionProps {
  onPlay: (gameType: string) => void;
}

const DailyChallengeSection: React.FC<DailyChallengeSectionProps> = ({ onPlay }) => {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  const handlePlay = () => {
    if (challenge && !challenge.completed) {
      onPlay(challenge.game_type);
    }
  };

  // Don't show if completed or loading
  if (loading || !challenge || challenge.completed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCarousel}>
        <View style={styles.backgroundGradient}>
          <View style={styles.content}>
            <View style={styles.textContent}>
              <Text style={styles.subtitle}>Win {challenge.xp_reward} XP today</Text>
              <Text style={styles.title}>🔥 Daily Challenge</Text>
              <Text style={styles.gameType}>{challenge.game_type}</Text>
              <TouchableOpacity style={styles.ctaButton} onPress={handlePlay}>
                <Text style={styles.ctaButtonText}>Play now</Text>
                <Ionicons name="arrow-forward" size={16} color="#6466E9" />
              </TouchableOpacity>
            </View>
            <View style={styles.iconContainer}>
              <Ionicons name="flame" size={36} color="rgba(255,255,255,0.9)" />
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
    height: 144,
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
    backgroundColor: '#6466E9',
    backgroundImage: 'radial-gradient(120% 100% at -10% -20%, #9294FF 0%, #6466E9 40%, #4f51d6 70%)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
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
    color: '#ffffff',
    marginBottom: 8,
  },
  gameType: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    color: '#6466E9',
  },
  iconContainer: {
    paddingRight: 8,
  },
});

export default DailyChallengeSection;
