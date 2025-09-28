import * as React from 'react';
import { useEffect, useState } from 'react';
import { createBillingClient, Plan } from './BillingClient';
import { useOnboardingStore } from '../onboarding/state';

export interface EntitlementState {
  hasActiveSubscription: boolean;
  selectedPlanId?: Plan['id'];
  loading: boolean;
  error?: string;
}

/**
 * Hook that manages subscription entitlement state
 * Reads entitlement on mount and syncs to Zustand store
 */
export function useEntitlement() {
  const [state, setState] = useState<EntitlementState>({
    hasActiveSubscription: false,
    loading: true,
  });

  const { setField } = useOnboardingStore();

  useEffect(() => {
    const checkEntitlement = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: undefined }));

        const billingClient = createBillingClient();
        const entitlement = await billingClient.getEntitlement();

        setState({
          hasActiveSubscription: entitlement.entitlementActive,
          selectedPlanId: entitlement.planId,
          loading: false,
        });

        // Sync to Zustand store
        setField('hasActiveSubscription', entitlement.entitlementActive);
        if (entitlement.planId) {
          setField('selectedPlanId', entitlement.planId);
        }

        console.log('✅ Entitlement checked:', entitlement);

      } catch (error) {
        console.error('❌ Error checking entitlement:', error);
        setState({
          hasActiveSubscription: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to check entitlement',
        });
      }
    };

    checkEntitlement();
  }, [setField]);

  return state;
}

/**
 * Higher-order component that guards content based on entitlement
 * Redirects to Parent onboarding stack if not entitled
 */
export function withEntitlementGuard<P extends object>(
  Component: React.ComponentType<P>,
  redirectToParent: () => void
) {
  return function EntitlementGuardedComponent(props: P) {
    const { hasActiveSubscription, loading } = useEntitlement();

    useEffect(() => {
      if (!loading && !hasActiveSubscription) {
        console.log('🚫 User not entitled, redirecting to parent onboarding');
        redirectToParent();
      }
    }, [hasActiveSubscription, loading, redirectToParent]);

    if (loading) {
      // You might want to show a loading screen here
      return null;
    }

    if (!hasActiveSubscription) {
      // Component will be unmounted due to redirect, but return null as fallback
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Hook for checking if user has specific plan entitlement
 */
export function usePlanEntitlement(planId: Plan['id']) {
  const { hasActiveSubscription, selectedPlanId } = useEntitlement();
  
  return {
    hasPlan: hasActiveSubscription && selectedPlanId === planId,
    hasAnySubscription: hasActiveSubscription,
    currentPlan: selectedPlanId,
  };
}

/**
 * Utility function to check entitlement without hook
 */
export async function checkEntitlement() {
  try {
    const billingClient = createBillingClient();
    return await billingClient.getEntitlement();
  } catch (error) {
    console.error('❌ Error checking entitlement:', error);
    return { entitlementActive: false };
  }
}

