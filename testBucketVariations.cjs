/**
 * Test different approaches to access the bucket
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Environment Info:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? 'Set (' + supabaseKey.substring(0, 20) + '...)' : 'Not set'}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucketVariations() {
  console.log('\n🔍 Testing different bucket access approaches...\n');

  const bucketNames = ['GENERAL_LESSONS', 'General_Lessons', 'general_lessons', 'General-Lessons'];
  
  for (const bucketName of bucketNames) {
    console.log(`📁 Testing bucket: "${bucketName}"`);
    
    try {
      // Test 1: List root
      const { data: rootFiles, error: rootError } = await supabase.storage
        .from(bucketName)
        .list('');
      
      if (rootError) {
        console.log(`   ❌ Root access error: ${rootError.message}`);
      } else {
        console.log(`   ✅ Root access successful: ${rootFiles?.length || 0} items`);
        if (rootFiles && rootFiles.length > 0) {
          rootFiles.slice(0, 3).forEach(file => {
            console.log(`      - ${file.name}`);
          });
        }
      }

      // Test 2: List Images folder
      const { data: imagesFiles, error: imagesError } = await supabase.storage
        .from(bucketName)
        .list('Images');
      
      if (imagesError) {
        console.log(`   ❌ Images folder error: ${imagesError.message}`);
      } else {
        console.log(`   ✅ Images folder access: ${imagesFiles?.length || 0} items`);
        if (imagesFiles && imagesFiles.length > 0) {
          imagesFiles.slice(0, 3).forEach(file => {
            console.log(`      - ${file.name}`);
          });
        }
      }

      // Test 3: Try to get a public URL (this should work even if list doesn't)
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl('Images/hello.jpg');
      
      console.log(`   🔗 Public URL test: ${urlData.publicUrl}`);
      
      // Test 4: Check if we can access with different options
      const { data: filesWithOptions, error: optionsError } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' },
          search: 'hello'
        });
      
      if (optionsError) {
        console.log(`   ❌ Options test error: ${optionsError.message}`);
      } else {
        console.log(`   ✅ Options test: ${filesWithOptions?.length || 0} items`);
      }
      
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
    
    console.log('');
  }

  // Test 5: Try to list all buckets again with more details
  console.log('📦 Testing bucket listing with details...');
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`❌ Bucket listing error: ${bucketsError.message}`);
    } else {
      console.log(`✅ Found ${buckets?.length || 0} buckets:`);
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name} (public: ${bucket.public})`);
        });
      }
    }
  } catch (err) {
    console.log(`❌ Bucket listing exception: ${err.message}`);
  }
}

testBucketVariations()
  .then(() => {
    console.log('\n✅ Bucket variation test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
