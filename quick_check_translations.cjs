const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function quickCheck() {
  try {
    console.log('🔍 Quick Check of Keyword Translations\n');
    
    // Get counts for each language using separate queries
    const languages = [
      'english_translation',
      'french_translation', 
      'spanish_translation',
      'german_translation',
      'hindi_translation',
      'mandarin_translation'
    ];
    
    console.log('Checking each translation column...\n');
    
    for (const lang of languages) {
      const { count, error } = await supabase
        .from('subject_words')
        .select('*', { count: 'exact', head: true })
        .not(lang, 'is', null);
      
      if (error) {
        console.error(`❌ Error checking ${lang}:`, error.message);
      } else {
        console.log(`${lang}: ${count} entries filled`);
      }
    }
    
    // Get total count
    const { count: total } = await supabase
      .from('subject_words')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total entries: ${total}`);
    
    // Get a few sample entries
    console.log('\n📝 Sample entries:\n');
    const { data, error } = await supabase
      .from('subject_words')
      .select('id, english_translation, french_translation, spanish_translation, german_translation, subject')
      .limit(3);
    
    if (data) {
      data.forEach(entry => {
        console.log(`ID ${entry.id}: "${entry.english_translation}"`);
        console.log(`  French: ${entry.french_translation || 'NULL'}`);
        console.log(`  Spanish: ${entry.spanish_translation || 'NULL'}`);
        console.log(`  German: ${entry.german_translation || 'NULL'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickCheck();
