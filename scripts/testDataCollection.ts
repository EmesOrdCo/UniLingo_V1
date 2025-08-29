import { supabase } from '../src/lib/supabase';

/**
 * Test script to verify data collection is working
 * Run with: npx ts-node scripts/testDataCollection.ts
 */

async function testDataCollection() {
  console.log('🧪 Testing Data Collection...\n');

  try {
    // Test 1: Check if tables exist
    console.log('📋 Checking table existence...');
    
    const tables = [
      'exercise_performance',
      'vocabulary_progress', 
      'learning_sessions',
      'skill_metrics'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Table exists`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err}`);
      }
    }

    // Test 2: Check lesson_progress table
    console.log('\n📊 Checking lesson_progress table...');
    const { data: progressData, error: progressError } = await supabase
      .from('lesson_progress')
      .select('*')
      .limit(5);

    if (progressError) {
      console.log(`❌ lesson_progress error: ${progressError.message}`);
    } else {
      console.log(`✅ lesson_progress: ${progressData?.length || 0} records found`);
      if (progressData && progressData.length > 0) {
        console.log('   Sample record:', {
          id: progressData[0].id,
          user_id: progressData[0].user_id,
          lesson_id: progressData[0].lesson_id,
          exercises_completed: progressData[0].exercises_completed,
          total_score: progressData[0].total_score
        });
      }
    }

    // Test 3: Check esp_lessons table
    console.log('\n📚 Checking esp_lessons table...');
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('esp_lessons')
      .select('*')
      .limit(5);

    if (lessonsError) {
      console.log(`❌ esp_lessons error: ${lessonsError.message}`);
    } else {
      console.log(`✅ esp_lessons: ${lessonsData?.length || 0} records found`);
      if (lessonsData && lessonsData.length > 0) {
        console.log('   Sample record:', {
          id: lessonsData[0].id,
          title: lessonsData[0].title,
          subject: lessonsData[0].subject
        });
      }
    }

    // Test 4: Check lesson_vocabulary table
    console.log('\n🔤 Checking lesson_vocabulary table...');
    const { data: vocabData, error: vocabError } = await supabase
      .from('lesson_vocabulary')
      .select('*')
      .limit(5);

    if (vocabError) {
      console.log(`❌ lesson_vocabulary error: ${vocabError.message}`);
    } else {
      console.log(`✅ lesson_vocabulary: ${vocabData?.length || 0} records found`);
      if (vocabData && vocabData.length > 0) {
        console.log('   Sample record:', {
          id: vocabData[0].id,
          english_term: vocabData[0].english_term,
          difficulty_rank: vocabData[0].difficulty_rank
        });
      }
    }

    // Test 5: Check lesson_exercises table
    console.log('\n🎯 Checking lesson_exercises table...');
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('lesson_exercises')
      .select('*')
      .limit(5);

    if (exercisesError) {
      console.log(`❌ lesson_exercises error: ${exercisesError.message}`);
    } else {
      console.log(`✅ lesson_exercises: ${exercisesData?.length || 0} records found`);
      if (exercisesData && exercisesData.length > 0) {
        console.log('   Sample record:', {
          id: exercisesData[0].id,
          exercise_type: exercisesData[0].exercise_type,
          order_index: exercisesData[0].order_index
        });
      }
    }

    console.log('\n🎉 Data collection test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Complete a lesson in the app');
    console.log('2. Check if exercise_performance records are created');
    console.log('3. Check if vocabulary_progress records are created');
    console.log('4. Check if learning_sessions records are created');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDataCollection();



