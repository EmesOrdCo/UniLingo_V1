import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSubscription } from '../contexts/SubscriptionContext';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Access to basic flashcards',
      'Limited study sessions (5 per day)',
      'Basic progress tracking',
      'Community support',
    ],
    isCurrent: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    originalPrice: '$19.99',
    period: 'per month',
    features: [
      'Unlimited flashcards',
      'Unlimited study sessions',
      'Advanced progress analytics',
      'AI-powered study recommendations',
      'Priority support',
      'Ad-free experience',
      'Export study data',
      'Custom study plans',
    ],
    isPopular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99',
    originalPrice: '$39.99',
    period: 'per month',
    features: [
      'Everything in Pro',
      'Personal AI tutor',
      'Advanced language learning tools',
      'Study group features',
      'Certification preparation',
      '1-on-1 tutoring sessions',
      'Custom learning paths',
      'Advanced reporting',
    ],
  },
];

interface PaywallScreenProps {
  onComplete: () => void;
}

export default function PaywallScreen({ onComplete }: PaywallScreenProps) {
  const navigation = useNavigation();
  const { upgradeToPlan } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    try {
      // Use the subscription context to upgrade
      await upgradeToPlan(selectedPlan);
      
      Alert.alert(
        'Subscription Successful!',
        'Welcome to UniLingo Pro! You now have access to all premium features.',
        [
          {
            text: 'Continue',
            onPress: () => {
              onComplete();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Subscription Failed',
        'There was an error processing your subscription. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Subscription',
      'You can always upgrade later from your profile. Continue with the free plan?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue Free',
          onPress: () => {
            onComplete();
          },
        },
      ]
    );
  };

  const renderPlanCard = (plan: PricingPlan) => {
    const isSelected = selectedPlan === plan.id;
    const isFree = plan.id === 'free';

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlanCard,
          plan.isPopular && styles.popularPlanCard,
        ]}
        onPress={() => handleSelectPlan(plan.id)}
        disabled={isFree}
      >
        {plan.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.period}>/{plan.period}</Text>
          </View>
          {plan.originalPrice && (
            <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={isSelected ? '#6366f1' : '#10b981'}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {isFree && (
          <View style={styles.currentPlanBadge}>
            <Text style={styles.currentPlanText}>Current Plan</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.navigate('Dashboard' as never)}
            >
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
              <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Unlock your full learning potential with UniLingo
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {pricingPlans.map(renderPlanCard)}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Why Upgrade?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="rocket" size={24} color="#6366f1" />
              <Text style={styles.benefitText}>Learn 3x faster with AI</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="trophy" size={24} color="#6366f1" />
              <Text style={styles.benefitText}>Track detailed progress</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={24} color="#6366f1" />
              <Text style={styles.benefitText}>Ad-free experience</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              isLoading && styles.subscribeButtonDisabled,
            ]}
            onPress={handleSubscribe}
            disabled={isLoading || selectedPlan === 'free'}
          >
            <Text style={styles.subscribeButtonText}>
              {isLoading ? 'Processing...' : 'Start Free Trial'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By subscribing, you agree to our{' '}
            <Text 
              style={styles.linkText}
              onPress={() => navigation.navigate('TermsAndConditions' as never)}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text 
              style={styles.linkText}
              onPress={() => navigation.navigate('PrivacyPolicy' as never)}
            >
              Privacy Policy
            </Text>
            . Cancel anytime.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerTop: {
    width: '100%',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  plansContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#6366f1',
    backgroundColor: '#f8fafc',
  },
  popularPlanCard: {
    borderColor: '#6366f1',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  period: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  currentPlanBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentPlanText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  benefitsContainer: {
    padding: 24,
    marginTop: 16,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 16,
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
  actionContainer: {
    padding: 24,
    gap: 16,
  },
  subscribeButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  subscribeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    color: '#6366f1',
    textDecorationLine: 'underline',
  },
});
