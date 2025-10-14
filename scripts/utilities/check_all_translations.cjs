const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAllTranslations() {
  try {
    console.log('🔍 Checking All Translation Keywords in subject_words Table\n');
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
    
    // Check the main english_translation column
    const { count: englishCount, error: englishError } = await supabase
      .from('subject_words')
      .select('*', { count: 'exact', head: true })
      .not('english_translation', 'is', null);
    
    if (englishError) {
      console.error('❌ Error checking english_translation:', englishError);
    }
    
    console.log('📈 KEYWORD TRANSLATION STATUS:\n');
    console.log(`English Translation (english_translation):`);
    console.log(`   Filled: ${englishCount || 0}/${totalCount}`);
    console.log(`   Missing: ${totalCount - (englishCount || 0)}`);
    console.log(`   Status: ${englishCount === totalCount ? '✅ Complete' : '⚠️ Incomplete'}\n`);
    
    // Check each translation column
    const translationColumns = [
      { name: 'French', field: 'french_translation' },
      { name: 'Spanish', field: 'spanish_translation' },
      { name: 'German', field: 'german_translation' },
      { name: 'Hindi', field: 'hindi_translation' },
      { name: 'Mandarin', field: 'mandarin_translation' }
    ];
    
    const results = {};
    
    for (const col of translationColumns) {
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
      
      results[col.name] = {
        filled: filledCount,
        missing: missingCount,
        percentage: percentage
      };
      
      console.log(`${col.name} Keyword Translation (${col.field}):`);
      console.log(`   Filled: ${filledCount}/${totalCount} (${percentage}%)`);
      console.log(`   Missing: ${missingCount}`);
      console.log(`   Status: ${missingCount === 0 ? '✅ Complete' : '⚠️ Incomplete'}\n`);
    }
    
    // Find entries with missing translations
    const { data: allEntries, error: allError } = await supabase
      .from('subject_words')
      .select('id, english_translation, french_translation, spanish_translation, german_translation, hindi_translation, mandarin_translation, subject')
      .limit(10000);
    
    if (allError) {
      console.error('❌ Error fetching all entries:', allError);
      return;
    }
    
    // Analyze completeness
    let fullyComplete = 0;
    let partiallyComplete = 0;
    let noEnglish = 0;
    const incompleteEntries = [];
    
    allEntries.forEach(entry => {
      const hasEnglish = !!entry.english_translation;
      const hasFrench = !!entry.french_translation;
      const hasSpanish = !!entry.spanish_translation;
      const hasGerman = !!entry.german_translation;
      const hasHindi = !!entry.hindi_translation;
      const hasMandarin = !!entry.mandarin_translation;
      
      if (!hasEnglish) {
        noEnglish++;
        incompleteEntries.push({
          id: entry.id,
          word: entry.english_translation || '[NO ENGLISH]',
          subject: entry.subject,
          missing: ['English (and possibly all)']
        });
      } else {
        const allLanguages = hasFrench && hasSpanish && hasGerman && hasHindi && hasMandarin;
        
        if (allLanguages) {
          fullyComplete++;
        } else {
          partiallyComplete++;
          const missing = [];
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
        }
      }
    });
    
    console.log('============================================================\n');
    console.log('📊 OVERALL KEYWORD TRANSLATION SUMMARY:\n');
    console.log(`✅ Fully Complete (all 6 languages): ${fullyComplete}/${totalCount} (${((fullyComplete/totalCount)*100).toFixed(2)}%)`);
    console.log(`⚠️  Has English but missing others: ${partiallyComplete}/${totalCount} (${((partiallyComplete/totalCount)*100).toFixed(2)}%)`);
    console.log(`❌ Missing English translation: ${noEnglish}/${totalCount} (${((noEnglish/totalCount)*100).toFixed(2)}%)`);
    
    if (incompleteEntries.length > 0) {
      console.log(`\n⚠️  INCOMPLETE ENTRIES: ${incompleteEntries.length}\n`);
      
      // Show first 30 incomplete entries
      const showCount = Math.min(30, incompleteEntries.length);
      console.log(`Showing first ${showCount} incomplete entries:\n`);
      
      incompleteEntries.slice(0, showCount).forEach((entry, index) => {
        console.log(`${index + 1}. ID ${entry.id}: "${entry.word}" (${entry.subject})`);
        console.log(`   Missing: ${entry.missing.join(', ')}`);
      });
      
      if (incompleteEntries.length > showCount) {
        console.log(`\n... and ${incompleteEntries.length - showCount} more incomplete entries`);
      }
      
      // Group by what's missing
      console.log('\n📊 MISSING TRANSLATIONS BREAKDOWN:\n');
      const missingByLanguage = {
        'French': 0,
        'Spanish': 0,
        'German': 0,
        'Hindi': 0,
        'Mandarin': 0,
        'English': 0
      };
      
      incompleteEntries.forEach(entry => {
        entry.missing.forEach(lang => {
          if (lang in missingByLanguage) {
            missingByLanguage[lang]++;
          } else if (lang.includes('English')) {
            missingByLanguage['English']++;
          }
        });
      });
      
      Object.entries(missingByLanguage).forEach(([lang, count]) => {
        if (count > 0) {
          console.log(`   ${lang}: ${count} entries missing`);
        }
      });
      
    } else {
      console.log('\n🎉 ALL KEYWORD TRANSLATIONS ARE COMPLETE! 🎉\n');
    }
    
    console.log('\n============================================================\n');
    
    // Sample some entries to show what the data looks like
    const { data: sampleEntries, error: sampleError } = await supabase
      .from('subject_words')
      .select('id, english_translation, french_translation, spanish_translation, german_translation, hindi_translation, mandarin_translation, subject')
      .not('french_translation', 'is', null)
      .limit(5);
    
    if (!sampleError && sampleEntries.length > 0) {
      console.log('📝 SAMPLE ENTRIES (showing keyword translations):\n');
      sampleEntries.forEach((entry, index) => {
        console.log(`${index + 1}. "${entry.english_translation}" (${entry.subject})`);
        console.log(`   🇫🇷 French: ${entry.french_translation || 'N/A'}`);
        console.log(`   🇪🇸 Spanish: ${entry.spanish_translation || 'N/A'}`);
        console.log(`   🇩🇪 German: ${entry.german_translation || 'N/A'}`);
        console.log(`   🇮🇳 Hindi: ${entry.hindi_translation || 'N/A'}`);
        console.log(`   🇨🇳 Mandarin: ${entry.mandarin_translation || 'N/A'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllTranslations();
