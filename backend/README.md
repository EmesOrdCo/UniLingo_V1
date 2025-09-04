# UniLingo Backend Server

This is the backend server for the UniLingo mobile application, handling PDF uploads and Zapier webhook integration.

## Features

- **Zapier webhook integration** for PDF processing
- File upload handling with multer
- CORS enabled for mobile app communication
- Error handling and file cleanup

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your configuration:
   ```
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

### PDF Webhook
- **POST** `/api/webhook-pdf` - Send PDF to Zapier webhook
  - Body: Form data with `pdf` file field
  - Returns: JSON with webhook response

### Webhook Test
- **POST** `/api/test-webhook` - Test Zapier webhook connection
  - Body: JSON test payload
  - Returns: JSON with webhook test result

## Environment Variables

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
- Webhook communication failures
- File cleanup on errors

## Security

- File type validation (PDF only)
- File size limits (10MB max)
- Automatic file cleanup
- CORS configuration for mobile app
- Secure webhook communication
