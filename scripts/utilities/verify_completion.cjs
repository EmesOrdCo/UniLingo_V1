const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyCompletion() {
  try {
    console.log('🔍 Verifying Example Sentence Completion\n');
    console.log('============================================================\n');
    
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('subject_words')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error getting total count:', countError);
      return;
    }
    
    console.log(`📊 Total entries in subject_words table: ${totalCount}\n`);
    
    // Check each language field
    const languages = [
      { name: 'English', field: 'example_sentence_english' },
      { name: 'French', field: 'example_sentence_french' },
      { name: 'Spanish', field: 'example_sentence_spanish' },
      { name: 'German', field: 'example_sentence_german' },
      { name: 'Hindi', field: 'example_sentence_hindi' },
      { name: 'Chinese (Simplified)', field: 'example_sentence_chinese_simplified' }
    ];
    
    const results = {};
    
    for (const lang of languages) {
      // Count non-null entries
      const { count: filledCount, error } = await supabase
        .from('subject_words')
        .select('*', { count: 'exact', head: true })
        .not(lang.field, 'is', null);
      
      if (error) {
        console.error(`❌ Error checking ${lang.name}:`, error);
        continue;
      }
      
      const missingCount = totalCount - filledCount;
      const percentage = ((filledCount / totalCount) * 100).toFixed(2);
      
      results[lang.name] = {
        filled: filledCount,
        missing: missingCount,
        percentage: percentage
      };
    }
    
    // Display results
    console.log('📈 COMPLETION STATUS BY LANGUAGE:\n');
    
    for (const [langName, data] of Object.entries(results)) {
      const status = data.missing === 0 ? '✅' : '⚠️';
      console.log(`${status} ${langName}:`);
      console.log(`   Filled: ${data.filled}/${totalCount} (${data.percentage}%)`);
      console.log(`   Missing: ${data.missing}`);
      console.log('');
    }
    
    // Check for entries missing ANY translation
    const { data: allEntries, error: allError } = await supabase
      .from('subject_words')
      .select('id, english_translation, subject, example_sentence_english, example_sentence_french, example_sentence_spanish, example_sentence_german, example_sentence_hindi, example_sentence_chinese_simplified');
    
    if (allError) {
      console.error('❌ Error fetching all entries:', allError);
      return;
    }
    
    // Analyze completeness
    let fullyComplete = 0;
    let partiallyComplete = 0;
    let empty = 0;
    const incompleteEntries = [];
    
    allEntries.forEach(entry => {
      const hasEnglish = !!entry.example_sentence_english;
      const hasFrench = !!entry.example_sentence_french;
      const hasSpanish = !!entry.example_sentence_spanish;
      const hasGerman = !!entry.example_sentence_german;
      const hasHindi = !!entry.example_sentence_hindi;
      const hasMandarin = !!entry.example_sentence_chinese_simplified;
      
      const allLanguages = hasEnglish && hasFrench && hasSpanish && hasGerman && hasHindi && hasMandarin;
      const someLanguages = hasEnglish || hasFrench || hasSpanish || hasGerman || hasHindi || hasMandarin;
      
      if (allLanguages) {
        fullyComplete++;
      } else if (someLanguages) {
        partiallyComplete++;
        const missing = [];
        if (!hasEnglish) missing.push('English');
        if (!hasFrench) missing.push('French');
        if (!hasSpanish) missing.push('Spanish');
        if (!hasGerman) missing.push('German');
        if (!hasHindi) missing.push('Hindi');
        if (!hasMandarin) missing.push('Mandarin');
        
        incompleteEntries.push({
          id: entry.id,
          word: entry.english_translation,
          subject: entry.subject,
          missing: missing
        });
      } else {
        empty++;
        incompleteEntries.push({
          id: entry.id,
          word: entry.english_translation,
          subject: entry.subject,
          missing: ['All languages']
        });
      }
    });
    
    console.log('============================================================\n');
    console.log('📊 OVERALL COMPLETION SUMMARY:\n');
    console.log(`✅ Fully Complete (all 6 languages): ${fullyComplete}/${totalCount} (${((fullyComplete/totalCount)*100).toFixed(2)}%)`);
    console.log(`⚠️  Partially Complete: ${partiallyComplete}/${totalCount} (${((partiallyComplete/totalCount)*100).toFixed(2)}%)`);
    console.log(`❌ Empty (no languages): ${empty}/${totalCount} (${((empty/totalCount)*100).toFixed(2)}%)`);
    
    if (incompleteEntries.length > 0) {
      console.log(`\n⚠️  INCOMPLETE ENTRIES: ${incompleteEntries.length}\n`);
      
      // Show first 20 incomplete entries
      const showCount = Math.min(20, incompleteEntries.length);
      console.log(`Showing first ${showCount} incomplete entries:\n`);
      
      incompleteEntries.slice(0, showCount).forEach((entry, index) => {
        console.log(`${index + 1}. "${entry.word}" (${entry.subject})`);
        console.log(`   ID: ${entry.id}`);
        console.log(`   Missing: ${entry.missing.join(', ')}`);
        console.log('');
      });
      
      if (incompleteEntries.length > showCount) {
        console.log(`... and ${incompleteEntries.length - showCount} more incomplete entries\n`);
      }
    } else {
      console.log('\n🎉 ALL ENTRIES ARE FULLY COMPLETE! 🎉\n');
    }
    
    console.log('============================================================\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyCompletion();
