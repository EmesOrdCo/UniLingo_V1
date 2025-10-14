#!/usr/bin/env node

/**
 * Fill Missing Translations Script
 * 
 * This script fills in missing translation fields for entries that already have English example sentences
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config();

// Configuration
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 2000;
const DELAY_BETWEEN_REQUESTS = 1000;

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error('❌ Missing OpenAI API key in .env file');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

/**
 * Translate a sentence to a target language
 */
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
    if (error.status === 429) {
      throw new Error(`429 Rate limit reached for gpt-4o-mini in organization ${error.headers?.['x-organization'] || 'unknown'} on requests per day (RPD): Limit 10000, Used 10000, Requested 1. Please try again in 8.64s. Visit https://platform.openai.com/account/rate-limits to learn more.`);
    }
    throw error;
  }
}

/**
 * Get entries with missing translations
 */
async function getEntriesNeedingTranslations() {
  try {
    // Fetch all entries (Supabase defaults to 1000, so we need to specify a higher limit)
    const { data, error } = await supabase
      .from('subject_words')
      .select('id, english_translation, subject, example_sentence_english, example_sentence_french, example_sentence_spanish, example_sentence_german, example_sentence_hindi, example_sentence_mandarin')
      .not('example_sentence_english', 'is', null)
      .order('id')
      .limit(10000);

    if (error) {
      throw error;
    }

    // Filter entries that are missing at least one translation
    // Check for null, undefined, empty string, and strings with only whitespace
    const incomplete = data.filter(entry => 
      !entry.example_sentence_french || (typeof entry.example_sentence_french === 'string' && entry.example_sentence_french.trim() === '') ||
      !entry.example_sentence_spanish || (typeof entry.example_sentence_spanish === 'string' && entry.example_sentence_spanish.trim() === '') ||
      !entry.example_sentence_german || (typeof entry.example_sentence_german === 'string' && entry.example_sentence_german.trim() === '') ||
      !entry.example_sentence_hindi || (typeof entry.example_sentence_hindi === 'string' && entry.example_sentence_hindi.trim() === '') ||
      !entry.example_sentence_mandarin || (typeof entry.example_sentence_mandarin === 'string' && entry.example_sentence_mandarin.trim() === '')
    );

    return incomplete;
  } catch (error) {
    console.error('❌ Error fetching entries:', error.message);
    throw error;
  }
}

/**
 * Process a single entry to fill missing translations
 */
async function processEntry(entry) {
  console.log(`\n📝 Processing: "${entry.english_translation}" (ID: ${entry.id})`);
  
  const updates = {};
  const missingLanguages = [];
  
  // Check which translations are missing (null, undefined, or empty string)
  if (!entry.example_sentence_french || (typeof entry.example_sentence_french === 'string' && entry.example_sentence_french.trim() === '')) missingLanguages.push({ name: 'French', field: 'example_sentence_french' });
  if (!entry.example_sentence_spanish || (typeof entry.example_sentence_spanish === 'string' && entry.example_sentence_spanish.trim() === '')) missingLanguages.push({ name: 'Spanish', field: 'example_sentence_spanish' });
  if (!entry.example_sentence_german || (typeof entry.example_sentence_german === 'string' && entry.example_sentence_german.trim() === '')) missingLanguages.push({ name: 'German', field: 'example_sentence_german' });
  if (!entry.example_sentence_hindi || (typeof entry.example_sentence_hindi === 'string' && entry.example_sentence_hindi.trim() === '')) missingLanguages.push({ name: 'Hindi', field: 'example_sentence_hindi' });
  if (!entry.example_sentence_mandarin || (typeof entry.example_sentence_mandarin === 'string' && entry.example_sentence_mandarin.trim() === '')) missingLanguages.push({ name: 'Mandarin', field: 'example_sentence_mandarin' });
  
  console.log(`   Missing: ${missingLanguages.map(l => l.name).join(', ')}`);
  console.log(`   English: "${entry.example_sentence_english}"`);
  
  // Translate to each missing language
  for (const lang of missingLanguages) {
    try {
      const translation = await translateToLanguage(entry.example_sentence_english, lang.name);
      updates[lang.field] = translation;
      console.log(`   ✅ ${lang.name}: "${translation}"`);
      
      // Add delay between translations
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    } catch (error) {
      console.log(`   ❌ ${lang.name}: Translation failed - ${error.message}`);
    }
  }
  
  // Update database if we have any translations
  if (Object.keys(updates).length > 0) {
    try {
      const { error } = await supabase
        .from('subject_words')
        .update(updates)
        .eq('id', entry.id);
      
      if (error) {
        console.log(`   ❌ Database update failed`);
        return { success: false, word: entry.english_translation, error: 'Database update failed' };
      }
      
      console.log(`   ✅ Database updated successfully (${Object.keys(updates).length} translations added)`);
      return { success: true, word: entry.english_translation };
    } catch (error) {
      console.log(`   ❌ Database error: ${error.message}`);
      return { success: false, word: entry.english_translation, error: error.message };
    }
  } else {
    console.log(`   ⚠️  No translations were successful`);
    return { success: false, word: entry.english_translation, error: 'No successful translations' };
  }
}

/**
 * Process entries in batches
 */
async function processBatch(entries, batchNumber, totalBatches) {
  console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (${entries.length} entries)`);
  
  const results = [];
  
  for (const entry of entries) {
    const result = await processEntry(entry);
    results.push(result);
  }
  
  return results;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Missing Translation Fill Process');
  console.log('============================================================\n');
  
  try {
    // Get entries needing translations
    console.log('📋 Fetching entries with missing translations...');
    const entries = await getEntriesNeedingTranslations();
    
    if (entries.length === 0) {
      console.log('✅ All entries have complete translations!');
      return;
    }
    
    console.log(`📊 Found ${entries.length} entries with missing translations\n`);
    
    // Process in batches
    const totalBatches = Math.ceil(entries.length / BATCH_SIZE);
    const allResults = [];
    
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      const batchResults = await processBatch(batch, batchNumber, totalBatches);
      allResults.push(...batchResults);
      
      // Delay between batches
      if (i + BATCH_SIZE < entries.length) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    // Summary
    const successful = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;
    
    console.log('\n============================================================');
    console.log('📈 PROCESSING SUMMARY');
    console.log('============================================================');
    console.log(`✅ Successfully processed: ${successful} entries`);
    console.log(`❌ Failed: ${failed} entries`);
    
    if (failed > 0) {
      console.log('\n❌ Failed entries:');
      allResults.filter(r => !r.success).forEach(result => {
        console.log(`   - "${result.word}": ${result.error}`);
      });
    }
    
    console.log('\n🎉 Translation fill process completed!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
