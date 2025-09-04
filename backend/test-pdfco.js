require('dotenv').config();
const PDFcoService = require('./pdfcoService');

async function testPDFco() {
  try {
    console.log('🧪 Testing PDF.co API integration...');
    
    // Check if API key is set
    if (!process.env.PDFCO_API_KEY || process.env.PDFCO_API_KEY === 'your_pdfco_api_key_here') {
      console.log('❌ Please set your PDFCO_API_KEY in the .env file');
      console.log('   You can get your API key from: https://app.pdf.co');
      return;
    }
    
    console.log('✅ API key found');
    
    // Test the service initialization
    const pdfService = new PDFcoService();
    console.log('✅ PDF.co service initialized');
    
    // Test getting presigned URL (this should work without uploading)
    console.log('📤 Testing presigned URL generation...');
    const { uploadUrl, fileUrl } = await pdfService.getPresignedUrl('test.pdf');
    console.log('✅ Presigned URL generated successfully');
    console.log(`   Upload URL: ${uploadUrl.substring(0, 50)}...`);
    console.log(`   File URL: ${fileUrl.substring(0, 50)}...`);
    
    console.log('\n🎉 PDF.co API integration test passed!');
    console.log('   Your API key is valid and the service is working.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('PDFCO_API_KEY')) {
      console.log('\n💡 To fix this:');
      console.log('   1. Get your API key from: https://app.pdf.co');
      console.log('   2. Add it to backend/.env as: PDFCO_API_KEY=your_actual_key');
    }
  }
}

testPDFco();
