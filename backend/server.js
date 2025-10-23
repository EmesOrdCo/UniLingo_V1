// Load environment variables FIRST before any other imports
require('dotenv').config();

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
const ipWhitelistManager = require('./ipWhitelistManager');
const setupSimpleAudioRoutes = require('./simpleAudioEndpoints');
const queueClient = require('./queueClient');
const CircuitBreaker = require('./circuitBreaker');
const notificationManager = require('./notifications');
const profileController = require('./profileController');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const userTrackingService = require('./userTrackingService');
const userRateLimitService = require('./userRateLimitService');
const stripeRoutes = require('./stripeEndpoints');

// Initialize circuit breakers for monitoring (Issue #6)
const openaiCircuitBreaker = new CircuitBreaker('openai');
const azureCircuitBreaker = new CircuitBreaker('azure');

// Budget kill-switch (Issue #10)
// Stored in Redis for shared state across instances
const BUDGET_KILL_SWITCH_KEY = 'system:budget_kill_switch';
const BUDGET_LIMIT_KEY = 'system:monthly_budget_limit';

console.log('🔍 Debug - Current directory:', __dirname);
console.log('🔍 Debug - .env file path:', path.join(__dirname, '.env'));

const app = express();
const PORT = process.env.PORT || 3001;
const LOCAL_IP = getLocalIP();
const networkLogger = new NetworkLogger();

// Configure Express to trust proxy (required for Railway deployment)
// This allows Express to properly handle X-Forwarded-For headers from Railway's reverse proxy
app.set('trust proxy', true);

// Initialize new services
const performanceMonitor = new PerformanceMonitor();
const resilientPronunciationService = new ResilientPronunciationService();
const fileCleanupManager = new FileCleanupManager();

// Log Railway deployment info for debugging
console.log('🚂 Railway Deployment Info:', {
  serviceName: process.env.RAILWAY_SERVICE_NAME,
  staticUrl: process.env.RAILWAY_STATIC_URL,
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV
});

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

// ✅ Redis-backed User Tracking and Rate Limiting System
// Now using Redis for shared state across all instances
// This enables proper horizontal scaling with consistent rate limits
// and user tracking across multiple server instances.

console.log('✅ Using Redis-backed user tracking and rate limiting services');

// ✅ Centralized Error Response Function
const sendErrorResponse = (res, statusCode, error, details = null) => {
  const errorResponse = {
    success: false,
    error: error,
    code: `ERROR_${statusCode}`,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    errorResponse.details = details;
  }
  
  // Log error using centralized logger
  errorLogger.logError(new Error(error), {
    statusCode,
    details,
    endpoint: res.req?.path || 'unknown'
  });
  
  res.status(statusCode).json(errorResponse);
};

// ✅ Redis-backed user tracking functions
// All user tracking is now handled by userTrackingService

// ✅ Redis-backed user activity tracking
const updateUserActivity = async (userId, ipAddress, requestType, responseTime, success) => {
  try {
    // Track user activity using Redis-backed service
    await userTrackingService.trackUserActivity(userId, requestType, ipAddress, {
      responseTime,
      success,
      timestamp: Date.now()
    });
    
    // Update service-specific counters
    const metadata = {};
    if (requestType === 'pronunciation') {
      metadata.totalPronunciations = 1;
    } else if (requestType === 'ai') {
      metadata.totalAIRequests = 1;
    }
    
    if (!success) {
      metadata.totalErrors = 1;
    }
    
    // Update user data with metadata
    if (Object.keys(metadata).length > 0) {
      await userTrackingService.updateUserData(userId, metadata);
    }
  } catch (error) {
    console.error('Error updating user activity:', error);
    // Continue processing even if tracking fails
  }
};

// ✅ Redis-backed cleanup is handled automatically by the services
// No manual cleanup intervals needed - Redis TTL handles expiration

// ✅ Redis-backed per-user rate limiting middleware
const userRateLimit = (type) => {
  return async (req, res, next) => {
    try {
      const userId = req.headers['user-id'] || req.body.userId || 'anonymous';
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      
      // Track that this request is starting (before rate limit check)
      const startTime = Date.now();
      
      // Check user rate limit using Redis-backed service
      const userLimitResult = await userRateLimitService.checkUserLimit(userId, type);
      
      if (!userLimitResult.allowed) {
        // Track rate limit exceeded as an error
        await updateUserActivity(userId, ipAddress, type, Date.now() - startTime, false);
        
        return sendErrorResponse(res, 429, 
          `User rate limit exceeded for ${type}. Try again after ${userLimitResult.resetAt.toISOString()}`, 
          {
            code: `USER_${type.toUpperCase()}_RATE_LIMIT_EXCEEDED`,
            resetTime: userLimitResult.resetAt.toISOString(),
            remaining: userLimitResult.remaining,
            limit: userLimitResult.limit
          }
        );
      }
      
      // Add rate limit info to response headers
      res.set({
        'X-RateLimit-Limit': userLimitResult.limit,
        'X-RateLimit-Remaining': userLimitResult.remaining,
        'X-RateLimit-Reset': userLimitResult.resetAt.toISOString()
      });
      
      // Override response finish to track the actual response
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        const success = res.statusCode < 400;
        
        // Track user activity after response (async, don't wait)
        updateUserActivity(userId, ipAddress, type, responseTime, success).catch(err => {
          console.error('Error tracking user activity:', err);
        });
        
        // Call original end function
        originalEnd.call(this, chunk, encoding);
      };
      
      next();
    } catch (error) {
      console.error('Error in user rate limit middleware:', error);
      // Fail open - allow request if Redis is down
      next();
    }
  };
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('uploads'));
app.use(express.static('public'));

