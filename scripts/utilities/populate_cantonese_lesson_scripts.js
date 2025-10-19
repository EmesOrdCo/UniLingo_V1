#!/usr/bin/env node

/**
 * Script to populate Cantonese lesson scripts in the lesson_scripts table
 * Uses OpenAI API to translate English lesson scripts to Cantonese
 * 
 * Usage: node populate_cantonese_lesson_scripts.js [--dry-run] [--limit N]
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
          content: "You are a professional translator. Translate the following English lesson script to Cantonese. Use proper Cantonese grammar, vocabulary, and cultural context. For Cantonese, use traditional Chinese characters but with Cantonese pronunciation and grammar. Maintain the same tone, structure, and formatting. Do not add any explanations or notes, just return the translation."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Get all lesson scripts that need Cantonese translation
 */
async function getLessonScriptsNeedingTranslation() {
  const { data, error } = await supabase
    .from('lesson_scripts')
    .select('id, subject_name, english_lesson_script')
    .is('cantonese_lesson_script', null)
    .order('id');

  if (error) {
    throw new Error(`Failed to fetch lesson scripts: ${error.message}`);
  }

  return data || [];
}

/**
 * Update a lesson script with Cantonese translations
 */
async function updateLessonScriptTranslations(id, cantoneseLessonScript) {
  const updateData = {
    cantonese_lesson_script: cantoneseLessonScript
  };

  const { error } = await supabase
    .from('lesson_scripts')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update lesson script ${id}: ${error.message}`);
  }
}

/**
 * Process a single lesson script for translation
 */
async function processLessonScript(lessonScript) {
  console.log(`Processing lesson script ${lessonScript.id}: "${lessonScript.subject_name}"`);
  
  let cantoneseLessonScript = null;
  
  try {
    // Translate the lesson script
    if (lessonScript.english_lesson_script) {
      cantoneseLessonScript = await translateToCantonese(lessonScript.english_lesson_script);
      console.log(`  ✓ Lesson script translated (${lessonScript.english_lesson_script.length} → ${cantoneseLessonScript.length} chars)`);
    } else {
      console.log(`  - No lesson script to translate`);
    }
    
    // Update the database unless it's a dry run
    if (!isDryRun) {
      await updateLessonScriptTranslations(lessonScript.id, cantoneseLessonScript);
      console.log(`  ✓ Updated database`);
    } else {
      console.log(`  ⚠️  DRY RUN - Would update database`);
    }
    
    return { success: true, lessonScript };
  } catch (error) {
    console.error(`  ❌ Error processing lesson script ${lessonScript.id}:`, error.message);
    return { success: false, lessonScript, error };
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
  console.log('🇭🇰 Cantonese Lesson Script Translation Populator');
  console.log('=================================================');
  
  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made to the database');
  }
  
  try {
    // Get lesson scripts that need translation
    console.log('\n📋 Fetching lesson scripts that need Cantonese translation...');
    const lessonScripts = await getLessonScriptsNeedingTranslation();
    
    if (lessonScripts.length === 0) {
      console.log('✅ No lesson scripts need Cantonese translation!');
      return;
    }
    
    console.log(`Found ${lessonScripts.length} lesson scripts that need translation`);
    
    // Apply limit if specified
    const scriptsToProcess = limit ? lessonScripts.slice(0, limit) : lessonScripts;
    
    if (limit) {
      console.log(`Processing ${scriptsToProcess.length} lesson scripts (limited by --limit=${limit})`);
    }
    
    // Process each lesson script
    console.log('\n🔄 Starting translation process...');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < scriptsToProcess.length; i++) {
      const lessonScript = scriptsToProcess[i];
      console.log(`\n[${i + 1}/${scriptsToProcess.length}]`);
      
      const result = await processLessonScript(lessonScript);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Add delay to avoid rate limiting (except for the last item)
      if (i < scriptsToProcess.length - 1) {
        await delay(2000); // 2 second delay for lesson scripts (longer content)
      }
    }
    
    // Summary
    console.log('\n📊 Summary');
    console.log('==========');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total lesson scripts: ${scriptsToProcess.length}`);
    
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
  console.log('Cantonese Lesson Script Translation Populator');
  console.log('Usage:');
  console.log('  node populate_cantonese_lesson_scripts.js [options]');
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
