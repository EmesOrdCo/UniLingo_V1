import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { HolisticProgressService } from '../lib/holisticProgressService';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { user, profile, signOut } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    const fetchStreak = async () => {
      if (visible && user?.id) {
        try {
          const streak = await HolisticProgressService.getCurrentStreak(user.id, 'daily_study');
          setCurrentStreak(streak?.current_streak || 0);
        } catch (error) {
          console.error('Error fetching streak:', error);
        }
      }
    };

    fetchStreak();
  }, [visible, user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profile</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={48} color="#ffffff" />
            </View>
            <Text style={styles.profileName}>{profile?.name || 'User Name'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatNumber}>1,247</Text>
              <Text style={styles.profileStatLabel}>Total Cards</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatNumber}>892</Text>
              <Text style={styles.profileStatLabel}>Mastered</Text>
            </View>
            <View style={styles.profileStat}>
              <View style={styles.streakDisplay}>
                <Ionicons name="flame" size={16} color="#f59e0b" />
                <Text style={styles.profileStatNumber}>{currentStreak}</Text>
              </View>
              <Text style={styles.profileStatLabel}>Day Streak</Text>
            </View>
          </View>
          
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.profileActionButton}>
              <Ionicons name="person" size={20} color="#6366f1" />
              <Text style={styles.profileActionText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileActionButton}>
              <Ionicons name="settings" size={20} color="#6366f1" />
              <Text style={styles.profileActionText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.profileActionButton, styles.signOutButton]}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={[styles.profileActionText, styles.signOutText]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  streakDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileActions: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  profileActionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#fef2f2',
  },
  signOutText: {
    color: '#ef4444',
  },
});
