const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const NetworkLogger = require('./networkLogger');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Debug - Current directory:', __dirname);
console.log('🔍 Debug - .env file path:', path.join(__dirname, '.env'));

const app = express();
const PORT = process.env.PORT || 3001;
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

const upload = multer({ 
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

// PDF text extraction removed - now handled by Zapier webhook

// PDF text extraction endpoint removed - now handled by Zapier webhook

// PDF processing endpoint using local pdf-parse (replacing PDF.co API)
app.post('/api/process-pdf', upload.single('pdf'), async (req, res) => {
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

    // Read the uploaded file from disk into a buffer
    const pdfBuffer = fs.readFileSync(req.file.path);
    console.log('📖 PDF file read into buffer successfully');

    // Use pdf-parse to extract all text from the PDF
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(pdfBuffer);
    console.log(`📄 Extracted ${pdfData.text.length} characters from PDF`);

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    console.log('🧹 Uploaded file cleaned up');

    console.log('\n' + '🎯'.repeat(20));
    console.log('🎯 SENDING RESPONSE TO FRONTEND');
    console.log('🎯'.repeat(20));
    console.log(`✅ Success: true`);
    console.log(`📄 Filename: ${req.file.originalname}`);
    console.log(`📊 Pages: ${pdfData.numpages}`);
    console.log(`🔢 Characters: ${pdfData.text.length.toLocaleString()}`);
    console.log('🎯'.repeat(20) + '\n');

    res.json({
      success: true,
      message: 'PDF processed successfully via local pdf-parse',
      result: {
        text: pdfData.text,
        pageCount: pdfData.numpages,
        credits: 'N/A (local processing)',
        remainingCredits: 'N/A (local processing)'
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
      message: 'PDF processing system is ready (using local pdf-parse)',
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
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`📡 PDF processing: Local pdf-parse (replaced PDF.co API)`);
  console.log(`🌐 Network accessible at: http://192.168.1.72:${PORT}`);
  
  // Test network connectivity
  console.log('\n🔍 Testing network connectivity...');
  
  // Test localhost connectivity
  try {
    const http = require('http');
    const testReq = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log('✅ Localhost connectivity: OK');
    });
    
    testReq.on('error', (error) => {
      networkLogger.logError(
        'CONNECTION_ERROR',
        'connection_establish',
        'Failed to connect to localhost',
        `localhost:${PORT}`,
        error,
        { test_type: 'localhost_connectivity' }
      );
    });
    
    testReq.on('timeout', () => {
      networkLogger.logTimeout(
        'REQUEST_TIMEOUT',
        'connection_establish',
        `localhost:${PORT}`,
        5000,
        { test_type: 'localhost_connectivity' }
      );
      testReq.destroy();
    });
    
    testReq.end();
  } catch (error) {
    networkLogger.logGenericNetworkError(
      'connection_establish',
      `localhost:${PORT}`,
      error,
      { test_type: 'localhost_connectivity' }
    );
  }
  
  // Test external connectivity (PDF.co)
  try {
    const https = require('https');
    const testReq = https.request({
      hostname: 'api.pdf.co',
      port: 443,
      path: '/v1',
      method: 'GET',
      timeout: 10000
    }, (res) => {
      console.log('✅ External connectivity (PDF.co): OK');
    });
    
    testReq.on('error', (error) => {
      networkLogger.logError(
        'CONNECTION_ERROR',
        'connection_establish',
        'Failed to connect to PDF.co API',
        'api.pdf.co:443',
        error,
        { test_type: 'external_connectivity' }
      );
    });
    
    testReq.on('timeout', () => {
      networkLogger.logTimeout(
        'REQUEST_TIMEOUT',
        'connection_establish',
        'api.pdf.co:443',
        10000,
        { test_type: 'external_connectivity' }
      );
      testReq.destroy();
    });
    
    testReq.end();
  } catch (error) {
    networkLogger.logGenericNetworkError(
      'connection_establish',
      'api.pdf.co:443',
      error,
      { test_type: 'external_connectivity' }
    );
  }
});

module.exports = app;
