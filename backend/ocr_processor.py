#!/usr/bin/env python3
"""
Direct EasyOCR processor that handles progress output properly.
This script bypasses node-easyocr and communicates directly with EasyOCR.
"""

import sys
import json
import os
import argparse
from pathlib import Path

def process_image_with_easyocr(image_path, languages=['en']):
    """
    Process image with EasyOCR and return results as JSON.
    Handles progress output by suppressing it completely.
    """
    import sys
    import os
    from contextlib import redirect_stdout
    from io import StringIO
    import time
    
    try:
        # Log to stderr (won't interfere with JSON on stdout)
        sys.stderr.write(f"[OCR] Starting EasyOCR processing for {image_path}\n")
        sys.stderr.flush()
        
        import easyocr
        
        # Suppress stdout to prevent progress messages from interfering with JSON
        # Keep stderr for debugging
        with redirect_stdout(StringIO()):
            sys.stderr.write(f"[OCR] Initializing EasyOCR reader for languages: {languages}\n")
            sys.stderr.flush()
            start_time = time.time()
            
            # Create EasyOCR reader with verbose=False to minimize output
            reader = easyocr.Reader(languages, gpu=False, verbose=False)
            
            init_time = time.time() - start_time
            sys.stderr.write(f"[OCR] Reader initialized in {init_time:.2f} seconds\n")
            sys.stderr.flush()
            
            # Process the image
            sys.stderr.write(f"[OCR] Processing image...\n")
            sys.stderr.flush()
            process_start = time.time()
            
            results = reader.readtext(image_path)
            
            process_time = time.time() - process_start
            sys.stderr.write(f"[OCR] Image processed in {process_time:.2f} seconds, found {len(results)} text regions\n")
            sys.stderr.flush()
        
        # Format results for JSON output
        formatted_results = []
        for (bbox, text, confidence) in results:
            # Convert numpy types to native Python types for JSON serialization
            formatted_bbox = []
            for point in bbox:
                formatted_bbox.append([int(point[0]), int(point[1])])
            
            formatted_results.append({
                'text': text,
                'confidence': float(confidence),
                'bbox': formatted_bbox
            })
        
        return {
            'success': True,
            'results': formatted_results,
            'count': len(formatted_results)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'results': [],
            'count': 0
        }

def main():
    try:
        parser = argparse.ArgumentParser(description='Process image with EasyOCR')
        parser.add_argument('image_path', help='Path to the image file')
        parser.add_argument('--languages', nargs='+', default=['en'], 
                           help='Languages to use for OCR (default: en)')
        
        args = parser.parse_args()
        
        # Check if image file exists
        if not os.path.exists(args.image_path):
            result = {
                'success': False,
                'error': f'Image file not found: {args.image_path}',
                'results': [],
                'count': 0
            }
            print(json.dumps(result))
            sys.exit(1)
        
        # Process the image
        result = process_image_with_easyocr(args.image_path, args.languages)
        
        # Output result as JSON
        print(json.dumps(result))
        
        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)
        
    except Exception as e:
        # Catch any unexpected errors and return JSON
        result = {
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'results': [],
            'count': 0
        }
        print(json.dumps(result))
        sys.exit(1)

if __name__ == '__main__':
    main()
