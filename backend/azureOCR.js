/**
 * Azure Computer Vision OCR Service
 * Fast, reliable handwriting and text recognition
 */

const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');
const fs = require('fs');

/**
 * Process an image with Azure Computer Vision OCR
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<{success: boolean, text: string, error?: string}>}
 */
async function processImageWithAzureOCR(imagePath) {
  try {
    console.log(`  [Azure OCR] Starting OCR for: ${imagePath}`);
    
    // Check for Azure credentials
    const endpoint = process.env.AZURE_VISION_ENDPOINT;
    const apiKey = process.env.AZURE_VISION_KEY;
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure Computer Vision credentials not configured. Set AZURE_VISION_ENDPOINT and AZURE_VISION_KEY environment variables.');
    }
    
    // Create Azure client
    const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': apiKey } });
    const client = new ComputerVisionClient(credentials, endpoint);
    
    console.log(`  [Azure OCR] Client initialized`);
    
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    console.log(`  [Azure OCR] Sending image to Azure (${(imageBuffer.length / 1024).toFixed(2)} KB)...`);
    const startTime = Date.now();
    
    // Use Read API for handwriting and printed text
    const result = await client.readInStream(imageBuffer);
    
    // Get the operation location (URL with operation ID)
    const operationId = result.operationLocation.split('/').slice(-1)[0];
    
    // Wait for the operation to complete
    let readResult;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    console.log(`  [Azure OCR] Waiting for results (Operation ID: ${operationId})...`);
    
    while (attempts < maxAttempts) {
      readResult = await client.getReadResult(operationId);
      
      if (readResult.status === 'succeeded') {
        break;
      }
      
      if (readResult.status === 'failed') {
        throw new Error('Azure OCR failed to process the image');
      }
      
      // Use exponential backoff to reduce API calls
      // First check: 500ms, then 1s, 1.5s, 2s, etc.
      const delay = Math.min(500 + (attempts * 500), 2000);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
      
      if (attempts % 3 === 0) {
        console.log(`  [Azure OCR] Still waiting... ${attempts} attempts`);
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Azure OCR timed out waiting for results');
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`  [Azure OCR] Processing completed in ${(processingTime / 1000).toFixed(2)}s`);
    
    // Extract text from results
    let extractedText = '';
    let lineCount = 0;
    
    if (readResult.analyzeResult && readResult.analyzeResult.readResults) {
      for (const page of readResult.analyzeResult.readResults) {
        for (const line of page.lines) {
          extractedText += line.text + '\n';
          lineCount++;
        }
      }
    }
    
    console.log(`  [Azure OCR] Extracted ${lineCount} lines of text (${extractedText.length} characters)`);
    
    if (extractedText.trim().length === 0) {
      console.log(`  [Azure OCR] Warning: No text found in image`);
      return {
        success: true,
        text: '',
        warning: 'No text detected in image'
      };
    }
    
    return {
      success: true,
      text: extractedText.trim(),
      lineCount: lineCount,
      processingTime: processingTime
    };
    
  } catch (error) {
    console.error(`  [Azure OCR] Error:`, error.message);
    
    return {
      success: false,
      text: '',
      error: error.message
    };
  }
}

module.exports = {
  processImageWithAzureOCR
};
