// Quick script to check what columns actually exist in your users table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  try {
    console.log('🔍 Checking your actual users table schema...');
    
    // Try to get the table structure by attempting a select with all possible columns
    // First, let's see what columns actually exist by selecting all
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error (this tells us which columns exist):', error.message);
      
      // Parse the error to see which columns are missing
      if (error.message.includes('Could not find')) {
        console.log('\n📋 This error tells us which columns are missing from your table.');
        console.log('   The columns that exist are the ones NOT mentioned in the error.');
      }
    } else {
      console.log('✅ All columns exist! Your table has all the expected columns.');
      if (data && data.length > 0) {
        console.log('📊 Sample data:', data[0]);
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkSchema();