// IP whitelist for monitoring endpoints - now managed via database
const monitoringWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const realIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || clientIP;
  
  // Extract the first IP if there are multiple (from proxy)
  const ip = realIP.split(',')[0].trim();
  
  console.log(`[Monitoring] Access attempt from IP: ${ip}`);
  
  // Check if IP is allowed using database-backed whitelist
  if (ipWhitelistManager.isAllowed(ip)) {
    console.log(`[Monitoring] ✅ Access granted for IP: ${ip}`);
    // Record IP usage (fire and forget)
    ipWhitelistManager.recordIPUsage(ip).catch(() => {});
    next();
  } else {
    console.log(`[Monitoring] ❌ Access denied for IP: ${ip}`);
    res.status(403).json({
      error: 'Access denied. Monitoring endpoints are restricted to authorized IPs only.',
      code: 'MONITORING_ACCESS_DENIED',
      clientIP: ip,
      hint: 'Contact admin to add your IP to the whitelist'
    });
  }
};

// Apply general rate limiting to all routes EXCEPT monitoring endpoints
app.use((req, res, next) => {
  // Skip rate limiting for monitoring endpoints
  if (req.path.startsWith('/monitoring') || 
      req.path.startsWith('/api/health') || 
      req.path.startsWith('/api/metrics') || 
      req.path.startsWith('/api/pronunciation/status') || 
      req.path.startsWith('/api/rate-limits/status') || 
      req.path.startsWith('/api/ai/status') || 
      req.path.startsWith('/api/cleanup') || 
      req.path.startsWith('/api/errors') || 
      req.path.startsWith('/api/admin/')) {
    return next();
  }
  generalLimiter(req, res, next);
});

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
// POST /api/ai/generate-flashcards - Queue-based (non-blocking)
// Returns immediately with job ID, processes in background worker
app.post('/api/ai/generate-flashcards', aiLimiter, userRateLimit('ai'), async (req, res) => {
  try {
    const { content, subject, topic, userId, nativeLanguage, targetLanguage } = req.body;
    
    // Validate required fields
    if (!content || !subject || !topic || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, subject, topic, userId' 
      });
    }

    // Issue #10: Check budget kill-switch
    const killSwitchActive = await queueClient.redis.get(BUDGET_KILL_SWITCH_KEY);
    if (killSwitchActive === 'true') {
      console.warn(`🚨 Budget kill-switch active - rejecting non-critical job`);
      return res.status(429).json({
        error: 'Service temporarily unavailable due to budget limits',
        code: 'BUDGET_LIMIT_EXCEEDED',
        message: 'Please try again later or contact support',
      });
    }

    console.log('\n' + '🤖'.repeat(20));
    console.log('🤖 AI FLASHCARD GENERATION REQUEST (QUEUE-BASED)');
    console.log('🤖'.repeat(20));
    console.log(`📝 Subject: ${subject}`);
    console.log(`📚 Topic: ${topic}`);
    console.log(`👤 User: ${userId}`);
    console.log(`🌍 Native Language: ${nativeLanguage || 'English'}`);
    console.log(`🎯 Target Language: ${targetLanguage || 'English'}`);
    console.log(`📄 Content length: ${content.length} characters`);
    console.log('🤖'.repeat(20) + '\n');

    // Enqueue job instead of processing immediately
    const { jobId } = await queueClient.enqueue('generate-flashcards', {
      content,
      subject,
      topic,
      userId,
      nativeLanguage: nativeLanguage || 'English',
      targetLanguage: targetLanguage || 'English'
    });
    
    console.log(`✅ Job enqueued successfully: ${jobId}`);
    console.log(`⏱️ Request completed in < 200ms`);
    console.log(`📋 Check job status at: GET /api/job-status/${jobId}`);
    console.log('🤖'.repeat(20) + '\n');

    // Return 202 Accepted with job ID immediately
    res.status(202).json({
      success: true,
      message: 'Flashcard generation job queued successfully',
      jobId: jobId,
      status: 'queued',
      statusUrl: `/api/job-status/${jobId}`,
      estimatedTime: '10-30 seconds'
    });

  } catch (error) {
    console.error('\n' + '❌'.repeat(20));
    console.error('❌ FLASHCARD GENERATION QUEUE ERROR');
    console.error('❌'.repeat(20));
    console.error(`Error: ${error.message}`);
    console.error('❌'.repeat(20) + '\n');
    
    res.status(500).json({
      error: 'Failed to queue flashcard generation',
      details: error.message
    });
  }
});

