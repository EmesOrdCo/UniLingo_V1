import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { OnboardingOption } from '../components/OnboardingOption';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { useOnboardingStore } from '../state';
import { HEAR_ABOUT_OPTIONS } from '../schema';

export function HowDidYouHearScreen() {
  const theme = useThemeTokens();
  const { nextStep, previousStep, markStepCompleted } = useOnboardingStore();
  const [selectedOption, setSelectedOption] = useState<string>('');

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleContinue = () => {
    // This step doesn't require validation, just mark as completed
    markStepCompleted(5);
    nextStep();
  };

  const styles = StyleSheet.create({
    optionsContainer: {
      marginBottom: theme.spacing.xl,
    },
    continueButton: {
      marginTop: theme.spacing.xl,
    },
  });

  return (
    <OnboardingLayout
      title="How did you hear about UniLingo?"
      onBack={previousStep}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          {HEAR_ABOUT_OPTIONS.map((option) => (
            <OnboardingOption
              key={option}
              title={option}
              isSelected={selectedOption === option}
              onPress={() => handleOptionSelect(option)}
            />
          ))}
        </View>

        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedOption}
          style={styles.continueButton}
        />
      </ScrollView>
    </OnboardingLayout>
  );
}

