import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import subscription redirect screen
import { SubscriptionRedirectScreen } from './screens/SubscriptionRedirectScreen';

const Stack = createStackNavigator();

export function ParentOnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe back gesture
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen
        name="SubscriptionRedirect"
        component={SubscriptionRedirectScreen}
      />
    </Stack.Navigator>
  );
}

export default ParentOnboardingStack;

