const fs = require('fs');
const path = require('path');

// Comprehensive test suite for the lesson creation system
async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE TEST SUITE STARTING...\n');
  
  const tests = [
    testBackendServer,
    testPDFExtractionWithRealText,
    testPDFExtractionWithNoText,
    testNetworkConnectivity,
    testErrorHandling
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Running: ${test.name}`);
      await test();
      console.log(`✅ PASSED: ${test.name}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ FAILED: ${test.name}`);
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log(`\n📊 TEST RESULTS: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! System is ready for use.');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }
}

// Test 1: Backend Server Health
async function testBackendServer() {
  console.log('   Checking if backend server is running...');
  
  const response = await fetch('http://localhost:3001/health');
  
  if (!response.ok) {
    throw new Error(`Backend server not responding: ${response.status}`);
  }
  
  const result = await response.json();
  if (result.status !== 'OK') {
    throw new Error('Backend server health check failed');
  }
  
  console.log('   ✅ Backend server is running and healthy');
}

// Test 2: PDF Extraction with Real Text
async function testPDFExtractionWithRealText() {
  console.log('   Testing PDF extraction with readable text...');
  
  // Create a PDF with actual text content
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
72 720 Td
(Mathematics is the study of numbers and patterns) Tj
72 700 Td
(Algebra involves solving equations with variables) Tj
72 680 Td
(Geometry deals with shapes and spatial relationships) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
350
%%EOF`;
  
  const pdfBase64 = Buffer.from(pdfContent).toString('base64');
  
  const response = await fetch('http://localhost:3001/api/extract-pdf-base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pdfBase64: pdfBase64
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PDF extraction failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error('PDF extraction returned failure');
  }
  
  if (!result.text || result.text.length < 10) {
    throw new Error('Extracted text is too short or empty');
  }
  
  console.log(`   ✅ Extracted text: "${result.text.substring(0, 50)}..."`);
  console.log(`   ✅ Used fallback: ${result.usedFallback}`);
}

// Test 3: PDF Extraction with No Text
async function testPDFExtractionWithNoText() {
  console.log('   Testing PDF extraction with no readable text...');
  
  // Create a PDF with no extractable text (just binary data)
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 20
>>
stream
BT
/F1 12 Tf
72 720 Td
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
270
%%EOF`;
  
  const pdfBase64 = Buffer.from(pdfContent).toString('base64');
  
  const response = await fetch('http://localhost:3001/api/extract-pdf-base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pdfBase64: pdfBase64
    })
  });
  
  // Should fail with an error
  if (response.ok) {
    const result = await response.json();
    if (result.success) {
      throw new Error('PDF extraction should have failed for empty PDF');
    }
  }
  
  console.log('   ✅ Correctly failed to extract text from empty PDF');
}

// Test 4: Network Connectivity
async function testNetworkConnectivity() {
  console.log('   Testing network connectivity to backend...');
  
  try {
    const response = await fetch('http://localhost:3001/health', {
      method: 'GET',
      timeout: 5000 // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Network request failed: ${response.status}`);
    }
    
    console.log('   ✅ Network connectivity is working');
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('timeout')) {
      throw new Error('Network request timed out - backend may not be accessible');
    }
    throw error;
  }
}

// Test 5: Error Handling
async function testErrorHandling() {
  console.log('   Testing error handling...');
  
  // Test with invalid base64
  const response = await fetch('http://localhost:3001/api/extract-pdf-base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pdfBase64: 'invalid-base64-data'
    })
  });
  
  if (response.ok) {
    throw new Error('Should have failed with invalid base64 data');
  }
  
  const errorResult = await response.json();
  
  if (!errorResult.error) {
    throw new Error('Error response should contain error message');
  }
  
  console.log('   ✅ Error handling is working correctly');
}

// Run all tests
runComprehensiveTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});
