import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface SubscriptionPlan {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
  expiresAt?: Date;
  features: string[];
  cost?: number;
  planType?: 'monthly' | 'yearly';
  renewalDate?: Date;
}

interface SubscriptionContextType {
  currentPlan: SubscriptionPlan | null;
  isLoading: boolean;
  upgradeToPlan: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const SUBSCRIPTION_STORAGE_KEY = 'user_subscription';

// Helper function to get free plan
const getFreePlan = (): SubscriptionPlan => ({
  id: 'free',
  name: 'Free',
  status: 'active',
  features: [
    'Access to basic flashcards',
    'Limited lessons (5 per day)',
    'Basic progress tracking',
    'Community support',
  ],
});

// Helper function to parse subscription details from payment tier
const parseSubscriptionDetails = (paymentTier: string, nextBillingDate?: string) => {
  const planDetails: {
    name: string;
    cost: number;
    planType: 'monthly' | 'yearly';
    features: string[];
  } = {
    name: 'Premium Monthly',
    cost: 9.99,
    planType: 'monthly',
    features: [
      'AI flashcards',
      'AI lessons',
      'Advanced progress analytics',
      'AI-powered study recommendations',
      'Priority support',
      'Ad-free experience',
      'Export study data',
      'Custom study plans',
    ],
  };

  // Parse payment tier to determine plan details (only monthly and yearly)
  if (paymentTier.includes('yearly') || paymentTier.includes('annual')) {
    planDetails.planType = 'yearly';
    planDetails.cost = 89.99; // Yearly price
    planDetails.name = 'Premium Yearly';
  } else {
    // Default to monthly for any other payment tier
    planDetails.planType = 'monthly';
    planDetails.cost = 9.99; // Monthly price
    planDetails.name = 'Premium Monthly';
  }

  return planDetails;
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load subscription data on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData();
    } else {
      setCurrentPlan(null);
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        setCurrentPlan(null);
        return;
      }

      // Load subscription data from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('payment_tier, has_active_subscription, next_billing_date')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading subscription data:', error);
        // Fallback to free plan on error
        setCurrentPlan(getFreePlan());
        return;
      }

      if (!userData) {
        console.log('No user data found, defaulting to free plan');
        setCurrentPlan(getFreePlan());
        return;
      }

      // Determine subscription status based on database data
      const hasActiveSubscription = userData.has_active_subscription;
      const paymentTier = userData.payment_tier;
      const nextBillingDate = userData.next_billing_date;

      let subscriptionPlan: SubscriptionPlan;

      if (!hasActiveSubscription || !paymentTier || paymentTier === 'free') {
        subscriptionPlan = getFreePlan();
      } else {
        // Parse subscription details
        const planDetails = parseSubscriptionDetails(paymentTier, nextBillingDate);
        subscriptionPlan = {
          id: paymentTier,
          name: planDetails.name,
          status: 'active',
          expiresAt: nextBillingDate ? new Date(nextBillingDate) : undefined,
          renewalDate: nextBillingDate ? new Date(nextBillingDate) : undefined,
          cost: planDetails.cost,
          planType: planDetails.planType,
          features: planDetails.features,
        };
      }

      setCurrentPlan(subscriptionPlan);
      
      
    } catch (error) {
      console.error('Error loading subscription data:', error);
      // Default to free plan on error
      setCurrentPlan(getFreePlan());
    } finally {
      setIsLoading(false);
    }
  };

  const saveSubscriptionData = async (plan: SubscriptionPlan) => {
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(plan));
      setCurrentPlan(plan);
    } catch (error) {
      console.error('Error saving subscription data:', error);
    }
  };


  const upgradeToPlan = async (planId: string) => {
    try {
      setIsLoading(true);
      
      // TODO: Integrate with Stripe backend
      console.log('Upgrading to plan:', planId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Define plan features based on planId
      const planFeatures = {
        pro: [
          'AI flashcards',
          'Unlimited study sessions',
          'Advanced progress analytics',
          'AI-powered study recommendations',
          'Priority support',
          'Ad-free experience',
          'Export study data',
          'Custom study plans',
        ],
        premium: [
          'Everything in Pro',
          'Personal AI tutor',
          'Advanced language learning tools',
          'Study group features',
          'Certification preparation',
          '1-on-1 tutoring sessions',
          'Custom learning paths',
          'Advanced reporting',
        ],
      };
      
      const newPlan: SubscriptionPlan = {
        id: planId,
        name: planId === 'pro' ? 'Pro' : 'Premium',
        status: 'trial',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
        features: planFeatures[planId as keyof typeof planFeatures] || [],
      };
      
      await saveSubscriptionData(newPlan);
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Integrate with Stripe backend
      console.log('Cancelling subscription');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const cancelledPlan: SubscriptionPlan = {
        ...currentPlan!,
        status: 'cancelled',
      };
      
      await saveSubscriptionData(cancelledPlan);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Integrate with Stripe backend to check real status
      console.log('Checking subscription status');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just reload local data
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: SubscriptionContextType = {
    currentPlan,
    isLoading,
    upgradeToPlan,
    cancelSubscription,
    checkSubscriptionStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
