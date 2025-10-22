import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { HolisticProgressService } from '../lib/holisticProgressService';
import { useTranslation } from '../lib/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import ShareInvitationModal from '../components/ShareInvitationModal';
import ContactSupportModal from '../components/ContactSupportModal';
import SubscriptionStatus from '../components/SubscriptionStatus';
import AIUsageBar from '../components/AIUsageBar';
import Avatar from '../components/avatar/Avatar';
import { loadAvatarOptions } from '../store/slices/avatarSlice';
// Character system removed - will implement custom 2D system

const { width } = Dimensions.get('window');

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user, profile, signOut } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareInvitation, setShowShareInvitation] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
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


    const loadAvatarOptionsFromStorage = async () => {
      try {
        const savedOptions = await AsyncStorage.getItem('avatar-options');
        if (savedOptions) {
          dispatch(loadAvatarOptions(JSON.parse(savedOptions)));
        }
      } catch (error) {
        console.error('Error loading avatar options:', error);
      }
    };

    fetchStreak();
    loadAvatarOptionsFromStorage();
  }, [user?.id, dispatch]);



  const handleSignOut = async () => {
    Alert.alert(
      t('profile.signOut.title'),
      t('profile.signOut.message'),
      [
        { text: t('profile.signOut.cancel'), style: 'cancel' },
        {
          text: t('profile.signOut.confirm'),
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
        Alert.alert(t('profile.picture.error'), t('profile.account.cannotOpen'));
      }
    } catch (error) {
      console.error('Error opening manage account:', error);
      Alert.alert(t('profile.picture.error'), t('profile.account.failedOpen'));
    }
  };

  const menuItems = [
    {
      id: 'settings',
      title: t('profile.menu.settings'),
      icon: 'settings-outline',
      onPress: () => {
        setShowSettings(true);
      },
    },
    {
      id: 'invite',
      title: t('profile.menu.inviteFriends'),
      icon: 'person-add-outline',
      onPress: () => {
        setShowShareInvitation(true);
      },
    },
    {
      id: 'faq',
      title: t('profile.menu.faq'),
      icon: 'help-circle-outline',
      onPress: () => {
        navigation.navigate('FAQ' as never);
      },
    },
    {
      id: 'support',
      title: t('profile.menu.contactSupport'),
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
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
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
          {/* Avatar Character */}
          <View style={styles.characterAvatarContainer}>
            <View style={styles.avatarWrapper}>
              <Avatar size={200} />
            </View>
            <View style={styles.characterEditBadge}>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </View>
          </View>
          
          {/* Shop Button */}
          <View style={styles.shopButtonContainer}>
            <View style={styles.shopBacklightEffect} />
            <TouchableOpacity 
              style={styles.shopButton}
              onPress={() => navigation.navigate('AvatarEditor' as never)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shopButtonGradient}
              >
                <View style={styles.shopButtonContent}>
                  <Text style={styles.shopButtonTitle}>SHOP</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{profile?.name || user?.email?.split('@')[0] || t('profile.user')}</Text>
          <Text style={styles.userEmail}>{user?.email || t('profile.noEmail')}</Text>
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
              <Text style={styles.settingsTitle}>{t('profile.settings.title')}</Text>
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
                <Text style={styles.sectionHeader}>{t('profile.settings.account')}</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="mail-outline" size={24} color="#374151" />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>{user?.email || t('profile.noEmail')}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.settingItem} onPress={handleManageAccount}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>{t('profile.settings.manageAccount')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="log-out-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>{t('profile.settings.logOut')}</Text>
                  </View>
                </TouchableOpacity>
              </View>



              {/* About Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionHeader}>{t('profile.settings.about')}</Text>
                
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => navigation.navigate('TermsAndConditions' as never)}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name="document-text-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>{t('profile.settings.termsAndConditions')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => navigation.navigate('PrivacyPolicy' as never)}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>{t('profile.settings.privacyPolicy')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Ionicons name="information-circle-outline" size={24} color="#374151" />
                    <Text style={styles.settingTitle}>{t('profile.settings.version')}</Text>
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
  characterAvatarContainer: {
    position: 'relative',
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  shopButtonContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  shopBacklightEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8B5CF6',
    opacity: 0.15,
    borderRadius: 24,
    transform: [{ scale: 0.95 }],
  },
  shopButton: {
    width: 200,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  shopButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  shopButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  shopButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shopButtonText: {
    flex: 1,
  },
  shopButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  shopButtonSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  characterEditBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
