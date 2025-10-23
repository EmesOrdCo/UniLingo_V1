#!/bin/bash

# Script to apply the avatar payment migration
# This script updates the eyepatch item to be a £99 paid item

echo "🔧 Applying avatar payment migration..."

# The migration SQL is already created in database/migrations/add_payment_support_to_avatar_items.sql
# This script provides instructions for manual application

echo "📋 Migration Instructions:"
echo "1. Connect to your Supabase database"
echo "2. Run the SQL from: database/migrations/add_payment_support_to_avatar_items.sql"
echo "3. This will:"
echo "   - Add payment support fields to avatar_items table"
echo "   - Update the eyepatch item to £99 pricing"
echo "   - Create payment tracking functions"
echo ""
echo "🔑 Key changes:"
echo "- eyepatch item becomes £99 legendary item"
echo "- New fields: price_gbp, is_paid_item, stripe_price_id"
echo "- Payment tracking in user_avatar_unlocks table"
echo ""
echo "✅ After running the migration, the eyepatch will be available as a paid item!"

# Check if we can connect to Supabase
if [ -f ".env" ]; then
    echo "📄 Found .env file - you can use these credentials to connect to your database"
else
    echo "⚠️  No .env file found - you'll need your Supabase credentials"
fi
