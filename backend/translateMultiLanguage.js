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
 * Multi-language translation script for lesson scripts
 * Supports Spanish, German, and other languages
 */
class MultiLanguageTranslator {
  constructor() {
    this.batchSize = 5; // Process 5 records at a time to avoid rate limits
    this.delayBetweenBatches = 2000; // 2 second delay between batches
    
    // Language configurations
    this.languages = {
      spanish: {
        column: 'spanish_lesson_script',
        name: 'Spanish',
        code: 'es',
        greeting: '¡Hola!',
        farewell: '¡Adiós!',
        alphabet: 'latin'
      },
      german: {
        column: 'german_lesson_script',
        name: 'German',
        code: 'de',
        greeting: 'Hallo!',
        farewell: 'Auf Wiedersehen!',
        alphabet: 'latin'
      },
      french: {
        column: 'french_lesson_script',
        name: 'French',
        code: 'fr',
        greeting: 'Salut!',
        farewell: 'Au revoir!',
        alphabet: 'latin'
      },
      mandarin: {
        column: 'chinese_simplified_lesson_script',
        name: 'Mandarin Chinese',
        code: 'zh',
        greeting: '你好！',
        farewell: '再见！',
        alphabet: 'chinese'
      },
      hindi: {
        column: 'hindi_lesson_script',
        name: 'Hindi',
        code: 'hi',
        greeting: 'नमस्ते!',
        farewell: 'अलविदा!',
        alphabet: 'devanagari'
      }
    };
  }

