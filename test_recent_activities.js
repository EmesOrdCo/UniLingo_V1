const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRecentActivities() {
  console.log('🔍 Testing Recent Activities Data...\n');

  try {
    // Test user ID - replace with actual user ID
    const userId = 'your-user-id';
    
    console.log('📊 Checking user_activities table...');
    
    // Get all activities for the user
    const { data: allActivities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (activitiesError) {
      console.error('❌ Error fetching activities:', activitiesError);
      return;
    }

    console.log('📋 Found activities:', allActivities?.length || 0);
    
    if (allActivities && allActivities.length > 0) {
      console.log('\n📝 Recent Activities Data:');
      allActivities.forEach((activity, index) => {
        console.log(`\n--- Activity ${index + 1} ---`);
        console.log('ID:', activity.id);
        console.log('Type:', activity.activity_type);
        console.log('Name:', activity.activity_name);
        console.log('Score:', activity.score);
        console.log('Max Score:', activity.max_score);
        console.log('Accuracy %:', activity.accuracy_percentage);
        console.log('Duration (seconds):', activity.duration_seconds);
        console.log('Completed at:', activity.completed_at);
        console.log('User ID:', activity.user_id);
      });
    } else {
      console.log('❌ No activities found in user_activities table');
    }

    // Check if there are any game activities specifically
    const { data: gameActivities, error: gameError } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_type', 'game')
      .order('completed_at', { ascending: false })
      .limit(5);

    console.log('\n🎮 Game Activities Found:', gameActivities?.length || 0);
    if (gameActivities && gameActivities.length > 0) {
      gameActivities.forEach((game, index) => {
        console.log(`\n--- Game ${index + 1} ---`);
        console.log('ID:', game.id);
        console.log('Name:', game.activity_name);
        console.log('Score:', game.score);
        console.log('Accuracy %:', game.accuracy_percentage);
        console.log('Duration:', game.duration_seconds, 'seconds');
        console.log('Completed:', game.completed_at);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRecentActivities();
