import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { useOnboardingStore } from '../state';
import { billingClient, SubscriptionPlan } from '../billing';
import { validateStep } from '../schema';
import SubscriptionRedirectModal from '../../components/SubscriptionRedirectModal';

export function PlansScreen() {
  const theme = useThemeTokens();
  const { selectedPlan, updateField, nextStep, previousStep, markStepCompleted, completeOnboarding } = useOnboardingStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      await billingClient.initialize();
      const availablePlans = await billingClient.getAvailablePlans();
      setPlans(availablePlans);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planId: string) => {
    updateField('selectedPlan', planId);
    setErrors({});
  };

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

  const handleContinue = () => {
    const validation = validateStep(9, {
      selectedPlan,
    });

    if (!validation.success) {
      setErrors(validation.errors || {});
      return;
    }

    // Instead of proceeding to next step, show subscription redirect modal
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionModalClose = () => {
    setShowSubscriptionModal(false);
    // Complete onboarding after user interacts with subscription modal
    markStepCompleted(9);
    completeOnboarding();
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    const currencySymbol = plan.currency === 'GBP' ? '£' : '$';
    if (plan.period === 'lifetime') {
      return `${currencySymbol}${plan.price}`;
    }
    return `${currencySymbol}${plan.price} per ${plan.period === 'yearly' ? 'year' : 'month'}`;
  };

  const styles = StyleSheet.create({
    featuresContainer: {
      marginBottom: theme.spacing.xl,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    featureIcon: {
      marginRight: theme.spacing.sm,
    },
    featureText: {
      fontSize: theme.fonts.sizes.md,
      color: theme.colors.text.primary,
    },
    plansContainer: {
      marginBottom: theme.spacing.xl,
    },
    planCard: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.radius.lg,
      borderWidth: 2,
      borderColor: theme.colors.border.primary,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      position: 'relative',
    },
    popularPlan: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}05`,
    },
    selectedPlan: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}10`,
    },
    popularBadge: {
      position: 'absolute',
      top: -1,
      right: theme.spacing.lg,
      backgroundColor: theme.colors.status.error,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderBottomLeftRadius: theme.radius.sm,
      borderBottomRightRadius: theme.radius.sm,
    },
    popularBadgeText: {
      color: theme.colors.text.inverse,
      fontSize: theme.fonts.sizes.xs,
      fontWeight: theme.fonts.weights.bold,
    },
    planHeader: {
      marginBottom: theme.spacing.md,
    },
    planName: {
      fontSize: theme.fonts.sizes.lg,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    planPrice: {
      fontSize: theme.fonts.sizes.xl,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.primary,
    },
    planPeriod: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    planDescription: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.md,
    },
    discountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    originalPrice: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.text.tertiary,
      textDecorationLine: 'line-through',
      marginRight: theme.spacing.sm,
    },
    discountText: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.status.success,
      fontWeight: theme.fonts.weights.medium,
    },
    discountContainer: {
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    discountTitle: {
      fontSize: theme.fonts.sizes.md,
      fontWeight: theme.fonts.weights.semibold,
      textAlign: 'center',
    },
    discountInputContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
    },
    discountInput: {
      flex: 1,
      height: 48,
      borderWidth: 1,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.fonts.sizes.md,
    },
    applyButton: {
      width: 48,
      height: 48,
      borderRadius: theme.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    discountAppliedText: {
      fontSize: theme.fonts.sizes.sm,
      fontWeight: theme.fonts.weights.medium,
      textAlign: 'center',
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: theme.fonts.sizes.md,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.md,
    },
  });

  if (loading) {
    return (
      <OnboardingLayout
        title="Please select a subscription"
        onBack={previousStep}
        showCloseButton={true}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </OnboardingLayout>
    );
  }

  return (
    <>
      <OnboardingLayout
        title="Please select a subscription"
        onBack={previousStep}
        showCloseButton={true}
      >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons
              name="checkmark"
              size={20}
              color={theme.colors.status.success}
              style={styles.featureIcon}
            />
            <Text style={styles.featureText}>All 14 languages included</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons
              name="checkmark"
              size={20}
              color={theme.colors.status.success}
              style={styles.featureIcon}
            />
            <Text style={styles.featureText}>100+ lessons from beginner to advanced</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons
              name="checkmark"
              size={20}
              color={theme.colors.status.success}
              style={styles.featureIcon}
            />
            <Text style={styles.featureText}>Learn on the go with podcasts, audio recap, and more</Text>
          </View>
        </View>

        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                plan.isPopular && styles.popularPlan,
                selectedPlan === plan.id && styles.selectedPlan,
              ]}
              onPress={() => handlePlanSelect(plan.id)}
            >
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>SAVE 50%</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{formatPrice(plan)}</Text>
                {plan.period !== 'lifetime' && (
                  <Text style={styles.planPeriod}>
                    {plan.period === 'yearly' ? 'Charged every 12 months' : 'Charged monthly'}
                  </Text>
                )}
                {plan.discount && (
                  <View style={styles.discountContainer}>
                    <Text style={styles.originalPrice}>${plan.discount.originalPrice}</Text>
                    <Text style={styles.discountText}>Save {plan.discount.percentage}%</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.planDescription}>{plan.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Discount Code Section */}
        <View style={styles.discountContainer}>
          <Text style={[styles.discountTitle, { color: theme.colors.text.primary }]}>
            Have a discount code?
          </Text>
          <View style={styles.discountInputContainer}>
            <TextInput
              style={[
                styles.discountInput,
                { 
                  borderColor: discountApplied ? theme.colors.status.success : theme.colors.border.primary,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                }
              ]}
              placeholder="Enter discount code"
              placeholderTextColor={theme.colors.text.secondary}
              value={discountCode}
              onChangeText={setDiscountCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.applyButton,
                { 
                  backgroundColor: discountApplied ? theme.colors.status.success : theme.colors.primary,
                }
              ]}
              onPress={handleApplyDiscount}
              disabled={!discountCode.trim()}
            >
              <Ionicons 
                name={discountApplied ? "checkmark" : "arrow-forward"} 
                size={20} 
                color={theme.colors.text.inverse} 
              />
            </TouchableOpacity>
          </View>
          {discountApplied && (
            <Text style={[styles.discountAppliedText, { color: theme.colors.status.success }]}>
              ✓ Discount code applied successfully!
            </Text>
          )}
        </View>

        {errors.selectedPlan && (
          <Text style={styles.errorText}>{errors.selectedPlan}</Text>
        )}

        <OnboardingButton
          title="Subscribe now"
          onPress={handleContinue}
          disabled={!selectedPlan}
          style={styles.continueButton}
        />
      </ScrollView>
    </OnboardingLayout>
    
    <SubscriptionRedirectModal
      visible={showSubscriptionModal}
      onClose={handleSubscriptionModalClose}
    />
    </>
  );
}

