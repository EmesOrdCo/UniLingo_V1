import React, { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './src/contexts/SubscriptionContext';
import { ProfilePictureProvider } from './src/contexts/ProfilePictureContext';
import LoadingScreen from './src/components/LoadingScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NotificationService } from './src/lib/notificationService';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
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
import ProgressDashboardScreen from './src/screens/ProgressDashboardScreen';
import ProfilePage from './src/screens/ProfilePage';
import CreateLessonScreen from './src/screens/CreateLessonScreen';
import AIChatPage from './src/screens/AIChatPage';
import PaywallScreen from './src/screens/PaywallScreen';
import ConversationPracticeScreen from './src/screens/ConversationPracticeScreen';
import AssistantConfigScreen from './src/screens/AssistantConfigScreen';
import LessonWalkthroughScreen from './src/screens/LessonWalkthroughScreen';
import OnboardingFlowScreen from './src/screens/OnboardingFlowScreen';
import LandingScreen from './src/screens/LandingScreen';
import FAQScreen from './src/screens/FAQScreen';
import TermsAndConditionsScreen from './src/screens/TermsAndConditionsScreen';

const Stack = createStackNavigator();

// Main stack navigator
function MainNavigator() {
  console.log('🏗️ MainNavigator rendering...');
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
      <Stack.Screen name="ProgressDashboard" component={ProgressDashboardScreen} />
      <Stack.Screen name="Profile" component={ProfilePage} />
      <Stack.Screen name="CreateLesson" component={CreateLessonScreen} />
      <Stack.Screen name="AIChat" component={AIChatPage} />
      <Stack.Screen name="Paywall" component={PaywallScreenWrapper} />
      <Stack.Screen name="ConversationPractice" component={ConversationPracticeScreen} />
      <Stack.Screen name="AssistantConfig" component={AssistantConfigScreen} />
      <Stack.Screen name="LessonWalkthrough" component={LessonWalkthroughScreen} />
      <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
    </Stack.Navigator>
  );
}


// Paywall screen component for navigation
function PaywallScreenWrapper() {
  const navigation = useNavigation();
  
  return (
    <PaywallScreen
      onComplete={() => {
        // Navigate back to previous screen
        navigation.goBack();
      }}
    />
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
      <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  // Setup notification listeners when app starts
  useEffect(() => {
    console.log('🔔 Setting up notification listeners...');
    const cleanup = NotificationService.setupNotificationListeners();
    
    return () => {
      console.log('🔔 Cleaning up notification listeners...');
      cleanup();
    };
  }, []);

  // Setup deep linking for magic links
  useEffect(() => {
    console.log('🔗 Setting up deep linking...');
    
    // Handle initial URL (when app is opened from a link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('🔗 Initial URL:', initialUrl);
        handleDeepLink(initialUrl);
      }
    };

    // Handle URL when app is already running
    const handleUrl = (event: { url: string }) => {
      console.log('🔗 URL received:', event.url);
      handleDeepLink(event.url);
    };

    // Handle deep link
    const handleDeepLink = (url: string) => {
      console.log('🔗 Processing deep link:', url);
      
      if (url.startsWith('unilingo://')) {
        console.log('✅ Magic link detected!');
        // The magic link will be handled by Supabase auth state change
        // No additional action needed here
      }
    };

    // Set up listeners
    const subscription = Linking.addEventListener('url', handleUrl);
    handleInitialURL();

    return () => {
      console.log('🔗 Cleaning up deep linking...');
      subscription?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <ProfilePictureProvider>
            <NavigationContainer>
              <ErrorBoundary>
                <AppNavigator />
                <StatusBar style="auto" />
              </ErrorBoundary>
            </NavigationContainer>
          </ProfilePictureProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// App navigator that handles auth state and profile completion
function AppNavigator() {
  const { user, loading, profile, profileLoading, isNewUser, clearNewUserFlag, refreshProfile } = useAuth();
  const { hasShownPaywall, setHasShownPaywall } = useSubscription();

  console.log('🧭 AppNavigator - Loading:', loading, 'User:', user ? user.email : 'No user', 'Profile:', profile ? 'Complete' : 'Incomplete', 'IsNewUser:', isNewUser, 'HasShownPaywall:', hasShownPaywall);

  if (loading || profileLoading) {
    console.log('⏳ Showing loading screen...');
    return <LoadingScreen />;
  }

  if (user) {
    console.log('👤 User authenticated, checking profile status...');
    console.log('📋 Profile exists:', !!profile, 'IsNewUser:', isNewUser);
    console.log('👤 User email:', user.email);
    console.log('📋 Profile data:', profile);
    
    // Show paywall for new users who haven't seen it yet
    if (isNewUser && !hasShownPaywall) {
      console.log('💰 New user, showing paywall...');
      return (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Paywall">
            {() => (
              <PaywallScreen
                onComplete={() => {
                  setHasShownPaywall(true);
                }}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      );
    }
    
    // Show onboarding flow for new users who just signed up
    if (isNewUser && !profile) {
      console.log('📋 New user authenticated, showing onboarding flow');
      return (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreen} />
        </Stack.Navigator>
      );
    }

    // For existing users, always show MainNavigator regardless of profile status
    console.log('✅ User authenticated, showing MainNavigator');
    return <MainNavigator />;
  } else {
    console.log('❌ No user, showing AuthStack');
    console.log('🔍 Auth state check - user:', user, 'loading:', loading);
    return <AuthStack />;
  }
}
