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

function normalizeWord(word) {
  return word.toLowerCase().trim().replace(/\s+/g, '_');
}

function findImageForWord(word, imageFiles) {
  const normalizedWord = normalizeWord(word);
  
  // Strategy 1: Exact match (best)
  let imageFile = imageFiles.find(file => {
    const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, ''); // Remove extension
    return fileName === normalizedWord;
  });
  
  if (imageFile) {
    return {
      found: true,
      url: getPublicUrl(imageFile.name),
      fileName: imageFile.name,
      matchType: 'exact'
    };
  }
  
  // Strategy 2: Exact match with different extension
  imageFile = imageFiles.find(file => {
    const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, '');
    return fileName === normalizedWord;
  });
  
  if (imageFile) {
    return {
      found: true,
      url: getPublicUrl(imageFile.name),
      fileName: imageFile.name,
      matchType: 'exact-ext'
    };
  }
  
  // Strategy 3: Word starts with the filename (e.g., "absolutely" matches "absolute.png")
  // But only if the word is longer and the filename is at least 4 chars
  imageFile = imageFiles.find(file => {
    const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, '');
    return fileName.length >= 4 && 
           normalizedWord.startsWith(fileName) && 
           normalizedWord.length > fileName.length;
  });
  
  if (imageFile) {
    return {
      found: true,
      url: getPublicUrl(imageFile.name),
      fileName: imageFile.name,
      matchType: 'word-starts-with-image'
    };
  }
  
  // Strategy 4: Filename starts with the word (e.g., "able" might match "ability.png")
  // But only if they share a significant portion and word is at least 4 chars
  imageFile = imageFiles.find(file => {
    const fileName = file.name.toLowerCase().replace(/\.[^/.]+$/, '');
    return normalizedWord.length >= 4 && 
           fileName.startsWith(normalizedWord) && 
           fileName.length > normalizedWord.length;
  });
  
  if (imageFile) {
    return {
      found: true,
      url: getPublicUrl(imageFile.name),
      fileName: imageFile.name,
      matchType: 'image-starts-with-word'
    };
  }
  
  return { found: false };
}

function getPublicUrl(fileName) {
  const { data: urlData } = supabase.storage
    .from(GENERAL_LESSONS_BUCKET)
    .getPublicUrl(`Images/${fileName}`);
  return urlData.publicUrl;
}

async function main() {
  console.log('🚀 Starting Fixed Word Images Population Script');
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

    // Step 3: Clear all existing image URLs first
    console.log('🔄 Clearing existing image URLs...');
    const { error: clearError } = await supabase
      .from('subject_words')
      .update({ image_url: null })
      .not('image_url', 'is', null);
    
    if (clearError) {
      console.error('❌ Error clearing image URLs:', clearError);
    } else {
      console.log('✅ Cleared all existing image URLs\n');
    }

    // Step 4: Process all words with improved matching
    console.log('🔄 Matching words to images with strict matching...\n');
    let updatedCount = 0;
    let notFoundWords = [];
    let matchTypeStats = {
      exact: 0,
      'exact-ext': 0,
      'word-starts-with-image': 0,
      'image-starts-with-word': 0
    };
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
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
          matchTypeStats[result.matchType]++;
          
          if (updatedCount % 100 === 0) {
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

    // Step 5: Summary
    console.log('\n==========================================');
    console.log('🎉 Word Images Population Complete!');
    console.log(`📊 Total words in database: ${words.length}`);
    console.log(`✅ Words updated with images: ${updatedCount}`);
    console.log(`⚠️  Words without matching images: ${notFoundWords.length}`);
    console.log(`📂 Total images available: ${imageFiles.length}`);
    console.log('\n📊 Match Type Statistics:');
    console.log(`   🎯 Exact matches: ${matchTypeStats.exact}`);
    console.log(`   📝 Exact (diff extension): ${matchTypeStats['exact-ext']}`);
    console.log(`   ➡️  Word starts with image: ${matchTypeStats['word-starts-with-image']}`);
    console.log(`   ⬅️  Image starts with word: ${matchTypeStats['image-starts-with-word']}`);
    console.log('==========================================\n');

    // Step 6: Verification
    console.log('4️⃣ Verifying results...');
    const { data: wordsWithImages, error: verifyError } = await supabase
      .from('subject_words')
      .select('id, english_translation, subject, image_url')
      .not('image_url', 'is', null);
    
    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
    } else {
      console.log(`✅ Verification complete: ${wordsWithImages?.length || 0} words have images\n`);
      
      // Show some sample mappings
      console.log('📝 Sample word-to-image mappings:');
      wordsWithImages.slice(0, 10).forEach(w => {
        const imageName = w.image_url.split('/').pop();
        console.log(`   "${w.english_translation}" → ${imageName}`);
      });
      console.log();
    }

    // Step 7: Report words without images
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

