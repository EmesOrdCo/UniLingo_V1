import React, { useEffect } from 'react';
import './src/config/logging'; // Initialize logging configuration
import { logger } from './src/lib/logger';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './src/contexts/SubscriptionContext';
import { ProfilePictureProvider } from './src/contexts/ProfilePictureContext';
import { RefreshProvider, useRefresh } from './src/contexts/RefreshContext';
import { SelectedUnitProvider } from './src/contexts/SelectedUnitContext';
import { I18nProvider } from './src/lib/i18n';
import { setRefreshTrigger } from './src/lib/progressTrackingService';
import LoadingScreen from './src/components/LoadingScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NotificationService } from './src/lib/notificationService';
import SubscriptionGate from './src/components/SubscriptionGate';
import { setupGlobalErrorHandling } from './src/lib/errorHandler';
import BreakReminderModal from './src/components/BreakReminderModal';
import { useSessionTimer } from './src/hooks/useSessionTimer';
import { useDispatch } from 'react-redux';
import { loadAvatarOptions } from './src/store/slices/avatarSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ENV } from './src/lib/envConfig';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EmailConfirmationScreen from './src/screens/EmailConfirmationScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import CreateFlashcardScreen from './src/screens/CreateFlashcardScreen';
import StudyScreen from './src/screens/StudyScreen';
import UploadScreen from './src/screens/UploadScreen';
import SubjectsScreen from './src/screens/SubjectsScreen';
import ExercisesScreen from './src/screens/ExercisesScreen';
import MemoryGameScreen from './src/screens/MemoryGameScreen';
import WordScrambleScreen from './src/screens/WordScrambleScreen';
import ReadingAnalysisScreen from './src/screens/ReadingAnalysisScreen';
import FeatureComingSoonScreen from './src/screens/FeatureComingSoonScreen';
import ProgressPageScreen from './src/screens/ProgressPageScreen';
import ProfilePage from './src/screens/ProfilePage';
import CreateLessonScreen from './src/screens/CreateLessonScreen';
import AIChatPage from './src/screens/AIChatPage';
import AssistantConfigScreen from './src/screens/AssistantConfigScreen';
import LessonWalkthroughScreen from './src/screens/LessonWalkthroughScreen';
import SubjectLessonScreen from './src/screens/SubjectLessonScreen';
import OnboardingFlowScreen from './src/screens/OnboardingFlowScreen';
import LandingScreen from './src/screens/LandingScreen';
import FAQScreen from './src/screens/FAQScreen';
import TermsAndConditionsScreen from './src/screens/TermsAndConditionsScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import DailyGoalsScreen from './src/screens/DailyGoalsScreen';
import LevelProgressScreen from './src/screens/LevelProgressScreen';
import UnitDetailScreen from './src/screens/UnitDetailScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import YourLessonsScreen from './src/screens/YourLessonsScreen';
import FlashcardStudyScreen from './src/screens/FlashcardStudyScreen';
import BrowseFlashcardsScreen from './src/screens/BrowseFlashcardsScreen';
import UnitWordsScreen from './src/screens/UnitWordsScreen';
import UnitListenScreen from './src/screens/UnitListenScreen';
import UnitWriteScreen from './src/screens/UnitWriteScreen';
import UnitSpeakScreen from './src/screens/UnitSpeakScreen';
import UnitRoleplayScreen from './src/screens/UnitRoleplayScreen';
import ConversationLessonScreen from './src/screens/ConversationLessonScreen';
import ArcadeScreen from './src/screens/ArcadeScreen';
import AudioRecapScreen from './src/screens/AudioRecapScreen';
import AudioPlayerScreen from './src/screens/AudioPlayerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AvatarEditorScreen from './src/screens/AvatarEditorScreen';
import AvatarSubcategoryScreen from './src/screens/AvatarSubcategoryScreen';
import AvatarAnimationTestScreen from './src/screens/AvatarAnimationTestScreen';
import SimpleAnimationTest from './src/components/SimpleAnimationTest';
import LevelSelectionScreen from './src/screens/LevelSelectionScreen';

const Stack = createStackNavigator();

