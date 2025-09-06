import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useProfilePicture } from '../contexts/ProfilePictureContext';
import { HolisticProgressService } from '../lib/holisticProgressService';
import { ProfilePictureService } from '../lib/profilePictureService';
import ShareInvitationModal from '../components/ShareInvitationModal';
import ProfileAvatar from '../components/ProfileAvatar';
import ContactSupportModal from '../components/ContactSupportModal';
import SubscriptionStatus from '../components/SubscriptionStatus';

export default function ProfilePage() {
  const navigation = useNavigation();
  const { user, profile, signOut } = useAuth();
  const { triggerRefresh, refreshTrigger } = useProfilePicture();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareInvitation, setShowShareInvitation] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

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

    const loadProfilePicture = async () => {
      try {
        const savedImageUri = await ProfilePictureService.loadProfilePicture();
        if (savedImageUri) {
          setProfileImage(savedImageUri);
        }
      } catch (error) {
        console.error('Error loading profile picture:', error);
      }
    };

    fetchStreak();
    loadProfilePicture();
  }, [user?.id]);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to make this work!',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile picture
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // Save to persistent storage
        try {
          await ProfilePictureService.saveProfilePicture(imageUri);
          triggerRefresh(); // Use global refresh trigger
          Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
          console.error('Error saving profile picture:', error);
          Alert.alert('Error', 'Failed to save profile picture. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeProfilePicture = async () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProfilePictureService.removeProfilePicture();
              setProfileImage(null);
              triggerRefresh(); // Use global refresh trigger
              Alert.alert('Success', 'Profile picture removed!');
            } catch (error) {
              console.error('Error removing profile picture:', error);
              Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => {
        setShowSettings(true);
      },
    },
    {
      id: 'profile-picture',
      title: 'Change profile picture',
      icon: 'camera-outline',
      onPress: () => {
        pickImage();
      },
    },
    ...(profileImage ? [{
      id: 'remove-profile-picture',
      title: 'Remove profile picture',
      icon: 'trash-outline',
      onPress: () => {
        removeProfilePicture();
      },
    }] : []),
    {
      id: 'invite',
      title: 'Invite friends',
      icon: 'person-add-outline',
      onPress: () => {
        setShowShareInvitation(true);
      },
    },
    {
      id: 'access',
      title: 'Get access',
      icon: 'lock-closed-outline',
      onPress: () => {
        navigation.navigate('Paywall' as never);
      },
    },
    {
      id: 'help',
      title: 'Help Centre',
      icon: 'help-circle-outline',
      onPress: () => {
        Alert.alert('Help Centre', 'Help and support coming soon!');
      },
    },
    {
      id: 'support',
      title: 'Contact Support',
      icon: 'chatbubble-outline',
      onPress: () => {
        setShowContactSupport(true);
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View style={styles.userInfoSection}>
                  <TouchableOpacity style={styles.userAvatarContainer} onPress={pickImage}>
          <ProfileAvatar 
            size={80} 
            color="#6366f1" 
            onPress={pickImage}
            showCameraIcon={true}
            refreshTrigger={refreshTrigger}
          />
        </TouchableOpacity>
          <Text style={styles.userName}>{profile?.name || 'Dan'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'danord180@icloud.com'}</Text>
        </View>

        {/* Subscription Status */}
        <SubscriptionStatus 
          onUpgrade={() => {
            navigation.navigate('Paywall' as never);
          }}
        />

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color="#374151" />
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>


      </ScrollView>

      {/* Settings Modal */}
      {showSettings && (
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsModal}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Settings</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSettings(false)}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.settingsContent} showsVerticalScrollIndicator={false}>
              {/* Account Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionHeader}>Account</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="mail-outline" size={24} color="#374151" />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>{user?.email || 'danord180@icloud.com'}</Text>
                      <Text style={styles.settingSubtitle}>You have limited access</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.getAccessButton}>
                    <Text style={styles.getAccessButtonText}>Get access</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="log-out-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Log out</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    <Text style={[styles.settingTitle, styles.deleteAccountText]}>Delete account</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Downloads Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionHeader}>Downloads</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="download-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Automatic downloads</Text>
                  </View>
                  <View style={styles.settingRight}>
                    <Text style={styles.settingValue}>Wi-Fi only</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </View>
                </View>

                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="hardware-chip-outline" size={24} color="#f97316" />
                    <Text style={[styles.settingTitle, styles.orangeText]}>Free up some space on your device</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* General Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionHeader}>General</Text>
                
                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="notifications-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Reminders</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="mic-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Audio recordings</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="volume-high-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Sound effects</Text>
                  </View>
                  <TouchableOpacity style={styles.toggleButton}>
                    <View style={styles.toggleCircle} />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="flame-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Streak notifications</Text>
                  </View>
                  <TouchableOpacity style={styles.toggleButton}>
                    <View style={styles.toggleCircle} />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="play-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Automatically advance to the next exercise</Text>
                  </View>
                  <TouchableOpacity style={styles.toggleButton}>
                    <View style={styles.toggleCircle} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* About Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionHeader}>About</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="information-circle-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Version</Text>
                  </View>
                  <Text style={styles.settingValue}>21.81.1 (73610)</Text>
                </View>

                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="document-text-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Imprint</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="document-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Terms & Conditions</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="shield-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Privacy</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Subscriptions Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionHeader}>Subscriptions</Text>
                
                <TouchableOpacity style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="refresh-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Restore purchases</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
                </View>
      )}

      {/* Share Invitation Modal */}
      <ShareInvitationModal
        visible={showShareInvitation}
        onClose={() => setShowShareInvitation(false)}
      />

      {/* Contact Support Modal */}
      <ContactSupportModal
        visible={showContactSupport}
        onClose={() => setShowContactSupport(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  userInfoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'System',
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'System',
  },
  menuSection: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  signOutSection: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  // Settings Modal Styles
  settingsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  settingsModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  settingsContent: {
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  toggleButton: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#6366f1',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    transform: [{ translateX: 20 }],
  },
  // New Settings Styles
  settingsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  getAccessButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  getAccessButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteAccountText: {
    color: '#ef4444',
  },
  orangeText: {
    color: '#f97316',
  },
});