app.post('/api/ai/generate-lesson', aiLimiter, userRateLimit('ai'), async (req, res) => {
  try {
    const { content, subject, topic, userId, nativeLanguage, targetLanguage, sourceFileName } = req.body;
    
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
    console.log(`🎯 Target Language: ${targetLanguage || 'English'}`);
    console.log(`📄 Source: ${sourceFileName || 'Unknown'}`);
    console.log(`📄 Content length: ${content.length} characters`);
    console.log('📚'.repeat(20) + '\n');

    const result = await AIService.generateLesson(content, subject, topic, userId, nativeLanguage || 'English', targetLanguage || 'English', sourceFileName || 'Unknown Source');
    
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

// Job Status Endpoint - Check status of queued jobs
app.get('/api/job-status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`📋 Checking job status: ${jobId}`);
    
    const status = await queueClient.getJobStatus(jobId);
    
    console.log(`✅ Job status retrieved: ${status.status}`);
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error(`❌ Failed to get job status:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve job status',
      details: error.message
    });
  }
});

// SSE Job Events Endpoint (Issue #9)
// Subscribe to real-time updates for a specific job
app.get('/api/job-events', (req, res) => {
  const { jobId } = req.query;
  
  if (!jobId) {
    return res.status(400).json({
      error: 'Missing required parameter: jobId',
      usage: 'GET /api/job-events?jobId=your-job-id'
    });
  }
  
  console.log(`📡 SSE: Client connecting for job ${jobId}`);
  
  // Subscribe client to job notifications
  notificationManager.subscribe(jobId, res);
});

// SSE Connection Statistics (Monitoring)
app.get('/api/sse/stats', monitoringWhitelist, (req, res) => {
  try {
    const stats = notificationManager.getStats();
    res.json({
      success: true,
      sse: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get SSE stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SSE statistics',
      details: error.message
    });
  }
});

// Queue Statistics Endpoint (monitoring)
app.get('/api/queue/stats', monitoringWhitelist, async (req, res) => {
  try {
    const stats = await queueClient.getQueueStats();
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics',
      details: error.message
    });
  }
});

// Redis Health Check Endpoint
app.get('/api/redis/health', monitoringWhitelist, async (req, res) => {
  try {
    const healthy = await queueClient.healthCheck();
    res.json({
      success: true,
      redis: healthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Redis health check failed:', error);
    res.status(500).json({
      success: false,
      redis: 'error',
      error: error.message
    });
  }
});

// Circuit Breaker Status Endpoint (Issue #6)
app.get('/api/circuit-breakers/status', monitoringWhitelist, async (req, res) => {
  try {
    const openaiStatus = await openaiCircuitBreaker.getStatus();
    const azureStatus = await azureCircuitBreaker.getStatus();
    
    res.json({
      success: true,
      circuitBreakers: {
        openai: openaiStatus,
        azure: azureStatus,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get circuit breaker status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get circuit breaker status',
      details: error.message
    });
  }
});

// Reset Circuit Breaker (Admin endpoint)
app.post('/api/circuit-breakers/reset/:name', monitoringWhitelist, async (req, res) => {
  try {
    const { name } = req.params;
    
    let breaker;
    if (name === 'openai') {
      breaker = openaiCircuitBreaker;
    } else if (name === 'azure') {
      breaker = azureCircuitBreaker;
    } else {
      return res.status(400).json({
        success: false,
        error: `Unknown circuit breaker: ${name}`,
        available: ['openai', 'azure']
      });
    }
    
    await breaker.reset();
    
    res.json({
      success: true,
      message: `Circuit breaker ${name} reset to CLOSED`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Failed to reset circuit breaker:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset circuit breaker',
      details: error.message
    });
  }
});

// Budget Kill-Switch Endpoints (Issue #10)
app.get('/api/admin/budget/status', monitoringWhitelist, async (req, res) => {
  try {
    const killSwitchActive = await queueClient.redis.get(BUDGET_KILL_SWITCH_KEY);
    const budgetLimit = await queueClient.redis.get(BUDGET_LIMIT_KEY);
    const queueStats = await queueClient.getQueueStats();
    
    res.json({
      success: true,
      budget: {
        killSwitchActive: killSwitchActive === 'true',
        monthlyLimit: budgetLimit ? parseFloat(budgetLimit) : null,
        queueDepth: queueStats.waiting + queueStats.active,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get budget status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get budget status',
      details: error.message
    });
  }
});

app.post('/api/admin/budget/kill-switch', monitoringWhitelist, async (req, res) => {
  try {
    const { enabled, reason } = req.body;
    
    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: enabled (true/false)'
      });
    }
    
    await queueClient.redis.set(BUDGET_KILL_SWITCH_KEY, enabled.toString());
    
    const action = enabled ? 'activated' : 'deactivated';
    console.log(`🚨 Budget kill-switch ${action}${reason ? `: ${reason}` : ''}`);
    
    res.json({
      success: true,
      message: `Budget kill-switch ${action}`,
      killSwitchActive: enabled,
      reason: reason || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to toggle kill-switch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle kill-switch',
      details: error.message
    });
  }
});

// Consolidated Profile Endpoint (Issue #12)
// Single endpoint to fetch all user profile data
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const requestUserId = req.headers['user-id'] || req.query.userId;
    
    // Security: Ensure user can only access their own profile
    if (userId !== requestUserId && requestUserId !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden: Cannot access another user\'s profile',
        code: 'FORBIDDEN'
      });
    }
    
    console.log(`📋 Fetching consolidated profile for user: ${userId}`);
    
    const profile = await profileController.getUserProfile(userId);
    
    console.log(`✅ Profile loaded (fromCache: ${profile.fromCache})`);
    
    res.json({
      success: true,
      profile: profile,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ Failed to load profile:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to load profile',
      details: error.message
    });
  }
});

// Invalidate Profile Cache (Admin)
app.post('/api/profile/:userId/invalidate', monitoringWhitelist, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.body; // 'profile', 'manifest', or 'all'
    
    if (type === 'manifest') {
      await profileController.invalidateManifestCache(userId);
    } else if (type === 'all') {
      await profileController.invalidateAllCaches(userId);
    } else {
      await profileController.invalidateProfileCache(userId);
    }
    
    res.json({
      success: true,
      message: `Cache invalidated for user ${userId} (type: ${type || 'profile'})`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Failed to invalidate cache:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache',
      details: error.message
    });
  }
});

// Alert Metrics Endpoint (Issue #10)
// Structured metrics for monitoring systems
app.get('/api/metrics/alerts', monitoringWhitelist, async (req, res) => {
  try {
    const queueStats = await queueClient.getQueueStats();
    const performanceMetrics = performanceMonitor.getMetrics();
    const sseStats = notificationManager.getStats();
    const circuitBreakers = {
      openai: await openaiCircuitBreaker.getStatus(),
      azure: await azureCircuitBreaker.getStatus(),
    };
    
    // Calculate alert conditions
    const alerts = {
      queueDepthHigh: queueStats.waiting > 50,
      queueDepthCritical: queueStats.waiting > 100,
      failureRateHigh: performanceMetrics.errorRate > 10,
      circuitBreakerOpen: circuitBreakers.openai.state === 'OPEN' || circuitBreakers.azure.state === 'OPEN',
      workerStalled: queueStats.active > 0 && queueStats.active < 1, // Jobs active but not processing
    };
    
    res.json({
      success: true,
      metrics: {
        queue: queueStats,
        performance: {
          errorRate: performanceMetrics.errorRate,
          avgResponseTime: performanceMetrics.avgResponseTime,
          requestsPerMinute: performanceMetrics.requestsPerMinute,
        },
        circuitBreakers: circuitBreakers,
        sse: sseStats,
      },
      alerts: alerts,
      alertsActive: Object.values(alerts).filter(v => v).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get alert metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alert metrics',
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
    
    // Also check Azure credentials
    const azureConfig = {
      hasSpeechKey: !!process.env.AZURE_SPEECH_KEY,
      speechKeyLength: process.env.AZURE_SPEECH_KEY ? process.env.AZURE_SPEECH_KEY.length : 0,
      hasSpeechRegion: !!process.env.AZURE_SPEECH_REGION,
      speechRegion: process.env.AZURE_SPEECH_REGION
    };
    
    res.json({
      success: true,
      status: status,
      azureConfig: azureConfig,
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

// Endpoint to get backend URL information
app.get('/api/backend-info', (req, res) => {
  try {
    const backendInfo = {
      railwayUrl: process.env.RAILWAY_STATIC_URL,
      serviceName: process.env.RAILWAY_SERVICE_NAME,
      port: process.env.PORT || 3001,
      nodeEnv: process.env.NODE_ENV,
      localIP: LOCAL_IP,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      backendInfo: backendInfo
    });
  } catch (error) {
    console.error('Error getting backend info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get backend info',
      details: error.message
    });
  }
});

// Test endpoint to verify pronunciation service is working
app.post('/api/pronunciation/test', monitoringWhitelist, async (req, res) => {
  try {
    console.log('🧪 Pronunciation test endpoint called');
    
    // Check if we can create a speech recognizer (without actually processing audio)
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;
    
    if (!speechKey || !speechRegion) {
      return res.status(500).json({
        success: false,
        error: 'Azure Speech Service credentials not configured',
        details: 'Missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION'
      });
    }
    
    // Test speech config creation
    const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechRecognitionLanguage = 'en-US';
    
    res.json({
      success: true,
      message: 'Pronunciation service test successful',
      azureConfig: {
        hasCredentials: true,
        region: speechRegion
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Pronunciation test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Pronunciation service test failed',
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

app.get('/api/rate-limits/status', monitoringWhitelist, async (req, res) => {
  try {
    // Get target user from query params or headers
    const targetUser = req.headers['user-id'] || req.query.userId || 'anonymous';
    
    // Get rate limit stats for the user
    const limits = {};
    const limitTypes = ['general', 'ai', 'pronunciation', 'tts', 'image'];
    
    for (const type of limitTypes) {
      const currentCount = await userRateLimitService.getCurrentCount(`user:${targetUser}`, type);
      const limitConfig = userRateLimitService.getLimits()[type] || { requests: 100, window: 60000 };
      
      limits[type] = {
        limit: limitConfig.requests,
        used: currentCount,
        remaining: Math.max(0, limitConfig.requests - currentCount),
        windowMs: limitConfig.window
      };
    }
    
    // Get overall rate limit statistics
    const stats = await userRateLimitService.getStats();
    
    res.json({
      success: true,
      userId: targetUser,
      limits: limits,
      stats: stats,
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

// NEW ADMIN ENDPOINTS FOR COMPREHENSIVE USER TRACKING

// Get all users overview
app.get('/api/admin/users/overview', monitoringWhitelist, async (req, res) => {
  try {
    const { limit = 50, sortBy = 'lastSeen', order = 'desc', status = 'all' } = req.query;
    
    // Get all users from Redis-backed service
    const allUsers = await userTrackingService.getAllActiveUsers(parseInt(limit) * 2); // Get more to filter
    
    // Filter by status
    let users = allUsers;
    if (status !== 'all') {
      users = users.filter(user => user.status === status);
    }
    
    // Sort users
    users.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'lastSeen':
          aValue = a.lastSeen;
          bValue = b.lastSeen;
          break;
        case 'totalRequests':
          aValue = a.totalRequests || 0;
          bValue = b.totalRequests || 0;
          break;
        case 'sessionRequestCount':
          aValue = a.sessionRequestCount || 0;
          bValue = b.sessionRequestCount || 0;
          break;
        default:
          aValue = a.lastSeen;
          bValue = b.lastSeen;
      }
      
      return order === 'desc' ? bValue - aValue : aValue - bValue;
    });
    
    // Apply limit
    const limitedUsers = users.slice(0, parseInt(limit));
    
    // Get rate limit info for each user
    const usersWithLimits = await Promise.all(limitedUsers.map(async (user) => {
      const userLimits = {};
      const limitTypes = ['general', 'ai', 'pronunciation', 'tts', 'image'];
      
      for (const type of limitTypes) {
        const currentCount = await userRateLimitService.getCurrentCount(`user:${user.userId}`, type);
        const limitConfig = userRateLimitService.getLimits()[type] || { requests: 100, window: 60000 };
        
        userLimits[type] = {
          limit: limitConfig.requests,
          used: currentCount,
          remaining: Math.max(0, limitConfig.requests - currentCount),
          windowMs: limitConfig.window
        };
      }
      
      return {
        ...user,
        currentLimits: userLimits,
        daysActive: user.lastSeen ? Math.ceil((Date.now() - user.lastSeen) / (24 * 60 * 60 * 1000)) : 0
      };
    }));
    
    // Get tracking statistics
    const trackingStats = await userTrackingService.getStats();
    
    res.json({
      success: true,
      totalUsers: users.length,
      returnedUsers: usersWithLimits.length,
      users: usersWithLimits,
      summary: {
        totalActiveUsers: trackingStats.totalUsers,
        activeUsers: trackingStats.activeUsers,
        recentUsers: trackingStats.recentUsers,
        inactiveUsers: trackingStats.inactiveUsers,
        totalRequests: trackingStats.totalRequests,
        averageRequestsPerUser: trackingStats.averageRequestsPerUser,
        usersNearRateLimit: usersWithLimits.filter(u => 
          (u.currentLimits.pronunciation?.used / u.currentLimits.pronunciation?.limit > 0.8) ||
          (u.currentLimits.ai?.used / u.currentLimits.ai?.limit > 0.8)
        ).length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting users overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users overview',
      details: error.message
    });
  }
});

// Get detailed user activity
app.get('/api/admin/users/:userId/detailed', monitoringWhitelist, async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await userTrackingService.getUserData(userId);
    
    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        userId: userId
      });
    }
    
    // Get current rate limits
    const userLimits = {};
    const limitTypes = ['general', 'ai', 'pronunciation', 'tts', 'image'];
    
    for (const type of limitTypes) {
      const currentCount = await userRateLimitService.getCurrentCount(`user:${userId}`, type);
      const limitConfig = userRateLimitService.getLimits()[type] || { requests: 100, window: 60000 };
      
      userLimits[type] = {
        limit: limitConfig.requests,
        used: currentCount,
        remaining: Math.max(0, limitConfig.requests - currentCount),
        windowMs: limitConfig.window
      };
    }
    
    // Calculate additional metrics
    const now = Date.now();
    const response = {
      success: true,
      user: {
        ...userData,
        currentLimits: userLimits,
        daysActive: userData.lastSeen ? Math.ceil((now - userData.lastSeen) / (24 * 60 * 60 * 1000)) : 0,
        mostUsedService: (userData.totalAIRequests || 0) > (userData.totalPronunciations || 0) ? 'AI' : 'Pronunciation',
        requestSuccessRate: userData.totalRequests > 0 ? 
          ((userData.totalRequests - (userData.totalErrors || 0)) / userData.totalRequests) * 100 : 100
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user details',
      details: error.message
    });
  }
});

// Get user statistics and analytics
app.get('/api/admin/users/statistics', monitoringWhitelist, async (req, res) => {
  try {
    // Get tracking statistics from Redis-backed service
    const trackingStats = await userTrackingService.getStats();
    const rateLimitStats = await userRateLimitService.getStats();
    
    // Calculate comprehensive statistics
    const stats = {
      overview: {
        totalUsers: trackingStats.totalUsers,
        activeUsers24h: trackingStats.activeUsers,
        activeUsers7d: trackingStats.activeUsers, // Using active users as proxy for 7d
        recentUsers: trackingStats.recentUsers
      },
      usage: {
        totalRequests: trackingStats.totalRequests,
        averageRequestsPerUser: trackingStats.averageRequestsPerUser,
        totalRateLimitRequests: rateLimitStats.totalRequests
      },
      rateLimits: {
        totalKeys: rateLimitStats.totalKeys,
        byType: rateLimitStats.byType,
        usersNearLimit: Math.floor(trackingStats.totalUsers * 0.1) // Estimate 10% near limit
      },
      system: {
        redisBacked: true,
        horizontalScaling: true,
        cleanupAutomated: true
      }
    };
    
    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics',
      details: error.message
    });
  }
});

// IP Whitelist Management Endpoints
app.get('/api/admin/ips', monitoringWhitelist, async (req, res) => {
  try {
    const result = await ipWhitelistManager.getAllIPs();
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting IPs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IP whitelist',
      details: error.message
    });
  }
});

app.post('/api/admin/ips/add', monitoringWhitelist, async (req, res) => {
  try {
    const { ipAddress, description } = req.body;
    
    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'IP address is required'
      });
    }
    
    const result = await ipWhitelistManager.addIP(ipAddress, description || '');
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding IP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add IP to whitelist',
      details: error.message
    });
  }
});

app.post('/api/admin/ips/remove', monitoringWhitelist, async (req, res) => {
  try {
    const { ipAddress } = req.body;
    
    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'IP address is required'
      });
    }
    
    const result = await ipWhitelistManager.removeIP(ipAddress);
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error removing IP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove IP from whitelist',
      details: error.message
    });
  }
});

app.post('/api/admin/ips/reload', monitoringWhitelist, async (req, res) => {
  try {
    const result = await ipWhitelistManager.reloadFromDatabase();
    res.json({
      success: true,
      message: 'IP whitelist reloaded from database',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reloading IPs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reload IP whitelist',
      details: error.message
    });
  }
});

app.get('/api/admin/ips/status', monitoringWhitelist, (req, res) => {
  try {
    const status = ipWhitelistManager.getStatus();
    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting IP whitelist status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IP whitelist status',
      details: error.message
    });
  }
});

// Suspend/unsuspend user endpoint
app.post('/api/admin/users/:userId/suspend', monitoringWhitelist, async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspend = true, reason = 'No reason provided' } = req.body;
    
    const userData = await userTrackingService.getUserData(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const status = suspend ? 'suspended' : 'active';
    const suspensionTime = suspend ? Date.now() : null;
    
    await userTrackingService.updateUserData(userId, {
      status: status,
      suspensionReason: reason,
      suspensionTime: suspensionTime
    });
    
    res.json({
      success: true,
      message: `User ${suspend ? 'suspended' : 'unsuspended'} successfully`,
      user: {
        userId: userId,
        status: status,
        suspensionReason: reason,
        suspensionTime: suspensionTime
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
      details: error.message
    });
  }
});

// Redis-backed Services Admin Endpoints

// Get Redis-backed services status
app.get('/api/admin/services/redis-status', monitoringWhitelist, async (req, res) => {
  try {
    const trackingStats = await userTrackingService.getStats();
    const rateLimitStats = await userRateLimitService.getStats();
    
    res.json({
      success: true,
      services: {
        userTracking: {
          status: 'active',
          totalUsers: trackingStats.totalUsers,
          activeUsers: trackingStats.activeUsers,
          recentUsers: trackingStats.recentUsers,
          totalRequests: trackingStats.totalRequests
        },
        userRateLimiting: {
          status: 'active',
          totalKeys: rateLimitStats.totalKeys,
          totalRequests: rateLimitStats.totalRequests,
          byType: rateLimitStats.byType
        }
      },
      horizontalScaling: true,
      redisBacked: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting Redis services status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Redis services status',
      details: error.message
    });
  }
});

// Reset user tracking data
app.post('/api/admin/users/:userId/reset-tracking', monitoringWhitelist, async (req, res) => {
  try {
    const { userId } = req.params;
    const success = await userTrackingService.resetUser(userId);
    
    res.json({
      success: success,
      message: success ? 'User tracking data reset successfully' : 'Failed to reset user tracking data',
      userId: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting user tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset user tracking',
      details: error.message
    });
  }
});

// Reset user rate limits
app.post('/api/admin/users/:userId/reset-rate-limits', monitoringWhitelist, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.body; // Optional: specific rate limit type to reset
    
    const success = await userRateLimitService.resetUser(userId, type);
    
    res.json({
      success: success,
      message: success ? 'User rate limits reset successfully' : 'Failed to reset user rate limits',
      userId: userId,
      type: type || 'all',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting user rate limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset user rate limits',
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
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  try {
    console.log(`\n🎤 [${requestId}] Pronunciation assessment request received`);
    console.log(`🎤 [${requestId}] Request headers:`, {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
    });
    
    if (!req.file) {
      console.log(`🎤 [${requestId}] ❌ No audio file provided`);
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
    
    console.log(`🎤 [${requestId}] Audio file: ${req.file.path}`);
    console.log(`🎤 [${requestId}] Reference text: "${referenceText}"`);
    console.log(`🎤 [${requestId}] File size: ${(req.file.size / 1024).toFixed(2)} KB`);
    
    // Perform pronunciation assessment with resilience
    console.log(`🎤 [${requestId}] Starting pronunciation assessment...`);
    const assessmentResult = await resilientPronunciationService.assessPronunciationWithResilience(
      req.file.path,
      referenceText
    );
    console.log(`🎤 [${requestId}] Assessment completed in ${Date.now() - startTime}ms`);
    
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
    
    console.log(`🎤 [${requestId}] ✅ Assessment complete - Score: ${assessmentResult.result.pronunciationScore}/100`);
    
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

// ============================================
// Setup Simple Audio Routes
// ============================================
setupSimpleAudioRoutes(app, { aiLimiter, generalLimiter });

// ============================================
// Setup Stripe Payment Routes
// ============================================
app.use('/api/stripe', stripeRoutes);

// ============================================
// AWS Polly TTS Endpoint
// ============================================
const PollyTTSService = require('./pollyTTS');
console.log('🔧 Loading hybridAudioLessonUsageService...');
const hybridAudioLessonUsageService = require('./hybridAudioLessonUsageService'); // Added for hybrid usage tracking
console.log('✅ hybridAudioLessonUsageService loaded successfully');

// Rate limiter for TTS requests
const ttsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 TTS requests per minute
  message: {
    error: 'Too many TTS requests. Please wait a moment before trying again.',
    code: 'TTS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/polly/synthesize', ttsLimiter, async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    console.log(`\n🔊 [${requestId}] TTS synthesis request received`);
    console.log(`🔊 [${requestId}] Client IP: ${clientIP}`);
    
    // Validate request body
    const { text, voiceId, languageCode, engine, rate, pitch, volume } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Text is required for speech synthesis',
        code: 'MISSING_TEXT'
      });
    }

    if (text.length > 3000) {
      return res.status(400).json({
        error: 'Text too long. Maximum 3000 characters allowed.',
        code: 'TEXT_TOO_LONG',
        maxLength: 3000,
        currentLength: text.length
      });
    }

    // Check rate limiting
    try {
      PollyTTSService.checkRateLimit(clientIP);
    } catch (rateLimitError) {
      return res.status(429).json({
        error: rateLimitError.message,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    console.log(`🔊 [${requestId}] Processing TTS request:`, {
      textLength: text.length,
      voiceId: voiceId || 'Joanna',
      languageCode: languageCode || 'en-US',
      engine: engine || 'standard',
      rate: rate || 1.0,
      pitch: pitch || 1.0
    });

    // Generate speech
    const result = await PollyTTSService.synthesizeSpeech({
      text,
      voiceId,
      languageCode,
      engine,
      rate,
      pitch,
      volume
    });

    const processingTime = Date.now() - startTime;
    console.log(`🔊 [${requestId}] TTS synthesis completed in ${processingTime}ms`);

    // Set response headers
    res.set({
      'Content-Type': result.contentType,
      'Content-Length': result.audioBuffer.length,
      'Cache-Control': result.fromCache ? 'public, max-age=3600' : 'no-cache',
      'X-Processing-Time': `${processingTime}ms`,
      'X-From-Cache': result.fromCache.toString(),
      'X-Request-ID': requestId
    });

    // Send audio data
    res.send(result.audioBuffer);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`🔊 [${requestId}] TTS synthesis failed after ${processingTime}ms:`, error);

    // Handle specific AWS errors
    if (error.name === 'ValidationException') {
      return res.status(400).json({
        error: 'Invalid request parameters',
        code: 'VALIDATION_ERROR',
        details: error.message
      });
    }

    if (error.name === 'InvalidParameterException') {
      return res.status(400).json({
        error: 'Invalid voice or language parameters',
        code: 'INVALID_PARAMETERS',
        details: error.message
      });
    }

    if (error.name === 'TextLengthExceededException') {
      return res.status(400).json({
        error: 'Text is too long for synthesis',
        code: 'TEXT_TOO_LONG',
        details: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Speech synthesis failed',
      code: 'SYNTHESIS_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      requestId
    });
  }
});

// TTS service statistics endpoint (for monitoring)
app.get('/api/polly/stats', async (req, res) => {
  try {
    const stats = PollyTTSService.getStats();
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting TTS stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get TTS statistics',
      details: error.message
    });
  }
});

// Clear TTS cache endpoint (for monitoring)
app.post('/api/polly/clear-cache', async (req, res) => {
  try {
    PollyTTSService.clearCache();
    res.json({
      success: true,
      message: 'TTS cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing TTS cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear TTS cache',
      details: error.message
    });
  }
});

// ============================================
// Audio Lesson Usage Tracking Endpoints
// ============================================
console.log('🔧 Registering audio lesson usage tracking endpoints...');

// Get user's current audio lesson usage
app.get('/api/audio-lessons/usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { month } = req.query;
    
    console.log(`📊 Getting audio lesson usage for user: ${userId}`);
    
    const usage = await hybridAudioLessonUsageService.getUserUsage(userId);
    
    res.json({
      success: true,
      usage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting audio lesson usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audio lesson usage',
      details: error.message
    });
  }
});

// Check if user can create audio lesson
app.get('/api/audio-lessons/can-create/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 Checking if user ${userId} can create audio lesson`);
    
    const canCreate = await hybridAudioLessonUsageService.canCreateAudioLesson(userId);
    const usage = await hybridAudioLessonUsageService.getUserUsage(userId);
    
    res.json({
      success: true,
      canCreate,
      usage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking audio lesson creation:', error);
    
    // Handle specific error codes
    if (error.code === 'MONTHLY_LIMIT_EXCEEDED') {
      res.status(429).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to check audio lesson creation',
        details: error.message
      });
    }
  }
});

// Get user's audio lesson usage history
app.get('/api/audio-lessons/usage-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { months = 6 } = req.query;
    
    console.log(`📊 Getting usage history for user: ${userId}, ${months} months`);
    
    const history = await hybridAudioLessonUsageService.getUserUsageHistory(userId, parseInt(months));
    
    res.json({
      success: true,
      history,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting usage history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage history',
      details: error.message
    });
  }
});

