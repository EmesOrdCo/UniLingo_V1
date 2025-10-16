#!/usr/bin/env node

/**
 * Test script for Chinese Traditional translation functionality
 * This script tests the translation API and database connection
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

/**
 * Test OpenAI API connection and translation
 */
async function testOpenAI() {
  console.log('🧪 Testing OpenAI API...');
  
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
          content: 'Hello, how are you?'
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    const translation = response.choices[0].message.content.trim();
    console.log(`✅ OpenAI API working. Translation: "Hello, how are you?" → "${translation}"`);
    return true;
  } catch (error) {
    console.error('❌ OpenAI API test failed:', error.message);
    return false;
  }
}

/**
 * Test Supabase connection
 */
async function testSupabase() {
  console.log('\n🧪 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('subject_words')
      .select('id, english_translation, example_sentence_english')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log(`✅ Supabase connection working. Found ${data.length} records in subject_words table`);
    if (data.length > 0) {
      console.log(`   Sample record: ID ${data[0].id}, Translation: "${data[0].english_translation}"`);
    }
    return true;
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
    return false;
  }
}

/**
 * Test the new Chinese Traditional columns exist
 */
async function testChineseColumns() {
  console.log('\n🧪 Testing Chinese Traditional columns...');
  
  try {
    const { data, error } = await supabase
      .from('subject_words')
      .select('id, "chinese(traditional)_translation", "example_sentence_chinese(traditional)"')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Chinese Traditional columns exist and are accessible');
    return true;
  } catch (error) {
    console.error('❌ Chinese Traditional columns test failed:', error.message);
    console.log('   Make sure you have run the migration: database/migrations/add_chinese_traditional_columns.sql');
    return false;
  }
}

/**
 * Test a complete translation workflow
 */
async function testTranslationWorkflow() {
  console.log('\n🧪 Testing complete translation workflow...');
  
  try {
    // Get a record that has English content but no Chinese Traditional
    const { data, error } = await supabase
      .from('subject_words')
      .select('id, english_translation, example_sentence_english, "chinese(traditional)_translation", "example_sentence_chinese(traditional)"')
      .not('english_translation', 'is', null)
      .is('"chinese(traditional)_translation"', null)
      .limit(1);

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      console.log('ℹ️  No records found that need Chinese Traditional translation');
      return true;
    }

    const record = data[0];
    console.log(`   Testing with record ID ${record.id}: "${record.english_translation}"`);

    // Test translation
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the given English text to Chinese Traditional (繁體中文). Return only the translation, no explanations or additional text.'
        },
        {
          role: 'user',
          content: record.english_translation
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    const translation = response.choices[0].message.content.trim();
    console.log(`   Translation: "${record.english_translation}" → "${translation}"`);

    // Test database update (dry run)
    console.log('   ✅ Translation workflow test successful');
    return true;
  } catch (error) {
    console.error('❌ Translation workflow test failed:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Starting Chinese Traditional translation tests...\n');

  const tests = [
    { name: 'OpenAI API', fn: testOpenAI },
    { name: 'Supabase Connection', fn: testSupabase },
    { name: 'Chinese Traditional Columns', fn: testChineseColumns },
    { name: 'Translation Workflow', fn: testTranslationWorkflow }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} test crashed:`, error.message);
      failed++;
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! You can now run the translation script.');
    console.log('   Run: node scripts/utilities/populate_chinese_traditional_translations.js --dry-run');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues before running the translation script.');
    process.exit(1);
  }
}

// Run the tests
main();

export {
  testOpenAI,
  testSupabase,
  testChineseColumns,
  testTranslationWorkflow
};
