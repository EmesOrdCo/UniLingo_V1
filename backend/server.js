const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const NetworkLogger = require('./networkLogger');
const getLocalIP = require('./getLocalIP');
const updateFrontendConfig = require('./updateFrontendConfig');
const AIService = require('./aiService');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Debug - Current directory:', __dirname);
console.log('🔍 Debug - .env file path:', path.join(__dirname, '.env'));

const app = express();
const PORT = process.env.PORT || 3001;
const LOCAL_IP = getLocalIP();
const networkLogger = new NetworkLogger();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// PDF upload configuration
const pdfUpload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

// Image upload configuration
const imageUpload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
    files: 5 // Maximum 5 images
  }
});

// Enhanced post-processing function for handwritten OCR text
function postProcessOCRText(text) {
  if (!text) return text;
  
  console.log(`  🔧 Original OCR text length: ${text.length} characters`);
  
  // Handwriting-specific OCR error corrections
  const corrections = {
    // Common handwritten word corrections
    'teh': 'the',
    'adn': 'and',
    'taht': 'that',
    'recieve': 'receive',
    'seperate': 'separate',
    'definately': 'definitely',
    'occured': 'occurred',
    'begining': 'beginning',
    'programing': 'programming',
    'developement': 'development',
    'langauge': 'language',
    'computor': 'computer',
    'operatng': 'operating',
    'systern': 'system',
    'applicatons': 'applications',
    'functons': 'functions',
    'variabes': 'variables',
    'algoritm': 'algorithm',
    'strucure': 'structure',
    'procedre': 'procedure',
    'executon': 'execution',
    'instructons': 'instructions',
    'comunicate': 'communicate',
    'communicaton': 'communication',
    'occured': 'occurred',
    'begining': 'beginning',
    'definately': 'definitely',
    
    // Fix common OCR spacing issues
    'rn': 'm',
    'cl': 'd',
    'li': 'h',
    
    // Character misrecognitions (context-dependent)
    'br0wn': 'brown',
    'f0x': 'fox',
    '0ver': 'over',
    'd0g': 'dog'
  };
  
  let processedText = text;
  
  // Apply corrections
  for (const [wrong, correct] of Object.entries(corrections)) {
    // Use word boundaries for word corrections
    const regex = new RegExp(`\\b${wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    processedText = processedText.replace(regex, correct);
  }
  
  // Clean up punctuation spacing
  processedText = processedText
    .replace(/\s+([.,!?;:])/g, '$1')  // Remove spaces before punctuation
    .replace(/([.,!?;:])\s+/g, '$1 ')  // Single space after punctuation
    .replace(/\s+/g, ' ')              // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n')         // Multiple newlines to single newline
    .trim();                           // Remove leading/trailing whitespace
  
  // Capitalize sentences (only if not already capitalized)
  processedText = processedText.replace(/(^|\.\s+)([a-z])/g, (match, prefix, letter) => {
    return prefix + letter.toUpperCase();
  });
  
  // Don't capitalize words that are already correctly capitalized
  processedText = processedText.replace(/\b([a-z])([a-z]*)\b/g, (match, first, rest) => {
    // Only capitalize if it's at the beginning of a sentence or after punctuation
    return match;
  });
  
  console.log(`  ✅ Post-processed text length: ${processedText.length} characters`);
  console.log(`  📝 Post-processed preview: ${processedText.substring(0, 200)}...`);
  
  return processedText;
}

// Function to split text into approximate pages
function splitTextIntoPages(text, pageCount) {
  if (!text || pageCount <= 1) {
    return [text || ''];
  }
  
  const totalLength = text.length;
  const avgPageLength = Math.floor(totalLength / pageCount);
  
  const pages = [];
  let currentIndex = 0;
  
  for (let i = 0; i < pageCount; i++) {
    let endIndex;
    
    if (i === pageCount - 1) {
      // Last page gets all remaining text
      endIndex = totalLength;
    } else {
      // Find a good break point (end of sentence or paragraph)
      endIndex = currentIndex + avgPageLength;
      
      // Look for sentence endings within 200 characters
      const searchStart = Math.max(currentIndex, endIndex - 200);
      const searchEnd = Math.min(totalLength, endIndex + 200);
      const searchText = text.substring(searchStart, searchEnd);
      
      // Find the last sentence ending
      const sentenceEndings = ['. ', '.\n', '! ', '!\n', '? ', '?\n'];
      let bestBreak = endIndex;
      
      for (const ending of sentenceEndings) {
        const lastIndex = searchText.lastIndexOf(ending);
        if (lastIndex !== -1) {
          bestBreak = searchStart + lastIndex + ending.length;
          break;
        }
      }
      
      endIndex = bestBreak;
    }
    
    const pageText = text.substring(currentIndex, endIndex).trim();
    if (pageText.length > 0) {
      pages.push(pageText);
    }
    
    currentIndex = endIndex;
  }
  
  return pages;
}

// Image processing endpoint with OCR
app.post('/api/process-image', imageUpload.array('images', 5), async (req, res) => {
  try {
    console.log('🔍 DEBUG: Request body keys:', Object.keys(req.body || {}));
    console.log('🔍 DEBUG: Request files:', req.files ? req.files.length : 'undefined');
    console.log('🔍 DEBUG: Content-Type:', req.headers['content-type']);
    
    if (!req.files || req.files.length === 0) {
      console.log('❌ DEBUG: No files received - req.files:', req.files);
      return res.status(400).json({ error: 'No image files uploaded', debug: { files: req.files, body: req.body } });
    }

    console.log('\n' + '📸'.repeat(20));
    console.log('📸 INCOMING IMAGE UPLOAD REQUEST');
    console.log('📸'.repeat(20));
    console.log(`📁 Files: ${req.files.length} images`);
    req.files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Warn about large images
      if (file.size > 5 * 1024 * 1024) {
        console.log(`    ⚠️ Large image detected - processing may take longer...`);
      }
    });
    console.log('📸'.repeat(20) + '\n');

    // Import required modules
    const sharp = require('sharp');
    const { EasyOCR } = require('node-easyocr');
    
    let allExtractedText = '';
    let processedImages = 0;
    const totalImages = req.files.length;

    // Process each image
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      console.log(`🔍 Processing image ${i + 1}/${totalImages}: ${file.originalname}`);
      
      try {
        // Advanced preprocessing pipeline for optimal handwriting recognition
        console.log(`  🔧 Applying advanced image preprocessing...`);
        console.log(`  📁 File path: ${file.path}`);
        console.log(`  📊 File size: ${file.size} bytes`);
        
        // Step 1: HANDWRITING-SPECIFIC preprocessing pipeline
        console.log(`  🖼️ Starting HANDWRITING-OPTIMIZED Sharp processing...`);
        let processedImageBuffer;
        try {
          // Get image metadata first
          const metadata = await sharp(file.path).metadata();
          console.log(`  📊 Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
          
          // HANDWRITING-OPTIMIZED approach: enhance contrast and clarity for handwritten text
          processedImageBuffer = await sharp(file.path)
            .resize(2500, 2500, { 
              fit: 'inside',
              withoutEnlargement: false,
              kernel: sharp.kernel.lanczos3 // High-quality resizing
            })
            .linear(1.3, -30) // Enhance contrast for better text separation
            .modulate({ 
              brightness: 1.05, 
              saturation: 0, // Remove color
              hue: 0 
            })
            .sharpen({ 
              sigma: 1.5, 
              m1: 0.5, 
              m2: 2, 
              x1: 2, 
              y2: 8 
            }) // Enhanced sharpening for handwriting
            .normalize({ lower: 10, upper: 90 }) // Better contrast range
            .grayscale() // Convert to grayscale
            .png({ quality: 100, compressionLevel: 0 }) // Highest quality
            .toBuffer();
          console.log(`  ✅ HANDWRITING-OPTIMIZED Sharp processing completed successfully`);
        } catch (sharpError) {
          console.error(`  ❌ Sharp processing failed:`, sharpError);
          throw new Error(`Image processing failed: ${sharpError.message}`);
        }

// Step 2: Use EasyOCR for handwriting recognition (PHOTO UPLOADS ONLY)
console.log(`  🔤 Starting EasyOCR for handwriting recognition...`);
let text = '';

try {
  // Initialize EasyOCR reader (English)
  const ocr = new EasyOCR();
  await ocr.init(['en']);

  // Process image with EasyOCR
  const result = await ocr.readText(file.path);

  // Extract text from EasyOCR results
  if (result && result.length > 0) {
    text = result.map(item => item.text).join(' ');
    console.log(`  ✅ EasyOCR completed successfully`);
    console.log(`  📝 Extracted text length: ${text.length} characters`);
    console.log(`  📖 Text preview: ${text.substring(0, 200)}...`);
    console.log(`  🎯 Detected ${result.length} text regions`);
  } else {
    console.log(`  ⚠️ EasyOCR found no text in image`);
    text = '';
  }

} catch (easyocrError) {
  console.error(`  ❌ EasyOCR failed:`, easyocrError.message);
  text = '';
}

        // Post-processing: Clean and correct the extracted text
        if (text && text.trim()) {
          console.log(`  🔧 Applying post-processing corrections...`);
          
          // Clean up common OCR errors
          text = postProcessOCRText(text);
          
          allExtractedText += `\n\n--- Image ${i + 1}: ${file.originalname} ---\n${text.trim()}`;
          console.log(`✅ Extracted and corrected ${text.length} characters from ${file.originalname}`);
        } else {
          console.log(`⚠️ No text extracted from ${file.originalname}`);
        }

        processedImages++;
      } catch (imageError) {
        console.error(`❌ Error processing image ${file.originalname}:`, imageError);
        console.error(`❌ Image error stack:`, imageError.stack);
        console.error(`❌ Image error details:`, {
          name: imageError.name,
          message: imageError.message,
          code: imageError.code
        });
        // Continue with other images even if one fails
      }
    }

    if (!allExtractedText.trim()) {
      throw new Error('No text could be extracted from any of the uploaded images');
    }

    // Split text into pages (similar to PDF processing)
    const pages = splitTextIntoPages(allExtractedText, Math.max(1, Math.ceil(processedImages / 2)));

    console.log('\n' + '🎯'.repeat(20));
    console.log('🎯 SENDING RESPONSE TO FRONTEND');
    console.log('🎯'.repeat(20));
    console.log(`✅ Success: true`);
    console.log(`📸 Images processed: ${processedImages}/${totalImages}`);
    console.log(`🔢 Total characters: ${allExtractedText.length.toLocaleString()}`);
    console.log(`📑 Split into ${pages.length} page texts`);
    console.log(`🚀 Enhanced with Phase 1 & 2 improvements:`);
    console.log(`   • Multiple PSM modes with confidence scoring`);
    console.log(`   • Advanced preprocessing strategies`);
    console.log(`   • Post-processing text correction`);
    console.log(`   • Handwriting-optimized settings`);
    console.log('🎯'.repeat(20) + '\n');

    // Clean up uploaded files
    req.files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    console.log('🧹 Uploaded files cleaned up');

    console.log('📄 FINAL EXTRACTED TEXT DEBUG:');
    console.log(`📊 Total text length: ${allExtractedText.length} characters`);
    console.log(`📝 Text preview (first 500 chars): ${allExtractedText.substring(0, 500)}`);
    console.log(`📚 Number of pages: ${pages.length}`);
    console.log(`🖼️ Images processed: ${processedImages}/${totalImages}`);

    res.json({
      success: true,
      message: 'Images processed successfully via OCR',
      result: {
        text: allExtractedText, // Full extracted text
        pages: pages, // Page-by-page text
        pageCount: pages.length,
        imagesProcessed: processedImages,
        totalImages: totalImages
      },
      filenames: req.files.map(f => f.originalname)
    });

  } catch (error) {
    console.error('\n' + '💥'.repeat(20));
    console.error('💥 IMAGE PROCESSING ERROR');
    console.error('💥'.repeat(20));
    console.error(`❌ Error: ${error.message}`);
    console.error(`📁 Files: ${req.files?.length || 0} images`);
    console.error('💥'.repeat(20) + '\n');
    
    // Clean up files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      console.log('🧹 Error files cleaned up');
    }

    res.status(500).json({
      error: 'Failed to process images',
      details: error.message
    });
  }
});

