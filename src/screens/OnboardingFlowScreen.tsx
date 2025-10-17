import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  FlatList,
  Platform,
  Modal,
  Linking,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileService } from '../lib/userProfileService';
import { supabase } from '../lib/supabase';
import { NotificationService } from '../lib/notificationService';
import { completeOnboarding } from '../onboarding/completeOnboarding';
import SubjectSelectionScreen from './SubjectSelectionScreen';

// Comprehensive list of languages supported by ChatGPT/OpenAI
const SUPPORTED_LANGUAGES = [
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦', highlighted: false },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱', highlighted: false },
  { code: 'am', name: 'Amharic', flag: '🇪🇹', highlighted: false },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', highlighted: false },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲', highlighted: false },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿', highlighted: false },
  { code: 'eu', name: 'Basque', flag: '🇪🇸', highlighted: false },
  { code: 'be', name: 'Belarusian', flag: '🇧🇾', highlighted: false },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', highlighted: false },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦', highlighted: false },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬', highlighted: false },
  { code: 'ca', name: 'Catalan', flag: '🇪🇸', highlighted: false },
  { code: 'ceb', name: 'Cebuano', flag: '🇵🇭', highlighted: false },
  { code: 'ny', name: 'Chichewa', flag: '🇲🇼', highlighted: false },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳', highlighted: true },
  { code: 'zh-tw', name: 'Chinese (Traditional)', flag: '🇹🇼', highlighted: true },
  { code: 'co', name: 'Corsican', flag: '🇫🇷', highlighted: false },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷', highlighted: false },
  { code: 'cs', name: 'Czech', flag: '🇨🇿', highlighted: false },
  { code: 'da', name: 'Danish', flag: '🇩🇰', highlighted: false },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', highlighted: false },
  { code: 'en', name: 'English', flag: '🇺🇸', highlighted: true },
  { code: 'eo', name: 'Esperanto', flag: '🌍', highlighted: false },
  { code: 'et', name: 'Estonian', flag: '🇪🇪', highlighted: false },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭', highlighted: false },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮', highlighted: false },
  { code: 'fr', name: 'French', flag: '🇫🇷', highlighted: true },
  { code: 'fy', name: 'Frisian', flag: '🇳🇱', highlighted: false },
  { code: 'gl', name: 'Galician', flag: '🇪🇸', highlighted: false },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪', highlighted: false },
  { code: 'de', name: 'German', flag: '🇩🇪', highlighted: true },
  { code: 'el', name: 'Greek', flag: '🇬🇷', highlighted: false },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳', highlighted: false },
  { code: 'ht', name: 'Haitian Creole', flag: '🇭🇹', highlighted: false },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬', highlighted: false },
  { code: 'haw', name: 'Hawaiian', flag: '🇺🇸', highlighted: false },
  { code: 'iw', name: 'Hebrew', flag: '🇮🇱', highlighted: false },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', highlighted: true },
  { code: 'hmn', name: 'Hmong', flag: '🇱🇦', highlighted: false },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺', highlighted: false },
  { code: 'is', name: 'Icelandic', flag: '🇮🇸', highlighted: false },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬', highlighted: false },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩', highlighted: false },
  { code: 'ga', name: 'Irish', flag: '🇮🇪', highlighted: false },
  { code: 'it', name: 'Italian', flag: '🇮🇹', highlighted: false },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', highlighted: false },
  { code: 'jw', name: 'Javanese', flag: '🇮🇩', highlighted: false },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳', highlighted: false },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿', highlighted: false },
  { code: 'km', name: 'Khmer', flag: '🇰🇭', highlighted: false },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', highlighted: false },
  { code: 'ku', name: 'Kurdish (Kurmanji)', flag: '🇮🇶', highlighted: false },
  { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬', highlighted: false },
  { code: 'lo', name: 'Lao', flag: '🇱🇦', highlighted: false },
  { code: 'la', name: 'Native', flag: '🏛️', highlighted: false },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻', highlighted: false },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹', highlighted: false },
  { code: 'lb', name: 'Luxembourgish', flag: '🇱🇺', highlighted: false },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰', highlighted: false },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬', highlighted: false },
  { code: 'ms', name: 'Malay', flag: '🇲🇾', highlighted: false },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳', highlighted: false },
  { code: 'mt', name: 'Maltese', flag: '🇲🇹', highlighted: false },
  { code: 'mi', name: 'Maori', flag: '🇳🇿', highlighted: false },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳', highlighted: false },
  { code: 'mn', name: 'Mongolian', flag: '🇲🇳', highlighted: false },
  { code: 'my', name: 'Myanmar (Burmese)', flag: '🇲🇲', highlighted: false },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵', highlighted: false },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴', highlighted: false },
  { code: 'ps', name: 'Pashto', flag: '🇦🇫', highlighted: false },
  { code: 'fa', name: 'Persian', flag: '🇮🇷', highlighted: false },
  { code: 'pl', name: 'Polish', flag: '🇵🇱', highlighted: false },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', highlighted: false },
  { code: 'ma', name: 'Punjabi', flag: '🇮🇳', highlighted: false },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴', highlighted: false },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', highlighted: false },
  { code: 'sm', name: 'Samoan', flag: '🇼🇸', highlighted: false },
  { code: 'gd', name: 'Scots Gaelic', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', highlighted: false },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸', highlighted: false },
  { code: 'st', name: 'Sesotho', flag: '🇱🇸', highlighted: false },
  { code: 'sn', name: 'Shona', flag: '🇿🇼', highlighted: false },
  { code: 'sd', name: 'Sindhi', flag: '🇵🇰', highlighted: false },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰', highlighted: false },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰', highlighted: false },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮', highlighted: false },
  { code: 'so', name: 'Somali', flag: '🇸🇴', highlighted: false },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', highlighted: true },
  { code: 'su', name: 'Sundanese', flag: '🇮🇩', highlighted: false },
  { code: 'sw', name: 'Swahili', flag: '🇹🇿', highlighted: false },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪', highlighted: false },
  { code: 'tg', name: 'Tajik', flag: '🇹🇯', highlighted: false },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', highlighted: false },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', highlighted: false },
  { code: 'th', name: 'Thai', flag: '🇹🇭', highlighted: false },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', highlighted: false },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦', highlighted: false },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰', highlighted: false },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿', highlighted: false },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', highlighted: false },
  { code: 'cy', name: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', highlighted: false },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦', highlighted: false },
  { code: 'yi', name: 'Yiddish', flag: '🇮🇱', highlighted: false },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬', highlighted: false },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦', highlighted: false },
];

