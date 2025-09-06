// Database schema fix script
// This script will add missing columns to the users table

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL, 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema...');
  
  try {
    // List of columns that might be missing
    const missingColumns = [
      {
        name: 'reminders_opt_in',
        type: 'BOOLEAN DEFAULT false',
        description: 'Notification preferences'
      },
      {
        name: 'time_commit',
        type: 'VARCHAR(50)',
        description: 'Time commitment preference'
      },
      {
        name: 'how_did_you_hear',
        type: 'VARCHAR(100)',
        description: 'Discovery source'
      },
      {
        name: 'payment_tier',
        type: 'VARCHAR(50)',
        description: 'Selected payment tier'
      },
      {
        name: 'aim',
        type: 'TEXT',
        description: 'User learning aim'
      }
    ];

    console.log('📋 Checking for missing columns...');
    
    for (const column of missingColumns) {
      try {
        // Try to insert a test value to see if column exists
        const testData = { [column.name]: column.type.includes('BOOLEAN') ? true : 'test' };
        
        const { error } = await supabase
          .from('users')
          .select(column.name)
          .limit(1);
        
        if (error && error.message.includes('Could not find the')) {
          console.log(`❌ Missing column: ${column.name}`);
          console.log(`   Description: ${column.description}`);
          console.log(`   Type: ${column.type}`);
        } else {
          console.log(`✅ Column exists: ${column.name}`);
        }
      } catch (err) {
        console.log(`❌ Error checking ${column.name}:`, err.message);
      }
    }
    
    console.log('\n📝 To fix missing columns, run this SQL in your Supabase dashboard:');
    console.log('-- Add missing columns to users table');
    
    for (const column of missingColumns) {
      console.log(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`);
    }
    
    console.log('\n🔍 Or run the complete schema from supabase_onboarding_schema.sql');
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
  }
}

fixDatabaseSchema();
