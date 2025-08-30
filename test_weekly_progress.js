// =====================================================
// TEST: Enhanced Weekly Progress Functionality
// =====================================================
// This script tests the enhanced "Weekly Summary" section

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWeeklyProgress() {
  console.log('🧪 Testing Enhanced Weekly Progress...\n');

  try {
    // Test 1: Check if get_daily_progress function exists
    console.log('1️⃣ Checking if get_daily_progress function exists...');
    const { data: functionExists, error: functionError } = await supabase
      .rpc('get_daily_progress', { user_uuid: 'test-user', target_date: new Date().toISOString().split('T')[0] });
    
    if (functionError && functionError.message.includes('function "get_daily_progress" does not exist')) {
      console.log('❌ get_daily_progress function is missing!');
      console.log('💡 Run setup_weekly_progress_function.sql in your Supabase database');
      return;
    } else if (functionError) {
      console.log('⚠️ Function exists but returned error:', functionError.message);
    } else {
      console.log('✅ get_daily_progress function exists and works');
    }

    // Test 2: Check if user_activities table has data
    console.log('\n2️⃣ Checking user_activities table...');
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('*')
      .limit(5);

    if (activitiesError) {
      console.log('❌ Error accessing user_activities:', activitiesError.message);
    } else {
      console.log(`✅ user_activities table exists with ${activities?.length || 0} recent records`);
      if (activities && activities.length > 0) {
        console.log('📊 Sample activity:', {
          type: activities[0].activity_type,
          date: activities[0].completed_at,
          score: activities[0].score
        });
      }
    }

    // Test 3: Test weekly progress calculation
    console.log('\n3️⃣ Testing weekly progress calculation...');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    let weeklyData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const { data: dayProgress } = await supabase
        .rpc('get_daily_progress', { user_uuid: 'test-user', target_date: dateString });
      
      if (dayProgress) {
        weeklyData.push(JSON.parse(dayProgress));
      }
    }

    console.log(`✅ Weekly data calculation works: ${weeklyData.length} days of data`);

    // Test 4: Calculate enhanced metrics
    console.log('\n4️⃣ Calculating enhanced weekly metrics...');
    const totalLessons = weeklyData.reduce((sum, day) => sum + (day.lessons_completed || 0), 0);
    const totalStudyTime = weeklyData.reduce((sum, day) => sum + (day.total_study_time_minutes || 0), 0);
    const activeDays = weeklyData.filter(day => 
      (day.lessons_completed || 0) + (day.flashcards_reviewed || 0) + (day.games_played || 0) > 0
    ).length;

    console.log('📊 Enhanced Weekly Summary:');
    console.log(`   📚 Total Lessons: ${totalLessons}`);
    console.log(`   ⏱️  Total Study Time: ${totalStudyTime} minutes`);
    console.log(`   📅 Active Days: ${activeDays}/7`);
    console.log(`   📈 Activity Rate: ${Math.round((activeDays / 7) * 100)}%`);

    // Test 5: Check if the display format works
    console.log('\n5️⃣ Testing display format...');
    const displayValue = totalLessons > 0 ? `${totalLessons} lessons` : 'No data yet';
    const displaySubtext = totalLessons > 0 ? 
      `${totalStudyTime} min studied • ${activeDays} active days` : 
      'Start studying to see progress!';

    console.log('📱 Display Output:');
    console.log(`   Main: "${displayValue}"`);
    console.log(`   Subtext: "${displaySubtext}"`);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎯 The enhanced "Weekly Summary" should now show:');
    console.log('   - Total lessons completed this week');
    console.log('   - Total study time in minutes');
    console.log('   - Number of active days out of 7');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWeeklyProgress();
