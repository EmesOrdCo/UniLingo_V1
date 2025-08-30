// =====================================================
// QUICK TEST: Weekly Progress Status
// =====================================================
// This script quickly checks if weekly progress is working

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function quickTest() {
  console.log('🔍 Quick Weekly Progress Test...\n');

  try {
    // Check if user_activities has data
    console.log('1️⃣ Checking user_activities data...');
    const { data: activities, error } = await supabase
      .from('user_activities')
      .select('activity_type, completed_at, score')
      .order('completed_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log(`✅ Found ${activities?.length || 0} activities`);
    
    if (activities && activities.length > 0) {
      console.log('📊 Recent activities:');
      activities.slice(0, 3).forEach((activity, index) => {
        const date = new Date(activity.completed_at).toLocaleDateString();
        console.log(`   ${index + 1}. ${activity.activity_type} on ${date} (score: ${activity.score})`);
      });
    }

    // Test get_daily_progress function
    console.log('\n2️⃣ Testing get_daily_progress function...');
    const today = new Date().toISOString().split('T')[0];
    const { data: todayData, error: functionError } = await supabase
      .rpc('get_daily_progress', { user_uuid: 'test-user', target_date: today });

    if (functionError) {
      console.log('❌ Function error:', functionError.message);
      return;
    }

    if (todayData) {
      const parsed = JSON.parse(todayData);
      console.log('✅ Function works! Today\'s data:');
      console.log(`   📚 Lessons: ${parsed.lessons_completed}`);
      console.log(`   📝 Flashcards: ${parsed.flashcards_reviewed}`);
      console.log(`   🎮 Games: ${parsed.games_played}`);
      console.log(`   ⏱️  Study time: ${parsed.total_study_time_minutes} min`);
    } else {
      console.log('ℹ️  No data for today (expected if no activities today)');
    }

    // Check weekly data
    console.log('\n3️⃣ Checking weekly data...');
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

    const totalLessons = weeklyData.reduce((sum, day) => sum + (day.lessons_completed || 0), 0);
    const totalStudyTime = weeklyData.reduce((sum, day) => sum + (day.total_study_time_minutes || 0), 0);
    const activeDays = weeklyData.filter(day => 
      (day.lessons_completed || 0) + (day.flashcards_reviewed || 0) + (day.games_played || 0) > 0
    ).length;

    console.log('📊 Weekly Summary:');
    console.log(`   📚 Total Lessons: ${totalLessons}`);
    console.log(`   ⏱️  Total Study Time: ${totalStudyTime} minutes`);
    console.log(`   📅 Active Days: ${activeDays}/7`);

    // Show what the dashboard should display
    console.log('\n4️⃣ Dashboard Display:');
    const displayValue = totalLessons > 0 ? `${totalLessons} lessons` : 'No data yet';
    const displaySubtext = totalLessons > 0 ? 
      `${totalStudyTime} min studied • ${activeDays} active days` : 
      'Start studying to see progress!';

    console.log(`   Main: "${displayValue}"`);
    console.log(`   Subtext: "${displaySubtext}"`);

    console.log('\n✅ Test completed! If you see data above, the Weekly Summary should work.');
    console.log('💡 If you see "No data yet", complete some activities first.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickTest();
