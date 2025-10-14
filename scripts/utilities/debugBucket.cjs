/**
 * Debug script to explore the General_Lessons bucket structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreBucket() {
  console.log('🔍 Exploring General_Lessons bucket structure...\n');

  try {
    // List root level
    console.log('📂 Root level of General_Lessons bucket:');
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('General_Lessons')
      .list('');
    
    if (rootError) {
      console.error('Error listing root:', rootError);
      return;
    }
    
    if (rootFiles && rootFiles.length > 0) {
      rootFiles.forEach(file => {
        console.log(`   📁 ${file.name} (${file.metadata?.size ? (file.metadata.size / 1024).toFixed(1) + 'KB' : 'folder'})`);
      });
    } else {
      console.log('   (empty)');
    }
    
    console.log();

    // Check if there's an Images folder
    console.log('📂 Checking Images folder:');
    const { data: imagesFiles, error: imagesError } = await supabase.storage
      .from('General_Lessons')
      .list('Images');
    
    if (imagesError) {
      console.error('Error listing Images folder:', imagesError);
    } else if (imagesFiles && imagesFiles.length > 0) {
      console.log(`   Found ${imagesFiles.length} files in Images folder:`);
      imagesFiles.slice(0, 10).forEach(file => {
        console.log(`   📄 ${file.name}`);
      });
      if (imagesFiles.length > 10) {
        console.log(`   ... and ${imagesFiles.length - 10} more files`);
      }
    } else {
      console.log('   Images folder is empty or doesn\'t exist');
    }

    console.log();

    // List all buckets
    console.log('📦 All available buckets:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`   🪣 ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }

  } catch (error) {
    console.error('Error exploring bucket:', error);
  }
}

exploreBucket()
  .then(() => {
    console.log('\n✅ Bucket exploration complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Bucket exploration failed:', error);
    process.exit(1);
  });
