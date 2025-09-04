// Test script for the PDF extraction server
// This script helps you test the server endpoints

const fs = require('fs');
const path = require('path');

console.log('🧪 PDF Extraction Server Test Script');
console.log('=====================================\n');

// Test 1: Health Check
console.log('1️⃣ Testing Health Check...');
console.log('   Run this command in your terminal:');
console.log('   curl http://localhost:3000/health');
console.log('   Expected response: {"status":"OK","message":"PDF extraction server is running",...}\n');

// Test 2: PDF Upload
console.log('2️⃣ Testing PDF Upload...');
console.log('   Run this command in your terminal (replace "sample.pdf" with your PDF file):');
console.log('   curl -X POST -F "pdf=@sample.pdf" http://localhost:3000/upload-pdf');
console.log('   Expected response: {"text":"...","pageCount":X,"filename":"sample.pdf"}\n');

// Test 3: Error Handling
console.log('3️⃣ Testing Error Handling...');
console.log('   Try uploading a non-PDF file:');
console.log('   curl -X POST -F "pdf=@test.txt" http://localhost:3000/upload-pdf');
console.log('   Expected response: Error about file type\n');

console.log('📝 Notes:');
console.log('   - Make sure the server is running: node simple-pdf-server.js');
console.log('   - The server accepts PDF files up to 10MB');
console.log('   - Files are temporarily stored in the "uploads/" folder');
console.log('   - Temporary files are automatically deleted after processing');
console.log('   - The server runs on port 3000 by default\n');

console.log('🎯 Ready to test! Start the server first, then try the curl commands above.');
