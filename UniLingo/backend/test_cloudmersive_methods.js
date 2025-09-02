const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test different HTTP methods and parameter structures
async function testCloudmersiveMethods() {
  try {
    console.log('🧪 Testing different HTTP methods and structures...');
    
    // Create a simple test PDF content
    const testPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    
    // Write to temporary file
    const tempFilePath = path.join(__dirname, 'test.pdf');
    fs.writeFileSync(tempFilePath, testPdfContent);
    
    const apiKey = '94ace59f-fec6-4df2-9711-ceeae2cd10f3';
    const endpoint = 'https://api.cloudmersive.com/ocr/pdf/toText';
    
    // Test 1: GET request
    console.log('\n🔍 Test 1: GET request');
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Apikey': apiKey
        }
      });
      console.log(`📥 Response status: ${response.status}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
    
    // Test 2: POST with different parameter name
    console.log('\n🔍 Test 2: POST with "file" parameter');
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(tempFilePath), {
        filename: 'test.pdf',
        contentType: 'application/pdf'
      });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Apikey': apiKey,
          ...form.getHeaders()
        },
        body: form
      });
      
      console.log(`📥 Response status: ${response.status}`);
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ SUCCESS! Extracted text: ${result.TextResult || result.text || 'No text field found'}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
    
    // Test 3: POST with "document" parameter
    console.log('\n🔍 Test 3: POST with "document" parameter');
    try {
      const form = new FormData();
      form.append('document', fs.createReadStream(tempFilePath), {
        filename: 'test.pdf',
        contentType: 'application/pdf'
      });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Apikey': apiKey,
          ...form.getHeaders()
        },
        body: form
      });
      
      console.log(`📥 Response status: ${response.status}`);
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ SUCCESS! Extracted text: ${result.TextResult || result.text || 'No text field found'}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
    
    // Clean up
    fs.unlinkSync(tempFilePath);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCloudmersiveMethods();
