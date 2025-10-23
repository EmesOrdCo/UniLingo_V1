const Stripe = require('stripe');
const { supabase } = require('./supabaseClient');

class StripeService {
  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.warn('⚠️ STRIPE_SECRET_KEY not found in environment variables');
      this.stripe = null;
    } else {
      this.stripe = new Stripe(secretKey);
    }
  }

  /**
   * Create a payment intent for avatar item purchase
   */
  async createPaymentIntent(userId, itemId, amount, currency = 'gbp') {
    try {
      console.log('💳 Creating payment intent:', { userId, itemId, amount, currency });

      // Get item details from database
      const { data: item, error: itemError } = await supabase
        .from('avatar_items')
        .select('*')
        .eq('id', itemId)
        .eq('is_active', true)
        .single();

      if (itemError || !item) {
        throw new Error('Avatar item not found');
      }

      // Check if user already owns this item
      const { data: existingUnlock } = await supabase
        .from('user_avatar_unlocks')
        .select('id')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .single();

      if (existingUnlock) {
        throw new Error('User already owns this item');
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency: currency,
        metadata: {
          userId: userId,
          itemId: itemId,
          itemName: `${item.category}:${item.item_value}`,
          itemRarity: item.rarity,
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never', // Prefer Apple Pay over redirects
        },
      });

      console.log('✅ Payment intent created:', paymentIntent.id);
      console.log('💳 Payment methods available:', paymentIntent.payment_method_types);
      console.log('💳 Automatic payment methods:', paymentIntent.automatic_payment_methods);
      
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment and unlock avatar item
   */
  async confirmPayment(paymentIntentId) {
    try {
      console.log('💳 Confirming payment:', paymentIntentId);

      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment not succeeded. Status: ${paymentIntent.status}`);
      }

      const { userId, itemId } = paymentIntent.metadata;

      if (!userId || !itemId) {
        throw new Error('Missing metadata in payment intent');
      }

      // Unlock the avatar item for the user
      const { error: unlockError } = await supabase
        .from('user_avatar_unlocks')
        .insert({
          user_id: userId,
          item_id: itemId,
          xp_spent: 0, // No XP spent for paid items
          purchased_at: new Date().toISOString(),
          payment_intent_id: paymentIntentId,
        });

      if (unlockError) {
        console.error('❌ Error unlocking item:', unlockError);
        throw new Error('Failed to unlock avatar item');
      }

      console.log('✅ Avatar item unlocked successfully');
      return {
        success: true,
        userId,
        itemId,
        paymentIntentId,
      };
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(rawBody, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log('🔔 Webhook event received:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.confirmPayment(event.data.object.id);
          break;
        case 'payment_intent.payment_failed':
          console.log('❌ Payment failed:', event.data.object.id);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('❌ Webhook error:', error);
      throw error;
    }
  }

  /**
   * Get available paid avatar items
   */
  async getPaidAvatarItems() {
    try {
      const { data: items, error } = await supabase
        .from('avatar_items')
        .select('*')
        .eq('is_active', true)
        .not('price_gbp', 'is', null)
        .order('price_gbp', { ascending: true });

      if (error) {
        throw error;
      }

      return items;
    } catch (error) {
      console.error('❌ Error fetching paid avatar items:', error);
      throw error;
    }
  }

  /**
   * Get user's purchased avatar items
   */
  async getUserPurchasedItems(userId) {
    try {
      const { data: purchases, error } = await supabase
        .from('user_avatar_unlocks')
        .select(`
          *,
          avatar_items (
            id,
            category,
            item_value,
            rarity,
            price_gbp
          )
        `)
        .eq('user_id', userId)
        .not('payment_intent_id', 'is', null);

      if (error) {
        throw error;
      }

      return purchases;
    } catch (error) {
      console.error('❌ Error fetching user purchases:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();
