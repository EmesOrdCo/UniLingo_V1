// Note: For now, we'll use a simplified approach without the full Stripe React Native SDK
// In production, you might want to use @stripe/stripe-react-native for native payment sheets
import { supabase } from '../lib/supabase';
import { ENV } from './envConfig';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  paymentIntentId?: string;
}

class StripeService {
  private publishableKey: string;

  constructor() {
    // Get publishable key from environment - this is SAFE to expose
    this.publishableKey = ENV.STRIPE_PUBLISHABLE_KEY || '';
    
    if (!this.publishableKey) {
      console.warn('⚠️ Stripe publishable key not found in environment variables');
    }
  }

  /**
   * Initialize Stripe with publishable key
   */
  async initialize(): Promise<void> {
    try {
      // In a real app, you'd fetch this from your backend
      console.log('🔧 Initializing Stripe...');
    } catch (error) {
      console.error('❌ Failed to initialize Stripe:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for avatar item purchase
   */
  async createPaymentIntent(itemId: string, amount: number): Promise<PaymentIntent> {
    try {
      console.log('💳 Creating payment intent:', { itemId, amount });

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Call backend to create payment intent
      const response = await fetch(`${ENV.BACKEND_URL}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          itemId,
          amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
      };
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment and unlock avatar item
   */
  async confirmPayment(paymentIntentId: string): Promise<PurchaseResult> {
    try {
      console.log('💳 Confirming payment:', paymentIntentId);

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Call backend to confirm payment
      const response = await fetch(`${ENV.BACKEND_URL}/api/stripe/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paymentIntentId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm payment');
      }

      const data = await response.json();
      return {
        success: true,
        paymentIntentId: data.paymentIntentId,
      };
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed',
      };
    }
  }

  /**
   * Get available paid avatar items
   */
  async getPaidAvatarItems(): Promise<any[]> {
    try {
      const response = await fetch(`${ENV.BACKEND_URL}/api/stripe/paid-items`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch paid items');
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('❌ Error fetching paid items:', error);
      return [];
    }
  }

  /**
   * Get user's purchased avatar items
   */
  async getUserPurchasedItems(): Promise<any[]> {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${ENV.BACKEND_URL}/api/stripe/user-purchases`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user purchases');
      }

      const data = await response.json();
      return data.purchases || [];
    } catch (error) {
      console.error('❌ Error fetching user purchases:', error);
      return [];
    }
  }

  /**
   * Process payment using Stripe
   */
  async processPayment(itemId: string, amount: number): Promise<PurchaseResult> {
    try {
      console.log('💳 Processing payment for item:', itemId, 'Amount:', amount);

      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(itemId, amount);

      // In a real implementation, you would use Stripe's payment sheet here
      // For now, we'll simulate the payment process
      console.log('💳 Payment intent created:', paymentIntent.paymentIntentId);

      // Simulate payment confirmation (in real app, this would be handled by Stripe)
      const result = await this.confirmPayment(paymentIntent.paymentIntentId);

      return result;
    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }
}

export const stripeService = new StripeService();
