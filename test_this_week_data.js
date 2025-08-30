const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testThisWeekData() {
  try {
    console.log('🔍 Testing "This Week" data...\n');

    // Get a user ID (you'll need to replace this with an actual user ID)
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log('⚠️ No users found, testing with a sample user ID...');
      // Use a sample user ID for testing
      const sampleUserId = '00000000-0000-0000-0000-000000000000';
      await testWeeklyProgress(sampleUserId);
      return;
    }

    const userId = users[0].id;
    console.log(`👤 Testing with user ID: ${userId}\n`);
    await testWeeklyProgress(userId);

  } catch (error) {
    console.error('❌ Error testing This Week data:', error);
  }
}

async function testWeeklyProgress(userId) {
  try {
    // Test the get_daily_progress function for the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    console.log('📅 Testing last 7 days of data:\n');
    
    const weeklyData = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      console.log(`📊 ${dateString}:`);
      
      const { data: dayProgress, error } = await supabase
        .rpc('get_daily_progress', { user_uuid: userId, target_date: dateString });
      
      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        continue;
      }
      
      if (dayProgress) {
        const parsed = JSON.parse(dayProgress);
        console.log(`  ✅ Data:`, {
          lessons: parsed.lessons_completed,
          flashcards: parsed.flashcards_reviewed,
          games: parsed.games_played,
          studyTime: parsed.total_study_time_minutes,
          totalActivities: parsed.lessons_completed + parsed.flashcards_reviewed + parsed.games_played
        });
        weeklyData.push(parsed);
      } else {
        console.log(`  ⚠️ No data for this date`);
        weeklyData.push({
          date: dateString,
          lessons_completed: 0,
          flashcards_reviewed: 0,
          games_played: 0,
          total_study_time_minutes: 0
        });
      }
    }
    
    // Calculate totals like the frontend does
    console.log('\n📈 Calculated Totals (like frontend):');
    
    const totalActivities = weeklyData.reduce((sum, day) => 
      sum + (Number(day?.lessons_completed) || 0) + (Number(day?.flashcards_reviewed) || 0) + (Number(day?.games_played) || 0), 0
    );
    
    const totalStudyTime = weeklyData.reduce((sum, day) => 
      sum + (Number(day?.total_study_time_minutes) || 0), 0
    );
    
    const activeDays = weeklyData.filter(day => 
      (Number(day?.lessons_completed) || 0) + (Number(day?.flashcards_reviewed) || 0) + (Number(day?.games_played) || 0) > 0
    ).length;
    
    console.log(`  Total Activities: ${totalActivities}`);
    console.log(`  Total Study Time: ${totalStudyTime} minutes`);
    console.log(`  Active Days: ${activeDays}`);
    
    // Check for potential issues
    console.log('\n🔍 Potential Issues:');
    
    if (totalActivities === 0) {
      console.log('  ⚠️ No activities found - this might be correct if user hasn\'t studied');
    }
    
    if (totalStudyTime === 0 && totalActivities > 0) {
      console.log('  ⚠️ Activities found but no study time - this might indicate a data issue');
    }
    
    if (activeDays === 0 && totalActivities > 0) {
      console.log('  ⚠️ Activities found but no active days - this indicates a calculation bug');
    }
    
    // Test raw user_activities data
    console.log('\n🔍 Raw user_activities data for last 7 days:');
    const { data: rawActivities, error: rawError } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', weekAgo.toISOString())
      .order('completed_at', { ascending: false });
    
    if (rawError) {
      console.log(`  ❌ Error fetching raw activities: ${rawError.message}`);
    } else if (rawActivities && rawActivities.length > 0) {
      console.log(`  ✅ Found ${rawActivities.length} activities in user_activities`);
      
      // Group by date
      const activitiesByDate = {};
      rawActivities.forEach(activity => {
        const date = activity.completed_at.split('T')[0];
        if (!activitiesByDate[date]) {
          activitiesByDate[date] = [];
        }
        activitiesByDate[date].push(activity);
      });
      
      Object.keys(activitiesByDate).forEach(date => {
        const activities = activitiesByDate[date];
        const lessons = activities.filter(a => a.activity_type === 'lesson').length;
        const flashcards = activities.filter(a => a.activity_type === 'flashcard').length;
        const games = activities.filter(a => a.activity_type === 'game').length;
        const studyTime = activities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0) / 60;
        
        console.log(`    ${date}: ${lessons} lessons, ${flashcards} flashcards, ${games} games, ${studyTime.toFixed(1)} min`);
      });
    } else {
      console.log('  ⚠️ No raw activities found in user_activities table');
    }
    
  } catch (error) {
    console.error('❌ Error testing weekly progress:', error);
  }
}

testThisWeekData();
