import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Check if subject_words table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'subject_words');

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('❌ subject_words table does not exist');
      console.log('💡 Please run create_subject_words_table.sql first');
      return;
    }

    console.log('✅ subject_words table exists');

    // Check columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'subject_words')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return;
    }

    console.log('📋 Available columns:');
    columns.forEach(col => console.log(`  - ${col.column_name}`));

    // Check if we have any data
    const { data: words, error: wordsError, count } = await supabase
      .from('subject_words')
      .select('*', { count: 'exact' })
      .limit(5);

    if (wordsError) {
      console.error('❌ Error fetching words:', wordsError);
      return;
    }

    console.log(`\n📚 Found ${count} words in the table`);
    if (words && words.length > 0) {
      console.log('📝 Sample words:');
      words.forEach(word => {
        console.log(`  - "${word.word_phrase}" (${word.subject})`);
      });
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

testConnection();
