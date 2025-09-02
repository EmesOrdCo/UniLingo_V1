// Test mobile app connectivity to backend
async function testMobileAppConnectivity() {
  console.log('🔍 Testing mobile app connectivity to backend...');
  
  try {
    // Test the exact URL the mobile app uses
    const response = await fetch('http://192.168.1.187:3001/health');
    
    if (!response.ok) {
      throw new Error(`Mobile app connectivity failed: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.status !== 'OK') {
      throw new Error('Mobile app health check failed');
    }
    
    console.log('✅ Mobile app can connect to backend');
  } catch (error) {
    console.log('❌ Mobile app cannot connect to backend');
    console.log(`   Error: ${error.message}`);
    console.log('   This explains the "Network request timed out" error in Expo');
  }
}

// Test PDF extraction with minimal text
async function testPDFExtractionWithMinimalText() {
  console.log('🔍 Testing PDF extraction with minimal text...');
  
  // Create a PDF with minimal text content
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
/Length 30
>>
stream
BT
/F1 12 Tf
72 720 Td
(Hello) Tj
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
280
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
    console.log(`❌ Minimal text extraction failed: ${response.status} - ${errorText}`);
    return;
  }
  
  const result = await response.json();
  
  if (!result.success) {
    console.log(`❌ Minimal text extraction returned failure: ${result.error}`);
    return;
  }
  
  console.log(`✅ Minimal text extracted: "${result.text}"`);
  console.log(`✅ Used fallback: ${result.usedFallback}`);
}

// Run additional tests
async function runAdditionalTests() {
  console.log('\n🧪 RUNNING ADDITIONAL TESTS...\n');
  
  await testMobileAppConnectivity();
  await testPDFExtractionWithMinimalText();
}

runAdditionalTests().catch(error => {
  console.error('❌ Additional tests failed:', error.message);
});
