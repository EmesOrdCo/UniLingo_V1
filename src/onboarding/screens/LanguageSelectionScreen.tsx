import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { OnboardingOption } from '../components/OnboardingOption';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { useOnboardingStore } from '../state';
import { LANGUAGE_OPTIONS, validateStep } from '../schema';

export function LanguageSelectionScreen() {
  const theme = useThemeTokens();
  const { nativeLanguage, targetLanguages, updateField, nextStep, markStepCompleted } = useOnboardingStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNativeLanguageSelect = (language: string) => {
    updateField('nativeLanguage', language);
    setErrors({});
  };

  const handleTargetLanguageToggle = (language: string) => {
    const currentTargets = targetLanguages;
    const isSelected = currentTargets.includes(language);
    
    let newTargets: string[];
    if (isSelected) {
      newTargets = currentTargets.filter(lang => lang !== language);
    } else {
      if (currentTargets.length >= 3) {
        return; // Max 3 languages
      }
      newTargets = [...currentTargets, language];
    }
    
    updateField('targetLanguages', newTargets);
    setErrors({});
  };

  const handleContinue = () => {
    const validation = validateStep(0, {
      nativeLanguage,
      targetLanguages,
    });

    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    markStepCompleted(0);
    nextStep();
  };

  const styles = StyleSheet.create({
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    languageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    languageOption: {
      width: '48%',
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.radius.md,
      borderWidth: 2,
      borderColor: theme.colors.border.primary,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      alignItems: 'center',
      flexDirection: 'row',
    },
    selectedLanguageOption: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}10`,
    },
    languageFlag: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    languageText: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.text.primary,
      flex: 1,
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

  return (
    <OnboardingLayout
      title="My languages"
      showBackButton={false}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I speak...</Text>
          <View style={styles.languageGrid}>
            {LANGUAGE_OPTIONS.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageOption,
                  nativeLanguage === language && styles.selectedLanguageOption,
                ]}
                onPress={() => handleNativeLanguageSelect(language)}
              >
                <View style={styles.languageFlag}>
                  <Ionicons
                    name="flag"
                    size={16}
                    color={nativeLanguage === language ? theme.colors.primary : theme.colors.text.secondary}
                  />
                </View>
                <Text style={styles.languageText}>{language}</Text>
                {nativeLanguage === language && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {errors.nativeLanguage && (
            <Text style={styles.errorText}>{errors.nativeLanguage}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>I want to learn</Text>
          <View style={styles.languageGrid}>
            {LANGUAGE_OPTIONS.filter(lang => lang !== nativeLanguage).map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageOption,
                  targetLanguages.includes(language) && styles.selectedLanguageOption,
                ]}
                onPress={() => handleTargetLanguageToggle(language)}
              >
                <View style={styles.languageFlag}>
                  <Ionicons
                    name="flag"
                    size={16}
                    color={targetLanguages.includes(language) ? theme.colors.primary : theme.colors.text.secondary}
                  />
                </View>
                <Text style={styles.languageText}>{language}</Text>
                {targetLanguages.includes(language) && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {errors.targetLanguages && (
            <Text style={styles.errorText}>{errors.targetLanguages}</Text>
          )}
        </View>

        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          disabled={!nativeLanguage || targetLanguages.length === 0}
          style={styles.continueButton}
        />
      </ScrollView>
    </OnboardingLayout>
  );
}

