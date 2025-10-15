const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function comprehensiveVerification() {
  try {
    console.log('🔍 COMPREHENSIVE VERIFICATION OF SUBJECT_WORDS TABLE\n');
    console.log('============================================================\n');
    
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('subject_words')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error getting total count:', countError);
      return;
    }
    
    console.log(`📊 Total Entries: ${totalCount}\n`);
    console.log('============================================================\n');
    
    // Define all columns to check
    const columns = [
      // Keyword translations
      { name: 'English Keyword', field: 'english_translation', type: 'keyword' },
      { name: 'French Keyword', field: 'french_translation', type: 'keyword' },
      { name: 'Spanish Keyword', field: 'spanish_translation', type: 'keyword' },
      { name: 'German Keyword', field: 'german_translation', type: 'keyword' },
      { name: 'Hindi Keyword', field: 'hindi_translation', type: 'keyword' },
      { name: 'Chinese (Simplified) Keyword', field: 'chinese_simplified_translation', type: 'keyword' },
      // Example sentences
      { name: 'English Example', field: 'example_sentence_english', type: 'example' },
      { name: 'French Example', field: 'example_sentence_french', type: 'example' },
      { name: 'Spanish Example', field: 'example_sentence_spanish', type: 'example' },
      { name: 'German Example', field: 'example_sentence_german', type: 'example' },
      { name: 'Hindi Example', field: 'example_sentence_hindi', type: 'example' },
      { name: 'Chinese (Simplified) Example', field: 'example_sentence_chinese_simplified', type: 'example' },
    ];
    
    const results = {};
    let allComplete = true;
    
    // Check each column
    console.log('📋 CHECKING ALL COLUMNS...\n');
    
    for (const col of columns) {
      const { count: filledCount, error } = await supabase
        .from('subject_words')
        .select('*', { count: 'exact', head: true })
        .not(col.field, 'is', null);
      
      if (error) {
        console.error(`❌ Error checking ${col.name}:`, error);
        continue;
      }
      
      const missingCount = totalCount - filledCount;
      const percentage = ((filledCount / totalCount) * 100).toFixed(2);
      const isComplete = missingCount === 0;
      
      if (!isComplete) allComplete = false;
      
      results[col.name] = {
        filled: filledCount,
        missing: missingCount,
        percentage: percentage,
        complete: isComplete
      };
    }
    
    // Display results grouped by type
    console.log('🗣️  KEYWORD TRANSLATIONS:\n');
    columns.filter(c => c.type === 'keyword').forEach(col => {
      const r = results[col.name];
      const status = r.complete ? '✅' : '❌';
      console.log(`${status} ${col.name}: ${r.filled}/${totalCount} (${r.percentage}%) - ${r.missing} missing`);
    });
    
    console.log('\n📝 EXAMPLE SENTENCES:\n');
    columns.filter(c => c.type === 'example').forEach(col => {
      const r = results[col.name];
      const status = r.complete ? '✅' : '❌';
      console.log(`${status} ${col.name}: ${r.filled}/${totalCount} (${r.percentage}%) - ${r.missing} missing`);
    });
    
    console.log('\n============================================================\n');
    
    // Overall summary
    const keywordComplete = columns.filter(c => c.type === 'keyword').every(c => results[c.name].complete);
    const exampleComplete = columns.filter(c => c.type === 'example').every(c => results[c.name].complete);
    
    console.log('📊 OVERALL STATUS:\n');
    console.log(`Keyword Translations: ${keywordComplete ? '✅ 100% COMPLETE' : '❌ INCOMPLETE'}`);
    console.log(`Example Sentences: ${exampleComplete ? '✅ 100% COMPLETE' : '❌ INCOMPLETE'}`);
    console.log(`\nFull Table Status: ${allComplete ? '🎉 100% COMPLETE!' : '⚠️  INCOMPLETE'}\n`);
    
    if (allComplete) {
      console.log('============================================================\n');
      console.log('🎉 CONGRATULATIONS! 🎉\n');
      console.log('Every single entry in the subject_words table is filled!');
      console.log(`\nTotal data points: ${totalCount * 12} (${totalCount} entries × 12 fields)`);
      console.log('  • 6 keyword translations per entry');
      console.log('  • 6 example sentences per entry\n');
      console.log('Your multilingual vocabulary database is COMPLETE! 🌍✨\n');
      console.log('============================================================\n');
    } else {
      // Find and show incomplete entries
      console.log('\n⚠️  FINDING INCOMPLETE ENTRIES...\n');
      
      const { data: allEntries, error: allError } = await supabase
        .from('subject_words')
        .select('id, english_translation, french_translation, spanish_translation, german_translation, hindi_translation, chinese_simplified_translation, example_sentence_english, example_sentence_french, example_sentence_spanish, example_sentence_german, example_sentence_hindi, example_sentence_chinese_simplified, subject')
        .limit(10000);
      
      if (!allError) {
        const incomplete = allEntries.filter(entry => {
          return !entry.english_translation ||
                 !entry.french_translation ||
                 !entry.spanish_translation ||
                 !entry.german_translation ||
                 !entry.hindi_translation ||
                 !entry.chinese_simplified_translation ||
                 !entry.example_sentence_english ||
                 !entry.example_sentence_french ||
                 !entry.example_sentence_spanish ||
                 !entry.example_sentence_german ||
                 !entry.example_sentence_hindi ||
                 !entry.example_sentence_chinese_simplified;
        });
        
        if (incomplete.length > 0) {
          console.log(`Found ${incomplete.length} incomplete entries:\n`);
          incomplete.slice(0, 10).forEach((entry, idx) => {
            const missing = [];
            if (!entry.english_translation) missing.push('English keyword');
            if (!entry.french_translation) missing.push('French keyword');
            if (!entry.spanish_translation) missing.push('Spanish keyword');
            if (!entry.german_translation) missing.push('German keyword');
            if (!entry.hindi_translation) missing.push('Hindi keyword');
            if (!entry.chinese_simplified_translation) missing.push('Chinese (Simplified) keyword');
            if (!entry.example_sentence_english) missing.push('English example');
            if (!entry.example_sentence_french) missing.push('French example');
            if (!entry.example_sentence_spanish) missing.push('Spanish example');
            if (!entry.example_sentence_german) missing.push('German example');
            if (!entry.example_sentence_hindi) missing.push('Hindi example');
            if (!entry.example_sentence_chinese_simplified) missing.push('Chinese (Simplified) example');
            
            console.log(`${idx + 1}. ID ${entry.id}: "${entry.english_translation || 'N/A'}" (${entry.subject})`);
            console.log(`   Missing: ${missing.join(', ')}\n`);
          });
          
          if (incomplete.length > 10) {
            console.log(`... and ${incomplete.length - 10} more incomplete entries\n`);
          }
        }
      }
    }
    
    // Show some sample complete entries
    console.log('📚 SAMPLE COMPLETE ENTRIES:\n');
    const { data: samples, error: sampleError } = await supabase
      .from('subject_words')
      .select('id, english_translation, french_translation, spanish_translation, german_translation, example_sentence_english, subject')
      .limit(3);
    
    if (!sampleError && samples) {
      samples.forEach((entry, idx) => {
        console.log(`${idx + 1}. "${entry.english_translation}" (${entry.subject})`);
        console.log(`   Keywords: FR: ${entry.french_translation} | ES: ${entry.spanish_translation} | DE: ${entry.german_translation}`);
        console.log(`   Example: "${entry.example_sentence_english}"`);
        console.log('');
      });
    }
    
    console.log('============================================================\n');
    
  } catch (error) {
    console.error('❌ Fatal Error:', error);
  }
}

comprehensiveVerification();
