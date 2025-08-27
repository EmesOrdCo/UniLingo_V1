# UniLingo Backend Server

This is the backend server for the UniLingo mobile application, handling PDF text extraction and AI lesson generation.

## Features

- PDF text extraction using Cloudmersive API
- File upload handling with multer
- CORS enabled for mobile app communication
- Error handling and file cleanup

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your API keys:
   ```
   CLOUDMERSIVE_API_KEY=your_cloudmersive_api_key_here
   PORT=3001
   ```

3. Run the setup script:
   ```bash
   setup.bat
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on port 3001 by default.

## API Endpoints

### Health Check
- **GET** `/health` - Check if server is running

### PDF Text Extraction
- **POST** `/api/extract-pdf-text` - Extract text from uploaded PDF
  - Body: Form data with `pdf` file field
  - Returns: JSON with extracted text

## Environment Variables

- `CLOUDMERSIVE_API_KEY` - Your Cloudmersive API key for PDF processing
- `PORT` - Server port (default: 3001)

## File Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── setup.bat             # Setup script
├── README.md             # This file
├── env.example           # Environment variables example
└── uploads/              # Temporary file storage (created automatically)
```

## Error Handling

The server includes comprehensive error handling for:
- File upload errors
- PDF processing failures
- API key validation
- File cleanup on errors

## Security

- File type validation (PDF only)
- File size limits (10MB max)
- Automatic file cleanup
- CORS configuration for mobile app
