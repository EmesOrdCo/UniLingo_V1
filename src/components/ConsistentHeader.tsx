import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useProfilePicture } from '../contexts/ProfilePictureContext';
import { useRefresh } from '../contexts/RefreshContext';
import { HolisticProgressService } from '../lib/holisticProgressService';
import StreakDetailsModal from './StreakDetailsModal';
import ProfileAvatar from './ProfileAvatar';

interface ConsistentHeaderProps {
  pageName: string;
  isOverview?: boolean;
  streakCount?: number; // Optional, will be fetched automatically if not provided
  showBackButton?: boolean;
  onBackPress?: () => void;
  pageIcon?: keyof typeof Ionicons.glyphMap;
  darkMode?: boolean; // For dark themed pages like Arcade
}

export default function ConsistentHeader({
  pageName,
  isOverview = false,
  streakCount = 0,
  showBackButton = false,
  onBackPress,
  pageIcon,
  darkMode = false
}: ConsistentHeaderProps) {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const { refreshTrigger: profileRefreshTrigger } = useProfilePicture();
  const { refreshTrigger } = useRefresh();
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
  }, [user?.id, refreshTrigger]); // Add refreshTrigger dependency

  return (
    <View style={[styles.header, darkMode && styles.headerDark]}>
      <View style={styles.headerLeft}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackPress || (() => navigation.goBack())}
          >
            <Ionicons name="arrow-back" size={24} color={darkMode ? "#F1F5F9" : "#1f2937"} />
          </TouchableOpacity>
        )}
        {isOverview ? (
          <Text style={[styles.greetingText, darkMode && styles.greetingTextDark]}>
            Hi, {profile?.name || user?.email?.split('@')[0] || 'User'}
          </Text>
        ) : (
          <View style={styles.pageTitleContainer}>
            {pageIcon && (
              <View style={[styles.pageIconContainer, darkMode && styles.pageIconContainerDark]}>
                <Ionicons name={pageIcon} size={24} color={darkMode ? "#F59E0B" : "#6366f1"} />
              </View>
            )}
            <Text style={[styles.pageNameText, darkMode && styles.pageNameTextDark]}>{pageName}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={[styles.streakContainer, darkMode && styles.streakContainerDark]}
          onPress={() => setShowStreakModal(true)}
        >
          <Ionicons name="flame" size={20} color="#f59e0b" />
          <Text style={[styles.streakText, darkMode && styles.streakTextDark]}>{currentStreak}</Text>
        </TouchableOpacity>
        
                              <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <ProfileAvatar size={32} color={darkMode ? "#F59E0B" : "#6366f1"} refreshTrigger={profileRefreshTrigger} />
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
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  pageTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 28,
    fontWeight: '700',
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
  // Dark mode styles
  headerDark: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 2,
    borderBottomColor: '#334155',
  },
  greetingTextDark: {
    color: '#F1F5F9',
  },
  pageNameTextDark: {
    color: '#F1F5F9',
  },
  pageIconContainerDark: {
    backgroundColor: '#334155',
  },
  streakContainerDark: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  streakTextDark: {
    color: '#F59E0B',
  },
});
