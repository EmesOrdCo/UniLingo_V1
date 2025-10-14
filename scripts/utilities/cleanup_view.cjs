const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function dropView() {
  try {
    console.log('🧹 Cleaning up redundant view...\n');
    
    // Drop the view
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'DROP VIEW IF EXISTS subject_words_with_translations;'
    });
    
    if (error) {
      console.log('⚠️  Could not drop via RPC, you may need to run this SQL manually in Supabase dashboard:');
      console.log('\nDROP VIEW IF EXISTS subject_words_with_translations;\n');
      console.log('Error:', error.message);
    } else {
      console.log('✅ View "subject_words_with_translations" has been dropped successfully!\n');
    }
    
  } catch (error) {
    console.log('⚠️  You need to run this SQL manually in your Supabase SQL Editor:\n');
    console.log('DROP VIEW IF EXISTS subject_words_with_translations;\n');
  }
}

dropView();
