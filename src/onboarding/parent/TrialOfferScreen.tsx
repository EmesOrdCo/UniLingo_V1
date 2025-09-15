import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, OnboardingButton } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { createBillingClient } from '../../billing/BillingClient';
import { completeOnboarding } from '../completeOnboarding';
import SubscriptionRedirectModal from '../../components/SubscriptionRedirectModal';

export function TrialOfferScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { previousStep, getData } = useOnboardingStore();
  const { value: selectedPlanId } = useOnboardingField('selectedPlanId');
  
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Handle start free trial
  const handleStartTrial = async () => {
    // Instead of processing payment, show subscription redirect modal
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionModalClose = () => {
    setShowSubscriptionModal(false);
    // Complete onboarding after user interacts with subscription modal
    const onboardingData = getData();
    completeOnboarding({ data: onboardingData });
  };

  return (
    <>
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
    
    <SubscriptionRedirectModal
      visible={showSubscriptionModal}
      onClose={handleSubscriptionModalClose}
    />
    </>
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

