# UniLingo Onboarding Database Setup

This guide will help you set up the Supabase database schema to support the onboarding flow.

## Prerequisites

1. You have a Supabase project set up
2. You have access to the Supabase dashboard
3. Your app is already connected to Supabase (credentials in `src/lib/supabase.ts`)

## Database Setup Steps

### 1. Run the SQL Schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase_onboarding_schema.sql`
4. Click "Run" to execute the schema

This will create:
- Updated `users` table with onboarding fields
- `subscription_plans` table
- `user_subscriptions` table  
- `onboarding_progress` table
- Row Level Security (RLS) policies
- Helper functions and views

### 2. Verify the Setup

After running the SQL, you can verify the setup by:

1. Going to the Table Editor in Supabase
2. Check that the `users` table has the new columns:
   - `native_language`
   - `target_language` 
   - `proficiency_level`
   - `wants_notifications`
   - `discovery_source`
   - `selected_plan_id`
   - `has_active_subscription`

3. Check that these new tables exist:
   - `subscription_plans`
   - `user_subscriptions`
   - `onboarding_progress`

### 3. Test the Integration

1. Run your app
2. Go through the onboarding flow
3. Check the Supabase dashboard to see if data is being saved correctly

## What the Onboarding Flow Collects

The onboarding flow now collects and saves:

- **Personal Info**: First name, email, password
- **Language Preferences**: Native language, target language (with search)
- **Learning Level**: Proficiency level (Beginner/Intermediate/Advanced)
- **Time Commitment**: Daily study time preference
- **Notifications**: Whether user wants notifications
- **Discovery Source**: How they found the app
- **Subscription Plan**: Selected plan (free/premium)

## Database Schema Overview

### Users Table
- Stores all user profile information
- Includes both new onboarding fields and legacy fields for backward compatibility
- Has automatic timestamp updates

### Subscription Plans Table
- Pre-defined subscription plans (free, premium)
- Includes pricing and features

### User Subscriptions Table
- Links users to their subscription plans
- Tracks subscription status and dates

### Onboarding Progress Table
- Tracks completion of individual onboarding steps
- Stores step data for analytics

## Security

- Row Level Security (RLS) is enabled
- Users can only access their own data
- All tables have appropriate policies

## Troubleshooting

### Common Issues

1. **"Table doesn't exist" errors**
   - Make sure you ran the SQL schema in Supabase
   - Check that the table names match exactly

2. **"Permission denied" errors**
   - RLS policies might be blocking access
   - Check that the user is authenticated
   - Verify RLS policies are set up correctly

3. **"Column doesn't exist" errors**
   - The users table might not have been updated
   - Re-run the SQL schema to add missing columns

### Debug Steps

1. Check the Supabase logs in the dashboard
2. Use the `UserProfileService.debugTableStructure()` method
3. Verify your Supabase credentials in `src/lib/supabase.ts`

## Next Steps

After setting up the database:

1. Test the complete onboarding flow
2. Verify data is being saved correctly
3. Set up any additional features (subscriptions, analytics, etc.)
4. Consider adding data validation and error handling

## Support

If you encounter issues:
1. Check the Supabase dashboard logs
2. Verify your database schema matches the SQL file
3. Test with a simple user creation first
4. Check the browser/app console for error messages
