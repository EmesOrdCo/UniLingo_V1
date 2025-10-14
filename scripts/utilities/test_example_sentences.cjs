#!/usr/bin/env node

/**
 * Test Script for Example Sentence Generation
 * 
 * This script tests the example sentence generation with just a few words
 * to verify everything works before running on the full dataset.
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config();

// Configuration
const TEST_WORD_COUNT = 3; // Test with just 3 words

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
 * Get a few test words
 */
async function getTestWords() {
  try {
    const { data, error } = await supabase
      .from('subject_words')
      .select('id, english_translation, subject')
      .or('example_sentence_english.is.null,example_sentence_english.eq.')
      .limit(TEST_WORD_COUNT)
      .order('id');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching test words:', error.message);
    throw error;
  }
}

/**
 * Test processing a single word
 */
async function testProcessWord(word) {
  console.log(`\n📝 Testing: "${word.english_translation}" (Subject: ${word.subject})`);
  
  try {
    // Generate English example sentence
    console.log('   🔄 Generating English example sentence...');
    const englishSentence = await generateExampleSentence(word.english_translation, word.subject);
    console.log(`   ✅ English: "${englishSentence}"`);
    
    // Add delay before translation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Translate into all languages
    console.log('   🔄 Translating into other languages...');
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
    
    console.log(`   ✅ Test completed successfully for "${word.english_translation}"`);
    return { success: true, word: word.english_translation, sentence: englishSentence, translations };
    
  } catch (error) {
    console.log(`   ❌ Test failed: ${error.message}`);
    return { success: false, word: word.english_translation, error: error.message };
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🧪 Testing Example Sentence Generation and Translation');
  console.log('=' .repeat(60));
  
  try {
    // Get test words
    console.log(`\n📋 Fetching ${TEST_WORD_COUNT} test words...`);
    const words = await getTestWords();
    
    if (words.length === 0) {
      console.log('✅ No words found that need example sentences!');
      return;
    }
    
    console.log(`📊 Found ${words.length} test words`);
    words.forEach((word, index) => {
      console.log(`   ${index + 1}. "${word.english_translation}" (${word.subject})`);
    });
    
    // Test each word
    const results = [];
    for (const word of words) {
      const result = await testProcessWord(word);
      results.push(result);
      
      // Add delay between words
      if (words.indexOf(word) < words.length - 1) {
        console.log('\n⏳ Waiting 2 seconds before next word...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📈 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful tests: ${successful.length}/${words.length}`);
    console.log(`❌ Failed tests: ${failed.length}/${words.length}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed words:');
      failed.forEach(f => {
        console.log(`   - "${f.word}": ${f.error}`);
      });
    }
    
    if (successful.length === words.length) {
      console.log('\n🎉 All tests passed! The script is ready for full execution.');
      console.log('💡 Run "node generate_example_sentences.js" to process all words.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('\n💥 Test error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test interrupted by user. Exiting gracefully...');
  process.exit(0);
});

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled test error:', error);
    process.exit(1);
  });
}
