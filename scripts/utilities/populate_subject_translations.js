#!/usr/bin/env node

/**
 * Script to populate lesson subject translations in the subject_words table
 * Uses OpenAI API to translate lesson subjects (like "Asking for the Meaning", "Saying Hello", etc.) into all supported languages
 * 
 * Usage: node populate_subject_translations.js [--dry-run] [--limit N]
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

// Language configurations
const languages = [
  { code: 'french', column: 'subject_french', name: 'French' },
  { code: 'spanish', column: 'subject_spanish', name: 'Spanish' },
  { code: 'german', column: 'subject_german', name: 'German' },
  { code: 'chinese_simplified', column: 'subject_chinese_simplified', name: 'Chinese Simplified' },
  { code: 'hindi', column: 'subject_hindi', name: 'Hindi' },
  { code: 'italian', column: 'subject_italian', name: 'Italian' },
  { code: 'cantonese', column: 'subject_cantonese', name: 'Cantonese' },
  { code: 'chinese_traditional', column: 'subject_chinese_traditional', name: 'Chinese Traditional' }
];

/**
 * Translate lesson subject to a specific language using OpenAI
 */
async function translateSubject(subject, targetLanguage) {
  if (!subject || subject.trim() === '') {
    return '';
  }

  const languageInstructions = {
    'french': 'Translate the following English lesson subject/topic to French. This is a conversational topic title (like "Saying Hello", "Asking for the Meaning"). Use natural, conversational French.',
    'spanish': 'Translate the following English lesson subject/topic to Spanish. This is a conversational topic title (like "Saying Hello", "Asking for the Meaning"). Use natural, conversational Spanish.',
    'german': 'Translate the following English lesson subject/topic to German. This is a conversational topic title (like "Saying Hello", "Asking for the Meaning"). Use natural, conversational German.',
    'chinese_simplified': 'Translate the following English lesson subject/topic to Chinese Simplified. This is a conversational topic title (like "Saying Hello", "Asking for the Meaning"). Use natural, conversational Chinese.',
    'hindi': 'Translate the following English lesson subject/topic to Hindi. This is a conversational topic title (like "Saying Hello", "Asking for the Meaning"). Use natural, conversational Hindi.',
    'italian': 'Translate the following English lesson subject/topic to Italian. This is a conversational topic title (like "Saying Hello", "Asking for the Meaning"). Use natural, conversational Italian.',
    'cantonese': 'Translate the following English lesson subject/topic to Cantonese. This is a conversational topic title (like "Saying Hello", "Asking for the Meaning"). Use traditional Chinese characters but with Cantonese pronunciation and grammar.',
    'chinese_traditional': 'Translate the following English lesson subject/topic to Chinese Traditional. This is a conversational topic title (like "Saying Hello", "Asking for the Meaning"). Use natural, conversational Chinese Traditional.'
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: languageInstructions[targetLanguage] + " Maintain the same tone and context. Do not add any explanations or notes, just return the translation."
        },
        {
          role: "user",
          content: subject
        }
      ],
      temperature: 0.3,
      max_tokens: 100
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Translation error for ${targetLanguage}:`, error);
    throw error;
  }
}

/**
 * Get all records that need subject translation
 */
async function getRecordsNeedingTranslation() {
  // Get records where at least one subject translation column is null
  const { data, error } = await supabase
    .from('subject_words')
    .select('id, subject')
    .not('subject', 'is', null)
    .or(`subject_french.is.null,subject_spanish.is.null,subject_german.is.null,subject_chinese_simplified.is.null,subject_hindi.is.null,subject_italian.is.null,subject_cantonese.is.null,subject_chinese_traditional.is.null`)
    .order('id');

  if (error) {
    throw new Error(`Failed to fetch records needing translation: ${error.message}`);
  }

  return data || [];
}

/**
 * Update subject translations for a specific record
 */
async function updateRecordTranslations(id, translations) {
  const updateData = {};
  
  // Build update object with all language translations
  languages.forEach(lang => {
    if (translations[lang.code]) {
      updateData[lang.column] = translations[lang.code];
    }
  });

  const { error } = await supabase
    .from('subject_words')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update subject translations for record ${id}: ${error.message}`);
  }
}

/**
 * Process a single record for subject translation
 */
async function processRecord(record) {
  console.log(`\n📚 Processing record ${record.id}: "${record.subject}"`);
  
  try {
    // Translate subject to all languages
    const translations = {};
    
    for (const lang of languages) {
      console.log(`  🔄 Translating to ${lang.name}...`);
      translations[lang.code] = await translateSubject(record.subject, lang.code);
      console.log(`    ✓ ${lang.name}: "${translations[lang.code]}"`);
      
      // Add delay to avoid rate limiting
      await delay(1000);
    }
    
    // Update this specific record
    if (!isDryRun) {
      await updateRecordTranslations(record.id, translations);
      console.log(`  ✓ Updated record ${record.id}`);
    } else {
      console.log(`  ⚠️  DRY RUN - Would update record ${record.id}`);
    }
    
    return { success: true, record, translations };
  } catch (error) {
    console.error(`  ❌ Error processing record ${record.id}:`, error.message);
    return { success: false, record, error };
  }
}

/**
 * Add delay between requests to avoid rate limiting
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
  console.log('🌍 Subject Translation Populator');
  console.log('================================');
  
  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made to the database');
  }
  
  try {
    // Get records that need subject translation
    console.log('\n📋 Fetching records that need subject translation...');
    const records = await getRecordsNeedingTranslation();
    
    if (records.length === 0) {
      console.log('✅ No records need subject translation!');
      return;
    }
    
    console.log(`Found ${records.length} records that need subject translation`);
    
    // Apply limit if specified
    const recordsToProcess = limit ? records.slice(0, limit) : records;
    
    if (limit) {
      console.log(`Processing ${recordsToProcess.length} records (limited by --limit=${limit})`);
    }
    
    // Process each record
    console.log('\n🔄 Starting translation process...');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < recordsToProcess.length; i++) {
      const record = recordsToProcess[i];
      console.log(`\n[${i + 1}/${recordsToProcess.length}]`);
      
      const result = await processRecord(record);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Add delay between records to avoid rate limiting (except for the last item)
      if (i < recordsToProcess.length - 1) {
        await delay(2000);
      }
    }
    
    // Summary
    console.log('\n📊 Summary');
    console.log('==========');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total records: ${recordsToProcess.length}`);
    console.log(`🌍 Languages: ${languages.length} (${languages.map(l => l.name).join(', ')})`);
    
    if (isDryRun) {
      console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
    } else {
      console.log('\n🎉 Subject translation process completed!');
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Show usage if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Lesson Subject Translation Populator');
  console.log('Usage:');
  console.log('  node populate_subject_translations.js [options]');
  console.log('\nOptions:');
  console.log('  --dry-run           Show what would be translated without making changes');
  console.log('  --limit=N          Limit the number of records to process (for testing)');
  console.log('  --help, -h         Show this help message');
  console.log('\nSupported Languages:');
  languages.forEach(lang => {
    console.log(`  - ${lang.name} (${lang.code})`);
  });
  console.log('\nEnvironment Requirements:');
  console.log('  - EXPO_PUBLIC_SUPABASE_URL');
  console.log('  - EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.log('  - EXPO_PUBLIC_OPENAI_API_KEY');
  process.exit(0);
}

// Run the main function
main().catch(console.error);
