import * as ImagePicker from 'expo-image-picker';
import { getBackendUrl, BACKEND_CONFIG } from '../config/backendConfig';

export interface ImageUploadProgress {
  stage: 'selecting' | 'uploading' | 'processing' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
  imagesProcessed?: number;
  totalImages?: number;
}

export interface ImageProcessingResult {
  text: string;
  pages: string[];
  pageCount: number;
  imagesProcessed: number;
  totalImages: number;
  filenames: string[];
}

export class ImageUploadService {
  // Track if a picker is currently active
  private static isPickerActive = false;
  private static pickerRetryCount = 0;
  private static readonly MAX_RETRIES = 3;
  
  // Force reset function for stuck pickers
  static forceResetPicker() {
    this.isPickerActive = false;
    this.pickerRetryCount = 0;
  }
  
  static async pickImages(): Promise<ImagePicker.ImagePickerAsset[]> {
    try {
      // Check if we've exceeded retry attempts
      if (this.pickerRetryCount >= this.MAX_RETRIES) {
        this.forceResetPicker();
      }
      
      // Check if another picker is already active
      if (this.isPickerActive) {
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (this.isPickerActive) {
          this.forceResetPicker();
        }
      }
      
      this.isPickerActive = true;
      this.pickerRetryCount++;
      
      try {
        // Request camera permissions
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (!cameraPermission.granted || !mediaLibraryPermission.granted) {
          throw new Error('Camera and photo library permissions are required to take photos of your notes');
        }

        // Show action sheet for image selection
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsMultipleSelection: true,
          quality: 0.8, // Good balance between quality and file size
          exif: false, // Don't include EXIF data to reduce file size
          base64: false, // We'll send files directly
        });

        if (result.canceled) {
          throw new Error('Image selection was cancelled');
        }

        if (!result.assets || result.assets.length === 0) {
          throw new Error('No images selected');
        }

        // Validate selected images
        const validImages = result.assets.filter(asset => {
          if (!asset.uri) {
            console.warn('Image asset missing URI');
            return false;
          }
          if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
            console.warn(`Image ${asset.fileName} is too large: ${(asset.fileSize / 1024 / 1024).toFixed(2)}MB`);
            return false;
          }
          return true;
        });

        if (validImages.length === 0) {
          throw new Error('No valid images selected. Please ensure images are under 10MB each.');
        }

        if (validImages.length > 5) {
          throw new Error('Maximum 5 images allowed. Please select fewer images.');
        }

        // Reset retry count on success
        this.pickerRetryCount = 0;
        return validImages;
        
      } finally {
        // Always reset the picker state
        this.isPickerActive = false;
      }
      
    } catch (error) {
      // Don't log cancellation errors - they're normal user actions
      
      if (error instanceof Error) {
        if (error.message.includes('permissions')) {
          throw new Error('Camera and photo library permissions are required. Please enable them in your device settings.');
        } else if (error.message.includes('cancelled') || error.message.includes('Image selection was cancelled')) {
          // Don't log cancellation as an error - it's a normal user action
          throw error; // Re-throw cancellation errors
        } else if (error.message.includes('No valid images')) {
          throw error; // Re-throw validation errors
        }
      }
      
      throw new Error('Failed to select images. Please try again.');
    }
  }

  static async processImages(
    images: ImagePicker.ImagePickerAsset[],
    onProgress?: (progress: ImageUploadProgress) => void
  ): Promise<ImageProcessingResult> {
    try {
      onProgress?.({
        stage: 'uploading',
        progress: 10,
        message: `Uploading ${images.length} image${images.length > 1 ? 's' : ''}...`,
        totalImages: images.length
      });

      // Test backend connectivity first
      try {
        const healthResponse = await fetch(getBackendUrl(BACKEND_CONFIG.ENDPOINTS.HEALTH), {
          method: 'GET',
        });
        
        if (!healthResponse.ok) {
          throw new Error('Backend server is not available');
        }
      } catch (healthError) {
        throw new Error('Backend server is not running or not accessible. Please make sure the backend server is started.');
      }

      onProgress?.({
        stage: 'uploading',
        progress: 30,
        message: 'Backend connection verified, uploading images...',
        totalImages: images.length
      });

      // Prepare FormData for image upload
      const formData = new FormData();
      
      images.forEach((image, index) => {
        const filename = image.fileName || `image_${index + 1}.jpg`;
        const fileExtension = filename.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
        
        // React Native FormData format for file uploads
        formData.append('images', {
          uri: image.uri,
          type: mimeType,
          name: filename,
        } as any);
      });
      
      console.log('📤 DEBUG: Sending FormData with', images.length, 'images to backend');

      onProgress?.({
        stage: 'processing',
        progress: 50,
        message: 'Images uploaded, starting OCR processing...',
        totalImages: images.length
      });

      // Send images to backend for OCR processing
      const response = await fetch(getBackendUrl('/api/process-image'), {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Backend request failed with status ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Image processing failed');
      }

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Successfully processed ${result.result.imagesProcessed}/${result.result.totalImages} images!`,
        imagesProcessed: result.result.imagesProcessed,
        totalImages: result.result.totalImages
      });

      return {
        text: result.result.text,
        pages: result.result.pages,
        pageCount: result.result.pageCount,
        imagesProcessed: result.result.imagesProcessed,
        totalImages: result.result.totalImages,
        filenames: result.filenames
      };

    } catch (error) {
      console.error('Error processing images:', error);
      
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to process images',
      });
      
      throw error;
    }
  }

  static async takePhoto(): Promise<ImagePicker.ImagePickerAsset[]> {
    try {
      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!cameraPermission.granted) {
        throw new Error('Camera permission is required to take photos of your notes');
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false, // Don't force aspect ratio for note photos
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (result.canceled) {
        throw new Error('Photo capture was cancelled');
      }

      if (!result.assets || result.assets.length === 0) {
        throw new Error('No photo was captured');
      }

      return result.assets;
      
    } catch (error) {
      // Don't log cancellation errors - they're normal user actions
      
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          throw new Error('Camera permission is required. Please enable it in your device settings.');
        } else if (error.message.includes('cancelled') || error.message.includes('Photo capture was cancelled')) {
          // Don't log cancellation as an error - it's a normal user action
          throw error; // Re-throw cancellation errors
        }
      }
      
      throw new Error('Failed to take photo. Please try again.');
    }
  }
}
