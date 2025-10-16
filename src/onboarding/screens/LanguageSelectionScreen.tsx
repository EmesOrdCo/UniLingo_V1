import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, OptionGrid } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { languageOptions, targetLanguageOptions } from '../constants';
import { validateScreen } from '../schema';

export function LanguageSelectionScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  
  // Get current values from store
  const { value: nativeLanguage, setValue: setNativeLanguage } = useOnboardingField('nativeLanguage');
  const { value: targetLanguage, setValue: setTargetLanguage } = useOnboardingField('targetLanguage');

  // Set default languages if not set
  useEffect(() => {
    if (!nativeLanguage) {
      setNativeLanguage('en-GB');
    }
    // Set default target language (not hard-coded to English anymore)
    if (!targetLanguage) {
      setTargetLanguage('es'); // Default to Spanish as example
    }
  }, [nativeLanguage, setNativeLanguage, targetLanguage, setTargetLanguage]);

  // Check if both languages are selected
  const canContinue = !!(nativeLanguage && targetLanguage);

  // Handle native language selection
  const handleNativeLanguageChange = (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      setNativeLanguage(selectedIds[0]);
    }
  };

  // Handle target language selection
  const handleTargetLanguageChange = (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      setTargetLanguage(selectedIds[0]);
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (canContinue) {
      // Validate the current data
      const validation = validateScreen('language-selection', {
        nativeLanguage,
        targetLanguage,
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

  // Convert language options to grid format
  const nativeLanguageOptions = languageOptions.map(lang => ({
    id: lang.code,
    title: lang.label,
    leftEmoji: lang.flagEmoji,
  }));

  // Show all languages except the selected native language as target options
  const targetLanguageGridOptions = targetLanguageOptions
    .filter(lang => lang.code !== nativeLanguage) // Exclude native language
    .map((lang: any) => ({
      id: lang.code,
      title: lang.label,
      leftEmoji: lang.flagEmoji,
      disabled: false, // Enable selection
    }));

  return (
    <Screen
      title="What languages do you speak?"
      subtitle="This helps us personalize your learning experience"
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleContinue}
      showBackButton={true}
    >
      <View style={styles.container}>
        {/* Native Language Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            I speak...
          </Text>
          <OptionGrid
            options={nativeLanguageOptions}
            selectedIds={nativeLanguage ? [nativeLanguage] : []}
            onSelectionChange={handleNativeLanguageChange}
            accessibilityLabel="Select your native language"
          />
        </View>

        {/* Target Language Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            I want to learn...
          </Text>
          <OptionGrid
            options={targetLanguageGridOptions}
            selectedIds={targetLanguage ? [targetLanguage] : []}
            onSelectionChange={handleTargetLanguageChange} // Enable selection
            accessibilityLabel="Select the language you want to learn"
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
});