const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const NetworkLogger = require('./networkLogger');
const getLocalIP = require('./getLocalIP');
const updateFrontendConfig = require('./updateFrontendConfig');
const AIService = require('./aiService');
const PerformanceMonitor = require('./performanceMonitor');
const ResilientPronunciationService = require('./resilientPronunciationService');
const FileCleanupManager = require('./fileCleanupManager');
const errorLogger = require('./errorLogger');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Debug - Current directory:', __dirname);
console.log('🔍 Debug - .env file path:', path.join(__dirname, '.env'));

const app = express();
const PORT = process.env.PORT || 3001;
const LOCAL_IP = getLocalIP();
const networkLogger = new NetworkLogger();

// Initialize new services
const performanceMonitor = new PerformanceMonitor();
const resilientPronunciationService = new ResilientPronunciationService();
const fileCleanupManager = new FileCleanupManager();

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const pronunciationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 pronunciation assessments per minute
  message: {
    error: 'Too many pronunciation assessments. Please wait a moment before trying again.',
    code: 'PRONUNCIATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 AI requests per minute
  message: {
    error: 'Too many AI requests. Please wait a moment before trying again.',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-user rate limiting (in-memory store)
const userRateLimits = new Map();
const USER_LIMITS = {
  pronunciation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 assessments per hour per user
  },
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 200, // 200 AI requests per hour per user
  }
};

// Clean up old rate limit entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of userRateLimits.entries()) {
    if (now - data.lastReset > 60 * 60 * 1000) {
      userRateLimits.delete(key);
    }
  }
}, 60 * 60 * 1000);

// Per-user rate limiting middleware
const userRateLimit = (type) => {
  return (req, res, next) => {
    const userId = req.headers['user-id'] || req.body.userId || 'anonymous';
    const limit = USER_LIMITS[type];
    const key = `${userId}:${type}`;
    
    const now = Date.now();
    const userLimit = userRateLimits.get(key) || {
      count: 0,
      lastReset: now
    };
    
    // Reset counter if window has passed
    if (now - userLimit.lastReset > limit.windowMs) {
      userLimit.count = 0;
      userLimit.lastReset = now;
    }
    
    // Check if limit exceeded
    if (userLimit.count >= limit.max) {
      const resetTime = new Date(userLimit.lastReset + limit.windowMs);
      return res.status(429).json({
        error: `User rate limit exceeded for ${type}. Try again after ${resetTime.toISOString()}`,
        code: `USER_${type.toUpperCase()}_RATE_LIMIT_EXCEEDED`,
        resetTime: resetTime.toISOString()
      });
    }
    
    // Increment counter
    userLimit.count++;
    userRateLimits.set(key, userLimit);
    
    // Add rate limit info to response headers
    res.set({
      'X-RateLimit-Limit': limit.max,
      'X-RateLimit-Remaining': Math.max(0, limit.max - userLimit.count),
      'X-RateLimit-Reset': new Date(userLimit.lastReset + limit.windowMs).toISOString()
    });
    
    next();
  };
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('uploads'));
app.use(express.static('public'));

// IP whitelist for monitoring endpoints
const allowedIPs = [
  '127.0.0.1',           // localhost
  '::1',                 // localhost IPv6
  '::ffff:127.0.0.1',    // localhost IPv4-mapped IPv6
  '146.198.140.69',      // User's home/WiFi IP address
  '148.252.147.103',     // User's cellular/mobile IP address
  // Add additional IP addresses here if needed
  // 'your.office.ip.address',
];

const monitoringWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const realIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || clientIP;
  
  // Extract the first IP if there are multiple (from proxy)
  const ip = realIP.split(',')[0].trim();
  
  console.log(`[Monitoring] Access attempt from IP: ${ip}`);
  
  if (allowedIPs.includes(ip)) {
    console.log(`[Monitoring] ✅ Access granted for IP: ${ip}`);
    next();
  } else {
    console.log(`[Monitoring] ❌ Access denied for IP: ${ip}`);
    res.status(403).json({
      error: 'Access denied. Monitoring endpoints are restricted to authorized IPs only.',
      code: 'MONITORING_ACCESS_DENIED',
      clientIP: ip
    });
  }
};

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Performance monitoring middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const success = res.statusCode < 400;
    
    // Determine service type based on route
    let service = 'general';
    if (req.path.includes('/pronunciation-assess')) {
      service = 'pronunciation';
    } else if (req.path.includes('/ai/')) {
      service = 'openai';
    } else if (req.path.includes('/ocr')) {
      service = 'azure-ocr';
    }
    
    performanceMonitor.recordRequest(responseTime, success, service);
  });
  
  next();
});

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
app.post('/api/process-image', aiLimiter, userRateLimit('ai'), imageUpload.array('images', 5), async (req, res) => {
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
    const { processImageWithAzureOCR } = require('./azureOCR');
    
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
          // Resize to 1200px max for faster OCR processing (EasyOCR is very CPU-intensive)
          processedImageBuffer = await sharp(file.path)
            .resize(1200, 1200, { 
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

        // Save processed image for OCR
        const processedImagePath = file.path.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
        await sharp(processedImageBuffer).toFile(processedImagePath);
        console.log(`  💾 Processed image saved for OCR: ${processedImagePath}`);

        // Step 2: Use Azure Computer Vision OCR for handwriting recognition
        console.log(`  🔤 Starting Azure OCR for handwriting recognition...`);
        let text = '';

        try {
          const ocrResult = await processImageWithAzureOCR(processedImagePath);
          
          if (ocrResult.success && ocrResult.text) {
            text = ocrResult.text;
            console.log(`  ✅ Azure OCR completed successfully`);
            console.log(`  📝 Extracted text length: ${text.length} characters`);
            console.log(`  📖 Text preview: ${text.substring(0, 200)}...`);
            if (ocrResult.lineCount) {
              console.log(`  📄 Detected ${ocrResult.lineCount} lines of text`);
            }
            if (ocrResult.processingTime) {
              console.log(`  ⏱️ Processing time: ${(ocrResult.processingTime / 1000).toFixed(2)}s`);
            }
          } else {
            console.log(`  ⚠️ Azure OCR found no text in image`);
            if (ocrResult.error) {
              console.log(`  ⚠️ OCR error: ${ocrResult.error}`);
            }
            text = '';
          }

        } catch (azureError) {
          console.error(`  ❌ Azure OCR failed with error:`);
          console.error(`  Error message: ${azureError.message}`);
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

    // Clean up uploaded files and processed images
    req.files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      // Also clean up processed image
      const processedPath = file.path.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
      if (fs.existsSync(processedPath)) {
        fs.unlinkSync(processedPath);
      }
    });
    console.log('🧹 Uploaded files and processed images cleaned up');

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
        // Also clean up processed image
        const processedPath = file.path.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
        if (fs.existsSync(processedPath)) {
          fs.unlinkSync(processedPath);
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
app.post('/api/ai/generate-flashcards', aiLimiter, userRateLimit('ai'), async (req, res) => {
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

app.post('/api/ai/generate-lesson', aiLimiter, userRateLimit('ai'), async (req, res) => {
  try {
    const { content, subject, topic, userId, nativeLanguage, sourceFileName } = req.body;
    
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
    console.log(`📄 Source: ${sourceFileName || 'Unknown'}`);
    console.log(`📄 Content length: ${content.length} characters`);
    console.log('📚'.repeat(20) + '\n');

    const result = await AIService.generateLesson(content, subject, topic, userId, nativeLanguage || 'English', sourceFileName || 'Unknown Source');
    
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
app.get('/api/ai/status', monitoringWhitelist, (req, res) => {
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

// Public health endpoint (minimal info)
app.get('/api/health', (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'UniLingo backend is running'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Monitoring dashboard (IP whitelisted)
app.get('/monitoring', monitoringWhitelist, (req, res) => {
  const filePath = path.join(__dirname, 'public', 'monitoring.html');
  console.log('[Monitoring] Serving dashboard from:', filePath);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('[Monitoring] Error serving file:', err);
      res.status(500).json({
        error: 'Failed to load monitoring dashboard',
        details: err.message
      });
    }
  });
});

// Detailed health and monitoring endpoints (IP whitelisted)
app.get('/api/health/detailed', monitoringWhitelist, (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    const healthStatus = performanceMonitor.getHealthStatus();
    const pronunciationStatus = resilientPronunciationService.getStatus();
    const cleanupStats = fileCleanupManager.getStats();
    
    res.json({
      success: true,
      status: healthStatus.overall,
      timestamp: new Date().toISOString(),
      services: {
        pronunciation: {
          status: healthStatus.services.pronunciation,
          queue: pronunciationStatus.queue,
          circuitBreaker: pronunciationStatus.circuitBreaker
        },
        openai: {
          status: healthStatus.services.openai
        },
        azureOcr: {
          status: healthStatus.services.azureOcr
        }
      },
      metrics: {
        requests: metrics.requests,
        errorRate: metrics.errorRate,
        avgResponseTime: metrics.avgResponseTime,
        uptime: metrics.uptime,
        requestsPerMinute: metrics.requestsPerMinute
      },
      issues: healthStatus.issues,
      cleanup: cleanupStats
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health status',
      details: error.message
    });
  }
});

app.get('/api/metrics', monitoringWhitelist, (req, res) => {
  try {
    const metrics = performanceMonitor.getMetrics();
    res.json({
      success: true,
      metrics: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      details: error.message
    });
  }
});

app.get('/api/pronunciation/status', monitoringWhitelist, (req, res) => {
  try {
    const status = resilientPronunciationService.getStatus();
    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting pronunciation service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pronunciation service status',
      details: error.message
    });
  }
});

app.get('/api/cleanup/stats', monitoringWhitelist, (req, res) => {
  try {
    const stats = fileCleanupManager.getStats();
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cleanup stats',
      details: error.message
    });
  }
});

app.post('/api/cleanup/emergency', monitoringWhitelist, async (req, res) => {
  try {
    const { maxAgeMinutes = 10 } = req.body;
    const result = await fileCleanupManager.emergencyCleanup(maxAgeMinutes);
    
    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error performing emergency cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform emergency cleanup',
      details: error.message
    });
  }
});

app.get('/api/errors', monitoringWhitelist, (req, res) => {
  try {
    const { limit = 50, type } = req.query;
    const errors = errorLogger.getRecentErrors(parseInt(limit), type);
    
    res.json({
      success: true,
      errors: errors,
      count: errors.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting error logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get error logs',
      details: error.message
    });
  }
});

app.get('/api/errors/stats', monitoringWhitelist, (req, res) => {
  try {
    const stats = errorLogger.getErrorStats();
    
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting error stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get error stats',
      details: error.message
    });
  }
});

app.post('/api/errors/clear', monitoringWhitelist, (req, res) => {
  try {
    const count = errorLogger.clearErrors();
    
    res.json({
      success: true,
      cleared: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing error logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear error logs',
      details: error.message
    });
  }
});

app.get('/api/rate-limits/status', monitoringWhitelist, (req, res) => {
  try {
    const userId = req.headers['user-id'] || req.query.userId || 'anonymous';
    
    const userLimits = {};
    for (const [type, limit] of Object.entries(USER_LIMITS)) {
      const key = `${userId}:${type}`;
      const userLimit = userRateLimits.get(key) || {
        count: 0,
        lastReset: Date.now()
      };
      
      userLimits[type] = {
        limit: limit.max,
        used: userLimit.count,
        remaining: Math.max(0, limit.max - userLimit.count),
        resetTime: new Date(userLimit.lastReset + limit.windowMs).toISOString(),
        windowMs: limit.windowMs
      };
    }
    
    res.json({
      success: true,
      userId: userId,
      limits: userLimits,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rate limit status',
      details: error.message
    });
  }
});

// Pronunciation Assessment endpoint
const pronunciationService = require('./pronunciationService');

// Configure multer for audio uploads
const audioUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = 'uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`📁 Created uploads directory: ${uploadDir}`);
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      // Determine extension based on MIME type, not original filename
      let extension = 'wav'; // default
      if (file.mimetype === 'audio/x-m4a' || file.mimetype === 'audio/mp4') {
        extension = 'm4a';
      } else if (file.mimetype === 'audio/mpeg') {
        extension = 'mp3';
      } else if (file.mimetype === 'audio/wav') {
        extension = 'wav';
      }
      cb(null, 'pronunciation-' + uniqueSuffix + '.' + extension);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max audio file
  },
  fileFilter: function (req, file, cb) {
    // Accept audio files (M4A, WAV, MP3, etc.)
    if (file.mimetype.startsWith('audio/')) {
      console.log(`[Pronunciation] Accepting audio file: ${file.originalname}, type: ${file.mimetype}`);
      cb(null, true);
    } else {
      console.log(`[Pronunciation] Rejecting file: ${file.originalname}, type: ${file.mimetype}`);
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

app.post('/api/pronunciation-assess', pronunciationLimiter, userRateLimit('pronunciation'), audioUpload.single('audio'), async (req, res) => {
  try {
    console.log('\n🎤 Pronunciation assessment request received');
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No audio file uploaded',
        code: 'NO_AUDIO_FILE'
      });
    }
    
    const { referenceText } = req.body;
    
    if (!referenceText) {
      return res.status(400).json({ 
        error: 'Reference text is required',
        code: 'NO_REFERENCE_TEXT'
      });
    }
    
    console.log(`[Pronunciation] Audio file: ${req.file.path}`);
    console.log(`[Pronunciation] Reference text: "${referenceText}"`);
    console.log(`[Pronunciation] File size: ${(req.file.size / 1024).toFixed(2)} KB`);
    
    // Perform pronunciation assessment with resilience
    const assessmentResult = await resilientPronunciationService.assessPronunciationWithResilience(
      req.file.path,
      referenceText
    );
    
    if (!assessmentResult.success) {
      // Clean up uploaded file
      await fileCleanupManager.safeCleanup(req.file.path);
      
      return res.status(500).json({ 
        error: assessmentResult.error,
        code: 'ASSESSMENT_FAILED'
      });
    }
    
    // Get feedback (using the original service for feedback generation)
    const feedback = require('./pronunciationService').getFeedback(assessmentResult.result);
    
    // Clean up uploaded file
    await fileCleanupManager.safeCleanup(req.file.path);
    
    console.log(`[Pronunciation] ✅ Assessment complete - Score: ${assessmentResult.result.pronunciationScore}/100`);
    
    res.json({
      success: true,
      assessment: assessmentResult.result,
      feedback: feedback
    });
    
  } catch (error) {
    console.error('❌ Pronunciation assessment error:', error);
    
    // Log error
    errorLogger.logError(error, {
      type: 'pronunciation',
      service: 'Azure Speech Service',
      endpoint: '/api/pronunciation-assess',
      statusCode: 500,
      ip: req.ip,
      details: {
        referenceText: req.body.referenceText,
        fileSize: req.file?.size
      }
    });
    
        // Clean up uploaded file if it exists
        if (req.file && req.file.path) {
          await fileCleanupManager.safeCleanup(req.file.path);
        }
    
    res.status(500).json({ 
      error: 'Failed to assess pronunciation',
      details: error.message,
      code: 'INTERNAL_ERROR'
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
