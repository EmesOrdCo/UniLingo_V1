# Stripe Integration Setup Guide for £99 Eyepatch Purchase

## Overview
This guide will help you set up Stripe payments for the eyepatch avatar item at £99. The integration includes both backend and frontend components.

## Prerequisites
- Stripe account (test mode for development)
- Supabase database access
- Node.js and npm installed

## Step 1: Stripe Account Setup

### 1.1 Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete the account setup process
3. Switch to **Test mode** for development

### 1.2 Get API Keys
1. Go to [Stripe Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### 1.3 Set Up Webhook
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set URL to: `https://your-backend-url.com/api/stripe/webhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the **Webhook secret** (starts with `whsec_`)

## Step 2: Environment Configuration

### 2.1 Backend Environment Variables
Add these to your backend `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2.2 Frontend Environment Variables
Add these to your frontend environment:

```bash
# In app.config.js or your environment config
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## Step 3: Database Migration

### 3.1 Run the Migration
Execute the SQL migration file:
```bash
# Connect to your Supabase database and run:
database/migrations/add_payment_support_to_avatar_items.sql
```

### 3.2 Verify Migration
The migration will:
- Add payment fields to `avatar_items` table
- Update eyepatch item to £99 pricing
- Create payment tracking functions
- Set eyepatch as legendary rarity

## Step 4: Install Dependencies

### 4.1 Backend Dependencies
```bash
cd backend
npm install stripe@^14.21.0
```

### 4.2 Frontend Dependencies
```bash
npm install stripe-react-native@^0.37.0
```

## Step 5: Test the Integration

### 5.1 Start the Backend
```bash
cd backend
npm run dev
```

### 5.2 Start the Frontend
```bash
npm start
```

### 5.3 Test Purchase Flow
1. Navigate to Avatar Editor
2. Go to Accessories category
3. Find the eyepatch item (should show £99 price)
4. Tap to purchase
5. Complete test payment with Stripe test card: `4242 4242 4242 4242`

## Step 6: Production Setup

### 6.1 Switch to Live Mode
1. In Stripe Dashboard, switch to **Live mode**
2. Update environment variables with live keys
3. Update webhook URL to production URL
4. Test with real payment methods

### 6.2 Security Considerations
- Never expose secret keys in frontend code
- Use HTTPS for all webhook endpoints
- Validate webhook signatures
- Implement proper error handling

## API Endpoints

The integration provides these endpoints:

- `POST /api/stripe/create-payment-intent` - Create payment intent
- `POST /api/stripe/confirm-payment` - Confirm payment
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `GET /api/stripe/paid-items` - Get available paid items
- `GET /api/stripe/user-purchases` - Get user's purchases

## File Structure

```
backend/
├── stripeService.js          # Stripe payment logic
├── stripeEndpoints.js        # API endpoints
├── middleware/auth.js        # Authentication middleware
└── package.json             # Updated with Stripe dependency

src/
├── lib/
│   ├── stripeService.ts      # Frontend Stripe service
│   └── avatarUnlockService.ts # Updated with payment fields
├── components/
│   ├── PaymentModal.tsx      # Payment UI component
│   └── avatar/
│       └── SubcategoryPage.tsx # Updated with payment flow
└── package.json             # Updated with Stripe dependency

database/migrations/
└── add_payment_support_to_avatar_items.sql # Database migration
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook secret is correct
   - Check Stripe dashboard for webhook logs

2. **Payment intent creation fails**
   - Verify Stripe keys are correct
   - Check user authentication
   - Ensure item exists and is active

3. **Frontend payment modal not showing**
   - Check PaymentModal component is imported
   - Verify item has price_gbp field
   - Check console for errors

### Test Cards

Use these Stripe test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`

## Support

For issues with this integration:
1. Check Stripe Dashboard logs
2. Review backend console logs
3. Check Supabase database logs
4. Verify all environment variables are set correctly

## Next Steps

After successful setup:
1. Test the complete purchase flow
2. Implement additional paid avatar items
3. Add analytics for purchase tracking
4. Consider implementing subscription-based items
5. Add refund functionality if needed
