#!/usr/bin/env node

/**
 * Script to populate Chinese Traditional translations in the subject_words table
 * Uses OpenAI API to translate English translations and example sentences
 * 
 * Usage: node populate_chinese_traditional_translations.js [--dry-run] [--limit N]
 * 
 * Options:
 *   --dry-run    Show what would be translated without making changes
 *   --limit N    Limit the number of records to process (for testing)
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  },
  openai: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY
  }
};

// Initialize clients
const supabase = createClient(config.supabase.url, config.supabase.key);
const openai = new OpenAI({ apiKey: config.openai.apiKey });

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

/**
 * Translate text to Chinese Traditional using OpenAI
 */
async function translateToChineseTraditional(text) {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the given English text to Chinese Traditional (繁體中文). Return only the translation, no explanations or additional text.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error translating "${text}":`, error.message);
    return null;
  }
}

/**
 * Get records that need Chinese Traditional translations
 */
async function getRecordsToTranslate() {
  const query = supabase
    .from('subject_words')
    .select('id, english_translation, example_sentence_english, "chinese(traditional)_translation", "example_sentence_chinese(traditional)"')
    .not('english_translation', 'is', null)
    .is('"chinese(traditional)_translation"', null);

  if (limit) {
    query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching records: ${error.message}`);
  }

  return data || [];
}

/**
 * Update a record with Chinese Traditional translations
 */
async function updateRecord(id, chineseTranslation, chineseExample) {
  // Try using the standard Supabase update with the exact column names
  const updates = {};
  
  if (chineseTranslation) {
    updates['chinese(traditional)_translation'] = chineseTranslation;
  }
  
  if (chineseExample) {
    updates['example_sentence_chinese(traditional)'] = chineseExample;
  }

  const { error } = await supabase
    .from('subject_words')
    .update(updates)
    .eq('id', id);

  if (error) {
    throw new Error(`Error updating record ${id}: ${error.message}`);
  }
}

/**
 * Process a single record
 */
async function processRecord(record) {
  console.log(`\nProcessing record ID: ${record.id}`);
  
  let chineseTranslation = null;
  let chineseExample = null;
  
  // Translate the main translation if it exists and hasn't been translated yet
  if (record.english_translation && !record['"chinese(traditional)_translation"']) {
    console.log(`  Translating: "${record.english_translation}"`);
    chineseTranslation = await translateToChineseTraditional(record.english_translation);
    if (chineseTranslation) {
      console.log(`  → "${chineseTranslation}"`);
    }
  }
  
  // Translate the example sentence if it exists and hasn't been translated yet
  if (record.example_sentence_english && !record['"example_sentence_chinese(traditional)"']) {
    console.log(`  Translating example: "${record.example_sentence_english}"`);
    chineseExample = await translateToChineseTraditional(record.example_sentence_english);
    if (chineseExample) {
      console.log(`  → "${chineseExample}"`);
    }
  }
  
  // Update the record if we have translations and it's not a dry run
  if ((chineseTranslation || chineseExample) && !isDryRun) {
    await updateRecord(record.id, chineseTranslation, chineseExample);
    console.log(`  ✓ Updated record ${record.id}`);
  } else if (isDryRun) {
    console.log(`  [DRY RUN] Would update record ${record.id}`);
  }
  
  // Add a small delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting Chinese Traditional translation population...');
    console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
    if (limit) {
      console.log(`Limit: ${limit} records`);
    }
    
    // Validate configuration
    if (!config.supabase.url || !config.supabase.key) {
      throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }
    
    if (!config.openai.apiKey) {
      throw new Error('Missing OpenAI API key. Please check OPENAI_API_KEY environment variable.');
    }
    
    // Get records to process
    console.log('\n📋 Fetching records to translate...');
    const records = await getRecordsToTranslate();
    console.log(`Found ${records.length} records to process`);
    
    if (records.length === 0) {
      console.log('✅ No records need translation. All done!');
      return;
    }
    
    // Process each record
    let processed = 0;
    let errors = 0;
    
    for (const record of records) {
      try {
        await processRecord(record);
        processed++;
      } catch (error) {
        console.error(`❌ Error processing record ${record.id}:`, error.message);
        errors++;
      }
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Records processed: ${processed}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Mode: ${isDryRun ? 'DRY RUN (no changes made)' : 'LIVE (changes applied)'}`);
    
    if (!isDryRun && processed > 0) {
      console.log('\n✅ Chinese Traditional translations have been populated successfully!');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted. Exiting gracefully...');
  process.exit(0);
});

// Run the script
main();

export {
  translateToChineseTraditional,
  getRecordsToTranslate,
  updateRecord,
  processRecord
};
