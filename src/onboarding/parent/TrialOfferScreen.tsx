import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, OnboardingButton } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { createBillingClient } from '../../billing/BillingClient';
import { completeOnboarding } from '../completeOnboarding';

export function TrialOfferScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { previousStep, getData } = useOnboardingStore();
  const { value: selectedPlanId } = useOnboardingField('selectedPlanId');
  
  const [loading, setLoading] = useState(false);

  // Handle start free trial
  const handleStartTrial = async () => {
    const planId = selectedPlanId || 'annual';
    setLoading(true);

    try {
      const billingClient = createBillingClient();
      const result = await billingClient.purchase(planId);

      if (result.ok && result.entitlementActive) {
        // Purchase successful - complete onboarding
        const onboardingData = getData();
        const completionResult = await completeOnboarding({ data: onboardingData });

        if (completionResult.ok) {
          // Onboarding completed successfully
          Alert.alert(
            'Welcome to UniLingo!',
            'Your free trial has started. Enjoy learning!',
            [{ text: 'Get Started', onPress: () => {
              // Navigation will be handled by the OnboardingGate
              // which will detect completion and show the main app
            }}]
          );
        } else {
          Alert.alert(
            'Almost There!',
            'Your trial started but we had trouble saving your preferences. You can update them later in settings.',
            [{ text: 'Continue' }]
          );
        }
      } else {
        // Purchase failed
        Alert.alert(
          'Trial Start Failed',
          result.message || 'Unable to start your free trial. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Trial start error:', error);
      Alert.alert(
        'Error',
        'Something went wrong starting your trial. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Need time to decide? Try it free for 7 days"
      subtitle="Enjoy full access to lessons and more! Cancel anytime."
      canContinue={true}
      onBack={previousStep}
      onContinue={handleStartTrial}
      continueText={loading ? 'Starting trial...' : 'Start your free trial'}
      showBackButton={true}
    >
      <View style={styles.container}>
        {/* Professional Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="rocket" size={60} color="#6366f1" />
        </View>

        {/* Price Strip */}
        <View style={[styles.priceStrip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.priceContent}>
            <Text style={[styles.priceText, { color: theme.colors.textDark }]}>
              Free for 7 days, then £89.99 every 12 months
            </Text>
            <Text style={[styles.priceSubtext, { color: theme.colors.textMedium }]}>
              (£7.50/mo)
            </Text>
          </View>
        </View>

        {/* Benefits List */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={[styles.benefitText, { color: theme.colors.textDark }]}>
              Full access to all lessons and games
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={[styles.benefitText, { color: theme.colors.textDark }]}>
              Personalized learning recommendations
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={[styles.benefitText, { color: theme.colors.textDark }]}>
              Progress tracking and achievements
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={[styles.benefitText, { color: theme.colors.textDark }]}>
              Cancel anytime during your trial
            </Text>
          </View>
        </View>

        {/* Trial Terms */}
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: theme.colors.textLight }]}>
            Your free trial starts immediately. You can cancel anytime in your account settings. 
            After 7 days, you'll be charged £89.99 for 12 months of access.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  giftIcon: {
    fontSize: 64,
  },
  priceStrip: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  priceContent: {
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  priceSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  benefitsContainer: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
    width: 20,
  },
  benefitText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  termsContainer: {
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});