// PDF text extraction removed - now handled by Zapier webhook

// PDF text extraction endpoint removed - now handled by Zapier webhook

// PDF processing endpoint using PDF.co API
app.post('/api/process-pdf', pdfUpload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('\n' + '🔥'.repeat(20));
    console.log('🔥 INCOMING PDF UPLOAD REQUEST');
    console.log('🔥'.repeat(20));
    console.log(`📁 File: ${req.file.originalname}`);
    console.log(`📏 Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Warn about large files
    if (req.file.size > 10 * 1024 * 1024) {
      console.log('⚠️ Large file detected - processing may take longer...');
    }
    console.log(`📍 Path: ${req.file.path}`);
    console.log('🔥'.repeat(20) + '\n');

    // Import pdf-parse for local PDF processing
    const pdfParse = require('pdf-parse');
    
    // Process the PDF locally using pdf-parse
    const dataBuffer = fs.readFileSync(req.file.path);
    const result = await pdfParse(dataBuffer);
    
    // Split text into pages (approximate - pdf-parse doesn't give exact page boundaries)
    const pages = splitTextIntoPages(result.text, result.numpages);
    
    console.log('\n' + '🎯'.repeat(20));
    console.log('🎯 SENDING RESPONSE TO FRONTEND');
    console.log('🎯'.repeat(20));
    console.log(`✅ Success: true`);
    console.log(`📄 Filename: ${req.file.originalname}`);
    console.log(`📊 Pages: ${result.numpages}`);
    console.log(`🔢 Characters: ${result.text.length.toLocaleString()}`);
    console.log(`📑 Split into ${pages.length} page texts`);
    console.log('🎯'.repeat(20) + '\n');

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    console.log('🧹 Uploaded file cleaned up');

    res.json({
      success: true,
      message: 'PDF processed successfully via local pdf-parse',
      result: {
        text: result.text, // Keep full text for backward compatibility
        pages: pages, // New: page-by-page text
        pageCount: result.numpages
      },
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('\n' + '💥'.repeat(20));
    console.error('💥 PDF PROCESSING ERROR');
    console.error('💥'.repeat(20));
    console.error(`❌ Error: ${error.message}`);
    console.error(`📁 File: ${req.file?.originalname || 'Unknown'}`);
    console.error('💥'.repeat(20) + '\n');
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🧹 Error file cleaned up');
    }

    res.status(500).json({
      error: 'Failed to process PDF',
      details: error.message
    });
  }
});

// Test PDF processing endpoint
app.post('/api/test-processing', async (req, res) => {
  try {
    console.log('🧪 Testing PDF processing system...');
    
    res.json({
      success: true,
      message: 'PDF processing system is ready',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({
      error: 'Test failed',
      details: error.message
    });
  }
});

// AI Service endpoints
app.post('/api/ai/generate-flashcards', async (req, res) => {
  try {
    const { content, subject, topic, userId, nativeLanguage, showNativeLanguage } = req.body;
    
    if (!content || !subject || !topic || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, subject, topic, userId' 
      });
    }

    console.log('\n' + '🤖'.repeat(20));
    console.log('🤖 AI FLASHCARD GENERATION REQUEST');
    console.log('🤖'.repeat(20));
    console.log(`📝 Subject: ${subject}`);
    console.log(`📚 Topic: ${topic}`);
    console.log(`👤 User: ${userId}`);
    console.log(`🌍 Native Language: ${nativeLanguage || 'English'}`);
    console.log(`🔄 Show Native Language: ${showNativeLanguage || false}`);
    console.log(`📄 Content length: ${content.length} characters`);
    console.log('🤖'.repeat(20) + '\n');

    const result = await AIService.generateFlashcards(
      content, 
      subject, 
      topic, 
      userId, 
      nativeLanguage || 'English', 
      showNativeLanguage || false
    );
    
    console.log('\n' + '✅'.repeat(20));
    console.log('✅ FLASHCARD GENERATION SUCCESS');
    console.log('✅'.repeat(20));
    console.log(`📊 Generated: ${result.flashcards.length} flashcards`);
    console.log(`🔢 Tokens used: ${result.tokenUsage}`);
    console.log('✅'.repeat(20) + '\n');

    res.json(result);

  } catch (error) {
    console.error('\n' + '❌'.repeat(20));
    console.error('❌ FLASHCARD GENERATION ERROR');
    console.error('❌'.repeat(20));
    console.error(`Error: ${error.message}`);
    console.error('❌'.repeat(20) + '\n');
    
    res.status(500).json({
      error: 'Failed to generate flashcards',
      details: error.message
    });
  }
});

app.post('/api/ai/generate-lesson', async (req, res) => {
  try {
    const { content, subject, topic, userId, nativeLanguage } = req.body;
    
    if (!content || !subject || !topic || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, subject, topic, userId' 
      });
    }

    console.log('\n' + '📚'.repeat(20));
    console.log('📚 AI LESSON GENERATION REQUEST');
    console.log('📚'.repeat(20));
    console.log(`📝 Subject: ${subject}`);
    console.log(`📚 Topic: ${topic}`);
    console.log(`👤 User: ${userId}`);
    console.log(`🌍 Native Language: ${nativeLanguage || 'English'}`);
    console.log(`📄 Content length: ${content.length} characters`);
    console.log('📚'.repeat(20) + '\n');

    const result = await AIService.generateLesson(content, subject, topic, userId, nativeLanguage || 'English');
    
    console.log('\n' + '✅'.repeat(20));
    console.log('✅ LESSON GENERATION SUCCESS');
    console.log('✅'.repeat(20));
    console.log(`📊 Lesson: ${result.lessons?.[0]?.title || 'Unknown'}`);
    console.log(`🔢 Tokens used: ${result.tokenUsage}`);
    console.log('✅'.repeat(20) + '\n');

    res.json(result);

  } catch (error) {
    console.error('\n' + '❌'.repeat(20));
    console.error('❌ LESSON GENERATION ERROR');
    console.error('❌'.repeat(20));
    console.error(`Error: ${error.message}`);
    console.error('❌'.repeat(20) + '\n');
    
    res.status(500).json({
      error: 'Failed to generate lesson',
      details: error.message
    });
  }
});

// AI Service status endpoint
app.get('/api/ai/status', (req, res) => {
  try {
    const status = AIService.getStatus();
    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({
      error: 'Failed to get AI service status',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`\n🏥 Health check request from ${clientIP} - ${userAgent}`);
  
  // Log successful health check
  networkLogger.logSuccess(
    'response_receive',
    `health_check:${clientIP}`,
    0,
    { 
      client_ip: clientIP,
      user_agent: userAgent,
      endpoint: '/health'
    }
  );
  
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    client_ip: clientIP
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 25MB for PDFs and 10MB for images.',
        code: 'FILE_TOO_LARGE',
        maxSize: req.route?.path?.includes('image') ? '10MB' : '25MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Maximum 5 images per request.',
        code: 'TOO_MANY_FILES',
        maxFiles: 5
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Unexpected file field. Please check your upload form.',
        code: 'UNEXPECTED_FILE'
      });
    }
  }
  
  // Handle timeout errors
  if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    return res.status(408).json({ 
      error: 'Request timeout. The file may be too large or processing is taking too long.',
      code: 'TIMEOUT',
      suggestion: 'Try with a smaller file or split large documents into smaller parts.'
    });
  }
  
  // Handle memory errors
  if (error.message.includes('out of memory') || error.code === 'ENOMEM') {
    return res.status(413).json({ 
      error: 'File too large for processing. Please try with a smaller file.',
      code: 'OUT_OF_MEMORY',
      suggestion: 'Try compressing your images or splitting large PDFs.'
    });
  }
  
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong. Please try again.'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  // Update frontend configuration with current IP
  updateFrontendConfig();
  
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`🌐 Network accessible at: http://${LOCAL_IP}:${PORT}`);
  
  // Network connectivity tests removed - not necessary for local development
});

module.exports = app;