  /**
   * Main function to translate all English lesson scripts to specified language
   */
  async translateAllScripts(targetLanguage) {
    if (!this.languages[targetLanguage]) {
      throw new Error(`Unsupported language: ${targetLanguage}. Supported: ${Object.keys(this.languages).join(', ')}`);
    }

    const langConfig = this.languages[targetLanguage];
    
    try {
      console.log(`🚀 Starting ${langConfig.name} translation of lesson scripts...`);
      
      // Get all records with English scripts but no target language scripts
      const { data: records, error } = await supabase
        .from('lesson_scripts')
        .select(`id, english_lesson_script, ${langConfig.column}`)
        .not('english_lesson_script', 'is', null)
        .is(langConfig.column, null);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!records || records.length === 0) {
        console.log(`✅ No records found that need ${langConfig.name} translation`);
        return;
      }

      console.log(`📊 Found ${records.length} records to translate to ${langConfig.name}`);

      // Process in batches
      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        console.log(`\n🔄 Processing ${langConfig.name} batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(records.length / this.batchSize)}`);
        
        for (const record of batch) {
          try {
            console.log(`📝 Translating record ID: ${record.id} to ${langConfig.name}`);
            
            const translatedScript = await this.translateScript(record.english_lesson_script, langConfig);
            
            // Update the database
            const updateData = {};
            updateData[langConfig.column] = translatedScript;
            
            const { error: updateError } = await supabase
              .from('lesson_scripts')
              .update(updateData)
              .eq('id', record.id);

            if (updateError) {
              throw new Error(`Database update error: ${updateError.message}`);
            }

            console.log(`✅ Successfully translated and saved record ID: ${record.id} to ${langConfig.name}`);
            successful++;
            
          } catch (error) {
            console.error(`❌ Failed to translate record ID ${record.id} to ${langConfig.name}:`, error.message);
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

      console.log(`\n🎉 ${langConfig.name} translation complete!`);
      console.log(`📊 Summary: ${processed} processed, ${successful} successful, ${failed} failed`);

    } catch (error) {
      console.error(`❌ ${langConfig.name} translation process failed:`, error);
      throw error;
    }
  }

  /**
   * Translate a single English script to target language while preserving format
   */
  async translateScript(englishScript, langConfig) {
    if (!englishScript || englishScript.trim() === '') {
      throw new Error('English script is empty or null');
    }

    // Special handling for non-Latin scripts
    const isNonLatinScript = langConfig.alphabet !== 'latin';
    const formatWarning = isNonLatinScript ? 
      `\n⚠️ CRITICAL FORMAT WARNING: This language uses ${langConfig.alphabet} script. You MUST keep the English letters "A:" and "B:" and the "/" symbol exactly as they are. DO NOT translate these format markers to ${langConfig.alphabet} characters.` : '';

    const prompt = `Translate the following English conversation script to ${langConfig.name}. 

CRITICAL REQUIREMENTS:
1. Preserve the exact format: "A: [text] / B: [text]"
2. Keep the "A:" and "B:" labels exactly as they are (English letters)
3. Keep the "/" separator exactly as it is (English symbol)
4. Only translate the actual conversation content, not the format markers
5. Maintain natural ${langConfig.name} conversation flow
6. Use appropriate ${langConfig.name} greetings and expressions
7. Use ${langConfig.greeting} for greetings and ${langConfig.farewell} for farewells when appropriate${formatWarning}

English script:
${englishScript}

Return ONLY the translated ${langConfig.name} script with the same format. Do not add any explanations or markdown formatting.`;

    const systemMessage = isNonLatinScript ? 
      `You are a professional ${langConfig.name} translator specializing in educational content. CRITICAL: This language uses ${langConfig.alphabet} script, but you MUST keep the English format markers "A:" "B:" and "/" exactly as they are. Only translate the conversation content to ${langConfig.name} using ${langConfig.alphabet} characters. The format markers must remain in English letters.` :
      `You are a professional ${langConfig.name} translator specializing in educational content. You must preserve the exact "A:" "B:" "/" format while translating only the conversation content to natural ${langConfig.name}. Use appropriate ${langConfig.name} expressions and maintain cultural authenticity.`;

    const messages = [
      {
        role: 'system',
        content: systemMessage
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
      this.validateTranslationFormat(englishScript, translatedScript, langConfig);

      return translatedScript;

    } catch (error) {
      console.error(`❌ OpenAI ${langConfig.name} translation error:`, error);
      throw new Error(`${langConfig.name} translation failed: ${error.message}`);
    }
  }

  /**
   * Validate that the translation preserves the required format
   */
  validateTranslationFormat(originalScript, translatedScript, langConfig = null) {
    // Check for A: and B: markers (must be exact English letters)
    if (!translatedScript.includes('A:') || !translatedScript.includes('B:')) {
      throw new Error('Translation does not preserve A:/B: format');
    }

    // Check for / separator (must be exact English symbol)
    if (!translatedScript.includes('/')) {
      throw new Error('Translation does not preserve / separator');
    }

    // Extra validation for non-Latin scripts
    if (langConfig && langConfig.alphabet !== 'latin') {
      // Ensure A: and B: are exactly English letters, not translated
      const aMatches = translatedScript.match(/A:/g);
      const bMatches = translatedScript.match(/B:/g);
      
      if (!aMatches || !bMatches) {
        throw new Error(`Translation corrupted format markers for ${langConfig.name} - A: or B: missing`);
      }
      
      // Check that A: and B: are not mixed with other characters
      // Look for patterns like "X:" where X is not A or B
      const invalidMarkers = translatedScript.match(/[^AB]:/g);
      
      if (invalidMarkers) {
        console.warn(`⚠️ Found potentially invalid markers: ${invalidMarkers.join(', ')}`);
        // Don't throw error, just warn - sometimes this can be false positive
      }
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
  async testTranslation(targetLanguage, recordId = null) {
    if (!this.languages[targetLanguage]) {
      throw new Error(`Unsupported language: ${targetLanguage}. Supported: ${Object.keys(this.languages).join(', ')}`);
    }

    const langConfig = this.languages[targetLanguage];
    
    try {
      console.log(`🧪 Testing ${langConfig.name} translation with a single record...`);
      
      let query = supabase
        .from('lesson_scripts')
        .select(`id, english_lesson_script, ${langConfig.column}`)
        .not('english_lesson_script', 'is', null)
        .is(langConfig.column, null);

      if (recordId) {
        query = query.eq('id', recordId);
      }

      const { data: records, error } = await query.limit(1);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!records || records.length === 0) {
        console.log(`❌ No test record found for ${langConfig.name} translation`);
        return;
      }

      const record = records[0];
      console.log(`📝 Testing with record ID: ${record.id}`);
      console.log(`📄 Original English script:`);
      console.log(record.english_lesson_script);
      console.log(`\n🔄 Translating to ${langConfig.name}...`);

      const translatedScript = await this.translateScript(record.english_lesson_script, langConfig);
      
      console.log(`\n📄 Translated ${langConfig.name} script:`);
      console.log(translatedScript);
      console.log(`\n✅ Test ${langConfig.name} translation successful!`);

      return translatedScript;

    } catch (error) {
      console.error(`❌ Test ${langConfig.name} translation failed:`, error);
      throw error;
    }
  }

  /**
   * Get statistics about translation progress for all languages
   */
  async getTranslationStats() {
    try {
      const { data: stats, error } = await supabase
        .from('lesson_scripts')
        .select('english_lesson_script, french_lesson_script, spanish_lesson_script, german_lesson_script, chinese_simplified_lesson_script, hindi_lesson_script')
        .not('english_lesson_script', 'is', null);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const total = stats.length;
      
      console.log(`📊 Translation Statistics:`);
      console.log(`   Total records with English scripts: ${total}`);
      console.log(`\n📈 Progress by Language:`);
      
      for (const [langKey, langConfig] of Object.entries(this.languages)) {
        const translated = stats.filter(record => record[langConfig.column] !== null).length;
        const pending = total - translated;
        const progress = ((translated / total) * 100).toFixed(1);
        
        console.log(`   ${langConfig.name}: ${progress}% (${translated}/${total}) - ${pending} pending`);
      }

      return { total, languages: this.languages };

    } catch (error) {
      console.error('❌ Error getting translation stats:', error);
      throw error;
    }
  }

  /**
   * Translate to multiple languages sequentially
   */
  async translateToMultipleLanguages(languages) {
    for (const language of languages) {
      if (!this.languages[language]) {
        console.error(`❌ Unsupported language: ${language}`);
        continue;
      }
      
      console.log(`\n🌍 Starting translation to ${this.languages[language].name}...`);
      await this.translateAllScripts(language);
      
      // Add a longer delay between languages
      if (languages.indexOf(language) < languages.length - 1) {
        console.log(`⏱️ Waiting 5 seconds before next language...`);
        await this.sleep(5000);
      }
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
  const translator = new MultiLanguageTranslator();
  const command = process.argv[2];
  const language = process.argv[3];

  try {
    switch (command) {
      case 'stats':
        await translator.getTranslationStats();
        break;
      
      case 'test':
        if (!language) {
          console.log('❌ Please specify a language: spanish, german, or french');
          break;
        }
        const recordId = process.argv[4] ? parseInt(process.argv[4]) : null;
        await translator.testTranslation(language, recordId);
        break;
      
      case 'translate':
        if (!language) {
          console.log('❌ Please specify a language: spanish, german, or french');
          break;
        }
        await translator.translateAllScripts(language);
        break;
      
      case 'translate-all':
        const languages = process.argv.slice(3);
        if (languages.length === 0) {
          console.log('❌ Please specify languages: spanish, german, french');
          break;
        }
        await translator.translateToMultipleLanguages(languages);
        break;
      
      default:
        console.log(`
Usage: node translateMultiLanguage.js <command> [language] [options]

Commands:
  stats                                    - Show translation progress statistics for all languages
  test <language> [recordId]              - Test translation with a single record
  translate <language>                    - Translate all pending English scripts to specified language
  translate-all <language1> [language2]   - Translate to multiple languages sequentially

Languages:
  spanish  - Translate to Spanish
  german   - Translate to German
  french   - Translate to French
  mandarin - Translate to Mandarin Chinese
  hindi    - Translate to Hindi

Examples:
  node translateMultiLanguage.js stats
  node translateMultiLanguage.js test spanish
  node translateMultiLanguage.js test mandarin 123
  node translateMultiLanguage.js translate spanish
  node translateMultiLanguage.js translate mandarin
  node translateMultiLanguage.js translate-all spanish german mandarin hindi
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

module.exports = MultiLanguageTranslator;
