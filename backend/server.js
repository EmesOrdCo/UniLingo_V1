const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const NetworkLogger = require('./networkLogger');
const getLocalIP = require('./getLocalIP');
const updateFrontendConfig = require('./updateFrontendConfig');
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
    fileSize: 10 * 1024 * 1024 // 10MB limit
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
    fileSize: 5 * 1024 * 1024, // 5MB limit per image
    files: 5 // Maximum 5 images
  }
});

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
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }

    console.log('\n' + '📸'.repeat(20));
    console.log('📸 INCOMING IMAGE UPLOAD REQUEST');
    console.log('📸'.repeat(20));
    console.log(`📁 Files: ${req.files.length} images`);
    req.files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('📸'.repeat(20) + '\n');

    // Import required modules
    const Tesseract = require('tesseract.js');
    const sharp = require('sharp');
    
    let allExtractedText = '';
    let processedImages = 0;
    const totalImages = req.files.length;

    // Process each image
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      console.log(`🔍 Processing image ${i + 1}/${totalImages}: ${file.originalname}`);
      
      try {
        // Preprocess image with Sharp for better OCR
        const processedImageBuffer = await sharp(file.path)
          .resize(2000, 2000, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .sharpen()
          .normalize()
          .grayscale()
          .png()
          .toBuffer();

        // Perform OCR on the processed image
        const { data: { text } } = await Tesseract.recognize(
          processedImageBuffer,
          'eng', // English language
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log(`  OCR Progress: ${Math.round(m.progress * 100)}%`);
              }
            }
          }
        );

        if (text && text.trim()) {
          allExtractedText += `\n\n--- Image ${i + 1}: ${file.originalname} ---\n${text.trim()}`;
          console.log(`✅ Extracted ${text.length} characters from ${file.originalname}`);
        } else {
          console.log(`⚠️ No text extracted from ${file.originalname}`);
        }

        processedImages++;
      } catch (imageError) {
        console.error(`❌ Error processing image ${file.originalname}:`, imageError);
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
    console.log('🎯'.repeat(20) + '\n');

    // Clean up uploaded files
    req.files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    console.log('🧹 Uploaded files cleaned up');

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
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
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
