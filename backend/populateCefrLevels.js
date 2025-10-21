const { supabase } = require('./supabaseClient');
const fs = require('fs');
const path = require('path');

async function populateCefrSubLevels() {
  try {
    console.log('🚀 Starting CEFR sub-level population...');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, '..', 'SubLevels.csv.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV data
    const lines = csvContent.split('\n').filter(line => line.trim());
    const mappings = {};
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const [subject_name, sub_cefr_level] = lines[i].split(',');
      if (subject_name && sub_cefr_level) {
        mappings[subject_name.trim()] = sub_cefr_level.trim();
      }
    }
    
    console.log(`📄 Loaded ${Object.keys(mappings).length} CEFR mappings from CSV`);
    
    // Get all lesson_scripts records
    const { data: lessons, error: fetchError } = await supabase
      .from('lesson_scripts')
      .select('id, subject_name, cefr_sub_level');
    
    if (fetchError) {
      console.error('❌ Error fetching lesson_scripts:', fetchError);
      return;
    }
    
    console.log(`📚 Found ${lessons.length} lesson scripts to update`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Update each lesson script
    for (const lesson of lessons) {
      const cefrLevel = mappings[lesson.subject_name];
      
      if (cefrLevel) {
        const { error: updateError } = await supabase
          .from('lesson_scripts')
          .update({ cefr_sub_level: cefrLevel })
          .eq('id', lesson.id);
        
        if (updateError) {
          console.error(`❌ Error updating ${lesson.subject_name}:`, updateError);
        } else {
          console.log(`✅ Updated: ${lesson.subject_name} → ${cefrLevel}`);
          updatedCount++;
        }
      } else {
        console.log(`⏭️  Skipped: ${lesson.subject_name} (no mapping found)`);
        skippedCount++;
      }
    }
    
    console.log('\n🎉 CEFR sub-level population completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} lessons`);
    console.log(`   ⏭️  Skipped: ${skippedCount} lessons`);
    
    // Show summary by CEFR level
    const { data: summary, error: summaryError } = await supabase
      .from('lesson_scripts')
      .select('cefr_sub_level')
      .not('cefr_sub_level', 'is', null);
    
    if (!summaryError && summary) {
      const levelCounts = {};
      summary.forEach(lesson => {
        levelCounts[lesson.cefr_sub_level] = (levelCounts[lesson.cefr_sub_level] || 0) + 1;
      });
      
      console.log('\n📈 Summary by CEFR level:');
      Object.entries(levelCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([level, count]) => {
          console.log(`   ${level}: ${count} lessons`);
        });
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the population
populateCefrSubLevels();