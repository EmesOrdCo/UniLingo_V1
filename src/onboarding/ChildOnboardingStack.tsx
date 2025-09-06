import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import all child onboarding screens
import { LanguageSelectionScreen } from './screens/LanguageSelectionScreen';
import { TimeCommitmentScreen } from './screens/TimeCommitmentScreen';
import { AgeScreen } from './screens/AgeScreen';
import { CurrentLevelScreen } from './screens/CurrentLevelScreen';
import { LearningGoalsScreen } from './screens/LearningGoalsScreen';
import { HowDidYouHearScreen } from './screens/HowDidYouHearScreen';
import { EmailScreen } from './screens/EmailScreen';
import { NameScreen } from './screens/NameScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';

const Stack = createStackNavigator();

export function ChildOnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe back gesture
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen
        name="LanguageSelection"
        component={LanguageSelectionScreen}
      />
      <Stack.Screen
        name="TimeCommitment"
        component={TimeCommitmentScreen}
      />
      <Stack.Screen
        name="Age"
        component={AgeScreen}
      />
      <Stack.Screen
        name="CurrentLevel"
        component={CurrentLevelScreen}
      />
      <Stack.Screen
        name="LearningGoals"
        component={LearningGoalsScreen}
      />
      <Stack.Screen
        name="HowDidYouHear"
        component={HowDidYouHearScreen}
      />
      <Stack.Screen
        name="Email"
        component={EmailScreen}
      />
      <Stack.Screen
        name="Name"
        component={NameScreen}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
    </Stack.Navigator>
  );
}

export default ChildOnboardingStack;

