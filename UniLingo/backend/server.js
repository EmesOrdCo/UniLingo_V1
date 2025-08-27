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
app.use(express.json());
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// PDF text extraction endpoint
app.post('/api/extract-pdf-text', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;
    console.log('Processing PDF:', filePath);

    // Call Cloudmersive API for text extraction
    const cloudmersiveApiKey = process.env.CLOUDMERSIVE_API_KEY;
    if (!cloudmersiveApiKey) {
      return res.status(500).json({ error: 'Cloudmersive API key not configured' });
    }

    const FormData = require('form-data');
    const form = new FormData();
    form.append('inputFile', fs.createReadStream(filePath));

    const response = await fetch('https://api.cloudmersive.com/convert/pdf/to/text', {
      method: 'POST',
      headers: {
        'Apikey': cloudmersiveApiKey,
        ...form.getHeaders()
      },
      body: form
    });

    if (!response.ok) {
      throw new Error(`Cloudmersive API error: ${response.status} ${response.statusText}`);
    }

    const extractedText = await response.text();
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({ 
      success: true, 
      text: extractedText,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to extract text from PDF',
      details: error.message 
    });
  }
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
