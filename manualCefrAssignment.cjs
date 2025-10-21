const { supabase } = require('./backend/supabaseClient');

async function manualCefrAssignment() {
  try {
    console.log('🔍 Finding lessons without CEFR assignments...\n');
    
    // Get all lesson_scripts records where cefr_sub_level is NULL
    const { data: lessons, error } = await supabase
      .from('lesson_scripts')
      .select('id, subject_name, cefr_sub_level')
      .is('cefr_sub_level', null)
      .order('subject_name');
    
    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }
    
    if (lessons.length === 0) {
      console.log('✅ All lessons already have CEFR assignments!');
      return;
    }
    
    console.log(`📋 Found ${lessons.length} lessons without CEFR assignments:\n`);
    
    // Show all lessons with numbers
    lessons.forEach((lesson, index) => {
      console.log(`${index + 1}. "${lesson.subject_name}"`);
    });
    
    console.log('\n📝 MANUAL ASSIGNMENTS - Edit the assignments object below:');
    console.log('💡 Format: lessonNumber: \'CEFR_LEVEL\' or \'skip\'');
    console.log('💡 Valid CEFR levels: A1.1, A1.2, A2.1-A2.20, B1.1-B1.20, B2.1-B2.20, C1.1-C1.20, C2.1-C2.20\n');
    
    // MANUAL ASSIGNMENTS - EDIT THIS OBJECT
    const assignments = {
      1: 'B1.4',    // "Bigger, Better, Faster"
      2: 'C1.5',    // "Boss, Buddy, or Hero?"
      3: 'A2.9',    // "buying a house "
      4: 'C1.4',    // "Decisions, Decisions"
      5: 'B1.8',    // "Favorite Sports 2 "
      6: 'A2.13',   // "first day of school 2 "
      7: 'B1.5',    // "Getting Bad News 2 "
      8: 'B1.5',    // "good or bad ideas "
      9: 'B2.3',    // "Have You Heard Yet? "
      10: 'B2.2',   // "holding It Together 2 "
      11: 'C1.3',   // "how much or how little?"
      12: 'C1.2',   // "Left, Right, and Otherwise"
      13: 'C1.1',   // "Lights, Camera, Action!"
      14: 'A2.5',   // "Nationalities 2 "
      15: 'B1.4',   // "Rules, Risks, and Rewards"
      16: 'B2.2',   // "Strong Feelings, Big Reactions"
      17: 'B1.6'    // "When Wars Break Out 2 "
    };
    
    console.log('Current assignments:');
    Object.entries(assignments).forEach(([num, level]) => {
      const lesson = lessons[parseInt(num) - 1];
      console.log(`${num}. "${lesson.subject_name}" → ${level}`);
    });
    
    console.log('\n🔄 Applying assignments...\n');
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const [lessonNum, cefrLevel] of Object.entries(assignments)) {
      const lessonIndex = parseInt(lessonNum) - 1;
      const lesson = lessons[lessonIndex];
      
      if (!lesson) {
        console.log(`❌ Lesson ${lessonNum} not found`);
        continue;
      }
      
      if (cefrLevel.toLowerCase() === 'skip') {
        console.log(`⏭️  Skipped: "${lesson.subject_name}"`);
        skippedCount++;
        continue;
      }
      
      // Validate CEFR level format
      const cefrPattern = /^[ABC][12]\.\d{1,2}$/;
      if (!cefrPattern.test(cefrLevel)) {
        console.log(`❌ Invalid CEFR format for "${lesson.subject_name}": ${cefrLevel}`);
        continue;
      }
      
      // Update the lesson
      const { error: updateError } = await supabase
        .from('lesson_scripts')
        .update({ cefr_sub_level: cefrLevel })
        .eq('id', lesson.id);
      
      if (updateError) {
        console.error(`❌ Error updating "${lesson.subject_name}":`, updateError);
      } else {
        console.log(`✅ Updated: "${lesson.subject_name}" → ${cefrLevel}`);
        updatedCount++;
      }
    }
    
    console.log('\n🎉 Manual CEFR assignment completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} lessons`);
    console.log(`   ⏭️  Skipped: ${skippedCount} lessons`);
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the manual assignment
manualCefrAssignment();