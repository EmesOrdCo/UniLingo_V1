const { supabase } = require('./supabaseClient');
const path = require('path');

// Load environment variables from parent directory .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Monitor translation progress for all languages
 */
async function monitorTranslations() {
  try {
    const { data: stats, error } = await supabase
      .from('lesson_scripts')
      .select('english_lesson_script, french_lesson_script, spanish_lesson_script, german_lesson_script, mandarin_lesson_script, hindi_lesson_script')
      .not('english_lesson_script', 'is', null);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const total = stats.length;
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`\n🕐 ${timestamp} - Translation Progress Report`);
    console.log(`📊 Total records with English scripts: ${total}`);
    console.log(`\n📈 Progress by Language:`);
    
    const languages = [
      { name: 'French', column: 'french_lesson_script', flag: '🇫🇷' },
      { name: 'Spanish', column: 'spanish_lesson_script', flag: '🇪🇸' },
      { name: 'German', column: 'german_lesson_script', flag: '🇩🇪' },
      { name: 'Mandarin', column: 'mandarin_lesson_script', flag: '🇨🇳' },
      { name: 'Hindi', column: 'hindi_lesson_script', flag: '🇮🇳' }
    ];
    
    let allComplete = true;
    
    for (const lang of languages) {
      const translated = stats.filter(record => record[lang.column] !== null).length;
      const pending = total - translated;
      const progress = ((translated / total) * 100).toFixed(1);
      
      const status = translated === total ? '✅' : '⏳';
      console.log(`   ${lang.flag} ${lang.name}: ${status} ${progress}% (${translated}/${total}) - ${pending} pending`);
      
      if (translated < total) {
        allComplete = false;
      }
    }
    
    if (allComplete) {
      console.log(`\n🎉 ALL TRANSLATIONS COMPLETE! 🎉`);
      console.log(`✅ All ${total} records have been translated to French, Spanish, and German`);
    } else {
      console.log(`\n⏳ Translations in progress...`);
    }
    
    // Show some sample translations
    console.log(`\n📄 Sample Translations:`);
    const sampleRecord = stats.find(record => 
      record.french_lesson_script && 
      record.spanish_lesson_script && 
      record.german_lesson_script &&
      record.mandarin_lesson_script &&
      record.hindi_lesson_script
    );
    
    if (sampleRecord) {
      console.log(`\n🇺🇸 English:`);
      console.log(sampleRecord.english_lesson_script.substring(0, 100) + '...');
      console.log(`\n🇫🇷 French:`);
      console.log(sampleRecord.french_lesson_script.substring(0, 100) + '...');
      console.log(`\n🇪🇸 Spanish:`);
      console.log(sampleRecord.spanish_lesson_script.substring(0, 100) + '...');
      console.log(`\n🇩🇪 German:`);
      console.log(sampleRecord.german_lesson_script.substring(0, 100) + '...');
      console.log(`\n🇨🇳 Mandarin:`);
      console.log(sampleRecord.mandarin_lesson_script.substring(0, 100) + '...');
      console.log(`\n🇮🇳 Hindi:`);
      console.log(sampleRecord.hindi_lesson_script.substring(0, 100) + '...');
    }

  } catch (error) {
    console.error('❌ Error monitoring translations:', error);
  }
}

// Run the monitoring
monitorTranslations();
