/**
 * Script to list all buckets and their contents
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

async function listAllBucketsAndContents() {
  console.log('🔍 Listing all buckets and their contents...\n');

  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    if (!buckets || buckets.length === 0) {
      console.log('❌ No buckets found!');
      return;
    }
    
    console.log(`📦 Found ${buckets.length} buckets:`);
    
    for (const bucket of buckets) {
      console.log(`\n🪣 Bucket: ${bucket.name}`);
      console.log(`   Public: ${bucket.public ? 'Yes' : 'No'}`);
      console.log(`   Created: ${new Date(bucket.created_at).toLocaleDateString()}`);
      
      // List contents of each bucket
      try {
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('');
        
        if (filesError) {
          console.log(`   ❌ Error accessing bucket: ${filesError.message}`);
        } else if (files && files.length > 0) {
          console.log(`   📁 Contents (${files.length} items):`);
          
          // Show folders first
          const folders = files.filter(f => f.id === null);
          const actualFiles = files.filter(f => f.id !== null);
          
          if (folders.length > 0) {
            console.log(`      📂 Folders:`);
            folders.forEach(folder => {
              console.log(`         ${folder.name}/`);
            });
          }
          
          if (actualFiles.length > 0) {
            console.log(`      📄 Files:`);
            actualFiles.slice(0, 10).forEach(file => {
              const size = file.metadata?.size ? ` (${(file.metadata.size / 1024).toFixed(1)}KB)` : '';
              console.log(`         ${file.name}${size}`);
            });
            if (actualFiles.length > 10) {
              console.log(`         ... and ${actualFiles.length - 10} more files`);
            }
          }
        } else {
          console.log(`   📁 Contents: (empty)`);
        }
        
        // If there are folders, explore them
        if (files && files.length > 0) {
          const folders = files.filter(f => f.id === null);
          for (const folder of folders.slice(0, 3)) { // Only check first 3 folders
            console.log(`\n   📂 Exploring folder: ${folder.name}/`);
            try {
              const { data: folderFiles, error: folderError } = await supabase.storage
                .from(bucket.name)
                .list(folder.name);
              
              if (folderError) {
                console.log(`      ❌ Error: ${folderError.message}`);
              } else if (folderFiles && folderFiles.length > 0) {
                console.log(`      📄 Files (${folderFiles.length}):`);
                folderFiles.slice(0, 5).forEach(file => {
                  console.log(`         ${file.name}`);
                });
                if (folderFiles.length > 5) {
                  console.log(`         ... and ${folderFiles.length - 5} more`);
                }
              } else {
                console.log(`      📄 Files: (empty)`);
              }
            } catch (folderErr) {
              console.log(`      ❌ Error exploring folder: ${folderErr.message}`);
            }
          }
        }
        
      } catch (err) {
        console.log(`   ❌ Error accessing bucket contents: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error listing buckets:', error);
  }
}

listAllBucketsAndContents()
  .then(() => {
    console.log('\n✅ Bucket listing complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Bucket listing failed:', error);
    process.exit(1);
  });
