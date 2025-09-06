import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { OnboardingOption } from '../components/OnboardingOption';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { useOnboardingStore } from '../state';
import { LEVEL_OPTIONS, validateStep } from '../schema';

export function CurrentLevelScreen() {
  const theme = useThemeTokens();
  const { currentLevel, updateField, nextStep, previousStep, markStepCompleted } = useOnboardingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLevelSelect = (level: string) => {
    updateField('currentLevel', level);
    setErrors({});
  };

  const handleContinue = () => {
    const validation = validateStep(3, {
      currentLevel,
    });

    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    markStepCompleted(3);
    nextStep();
  };

  const styles = StyleSheet.create({
    optionsContainer: {
      marginBottom: theme.spacing.xl,
    },
    errorText: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.status.error,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    continueButton: {
      marginTop: theme.spacing.xl,
    },
  });

  const targetLanguage = useOnboardingStore.getState().targetLanguages[0] || 'Spanish';

  return (
    <OnboardingLayout
      title={`How much ${targetLanguage} do you already know?`}
      onBack={previousStep}
    >
      <View style={styles.optionsContainer}>
        {LEVEL_OPTIONS.map((option) => (
          <OnboardingOption
            key={option}
            title={option}
            isSelected={currentLevel === option}
            onPress={() => handleLevelSelect(option)}
          />
        ))}
      </View>

      {errors.currentLevel && (
        <Text style={styles.errorText}>{errors.currentLevel}</Text>
      )}

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={!currentLevel}
        style={styles.continueButton}
      />
    </OnboardingLayout>
  );
}

