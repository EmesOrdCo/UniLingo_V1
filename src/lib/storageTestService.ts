import { supabase } from './supabase';

export class StorageTestService {
  /**
   * Test basic storage access
   */
  static async testStorageAccess(): Promise<void> {
    try {
      console.log('🧪 Testing Supabase Storage Access...');
      
      // Test 1: List buckets
      console.log('\n📦 Test 1: List all buckets');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Buckets error:', bucketsError);
      } else {
        console.log('✅ Buckets result:', buckets);
      }
      
      // Test 2: Try to access Brainrot bucket directly
      console.log('\n📁 Test 2: Direct Brainrot bucket access');
      const { data: brainrotFiles, error: brainrotError } = await supabase.storage
        .from('Brainrot')
        .list('', { limit: 5 });
      
      if (brainrotError) {
        console.error('❌ Brainrot error:', brainrotError);
      } else {
        console.log('✅ Brainrot files:', brainrotFiles);
      }
      
      // Test 3: Try to access a specific folder
      console.log('\n📂 Test 3: Access Minecraft folder');
      const { data: minecraftFiles, error: minecraftError } = await supabase.storage
        .from('Brainrot')
        .list('Minecraft', { limit: 5 });
      
      if (minecraftError) {
        console.error('❌ Minecraft error:', minecraftError);
      } else {
        console.log('✅ Minecraft files:', minecraftFiles);
      }
      
      // Test 4: Try to get a public URL
      console.log('\n🔗 Test 4: Generate public URL');
      const { data: urlData } = supabase.storage
        .from('Brainrot')
        .getPublicUrl('Minecraft/Minecraft_1.mp4');
      
      console.log('✅ Generated URL:', urlData.publicUrl);
      
      // Test 5: Check if we're authenticated
      console.log('\n🔐 Test 5: Check authentication');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
      } else {
        console.log('✅ User:', user ? 'Authenticated' : 'Anonymous');
      }
      
    } catch (error) {
      console.error('❌ Storage test error:', error);
    }
  }
}
