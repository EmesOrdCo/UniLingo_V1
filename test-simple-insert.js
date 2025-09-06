// Test script to verify the simplified insert works
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testSimpleInsert() {
  try {
    console.log('🧪 Testing simplified insert...');
    
    // Test data with only the fields we know exist
    const testData = {
      id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      email: 'test@example.com',
      name: 'Test User',
      native_language: 'English',
      target_language: 'Spanish',
      subjects: ['Spanish'],
      level: 'beginner',
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    };
    
    console.log('📝 Test data:', testData);
    
    const { data, error } = await supabase
      .from('users')
      .insert(testData);
    
    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('   This tells us which columns are missing or have issues');
    } else {
      console.log('✅ Insert successful!');
      console.log('📊 Inserted data:', data);
      
      // Clean up test data
      await supabase
        .from('users')
        .delete()
        .eq('id', testData.id);
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testSimpleInsert();
