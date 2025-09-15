import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { useOnboardingStore } from '../state';
import { billingClient } from '../billing';
import { validateStep } from '../schema';
import SubscriptionRedirectModal from '../../components/SubscriptionRedirectModal';

export function TrialOfferScreen() {
  const theme = useThemeTokens();
  const { selectedPlan, trialStarted, updateField, nextStep, previousStep, markStepCompleted, completeOnboarding } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleStartTrial = async () => {
    // Instead of processing payment, show subscription redirect modal
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionModalClose = () => {
    setShowSubscriptionModal(false);
    // Complete onboarding after user interacts with subscription modal
    updateField('trialStarted', true);
    markStepCompleted(10);
    completeOnboarding();
  };

  const handleSkipTrial = () => {
    updateField('trialStarted', false);
    markStepCompleted(10);
    completeOnboarding();
  };

  const styles = StyleSheet.create({
    iconContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    giftIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    highlightText: {
      color: theme.colors.primary,
      fontWeight: theme.fonts.weights.bold,
    },
    pricingContainer: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.radius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      alignItems: 'center',
    },
    pricingText: {
      fontSize: theme.fonts.sizes.md,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    pricingHighlight: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.text.primary,
      textAlign: 'center',
    },
    buttonsContainer: {
      gap: theme.spacing.md,
    },
    errorText: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.status.error,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
  });

  return (
    <>
      <OnboardingLayout
        title="Need time to decide? Try it free for 7 days"
        subtitle="Enjoy full access to lessons and more! Cancel anytime."
        onBack={previousStep}
        showCloseButton={true}
      >
      <View style={styles.iconContainer}>
        <View style={styles.giftIcon}>
          <Ionicons
            name="rocket"
            size={50}
            color={theme.colors.text.inverse}
          />
        </View>
      </View>

      <View style={styles.pricingContainer}>
        <Text style={styles.pricingText}>
          Free for 7 days, then $179.96
        </Text>
        <Text style={styles.pricingHighlight}>
          $89.99 every 12 months ($7.50/mo)
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        <OnboardingButton
          title="Start your free trial"
          onPress={handleStartTrial}
          loading={loading}
          disabled={loading}
        />
        
        <OnboardingButton
          title="Maybe later"
          onPress={handleSkipTrial}
          variant="outline"
          disabled={loading}
        />
      </View>

        {errors.general && (
          <Text style={styles.errorText}>{errors.general}</Text>
        )}
      </OnboardingLayout>
      
      <SubscriptionRedirectModal
        visible={showSubscriptionModal}
        onClose={handleSubscriptionModalClose}
      />
      </>
    );
  }

