// Billing client interface for handling subscription purchases
export interface BillingClient {
  /**
   * Initialize the billing client
   */
  initialize(): Promise<void>;
  
  /**
   * Get available subscription plans
   */
  getAvailablePlans(): Promise<SubscriptionPlan[]>;
  
  /**
   * Purchase a subscription plan
   */
  purchasePlan(planId: string): Promise<PurchaseResult>;
  
  /**
   * Start a free trial
   */
  startTrial(planId: string): Promise<TrialResult>;
  
  /**
   * Check if user has an active subscription
   */
  hasActiveSubscription(): Promise<boolean>;
  
  /**
   * Get current subscription status
   */
  getSubscriptionStatus(): Promise<SubscriptionStatus | null>;
  
  /**
   * Restore previous purchases
   */
  restorePurchases(): Promise<RestoreResult>;
}

// Subscription plan structure
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  isPopular?: boolean;
  discount?: {
    percentage: number;
    originalPrice: number;
  };
}

// Purchase result
export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  subscription?: SubscriptionStatus;
}

// Trial result
export interface TrialResult {
  success: boolean;
  trialEndDate?: Date;
  error?: string;
}

// Subscription status
export interface SubscriptionStatus {
  isActive: boolean;
  planId: string;
  startDate: Date;
  endDate?: Date;
  isTrial: boolean;
  willRenew: boolean;
}

// Restore result
export interface RestoreResult {
  success: boolean;
  restoredPurchases: number;
  error?: string;
}

// Mock billing client for development and testing
export class MockBillingClient implements BillingClient {
  private isInitialized = false;
  private mockSubscription: SubscriptionStatus | null = null;
  
  async initialize(): Promise<void> {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 500));
    this.isInitialized = true;
    console.log('🔧 MockBillingClient initialized');
  }
  
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    if (!this.isInitialized) {
      throw new Error('Billing client not initialized');
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: 'monthly',
        name: 'Monthly',
        description: 'Full access to all features',
        price: 12.99,
        currency: 'USD',
        period: 'monthly',
        features: [
          'All 14 languages included',
          '100+ lessons from beginner to advanced',
          'Learn on the go with podcasts, audio recap, and more',
          'Cancel anytime',
        ],
      },
      {
        id: 'yearly',
        name: '12 months',
        description: 'Best value - Save 50%',
        price: 7.50,
        currency: 'USD',
        period: 'yearly',
        isPopular: true,
        discount: {
          percentage: 50,
          originalPrice: 179.96,
        },
        features: [
          'All 14 languages included',
          '100+ lessons from beginner to advanced',
          'Learn on the go with podcasts, audio recap, and more',
          'Save 50% compared to monthly',
        ],
      },
      {
        id: 'lifetime',
        name: 'Lifetime',
        description: 'Pay once, learn forever',
        price: 264.99,
        currency: 'USD',
        period: 'lifetime',
        features: [
          'All 14 languages included',
          '100+ lessons from beginner to advanced',
          'Learn on the go with podcasts, audio recap, and more',
          'One-time payment, lifetime access',
        ],
      },
    ];
  }
  
  async purchasePlan(planId: string): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      throw new Error('Billing client not initialized');
    }
    
    // Simulate purchase process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate random success/failure for testing
    const success = Math.random() > 0.1; // 90% success rate
    
    if (!success) {
      return {
        success: false,
        error: 'Purchase failed. Please try again.',
      };
    }
    
    // Create mock subscription
    const now = new Date();
    let endDate: Date | undefined;
    
    switch (planId) {
      case 'monthly':
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      case 'lifetime':
        // Lifetime subscriptions don't have an end date
        endDate = undefined;
        break;
    }
    
    this.mockSubscription = {
      isActive: true,
      planId,
      startDate: now,
      endDate,
      isTrial: false,
      willRenew: planId !== 'lifetime',
    };
    
    return {
      success: true,
      transactionId: `mock_txn_${Date.now()}`,
      subscription: this.mockSubscription,
    };
  }
  
  async startTrial(planId: string): Promise<TrialResult> {
    if (!this.isInitialized) {
      throw new Error('Billing client not initialized');
    }
    
    // Simulate trial start process
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    this.mockSubscription = {
      isActive: true,
      planId,
      startDate: now,
      endDate: trialEndDate,
      isTrial: true,
      willRenew: true,
    };
    
    return {
      success: true,
      trialEndDate,
    };
  }
  
  async hasActiveSubscription(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Billing client not initialized');
    }
    
    if (!this.mockSubscription) {
      return false;
    }
    
    // Check if subscription is still active
    if (this.mockSubscription.endDate && this.mockSubscription.endDate < new Date()) {
      this.mockSubscription.isActive = false;
      return false;
    }
    
    return this.mockSubscription.isActive;
  }
  
  async getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    if (!this.isInitialized) {
      throw new Error('Billing client not initialized');
    }
    
    return this.mockSubscription;
  }
  
  async restorePurchases(): Promise<RestoreResult> {
    if (!this.isInitialized) {
      throw new Error('Billing client not initialized');
    }
    
    // Simulate restore process
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // In a real implementation, this would check the app store for previous purchases
    // For mock, we'll just return the current subscription if it exists
    const hasSubscription = this.mockSubscription !== null;
    
    return {
      success: true,
      restoredPurchases: hasSubscription ? 1 : 0,
    };
  }
}

// Create a singleton instance
export const mockBillingClient = new MockBillingClient();

// Export the mock as the default billing client for now
export const billingClient: BillingClient = mockBillingClient;

