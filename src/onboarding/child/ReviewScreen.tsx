import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, CardOption } from '../ui';
import { useOnboardingStore, useOnboardingData } from '../state';
import { validateCompleteOnboarding } from '../schema';
import { languageOptions, targetLanguageOptions, goals, proficiencyOptions, ageRanges, discoveryOptions } from '../constants';

export function ReviewScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  const data = useOnboardingData();

  // Get display values
  const getNativeLanguageLabel = () => {
    const lang = languageOptions.find(l => l.code === data.nativeLanguage);
    return lang ? `${lang.flagEmoji} ${lang.label}` : 'Not selected';
  };

  const getTargetLanguageLabel = () => {
    const lang = targetLanguageOptions.find(l => l.code === data.targetLanguage);
    return lang ? `${lang.flagEmoji} ${lang.label}` : 'Not selected';
  };

  const getGoalsLabel = () => {
    if (!data.goals || data.goals.length === 0) return 'Not selected';
    const goalLabels = data.goals.map(goalKey => {
      const goal = goals.find(g => g.key === goalKey);
      return goal ? goal.label : goalKey;
    });
    return goalLabels.join(', ');
  };

  const getProficiencyLabel = () => {
    const prof = proficiencyOptions.find(p => p.key === data.proficiency);
    return prof ? prof.label : 'Not selected';
  };

  const getAgeRangeLabel = () => {
    const age = ageRanges.find(a => a.key === data.ageRange);
    return age ? age.label : 'Not selected';
  };

  const getDiscoveryLabel = () => {
    const discovery = discoveryOptions.find(d => d.key === data.discoverySource);
    return discovery ? discovery.label : 'Not selected';
  };

  // Check if all data is valid
  const validation = validateCompleteOnboarding(data);
  const canContinue = validation.valid;

  // Handle continue
  const handleContinue = () => {
    if (canContinue) {
      // Navigate to ParentOnboardingStack (Plans screen)
      navigation.navigate('ParentOnboarding' as never);
    }
  };

  // Handle back
  const handleBack = () => {
    previousStep();
  };

  // Handle field edit
  const handleFieldEdit = (screenName: string) => {
    // Navigate back to the specific screen
    navigation.navigate(screenName as never);
  };

  return (
    <Screen
      title="Review your choices"
      subtitle="Tap any field to edit it"
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <View style={styles.container}>
        {/* Summary Cards */}
        <View style={styles.cardsContainer}>
          <CardOption
            title="Languages"
            subtitle={`${getNativeLanguageLabel()} → ${getTargetLanguageLabel()}`}
            onPress={() => handleFieldEdit('Languages')}
            rightIcon="chevron"
            accessibilityLabel="Edit language selection"
            accessibilityHint="Tap to go back and edit your language choices"
          />

          <CardOption
            title="Learning Goals"
            subtitle={getGoalsLabel()}
            onPress={() => handleFieldEdit('Goals')}
            rightIcon="chevron"
            accessibilityLabel="Edit learning goals"
            accessibilityHint="Tap to go back and edit your learning goals"
          />

          <CardOption
            title="Current Level"
            subtitle={getProficiencyLabel()}
            onPress={() => handleFieldEdit('Proficiency')}
            rightIcon="chevron"
            accessibilityLabel="Edit proficiency level"
            accessibilityHint="Tap to go back and edit your current level"
          />

          <CardOption
            title="Age Range"
            subtitle={getAgeRangeLabel()}
            onPress={() => handleFieldEdit('AgeRange')}
            rightIcon="chevron"
            accessibilityLabel="Edit age range"
            accessibilityHint="Tap to go back and edit your age range"
          />

          <CardOption
            title="How You Found Us"
            subtitle={getDiscoveryLabel()}
            onPress={() => handleFieldEdit('DiscoverySource')}
            rightIcon="chevron"
            accessibilityLabel="Edit discovery source"
            accessibilityHint="Tap to go back and edit how you found us"
          />

          <CardOption
            title="Name"
            subtitle={data.firstName || 'Not provided'}
            onPress={() => handleFieldEdit('Name')}
            rightIcon="chevron"
            accessibilityLabel="Edit name"
            accessibilityHint="Tap to go back and edit your name"
          />

          <CardOption
            title="Email"
            subtitle={data.email || 'Not provided'}
            onPress={() => handleFieldEdit('Email')}
            rightIcon="chevron"
            accessibilityLabel="Edit email"
            accessibilityHint="Tap to go back and edit your email"
          />

          <CardOption
            title="Notifications"
            subtitle={data.wantsNotifications ? 'Enabled' : 'Disabled'}
            onPress={() => handleFieldEdit('Notifications')}
            rightIcon="chevron"
            accessibilityLabel="Edit notification preferences"
            accessibilityHint="Tap to go back and edit notification settings"
          />
        </View>

        {/* Validation Error */}
        {!canContinue && validation.errors && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              Please complete all required fields to continue
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
  },
  cardsContainer: {
    gap: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
