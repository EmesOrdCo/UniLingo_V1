#!/usr/bin/env node

/**
 * Fill Missing Keyword Translations Script
 * 
 * This script fills in missing keyword translations (not example sentences)
 * for entries that have english_translation but are missing translations in other languages
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config();

const DELAY_BETWEEN_REQUESTS = 1000;

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

/**
 * Translate a keyword to a target language
 */
async function translateKeyword(keyword, targetLanguage) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the given English word or phrase to ${targetLanguage}. Return ONLY the translation, no explanations, no extra text, no quotation marks.`
        },
        {
          role: "user",
          content: `Translate this to ${targetLanguage}: ${keyword}`
        }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    return response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error(`     Translation error: ${error.message}`);
    return null;
  }
}

/**
 * Fill missing keyword translations for a specific language
 */
async function fillKeywordsForLanguage(languageName, fieldName) {
  console.log(`\n🔄 Processing ${languageName} keyword translations...`);
  
  // Get all entries with NULL for this language
  const { data, error } = await supabase
    .from('subject_words')
    .select('id, english_translation, subject')
    .is(fieldName, null)
    .not('english_translation', 'is', null);
  
  if (error) {
    console.error(`❌ Error fetching ${languageName} entries:`, error);
    return 0;
  }
  
  console.log(`   Found ${data.length} entries missing ${languageName} keyword translation`);
  
  if (data.length === 0) {
    console.log(`   ✅ All ${languageName} keywords are complete!`);
    return 0;
  }
  
  let successful = 0;
  
  for (const entry of data) {
    console.log(`   📝 ID ${entry.id}: "${entry.english_translation}"`);
    
    const translation = await translateKeyword(entry.english_translation, languageName);
    
    if (translation) {
      const { error: updateError } = await supabase
        .from('subject_words')
        .update({ [fieldName]: translation })
        .eq('id', entry.id);
      
      if (updateError) {
        console.log(`      ❌ Database update failed`);
      } else {
        console.log(`      ✅ ${languageName}: "${translation}"`);
        successful++;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
  }
  
  console.log(`   ✅ Successfully filled ${successful}/${data.length} ${languageName} keyword translations`);
  return successful;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Filling Missing Keyword Translations');
  console.log('============================================================\n');
  
  try {
    const languages = [
      { name: 'French', field: 'french_translation' },
      { name: 'Spanish', field: 'spanish_translation' },
      { name: 'German', field: 'german_translation' },
      { name: 'Hindi', field: 'hindi_translation' },
      { name: 'Chinese (Simplified)', field: 'chinese_simplified_translation' }
    ];
    
    let totalFilled = 0;
    
    for (const lang of languages) {
      const filled = await fillKeywordsForLanguage(lang.name, lang.field);
      totalFilled += filled;
    }
    
    console.log('\n============================================================');
    console.log(`🎉 Total keyword translations filled: ${totalFilled}`);
    console.log('============================================================\n');
    
    // Run a quick verification
    console.log('🔍 Running verification...\n');
    
    const { count: total } = await supabase
      .from('subject_words')
      .select('*', { count: 'exact', head: true });
    
    for (const lang of languages) {
      const { count } = await supabase
        .from('subject_words')
        .select('*', { count: 'exact', head: true })
        .not(lang.field, 'is', null);
      
      const status = count === total ? '✅' : '⚠️';
      console.log(`${status} ${lang.name}: ${count}/${total} (${((count/total)*100).toFixed(2)}%)`);
    }
    
    console.log('\n✅ Keyword translation process completed!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