// Main stack navigator
function MainNavigator() {
  if (__DEV__) {
    logger.debug('MainNavigator rendering');
  }
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="CreateFlashcard" component={CreateFlashcardScreen} />
      <Stack.Screen name="Study" component={StudyScreen} />
      <Stack.Screen name="Upload" component={UploadScreen} />
      <Stack.Screen name="Subjects" component={SubjectsScreen} />
      <Stack.Screen name="Exercises" component={ExercisesScreen} />
      <Stack.Screen name="MemoryGame" component={MemoryGameScreen} />
      <Stack.Screen name="WordScramble" component={WordScrambleScreen} />
      <Stack.Screen name="ReadingAnalysis" component={ReadingAnalysisScreen} />
            <Stack.Screen name="FeatureComingSoon" component={FeatureComingSoonScreen} />
      <Stack.Screen name="ProgressDashboard" component={ProgressPageScreen} />
      <Stack.Screen name="Profile" component={ProfilePage} />
      <Stack.Screen name="CreateLesson" component={CreateLessonScreen} />
      <Stack.Screen name="AIChat" component={AIChatPage} />
      <Stack.Screen name="AssistantConfig" component={AssistantConfigScreen} />
      <Stack.Screen name="LessonWalkthrough" component={LessonWalkthroughScreen} />
      <Stack.Screen name="SubjectLesson" component={SubjectLessonScreen} />
      <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="DailyGoals" component={DailyGoalsScreen} />
      <Stack.Screen name="LevelProgress" component={LevelProgressScreen} />
      <Stack.Screen name="UnitDetail" component={UnitDetailScreen} />
      <Stack.Screen name="Courses" component={CoursesScreen} />
      <Stack.Screen name="YourLessons" component={YourLessonsScreen} />
      <Stack.Screen name="FlashcardStudy" component={FlashcardStudyScreen} />
      <Stack.Screen name="BrowseFlashcards" component={BrowseFlashcardsScreen} />
      <Stack.Screen name="UnitWords" component={UnitWordsScreen} />
      <Stack.Screen name="UnitListen" component={UnitListenScreen} />
      <Stack.Screen name="UnitWrite" component={UnitWriteScreen} />
      <Stack.Screen name="UnitSpeak" component={UnitSpeakScreen} />
      <Stack.Screen name="UnitRoleplay" component={UnitRoleplayScreen} />
      <Stack.Screen name="ConversationLessonScreen" component={ConversationLessonScreen} />
      <Stack.Screen name="Arcade" component={ArcadeScreen} />
      <Stack.Screen name="AudioRecap" component={AudioRecapScreen} />
      <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AvatarEditor" component={AvatarEditorScreen} />
      <Stack.Screen name="AvatarSubcategory" component={AvatarSubcategoryScreen} />
      <Stack.Screen name="AvatarAnimationTest" component={AvatarAnimationTestScreen} />
      <Stack.Screen name="SimpleAnimationTest" component={SimpleAnimationTest} />
      <Stack.Screen name="LevelSelection" component={LevelSelectionScreen} />
    </Stack.Navigator>
  );
}



// Auth stack navigator
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
      <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreen} />
    </Stack.Navigator>
  );
}

// Component to load avatar options on app startup
function AvatarOptionsLoader() {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadAvatarOptionsFromStorage = async () => {
      try {
        const savedOptions = await AsyncStorage.getItem('avatar-options');
        if (savedOptions) {
          dispatch(loadAvatarOptions(JSON.parse(savedOptions)));
          if (__DEV__) {
            console.log('🎨 Avatar options loaded on app startup');
          }
        } else {
          if (__DEV__) {
            console.log('🎨 No saved avatar options found, using defaults');
          }
        }
      } catch (error) {
        console.error('❌ Error loading avatar options on startup:', error);
      }
    };

    loadAvatarOptionsFromStorage();
  }, [dispatch]);

  return null; // This component doesn't render anything
}

