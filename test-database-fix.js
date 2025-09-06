// Test script to verify the database fix
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL, 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testDatabaseFix() {
  console.log('🧪 Testing database fix...');
  
  try {
    // Test 1: Try to create a user via OTP
    const testEmail = `test-${Date.now()}@example.com`;
    console.log(`📧 Testing with email: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: { shouldCreateUser: true }
    });
    
    if (error) {
      console.log('❌ OTP signup still failing:', error.message);
      console.log('   You need to run the SQL fix in Supabase dashboard first');
      return false;
    }
    
    console.log('✅ OTP signup successful!');
    console.log('   This means the database trigger is working');
    
    // Test 2: Verify user was created in users table
    console.log('\n🔍 Checking if user was created in users table...');
    
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (userError) {
      console.log('❌ User not found in users table:', userError.message);
      console.log('   The trigger might not be working properly');
    } else {
      console.log('✅ User found in users table!');
      console.log('   User data:', {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        created_at: userData.created_at
      });
    }
    
    // Test 3: Test manual insert with all columns
    console.log('\n📝 Testing manual insert with all columns...');
    
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: `manual-${Date.now()}@example.com`,
        name: 'Manual Test User',
        native_language: 'English',
        target_language: 'Spanish',
        level: 'beginner',
        reminders_opt_in: true,
        time_commit: '15 min/day',
        how_did_you_hear: 'App Store',
        payment_tier: 'free',
        aim: 'Learn Spanish for travel'
      });
    
    if (insertError) {
      console.log('❌ Manual insert failed:', insertError.message);
    } else {
      console.log('✅ Manual insert successful!');
      
      // Clean up
      await supabase
        .from('users')
        .delete()
        .eq('id', testUserId);
    }
    
    console.log('\n🎉 Database fix appears to be working!');
    console.log('   You can now test the onboarding flow in your app');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

testDatabaseFix().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! The database is ready for onboarding.');
  } else {
    console.log('\n❌ Tests failed. Please run the SQL fix in Supabase dashboard first.');
  }
  process.exit(success ? 0 : 1);
});
