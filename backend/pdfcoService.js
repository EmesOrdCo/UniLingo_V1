const axios = require('axios');
const fs = require('fs');
const path = require('path');
const NetworkLogger = require('./networkLogger');

class PDFcoService {
  constructor() {
    this.apiKey = process.env.PDFCO_API_KEY;
    this.baseUrl = 'https://api.pdf.co/v1';
    this.logger = new NetworkLogger();
    
    if (!this.apiKey) {
      throw new Error('PDFCO_API_KEY environment variable is required');
    }
  }

  /**
   * Get a presigned URL for file upload
   */
  async getPresignedUrl(filename, contentType = 'application/octet-stream') {
    const startTime = Date.now();
    const target = `${this.baseUrl}/file/upload/get-presigned-url`;
    
    try {
      const response = await axios.get(target, {
        params: {
          contenttype: contentType,
          name: filename
        },
        headers: {
          'x-api-key': this.apiKey
        },
        timeout: 30000, // 30 second timeout
        validateStatus: null // Don't throw on HTTP error status
      });

      const responseTime = Date.now() - startTime;
      
      if (response.data.error) {
        this.logger.logError(
          'HTTP_ERROR',
          'response_receive',
          `PDF.co API error: ${response.data.message}`,
          target,
          new Error(response.data.message),
          { 
            status_code: response.status,
            api_error: response.data.message,
            response_time_ms: responseTime
          }
        );
        throw new Error(`PDF.co API error: ${response.data.message}`);
      }

      this.logger.logSuccess(
        'response_receive',
        target,
        responseTime,
        { 
          status_code: response.status,
          filename,
          content_type: contentType
        }
      );

      return {
        uploadUrl: response.data.presignedUrl,
        fileUrl: response.data.url
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED') {
        this.logger.logTimeout(
          'REQUEST_TIMEOUT',
          'request_send',
          target,
          30000,
          { 
            filename,
            response_time_ms: responseTime,
            operation: 'get_presigned_url'
          }
        );
      } else if (error.code === 'ENOTFOUND') {
        this.logger.logDnsError(
          new URL(target).hostname,
          error,
          { 
            filename,
            response_time_ms: responseTime,
            operation: 'get_presigned_url'
          }
        );
      } else if (error.code === 'ECONNREFUSED') {
        this.logger.logConnectionRefused(
          target,
          { 
            filename,
            response_time_ms: responseTime,
            operation: 'get_presigned_url'
          }
        );
      } else {
        this.logger.logGenericNetworkError(
          'request_send',
          target,
          error,
          { 
            filename,
            response_time_ms: responseTime,
            operation: 'get_presigned_url'
          }
        );
      }
      
      throw new Error(`Failed to get upload URL: ${error.message}`);
    }
  }

