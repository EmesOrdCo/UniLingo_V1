import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionPlan {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
  expiresAt?: Date;
  features: string[];
}

interface SubscriptionContextType {
  currentPlan: SubscriptionPlan | null;
  isLoading: boolean;
  hasShownPaywall: boolean;
  setHasShownPaywall: (shown: boolean) => void;
  upgradeToPlan: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const SUBSCRIPTION_STORAGE_KEY = 'user_subscription';
const PAYWALL_SHOWN_KEY = 'paywall_shown';

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
  const [hasShownPaywall, setHasShownPaywall] = useState(false);

  // Load subscription data on mount
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      
      // Load subscription data from storage
      const subscriptionData = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      const paywallShown = await AsyncStorage.getItem(PAYWALL_SHOWN_KEY);
      
      if (subscriptionData) {
        const parsed = JSON.parse(subscriptionData);
        setCurrentPlan({
          ...parsed,
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
        });
      } else {
        // Default to free plan
        setCurrentPlan({
          id: 'free',
          name: 'Free',
          status: 'active',
          features: [
            'Access to basic flashcards',
            'Limited study sessions (5 per day)',
            'Basic progress tracking',
            'Community support',
          ],
        });
      }
      
      setHasShownPaywall(paywallShown === 'true');
    } catch (error) {
      console.error('Error loading subscription data:', error);
      // Default to free plan on error
      setCurrentPlan({
        id: 'free',
        name: 'Free',
        status: 'active',
        features: [
          'Access to basic flashcards',
          'Limited study sessions (5 per day)',
          'Basic progress tracking',
          'Community support',
        ],
      });
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

  const savePaywallShown = async (shown: boolean) => {
    try {
      await AsyncStorage.setItem(PAYWALL_SHOWN_KEY, shown.toString());
      setHasShownPaywall(shown);
    } catch (error) {
      console.error('Error saving paywall shown status:', error);
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
          'Unlimited flashcards',
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
    hasShownPaywall,
    setHasShownPaywall: savePaywallShown,
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
