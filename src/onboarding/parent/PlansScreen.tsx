import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, CardOption, OnboardingButton } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { createBillingClient, Plan } from '../../billing/BillingClient';
import { Ionicons } from '@expo/vector-icons';
import SubscriptionRedirectModal from '../../components/SubscriptionRedirectModal';

export function PlansScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep, completeOnboarding } = useOnboardingStore();
  const { value: selectedPlanId, setValue: setSelectedPlanId } = useOnboardingField('selectedPlanId');
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Set default plan
  useEffect(() => {
    if (!selectedPlanId) {
      setSelectedPlanId('annual');
    }
  }, [selectedPlanId, setSelectedPlanId]);

  // Load plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const billingClient = createBillingClient();
        const availablePlans = await billingClient.getAvailablePlans();
        setPlans(availablePlans);
      } catch (error) {
        console.error('Failed to load plans:', error);
      }
    };
    loadPlans();
  }, []);

  // Handle plan selection
  const handlePlanSelect = (planId: Plan['id']) => {
    setSelectedPlanId(planId);
  };

  // Handle subscribe
  const handleSubscribe = async () => {
    if (!selectedPlanId) return;

    // Instead of processing payment, show subscription redirect modal
    setShowSubscriptionModal(true);
  };

  // Handle restore purchases
  const handleRestorePurchases = async () => {
    setRestoring(true);

    try {
      const billingClient = createBillingClient();
      const result = await billingClient.restorePurchases();

      if (result.entitlementActive) {
        Alert.alert(
          'Purchases Restored',
          'Your previous purchases have been restored successfully!',
          [{ text: 'Great!', onPress: () => completeOnboarding() }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Error',
        'Failed to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRestoring(false);
    }
  };

  // Handle discount code application
  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      Alert.alert('Invalid Code', 'Please enter a discount code.');
      return;
    }

    // Mock discount code validation
    const validCodes = ['SAVE20', 'WELCOME10', 'STUDENT15'];
    const code = discountCode.trim().toUpperCase();
    
    if (validCodes.includes(code)) {
      setDiscountApplied(true);
      Alert.alert('Discount Applied!', `Your discount code "${code}" has been applied successfully.`);
    } else {
      Alert.alert('Invalid Code', 'The discount code you entered is not valid. Please try again.');
    }
  };

  // Handle show all plans (placeholder)
  const handleShowAllPlans = () => {
    // For now, just show an alert
    Alert.alert(
      'All Plans',
      'Monthly, Annual and Lifetime plans are currently available.',
      [{ text: 'OK' }]
    );
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleSubscriptionModalClose = () => {
    setShowSubscriptionModal(false);
    // Complete onboarding after user interacts with subscription modal
    completeOnboarding();
  };

  return (
    <>
      <Screen
        title="Please select a subscription"
        subtitle="Choose the plan that works best for you"
        canContinue={!!selectedPlanId}
        onBack={previousStep}
        onContinue={handleSubscribe}
        continueText={loading ? 'Processing...' : 'Subscribe now'}
      >
      <View style={styles.container}>
        {/* Checklist */}
        <View style={styles.checklistContainer}>
          <View style={styles.checklistItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={[styles.checklistText, { color: theme.colors.textDark }]}>
              Access to all lessons and games
            </Text>
          </View>
          <View style={styles.checklistItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={[styles.checklistText, { color: theme.colors.textDark }]}>
              Personalized learning path
            </Text>
          </View>
          <View style={styles.checklistItem}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={[styles.checklistText, { color: theme.colors.textDark }]}>
              Progress tracking and analytics
            </Text>
          </View>
        </View>

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <CardOption
                title={plan.title}
                subtitle={plan.priceText}
                selected={selectedPlanId === plan.id}
                onPress={() => handlePlanSelect(plan.id)}
                rightIcon="checkbox"
                style={[
                  styles.planOption,
                  selectedPlanId === plan.id && {
                    borderColor: theme.colors.accent,
                    borderWidth: 2,
                  },
                ]}
              />
              
              {plan.badge && (
                <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.surface }]}>
                    {plan.badge}
                  </Text>
                </View>
              )}
              
              {plan.subText && (
                <Text style={[styles.subText, { color: theme.colors.textMedium }]}>
                  {plan.subText}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Discount Code Section */}
        <View style={styles.discountContainer}>
          <Text style={[styles.discountTitle, { color: theme.colors.textDark }]}>
            Have a discount code?
          </Text>
          <View style={styles.discountInputContainer}>
            <TextInput
              style={[
                styles.discountInput,
                { 
                  borderColor: discountApplied ? '#22c55e' : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textDark,
                }
              ]}
              placeholder="Enter discount code"
              placeholderTextColor={theme.colors.textLight}
              value={discountCode}
              onChangeText={setDiscountCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.applyButton,
                { 
                  backgroundColor: discountApplied ? '#22c55e' : theme.colors.primary,
                }
              ]}
              onPress={handleApplyDiscount}
              disabled={!discountCode.trim()}
            >
              <Ionicons 
                name={discountApplied ? "checkmark" : "arrow-forward"} 
                size={20} 
                color="#ffffff" 
              />
            </TouchableOpacity>
          </View>
          {discountApplied && (
            <Text style={[styles.discountAppliedText, { color: '#22c55e' }]}>
              ✓ Discount code applied successfully!
            </Text>
          )}
        </View>

        {/* Show All Plans Link */}
        <View style={styles.linkContainer}>
          <Text
            style={[styles.linkText, { color: theme.colors.primary }]}
            onPress={handleShowAllPlans}
          >
            Show all plans
          </Text>
        </View>

        {/* Restore Purchases */}
        <View style={styles.restoreContainer}>
          <Text
            style={[styles.restoreText, { color: theme.colors.textMedium }]}
            onPress={restoring ? undefined : handleRestorePurchases}
          >
            {restoring ? 'Restoring...' : 'Restore purchases'}
          </Text>
        </View>

        {/* Legal Footer */}
        <View style={styles.legalContainer}>
          <Text style={[styles.legalText, { color: theme.colors.textLight }]}>
            By subscribing, you agree to our Terms of Service and Privacy Policy. 
            Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
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
    gap: 24,
  },
  checklistContainer: {
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkmark: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
  },
  checklistText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    position: 'relative',
  },
  planOption: {
    minHeight: 80,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subText: {
    fontSize: 14,
    marginTop: 8,
    marginLeft: 16,
  },
  discountContainer: {
    gap: 12,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  discountInputContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  discountInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  applyButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountAppliedText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  linkContainer: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
  restoreContainer: {
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  legalContainer: {
    paddingHorizontal: 8,
  },
  legalText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});