  /**
   * Upload file to PDF.co using presigned URL
   */
  async uploadFile(uploadUrl, filePath) {
    const startTime = Date.now();
    const target = uploadUrl;
    
    try {
      const fileBuffer = fs.readFileSync(filePath);
      
      await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        timeout: 60000, // 60 second timeout for file uploads
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const responseTime = Date.now() - startTime;
      this.logger.logSuccess(
        'request_send',
        target,
        responseTime,
        { 
          file_size_bytes: fileBuffer.length,
          file_path: filePath,
          operation: 'file_upload'
        }
      );
      
      console.log('✅ File uploaded successfully to PDF.co');
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED') {
        this.logger.logTimeout(
          'REQUEST_TIMEOUT',
          'request_send',
          target,
          60000,
          { 
            file_path: filePath,
            response_time_ms: responseTime,
            operation: 'file_upload'
          }
        );
      } else if (error.code === 'ENOTFOUND') {
        this.logger.logDnsError(
          new URL(target).hostname,
          error,
          { 
            file_path: filePath,
            response_time_ms: responseTime,
            operation: 'file_upload'
          }
        );
      } else if (error.code === 'ECONNREFUSED') {
        this.logger.logConnectionRefused(
          target,
          { 
            file_path: filePath,
            response_time_ms: responseTime,
            operation: 'file_upload'
          }
        );
      } else {
        this.logger.logGenericNetworkError(
          'request_send',
          target,
          error,
          { 
            file_path: filePath,
            response_time_ms: responseTime,
            operation: 'file_upload'
          }
        );
      }
      
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Convert PDF to text using PDF.co API
   */
  async convertPdfToText(fileUrl, options = {}) {
    const startTime = Date.now();
    const target = `${this.baseUrl}/pdf/convert/to/text`;
    
    try {
      const payload = {
        url: fileUrl,
        inline: true, // Return text in response
        async: false, // Synchronous processing
        ...options
      };

      console.log('🔄 Converting PDF to text...');
      
      const response = await axios.post(target, payload, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 120000, // 2 minute timeout for PDF conversion
        validateStatus: null // Don't throw on HTTP error status
      });

      const responseTime = Date.now() - startTime;
      
      if (response.data.error) {
        this.logger.logError(
          'HTTP_ERROR',
          'response_receive',
          `PDF.co conversion error: ${response.data.message}`,
          target,
          new Error(response.data.message),
          { 
            status_code: response.status,
            api_error: response.data.message,
            response_time_ms: responseTime,
            file_url: fileUrl
          }
        );
        throw new Error(`PDF.co conversion error: ${response.data.message}`);
      }

      this.logger.logSuccess(
        'response_receive',
        target,
        responseTime,
        { 
          status_code: response.status,
          file_url: fileUrl,
          page_count: response.data.pageCount,
          credits_used: response.data.credits,
          operation: 'pdf_conversion'
        }
      );

      console.log('✅ PDF converted successfully');
      
      return {
        text: response.data.body,
        pageCount: response.data.pageCount,
        credits: response.data.credits,
        remainingCredits: response.data.remainingCredits
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED') {
        this.logger.logTimeout(
          'RESPONSE_TIMEOUT',
          'response_wait',
          target,
          120000,
          { 
            file_url: fileUrl,
            response_time_ms: responseTime,
            operation: 'pdf_conversion'
          }
        );
      } else if (error.code === 'ENOTFOUND') {
        this.logger.logDnsError(
          new URL(target).hostname,
          error,
          { 
            file_url: fileUrl,
            response_time_ms: responseTime,
            operation: 'pdf_conversion'
          }
        );
      } else if (error.code === 'ECONNREFUSED') {
        this.logger.logConnectionRefused(
          target,
          { 
            file_url: fileUrl,
            response_time_ms: responseTime,
            operation: 'pdf_conversion'
          }
        );
      } else {
        this.logger.logGenericNetworkError(
          'response_wait',
          target,
          error,
          { 
            file_url: fileUrl,
            response_time_ms: responseTime,
            operation: 'pdf_conversion'
          }
        );
      }
      
      throw new Error(`Failed to convert PDF: ${error.message}`);
    }
  }

  /**
   * Complete workflow: Upload PDF and convert to text
   */
  async processPdf(filePath) {
    try {
      const filename = path.basename(filePath);
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 STARTING PDF PROCESSING: ${filename}`);
      console.log('='.repeat(60));

      // Step 1: Get presigned URL
      console.log('\n📤 STEP 1: Getting presigned upload URL...');
      const { uploadUrl, fileUrl } = await this.getPresignedUrl(filename);
      console.log('✅ Presigned URL obtained successfully');

      // Step 2: Upload file
      console.log('\n📤 STEP 2: Uploading file to PDF.co...');
      await this.uploadFile(uploadUrl, filePath);
      console.log('✅ File uploaded successfully');

      // Step 3: Convert to text
      console.log('\n🔄 STEP 3: Converting PDF to text...');
      const result = await this.convertPdfToText(fileUrl);
      console.log('✅ PDF converted to text successfully');

      // Display results
      console.log('\n' + '='.repeat(60));
      console.log('📊 PROCESSING RESULTS:');
      console.log('='.repeat(60));
      console.log(`📄 File: ${filename}`);
      console.log(`📊 Pages: ${result.pageCount}`);
      console.log(`🔢 Characters: ${result.text.length.toLocaleString()}`);
      console.log(`💳 Credits used: ${result.credits}`);
      console.log(`💳 Credits remaining: ${result.remainingCredits}`);
      console.log('\n📝 EXTRACTED TEXT PREVIEW:');
      console.log('-'.repeat(40));
      console.log(result.text.substring(0, 500) + (result.text.length > 500 ? '...' : ''));
      console.log('-'.repeat(40));
      console.log('='.repeat(60));
      console.log('✅ PDF PROCESSING COMPLETE!');
      console.log('='.repeat(60) + '\n');
      
      return result;
    } catch (error) {
      console.error('\n' + '❌'.repeat(20));
      console.error('❌ PDF PROCESSING FAILED:', error.message);
      console.error('❌'.repeat(20) + '\n');
      throw error;
    }
  }
}

module.exports = PDFcoService;
