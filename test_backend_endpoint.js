const fs = require('fs');
const path = require('path');

// Test the backend endpoint
async function testBackendEndpoint() {
  try {
    console.log('🧪 Testing backend PDF extraction endpoint...');
    
    // Create a simple test PDF content (this is just for testing the endpoint)
    const testPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    
    // Convert to base64
    const pdfBase64 = Buffer.from(testPdfContent).toString('base64');
    
    console.log('📤 Sending test request to backend...');
    
    const response = await fetch('http://localhost:3001/api/extract-pdf-base64', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64
      })
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Success! Extracted text:', result.text);
    console.log('📄 Filename:', result.filename);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBackendEndpoint();
