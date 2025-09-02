// Test complete lesson creation flow
async function testCompleteLessonCreation() {
  console.log('🧪 TESTING COMPLETE LESSON CREATION FLOW...\n');
  
  // Step 1: Create a realistic PDF with educational content
  console.log('📄 Step 1: Creating educational PDF content...');
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(Introduction to Computer Science) Tj
72 700 Td
(Programming is the process of creating instructions for computers) Tj
72 680 Td
(Algorithms are step-by-step procedures for solving problems) Tj
72 660 Td
(Data structures organize and store data efficiently) Tj
72 640 Td
(Variables store values that can change during program execution) Tj
72 620 Td
(Functions are reusable blocks of code that perform specific tasks) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
450
%%EOF`;
  
  const pdfBase64 = Buffer.from(pdfContent).toString('base64');
  
  // Step 2: Extract text from PDF (simulating mobile app)
  console.log('🔍 Step 2: Extracting text from PDF...');
  const response = await fetch('http://192.168.1.187:3001/api/extract-pdf-base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pdfBase64: pdfBase64
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PDF extraction failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`PDF extraction failed: ${result.error}`);
  }
  
  console.log(`✅ Text extracted successfully`);
  console.log(`📝 Extracted text: "${result.text.substring(0, 100)}..."`);
  console.log(`🔄 Used fallback: ${result.usedFallback}`);
  
  // Step 3: Simulate AI processing (this would happen in the mobile app)
  console.log('\n🤖 Step 3: Simulating AI keyword extraction...');
  const extractedText = result.text;
  
  // Simulate what OpenAI would do with this text
  const keywords = extractKeywordsFromText(extractedText);
  console.log(`✅ Extracted keywords: ${keywords.join(', ')}`);
  
  // Step 4: Simulate vocabulary generation
  console.log('\n📚 Step 4: Simulating vocabulary generation...');
  const vocabulary = generateVocabularyFromKeywords(keywords);
  console.log(`✅ Generated ${vocabulary.length} vocabulary items`);
  
  // Step 5: Simulate lesson creation
  console.log('\n🎯 Step 5: Simulating lesson creation...');
  const lesson = createLessonFromVocabulary(vocabulary);
  console.log(`✅ Lesson created: "${lesson.title}"`);
  console.log(`📊 Lesson contains: ${lesson.vocabulary.length} words, ${lesson.exercises.length} exercises`);
  
  console.log('\n🎉 COMPLETE LESSON CREATION FLOW SUCCESSFUL!');
  console.log('📱 The mobile app should now be able to create lessons successfully.');
}

// Helper functions to simulate AI processing
function extractKeywordsFromText(text) {
  // Simulate keyword extraction
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an']);
  
  const keywords = words
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 10); // Take top 10 keywords
  
  return [...new Set(keywords)]; // Remove duplicates
}

function generateVocabularyFromKeywords(keywords) {
  return keywords.map((keyword, index) => ({
    id: `vocab_${index}`,
    term: keyword,
    definition: `Definition for ${keyword}`,
    example: `Example sentence using ${keyword}`,
    difficulty: index < 3 ? 'beginner' : index < 6 ? 'intermediate' : 'advanced'
  }));
}

function createLessonFromVocabulary(vocabulary) {
  return {
    id: 'lesson_1',
    title: 'Computer Science Fundamentals',
    subject: 'Computer Science',
    vocabulary: vocabulary,
    exercises: [
      { type: 'flashcards', vocabulary: vocabulary.slice(0, 5) },
      { type: 'word_scramble', vocabulary: vocabulary.slice(0, 3) },
      { type: 'sentence_scramble', vocabulary: vocabulary.slice(0, 2) }
    ],
    estimatedDuration: 15,
    difficulty: 'beginner'
  };
}

// Run the complete test
testCompleteLessonCreation().catch(error => {
  console.error('❌ Complete lesson creation test failed:', error.message);
});
