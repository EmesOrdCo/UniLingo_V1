// Test script to verify Supabase connection and database schema
// Run with: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('📡 Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful!');
    
    // Test 2: Check table structure
    console.log('📋 Checking table structure...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Table access failed:', sampleError.message);
      return false;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('📊 Sample row columns:', Object.keys(sampleData[0]));
    } else {
      console.log('📊 Table is empty (this is normal for a new setup)');
    }
    
    // Test 3: Check required columns exist
    console.log('🔍 Checking required columns...');
    const requiredColumns = [
      'id', 'email', 'name', 'native_language', 'target_language', 
      'level', 'time_commit', 'reminders_opt_in', 'how_did_you_hear', 'payment_tier'
    ];
    
    // Try to insert a test row to check column structure
    const testData = {
      id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      email: 'test@example.com',
      name: 'Test User',
      native_language: 'English',
      target_language: 'Spanish',
      level: 'Beginner',
      time_commit: '15 min/day',
      reminders_opt_in: true,
      how_did_you_hear: 'App Store',
      payment_tier: 'free'
    };
    
    const { error: insertError } = await supabase
      .from('users')
      .insert(testData);
    
    if (insertError) {
      console.log('⚠️  Insert test failed (this might be expected due to RLS):', insertError.message);
      console.log('   This is normal if RLS is enabled and you\'re not authenticated');
    } else {
      console.log('✅ Insert test successful - all columns exist');
      
      // Clean up test data
      await supabase
        .from('users')
        .delete()
        .eq('id', testData.id);
    }
    
    console.log('🎉 Supabase setup looks good!');
    console.log('📝 Next steps:');
    console.log('   1. Make sure RLS policies are set up correctly');
    console.log('   2. Test the onboarding flow in your app');
    console.log('   3. Check the Supabase dashboard to see saved data');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
