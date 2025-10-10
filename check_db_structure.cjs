#!/usr/bin/env node

/**
 * Check Database Structure Script
 * 
 * This script checks the actual structure of the subject_words table
 * to verify column names and data.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure');
  console.log('=' .repeat(50));
  
  try {
    // Check if table exists and get its structure
    console.log('\n📋 Checking table structure...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'subject_words' });
    
    if (columnsError) {
      console.log('⚠️  RPC function not available, trying direct query...');
      
      // Try a simple query to see what happens
      const { data, error } = await supabase
        .from('subject_words')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Error querying subject_words table:', error.message);
        console.log('\n🔧 Suggested fixes:');
        console.log('1. Make sure the subject_words table exists in your Supabase database');
        console.log('2. Run the create_subject_words_table.sql script in your Supabase SQL editor');
        console.log('3. Check that your .env file has the correct Supabase URL and key');
        return;
      }
      
      if (data && data.length > 0) {
        console.log('✅ Table exists and has data!');
        console.log('📊 Sample record:', data[0]);
        console.log('📋 Available columns:', Object.keys(data[0]));
      } else {
        console.log('✅ Table exists but is empty');
      }
    } else {
      console.log('📋 Table columns:', columns);
    }
    
    // Try to get a few sample records
    console.log('\n📊 Fetching sample records...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('subject_words')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('✅ Sample records:');
      sampleData.forEach((record, index) => {
        console.log(`   ${index + 1}.`, record);
      });
    } else {
      console.log('ℹ️  No records found in the table');
    }
    
    // Check for words that need example sentences
    console.log('\n🔍 Checking for words needing example sentences...');
    const { data: wordsNeedingExamples, error: examplesError } = await supabase
      .from('subject_words')
      .select('*')
      .or('example_sentence_english.is.null,example_sentence_english.eq.')
      .limit(5);
    
    if (examplesError) {
      console.error('❌ Error checking example sentences:', examplesError.message);
    } else if (wordsNeedingExamples && wordsNeedingExamples.length > 0) {
      console.log(`✅ Found ${wordsNeedingExamples.length} words needing example sentences:`);
      wordsNeedingExamples.forEach((word, index) => {
        console.log(`   ${index + 1}. "${word.word_phrase || word.english_word || 'Unknown'}" (${word.subject})`);
      });
    } else {
      console.log('ℹ️  All words already have example sentences or table is empty');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Run the check
checkDatabaseStructure().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
