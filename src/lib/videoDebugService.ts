import { supabase } from './supabase';

export class VideoDebugService {
  /**
   * Debug function to check the actual structure of the Brainrot bucket
   */
  static async debugBrainrotBucket(): Promise<void> {
    try {
      console.log('🔍 Debugging Brainrot bucket structure...');
      
      // Try different bucket name variations
      const bucketNames = ['Brainrot', 'BRAINROT', 'brainrot', 'BrainRot'];
      
      for (const bucketName of bucketNames) {
        console.log(`\n🔍 Testing bucket: "${bucketName}"`);
        
        // First, check if the bucket exists and list root contents
        const { data: rootFiles, error: rootError } = await supabase.storage
          .from(bucketName)
          .list('', {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });
        
        if (rootError) {
          console.log(`❌ Error listing root of ${bucketName}:`, rootError.message);
          continue;
        }
        
        console.log(`📁 Root contents of ${bucketName}:`, rootFiles);
        
        if (rootFiles && rootFiles.length > 0) {
          console.log(`✅ Found ${rootFiles.length} items in root of ${bucketName}`);
          
          // List each potential folder
          const folders = ['GTA', 'Minecraft', 'Subway_Surfers', 'gta', 'minecraft', 'subway_surfers'];
          
          for (const folder of folders) {
            const { data: folderFiles, error: folderError } = await supabase.storage
              .from(bucketName)
              .list(folder, {
                limit: 100,
                sortBy: { column: 'name', order: 'asc' }
              });
            
            if (folderError) {
              console.log(`❌ Error listing folder ${folder}:`, folderError.message);
            } else {
              console.log(`📁 Contents of ${folder}/:`, folderFiles);
              if (folderFiles && folderFiles.length > 0) {
                console.log(`✅ Found ${folderFiles.length} files in ${folder}/`);
                // Show first few files as examples
                const examples = folderFiles.slice(0, 3).map(file => file.name);
                console.log(`📄 Example files:`, examples);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error in debug function:', error);
    }
  }

  /**
   * Test function to get a specific video URL
   */
  static async testGetVideoUrl(category: string, filename: string): Promise<string | null> {
    try {
      console.log(`🔍 Testing video URL for: ${category}/${filename}`);
      
      const { data } = supabase.storage
        .from('Brainrot')
        .getPublicUrl(`${category}/${filename}`);
      
      console.log(`📺 Generated URL:`, data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('❌ Error generating video URL:', error);
      return null;
    }
  }

  /**
   * List all available buckets
   */
  static async listAllBuckets(): Promise<void> {
    try {
      console.log('🔍 Listing all available buckets...');
      console.log('🔍 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || 'Not set');
      console.log('🔍 Supabase Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
      
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ Error listing buckets:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        return;
      }
      
      console.log('📦 Available buckets:', buckets);
      console.log('📦 Buckets count:', buckets?.length || 0);
      
      // For each bucket, try to list its contents
      if (buckets && buckets.length > 0) {
        for (const bucket of buckets) {
          console.log(`\n🔍 Checking bucket: ${bucket.name}`);
          const { data: files, error: listError } = await supabase.storage
            .from(bucket.name)
            .list('', { limit: 10 });
          
          if (listError) {
            console.log(`❌ Error listing ${bucket.name}:`, listError.message);
          } else {
            console.log(`📁 Files in ${bucket.name}:`, files);
          }
        }
      } else {
        console.log('⚠️ No buckets found or access denied');
        
        // Try to check if we can access a specific bucket directly
        console.log('🔍 Testing direct access to Brainrot bucket...');
        const { data: testFiles, error: testError } = await supabase.storage
          .from('Brainrot')
          .list('', { limit: 5 });
        
        if (testError) {
          console.error('❌ Direct Brainrot access error:', testError);
        } else {
          console.log('✅ Direct Brainrot access successful:', testFiles);
        }
      }
    } catch (error) {
      console.error('❌ Error listing buckets:', error);
    }
  }
}
