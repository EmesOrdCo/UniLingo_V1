/**
 * Test Supabase connection and bucket access
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Testing Supabase connection...');
console.log(`URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('\n🧪 Testing database connection...');
  
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('subject_words')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Test storage connection
    console.log('\n🧪 Testing storage connection...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage connection failed:', bucketsError.message);
      return false;
    }
    
    console.log('✅ Storage connection successful');
    console.log(`📦 Found ${buckets.length} buckets:`);
    
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Check if General_Lessons bucket exists
    const generalLessonsBucket = buckets.find(b => b.name === 'General_Lessons');
    if (generalLessonsBucket) {
      console.log(`\n✅ General_Lessons bucket found (${generalLessonsBucket.public ? 'public' : 'private'})`);
      
      // Try to list contents
      console.log('\n🧪 Testing bucket access...');
      const { data: files, error: filesError } = await supabase.storage
        .from('General_Lessons')
        .list('');
      
      if (filesError) {
        console.error('❌ Cannot access General_Lessons bucket:', filesError.message);
        console.log('\n💡 Solution: Run the SQL script to set up bucket policies:');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log('   2. Copy and paste setupBucketPolicies.sql');
        console.log('   3. Click Run');
        return false;
      }
      
      console.log(`✅ Can access General_Lessons bucket`);
      console.log(`📁 Bucket contents: ${files.length} items`);
      
      if (files.length > 0) {
        console.log('   Files/folders:');
        files.slice(0, 5).forEach(file => {
          console.log(`   - ${file.name}`);
        });
        if (files.length > 5) {
          console.log(`   ... and ${files.length - 5} more`);
        }
      }
      
    } else {
      console.log('\n❌ General_Lessons bucket not found');
      console.log('\n💡 Solution: Create the bucket manually in Supabase Dashboard:');
      console.log('   1. Go to Storage');
      console.log('   2. Create new bucket named "General_Lessons"');
      console.log('   3. Make it public');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

testConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎉 All tests passed! Ready to populate word images.');
    } else {
      console.log('\n❌ Tests failed. Please fix the issues above.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
