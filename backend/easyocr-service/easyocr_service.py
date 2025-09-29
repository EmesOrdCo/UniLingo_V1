#!/usr/bin/env python3
"""
EasyOCR Service for Handwritten Text Recognition
This service provides an HTTP API for OCR processing using EasyOCR
"""

import sys
import os
import json
import base64
import io
from flask import Flask, request, jsonify
from PIL import Image
import easyocr
import numpy as np
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize EasyOCR reader (English)
reader = None

def init_easyocr():
    """Initialize EasyOCR reader"""
    global reader
    try:
        logger.info("Initializing EasyOCR reader...")
        reader = easyocr.Reader(['en'], gpu=False)  # Use CPU for compatibility
        logger.info("EasyOCR reader initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize EasyOCR: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'EasyOCR Service',
        'reader_initialized': reader is not None
    })

@app.route('/ocr/process-image', methods=['POST'])
def process_image_compat():
    """Compatibility endpoint matching the existing API"""
    try:
        if reader is None:
            return jsonify({
                'success': False,
                'message': 'EasyOCR reader not initialized',
                'result': {
                    'text': '',
                    'pages': [],
                    'pageCount': 0,
                    'imagesProcessed': 0,
                    'totalImages': 0
                }
            }), 500

        # Get image data from request
        if 'images' in request.files:
            # Handle multiple files (take first one)
            image_file = request.files.getlist('images')[0]
            image_data = image_file.read()
        elif 'image' in request.files:
            # Handle single file
            image_file = request.files['image']
            image_data = image_file.read()
        else:
            return jsonify({
                'success': False,
                'message': 'No image data provided',
                'result': {
                    'text': '',
                    'pages': [],
                    'pageCount': 0,
                    'imagesProcessed': 0,
                    'totalImages': 0
                }
            }), 400

        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array for EasyOCR
        img_array = np.array(image)
        
        logger.info(f"Processing image: {image.size[0]}x{image.size[1]} pixels")
        
        # Perform OCR
        results = reader.readtext(img_array)
        
        # Extract text from results
        extracted_text = ""
        confidence_scores = []
        
        for (bbox, text, confidence) in results:
            if confidence > 0.1:  # Filter out very low confidence results
                extracted_text += text + " "
                confidence_scores.append(confidence)
        
        # Calculate average confidence
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        # Split text into pages (for compatibility)
        pages = [extracted_text.strip()] if extracted_text.strip() else []
        
        logger.info(f"EasyOCR completed: {len(extracted_text)} characters, avg confidence: {avg_confidence:.2f}")
        
        return jsonify({
            'success': True,
            'message': 'Images processed successfully via EasyOCR',
            'result': {
                'text': extracted_text.strip(),
                'pages': pages,
                'pageCount': len(pages),
                'imagesProcessed': 1,
                'totalImages': 1,
                'confidence': avg_confidence
            }
        })
        
    except Exception as e:
        logger.error(f"EasyOCR processing error: {e}")
        return jsonify({
            'success': False,
            'message': f'OCR processing failed: {str(e)}',
            'result': {
                'text': '',
                'pages': [],
                'pageCount': 0,
                'imagesProcessed': 0,
                'totalImages': 0
            }
        }), 500

if __name__ == '__main__':
    # Initialize EasyOCR
    if not init_easyocr():
        logger.error("Failed to initialize EasyOCR, exiting")
        sys.exit(1)
    
    # Start Flask server
    # Use PORT environment variable (Railway) or command line argument or default
    port = int(os.environ.get('PORT', sys.argv[1] if len(sys.argv) > 1 else 8081))
    logger.info(f"Starting EasyOCR service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
