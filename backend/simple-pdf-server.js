// Simple PDF Text Extraction Server
// This server allows users to upload PDF files and extracts all text from them

// Import required modules
const express = require('express');        // Web framework for Node.js
const multer = require('multer');          // Middleware for handling file uploads
const pdfParse = require('pdf-parse');     // Library for extracting text from PDFs
const cors = require('cors');              // Middleware to allow cross-origin requests
const fs = require('fs');                  // File system module for reading/writing files
const path = require('path');              // Path utilities

// Create an Express application
const app = express();

// Configure CORS to allow requests from any origin
// This is necessary for React Native apps to communicate with the server
app.use(cors());

// Configure multer for handling file uploads
// This sets up where uploaded files will be stored temporarily
const storage = multer.diskStorage({
  // Define the destination folder for uploaded files
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    // Create the uploads folder if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  // Define how uploaded files should be named
  filename: (req, file, cb) => {
    // Use timestamp + original filename to avoid conflicts
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create multer upload instance with configuration
const upload = multer({ 
  storage: storage,
  // Only allow PDF files
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  // Set file size limit to 10MB
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// POST endpoint for uploading and extracting text from PDFs
app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No PDF file uploaded. Please provide a file with the key "pdf".' 
      });
    }

    console.log(`📁 Processing PDF: ${req.file.originalname}`);
    console.log(`📏 File size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);

    // Read the uploaded file from disk into a buffer
    const pdfBuffer = fs.readFileSync(req.file.path);
    console.log('📖 PDF file read into buffer successfully');

    // Use pdf-parse to extract all text from the PDF
    const pdfData = await pdfParse(pdfBuffer);
    console.log(`📄 Extracted ${pdfData.text.length} characters from PDF`);

    // Delete the temporary uploaded file to clean up
    fs.unlinkSync(req.file.path);
    console.log('🧹 Temporary file deleted');

    // Return the extracted text as JSON
    res.json({ 
      text: pdfData.text,
      pageCount: pdfData.numpages,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('❌ Error processing PDF:', error.message);
    
    // Clean up file on error if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🧹 Error file cleaned up');
    }

    // Return error response with 500 status code
    res.status(500).json({ 
      error: 'Failed to process PDF',
      details: error.message 
    });
  }
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PDF extraction server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware for multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB.' 
      });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// Start the server on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 PDF extraction server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve('uploads')}`);
  console.log(`🌐 Server accessible at: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Upload endpoint: POST http://localhost:${PORT}/upload-pdf`);
});

module.exports = app;
