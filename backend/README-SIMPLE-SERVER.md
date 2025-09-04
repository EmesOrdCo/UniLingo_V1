# Simple PDF Text Extraction Server

A Node.js backend server that allows users to upload PDF files and extracts all text from them using the `pdf-parse` library.

## Features

- ✅ Upload PDF files via HTTP POST
- ✅ Extract all text from PDFs using `pdf-parse`
- ✅ Automatic file cleanup after processing
- ✅ Error handling for invalid files and processing errors
- ✅ CORS enabled for React Native frontend compatibility
- ✅ File size limits (10MB max)
- ✅ Health check endpoint

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install express multer pdf-parse cors
   ```

   Or if you want to install all dependencies at once:
   ```bash
   npm install
   ```

## Running the Server

### Method 1: Run the simple server
```bash
node simple-pdf-server.js
```

### Method 2: Run the existing server (if you want to use the PDF.co API version)
```bash
node server.js
```

## Server Endpoints

### 1. Health Check
- **URL:** `GET /health`
- **Description:** Check if the server is running
- **Response:**
  ```json
  {
    "status": "OK",
    "message": "PDF extraction server is running",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
  ```

### 2. PDF Upload and Text Extraction
- **URL:** `POST /upload-pdf`
- **Description:** Upload a PDF file and extract all text
- **Content-Type:** `multipart/form-data`
- **Form Field:** `pdf` (the PDF file)
- **Response:**
  ```json
  {
    "text": "Extracted text from the PDF...",
    "pageCount": 5,
    "filename": "document.pdf"
  }
  ```

## Testing the Server

### 1. Start the server:
```bash
node simple-pdf-server.js
```

You should see output like:
```
🚀 PDF extraction server running on port 3000
📁 Upload directory: /path/to/your/uploads
🌐 Server accessible at: http://localhost:3000
📋 Health check: http://localhost:3000/health
📤 Upload endpoint: POST http://localhost:3000/upload-pdf
```

### 2. Test the health check:
```bash
curl http://localhost:3000/health
```

### 3. Test PDF upload (replace "sample.pdf" with your PDF file):
```bash
curl -X POST -F "pdf=@sample.pdf" http://localhost:3000/upload-pdf
```

### 4. Test error handling (upload a non-PDF file):
```bash
curl -X POST -F "pdf=@test.txt" http://localhost:3000/upload-pdf
```

## Using with React Native

The server is configured with CORS to allow requests from React Native apps. Here's an example of how to use it in your React Native app:

```javascript
import { Platform } from 'react-native';

const uploadPDF = async (pdfUri) => {
  try {
    const formData = new FormData();
    formData.append('pdf', {
      uri: pdfUri,
      type: 'application/pdf',
      name: 'document.pdf'
    });

    const response = await fetch('http://localhost:3000/upload-pdf', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = await response.json();
    console.log('Extracted text:', result.text);
    return result;
  } catch (error) {
    console.error('Error uploading PDF:', error);
  }
};
```

## File Structure

```
backend/
├── simple-pdf-server.js    # Simple PDF extraction server
├── server.js              # Existing server with PDF.co API
├── test-simple-server.js  # Test instructions
├── package.json           # Dependencies
├── uploads/               # Temporary file storage (created automatically)
└── README-SIMPLE-SERVER.md # This file
```

## Configuration

### Port
The server runs on port 3000 by default. You can change this by modifying the `PORT` constant in `simple-pdf-server.js`.

### File Size Limit
The maximum file size is set to 10MB. You can change this in the multer configuration.

### Upload Directory
Files are temporarily stored in the `uploads/` directory and are automatically deleted after processing.

## Error Handling

The server handles various error scenarios:

- **No file uploaded:** Returns 400 error
- **Invalid file type:** Returns 400 error for non-PDF files
- **File too large:** Returns 400 error for files > 10MB
- **PDF processing errors:** Returns 500 error with details
- **Server errors:** Returns 500 error

## Troubleshooting

### Common Issues:

1. **Port already in use:**
   - Change the port number in `simple-pdf-server.js`
   - Or kill the process using the port: `lsof -ti:3000 | xargs kill -9`

2. **CORS errors from React Native:**
   - Make sure the server is running
   - Check that the URL is correct (use your computer's IP address instead of localhost)

3. **File upload fails:**
   - Check file size (max 10MB)
   - Ensure it's a valid PDF file
   - Check server logs for detailed error messages

### Debug Mode:
The server includes detailed console logging to help debug issues. Check the terminal output for:
- File upload details
- Processing status
- Error messages
- Cleanup confirmations

## Next Steps

Once this basic server is working, you can:

1. Add authentication
2. Implement file storage (database)
3. Add text processing features
4. Integrate with your React Native app
5. Deploy to a cloud service

## Support

If you encounter any issues:
1. Check the server logs for error messages
2. Verify all dependencies are installed
3. Test with a simple PDF file first
4. Check the network connectivity
