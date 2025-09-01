import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoadingScreen from './src/components/LoadingScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';

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
import NewLessonViewerScreen from './src/screens/NewLessonViewerScreen';
import LessonReviewScreen from './src/screens/LessonReviewScreen';
import PostLessonFeedbackScreen from './src/screens/PostLessonFeedbackScreen';
import ProgressDashboardScreen from './src/screens/ProgressDashboardScreen';
import ProfilePage from './src/screens/ProfilePage';
import CreateLessonScreen from './src/screens/CreateLessonScreen';

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
      <Stack.Screen name="NewLessonViewer" component={NewLessonViewerScreen} />
      <Stack.Screen name="PostLessonFeedback" component={PostLessonFeedbackScreen} />
      <Stack.Screen name="LessonReview" component={LessonReviewScreen} />
      <Stack.Screen name="ProgressDashboard" component={ProgressDashboardScreen} />
      <Stack.Screen name="Profile" component={ProfilePage} />
      <Stack.Screen name="CreateLesson" component={CreateLessonScreen} />
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
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <ErrorBoundary>
            <AppNavigator />
            <StatusBar style="auto" />
          </ErrorBoundary>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// App navigator that handles auth state and profile completion
function AppNavigator() {
  const { user, loading, profile, profileLoading, isNewUser } = useAuth();

  console.log('🧭 AppNavigator - Loading:', loading, 'User:', user ? user.email : 'No user', 'Profile:', profile ? 'Complete' : 'Incomplete', 'IsNewUser:', isNewUser);

  if (loading || profileLoading) {
    console.log('⏳ Showing loading screen...');
    return <LoadingScreen />;
  }

  if (user) {
    console.log('👤 User authenticated, checking profile status...');
    console.log('📋 Profile exists:', !!profile, 'IsNewUser:', isNewUser);
    
    // Only show ProfileSetup for new users who just signed up
    if (isNewUser && !profile) {
      console.log('📋 New user authenticated but profile incomplete, showing ProfileSetup');
      return (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </Stack.Navigator>
      );
    }

    // For existing users, always show MainNavigator regardless of profile status
    console.log('✅ User authenticated, showing MainNavigator');
    return <MainNavigator />;
  } else {
    console.log('❌ No user, showing AuthStack');
    return <AuthStack />;
  }
}
