import AsyncStorage from '@react-native-async-storage/async-storage';

export type Plan = {
  id: 'monthly' | 'annual' | 'lifetime';
  title: string;
  priceText: string;
  subText?: string;
  badge?: string;
  trial?: { days: number } | null;
  isSubscription: boolean;
  priceAmount?: number;
  currency?: string;
};

export type PurchaseResult = 
  | { ok: true; entitlementActive: boolean; planId: Plan['id']; transactionId: string }
  | { ok: false; code: 'CANCELLED' | 'FAILED' | 'DEFERRED'; message?: string };

export interface BillingClient {
  getAvailablePlans(): Promise<Plan[]>;
  purchase(planId: Plan['id']): Promise<PurchaseResult>;
  restorePurchases(): Promise<{ entitlementActive: boolean }>;
  getEntitlement(): Promise<{ entitlementActive: boolean; planId?: Plan['id'] }>;
}

class MockBillingClient implements BillingClient {
  private readonly ENTITLEMENT_KEY = 'billing:entitlement';

  async getAvailablePlans(): Promise<Plan[]> {
    return [
      {
        id: 'monthly',
        title: '1 month',
        priceText: '$14.99 per month',
        subText: 'Billed monthly',
        trial: { days: 7 },
        isSubscription: true,
        priceAmount: 14.99,
        currency: 'USD',
      },
      {
        id: 'annual',
        title: '12 months',
        priceText: '£7.50 per month',
        subText: '£89.99 charged every 12 months',
        badge: 'SAVE 50%',
        trial: { days: 7 },
        isSubscription: true,
        priceAmount: 89.99,
        currency: 'GBP',
      },
      {
        id: 'lifetime',
        title: 'Lifetime',
        priceText: '£264.99',
        subText: 'Pay once, learn forever',
        isSubscription: false,
        priceAmount: 264.99,
        currency: 'GBP',
      },
    ];
  }

  async purchase(planId: Plan['id']): Promise<PurchaseResult> {
    // Simulate purchase delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Store entitlement in AsyncStorage
      const entitlement = {
        entitlementActive: true,
        planId,
        transactionId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purchaseDate: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.ENTITLEMENT_KEY, JSON.stringify(entitlement));

      return {
        ok: true,
        entitlementActive: true,
        planId,
        transactionId: entitlement.transactionId,
      };
    } catch (error) {
      console.error('Mock purchase failed:', error);
      return {
        ok: false,
        code: 'FAILED',
        message: 'Failed to complete purchase',
      };
    }
  }

  async restorePurchases(): Promise<{ entitlementActive: boolean }> {
    try {
      const entitlementStr = await AsyncStorage.getItem(this.ENTITLEMENT_KEY);
      if (entitlementStr) {
        const entitlement = JSON.parse(entitlementStr);
        return { entitlementActive: entitlement.entitlementActive || false };
      }
      return { entitlementActive: false };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return { entitlementActive: false };
    }
  }

  async getEntitlement(): Promise<{ entitlementActive: boolean; planId?: Plan['id'] }> {
    try {
      const entitlementStr = await AsyncStorage.getItem(this.ENTITLEMENT_KEY);
      if (entitlementStr) {
        const entitlement = JSON.parse(entitlementStr);
        return {
          entitlementActive: entitlement.entitlementActive || false,
          planId: entitlement.planId,
        };
      }
      return { entitlementActive: false };
    } catch (error) {
      console.error('Failed to get entitlement:', error);
      return { entitlementActive: false };
    }
  }
}

export function createBillingClient(): BillingClient {
  return new MockBillingClient();
}

