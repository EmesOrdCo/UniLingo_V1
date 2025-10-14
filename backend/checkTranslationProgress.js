const { supabase } = require('./supabaseClient');
const path = require('path');

// Load environment variables from parent directory .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Simple script to check translation progress
 */
async function checkProgress() {
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
    const progress = ((translated / total) * 100).toFixed(1);

    console.log(`📊 Translation Progress: ${progress}% (${translated}/${total})`);
    console.log(`   ✅ Translated: ${translated}`);
    console.log(`   ⏳ Pending: ${pending}`);
    
    if (translated > 0) {
      console.log(`\n🎉 Translation is progressing!`);
    } else {
      console.log(`\n⏳ Translation hasn't started yet or is in progress...`);
    }

  } catch (error) {
    console.error('❌ Error checking progress:', error);
  }
}

// Run the check
checkProgress();
