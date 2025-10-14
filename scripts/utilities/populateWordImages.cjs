/**
 * Simple Node.js script to populate word images from Supabase Storage
 * This version doesn't use React Native modules, making it easier to run
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GENERAL_LESSONS_BUCKET = 'General_Lessons';

async function getBatchWordImageUrls(words) {
  const imageMap = new Map();
  
  try {
    console.log(`🖼️ Fetching images for ${words.length} words`);
    
    // List all files in the General_Lessons/Images folder with pagination
    let allFiles = [];
    let offset = 0;
    const limit = 1000; // Max limit per request
    let hasMore = true;
    
    while (hasMore) {
      const { data: files, error } = await supabase.storage
        .from(GENERAL_LESSONS_BUCKET)
        .list('Images', {
          limit: limit,
          offset: offset,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        console.error('Error listing images from General_Lessons bucket:', error);
        return imageMap;
      }
      
      if (!files || files.length === 0) {
        hasMore = false;
      } else {
        allFiles = allFiles.concat(files);
        offset += files.length;
        
        // If we got fewer files than the limit, we've reached the end
        if (files.length < limit) {
          hasMore = false;
        }
      }
    }
    
    if (allFiles.length === 0) {
      console.warn('⚠️ No images found in General_Lessons bucket');
      return imageMap;
    }
    
    console.log(`📂 Found ${allFiles.length} files in General_Lessons/Images folder`);
    
    // For each word, find matching image
    for (const word of words) {
      const normalizedWord = word.toLowerCase().trim().replace(/\s+/g, '_');
      
      // Find exact match or the first file that contains the word
      const imageFile = allFiles.find(file => {
        const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, ''); // Remove extension
        return fileName === normalizedWord || 
               fileName.startsWith(normalizedWord) || 
               fileName.includes(normalizedWord);
      });
      
      if (imageFile) {
        const { data: urlData } = supabase.storage
          .from(GENERAL_LESSONS_BUCKET)
          .getPublicUrl(`Images/${imageFile.name}`);
        
        imageMap.set(word, urlData.publicUrl);
        console.log(`✅ Mapped "${word}" -> ${imageFile.name}`);
      } else {
        console.warn(`⚠️ No image found for: ${word}`);
      }
    }
    
    console.log(`✅ Successfully mapped ${imageMap.size}/${words.length} words to images`);
    return imageMap;
  } catch (error) {
    console.error('Error getting batch word images:', error);
    return imageMap;
  }
}

async function updateWordImagesInDatabase(subjectName) {
  try {
    console.log(`🔄 Updating word images in database for subject: ${subjectName || 'ALL'}`);
    
    // Fetch vocabulary words
    let query = supabase
      .from('subject_words')
      .select('id, english_translation, subject');
    
    if (subjectName) {
      query = query.eq('subject', subjectName);
    }
    
    const { data: words, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('Error fetching words:', fetchError);
      return 0;
    }
    
    if (!words || words.length === 0) {
      console.warn('No words found to update');
      return 0;
    }
    
    console.log(`📝 Found ${words.length} words to process`);
    
    // Get all word names for batch processing
    const wordNames = words.map(w => w.english_translation);
    const imageMap = await getBatchWordImageUrls(wordNames);
    
    // Update each word with its image URL
    let updatedCount = 0;
    for (const word of words) {
      const wordKey = word.english_translation;
      const imageUrl = imageMap.get(wordKey);
      
      if (imageUrl) {
        const { error: updateError } = await supabase
          .from('subject_words')
          .update({ image_url: imageUrl })
          .eq('id', word.id);
        
        if (updateError) {
          console.error(`Error updating word ${word.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
    
    console.log(`✅ Updated ${updatedCount}/${words.length} words with image URLs`);
    return updatedCount;
  } catch (error) {
    console.error('Error updating word images in database:', error);
    return 0;
  }
}

async function listAllImages() {
  try {
    // List all files with pagination
    let allFiles = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: files, error } = await supabase.storage
        .from(GENERAL_LESSONS_BUCKET)
        .list('Images', {
          limit: limit,
          offset: offset,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        console.error('Error listing images:', error);
        return [];
      }
      
      if (!files || files.length === 0) {
        hasMore = false;
      } else {
        allFiles = allFiles.concat(files);
        offset += files.length;
        
        if (files.length < limit) {
          hasMore = false;
        }
      }
    }
    
    const fileNames = allFiles?.map(file => file.name) || [];
    console.log(`📂 Found ${fileNames.length} images in General_Lessons/Images folder`);
    return fileNames;
  } catch (error) {
    console.error('Error listing all images:', error);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Word Images Population Script');
  console.log('==========================================\n');

  try {
    // Step 1: List all available images
    console.log('1️⃣ Listing available images in General_Lessons/Images folder...');
    const availableImages = await listAllImages();
    
    if (availableImages.length === 0) {
      console.log('❌ No images found in General_Lessons/Images folder!');
      console.log('   Please upload images to the bucket before running this script.');
      return;
    }
    
    console.log(`✅ Found ${availableImages.length} images in General_Lessons/Images folder`);
    console.log('   Sample images:', availableImages.slice(0, 10).join(', '), availableImages.length > 10 ? '...' : '');
    console.log();

    // Step 2: Get all subjects to process
    console.log('2️⃣ Fetching subjects from database...');
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

    // Step 3: Process each subject
    console.log('3️⃣ Processing subjects and matching images...\n');
    let totalUpdated = 0;
    
    for (const subject of uniqueSubjects) {
      console.log(`📚 Processing: ${subject}`);
      const updatedCount = await updateWordImagesInDatabase(subject);
      totalUpdated += updatedCount;
      console.log(`   ✅ Updated ${updatedCount} words\n`);
    }

    // Step 4: Summary
    console.log('==========================================');
    console.log('🎉 Word Images Population Complete!');
    console.log(`📊 Total words updated: ${totalUpdated}`);
    console.log(`📸 Total images available: ${availableImages.length}`);
    console.log(`📚 Total subjects processed: ${uniqueSubjects.length}`);
    console.log('==========================================\n');

    // Step 5: Verification
    console.log('4️⃣ Verifying results...');
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
