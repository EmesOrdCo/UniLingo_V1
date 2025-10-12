/**
 * Script to populate word images from Supabase Storage
 * 
 * Usage:
 * 1. Ensure you have images uploaded to the General_Lessons bucket in Supabase
 * 2. Run this script to automatically match images to vocabulary words
 * 3. The script will update the subject_words table with image URLs
 * 
 * To run this script:
 * npx ts-node src/scripts/populateWordImages.ts
 */

import { WordImageService } from '../lib/wordImageService';
import { supabase } from '../lib/supabase';

async function main() {
  console.log('🚀 Starting Word Images Population Script');
  console.log('==========================================\n');

  try {
    // Step 1: Check if image_url column exists
    console.log('1️⃣ Checking database schema...');
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_column_info', { table_name: 'subject_words' });
    
    if (schemaError) {
      console.log('⚠️  Could not verify schema (this is okay if running first time)');
    } else {
      console.log('✅ Database schema verified\n');
    }

    // Step 2: List all available images
    console.log('2️⃣ Listing available images in General_Lessons bucket...');
    const availableImages = await WordImageService.listAllImages();
    
    if (availableImages.length === 0) {
      console.log('❌ No images found in General_Lessons bucket!');
      console.log('   Please upload images to the bucket before running this script.');
      return;
    }
    
    console.log(`✅ Found ${availableImages.length} images in General_Lessons bucket`);
    console.log('   Images:', availableImages.slice(0, 10).join(', '), availableImages.length > 10 ? '...' : '');
    console.log();

    // Step 3: Get all subjects to process
    console.log('3️⃣ Fetching subjects from database...');
    const { data: subjects, error: subjectsError } = await supabase
      .from('subject_words')
      .select('subject')
      .order('subject');
    
    if (subjectsError) {
      console.error('❌ Error fetching subjects:', subjectsError);
      return;
    }
    
    const uniqueSubjects = [...new Set(subjects?.map(s => s.subject) || [])];
    console.log(`✅ Found ${uniqueSubjects.length} unique subjects`);
    console.log('   Subjects:', uniqueSubjects.slice(0, 5).join(', '), uniqueSubjects.length > 5 ? '...' : '');
    console.log();

    // Step 4: Process each subject
    console.log('4️⃣ Processing subjects and matching images...\n');
    let totalUpdated = 0;
    
    for (const subject of uniqueSubjects) {
      console.log(`📚 Processing: ${subject}`);
      const updatedCount = await WordImageService.updateWordImagesInDatabase(subject);
      totalUpdated += updatedCount;
      console.log(`   ✅ Updated ${updatedCount} words\n`);
    }

    // Step 5: Summary
    console.log('==========================================');
    console.log('🎉 Word Images Population Complete!');
    console.log(`📊 Total words updated: ${totalUpdated}`);
    console.log(`📸 Total images available: ${availableImages.length}`);
    console.log(`📚 Total subjects processed: ${uniqueSubjects.length}`);
    console.log('==========================================\n');

    // Step 6: Verification
    console.log('5️⃣ Verifying results...');
    const { data: wordsWithImages, error: verifyError } = await supabase
      .from('subject_words')
      .select('id, english_translation, subject, image_url')
      .not('image_url', 'is', null);
    
    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
    } else {
      console.log(`✅ Verification complete: ${wordsWithImages?.length || 0} words have images`);
      
      if (wordsWithImages && wordsWithImages.length > 0) {
        console.log('\n📝 Sample words with images:');
        wordsWithImages.slice(0, 5).forEach(word => {
          console.log(`   - ${word.english_translation} (${word.subject})`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ Script failed with error:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

