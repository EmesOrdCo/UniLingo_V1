import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen } from '../ui';
import { useOnboardingStore } from '../state';
import { completeOnboarding } from '../completeOnboarding';
import SubscriptionRedirectModal from '../../components/SubscriptionRedirectModal';

export function SubscriptionRedirectScreen() {
  const theme = useThemeTokens();
  const { previousStep, getData } = useOnboardingStore();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleSubscriptionModalClose = () => {
    setShowSubscriptionModal(false);
    // Complete onboarding after user interacts with subscription modal
    const onboardingData = getData();
    completeOnboarding({ data: onboardingData });
  };

  return (
    <>
      <Screen
        title="Complete Your Registration"
        subtitle="To access all UniLingo features, please complete your subscription setup"
        canContinue={true}
        onBack={previousStep}
        onContinue={() => setShowSubscriptionModal(true)}
        continueText="Complete Registration"
        showBackButton={true}
      >
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="card" size={80} color="#6366f1" />
          </View>

          {/* Benefits List */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>What you'll get:</Text>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.benefitText}>Unlimited flashcards</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.benefitText}>Unlimited study sessions</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.benefitText}>Advanced analytics</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.benefitText}>AI recommendations</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.benefitText}>Ad-free experience</Text>
            </View>
          </View>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              You'll be redirected to our secure subscription page to complete your registration and choose your plan.
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
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 20,
  },
  benefitsContainer: {
    width: '100%',
    gap: 16,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  infoContainer: {
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
