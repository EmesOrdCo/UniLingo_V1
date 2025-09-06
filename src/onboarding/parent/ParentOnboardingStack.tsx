import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { PlansScreen } from './PlansScreen';
import { TrialOfferScreen } from './TrialOfferScreen';

export type ParentOnboardingStackParamList = {
  Plans: undefined;
  TrialOffer: undefined;
};

const Stack = createNativeStackNavigator<ParentOnboardingStackParamList>();

export function ParentOnboardingStack() {
  const theme = useThemeTokens();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.textDark,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerBackButtonMenuEnabled: false,
      }}
    >
      <Stack.Screen
        name="Plans"
        component={PlansScreen}
        options={{
          title: 'Choose Your Plan',
          headerLeft: () => null, // Disable back button on first screen
        }}
      />
      <Stack.Screen
        name="TrialOffer"
        component={TrialOfferScreen}
        options={{
          title: 'Free Trial',
          headerLeft: () => null, // Back navigation handled by screen components
        }}
      />
    </Stack.Navigator>
  );
}

export default ParentOnboardingStack;

