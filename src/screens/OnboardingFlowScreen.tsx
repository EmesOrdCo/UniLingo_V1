import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileService } from '../lib/userProfileService';

// OpenAI supported languages (subset of most common ones)
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'he', name: 'Hebrew' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'tl', name: 'Filipino' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'et', name: 'Estonian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'el', name: 'Greek' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ga', name: 'Irish' },
  { code: 'cy', name: 'Welsh' },
  { code: 'mt', name: 'Maltese' },
  { code: 'eu', name: 'Basque' },
  { code: 'ca', name: 'Catalan' },
  { code: 'gl', name: 'Galician' },
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

export default function OnboardingFlowScreen() {
  const navigation = useNavigation();
  const { user, clearNewUserFlag, refreshProfile, signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState(SUPPORTED_LANGUAGES);
  
  // Form data
  const [formData, setFormData] = useState({
    nativeLanguage: '',
    targetLanguage: '',
    proficiency: '',
    timeCommitment: '',
    wantsNotifications: true,
    discoverySource: '',
    firstName: '',
    email: '',
    password: '',
    selectedPlan: '',
  });

  const totalSteps = 8;

  useEffect(() => {
    // Filter languages based on search
    if (languageSearch.trim()) {
      const filtered = SUPPORTED_LANGUAGES.filter(lang => 
        lang.name.toLowerCase().includes(languageSearch.toLowerCase())
      );
      setFilteredLanguages(filtered);
    } else {
      setFilteredLanguages(SUPPORTED_LANGUAGES);
    }
  }, [languageSearch]);

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // First, create the user account with email and password
      const { error: signUpError } = await signUp(formData.email, formData.password);
      
      if (signUpError) {
        Alert.alert('Error', signUpError.message || 'Failed to create account. Please try again.');
        return;
      }

      // Wait a moment for the auth state to update
      setTimeout(async () => {
        try {
          // Create user profile with onboarding data
          const profileData = {
            id: user?.id || '', // This will be set by the auth context
            email: formData.email,
            name: formData.firstName,
            native_language: formData.nativeLanguage,
            target_language: formData.targetLanguage,
            proficiency_level: formData.proficiency,
            daily_commitment_minutes: parseInt(formData.timeCommitment.split(' ')[0]) || null,
            wants_notifications: formData.wantsNotifications,
            discovery_source: formData.discoverySource,
            selected_plan_id: formData.selectedPlan,
            has_active_subscription: false, // Will be updated after payment
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          console.log('💾 Saving user profile:', profileData);
          
          // Save profile to Supabase
          await UserProfileService.createUserProfile(profileData);
          
          // Clear the new user flag
          clearNewUserFlag();
          
          // Refresh the profile in auth context
          await refreshProfile();
          
          Alert.alert(
            'Welcome to UniLingo!',
            `Hi ${formData.firstName}! Your account has been created successfully.`,
            [
              {
                text: 'Get Started',
                onPress: () => {
                  // Navigation will be handled automatically by AppNavigator
                  // since the new user flag is cleared and profile exists
                }
              }
            ]
          );
        } catch (error) {
          console.error('❌ Error saving profile:', error);
          Alert.alert(
            'Error',
            'Account created but failed to save profile. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      Alert.alert(
        'Error',
        'Failed to create your account. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.nativeLanguage && formData.targetLanguage;
      case 1: return formData.proficiency;
      case 2: return formData.timeCommitment;
      case 3: return true; // Notifications are optional
      case 4: return formData.discoverySource;
      case 5: return formData.firstName.trim() && formData.email.trim() && isValidEmail(formData.email) && formData.password.trim().length >= 6;
      case 6: return formData.selectedPlan;
      case 7: return true; // Trial confirmation
      default: return false;
    }
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
    setLanguageSearch('');
  };

  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Language</Text>
          <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Search languages..."
          value={languageSearch}
          onChangeText={setLanguageSearch}
          autoFocus
        />
        
        <FlatList
          data={filteredLanguages}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.languageItem}
              onPress={() => selectLanguage(item, 'target')}
            >
              <Text style={styles.languageName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Languages
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>My languages</Text>
            
            <View style={styles.languageSection}>
              <Text style={styles.sectionLabel}>I speak...</Text>
              <TouchableOpacity
                style={styles.languageCard}
                onPress={() => {
                  // For native language, we'll use a simple picker
                  Alert.alert(
                    'Native Language',
                    'Select your native language',
                    SUPPORTED_LANGUAGES.slice(0, 10).map(lang => ({
                      text: lang.name,
                      onPress: () => setFormData(prev => ({ ...prev, nativeLanguage: lang.name }))
                    }))
                  );
                }}
              >
                <View style={styles.languageCardContent}>
                  <Text style={styles.flagEmoji}>🇬🇧</Text>
                  <Text style={styles.languageCardText}>
                    {formData.nativeLanguage || 'British English'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.languageSection}>
              <Text style={styles.sectionLabel}>I want to learn</Text>
              <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
                {[
                  { name: 'Spanish', flag: '🇪🇸' },
                  { name: 'German', flag: '🇩🇪' },
                  { name: 'Italian', flag: '🇮🇹' },
                  { name: 'French', flag: '🇫🇷' },
                  { name: 'Portuguese', flag: '🇵🇹' },
                  { name: 'Swedish', flag: '🇸🇪' },
                  { name: 'Turkish', flag: '🇹🇷' },
                ].map((language) => (
                  <TouchableOpacity
                    key={language.name}
                    style={[
                      styles.languageCard,
                      formData.targetLanguage === language.name && styles.languageCardSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, targetLanguage: language.name }))}
                  >
                    <View style={styles.languageCardContent}>
                      <Text style={styles.flagEmoji}>{language.flag}</Text>
                      <Text style={[
                        styles.languageCardText,
                        formData.targetLanguage === language.name && styles.languageCardTextSelected
                      ]}>
                        {language.name}
                      </Text>
                      {formData.targetLanguage === language.name && (
                        <Ionicons name="checkmark" size={20} color="#6366f1" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        );

      case 1: // Proficiency
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

      case 2: // Time Commitment
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

      case 3: // Notifications
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
                onPress={() => setFormData(prev => ({ ...prev, wantsNotifications: true }))}
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
                onPress={() => setFormData(prev => ({ ...prev, wantsNotifications: false }))}
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

      case 4: // Discovery Source
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

      case 5: // Name, Email & Password
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

      case 6: // Payment Plans
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choose your plan</Text>
            <Text style={styles.stepSubtitle}>Select the subscription that works best for you</Text>
            
            <View style={styles.planOptions}>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  formData.selectedPlan === 'annual' && styles.planOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, selectedPlan: 'annual' }))}
              >
                <View style={styles.planHeader}>
                  <Text style={[
                    styles.planTitle,
                    formData.selectedPlan === 'annual' && styles.planTitleSelected
                  ]}>
                    Annual Plan
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>SAVE 50%</Text>
                  </View>
                </View>
                <Text style={[
                  styles.planPrice,
                  formData.selectedPlan === 'annual' && styles.planPriceSelected
                ]}>
                  £7.50/month
                </Text>
                <Text style={[
                  styles.planSubtext,
                  formData.selectedPlan === 'annual' && styles.planSubtextSelected
                ]}>
                  £89.99 charged every 12 months
                </Text>
                <Text style={[
                  styles.planTrial,
                  formData.selectedPlan === 'annual' && styles.planTrialSelected
                ]}>
                  7-day free trial
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planOption,
                  formData.selectedPlan === 'lifetime' && styles.planOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, selectedPlan: 'lifetime' }))}
              >
                <View style={styles.planHeader}>
                  <Text style={[
                    styles.planTitle,
                    formData.selectedPlan === 'lifetime' && styles.planTitleSelected
                  ]}>
                    Lifetime Plan
                  </Text>
                </View>
                <Text style={[
                  styles.planPrice,
                  formData.selectedPlan === 'lifetime' && styles.planPriceSelected
                ]}>
                  £264.99
                </Text>
                <Text style={[
                  styles.planSubtext,
                  formData.selectedPlan === 'lifetime' && styles.planSubtextSelected
                ]}>
                  Pay once, learn forever
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 7: // Trial Confirmation
        return (
          <View style={styles.stepContainer}>
            <View style={styles.trialIconContainer}>
              <Text style={styles.trialIcon}>🎁</Text>
            </View>
            <Text style={styles.stepTitle}>Start your free trial</Text>
            <Text style={styles.stepSubtitle}>
              {formData.selectedPlan === 'annual' 
                ? 'Enjoy 7 days free, then £7.50/month' 
                : 'Get lifetime access for £264.99'}
            </Text>
            
            <View style={styles.trialBenefits}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Full access to all lessons</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Personalized learning path</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Progress tracking</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Cancel anytime</Text>
              </View>
            </View>

            <View style={styles.trialTerms}>
              <Text style={styles.termsText}>
                {formData.selectedPlan === 'annual' 
                  ? 'Your free trial starts immediately. You can cancel anytime in your account settings. After 7 days, you\'ll be charged £89.99 for 12 months of access.'
                  : 'One-time payment of £264.99. No recurring charges. Lifetime access to all features.'}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {currentStep > 0 ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={prevStep}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
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
              onPress={nextStep}
              disabled={!canProceed()}
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
            onPress={nextStep}
            disabled={!canProceed()}
          >
            <Text style={[styles.fullWidthButtonText, !canProceed() && styles.navButtonTextDisabled]}>
              Next
            </Text>
            <Ionicons name="chevron-forward" size={20} color={!canProceed() ? "#9ca3af" : "#fff"} />
          </TouchableOpacity>
        )}
      </View>

      {renderLanguageModal()}
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
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
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
    maxHeight: 300,
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
  planOptions: {
    gap: 16,
  },
  planOption: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  planOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  planTitleSelected: {
    color: '#6366f1',
  },
  badge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  planPriceSelected: {
    color: '#6366f1',
  },
  planSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  planSubtextSelected: {
    color: '#6366f1',
  },
  planTrial: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  planTrialSelected: {
    color: '#16a34a',
  },
  trialIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trialIcon: {
    fontSize: 64,
  },
  trialBenefits: {
    gap: 12,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#1e293b',
  },
  trialTerms: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  termsText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    textAlign: 'center',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  searchInput: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    fontSize: 16,
  },
  languageItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  languageName: {
    fontSize: 16,
    color: '#1e293b',
  },
});
