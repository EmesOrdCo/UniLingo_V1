# Stripe Keys Location Guide

## 🔑 Finding Your Stripe Keys

### 1. Publishable Key & Secret Key
1. Go to: https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key**: `pk_test_51...` (use in frontend)
   - **Secret key**: `sk_test_51...` (use in backend)

### 2. Webhook Secret
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Set URL: `https://your-backend-url.com/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click "Add endpoint"
6. Click on your new webhook
7. Copy the "Signing secret": `whsec_...`

## 📝 Quick Copy Template

### Frontend (.env):
```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### Backend (backend/.env):
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY_HERE
```

## ⚠️ Important Notes

- **Test Mode**: Make sure you're in TEST mode (not LIVE mode)
- **Key Format**: 
  - Publishable: `pk_test_51...`
  - Secret: `sk_test_51...`
  - Webhook: `whsec_...`
- **Security**: Never put secret keys in frontend code!
- **Webhook URL**: Update the webhook URL when you deploy to production
