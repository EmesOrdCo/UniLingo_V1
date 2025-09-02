import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { HolisticProgressService } from '../lib/holisticProgressService';
import StreakDetailsModal from './StreakDetailsModal';
import ProfileAvatar from './ProfileAvatar';

interface ConsistentHeaderProps {
  pageName: string;
  isOverview?: boolean;
  streakCount?: number; // Optional, will be fetched automatically if not provided
}

export default function ConsistentHeader({
  pageName,
  isOverview = false,
  streakCount = 0 
}: ConsistentHeaderProps) {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(streakCount);
  const [showStreakModal, setShowStreakModal] = useState(false);

  useEffect(() => {
    const fetchStreak = async () => {
      if (user?.id) {
        try {
          const streak = await HolisticProgressService.getCurrentStreak(user.id, 'daily_study');
          setCurrentStreak(streak?.current_streak || 0);
        } catch (error) {
          console.error('Error fetching streak:', error);
        }
      }
    };

    fetchStreak();
  }, [user?.id]);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {isOverview ? (
          <Text style={styles.greetingText}>
            Hi, {profile?.name || user?.email?.split('@')[0] || 'User'}
          </Text>
        ) : (
          <Text style={styles.pageNameText}>{pageName}</Text>
        )}
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.streakContainer}
          onPress={() => setShowStreakModal(true)}
        >
          <Ionicons name="flame" size={20} color="#f59e0b" />
          <Text style={styles.streakText}>{currentStreak}</Text>
        </TouchableOpacity>
        
                              <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <ProfileAvatar size={32} color="#6366f1" />
        </TouchableOpacity>
      </View>
      
      {/* Streak Details Modal */}
      <StreakDetailsModal 
        visible={showStreakModal}
        onClose={() => setShowStreakModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'System',
  },
  pageNameText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'System',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    // Add subtle shadow and press effect to indicate it's clickable
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  profileButton: {
    padding: 4,
  },
});
