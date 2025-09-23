import React, { useState, useEffect } from 'react';
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
  Linking
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
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'eu', name: 'Basque', flag: '🇪🇸' },
  { code: 'be', name: 'Belarusian', flag: '🇧🇾' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'ca', name: 'Catalan', flag: '🇪🇸' },
  { code: 'ceb', name: 'Cebuano', flag: '🇵🇭' },
  { code: 'ny', name: 'Chichewa', flag: '🇲🇼' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-tw', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'co', name: 'Corsican', flag: '🇫🇷' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'eo', name: 'Esperanto', flag: '🌍' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'fy', name: 'Frisian', flag: '🇳🇱' },
  { code: 'gl', name: 'Galician', flag: '🇪🇸' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'ht', name: 'Haitian Creole', flag: '🇭🇹' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'haw', name: 'Hawaiian', flag: '🇺🇸' },
  { code: 'iw', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'hmn', name: 'Hmong', flag: '🇱🇦' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'is', name: 'Icelandic', flag: '🇮🇸' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ga', name: 'Irish', flag: '🇮🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'jw', name: 'Javanese', flag: '🇮🇩' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'km', name: 'Khmer', flag: '🇰🇭' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ku', name: 'Kurdish (Kurmanji)', flag: '🇮🇶' },
  { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
  { code: 'lo', name: 'Lao', flag: '🇱🇦' },
  { code: 'la', name: 'Native', flag: '🏛️' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'lb', name: 'Luxembourgish', flag: '🇱🇺' },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'mt', name: 'Maltese', flag: '🇲🇹' },
  { code: 'mi', name: 'Maori', flag: '🇳🇿' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
  { code: 'my', name: 'Myanmar (Burmese)', flag: '🇲🇲' },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'ps', name: 'Pashto', flag: '🇦🇫' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ma', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'sm', name: 'Samoan', flag: '🇼🇸' },
  { code: 'gd', name: 'Scots Gaelic', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'st', name: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', name: 'Shona', flag: '🇿🇼' },
  { code: 'sd', name: 'Sindhi', flag: '🇵🇰' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'so', name: 'Somali', flag: '🇸🇴' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'su', name: 'Sundanese', flag: '🇮🇩' },
  { code: 'sw', name: 'Swahili', flag: '🇹🇿' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'tg', name: 'Tajik', flag: '🇹🇯' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'cy', name: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
  { code: 'yi', name: 'Yiddish', flag: '🇮🇱' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
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

export default function OnboardingFlowScreen({ route }: { route?: any }) {
  const navigation = useNavigation();
  const { user, clearNewUserFlag, refreshProfile, signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [languageModalType, setLanguageModalType] = useState<'native' | 'target'>('target');
  
  // Form data
  const [formData, setFormData] = useState({
    nativeLanguage: '',
    targetLanguage: 'English', // Hard coded to English
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
              onPress: () => navigation.navigate('EmailConfirmation' as never, { email: user.email } as never),
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
        proficiency: formData.proficiency,
        dailyCommitmentMinutes: parseInt(formData.timeCommitment) || null,
        discoverySource: formData.discoverySource,
        wantsNotifications: formData.wantsNotifications,
        goals: [], // Not collected in this flow
        ageRange: null, // Not collected in this flow
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
          await Linking.openURL(subscriptionUrl);
          
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
        proficiency: formData.proficiency,
        dailyCommitmentMinutes: parseInt(formData.timeCommitment) || null,
        discoverySource: formData.discoverySource,
        wantsNotifications: formData.wantsNotifications,
        goals: [], // Not collected in this flow
        ageRange: null, // Not collected in this flow
      };
      navigation.navigate('EmailConfirmation' as never, { 
        email: formData.email,
        onboardingData: onboardingData
      } as never);
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
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    ((languageModalType === 'native' && formData.nativeLanguage === item.name) ||
                     (languageModalType === 'target' && formData.targetLanguage === item.name)) && styles.languageItemSelected
                  ]}
                  onPress={() => selectLanguage(item, languageModalType)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flagEmoji}>{item.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    ((languageModalType === 'native' && formData.nativeLanguage === item.name) ||
                     (languageModalType === 'target' && formData.targetLanguage === item.name)) && styles.languageNameSelected
                  ]}>
                    {item.name}
                  </Text>
                  {((languageModalType === 'native' && formData.nativeLanguage === item.name) ||
                    (languageModalType === 'target' && formData.targetLanguage === item.name)) && (
                    <Ionicons name="checkmark" size={20} color="#6366f1" />
                  )}
                </TouchableOpacity>
              )}
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
            <Text style={styles.stepTitle}>My languages</Text>
            
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
              <View
                style={[
                  styles.languageCard,
                  styles.languageCardSelected,
                  styles.languageCardDisabled
                ]}
              >
                <View style={styles.languageCardContent}>
                  <Text style={styles.flagEmoji}>
                    🇺🇸
                  </Text>
                  <Text style={[
                    styles.languageCardText,
                    styles.languageCardTextSelected
                  ]}>
                    English
                  </Text>
                  <Ionicons name="checkmark" size={20} color="#6366f1" />
                </View>
              </View>
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
});
