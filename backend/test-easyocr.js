#!/usr/bin/env node

// Test script to verify EasyOCR installation and functionality
const { EasyOCR } = require('node-easyocr');
const fs = require('fs');
const path = require('path');

async function testEasyOCR() {
  console.log('🧪 Testing EasyOCR installation...');
  
  try {
    // Test 1: Create EasyOCR instance
    console.log('1. Creating EasyOCR instance...');
    const ocr = new EasyOCR();
    console.log('✅ EasyOCR instance created');
    
    // Test 2: Initialize with English
    console.log('2. Initializing EasyOCR with English...');
    await ocr.init(['en']);
    console.log('✅ EasyOCR initialized successfully');
    
    // Test 3: Create a simple test image (white background with black text)
    console.log('3. Creating test image...');
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
    
    // Test 4: Process the test image
    console.log('4. Processing test image with EasyOCR...');
    const result = await ocr.readText(testImagePath);
    console.log('✅ EasyOCR processing completed');
    
    // Test 5: Analyze results
    if (result && result.length > 0) {
      const text = result.map(item => item.text).join(' ');
      console.log(`✅ Text extracted: "${text}"`);
      console.log(`✅ Detected ${result.length} text regions`);
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

testEasyOCR();
