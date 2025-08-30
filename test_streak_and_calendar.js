// Test script to check streak and calendar functionality
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testStreakAndCalendar() {
  try {
    console.log('🔍 Testing streak and calendar functionality...\n');

    // Get a test user ID (replace with actual user ID)
    const testUserId = 'your-test-user-id';
    
    if (testUserId === 'your-test-user-id') {
      console.log('⚠️  Please update the testUserId with an actual user ID');
      return;
    }

    // 1. Check user_activities table
    console.log('1. Checking user_activities table...');
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', testUserId)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (activitiesError) {
      console.error('❌ Error fetching activities:', activitiesError);
    } else {
      console.log(`✅ Found ${activities?.length || 0} activities`);
      if (activities && activities.length > 0) {
        console.log('📅 Recent activity dates:');
        activities.forEach((activity, index) => {
          const date = new Date(activity.completed_at).toISOString().split('T')[0];
          console.log(`   ${index + 1}. ${date} - ${activity.activity_type} (${activity.activity_name})`);
        });
      }
    }

    // 2. Check user_streaks table
    console.log('\n2. Checking user_streaks table...');
    const { data: streaks, error: streaksError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', testUserId);

    if (streaksError) {
      console.error('❌ Error fetching streaks:', streaksError);
    } else {
      console.log(`✅ Found ${streaks?.length || 0} streak records`);
      if (streaks && streaks.length > 0) {
        streaks.forEach(streak => {
          console.log(`   📊 ${streak.streak_type}: ${streak.current_streak} days (longest: ${streak.longest_streak})`);
        });
      }
    }

    // 3. Check user_daily_goals table
    console.log('\n3. Checking user_daily_goals table...');
    const today = new Date().toISOString().split('T')[0];
    const { data: goals, error: goalsError } = await supabase
      .from('user_daily_goals')
      .select('*')
      .eq('user_id', testUserId)
      .eq('goal_date', today);

    if (goalsError) {
      console.error('❌ Error fetching goals:', goalsError);
    } else {
      console.log(`✅ Found ${goals?.length || 0} goals for today (${today})`);
      if (goals && goals.length > 0) {
        goals.forEach(goal => {
          console.log(`   🎯 ${goal.goal_type}: ${goal.current_value}/${goal.target_value} (${goal.completed ? '✅' : '⏳'})`);
        });
      }
    }

    // 4. Check recent goals (last 7 days)
    console.log('\n4. Checking recent goals...');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: recentGoals, error: recentGoalsError } = await supabase
      .from('user_daily_goals')
      .select('goal_date, goal_type, completed')
      .eq('user_id', testUserId)
      .gte('goal_date', weekAgo.toISOString().split('T')[0])
      .order('goal_date', { ascending: false });

    if (recentGoalsError) {
      console.error('❌ Error fetching recent goals:', recentGoalsError);
    } else {
      console.log(`✅ Found ${recentGoals?.length || 0} goals in the last 7 days`);
      if (recentGoals && recentGoals.length > 0) {
        const goalsByDate = {};
        recentGoals.forEach(goal => {
          if (!goalsByDate[goal.goal_date]) {
            goalsByDate[goal.goal_date] = [];
          }
          goalsByDate[goal.goal_date].push(goal);
        });
        
        Object.entries(goalsByDate).forEach(([date, dateGoals]) => {
          const completedCount = dateGoals.filter(g => g.completed).length;
          const totalCount = dateGoals.length;
          console.log(`   📅 ${date}: ${completedCount}/${totalCount} goals completed`);
        });
      }
    }

    console.log('\n✅ Test completed!');
    console.log('\n📋 Summary:');
    console.log('- Activities are being tracked in user_activities table');
    console.log('- Streaks are managed in user_streaks table');
    console.log('- Daily goals are tracked in user_daily_goals table');
    console.log('- Calendar should show study dates from user_activities table');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStreakAndCalendar();
