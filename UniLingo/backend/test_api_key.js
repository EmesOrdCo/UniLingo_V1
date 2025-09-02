const fs = require('fs');
const path = require('path');

// Test API key validity with a simple endpoint
async function testApiKeyValidity() {
  try {
    console.log('🧪 Testing API key validity...');
    
    const apiKey = '94ace59f-fec6-4df2-9711-ceeae2cd10f3';
    
    // Try a simple health check or info endpoint
    const testEndpoints = [
      'https://api.cloudmersive.com/ocr/health',
      'https://api.cloudmersive.com/health',
      'https://api.cloudmersive.com/',
      'https://api.cloudmersive.com/v1/health'
    ];
    
    for (const endpoint of testEndpoints) {
      console.log(`\n🔍 Testing endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Apikey': apiKey
          }
        });
        
        console.log(`📥 Response status: ${response.status}`);
        
        if (response.ok) {
          const result = await response.text();
          console.log(`✅ SUCCESS! Response: ${result.substring(0, 200)}...`);
          break;
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${errorText.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`❌ Exception: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testApiKeyValidity();
