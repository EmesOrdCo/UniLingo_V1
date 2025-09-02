const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test the Cloudmersive API directly
async function testCloudmersiveDirectly() {
  try {
    console.log('🧪 Testing Cloudmersive API directly...');
    
    // Create a simple test PDF content
    const testPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    
    // Write to temporary file
    const tempFilePath = path.join(__dirname, 'test.pdf');
    fs.writeFileSync(tempFilePath, testPdfContent);
    
    // Create FormData
    const form = new FormData();
    form.append('inputFile', fs.createReadStream(tempFilePath), {
      filename: 'test.pdf',
      contentType: 'application/pdf'
    });
    
    console.log('📤 Sending request to Cloudmersive...');
    console.log('🔑 API Key:', '94ace59f-fec6-4df2-9711-ceeae2cd10f3');
    console.log('📋 Headers:', form.getHeaders());
    
    const response = await fetch('https://api.cloudmersive.com/ocr/pdf/toText', {
      method: 'POST',
      headers: {
        'Apikey': '94ace59f-fec6-4df2-9711-ceeae2cd10f3',
        ...form.getHeaders()
      },
      body: form
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Success! Extracted text:', result.TextResult);
    
    // Clean up
    fs.unlinkSync(tempFilePath);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCloudmersiveDirectly();