const DISCOVERY_SOURCES = [
  'Google Search',
  'App Store',
  'Facebook',
  'Instagram',
  'TikTok',
  'Twitter/X',
  'LinkedIn',
  'Friend/Family',
  'YouTube',
  'Podcast',
  'Website',
  'Advertisement',
  'My university',
  'Other'
];

// Animated Highlighted Language Item Component
interface AnimatedHighlightedLanguageItemProps {
  item: { code: string; name: string; flag: string; highlighted: boolean };
  isSelected: boolean;
  onPress: () => void;
  languageModalType: 'native' | 'target';
  formData: any;
}

const AnimatedHighlightedLanguageItem = ({ item, isSelected, onPress, languageModalType, formData }: AnimatedHighlightedLanguageItemProps) => {
  const shineAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Enhanced shine effect animation with staggered timing
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnimation, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.delay(1000), // Pause between shine cycles
        Animated.timing(shineAnimation, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.delay(2000), // Longer pause
      ])
    );

    // More subtle and elegant pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.015,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Start animations with slight delay for staggered effect
    setTimeout(() => {
      shineLoop.start();
      pulseLoop.start();
    }, 500);

    return () => {
      shineLoop.stop();
      pulseLoop.stop();
    };
  }, [shineAnimation, pulseAnimation]);

  const shineTranslateX = shineAnimation.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [-120, 0, 0, 120],
  });

  const shineOpacity = shineAnimation.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: [0, 0.3, 0.7, 0.3, 0],
  });

  const shineScale = shineAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 0.8],
  });

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
      <TouchableOpacity
        style={[
          styles.languageItem,
          styles.languageItemHighlighted,
          isSelected && styles.languageItemSelected
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Enhanced shine effect overlay */}
        <Animated.View
          style={[
            styles.shineOverlay,
            {
              transform: [
                { translateX: shineTranslateX },
                { scale: shineScale }
              ],
              opacity: shineOpacity,
            },
          ]}
        />
        
        <View style={styles.languageItemContent}>
          <Text style={styles.flagEmoji}>{item.flag}</Text>
          <Text style={[
            styles.languageName,
            styles.languageNameHighlighted,
            isSelected && styles.languageNameSelected
          ]}>
            {item.name}
          </Text>
          <View style={styles.highlightedBadge}>
            <Text style={styles.highlightedBadgeText}>Featured</Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color="#6366f1" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function OnboardingFlowScreen({ route }: { route?: any }) {
  const navigation = useNavigation();
  const { user, clearNewUserFlag, refreshProfile, signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [languageModalType, setLanguageModalType] = useState<'native' | 'target'>('target');
  
  // Form data
  const [formData, setFormData] = useState({
    nativeLanguage: '',
    targetLanguage: '', // Allow user to select
    subject: '',
    proficiency: '',
    timeCommitment: '',
    wantsNotifications: true,
    discoverySource: '',
    firstName: '',
    email: route?.params?.prefillEmail || '',
    password: route?.params?.prefillPassword || '',
  });

  // Check if we're returning from email confirmation
  useEffect(() => {
    console.log('🔍 Email confirmation useEffect triggered:', {
      fromEmailConfirmation: route?.params?.fromEmailConfirmation,
      routeParams: route?.params,
      currentStep: currentStep
    });
    
    if (route?.params?.fromEmailConfirmation) {
      // User has confirmed their email, now redirect to subscription
      console.log('📧 Returning from email confirmation, redirecting to subscription...');
      redirectToSubscription();
    }
  }, [route?.params?.fromEmailConfirmation, currentStep]);

  // Also check on component mount
  useEffect(() => {
    console.log('🔍 OnboardingFlowScreen mounted with params:', route?.params);
    if (route?.params?.fromEmailConfirmation) {
      console.log('📧 Component mount: Returning from email confirmation, redirecting to subscription...');
      redirectToSubscription();
    }
  }, []);

  const totalSteps = 7; // Reduced from 9 to 7 (removed plan selection and trial confirmation)

  // Check if user's email is confirmed (only for existing users, not during signup)
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      // Don't interfere with the onboarding flow when user is signing up
      if (user && !user.email_confirmed_at && currentStep === 0) {
        // Only check for existing users who return to onboarding, not during signup
        Alert.alert(
          'Email Confirmation Required',
          'Please confirm your email address before continuing with onboarding.',
          [
            {
              text: 'OK',
              onPress: () => (navigation as any).navigate('EmailConfirmation', { email: user.email }),
            },
          ]
        );
      }
    };

    checkEmailConfirmation();
  }, [user, navigation, currentStep]);

  const nextStep = () => {
    console.log('🔄 nextStep called - currentStep:', currentStep, 'totalSteps:', totalSteps);
    console.log('📊 canProceed():', canProceed());
    console.log('📝 formData:', formData);
    console.log('🔢 Step calculation - currentStep:', currentStep, 'currentStep + 1:', currentStep + 1);
    
    if (currentStep < totalSteps - 1) {
      console.log('➡️ Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log('🏁 Completing onboarding');
      // Complete onboarding
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const redirectToSubscription = async () => {
    try {
      console.log('🚀 Redirecting to subscription after email confirmation...');
      console.log('🔍 Current formData:', formData);
      
      // First, save the onboarding data to the database
      const onboardingData = {
        firstName: formData.firstName,
        email: formData.email,
        nativeLanguage: formData.nativeLanguage,
        targetLanguage: formData.targetLanguage,
        proficiency: formData.proficiency as 'none' | 'basic' | 'advanced',
        dailyCommitmentMinutes: parseInt(formData.timeCommitment) as 5 | 15 | 30 | 60 || undefined,
        discoverySource: formData.discoverySource as 'search' | 'radio' | 'tv' | 'other' | 'facebook_instagram' | 'podcast' | 'friends_family' | 'youtube' | 'app_store' | 'website_ad',
        wantsNotifications: formData.wantsNotifications,
        goals: formData.subject ? [formData.subject] : [], // Map subject to goals array
        ageRange: undefined, // Not collected in this flow
      };

      const result = await completeOnboarding({ data: onboardingData });
      
      if (!result.ok) {
        Alert.alert('Error', result.error || 'Failed to save profile data. Please try again.');
        return;
      }

      console.log('✅ Profile data saved successfully!');
      
      // Now redirect to subscription website
      if (user) {
        const subscriptionUrl = `https://unilingo.co.uk/subscription.html?user_id=${user.id}&email=${encodeURIComponent(user.email || '')}&token=${user.id}`;
        
        console.log('🔗 Redirecting to subscription page:', subscriptionUrl);
        
        const { Linking } = require('react-native');
        const canOpen = await Linking.canOpenURL(subscriptionUrl);
        
        if (canOpen) {
          Alert.alert(
            'Complete Registration',
            'You will be redirected to complete your subscription. Once completed, you can return to the app.',
            [
              { 
                text: 'OK', 
                onPress: () => {
                  // Clear new user flag and refresh profile
                  clearNewUserFlag();
                  refreshProfile();
                }
              },
            ]
          );
        } else {
          Alert.alert('Error', 'Cannot open subscription page. Please try again.');
        }
      }
      
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error redirecting to subscription:', error);
      }
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleComplete = async () => {
    try {
      console.log('🚀 Starting onboarding completion...');
      
      // Step 1: Create user account with email and password
      console.log('📝 Creating user account for:', formData.email);
      const { error: signUpError } = await signUp(formData.email, formData.password, formData.firstName);
      
      if (signUpError) {
        // Handle specific error cases
        if (signUpError.message?.includes('already exists') || 
            signUpError.message?.includes('already registered') || 
            signUpError.message?.includes('User already registered') ||
            signUpError.message?.includes('email address is already in use')) {
          Alert.alert(
            'Account Already Exists',
            'An account with this email address already exists. Please try signing in instead.',
            [
              {
                text: 'Sign In Instead',
                onPress: () => navigation.navigate('Login' as never),
              },
              {
                text: 'Try Different Email',
                style: 'cancel',
              },
            ]
          );
        } else {
          console.error('❌ Sign up failed:', signUpError);
          Alert.alert('Error', signUpError.message || 'Failed to create account. Please try again.');
        }
        return;
      }

      console.log('✅ User account created successfully!');
      
      // Step 1.5: Redirect to email confirmation
      console.log('📧 Redirecting to email confirmation...');
      const onboardingData = {
        firstName: formData.firstName,
        email: formData.email,
        nativeLanguage: formData.nativeLanguage,
        targetLanguage: formData.targetLanguage,
        proficiency: formData.proficiency as 'none' | 'basic' | 'advanced',
        dailyCommitmentMinutes: parseInt(formData.timeCommitment) as 5 | 15 | 30 | 60 || undefined,
        discoverySource: formData.discoverySource as 'search' | 'radio' | 'tv' | 'other' | 'facebook_instagram' | 'podcast' | 'friends_family' | 'youtube' | 'app_store' | 'website_ad',
        wantsNotifications: formData.wantsNotifications,
        goals: formData.subject ? [formData.subject] : [], // Map subject to goals array
        ageRange: undefined, // Not collected in this flow
      };
      (navigation as any).navigate('EmailConfirmation', { 
        email: formData.email,
        onboardingData: onboardingData
      });
      return; // Exit here, don't continue with onboarding until email is confirmed
      
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error completing onboarding:', error);
      }
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const upsertProfile = async (payload: Record<string, any>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (__DEV__) {
          console.error('❌ No session available for profile save');
        }
        throw new Error('No session available. Please try again.');
      }

      if (__DEV__) {
        console.log('🔍 DEBUGGING PROFILE SAVE:');
        console.log('   User ID:', session.user.id);
        console.log('   User Email:', session.user.email);
        console.log('   Profile Data:', payload);
      }

      const { error } = await supabase.from('users').upsert({
        id: session.user.id,
        email: session.user.email,
        ...payload,
      });
      
      if (__DEV__) {
        console.log('upsertProfile ->', { error });
      }
      
      if (error) {
        if (__DEV__) {
          console.error('❌ Profile save error:', error);
        }
        throw new Error('Failed to save profile. Please try again.');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Upsert profile error:', error);
      }
      throw error;
    }
  };

  const canProceed = () => {
    const result = (() => {
      switch (currentStep) {
        case 0: return formData.nativeLanguage && formData.targetLanguage;
        case 1: return !!formData.subject; // Explicit boolean conversion
        case 2: return formData.proficiency;
        case 3: return formData.timeCommitment;
        case 4: return true; // Notifications are optional
        case 5: return formData.discoverySource;
        case 6: return formData.firstName.trim() && formData.email.trim() && isValidEmail(formData.email) && formData.password.trim().length >= 6;
        default: return false;
      }
    })();
    
    console.log('🔍 canProceed check - step:', currentStep, 'result:', result, 'type:', typeof result);
    if (currentStep === 1) {
      console.log('📚 Subject step - formData.subject:', formData.subject, 'boolean:', !!formData.subject);
    }
    
    return result;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const selectLanguage = (language: { code: string; name: string }, type: 'native' | 'target') => {
    setFormData(prev => ({
      ...prev,
      [type === 'native' ? 'nativeLanguage' : 'targetLanguage']: language.name
    }));
    setShowLanguageModal(false);
  };

  const renderLanguageModal = () => {
    if (!showLanguageModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {languageModalType === 'native' ? 'Native' : 'Target'} Language
            </Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.listContainer}>
            <FlatList
              data={SUPPORTED_LANGUAGES.sort((a, b) => {
                // Sort highlighted languages first, then alphabetically
                if (a.highlighted && !b.highlighted) return -1;
                if (!a.highlighted && b.highlighted) return 1;
                return a.name.localeCompare(b.name);
              })}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = (languageModalType === 'native' && formData.nativeLanguage === item.name) ||
                                 (languageModalType === 'target' && formData.targetLanguage === item.name);
                
                if (item.highlighted) {
                  return (
                    <AnimatedHighlightedLanguageItem
                      item={item}
                      isSelected={isSelected}
                      onPress={() => selectLanguage(item, languageModalType)}
                      languageModalType={languageModalType}
                      formData={formData}
                    />
                  );
                }
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.languageItem,
                      isSelected && styles.languageItemSelected
                    ]}
                    onPress={() => selectLanguage(item, languageModalType)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.languageItemContent}>
                      <Text style={styles.flagEmoji}>{item.flag}</Text>
                      <Text style={[
                        styles.languageName,
                        isSelected && styles.languageNameSelected
                      ]}>
                        {item.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#6366f1" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Languages
        console.log('🎯 Rendering Languages step - currentStep:', currentStep);
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepTitleContainer}>
              <Text style={styles.stepTitle}>My languages</Text>
              <TouchableOpacity
                onPress={() => setShowInfoModal(true)}
                style={styles.infoButton}
                accessibilityLabel="Learn about featured languages"
                accessibilityHint="Tap to learn about languages with general lesson access"
              >
                <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.languageSection}>
              <Text style={styles.sectionLabel}>I speak...</Text>
              <TouchableOpacity
                style={[
                  styles.languageCard,
                  formData.nativeLanguage && styles.languageCardSelected
                ]}
                onPress={() => {
                  setShowLanguageModal(true);
                  setLanguageModalType('native');
                }}
              >
                <View style={styles.languageCardContent}>
                  <Text style={styles.flagEmoji}>
                    {formData.nativeLanguage 
                      ? SUPPORTED_LANGUAGES.find(lang => lang.name === formData.nativeLanguage)?.flag || '🇬🇧'
                      : '🇬🇧'
                    }
                  </Text>
                  <Text style={[
                    styles.languageCardText,
                    formData.nativeLanguage && styles.languageCardTextSelected
                  ]}>
                    {formData.nativeLanguage || 'Select your native language'}
                  </Text>
                  {formData.nativeLanguage ? (
                    <Ionicons name="checkmark" size={20} color="#6366f1" />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.languageSection}>
              <Text style={styles.sectionLabel}>I want to learn</Text>
              <TouchableOpacity
                style={[
                  styles.languageCard,
                  formData.targetLanguage && styles.languageCardSelected
                ]}
                onPress={() => {
                  setShowLanguageModal(true);
                  setLanguageModalType('target');
                }}
              >
                <View style={styles.languageCardContent}>
                  <Text style={styles.flagEmoji}>
                    {formData.targetLanguage 
                      ? SUPPORTED_LANGUAGES.find(lang => lang.name === formData.targetLanguage)?.flag || '🇺🇸'
                      : '🇺🇸'
                    }
                  </Text>
                  <Text style={[
                    styles.languageCardText,
                    formData.targetLanguage && styles.languageCardTextSelected
                  ]}>
                    {formData.targetLanguage || 'Select your target language'}
                  </Text>
                  {formData.targetLanguage ? (
                    <Ionicons name="checkmark" size={20} color="#6366f1" />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 1: // Subject Selection
        console.log('🎯 Rendering Subject Selection step - currentStep:', currentStep);
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What subject are you studying?</Text>
            <Text style={styles.stepSubtitle}>
              Choose the subject area that best matches your studies or interests
            </Text>
            
            <TouchableOpacity
              style={[
                styles.subjectCard,
                formData.subject && styles.subjectCardSelected
              ]}
              onPress={() => setShowSubjectModal(true)}
            >
              <View style={styles.subjectCardContent}>
                <Ionicons 
                  name="school" 
                  size={24} 
                  color={formData.subject ? "#6366f1" : "#9ca3af"} 
                />
                <Text style={[
                  styles.subjectCardText,
                  formData.subject && styles.subjectCardTextSelected
                ]}>
                  {formData.subject || 'Select your subject'}
                </Text>
                {formData.subject ? (
                  <Ionicons name="checkmark" size={20} color="#6366f1" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        );

      case 2: // Proficiency
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your current level?</Text>
            <Text style={styles.stepSubtitle}>Help us personalize your learning experience</Text>
            
            {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  formData.proficiency === level && styles.optionButtonSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, proficiency: level }))}
              >
                <Text style={[
                  styles.optionText,
                  formData.proficiency === level && styles.optionTextSelected
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 3: // Time Commitment
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              How much time do you want to commit to learning {formData.targetLanguage || 'Spanish'}?
            </Text>
            <Text style={styles.stepSubtitle}>Relaxed pace or challenging? Choose a goal that feels right for you.</Text>
            
            <View style={styles.timeOptions}>
              {[
                '5 min / day',
                '15 min / day', 
                '30 min / day',
                '60 min / day',
                'I\'m not sure'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.timeOption,
                    formData.timeCommitment === option && styles.timeOptionSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, timeCommitment: option }))}
                >
                  <Text style={[
                    styles.timeOptionText,
                    formData.timeCommitment === option && styles.timeOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4: // Notifications
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Stay motivated</Text>
            <Text style={styles.stepSubtitle}>Get daily reminders to keep your streak going</Text>
            
            <View style={styles.notificationOptions}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  formData.wantsNotifications && styles.optionButtonSelected
                ]}
                onPress={async () => {
                  setFormData(prev => ({ ...prev, wantsNotifications: true }));
                  
                  // Schedule daily notifications if user opts in
                  try {
                    const hasPermission = await NotificationService.requestPermissions();
                    if (hasPermission) {
                      await NotificationService.scheduleDailyReminder();
                      console.log('✅ Daily notifications scheduled with random time between 1-3 PM');
                    }
                  } catch (error) {
                    console.error('Error scheduling notifications:', error);
                  }
                }}
              >
                <Ionicons name="notifications" size={24} color={formData.wantsNotifications ? "#fff" : "#666"} />
                <Text style={[
                  styles.optionText,
                  formData.wantsNotifications && styles.optionTextSelected
                ]}>
                  Yes, remind me daily
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  !formData.wantsNotifications && styles.optionButtonSelected
                ]}
                onPress={async () => {
                  setFormData(prev => ({ ...prev, wantsNotifications: false }));
                  
                  // Cancel any scheduled notifications if user opts out
                  try {
                    await NotificationService.cancelDailyReminders();
                    console.log('✅ Daily notifications cancelled');
                  } catch (error) {
                    console.error('Error cancelling notifications:', error);
                  }
                }}
              >
                <Ionicons name="notifications-off" size={24} color={!formData.wantsNotifications ? "#fff" : "#666"} />
                <Text style={[
                  styles.optionText,
                  !formData.wantsNotifications && styles.optionTextSelected
                ]}>
                  No, I'll remember myself
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 5: // Discovery Source
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How did you find us?</Text>
            <Text style={styles.stepSubtitle}>Help us understand how you discovered UniLingo</Text>
            
            {DISCOVERY_SOURCES.map((source) => (
              <TouchableOpacity
                key={source}
                style={[
                  styles.optionButton,
                  formData.discoverySource === source && styles.optionButtonSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, discoverySource: source }))}
              >
                <Text style={[
                  styles.optionText,
                  formData.discoverySource === source && styles.optionTextSelected
                ]}>
                  {source}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 6: // Name, Email & Password
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Create your account</Text>
            <Text style={styles.stepSubtitle}>We'll use this to personalize your experience</Text>
            
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your first name"
                value={formData.firstName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email address"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Create a password (min 6 characters)"
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.passwordHint}>
                Password must be at least 6 characters long
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (currentStep === 0) {
              // On first step, go back to landing page
              navigation.navigate('Landing');
            } else {
              // On other steps, go to previous step
              prevStep();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentStep + 1) / totalSteps) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} of {totalSteps}
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 ? (
          <>
            <TouchableOpacity style={styles.navButton} onPress={prevStep}>
              <Ionicons name="chevron-back" size={20} color="#6366f1" />
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.navButton, styles.nextButton, !canProceed() && styles.navButtonDisabled]}
              onPress={() => {
                console.log('🔘 Next button pressed - step:', currentStep);
                console.log('🔘 canProceed():', canProceed());
                if (canProceed()) {
                  nextStep();
                } else {
                  console.log('❌ Button press ignored - canProceed() is false');
                }
              }}
            >
              <Text style={[styles.navButtonText, styles.nextButtonText, !canProceed() && styles.navButtonTextDisabled]}>
                {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
              </Text>
              {currentStep < totalSteps - 1 && <Ionicons name="chevron-forward" size={20} color="#fff" />}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.fullWidthButton, !canProceed() && styles.navButtonDisabled]}
            onPress={() => {
              console.log('🔘 Full-width Next button pressed - step:', currentStep);
              console.log('🔘 canProceed():', canProceed());
              if (canProceed()) {
                nextStep();
              } else {
                console.log('❌ Button press ignored - canProceed() is false');
              }
            }}
          >
            <Text style={[styles.fullWidthButtonText, !canProceed() && styles.navButtonTextDisabled]}>
              Next
            </Text>
            <Ionicons name="chevron-forward" size={20} color={!canProceed() ? "#9ca3af" : "#fff"} />
          </TouchableOpacity>
        )}
      </View>

      {renderLanguageModal()}
      
      {/* Info Modal */}
      {showInfoModal && (
        <Modal
          visible={showInfoModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowInfoModal(false)}
        >
          <View style={styles.infoModalOverlay}>
            <View style={styles.infoModalContent}>
              <View style={styles.infoModalHeader}>
                <Text style={styles.infoModalTitle}>
                  Featured Languages
                </Text>
                <TouchableOpacity
                  onPress={() => setShowInfoModal(false)}
                  style={styles.infoModalCloseButton}
                  accessibilityLabel="Close modal"
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.infoModalText}>
                Languages marked as "Featured" have access to general lessons that teach standard day-to-day vocabulary and common phrases.
              </Text>
              
              <TouchableOpacity
                style={styles.infoModalButton}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.infoModalButtonText}>
                  Got it
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Subject Selection Modal */}
      {showSubjectModal && (
        <Modal
          visible={showSubjectModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SubjectSelectionScreen
            onSubjectSelect={(subject) => {
              console.log('📚 Subject selected:', subject);
              setFormData(prev => {
                const newData = { ...prev, subject };
                console.log('📝 Updated formData:', newData);
                return newData;
              });
              setShowSubjectModal(false);
            }}
            selectedSubject={formData.subject}
          />
        </Modal>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  languageSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  languageList: {
    maxHeight: 400,
    flex: 1,
  },
  languageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  languageCardSelected: {
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  languageCardDisabled: {
    opacity: 0.7,
  },
  languageCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  flagEmoji: {
    fontSize: 24,
  },
  languageCardText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  languageCardTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  optionButtonSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
  },
  timeOptions: {
    gap: 12,
  },
  timeOption: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  timeOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  timeOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  notificationOptions: {
    gap: 12,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  textInput: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#1e293b',
  },
  passwordHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  nextButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  navButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  navButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  nextButtonText: {
    color: '#fff',
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
  fullWidthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 1,
  },
  fullWidthButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: Platform.OS === 'ios' ? 44 : 0, // Status bar height
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  languageItemSelected: {
    backgroundColor: '#f0f4ff',
  },
  languageName: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
    flex: 1,
  },
  languageNameSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  subjectCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subjectCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  subjectCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectCardText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
  },
  subjectCardTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  discountContainer: {
    marginTop: 24,
    gap: 12,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  discountInputContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  discountInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1e293b',
  },
  applyButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountAppliedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#22c55e',
    textAlign: 'center',
  },
  // New styles for language selection enhancements
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoButton: {
    padding: 4,
  },
  stepTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageItemHighlighted: {
    backgroundColor: '#f8faff',
    borderColor: '#6366f1',
    borderWidth: 1.5,
    borderRadius: 16,
    marginVertical: 3,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  languageNameHighlighted: {
    fontWeight: '700',
    color: '#4338ca',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  highlightedBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  highlightedBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-15deg' }],
    borderRadius: 16,
  },
  // Info modal styles
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  infoModalCloseButton: {
    padding: 4,
  },
  infoModalText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#64748b',
    marginBottom: 24,
  },
  infoModalButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  infoModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
