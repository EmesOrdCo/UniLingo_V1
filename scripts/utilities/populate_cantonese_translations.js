#!/usr/bin/env node

/**
 * Script to populate Cantonese translations in the subject_words table
 * Uses OpenAI API to translate English subject words and example sentences to Cantonese
 * 
 * Usage: node populate_cantonese_translations.js [--dry-run] [--limit N]
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
 * Translate text to Cantonese using OpenAI
 */
async function translateToCantonese(text) {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate the following English text to Cantonese. Use proper Cantonese grammar, vocabulary, and cultural context. For Cantonese, use traditional Chinese characters but with Cantonese pronunciation and grammar. Maintain the same tone, structure, and formatting. Do not add any explanations or notes, just return the translation."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Get all subject words that need Cantonese translation
 */
async function getWordsNeedingTranslation() {
  const { data, error } = await supabase
    .from('subject_words')
    .select('id, english_translation, example_sentence_english')
    .or('cantonese_translation.is.null,example_sentence_cantonese.is.null')
    .order('id');

  if (error) {
    throw new Error(`Failed to fetch words: ${error.message}`);
  }

  return data || [];
}

/**
 * Update a word with Cantonese translations
 */
async function updateWordTranslations(id, cantoneseTranslation, exampleSentenceCantonese) {
  const updateData = {};
  
  if (cantoneseTranslation !== undefined) {
    updateData.cantonese_translation = cantoneseTranslation;
  }
  
  if (exampleSentenceCantonese !== undefined) {
    updateData.example_sentence_cantonese = exampleSentenceCantonese;
  }

  const { error } = await supabase
    .from('subject_words')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update word ${id}: ${error.message}`);
  }
}

/**
 * Process a single word for translation
 */
async function processWord(word) {
  console.log(`Processing word ${word.id}: "${word.english_translation}"`);
  
  let cantoneseTranslation = null;
  let exampleSentenceCantonese = null;
  
  try {
    // Translate the word
    if (word.english_translation) {
      cantoneseTranslation = await translateToCantonese(word.english_translation);
      console.log(`  ✓ Word translated: ${word.english_translation} → ${cantoneseTranslation}`);
    } else {
      console.log(`  - No word to translate`);
    }
    
    // Translate the example sentence
    if (word.example_sentence_english) {
      exampleSentenceCantonese = await translateToCantonese(word.example_sentence_english);
      console.log(`  ✓ Example sentence translated (${word.example_sentence_english.length} → ${exampleSentenceCantonese.length} chars)`);
    } else {
      console.log(`  - No example sentence to translate`);
    }
    
    // Update the database unless it's a dry run
    if (!isDryRun) {
      await updateWordTranslations(word.id, cantoneseTranslation, exampleSentenceCantonese);
      console.log(`  ✓ Updated database`);
    } else {
      console.log(`  ⚠️  DRY RUN - Would update database`);
    }
    
    return { success: true, word };
  } catch (error) {
    console.error(`  ❌ Error processing word ${word.id}:`, error.message);
    return { success: false, word, error };
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
  console.log('🇭🇰 Cantonese Translation Populator');
  console.log('=====================================');
  
  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made to the database');
  }
  
  try {
    // Get words that need translation
    console.log('\n📋 Fetching words that need Cantonese translation...');
    const words = await getWordsNeedingTranslation();
    
    if (words.length === 0) {
      console.log('✅ No words need Cantonese translation!');
      return;
    }
    
    console.log(`Found ${words.length} words that need translation`);
    
    // Apply limit if specified
    const wordsToProcess = limit ? words.slice(0, limit) : words;
    
    if (limit) {
      console.log(`Processing ${wordsToProcess.length} words (limited by --limit=${limit})`);
    }
    
    // Process each word
    console.log('\n🔄 Starting translation process...');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < wordsToProcess.length; i++) {
      const word = wordsToProcess[i];
      console.log(`\n[${i + 1}/${wordsToProcess.length}]`);
      
      const result = await processWord(word);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Add delay to avoid rate limiting (except for the last item)
      if (i < wordsToProcess.length - 1) {
        await delay(1000); // 1 second delay
      }
    }
    
    // Summary
    console.log('\n📊 Summary');
    console.log('==========');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total words: ${wordsToProcess.length}`);
    
    if (isDryRun) {
      console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
    } else {
      console.log('\n🎉 Translation process completed!');
    }
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Show usage if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Cantonese Translation Populator');
  console.log('Usage:');
  console.log('  node populate_cantonese_translations.js [options]');
  console.log('\nOptions:');
  console.log('  --dry-run           Show what would be translated without making changes');
  console.log('  --limit=N          Limit the number of records to process (for testing)');
  console.log('  --help, -h         Show this help message');
  console.log('\nEnvironment Requirements:');
  console.log('  - EXPO_PUBLIC_SUPABASE_URL');
  console.log('  - EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.log('  - EXPO_PUBLIC_OPENAI_API_KEY');
  process.exit(0);
}

// Run the main function
main().catch(console.error);