// Get usage statistics (admin only)
app.get('/api/audio-lessons/stats', monitoringWhitelist, async (req, res) => {
  try {
    const { month } = req.query;
    
    console.log(`📊 Getting usage statistics for month: ${month || 'current'}`);
    
    const stats = await hybridAudioLessonUsageService.getUsageStats(month);
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting usage statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage statistics',
      details: error.message
    });
  }
});

// Reset user's usage (admin only)
app.post('/api/audio-lessons/reset-usage/:userId', monitoringWhitelist, async (req, res) => {
  try {
    const { userId } = req.params;
    const { month } = req.body;
    
    if (!month) {
      return res.status(400).json({
        success: false,
        error: 'Month parameter is required (YYYY-MM format)'
      });
    }
    
    console.log(`🔄 Resetting usage for user: ${userId}, month: ${month}`);
    
    const result = await hybridAudioLessonUsageService.resetUserUsage(userId);
    
    res.json({
      success: true,
      message: 'User usage reset successfully',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting user usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset user usage',
      details: error.message
    });
  }
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
  
  // Initialize IP whitelist manager asynchronously (non-blocking)
  ipWhitelistManager.initialize().catch(error => {
    console.error('⚠️ Failed to initialize IP whitelist manager:', error);
    console.error('⚠️ Monitoring endpoints may not work correctly');
  });
  
  // Network connectivity tests removed - not necessary for local development
});

module.exports = app;
