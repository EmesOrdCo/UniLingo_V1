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
    from contextlib import redirect_stderr, redirect_stdout
    from io import StringIO
    
    try:
        import easyocr
        
        # Suppress all output to prevent progress messages from interfering
        with redirect_stdout(StringIO()), redirect_stderr(StringIO()):
            # Create EasyOCR reader with verbose=False to minimize output
            reader = easyocr.Reader(languages, gpu=False, verbose=False)
            
            # Process the image
            results = reader.readtext(image_path)
        
        # Format results for JSON output
        formatted_results = []
        for (bbox, text, confidence) in results:
            formatted_results.append({
                'text': text,
                'confidence': float(confidence),
                'bbox': bbox
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
