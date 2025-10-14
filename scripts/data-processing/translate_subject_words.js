import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

// Initialize Supabase
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Languages to translate to
const languages = {
  french_translation: 'French',
  spanish_translation: 'Spanish',
  german_translation: 'German',
  mandarin_translation: 'Mandarin Chinese (Simplified)',
  hindi_translation: 'Hindi',
};

// Function to translate a word using OpenAI
async function translateWord(word, targetLanguage) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given English word or phrase to ${targetLanguage}. Return ONLY the translation, nothing else. Keep it concise and natural.`,
        },
        {
          role: 'user',
          content: word,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error translating "${word}" to ${targetLanguage}:`, error.message);
    return null;
  }
}

// Function to batch translate words (to avoid rate limits)
async function translateWordToAllLanguages(word) {
  const translations = {};
  
  for (const [column, language] of Object.entries(languages)) {
    console.log(`  Translating to ${language}...`);
    const translation = await translateWord(word, language);
    if (translation) {
      translations[column] = translation;
    }
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return translations;
}

// Main function
async function translateAllWords() {
  try {
    console.log('🌍 Starting translation process...\n');

    // Fetch all words that don't have translations yet
    const { data: words, error: fetchError } = await supabase
      .from('subject_words')
      .select('id, english_translation, subject')
      .or('french_translation.is.null,spanish_translation.is.null,german_translation.is.null,mandarin_translation.is.null,hindi_translation.is.null');

    if (fetchError) {
      throw new Error(`Error fetching words: ${fetchError.message}`);
    }

    if (!words || words.length === 0) {
      console.log('✅ All words are already translated!');
      return;
    }

    console.log(`📚 Found ${words.length} words to translate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      console.log(`\n[${i + 1}/${words.length}] Translating: "${word.english_translation}" (${word.subject})`);

      try {
        // Get translations for all languages
        const translations = await translateWordToAllLanguages(word.english_translation);

        // Update the database
        const { error: updateError } = await supabase
          .from('subject_words')
          .update(translations)
          .eq('id', word.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`  ✅ Translations saved:`, translations);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Error processing word:`, error.message);
        errorCount++;
      }

      // Progress update every 10 words
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${words.length} words processed`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Translation complete!');
    console.log(`✅ Successfully translated: ${successCount} words`);
    console.log(`❌ Errors: ${errorCount} words`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
translateAllWords();

