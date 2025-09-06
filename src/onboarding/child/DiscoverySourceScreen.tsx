import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, RadioRow } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { discoveryOptions } from '../constants';
import { validateScreen } from '../schema';

export function DiscoverySourceScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  const { value: discoverySource, setValue: setDiscoverySource } = useOnboardingField('discoverySource');

  // Check if discovery source is selected
  const canContinue = !!discoverySource;

  // Handle discovery source selection
  const handleDiscoverySourceChange = (source: string) => {
    setDiscoverySource(source as any);
  };

  // Handle continue
  const handleContinue = () => {
    if (canContinue) {
      // Validate the current data
      const validation = validateScreen('how-did-you-hear', {
        discoverySource,
      });

      if (validation.valid) {
        nextStep();
      }
    }
  };

  // Handle back
  const handleBack = () => {
    previousStep();
  };

  return (
    <Screen
      title="How did you hear about us?"
      subtitle="This helps us understand how to reach more learners like you"
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <View style={styles.container}>
        {discoveryOptions.map((option) => (
          <View key={option.key} style={styles.optionContainer}>
            <RadioRow
              title={option.label}
              selected={discoverySource === option.key}
              onPress={() => handleDiscoverySourceChange(option.key)}
              style={styles.radioRow}
              accessibilityLabel={`Discovery source: ${option.label}`}
              accessibilityHint={
                discoverySource === option.key
                  ? 'Currently selected'
                  : 'Tap to select this discovery source'
              }
            />
          </View>
        ))}

        {/* Helper Text */}
        {!discoverySource && (
          <View style={styles.helperContainer}>
            <Text style={[styles.helperText, { color: theme.colors.textLight }]}>
              Select how you heard about us to continue
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  optionContainer: {
    backgroundColor: 'transparent',
  },
  radioRow: {
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  helperContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

