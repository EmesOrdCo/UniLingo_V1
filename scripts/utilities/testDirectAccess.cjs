/**
 * Test direct access to GENERAL_LESSONS bucket like the working Brainrot examples
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectAccess() {
  console.log('🔍 Testing direct access to GENERAL_LESSONS bucket...\n');

  try {
    // Test 1: Direct bucket access (like the working Brainrot examples)
    console.log('📁 Test 1: Direct General_Lessons bucket access');
    const { data: files, error: filesError } = await supabase.storage
      .from('General_Lessons')
      .list('', { limit: 10 });
    
    if (filesError) {
      console.error('❌ General_Lessons error:', filesError);
    } else {
      console.log('✅ General_Lessons files:', files);
      console.log(`📊 Found ${files?.length || 0} items`);
      
      if (files && files.length > 0) {
        files.forEach(file => {
          console.log(`   - ${file.name}`);
        });
      }
    }

    // Test 2: Access Images folder specifically
    console.log('\n📂 Test 2: Access Images folder');
    const { data: imagesFiles, error: imagesError } = await supabase.storage
      .from('General_Lessons')
      .list('Images', { limit: 10 });
    
    if (imagesError) {
      console.error('❌ Images folder error:', imagesError);
    } else {
      console.log('✅ Images folder files:', imagesFiles);
      console.log(`📊 Found ${imagesFiles?.length || 0} images`);
      
      if (imagesFiles && imagesFiles.length > 0) {
        imagesFiles.slice(0, 5).forEach(file => {
          console.log(`   - ${file.name}`);
        });
        if (imagesFiles.length > 5) {
          console.log(`   ... and ${imagesFiles.length - 5} more`);
        }
      }
    }

    // Test 3: Try to get a public URL for a sample image
    if (imagesFiles && imagesFiles.length > 0) {
      console.log('\n🔗 Test 3: Generate public URL');
      const sampleImage = imagesFiles[0].name;
      const { data: urlData } = supabase.storage
        .from('General_Lessons')
        .getPublicUrl(`Images/${sampleImage}`);
      
      console.log(`✅ Generated URL for ${sampleImage}:`);
      console.log(`   ${urlData.publicUrl}`);
    }

    // Test 4: Compare with working Brainrot bucket
    console.log('\n📁 Test 4: Compare with Brainrot bucket');
    const { data: brainrotFiles, error: brainrotError } = await supabase.storage
      .from('Brainrot')
      .list('', { limit: 5 });
    
    if (brainrotError) {
      console.error('❌ Brainrot error:', brainrotError);
    } else {
      console.log('✅ Brainrot files:', brainrotFiles);
      console.log(`📊 Found ${brainrotFiles?.length || 0} items in Brainrot`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectAccess()
  .then(() => {
    console.log('\n✅ Direct access test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
