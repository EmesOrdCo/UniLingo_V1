// Check database triggers and RLS policies
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL, 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabaseIssues() {
  console.log('🔍 Checking database configuration...');
  
  try {
    // Test 1: Check if we can create a user via auth
    console.log('📝 Testing user creation via auth...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    console.log(`   Using test email: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: { shouldCreateUser: true }
    });
    
    if (error) {
      console.log('❌ Auth signup error:', error.message);
      console.log('   Error details:', error);
      
      // Check if it's a database trigger issue
      if (error.message.includes('Database error')) {
        console.log('\n🔧 This looks like a database trigger or RLS policy issue.');
        console.log('   Possible causes:');
        console.log('   1. Missing database trigger to create user profile');
        console.log('   2. RLS policy blocking user creation');
        console.log('   3. Missing columns in users table');
        console.log('   4. Trigger trying to insert into non-existent table');
      }
    } else {
      console.log('✅ Auth signup successful!');
      console.log('   Data:', data);
    }
    
    // Test 2: Check if we can manually insert into users table
    console.log('\n📝 Testing manual user insert...');
    
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        native_language: 'English',
        target_language: 'Spanish',
        level: 'beginner',
        reminders_opt_in: true,
        time_commit: '15 min/day',
        how_did_you_hear: 'App Store',
        payment_tier: 'free'
      });
    
    if (insertError) {
      console.log('❌ Manual insert error:', insertError.message);
      console.log('   This suggests RLS policies are blocking the insert');
    } else {
      console.log('✅ Manual insert successful!');
      
      // Clean up
      await supabase
        .from('users')
        .delete()
        .eq('id', testUserId);
    }
    
    console.log('\n📋 Recommended fixes:');
    console.log('1. Check Supabase dashboard → Database → Functions for triggers');
    console.log('2. Verify RLS policies allow user creation');
    console.log('3. Ensure all required columns exist in users table');
    console.log('4. Check if there are any database functions that might be failing');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseIssues();