export default function App() {
  // Setup global error handling for React Native
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  // Setup notification listeners when app starts
  useEffect(() => {
    if (__DEV__) {
      console.log('🔔 Setting up notification listeners...');
    }
    const cleanup = NotificationService.setupNotificationListeners();
    
    return () => {
      if (__DEV__) {
        console.log('🔔 Cleaning up notification listeners...');
      }
      cleanup();
    };
  }, []);

  // Setup deep linking (removed magic link handling)
  useEffect(() => {
    if (__DEV__) {
      console.log('🔗 Setting up deep linking...');
    }
    
    // Handle initial URL (when app is opened from a link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && __DEV__) {
        console.log('🔗 Initial URL:', initialUrl);
      }
      
      // Handle email confirmation deep link on app start
      if (initialUrl && initialUrl.includes('unilingo://auth/confirm')) {
        if (__DEV__) {
          console.log('📧 Email confirmation deep link received on app start');
        }
        // The Supabase auth state change will handle the confirmation
      }
    };

    // Handle URL when app is already running
    const handleUrl = (event: { url: string }) => {
      if (__DEV__) {
        console.log('🔗 URL received:', event.url);
      }
      
      // Handle email confirmation deep link
      if (event.url.includes('unilingo://auth/confirm')) {
        if (__DEV__) {
          console.log('📧 Email confirmation deep link received');
        }
        // The Supabase auth state change will handle the confirmation
        // User will be automatically redirected to onboarding or main app
      }
    };

    // Set up listeners
    const subscription = Linking.addEventListener('url', handleUrl);
    handleInitialURL();

    return () => {
      if (__DEV__) {
        console.log('🔗 Cleaning up deep linking...');
      }
      subscription?.remove();
    };
  }, []);

  return (
    <StripeProvider 
      publishableKey={ENV.STRIPE_PUBLISHABLE_KEY || ''}
      merchantIdentifier="merchant.com.unilingo.app"
      urlScheme="unilingo"
    >
      <Provider store={store}>
        <SafeAreaProvider>
          <I18nProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <ProfilePictureProvider>
                  <RefreshProvider>
                    <SelectedUnitProvider>
                      <NavigationContainer>
                        <ErrorBoundary>
                          <AvatarOptionsLoader />
                          <AppNavigator />
                          <StatusBar style="auto" />
                        </ErrorBoundary>
                      </NavigationContainer>
                    </SelectedUnitProvider>
                  </RefreshProvider>
                </ProfilePictureProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </I18nProvider>
        </SafeAreaProvider>
      </Provider>
    </StripeProvider>
  );
}

// Component to set up refresh trigger
function RefreshSetup() {
  const { triggerRefresh } = useRefresh();
  
  useEffect(() => {
    setRefreshTrigger(triggerRefresh);
  }, [triggerRefresh]);
  
  return null;
}

// App navigator that handles auth state and profile completion
function AppNavigator() {
  const { user, loading, profile, profileLoading, isNewUser, clearNewUserFlag, refreshProfile } = useAuth();
  const { showBreakReminder, sessionTime, onCloseBreakReminder, onGoToArcade } = useSessionTimer();

  if (__DEV__) {
    console.log('🧭 AppNavigator - Loading:', loading, 'User:', user ? user.email : 'No user', 'Profile:', profile ? 'Complete' : 'Incomplete', 'IsNewUser:', isNewUser);
  }

  if (loading || profileLoading) {
    if (__DEV__) {
      console.log('⏳ Showing loading screen...');
    }
    return <LoadingScreen />;
  }

  if (user) {
    if (__DEV__) {
      console.log('👤 User authenticated, checking profile status...');
      console.log('📋 Profile exists:', !!profile, 'IsNewUser:', isNewUser);
      console.log('👤 User email:', user.email);
      console.log('📋 Profile data:', profile);
    }
    
    // Paywall removed - users go directly to subscription website after onboarding
    
    // Onboarding flow is handled within AuthStack, not here

    // For existing users, show MainNavigator with subscription gate
    if (__DEV__) {
      console.log('✅ User authenticated, showing MainNavigator with subscription gate');
    }
    return (
      <>
        <RefreshSetup />
        <SubscriptionGate>
          <MainNavigator />
        </SubscriptionGate>
        
        {/* Break Reminder Modal */}
        <BreakReminderModal
          visible={showBreakReminder}
          onClose={onCloseBreakReminder}
          sessionTime={sessionTime}
        />
      </>
    );
  } else {
    if (__DEV__) {
      console.log('❌ No user, showing AuthStack');
      console.log('🔍 Auth state check - user:', user, 'loading:', loading);
    }
    return <AuthStack />;
  }
}
