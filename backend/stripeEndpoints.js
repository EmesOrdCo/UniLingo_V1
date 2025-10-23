const express = require('express');
const router = express.Router();
const stripeService = require('./stripeService');
// Simple auth middleware for now
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // For now, just pass through - in production you'd verify the JWT
    req.user = {
      id: 'temp-user-id', // This should be extracted from the JWT
      email: 'temp@example.com',
    };

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(401).json({
      error: 'Authentication failed',
    });
  }
};

/**
 * POST /api/stripe/create-payment-intent
 * Create a payment intent for avatar item purchase
 */
router.post('/create-payment-intent', authenticateUser, async (req, res) => {
  try {
    const { itemId, amount } = req.body;
    const userId = req.user.id; // Assuming auth middleware sets req.user

    if (!itemId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: itemId and amount',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be greater than 0',
      });
    }

    const result = await stripeService.createPaymentIntent(userId, itemId, amount);
    
    res.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment intent',
    });
  }
});

/**
 * POST /api/stripe/confirm-payment
 * Confirm payment and unlock avatar item
 */
router.post('/confirm-payment', authenticateUser, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Missing paymentIntentId',
      });
    }

    const result = await stripeService.confirmPayment(paymentIntentId);
    
    res.json({
      success: true,
      message: 'Payment confirmed and item unlocked',
      ...result,
    });
  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({
      error: error.message || 'Failed to confirm payment',
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await stripeService.handleWebhook(req.body, signature);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(400).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/stripe/paid-items
 * Get available paid avatar items
 */
router.get('/paid-items', async (req, res) => {
  try {
    const items = await stripeService.getPaidAvatarItems();
    
    res.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error('❌ Error fetching paid items:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch paid items',
    });
  }
});

/**
 * GET /api/stripe/user-purchases
 * Get user's purchased avatar items
 */
router.get('/user-purchases', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const purchases = await stripeService.getUserPurchasedItems(userId);
    
    res.json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error('❌ Error fetching user purchases:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch user purchases',
    });
  }
});

module.exports = router;
