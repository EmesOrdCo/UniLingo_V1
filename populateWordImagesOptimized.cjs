require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GENERAL_LESSONS_BUCKET = 'General_Lessons';

// Cache for images - fetch once and reuse
let imageFilesCache = null;

async function getAllImages() {
  if (imageFilesCache) {
    return imageFilesCache;
  }

  console.log('📂 Fetching all images from storage (one time)...');
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
  
  imageFilesCache = allFiles;
  console.log(`✅ Loaded ${allFiles.length} images into cache\n`);
  return allFiles;
}

function findImageForWord(word, imageFiles) {
  const normalizedWord = word.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Find exact match or the first file that contains the word
  const imageFile = imageFiles.find(file => {
    const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, ''); // Remove extension
    return fileName === normalizedWord || 
           fileName.startsWith(normalizedWord) || 
           fileName.includes(normalizedWord);
  });
  
  if (imageFile) {
    const { data: urlData } = supabase.storage
      .from(GENERAL_LESSONS_BUCKET)
      .getPublicUrl(`Images/${imageFile.name}`);
    
    return {
      found: true,
      url: urlData.publicUrl,
      fileName: imageFile.name
    };
  }
  
  return { found: false };
}

async function main() {
  console.log('🚀 Starting Optimized Word Images Population Script');
  console.log('==========================================\n');

  try {
    // Step 1: Load all images once
    const imageFiles = await getAllImages();
    
    if (imageFiles.length === 0) {
      console.log('❌ No images found in General_Lessons/Images folder!');
      return;
    }

    // Step 2: Get all words from database with pagination
    console.log('📚 Fetching all words from database...');
    let allWords = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: words, error: wordsError } = await supabase
        .from('subject_words')
        .select('id, english_translation, subject, image_url')
        .order('subject')
        .range(offset, offset + limit - 1);
      
      if (wordsError) {
        console.error('❌ Error fetching words:', wordsError);
        return;
      }
      
      if (!words || words.length === 0) {
        hasMore = false;
      } else {
        allWords = allWords.concat(words);
        offset += words.length;
        
        if (words.length < limit) {
          hasMore = false;
        }
      }
    }
    
    console.log(`✅ Found ${allWords.length} words to process\n`);
    const words = allWords;

    // Step 3: Process all words
    console.log('🔄 Matching words to images...\n');
    let updatedCount = 0;
    let alreadyHasImage = 0;
    let notFoundWords = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Skip if already has image
      if (word.image_url) {
        alreadyHasImage++;
        continue;
      }
      
      const result = findImageForWord(word.english_translation, imageFiles);
      
      if (result.found) {
        // Update database
        const { error: updateError } = await supabase
          .from('subject_words')
          .update({ image_url: result.url })
          .eq('id', word.id);
        
        if (updateError) {
          console.error(`❌ Error updating word ${word.id}:`, updateError);
        } else {
          updatedCount++;
          if (updatedCount % 50 === 0) {
            console.log(`   ✅ Progress: ${updatedCount} words updated...`);
          }
        }
      } else {
        notFoundWords.push({
          word: word.english_translation,
          subject: word.subject
        });
      }
    }

    // Step 4: Summary
    console.log('\n==========================================');
    console.log('🎉 Word Images Population Complete!');
    console.log(`📊 Total words in database: ${words.length}`);
    console.log(`✅ Words updated with images: ${updatedCount}`);
    console.log(`📸 Words that already had images: ${alreadyHasImage}`);
    console.log(`⚠️  Words without matching images: ${notFoundWords.length}`);
    console.log(`📂 Total images available: ${imageFiles.length}`);
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
      console.log(`✅ Verification complete: ${wordsWithImages?.length || 0} words have images\n`);
    }

    // Step 6: Report words without images
    if (notFoundWords.length > 0) {
      console.log('📋 Words without matching images:');
      console.log('==========================================');
      
      // Group by subject for better readability
      const bySubject = {};
      notFoundWords.forEach(item => {
        if (!bySubject[item.subject]) {
          bySubject[item.subject] = [];
        }
        bySubject[item.subject].push(item.word);
      });
      
      Object.keys(bySubject).sort().forEach(subject => {
        console.log(`\n📚 ${subject}:`);
        bySubject[subject].forEach(word => {
          console.log(`   - ${word}`);
        });
      });
      
      console.log('\n==========================================');
      console.log(`Total: ${notFoundWords.length} words need images`);
      console.log('==========================================\n');
    }

    console.log('✅ Script completed successfully');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();

