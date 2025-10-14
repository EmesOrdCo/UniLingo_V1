/**
 * Test different bucket name variations to find the correct one
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucketVariations() {
  console.log('🔍 Testing different bucket name variations...\n');

  const bucketVariations = [
    'General_Lessons',
    'general_lessons', 
    'GENERAL_LESSONS',
    'general-lessons',
    'General-Lessons',
    'GeneralLessons',
    'generalLessons'
  ];

  for (const bucketName of bucketVariations) {
    console.log(`🧪 Testing bucket: "${bucketName}"`);
    
    try {
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list('');
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ SUCCESS! Found ${files.length} items`);
        
        if (files.length > 0) {
          console.log(`   📁 Contents:`);
          files.slice(0, 5).forEach(file => {
            console.log(`      - ${file.name}`);
          });
          if (files.length > 5) {
            console.log(`      ... and ${files.length - 5} more`);
          }
          
          // Check for Images folder specifically
          const imagesFolder = files.find(f => f.name === 'Images');
          if (imagesFolder) {
            console.log(`   📂 Found Images folder!`);
            
            const { data: imageFiles, error: imageError } = await supabase.storage
              .from(bucketName)
              .list('Images');
            
            if (imageError) {
              console.log(`   ❌ Error accessing Images folder: ${imageError.message}`);
            } else {
              console.log(`   🖼️ Images folder contains ${imageFiles.length} files`);
              console.log(`   📄 Sample images:`, imageFiles.slice(0, 3).map(f => f.name).join(', '));
            }
          }
        }
        
        console.log(`\n🎉 CORRECT BUCKET NAME: "${bucketName}"`);
        console.log(`   Update your scripts to use this bucket name.\n`);
        return bucketName;
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
    
    console.log('');
  }
  
  console.log('❌ No working bucket name found. Check:');
  console.log('   1. Bucket exists in Supabase Dashboard');
  console.log('   2. Bucket is marked as Public');
  console.log('   3. Storage policies are set up');
  console.log('   4. Anon key has proper permissions');
  
  return null;
}

testBucketVariations()
  .then((correctBucketName) => {
    if (correctBucketName) {
      console.log(`✅ Found working bucket: ${correctBucketName}`);
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Update populateWordImages.cjs to use "${correctBucketName}"`);
      console.log(`   2. Run the population script`);
    } else {
      console.log(`❌ No working bucket found`);
    }
    process.exit(correctBucketName ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
