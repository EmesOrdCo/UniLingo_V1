#!/usr/bin/env node

/**
 * Quick Test Script
 * 
 * This script tests the example sentence generation with just one word
 * to demonstrate the improved prompt quality.
 */

const OpenAI = require('openai');
require('dotenv').config();

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
      max_tokens: 50,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`❌ Error generating example sentence for "${englishWord}":`, error.message);
    throw error;
  }
}

/**
 * Test with a few example words
 */
async function runTest() {
  console.log('🧪 Quick Test - Example Sentence Generation');
  console.log('=' .repeat(50));
  
  const testWords = [
    { word: 'hi', subject: 'Saying Hello' },
    { word: 'hello', subject: 'Saying Hello' },
    { word: 'yes', subject: 'Basic Responses' },
    { word: 'good', subject: 'Descriptions' },
    { word: 'happy', subject: 'Feelings' }
  ];
  
  for (const test of testWords) {
    console.log(`\n📝 Testing: "${test.word}" (Subject: ${test.subject})`);
    
    try {
      const sentence = await generateExampleSentence(test.word, test.subject);
      console.log(`   ✅ Generated: "${sentence}"`);
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the test
runTest().catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
});
