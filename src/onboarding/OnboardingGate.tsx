import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useOnboardingStore, TOTAL_ONBOARDING_STEPS } from './state';
import { ChildOnboardingStack } from './ChildOnboardingStack';
import { ParentOnboardingStack } from './ParentOnboardingStack';

const Stack = createStackNavigator();

interface OnboardingGateProps {
  onComplete?: () => void;
}

export function OnboardingGate({ onComplete }: OnboardingGateProps) {
  const { isCompleted, currentStep, completeOnboarding } = useOnboardingStore();

  useEffect(() => {
    // If onboarding is already completed, call onComplete immediately
    if (isCompleted && onComplete) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  // Determine which stack to show based on current step
  const shouldShowParentStack = currentStep >= 9; // Step 9 is subscription redirect screen

  if (shouldShowParentStack) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          cardStyle: { backgroundColor: '#ffffff' },
        }}
      >
        <Stack.Screen
          name="ParentOnboarding"
          component={ParentOnboardingStack}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen
        name="ChildOnboarding"
        component={ChildOnboardingStack}
      />
    </Stack.Navigator>
  );
}

export default OnboardingGate;

