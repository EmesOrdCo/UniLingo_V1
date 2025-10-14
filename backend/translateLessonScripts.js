const { supabase } = require('./supabaseClient');
const OpenAI = require('openai');
const path = require('path');

// Load environment variables from parent directory .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

/**
 * Translation script to populate French lesson scripts from English ones
 * Preserves the "A:" "B:" "/" format for frontend compatibility
 */
class LessonScriptTranslator {
  constructor() {
    this.batchSize = 5; // Process 5 records at a time to avoid rate limits
    this.delayBetweenBatches = 2000; // 2 second delay between batches
  }

  /**
   * Main function to translate all English lesson scripts to French
   */
  async translateAllScripts() {
    try {
      console.log('🚀 Starting French translation of lesson scripts...');
      
      // Get all records with English scripts but no French scripts
      const { data: records, error } = await supabase
        .from('lesson_scripts')
        .select('id, english_lesson_script, french_lesson_script')
        .not('english_lesson_script', 'is', null)
        .is('french_lesson_script', null);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!records || records.length === 0) {
        console.log('✅ No records found that need translation');
        return;
      }

      console.log(`📊 Found ${records.length} records to translate`);

      // Process in batches
      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        console.log(`\n🔄 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(records.length / this.batchSize)}`);
        
        for (const record of batch) {
          try {
            console.log(`📝 Translating record ID: ${record.id}`);
            
            const frenchScript = await this.translateScript(record.english_lesson_script);
            
            // Update the database
            const { error: updateError } = await supabase
              .from('lesson_scripts')
              .update({ french_lesson_script: frenchScript })
              .eq('id', record.id);

            if (updateError) {
              throw new Error(`Database update error: ${updateError.message}`);
            }

            console.log(`✅ Successfully translated and saved record ID: ${record.id}`);
            successful++;
            
          } catch (error) {
            console.error(`❌ Failed to translate record ID ${record.id}:`, error.message);
            failed++;
          }
          
          processed++;
        }

        // Add delay between batches to respect rate limits
        if (i + this.batchSize < records.length) {
          console.log(`⏱️ Waiting ${this.delayBetweenBatches}ms before next batch...`);
          await this.sleep(this.delayBetweenBatches);
        }
      }

      console.log(`\n🎉 Translation complete!`);
      console.log(`📊 Summary: ${processed} processed, ${successful} successful, ${failed} failed`);

    } catch (error) {
      console.error('❌ Translation process failed:', error);
      throw error;
    }
  }

  /**
   * Translate a single English script to French while preserving format
   */
  async translateScript(englishScript) {
    if (!englishScript || englishScript.trim() === '') {
      throw new Error('English script is empty or null');
    }

    const prompt = `Translate the following English conversation script to French. 

CRITICAL REQUIREMENTS:
1. Preserve the exact format: "A: [text] / B: [text]"
2. Keep the "A:" and "B:" labels exactly as they are
3. Keep the "/" separator exactly as it is
4. Only translate the actual conversation content, not the format markers
5. Maintain natural French conversation flow
6. Use appropriate French greetings and expressions

English script:
${englishScript}

Return ONLY the translated French script with the same format. Do not add any explanations or markdown formatting.`;

    const messages = [
      {
        role: 'system',
        content: 'You are a professional French translator specializing in educational content. You must preserve the exact "A:" "B:" "/" format while translating only the conversation content to natural French.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: 1000,
      });

      const translatedScript = response.choices[0]?.message?.content?.trim();
      
      if (!translatedScript) {
        throw new Error('No translation received from OpenAI');
      }

      // Validate that the format is preserved
      this.validateTranslationFormat(englishScript, translatedScript);

      return translatedScript;

    } catch (error) {
      console.error('❌ OpenAI translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Validate that the translation preserves the required format
   */
  validateTranslationFormat(originalScript, translatedScript) {
    // Check for A: and B: markers
    if (!translatedScript.includes('A:') || !translatedScript.includes('B:')) {
      throw new Error('Translation does not preserve A:/B: format');
    }

    // Check for / separator
    if (!translatedScript.includes('/')) {
      throw new Error('Translation does not preserve / separator');
    }

    // Count A: and B: markers to ensure they match
    const originalAMatches = (originalScript.match(/A:/g) || []).length;
    const originalBMatches = (originalScript.match(/B:/g) || []).length;
    const translatedAMatches = (translatedScript.match(/A:/g) || []).length;
    const translatedBMatches = (translatedScript.match(/B:/g) || []).length;

    if (originalAMatches !== translatedAMatches || originalBMatches !== translatedBMatches) {
      throw new Error('Translation does not preserve the same number of A:/B: markers');
    }

    console.log('✅ Translation format validation passed');
  }

  /**
   * Test translation with a single record
   */
  async testTranslation(recordId = null) {
    try {
      console.log('🧪 Testing translation with a single record...');
      
      let query = supabase
        .from('lesson_scripts')
        .select('id, english_lesson_script, french_lesson_script')
        .not('english_lesson_script', 'is', null)
        .is('french_lesson_script', null);

      if (recordId) {
        query = query.eq('id', recordId);
      }

      const { data: records, error } = await query.limit(1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!records || records.length === 0) {
        console.log('❌ No test record found');
        return;
      }

      const record = records[0];
      console.log(`📝 Testing with record ID: ${record.id}`);
      console.log(`📄 Original English script:`);
      console.log(record.english_lesson_script);
      console.log(`\n🔄 Translating...`);

      const frenchScript = await this.translateScript(record.english_lesson_script);
      
      console.log(`\n📄 Translated French script:`);
      console.log(frenchScript);
      console.log(`\n✅ Test translation successful!`);

      return frenchScript;

    } catch (error) {
      console.error('❌ Test translation failed:', error);
      throw error;
    }
  }

  /**
   * Get statistics about translation progress
   */
  async getTranslationStats() {
    try {
      const { data: stats, error } = await supabase
        .from('lesson_scripts')
        .select('english_lesson_script, french_lesson_script')
        .not('english_lesson_script', 'is', null);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const total = stats.length;
      const translated = stats.filter(record => record.french_lesson_script !== null).length;
      const pending = total - translated;

      console.log(`📊 Translation Statistics:`);
      console.log(`   Total records with English scripts: ${total}`);
      console.log(`   Already translated to French: ${translated}`);
      console.log(`   Pending translation: ${pending}`);
      console.log(`   Progress: ${((translated / total) * 100).toFixed(1)}%`);

      return { total, translated, pending };

    } catch (error) {
      console.error('❌ Error getting translation stats:', error);
      throw error;
    }
  }

  /**
   * Utility function to sleep/delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
async function main() {
  const translator = new LessonScriptTranslator();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'stats':
        await translator.getTranslationStats();
        break;
      
      case 'test':
        const recordId = process.argv[3] ? parseInt(process.argv[3]) : null;
        await translator.testTranslation(recordId);
        break;
      
      case 'translate':
        await translator.translateAllScripts();
        break;
      
      default:
        console.log(`
Usage: node translateLessonScripts.js <command>

Commands:
  stats                    - Show translation progress statistics
  test [recordId]         - Test translation with a single record
  translate               - Translate all pending English scripts to French

Examples:
  node translateLessonScripts.js stats
  node translateLessonScripts.js test
  node translateLessonScripts.js test 123
  node translateLessonScripts.js translate
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = LessonScriptTranslator;
