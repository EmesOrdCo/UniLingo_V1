import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { OnboardingButton } from '../components/OnboardingButton';

interface ScreenProps {
  title: string;
  subtitle?: string;
  canContinue: boolean;
  onBack?: () => void;
  onContinue: () => void;
  children: React.ReactNode;
  showBackButton?: boolean;
  continueText?: string;
  backText?: string;
}

export function Screen({
  title,
  subtitle,
  canContinue,
  onBack,
  onContinue,
  children,
  showBackButton = true,
  continueText = 'Continue',
  backText = 'Back',
}: ScreenProps) {
  const theme = useThemeTokens();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text.dark }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: theme.colors.text.medium }]}>
                {subtitle}
              </Text>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>
        </ScrollView>

        {/* Sticky Footer */}
        <View style={[styles.footer, { backgroundColor: theme.colors.background.primary }]}>
          <View style={styles.buttonContainer}>
            {showBackButton && onBack && (
              <OnboardingButton
                title={backText}
                onPress={onBack}
                variant="secondary"
                style={styles.backButton}
                accessibilityLabel={`Go back to previous step`}
              />
            )}
            <OnboardingButton
              title={continueText}
              onPress={onContinue}
              disabled={!canContinue}
              style={styles.continueButton}
              accessibilityLabel={`Continue to next step`}
              accessibilityHint={canContinue ? 'Tap to continue' : 'Complete current step to continue'}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
});

