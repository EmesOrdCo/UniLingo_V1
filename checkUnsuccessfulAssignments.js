const { supabase } = require('./backend/supabaseClient');

async function getUnsuccessfulAssignments() {
  try {
    console.log('🔍 Finding unsuccessful CEFR assignments...\n');
    
    // Get all lesson_scripts records where cefr_sub_level is NULL
    const { data: lessons, error } = await supabase
      .from('lesson_scripts')
      .select('subject_name, cefr_sub_level')
      .is('cefr_sub_level', null)
      .order('subject_name');
    
    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }
    
    console.log(`📋 Found ${lessons.length} lessons without CEFR assignments:\n`);
    
    lessons.forEach((lesson, index) => {
      console.log(`${index + 1}. "${lesson.subject_name}"`);
    });
    
    console.log(`\n📊 Total: ${lessons.length} unsuccessful assignments`);
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run the check
getUnsuccessfulAssignments();
