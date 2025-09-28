import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { ProgressBar } from '../ui';
import { useOnboardingProgress } from '../state';

// Import all child onboarding screens
import { LanguagesScreen } from './LanguagesScreen';
import { GoalsScreen } from './GoalsScreen';
import { ProficiencyScreen } from './ProficiencyScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { AgeRangeScreen } from './AgeRangeScreen';
import { DiscoverySourceScreen } from './DiscoverySourceScreen';
import { NameScreen } from './NameScreen';
import { EmailScreen } from './EmailScreen';
import { ReviewScreen } from './ReviewScreen';

const Stack = createNativeStackNavigator();

// Custom header component with progress bar
function OnboardingHeader() {
  const theme = useThemeTokens();
  const { currentStep, totalSteps } = useOnboardingProgress();
  
  const progress = currentStep / (totalSteps - 2); // Exclude parent screens from progress

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progress}
          height={4}
          animated={true}
          duration={300}
        />
      </View>
      <View style={styles.stepIndicator}>
        <Text style={[styles.stepText, { color: theme.colors.text.medium }]}>
          Step {currentStep + 1} of 10
        </Text>
      </View>
    </View>
  );
}

export default function ChildOnboardingStack() {
  const theme = useThemeTokens();

  return (
    <Stack.Navigator
      screenOptions={{
        header: () => <OnboardingHeader />,
        headerShown: true,
        contentStyle: {
          backgroundColor: theme.colors.background.primary,
        },
        animation: 'slide_from_right',
        gestureEnabled: false, // Disable swipe back gesture
      }}
    >
      <Stack.Screen
        name="Languages"
        component={LanguagesScreen}
        options={{
          title: 'Languages',
        }}
      />
      <Stack.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          title: 'Goals',
        }}
      />
      <Stack.Screen
        name="Proficiency"
        component={ProficiencyScreen}
        options={{
          title: 'Proficiency',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name="AgeRange"
        component={AgeRangeScreen}
        options={{
          title: 'Age Range',
        }}
      />
      <Stack.Screen
        name="DiscoverySource"
        component={DiscoverySourceScreen}
        options={{
          title: 'Discovery Source',
        }}
      />
      <Stack.Screen
        name="Name"
        component={NameScreen}
        options={{
          title: 'Name',
        }}
      />
      <Stack.Screen
        name="Email"
        component={EmailScreen}
        options={{
          title: 'Email',
        }}
      />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          title: 'Review',
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  progressContainer: {
    marginBottom: 8,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
