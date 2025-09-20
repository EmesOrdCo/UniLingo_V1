// Database Connection Test
// Add this temporarily to test database connectivity

import { supabase } from './supabase';

export const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data: healthCheck, error: healthError } = await supabase
      .from('_health_check')
      .select('*')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Health check failed:', healthError.message);
    } else {
      console.log('✅ Supabase connection working');
    }
    
    // Test 2: Check if users table exists
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
      console.log('❌ Error code:', usersError.code);
      console.log('❌ Error details:', usersError.details);
    } else {
      console.log('✅ Users table accessible');
    }
    
    // Test 3: Check what tables are available
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names'); // This might not exist, but let's try
    
    if (tablesError) {
      console.log('ℹ️ Cannot list tables (expected):', tablesError.message);
    } else {
      console.log('📋 Available tables:', tables);
    }
    
  } catch (error) {
    console.error('💥 Database test failed:', error);
  }
};
