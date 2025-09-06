import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, RadioRow } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { ageRanges } from '../constants';
import { validateScreen } from '../schema';

export function AgeRangeScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  const { value: ageRange, setValue: setAgeRange } = useOnboardingField('ageRange');

  // Check if age range is selected
  const canContinue = !!ageRange;

  // Handle age range selection
  const handleAgeRangeChange = (range: string) => {
    setAgeRange(range as any);
  };

  // Handle continue
  const handleContinue = () => {
    if (canContinue) {
      // Validate the current data
      const validation = validateScreen('age', {
        ageRange,
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
      title="How old are you?"
      subtitle="This helps us personalize your learning experience"
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <View style={styles.container}>
        {ageRanges.map((range) => (
          <View key={range.key} style={styles.optionContainer}>
            <RadioRow
              title={range.label}
              selected={ageRange === range.key}
              onPress={() => handleAgeRangeChange(range.key)}
              style={styles.radioRow}
              accessibilityLabel={`Age range: ${range.label}`}
              accessibilityHint={
                ageRange === range.key
                  ? 'Currently selected'
                  : 'Tap to select this age range'
              }
            />
          </View>
        ))}

        {/* Helper Text */}
        {!ageRange && (
          <View style={styles.helperContainer}>
            <Text style={[styles.helperText, { color: theme.colors.textLight }]}>
              Select your age range to continue
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

