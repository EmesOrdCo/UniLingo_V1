import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Linking } from 'react-native';
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
import AIUsageBar from '../components/AIUsageBar';
// Character system removed - will implement custom 2D system

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
  // Character system state removed

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
      if (!user?.id) return;
      
      try {
        const savedImageUri = await ProfilePictureService.loadProfilePicture(user.id);
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
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for profile picture
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // Save to persistent storage
        try {
          if (!user?.id) {
            Alert.alert('Error', 'User not authenticated');
            return;
          }
          await ProfilePictureService.saveProfilePicture(imageUri, user.id);
          triggerRefresh(); // Use global refresh trigger
          Alert.alert('Success', 'Profile picture updated!');
        } catch (error) {
          console.error('Error saving profile picture:', error);
          Alert.alert('Error', 'Failed to save profile picture. Please try again.');
        }
      }
    } catch (error) {
      // Don't log cancellation errors - they're normal user actions
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
              await ProfilePictureService.removeProfilePicture(user?.id || '');
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

  const handleManageAccount = async () => {
    try {
      const manageAccountUrl = 'https://unilingo.co.uk/manage-account';
      
      const supported = await Linking.canOpenURL(manageAccountUrl);
      if (supported) {
        await Linking.openURL(manageAccountUrl);
      } else {
        Alert.alert('Error', 'Cannot open manage account page');
      }
    } catch (error) {
      console.error('Error opening manage account:', error);
      Alert.alert('Error', 'Failed to open manage account page');
    }
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
      id: 'faq',
      title: 'FAQs',
      icon: 'help-circle-outline',
      onPress: () => {
        navigation.navigate('FAQ' as never);
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <Text style={styles.userName}>{profile?.name || user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
        </View>

        {/* Subscription Status */}
        <SubscriptionStatus 
          onUpgrade={() => {
            // Paywall removed - users go to subscription website
          }}
        />

        {/* AI Usage */}
        <AIUsageBar />

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
                      <Text style={styles.settingTitle}>{user?.email || 'No email'}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.settingItem} onPress={handleManageAccount}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Manage your account</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="log-out-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Log out</Text>
                  </View>
                </TouchableOpacity>
              </View>



              {/* About Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionHeader}>About</Text>
                
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => navigation.navigate('TermsAndConditions' as never)}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name="document-text-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Terms and Conditions</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => navigation.navigate('PrivacyPolicy' as never)}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Privacy Policy</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="information-circle-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>Version</Text>
                  </View>
                  <Text style={styles.settingValue}>1.0</Text>
                </View>

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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
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
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#f8fafc',
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
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orangeText: {
    color: '#6466E9',
  },
});
