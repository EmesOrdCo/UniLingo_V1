# EasyOCR Service

This directory contains the Python EasyOCR service for handwritten text recognition.

## Setup (Local Development)

1. Install Python dependencies:
   ```bash
   cd easyocr-service
   pip3 install -r requirements.txt
   ```

2. Start the service:
   ```bash
   python3 easyocr_service.py 8082
   ```

3. The service will be available at `http://localhost:8082`

## Railway Deployment

To deploy this as a separate Railway service:

1. Create a new Railway project
2. Connect this directory as the source
3. Railway will automatically detect Python and install dependencies
4. The service will start using the PORT environment variable

## Integration

The Node.js backend is currently configured to use enhanced Tesseract instead of calling this Python service, but this service can be used by updating the backend to call the EasyOCR service endpoint.

## API Endpoints

- `GET /health` - Health check
- `POST /ocr/process-image` - Process images for OCR

The service expects multipart/form-data with an 'images' field containing the image file.
