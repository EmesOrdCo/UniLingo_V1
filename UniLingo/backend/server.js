const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Manual fallback for Cloudmersive API key
if (!process.env.CLOUDMERSIVE_API_KEY) {
  process.env.CLOUDMERSIVE_API_KEY = '94ace59f-fec6-4df2-9711-ceeae2cd10f3';
  console.log('🔧 Manual API key set');
}

console.log('🔍 Debug - Current directory:', __dirname);
console.log('🔍 Debug - .env file path:', path.join(__dirname, '.env'));
console.log('🔍 Debug - CLOUDMERSIVE_API_KEY value:', process.env.CLOUDMERSIVE_API_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

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

// Fallback PDF text extraction function
function extractTextFromPDFBuffer(pdfBuffer) {
  try {
    // Convert buffer to string and look for text patterns
    const pdfString = pdfBuffer.toString('utf8');
    
    // Look for text patterns in PDF content
    const textPatterns = [
      /\(([^)]+)\)/g,           // Text in parentheses
      /\[([^\]]+)\]/g,           // Text in brackets
      /\/Text\s*\(([^)]+)\)/g,   // PDF text objects
      /BT\s*([\s\S]*?)\s*ET/g,  // Text between BT and ET markers
      /Tj\s*\(([^)]+)\)/g,      // Text objects
      /stream\s*([\s\S]*?)\s*endstream/g  // Stream content
    ];
    
    let extractedText = '';
    
    textPatterns.forEach(pattern => {
      const matches = pdfString.match(pattern) || [];
      matches.forEach(match => {
        // Clean up the extracted text
        let cleanText = match.replace(/[()\[\]]/g, '').trim();
        cleanText = cleanText.replace(/BT|ET|Tj|stream|endstream/g, '').trim();
        
        if (cleanText.length > 5 && !cleanText.match(/^\d+$/)) {
          extractedText += cleanText + ' ';
        }
      });
    });
    
    // If no meaningful text found, throw an error
    if (!extractedText.trim()) {
      throw new Error('No readable text could be extracted from the PDF');
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Error in fallback text extraction:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the PDF contains readable text.');
  }
}

// Updated PDF text extraction endpoint with fallback
app.post('/api/extract-pdf-base64', async (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: 'No PDF base64 data provided' });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Write buffer to temporary file
    const tempFilePath = path.join(__dirname, 'temp', `temp_${Date.now()}.pdf`);
    const tempDir = path.dirname(tempFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fs.writeFileSync(tempFilePath, pdfBuffer);
    
    let extractedText = '';
    let usedFallback = false;
    
    // Use fallback PDF text extraction directly
    console.log('🔍 Using fallback PDF text extraction...');
    usedFallback = true;
    extractedText = extractTextFromPDFBuffer(pdfBuffer);

    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    res.json({
      success: true,
      text: extractedText,
      filename: 'document.pdf',
      usedFallback: usedFallback
    });

  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // Clean up temporary file if it exists
    if (typeof tempFilePath !== 'undefined' && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    res.status(500).json({
      error: 'Failed to extract text from PDF',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
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
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`🔑 Cloudmersive API key configured: ${process.env.CLOUDMERSIVE_API_KEY ? 'Yes' : 'No'}`);
});

module.exports = app;
