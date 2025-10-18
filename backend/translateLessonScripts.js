const { supabase } = require('./supabaseClient');
const OpenAI = require('openai');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
});

/**
 * Translate English text to Chinese Traditional using OpenAI
 * @param {string} text - The English text to translate
 * @returns {Promise<string>} - The translated Chinese Traditional text
 */
async function translateToChineseTraditional(text) {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate the following English text to Traditional Chinese (繁體中文). Use Traditional Chinese characters as used in Taiwan, Hong Kong, and Macau. Do NOT use Simplified Chinese characters. Maintain the same tone, structure, and formatting. Do not add any explanations or notes, just return the translation."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return completion.choices[0].message.content.trim();
    } catch (error) {
    console.error('Translation error:', error);
      throw error;
    }
  }

  /**
 * Get all lesson scripts that need translation
 * @returns {Promise<Array>} - Array of lesson scripts with English content
 */
async function getLessonScriptsToTranslate() {
  const { data, error } = await supabase
    .from('lesson_scripts')
    .select('id, subject_name, english_lesson_script')
    .not('english_lesson_script', 'is', null);

  if (error) {
    throw new Error(`Error fetching lesson scripts: ${error.message}`);
  }

  return data || [];
}

/**
 * Update lesson script with Chinese Traditional translations
 * @param {number} id - The lesson script ID
 * @param {string} chineseScript - Chinese Traditional lesson script
 */
async function updateLessonScript(id, chineseScript) {
  const updateData = {
    'chinese(traditional)_lesson_script': chineseScript
  };

  const { error } = await supabase
    .from('lesson_scripts')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Error updating lesson script ${id}: ${error.message}`);
  }
}

/**
 * Process a single lesson script translation
 * @param {Object} script - The lesson script object
 */
async function processLessonScript(script) {
  console.log(`\nProcessing: ${script.subject_name}`);
  
  let chineseScript = '';

  // Translate lesson script if it exists
  if (script.english_lesson_script) {
    console.log('  Translating lesson script...');
    try {
      chineseScript = await translateToChineseTraditional(script.english_lesson_script);
      console.log('  ✅ Lesson script translated');
    } catch (error) {
      console.error(`  ❌ Error translating lesson script: ${error.message}`);
    }
  }

  // Update the database if we have a translation
  if (chineseScript) {
    try {
      await updateLessonScript(script.id, chineseScript);
      console.log('  ✅ Database updated');
    } catch (error) {
      console.error(`  ❌ Error updating database: ${error.message}`);
    }
  } else {
    console.log('  ⚠️  No content to translate');
  }
}

/**
 * Main function to translate all lesson scripts
 */
async function translateAllLessonScripts() {
  console.log('🚀 Starting lesson script translation to Chinese Traditional...\n');

  try {
    // Check if OpenAI API key is available
    if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new Error('EXPO_PUBLIC_OPENAI_API_KEY or OPENAI_API_KEY environment variable is required');
    }

    // Get all lesson scripts that need translation
    console.log('📋 Fetching lesson scripts...');
    const scripts = await getLessonScriptsToTranslate();
    
    if (scripts.length === 0) {
      console.log('ℹ️  No lesson scripts found that need translation.');
      return;
    }

    console.log(`📊 Found ${scripts.length} lesson scripts to process\n`);

    // Process each script
    let processed = 0;
    let errors = 0;

    for (const script of scripts) {
      try {
        await processLessonScript(script);
        processed++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error processing ${script.subject_name}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n🎉 Translation completed!`);
    console.log(`✅ Successfully processed: ${processed}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total scripts: ${scripts.length}`);

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

/**
 * Test function to translate a single script (for testing purposes)
 */
async function testTranslation() {
  console.log('🧪 Testing translation with a sample text...');
  
  const testText = "Hello, welcome to our English lesson. Today we will learn about basic greetings and introductions.";
  
  try {
    const translation = await translateToChineseTraditional(testText);
    console.log('Original:', testText);
    console.log('Translation:', translation);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the script if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    testTranslation();
  } else {
    translateAllLessonScripts();
  }
}

module.exports = {
  translateToChineseTraditional,
  getLessonScriptsToTranslate,
  updateLessonScript,
  processLessonScript,
  translateAllLessonScripts
};