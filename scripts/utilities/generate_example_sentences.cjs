#!/usr/bin/env node

/**
 * Generate Example Sentences and Translations Script
 * 
 * This script generates example sentences for each English translation term in the subject_words table
 * using OpenAI API. The sentences highlight the target keyword and translate them into multiple languages.
 * 
 * Features:
 * - Generates contextually rich example sentences where the target word is the most complex
 * - Translates sentences into French, German, Spanish, Hindi, and Mandarin
 * - Updates the database with generated content
 * - Handles rate limiting and error recovery
 * - Progress tracking and batch processing
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config();

// Configuration
const BATCH_SIZE = 5; // Process words in batches to manage API rate limits
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds delay between batches
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay between individual requests

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
 * Generate an example sentence for the given English word
 * The sentence should highlight the word and make it the most complex/advanced word in the sentence
 */
async function generateExampleSentence(englishWord, subject) {
  const prompt = `Generate a very simple, natural example sentence in English that highlights the word "${englishWord}" from the subject area "${subject}". 

Requirements:
1. Use only basic, elementary-level words around "${englishWord}"
2. The sentence should be 3-8 words maximum
3. Use common, everyday vocabulary - avoid words like "friend", "see", "when", "because"
4. Focus on simple phrases that beginners would say
5. Make it natural and realistic
6. Do not include quotation marks around the target word
7. Only return the sentence, no explanations

Examples:
- For "hi": "Hi, how are you?"
- For "hello": "Hello, good morning"
- For "yes": "Yes, I am happy"

Word: ${englishWord}
Subject: ${subject}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a language learning expert who creates very simple, elementary-level example sentences using only basic words that a beginner would know. Keep sentences short and natural."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`❌ Error generating example sentence for "${englishWord}":`, error.message);
    throw error;
  }
}

/**
 * Translate a sentence into multiple languages
 */
async function translateSentence(sentence, targetLanguages) {
  const translations = {};
  
  for (const lang of targetLanguages) {
    try {
      const languageNames = {
        'french': 'French',
        'spanish': 'Spanish', 
        'german': 'German',
        'hindi': 'Hindi',
        'mandarin': 'Mandarin Chinese'
      };

      const prompt = `Translate the following English sentence into ${languageNames[lang]}. 
      
Requirements:
1. Maintain the natural flow and meaning
2. Keep the same level of complexity
3. Use appropriate cultural context for ${languageNames[lang]}
4. Only return the translated sentence, no explanations
5. For Mandarin, use simplified Chinese characters

English sentence: "${sentence}"`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional translator specializing in ${languageNames[lang]}. Translate accurately while maintaining natural flow.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      translations[lang] = response.choices[0].message.content.trim();
      
      // Add delay between translation requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error translating to ${lang}:`, error.message);
      translations[lang] = null;
    }
  }
  
  return translations;
}

/**
 * Update database with generated content
 */
async function updateDatabaseRecord(wordId, englishSentence, translations) {
  try {
    const { error } = await supabase
      .from('subject_words')
      .update({
        example_sentence_english: englishSentence,
        example_sentence_french: translations.french,
        example_sentence_spanish: translations.spanish,
        example_sentence_german: translations.german,
        example_sentence_hindi: translations.hindi,
        example_sentence_mandarin: translations.mandarin,
      })
      .eq('id', wordId);

    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error updating database for word ID ${wordId}:`, error.message);
    return false;
  }
}

/**
 * Process a single word
 */
async function processWord(word) {
  console.log(`\n📝 Processing: "${word.english_translation}" (Subject: ${word.subject})`);
  
  try {
    // Generate English example sentence
    const englishSentence = await generateExampleSentence(word.english_translation, word.subject);
    console.log(`   ✅ English: "${englishSentence}"`);
    
    // Add delay before translation
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    
    // Translate into all languages
    const targetLanguages = ['french', 'spanish', 'german', 'hindi', 'mandarin'];
    const translations = await translateSentence(englishSentence, targetLanguages);
    
    // Display translations
    Object.entries(translations).forEach(([lang, translation]) => {
      if (translation) {
        console.log(`   ✅ ${lang.charAt(0).toUpperCase() + lang.slice(1)}: "${translation}"`);
      } else {
        console.log(`   ❌ ${lang.charAt(0).toUpperCase() + lang.slice(1)}: Translation failed`);
      }
    });
    
    // Update database
    const updateSuccess = await updateDatabaseRecord(word.id, englishSentence, translations);
    
    if (updateSuccess) {
      console.log(`   ✅ Database updated successfully`);
      return { success: true, word: word.english_translation };
    } else {
      console.log(`   ❌ Database update failed`);
      return { success: false, word: word.english_translation, error: 'Database update failed' };
    }
    
  } catch (error) {
    console.log(`   ❌ Processing failed: ${error.message}`);
    return { success: false, word: word.english_translation, error: error.message };
  }
}

/**
 * Get words that need example sentences
 */
async function getWordsNeedingExamples() {
  try {
    const { data, error } = await supabase
      .from('subject_words')
      .select('id, english_translation, subject')
      .or('example_sentence_english.is.null,example_sentence_english.eq.')
      .order('id');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching words:', error.message);
    throw error;
  }
}

/**
 * Process words in batches
 */
async function processBatch(words, batchNumber, totalBatches) {
  console.log(`\n🔄 Processing batch ${batchNumber}/${totalBatches} (${words.length} words)`);
  
  const results = [];
  
  for (const word of words) {
    const result = await processWord(word);
    results.push(result);
    
    // Add delay between requests within batch
    if (words.indexOf(word) < words.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }
  
  return results;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Example Sentence Generation and Translation');
  console.log('=' .repeat(60));
  
  try {
    // Get words that need example sentences
    console.log('\n📋 Fetching words that need example sentences...');
    const words = await getWordsNeedingExamples();
    
    if (words.length === 0) {
      console.log('✅ All words already have example sentences!');
      return;
    }
    
    console.log(`📊 Found ${words.length} words needing example sentences`);
    
    // Process in batches
    const totalBatches = Math.ceil(words.length / BATCH_SIZE);
    const allResults = [];
    
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      const batchResults = await processBatch(batch, batchNumber, totalBatches);
      allResults.push(...batchResults);
      
      // Add delay between batches (except for the last batch)
      if (batchNumber < totalBatches) {
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📈 PROCESSING SUMMARY');
    console.log('=' .repeat(60));
    
    const successful = allResults.filter(r => r.success);
    const failed = allResults.filter(r => !r.success);
    
    console.log(`✅ Successfully processed: ${successful.length} words`);
    console.log(`❌ Failed: ${failed.length} words`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed words:');
      failed.forEach(f => {
        console.log(`   - "${f.word}": ${f.error}`);
      });
    }
    
    console.log('\n🎉 Example sentence generation completed!');
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Process interrupted by user. Exiting gracefully...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  generateExampleSentence,
  translateSentence,
  processWord,
  getWordsNeedingExamples
};
