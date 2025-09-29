#!/usr/bin/env node

// Test script to verify EasyOCR installation and functionality
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function testEasyOCR() {
  console.log('🧪 Testing EasyOCR installation...');
  
  try {
    // Test 1: Check Python and EasyOCR availability
    console.log('1. Checking Python and EasyOCR availability...');
    const pythonCheck = await runPythonCommand('import easyocr; print("EasyOCR available")');
    if (pythonCheck.success) {
      console.log('✅ Python and EasyOCR are available');
    } else {
      throw new Error('Python or EasyOCR not available');
    }
    
    // Test 2: Create a simple test image (white background with black text)
    console.log('2. Creating test image...');
    const testImagePath = '/tmp/test-easyocr.png';
    
    // Create a simple test image using Node.js
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(200, 100);
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 200, 100);
    
    // Black text
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Hello World', 50, 50);
    
    // Save image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(testImagePath, buffer);
    console.log('✅ Test image created');
    
    // Test 3: Process the test image with direct Python subprocess
    console.log('3. Processing test image with EasyOCR...');
    
    const ocrResult = await runOCRProcessor(testImagePath);
    if (ocrResult.success) {
      console.log('✅ EasyOCR processing completed');
    } else {
      throw new Error(`OCR processing failed: ${ocrResult.error}`);
    }
    
    // Test 4: Analyze results
    if (ocrResult.results && ocrResult.results.length > 0) {
      const text = ocrResult.results.map(item => item.text).join(' ');
      console.log(`✅ Text extracted: "${text}"`);
      console.log(`✅ Detected ${ocrResult.results.length} text regions`);
    } else {
      console.log('⚠️ No text detected in test image');
    }
    
    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    console.log('🎉 EasyOCR test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ EasyOCR test failed:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Helper function to run Python commands
function runPythonCommand(command) {
  return new Promise((resolve) => {
    const python = spawn('python3', ['-c', command]);
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code: code
      });
    });
  });
}

// Helper function to run OCR processor
function runOCRProcessor(imagePath) {
  return new Promise((resolve) => {
    const ocrScript = path.join(__dirname, 'ocr_processor.py');
    const python = spawn('python3', [ocrScript, imagePath]);
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      // Clean stdout by removing any non-JSON content
      const cleanStdout = stdout.trim();
      
      try {
        if (!cleanStdout) {
          throw new Error('No output received from OCR processor');
        }
        
        const result = JSON.parse(cleanStdout);
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to parse OCR result: ${error.message}`,
          stdout: cleanStdout,
          stderr: stderr,
          exitCode: code
        });
      }
    });
    
    // Add timeout to prevent hanging
    setTimeout(() => {
      python.kill();
      resolve({
        success: false,
        error: 'OCR processor timed out after 30 seconds',
        stdout: stdout,
        stderr: stderr
      });
    }, 30000);
  });
}

testEasyOCR();
