#!/usr/bin/env node

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

async function translateToLanguage(sentence, targetLanguage) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the given sentence to ${targetLanguage}. Maintain the same tone and style. Return only the translation, no explanations.`
        },
        {
          role: "user",
          content: `Translate this to ${targetLanguage}: "${sentence}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    return response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    console.error(`     Translation error: ${error.message}`);
    return null;
  }
}

async function fillNullsForLanguage(languageName, fieldName) {
  console.log(`\n🔄 Processing ${languageName} translations...`);
  
  // Get all entries with NULL for this language
  const { data, error } = await supabase
    .from('subject_words')
    .select('id, english_translation, example_sentence_english')
    .is(fieldName, null)
    .not('example_sentence_english', 'is', null);
  
  if (error) {
    console.error(`❌ Error fetching ${languageName} entries:`, error);
    return 0;
  }
  
  console.log(`   Found ${data.length} entries missing ${languageName} translation`);
  
  let successful = 0;
  
  for (const entry of data) {
    console.log(`   📝 ID ${entry.id}: "${entry.english_translation}"`);
    
    const translation = await translateToLanguage(entry.example_sentence_english, languageName);
    
    if (translation) {
      const { error: updateError } = await supabase
        .from('subject_words')
        .update({ [fieldName]: translation })
        .eq('id', entry.id);
      
      if (updateError) {
        console.log(`      ❌ Database update failed`);
      } else {
        console.log(`      ✅ "${translation}"`);
        successful++;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
  }
  
  console.log(`   ✅ Successfully filled ${successful}/${data.length} ${languageName} translations`);
  return successful;
}

async function main() {
  console.log('🚀 Filling NULL Translations');
  console.log('============================================================\n');
  
  try {
    const languages = [
      { name: 'French', field: 'example_sentence_french' },
      { name: 'Spanish', field: 'example_sentence_spanish' },
      { name: 'German', field: 'example_sentence_german' },
      { name: 'Hindi', field: 'example_sentence_hindi' },
      { name: 'Chinese (Simplified)', field: 'example_sentence_chinese_simplified' }
    ];
    
    let totalFilled = 0;
    
    for (const lang of languages) {
      const filled = await fillNullsForLanguage(lang.name, lang.field);
      totalFilled += filled;
    }
    
    console.log('\n============================================================');
    console.log(`🎉 Total translations filled: ${totalFilled}`);
    console.log('============================================================\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
