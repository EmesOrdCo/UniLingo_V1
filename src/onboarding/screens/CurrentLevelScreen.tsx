import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, RadioRow } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { proficiencyOptions } from '../constants';
import { validateScreen } from '../schema';

export function CurrentLevelScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  const { value: proficiency, setValue: setProficiency } = useOnboardingField('proficiency');

  // Check if proficiency is selected
  const canContinue = !!proficiency;

  // Handle proficiency selection
  const handleProficiencyChange = (level: 'none' | 'basic' | 'advanced') => {
    setProficiency(level);
  };

  // Handle continue
  const handleContinue = () => {
    if (canContinue) {
      // Validate the current data
      const validation = validateScreen('current-level', {
        proficiency,
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
      title="How much do you already know?"
      subtitle="This helps us personalize your learning path"
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <View style={styles.container}>
        {proficiencyOptions.map((option) => (
          <View key={option.key} style={styles.optionContainer}>
            <RadioRow
              title={option.label}
              selected={proficiency === option.key}
              onPress={() => handleProficiencyChange(option.key as 'none' | 'basic' | 'advanced')}
              style={styles.radioRow}
              accessibilityLabel={`${option.label} proficiency level`}
              accessibilityHint={
                proficiency === option.key
                  ? 'Currently selected'
                  : 'Tap to select this proficiency level'
              }
            />
          </View>
        ))}

        {/* Helper Text */}
        {!proficiency && (
          <View style={styles.helperContainer}>
            <Text style={[styles.helperText, { color: theme.colors.text.secondary }]}>
              Select your current level to continue
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  optionContainer: {
    backgroundColor: 'transparent',
  },
  radioRow: {
    minHeight: 64,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
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