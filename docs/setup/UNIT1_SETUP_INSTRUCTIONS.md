# Unit 1 Database Setup Instructions

## Problem Identified
The Unit 1 functionality is not working because the `general_english_vocab` table is missing from your Supabase database. This table is required for the Unit 1 vocabulary exercises (Words, Listen, Write).

## Solution
You need to run the SQL schema file to create the missing table and populate it with vocabulary data.

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `general_english_vocab_schema.sql`
4. Click "Run" to execute the SQL

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset
# Then run the SQL file
psql -h your-db-host -U postgres -d postgres -f general_english_vocab_schema.sql
```

## What the SQL Does
1. **Creates the `general_english_vocab` table** with all necessary columns:
   - `english_term`: The English word/phrase
   - `definition`: Definition of the word
   - `example_sentence`: Example sentence using the word
   - `sfi_rank`: Difficulty ranking (1-20 for basic_actions)
   - `cefr_level`: European language level (A1-C2)
   - `topic_group`: Category (basic_actions, general, etc.)
   - Translation fields for Spanish and German
   - Additional example sentences

2. **Populates the table** with 20 basic action words for Unit 1:
   - walk, run, sit, stand, eat, drink, sleep, wake, read, write
   - listen, speak, look, see, hear, touch, feel, think, know, learn

3. **Sets up proper permissions** so the app can read the vocabulary data

## Verification
After running the SQL, you can verify it worked by:
1. Going to the Table Editor in Supabase
2. Looking for the `general_english_vocab` table
3. Checking that it has 26 rows (20 basic_actions + 6 general)

## Testing Unit 1
Once the table is created and populated:
1. Restart your Expo app
2. Go to the Dashboard
3. Try clicking on Unit 1 exercises (Words, Listen, Write)
4. They should now load vocabulary and work properly

## Troubleshooting
If you still have issues:
1. Check the Supabase logs for any SQL errors
2. Verify the table was created correctly
3. Check that your Supabase connection is working
4. Look at the console logs in your app for any error messages

The Unit 1 functionality should work perfectly once this database table is set up!
